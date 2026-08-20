import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { validateArchersHubSession } from "../../../actions/course";
import { classSchema, courseSchema } from "../../definitions";
import sampleCourseResponse from "../fixtures/sample-course-response.json";
import {
  normalizeModality,
  parseArchersHubHtml,
  parseArchersHubJson,
  parseDays,
  parseTimeRange,
  timeStringToMilitary,
} from "../parsers";
import {
  clearCourseCache,
  formatSessionCookie,
  getMockCourse,
  scrapeCourseFromArchersHub,
} from "../scraper";
import { ArchersHubAuthError } from "../types";
import { analyzeSessionCookie } from "../validation";

test("parseDays parses single and compound DLSU day codes correctly", () => {
  assert.deepEqual(parseDays("M"), ["M"]);
  assert.deepEqual(parseDays("T"), ["T"]);
  assert.deepEqual(parseDays("W"), ["W"]);
  assert.deepEqual(parseDays("H"), ["H"]);
  assert.deepEqual(parseDays("TH"), ["H"]);
  assert.deepEqual(parseDays("THS"), ["H", "S"]);
  assert.deepEqual(parseDays("MW"), ["M", "W"]);
  assert.deepEqual(parseDays("MWF"), ["M", "W", "F"]);
  assert.deepEqual(parseDays("TF"), ["T", "F"]);
  assert.deepEqual(parseDays("M-W-F"), ["M", "W", "F"]);
  assert.deepEqual(parseDays("T,TH"), ["T", "H"]);
  assert.deepEqual(parseDays("MON/WED"), ["M", "W"]);
  assert.deepEqual(parseDays("TBA"), ["M"]);
  assert.deepEqual(parseDays(""), ["M"]);
});

test("timeStringToMilitary and parseTimeRange correctly convert all formats", () => {
  assert.equal(timeStringToMilitary("9:00 AM"), 900);
  assert.equal(timeStringToMilitary("09:00"), 900);
  assert.equal(timeStringToMilitary("1:30 PM"), 1330);
  assert.equal(timeStringToMilitary("12:00 PM"), 1200);
  assert.equal(timeStringToMilitary("12:00 AM"), 0);
  assert.equal(timeStringToMilitary("1415"), 1415);
  assert.equal(timeStringToMilitary("730"), 730);

  const t1 = parseTimeRange("0900 - 1030");
  assert.equal(t1.start, 900);
  assert.equal(t1.end, 1030);

  const t2 = parseTimeRange("9:00 AM - 10:30 AM");
  assert.equal(t2.start, 900);
  assert.equal(t2.end, 1030);

  const t3 = parseTimeRange("1:00 PM - 2:30 PM");
  assert.equal(t3.start, 1300);
  assert.equal(t3.end, 1430);

  const t4 = parseTimeRange("1300-1430");
  assert.equal(t4.start, 1300);
  assert.equal(t4.end, 1430);

  const t5 = parseTimeRange("0900 - 1215");
  assert.equal(t5.start, 900);
  assert.equal(t5.end, 1215);

  const t6 = parseTimeRange("TBA");
  assert.equal(t6.start, 0);
  assert.equal(t6.end, 0);
});

test("normalizeModality classifies modalities accurately", () => {
  assert.equal(normalizeModality("HYBRID"), "HYBRID");
  assert.equal(normalizeModality("Blended"), "HYBRID");
  assert.equal(normalizeModality("ONLINE"), "ONLINE");
  assert.equal(normalizeModality("Fully Online (Async)"), "ONLINE");
  assert.equal(
    normalizeModality("Predominantly Online"),
    "PREDOMINANTLY ONLINE"
  );
  assert.equal(normalizeModality("F2F"), "F2F");
  assert.equal(normalizeModality("Face-to-Face"), "F2F");
  assert.equal(normalizeModality("In-Person"), "F2F");
  assert.equal(normalizeModality("Tentative"), "TENTATIVE");
  assert.equal(normalizeModality(""), "F2F");
});

