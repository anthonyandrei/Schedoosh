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
import DialogWrapper from "@/components/wrappers/GenericDialog";
import { UserSchedule } from "@/lib/definitions";
import { useGlobalStore } from "@/stores/useGlobalStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useShallow } from "zustand/react/shallow";

type RenameButtonProps = {
  activeSched: UserSchedule;
};

const RenameButton = ({ activeSched }: RenameButtonProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const { saved, setSaved } = useGlobalStore(
    useShallow((state) => ({
      saved: state.savedSchedules,
      setSaved: state.setSavedSchedules,
    }))
  );

  const FormSchema = z
    .object({
      name: z.string().min(1, {
        message: "Your schedule name can't be blank!",
      }),
    })
    .refine(
      (val) => {
        return (
          val.name === activeSched.name ||
          !saved.some((schedule) => schedule.name === val.name)
        );
      },
      {
        message: "You already have a schedule with that name.",
        path: ["name"],
      }
    );

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (data.name === activeSched.name) {
      setOpen(false);
      return;
    }

    const newSchedules: UserSchedule[] = saved.map((schedule) => {
      if (schedule.name === activeSched.name) {
        return {
          ...schedule,
          name: data.name,
        };
      }
      return schedule;
    });

    setSaved(newSchedules);
    setOpen(false);
  };

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: activeSched.name,
    },
  });

  return (
    <DialogWrapper
      open={open}
      setOpen={setOpen}
      title="Rename Schedule"
      description="What do you want this schedule to be called?"
      className="w-[380px]"
      onSubmit={form.handleSubmit(onSubmit)}
      submitText="Save"
      trigger={
        <Button variant="outline" size="icon">
          <Edit className="size-4" />
        </Button>
      }
    >
      <Form {...form}>
        <form className="flex flex-col gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Schedule Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Most Optimal Schedule" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </DialogWrapper>
  );
};

export default RenameButton;
