import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const ScheduleCardSkeleton = () => (
  <Card className="bg-muted/30">
    <CardHeader className="pb-3">
      <div className="h-6 bg-muted animate-pulse rounded w-3/4" />
    </CardHeader>
    <CardContent className="flex flex-col gap-2">
      {/* Professor */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
      </div>
      {/* Days */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
      </div>
      {/* Time */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
      </div>
      {/* Room */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
      </div>
      {/* Remarks */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
        <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
      </div>
    </CardContent>
  </Card>
);

const ScheduleOverviewSkeleton = () => {
  return (
    <ScrollArea className="w-[20%] rounded-lg border bg-background">
      <div className="p-4 grid grid-cols-1 gap-2">
        {/* Show 4 skeleton cards */}
        {Array.from({ length: 4 }).map((_, i) => (
          <ScheduleCardSkeleton key={i} />
        ))}
      </div>
    </ScrollArea>
  );
};

export default ScheduleOverviewSkeleton;
