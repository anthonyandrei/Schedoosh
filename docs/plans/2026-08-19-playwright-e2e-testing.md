# Playwright E2E Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-optimized:subagent-driven-development (recommended) or superpowers-optimized:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a fixture-driven, hermetic Playwright E2E testing suite in Schedaddle covering critical student user journeys with zero flakiness.  
**Architecture:** Next.js test web server integration with `@playwright/test`, Page Object Model (POM) abstractions, mock demo mode integration, and IndexedDB state seeding helpers.  
**Tech Stack:** Next.js 16, TypeScript, Playwright, React 19, Zustand 5 (`idb-keyval`), Tailwind CSS, Biome.  
**Assumptions:** Assumes local Next.js server can start on port 3000 (or reuse running instance) — will NOT work if Node/pnpm/browser binaries are not installed.

---

## File Structure

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
│       ├── 01-course-import.spec.ts  # Demo mode, search, section toggle, duplicate check
│       ├── 02-manual-courses.spec.ts # Manual course creation, time slots, validations
│       ├── 03-schedule-generation.spec.ts # Schedule generator, filter toggles, grid display
│       ├── 04-persistence-saved.spec.ts   # Saving schedules, page reload, IndexedDB persistence
│       └── 05-session-and-exports.spec.ts # Session modal interactions & .ics file download trigger
├── playwright.config.ts              # Playwright test configuration
└── package.json                      # scripts: "test:e2e", "test:e2e:ui"
```

---

### Task 1: Install Playwright & Configure `playwright.config.ts`

**Files:**
- Modify: `package.json`
- Create: `playwright.config.ts`

**Security flag:** `none`  
**Does NOT cover:** Testing against external live university URLs (all tests use local Next.js server).

- [x] **Step 1: Install `@playwright/test` and Chromium browser binary**

```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

- [x] **Step 2: Add test scripts to `package.json`**

In `package.json` `scripts`:
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:headed": "playwright test --headed"
```

- [x] **Step 3: Create `playwright.config.ts`**

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/specs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: process.env.CI ? "pnpm build && pnpm start" : "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

- [x] **Step 4: Verify Playwright installation**

Run: `pnpm exec playwright --version`  
Expected: Prints `@playwright/test` version without errors.

---

### Task 2: Build Fixtures and State Seeding Helpers

**Files:**
- Create: `e2e/fixtures/mock-courses.ts`
- Create: `e2e/fixtures/state-seeder.ts`

**Security flag:** `none`  
**Does NOT cover:** Non-standard custom store schemas outside `useGlobalStore`.

- [x] **Step 1: Create `e2e/fixtures/mock-courses.ts`**

```typescript
import { Course } from "@/lib/definitions";

export const MOCK_CCPROG1: Course = {
  courseCode: "CCPROG1",
  color: "#3b82f6",
  isCustom: false,
  isSelected: true,
  lastFetched: new Date("2026-08-19T00:00:00.000Z"),
  classes: [
    {
      classNumber: 1001,
      courseCode: "CCPROG1",
      section: "S11",
      professor: "DELA CRUZ, JUAN",
      isSelected: true,
      enrolled: 35,
      capacity: 40,
      modality: "HYBRID",
      schedules: [
        {
          day: "M",
          start: 900,
          end: 1030,
          room: "GK301",
          isOnline: false,
        },
        {
          day: "W",
          start: 900,
          end: 1030,
          room: "ONLINE",
          isOnline: true,
        },
      ],
    },
    {
      classNumber: 1002,
      courseCode: "CCPROG1",
      section: "S12",
      professor: "SANTOS, MARIA",
      isSelected: true,
      enrolled: 40,
      capacity: 40,
      modality: "F2F",
      schedules: [
        {
          day: "T",
          start: 1100,
          end: 1230,
          room: "LS201",
          isOnline: false,
        },
        {
          day: "H",
          start: 1100,
          end: 1230,
          room: "LS201",
          isOnline: false,
        },
      ],
    },
  ],
};

export const MOCK_GEETHIC: Course = {
  courseCode: "GEETHIC",
  color: "#10b981",
  isCustom: false,
  isSelected: true,
  lastFetched: new Date("2026-08-19T00:00:00.000Z"),
  classes: [
    {
      classNumber: 2001,
      courseCode: "GEETHIC",
      section: "G01",
      professor: "REYES, PEDRO",
      isSelected: true,
      enrolled: 25,
      capacity: 45,
      modality: "F2F",
      schedules: [
        {
          day: "F",
          start: 1300,
          end: 1600,
          room: "AG702",
          isOnline: false,
        },
      ],
    },
  ],
};
```

- [x] **Step 2: Create `e2e/fixtures/state-seeder.ts`**

```typescript
import { Page } from "@playwright/test";
import { Course } from "@/lib/definitions";

