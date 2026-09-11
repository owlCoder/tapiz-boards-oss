"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  adminSetPasswordSchema,
  createUserSchema,
  updateProfileSchema,
} from "@/domain/validation/user.schema";
import { usersService } from "@/application/users.service";
import { requireAdmin } from "@/lib/guards";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { runAction } from "./helpers";
import type { UserDto } from "@/domain/types";

const idSchema = z.string().min(1);

export async function listUsersAction(): Promise<ActionResult<UserDto[]>> {
  return runAction(async () => {
    await requireAdmin();
    return ok(await usersService.listAll());
  });
}

export async function createUserAction(input: unknown): Promise<ActionResult<UserDto>> {
  return runAction(async () => {
    await requireAdmin();
    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    const result = await usersService.createByAdmin(parsed.data);
    if (!result.ok) return result;
    revalidatePath("/admin/users");
    return result;
  });
}

export async function adminUpdateUserAction(userId: unknown, input: unknown): Promise<ActionResult<UserDto>> {
  return runAction(async () => {
    await requireAdmin();
    const id = idSchema.parse(userId);
    const parsed = updateProfileSchema.required({ email: true }).safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    const result = await usersService.adminUpdateUser(id, parsed.data);
    if (!result.ok) return result;
    revalidatePath("/admin/users");
    return result;
  });
}

export async function adminSetPasswordAction(userId: unknown, input: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    await requireAdmin();
    const id = idSchema.parse(userId);
    const parsed = adminSetPasswordSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    return usersService.adminSetPassword(id, parsed.data);
  });
}

export async function setUserActiveAction(userId: unknown, isActive: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    await requireAdmin();
    const id = idSchema.parse(userId);
    const active = z.boolean().parse(isActive);
    const result = await usersService.setActive(id, active);
    if (!result.ok) return result;
    revalidatePath("/admin/users");
    return result;
  });
}

export async function adminDeleteUserAction(userId: unknown): Promise<ActionResult<void>> {
  return runAction(async () => {
    await requireAdmin();
    const id = idSchema.parse(userId);
    const result = await usersService.adminDeleteUser(id);
    if (!result.ok) return result;
    revalidatePath("/admin/users");
    return result;
  });
}
