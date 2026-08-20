import assert from "node:assert/strict";
import test from "node:test";
import cfDataFixture from "../fixtures/sample-cfdata-response.json";
import courseListFixture from "../fixtures/sample-courselist-response.json";
import dropdownFixture from "../fixtures/sample-dropdown-response.json";
import { clearCourseCache, scrapeCourseFromArchersHub } from "../scraper";
import { ArchersHubCourseNotFoundError } from "../types";

// Regression coverage: ARCHERSHUB_ENDPOINTS pointed at invented paths
// (/api/offerings, /api/courses/search, /api/user/session, /courses/view)
// that all 404 on the real portal ("The controller for path '_api_offerings'
// was not found or does not implement IController" — classic ASP.NET MVC
// 404, captured live while authenticated). The real, observed API is:
//
//   POST /CourseFinder/GetAllDropDownList          -> { CampusDrp, SessionDrp }
//   POST /CourseFinder/GetCourseList  {Campusno, AcademicSession}
//                                                    -> { CourseDrp: [{COURSE_CREATION_ID, COURSE_NAME}] }
//   POST /CourseFinder/GetCFData {Campusno, AcademicSession, Courseid}
//                                                    -> [{SECTION_NAME, MAIN_TEACHER, SCHEDULE, ...}]
//
// A course with zero live offerings returns HTTP 200 with body `[]` — not
// a 404 — so "not found" must be inferred from an empty array, not a
// non-2xx status.
//
// Fixtures under src/lib/archershub/fixtures/sample-*.json were captured
// verbatim from the live, authenticated portal (course: CCPROG1,
// Courseid 5125, Manila/Campusno 7, AY 2026-2027 Term 1/AcademicSession
// 155). This file is frozen for offload workers.

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

function respondByEndpoint(call: RecordedCall) {
  if (call.url.includes("/CourseFinder/GetAllDropDownList")) {
    return { status: 200, body: dropdownFixture };
  }
  if (call.url.includes("/CourseFinder/GetCourseList")) {
    return { status: 200, body: courseListFixture };
  }
  if (call.url.includes("/CourseFinder/GetCFData")) {
    return { status: 200, body: cfDataFixture };
  }
  throw new Error(`Unexpected fetch to unmapped endpoint: ${call.url}`);
}

test("scrapeCourseFromArchersHub hits only real /CourseFinder/* endpoints, never /api/*", async () => {
  const stub = stubFetch(respondByEndpoint);
  try {
    await scrapeCourseFromArchersHub("CCPROG1", REAL_COOKIE, {
      bypassCache: true,
    });

    assert.ok(stub.calls.length > 0, "expected at least one network call");
    for (const call of stub.calls) {
      assert.ok(
        !call.url.includes("/api/"),
        `must not call the invented /api/* surface, got: ${call.url}`
      );
    }

    const courseListCall = stub.calls.find((c) =>
      c.url.includes("/CourseFinder/GetCourseList")
    );
    assert.ok(courseListCall, "must resolve the course code via GetCourseList");

    const cfDataCall = stub.calls.find((c) =>
      c.url.includes("/CourseFinder/GetCFData")
    );
    assert.ok(cfDataCall, "must fetch offerings via GetCFData");
    assert.ok(
      cfDataCall!.body.includes("5125"),
      "must resolve CCPROG1 to its real Courseid (5125) before requesting offerings"
    );

    // GetCFData must run after GetCourseList resolves the id.
    const courseListIdx = stub.calls.indexOf(courseListCall!);
    const cfDataIdx = stub.calls.indexOf(cfDataCall!);
    assert.ok(courseListIdx < cfDataIdx);
  } finally {
    stub.restore();
    clearCourseCache();
  }
});

test("scrapeCourseFromArchersHub parses the real GetCFData payload into Course/Class objects", async () => {
  const stub = stubFetch(respondByEndpoint);
  try {
    const result = await scrapeCourseFromArchersHub("CCPROG1", REAL_COOKIE, {
      bypassCache: true,
    });

    assert.equal(result.course.courseCode, "CCPROG1");
    assert.equal(result.course.classes.length, 3);

    const s20g = result.course.classes.find((c) => c.section === "S20G");
    assert.ok(s20g, "section S20G must be present");
    assert.equal(s20g!.professor, "Louis Lu");
    assert.equal(s20g!.schedules.length, 2);

    const s48b = result.course.classes.find((c) => c.section === "S48B");
    assert.ok(s48b, "section S48B must be present");
    assert.equal(s48b!.enrolled, 30);
    assert.equal(s48b!.enrollCap, 40);
    assert.equal(s48b!.schedules.length, 3);
    // MAIN_TEACHER was "" in the live payload for this section; the
    // parser must not crash or fabricate a name.
    assert.equal(typeof s48b!.professor, "string");

    const s45 = result.course.classes.find((c) => c.section === "S45");
    assert.ok(s45, "section S45 must be present");
    // Live schedule text included a meeting segment with no room at all:
    // "[ MONDAY - 07:30 AM - 09:00 AM   ]" — must not throw, must fall
    // back to a placeholder room rather than crash the parse.
    assert.equal(s45!.schedules.length, 4);
    for (const sched of s45!.schedules) {
      assert.equal(typeof sched.room, "string");
      assert.ok(sched.room.length > 0);
    }
  } finally {
    stub.restore();
    clearCourseCache();
  }
});

test("an empty GetCFData array (HTTP 200, body []) is treated as course-not-found, not a crash", async () => {
  const stub = stubFetch((call) => {
    if (call.url.includes("/CourseFinder/GetAllDropDownList")) {
      return { status: 200, body: dropdownFixture };
    }
    if (call.url.includes("/CourseFinder/GetCourseList")) {
      return { status: 200, body: courseListFixture };
    }
    if (call.url.includes("/CourseFinder/GetCFData")) {
      return { status: 200, body: [] };
    }
    throw new Error(`Unexpected fetch: ${call.url}`);
  });
  try {
    await assert.rejects(
      () =>
        scrapeCourseFromArchersHub("CCPROG1", REAL_COOKIE, {
          bypassCache: true,
        }),
      (err: Error) => {
        assert.ok(err instanceof ArchersHubCourseNotFoundError);
        return true;
      }
    );
  } finally {
    stub.restore();
    clearCourseCache();
  }
});

test("a course code absent from GetCourseList is reported as not-found", async () => {
  const stub = stubFetch((call) => {
    if (call.url.includes("/CourseFinder/GetAllDropDownList")) {
      return { status: 200, body: dropdownFixture };
    }
    if (call.url.includes("/CourseFinder/GetCourseList")) {
      return { status: 200, body: courseListFixture };
    }
    throw new Error(
      `GetCFData must not be called for an unresolved course code, got: ${call.url}`
    );
  });
  try {
    await assert.rejects(
      () =>
        scrapeCourseFromArchersHub("ZZFAKECODE9", REAL_COOKIE, {
          bypassCache: true,
        }),
      (err: Error) => {
        assert.ok(err instanceof ArchersHubCourseNotFoundError);
        return true;
      }
    );
  } finally {
    stub.restore();
    clearCourseCache();
  }
});
