import { type ClassValue, clsx } from "clsx";
import { ICalWeekday } from "ical-generator";
import { twMerge } from "tailwind-merge";
import { Class, Schedule } from "./definitions";
import { ColorsEnum, DaysEnum } from "./enums";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function militaryTimeToMinutes(time: number): number {
  const hours = Math.floor(time / 100);
  const minutes = time % 100;
  return hours * 60 + minutes;
}

export function minutesToMilitaryTime(minutes: number): number {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours * 100 + remainingMinutes;
}

/**
 * Converts a given time to a formatted string representation.
 *
 * @param time - The time to format. This can be in military format (e.g., 1300 for 1:00 PM)
 *               or in minutes (e.g., 780 for 1:00 PM).
 * @param inputFormat - The format of the input time. Defaults to "military".
 *                      - "military": Time is provided in military format (e.g., 1300).
 *                      - "minutes": Time is provided in total minutes since midnight.
 * @returns A string representation of the time in a human-readable format.
 *
 * @example
 * ```typescript
 * formatTime(1300); // "1:00 PM"
 * formatTime(780, "minutes"); // "13:00"
 * ```
 */

export function formatTime(
  time: number,
  inputFormat: "military" | "minutes" = "military"
) {
  const divisor = inputFormat === "military" ? 100 : 60;
  const hour = Math.floor(time / divisor);
  const minutes = time % divisor;

  return `${hour > 12 ? hour - 12 : hour}:${
    minutes > 10 ? "" : "0"
  }${minutes} ${hour >= 12 ? "PM" : "AM"}`;
}

export function toProperCase(val: string) {
  return val
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/((?<=( |-)|^).)/g, (s) => s.toUpperCase());
}

