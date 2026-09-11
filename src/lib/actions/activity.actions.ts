"use server";

import { z } from "zod";
import { isoDaySchema } from "@/domain/validation/project.schema";
import { eventsService } from "@/application/events.service";
import { requireProjectMember } from "@/lib/guards";
import { ok, type ActionResult } from "@/lib/action-result";
import { runAction } from "./helpers";

const idSchema = z.string().min(1);

export async function getProjectActivityAction(
  projectId: unknown,
  day: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof eventsService.activityForDay>>>> {
  return runAction(async () => {
    const pid = idSchema.parse(projectId);
    await requireProjectMember(pid);
    return ok(await eventsService.activityForDay(pid, isoDaySchema.parse(day)));
  });
}

export async function getActivityDaysAction(
  projectId: unknown,
  from: unknown,
  to: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof eventsService.activityDays>>>> {
  return runAction(async () => {
    const pid = idSchema.parse(projectId);
    await requireProjectMember(pid);
    return ok(
      await eventsService.activityDays(pid, isoDaySchema.parse(from), isoDaySchema.parse(to)),
    );
  });
}
