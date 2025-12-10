import { getMemoOptions, memo, RowData, Table } from "@tanstack/react-table";

export function getFacetedUniqueValues<TData extends RowData>(): (
  table: Table<TData>,
  columnId: string
) => () => Map<any, number> {
  return (table, columnId) =>
    memo(
      () => [table.getColumn(columnId)?.getFacetedRowModel()],
      (facetedRowModel) => {
        if (!facetedRowModel) return new Map();

        const facetedUniqueValues = new Map<any, number>();

        for (let i = 0; i < facetedRowModel.flatRows.length; i++) {
          const values =
            facetedRowModel.flatRows[i]!.getUniqueValues<number>(columnId);

          for (let j = 0; j < values.length; j++) {
            const flattenedValues = (
              Array.isArray(values[j]) ? values[j] : [values[j]]
            ) as number[];

            for (let k = 0; k < flattenedValues.length; k++) {
              const value = flattenedValues[k];
              facetedUniqueValues.set(
                value,
                (facetedUniqueValues.get(value) ?? 0) + 1
              );
            }
          }
        }

        return facetedUniqueValues;
      },
      getMemoOptions(
        table.options,
        "debugTable",
        `getFacetedUniqueValues_${columnId}`
      )
    );
}
