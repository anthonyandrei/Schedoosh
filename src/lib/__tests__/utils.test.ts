import assert from "node:assert/strict";
import test from "node:test";
import { Class, Schedule } from "../definitions";
import {
  buildClassFromForm,
  deriveModality,
  formatProfessorName,
  getArcherEyeUrl,
} from "../utils";

function makeSchedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    day: "M",
    start: 730,
    end: 900,
    date: "",
    isOnline: false,
    room: "AG1109",
    ...overrides,
  };
}

function makeClass(overrides: Partial<Class> = {}): Class {
  return {
    code: 1,
    course: "CSARCH1",
    section: "S11",
    professor: "",
    schedules: [makeSchedule()],
    enrolled: 0,
    enrollCap: 0,
    restriction: "",
    modality: "F2F",
    remarks: "",
    ...overrides,
  };
}

test("formatProfessorName formats standard MLS format as Last, First", () => {
  assert.equal(formatProfessorName("DELA CRUZ, JUAN"), "Dela Cruz, Juan");
  assert.equal(formatProfessorName("TAN, DAVID"), "Tan, David");
  assert.equal(
    formatProfessorName("TAN, ANTHONY ANDREI"),
    "Tan, Anthony Andrei"
  );
});

test("formatProfessorName formats natural order (Firstname Lastname) as Last, First", () => {
  assert.equal(formatProfessorName("Louis Lu"), "Lu, Louis");
  assert.equal(formatProfessorName("Shirley Chu"), "Chu, Shirley");
  assert.equal(
    formatProfessorName("Anthony Andrei Tan"),
    "Tan, Anthony Andrei"
  );
});

test("formatProfessorName handles compound surnames and multiple given names", () => {
  assert.equal(
    formatProfessorName("Maria Clara De Castro"),
    "De Castro, Maria Clara"
  );
  assert.equal(
    formatProfessorName("DE CASTRO, MARIA CLARA"),
    "De Castro, Maria Clara"
  );
  assert.equal(
    formatProfessorName("DEL ROSARIO, MARK ANTHONY"),
    "Del Rosario, Mark Anthony"
  );
  assert.equal(
    formatProfessorName("Mark Anthony Del Rosario"),
    "Del Rosario, Mark Anthony"
  );
  assert.equal(formatProfessorName("Juan Dela Cruz"), "Dela Cruz, Juan");
  assert.equal(formatProfessorName("Juan De La Cruz"), "De La Cruz, Juan");
});

test("formatProfessorName preserves middle initials and diacritics", () => {
  assert.equal(formatProfessorName("John A. Doe"), "Doe, John A.");
  assert.equal(formatProfessorName("DOE, JOHN A."), "Doe, John A.");
  assert.equal(formatProfessorName("PEÑA, JOSÉ"), "Peña, José");
  assert.equal(formatProfessorName("José Peña"), "Peña, José");
});

test("formatProfessorName returns empty string for sentinels and empty inputs", () => {
  assert.equal(formatProfessorName("TBA"), "");
  assert.equal(formatProfessorName("tba"), "");
  assert.equal(formatProfessorName("STAFF"), "");
  assert.equal(formatProfessorName("staff"), "");
  assert.equal(formatProfessorName("TBD"), "");
  assert.equal(formatProfessorName("FACULTY"), "");
  assert.equal(formatProfessorName("N/A"), "");
  assert.equal(formatProfessorName("-"), "");
  assert.equal(formatProfessorName(""), "");
  assert.equal(formatProfessorName("   "), "");
  assert.equal(formatProfessorName(null), "");
  assert.equal(formatProfessorName(undefined), "");
  assert.equal(formatProfessorName("Singleword"), "Singleword");
});

