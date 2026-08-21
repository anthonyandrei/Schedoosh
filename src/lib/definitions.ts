import { z } from "zod";
import { ColorsEnumSchema, DaysEnumSchema, ModalityEnumSchema } from "./enums";

export const scheduleSchema = z.object({
  day: z.enum(["M", "T", "W", "H", "F", "S", "U"]),
  start: z.number(),
  end: z.number(),
  date: z.string(),
  isOnline: z.boolean(),
  room: z.string(),
});

export const classSchema = z.object({
  code: z.number(),
  course: z.string(),
  section: z.string(),
  professor: z.string(),
  schedules: z.array(scheduleSchema),
  enrolled: z.number(),
  enrollCap: z.number(),

  // Remove this in the future when everyone has migrated to the new schema
  rooms: z.array(z.string()).optional(),
  restriction: z.string(),
  modality: ModalityEnumSchema,
  remarks: z.string(),
  type: z.string().optional(),
  units: z.number().optional(),
  variant: z.string().optional(),
});

export const courseGroupSchema = z.object({
  name: z.string(),
  pick: z.number().min(1).max(10),
});

export const courseSchema = z.object({
  courseCode: z.string(),
  classes: classSchema.array(),
  lastFetched: z.date(),
  group: z.string().nullish(),
  isCustom: z.boolean().nullish(),
});

const filterOptionsSchema = z
  .object({
    enabled: z.boolean(),
    start: z.coerce.number().min(0).max(2400),
    end: z.coerce.number().min(0).max(2400),
    maxPerDay: z.coerce.number().min(1).max(10),
    maxConsecutive: z.coerce.number().min(1).max(10),
    modalities: z.array(ModalityEnumSchema),
    daysInPerson: z.array(DaysEnumSchema),
  })
  .refine((schema) => schema.start < schema.end, {
    message: "Start can't be greater than or equal to end time.",
    path: ["start"],
  });

export const filterSchema = z.object({
  general: filterOptionsSchema,
  specific: z.object({
    M: filterOptionsSchema,
    T: filterOptionsSchema,
    W: filterOptionsSchema,
    H: filterOptionsSchema,
    F: filterOptionsSchema,
    S: filterOptionsSchema,
  }),
});

export const userScheduleSchema = z.object({
  name: z.string(),
  classes: classSchema.array(),
  colors: z.record(z.string(), ColorsEnumSchema),
});

export type UserSchedule = z.infer<typeof userScheduleSchema>;
export type Schedule = z.infer<typeof scheduleSchema>;
export type Class = z.infer<typeof classSchema>;
export type Course = z.infer<typeof courseSchema>;
export type FilterOptions = z.infer<typeof filterOptionsSchema>;
export type Filter = z.infer<typeof filterSchema>;
export type CourseGroup = z.infer<typeof courseGroupSchema>;
export type { ColorsEnum, DaysEnum, ModalityEnum } from "./enums";
