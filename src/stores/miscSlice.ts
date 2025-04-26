import { Slice } from "./useGlobalStore";

interface MiscStates {
  _hasHydrated: boolean;
  hasSeenAnnouncement: string | null;
  zoom: number;
}

interface MiscActions {
  setHasHydrated: (hasHydrated: boolean) => void;
  setHasSeenAnnouncement: (hasSeenAnnouncement: string) => void;
  resetAllSlices: () => void;
  setZoom: (zoom: number) => void;
}

export type MiscSlice = MiscStates & MiscActions;

const initialState: MiscStates = {
  _hasHydrated: false,
  hasSeenAnnouncement: null,
  zoom: 68,
};

export const createMiscSlice: Slice<MiscSlice> = (set, get) => ({
  ...initialState,
  setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),
  setHasSeenAnnouncement: (hasSeenAnnouncement) => set({ hasSeenAnnouncement }),
  resetAllSlices: () => {
    get().setCourses([]);
    get().resetColumnFilters();
    get().resetSelectedRows();
    get().setSchedules([]);
    get().setSavedSchedules([]);
  },
  setZoom: (zoom) => {
    set({ zoom });
  },
});
