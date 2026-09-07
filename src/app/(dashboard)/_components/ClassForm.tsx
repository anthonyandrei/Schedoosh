import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CheckCheck, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { FormComboboxField } from "@/components/form/form-combobox-field";
import { FormSelectField } from "@/components/form/form-select-field";
import { FormTextField } from "@/components/form/form-text-field";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toggle } from "@/components/ui/toggle";
import { Class } from "@/lib/definitions";
import { buildClassFromForm } from "@/lib/utils";
import { useGlobalStore } from "@/stores/useGlobalStore";

// SUBJECT_TYPE values ArchersHub has been observed to emit. It's a free
// string on their end (no enum), so the combobox accepts anything else too.
const TYPE_OPTIONS = [
  { label: "Lecture", value: "Lecture" },
  { label: "Lecture and Laboratory", value: "Lecture and Laboratory" },
  {
    label: "Administrative / Residency",
    value: "Administrative / Residency",
  },
];
const KNOWN_TYPES = new Set(TYPE_OPTIONS.map((option) => option.value));

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
    enrolled: z.coerce.number().default(0),
    enrollCap: z.coerce.number().default(0),
    restriction: z.string(),
    remarks: z.string(),
    type: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().optional()
    ),
    isCustomType: z.boolean(),
    units: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.coerce.number().optional()
    ),
    variant: z.string().optional(),
  });

  const form = useForm<z.infer<typeof classFormSchema>>({
    resolver: zodResolver(classFormSchema),
    defaultValues: defaultValues
      ? {
          ...defaultValues,
          isCustomType:
            !!defaultValues.type && !KNOWN_TYPES.has(defaultValues.type),
        }
      : {
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
          remarks: "",
          type: undefined,
          isCustomType: false,
          units: undefined,
          variant: undefined,
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

  const handleFormSubmit = form.handleSubmit((values) => {
    const existingClasses =
      courses.find((c) => c.courseCode === courseCode)?.classes ?? [];
    onSubmit(buildClassFromForm(values, existingClasses, defaultValues));
  });

  return (
    <Form {...form}>
      <form className="flex min-h-0 flex-col gap-4" onSubmit={handleFormSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <FormTextField
            form={form}
            label="Section"
            formKey="section"
            placeholder="Z32"
            divClassName="w-full"
          />
          <FormTextField
            form={form}
            label="Professor"
            formKey="professor"
            placeholder="Dela Cruz, Juan"
            divClassName="w-full"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormComboboxField
            form={form}
            label="Type"
            formKey="type"
            isCustomFormKey="isCustomType"
            options={TYPE_OPTIONS}
            selectMessage="Select type..."
            searchMessage="Search or add a type..."
            emptyMessage="No matching type."
            className="col-span-2"
          />
          <FormTextField
            form={form}
            label="Units"
            formKey="units"
            placeholder="3"
            divClassName="col-span-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormTextField
            form={form}
            label="Enrolled"
            formKey="enrolled"
            placeholder="0"
            divClassName="w-full"
          />
          <FormTextField
            form={form}
            label="Capacity"
            formKey="enrollCap"
            placeholder="40"
            divClassName="w-full"
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
