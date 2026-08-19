# Design Document: Playwright E2E Testing Suite for Schedaddle

**Date:** 2026-08-19  
**Status:** Proposed / Under Review  
**Target:** End-to-End browser test automation for critical student user journeys  

---

## 1. Executive Summary & Goals

Schedaddle is a client-rich Next.js 16 application with complex interactive state (Zustand + IndexedDB via `idb-keyval`), dynamic schedule generation algorithms, Radix UI dialogs, and Server Actions for course fetching.

While unit tests (`bun test`) cover parser regexes and data structures in sub-second time, they do not verify real DOM rendering, browser event handling, client-side store rehydration, or full user journeys.

This specification establishes a **hermetic, fixture-driven Playwright E2E test suite** that validates critical student workflows in real browser engines without flaky dependencies on external university servers or live student credentials.

---

## 2. Scope & Non-Goals

### In Scope
* **Playwright Infrastructure:** Setup `@playwright/test`, `playwright.config.ts`, and local Next.js test server lifecycle.
* **Hermetic Server Actions:** Integration with existing mock course data (`getMockCourse` / `sampleCourseResponse`) to guarantee 100% offline, deterministic server action responses during tests.
* **Page Object Model (POM):** Reusable page abstraction layers for course searching, manual course creation, schedule generation/filtering, saved schedules, and modals.
* **State Seeding Helpers:** Browser evaluation utilities to inject pre-populated Zustand / IndexedDB store states for fast, isolated test setup.
* **Core E2E User Journeys:**
  1. **Course Search & Selection:** Adding courses via mock ArchersHub, section selection, and course groupings.
  2. **Manual Course Creation:** Adding custom course codes, section names, time slots, and days.
  3. **Schedule Generation & Filters:** Running the schedule combination generator, toggling filters (time ranges, max consecutive classes, days), and viewing calendar grids.
  4. **Persistence & Saved Schedules:** Saving a schedule to IndexedDB, switching tabs, reloading the page, and verifying persistence.
  5. **Session Management & Export Triggers:** Testing the ArchersHub session dialog, snippet copy, and calendar (.ics) download triggers.
* **NPM / PNPM Scripts:** `test:e2e` (headless), `test:e2e:ui` (interactive UI mode), and CI workflow configuration.

### Non-Goals
* Testing live network connections against `archershub.dlsu.edu.ph` during automated CI (prevents rate limiting and credential leaks).
* Completing real external OAuth handshakes with Google (OAuth dialog trigger is verified, but third-party login page is intercepted).
* Duplicating fine-grained parser matrix tests (modality enum parsing, DLSU day string variations) which belong in unit tests.

---

## 3. Architecture & Directory Structure

```
Schedaddle/
├── e2e/
│   ├── fixtures/
│   │   ├── mock-courses.ts           # Predefined course fixtures (CCPROG1, GEETHIC, etc.)
│   │   └── state-seeder.ts           # Injects Zustand store data via page.evaluate
│   ├── pages/
│   │   ├── base.page.ts              # Base page object (nav, toast matchers, theme)
│   │   ├── course-import.page.ts     # Course table, search input, section selectors
│   │   ├── manual-course.page.ts     # Manual course creation dialog & form
│   │   ├── schedule-view.page.ts     # Schedule calendar grid, filter controls, generator
│   │   ├── saved-schedules.page.ts   # Saved schedules gallery, delete/load actions
│   │   └── session-modal.page.ts     # ArchersHub token configuration dialog
│   └── specs/
│       ├── 01-course-import.spec.ts
│       ├── 02-manual-courses.spec.ts
│       ├── 03-schedule-generation.spec.ts
│       ├── 04-persistence-saved.spec.ts
│       └── 05-session-and-exports.spec.ts
├── playwright.config.ts
└── package.json                      # scripts: "test:e2e", "test:e2e:ui"
```

---

## 4. Key Technical Design Components

### 4.1 Playwright Configuration (`playwright.config.ts`)
* **Test Directory:** `./e2e/specs`
* **Base URL:** `http://localhost:3000` (or dynamic test port)
* **Web Server Lifecycle:**
  * Local Dev: reuse running server if available (`reuseExistingServer: true`).
  * CI: run `pnpm build && pnpm start` with a 120-second timeout for hermetic execution.
* **Browser Engine:** Desktop Chromium by default (fast execution in 15–30s); configurable for WebKit / Firefox.
* **Screenshots & Traces:** Captured on test failure (`trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`).

### 4.2 Deterministic Mocking Strategy
* Schedaddle's scraper already includes `getMockCourse(courseCode)` and `sampleCourseResponse.json`.
* During Playwright test runs, an environment variable `NEXT_PUBLIC_MOCK_ARCHERSHUB=true` or test mode fallback ensures `fetchCourse` and `fetchMultipleCourses` server actions return instant, rich fixtures for standard courses (e.g. `CCPROG1`, `GEETHIC`, `CSINTSY`, `GERIZAL`) without hitting external DLSU servers.

### 4.3 State Seeding Pattern (`state-seeder.ts`)
For tests focused on schedule filtering or export operations, waiting for 5 courses to be searched and selected creates unnecessary latency. The state seeder will:
1. Open the base URL.
2. Call `page.evaluate((initialData) => { ... })` to populate the `zustand` store / `idb-keyval` store directly in IndexedDB.
3. Reload or trigger store synchronization, instantly putting the UI into the target state.

---

## 5. Adversarial Failure-Mode Check

| Potential Failure Mode | Severity | Mitigation in Design |
| :--- | :--- | :--- |
| **1. Next.js Server Cold Start / Port Collisions in CI** | Critical | Configure `playwright.config.ts` with explicit `webServer` block, `reuseExistingServer: !process.env.CI`, standard port `3000`, and robust timeout (120s). In CI, run production build (`pnpm build && pnpm start`) rather than dev server to eliminate Turbopack cold-compilation lag. |
| **2. IndexedDB / Zustand Hydration Race Conditions** | Critical | Base page object will implement `waitForHydration()` by asserting that the main navigation/table containers are interactive and data-loading skeletons have resolved before initiating test interactions. |
| **3. Radix UI Modal Animations & Focus Traps** | Minor | Use Playwright role-based locators (`page.getByRole('dialog')`, `page.getByRole('button', { name: ... })`) which natively wait for animation completion and clickability before dispatching events. |
| **4. File Download Flakiness (.ics / Image Export)** | Minor | Use Playwright's `page.waitForEvent('download')` promise wrapper to assert downloaded file name, content type, and byte length without relying on OS file dialogs. |

---

## 6. Implementation Plan Overview

1. **Dependency Installation:** Add `@playwright/test` and install browser binaries (`pnpm exec playwright install chromium`).
2. **Configuration:** Create `playwright.config.ts` and add package scripts (`"test:e2e": "playwright test"`, `"test:e2e:ui": "playwright test --ui"`).
3. **Fixtures & Page Objects:** Implement `e2e/fixtures/` and `e2e/pages/` helper classes.
4. **Test Specs:** Implement test specs 01 through 05 covering all critical user journeys.
5. **Verification:** Run the full Playwright suite locally and ensure all tests pass cleanly.
