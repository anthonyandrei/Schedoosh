"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useBetterMediaQuery from "@/hooks/useBetterMediaQuery";
import { getFacetedUniqueValues } from "@/lib/table-functions";
import { useGlobalStore } from "@/stores/useGlobalStore";
import { Eraser, FilterIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import DialogWrapper from "../wrappers/GenericDialog";
import AddCustomClass from "./AddCustomClass";
import { FilterBar } from "./FilterBar";
import ViewColumnsDropdown from "./ViewColumnsDropdown";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  lastFetched?: Date;
  activeCourse: string;
  isCustom?: boolean | null;
}

export function CourseDataTable<TData, TValue>({
  columns,
  data,
  lastFetched,
  activeCourse,
  isCustom = false,
}: DataTableProps<TData, TValue>) {
  const {
    columnFilters,
    setColumnFilters,
    selectedRows,
    setSelectedRows,
    columnVisibility,
    setColumnVisibility,
  } = useGlobalStore(
    useShallow((state) => ({
      columnFilters: state.columnFilters[activeCourse],
      setColumnFilters: state.setColumnFilters,
      selectedRows: state.selectedRows,
      setSelectedRows: state.setSelectedRows,
      columnVisibility: state.columnVisibility,
      setColumnVisibility: state.setColumnVisibility,
    }))
  );
  const [sorting, setSorting] = useState<SortingState>([]);

  // IMPORANT: This code is required since if there's no entry in
  // courseColumnFilters for the activeCourse, the table will
  // infinitely re-render. This is a bug in the library.
  // I have no idea why this happens, but this is a workaround.

  useEffect(() => {
    if (!columnFilters) {
      setColumnFilters(activeCourse, []);
    }
  }, [activeCourse, columnFilters, setColumnFilters]);

  const rowSelection = selectedRows[activeCourse] || {};

  const hiddenColumns = {
    courseCode: false,
    modality: false,
    restriction: false,
    status: false,
    sectionType: false,
    schedules: false,
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: (updater) => {
      const newRowSelectionValue =
        updater instanceof Function ? updater(rowSelection) : updater;
      setSelectedRows(activeCourse, newRowSelectionValue);
    },
    onColumnFiltersChange: (updater) => {
      const newColumnFiltersValue =
        updater instanceof Function ? updater(columnFilters) : updater;
      setColumnFilters(activeCourse, newColumnFiltersValue);
    },
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: (updater) => {
      const newColumnVisibilityValue =
        updater instanceof Function ? updater(columnVisibility) : updater;
      setColumnVisibility(newColumnVisibilityValue);
    },
    state: {
      columnFilters: columnFilters ?? [],
      rowSelection,
      sorting,
      columnVisibility: { ...columnVisibility, ...hiddenColumns },
    },
  });

  const isMobile = useBetterMediaQuery("(max-width: 720px)");

  return (
    <div className="flex shrink-0 grow flex-col gap-2 min-w-0 min-h-0 max-h-[600px] lg:max-h-max">
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-2">
        <Input
          placeholder="Search by code..."
          value={(table.getColumn("code")?.getFilterValue() as string) ?? ""}
          onChange={(event) => {
            table.getColumn("code")?.setFilterValue(event.target.value);
          }}
          className="h-8 w-full lg:w-[150px]"
        />
        <div className="inline-flex gap-2 *:flex-1">
          {isCustom && <AddCustomClass courseCode={activeCourse} />}
          {!!table.getSelectedRowModel().rows.length && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => table.toggleAllRowsSelected(false)}
            >
              <Eraser className="size-4 mr-2" /> Deselect All
            </Button>
          )}
          <ViewColumnsDropdown table={table} />
        </div>
      </div>
      {isMobile ? (
        <DialogWrapper
          trigger={
            <Button variant="outline" size="sm" className="shrink-0">
              <FilterIcon className="size-4 mr-2" /> Open Filters
            </Button>
          }
          title="Filters"
          description="Filter the table by any column."
        >
          <div className="mb-8">
            <FilterBar table={table} />
          </div>
        </DialogWrapper>
      ) : (
        <div>
          <FilterBar table={table} />
        </div>
      )}
      <ScrollArea className="rounded-md border overflow-auto" type="scroll">
        <Table className="overflow-auto">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={header.column.columnDef.meta?.headerClassName}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.columnDef.meta?.cellClassName}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="vertical" />
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <div className="text-sm text-muted-foreground">
        {`${Object.keys(rowSelection).length} out of ${
          data.length
        } rows selected. ${
          lastFetched
            ? `Last Fetched: ${new Date(lastFetched).toLocaleString()}`
            : ""
        }`}
      </div>
    </div>
  );
}
