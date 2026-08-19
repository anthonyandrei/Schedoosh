import {
  Class,
  Course,
  classSchema,
  courseSchema,
  Schedule,
} from "../definitions";
import { ModalityEnum } from "../enums";
import {
  ArchersHubParseError,
  RawArchersHubMeeting,
  RawArchersHubSection,
} from "./types";

/**
 * Normalizes day strings into array of individual day tokens ('M' | 'T' | 'W' | 'H' | 'F' | 'S' | 'U')
 */
export function parseDays(
  rawDayStr?: string
): Array<"M" | "T" | "W" | "H" | "F" | "S" | "U"> {
  if (!rawDayStr || typeof rawDayStr !== "string") {
    return ["M"];
  }

  const str = rawDayStr.toUpperCase().trim();
  if (str === "" || str === "TBA" || str === "N/A" || str === "NONE") {
    return ["M"];
  }

  const days: Array<"M" | "T" | "W" | "H" | "F" | "S" | "U"> = [];

  // Replace multi-character day representations
  let cleaned = str
    .replace(/THURSDAY|THURS|THU/g, "H")
    .replace(/TH/g, "H")
    .replace(/MONDAY|MON/g, "M")
    .replace(/TUESDAY|TUE/g, "T")
    .replace(/WEDNESDAY|WED/g, "W")
    .replace(/FRIDAY|FRI/g, "F")
    .replace(/SATURDAY|SAT/g, "S")
    .replace(/SUNDAY|SUN/g, "U")
    .replace(/SU/g, "U");

  // Remove delimiters like dashes, commas, slashes, spaces
  cleaned = cleaned.replace(/[^MTWHFSU]/g, "");

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i] as "M" | "T" | "W" | "H" | "F" | "S" | "U";
    if (["M", "T", "W", "H", "F", "S", "U"].includes(char)) {
      if (!days.includes(char)) {
        days.push(char);
      }
    }
  }

  return days.length > 0 ? days : ["M"];
}

/**
 * Converts standard time representations to military integer (e.g. "9:00 AM" -> 900, "1:30 PM" -> 1330, "1415" -> 1415)
 */
export function timeStringToMilitary(timeStr?: string | number): number {
  if (timeStr === undefined || timeStr === null) return 0;
  if (typeof timeStr === "number") return timeStr;

  const raw = String(timeStr).trim().toUpperCase();
  if (raw === "" || raw === "TBA" || raw === "N/A") return 0;

  // Check if it's already an integer like "900" or "1430"
  if (/^\d{3,4}$/.test(raw)) {
    return parseInt(raw, 10);
  }

  // Handle formats like "9:00 AM", "09:00AM", "1:30 PM", "01:30PM", "13:30", "9:00"
  const match = raw.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3]?.toUpperCase();

    if (meridiem === "PM" && hours < 12) {
      hours += 12;
    } else if (meridiem === "AM" && hours === 12) {
      hours = 0;
    }

    return hours * 100 + minutes;
  }

  // Fallback to extracting digits
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 3) {
    return parseInt(digits.slice(0, 4), 10);
  }

  return 0;
}

/**
 * Parses time ranges like "0900 - 1030", "9:00 AM - 10:30 AM", "0900-1030", "1300-1430"
 */
export function parseTimeRange(
  rawTime?: string | number,
  rawStartTime?: string | number,
  rawEndTime?: string | number
): { start: number; end: number } {
  if (rawStartTime !== undefined && rawEndTime !== undefined) {
    const start = timeStringToMilitary(rawStartTime);
    const end = timeStringToMilitary(rawEndTime);
    if (start > 0 || end > 0) {
      return { start, end };
    }
  }

  if (!rawTime) {
    return { start: 0, end: 0 };
  }

  const str = String(rawTime).trim();
  if (str === "" || str.toUpperCase() === "TBA") {
    return { start: 0, end: 0 };
  }

  // Split by dash, en-dash, em-dash, or 'TO'
  const parts = str.split(/[-–—]|(?:\s+TO\s+)/i);
  if (parts.length >= 2) {
    const start = timeStringToMilitary(parts[0].trim());
    let end = timeStringToMilitary(parts[1].trim());

    // If start is e.g. 100 (1:00) and end is 230 (2:30), but context implies afternoon, or if start > end
    // (e.g. 1100 - 100 where 100 is 1:00 PM = 1300)
    if (end > 0 && end < start && end <= 1200) {
      end += 1200;
    }

    return { start, end };
  }

  const single = timeStringToMilitary(str);
  return { start: single, end: single };
}

