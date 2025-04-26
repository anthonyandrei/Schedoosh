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
    <div className="flex flex-row w-full min-h-0 py-8 px-16 gap-4 h-full">
      <div className="flex flex-col gap-4 grow">
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
        />
      ) : (
        <Card className="w-[20%] p-6"></Card>
      )}
    </div>
  );
};

export default SavedTab;
