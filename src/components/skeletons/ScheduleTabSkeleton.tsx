import { Card } from "@/components/ui/card";
import ButtonSkeleton from "./ButtonSkeleton";
import CalendarSkeleton from "./CalendarSkeleton";
import ScheduleOverviewSkeleton from "./ScheduleOverviewSkeleton";

const ScheduleTabSkeleton = () => {
  return (
    <div className="flex h-full min-h-0 w-full flex-row gap-4 px-16 py-8">
      <div className="flex grow flex-col gap-4">
        {/* Top control bar */}
        <Card className="flex flex-row gap-4 p-4">
          <div className="flex flex-row gap-2">
            {/* Navigation buttons and dropdown */}
            <ButtonSkeleton isIcon />
            <div className="h-10 w-64 animate-pulse rounded-md bg-muted" />
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
