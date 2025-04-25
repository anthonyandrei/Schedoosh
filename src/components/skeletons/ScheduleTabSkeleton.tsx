import { Card } from "@/components/ui/card";
import ButtonSkeleton from "./ButtonSkeleton";
import CalendarSkeleton from "./CalendarSkeleton";
import ScheduleOverviewSkeleton from "./ScheduleOverviewSkeleton";

const ScheduleTabSkeleton = () => {
  return (
    <div className="flex flex-row w-full min-h-0 py-8 px-16 gap-4 h-full">
      <div className="flex flex-col gap-4 grow">
        {/* Top control bar */}
        <Card className="flex flex-row gap-4 p-4">
          <div className="flex flex-row gap-2">
            {/* Navigation buttons and dropdown */}
            <ButtonSkeleton isIcon />
            <div className="w-64 h-10 bg-muted animate-pulse rounded-md" />
            <ButtonSkeleton isIcon />
          </div>

          {/* Generate button */}
          <ButtonSkeleton className="w-40" />

          {/* Filter button */}
          <ButtonSkeleton className="w-32" />

          {/* Right side buttons */}
          <div className="ml-auto flex gap-2">
            <ButtonSkeleton isIcon />
            <ButtonSkeleton isIcon />
            <ButtonSkeleton className="w-32" />
          </div>
        </Card>

        {/* Calendar area */}
        <CalendarSkeleton />
      </div>

      {/* Schedule overview */}
      <ScheduleOverviewSkeleton />
    </div>
  );
};

export default ScheduleTabSkeleton;
