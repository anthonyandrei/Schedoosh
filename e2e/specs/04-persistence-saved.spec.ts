import { test } from "@playwright/test";
import { MOCK_CCPROG1 } from "../fixtures/mock-courses";
import { seedStoreState } from "../fixtures/state-seeder";
import { CourseImportPage } from "../pages/course-import.page";
import { SavedSchedulesPage } from "../pages/saved-schedules.page";

test.describe("Persistence and Saved Schedules Flow", () => {
  test("displays empty state when no schedules are saved", async ({ page }) => {
    const savedPage = new SavedSchedulesPage(page);
    await savedPage.gotoSaved();
    await savedPage.expectEmptyState();
  });

  test("persists added courses across page reload in storage", async ({
    page,
  }) => {
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
