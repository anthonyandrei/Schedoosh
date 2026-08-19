"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDown,
  Import,
  KeyRound,
  ListPlus,
  LoaderCircle,
  Sparkles,
  SquarePen,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { useShallow } from "zustand/react/shallow";
import { fetchCourse } from "@/actions/course";
import ArchersHubAuthDialog from "@/components/navbar/ArchersHubAuthDialog";
import { Badge } from "@/components/ui/badge";
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
  courseCode: z
    .string()
    .trim()
    .min(3, "Course code must be at least 3 characters!")
    .max(12, "Course code must be at most 12 characters!"),
});

interface CourseInputProps {
  setActiveCourse: (index: number) => void;
}

const CourseInput = ({ setActiveCourse }: CourseInputProps) => {
  const {
    sessionCookie,
    isAuthenticated,
    setSessionModalOpen,
    addCourse,
    courses,
  } = useGlobalStore(
    useShallow((state) => ({
      sessionCookie: state.sessionCookie,
      isAuthenticated: state.isAuthenticated,
      setSessionModalOpen: state.setSessionModalOpen,
      addCourse: state.addCourse,
      courses: state.courses,
    }))
  );
  const isDemoMode =
    isAuthenticated &&
    (sessionCookie === "MOCK_SESSION" || sessionCookie === "DEMO");

  const [isFetching, setIsFetching] = useState<boolean>(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courseCode: "",
    },
  });

  const handleFetch = async (courseCode: string) => {
    if (!isAuthenticated && !sessionCookie) {
      toast.error("You haven't connected ArchersHub yet.", {
        description:
          "Connect your ArchersHub session using the button on the top right or below.",
      });
      setSessionModalOpen(true);
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
      const { data, error, authExpired } = await fetchCourse(
        courseCode,
        sessionCookie
      );

      if (authExpired) {
        toast.error("ArchersHub Session Expired", {
          description:
            "Please reconnect your session cookie or activate Demo Mode to fetch courses.",
        });
        setSessionModalOpen(true);
        return;
      }

      if (!data || error) {
        toast.error(error || "Something went wrong while fetching...", {
          description:
            "Please check the course code, try Demo Mode, or add as a custom course.",
        });
        return;
      }

      const { newCourse, isCached } = data;

      if (newCourse.classes.length === 0) {
        toast.warning("No classes found...", {
          description:
            "No classes were found for that course, maybe no classes have been scheduled yet on ArchersHub.",
        });
        return;
      }

      if (isCached) {
        toast.info(
          isDemoMode
            ? `Loaded simulated ${courseCode} from cache`
            : `Loaded ${courseCode} from cache`,
          {
            description: "Course was added using recent cache.",
          }
        );
      } else {
        toast.success(
          isDemoMode
            ? `Simulated course ${courseCode} added (Demo Mode)`
            : `Course ${courseCode} added successfully from ArchersHub!`
        );
      }

      setActiveCourse(courses.length);
      addCourse(newCourse);
      form.reset();
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes("unexpected response") ||
          error.message.includes("429")
        ) {
          toast.warning("Slow down!", {
            description:
              "You're making too many requests too quickly. Please wait a bit before adding more.",
          });
        } else if (error.message.includes("fetch failed")) {
          toast.error("Something went wrong while fetching...", {
            description:
              "ArchersHub or the server may be facing issues right now, try again in a bit.",
          });
        } else {
          toast.error("Something unexpected happened...", {
            description: error.message || "An unexpected error occurred.",
          });
        }
      }
    }
  };

  const addArchersHubCourse = async (values: z.infer<typeof formSchema>) => {
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
    const code = values.courseCode.toUpperCase();
    if (courses.some((course) => course.courseCode === code)) {
      toast.error("Duplicate Course Code Detected", {
        description:
          "You've already added that course. To update it, click the course settings button.",
      });
      return;
    }

    addCourse({
      courseCode: code,
      classes: [],
      lastFetched: new Date(),
      isCustom: true,
    });
    form.reset();
  };

  const dropdownItems: DropdownItem[] = [
    {
      name: "Add from ArchersHub",
      Icon: Import,
      onClick: () => form.handleSubmit(addArchersHubCourse)(),
    },
    {
      name: "Add as Custom Course",
      onClick: () => form.handleSubmit(addCustomCourse)(),
      Icon: SquarePen,
    },
  ];

  if (!isAuthenticated && !sessionCookie) {
    return (
      <ArchersHubAuthDialog>
        <Button
          variant="outline"
          className="inline-flex w-full animate-pulse items-center border-amber-500 text-amber-600 dark:text-amber-400"
        >
          <KeyRound className="mr-2 size-4" /> Connect ArchersHub Session
        </Button>
      </ArchersHubAuthDialog>
    );
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(addArchersHubCourse)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="courseCode"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Course Code</FormLabel>
                {isDemoMode && (
                  <Badge
                    variant="secondary"
                    className="gap-1 border-amber-500/30 bg-amber-100 px-1.5 py-0 font-medium text-[10px] text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                  >
                    <Sparkles className="size-2.5 text-amber-500" /> Demo Mode
                  </Badge>
                )}
              </div>
              <FormControl>
                <Input placeholder="CCPROG1" {...field} />
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
