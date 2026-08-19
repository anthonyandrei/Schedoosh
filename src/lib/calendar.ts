import ical, { ICalEventData, ICalEventRepeatingFreq } from "ical-generator";
import { Class, Schedule } from "./definitions";
import { DaysEnum } from "./enums";
import {
  addDaysToDate,
  convertToIcalDay,
  formatTime,
  inferRoom,
  toProperCase,
} from "./utils";

const SEMESTER_WEEKS = 13; // Number of weeks in a semester

export function createICalendar(classes: Class[]) {
  const nextSemesterRaw =
    process.env.NEXT_PUBLIC_NEXT_SEMESTER_DATE ?? "MAY 5, 2025";
  const nextSemesterDate = new Date(nextSemesterRaw);

  const cal = ical({
    name: "Class Schedule",
    description: "Class schedule for the semester",
    timezone: "Asia/Manila",
  });

  classes.forEach((classData) => {
    const isInvalid = classData.schedules.every((schedule) => {
      const isUnknownDay = schedule.day === "U";
      const hasNoDate = !schedule.date;
      const hasValidTime = schedule.start > 0 && schedule.end > 0;
      return isUnknownDay && hasNoDate && hasValidTime;
    });

    if (isInvalid) return;

    // Group schedules with the same time on different days
    const groupedSchedules: Record<string, Schedule[]> = {};

    classData.schedules.forEach((schedule) => {
      const key = `${schedule.start}-${schedule.end}`;
      if (!groupedSchedules[key]) {
        groupedSchedules[key] = [];
      }
      groupedSchedules[key].push(schedule);
    });

    const isSingleEventDate = (d?: string) => !!d && !d.includes("-");
    const hasSpecificDate = classData.schedules.some((schedule) =>
      isSingleEventDate(schedule.date)
    );
    const hasUnknownDay = classData.schedules.some(
      (schedule) => schedule.day === "U"
    );

    // Early return in case there exists a schedule with no date and unknown day
    if (!hasSpecificDate && hasUnknownDay) {
      return;
    }

    // Helper function to create events with the same time
    const createSameTimeEvent = (schedules: Schedule[]) => {
      const firstSchedule = schedules[0];
      const startOffset = formatTime(firstSchedule.start);
      const endOffset = formatTime(firstSchedule.end);

      const baseStartDate = new Date(`${nextSemesterRaw} ${startOffset}`);
      const baseEndDate = new Date(`${nextSemesterRaw} ${endOffset}`);

      const startDate = addDaysToDate(
        baseStartDate,
        firstSchedule.day as DaysEnum
      );
      const endDate = addDaysToDate(baseEndDate, firstSchedule.day as DaysEnum);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()))
        return;

      const byDays = schedules
        .map((sched) => convertToIcalDay(sched.day as DaysEnum))
        .filter(Boolean);

      const eventInfo = {
        summary: `[${classData.section}] ${classData.course}`,
        description: classData.professor
          ? `Professor: ${toProperCase(classData.professor)}`
          : "",
        location: inferRoom(classData, firstSchedule),
      };

      cal.createEvent({
        ...eventInfo,
        start: startDate,
        end: endDate,
        repeating: {
          byDay: byDays,
          freq: ICalEventRepeatingFreq.WEEKLY,
          count: SEMESTER_WEEKS * schedules.length,
        },
      });
    };

    // If it has a date, it's probably something like LASARE
    const createCalendarEvent = (sched: Schedule) => {
      const eventInfo = {
        summary: `[${classData.section}] ${classData.course}`,
        description: classData.professor
          ? `Professor: ${toProperCase(classData.professor)}`
          : "",
        location: inferRoom(classData, sched),
      };

      const isSingleDate = isSingleEventDate(sched.date);

      // Handle all-day events
      if (isSingleDate && sched.start === sched.end) {
        const d = new Date(`${sched.date}, ${nextSemesterDate.getFullYear()}`);
        if (!Number.isNaN(d.getTime())) {
          cal.createEvent({
            start: d,
            allDay: true,
            ...eventInfo,
          });
        }
        return;
      }

      // Convert time and create dates
      const startOffset = formatTime(sched.start);
      const endOffset = formatTime(sched.end);

      let startDate: Date;
      let endDate: Date;

      // Handles one time events that have a time interval
      if (isSingleDate) {
        startDate = new Date(
          `${sched.date}, ${nextSemesterDate.getFullYear()} ${startOffset}`
        );
        endDate = new Date(
          `${sched.date}, ${nextSemesterDate.getFullYear()} ${endOffset}`
        );
      } else {
        startDate = addDaysToDate(
          new Date(`${nextSemesterRaw} ${startOffset}`),
          sched.day as DaysEnum
        );
        endDate = addDaysToDate(
          new Date(`${nextSemesterRaw} ${endOffset}`),
          sched.day as DaysEnum
        );
      }

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()))
        return;

      const eventConfig: ICalEventData = {
        ...eventInfo,
        start: startDate,
        end: endDate,
      };

      // Add repeating config for non-date based events
      if (!isSingleDate && sched.day !== "U") {
        eventConfig.repeating = {
          byDay: convertToIcalDay(sched.day as DaysEnum),
          freq: ICalEventRepeatingFreq.WEEKLY,
          count: SEMESTER_WEEKS,
        };
      }

      cal.createEvent(eventConfig);
    };

    if (hasSpecificDate) {
      classData.schedules.forEach((sched) => createCalendarEvent(sched));
    } else if (!hasUnknownDay) {
      Object.values(groupedSchedules).forEach((group) =>
        group.length > 1
          ? createSameTimeEvent(group)
          : createCalendarEvent(group[0])
      );
    }
  });

  return cal;
}
