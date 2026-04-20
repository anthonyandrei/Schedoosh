import {
  Class,
  Course,
  CourseGroup,
  Filter,
  Schedule,
  UserSchedule,
} from "./definitions";
import { ColorsEnum, ColorsEnumSchema, DaysEnum } from "./enums";
import { militaryTimeToMinutes } from "./utils";

export const MAX_SCHEDULES = 2048; // Maximum number of schedules to generate

export function getRandomColors(courses: string[]): Record<string, ColorsEnum> {
  const availableColors = [...ColorsEnumSchema.options];
  const courseColors: Record<string, ColorsEnum> = {};

  courses.forEach((course) => {
    if (availableColors.length === 0) {
      // If we run out of colors, we just reset the available colors.
      availableColors.push(...ColorsEnumSchema.options);
    }

    const randomIndex = Math.floor(Math.random() * availableColors.length);
    const color = availableColors.splice(randomIndex, 1)[0];
    courseColors[course] = color;
  });

  return courseColors;
}

function filterInitialData(courses: Class[][], filter: Filter): Class[][] {
  return courses.map((course) =>
    course.filter((courseClass) => {
      const isSchedInvalid = courseClass.schedules.some((sched) => {
        // If it's an unknown day, then we just let it pass through.
        if (sched.day === "U") return false;

        // If the day is F2F and the user doesn't want F2F on that day, remove it.
        const isF2F = !sched.isOnline || courseClass.modality === "F2F";
        if (isF2F && !filter.general.daysInPerson.includes(sched.day))
          return true;

        const { start, end, modalities } = filter.specific[sched.day];

        return (
          sched.start < start ||
          sched.end > end ||
          !modalities.includes(courseClass.modality)
        );
      });

      // Keep the class if it passes both the schedule and modality filters
      return !isSchedInvalid;
    })
  );
}

export function filterGeneratedSchedules(schedules: Class[][], filter: Filter) {
  return schedules.filter((sched) => {
    // 1. We reduce the scheds into a per day basis to do this easier.
    const deconstructed = sched.reduce<Record<DaysEnum, Schedule[]>>(
      (acc, curr) => {
        for (const classSched of curr.schedules) {
          if (classSched.day === "U") continue;
          acc[classSched.day].push(classSched);
        }
        return acc;
      },
      { M: [], T: [], W: [], H: [], F: [], S: [] }
    );

    // 2. We check each of the days one by one to see if any of them violate the
    // given filters.
    const isInvalid = Object.entries(deconstructed).some(([day, classes]) => {
      if (classes.length === 0) return false;

      const { maxPerDay, maxConsecutive } = filter.specific[day as DaysEnum];
      if (classes.length > maxPerDay) return true;
      if (classes.length < maxConsecutive) return false;

      let consecutive = 1;
      classes.sort((a, b) => a.start - b.start);

      for (let i = 1; i < classes.length; i++) {
        const remaining = classes.length - (i + 1);

        const previousEnd = militaryTimeToMinutes(classes[i - 1].end);
        const currentStart = militaryTimeToMinutes(classes[i].start);
        const timeDifference = currentStart - previousEnd;

        // If the time difference is LTE to 15, they're consecutive.
        // But if it's not, we reset back to 1 class.
        if (timeDifference <= 15) {
          consecutive += 1;
        } else {
          consecutive = 1;
        }

        if (consecutive > maxConsecutive) {
          return true;
        }

        // Early exit when there's not enough classes left to go over the maximum
        if (remaining + consecutive < maxConsecutive) return false;
      }

      return false;
    });

    return !isInvalid;
  });
}

/**
 * Generates all possible combinations of a given number of courses from a list.
 *
 * @param courses - The list of courses to choose from.
 * @param pick - The number of courses to pick for each combination.
 * @returns An array of course combinations, where each combination is an array of courses.
 */
function generateCombinations(courses: Course[], pick: number) {
  const combinations: Course[][] = [];

  if (courses.length < pick) return [courses];

  const stack: { index: number; current: Course[] }[] = [
    { index: 0, current: [] },
  ];

  while (stack.length > 0) {
    const { index, current } = stack.pop()!;

    if (current.length === pick) {
      // We've reached the pick amount, so we add it to the combinations.
      combinations.push([...current]);
    } else if (index < courses.length) {
      // Choose to keep current course.
      stack.push({ index: index + 1, current: [...current, courses[index]] });

      // Choose to skip current course.
      stack.push({ index: index + 1, current });
    }
  }
  return combinations;
}

/**
 * Computes the Cartesian product of multiple arrays.
 *
 * @template T - The type of elements in the input arrays.
 * @param  a - The arrays for which to compute the Cartesian product.
 * @returns The Cartesian product of the input arrays.
 *
 * @example
 * ```typescript
 * const result = getCartesianProduct([1, 2], ['a', 'b']);
 * // result is [[1, 'a'], [1, 'b'], [2, 'a'], [2, 'b']]
 * ```
 */
function getCartesianProduct<T extends unknown[]>(
  ...a: { [K in keyof T]: T[K][] }
) {
  return a.reduce<T[]>(
    (b, c) => b.flatMap((d) => c.map((e) => [...d, e] as T)),
    [[]] as unknown as T[]
  );
}

