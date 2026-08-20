import { Course } from "../definitions";

export * from "./validation";

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

export class ArchersHubCloudflareError extends ArchersHubError {
  constructor(
    message = "ArchersHub request was blocked by Cloudflare Bot Protection or security challenge. Please try Demo Mode or add your courses manually."
  ) {
    super(message, 403, "CLOUDFLARE_BLOCKED");
    this.name = "ArchersHubCloudflareError";
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

// Raw GetAllDropDownList / GetCourseList row structures from ArchersHub API
export interface RawArchersHubCampus {
  CAMPUSNO: number;
  CAMPUSNAME: string;
  IS_STUDENT_CAMPUS: number;
}

export interface RawArchersHubAcademicSession {
  ACADEMIC_SESSION_ID: number;
  ACADEMIC_SESSION_NAME: string;
  IS_CURRENT_SESSION: boolean;
}

export interface RawArchersHubCourseListItem {
  COURSE_CREATION_ID: number;
  COURSE_NAME: string;
}

// Raw GetCFData row structure from ArchersHub API
export interface RawArchersHubCFData {
  SESSION: string;
  CAMPUS: string;
  COURSE_CREATION_ID: number;
  SECTION_CREATION_ID: number;
  SECTION_NAME: string;
  CAPACITY: number;
  UPDATED_CAPACITY: number;
  SUBJECT_NAME: string;
  SUBJECT_TYPE: string;
  CREDITS: number;
  MAIN_TEACHER: string;
  ADDITIONAL_TEACHER: string | null;
  SCHEDULE: string;
  ENLISTED: number;
  APPROVED_COUNT: number;
  START_DATE: string;
  END_DATE: string;
  BATCH_CREATION_ID: number;
  SECTION_REMARK: string;
  ROOOMNAME: string | null;
  BATCHNAME: string | null;
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
  GET_ALL_DROPDOWNS: `${ARCHERSHUB_BASE_URL}/CourseFinder/GetAllDropDownList`,
  GET_COURSE_LIST: `${ARCHERSHUB_BASE_URL}/CourseFinder/GetCourseList`,
  GET_CF_DATA: `${ARCHERSHUB_BASE_URL}/CourseFinder/GetCFData`,
};

export const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  Accept: "application/json, text/html, application/xhtml+xml, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: `${ARCHERSHUB_BASE_URL}/`,
  Origin: ARCHERSHUB_BASE_URL,
};
