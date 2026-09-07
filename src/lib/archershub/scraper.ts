import { Class, Course, Schedule } from "../definitions";
import { deriveModality } from "../utils";
import sampleCourseResponse from "./fixtures/sample-course-response.json";
import {
  buildCourseObject,
  mergeSchedules,
  parseArchersHubJson,
  parseDays,
  timeStringToMilitary,
} from "./parsers";
import {
  ARCHERSHUB_ENDPOINTS,
  ArchersHubAuthError,
  ArchersHubCloudflareError,
  ArchersHubCourseNotFoundError,
  ArchersHubError,
  ArchersHubRateLimitError,
  ArchersHubScrapeResult,
  ArchersHubScraperOptions,
  DEFAULT_HEADERS,
  RawArchersHubAcademicSession,
  RawArchersHubCampus,
  RawArchersHubCFData,
  RawArchersHubCourseListItem,
} from "./types";
import { analyzeSessionCookie } from "./validation";

// In-memory cache for course queries (5 minute TTL)
interface CacheEntry {
  course: Course;
  timestamp: number;
}

const courseCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Normalizes user session input into a proper Cookie header string
 */
export function formatSessionCookie(sessionCookie: string): string {
  const trimmed = sessionCookie.trim();
  if (!trimmed) return "";

  // If already formatted like a Cookie header ("name=value; ...")
  if (trimmed.includes("=")) {
    return trimmed;
  }

  // Best-effort: return as-is
  return trimmed;
}

/**
 * Returns realistic mock course data for testing or demo mode
 */
export function getMockCourse(courseCode: string): Course {
  const upper = courseCode.trim().toUpperCase();

  // Check if course exists in sample fixture
  const fixtureSections = sampleCourseResponse.offerings.filter(
    (o) => o.course_code.toUpperCase() === upper
  );

  if (fixtureSections.length > 0) {
    const classes = parseArchersHubJson(fixtureSections, upper);
    return buildCourseObject(upper, classes, false);
  }

  // Generate dynamic realistic mock offerings for any valid course code
  const mockClasses = [
    {
      code: Math.floor(1000 + Math.random() * 8000),
      course: upper,
      section: "S11",
      professor: "DELA CRUZ, JUAN",
      schedules: [
        {
          day: "M" as const,
          start: 900,
          end: 1030,
          date: "Jan 6 - Apr 12, 2025",
          isOnline: false,
          room: "LS210",
        },
        {
          day: "W" as const,
          start: 900,
          end: 1030,
          date: "Jan 6 - Apr 12, 2025",
          isOnline: false,
          room: "LS210",
        },
      ],
      enrolled: 35,
      enrollCap: 40,
      restriction: "Open to all",
      modality: "F2F" as const,
      remarks: "Lecture",
      rooms: ["LS210", "LS210"],
    },
    {
      code: Math.floor(1000 + Math.random() * 8000),
      course: upper,
      section: "S12",
      professor: "SANTOS, MARIA",
      schedules: [
        {
          day: "T" as const,
          start: 1300,
          end: 1430,
          date: "Jan 6 - Apr 12, 2025",
          isOnline: false,
          room: "GK301",
        },
        {
          day: "F" as const,
          start: 1300,
          end: 1430,
          date: "Jan 6 - Apr 12, 2025",
          isOnline: false,
          room: "GK301",
        },
      ],
      enrolled: 38,
      enrollCap: 40,
      restriction: "Open to all",
      modality: "F2F" as const,
      remarks: "Lecture",
      rooms: ["GK301", "GK301"],
    },
    {
      code: Math.floor(1000 + Math.random() * 8000),
      course: upper,
      section: "Z01",
      professor: "REYES, JOSE",
      schedules: [
        {
          day: "H" as const,
          start: 1415,
          end: 1545,
          date: "Jan 6 - Apr 12, 2025",
          isOnline: true,
          room: "CANVAS-ONLINE",
        },
      ],
      enrolled: 40,
      enrollCap: 40,
      restriction: "Full online",
      modality: "ONLINE" as const,
      remarks: "Online asynchronous with weekly sync",
      rooms: ["CANVAS-ONLINE"],
    },
  ];

  return buildCourseObject(upper, mockClasses, false);
}

/**
 * Scrapes a single course offering from ArchersHub
 */
