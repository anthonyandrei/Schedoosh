import { Slice } from "./useGlobalStore";

export interface IdState {
  id: string;
}

export interface IdActions {
  setId: (id: string) => void;
}

const initState: IdState = {
  id: "",
};

// Combined interface
export type IdSlice = IdState & IdActions;

export const createIdSlice: Slice<IdSlice> = (set) => ({
  ...initState,
  setId: (id: string) =>
    set({
      id: id,
    }),
});
