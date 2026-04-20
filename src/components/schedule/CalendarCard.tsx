"use client";

import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Class, Schedule } from "@/lib/definitions";
import {
  cn,
  formatTime,
  getCardColors,
  inferRoom,
  toProperCase,
} from "@/lib/utils";
import { useGlobalStore } from "@/stores/useGlobalStore";

interface CalendarCardProps {
  currClass: Class & ReturnType<typeof getCardColors>;
  cardHeight: number;
  top: number;
  hovered: number | false;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  isMobile?: boolean;
  sched: Schedule;
  isManual?: boolean;
  activeIndex?: number;
  cellSizePx: number;
}

interface CardDetails {
  content: string;
  className?: string;
}

const NO_DETAILS_BREAKPOINT = 50;
const SMALL_DETAILS_BREAKPOINT = 80;

const CalendarCard = ({
  currClass,
  cardHeight,
  top,
  sched,
  hovered,
  onMouseEnter,
  onMouseLeave,
  isMobile = false,
  isManual = false,
}: CalendarCardProps) => {
  const removeClass = useGlobalStore((state) => state.removeClass);
  const removeColor = useGlobalStore(
    (state) => state.removeManualScheduleColor
  );
  const handleRemoveClass = () => {
    removeClass(currClass.code);
    removeColor(currClass.course);
  };

  const isSmall = cardHeight <= SMALL_DETAILS_BREAKPOINT;
  const room = inferRoom(currClass, sched);

  const details: CardDetails[] = [
    {
      content: `${formatTime(sched.start)} - ${formatTime(sched.end)}`,
    },
    {
      content: `${isMobile ? currClass.section : ""} ${room === "TBA" ? "" : room}`,
    },
    {
      content: `${toProperCase(currClass.professor)}`,
      className: cn(isMobile && "line-clamp-2 text-wrap"),
    },
  ];

  return (
    <Card
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        hovered === currClass.code &&
          `-translate-y-2 scale-105 shadow-[0_0px_10px_3px_rgba(0,0,0,0.3)]` +
            currClass.shadow,
        `absolute w-[95%] transition-all ${currClass.color} duration-200 ease-out`,
        "flex h-full cursor-default flex-col justify-center overflow-hidden",
        currClass.border
      )}
      style={{
        height: cardHeight,
        top,
      }}
    >
      <div
        className={cn(
          "px-3 py-2 font-bold text-xs tracking-tight",
          isMobile && "text-lg",
          isManual && "flex flex-row",
          isSmall && "py-1"
        )}
      >
        <div>{`${isMobile ? "" : `[${currClass.section}]`} ${
          currClass.course
        }`}</div>
        {isManual && (
          <X
            className={cn(
              "ml-auto size-4 cursor-pointer rounded-full opacity-50 transition-all hover:bg-black/50 hover:dark:bg-black/50",
              currClass.color
            )}
            onClick={handleRemoveClass}
          />
        )}
      </div>
      {cardHeight >= NO_DETAILS_BREAKPOINT && (
        <div
          className={cn(
            "flex h-full flex-col flex-wrap justify-center gap-x-[1000px] overflow-hidden rounded-t-md bg-background px-2 py-1.5 text-xs",
            currClass.secondaryColor,
            isSmall && !isMobile && "py-1"
          )}
        >
          <div />
          {details.map((detail, index) => {
            return (
              <div
                key={index}
                className={cn(
                  "w-full truncate font-medium text-xs",
                  detail.className
                )}
              >
                {detail.content}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default CalendarCard;
