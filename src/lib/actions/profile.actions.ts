"use server";

import { revalidatePath } from "next/cache";
import { changePasswordSchema, updateProfileSchema } from "@/domain/validation/user.schema";
import { fullName } from "@/domain/types";
import { usersService } from "@/application/users.service";
import { requireUser } from "@/lib/guards";
import { updateSession } from "@/lib/auth";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { runAction } from "./helpers";

export async function updateMyProfileAction(input: unknown): Promise<ActionResult<null>> {
  return runAction(async () => {
    const user = await requireUser();
    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    const result = await usersService.updateMyProfile(user.id, parsed.data);
    if (!result.ok) return result;
    const updated = result.data;
    // Ime/email žive u JWT sesiji — osveži ih da sidebar/dialog ne prikazuju staro.
    await updateSession({ user: { name: fullName(updated), email: updated.email } });
    revalidatePath("/", "layout");
    return ok(null);
  });
}

export async function changeMyPasswordAction(input: unknown): Promise<ActionResult<null>> {
  return runAction(async () => {
    const user = await requireUser();
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    const result = await usersService.changeMyPassword(user.id, parsed.data);
    return result.ok ? ok(null) : result;
  });
}
