export interface ProjectDto {
  id: string;
  name: string;
  ownerId: string;
  /** Token for the public read-only board view; NULL = disabled. */
  publicToken: string | null;
  /** Public GitHub repo linked to the project; NULL = not linked. */
  repoUrl: string | null;
  /** Soft-delete marker; NULL = active project. */
  deletedAt: Date | null;
  memberCount?: number;
}

export interface ProjectMemberDto {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export function projectDisplayName(project: Pick<ProjectDto, "name">): string {
  return project.name ?? "—";
}
