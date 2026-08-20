import assert from "node:assert/strict";
import test from "node:test";
import { analyzeSessionCookie } from "../validation";

// Regression coverage for the false "Pre-Login Cookie Detected" bug.
//
// Root cause: analyzeSessionCookie judged validity purely by matching cookie
// NAMES against hardcoded allow/deny lists. The site's real session cookie
// is HttpOnly (confirmed live: document.cookie shows only the two
// ApplicationGatewayAffinity* cookies both logged out AND logged in at
// /StudentDashboard), so its name was never actually observed by anyone —
// __Secure-SID got denylisted as "pre-login CSRF" on no evidence, which
// rejected a real, live, logged-in session.
//
// This file is frozen for offload workers. It defines the contract
// validation.ts must satisfy, not the other way around.

test("the user's real logged-in cookie capture analyzes as valid", () => {
  // Captured verbatim from DevTools Network tab while authenticated on
  // archershub.dlsu.edu.ph (values are the ones the user actually pasted).
  const realLoggedInCookie =
    "ApplicationGatewayAffinityCORS=efbd9facb6f6e984a572d91915bfa51a; ApplicationGatewayAffinity=efbd9facb6f6e984a572d91915bfa51a; __RequestVerificationToken=59zjuoS3St_tiSa1qMxEXPgiqkNjxIlmxsslBm_AW488vLyI7q_iHK5hfl-oTBrk7YET0t0uAdnJSt3eH64gh5hYpNrKHr8z7hvZt4KR95E1; cf_clearance=8lmZB3xeJQQ77neLk5_i8AXGEU_D8FYscxnbLARyOFA-1787133911-1.2.1.1; __Secure-SID=3huocv4ar3zyymsvzfphqhs2";

  const analysis = analyzeSessionCookie(realLoggedInCookie);

  // This is the crux of the bug: this cookie is real and logged-in.
  // analyzeSessionCookie cannot know that from names alone (the auth
  // cookie is HttpOnly and unnamed here), so it must not claim isValid:
  // false on name-matching grounds anymore. The actual login state is a
  // job for a live probe (src/actions/course.ts), not this function.
  assert.equal(
    analysis.isValid,
    true,
    "a cookie string is not falsifiable as pre-login by name alone; analyzeSessionCookie must stop rejecting it"
  );
  assert.equal(analysis.isAffinityOnly, false);

  // The isUnauthenticatedOnly concept encoded exactly this wrong
  // assumption and must be gone from the result shape entirely.
  assert.equal(
    // @ts-expect-error -- the field must no longer exist on the type
    analysis.isUnauthenticatedOnly,
    undefined
  );
});

test("__Secure-SID is never treated as a pre-login artifact", () => {
  const cookieWithSecureSidOnly =
    "ApplicationGatewayAffinity=efbd9facb6f6e984a572d91915bfa51a; __Secure-SID=3huocv4ar3zyymsvzfphqhs2";
  const analysis = analyzeSessionCookie(cookieWithSecureSidOnly);
  assert.equal(analysis.isValid, true);
});

test("affinity-only cookies still surface as an incomplete-cookie hint", () => {
  const affinityOnly =
    "ApplicationGatewayAffinityCORS=efbd9facb6f6e984a572d91915bfa51a; ApplicationGatewayAffinity=efbd9facb6f6e984a572d91915bfa51a";
  const analysis = analyzeSessionCookie(affinityOnly);
  assert.equal(analysis.isAffinityOnly, true);
  assert.ok(analysis.warningMessage?.includes("ApplicationGatewayAffinity"));
});

test("empty and unparseable input still reject", () => {
  const empty = analyzeSessionCookie("");
  assert.equal(empty.isValid, false);

  const nullish = analyzeSessionCookie(null);
  assert.equal(nullish.isValid, false);

  const tooShort = analyzeSessionCookie("abc");
  assert.equal(tooShort.isValid, false);
});

test("mock and demo session flags still pass", () => {
  const mock = analyzeSessionCookie("MOCK_SESSION");
  assert.equal(mock.isValid, true);
  assert.equal(mock.isMock, true);

  const demo = analyzeSessionCookie("DEMO");
  assert.equal(demo.isValid, true);
  assert.equal(demo.isMock, true);
});

test("a raw token string without key=value pairs still passes", () => {
  const raw = analyzeSessionCookie("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
  assert.equal(raw.isValid, true);
});

test("a full cookie string with a real ASP.NET auth cookie name still passes", () => {
  const fullCookie =
    "ApplicationGatewayAffinityCORS=efbd9facb6f6e984a572d91915bfa51a; ApplicationGatewayAffinity=efbd9facb6f6e984a572d91915bfa51a; .AspNetCore.Cookies=CfDJ8N5...";
  const analysis = analyzeSessionCookie(fullCookie);
  assert.equal(analysis.isValid, true);
  assert.equal(analysis.isAffinityOnly, false);
});
