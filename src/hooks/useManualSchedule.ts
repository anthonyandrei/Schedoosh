import {
  CELL_SIZE_PX,
  LEFT_OFFSET,
  TOP_OFFSET,
} from "@/components/schedule/Calendar";
import { DaysEnum } from "@/lib/enums";
import { minutesToMilitaryTime } from "@/lib/utils";
import { useGlobalStore } from "@/stores/useGlobalStore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function useManualSched() {
  const cellSize = useGlobalStore((state) => state.zoom) || CELL_SIZE_PX;

  const days = ["M", "T", "W", "H", "F", "S"] as const;
  const [dragging, setDragging] = useState(false);
  const [selection, setSelection] = useState<{
    baseStart: number;
    baseEnd: number;
    start: number;
    end: number;
    day: DaysEnum;
  } | null>(null);

  const manualSchedule = useGlobalStore((state) => state.manualSchedule);
  const activeSchedClasses = useMemo(
    () => manualSchedule?.classes ?? [],
    [manualSchedule]
  );

  const popoverRef = useRef<HTMLDivElement>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    const xPos = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const yPos = e.clientY - e.currentTarget.getBoundingClientRect().top;

    if (xPos < LEFT_OFFSET || yPos < TOP_OFFSET) return; // Ignore clicks in the time column or extra space

    const sizePerColumn = Math.floor(
      (e.currentTarget.getBoundingClientRect().width - LEFT_OFFSET) / 6
    );

    const column = Math.floor((xPos - LEFT_OFFSET) / sizePerColumn);
    const timeSlot = Math.floor((yPos - TOP_OFFSET) / (cellSize / 4));

    const startTime = 7 * 60 + 15 * timeSlot; // 7:00 AM + 15 minutes per slot

    if (selection) {
      const isInsideCard =
        selection.day === (days[column] as DaysEnum) &&
        selection.start <= startTime &&
        selection.end >= startTime + 15;

      if (!isInsideCard && !popoverRef.current?.contains(e.target as Node)) {
        setDragging(false);
        setSelection(null);
      }
      return;
    }

    if (activeSchedClasses.length > 0) {
      const militaryStartTime = minutesToMilitaryTime(startTime);
      const isInsideCard = activeSchedClasses.some((classItem) => {
        return classItem.schedules.some(
          (classSched) =>
            classSched.day === (days[column] as DaysEnum) &&
            militaryStartTime >= classSched.start &&
            militaryStartTime < classSched.end
        );
      });

      if (isInsideCard) return;
    }

    setDragging(true);
    setSelection({
      baseStart: startTime,
      baseEnd: startTime + 15,
      start: startTime,
      end: startTime + 15,
      day: days[column] as DaysEnum,
    });
  };

  const handleMouseUp = (e: MouseEvent) => {
    setDragging(false);
  };

  const checkOverlappingSchedules = useCallback(
    (
      militaryTime: number,
      militaryStartTime: number,
      militaryEndTime: number
    ) => {
      return activeSchedClasses.some((classItem) => {
        return classItem.schedules.some((classSched) => {
          // Case 1: The manual sched is above the class sched
          const condition1 =
            militaryTime >= classSched.start &&
            militaryEndTime <= classSched.end;

          // Case 2: The manual sched is below the class sched
          const condition2 =
            militaryTime < classSched.end &&
            militaryStartTime >= classSched.start;

          return (
            classSched.day === selection?.day && (condition1 || condition2)
          );
        });
      });
    },
    [activeSchedClasses, selection?.day]
  );

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !selection) return;
    const yPos = e.clientY - e.currentTarget.getBoundingClientRect().top;

    if (yPos < TOP_OFFSET) return; // Ignore clicks in the time column or extra space

    const timeSlot = Math.floor((yPos - TOP_OFFSET) / (cellSize / 4));

    const rawTime = 7 * 60 + 15 * timeSlot; // 7:00 AM + 15 minutes per slot

    const newTime = rawTime;

    if (activeSchedClasses.length > 0) {
      const militaryTime = minutesToMilitaryTime(newTime);
      const militaryEndTime = minutesToMilitaryTime(selection.baseEnd);
      const militaryStartTime = minutesToMilitaryTime(selection.baseStart);

      if (
        checkOverlappingSchedules(
          militaryTime,
          militaryStartTime,
          militaryEndTime
        )
      )
        return;
    }

    if (rawTime < selection.baseEnd) {
      setSelection({
        ...selection,
        start: newTime,
        end: selection.baseEnd,
      });

      return;
    }

    setSelection({
      ...selection,
      start: selection.baseStart,
      end: newTime + 15,
    });
  };

  useEffect(() => {
    if (window === undefined) return;

    if (dragging) {
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  return {
    dragging,
    selection,
    onMouseDown,
    onMouseMove,
    setSelection,
    popoverRef,
  };
}