test("parseArchersHubJson parses sample-course-response.json into valid Class objects", () => {
  const classes = parseArchersHubJson(sampleCourseResponse);

  // Validate entire array against Zod schema
  const parsed = classSchema.array().parse(classes);
  assert.equal(parsed.length, 4);

  // Verify CCPROG1 section S11
  const ccprogS11 = parsed.find(
    (c) => c.course === "CCPROG1" && c.section === "S11"
  );
  assert.ok(ccprogS11);
  assert.equal(ccprogS11.code, 1024);
  assert.equal(ccprogS11.professor, "DELA CRUZ, JUAN");
  assert.equal(ccprogS11.modality, "HYBRID");
  assert.equal(ccprogS11.schedules.length, 2);
  assert.equal(ccprogS11.schedules[0].day, "M");
  assert.equal(ccprogS11.schedules[0].start, 900);
  assert.equal(ccprogS11.schedules[0].end, 1030);
  assert.equal(ccprogS11.schedules[0].room, "LS210");
  assert.equal(ccprogS11.schedules[1].day, "W");
  assert.equal(ccprogS11.schedules[1].start, 900);
  assert.equal(ccprogS11.schedules[1].end, 1200);
  assert.equal(ccprogS11.schedules[1].room, "G304B");

  // Verify GEETHIC section Z01
  const geethic = parsed.find((c) => c.course === "GEETHIC");
  assert.ok(geethic);
  assert.equal(geethic.modality, "ONLINE");
  assert.equal(geethic.schedules[0].day, "H");
  assert.equal(geethic.schedules[0].isOnline, true);
  assert.equal(geethic.schedules[0].start, 1100);
  assert.equal(geethic.schedules[0].end, 1230);
});

test("parseArchersHubHtml parses sample-course-table.html into valid Class objects", () => {
  const htmlPath = path.join(__dirname, "../fixtures/sample-course-table.html");
  const htmlContent = fs.readFileSync(htmlPath, "utf-8");

  const classes = parseArchersHubHtml(htmlContent, "CCPROG1");

  // Validate entire array against Zod schema
  const parsed = classSchema.array().parse(classes);
  assert.equal(parsed.length, 3);

  const s11 = parsed[0];
  assert.equal(s11.section, "S11");
  assert.equal(s11.code, 1024);
  assert.equal(s11.professor, "DELA CRUZ, JUAN");
  assert.equal(s11.schedules[0].day, "M");
  assert.equal(s11.schedules[0].start, 900);
  assert.equal(s11.schedules[0].end, 1030);
  assert.equal(s11.schedules[0].room, "LS210");

  const s12 = parsed[1];
  assert.equal(s12.section, "S12");
  // TF expanded to T and F
  assert.equal(s12.schedules.length, 2);
  assert.equal(s12.schedules[0].day, "T");
  assert.equal(s12.schedules[1].day, "F");

  const s13 = parsed[2];
  assert.equal(s13.section, "S13");
  // THS expanded to H and S
  assert.equal(s13.schedules.length, 2);
  assert.equal(s13.schedules[0].day, "H");
  assert.equal(s13.schedules[1].day, "S");
  assert.equal(s13.schedules[0].isOnline, true);
});

test("formatSessionCookie formats raw strings or headers properly", () => {
  assert.equal(formatSessionCookie(""), "");
  assert.equal(
    formatSessionCookie("connect.sid=s%3A123; path=/"),
    "connect.sid=s%3A123; path=/"
  );
  assert.equal(
    formatSessionCookie("abc123token"),
    "session=abc123token; ArchersHubAuth=abc123token; token=abc123token; .AspNetCore.Cookies=abc123token; ASP.NET_SessionId=abc123token"
  );
});

test("getMockCourse generates valid schema-compliant courses", () => {
  const course = getMockCourse("CCPROG1");
  assert.equal(course.courseCode, "CCPROG1");
  assert.ok(course.classes.length > 0);
  assert.doesNotThrow(() => courseSchema.parse(course));

  const customMock = getMockCourse("CSARCH1");
  assert.equal(customMock.courseCode, "CSARCH1");
  assert.ok(customMock.classes.length > 0);
  assert.doesNotThrow(() => courseSchema.parse(customMock));

  const gerizalMock = getMockCourse("GERIZAL");
  assert.equal(gerizalMock.courseCode, "GERIZAL");
  assert.ok(gerizalMock.classes.length > 0);
  assert.doesNotThrow(() => courseSchema.parse(gerizalMock));
});

test("scrapeCourseFromArchersHub works in mock/demo mode for CCPROG1 and GERIZAL", async () => {
  const result = await scrapeCourseFromArchersHub("CCPROG1", "MOCK_SESSION");
  assert.ok(result.course);
  assert.equal(result.course.courseCode, "CCPROG1");
  assert.equal(result.course.classes.length, 2);
  assert.doesNotThrow(() => courseSchema.parse(result.course));

  // Test lowercase input normalization e.g. "gerizal"
  const gerizalResult = await scrapeCourseFromArchersHub(
    "gerizal",
    "MOCK_SESSION"
  );
  assert.ok(gerizalResult.course);
  assert.equal(gerizalResult.course.courseCode, "GERIZAL");
  assert.ok(gerizalResult.course.classes.length > 0);
  assert.doesNotThrow(() => courseSchema.parse(gerizalResult.course));
});

