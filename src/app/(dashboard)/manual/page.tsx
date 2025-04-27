"use client";

import Calendar from "@/components/schedule/Calendar";
import ScheduleBar from "@/components/schedule/ScheduleBar";
import ScheduleOverview from "@/components/schedule/ScheduleOverview";
import useManualSchedule from "@/hooks/useManualSchedule";
import { useGlobalStore } from "@/stores/useGlobalStore";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";

interface Props {}
export default function ManualPage({}: Props) {
  const [active, setActive] = useState<number>(0);

  const { schedule, setManualScheduleColors, hasHydrated } = useGlobalStore(
    useShallow((state) => ({
      schedule: state.manualSchedule,
      setManualScheduleColors: state.setManualScheduleColors,
      hasHydrated: state._hasHydrated,
    }))
  );

  const manualProps = useManualSchedule();

  if (!hasHydrated) {
    return null;
  }

  return (
    <div className="flex gap-4 flex-col lg:flex-row px-6 py-8 lg:px-16 w-full self-stretch min-h-0 overflow-auto flex-1">
      <div className="flex flex-col gap-4 grow min-h-0 shrink-0 order-2 lg:order-1">
        <ScheduleBar
          active={active}
          setActive={setActive}
          colors={schedule.colors}
          schedules={[schedule]}
          onColorChange={setManualScheduleColors}
          isManual
        />
        <Calendar
          classes={schedule.classes}
          colors={schedule.colors}
          manualProps={manualProps}
        />
      </div>
      <ScheduleOverview
        activeSchedule={schedule.classes}
        colors={schedule.colors}
        className="order-1 lg:order-2"
      />
    </div>
  );
}
