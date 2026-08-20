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
} from "../lib/archershub/types";
import { analyzeSessionCookie } from "../lib/archershub/validation";
import { Course } from "../lib/definitions";

export interface ValidateSessionResult {
  success: boolean;
  isMock?: boolean;
  isAffinityOnly?: boolean;
  isUnauthenticatedOnly?: boolean;
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
  const analysis = analyzeSessionCookie(sessionCookie);

  if (analysis.isAffinityOnly) {
    return {
      success: false,
      isAffinityOnly: true,
      error:
        analysis.warningMessage ||
        "Only Azure Gateway routing cookies were detected. The actual student authentication cookie is missing because modern browsers hide HttpOnly cookies from document.cookie. Please copy your full Cookie header from DevTools Network Tab or use Demo Mode.",
    };
  }

  if (analysis.isUnauthenticatedOnly) {
    return {
      success: false,
      isUnauthenticatedOnly: true,
      error:
        analysis.warningMessage ||
        "The pasted cookies appear to be from the login page rather than an active logged-in ArchersHub session. Please log in to ArchersHub first, navigate to Course Finder or Enlistment, and copy the Cookie header from the DevTools Network Tab.",
    };
  }

  if (analysis.isMock) {
    return {
      success: true,
      isMock: true,
    };
  }

  if (!analysis.isValid) {
    return {
      success: false,
      error:
        analysis.warningMessage ||
        "Invalid session cookie or token format. Please check the instructions and paste your session credentials.",
    };
  }

  return {
    success: true,
  };
}