test("getArcherEyeUrl generates proper URL for standard MLS format", () => {
  assert.equal(
    getArcherEyeUrl("DELA CRUZ, JUAN"),
    "https://archer-eye.com/professor/juan-dela-cruz"
  );
  assert.equal(
    getArcherEyeUrl("TAN, DAVID"),
    "https://archer-eye.com/professor/david-tan"
  );
});

test("getArcherEyeUrl strips middle initials correctly", () => {
  assert.equal(
    getArcherEyeUrl("DELA CRUZ, JUAN A."),
    "https://archer-eye.com/professor/juan-dela-cruz"
  );
  assert.equal(
    getArcherEyeUrl("DELA CRUZ, JUAN A"),
    "https://archer-eye.com/professor/juan-dela-cruz"
  );
  assert.equal(
    getArcherEyeUrl("DELA CRUZ, JUAN A. B."),
    "https://archer-eye.com/professor/juan-dela-cruz"
  );
});

test("getArcherEyeUrl handles compound surnames and multiple given names", () => {
  assert.equal(
    getArcherEyeUrl("DE CASTRO, MARIA CLARA"),
    "https://archer-eye.com/professor/maria-clara-de-castro"
  );
  assert.equal(
    getArcherEyeUrl("DEL ROSARIO, MARK ANTHONY"),
    "https://archer-eye.com/professor/mark-anthony-del-rosario"
  );
  assert.equal(
    getArcherEyeUrl("Maria Clara De Castro"),
    "https://archer-eye.com/professor/maria-clara-de-castro"
  );
  assert.equal(
    getArcherEyeUrl("Juan Dela Cruz"),
    "https://archer-eye.com/professor/juan-dela-cruz"
  );
  assert.equal(
    getArcherEyeUrl("Juan De La Cruz"),
    "https://archer-eye.com/professor/juan-de-la-cruz"
  );
});

test("getArcherEyeUrl normalizes diacritics", () => {
  assert.equal(
    getArcherEyeUrl("PEÑA, JOSÉ"),
    "https://archer-eye.com/professor/jose-pena"
  );
  assert.equal(
    getArcherEyeUrl("NUÑEZ, ANDRÉ M."),
    "https://archer-eye.com/professor/andre-nunez"
  );
});

test("getArcherEyeUrl handles natural order (Firstname Lastname)", () => {
  assert.equal(
    getArcherEyeUrl("Louis Lu"),
    "https://archer-eye.com/professor/louis-lu"
  );
  assert.equal(
    getArcherEyeUrl("John Doe"),
    "https://archer-eye.com/professor/john-doe"
  );
  assert.equal(
    getArcherEyeUrl("John A. Doe"),
    "https://archer-eye.com/professor/john-doe"
  );
  assert.equal(
    getArcherEyeUrl("Anthony Andrei Tan"),
    "https://archer-eye.com/professor/anthony-andrei-tan"
  );
});

test("getArcherEyeUrl returns null for placeholders, unassigned names, and empty inputs", () => {
  assert.equal(getArcherEyeUrl("TBA"), null);
  assert.equal(getArcherEyeUrl("tba"), null);
  assert.equal(getArcherEyeUrl("STAFF"), null);
  assert.equal(getArcherEyeUrl("staff"), null);
  assert.equal(getArcherEyeUrl("TBD"), null);
  assert.equal(getArcherEyeUrl("FACULTY"), null);
  assert.equal(getArcherEyeUrl("N/A"), null);
  assert.equal(getArcherEyeUrl("-"), null);
  assert.equal(getArcherEyeUrl(""), null);
  assert.equal(getArcherEyeUrl("   "), null);
  assert.equal(getArcherEyeUrl(null), null);
  assert.equal(getArcherEyeUrl(undefined), null);
  assert.equal(getArcherEyeUrl("Singleword"), null);
});

test("deriveModality returns F2F for no schedules", () => {
  assert.equal(deriveModality([]), "F2F");
});

test("deriveModality returns F2F when no schedule is online", () => {
  assert.equal(
    deriveModality([
      makeSchedule({ isOnline: false }),
      makeSchedule({ isOnline: false }),
    ]),
    "F2F"
  );
});

