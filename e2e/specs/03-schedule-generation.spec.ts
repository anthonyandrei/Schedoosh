import { expect, test } from "@playwright/test";
import { MOCK_CCPROG1, MOCK_GEETHIC } from "../fixtures/mock-courses";
import { seedStoreState } from "../fixtures/state-seeder";
import { ScheduleViewPage } from "../pages/schedule-view.page";

test.describe("Schedule Combination Generation & Filtering Flow", () => {
  test("generates and displays schedules when seeded with courses", async ({
    page,
  }) => {
    const schedulePage = new ScheduleViewPage(page);

    await schedulePage.goto("/");
    await seedStoreState(page, {
      courses: [MOCK_CCPROG1, MOCK_GEETHIC],
    });

    await schedulePage.gotoSchedules();
    await schedulePage.generate();

    await schedulePage.expectScheduleVisible();
    await expect(page.getByText("CCPROG1").first()).toBeVisible();
    await expect(page.getByText("GEETHIC").first()).toBeVisible();
  });

  test("displays empty state initially before schedule generation", async ({
    page,
  }) => {
    const schedulePage = new ScheduleViewPage(page);

    await schedulePage.gotoSchedules();
    await schedulePage.expectEmptyState();
  });

  test("opens filter settings dialog and allows configuring constraints", async ({
    page,
  }) => {
    const schedulePage = new ScheduleViewPage(page);

    await schedulePage.gotoSchedules();
    await schedulePage.filterSettingsButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Filter Settings" })
    ).toBeVisible();

    const generalTab = page.getByRole("tab", { name: "General" });
    await expect(generalTab).toBeVisible();

    const saveButton = page.getByRole("button", { name: /save all/i });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    await expect(dialog).not.toBeVisible();
  });
});
