import assert from "node:assert/strict";
import test from "node:test";
import { validateArchersHubSession } from "../../../actions/course";

// Regression coverage: validateArchersHubSession must decide validity by
// ASKING ArchersHub, not by guessing from cookie names. Live evidence
// (captured via Chrome against the real, logged-in portal):
//
//   - GET /StudentDashboard while logged in returns a page containing
//     `IsLoggedIn` / `userID` / `hdnStudId` hidden-field markers.
//   - GET /StudentDashboard while logged out (or with an expired/garbage
//     cookie) redirects to the login page (title "Login").
//   - A Cloudflare challenge page contains "challenges.cloudflare.com" /
//     "cf-turnstile" / the "Just a moment..." title.
//
// This file is frozen for offload workers. It defines the contract
// src/actions/course.ts must satisfy for validateArchersHubSession.

const REAL_COOKIE =
  "ApplicationGatewayAffinityCORS=efbd9facb6f6e984a572d91915bfa51a; ApplicationGatewayAffinity=efbd9facb6f6e984a572d91915bfa51a; __RequestVerificationToken=59zjuoS3St_tiSa1qMxEXPgiqkNjxIlmxsslBm_AW488vLyI7q_iHK5hfl-oTBrk7YET0t0uAdnJSt3eH64gh5hYpNrKHr8z7hvZt4KR95E1; cf_clearance=8lmZB3xeJQQ77neLk5_i8AXGEU_D8FYscxnbLARyOFA-1787133911-1.2.1.1; __Secure-SID=3huocv4ar3zyymsvzfphqhs2";

const LOGGED_IN_HTML = `<!DOCTYPE html><html><head><title>Index</title></head>
<body>
<input type="hidden" id="IsLoggedIn" value="1" />
<input type="hidden" id="userID" value="12345" />
<input type="hidden" id="hdnStudId" value="98765" />
</body></html>`;

const LOGIN_PAGE_HTML = `<!DOCTYPE html><html><head><title>Login</title></head>
<body class="student-login"><form id="StudentLogin"></form></body></html>`;

const CLOUDFLARE_HTML = `<!DOCTYPE html><html><head><title>Just a moment...</title></head>
<body><div class="cf-turnstile"></div><script src="https://challenges.cloudflare.com/turnstile"></script></body></html>`;

function stubFetch(
  impl: (url: string, init?: RequestInit) => Promise<Response>
) {
  const original = globalThis.fetch;
  let calls = 0;
  // biome-ignore lint/suspicious/noExplicitAny: test stub
  (globalThis as any).fetch = (...args: any[]) => {
    calls++;
    return impl(args[0], args[1]);
  };
  return {
    getCalls: () => calls,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

test("a logged-in probe response reports success", async () => {
  const stub = stubFetch(async (url) => {
    assert.ok(String(url).includes("archershub.dlsu.edu.ph"));
    return new Response(LOGGED_IN_HTML, { status: 200 });
  });
  try {
    const result = await validateArchersHubSession(REAL_COOKIE);
    assert.equal(result.success, true);
    assert.equal(stub.getCalls(), 1);
  } finally {
    stub.restore();
  }
});

test("a login-page probe response reports failure without 'pre-login' wording", async () => {
  const stub = stubFetch(
    async () => new Response(LOGIN_PAGE_HTML, { status: 200 })
  );
  try {
    const result = await validateArchersHubSession(REAL_COOKIE);
    assert.equal(result.success, false);
    assert.ok(!/pre-login/i.test(result.error || ""));
  } finally {
    stub.restore();
  }
});

test("a login-page response for an affinity-only cookie explains the HttpOnly limitation", async () => {
  const stub = stubFetch(
    async () => new Response(LOGIN_PAGE_HTML, { status: 200 })
  );
  try {
    const affinityOnly =
      "ApplicationGatewayAffinityCORS=efbd9facb6f6e984a572d91915bfa51a; ApplicationGatewayAffinity=efbd9facb6f6e984a572d91915bfa51a";
    const result = await validateArchersHubSession(affinityOnly);
    assert.equal(result.success, false);
    assert.equal(result.isAffinityOnly, true);
  } finally {
    stub.restore();
  }
});

test("a Cloudflare challenge response is reported distinctly, not as a login failure", async () => {
  const stub = stubFetch(
    async () => new Response(CLOUDFLARE_HTML, { status: 403 })
  );
  try {
    const result = await validateArchersHubSession(REAL_COOKIE);
    assert.equal(result.success, false);
    assert.equal(result.cloudflareBlocked, true);
  } finally {
    stub.restore();
  }
});

test("MOCK_SESSION and DEMO short-circuit without a network call", async () => {
  const stub = stubFetch(async () => {
    throw new Error("fetch must not be called for mock/demo sessions");
  });
  try {
    const mock = await validateArchersHubSession("MOCK_SESSION");
    assert.equal(mock.success, true);
    assert.equal(mock.isMock, true);

    const demo = await validateArchersHubSession("DEMO");
    assert.equal(demo.success, true);
    assert.equal(demo.isMock, true);

    assert.equal(stub.getCalls(), 0);
  } finally {
    stub.restore();
  }
});

test("empty input fails without a network call", async () => {
  const stub = stubFetch(async () => {
    throw new Error("fetch must not be called for empty input");
  });
  try {
    const result = await validateArchersHubSession("");
    assert.equal(result.success, false);
    assert.equal(stub.getCalls(), 0);
  } finally {
    stub.restore();
  }
});

test("ValidateSessionResult no longer carries isUnauthenticatedOnly", async () => {
  const stub = stubFetch(
    async () => new Response(LOGIN_PAGE_HTML, { status: 200 })
  );
  try {
    const result = await validateArchersHubSession(REAL_COOKIE);
    assert.equal(
      // @ts-expect-error -- the field must no longer exist on the type
      result.isUnauthenticatedOnly,
      undefined
    );
  } finally {
    stub.restore();
  }
});
