import { ScrollArea } from "@/components/ui/scroll-area";
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
        "w-[20%] min-w-[300px] rounded-lg border bg-background",
        className
      )}
    >
      <div
        className={cn(
          "p-4 grid gap-3",
          columns === 1 ? "grid-cols-1" : "grid-cols-2",
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
            />
          ))}
      </div>
    </ScrollArea>
  );
};

export default ScheduleOverview;
