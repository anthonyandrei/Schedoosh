import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class ScheduleViewPage extends BasePage {
  readonly generateTab: Locator;
  readonly generateButton: Locator;
  readonly calendarGrid: Locator;
  readonly filterSettingsButton: Locator;
  readonly emptyState: Locator;
  readonly scheduleSelect: Locator;

  constructor(page: Page) {
    super(page);
    this.generateTab = this.page.getByRole("tab", { name: /schedules/i });
    this.generateButton = this.page.getByRole("button", {
      name: /generate schedules|^generate$/i,
    });
    this.calendarGrid = this.page.locator(
      ".grid, table, [data-testid='schedule-grid'], .border-border"
    );
    this.filterSettingsButton = this.page.getByRole("button", {
      name: /filter settings/i,
    });
    this.emptyState = this.page.getByText(/no schedules generated yet/i);
    this.scheduleSelect = this.page.locator("button[role='combobox']");
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

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }
}
