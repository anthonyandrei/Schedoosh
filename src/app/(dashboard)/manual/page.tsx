"use client";

import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import Calendar from "@/components/schedule/Calendar";
import ScheduleBar from "@/components/schedule/ScheduleBar";
import ScheduleOverview from "@/components/schedule/ScheduleOverview";
import useManualSchedule from "@/hooks/useManualSchedule";
import { useGlobalStore } from "@/stores/useGlobalStore";

export default function ManualPage() {
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
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4 self-stretch overflow-auto px-6 py-8 lg:flex-row lg:px-16">
      <div className="order-2 flex min-h-0 shrink-0 grow flex-col gap-4 lg:order-1">
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
