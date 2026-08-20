import { format, parse } from "date-fns";
import { calendar_v3 } from "googleapis";
import { Class, Schedule } from "./definitions";
import { DaysEnum } from "./enums";
import {
  addDaysToDate,
  convertToIcalDay,
  formatProfessorName,
  formatTime,
  inferRoom,
} from "./utils";

export const SEMESTER_WEEKS = 13;
export const nextSemesterRaw =
  process.env.NEXT_PUBLIC_NEXT_SEMESTER_DATE ?? "MAY 5, 2025";

/**
 * Determines if a given class can be converted into a calendar event.
 *
 * A class is considered convertible if all its schedules meet the following criteria:
 * - The schedule's day is marked as "U" (unknown day).
 * - The schedule does not have a specific date assigned.
 * - The schedule has valid start and end times (both greater than 0).
 *
 * @param classData - The class object containing schedule information to evaluate.
 * @returns `true` if the class is convertible, otherwise `false`.
 */
function isClassInvalidEvent(classData: Class): boolean {
  return classData.schedules.every((schedule) => {
    const isUnknownDay = schedule.day === "U";
    const hasNoDate = !schedule.date;

    return isUnknownDay && hasNoDate;
  });
}

/**
 * Parses a date string with a specific offset and returns a Date object.
 *
 * @param offset - A string representing the time offset to be parsed in the format "h:mm a".
 *                 This is combined with the `nextSemesterRaw` date string to form the full date.
 *                 Example: "10:00 AM" or "2:30 PM".
 * @returns A `Date` object representing the parsed date and time.
 *
 * @throws Will throw an error if the input string does not match the expected format.
 */
function parseDate(offset: string, baseDateString?: string) {
  return parse(
    `${baseDateString ?? nextSemesterRaw} ${offset}`,
    "MMM d, yyyy h:mm a",
    new Date()
  );
}

function createSameTimeEvent(
  schedules: Schedule[],
  classData: Class,
  eventInfo: Partial<calendar_v3.Schema$Event>
): calendar_v3.Schema$Event {
  const firstSchedule = schedules[0];
  const startOffset = formatTime(firstSchedule.start);
  const endOffset = formatTime(firstSchedule.end);

  const baseStartDate = parseDate(startOffset);
  const baseEndDate = parseDate(endOffset);

  // TODO: In the future, DaysEnum should contain "U" as a valid value
  // and the logic should be changed to handle it properly
  const startDate = addDaysToDate(baseStartDate, firstSchedule.day as DaysEnum);
  const endDate = addDaysToDate(baseEndDate, firstSchedule.day as DaysEnum);

  // Event repeats during these days
  const byDays = schedules
    .map((sched) => convertToIcalDay(sched.day as DaysEnum))
    .filter(Boolean)
    .join(",");

  const locations = schedules
    .map((sched) => inferRoom(classData, sched))
    .filter((sched) => sched !== "TBA");

  // If all locations are TBA, set location to "TBA"
  if (locations.length === 0) {
    locations.push("TBA");
  }

  const location = [...new Set(locations)].join("/");

  return {
    ...eventInfo,
    location,
    start: {
      dateTime: format(startDate, "yyyy-MM-dd'T'HH:mm:ss"),
      timeZone: "Asia/Manila",
    },
    end: {
      dateTime: format(endDate, "yyyy-MM-dd'T'HH:mm:ss"),
      timeZone: "Asia/Manila",
    },
    recurrence: [
      `RRULE:FREQ=WEEKLY;COUNT=${
        SEMESTER_WEEKS * schedules.length
      };BYDAY=${byDays}`,
    ],
  };
}

