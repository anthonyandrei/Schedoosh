import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class SavedSchedulesPage extends BasePage {
  async gotoSaved() {
    await this.goto("/saved");
  }

  async expectEmptyState() {
    const emptyNotice = this.page.getByText(
      /no saved schedules|no schedules saved yet/i
    );
    await expect(emptyNotice.first()).toBeVisible();
  }
}
