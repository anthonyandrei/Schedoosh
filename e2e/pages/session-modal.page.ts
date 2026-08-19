import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class SessionModalPage extends BasePage {
  readonly connectButton: Locator;
  readonly modal: Locator;
  readonly tokenInput: Locator;
  readonly connectSubmitButton: Locator;
  readonly demoModeButton: Locator;
  readonly copySnippetButton: Locator;

  constructor(page: Page) {
    super(page);
    this.connectButton = this.page.getByRole("button", {
      name: /connect archershub session|archershub|demo mode/i,
    });
    this.modal = this.page
      .getByRole("dialog")
      .filter({ hasText: /archershub session/i });
    this.tokenInput = this.page
      .getByPlaceholder(/paste.*cookie|session/i)
      .first();
    this.connectSubmitButton = this.page
      .getByRole("button", {
        name: /^connect session$|^connect$/i,
      })
      .first();
    this.demoModeButton = this.page
      .getByRole("button", {
        name: /try demo mode/i,
      })
      .first();
    this.copySnippetButton = this.page
      .getByRole("button", {
        name: /copy snippet/i,
      })
      .first();
  }

  async open() {
    await this.dismissAnnouncement();
    if (
      !(await this.modal
        .first()
        .isVisible()
        .catch(() => false))
    ) {
      await this.connectButton.first().click();
    }
    await expect(this.modal.first()).toBeVisible();
  }

  async activateDemoMode() {
    await this.open();
    await this.demoModeButton.click();
    await expect(this.modal.first()).toBeHidden();
    await this.expectToast(/demo mode activated/i);
  }

  async connectWithToken(token: string) {
    await this.open();
    await this.tokenInput.fill(token);
    await this.connectSubmitButton.click();
    await expect(this.modal.first()).toBeHidden();
    await this.expectToast(/connected to archershub/i);
  }
}