test("scrapeCourseFromArchersHub isolates mock cache from live requests", async () => {
  clearCourseCache();

  // 1. Fetch in mock mode - should populate mock cache
  const mockResult1 = await scrapeCourseFromArchersHub(
    "GERIZAL",
    "MOCK_SESSION"
  );
  assert.equal(mockResult1.isCached, false);
  assert.equal(mockResult1.course.courseCode, "GERIZAL");

  // 2. Fetch again in mock mode - should hit mock cache
  const mockResult2 = await scrapeCourseFromArchersHub(
    "GERIZAL",
    "MOCK_SESSION"
  );
  assert.equal(mockResult2.isCached, true);

  // 3. Attempt live request with real-format cookie - should NOT return the mock cache
  // In test environment without network/credentials, this will attempt live network fetch
  // and fail with auth/network error rather than returning cached mock data with isCached: true
  let hitMockCache = false;
  try {
    const liveResult = await scrapeCourseFromArchersHub(
      "GERIZAL",
      "valid_looking_live_token_xyz",
      { timeoutMs: 300, maxRetries: 0 }
    );

    // If by some chance liveResult succeeded, ensure it was not the mock cache
    if (liveResult.isCached) {
      hitMockCache = true;
    }
  } catch (_err) {
    // Expected behavior: live request does not hit the mock cache and attempts network call
    hitMockCache = false;
  }

  assert.equal(
    hitMockCache,
    false,
    "Live request must not return mock cached course"
  );
});

test("clearCourseCache clears all stored cache entries", async () => {
  clearCourseCache();

  const res1 = await scrapeCourseFromArchersHub("CCPROG1", "MOCK_SESSION");
  assert.equal(res1.isCached, false);

  const res2 = await scrapeCourseFromArchersHub("CCPROG1", "MOCK_SESSION");
  assert.equal(res2.isCached, true);

  clearCourseCache();

  const res3 = await scrapeCourseFromArchersHub("CCPROG1", "MOCK_SESSION");
  assert.equal(res3.isCached, false);
});

test("analyzeSessionCookie identifies affinity-only cookies and distinguishes authentic credentials", () => {
  // Affinity only
  const affinityCookie =
    "ApplicationGatewayAffinityCORS=efbd9facb6f6e984a572d91915bfa51a; ApplicationGatewayAffinity=efbd9facb6f6e984a572d91915bfa51a";
  const analysisAffinity = analyzeSessionCookie(affinityCookie);
  assert.equal(analysisAffinity.isValid, false);
  assert.equal(analysisAffinity.isAffinityOnly, true);
  assert.equal(analysisAffinity.isUnauthenticatedOnly, false);
  assert.equal(analysisAffinity.hasAuthToken, false);
  assert.ok(
    analysisAffinity.warningMessage?.includes("ApplicationGatewayAffinity")
  );

  // Exact user cookie from prompt with CSRF token and anonymous SID
  const userPreLoginCookie =
    "ApplicationGatewayAffinityCORS=efbd9facb6f6e984a572d91915bfa51a; ApplicationGatewayAffinity=efbd9facb6f6e984a572d91915bfa51a; __RequestVerificationToken=59zjuoS3St_tiSa1qMxEXPgiqkNjxIlmxsslBm_AW488vLyI7q_iHK5hfl-oTBrk7YET0t0uAdnJSt3eH64gh5hYpNrKHr8z7hvZt4KR95E1; cf_clearance=8lmZB3xeJQQ77neLk5_i8AXGEU_D8FYscxnbLARyOFA-1787133911-1.2.1.1; __Secure-SID=3huocv4ar3zyymsvzfphqhs2";
  const analysisPreLogin = analyzeSessionCookie(userPreLoginCookie);
  assert.equal(analysisPreLogin.isValid, false);
  assert.equal(analysisPreLogin.isAffinityOnly, false);
  assert.equal(analysisPreLogin.isUnauthenticatedOnly, true);
  assert.equal(analysisPreLogin.hasAuthToken, false);
  assert.ok(
    analysisPreLogin.warningMessage?.includes("login page") ||
      analysisPreLogin.warningMessage?.includes("anti-forgery")
  );

  // Empty string
  const analysisEmpty = analyzeSessionCookie("");
  assert.equal(analysisEmpty.isValid, false);
  assert.equal(analysisEmpty.isAffinityOnly, false);
  assert.equal(analysisEmpty.isUnauthenticatedOnly, false);

  // Demo / Mock Mode
  const analysisMock = analyzeSessionCookie("MOCK_SESSION");
  assert.equal(analysisMock.isValid, true);
  assert.equal(analysisMock.isMock, true);

  const analysisDemo = analyzeSessionCookie("DEMO");
  assert.equal(analysisDemo.isValid, true);
  assert.equal(analysisDemo.isMock, true);

  // Full cookie string with ASP.NET session + Application Gateway
  const fullCookie =
    "ApplicationGatewayAffinityCORS=efbd9facb6f6e984a572d91915bfa51a; ApplicationGatewayAffinity=efbd9facb6f6e984a572d91915bfa51a; .AspNetCore.Cookies=CfDJ8N5...";
  const analysisFull = analyzeSessionCookie(fullCookie);
  assert.equal(analysisFull.isValid, true);
  assert.equal(analysisFull.isAffinityOnly, false);
  assert.equal(analysisFull.isUnauthenticatedOnly, false);
  assert.equal(analysisFull.hasAuthToken, true);

  // Raw token string
  const analysisRaw = analyzeSessionCookie(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
  );
  assert.equal(analysisRaw.isValid, true);
  assert.equal(analysisRaw.hasAuthToken, true);
});

