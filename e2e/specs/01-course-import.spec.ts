import { test } from "@playwright/test";
import { CourseImportPage } from "../pages/course-import.page";
import { SessionModalPage } from "../pages/session-modal.page";

test.describe("Course Search, Import & Demo Mode Flow", () => {
  test("prompts user to connect ArchersHub when searching without session", async ({
    page,
  }) => {
    const coursePage = new CourseImportPage(page);
    await coursePage.goto("/");

    await coursePage.searchAndAddCourse("CCPROG1");
    await coursePage.expectToast(/haven't connected archershub/i);
  });

  test("allows activating Demo Mode and importing mock courses", async ({
    page,
  }) => {
    const sessionModal = new SessionModalPage(page);
    const coursePage = new CourseImportPage(page);

    await coursePage.goto("/");
    await sessionModal.activateDemoMode();

    await coursePage.searchAndAddCourse("CCPROG1");
    await coursePage.expectToast(/added|loaded/i);
    await coursePage.expectCourseInList("CCPROG1");
  });

  test("shows duplicate course error when adding an existing course", async ({
    page,
  }) => {
    const sessionModal = new SessionModalPage(page);
    const coursePage = new CourseImportPage(page);

    await coursePage.goto("/");
    await sessionModal.activateDemoMode();

    await coursePage.searchAndAddCourse("CCPROG1");
    await coursePage.expectCourseInList("CCPROG1");

    // Attempt to add duplicate course
    await coursePage.searchAndAddCourse("CCPROG1");
    await coursePage.expectToast(/duplicate course/i);
  });
});
