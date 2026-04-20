import { SearchSlash, UsersRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import useBetterMediaQuery from "@/hooks/useBetterMediaQuery";
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import TooltipWrapper from "../wrappers/TooltipWrapper";
import { TOP_OFFSET } from "./Calendar";
import OverviewCard from "./OverviewCard";

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

  const isMobile = useBetterMediaQuery("(max-width: 720px)");

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

  const onDrawerClose = (newVal: boolean) => {
    if (newVal === false) setSelection(null);
  };

  if (isMobile) {
    return (
      <div>
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
            "absolute flex w-full animate-border-pulse select-none items-center justify-between border-primary/50 bg-primary/10 p-2 text-accent-foreground text-xs",
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
            className="cursor-pointer rounded-full p-1 text-muted-foreground transition-colors duration-200 ease-in-out hover:bg-destructive/80 hover:text-destructive-foreground"
            onClick={() => setSelection(null)}
          >
            <X className="size-4" />
          </span>
        </Card>
        <Drawer open={selection && !dragging} onOpenChange={onDrawerClose}>
          <DrawerContent>
            <DrawerHeader className="gap-4 text-left">
              <DrawerTitle>Select a Class</DrawerTitle>
              <DrawerDescription className="inline-flex w-full items-center gap-2">
                <Switch
                  id="between-switch"
                  checked={showOngoing}
                  onCheckedChange={setShowOngoing}
                  className="h-5 [&>*]:h-4"
                />
                <Label className="text-nowrap" htmlFor="between-switch">
                  Include classes happening during this time?
                </Label>
              </DrawerDescription>
            </DrawerHeader>

            <div className="p-4 pt-0">
              {hasViableData ? (
                <ScrollArea className="mt-4 w-full [&>[data-radix-scroll-area-viewport]]:max-h-[500px]">
                  <div className="flex w-full flex-col gap-4">
                    {viableData.map((course) => (
                      <div
                        key={course.courseCode}
                        className="flex flex-col gap-2"
                      >
                        <h3 className="font-semibold text-sm">
                          {course.courseCode}
                        </h3>
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
                <div className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border border-dashed py-8 text-muted-foreground">
                  <SearchSlash className="size-5" />
                  {uniqueCourses.length === usedCourses.size
                    ? "You've already added all available courses"
                    : "No classes found..."}
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

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
            "absolute flex w-full animate-border-pulse select-none items-center justify-between border-primary/50 bg-primary/10 p-2 text-accent-foreground text-xs",
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
            className="cursor-pointer rounded-full p-1 text-muted-foreground transition-colors duration-200 ease-in-out hover:bg-destructive/80 hover:text-destructive-foreground"
            onClick={() => setSelection(null)}
          >
            <X className="size-4" />
          </span>
        </Card>
      </PopoverAnchor>
      <PopoverContent
        side="right"
        className="w-max max-w-[700px]"
        ref={popoverRef}
      >
        <div className="flex w-[500px] flex-col gap-2">
          <h2 className="font-bold text-xl">Select a Class</h2>
          <div className="inline-flex w-full items-center gap-2">
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
          <ScrollArea className="mt-4 w-full [&>[data-radix-scroll-area-viewport]]:max-h-[500px]">
            <div className="flex w-full flex-col gap-4">
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
          <div className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border border-dashed py-8 text-muted-foreground">
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
        className="flex w-full flex-row items-center justify-start gap-2 text-xs"
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
          className="inline-flex items-center gap-2"
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
