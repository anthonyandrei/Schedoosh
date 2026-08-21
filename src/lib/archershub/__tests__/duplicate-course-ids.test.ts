import assert from "node:assert/strict";
import test from "node:test";
import { classSchema, courseSchema } from "../../definitions";
import gerizalFixture from "../fixtures/sample-cfdata-gerizal.json";
import nstp101Fixture from "../fixtures/sample-cfdata-nstp101.json";
import courseListFixture from "../fixtures/sample-courselist-response.json";
import dropdownFixture from "../fixtures/sample-dropdown-response.json";
import { clearCourseCache, scrapeCourseFromArchersHub } from "../scraper";

// Machine-gated regression & specification tests for duplicate course creation IDs
// and extended Class schema fields (type, units, variant).
//
// Background:
// On ArchersHub, some course codes (e.g. NSTP101, GERIZAL) have multiple
// entries in CourseDrp under distinct COURSE_CREATION_IDs representing different
// variants or curriculum tracks (e.g. NSTP101 has 4 IDs: 3400, 7455, 7953, 11009;
// GERIZAL has 2 IDs: 524, 11992).
//
// The scraper must use Array.prototype.filter (or equivalent) rather than
// Array.prototype.find so that all matching COURSE_CREATION_IDs are discovered,
// queried via /CourseFinder/GetCFData, and their sections merged into a single
// Course object.
//
// Furthermore:
// - Empty section lists from secondary IDs (e.g. GERIZAL 11992 returning [])
//   must not trigger ArchersHubCourseNotFoundError or drop sections from other IDs.
// - SUBJECT_TYPE values are free strings (e.g. "Administrative / Residency", "Lecture")
//   and must be accepted as plain string fields in classSchema (not restricted to enums).
// - CREDITS values (e.g. 3.0, 0.0) parse/normalize to numbers (e.g. 3, 0).
// - classSchema includes type, units, and variant.

const REAL_COOKIE =
  "ApplicationGatewayAffinityCORS=efbd9facb6f6e984a572d91915bfa51a; ApplicationGatewayAffinity=efbd9facb6f6e984a572d91915bfa51a; __Secure-SID=3huocv4ar3zyymsvzfphqhs2";

interface RecordedCall {
  url: string;
  method?: string;
  body: string;
}

