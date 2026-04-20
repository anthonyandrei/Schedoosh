"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Filter, FilterOptions, filterSchema } from "@/lib/definitions";
import { DaysEnum, DaysEnumSchema, ModalityEnumSchema } from "@/lib/enums";
import { useGlobalStore } from "@/stores/useGlobalStore";

export const defaultGeneralFilters: FilterOptions = {
  enabled: true,
  start: 0,
  end: 2400,
  maxPerDay: 10,
  maxConsecutive: 10,
  modalities: ["F2F", "HYBRID", "ONLINE", "PREDOMINANTLY ONLINE", "TENTATIVE"],
  daysInPerson: ["M", "T", "W", "H", "F", "S"],
};

export const defaultSpecificFilters = Object.fromEntries(
  DaysEnumSchema.options.map((day) => [
    day,
    { ...defaultGeneralFilters, enabled: false },
  ])
) as Record<DaysEnum, FilterOptions>;

const FilterForm = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
  const { filter, setFilter } = useGlobalStore(
    useShallow((state) => ({
      filter: state.filter,
      setFilter: state.setFilter,
    }))
  );

  const form = useForm<Filter>({
    resolver: zodResolver(filterSchema),
    defaultValues: filter,
  });

  function onSubmit(values: Filter) {
    // Make all disabled days sync with general settings
    Object.keys(values.specific).forEach((day) => {
      if (!values.specific[day as DaysEnum].enabled) {
        values.specific[day as DaysEnum] = {
          ...values.general,
          enabled: false,
        };
      }
    });

    setFilter(values);
    form.reset(values);
    toast.success("Filter settings saved!");
    setOpen(false);
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-8"
      >
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-4 grid w-full auto-cols-fr grid-flow-col">
            <TabsTrigger value="general">General</TabsTrigger>
            {DaysEnumSchema.options.map((day) => (
              <TabsTrigger value={day} key={day}>
                {day}
              </TabsTrigger>
            ))}
          </TabsList>
          {[undefined, ...DaysEnumSchema.options].map((day) => (
            <TabsContent key={day ?? "general"} value={day ?? "general"}>
              <div className="flex flex-col gap-4">
                {day && (
                  <FormField
                    control={form.control}
                    name={`specific.${day}.enabled`}
                    render={({ field }) => (
                      <FormItem className="w-auto">
                        <FormControl>
                          <Card className="flex flex-row items-center justify-between p-4">
                            <div className="flex flex-col gap-1">
                              <span className="font-bold">Enable Filter</span>
                              <span className="text-muted-foreground text-xs">
                                Enabling this will override the general settings
                                for this day specifically.
                              </span>
                            </div>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(val) => {
                                const newFilter = { ...filter };
                                field.onChange(val);
                                newFilter.specific[day].enabled = val;
                                setFilter(newFilter);
                              }}
                            />
                          </Card>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <div className="grid w-full grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name={day ? `specific.${day}.start` : "general.start"}
                    render={({ field }) => (
                      <FormItem className="w-auto">
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={day && !filter.specific[day].enabled}
                          />
                        </FormControl>
                        <FormDescription className="">
                          The earliest possible time for a class.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={day ? `specific.${day}.end` : "general.end"}
                    render={({ field }) => (
                      <FormItem className="w-auto">
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={day && !filter.specific[day].enabled}
                            placeholder="Placeholder"
                          />
                        </FormControl>
                        <FormDescription>
                          The latest possible time for a class.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name={
                      day ? `specific.${day}.maxPerDay` : "general.maxPerDay"
                    }
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{"Max Courses / Day"}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Placeholder"
                            {...field}
                            disabled={day && !filter.specific[day].enabled}
                          />
                        </FormControl>
                        <FormDescription>
                          The maximum class per day. (Up to 10)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={
                      day
                        ? `specific.${day}.maxConsecutive`
                        : "general.maxConsecutive"
                    }
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Consecutive Courses</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Placeholder"
                            {...field}
                            disabled={day && !filter.specific[day].enabled}
                          />
                        </FormControl>
                        <FormDescription>
                          Max back-to-back courses. (Up to 10)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={
                    day ? `specific.${day}.modalities` : "general.modalities"
                  }
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modalities</FormLabel>
                      <FormControl>
                        <ToggleGroup
                          className="flex flex-row justify-items-stretch"
                          type="multiple"
                          value={field.value}
                          onValueChange={(value) => field.onChange(value)}
                          disabled={day && !filter.specific[day].enabled}
                        >
                          {ModalityEnumSchema.options.map((modality) => (
                            <ToggleGroupItem
                              key={modality}
                              value={modality}
                              className="w-full text-nowrap border"
                            >
                              {modality}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </FormControl>
                      <FormDescription>
                        Select the modalities that you want to see in your
                        schedules.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!day && (
                  <FormField
                    control={form.control}
                    name="general.daysInPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Days in-person</FormLabel>
                        <FormControl>
                          <ToggleGroup
                            className="flex flex-row"
                            type="multiple"
                            value={field.value}
                            onValueChange={(value) => field.onChange(value)}
                          >
                            {DaysEnumSchema.options.map((day) => (
                              <ToggleGroupItem
                                key={day}
                                value={day}
                                className="w-full border"
                              >
                                {day}
                              </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                        </FormControl>
                        <FormDescription>
                          Which days are you available to take in-person?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <Button type="submit" className="ml-auto">
          Save all
        </Button>
      </form>
    </Form>
  );
};

export default FilterForm;
