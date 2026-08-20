import {
  CalendarClock,
  Clock,
  Copy,
  DoorOpen,
  FilePen,
  LucideIcon,
  User,
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Class, Schedule } from "@/lib/definitions";
import { ColorsEnum } from "@/lib/enums";
import {
  cn,
  formatProfessorName,
  formatTime,
  getCardColors,
} from "@/lib/utils";
import TooltipWrapper from "../wrappers/TooltipWrapper";

interface cardItem {
  icon: LucideIcon;
  content: string;
  shouldRender: boolean;
}

export interface ScheduleWithMultipleDays extends Schedule {
  combinedDays: string;
}

interface OverviewCardProps extends React.HTMLAttributes<HTMLDivElement> {
  classData: Class;
  colors: Record<string, ColorsEnum>;
  className?: string;
}

export default function OverviewCard({
  classData,
  colors,
  className,
  ...props
}: OverviewCardProps) {
  const uniqueSchedules = classData.schedules.reduce<
    ScheduleWithMultipleDays[]
  >((acc, curr) => {
    if (curr.start === curr.end) return acc;

    const similarSched = acc.findIndex(
      (sched) =>
        sched.start === curr.start &&
        sched.end === curr.end &&
        sched.date === curr.date
    );

    if (similarSched === -1) {
      acc.push({ ...curr, combinedDays: curr.day });
    } else {
      if (!acc[similarSched].combinedDays.includes(curr.day))
        acc[similarSched].combinedDays += `/${curr.day}`;
    }
    return acc;
  }, []);

  const uniqueDays = [
    ...new Set(
      classData.schedules.map((sched) => {
        if (sched.day === "U") return sched.date ? sched.date : "TBA";

        return sched.day;
      })
    ),
  ];

  const uniqueRooms = [
    ...new Set(
      classData.schedules.map((sched) => sched.room.trim()).filter((r) => r)
    ),
  ];

  const classDetails: cardItem[] = [
    {
      icon: User,
      content: formatProfessorName(classData.professor) || "TBA",
      shouldRender: classData.professor !== "",
    },
    {
      icon: CalendarClock,
      content: uniqueDays.join("/"),
      shouldRender: true,
    },
    ...uniqueSchedules.map((sched) => ({
      icon: Clock,
      content: `${formatTime(sched.start)} - ${formatTime(sched.end)} ${`(${
        sched.combinedDays === "U" ? sched.date : sched.combinedDays
      })`}`,
      shouldRender: sched.start !== sched.end,
    })),
    {
      icon: DoorOpen,
      content: uniqueRooms.join("/"),
      shouldRender: uniqueRooms.length !== 0,
    },
    {
      icon: FilePen,
      content: classData.remarks,
      shouldRender: classData.remarks !== "",
    },
  ];

  const { color, secondaryColor } = getCardColors(colors[classData.course]);

  return (
    <Card
      key={classData.code}
      className={cn(
        "overflow-hidden border-none bg-background",
        className,
        secondaryColor
      )}
      {...props}
    >
      <CardHeader className={cn(color, "mb-4 p-2.5 px-4")}>
        <div className="flex items-center gap-2 font-bold text-lg">
          <div
            className={cn(
              secondaryColor,
              "inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            )}
          >
            {classData.section}
          </div>
          {classData.course}
          <TooltipWrapper content="Copy" delayDuration={0}>
            <span
              onClick={() => {
                toast.success("Successfully copied class code to clipboard!");
                navigator.clipboard.writeText(`${classData.code}`);
              }}
              className="group ml-auto inline-flex cursor-pointer items-center font-medium text-sm opacity-50 transition-opacity duration-200 hover:opacity-100"
            >
              #{classData.code} <Copy className="ml-2 size-4" strokeWidth={3} />
            </span>
          </TooltipWrapper>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pb-4 text-sm">
        {classDetails.map((item, index) => {
          if (!item.shouldRender) return null;
          return (
            <div key={index} className="inline-flex items-center gap-2 text-sm">
              <item.icon className="mr-2 size-4 shrink-0" strokeWidth={3} />
              {item.content}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
