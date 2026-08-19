import { expect, type Page } from "@playwright/test";

export class BasePage {
  constructor(protected page: Page) {}

  async goto(path = "/") {
    await this.page.goto(path);
    await this.waitForHydration();
  }

  async waitForHydration() {
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectToast(message: string | RegExp) {
    const toast = this.page
      .locator("[data-sonner-toast]")
      .filter({ hasText: message });
    await expect(toast.first()).toBeVisible({ timeout: 5000 });
  }
}
