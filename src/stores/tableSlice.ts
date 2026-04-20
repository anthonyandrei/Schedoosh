import {
  ColumnFiltersState,
  RowSelectionState,
  VisibilityState,
} from "@tanstack/react-table";
import { Course } from "@/lib/definitions";
import { Slice } from "./useGlobalStore";

export interface TableStates {
  selectedRows: Record<string, RowSelectionState>;
  columnVisibility: VisibilityState;
  columnFilters: Record<string, ColumnFiltersState>;
}

export interface TableActions {
  setSelectedRows: (
    courseCode: string,
    rowSelection: RowSelectionState
  ) => void;
  getSelectedData: () => Course[];
  setColumnVisibility: (columnVisibility: VisibilityState) => void;
  setColumnFilters: (
    courseCode: string,
    columnFilters: ColumnFiltersState
  ) => void;
  getColumnFilters: (courseCode: string) => ColumnFiltersState;
  deleteColumnFilters: (courseCode: string) => void;
  resetSelectedRows: () => void;
  resetColumnFilters: () => void;
}

export type TableSlice = TableStates & TableActions;

const initialState: TableStates = {
  selectedRows: {},
  columnVisibility: {},
  columnFilters: {},
};

export const createTableSlice: Slice<TableSlice> = (set, get) => ({
  ...initialState,

  setSelectedRows: (courseCode, rowSelection) =>
    set((state) => {
      const newSelectedRows = { ...state.selectedRows };

      // Remove the object if it's empty
      if (Object.keys(rowSelection).length === 0) {
        delete newSelectedRows[courseCode];
      } else {
        newSelectedRows[courseCode] = rowSelection;
      }

      return { selectedRows: newSelectedRows };
    }),

  getSelectedData: () => {
    const selectedRows = get().selectedRows;
    const courses = get().courses;

    return Object.entries(selectedRows).map(([courseCode, selected]) => {
      const course = courses.find((course) => course.courseCode === courseCode);

      // If course is not found, return an empty array. Note that this will only
      // happen when there's a desync between the selectedRows and courses.
      if (!course) {
        return { classes: [], courseCode: "UNKNOWN", lastFetched: new Date() };
      }

      const courseData = Object.keys(selected).map(
        (key) => course.classes[Number.parseInt(key)]
      );

      return { ...course, classes: courseData };
    });
  },

  resetSelectedRows: () => set({ selectedRows: {} }),

  setColumnVisibility: (columnVisibility) => set({ columnVisibility }),

  setColumnFilters: (courseCode, columnFilters) =>
    set((state) => ({
      columnFilters: { ...state.columnFilters, [courseCode]: columnFilters },
    })),

  deleteColumnFilters: (courseCode) =>
    set((state) => {
      const newColumnFilters = { ...state.columnFilters };
      delete newColumnFilters[courseCode];
      return { columnFilters: newColumnFilters };
    }),

  getColumnFilters: (courseCode) => get().columnFilters[courseCode] ?? [],

  resetColumnFilters: () => set({ columnFilters: {} }),
});
