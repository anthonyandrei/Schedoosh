"use server";

import {
  clearCourseCache,
  scrapeCourseFromArchersHub,
  scrapeMultipleCoursesFromArchersHub,
} from "../lib/archershub/scraper";
import {
  ArchersHubAuthError,
  ArchersHubCloudflareError,
  ArchersHubCourseNotFoundError,
  ArchersHubRateLimitError,
  DEFAULT_HEADERS,
} from "../lib/archershub/types";
import { analyzeSessionCookie } from "../lib/archershub/validation";
import { Course } from "../lib/definitions";

export interface ValidateSessionResult {
  success: boolean;
  isMock?: boolean;
  isAffinityOnly?: boolean;
  cloudflareBlocked?: boolean;
  error?: string;
}

export interface FetchCourseResult {
  data?: {
    newCourse: Course;
    isCached: boolean;
  };
  error?: string;
  authExpired?: boolean;
  cloudflareBlocked?: boolean;
}

export interface FetchMultipleCoursesResult {
  data?: Course[];
  error?: string;
  authExpired?: boolean;
  cloudflareBlocked?: boolean;
}

export async function fetchCourse(
  courseCode: string,
  sessionCookie: string,
  options?: { mock?: boolean }
): Promise<FetchCourseResult> {
  try {
    const { course, isCached } = await scrapeCourseFromArchersHub(
      courseCode,
      sessionCookie,
      options
    );

    return {
      data: {
        newCourse: course,
        isCached: !!isCached,
      },
    };
  } catch (error) {
    if (error instanceof ArchersHubAuthError) {
      return {
        error: error.message,
        authExpired: true,
      };
    }

    if (error instanceof ArchersHubCloudflareError) {
      return {
        error: error.message,
        cloudflareBlocked: true,
      };
    }

    if (error instanceof ArchersHubCourseNotFoundError) {
      return {
        error: error.message,
      };
    }

    if (error instanceof ArchersHubRateLimitError) {
      return {
        error: error.message,
      };
    }

    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while fetching course.";
    return {
      error: message,
    };
  }
}

export async function fetchMultipleCourses(
  courses: Course[],
  sessionCookie: string,
  options?: { mock?: boolean }
): Promise<FetchMultipleCoursesResult> {
  const courseCodes = courses.map((course) => course.courseCode);

  try {
    const { courses: fetchedCourses } =
      await scrapeMultipleCoursesFromArchersHub(
        courseCodes,
        sessionCookie,
        options
      );

    const updatedCourses = courses.map((original) => {
      const updated = fetchedCourses.find(
        (f) => f.courseCode.toUpperCase() === original.courseCode.toUpperCase()
      );
      if (updated && updated.classes.length > 0) {
        return updated;
      }
      return {
        ...original,
        lastFetched: new Date(),
      };
    });

    return { data: updatedCourses };
  } catch (error) {
    if (error instanceof ArchersHubAuthError) {
      return {
        error: error.message,
        authExpired: true,
      };
    }

    if (error instanceof ArchersHubCloudflareError) {
      return {
        error: error.message,
        cloudflareBlocked: true,
      };
    }

    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while updating courses.";
    return {
      error: message,
    };
  }
}

export async function clearCourseCacheAction(): Promise<{ success: boolean }> {
  clearCourseCache();
  return { success: true };
}

export async function validateArchersHubSession(
  sessionCookie: string
): Promise<ValidateSessionResult> {
  const trimmed = sessionCookie?.trim() ?? "";

  if (trimmed === "MOCK_SESSION" || trimmed === "DEMO") {
    return {
      success: true,
      isMock: true,
    };
  }

  const analysis = analyzeSessionCookie(sessionCookie);

  if (!trimmed || (!analysis.isValid && !analysis.isAffinityOnly)) {
    return {
      success: false,
      error:
        analysis.warningMessage ||
        "Invalid session cookie or token format. Please check the instructions and paste your session credentials.",
    };
  }

  try {
    const signal =
      typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
        ? AbortSignal.timeout(8000)
        : undefined;

    const response = await fetch(
      "https://archershub.dlsu.edu.ph/StudentDashboard",
      {
        method: "GET",
        headers: {
          ...DEFAULT_HEADERS,
          Cookie: trimmed,
        },
        redirect: "follow",
        signal,
      }
    );

    const body = await response.text();

    const isCloudflare =
      body.includes("challenges.cloudflare.com") ||
      body.includes("cf-turnstile") ||
      body.includes("cf-browser-verification") ||
      body.includes("<title>Just a moment...</title>") ||
      body.includes("Cloudflare") ||
      body.includes("Attention Required");

    if (isCloudflare) {
      return {
        success: false,
        cloudflareBlocked: true,
        error:
          "ArchersHub request was blocked by Cloudflare Bot Protection or security challenge. Please try Demo Mode or add your courses manually.",
      };
    }

    // Check logged-in markers FIRST — the authenticated dashboard page
    // contains CSS class "student-login" on <body> and "StudentLogin"
    // references that would false-positive the login page check.
    const isLoggedIn =
      body.includes('id="IsLoggedIn"') ||
      body.includes('id="userID"') ||
      body.includes('id="hdnStudId"');

    if (isLoggedIn) {
      return {
        success: true,
      };
    }

    // Only check for login page AFTER confirming no logged-in markers
    const isLoginPage =
      (response.redirected &&
        (response.url.includes("/Login") ||
          response.url.includes("/Account/Login"))) ||
      body.includes("<title>Login</title>") ||
      body.includes('id="loginForm"') ||
      body.includes('name="loginForm"');

    if (isLoginPage) {
      if (analysis.isAffinityOnly) {
        return {
          success: false,
          isAffinityOnly: true,
          error:
            analysis.warningMessage ||
            "Only Azure Gateway routing cookies were detected. The actual student authentication cookie is missing because modern browsers hide HttpOnly cookies from document.cookie. Please copy your full Cookie header from DevTools Network Tab or use Demo Mode.",
        };
      }

      return {
        success: false,
        error:
          "Your ArchersHub session appears to be expired or you are not logged in. Please log in to archershub.dlsu.edu.ph, navigate to Course Finder or Enlistment, then copy the Cookie header from the DevTools Network Tab.",
      };
    }

    return {
      success: false,
      error:
        "Unexpected response from ArchersHub while validating your session. Please try again.",
    };
  } catch (_error) {
    return {
      success: false,
      error:
        "Could not reach ArchersHub to validate your session. Please check your connection and try again.",
    };
  }
}