function stubFetch(
  respond: (call: RecordedCall) => { status: number; body: unknown }
) {
  const calls: RecordedCall[] = [];
  const original = globalThis.fetch;
  // biome-ignore lint/suspicious/noExplicitAny: test stub
  (globalThis as any).fetch = async (input: any, init: any = {}) => {
    const call: RecordedCall = {
      url: String(input),
      method: init?.method,
      body: init?.body ? String(init.body) : "",
    };
    calls.push(call);
    const { status, body } = respond(call);
    return new Response(
      typeof body === "string" ? body : JSON.stringify(body),
      { status }
    );
  };
  return {
    calls,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

function respondForCourseFinder(call: RecordedCall) {
  if (call.url.includes("/CourseFinder/GetAllDropDownList")) {
    return { status: 200, body: dropdownFixture };
  }
  if (call.url.includes("/CourseFinder/GetCourseList")) {
    return { status: 200, body: courseListFixture };
  }
  if (call.url.includes("/CourseFinder/GetCFData")) {
    const match = call.body.match(/Courseid=(\d+)/);
    const courseId = match ? match[1] : "";
    if (courseId && courseId in nstp101Fixture) {
      return {
        status: 200,
        body: (nstp101Fixture as Record<string, unknown>)[courseId],
      };
    }
    if (courseId && courseId in gerizalFixture) {
      return {
        status: 200,
        body: (gerizalFixture as Record<string, unknown>)[courseId],
      };
    }
    return { status: 200, body: [] };
  }
  throw new Error(`Unexpected fetch to unmapped endpoint: ${call.url}`);
}

test("NSTP101 resolves all 4 duplicate COURSE_CREATION_IDs (3400, 7455, 7953, 11009) and merges all 6 sections", async () => {
  const stub = stubFetch(respondForCourseFinder);
  try {
    const result = await scrapeCourseFromArchersHub("NSTP101", REAL_COOKIE, {
      bypassCache: true,
    });

    // Check network calls made to GetCFData
    const cfDataCalls = stub.calls.filter((c) =>
      c.url.includes("/CourseFinder/GetCFData")
    );

    // All 4 duplicate COURSE_CREATION_IDs must be queried
    assert.equal(
      cfDataCalls.length,
      4,
      `Expected 4 GetCFData calls for duplicate IDs (3400, 7455, 7953, 11009), got ${cfDataCalls.length}`
    );

    const expectedIds = ["3400", "7455", "7953", "11009"];
    for (const id of expectedIds) {
      assert.ok(
        cfDataCalls.some((c) => c.body.includes(`Courseid=${id}`)),
        `GetCFData must be called with Courseid=${id}`
      );
    }

    // Assert on returned Course object
    assert.equal(result.course.courseCode, "NSTP101");
    // 3400 (2 sections) + 7455 (1 section) + 7953 (1 section) + 11009 (2 sections) = 6 sections
    assert.equal(
      result.course.classes.length,
      6,
      `Expected 6 total merged sections (2+1+1+2), got ${result.course.classes.length}`
    );

    // Verify all 6 section names from the 4 IDs are present
    const sectionNames = result.course.classes.map((c) => c.section).sort();
    assert.deepEqual(sectionNames, [
      "A51C", // from ID 7455 (section creation ID 1859)
      "A52D", // from ID 7953 (section creation ID 2023)
      "C07B", // from ID 3400 (section creation ID 1929)
      "C08A", // from ID 3400 (section creation ID 1930)
      "S50A", // from ID 11009 (section creation ID 2126)
      "S50B", // from ID 11009 (section creation ID 2128)
    ]);

    // Verify section creation IDs
    const sectionCodes = result.course.classes
      .map((c) => c.code)
      .sort((a, b) => a - b);
    assert.deepEqual(sectionCodes, [1859, 1929, 1930, 2023, 2126, 2128]);

    // Validate against courseSchema
    assert.doesNotThrow(() => courseSchema.parse(result.course));
  } finally {
    stub.restore();
    clearCourseCache();
  }
});

test("GERIZAL queries all matched IDs (524, 11992) and gracefully handles empty second ID without error or dropping sections", async () => {
  const stub = stubFetch(respondForCourseFinder);
  try {
    const result = await scrapeCourseFromArchersHub("GERIZAL", REAL_COOKIE, {
      bypassCache: true,
    });

    const cfDataCalls = stub.calls.filter((c) =>
      c.url.includes("/CourseFinder/GetCFData")
    );

    // Both IDs should be queried
    assert.equal(
      cfDataCalls.length,
      2,
      `Expected 2 GetCFData calls (524, 11992), got ${cfDataCalls.length}`
    );
    assert.ok(
      cfDataCalls.some((c) => c.body.includes("Courseid=524")),
      "GetCFData must be called with Courseid=524"
    );
    assert.ok(
      cfDataCalls.some((c) => c.body.includes("Courseid=11992")),
      "GetCFData must be called with Courseid=11992"
    );

    // Merged classes must retain sections from ID 524 (real section count: 2)
    assert.equal(result.course.courseCode, "GERIZAL");
    assert.equal(
      result.course.classes.length,
      2,
      `Expected 2 sections from GERIZAL ID 524, got ${result.course.classes.length}`
    );

    const sections = result.course.classes.map((c) => c.section).sort();
    assert.deepEqual(sections, ["M14", "Y12"]);

    const codes = result.course.classes
      .map((c) => c.code)
      .sort((a, b) => a - b);
    assert.deepEqual(codes, [793, 2103]);

    // Validate against courseSchema
    assert.doesNotThrow(() => courseSchema.parse(result.course));
  } finally {
    stub.restore();
    clearCourseCache();
  }
});

test("course-list resolution uses filter semantics returning all matching entries instead of find", async () => {
  // Directly verify against sample-courselist-response.json
  const nstpEntries = courseListFixture.CourseDrp.filter((c) => {
    const nameParts = c.COURSE_NAME.split(" - ");
    return nameParts[0].trim().toUpperCase() === "NSTP101";
  });
  assert.equal(
    nstpEntries.length,
    4,
    "sample-courselist-response.json contains 4 matching entries for NSTP101"
  );
  assert.deepEqual(
    nstpEntries.map((e) => e.COURSE_CREATION_ID),
    [3400, 7455, 7953, 11009]
  );

  const gerizalEntries = courseListFixture.CourseDrp.filter((c) => {
    const nameParts = c.COURSE_NAME.split(" - ");
    return nameParts[0].trim().toUpperCase() === "GERIZAL";
  });
  assert.equal(
    gerizalEntries.length,
    2,
    "sample-courselist-response.json contains 2 matching entries for GERIZAL"
  );
  assert.deepEqual(
    gerizalEntries.map((e) => e.COURSE_CREATION_ID),
    [524, 11992]
  );

  // Demonstrate that .find() would drop subsequent matches
  const firstNstpOnly = courseListFixture.CourseDrp.find((c) => {
    const nameParts = c.COURSE_NAME.split(" - ");
    return nameParts[0].trim().toUpperCase() === "NSTP101";
  });
  assert.equal(firstNstpOnly?.COURSE_CREATION_ID, 3400);

  // When scraping NSTP101, all 4 IDs must be fetched via filter rather than find
  const stub = stubFetch(respondForCourseFinder);
  try {
    await scrapeCourseFromArchersHub("NSTP101", REAL_COOKIE, {
      bypassCache: true,
    });
    const cfDataCalls = stub.calls.filter((c) =>
      c.url.includes("/CourseFinder/GetCFData")
    );
    assert.equal(
      cfDataCalls.length,
      4,
      "Scraper must query all 4 filtered course IDs, not stop at 1 from .find()"
    );
  } finally {
    stub.restore();
    clearCourseCache();
  }
});

test("units value of 3.0 float in fixtures parses and normalizes to number 3", async () => {
  // classSchema must define `units` as a number property
  // @ts-expect-error -- classSchema.shape.units will exist post-fix
  assert.ok(
    // @ts-expect-error -- classSchema.shape.units will exist post-fix
    classSchema.shape.units,
    "classSchema must have a `units` field definition"
  );

  const stub = stubFetch(respondForCourseFinder);
  try {
    const result = await scrapeCourseFromArchersHub("GERIZAL", REAL_COOKIE, {
      bypassCache: true,
    });

    assert.ok(result.course.classes.length > 0);
    for (const cls of result.course.classes) {
      // In sample-cfdata-gerizal.json, CREDITS is 3.0
      // Post-fix, Class.units must be the integer number 3
      // @ts-expect-error -- units will exist on Class post-fix
      assert.equal(cls.units, 3, "GERIZAL 3.0 CREDITS must parse to number 3");
      // @ts-expect-error -- units will exist on Class post-fix
      assert.equal(typeof cls.units, "number");
    }

    const nstpResult = await scrapeCourseFromArchersHub(
      "NSTP101",
      REAL_COOKIE,
      {
        bypassCache: true,
      }
    );
    assert.ok(nstpResult.course.classes.length > 0);
    for (const cls of nstpResult.course.classes) {
      // In sample-cfdata-nstp101.json, CREDITS is 0.0
      // @ts-expect-error -- units will exist on Class post-fix
      assert.equal(cls.units, 0, "NSTP101 0.0 CREDITS must parse to number 0");
      // @ts-expect-error -- units will exist on Class post-fix
      assert.equal(typeof cls.units, "number");
    }
  } finally {
    stub.restore();
    clearCourseCache();
  }
});

test("SUBJECT_TYPE accepts free strings like 'Administrative / Residency' and 'Lecture' without restrictive enum validation", async () => {
  // classSchema must define `type` as a string property (not a closed enum)
  // @ts-expect-error -- classSchema.shape.type will exist post-fix
  assert.ok(
    // @ts-expect-error -- classSchema.shape.type will exist post-fix
    classSchema.shape.type,
    "classSchema must have a `type` field definition"
  );

  const stub = stubFetch(respondForCourseFinder);
  try {
    const result = await scrapeCourseFromArchersHub("NSTP101", REAL_COOKIE, {
      bypassCache: true,
    });

    // In sample-cfdata-nstp101.json, section A52D (ID 7953) has SUBJECT_TYPE: "Administrative / Residency"
    const a52d = result.course.classes.find((c) => c.section === "A52D");
    assert.ok(a52d, "Section A52D must be present in NSTP101");
    // @ts-expect-error -- type will exist on Class post-fix
    assert.equal(
      a52d.type,
      "Administrative / Residency",
      "Section A52D must have type 'Administrative / Residency'"
    );

    // Section C07B (ID 3400) has SUBJECT_TYPE: "Lecture"
    const c07b = result.course.classes.find((c) => c.section === "C07B");
    assert.ok(c07b, "Section C07B must be present in NSTP101");
    // @ts-expect-error -- type will exist on Class post-fix
    assert.equal(c07b.type, "Lecture", "Section C07B must have type 'Lecture'");

    // Verify classSchema parses arbitrary free string types without throwing
    const sampleClassData = {
      code: 9999,
      course: "TEST101",
      section: "T01",
      professor: "TEST PROF",
      schedules: [],
      enrolled: 10,
      enrollCap: 20,
      restriction: "",
      modality: "F2F" as const,
      remarks: "",
      type: "Administrative / Residency",
      units: 3,
      variant: "SPECIAL TRACK",
    };

    assert.doesNotThrow(
      () => classSchema.parse(sampleClassData),
      "classSchema must accept 'Administrative / Residency' as a valid type string"
    );
  } finally {
    stub.restore();
    clearCourseCache();
  }
});

test("classSchema includes variant field and scraper populates it from course titles", async () => {
  // classSchema must define `variant` property
  // @ts-expect-error -- classSchema.shape.variant will exist post-fix
  assert.ok(
    // @ts-expect-error -- classSchema.shape.variant will exist post-fix
    classSchema.shape.variant,
    "classSchema must have a `variant` field definition"
  );

  const stub = stubFetch(respondForCourseFinder);
  try {
    const result = await scrapeCourseFromArchersHub("NSTP101", REAL_COOKIE, {
      bypassCache: true,
    });

    const c07b = result.course.classes.find((c) => c.section === "C07B");
    assert.ok(c07b);
    // @ts-expect-error -- variant will exist on Class post-fix
    assert.ok(
      c07b.variant && typeof c07b.variant === "string",
      "Section C07B must have a variant string"
    );

    const a51c = result.course.classes.find((c) => c.section === "A51C");
    assert.ok(a51c);
    // @ts-expect-error -- variant will exist on Class post-fix
    assert.ok(
      a51c.variant && typeof a51c.variant === "string",
      "Section A51C must have a variant string"
    );
  } finally {
    stub.restore();
    clearCourseCache();
  }
});
