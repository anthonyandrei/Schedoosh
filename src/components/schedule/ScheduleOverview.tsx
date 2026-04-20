import React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Class } from "@/lib/definitions";
import { ColorsEnum } from "@/lib/enums";
import { cn } from "@/lib/utils";
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
        "min-h-min w-full min-w-[300px] shrink-0 rounded-lg border bg-background lg:w-[20%]",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-row gap-3 p-4 lg:grid",
          columns === 1 ? "lg:grid-cols-1" : "lg:grid-cols-2",
          !noAnimations &&
            "fade-in-0 slide-in-from-bottom-4 animate-in duration-1000"
        )}
        {...props}
      >
        {activeSchedule?.map((classData) => (
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
