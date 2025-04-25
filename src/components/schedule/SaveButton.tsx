import { Button, ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Class, UserSchedule } from "@/lib/definitions";
import { ColorsEnum } from "@/lib/enums";
import { useGlobalStore } from "@/stores/useGlobalStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { Heart, HeartOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useShallow } from "zustand/react/shallow";

interface SaveButtonProps extends ButtonProps {
  activeSched: Class[];
  colors: Record<string, ColorsEnum>;
}

// Updated isScheduleSaved to compare only class codes
const isScheduleSaved = (
  saved: UserSchedule[],
  sched2: Class[]
): string | false => {
  // Iterate through each saved schedule
  for (const savedSched of saved) {
    const savedSchedClasses = savedSched.classes;

    // Check if the saved schedule and sched2 have the same length
    if (savedSchedClasses.length !== sched2.length) continue;

    // Collect class codes from both savedSched and sched2
    const savedCodes = savedSchedClasses.map((cls) => cls.code).sort();
    const sched2Codes = sched2.map((cls) => cls.code).sort();

    // Compare the sorted arrays of class codes
    const isSameSchedule = savedCodes.every(
      (code, index) => code === sched2Codes[index]
    );

    if (isSameSchedule) return savedSched.name;
  }

  // Return false if no matching schedule is found
  return false;
};

const SaveButton = ({ activeSched, colors, ...props }: SaveButtonProps) => {
  const [open, setOpen] = useState<boolean>(false);

  const { saved, addSaved, deleteSaved } = useGlobalStore(
    useShallow((state) => ({
      saved: state.savedSchedules,
      addSaved: state.addSavedSchedule,
      deleteSaved: state.deleteSavedSchedule,
    }))
  );

  const isSaved = isScheduleSaved(saved, activeSched);

  const FormSchema = z
    .object({
      name: z.string().min(1, {
        message: "Your schedule name can't be blank!",
      }),
    })
    .refine(
      (val) => {
        return !saved.some((schedule) => schedule.name === val.name);
      },
      {
        message: "You already have a schedule with that name.",
        path: ["name"],
      }
    );

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    const newSchedule: UserSchedule = {
      name: data.name,
      classes: activeSched,
      colors: colors,
    };

    addSaved(newSchedule);
    setOpen(false);
  };

  const onDelete = (name: string) => {
    deleteSaved(name);
    setOpen(false);
  };

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
    },
  });

  if (isSaved) {
    return (
      <Button variant="secondary" size="icon" onClick={() => onDelete(isSaved)}>
        <HeartOff className="size-4" />
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" {...props}>
          <Heart className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[380px]">
        <DialogHeader>
          <DialogTitle>Save Schedule</DialogTitle>
          <DialogDescription>
            What do you want this schedule to be called?
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. Most Optimal Schedule"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="ml-auto">
              Save
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SaveButton;
