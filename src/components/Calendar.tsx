"use client";
import useManualSchedule from "@/hooks/useManualSchedule";
import { Class } from "@/lib/definitions";
import { ColorsEnum, DaysEnum } from "@/lib/enums";
import { calculateHeight, cn, getCardColors } from "@/lib/utils";
import { useGlobalStore } from "@/stores/useGlobalStore";
import { useState } from "react";
import CalendarCard from "./CalendarCard";
import ManualScheduleCard from "./ManualScheduleCard";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Slider } from "./ui/slider";

export const CELL_SIZE_PX = 68;
export const TOP_OFFSET = 16; // Based on 16px (1rem) padding in the calendar
export const LEFT_OFFSET = 66; // Based on 50px + 4rem (16px)

interface CalendarProps {
  classes: Class[];
  colors: Record<string, ColorsEnum>;
  cellSizePx?: number;
  isMobile?: boolean;
  manualProps?: ReturnType<typeof useManualSchedule>;
  className?: string;
  noAnimations?: boolean;
}

const Calendar = ({
  classes,
  colors,
  cellSizePx,
  isMobile = false,
  manualProps,
  className,
  noAnimations,
}: CalendarProps) => {
  // This is the default zoom level
  const zoom = useGlobalStore((state) => state.zoom);
  const setZoom = useGlobalStore((state) => state.setZoom);

  // Acts as a buffer for the zoom slider
  const [cellSize, setCellSize] = useState(() => cellSizePx ?? zoom);

  const { dragging, selection, setSelection, popoverRef, ...listeners } =
    manualProps ?? {};

  const [hovered, setHovered] = useState<number | false>(false);

  const sortedClasses = classes.reduce<
    Record<DaysEnum, (Class & ReturnType<typeof getCardColors>)[]>
  >(
    (acc, course) => {
      for (const sched of course.schedules) {
        if (sched.day !== "U") {
          const cardColors = getCardColors(colors[course.course]);

          acc[sched.day].push({
            ...cardColors,
            ...course,
          });
        }
      }

      return acc;
    },
    { M: [], T: [], W: [], H: [], F: [], S: [] }
  );

  const headerStyle =
    "relative h-full w-full text-center py-2 px-2 mx-2 font-bold ";

  const handleMouseUp = () => {
    setZoom(cellSize);
  };

  return (
    <div
      className={cn(
        "flex flex-shrink min-h-0 w-full flex-col border border-border rounded-lg bg-background grow overflow-hidden",
        className
      )}
    >
      {!noAnimations && (
        <div className="w-full border border-border px-4 py-1 inline-flex gap-4 items-center">
          <span className="font-semibold text-xs text-nowrap">Zoom</span>
          <Slider
            min={36}
            max={100}
            value={[cellSize]}
            onValueChange={(value) => setCellSize(value[0])}
            onValueCommit={handleMouseUp}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCellSize(CELL_SIZE_PX);
              setZoom(CELL_SIZE_PX);
            }}
          >
            {" "}
            Reset
          </Button>
        </div>
      )}
      {/* Day Indicator Row */}
      <div className="flex w-full flex-row border-b bg-primary/90 text-primary-foreground dark:text-secondary-foreground dark:bg-secondary/40 dark:border-muted py-1">
        <div className="w-[50px] shrink-0" />
        <div className="w-2 shrink-0" />

        <div className={headerStyle}>MONDAY</div>
        <div className={headerStyle}>TUESDAY</div>
        <div className={headerStyle}>WEDNESDAY</div>
        <div className={headerStyle}>THURSDAY</div>
        <div className={headerStyle}>FRIDAY</div>
        <div className={headerStyle}>SATURDAY</div>
      </div>

      {/* Scrollable Container */}
      <ScrollArea>
        {/* Calendar Content */}
        <div className="flex h-max w-full flex-row" {...listeners}>
          {/* Time Column */}
          <div className="ml-2 flex w-[50px] shrink-0 flex-col items-end">
            {[...Array(16)].map((_, index) => (
              <div
                className="shrink-0"
                key={"time" + index}
                style={{
                  height: cellSize,
                }}
              >
                {" "}
                <span className="relative top-[3px] w-7 text-nowrap pr-2 text-right text-xs text-gray-500">
                  {index + 7 > 12 ? index - 5 : index + 7}{" "}
                  {index + 7 >= 12 ? "PM" : "AM"}
                </span>
              </div>
            ))}
          </div>

          <div className="relative flex w-full flex-row">
            {/* Row Separators */}
            <div className="h-full w-0 pt-4">
              {[...Array(16)].map((_, index) => (
                <div
                  className="after:absolute after:h-[1px] after:w-full after:dark:bg-muted/50 after:bg-muted after:content-['']"
                  style={{
                    height: index === 15 ? "0" : cellSize,
                  }}
                  key={index}
                />
              ))}
            </div>

            <div className="h-full w-2 shrink-0" />
            {(Object.keys(sortedClasses) as Array<DaysEnum>).map((day) => {
              return (
                <div
                  className={cn(
                    `relative flex h-full w-full flex-col border-l border-muted/50 pr-2`,
                    ["M", "W", "F"].includes(day) &&
                      "dark:bg-muted/10 bg-muted/30",
                    !noAnimations &&
                      "animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
                  )}
                  key={day}
                >
                  {manualProps && selection?.day === day && (
                    <ManualScheduleCard
                      manualProps={manualProps}
                      cellSize={cellSize}
                    />
                  )}
                  {sortedClasses[day].map((currClass) => {
                    const schedules = currClass.schedules.filter(
                      (sched) => sched.day === day
                    );

                    return schedules.map((sched, i) => {
                      const start = sched.start;
                      const end = sched.end;

                      return (
                        <CalendarCard
                          key={`${currClass.course}${day}${i}`}
                          currClass={currClass}
                          sched={sched}
                          cardHeight={calculateHeight({
                            start,
                            end,
                            cellSizePx: cellSize,
                          })}
                          top={
                            calculateHeight({
                              start: 700,
                              end: start,
                              cellSizePx: cellSize,
                            }) + TOP_OFFSET
                          }
                          hovered={hovered}
                          onMouseEnter={() => setHovered(currClass.code)}
                          onMouseLeave={() => setHovered(false)}
                          isMobile={isMobile}
                          isManual={!!manualProps}
                          cellSizePx={cellSize}
                        />
                      );
                    });
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Calendar;
