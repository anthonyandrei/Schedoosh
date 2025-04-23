import { Slice } from "./useGlobalStore";

export interface MiscStates {
  _hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  hasSeenAnnouncement: string | null;
  setHasSeenAnnouncement: (hasSeenAnnouncement: string) => void;
  resetAllSlices: () => void;
  zoom: number;
  setZoom: (zoom: number) => void;
}

export const createMiscSlice: Slice<MiscStates> = (set, get) => ({
  _hasHydrated: false,
  setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),
  hasSeenAnnouncement: null,
  setHasSeenAnnouncement: (hasSeenAnnouncement) => set({ hasSeenAnnouncement }),
  resetAllSlices: () => {
    get().setCourses([]);
    get().resetColumnFilters();
    get().resetSelectedRows();
    get().setSchedules([]);
    get().setSavedSchedules([]);
  },
  zoom: 68,
  setZoom: (zoom) => {
    set({ zoom });
  },
});
