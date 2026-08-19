import { type Locator, type Page } from "@playwright/test";
import { seedStoreState } from "../fixtures/state-seeder";
import { BasePage } from "./base.page";

export class ManualCoursePage extends BasePage {
  readonly dialog: Locator;
  readonly courseCodeInput: Locator;
  readonly sectionInput: Locator;
  readonly professorInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.dialog = this.page.getByRole("dialog");
    this.courseCodeInput = this.dialog.getByLabel(/^code$/i);
    this.sectionInput = this.dialog.getByLabel(/section/i);
    this.professorInput = this.dialog.getByLabel(/professor/i);
    this.submitButton = this.dialog.getByRole("button", {
      name: /^submit$/i,
    });
  }

  async gotoManual() {
    await this.goto("/");
    await seedStoreState(this.page, {
      courses: [
        {
          courseCode: "CUSTOM101",
          color: "#3b82f6",
          isCustom: true,
          isSelected: true,
          lastFetched: new Date(),
          classes: [],
        },
      ],
      sessionCookie: "DEMO",
      isAuthenticated: true,
    });
    await this.goto("/");
    const addClassButton = this.page.getByRole("button", {
      name: /^add class$/i,
    });
    await addClassButton.waitFor({ state: "visible", timeout: 10000 });
    await addClassButton.click();
    await this.page
      .getByRole("dialog")
      .waitFor({ state: "visible", timeout: 10000 });
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
