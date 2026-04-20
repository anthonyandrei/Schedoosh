import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const ScheduleCardSkeleton = () => (
  <Card className="bg-muted/30">
    <CardHeader className="pb-3">
      <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
    </CardHeader>
    <CardContent className="flex flex-col gap-2">
      {/* Professor */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
      {/* Days */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
      </div>
      {/* Time */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      </div>
      {/* Room */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
      </div>
      {/* Remarks */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </CardContent>
  </Card>
);

const ScheduleOverviewSkeleton = () => {
  return (
    <ScrollArea className="w-[20%] rounded-lg border bg-background">
      <div className="grid grid-cols-1 gap-2 p-4">
        {/* Show 4 skeleton cards */}
        {Array.from({ length: 4 }).map((_, i) => (
          <ScheduleCardSkeleton key={i} />
        ))}
      </div>
    </ScrollArea>
  );
};

export default ScheduleOverviewSkeleton;
