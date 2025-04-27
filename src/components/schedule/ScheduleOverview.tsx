import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Class } from "@/lib/definitions";
import { ColorsEnum } from "@/lib/enums";
import { cn } from "@/lib/utils";
import React from "react";
import OverviewCard from "./OverviewCard";

interface ScheduleOverviewProps extends React.HTMLAttributes<HTMLDivElement> {
  activeSchedule: Class[];
  colors: Record<string, ColorsEnum>;
  columns?: 1 | 2;
  noAnimations?: boolean;
}

const ScheduleOverview = ({
  activeSchedule,
  colors,
  columns = 1,
  className,
  noAnimations = false,
  ...props
}: ScheduleOverviewProps) => {
  return (
    <ScrollArea
      className={cn(
        "w-full lg:w-[20%] min-w-[300px] rounded-lg border bg-background min-h-min shrink-0",
        className
      )}
    >
      <div
        className={cn(
          "p-4 flex flex-row lg:grid gap-3",
          columns === 1 ? "lg:grid-cols-1" : "lg:grid-cols-2",
          !noAnimations &&
            "animate-in fade-in-0 slide-in-from-bottom-4 duration-1000"
        )}
        {...props}
      >
        {activeSchedule &&
          activeSchedule.map((classData) => (
            <OverviewCard
              classData={classData}
              colors={colors}
              key={classData.course + classData.code}
              className="shrink-0"
            />
          ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default ScheduleOverview;