export async function scrapeCourseFromArchersHub(
  courseCode: string,
  sessionCookie: string,
  options: ArchersHubScraperOptions = {}
): Promise<ArchersHubScrapeResult> {
  const normalizedCode = courseCode.trim().toUpperCase();

  if (!normalizedCode) {
    throw new ArchersHubError("Course code cannot be empty");
  }

  // Mock / Demo mode fallback
  const isMock =
    options.mock ||
    sessionCookie === "MOCK_SESSION" ||
    sessionCookie === "DEMO" ||
    process.env.ARCHERSHUB_MOCK_MODE === "true";

  const cacheKey = `${isMock ? "mock" : "live"}:${normalizedCode}`;

  // Check cache unless bypassCache is requested
  if (!options.bypassCache) {
    const cached = courseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return {
        course: cached.course,
        isCached: true,
      };
    }
  }

  if (isMock) {
    const course = getMockCourse(normalizedCode);
    courseCache.set(cacheKey, { course, timestamp: Date.now() });
    return {
      course,
      isCached: false,
    };
  }

  if (!sessionCookie?.trim()) {
    throw new ArchersHubAuthError(
      "ArchersHub session token is required to scrape courses."
    );
  }

  const analysis = analyzeSessionCookie(sessionCookie);
  if (analysis.isAffinityOnly) {
    throw new ArchersHubAuthError(
      analysis.warningMessage ||
        "Only Azure Gateway routing cookies were detected. The HttpOnly authentication cookie is missing. Please copy your Cookie header from DevTools Network Tab."
    );
  }

  const cookieHeader = formatSessionCookie(sessionCookie);
  const timeoutMs = options.timeoutMs ?? 10000;
  const maxRetries = options.maxRetries ?? 2;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const fetchApi = async (url: string, body?: string) => {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            ...DEFAULT_HEADERS,
            Cookie: cookieHeader,
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
          signal: controller.signal,
        });

        if (res.status === 401) {
          throw new ArchersHubAuthError(
            "ArchersHub session token is invalid or expired. Please re-authenticate or try Demo Mode."
          );
        }
        if (res.status === 403) {
          const text = await res.text().catch(() => "");
          if (
            text.includes("challenges.cloudflare.com") ||
            text.includes("cf-turnstile") ||
            text.includes("Cloudflare") ||
            text.includes("Attention Required")
          ) {
            throw new ArchersHubCloudflareError();
          }
          throw new ArchersHubAuthError(
            "ArchersHub access forbidden (403). Your session may be expired or lack permissions."
          );
        }
        if (res.status === 429) {
          throw new ArchersHubRateLimitError();
        }
        if (
          res.redirected &&
          (res.url.includes("/Login") ||
            res.url.includes("/StudentLogin") ||
            res.url.includes("/Account/Login"))
        ) {
          throw new ArchersHubAuthError(
            "ArchersHub session is invalid or expired. Please re-authenticate or try Demo Mode."
          );
        }
        if (res.redirected && res.url.includes("/Error")) {
          throw new ArchersHubError(
            `ArchersHub server returned an error while querying "${normalizedCode}". Please verify the course code or try Demo Mode.`
          );
        }
        if (!res.ok) {
          throw new ArchersHubError(
            `ArchersHub returned status ${res.status}: ${res.statusText}`,
            res.status
          );
        }
        return res;
      };

      try {
        const ddRes = await fetchApi(ARCHERSHUB_ENDPOINTS.GET_ALL_DROPDOWNS);
        const ddJson = await ddRes.json();

        const campusList: RawArchersHubCampus[] = ddJson.CampusDrp || [];
        const sessionList: RawArchersHubAcademicSession[] =
          ddJson.SessionDrp || [];

        const studentCampus =
          campusList.find((c) => c.IS_STUDENT_CAMPUS === 1) || campusList[0];
        const currentSession =
          sessionList.find((s) => s.IS_CURRENT_SESSION === true) ||
          sessionList[0];

        if (!studentCampus || !currentSession) {
          throw new ArchersHubError(
            "Failed to resolve Campus or Academic Session from ArchersHub dropdown data."
          );
        }

        const campusNo = studentCampus.CAMPUSNO;
        const academicSessionId = currentSession.ACADEMIC_SESSION_ID;

        const clRes = await fetchApi(
          ARCHERSHUB_ENDPOINTS.GET_COURSE_LIST,
          `Campusno=${campusNo}&AcademicSession=${academicSessionId}`
        );
        const clJson = await clRes.json();
        const courseDrp: RawArchersHubCourseListItem[] = clJson.CourseDrp || [];

        const matchedCourses = courseDrp.filter((c) => {
          const nameParts = c.COURSE_NAME.split(" - ");
          return nameParts[0].trim().toUpperCase() === normalizedCode;
        });

        if (matchedCourses.length === 0) {
          throw new ArchersHubCourseNotFoundError(normalizedCode);
        }

        const cfDataResults = await Promise.all(
          matchedCourses.map(async (matchedCourse) => {
            const courseId = matchedCourse.COURSE_CREATION_ID;
            const firstDashIdx = matchedCourse.COURSE_NAME.indexOf(" - ");
            const variant =
              firstDashIdx !== -1
                ? matchedCourse.COURSE_NAME.substring(firstDashIdx + 3).trim()
                : "";

            const cfRes = await fetchApi(
              ARCHERSHUB_ENDPOINTS.GET_CF_DATA,
              `Campusno=${campusNo}&AcademicSession=${academicSessionId}&Courseid=${courseId}`
            );
            const cfData = await cfRes.json();
            const rows: RawArchersHubCFData[] = Array.isArray(cfData)
              ? cfData
              : [];
            return rows.map((row) => ({ row, variant }));
          })
        );

        const allRowsWithVariant = cfDataResults.flat();

        if (allRowsWithVariant.length === 0) {
          throw new ArchersHubCourseNotFoundError(normalizedCode);
        }

        const finalClasses: Class[] = allRowsWithVariant.map(
          ({ row, variant }) => {
            const schedParts = (row.SCHEDULE || "")
              .split("|")
              .map((s) => s.trim())
              .filter(Boolean);

            const rawSchedules: Schedule[] = schedParts.map((part) => {
              const inner = part.replace(/^\[/, "").replace(/\]$/, "").trim();
              // The separator between time info and room info is "  :" (padded colon),
              // NOT bare ":" which appears inside times like "07:30 AM".
              // Use lastIndexOf to find the room separator, not split.
              const lastSepIdx = inner.lastIndexOf("  :");
              let timeInfo: string;
              let roomInfo: string;
              if (lastSepIdx !== -1) {
                timeInfo = inner.substring(0, lastSepIdx).trim();
                roomInfo = inner.substring(lastSepIdx + 3).trim();
              } else {
                // Fallback: try single-space-padded " : "
                const fallbackIdx = inner.lastIndexOf(" : ");
                if (fallbackIdx !== -1) {
                  timeInfo = inner.substring(0, fallbackIdx).trim();
                  roomInfo = inner.substring(fallbackIdx + 3).trim();
                } else {
                  // No room separator at all — entire string is time info
                  timeInfo = inner;
                  roomInfo = "";
                }
              }

              const timeParts = timeInfo.split(" - ").map((s) => s.trim());
              const dayStr = timeParts[0];
              const startStr = timeParts[1] || "";
              const endStr = timeParts[2] || "";

              const days = parseDays(dayStr);
              const day = days[0] || "M";
              const start = timeStringToMilitary(startStr);
              const end = timeStringToMilitary(endStr);

              let room = "TBA";
              let isOnline = false;
              if (roomInfo) {
                if (roomInfo.toUpperCase() === "ONLINE") {
                  isOnline = true;
                  room = "Online";
                } else if (roomInfo.startsWith("Room - ")) {
                  room = roomInfo.substring(7).trim() || "TBA";
                } else {
                  room = roomInfo;
                }
              }

              return {
                day,
                start,
                end,
                date: "",
                isOnline,
                room,
              };
            });

            const schedules = mergeSchedules(rawSchedules);

            const modality = deriveModality(schedules);

            const mainProf = (row.MAIN_TEACHER || "").trim();
            const addlProf = (row.ADDITIONAL_TEACHER || "").trim();
            const professor = mainProf || addlProf || "";

            return {
              code: row.SECTION_CREATION_ID,
              course: normalizedCode,
              section: row.SECTION_NAME || "TBA",
              professor,
              schedules,
              enrolled: row.ENLISTED || 0,
              enrollCap: row.CAPACITY || 0,
              restriction: "",
              modality,
              remarks: row.SECTION_REMARK || "",
              rooms: schedules.map((s) => s.room),
              type: row.SUBJECT_TYPE,
              units: row.CREDITS,
              variant,
            };
          }
        );

        const course = buildCourseObject(normalizedCode, finalClasses, false);

        courseCache.set(cacheKey, { course, timestamp: Date.now() });

        return {
          course,
          isCached: false,
          rawCount: finalClasses.length,
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      lastError = err as Error;

      if (
        err instanceof ArchersHubAuthError ||
        err instanceof ArchersHubCloudflareError ||
        err instanceof ArchersHubCourseNotFoundError
      ) {
        throw err;
      }

      if (attempt === maxRetries) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
    }
  }

  throw (
    lastError ||
    new ArchersHubError(
      `Failed to fetch course "${normalizedCode}" from ArchersHub.`
    )
  );
}

/**
 * Scrapes multiple courses sequentially with delay to prevent rate limits
 */
export async function scrapeMultipleCoursesFromArchersHub(
  courseCodes: string[],
  sessionCookie: string,
  options: ArchersHubScraperOptions = {}
): Promise<{ courses: Course[] }> {
  const results: Course[] = [];

  for (const code of courseCodes) {
    try {
      const { course } = await scrapeCourseFromArchersHub(
        code,
        sessionCookie,
        options
      );
      results.push(course);

      // Gentle pause between requests to respect ArchersHub server
      if (!options.mock && sessionCookie !== "MOCK_SESSION") {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } catch (error) {
      if (
        error instanceof ArchersHubAuthError ||
        error instanceof ArchersHubCloudflareError
      ) {
        throw error;
      }
      // On individual course error, keep empty or skip so others still load
    }
  }

  return { courses: results };
}

/**
 * Clears the in-memory course cache
 */
export function clearCourseCache(): void {
  courseCache.clear();
}
