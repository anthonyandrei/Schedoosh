"use server";

import { Course, classSchema } from "../lib/definitions";

export async function fetchCourse(courseCode: string, id: string) {
  const res = await fetch(
    `${process.env.COURSE_API}/api/courses?id=${id}&courses=${courseCode}`
  );

  if (!res.ok) {
    return { data: undefined, error: "Something went wrong while fetching." };
  }

  const isCached = res.headers.get("data-source") === "cache";
  const parsed = (await res.json())[0];
  const parsedData = classSchema.array().parse(parsed);

  const newCourse: Course = {
    courseCode: courseCode,
    classes: parsedData,
    lastFetched: new Date(),
    isCustom: false,
  };

  return { data: { newCourse, isCached }, error: undefined };
}

export async function fetchMultipleCourses(courses: Course[], id: string) {
  const courseCodes = courses.map((course) => course.courseCode);

  const res = await fetch(
    `${process.env.COURSE_API}/api/courses?id=${id}&courses=${courseCodes.join(
      "&courses="
    )}`
  );

  if (!res.ok) {
    return { error: "Something went wrong while fetching." };
  }

  const parsed = await res.json();

  const parsedData = classSchema.array().array().parse(parsed);

  const updatedCourses = parsedData.map((classes, i) => {
    return {
      ...courses[i],
      classes: classes.length ? classes : courses[i].classes,
      lastFetched: new Date(),
    };
  });

  return { data: updatedCourses };
}