test("deriveModality returns ONLINE when every schedule is online", () => {
  assert.equal(
    deriveModality([
      makeSchedule({ isOnline: true }),
      makeSchedule({ isOnline: true }),
    ]),
    "ONLINE"
  );
});

test("deriveModality returns HYBRID when schedules mix online and in-person", () => {
  assert.equal(
    deriveModality([
      makeSchedule({ isOnline: true }),
      makeSchedule({ isOnline: false }),
    ]),
    "HYBRID"
  );
});

test("buildClassFromForm mints code 1 for the first class in an empty course", () => {
  const result = buildClassFromForm(
    {
      course: "CSARCH1",
      section: "S11",
      professor: "",
      schedules: [makeSchedule()],
      enrolled: 0,
      enrollCap: 0,
      restriction: "",
      remarks: "",
    },
    []
  );
  assert.equal(result.code, 1);
});

test("buildClassFromForm mints max(existing codes) + 1 when classes already exist", () => {
  const existing = [
    makeClass({ code: 5 }),
    makeClass({ code: 12 }),
    makeClass({ code: 3 }),
  ];
  const result = buildClassFromForm(
    {
      course: "CSARCH1",
      section: "S12",
      professor: "",
      schedules: [makeSchedule()],
      enrolled: 0,
      enrollCap: 0,
      restriction: "",
      remarks: "",
    },
    existing
  );
  assert.equal(result.code, 13);
});

test("buildClassFromForm preserves code and variant from `previous` when editing", () => {
  const previous = makeClass({ code: 99, variant: "07B" });
  const result = buildClassFromForm(
    {
      course: "CSARCH1",
      section: "S11",
      professor: "",
      schedules: [makeSchedule()],
      enrolled: 0,
      enrollCap: 0,
      restriction: "",
      remarks: "",
      variant: previous.variant,
    },
    [makeClass({ code: 1000 })],
    previous
  );
  assert.equal(result.code, 99);
  assert.equal(result.variant, "07B");
});

test("buildClassFromForm leaves units undefined when the form submits undefined", () => {
  const result = buildClassFromForm(
    {
      course: "CSARCH1",
      section: "S11",
      professor: "",
      schedules: [makeSchedule()],
      enrolled: 0,
      enrollCap: 0,
      restriction: "",
      remarks: "",
      units: undefined,
    },
    []
  );
  assert.equal(result.units, undefined);
});

test("buildClassFromForm defaults enrolled and enrollCap to 0", () => {
  const result = buildClassFromForm(
    {
      course: "CSARCH1",
      section: "S11",
      professor: "",
      schedules: [makeSchedule()],
      enrolled: 0,
      enrollCap: 0,
      restriction: "",
      remarks: "",
    },
    []
  );
  assert.equal(result.enrolled, 0);
  assert.equal(result.enrollCap, 0);
});

test("buildClassFromForm derives rooms from the schedule rows in order", () => {
  const result = buildClassFromForm(
    {
      course: "CSARCH1",
      section: "S11",
      professor: "",
      schedules: [
        makeSchedule({ room: "AG1109" }),
        makeSchedule({ day: "W", room: "GK301" }),
      ],
      enrolled: 0,
      enrollCap: 0,
      restriction: "",
      remarks: "",
    },
    []
  );
  assert.deepEqual(result.rooms, ["AG1109", "GK301"]);
});

test("buildClassFromForm derives modality from the schedules, not a form field", () => {
  const result = buildClassFromForm(
    {
      course: "CSARCH1",
      section: "S11",
      professor: "",
      schedules: [makeSchedule({ isOnline: true })],
      enrolled: 0,
      enrollCap: 0,
      restriction: "",
      remarks: "",
    },
    []
  );
  assert.equal(result.modality, "ONLINE");
});
