import { RowSelectionState } from "@tanstack/react-table";
import { Class, Course, CourseGroup } from "@/lib/definitions";
import { Slice } from "./useGlobalStore";

export interface CourseStates {
  courses: Course[];
  courseGroups: CourseGroup[];
}

interface CourseActions {
  setCourses: (courses: Course[]) => void;
  addCourse: (course: Course) => void;
  removeCourse: (courseCode: string) => void;
  addCourseGroup: (groupName: string) => void;
  removeCourseGroup: (groupName: string) => void;
  setGroupPick: (groupName: string, pick: number) => void;
  moveCourseToGroup: (groupName: string, courseCode: string) => void;
  renameCourseGroup: (oldName: string, newName: string) => void;
  addClassToCourse: (courseCode: string, newClass: Class) => void;
  editClass: (courseCode: string, classCode: number, newClass: Class) => void;
  deleteClass: (courseCode: string, classCode: number) => void;
}

const initState: CourseStates = {
  courses: [],
  courseGroups: [],
};

export type CourseSlice = CourseStates & CourseActions;

export const createCourseSlice: Slice<CourseSlice> = (set, get) => ({
  ...initState,
  setCourses: (courses) => set({ courses }),
  addCourse: (course) =>
    set((state) => ({
      courses: [...state.courses, course],
    })),
  removeCourse: (courseCode) => {
    get().setSelectedRows(courseCode, {});
    get().deleteColumnFilters(courseCode);

    set((state) => {
      return {
        courses: state.courses.filter((c) => c.courseCode !== courseCode),
      };
    });
  },
  addCourseGroup: (groupName) =>
    set((state) => ({
      courseGroups: [...state.courseGroups, { name: groupName, pick: 1 }],
    })),
  moveCourseToGroup: (groupName, courseCode) => {
    set((state) => {
      const courses = state.courses.map((course) => {
        if (course.courseCode === courseCode) {
          return { ...course, group: groupName };
        }
        return course;
      });

      return { courses };
    });
  },
  removeCourseGroup: (groupName) =>
    set((state) => {
      const courses = state.courses.map((course) => {
        if (course.group === groupName) {
          return { ...course, group: undefined };
        }
        return course;
      });

      const courseGroups = state.courseGroups.filter(
        (group) => group.name !== groupName
      );

      return { courses, courseGroups };
    }),
  setGroupPick: (groupName, pick) => {
    set((state) => ({
      courseGroups: state.courseGroups.map((group) =>
        group.name === groupName ? { ...group, pick } : group
      ),
    }));
  },
  renameCourseGroup: (oldName, newName) => {
    set((state) => {
      const courses = state.courses.map((course) => {
        if (course.group === oldName) {
          return { ...course, group: newName };
        }
        return course;
      });

      const courseGroups = state.courseGroups.map((group) =>
        group.name === oldName ? { ...group, name: newName } : group
      );

      return { courses, courseGroups };
    });
  },
  addClassToCourse: (courseCode, newClass) => {
    set((state) => {
      const courses = state.courses.map((course) => {
        if (course.courseCode === courseCode) {
          return { ...course, classes: [...course.classes, newClass] };
        }
        return course;
      });
      return { courses };
    });
  },
  editClass: (courseCode, classCode, newClass) => {
    set((state) => {
      const courses = state.courses.map((course) => {
        if (course.courseCode === courseCode) {
          const classes = course.classes.map((cls) => {
            if (cls.code === classCode) {
              return newClass;
            }
            return cls;
          });
          return { ...course, classes };
        }
        return course;
      });
      return { courses };
    });
  },
  deleteClass: (courseCode, classCode) => {
    set((state) => {
      let rowIndex = -1;
      const courses = state.courses.map((course) => {
        if (course.courseCode === courseCode) {
          const classes = course.classes.filter((cls, i) => {
            // Get the index of the class to be deleted
            if (cls.code === classCode) {
              rowIndex = i;
            }

            return cls.code !== classCode;
          });
          return { ...course, classes };
        }
        return course;
      });

      // Adjust the selected row indices in selectedRows
      // to account for the deleted class
      const courseRows: RowSelectionState = {};

      Object.keys(state.selectedRows[courseCode]).forEach((key) => {
        const index = parseInt(key, 10);

        if (index === rowIndex) {
          return;
        }

        if (index > rowIndex) {
          courseRows[`${index - 1}`] = state.selectedRows[courseCode][key];
        } else {
          courseRows[`${index}`] = state.selectedRows[courseCode][key];
        }
      });

      const newSelectedRows = {
        ...state.selectedRows,
        [courseCode]: courseRows,
      };

      // Reset columnFilters and rowSelections to empty
      return {
        courses,
        selectedRows: newSelectedRows,
        columnFilters: {},
        rowSelections: {},
      };
    });
  },
});
