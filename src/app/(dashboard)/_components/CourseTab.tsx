"use client";

import { CourseDataTable } from "@/components/course-table/CourseDataTable";
import { columns } from "@/components/course-table/CourseTableColumns";
import { Card, CardContent } from "@/components/ui/card";
import { useGlobalStore } from "@/stores/useGlobalStore";
import { useState } from "react";
import CourseGrid from "./CourseGrid";
import CourseInput from "./CourseInput";
import CourseList from "./CourseList";

const CourseTab = () => {
  const courses = useGlobalStore((state) => state.courses);

  const [activeCourse, setActiveCourse] = useState<number>(0);

  return (
    <div className="flex gap-4 flex-row flex-grow py-8 px-16 w-full self-stretch min-h-0">
      <div className="flex flex-col gap-4 min-w-72 max-w-72">
        <Card>
          <CardContent className="pt-6">
            <CourseInput setActiveCourse={setActiveCourse} />
          </CardContent>
        </Card>
        <CourseList
          activeCourse={activeCourse}
          setActiveCourse={setActiveCourse}
        />
      </div>
      {!!courses.length && activeCourse !== -1 ? (
        <CourseDataTable
          columns={columns}
          data={courses[activeCourse].classes}
          lastFetched={courses[activeCourse].lastFetched}
          activeCourse={courses[activeCourse].courseCode}
          isCustom={courses[activeCourse].isCustom}
        />
      ) : (
        <CourseGrid />
      )}
    </div>
  );
};

export default CourseTab;
