import { auth } from "@/lib/auth";
import { projectsService } from "@/application/projects.service";
import type { ProjectDto, Role } from "@/domain/types";

export interface SessionUser {
  id: string;
  role: Role;
  name: string;
}

export class UnauthorizedError extends Error {
  constructor(message = "Nemate dozvolu za ovu akciju") {
    super(message);
  }
}

export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError("Niste prijavljeni");
  return {
    id: session.user.id,
    role: session.user.role,
    name: session.user.name ?? "",
  };
}

/** Instance/account management privileges — admin only. No special project/board rights. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new UnauthorizedError();
  return user;
}

/** Owner of the project. */
export async function requireProjectOwner(
  projectId: string,
): Promise<{ user: SessionUser; project: ProjectDto }> {
  const user = await requireUser();
  const projectResult = await projectsService.getById(projectId);
  if (!projectResult.ok) throw new UnauthorizedError(projectResult.error);
  const project = projectResult.data;
  if (project.ownerId !== user.id) {
    throw new UnauthorizedError("Samo vlasnik projekta može ovu akciju");
  }
  return { user, project };
}

/** Whether the user manages the project's board (currently: owner only). */
export async function isProjectManager(projectId: string, user: SessionUser): Promise<boolean> {
  const projectResult = await projectsService.getById(projectId);
  if (!projectResult.ok) return false;
  return projectResult.data.ownerId === user.id;
}

/** Manages the project board (columns, moderation): owner only. */
export async function requireProjectManager(
  projectId: string,
): Promise<{ user: SessionUser; project: ProjectDto }> {
  const user = await requireUser();
  const projectResult = await projectsService.getById(projectId);
  if (!projectResult.ok) throw new UnauthorizedError(projectResult.error);
  const project = projectResult.data;
  if (project.ownerId === user.id) return { user, project };
  throw new UnauthorizedError("Samo vlasnik projekta može ovu akciju");
}

/** Access to the board/project: must be a member. */
export async function requireProjectMember(projectId: string): Promise<SessionUser> {
  const user = await requireUser();
  if (await projectsService.isMember(projectId, user.id)) return user;
  throw new UnauthorizedError("Niste član ovog projekta");
}
