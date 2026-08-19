import { test } from "@playwright/test";
import { SessionModalPage } from "../pages/session-modal.page";

test.describe("ArchersHub Session Dialog & Export Triggers", () => {
  test("copies DevTools console snippet to clipboard", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const sessionModal = new SessionModalPage(page);

    await sessionModal.goto("/");
    await sessionModal.open();
    await sessionModal.copySnippetButton.click();
    await sessionModal.expectToast(/snippet copied to clipboard/i);
  });

  test("connects custom session token header successfully", async ({
    page,
  }) => {
    const sessionModal = new SessionModalPage(page);

    await sessionModal.goto("/");
    await sessionModal.connectWithToken("ArchersHubAuth=TEST_COOKIE_TOKEN_123");
  });
});
