"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDown,
  IdCard,
  Import,
  ListPlus,
  LoaderCircle,
  SquarePen,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { useShallow } from "zustand/react/shallow";
import { fetchCourse } from "@/actions/course";
import IDInput from "@/components/navbar/IDInput";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Dropdown, { DropdownItem } from "@/components/wrappers/Dropdown";
import { useGlobalStore } from "@/stores/useGlobalStore";

const formSchema = z.object({
  courseCode: z.string().length(7, "Length should be 7!"),
});

interface CourseInputProps {
  setActiveCourse: (index: number) => void;
}

const CourseInput = ({ setActiveCourse }: CourseInputProps) => {
  const { id, addCourse, courses } = useGlobalStore(
    useShallow((state) => ({
      id: state.id,
      addCourse: state.addCourse,
      courses: state.courses,
    }))
  );
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseCode: "",
    },
  });

  const handleFetch = async (courseCode: string) => {
    if (!id) {
      toast.error("You haven't set your ID number yet.", {
        description: "Set your ID on the button at the top right corner.",
      });

      return;
    }

    if (courses.some((course) => course.courseCode === courseCode)) {
      toast.error("Duplicate Course Code Detected", {
        description:
          "You've already added that course. To update it, click the course list settings button.",
      });

      return;
    }

    try {
      const { data, error } = await fetchCourse(courseCode, id);

      if (!data || error) {
        toast.error("Something went wrong while fetching...", {
          description:
            "The server is facing some issues right now, try again in a bit.",
        });

        return;
      }

      const { newCourse, isCached } = data;

      if (newCourse.classes.length === 0) {
        toast.warning("No classes found...", {
          description:
            "No classes were found for that course, maybe no classes have been scheduled yet.",
        });

        return;
      }

      if (isCached) {
        toast.warning(`The server is having some issues...`, {
          description:
            "But don't worry, your course was still added. It might be an older version though, try updating it later.",
        });
      } else {
        toast.success(`Course ${courseCode} added successfully!`);
      }

      setActiveCourse(courses.length);
      addCourse(newCourse);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("unexpected response")) {
          toast.warning("Slow down!", {
            description:
              "You're doing too many requests too quickly. Please wait a bit before adding more. This is to prevent spamming the server.",
          });
        } else if (error.message.includes("fetch failed")) {
          toast.error("Something went wrong while fetching...", {
            description:
              "The server may be facing some issues right now, try again in a bit.",
          });
        } else {
          toast.error("Something unexpected happened...", {
            description:
              "An unexpected error occurred. Please try again later or contact the developer.",
          });
        }
      }
    }
  };

  const addMLSCourse = async (values: z.infer<typeof formSchema>) => {
    setIsFetching(true);

    try {
      await handleFetch(values.courseCode.toUpperCase());
    } catch (_error) {
      toast.error("Something went wrong while fetching...", {
        description:
          "The server is facing some issues right now, try again in a bit.",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const addCustomCourse = (values: z.infer<typeof formSchema>) => {
    if (courses.some((course) => course.courseCode === values.courseCode)) {
      toast.error("Duplicate Course Code Detected", {
        description:
          "You've already added that course. To update it, click the course settings button.",
      });

      return;
    }

    addCourse({
      courseCode: values.courseCode,
      classes: [],
      lastFetched: new Date(),
      isCustom: true,
    });
  };

  const dropdownItems: DropdownItem[] = [
    {
      name: "Add from MLS",
      Icon: Import,
      onClick: () => form.handleSubmit(addMLSCourse)(),
    },
    {
      name: "Add as Custom Course",
      onClick: () => form.handleSubmit(addCustomCourse)(),
      Icon: SquarePen,
    },
  ];

  if (!id) {
    return (
      <IDInput>
        <Button
          variant="outline"
          className="inline-flex w-full animate-pulse items-center border-primary"
        >
          <IdCard className="mr-2 size-4" /> Set ID Number
        </Button>
      </IDInput>
    );
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(addMLSCourse)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="courseCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Code</FormLabel>
              <FormControl>
                <Input placeholder="GE12345" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Dropdown items={dropdownItems} className="dropdown-content-width-full">
          <Button
            size="sm"
            variant="default"
            className="w-full"
            disabled={isFetching}
          >
            {isFetching ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <>
                <ListPlus className="mr-2 size-4" />
                Add Course
                <ChevronDown className="ml-2 size-4" />
              </>
            )}
          </Button>
        </Dropdown>
      </form>
    </Form>
  );
};

export default CourseInput;
