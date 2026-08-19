import { Course } from "@/lib/definitions";

export const MOCK_CCPROG1: Course = {
  courseCode: "CCPROG1",
  classes: [
    {
      code: 1001,
      course: "CCPROG1",
      section: "S11",
      professor: "DELA CRUZ, JUAN",
      schedules: [
        {
          day: "M",
          start: 900,
          end: 1030,
          date: "Jan 6 - Apr 12, 2025",
          isOnline: false,
          room: "GK301",
        },
        {
          day: "W",
          start: 900,
          end: 1030,
          date: "Jan 6 - Apr 12, 2025",
          isOnline: true,
          room: "ONLINE",
        },
      ],
      enrolled: 35,
      enrollCap: 40,
      restriction: "Open to all",
      modality: "HYBRID",
      remarks: "Lecture / Lab",
      rooms: ["GK301", "ONLINE"],
    },
    {
      code: 1002,
      course: "CCPROG1",
      section: "S12",
      professor: "SANTOS, MARIA",
      schedules: [
        {
          day: "T",
          start: 1100,
          end: 1230,
          date: "Jan 6 - Apr 12, 2025",
          isOnline: false,
          room: "LS201",
        },
        {
          day: "H",
          start: 1100,
          end: 1230,
          date: "Jan 6 - Apr 12, 2025",
          isOnline: false,
          room: "LS201",
        },
      ],
      enrolled: 40,
      enrollCap: 40,
      restriction: "Open to all",
      modality: "F2F",
      remarks: "Lecture",
      rooms: ["LS201", "LS201"],
    },
  ],
  lastFetched: new Date("2026-08-19T00:00:00.000Z"),
  isCustom: false,
};

export const MOCK_GEETHIC: Course = {
  courseCode: "GEETHIC",
  classes: [
    {
      code: 2001,
      course: "GEETHIC",
      section: "G01",
      professor: "REYES, PEDRO",
      schedules: [
        {
          day: "F",
          start: 1300,
          end: 1600,
          date: "Jan 6 - Apr 12, 2025",
          isOnline: false,
          room: "AG702",
        },
      ],
      enrolled: 25,
      enrollCap: 45,
      restriction: "Open to all",
      modality: "F2F",
      remarks: "Lecture",
      rooms: ["AG702"],
    },
  ],
  lastFetched: new Date("2026-08-19T00:00:00.000Z"),
  isCustom: false,
};
