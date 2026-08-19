import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class CourseImportPage extends BasePage {
  readonly courseInput: Locator;
  readonly addCourseButton: Locator;
  readonly courseList: Locator;

  constructor(page: Page) {
    super(page);
    this.courseInput = this.page.getByPlaceholder(/enter course code|ccprog1/i);
    this.addCourseButton = this.page.getByRole("button", {
      name: /^add course$/i,
    });
    this.courseList = this.page.locator("[data-testid='course-list']");
  }

  async searchAndAddCourse(courseCode: string) {
    if (await this.courseInput.isVisible()) {
      await this.courseInput.fill(courseCode);
      await this.courseInput.press("Enter");
    }
  }

  async expectCourseInList(courseCode: string) {
    const courseCard = this.page.getByText(courseCode.toUpperCase());
    await expect(courseCard.first()).toBeVisible({ timeout: 10000 });
  }
}