export function getCardColors(color: ColorsEnum) {
  const cardColors = {
    ROSE: "bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-100",
    PINK: "bg-pink-200 dark:bg-pink-900 text-pink-950 dark:text-pink-100",
    FUCHSIA:
      "bg-fuchsia-200 dark:bg-fuchsia-900 text-fuchsia-950 dark:text-fuchsia-100",
    PURPLE:
      "bg-purple-200 dark:bg-purple-900 text-purple-950 dark:text-purple-100",
    VIOLET:
      "bg-violet-200 dark:bg-violet-900 text-violet-950 dark:text-violet-100",
    INDIGO:
      "bg-indigo-200 dark:bg-indigo-900 text-indigo-950 dark:text-indigo-100",
    BLUE: "bg-blue-200 dark:bg-blue-900 text-blue-950 dark:text-blue-100",
    SKY: "bg-sky-200 dark:bg-sky-900 text-sky-950 dark:text-sky-100",
    CYAN: "bg-cyan-200 dark:bg-cyan-900 text-cyan-950 dark:text-cyan-100",
    TEAL: "bg-teal-200 dark:bg-teal-900 text-teal-950 dark:text-teal-100",
    EMERALD:
      "bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100",
    GREEN: "bg-green-200 dark:bg-green-900 text-green-950 dark:text-green-100",
    LIME: "bg-lime-200 dark:bg-lime-900 text-lime-950 dark:text-lime-100",
    YELLOW:
      "bg-yellow-200 dark:bg-yellow-900 text-yellow-950 dark:text-yellow-100",
    AMBER: "bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100",
    ORANGE:
      "bg-orange-200 dark:bg-orange-900 text-orange-950 dark:text-orange-100",
    RED: "bg-red-200 dark:bg-red-900 text-red-950 dark:text-red-100",
  };

  const cardBorders = {
    ROSE: "border-rose-300 dark:border-rose-700",
    PINK: "border-pink-300 dark:border-pink-700",
    FUCHSIA: "border-fuchsia-300 dark:border-fuchsia-700",
    PURPLE: "border-purple-300 dark:border-purple-700",
    VIOLET: "border-violet-300 dark:border-violet-700",
    INDIGO: "border-indigo-300 dark:border-indigo-700",
    BLUE: "border-blue-300 dark:border-blue-700",
    SKY: "border-sky-300 dark:border-sky-700",
    CYAN: "border-cyan-300 dark:border-cyan-700",
    TEAL: "border-teal-300 dark:border-teal-700",
    EMERALD: "border-emerald-300 dark:border-emerald-700",
    GREEN: "border-green-300 dark:border-green-700",
    LIME: "border-lime-300 dark:border-lime-700",
    YELLOW: "border-yellow-300 dark:border-yellow-700",
    AMBER: "border-amber-300 dark:border-amber-700",
    ORANGE: "border-orange-300 dark:border-orange-700",
    RED: "border-red-300 dark:border-red-700",
  };

  const cardShadows = {
    ROSE: "bg-rose-300 shadow-rose-300/50 dark:bg-rose-800 dark:shadow-rose-700/40",
    PINK: "bg-pink-300 shadow-pink-300/50 dark:bg-pink-800 dark:shadow-pink-700/40",
    FUCHSIA:
      "bg-fuchsia-300 shadow-fuchsia-300/50 dark:bg-fuchsia-800 dark:shadow-fuchsia-700/40",
    PURPLE:
      "bg-purple-300 shadow-purple-300/50 dark:bg-purple-800 dark:shadow-purple-700/40",
    VIOLET:
      "bg-violet-300 shadow-violet-300/50 dark:bg-violet-800 dark:shadow-violet-700/40",
    INDIGO:
      "bg-indigo-300 shadow-indigo-300/50 dark:bg-indigo-800 dark:shadow-indigo-700/40",
    BLUE: "bg-blue-300 shadow-blue-300/50 dark:bg-blue-800 dark:shadow-blue-700/40",
    SKY: "bg-sky-300 shadow-sky-300/50 dark:bg-sky-800 dark:shadow-sky-700/40",
    CYAN: "bg-cyan-300 shadow-cyan-300/50 dark:bg-cyan-800 dark:shadow-cyan-700/40",
    TEAL: "bg-teal-300 shadow-teal-300/50 dark:bg-teal-800 dark:shadow-teal-700/40",
    EMERALD:
      "bg-emerald-300 shadow-emerald-300/50 dark:bg-emerald-800 dark:shadow-emerald-700/40",
    GREEN:
      "bg-green-300 shadow-green-300/50 dark:bg-green-800 dark:shadow-green-700/40",
    LIME: "bg-lime-300 shadow-lime-300/50 dark:bg-lime-800 dark:shadow-lime-700/40",
    YELLOW:
      "bg-yellow-300 shadow-yellow-300/50 dark:bg-yellow-800 dark:shadow-yellow-700/40",
    AMBER:
      "bg-amber-300 shadow-amber-300/50 dark:bg-amber-800 dark:shadow-amber-700/40",
    ORANGE:
      "bg-orange-300 shadow-orange-300/50 dark:bg-orange-800 dark:shadow-orange-700/40",
    RED: "bg-red-300 shadow-red-300/50 dark:bg-red-800 dark:shadow-red-700/40",
  };

  const cardColorsTransparent = {
    ROSE: "bg-rose-200/50 dark:bg-rose-900/50 text-rose-950 dark:text-rose-100",
    PINK: "bg-pink-200/50 dark:bg-pink-900/50 text-pink-950 dark:text-pink-100",
    FUCHSIA:
      "bg-fuchsia-200/50 dark:bg-fuchsia-900/50 text-fuchsia-950 dark:text-fuchsia-100",
    PURPLE:
      "bg-purple-200/50 dark:bg-purple-900/50 text-purple-950 dark:text-purple-100",
    VIOLET:
      "bg-violet-200/50 dark:bg-violet-900/50 text-violet-950 dark:text-violet-100",
    INDIGO:
      "bg-indigo-200/50 dark:bg-indigo-900/50 text-indigo-950 dark:text-indigo-100",
    BLUE: "bg-blue-200/50 dark:bg-blue-900/50 text-blue-950 dark:text-blue-100",
    SKY: "bg-sky-200/50 dark:bg-sky-900/50 text-sky-950 dark:text-sky-100",
    CYAN: "bg-cyan-200/50 dark:bg-cyan-900/50 text-cyan-950 dark:text-cyan-100",
    TEAL: "bg-teal-200/50 dark:bg-teal-900/50 text-teal-950 dark:text-teal-100",
    EMERALD:
      "bg-emerald-200/50 dark:bg-emerald-900/50 text-emerald-950 dark:text-emerald-100",
    GREEN:
      "bg-green-200/50 dark:bg-green-900/50 text-green-950 dark:text-green-100",
    LIME: "bg-lime-200/50 dark:bg-lime-900/50 text-lime-950 dark:text-lime-100",
    YELLOW:
      "bg-yellow-200/50 dark:bg-yellow-900/50 text-yellow-950 dark:text-yellow-100",
    AMBER:
      "bg-amber-200/50 dark:bg-amber-900/50 text-amber-950 dark:text-amber-100",
    ORANGE:
      "bg-orange-200/50 dark:bg-orange-900/50 text-orange-950 dark:text-orange-100",
    RED: "bg-red-200/50 dark:bg-red-900/50 text-red-950 dark:text-red-100",
  };

  const secondaryColors = {
    ROSE: "bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200",
    PINK: "bg-pink-100 dark:bg-pink-950 text-pink-900 dark:text-pink-200",
    FUCHSIA:
      "bg-fuchsia-100 dark:bg-fuchsia-950 text-fuchsia-900 dark:text-fuchsia-200",
    PURPLE:
      "bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200",
    VIOLET:
      "bg-violet-100 dark:bg-violet-950 text-violet-900 dark:text-violet-200",
    INDIGO:
      "bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200",
    BLUE: "bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200",
    SKY: "bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-200",
    CYAN: "bg-cyan-100 dark:bg-cyan-950 text-cyan-900 dark:text-cyan-200",
    TEAL: "bg-teal-100 dark:bg-teal-950 text-teal-900 dark:text-teal-200",
    EMERALD:
      "bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200",
    GREEN: "bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-200",
    LIME: "bg-lime-100 dark:bg-lime-950 text-lime-900 dark:text-lime-200",
    YELLOW:
      "bg-yellow-100 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-200",
    AMBER: "bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200",
    ORANGE:
      "bg-orange-100 dark:bg-orange-950 text-orange-900 dark:text-orange-200",
    RED: "bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-200",
  };

  return {
    secondaryColor: secondaryColors[color],
    transparent: cardColorsTransparent[color],
    color: cardColors[color],
    shadow: cardShadows[color],
    border: cardBorders[color],
  };
}

