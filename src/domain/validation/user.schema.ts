import { z } from "zod";

export const nameSchema = z.string().trim().min(1, "Obavezno polje").max(100);

export const emailSchema = z.string().trim().toLowerCase().email("Neispravan email");

export const passwordSchema = z.string().min(8, "Lozinka mora imati bar 8 znakova");

/** Admin creates a new member/admin account directly (no self-service registration). */
export const createUserSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["admin", "member"]).default("member"),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateProfileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema.optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Unesite trenutnu lozinku"),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** Admin resets another user's password directly — no current-password check. */
export const adminSetPasswordSchema = z.object({
  newPassword: passwordSchema,
});
export type AdminSetPasswordInput = z.infer<typeof adminSetPasswordSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Unesite lozinku"),
});
export type LoginInput = z.infer<typeof loginSchema>;
