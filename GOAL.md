# Goal: Migrate Schedaddle from DLSU MLS to ArchersHub Course Scraping

## 🎯 Objective
Migrate Schedaddle's course fetching mechanism from the legacy DLSU MLS system (`enroll.dlsu.edu.ph`) to the new **ArchersHub** portal (`archershub.dlsu.edu.ph`). Since ArchersHub requires authentication, convert Schedaddle into a fully self-contained Next.js application that accepts a user session cookie/token (stored locally in client storage), performs authenticated server-side scraping, normalizes course and section schedules into Schedaddle's data schema, and provides a polished, intuitive UX for students with an in-app DevTools helper snippet.

---

## 🏗️ Architecture & Decisions Summary

| Decision Area | Chosen Strategy | Details |
| :--- | :--- | :--- |
| **Authentication** | Session Cookie / Token Paste | Stored strictly in local client storage (IndexedDB via `idb-keyval` + Zustand), never persisted to external databases. |
| **Console Helper** | 1-Click DevTools Console Snippet | In-modal copyable JavaScript snippet that students can paste into their browser DevTools console on ArchersHub to auto-copy session headers. |
| **Scraper Hosting** | Integrated Next.js Server Actions | Scraper and parser logic built directly into Schedaddle (`src/lib/archershub/`), eliminating dependence on external backend services. |
| **Parser Design** | Dual-Engine Parser (JSON API + HTML Table) | Flexible parsing layer with normalizers to parse both JSON responses and HTML tables into `classSchema`. |
| **Testing & Mocking** | Mock Fixtures & Demo Mode | Realistic test fixtures (`CCPROG1`, `GEETHIC`, `CSINTSY`) + mock fallback mode for local testing without live student credentials. |
| **Session Expiry UX** | Auto-Open Dialog + Expiry Toast | On 401/403 errors, trigger a Sonner warning toast and automatically open the ArchersHub Session dialog. |
| **State Migration** | Zustand Store v3 → v4 | Migrate `IdSlice` to `SessionSlice` (or backward-compatible `AuthSlice`) preserving all saved user schedules and courses. |

---

## 📋 Comprehensive Task List for Execution

### Phase 1: State Management & Store Migration (Zustand v4)
- [ ] **Task 1.1: Create `sessionSlice.ts` / Update Store Types**
  - Path: `src/stores/sessionSlice.ts` (or `src/stores/authSlice.ts`)
  - State:
    - `sessionCookie`: `string` (raw cookie header or auth token)
    - `idNumber`: `string` (optional legacy student ID if needed)
    - `isAuthenticated`: `boolean`
    - `lastAuthenticated`: `Date | null`
    - `isSessionModalOpen`: `boolean`
  - Actions:
    - `setSessionCookie(cookie: string)`
    - `clearSession()`
    - `setSessionModalOpen(open: boolean)`
- [ ] **Task 1.2: Migrate `useGlobalStore.ts` to Version 4**
  - Path: `src/stores/useGlobalStore.ts`
  - Bump `version: 4`.
  - Add migration logic: if `persistedState` has `id`, preserve it into `idNumber` while initializing `sessionCookie: ""`.
  - Ensure zero data loss for existing users' courses, custom classes, and saved schedules.

---

### Phase 2: ArchersHub Scraper Core & Parser Module
- [ ] **Task 2.1: ArchersHub Types & Constants**
  - Path: `src/lib/archershub/types.ts`
  - Define interfaces for raw ArchersHub API payloads and HTML table structures.
  - Define error types: `ArchersHubAuthError` (401/403), `ArchersHubRateLimitError` (429), `ArchersHubParseError`, `ArchersHubCourseNotFoundError`.
- [ ] **Task 2.2: Dual-Engine Parsers**
  - Path: `src/lib/archershub/parsers.ts`
  - Implement `parseArchersHubJson(rawJson: unknown): Class[]`
  - Implement `parseArchersHubHtml(html: string): Class[]`
  - Normalize fields into Schedaddle's `classSchema`:
    - Course code, Section name, Class code (number), Professor name
    - Schedules array: Day (`M`, `T`, `W`, `H`, `F`, `S`), Start/End (military integer, e.g. `900`, `1030`), Date range, Room, `isOnline` boolean
    - Enrolled count, Capacity limit, Modality (`HYBRID`, `F2F`, `ONLINE`, etc.), Remarks
- [ ] **Task 2.3: Core Fetcher / Scraper**
  - Path: `src/lib/archershub/scraper.ts`
  - Implement `scrapeCourseFromArchersHub(courseCode: string, sessionCookie: string, options?: { mock?: boolean }): Promise<{ course: Course, isCached?: boolean }>`
  - Implement `scrapeMultipleCoursesFromArchersHub(courseCodes: string[], sessionCookie: string)`
  - Handle rate limiting, exponential backoff, header spoofing (User-Agent, Referer: `https://archershub.dlsu.edu.ph/`), and cookie formatting.

---

### Phase 3: Mock Fixtures & Testing Suite
- [ ] **Task 3.1: Create Test Fixtures**
  - Path: `src/lib/archershub/fixtures/`
  - Create `sample-course-response.json` (typical ArchersHub JSON response with multiple sections, lab/lecture pairs, hybrid schedules).
  - Create `sample-course-table.html` (typical ArchersHub HTML table offering).
