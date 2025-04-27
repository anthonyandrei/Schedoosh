"use client";

import Calendar from "@/components/schedule/Calendar";
import ScheduleBar from "@/components/schedule/ScheduleBar";
import ScheduleOverview from "@/components/schedule/ScheduleOverview";
import SavedTabSkeleton from "@/components/skeletons/SavedTabSkeleton";
import { Card } from "@/components/ui/card";
import { ColorsEnum } from "@/lib/enums";
import { useGlobalStore } from "@/stores/useGlobalStore";
import { HeartCrack } from "lucide-react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";

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
    <div className="flex gap-4 flex-col lg:flex-row px-6 py-8 lg:px-16 w-full self-stretch min-h-0 overflow-auto flex-1">
      <div className="flex flex-col gap-4 grow min-h-0 shrink-0 order-2 lg:order-1">
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
          <Card className="p-6 w-full grow items-center flex flex-col justify-center text-muted-foreground gap-2">
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
        <Card className="w-full lg:w-[20%] p-6 order-1 lg:order-2" />
      )}
    </div>
  );
};

export default SavedTab;
