import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test, { describe } from "node:test";

function resolveProjectPath(relativePath: string): string {
  const fromCwd = path.resolve(process.cwd(), relativePath);
  if (existsSync(fromCwd)) {
    return fromCwd;
  }
  const fromDir = path.resolve(import.meta.dir, "../../..", relativePath);
  if (existsSync(fromDir)) {
    return fromDir;
  }
  return fromCwd;
}

function extractCssBlock(css: string, selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`${escapedSelector}\\s*\\{([^}]+)\\}`, "m");
  const match = css.match(regex);
  assert.ok(
    match,
    `Expected ${selector} block to exist in src/app/globals.css`
  );
  return match[1];
}

function extractTailwindColorEntry(config: string, colorName: string): string {
  const escapedColor = colorName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `(?:['"]?${escapedColor}['"]?)\\s*:\\s*\\{([^}]+)\\}`,
    "m"
  );
  const match = config.match(regex);
  assert.ok(
    match,
    `Expected '${colorName}' color definition object to exist in tailwind.config.ts`
  );
  return match[1];
}

describe("CSS and Tailwind Design Tokens Machine Gate", () => {
  const globalsCssPath = resolveProjectPath("src/app/globals.css");
  const tailwindConfigPath = resolveProjectPath("tailwind.config.ts");

  test("globals.css defines --warning and --warning-foreground custom properties inside :root and .dark blocks", () => {
    const globalsCss = readFileSync(globalsCssPath, "utf-8");

    const rootBlock = extractCssBlock(globalsCss, ":root");
    assert.match(
      rootBlock,
      /--warning\s*:\s*[^;]+;/,
      "Expected :root block to define --warning custom property"
    );
    assert.match(
      rootBlock,
      /--warning-foreground\s*:\s*[^;]+;/,
      "Expected :root block to define --warning-foreground custom property"
    );

    const darkBlock = extractCssBlock(globalsCss, ".dark");
    assert.match(
      darkBlock,
      /--warning\s*:\s*[^;]+;/,
      "Expected .dark block to define --warning custom property"
    );
    assert.match(
      darkBlock,
      /--warning-foreground\s*:\s*[^;]+;/,
      "Expected .dark block to define --warning-foreground custom property"
    );
  });

  test("globals.css defines --success and --success-foreground custom properties inside :root and .dark blocks", () => {
    const globalsCss = readFileSync(globalsCssPath, "utf-8");

    const rootBlock = extractCssBlock(globalsCss, ":root");
    assert.match(
      rootBlock,
      /--success\s*:\s*[^;]+;/,
      "Expected :root block to define --success custom property"
    );
    assert.match(
      rootBlock,
      /--success-foreground\s*:\s*[^;]+;/,
      "Expected :root block to define --success-foreground custom property"
    );

    const darkBlock = extractCssBlock(globalsCss, ".dark");
    assert.match(
      darkBlock,
      /--success\s*:\s*[^;]+;/,
      "Expected .dark block to define --success custom property"
    );
    assert.match(
      darkBlock,
      /--success-foreground\s*:\s*[^;]+;/,
      "Expected .dark block to define --success-foreground custom property"
    );
  });

  test("tailwind.config.ts colors mapping includes 'warning' and 'success' matching the 'destructive' pattern", () => {
    const tailwindConfig = readFileSync(tailwindConfigPath, "utf-8");

    // Verify reference pattern 'destructive' exists
    const destructiveEntry = extractTailwindColorEntry(
      tailwindConfig,
      "destructive"
    );
    assert.match(
      destructiveEntry,
      /DEFAULT\s*:\s*["']hsl\(var\(--destructive\)\)["']/,
      "Sanity check: destructive should map DEFAULT to hsl(var(--destructive))"
    );
    assert.match(
      destructiveEntry,
      /foreground\s*:\s*["']hsl\(var\(--destructive-foreground\)\)["']/,
      "Sanity check: destructive should map foreground to hsl(var(--destructive-foreground))"
    );

    // Verify 'warning' entry
    const warningEntry = extractTailwindColorEntry(tailwindConfig, "warning");
    assert.match(
      warningEntry,
      /DEFAULT\s*:\s*["']hsl\(var\(--warning\)\)["']/,
      "Expected warning to map DEFAULT to hsl(var(--warning))"
    );
    assert.match(
      warningEntry,
      /foreground\s*:\s*["']hsl\(var\(--warning-foreground\)\)["']/,
      "Expected warning to map foreground to hsl(var(--warning-foreground))"
    );

    // Verify 'success' entry
    const successEntry = extractTailwindColorEntry(tailwindConfig, "success");
    assert.match(
      successEntry,
      /DEFAULT\s*:\s*["']hsl\(var\(--success\)\)["']/,
      "Expected success to map DEFAULT to hsl(var(--success))"
    );
    assert.match(
      successEntry,
      /foreground\s*:\s*["']hsl\(var\(--success-foreground\)\)["']/,
      "Expected success to map foreground to hsl(var(--success-foreground))"
    );
  });
});