/**
 * Normalizes modality strings into Schedoosh's ModalityEnum
 */
export function normalizeModality(rawModality?: string): ModalityEnum {
  if (!rawModality || typeof rawModality !== "string") {
    return "F2F";
  }

  const upper = rawModality.toUpperCase().trim();

  if (upper.includes("PREDOMINANTLY")) {
    return "PREDOMINANTLY ONLINE";
  }
  if (
    upper.includes("ONLINE") ||
    upper.includes("ASYNC") ||
    upper.includes("SYNC") ||
    upper === "OL"
  ) {
    return "ONLINE";
  }
  if (
    upper.includes("HYBRID") ||
    upper.includes("BLENDED") ||
    upper === "HYB"
  ) {
    return "HYBRID";
  }
  if (upper.includes("TENTATIVE")) {
    return "TENTATIVE";
  }

  return "F2F";
}

/**
 * Normalizes room strings
 */
export function normalizeRoom(rawRoom?: string): string {
  if (!rawRoom || typeof rawRoom !== "string") {
    return "TBA";
  }
  const trimmed = rawRoom.trim();
  return trimmed === "" ? "TBA" : trimmed;
}

/**
 * Determines whether a schedule slot is online
 */
export function isOnlineSchedule(
  room: string,
  modality: ModalityEnum,
  explicitOnline?: boolean
): boolean {
  if (explicitOnline !== undefined) return explicitOnline;
  if (modality === "ONLINE" || modality === "PREDOMINANTLY ONLINE") return true;

  const r = room.toUpperCase();
  return (
    r.includes("ONLINE") ||
    r.includes("ZOOM") ||
    r.includes("CANVAS") ||
    r.includes("ASYNC") ||
    r.includes("SYNCHRONOUS")
  );
}

/**
 * Parses raw meeting / schedule items into Schedoosh Schedule objects
 */
export function parseRawMeetings(
  meetings?: RawArchersHubMeeting[],
  fallback?: { day?: string; time?: string; room?: string },
  modality: ModalityEnum = "F2F"
): Schedule[] {
  const schedules: Schedule[] = [];

  const rawList =
    meetings && meetings.length > 0
      ? meetings
      : fallback && (fallback.day || fallback.time || fallback.room)
        ? [
            {
              day: fallback.day,
              time: fallback.time,
              room: fallback.room,
            },
          ]
        : [];

  if (rawList.length === 0) {
    return [
      {
        day: "M",
        start: 0,
        end: 0,
        date: "TBA",
        isOnline: modality === "ONLINE",
        room: "TBA",
      },
    ];
  }

  for (const item of rawList) {
    const rawDay = item.day || item.days || fallback?.day || "M";
    const days = parseDays(rawDay);
    const { start, end } = parseTimeRange(
      item.time || fallback?.time,
      item.start_time ?? item.startTime,
      item.end_time ?? item.endTime
    );
    const room = normalizeRoom(item.room || item.facility || fallback?.room);
    const date = (
      item.date_range ||
      item.dateRange ||
      item.dates ||
      "TBA"
    ).trim();
    const isOnline = isOnlineSchedule(
      room,
      modality,
      item.is_online ?? item.isOnline
    );

    for (const day of days) {
      schedules.push({
        day,
        start,
        end,
        date: date || "TBA",
        isOnline,
        room,
      });
    }
  }

  return schedules.length > 0
    ? schedules
    : [
        {
          day: "M",
          start: 0,
          end: 0,
          date: "TBA",
          isOnline: modality === "ONLINE",
          room: "TBA",
        },
      ];
}

/**
 * Normalizes an individual raw section into a Schedoosh Class object
 */