function createCalendarEvent(
  sched: Schedule,
  classData: Class,
  eventInfo: Partial<calendar_v3.Schema$Event>
): calendar_v3.Schema$Event {
  const semYear = parse(
    nextSemesterRaw,
    "MMM d, yyyy",
    new Date()
  ).getFullYear();

  // Handle all-day events
  if (sched.date && sched.start === sched.end && sched.date) {
    const formattedDate = format(
      new Date(`${sched.date}, ${semYear}`),
      "yyyy-MM-dd"
    );

    return {
      ...eventInfo,
      start: {
        date: formattedDate,
      },
      end: {
        date: formattedDate,
      },
    };
  }

  const baseDateString = sched.date
    ? `${sched.date}, ${semYear}`
    : nextSemesterRaw;

  // Convert time and create dates
  const startOffset = formatTime(sched.start);
  const endOffset = formatTime(sched.end);

  let startDate: Date, endDate: Date;
  startDate = parseDate(startOffset, baseDateString);
  endDate = parseDate(endOffset, baseDateString);

  // Add day offset if no date is provided
  if (!sched.date) {
    startDate = addDaysToDate(startDate, sched.day as DaysEnum);
    endDate = addDaysToDate(endDate, sched.day as DaysEnum);
  }

  const eventConfig: calendar_v3.Schema$Event = {
    ...eventInfo,
    location: inferRoom(classData, sched) || "TBA",
    start: {
      dateTime: format(startDate, "yyyy-MM-dd'T'HH:mm:ss"),
      timeZone: "Asia/Manila",
    },
    end: {
      dateTime: format(endDate, "yyyy-MM-dd'T'HH:mm:ss"),
      timeZone: "Asia/Manila",
    },
  };

  // Add repeating config for non-date based events
  if (!sched.date && sched.day !== "U") {
    eventConfig.recurrence = [
      `RRULE:FREQ=WEEKLY;COUNT=${SEMESTER_WEEKS};BYDAY=${convertToIcalDay(
        sched.day
      )}`,
    ];
  }

  return eventConfig;
}

/**
 * Converts a class object into an array of Google Calendar event objects.
 *
 * This function processes the provided class data and generates calendar events
 * based on the schedules associated with the class. It handles grouping schedules
 * with the same time on different days, and ensures that invalid or ambiguous
 * schedules are excluded from the resulting events.
 *
 * @param classData - The class object containing schedule and metadata information.
 * @returns An array of Google Calendar event objects. If the class data contains
 *          invalid or ambiguous schedules, an empty array is returned.
 *
 * ### Behavior:
 * - If the class schedules contain specific dates, individual events are created
 *   for each schedule.
 * - If the class schedules do not have specific dates but have valid days, events
 *   are grouped by time and created accordingly.
 * - If the class schedules contain unknown days ("U") and no specific dates, no
 *   events are created.
 * ```
 */
export function convertClassToEvent(
  classData: Class
): calendar_v3.Schema$Event[] {
  const events: calendar_v3.Schema$Event[] = [];

  if (isClassInvalidEvent(classData)) return events;

  // Group schedules with the same time on different days
  const groupedSchedules = classData.schedules.reduce<
    Record<string, Schedule[]>
  >((acc, schedule) => {
    const key = `${schedule.start}-${schedule.end}`;
    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(schedule);
    return acc;
  }, {});

  const hasDate = classData.schedules.some((schedule) => schedule.date);
  const hasUnknownDay = classData.schedules.some(
    (schedule) => schedule.day === "U"
  );

  // Early return in case there exists a schedule with no date and unknown day
  if (!hasDate && hasUnknownDay) {
    return events;
  }

  const commonEventInfo = {
    summary: `[${classData.section}] ${classData.course}`,
    description: `Professor: ${formatProfessorName(classData.professor) || "TBA"}`,
  };

  if (hasDate) {
    classData.schedules.forEach((sched) =>
      events.push(createCalendarEvent(sched, classData, commonEventInfo))
    );
  } else if (!hasUnknownDay) {
    Object.values(groupedSchedules).forEach((group) =>
      events.push(
        group.length > 1
          ? createSameTimeEvent(group, classData, commonEventInfo)
          : createCalendarEvent(group[0], classData, commonEventInfo)
      )
    );
  }

  return events;
}
