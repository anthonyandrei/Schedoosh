import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CheckCheck, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { FormSelectField } from "@/components/form/form-select-field";
import { FormTextField } from "@/components/form/form-text-field";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toggle } from "@/components/ui/toggle";
import { Class } from "@/lib/definitions";
import { ModalityEnumSchema } from "@/lib/enums";
import { useGlobalStore } from "@/stores/useGlobalStore";

interface ClassFormProps {
  onSubmit: (data: Class) => void;
  defaultValues?: Class;
  courseCode: string;
}
export default function ClassForm({
  onSubmit,
  courseCode,
  defaultValues,
}: ClassFormProps) {
  const courses = useGlobalStore((state) => state.courses);

  const classFormSchema = z.object({
    code: z.coerce
      .number()
      .default(0)
      .refine(
        (val) => {
          return (
            !courses
              .find((c) => c.courseCode === courseCode)
              ?.classes.some((classData) => classData.code === val) ||
            defaultValues?.code === val
          );
        },
        {
          message: "Class code already exists.",
        }
      ),
    course: z.string(),
    section: z.string().min(1, "Section is required."),
    professor: z.string(),
    schedules: z
      .array(
        z
          .object({
            day: z.enum(["M", "T", "W", "H", "F", "S", "U"]),
            start: z.coerce
              .number({ message: "Start time is required." })
              .min(700, "Lowest is 700.")
              .max(2400, "Highest is 2400."),
            end: z.coerce
              .number({ message: "End time is required." })
              .min(700, "Lowest is 700.")
              .max(2400, "Highest is 2400."),
            date: z.string(),
            isOnline: z.boolean(),
            room: z.string(),
          })

          .refine((schema) => schema.start < schema.end, {
            message: "Start can't be greater than or equal to end time.",
            path: ["start"],
          })
      )
      .min(1),
    enrolled: z.number().default(0),
    enrollCap: z.number().default(0),
    restriction: z.string(),
    modality: ModalityEnumSchema,
    remarks: z.string(),
  });

  const form = useForm<z.infer<typeof classFormSchema>>({
    resolver: zodResolver(classFormSchema),
    defaultValues: defaultValues ?? {
      code: 123,
      course: courseCode,
      section: "",
      professor: "",
      schedules: [
        {
          day: "M",
          start: undefined,
          end: undefined,
          date: "",
          isOnline: false,
          room: "",
        },
      ],
      enrolled: 0,
      enrollCap: 0,
      restriction: "",
      modality: "HYBRID",
      remarks: "",
    },
  });

  const schedules = useFieldArray({
    control: form.control,
    name: "schedules",
  });

  const handleAppendSchedule = () => {
    schedules.append({
      day: "M",
      start: 730,
      end: 900,
      date: "",
      isOnline: false,
      room: "",
    });
  };

  const handleDeleteSchedule = (index: number) => {
    schedules.remove(index);
  };

  const schedulesLength = useWatch({
    control: form.control,
    name: "schedules",
  }).length;

  return (
    <Form {...form}>
      <form
        className="flex min-h-0 flex-col gap-4"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="grid grid-cols-2 gap-4">
          <FormTextField
            form={form}
            label="Code"
            formKey="code"
            placeholder="1234"
            divClassName="w-full"
          />
          <FormTextField
            form={form}
            label="Section"
            formKey="section"
            placeholder="Z32"
            divClassName="w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormTextField
            form={form}
            label="Professor"
            formKey="professor"
            placeholder="Dela Cruz, Juan"
          />
          <FormSelectField
            form={form}
            label="Modality"
            formKey="modality"
            options={[
              { label: "Hybrid", value: "HYBRID" },
              { label: "Face-to-Face", value: "F2F" },
              { label: "Online", value: "ONLINE" },
              {
                label: "Predominantly Online",
                value: "PREDOMINANTLY ONLINE",
              },
              { label: "Tentative", value: "TENTATIVE" },
            ]}
          />
        </div>
        <FormTextField
          form={form}
          label="Remarks"
          formKey="remarks"
          placeholder="This is a custom class."
        />
        <h3 className="font-semibold text-sm">Schedules</h3>
        <ScrollArea className="h-48">
          <div className="flex min-h-0 flex-col gap-4">
            {schedules.fields.map((field, i) => (
              <div key={field.id} className="flex flex-row items-start gap-4">
                <FormSelectField
                  form={form}
                  formKey={`schedules.${i}.day`}
                  options={[
                    { label: "M", value: "M" },
                    { label: "T", value: "T" },
                    { label: "W", value: "W" },
                    { label: "H", value: "H" },
                    { label: "F", value: "F" },
                    { label: "S", value: "S" },
                    { label: "U", value: "U" },
                  ]}
                  className="w-32"
                />
                <div className="inline-flex items-start gap-2">
                  <FormTextField
                    form={form}
                    formKey={`schedules.${i}.start`}
                    placeholder="Start"
                  />
                  <FormTextField
                    form={form}
                    formKey={`schedules.${i}.end`}
                    placeholder="End"
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`schedules.${i}.isOnline`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Toggle
                          variant="outline"
                          pressed={field.value}
                          onPressedChange={field.onChange}
                        >
                          <Check
                            className={`mr-2 size-4 ${
                              field.value ? "visible" : "opacity-10"
                            }`}
                          />
                          Online?
                        </Toggle>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormTextField
                  form={form}
                  formKey={`schedules.${i}.room`}
                  placeholder="AG1109"
                  className="w-32"
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="shrink-0"
                  type="button"
                  onClick={() => handleDeleteSchedule(i)}
                  disabled={schedulesLength === 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {schedulesLength < 5 && (
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => handleAppendSchedule()}
              >
                <Plus className="mr-2 size-4" />
                Add Schedule
              </Button>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button type="submit" size="sm">
            <CheckCheck className="mr-2 size-4" />
            Submit
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
