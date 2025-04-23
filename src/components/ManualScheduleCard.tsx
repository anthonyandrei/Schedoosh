import useManualSchedule from "@/hooks/useManualSchedule";
import { Class, Course, Schedule } from "@/lib/definitions";
import { DaysEnum } from "@/lib/enums";
import { doClassesOverlap, getRandomColors } from "@/lib/schedules";
import {
  calculateHeight,
  cn,
  formatTime,
  minutesToMilitaryTime,
  toProperCase,
} from "@/lib/utils";
import { useGlobalStore } from "@/stores/useGlobalStore";
import { SearchSlash, UsersRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import { TOP_OFFSET } from "./Calendar";
import TooltipWrapper from "./common/TooltipWrapper";
import OverviewCard from "./OverviewCard";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Popover, PopoverAnchor, PopoverContent } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { Switch } from "./ui/switch";

interface ManualScheduleCardProps {
  manualProps: ReturnType<typeof useManualSchedule>;
  cellSize: number;
}
export default function ManualScheduleCard({
  manualProps,
  cellSize,
}: ManualScheduleCardProps) {
  const [showOngoing, setShowOngoing] = useState(false);
  const setManualSchedule = useGlobalStore((state) => state.setManualSchedule);
  const schedule = useGlobalStore((state) => state.manualSchedule);
  const selectedData: Course[] = useGlobalStore(
    (state) => state.getSelectedData
  )();
  const { dragging, selection, setSelection, popoverRef } = manualProps;
  const startTime = selection ? minutesToMilitaryTime(selection.start) : null;
  const endTime = selection ? minutesToMilitaryTime(selection.end) : null;
  const day = selection ? selection.day : null;
  const is15MinSlot = selection
    ? selection.end - selection.start === 15
    : false;

  const usedCourses = useMemo(() => {
    return new Set([...schedule.classes.map((course) => course.course)]);
  }, [schedule]);

  const uniqueCourses = useMemo(() => {
    return [...new Set(selectedData.map((course) => course.courseCode))];
  }, [selectedData]);

  const viableData = useMemo(() => {
    if (!schedule || dragging || !startTime || !endTime || !day || !schedule)
      return [];

    return selectedData
      .map((course) => {
        if (usedCourses.has(course.courseCode))
          return { ...course, classes: [] };

        const viableClasses = course.classes.filter(({ schedules }) => {
          const overlapsWithExisting = schedule.classes.some(
            ({ schedules: existingSched }) =>
              doClassesOverlap(schedules, existingSched)
          );

          if (overlapsWithExisting) return false;

          if (showOngoing)
            return schedules.some(
              (sched) =>
                sched.day === day &&
                sched.start < endTime &&
                startTime < sched.end
            );

          if (is15MinSlot)
            return schedules.some(
              (sched) => sched.day === day && sched.start === startTime
            );

          return schedules.some(
            (sched) =>
              sched.day === day &&
              startTime <= sched.start &&
              endTime >= sched.end
          );
        });

        return {
          ...course,
          classes: viableClasses,
        };
      })
      .filter((course) => course.classes.length > 0);
  }, [
    selectedData,
    startTime,
    endTime,
    day,
    schedule,
    showOngoing,
    is15MinSlot,
    dragging,
    usedCourses,
  ]);

  if (!schedule || !selection) return null;

  const hasViableData = viableData.length > 0;
  const handleAddClass = (classData: Class) => {
    const courseColor = getRandomColors([classData.course]);
    setManualSchedule({
      ...schedule,
      classes: [...schedule.classes, classData],
      colors: {
        ...schedule.colors,
        ...courseColor,
      },
    });
    setSelection(null);
  };

  return (
    <Popover open={selection && !dragging}>
      <PopoverAnchor asChild>
        <Card
          style={{
            height: calculateHeight({
              start: selection.start,
              end: selection.end,
              cellSizePx: cellSize,
              type: "minutes",
            }),
            top:
              calculateHeight({
                start: 420,
                end: selection.start,
                type: "minutes",
                cellSizePx: cellSize,
              }) + TOP_OFFSET,
          }}
          className={cn(
            "bg-primary/10 border-primary/50 animate-border-pulse absolute p-2 flex items-center text-xs justify-between select-none text-accent-foreground w-full",
            dragging && "cursor-grabbing"
          )}
        >
          {is15MinSlot
            ? `Starts at ${formatTime(selection.start, "minutes")}`
            : `${formatTime(selection.start, "minutes")} - ${formatTime(
                selection.end,
                "minutes"
              )}`}
          <span
            className="rounded-full p-1 text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/80 transition-colors duration-200 ease-in-out cursor-pointer"
            onClick={() => setSelection(null)}
          >
            <X className="size-4" />
          </span>
        </Card>
      </PopoverAnchor>
      <PopoverContent
        side="right"
        className="max-w-[700px] w-max"
        ref={popoverRef}
      >
        <div className="flex flex-col gap-2 w-[500px]">
          <h2 className="font-bold text-xl">Select a Class</h2>
          <div className="inline-flex items-center gap-2 w-full">
            <Switch
              id="between-switch"
              checked={showOngoing}
              onCheckedChange={setShowOngoing}
              className="h-5 [&>*]:h-4"
            />
            <Label className="text-nowrap" htmlFor="between-switch">
              Include classes happening during this time?
            </Label>
          </div>
        </div>
        {hasViableData ? (
          <ScrollArea className="mt-4 [&>[data-radix-scroll-area-viewport]]:max-h-[500px] w-full">
            <div className="flex flex-col gap-4 w-full">
              {viableData.map((course) => (
                <div key={course.courseCode} className="flex flex-col gap-2">
                  <h3 className="font-semibold text-sm">{course.courseCode}</h3>
                  <div className="flex flex-col gap-2">
                    {course.classes.map((classData) => (
                      <AvailableClassButton
                        key={classData.code}
                        classData={classData}
                        handleClick={handleAddClass}
                        givenDay={selection.day}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="mt-4 rounded-lg py-8 border-dashed border-border border inline-flex items-center justify-center gap-2 text-muted-foreground w-full">
            <SearchSlash className="size-5" />
            {uniqueCourses.length === usedCourses.size
              ? "You've already added all available courses"
              : "No classes found..."}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface AvailableClassButtonProps {
  classData: Class;
  handleClick: (classData: Class) => void;
  givenDay: DaysEnum;
}

function AvailableClassButton({
  classData,
  handleClick,
  givenDay,
}: AvailableClassButtonProps) {
  // Just assert, since we know the schedule exists
  const schedule = classData.schedules.find(
    ({ day }) => day === givenDay
  ) as Schedule;

  return (
    <TooltipWrapper
      key={classData.code}
      content={
        <OverviewCard
          classData={classData}
          colors={{
            [classData.course]: "EMERALD",
          }}
          className="my-2"
        />
      }
      delayDuration={0}
      side="right"
    >
      <Button
        className="flex flex-row items-center gap-2 w-full justify-start text-xs"
        variant="outline"
        size="sm"
        onClick={() => handleClick(classData)}
      >
        <Badge variant="secondary">{classData.section}</Badge>
        <span className="max-w-[20ch] truncate">
          {classData.professor ? toProperCase(classData.professor) : "TBA"}
        </span>
        <Badge className="ml-auto" variant="secondary">
          {formatTime(schedule.start)} - {formatTime(schedule.end)}
        </Badge>
        <Badge
          className="inline-flex gap-2 items-center"
          variant={
            classData.enrollCap === classData.enrolled
              ? "destructive"
              : "default"
          }
        >
          <UsersRound className="size-4" /> {classData.enrolled}/
          {classData.enrollCap}
        </Badge>
      </Button>
    </TooltipWrapper>
  );
}
