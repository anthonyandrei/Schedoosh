import assert from "node:assert/strict";
import test from "node:test";
import {
  createSerialRenderQueue,
  getExportRenderOptions,
  getPreviewRenderOptions,
} from "../imageRender";

test("preview rendering stays low resolution when export options are high resolution", () => {
  assert.deepEqual(
    getPreviewRenderOptions({ quality: 1, pixelRatio: 2.5, skipFonts: true }),
    {
      quality: 0.3,
      pixelRatio: 0.5,
      skipFonts: true,
      cacheBust: true,
    }
  );
});

test("export rendering preserves the configured wallpaper dimensions", () => {
  assert.deepEqual(
    getExportRenderOptions({ quality: 1, pixelRatio: 2.5, skipFonts: true }),
    {
      quality: 1,
      pixelRatio: 1,
      skipFonts: true,
      cacheBust: true,
    }
  );
});

test("image renders run one at a time", async () => {
  const run = createSerialRenderQueue();
  const events: string[] = [];
  let releaseFirst: (() => void) | undefined;
  const firstGate = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });

  const first = run(async () => {
    events.push("first:start");
    await firstGate;
    events.push("first:end");
  });
  const second = run(async () => {
    events.push("second:start");
    events.push("second:end");
  });

  await Promise.resolve();
  assert.deepEqual(events, ["first:start"]);

  releaseFirst?.();
  await Promise.all([first, second]);
  assert.deepEqual(events, [
    "first:start",
    "first:end",
    "second:start",
    "second:end",
  ]);
});
