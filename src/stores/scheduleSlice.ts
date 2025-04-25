import {
  defaultGeneralFilters,
  defaultSpecificFilters,
} from "@/app/(dashboard)/schedules/_components/FilterForm";
import { Filter, UserSchedule } from "@/lib/definitions";
import { ColorsEnum } from "@/lib/enums";
import { Slice } from "./useGlobalStore";

export interface ScheduleStates {
  courseColors: Record<string, ColorsEnum>;
  randomizeColors: boolean;
  schedules: UserSchedule[];
  filter: Filter;
  savedSchedules: UserSchedule[];
}

export interface ScheduleActions {
  setCourseColors: (courseColors: Record<string, ColorsEnum>) => void;
  setSchedules: (schedules: UserSchedule[]) => void;
  setFilter: (filter: Filter) => void;
  addSavedSchedule: (schedule: UserSchedule) => void;
  deleteSavedSchedule: (name: string) => void;
  changeSavedColors: (name: string, colors: Record<string, ColorsEnum>) => void;
  setSavedSchedules: (schedules: UserSchedule[]) => void;
  setRandomizeColors: (randomizeColors: boolean) => void;
}

export type ScheduleSlice = ScheduleStates & ScheduleActions;

export const createScheduleSlice: Slice<ScheduleSlice> = (set) => ({
  schedules: [],
  setSchedules: (schedules) => set({ schedules }),
  courseColors: {},
  setCourseColors: (courseColors) => set({ courseColors }),
  filter: { general: defaultGeneralFilters, specific: defaultSpecificFilters },
  setFilter: (filter) => set({ filter }),
  savedSchedules: [],
  addSavedSchedule: (schedule) =>
    set((state) => ({ savedSchedules: [...state.savedSchedules, schedule] })),
  deleteSavedSchedule: (name) =>
    set((state) => ({
      savedSchedules: state.savedSchedules.filter((s) => s.name !== name),
    })),
  changeSavedColors: (name, colors) => {
    set((state) => {
      const savedSchedules = state.savedSchedules.map((s) => {
        if (s.name === name) {
          return { ...s, colors };
        }
        return s;
      });

      return { savedSchedules };
    });
  },
  setSavedSchedules: (schedules) => set({ savedSchedules: schedules }),
  randomizeColors: true,
  setRandomizeColors: (randomizeColors) => set({ randomizeColors }),
});
