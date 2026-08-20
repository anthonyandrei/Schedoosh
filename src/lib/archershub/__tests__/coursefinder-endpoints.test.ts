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
// 155). sample-cfdata-nstp101.json and sample-cfdata-gerizal.json are
// additional verbatim captures, keyed by COURSE_CREATION_ID, covering
// course codes that resolve to more than one course id (NSTP101: 4 ids,
// GERIZAL: 2, one of which legitimately has zero live sections). This
// file is frozen for offload workers.
//
// START_DATE/END_DATE on every row is the academic term range, identical
// across the whole university — not a per-section date. Schedule.date
// must stay empty ("") for a regular weekly meeting; it is a sentinel
// for one-off, non-repeating sessions, which ArchersHub never sends.
// Section S48B's SCHEDULE string also contains two Friday bookings at
// the same time in different rooms (G302A, G302B) — one class held in
// two rooms, not two classes — which the parser must merge into a
// single Schedule with a joined room string.

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
    assert.equal(s20g!.modality, "HYBRID");
    assert.equal(s20g!.schedules.length, 2);
    assert.equal(s20g!.schedules[0].day, "F");
    assert.equal(s20g!.schedules[0].start, 915);
    assert.equal(s20g!.schedules[0].end, 1045);
    assert.equal(s20g!.schedules[0].room, "G302A");
    assert.equal(s20g!.schedules[0].isOnline, false);
    // date is a one-off-session sentinel, not the academic term range.
    // START_DATE/END_DATE (07/10/2026 - 12/09/2026) is identical across
    // every section in the university and must never be written here.
    assert.equal(s20g!.schedules[0].date, "");
    assert.equal(s20g!.schedules[1].day, "T");
    assert.equal(s20g!.schedules[1].start, 915);
    assert.equal(s20g!.schedules[1].end, 1045);
    assert.equal(s20g!.schedules[1].room, "Online");
    assert.equal(s20g!.schedules[1].isOnline, true);
    assert.equal(s20g!.schedules[1].date, "");

    const s48b = result.course.classes.find((c) => c.section === "S48B");
    assert.ok(s48b, "section S48B must be present");
    assert.equal(s48b!.enrolled, 30);
    assert.equal(s48b!.enrollCap, 40);
    // Live SCHEDULE had two Friday 07:30-09:00 bookings in different
    // rooms (G302A, G302B) plus one Tuesday online meeting: one class
    // held across two rooms, not two classes. Must merge to 2 schedules,
    // not 3, with the Friday room joined.
    assert.equal(s48b!.schedules.length, 2);
    const s48bFriday = s48b!.schedules.find((s) => s.day === "F");
    assert.ok(s48bFriday, "Friday schedule must be present");
    assert.equal(s48bFriday!.start, 730);
    assert.equal(s48bFriday!.end, 900);
    assert.equal(s48bFriday!.room, "G302A, G302B");
    assert.equal(s48bFriday!.isOnline, false);
    const s48bTuesday = s48b!.schedules.find((s) => s.day === "T");
    assert.ok(s48bTuesday, "Tuesday schedule must be present");
    assert.equal(s48bTuesday!.room, "Online");
    assert.equal(s48bTuesday!.isOnline, true);
    // MAIN_TEACHER was "" in the live payload for this section; the
    // parser must not crash or fabricate a name.
    assert.equal(typeof s48b!.professor, "string");

    const s45 = result.course.classes.find((c) => c.section === "S45");
    assert.ok(s45, "section S45 must be present");
    // Live SCHEDULE had four entries, two per day at the same time:
    // Monday paired a roomless entry ("[ MONDAY - 07:30 AM - 09:00 AM ]",
    // falls back to the TBA placeholder) with a real-room duplicate
    // (L230) — a garbled duplicate row, not a second physical room.
    // Thursday paired two real, distinct rooms (G302B, G304A) — a
    // genuine same-slot multi-room booking, like S48B's Friday.
    // Merging by (day, start, end): a TBA placeholder is dropped in
    // favor of a real room in the same group; two or more real rooms
    // in the same group are joined. Must not throw.
    assert.equal(s45!.schedules.length, 2);
    const s45Monday = s45!.schedules.find((s) => s.day === "M");
    assert.ok(s45Monday, "Monday schedule must be present");
    assert.equal(s45Monday!.start, 730);
    assert.equal(s45Monday!.end, 900);
    assert.equal(s45Monday!.room, "L230");
    const s45Thursday = s45!.schedules.find((s) => s.day === "H");
    assert.ok(s45Thursday, "Thursday schedule must be present");
    assert.equal(s45Thursday!.start, 730);
    assert.equal(s45Thursday!.end, 900);
    assert.equal(s45Thursday!.room, "G302B, G304A");
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
