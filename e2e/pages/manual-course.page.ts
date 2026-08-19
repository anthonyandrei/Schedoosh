import { type Locator, type Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class ManualCoursePage extends BasePage {
  readonly courseCodeInput: Locator;
  readonly sectionInput: Locator;
  readonly professorInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.courseCodeInput = this.page.getByLabel(/course code|^code$/i);
    this.sectionInput = this.page.getByLabel(/section/i);
    this.professorInput = this.page.getByLabel(/professor/i);
    this.submitButton = this.page.getByRole("button", {
      name: /submit|add class|save/i,
    });
  }

  async gotoManual() {
    await this.goto("/manual");
  }

  async fillClassDetails(
    courseCode: string,
    section: string,
    professor: string
  ) {
    await this.courseCodeInput.fill(courseCode);
    await this.sectionInput.fill(section);
    await this.professorInput.fill(professor);
  }

  async submit() {
    await this.submitButton.click();
  }
}
