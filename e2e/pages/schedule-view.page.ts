import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class ScheduleViewPage extends BasePage {
  readonly generateTab: Locator;
  readonly generateButton: Locator;
  readonly calendarGrid: Locator;

  constructor(page: Page) {
    super(page);
    this.generateTab = this.page.getByRole("tab", { name: /schedules/i });
    this.generateButton = this.page.getByRole("button", {
      name: /generate schedules|^generate$/i,
    });
    this.calendarGrid = this.page.locator(
      ".grid, table, [data-testid='schedule-grid'], .border-border"
    );
  }

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
