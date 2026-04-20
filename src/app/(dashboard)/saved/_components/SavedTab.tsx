"use client";

import { HeartCrack } from "lucide-react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import Calendar from "@/components/schedule/Calendar";
import ScheduleBar from "@/components/schedule/ScheduleBar";
import ScheduleOverview from "@/components/schedule/ScheduleOverview";
import SavedTabSkeleton from "@/components/skeletons/SavedTabSkeleton";
import { Card } from "@/components/ui/card";
import { ColorsEnum } from "@/lib/enums";
import { useGlobalStore } from "@/stores/useGlobalStore";

const SavedTab = () => {
  const { schedules, hasHydrated, setColors } = useGlobalStore(
    useShallow((state) => ({
      schedules: state.savedSchedules,
      hasHydrated: state._hasHydrated,
      setColors: state.changeSavedColors,
    }))
  );
  const [active, setActive] = useState<number>(0);
  const activeSched = schedules[active];

  if (!hasHydrated) {
    return <SavedTabSkeleton />;
  }

  const changeColors = (colors: Record<string, ColorsEnum>) => {
    setColors(activeSched.name, colors);
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4 self-stretch overflow-auto px-6 py-8 lg:flex-row lg:px-16">
      <div className="order-2 flex min-h-0 shrink-0 grow flex-col gap-4 lg:order-1">
        {activeSched ? (
          <>
            <ScheduleBar
              active={active}
              setActive={setActive}
              schedules={schedules}
              colors={activeSched.colors}
              onColorChange={changeColors}
              hasRename
            />
            <Calendar
              classes={activeSched.classes}
              colors={activeSched.colors}
            />
          </>
        ) : (
          <Card className="flex w-full grow flex-col items-center justify-center gap-2 p-6 text-muted-foreground">
            <HeartCrack size={100} />
            No schedules saved yet.
          </Card>
        )}
      </div>
      {activeSched ? (
        <ScheduleOverview
          activeSchedule={activeSched.classes}
          colors={activeSched.colors}
          className="order-1 lg:order-2"
        />
      ) : (
        <Card className="order-1 w-full p-6 lg:order-2 lg:w-[20%]" />
      )}
    </div>
  );
};

export default SavedTab;
