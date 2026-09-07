import assert from "node:assert/strict";
import test from "node:test";
import {
  getWallpaperComposition,
  getWallpaperPreset,
} from "../downloadSchedule";

test("phone resolves to a 1080 x 1920 mobile wallpaper", () => {
  assert.deepEqual(getWallpaperPreset("phone"), {
    id: "phone",
    label: "Phone (9:16)",
    width: 1080,
    height: 1920,
    orientation: "portrait",
  });
  assert.deepEqual(getWallpaperComposition("phone"), {
    isMobile: true,
    showOverview: false,
  });
});

test("portrait presets use the approved 9:16 and 9:21 labels", () => {
  assert.equal(getWallpaperPreset("phone").label, "Phone (9:16)");
  assert.equal(getWallpaperPreset("tall-phone").label, "Tall Phone (9:21)");
});
