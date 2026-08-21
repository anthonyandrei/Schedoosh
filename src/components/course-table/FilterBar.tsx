"use client";

import { Table } from "@tanstack/react-table";
import {
  Calendar,
  CheckCircle,
  Clock,
  FilePen,
  FilterX,
  GraduationCap,
  Lock,
  LucideIcon,
  Monitor,
  TableOfContents,
  Tag,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FacetedFilter } from "./FacetedFilter";

interface FilterEntry {
  type: "facet" | "range";
  column: string;
  title: string;
  icon: LucideIcon;
}

interface FilterBarProps<TData> {
  table: Table<TData>;
}

export function FilterBar<TData>({ table }: FilterBarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const filterEntries: FilterEntry[] = [
    {
      type: "facet",
      column: "sectionType",
      title: "Section",
      icon: TableOfContents,
    },
    { type: "facet", column: "type", title: "Type", icon: Tag },
    { type: "facet", column: "units", title: "Units", icon: GraduationCap },
    { type: "facet", column: "Professor", title: "Professor", icon: User },
    { type: "facet", column: "schedules", title: "Schedules", icon: Clock },
    { type: "facet", column: "Days", title: "Days", icon: Calendar },
    { type: "facet", column: "modality", title: "Modality", icon: Monitor },
    { type: "facet", column: "restriction", title: "Restriction", icon: Lock },
    { type: "facet", column: "status", title: "Status", icon: CheckCircle },
    { type: "facet", column: "remarks", title: "Remarks", icon: FilePen },
  ];

  return (
    <div className="flex flex-1 flex-wrap items-center gap-2">
      {filterEntries.map(
        (filter) =>
          (table.getColumn(filter.column)?.getFacetedUniqueValues()?.size ??
            0) > 0 && (
            <FacetedFilter
              key={filter.column}
              column={table.getColumn(filter.column)}
              Icon={filter.icon}
              title={filter.title}
            />
          )
      )}
      {isFiltered && (
        <Button
          variant="ghost"
          onClick={() => table.resetColumnFilters()}
          className="h-8 px-2 lg:px-3"
        >
          Reset
          <FilterX className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
