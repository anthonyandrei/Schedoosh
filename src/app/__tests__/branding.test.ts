import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = process.cwd();
const logoPath = path.join(projectRoot, "public/schedoosh-new-logo.png");

test("the optimized Schedoosh logo is used by the app without a stale favicon override", () => {
  assert.equal(existsSync(logoPath), true);
  assert.ok(statSync(logoPath).size < 100_000);
  assert.equal(
    existsSync(path.join(projectRoot, "src/app/favicon.ico")),
    false
  );

  const logoComponent = readFileSync(
    path.join(projectRoot, "src/components/SchedooshLogo.tsx"),
    "utf8"
  );
  const rootLayout = readFileSync(
    path.join(projectRoot, "src/app/layout.tsx"),
    "utf8"
  );

  assert.match(logoComponent, /\/schedoosh-new-logo\.png/);
  assert.match(rootLayout, /icons:\s*\{/);
  assert.match(rootLayout, /\/schedoosh-new-logo\.png/);
});