export function hasOwnProp<X extends {}, Y extends PropertyKey>(
  obj: X,
  prop: Y
): obj is X & Record<Y, unknown> {
  return Object.hasOwn(obj, prop);
}

export function inferRoom(classData: Class, sched: Schedule): string {
  if (sched.room) return sched.room;

  if (
    classData.modality === "ONLINE" ||
    classData.modality === "PREDOMINANTLY ONLINE"
  ) {
    return "Online";
  }

  return "TBA";
}

export function convertToIcalDay(day: DaysEnum): ICalWeekday {
  switch (day) {
    case "M":
      return ICalWeekday.MO;
    case "T":
      return ICalWeekday.TU;
    case "W":
      return ICalWeekday.WE;
    case "H":
      return ICalWeekday.TH;
    case "F":
      return ICalWeekday.FR;
    case "S":
      return ICalWeekday.SA;
  }
}

/**
 * Adds a specified number of days to a given date.
 *
 * @param date - The date to which days will be added.
 * @param days - The number of days to add. Can be a number or a string representing a day of the week.
 *              - If it's a string, it should be one of the following: "M", "T", "W", "H", "F", "S".
 * @returns A new Date object with the specified number of days added.
 */
export function addDaysToDate(date: Date, days: number | DaysEnum) {
  if (typeof days === "string") {
    const mapping: Record<DaysEnum, number> = {
      M: 0,
      T: 1,
      W: 2,
      H: 3,
      F: 4,
      S: 5,
    };
    days = mapping[days as DaysEnum];
  }

  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calculates the height for calendar cards based on the given time range and cell size.
 *
 * @param params - The parameters for the height calculation.
 * @param params.start - The start time in either military or minutes format.
 * @param params.end - The end time in either military or minutes format.
 * @param params.type - The format of the time values. Defaults to "military".
 *                      - "military": Time is represented in HHMM format (e.g., 1330 for 1:30 PM).
 *                      - "minutes": Time is represented in total minutes past midnight.
 * @param params.cellSizePx - The height of a single hour cell in pixels.
 * @returns The calculated height in pixels for the given time range.
 */
export function calculateHeight(params: {
  start: number;
  end: number;
  type?: "military" | "minutes";
  cellSizePx: number;
}): number {
  const { start, end, type = "military", cellSizePx } = params;
  const divisor = type === "military" ? 100 : 60;

  const startHour = Math.floor(start / divisor);
  const endHour = Math.floor(end / divisor);
  const startMinutes = start % divisor;
  const endMinutes = end % divisor;

  const totalMinutes = (endHour - startHour) * 60 + (endMinutes - startMinutes);

  return (totalMinutes / 60) * cellSizePx;
}
