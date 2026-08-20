import assert from "node:assert/strict";
import test from "node:test";
import { formatProfessorName, getArcherEyeUrl } from "../utils";

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