- [ ] **Task 3.2: Write Parser & Normalization Unit Tests**
  - Path: `src/lib/archershub/__tests__/parsers.test.ts`
  - Verify full compliance with `classSchema.array().parse(result)`.
  - Test edge cases: TBA rooms, online/hybrid modalities, multiple time slots per section, invalid course codes.

---

### Phase 4: Server Action & API Route Integration
- [ ] **Task 4.1: Update `src/actions/course.ts`**
  - Replace legacy MLS endpoint fetch with calls to `src/lib/archershub/scraper.ts`.
  - Support both direct server-side scraping and optional demo mock fallback.
  - Return typed results `{ data: { newCourse: Course, isCached: boolean } | null, error?: string, authExpired?: boolean }`.
- [ ] **Task 4.2: Update Proxy / Middleware if needed**
  - Path: `src/proxy.ts`
  - Ensure rate limiting rules and headers are maintained.

---

### Phase 5: UI/UX & ArchersHub Authentication Dialog
- [ ] **Task 5.1: Create `ArchersHubAuthDialog.tsx`**
  - Path: `src/components/navbar/ArchersHubAuthDialog.tsx`
  - Built with Radix UI Dialog / shadcn UI.
  - Features:
    - Status badge: Green "ArchersHub Connected" vs Amber "Session Required / Expired".
    - DevTools Console 1-Click Copy Snippet:
      ```javascript
      // Example helper snippet
      copy(document.cookie);
      ```
    - Clean text area / input for pasting session cookie or auth token.
    - Step-by-step illustrated instructions:
      1. Open [ArchersHub](https://archershub.dlsu.edu.ph/) and log in.
      2. Press `F12` (or Right-Click -> Inspect) and go to the Console tab.
      3. Paste the snippet and press Enter (it copies your session to clipboard).
      4. Paste the copied session here and click **Connect**.
    - Privacy notice: "Your session cookie is stored locally on your device only and used solely to fetch course offerings."
    - Test Connection / Validate button.
- [ ] **Task 5.2: Update Navigation Bar**
  - Path: `src/components/navbar/NavigationBar.tsx`
  - Replace `IDInput` trigger button with `ArchersHubAuthDialog` trigger button with status indicator badge.

---

### Phase 6: Dashboard & Course Management UI Updates
- [ ] **Task 6.1: Update `CourseInput.tsx`**
  - Path: `src/app/(dashboard)/_components/CourseInput.tsx`
  - Replace "Add from MLS" dropdown option with "Add from ArchersHub".
  - Handle missing session: if user has no session cookie, pulse the Connect button and open the auth dialog.
  - Handle expired session: if server returns `authExpired: true`, trigger warning toast and automatically open the auth dialog.
  - Add loading state animations and clear feedback messages.
- [ ] **Task 6.2: Update `CourseList.tsx` & `AddCustomClass.tsx`**
  - Update any references from MLS to ArchersHub.
  - Ensure re-fetching / updating existing courses passes the session cookie properly.

---

### Phase 7: Nomenclature, Help Dialogs & Documentation
- [ ] **Task 7.1: Update Help Dialogs & Announcements**
  - Path: `src/components/navbar/HelpDialog.tsx` & `src/components/navbar/Announcement.tsx`
  - Update instructions to guide students through ArchersHub course importing.
- [ ] **Task 7.2: Update `README.md`**
  - Update feature list: "Add classes directly from **ArchersHub** using your session token".
  - Update privacy section to explain local session storage.

---

### Phase 8: Verification, Linting & Build Checks
- [ ] **Task 8.1: Run Linting and Type Checking**
  - `pnpm lint` (Biome check)
  - `pnpm build` (TypeScript check & Next.js production build)
- [ ] **Task 8.2: End-to-End Verification**
  - Verify adding courses in mock/demo mode.
  - Verify adding custom courses.
  - Verify generation of schedules, filters, Google Calendar export, and .ics export.

---

## 🔍 Verification Commands
The implementing agent must run and verify the following commands before completing:

```bash
# 1. Check code quality and formatting
pnpm lint

# 2. Verify Next.js build and TypeScript typing
pnpm build

# 3. Verify store migrations and parsers
pnpm test # (or node-based test script for lib/archershub)
```

---

## 🛡️ Acceptance Criteria
1. **Self-Contained**: No external `COURSE_API` microservice required; fetching & parsing happens securely in Next.js Server Actions.
2. **ArchersHub Compatible**: Accepts valid ArchersHub session cookies/tokens and parses course offerings into `Course` objects conforming to `classSchema`.
3. **Impeccable UX**: Clear, student-friendly modal with a 1-click DevTools copy snippet, connection status badge, and auto-opening modal on session expiration.
4. **Data Integrity & Zero Data Loss**: Existing user schedules and custom courses in IndexedDB migrate seamlessly from v3 to v4.
5. **No Regressions**: All schedule generation, filtering, color coding, image download, and calendar exports continue to work seamlessly.
