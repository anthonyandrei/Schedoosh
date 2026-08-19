import { expect, type Page } from "@playwright/test";

export class BasePage {
  constructor(protected page: Page) {}

  async goto(path = "/") {
    await this.page.goto(path);
    await this.waitForHydration();
  }

  async dismissAnnouncement() {
    try {
      const announcementModal = this.page
        .getByRole("dialog")
        .filter({ hasText: /archershub migration update/i });
      await announcementModal.waitFor({ state: "visible", timeout: 2500 });
      const closeBtn = announcementModal.getByRole("button", {
        name: /close/i,
      });
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      } else {
        await this.page.keyboard.press("Escape");
      }
      await announcementModal.waitFor({ state: "hidden", timeout: 3000 });
    } catch {
      // Ignore if announcement dialog did not appear
    }
  }

  async waitForHydration() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.dismissAnnouncement();
  }

  async expectToast(message: string | RegExp) {
    const toast = this.page
      .locator("[data-sonner-toast]")
      .filter({ hasText: message });
    await expect(toast.first()).toBeVisible({ timeout: 5000 });
  }
}
