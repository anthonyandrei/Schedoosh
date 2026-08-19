import { expect, test } from "@playwright/test";
import { ManualCoursePage } from "../pages/manual-course.page";

test.describe("Manual Course Creation Flow", () => {
  test("renders manual class form with validation controls", async ({
    page,
  }) => {
    const manualPage = new ManualCoursePage(page);
    await manualPage.gotoManual();

    await expect(manualPage.courseCodeInput).toBeVisible();
    await expect(manualPage.sectionInput).toBeVisible();
  });

  test("validates required course code when submitting empty form", async ({
    page,
  }) => {
    const manualPage = new ManualCoursePage(page);
    await manualPage.gotoManual();

    await manualPage.submit();
    const errorMsg = page.getByText(/required|must be/i);
    await expect(errorMsg.first()).toBeVisible();
  });
});