test("scrapeCourseFromArchersHub throws descriptive ArchersHubAuthError on affinity-only and pre-login cookies", async () => {
  const userCookie =
    "ApplicationGatewayAffinityCORS=efbd9facb6f6e984a572d91915bfa51a; ApplicationGatewayAffinity=efbd9facb6f6e984a572d91915bfa51a";

  await assert.rejects(
    async () => {
      await scrapeCourseFromArchersHub("CCPROG1", userCookie);
    },
    (err: Error) => {
      assert.ok(err instanceof ArchersHubAuthError);
      assert.ok(err.message.includes("Azure Gateway routing cookies"));
      return true;
    }
  );

  const preLoginCookie =
    "ApplicationGatewayAffinity=efbd9facb6f6e984a572d91915bfa51a; __RequestVerificationToken=59zjuoS3St_tiSa; __Secure-SID=3huocv4ar3zyymsvzfphqhs2";

  await assert.rejects(
    async () => {
      await scrapeCourseFromArchersHub("GERIZAL", preLoginCookie);
    },
    (err: Error) => {
      assert.ok(err instanceof ArchersHubAuthError);
      assert.ok(
        err.message.includes("login page") ||
          err.message.includes("anti-forgery")
      );
      return true;
    }
  );
});

test("validateArchersHubSession validates cookies and flags affinity-only and pre-login strings", async () => {
  const userCookie =
    "ApplicationGatewayAffinityCORS=efbd9facb6f6e984a572d91915bfa51a; ApplicationGatewayAffinity=efbd9facb6f6e984a572d91915bfa51a";
  const validationAffinity = await validateArchersHubSession(userCookie);
  assert.equal(validationAffinity.success, false);
  assert.equal(validationAffinity.isAffinityOnly, true);
  assert.ok(validationAffinity.error?.includes("ApplicationGatewayAffinity"));

  const preLoginCookie =
    "ApplicationGatewayAffinity=efbd9facb6f6e984a572d91915bfa51a; __RequestVerificationToken=59zjuoS3St; __Secure-SID=3huocv4ar3zyymsvzfphqhs2";
  const validationPreLogin = await validateArchersHubSession(preLoginCookie);
  assert.equal(validationPreLogin.success, false);
  assert.equal(validationPreLogin.isUnauthenticatedOnly, true);
  assert.ok(
    validationPreLogin.error?.includes("login page") ||
      validationPreLogin.error?.includes("anti-forgery")
  );

  const validationMock = await validateArchersHubSession("MOCK_SESSION");
  assert.equal(validationMock.success, true);
  assert.equal(validationMock.isMock, true);

  const validationFull = await validateArchersHubSession(
    "ASP.NET_SessionId=xyz123; ApplicationGatewayAffinity=abc"
  );
  assert.equal(validationFull.success, true);
});
