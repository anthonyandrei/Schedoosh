"use client";

import { ColumnDef } from "@tanstack/react-table";
import { SquareArrowOutUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Class, Schedule } from "@/lib/definitions";
import { formatTime, getArcherEyeUrl, toProperCase } from "@/lib/utils";
import TooltipWrapper from "../wrappers/TooltipWrapper";
import RowSettings from "./RowSettings";
import { SortableHeader } from "./SortableHeader";

export const columns: ColumnDef<Class>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        className="flex h-4 w-4 border-secondary"
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        className="flex h-4 w-4 border-secondary"
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    meta: {
      headerClassName: "w-10",
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "code",
    header: "Code",
    filterFn: "includesString",
    meta: {
      headerClassName: "w-12",
    },
  },
  {
    accessorKey: "section",
    header: ({ column }) => (
      <SortableHeader
        className="min-w-12 max-w-16"
        column={column}
        title={"Section"}
      />
    ),
    meta: {
      headerClassName: "w-20",
    },
  },
  {
    id: "Professor",
    accessorFn: (row) => {
      return row.professor.length !== 0 ? toProperCase(row.professor) : "-";
    },
    meta: {
      headerClassName: "w-[300px] nowrap",
    },
    header: ({ column }) => (
      <SortableHeader column={column} title={"Professor"} />
    ),
    filterFn: "arrIncludesSome",
    cell: ({ row, cell }) => {
      const profName = cell.getValue() as string;
      if (!row.original.professor || profName === "-") return "-";

      const archerEyeUrl = getArcherEyeUrl(row.original.professor);

      if (!archerEyeUrl) {
        return <span>{profName}</span>;
      }

      return (
        <TooltipWrapper content="View ArcherEye Profile" delayDuration={300}>
          <a
            href={archerEyeUrl}
            target="_blank"
            className="inline-flex items-center gap-2"
            rel="noopener"
          >
            {profName}{" "}
            <SquareArrowOutUpRight
              className="size-3 shrink-0 text-accent-foreground"
              strokeWidth={2.5}
            />
          </a>
        </TooltipWrapper>
      );
    },
  },
  {
    header: "Schedules",
    cell: ({ row }) => {
      const schedules = row.original.schedules.reduce<Schedule[]>(
        (acc, curr) => {
          if (
            !acc.some((acc) => acc.start === curr.start && acc.end === curr.end)
          )
            acc.push(curr);
          return acc;
        },
        []
      );
      return (
        <div className="flex flex-col gap-1">
          {schedules.map((sched, i) => {
            if (i !== 0 && sched.start === sched.end) return null;

            return (
              <Badge
                key={i}
                variant="outline"
                className={`flex w-[160px] select-none items-center justify-center gap-2 rounded-lg bg-background/50 p-2 px-4 font-medium`}
              >
                {sched.start === sched.end
                  ? "N/A"
                  : `${formatTime(sched.start)} - ${formatTime(sched.end)}`}
              </Badge>
            );
          })}
        </div>
      );
    },
  },
  {
    header: "Room",
    accessorFn: (row) => {
      const filtered = [
        ...new Set(row.schedules.map(({ room }) => room).filter((r) => r)),
      ];

      if (filtered.length === 0) return "-";

      return filtered.join(", ");
    },
    meta: {
      headerClassName: "w-[100px]",
    },
  },
  {
    header: "Days",
    accessorFn: (row) => {
      const days = [...new Set(row.schedules.map((sched) => sched.day))];
      const dates = [...new Set(row.schedules.map((sched) => sched.date))];

      // Case: If there are 4 days, it most likely means that their schedule are in pairs
      // i.e. MT is 3:30 to 4:30 and HF is 2:30 to 3:30
      if (days.length === 4)
        return `${days.slice(0, 2).join("")}/${days.slice(2).join("")}`;

      if (dates[0].length !== 0) {
        return dates.join("/");
      }

      return days.join("/");
    },
    filterFn: "arrIncludesSome",
  },
  {
    id: "enrolled",
    header: ({ column }) => (
      <SortableHeader column={column} title={"Enrolled"} />
    ),
    accessorKey: "enrolled",
    cell: ({ row }) => `${row.original.enrolled}/${row.original.enrollCap}`,
  },

  {
    id: "modality",
    accessorKey: "modality",
    meta: {
      headerClassName: "w-[100px]",
    },
    filterFn: "arrIncludesSome",
    enableHiding: false,
  },
  {
    id: "restriction",
    accessorKey: "restriction",
    filterFn: "arrIncludesSome",
    enableHiding: false,
  },

  {
    header: "Remarks",
    accessorKey: "remarks",
    filterFn: "arrIncludesSome",
  },
  {
    id: "status",
    accessorFn: (row) => {
      const isClosed = row.enrolled >= row.enrollCap;

      return isClosed ? "Closed" : "Open";
    },
    filterFn: "arrIncludesSome",
    enableHiding: false,
  },
  {
    id: "sectionType",
    accessorFn: (row) => {
      const sectionType = row.section.replaceAll(/[0-9]/g, "");

      return sectionType;
    },
    filterFn: (row, columnId, filterValue) => {
      const sectionType = row.getValue(columnId) as string;

      return filterValue.some((val: string) => sectionType === val);
    },
    enableHiding: false,
  },
  {
    id: "action",
    cell: ({ row }) => {
      return <RowSettings data={row.original} />;
    },
    enableHiding: false,
  },
  {
    id: "schedules",
    enableHiding: false,
    accessorFn: (row) => {
      const schedules = row.schedules.reduce<Schedule[]>((acc, curr) => {
        if (
          !acc.some((acc) => acc.start === curr.start && acc.end === curr.end)
        )
          acc.push(curr);
        return acc;
      }, []);

      return schedules.map(
        (sched) => `${formatTime(sched.start)} - ${formatTime(sched.end)}`
      );
    },
    filterFn: (row, _columnId, filterValue) => {
      const formattedSchedules = row.original.schedules.map(
        (sched) => `${formatTime(sched.start)} - ${formatTime(sched.end)}`
      );

      return filterValue.some((val: string) =>
        formattedSchedules.includes(val)
      );
    },
  },
];