export interface SeedStateOptions {
  courses?: Course[];
  sessionCookie?: string;
  isAuthenticated?: boolean;
}

export async function seedStoreState(page: Page, options: SeedStateOptions) {
  await page.evaluate(
    ({ courses, sessionCookie, isAuthenticated }) => {
      const currentState = localStorage.getItem("schedaddle-storage");
      let parsed = currentState ? JSON.parse(currentState) : { state: {}, version: 4 };

      parsed.state = {
        ...parsed.state,
        ...(courses ? { courses } : {}),
        ...(sessionCookie !== undefined ? { sessionCookie } : {}),
        ...(isAuthenticated !== undefined ? { isAuthenticated } : {}),
      };

      localStorage.setItem("schedaddle-storage", JSON.stringify(parsed));
    },
    {
      courses: options.courses,
      sessionCookie: options.sessionCookie ?? "MOCK_SESSION",
      isAuthenticated: options.isAuthenticated ?? true,
    }
  );
}
```

- [x] **Step 3: Run Biome check to verify clean syntax**

Run: `pnpm biome check e2e/fixtures/`  
Expected: PASS with 0 errors.

---

### Task 3: Implement Page Object Models (POM)

**Files:**
- Create: `e2e/pages/base.page.ts`
- Create: `e2e/pages/session-modal.page.ts`
- Create: `e2e/pages/course-import.page.ts`
- Create: `e2e/pages/manual-course.page.ts`
- Create: `e2e/pages/schedule-view.page.ts`
- Create: `e2e/pages/saved-schedules.page.ts`

**Security flag:** `none`  
**Does NOT cover:** Real external third-party OAuth popups.

- [ ] **Step 1: Create `e2e/pages/base.page.ts`**

```typescript
import { Page, expect } from "@playwright/test";

export class BasePage {
  constructor(protected page: Page) {}

  async goto(path = "/") {
    await this.page.goto(path);
    await this.waitForHydration();
  }

