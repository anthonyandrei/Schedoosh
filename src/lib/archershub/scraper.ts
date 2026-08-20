import { Course } from "../definitions";
import sampleCourseResponse from "./fixtures/sample-course-response.json";
import {
  buildCourseObject,
  parseArchersHubHtml,
  parseArchersHubJson,
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

  // If provided as a raw session token or connect.sid / JSESSIONID / token value
  return `session=${trimmed}; ArchersHubAuth=${trimmed}; token=${trimmed}; .AspNetCore.Cookies=${trimmed}; ASP.NET_SessionId=${trimmed}`;
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

  if (analysis.isUnauthenticatedOnly) {
    throw new ArchersHubAuthError(
      analysis.warningMessage ||
        "The pasted cookies appear to be from the login page rather than an active logged-in ArchersHub session. Please log in to ArchersHub first, navigate to Course Finder or Enlistment, and copy the Cookie header from the DevTools Network Tab."
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

      // Search via ArchersHub JSON API or HTML endpoint
      const searchUrl = `${ARCHERSHUB_ENDPOINTS.COURSE_OFFERINGS}?course=${encodeURIComponent(
        normalizedCode
      )}&q=${encodeURIComponent(normalizedCode)}`;

      const response = await fetch(searchUrl, {
        method: "GET",
        headers: {
          ...DEFAULT_HEADERS,
          Cookie: cookieHeader,
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      // Handle Authentication Failures (401)
      if (response.status === 401) {
        throw new ArchersHubAuthError(
          "ArchersHub session token is invalid or expired. Please re-authenticate or try Demo Mode."
        );
      }

      // Handle 403 Forbidden (Cloudflare Bot Challenge vs Auth Forbidden)
      if (response.status === 403) {
        const text = await response.text().catch(() => "");
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

      // Handle Rate Limiting (429)
      if (response.status === 429) {
        if (attempt < maxRetries) {
          const backoff = 2 ** attempt * 1000;
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }
        throw new ArchersHubRateLimitError();
      }

      // Check for redirects to login
      if (
        response.redirected &&
        (response.url.includes("/Login") ||
          response.url.includes("/StudentLogin") ||
          response.url.includes("/Account/Login"))
      ) {
        throw new ArchersHubAuthError(
          "ArchersHub session is invalid or expired. Please re-authenticate or try Demo Mode."
        );
      }

      // Check for redirects to general server error
      if (response.redirected && response.url.includes("/Error")) {
        throw new ArchersHubError(
          `ArchersHub server returned an error while querying "${normalizedCode}". Please verify the course code or try Demo Mode.`
        );
      }

      if (!response.ok) {
        throw new ArchersHubError(
          `ArchersHub returned status ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      const contentType = response.headers.get("content-type") || "";
      let classes: ReturnType<typeof parseArchersHubJson> = [];

      if (contentType.includes("application/json")) {
        const json = await response.json();
        classes = parseArchersHubJson(json, normalizedCode);
      } else {
        const html = await response.text();

        // Check if the HTML returned is Cloudflare Turnstile / challenge
        if (
          html.includes("challenges.cloudflare.com") ||
          html.includes("cf-turnstile") ||
          html.includes("cf-browser-verification") ||
          html.includes("<title>Just a moment...</title>")
        ) {
          throw new ArchersHubCloudflareError();
        }

        // Check if the HTML returned is a login page
        const isAuthPage =
          html.includes("<title>Login</title>") ||
          html.includes("student-login") ||
          html.includes("Login.css");

        if (isAuthPage) {
          throw new ArchersHubAuthError(
            "ArchersHub session is invalid or expired. Please re-authenticate or try Demo Mode."
          );
        }

        // Check if the HTML is an ASP.NET error page
        const isErrorPage =
          html.includes("/Error/Index") ||
          html.includes("Object moved to") ||
          html.includes("Server Error in");

        if (isErrorPage) {
          throw new ArchersHubError(
            `ArchersHub server returned an error while querying "${normalizedCode}". Please verify the course code or try Demo Mode.`
          );
        }

        classes = parseArchersHubHtml(html, normalizedCode);
      }

      // Filter classes strictly for this course code if multiple returned
      const matchedClasses = classes.filter(
        (c) => c.course.toUpperCase() === normalizedCode
      );

      const finalClasses = matchedClasses.length > 0 ? matchedClasses : classes;

      if (finalClasses.length === 0) {
        throw new ArchersHubCourseNotFoundError(normalizedCode);
      }

      const course = buildCourseObject(normalizedCode, finalClasses, false);

      // Cache the result
      courseCache.set(cacheKey, { course, timestamp: Date.now() });

      return {
        course,
        isCached: false,
        rawCount: finalClasses.length,
      };
    } catch (err) {
      lastError = err as Error;

      // Don't retry on auth error, cloudflare block, or not found
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

      // Exponential backoff before retry
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