export function createGroupedSchedules({
  groups,
  courses,
  filter,
}: {
  groups: CourseGroup[];
  courses: Course[];
  filter?: Filter;
}) {
  const ungroupedCourses = courses.filter(
    (course) => !course.group || course.group === "Ungrouped"
  );
  let overflow = false;

  // Generates possible combinations per group
  // Example: [SUBJ1, SUBJ2, SUBJ3] with pick 2 and [SUBJ4, SUBJ5] with pick 1
  // will generate: [[[SUBJ1, SUBJ2], [SUBJ1, SUBJ3], [SUBJ2, SUBJ3]], [[SUBJ4], [SUBJ5]]]
  // Dimensions: Groups -> Combinations -> Courses
  const groupedCombinations = groups
    .map((group) => {
      const groupCourses = courses.filter(
        (course) => course.group === group.name
      );

      if (groupCourses.length === 0) return [];

      const combinations = generateCombinations(groupCourses, group.pick);
      return combinations;
    })
    .filter((group) => group.length > 0);

  // Gets the Cartesian product of the combinations
  // Example: [[[SUBJ1, SUBJ2]], [[SUBJ4], [SUBJ5]]]
  // will generate: [[[SUBJ1, SUBJ2], [SUBJ4]], [[SUBJ1, SUBJ2], [SUBJ5]]]
  // Dimensions: Cartesian -> Groups -> Courses
  const groupsCartesianProduct = getCartesianProduct(...groupedCombinations);

  const generatedSchedules: UserSchedule[] = [];
  let generatedColors: Record<string, ColorsEnum> = {};
  const errorTally: Record<string, number> = {};

  for (const cartesian of groupsCartesianProduct) {
    const flattenedCombination = cartesian.flat();
    const combinedCourses = [...ungroupedCourses, ...flattenedCombination].map(
      (course) => course.classes
    );
    const { schedules, colors, error } = createSchedules(
      combinedCourses,
      filter
    );

    if (error) errorTally[error] = (errorTally[error] || 0) + 1;

    const newLength = generatedSchedules.length + schedules.length;
    if (newLength > MAX_SCHEDULES) {
      overflow = true;
      break;
    }
    if (schedules.length && schedules[0].classes.length > 0) {
      generatedSchedules.push(...schedules);
      generatedColors = { ...generatedColors, ...colors };
    }
  }

  const formattedSchedules = generatedSchedules.map((sched, i) => ({
    ...sched,
    name: `Schedule ${i + 1}`,
  }));

  let error: "overflow" | string[] | undefined;
  if (overflow) {
    error = "overflow";
  } else if (formattedSchedules.length === 0) {
    const topErrors = Object.entries(errorTally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((entry) => entry[0]);

    error = topErrors;
  }

  return {
    schedules: formattedSchedules,
    colors: generatedColors,
    error,
  };
}

function createSchedules(
  courses: Class[][],
  filter?: Filter
): {
  schedules: UserSchedule[];
  colors: Record<string, ColorsEnum>;
  error?: string;
} {
  // This will let us know what caused 0 schedules.
  // Key = cause, Value = number of times it happened.
  const errorTally: Record<string, number> = {};

  // This will store all currently made schedules.
  let createdScheds: Class[][] = [[]];

  if (filter) {
    courses = filterInitialData(courses, filter);
  }

  if (courses.some((course) => course.length === 0)) {
    return {
      schedules: [],
      colors: {},
      error: "Filter: Start/End Time or Modalities",
    };
  }

  // First, iterate throughout all of the courses
  for (const course of courses) {
    // This will store the current combinations given the course and
    // currently created schedules.
    const newCombinations: Class[][] = [];

    // Iterate throughout all the created scheds so far.
    for (let i = createdScheds.length - 1; i >= 0; i--) {
      const currentSched = createdScheds[i];
      // This flag is to indicate that at least 1 combination exists.
      let schedExists = false;

      // Check if overlap between any of the classes inside the
      // combinations and the current course class.
      for (const courseClass of course) {
        const overlap = currentSched.some((schedClass) => {
          const isOverlapping = doClassesOverlap(
            courseClass.schedules,
            schedClass.schedules
          );

          if (isOverlapping) {
            errorTally[`${courseClass.course}-${schedClass.course}`] =
              (errorTally[`${courseClass.course}-${schedClass.course}`] || 0) +
              1;
          }

          return isOverlapping;
        });

        // If there's an overlap, we can't add it to the schedule.
        if (overlap) continue;

        // If there's no overlap, this schedule can continue as is.
        schedExists = true;
        newCombinations.push([...currentSched, courseClass]);
      }

      if (!schedExists) {
        createdScheds.splice(i, 1);
      }
    }

    createdScheds = newCombinations;
  }

  if (filter && createdScheds.length > 0) {
    createdScheds = filterGeneratedSchedules(createdScheds, filter);
    if (createdScheds.length === 0)
      return {
        schedules: [],
        colors: {},
        error: "Filter: Consecutive or Max Courses",
      };
  }

  if (createdScheds.length === 0) {
    const highestErrorEntry = Object.entries(errorTally).reduce(
      (max, entry) => (entry[1] > max[1] ? entry : max),
      ["", 0]
    );

    return {
      schedules: [],
      colors: {},
      error: `Conflict: ${highestErrorEntry[0]}`,
    };
  }

  const courseNames = createdScheds[0].map((courseClass) => courseClass.course);
  const colors = getRandomColors(courseNames);

  const formattedSchedules: UserSchedule[] = createdScheds.map((sched, _i) => ({
    name: ``,
    classes: sched,
    colors: {},
  }));

  return { schedules: formattedSchedules, colors };
}

export function doClassesOverlap(sched1: Schedule[], sched2: Schedule[]) {
  const doSchedsOverlap = (sched1: Schedule, sched2: Schedule) => {
    // 915 - 1045 vs 730 - 930
    return sched1.start < sched2.end && sched2.start < sched1.end;
  };

  for (const currSched1 of sched1) {
    for (const currSched2 of sched2) {
      if (currSched1.day !== currSched2.day) continue;

      const overlap = doSchedsOverlap(currSched1, currSched2);
      if (overlap) return true;
    }
  }

  return false;
}
