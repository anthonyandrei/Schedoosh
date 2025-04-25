"use client";

import { fetchMultipleCourses } from "@/actions/course";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import ConfirmDialog from "@/components/wrappers/ConfirmDialog";
import Dropdown, { DropdownItem } from "@/components/wrappers/Dropdown";
import { Course } from "@/lib/definitions";
import { useGlobalStore } from "@/stores/useGlobalStore";
import { Reorder, useDragControls } from "framer-motion";
import {
  CircleOff,
  Ellipsis,
  GripVertical,
  Group,
  ListX,
  LoaderCircle,
  RefreshCcw,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

interface CourseItemProps {
  course: Course;
  index: number;
  activeCourse: number;
  setActiveCourse: (index: number) => void;
}

function CourseItem({
  course,
  index,
  activeCourse,
  setActiveCourse,
}: CourseItemProps) {
  const { courses, removeCourse, selectedRows, setSelectedRows } =
    useGlobalStore(
      useShallow((state) => ({
        courses: state.courses,
        removeCourse: state.removeCourse,
        selectedRows: state.selectedRows,
        setSelectedRows: state.setSelectedRows,
      }))
    );
  const handleDelete = (courseCode: string) => {
    if (activeCourse >= 0 && courses[activeCourse].courseCode === courseCode) {
      setActiveCourse(0);
    } else if (activeCourse > index) {
      setActiveCourse(activeCourse - 1);
    }

    removeCourse(courseCode);
  };

  const controls = useDragControls();

  return (
    <Reorder.Item
      key={course.courseCode}
      value={course}
      className="flex flex-row gap-2 items-center"
      dragControls={controls}
      dragListener={false}
    >
      <GripVertical
        onPointerDown={(e) => controls.start(e)}
        className="shrink-0 text-muted-foreground cursor-grab"
      />
      <Button
        variant={
          courses[activeCourse]?.courseCode === course.courseCode
            ? "default"
            : "outline"
        }
        onClick={() => setActiveCourse(index)}
        className="w-full justify-between"
      >
        {course.courseCode}{" "}
        {selectedRows[course.courseCode] && (
          <Badge
            variant="secondary"
            className="rounded-sm font-bold p-1 size-5 justify-center font-mono"
          >
            {Object.keys(selectedRows[course.courseCode]).length}
          </Badge>
        )}
      </Button>
      <Button
        size="icon"
        className="shrink-0 group hover:bg-destructive/80"
        variant="outline"
        onClick={() => handleDelete(course.courseCode)}
      >
        <X className="size-4 group-hover:text-destructive-foreground" />
      </Button>
    </Reorder.Item>
  );
}

interface CourseListProps {
  activeCourse: number;
  setActiveCourse: (index: number) => void;
}
export default function CourseList({
  activeCourse,
  setActiveCourse,
}: CourseListProps) {
  const { courses, setCourses, id, resetSelectedRows, resetColumnFilters } =
    useGlobalStore(
      useShallow((state) => ({
        courses: state.courses,
        setCourses: state.setCourses,
        removeCourse: state.removeCourse,
        id: state.id,
        resetSelectedRows: state.resetSelectedRows,
        resetColumnFilters: state.resetColumnFilters,
      }))
    );

  const [isFetching, setIsFetching] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSwap = useCallback(
    (newCourses: Course[]) => {
      setCourses(newCourses);
    },
    [setCourses]
  );

  const handleUpdate = async () => {
    if (!id) {
      toast.error("You haven't set your ID yet!", {
        description: "Set your ID on the button at the top right corner.",
      });

      return;
    }

    setIsFetching(true);
    try {
      const { data } = await fetchMultipleCourses(
        courses.filter((course) => !course.isCustom),
        id
      );

      if (!data) {
        toast.error("Something went wrong while fetching...", {
          description:
            "The server is facing some issues right now, try again in a bit.",
        });

        return;
      }

      if (data.some((course) => course.classes.length === 0)) {
        toast.error("Oops... Some of the courses don't have any classes.", {
          description:
            "MLS may be down right now or something is terribly wrong.",
        });
      } else {
        setCourses([...data, ...courses.filter((course) => course.isCustom)]);

        toast.success("Successfully updated all courses!", {
          description: "The courses should now display updated data.",
        });
      }
    } catch (error) {
      toast.error("Something went wrong while fetching...", {
        description:
          "The server is facing some issues right now, try again in a bit.",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const courseSettingsItems: DropdownItem[] = [
    {
      name: "Update Courses",
      onClick: handleUpdate,
      Icon: RefreshCcw,
    },
    {
      name: "Clear All Selected",
      onClick: resetSelectedRows,
      Icon: ListX,
    },
    {
      name: "Remove Courses",
      onClick: () => setOpen(true),
      Icon: Trash2,
    },
  ];

  const handleReset = () => {
    setCourses([]);
    setActiveCourse(-1);
    resetSelectedRows();
    resetColumnFilters();
  };

  return (
    <Card className="flex flex-col grow shrink min-h-0">
      <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle>Course List</CardTitle>
        <Dropdown items={courseSettingsItems} align="start" className="w-52">
          <Button size="icon" variant="outline" disabled={isFetching}>
            {isFetching ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Ellipsis className="size-4" />
            )}
          </Button>
        </Dropdown>
      </CardHeader>
      <ScrollArea className="min-h-0 grow">
        <CardContent>
          <Button
            className="w-full mb-4"
            variant={activeCourse === -1 ? "default" : "outline"}
            onClick={() => setActiveCourse(-1)}
          >
            <Group className="size-4 mr-2" /> Group Courses
          </Button>
          {courses.length !== 0 ? (
            <Reorder.Group
              className="flex gap-2 row flex-col"
              axis="y"
              values={courses}
              onReorder={handleSwap}
            >
              {courses.map((course, i) => (
                <CourseItem
                  key={course.courseCode}
                  activeCourse={activeCourse}
                  course={course}
                  index={i}
                  setActiveCourse={setActiveCourse}
                />
              ))}
            </Reorder.Group>
          ) : (
            <div className="text-sm text-muted-foreground size-full flex flex-col gap-2 items-center justify-center mt-6">
              <CircleOff />
              None added yet.
            </div>
          )}
        </CardContent>
      </ScrollArea>
      <ConfirmDialog
        onSubmit={() => handleReset()}
        open={open}
        setOpen={setOpen}
        description="Are you sure you want to remove all courses? This action cannot be reversed."
      />
    </Card>
  );
}
