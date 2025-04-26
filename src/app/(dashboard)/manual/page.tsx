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
    <div className="flex flex-row w-full min-h-0 py-8 px-16 gap-4 h-full">
      <div className="flex flex-col gap-4 grow">
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
      />
    </div>
  );
}
