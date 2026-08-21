import assert from "node:assert/strict";
import test from "node:test";
import { FilterBar } from "../FilterBar";

function makeColumn(size: number) {
  return {
    getFacetedUniqueValues: () =>
      new Map(Array.from({ length: size }, (_, i) => [i, 1])),
  };
}

function makeTable(columns: Record<string, number | undefined>) {
  return {
    getState: () => ({ columnFilters: [] }),
    // biome-ignore lint/suspicious/noExplicitAny: test stub
    getColumn: (id: string): any => {
      const size = columns[id];
      return size === undefined ? undefined : makeColumn(size);
    },
    resetColumnFilters: () => {},
    // biome-ignore lint/suspicious/noExplicitAny: minimal Table stub for a function-component call
  } as any;
}

// biome-ignore lint/suspicious/noExplicitAny: inspecting a raw React element tree
function renderedFacetKeys(table: any): string[] {
  // biome-ignore lint/suspicious/noExplicitAny: FilterBar called directly as a plain function, not via JSX
  const element = FilterBar({ table }) as any;
  const mapped = element.props.children[0];
  return (
    mapped
      .filter((c: unknown) => c !== false)
      // biome-ignore lint/suspicious/noExplicitAny: React element
      .map((c: any) => c.key)
  );
}

test("facets with zero distinct values are hidden", () => {
  const table = makeTable({
    sectionType: 3,
    type: 0,
    units: 0,
    Professor: 5,
    schedules: 2,
    Days: 4,
    modality: 3,
    restriction: 0,
    status: 2,
    remarks: 0,
  });

  assert.deepEqual(
    renderedFacetKeys(table).sort(),
    [
      "Days",
      "Professor",
      "modality",
      "schedules",
      "sectionType",
      "status",
    ].sort()
  );
});

test("a filter entry whose column doesn't exist on the table is hidden without throwing", () => {
  const table = makeTable({ sectionType: 1 });
  assert.doesNotThrow(() => FilterBar({ table }));
  assert.deepEqual(renderedFacetKeys(table), ["sectionType"]);
});

test("Type and Units facets render once populated", () => {
  const table = makeTable({ type: 2, units: 3 });
  const keys = renderedFacetKeys(table);
  assert.ok(keys.includes("type"));
  assert.ok(keys.includes("units"));
});
