import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { projectsService } from "@/application/projects.service";
import type { ProjectDto } from "@/domain/types";
import type { SessionUser } from "@/lib/guards";

export interface ProjectPageContext {
  user: SessionUser;
  project: ProjectDto;
  /** Whether the user manages the project (owner). */
  canManage: boolean;
}

/** Server-side access check for project pages: any logged-in user can view
 * and work on any project on this deployment; owner can manage. */
export async function requireProjectPageAccess(projectId: string): Promise<ProjectPageContext> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user: SessionUser = {
    id: session.user.id,
    role: session.user.role,
    name: session.user.name ?? "",
  };

  const projectResult = await projectsService.getById(projectId);
  if (!projectResult.ok) notFound();
  const project = projectResult.data;

  const canManage = project.ownerId === user.id;
  return { user, project, canManage };
}
