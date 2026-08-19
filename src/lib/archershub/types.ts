import { Course } from "../definitions";

// Custom Error Classes
export class ArchersHubError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = "ArchersHubError";
  }
}

export class ArchersHubAuthError extends ArchersHubError {
  constructor(
    message = "ArchersHub session token is invalid or expired. Please re-authenticate."
  ) {
    super(message, 401, "AUTH_EXPIRED");
    this.name = "ArchersHubAuthError";
  }
}

export class ArchersHubRateLimitError extends ArchersHubError {
  constructor(
    message = "ArchersHub rate limit exceeded. Please wait a moment before trying again."
  ) {
    super(message, 429, "RATE_LIMITED");
    this.name = "ArchersHubRateLimitError";
  }
}

export class ArchersHubParseError extends ArchersHubError {
  constructor(
    message = "Failed to parse course data from ArchersHub response.",
    public rawPayload?: unknown
  ) {
    super(message, 422, "PARSE_ERROR");
    this.name = "ArchersHubParseError";
  }
}

export class ArchersHubCourseNotFoundError extends ArchersHubError {
  constructor(public courseCode: string) {
    super(
      `Course "${courseCode}" was not found or has no scheduled offerings on ArchersHub.`,
      404,
      "COURSE_NOT_FOUND"
    );
    this.name = "ArchersHubCourseNotFoundError";
  }
}

// Raw meeting schedule structure from ArchersHub API
export interface RawArchersHubMeeting {
  day?: string;
  days?: string;
  start_time?: string | number;
  startTime?: string | number;
  end_time?: string | number;
  endTime?: string | number;
  time?: string;
  room?: string;
  facility?: string;
  date_range?: string;
  dateRange?: string;
  dates?: string;
  is_online?: boolean;
  isOnline?: boolean;
  type?: string; // LEC, LAB, etc.
}

// Raw Section structure from ArchersHub API
export interface RawArchersHubSection {
  course_code?: string;
  courseCode?: string;
  course?: string;
  subject?: string;
  catalog_number?: string;
  section?: string;
  section_name?: string;
  sectionName?: string;
  class_number?: number | string;
  classNumber?: number | string;
  class_code?: number | string;
  classCode?: number | string;
  code?: number | string;
  call_number?: number | string;
  professor?: string;
  faculty?: string;
  instructor?: string;
  instructor_name?: string;
  enrolled?: number | string;
  enrl_tot?: number | string;
  enrolled_count?: number | string;
  capacity?: number | string;
  cap?: number | string;
  enrl_cap?: number | string;
  enroll_cap?: number | string;
  max_enrolled?: number | string;
  modality?: string;
  instruction_mode?: string;
  delivery_mode?: string;
  remarks?: string;
  notes?: string;
  comments?: string;
  restriction?: string;
  restrictions?: string;
  reserved?: string;
  rooms?: string[];
  schedules?: RawArchersHubMeeting[];
  meetings?: RawArchersHubMeeting[];
  time_slots?: RawArchersHubMeeting[];
  day?: string;
  time?: string;
  room?: string;
}

// Scraper Configuration Options
export interface ArchersHubScraperOptions {
  mock?: boolean;
  timeoutMs?: number;
  maxRetries?: number;
  bypassCache?: boolean;
}

// Result of scraping
export interface ArchersHubScrapeResult {
  course: Course;
  isCached?: boolean;
  rawCount?: number;
}

// Constants
export const ARCHERSHUB_BASE_URL = "https://archershub.dlsu.edu.ph";

export const ARCHERSHUB_ENDPOINTS = {
  SEARCH_COURSES: `${ARCHERSHUB_BASE_URL}/api/courses/search`,
  COURSE_OFFERINGS: `${ARCHERSHUB_BASE_URL}/api/offerings`,
  COURSE_VIEW: `${ARCHERSHUB_BASE_URL}/courses/view`,
  SESSION_CHECK: `${ARCHERSHUB_BASE_URL}/api/user/session`,
};

export const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Accept: "application/json, text/html, application/xhtml+xml, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: `${ARCHERSHUB_BASE_URL}/`,
  Origin: ARCHERSHUB_BASE_URL,
};
