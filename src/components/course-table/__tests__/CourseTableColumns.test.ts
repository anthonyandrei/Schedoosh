import assert from "node:assert/strict";
import test from "node:test";
import type { ColumnDef, HeaderContext } from "@tanstack/react-table";
import type { ReactElement } from "react";
import type { Class } from "@/lib/definitions";
import { columns } from "../CourseTableColumns";

function getColumnLabels(col: ColumnDef<Class>): string[] {
  const labels: string[] = [];
  const rawCol = col as {
    header?: string | ((props: HeaderContext<Class, unknown>) => ReactElement);
    accessorKey?: string;
    id?: string;
  };

  if (typeof rawCol.header === "string") {
    labels.push(rawCol.header);
  } else if (typeof rawCol.header === "function") {
    try {
      const rendered = rawCol.header({
        column: { getIsSorted: () => false, toggleSorting: () => {} },
        header: {} as HeaderContext<Class, unknown>["header"],
        table: {
          getIsAllPageRowsSelected: () => false,
          getIsSomePageRowsSelected: () => false,
        } as HeaderContext<Class, unknown>["table"],
      } as HeaderContext<Class, unknown>);

      if (typeof rendered === "string") {
        labels.push(rendered);
      } else if (
        rendered &&
        typeof rendered === "object" &&
        "props" in rendered
      ) {
        const props = (
          rendered as ReactElement<{ title?: string; children?: unknown }>
        ).props;
        if (typeof props?.title === "string") {
          labels.push(props.title);
        }
        if (typeof props?.children === "string") {
          labels.push(props.children);
        }
      }
    } catch {
      // ignore function evaluation errors
    }
  }

  if (typeof rawCol.accessorKey === "string") {
    labels.push(rawCol.accessorKey);
  }
  if (typeof rawCol.id === "string") {
    labels.push(rawCol.id);
  }

  return labels;
}

test("no column definition's header or label is 'Code'", () => {
  const hasCodeColumn = columns.some((col) =>
    getColumnLabels(col).includes("Code")
  );
  assert.equal(
    hasCodeColumn,
    false,
    "Expected no column definition to have header or label 'Code'"
  );
});

test("a column with header or label 'Type' exists", () => {
  const hasTypeColumn = columns.some((col) =>
    getColumnLabels(col).includes("Type")
  );
  assert.equal(
    hasTypeColumn,
    true,
    "Expected a column with header or label 'Type' to exist"
  );
});

test("a column with header or label 'Units' exists", () => {
  const hasUnitsColumn = columns.some((col) =>
    getColumnLabels(col).includes("Units")
  );
  assert.equal(
    hasUnitsColumn,
    true,
    "Expected a column with header or label 'Units' to exist"
  );
});
