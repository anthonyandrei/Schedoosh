"use client";

import { ColumnDef } from "@tanstack/react-table";
import { SquareArrowOutUpRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Class, Schedule } from "@/lib/definitions";
import { DaysEnumSchema } from "@/lib/enums";
import { formatProfessorName, formatTime, getArcherEyeUrl } from "@/lib/utils";
import TooltipWrapper from "../wrappers/TooltipWrapper";
import RowSettings from "./RowSettings";
import { SortableHeader } from "./SortableHeader";

const DAY_ORDER: readonly string[] = [...DaysEnumSchema.options, "U"];

function getDayOrderIndex(day: string): number {
  const index = DAY_ORDER.indexOf(day);
  return index !== -1 ? index : DAY_ORDER.length;
}

function formatRoom(sched: Schedule): string {
  if (sched.isOnline) return "Online";
  let room = (sched.room || "").trim();
  if (room.startsWith("[") && room.endsWith("]")) {
    room = room.slice(1, -1).trim();
  }
  room = room.replace(/^Room\s*-\s*/i, "").trim();
  if (!room) {
    return sched.isOnline ? "Online" : "TBA";
  }
  return room;
}

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
    accessorKey: "type",
    header: "Type",
    filterFn: "arrIncludesSome",
    cell: ({ row }) => row.original.type || "—",
  },
  {
    id: "Professor",
    accessorFn: (row) => {
      return formatProfessorName(row.professor) || "-";
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
            rel="noopener noreferrer"
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
    accessorKey: "units",
    header: "Units",
    cell: ({ row }) => {
      const units = row.original.units;
      if (units === undefined || units === null) return "—";
      return String(Number(units));
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
    filterFn: "includesString",
    meta: {
      headerClassName: "w-20",
    },
  },
  {
    header: "Schedules",
    cell: ({ row }) => {
      const sortedSchedules = [...row.original.schedules].sort((a, b) => {
        const dayDiff = getDayOrderIndex(a.day) - getDayOrderIndex(b.day);
        if (dayDiff !== 0) return dayDiff;
        const startDiff = a.start - b.start;
        if (startDiff !== 0) return startDiff;
        return a.end - b.end;
      });

      return (
        <div className="flex flex-col gap-1 whitespace-nowrap">
          {sortedSchedules.map((sched, i) => {
            const room = formatRoom(sched);
            return (
              <div key={i}>
                {`${sched.day}  ${formatTime(sched.start)} \u2013 ${formatTime(sched.end)}  ${room}`}
              </div>
            );
          })}
        </div>
      );
    },
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
    header: "Remarks",
    accessorKey: "remarks",
    filterFn: "arrIncludesSome",
  },
  {
    id: "action",
    cell: ({ row }) => {
      return <RowSettings data={row.original} />;
    },
    enableHiding: false,
  },
  {
    id: "Room",
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
    id: "Days",
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