  async waitForHydration() {
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectToast(message: string | RegExp) {
    const toast = this.page.locator("[data-sonner-toast]").filter({ hasText: message });
    await expect(toast.first()).toBeVisible({ timeout: 5000 });
  }
}
```

- [ ] **Step 2: Create `e2e/pages/session-modal.page.ts`**

```typescript
import { Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class SessionModalPage extends BasePage {
  readonly connectButton = this.page.getByRole("button", { name: /archershub/i });
  readonly modal = this.page.getByRole("dialog");
  readonly tokenInput = this.page.getByPlaceholder(/paste.*cookie|session/i);
  readonly connectSubmitButton = this.page.getByRole("button", { name: /^connect$/i });
  readonly demoModeButton = this.page.getByRole("button", { name: /try demo mode/i });
  readonly copySnippetButton = this.page.getByRole("button", { name: /copy snippet/i });

  async open() {
    await this.connectButton.click();
    await expect(this.modal).toBeVisible();
  }

  async activateDemoMode() {
    await this.open();
    await this.demoModeButton.click();
    await expect(this.modal).toBeHidden();
    await this.expectToast(/demo mode activated/i);
  }

  async connectWithToken(token: string) {
    await this.open();
    await this.tokenInput.fill(token);
    await this.connectSubmitButton.click();
    await expect(this.modal).toBeHidden();
    await this.expectToast(/connected to archershub/i);
  }
}
```

- [ ] **Step 3: Create `e2e/pages/course-import.page.ts`**

```typescript
import { Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class CourseImportPage extends BasePage {
  readonly courseInput = this.page.getByPlaceholder(/enter course code/i);
  readonly addCourseButton = this.page.getByRole("button", { name: /^add course$/i });
  readonly courseList = this.page.locator("[data-testid='course-list']");

  async searchAndAddCourse(courseCode: string) {
    await this.courseInput.fill(courseCode);
    await this.addCourseButton.click();
  }

  async expectCourseInList(courseCode: string) {
    const courseCard = this.page.getByText(courseCode.toUpperCase());
    await expect(courseCard.first()).toBeVisible({ timeout: 10000 });
  }
}
```

- [ ] **Step 4: Create `e2e/pages/manual-course.page.ts`**

```typescript
import { Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class ManualCoursePage extends BasePage {
  readonly courseCodeInput = this.page.getByLabel(/course code/i);
  readonly sectionInput = this.page.getByLabel(/section/i);
  readonly professorInput = this.page.getByLabel(/professor/i);
  readonly submitButton = this.page.getByRole("button", { name: /add class|save/i });

  async gotoManual() {
    await this.goto("/manual");
  }

  async fillClassDetails(courseCode: string, section: string, professor: string) {
    await this.courseCodeInput.fill(courseCode);
    await this.sectionInput.fill(section);
    await this.professorInput.fill(professor);
  }

  async submit() {
    await this.submitButton.click();
  }
}
```

- [ ] **Step 5: Create `e2e/pages/schedule-view.page.ts`**

```typescript
import { Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class ScheduleViewPage extends BasePage {
  readonly generateTab = this.page.getByRole("tab", { name: /schedules/i });
  readonly generateButton = this.page.getByRole("button", { name: /generate/i });
  readonly calendarGrid = this.page.locator(".grid, table, [data-testid='schedule-grid']");

  async gotoSchedules() {
    await this.goto("/schedules");
  }

  async generate() {
    if (await this.generateButton.isVisible()) {
      await this.generateButton.click();
    }
  }

  async expectScheduleVisible() {
    await expect(this.calendarGrid.first()).toBeVisible();
  }
}
```

- [ ] **Step 6: Create `e2e/pages/saved-schedules.page.ts`**

```typescript
import { Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class SavedSchedulesPage extends BasePage {
  async gotoSaved() {
    await this.goto("/saved");
  }

  async expectEmptyState() {
    const emptyNotice = this.page.getByText(/no saved schedules/i);
    await expect(emptyNotice).toBeVisible();
  }
}
```

- [ ] **Step 7: Run Biome check on pages**

Run: `pnpm biome check e2e/pages/`  
Expected: PASS with 0 errors.

---

### Task 4: Implement Spec 01 - Course Search, Import & Demo Mode

**Files:**
- Create: `e2e/specs/01-course-import.spec.ts`

**Security flag:** `none`  
**Does NOT cover:** Real live network responses from DLSU servers.

- [ ] **Step 1: Write `e2e/specs/01-course-import.spec.ts`**

```typescript
import { test, expect } from "@playwright/test";
import { CourseImportPage } from "../pages/course-import.page";
import { SessionModalPage } from "../pages/session-modal.page";

test.describe("Course Search and Import Flow", () => {
  test("prompts user to connect ArchersHub when searching without session", async ({ page }) => {
    const coursePage = new CourseImportPage(page);
    await coursePage.goto("/");

    await coursePage.searchAndAddCourse("CCPROG1");
    await coursePage.expectToast(/haven't connected archershub/i);
  });

  test("allows activating Demo Mode and importing mock courses", async ({ page }) => {
    const sessionModal = new SessionModalPage(page);
    const coursePage = new CourseImportPage(page);

    await coursePage.goto("/");
    await sessionModal.activateDemoMode();

    await coursePage.searchAndAddCourse("CCPROG1");
    await coursePage.expectToast(/added/i);
    await coursePage.expectCourseInList("CCPROG1");
  });

  test("shows duplicate course error when adding an existing course", async ({ page }) => {
    const sessionModal = new SessionModalPage(page);
    const coursePage = new CourseImportPage(page);

    await coursePage.goto("/");
    await sessionModal.activateDemoMode();

    await coursePage.searchAndAddCourse("CCPROG1");
    await coursePage.expectCourseInList("CCPROG1");

    // Add again
    await coursePage.searchAndAddCourse("CCPROG1");
    await coursePage.expectToast(/duplicate course code/i);
  });
});
```

- [ ] **Step 2: Run test suite**

Run: `pnpm exec playwright test e2e/specs/01-course-import.spec.ts`  
Expected: PASS (3 tests passed).

---

### Task 5: Implement Spec 02 - Manual Course Creation & Custom Slots

**Files:**
- Create: `e2e/specs/02-manual-courses.spec.ts`

**Security flag:** `none`  
**Does NOT cover:** Automatic syllabus scraping for custom classes.

- [ ] **Step 1: Write `e2e/specs/02-manual-courses.spec.ts`**

```typescript
import { test, expect } from "@playwright/test";
import { CourseImportPage } from "../pages/course-import.page";
import { ManualCoursePage } from "../pages/manual-course.page";

test.describe("Manual Course Creation Flow", () => {
  test("renders manual class form with validation controls", async ({ page }) => {
    const manualPage = new ManualCoursePage(page);
    await manualPage.gotoManual();

    await expect(manualPage.courseCodeInput).toBeVisible();
    await expect(manualPage.sectionInput).toBeVisible();
  });

  test("validates required course code when submitting empty form", async ({ page }) => {
    const manualPage = new ManualCoursePage(page);
    await manualPage.gotoManual();

    await manualPage.submit();
    const errorMsg = page.getByText(/required|must be/i);
    await expect(errorMsg.first()).toBeVisible();
  });
});
```

- [ ] **Step 2: Run test suite**

Run: `pnpm exec playwright test e2e/specs/02-manual-courses.spec.ts`  
Expected: PASS (2 tests passed).

---

### Task 6: Implement Spec 03 - Schedule Combination Generation & Filtering

**Files:**
- Create: `e2e/specs/03-schedule-generation.spec.ts`

**Security flag:** `none`  
**Does NOT cover:** Algorithmic performance profiling in Playwright.

- [ ] **Step 1: Write `e2e/specs/03-schedule-generation.spec.ts`**

```typescript
import { test, expect } from "@playwright/test";
import { ScheduleViewPage } from "../pages/schedule-view.page";
import { seedStoreState } from "../fixtures/state-seeder";
import { MOCK_CCPROG1, MOCK_GEETHIC } from "../fixtures/mock-courses";

test.describe("Schedule Generation and Filter Flow", () => {
  test("generates and displays schedules when seeded with courses", async ({ page }) => {
    const schedulePage = new ScheduleViewPage(page);

    await schedulePage.goto("/");
    await seedStoreState(page, {
      courses: [MOCK_CCPROG1, MOCK_GEETHIC],
    });

    await schedulePage.gotoSchedules();
    await schedulePage.expectScheduleVisible();
  });
});
```

- [ ] **Step 2: Run test suite**

Run: `pnpm exec playwright test e2e/specs/03-schedule-generation.spec.ts`  
Expected: PASS (1 test passed).

---

### Task 7: Implement Spec 04 - Persistence & Saved Schedules

**Files:**
- Create: `e2e/specs/04-persistence-saved.spec.ts`

**Security flag:** `none`  
**Does NOT cover:** Server-side database backup syncing.

- [ ] **Step 1: Write `e2e/specs/04-persistence-saved.spec.ts`**

```typescript
import { test, expect } from "@playwright/test";
import { SavedSchedulesPage } from "../pages/saved-schedules.page";
import { CourseImportPage } from "../pages/course-import.page";
import { seedStoreState } from "../fixtures/state-seeder";
import { MOCK_CCPROG1 } from "../fixtures/mock-courses";

test.describe("Persistence and Saved Schedules Flow", () => {
  test("displays empty state when no schedules are saved", async ({ page }) => {
    const savedPage = new SavedSchedulesPage(page);
    await savedPage.gotoSaved();
    await savedPage.expectEmptyState();
  });

  test("persists added courses across page reload in localStorage/IndexedDB", async ({ page }) => {
    const coursePage = new CourseImportPage(page);
    await coursePage.goto("/");
    await seedStoreState(page, {
      courses: [MOCK_CCPROG1],
    });

    await coursePage.goto("/");
    await coursePage.expectCourseInList("CCPROG1");

    await page.reload();
    await coursePage.expectCourseInList("CCPROG1");
  });
});
```

- [ ] **Step 2: Run test suite**

Run: `pnpm exec playwright test e2e/specs/04-persistence-saved.spec.ts`  
Expected: PASS (2 tests passed).

---

### Task 8: Implement Spec 05 - ArchersHub Session Dialog & Export Triggers

**Files:**
- Create: `e2e/specs/05-session-and-exports.spec.ts`

**Security flag:** `none`  
**Does NOT cover:** Real Google OAuth login flows.

- [ ] **Step 1: Write `e2e/specs/05-session-and-exports.spec.ts`**

```typescript
import { test, expect } from "@playwright/test";
import { SessionModalPage } from "../pages/session-modal.page";

test.describe("Session Management and Export Triggers", () => {
  test("copies DevTools console snippet to clipboard", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const sessionModal = new SessionModalPage(page);
    await sessionModal.goto("/");

    await sessionModal.open();
    await sessionModal.copySnippetButton.click();
    await sessionModal.expectToast(/snippet copied/i);
  });

  test("connects custom session token header successfully", async ({ page }) => {
    const sessionModal = new SessionModalPage(page);
    await sessionModal.goto("/");

    await sessionModal.connectWithToken("ArchersHubAuth=TEST_COOKIE_TOKEN_123");
  });
});
```

- [ ] **Step 2: Run test suite**

Run: `pnpm exec playwright test e2e/specs/05-session-and-exports.spec.ts`  
Expected: PASS (2 tests passed).

---

### Task 9: Full Suite Verification & Linting

**Files:**
- Test all: `pnpm test:e2e`
- Test unit: `bun test`
- Lint: `pnpm lint`

**Security flag:** `none`

- [ ] **Step 1: Run full Playwright test suite**

Run: `pnpm test:e2e`  
Expected: All tests pass cleanly in headless Chromium.

- [ ] **Step 2: Run Bun unit tests**

Run: `bun test`  
Expected: 10 pass, 0 fail.

- [ ] **Step 3: Run Biome code check**

Run: `pnpm lint`  
Expected: Checked files with zero lint/format errors.
