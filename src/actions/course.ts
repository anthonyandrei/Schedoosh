"use server";

import {
  clearCourseCache,
  scrapeCourseFromArchersHub,
  scrapeMultipleCoursesFromArchersHub,
} from "../lib/archershub/scraper";
import {
  ArchersHubAuthError,
  ArchersHubCourseNotFoundError,
  ArchersHubRateLimitError,
} from "../lib/archershub/types";
import { Course } from "../lib/definitions";

export interface FetchCourseResult {
  data?: {
    newCourse: Course;
    isCached: boolean;
  };
  error?: string;
  authExpired?: boolean;
}

export interface FetchMultipleCoursesResult {
  data?: Course[];
  error?: string;
  authExpired?: boolean;
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