export function normalizeArchersHubSection(
  raw: RawArchersHubSection,
  defaultCourseCode = ""
): Class {
  const course = (
    raw.course_code ||
    raw.courseCode ||
    raw.course ||
    (raw.subject && raw.catalog_number
      ? `${raw.subject}${raw.catalog_number}`
      : "") ||
    defaultCourseCode
  )
    .toUpperCase()
    .trim();

  const section = (raw.section || raw.section_name || raw.sectionName || "TBA")
    .trim()
    .toUpperCase();

  const rawCode =
    raw.class_number ??
    raw.classNumber ??
    raw.class_code ??
    raw.classCode ??
    raw.code ??
    raw.call_number;
  let code = 0;
  if (typeof rawCode === "number" && !Number.isNaN(rawCode)) {
    code = rawCode;
  } else if (typeof rawCode === "string" && /^\d+$/.test(rawCode.trim())) {
    code = parseInt(rawCode.trim(), 10);
  } else {
    // Generate a deterministic pseudo-code from course + section if code is missing
    const str = `${course}-${section}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    code = Math.abs(hash % 9000) + 1000;
  }

  const professor = (
    raw.professor ||
    raw.faculty ||
    raw.instructor ||
    raw.instructor_name ||
    "TBA"
  ).trim();

  const enrolled = Math.max(
    0,
    parseInt(
      String(raw.enrolled ?? raw.enrl_tot ?? raw.enrolled_count ?? 0),
      10
    ) || 0
  );
  const enrollCap = Math.max(
    0,
    parseInt(
      String(
        raw.capacity ??
          raw.cap ??
          raw.enrl_cap ??
          raw.enroll_cap ??
          raw.max_enrolled ??
          0
      ),
      10
    ) || 0
  );

  const modality = normalizeModality(
    raw.modality || raw.instruction_mode || raw.delivery_mode
  );
  const remarks = (raw.remarks || raw.notes || raw.comments || "").trim();
  const restriction = (
    raw.restriction ||
    raw.restrictions ||
    raw.reserved ||
    ""
  ).trim();

  const rawMeetings = raw.schedules || raw.meetings || raw.time_slots;
  const schedules = parseRawMeetings(
    rawMeetings,
    { day: raw.day, time: raw.time, room: raw.room },
    modality
  );

  const parsedClass: Class = {
    code,
    course: course || defaultCourseCode,
    section: section || "TBA",
    professor: professor || "TBA",
    schedules,
    enrolled,
    enrollCap,
    restriction,
    modality,
    remarks,
    rooms: schedules.map((s) => s.room),
  };

  return classSchema.parse(parsedClass);
}

/**
 * Parses ArchersHub JSON API payload into Class[]
 */
export function parseArchersHubJson(
  rawJson: unknown,
  defaultCourseCode = ""
): Class[] {
  if (!rawJson) {
    throw new ArchersHubParseError(
      "Empty JSON payload received from ArchersHub"
    );
  }

  let items: unknown[] = [];

  if (Array.isArray(rawJson)) {
    // Could be array of classes or nested array
    if (rawJson.length > 0 && Array.isArray(rawJson[0])) {
      items = rawJson.flat();
    } else {
      items = rawJson;
    }
  } else if (typeof rawJson === "object") {
    const obj = rawJson as Record<string, unknown>;

    if (Array.isArray(obj.data)) {
      items = obj.data;
    } else if (Array.isArray(obj.offerings)) {
      items = obj.offerings;
    } else if (Array.isArray(obj.classes)) {
      items = obj.classes;
    } else if (Array.isArray(obj.courses)) {
      items = obj.courses;
    } else if (Array.isArray(obj.results)) {
      items = obj.results;
    } else if (Array.isArray(obj.sections)) {
      items = obj.sections;
    } else {
      // Single section object
      items = [obj];
    }
  }

  const parsedClasses: Class[] = [];

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    try {
      const parsed = normalizeArchersHubSection(
        item as RawArchersHubSection,
        defaultCourseCode
      );
      parsedClasses.push(parsed);
    } catch {
      // Continue parsing remaining items
    }
  }

  return parsedClasses;
}

/**
 * Strips HTML tags and decodes common HTML entities
 */
function cleanHtmlText(htmlSnippet?: string): string {
  if (!htmlSnippet) return "";
  return htmlSnippet
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parses ArchersHub HTML course offerings table into Class[]
 */
export function parseArchersHubHtml(
  html: string,
  defaultCourseCode = ""
): Class[] {
  if (!html || typeof html !== "string") {
    throw new ArchersHubParseError(
      "Invalid HTML string provided to parseArchersHubHtml"
    );
  }

  const classes: Class[] = [];

  // Extract table rows (tr elements)
  const rowMatches = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
  if (!rowMatches || rowMatches.length === 0) {
    return [];
  }

  // Look for header row to map column indices
  let colMap: Record<string, number> = {};
  let headerFound = false;

  for (const rowHtml of rowMatches) {
    const isHeader = /<th/i.test(rowHtml);
    const cellMatches = rowHtml.match(
      /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi
    );
    if (!cellMatches) continue;

    const cells = cellMatches.map((cell) => cleanHtmlText(cell));

    if (
      isHeader ||
      (!headerFound &&
        cells.some((c) => /course|class|section|subject/i.test(c)))
    ) {
      headerFound = true;
      colMap = {};
      cells.forEach((headerText, idx) => {
        const text = headerText.toUpperCase();
        if (/COURSE|SUBJECT/.test(text)) colMap.course = idx;
        else if (/SECTION/.test(text)) colMap.section = idx;
        else if (/CLASS\s*(?:NBR|NO|CODE|NUMBER)|CODE/.test(text))
          colMap.code = idx;
        else if (/DAY/.test(text)) colMap.day = idx;
        else if (/TIME/.test(text)) colMap.time = idx;
        else if (/ROOM|FACILITY|VENUE/.test(text)) colMap.room = idx;
        else if (/PROFESSOR|FACULTY|INSTRUCTOR/.test(text))
          colMap.professor = idx;
        else if (/ENROLLED|ENRL/.test(text)) colMap.enrolled = idx;
        else if (/CAP|CAPACITY|LIMIT|MAX/.test(text)) colMap.cap = idx;
        else if (/MODALITY|MODE|DELIVERY/.test(text)) colMap.modality = idx;
        else if (/REMARK|NOTE/.test(text)) colMap.remarks = idx;
        else if (/RESTRICTION|RESERVED/.test(text)) colMap.restriction = idx;
      });
      continue;
    }

    if (cells.length < 3) continue;

    // Extract values based on mapped column indices or positional fallback
    const courseVal =
      (colMap.course !== undefined ? cells[colMap.course] : cells[0]) ||
      defaultCourseCode;
    const sectionVal =
      colMap.section !== undefined ? cells[colMap.section] : cells[1] || "";
    const codeVal =
      colMap.code !== undefined ? cells[colMap.code] : cells[2] || "";
    const dayVal =
      colMap.day !== undefined ? cells[colMap.day] : cells[3] || "";
    const timeVal =
      colMap.time !== undefined ? cells[colMap.time] : cells[4] || "";
    const roomVal =
      colMap.room !== undefined ? cells[colMap.room] : cells[5] || "";
    const profVal =
      colMap.professor !== undefined ? cells[colMap.professor] : cells[6] || "";
    const enrolledVal =
      colMap.enrolled !== undefined ? cells[colMap.enrolled] : cells[7] || "0";
    const capVal =
      colMap.cap !== undefined ? cells[colMap.cap] : cells[8] || "0";
    const modalityVal =
      colMap.modality !== undefined
        ? cells[colMap.modality]
        : cells[9] || "F2F";
    const remarksVal =
      colMap.remarks !== undefined ? cells[colMap.remarks] : cells[10] || "";
    const restrictionVal =
      colMap.restriction !== undefined
        ? cells[colMap.restriction]
        : cells[11] || "";

    const rawSection: RawArchersHubSection = {
      course: courseVal || defaultCourseCode,
      section: sectionVal,
      class_number: codeVal,
      day: dayVal,
      time: timeVal,
      room: roomVal,
      professor: profVal,
      enrolled: enrolledVal,
      capacity: capVal,
      modality: modalityVal,
      remarks: remarksVal,
      restriction: restrictionVal,
    };

    try {
      const parsed = normalizeArchersHubSection(rawSection, defaultCourseCode);
      classes.push(parsed);
    } catch {
      // Ignore unparseable non-data rows
    }
  }

  return classes;
}

/**
 * Builds a validated Course object from course code and parsed classes
 */
export function buildCourseObject(
  courseCode: string,
  classes: Class[],
  isCustom = false
): Course {
  const course: Course = {
    courseCode: courseCode.trim().toUpperCase(),
    classes,
    lastFetched: new Date(),
    isCustom,
  };

  return courseSchema.parse(course);
}
