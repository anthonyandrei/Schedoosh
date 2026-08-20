export interface CookieAnalysisResult {
  isValid: boolean;
  isMock: boolean;
  isAffinityOnly: boolean;
  hasAuthToken: boolean;
  cookieKeys: string[];
  warningMessage?: string;
}

const GATEWAY_ANALYTICS_KEYS = new Set([
  "applicationgatewayaffinity",
  "applicationgatewayaffinitycors",
  "_ga",
  "_gid",
  "_gat",
  "__cf_bm",
  "cf_clearance",
  "_cfuvid",
  "_clck",
  "_clsk",
]);

const AUTH_KEY_PATTERNS = [
  "aspnet",
  "aspcore",
  "asp.net",
  ".aspnet",
  ".aspnetcore",
  "rf_auth",
  "rf_cookie",
  "rfcampus",
  "student_auth",
  "user_auth",
  "auth_token",
  "access_token",
  "authorization",
  "connect.sid",
  "jsessionid",
  "phpsessid",
  "jwt",
  "bearer",
  "sessionid",
  "__secure-sid",
  "__secure-",
  "requestverificationtoken",
];

/**
 * Analyzes a raw session cookie or token string to diagnose whether it contains
 * actual authentication tokens or only Azure Gateway cookies.
 */
export function analyzeSessionCookie(
  rawInput?: string | null
): CookieAnalysisResult {
  if (!rawInput) {
    return {
      isValid: false,
      isMock: false,
      isAffinityOnly: false,
      hasAuthToken: false,
      cookieKeys: [],
    };
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      isValid: false,
      isMock: false,
      isAffinityOnly: false,
      hasAuthToken: false,
      cookieKeys: [],
    };
  }

  // Check for Demo / Mock mode flags
  if (trimmed === "MOCK_SESSION" || trimmed === "DEMO") {
    return {
      isValid: true,
      isMock: true,
      isAffinityOnly: false,
      hasAuthToken: true,
      cookieKeys: ["MOCK_SESSION"],
    };
  }

  // If provided as a raw token without key=value pairs (e.g. JWT or raw session token)
  if (!trimmed.includes("=")) {
    if (trimmed.length >= 8) {
      return {
        isValid: true,
        isMock: false,
        isAffinityOnly: false,
        hasAuthToken: true,
        cookieKeys: ["RAW_TOKEN"],
      };
    }
    return {
      isValid: false,
      isMock: false,
      isAffinityOnly: false,
      hasAuthToken: false,
      cookieKeys: [],
      warningMessage:
        "The provided session token appears too short to be valid.",
    };
  }

  // Parse key-value cookie pairs
  const pairs = trimmed
    .split(/;\s*|\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const keys: string[] = [];
  for (const pair of pairs) {
    const eqIdx = pair.indexOf("=");
    if (eqIdx !== -1) {
      const key = pair.slice(0, eqIdx).trim().toLowerCase();
      if (key && !keys.includes(key)) {
        keys.push(key);
      }
    }
  }

  if (keys.length === 0) {
    return {
      isValid: false,
      isMock: false,
      isAffinityOnly: false,
      hasAuthToken: false,
      cookieKeys: [],
      warningMessage:
        "No valid cookie pairs or session tokens could be parsed.",
    };
  }

  // Check if any key represents an actual authenticated session token
  const hasAuthKey = keys.some((k) =>
    AUTH_KEY_PATTERNS.some((pattern) => k.includes(pattern))
  );

  const allKeysAreGateway = keys.every((k) => GATEWAY_ANALYTICS_KEYS.has(k));

  if (allKeysAreGateway && !hasAuthKey) {
    return {
      isValid: false,
      isMock: false,
      isAffinityOnly: true,
      hasAuthToken: false,
      cookieKeys: keys,
      warningMessage:
        "Only Azure Gateway routing cookies (ApplicationGatewayAffinity) were detected. The actual student authentication cookie is missing because modern browsers hide HttpOnly cookies from document.cookie. Please copy your full Cookie header from DevTools Network Tab or use Demo Mode.",
    };
  }

  return {
    isValid: true,
    isMock: false,
    isAffinityOnly: false,
    hasAuthToken: true,
    cookieKeys: keys,
  };
}
