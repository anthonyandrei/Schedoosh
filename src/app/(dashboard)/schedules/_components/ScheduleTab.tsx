"use client";

import { CalendarPlus2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import Calendar from "@/components/schedule/Calendar";
import ScheduleBar from "@/components/schedule/ScheduleBar";
import ScheduleOverview from "@/components/schedule/ScheduleOverview";
import ScheduleTabSkeleton from "@/components/skeletons/ScheduleTabSkeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createGroupedSchedules } from "@/lib/schedules";
import { useGlobalStore } from "@/stores/useGlobalStore";
import FilterSettings from "./FilterSettings";

const ScheduleTab = () => {
  const {
    schedules,
    setSchedules,
    colors,
    setColors,
    getSelectedData,
    filter,
    randomizeColors,
    groups,
    hasHydrated,
  } = useGlobalStore(
    useShallow((state) => ({
      schedules: state.schedules,
      setSchedules: state.setSchedules,
      colors: state.courseColors,
      setColors: state.setCourseColors,
      getSelectedData: state.getSelectedData,
      filter: state.filter,
      randomizeColors: state.randomizeColors,
      groups: state.courseGroups,
      hasHydrated: state._hasHydrated,
    }))
  );
  const [active, setActive] = useState<number>(0);
  const activeSchedule = schedules[active];
  const activeScheduleClasses = activeSchedule?.classes ?? [];

  if (!hasHydrated) {
    return <ScheduleTabSkeleton />;
  }

  const handleGenerate = () => {
    const selectedData = getSelectedData();

    if (!selectedData.length) {
      toast.error("No rows selected...", {
        description:
          "No schedule can be made because you haven't selected any classes yet.",
      });
      return;
    }

    const {
      schedules: newSchedules,
      colors: newColors,
      error,
    } = createGroupedSchedules({
      groups,
      courses: selectedData,
      filter,
    });

    if (error === "overflow") {
      toast.error("Uh oh! You hit the max schedules limit.", {
        description:
          "Try selecting fewer classes, making more groups, or adjusting the filters.",
      });
      return;
    } else if (error) {
      toast.error("Uh oh! No schedules could be generated.", {
        description: (
          <div>
            <div className="mb-1">
              The most likely culprits are the following:
            </div>
            <div className="flex flex-col gap-1 rounded-lg bg-red-200 p-2 text-red-900 dark:bg-red-950 dark:text-red-100">
              {error.map((err, index) => (
                <p key={index}>
                  {index + 1}. {err}
                </p>
              ))}
            </div>
          </div>
        ),
      });
      return;
    }

    // If no error occurs, just set schedules as normal.
    setSchedules(newSchedules);

    // Check if colors should be randomized
    if (randomizeColors) {
      setColors(newColors);
    } else {
      // Remove any colors that are not in the new colors and keep the old ones
      const refinedColors = Object.keys(newColors).reduce(
        (acc, course) => {
          acc[course] = colors[course] ?? newColors[course];
          return acc;
        },
        {} as typeof colors
      );

      setColors(refinedColors);
    }

    setActive(0);
    toast.success("Sucessfully generated schedules!", {
      description: `A total of ${newSchedules.length} were successfully generated.`,
    });
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4 self-stretch overflow-auto px-6 py-8 lg:flex-row lg:px-16">
      <div className="order-2 flex min-h-0 shrink-0 grow flex-col gap-4 lg:order-1">
        <ScheduleBar
          active={active}
          setActive={setActive}
          schedules={schedules}
          colors={colors}
          isGenerated
        >
          <Button onClick={handleGenerate}>Generate Schedules</Button>
          <FilterSettings />
        </ScheduleBar>
        {schedules[active] ? (
          <Calendar classes={activeScheduleClasses} colors={colors} />
        ) : (
          <Card className="flex w-full grow flex-row items-center justify-center gap-2 p-6 text-muted-foreground">
            <CalendarPlus2 size={100} strokeWidth={1.25} />
            <span className="flex flex-col gap-2">
              <span className="font-bold text-xl">
                No schedules generated yet
              </span>
              <span>Try clicking the Generate Schedules Button!</span>
            </span>
          </Card>
        )}
      </div>
      <ScheduleOverview
        activeSchedule={activeScheduleClasses}
        colors={colors}
        className="order-1 lg:order-2"
      />
    </div>
  );
};

export default ScheduleTab;
