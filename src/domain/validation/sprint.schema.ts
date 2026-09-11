import { z } from "zod";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Datum mora biti u formatu GGGG-MM-DD");

export const sprintSchema = z
  .object({
    name: z.string().trim().min(1, "Naziv sprinta je obavezan").max(100, "Naziv je predugačak"),
    goal: z.string().trim().max(2000, "Cilj je predugačak").optional().default(""),
    startDate: dateString,
    endDate: dateString,
  })
  .refine((s) => s.endDate >= s.startDate, {
    message: "Kraj sprinta ne može biti pre početka",
    path: ["endDate"],
  });
export type SprintInput = z.infer<typeof sprintSchema>;

export const sprintStatusSchema = z.enum(["planned", "active", "completed"]);

export const finishSprintSchema = z.object({
  targetSprintId: z.string().min(1).nullable().default(null),
});

/** Stavka retrospektive: šta je bilo dobro / šta treba popraviti. */
export const retroItemSchema = z.object({
  category: z.enum(["good", "bad"]),
  body: z
    .string()
    .trim()
    .min(1, "Stavka retrospektive ne može biti prazna")
    .max(1000, "Stavka je predugačka"),
});
export type RetroItemInput = z.infer<typeof retroItemSchema>;
