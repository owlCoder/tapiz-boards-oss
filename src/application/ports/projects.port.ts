import type { ProjectDto, ProjectMemberDto } from "@/domain/types";

export interface ProjectsRepo {
  /** All non-deleted projects the user is a member of. */
  listForUser(userId: string): Promise<ProjectDto[]>;
  /** Non-deleted projects owned by the user that are in Trash — used by the Trash view. */
  listTrashForUser(userId: string): Promise<ProjectDto[]>;
  findById(id: string): Promise<ProjectDto | null>;
  /** Same as findById but also returns soft-deleted projects — used by restore/permanent-delete. */
  findByIdIncludingDeleted(id: string): Promise<ProjectDto | null>;
  findByInviteCode(code: string): Promise<ProjectDto | null>;
  findByPublicToken(token: string): Promise<ProjectDto | null>;
  setPublicToken(projectId: string, token: string | null): Promise<void>;
  setRepoUrl(projectId: string, url: string | null): Promise<void>;
  /** Creates a project with default board columns and the owner as its first member. */
  create(ownerId: string, name: string, inviteCode: string): Promise<ProjectDto>;
  setInviteCode(projectId: string, code: string | null): Promise<void>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  /** Permanently deletes the project and all child data (columns, sprints, stories, comments, events, members). */
  permanentDelete(id: string): Promise<void>;
  transferOwnership(id: string, newOwnerId: string): Promise<void>;
  /** Non-deleted projects owned by the user — used by admin account-deletion checks. */
  countOwnedByUser(userId: string): Promise<number>;
  members(projectId: string): Promise<ProjectMemberDto[]>;
  isMember(projectId: string, userId: string): Promise<boolean>;
  addMember(projectId: string, userId: string): Promise<void>;
  removeMember(projectId: string, userId: string): Promise<void>;
}
