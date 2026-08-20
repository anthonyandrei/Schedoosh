import assert from "node:assert/strict";
import test from "node:test";
import { getArcherEyeUrl } from "../utils";

test("getArcherEyeUrl generates proper URL for standard MLS format", () => {
  assert.equal(
    getArcherEyeUrl("DELA CRUZ, JUAN"),
    "https://archer-eye.com/professor/dela-cruz-juan"
  );
  assert.equal(
    getArcherEyeUrl("TAN, DAVID"),
    "https://archer-eye.com/professor/tan-david"
  );
});

test("getArcherEyeUrl strips middle initials correctly", () => {
  assert.equal(
    getArcherEyeUrl("DELA CRUZ, JUAN A."),
    "https://archer-eye.com/professor/dela-cruz-juan"
  );
  assert.equal(
    getArcherEyeUrl("DELA CRUZ, JUAN A"),
    "https://archer-eye.com/professor/dela-cruz-juan"
  );
  assert.equal(
    getArcherEyeUrl("DELA CRUZ, JUAN A. B."),
    "https://archer-eye.com/professor/dela-cruz-juan"
  );
});

test("getArcherEyeUrl handles compound surnames and multiple given names", () => {
  assert.equal(
    getArcherEyeUrl("DE CASTRO, MARIA CLARA"),
    "https://archer-eye.com/professor/de-castro-maria-clara"
  );
  assert.equal(
    getArcherEyeUrl("DEL ROSARIO, MARK ANTHONY"),
    "https://archer-eye.com/professor/del-rosario-mark-anthony"
  );
});

test("getArcherEyeUrl normalizes diacritics", () => {
  assert.equal(
    getArcherEyeUrl("PEÑA, JOSÉ"),
    "https://archer-eye.com/professor/pena-jose"
  );
  assert.equal(
    getArcherEyeUrl("NUÑEZ, ANDRÉ M."),
    "https://archer-eye.com/professor/nunez-andre"
  );
});

test("getArcherEyeUrl handles natural order (Firstname Lastname)", () => {
  assert.equal(
    getArcherEyeUrl("Louis Lu"),
    "https://archer-eye.com/professor/lu-louis"
  );
  assert.equal(
    getArcherEyeUrl("John Doe"),
    "https://archer-eye.com/professor/doe-john"
  );
  assert.equal(
    getArcherEyeUrl("John A. Doe"),
    "https://archer-eye.com/professor/doe-john"
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
