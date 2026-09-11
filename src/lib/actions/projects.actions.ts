"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createProjectSchema, inviteCodeSchema, repoUrlSchema } from "@/domain/validation/project.schema";
import { projectsService } from "@/application/projects.service";
import { eventsService } from "@/application/events.service";
import { usersService } from "@/application/users.service";
import { fullName } from "@/domain/types";
import {
  requireProjectManager,
  requireProjectMember,
  requireProjectOwner,
  requireUser,
} from "@/lib/guards";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { runAction } from "./helpers";

const idSchema = z.string().min(1);

export async function addProjectMemberAction(projectId: unknown, userId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const id = idSchema.parse(projectId);
    const { user } = await requireProjectManager(id);
    const memberId = idSchema.parse(userId);
    const [result, member] = await Promise.all([
      projectsService.isMember(id, memberId).then((already) =>
        already ? fail("Korisnik je već član ovog projekta") : ok(undefined),
      ),
      usersService.getById(memberId),
    ]);
    if (!result.ok) return result;
    await eventsService.log(id, user.id, "member_added", member ? fullName(member) : "");
    revalidatePath("/");
    return ok(undefined);
  });
}

export async function removeProjectMemberAction(
  projectId: unknown,
  userId: unknown,
): Promise<ActionResult> {
  return runAction(async () => {
    const id = idSchema.parse(projectId);
    const { user, project } = await requireProjectManager(id);
    const memberId = idSchema.parse(userId);
    if (project.ownerId === memberId) {
      return fail("Vlasnik projekta se ne može ukloniti");
    }
    const member = await usersService.getById(memberId);
    await projectsService.removeMember(id, memberId);
    await eventsService.log(id, user.id, "member_removed", member ? fullName(member) : "");
    revalidatePath("/");
    return ok(undefined);
  });
}

export async function getProjectMembersAction(
  projectId: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof projectsService.members>>>> {
  return runAction(async () => {
    const id = idSchema.parse(projectId);
    await requireProjectMember(id);
    return ok(await projectsService.members(id));
  });
}

// ── Projects ─────────────────────────────────────────────────────────────────

export async function createProjectAction(
  input: unknown,
): Promise<ActionResult<{ projectId: string }>> {
  return runAction(async () => {
    const user = await requireUser();
    const parsed = createProjectSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    const result = await projectsService.create(user.id, parsed.data.name);
    if (!result.ok) return result;
    revalidatePath("/");
    return ok({ projectId: result.data.id });
  });
}

export async function joinByInviteCodeAction(
  code: unknown,
): Promise<ActionResult<{ projectId: string }>> {
  return runAction(async () => {
    const user = await requireUser();
    const parsed = inviteCodeSchema.safeParse(code);
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    const result = await projectsService.joinByInviteCode(parsed.data, user.id);
    if (!result.ok) return result;
    const project = result.data;
    await eventsService.log(project.id, user.id, "member_added", user.name);
    revalidatePath("/");
    return ok({ projectId: project.id });
  });
}

export async function regenerateInviteCodeAction(
  projectId: unknown,
): Promise<ActionResult<{ inviteCode: string }>> {
  return runAction(async () => {
    const id = idSchema.parse(projectId);
    await requireProjectOwner(id);
    const inviteCode = await projectsService.regenerateInviteCode(id);
    revalidatePath(`/projects/${id}/board`);
    return ok({ inviteCode });
  });
}

export async function disableInviteCodeAction(projectId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const id = idSchema.parse(projectId);
    await requireProjectOwner(id);
    await projectsService.disableInviteCode(id);
    revalidatePath(`/projects/${id}/board`);
    return ok(undefined);
  });
}

// ── Public read-only board link ─────────────────────────────────────────────

export async function enablePublicLinkAction(
  projectId: unknown,
): Promise<ActionResult<{ token: string }>> {
  return runAction(async () => {
    const id = idSchema.parse(projectId);
    await requireProjectManager(id);
    const token = await projectsService.enablePublicLink(id);
    revalidatePath(`/projects/${id}/board`);
    return ok({ token });
  });
}

export async function disablePublicLinkAction(projectId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const id = idSchema.parse(projectId);
    await requireProjectManager(id);
    await projectsService.disablePublicLink(id);
    revalidatePath(`/projects/${id}/board`);
    return ok(undefined);
  });
}

// ── Public GitHub repo link ──────────────────────────────────────────────────

export async function setProjectRepoAction(projectId: unknown, url: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const id = idSchema.parse(projectId);
    const user = await requireProjectMember(id);
    const parsed = repoUrlSchema.safeParse(url);
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    await projectsService.setRepoUrl(id, parsed.data);
    await eventsService.log(id, user.id, "repo_linked", parsed.data);
    revalidatePath(`/projects/${id}/board`);
    return ok(undefined);
  });
}

export async function clearProjectRepoAction(projectId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const id = idSchema.parse(projectId);
    await requireProjectMember(id);
    await projectsService.setRepoUrl(id, null);
    revalidatePath(`/projects/${id}/board`);
    return ok(undefined);
  });
}

// ── Trash ────────────────────────────────────────────────────────────────────

export async function softDeleteProjectAction(projectId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const id = idSchema.parse(projectId);
    await requireProjectOwner(id);
    const result = await projectsService.softDelete(id);
    if (!result.ok) return result;
    revalidatePath("/");
    revalidatePath("/trash");
    return ok(undefined);
  });
}

export async function restoreProjectAction(projectId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const id = idSchema.parse(projectId);
    const user = await requireUser();
    const project = await projectsServiceFindOwnedTrashed(id, user.id);
    if (!project) return fail("Projekat ne postoji u kanti za otpatke");
    const result = await projectsService.restore(id);
    if (!result.ok) return result;
    revalidatePath("/");
    revalidatePath("/trash");
    return ok(undefined);
  });
}

export async function permanentDeleteProjectAction(projectId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const id = idSchema.parse(projectId);
    const user = await requireUser();
    const project = await projectsServiceFindOwnedTrashed(id, user.id);
    if (!project) return fail("Projekat ne postoji u kanti za otpatke");
    const result = await projectsService.permanentDelete(id);
    if (!result.ok) return result;
    revalidatePath("/trash");
    return ok(undefined);
  });
}

async function projectsServiceFindOwnedTrashed(projectId: string, userId: string) {
  const trashed = await projectsService.listTrashForUser(userId);
  return trashed.find((project) => project.id === projectId) ?? null;
}
