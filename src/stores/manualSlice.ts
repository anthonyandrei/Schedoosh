import { toast } from "sonner";
import { Class, UserSchedule } from "@/lib/definitions";
import { ColorsEnum } from "@/lib/enums";
import { Slice } from "./useGlobalStore";

export interface ManualStates {
  manualSchedule: UserSchedule;
}

export interface ManualActions {
  setManualSchedule: (schedule: UserSchedule) => void;
  addClassToManualSchedule: (newClass: Class) => void;
  removeClass: (code: number) => void;
  setManualScheduleColors: (colors: Record<string, ColorsEnum>) => void;
  removeManualScheduleColor: (course: string) => void;
}

const initState: ManualStates = {
  manualSchedule: {
    name: "Manual",
    classes: [],
    colors: {},
  },
};

export type ManualSlice = ManualStates & ManualActions;

export const createManualSlice: Slice<ManualSlice> = (set) => ({
  ...initState,
  setManualSchedule: (schedule) =>
    set(() => ({
      manualSchedule: schedule,
    })),

  addClassToManualSchedule: (newClass) =>
    set((state) => {
      if (!state.manualSchedule) {
        toast.error(
          "No schedule selected. Please create or select a schedule first."
        );
        return state;
      }

      return {
        manualSchedule: {
          ...state.manualSchedule,
          classes: [...state.manualSchedule.classes, newClass],
        },
      };
    }),

  removeClass: (code) =>
    set((state) => {
      if (!state.manualSchedule) {
        return state;
      }

      return {
        manualSchedule: {
          ...state.manualSchedule,
          classes: state.manualSchedule.classes.filter(
            (cls) => cls.code !== code
          ),
        },
      };
    }),

  setManualScheduleColors: (colors) =>
    set((state) => {
      if (!state.manualSchedule) {
        return state;
      }

      return {
        manualSchedule: {
          ...state.manualSchedule,
          colors,
        },
      };
    }),

  removeManualScheduleColor: (course) =>
    set((state) => {
      const newColors = { ...state.manualSchedule.colors };
      delete newColors[course];

      return {
        manualSchedule: {
          ...state.manualSchedule,
          colors: newColors,
        },
      };
    }),
});
