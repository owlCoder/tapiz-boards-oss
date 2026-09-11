import { generateInviteCode } from "@/domain/services/invite-code";
import type { ProjectDto } from "@/domain/types";
import { projectsRepo } from "@/infrastructure/repositories/projects.repo";
import { fail, ok, type ActionResult } from "@/lib/action-result";

export const projectsService = {
  listForUser: (userId: string) => projectsRepo.listForUser(userId),
  listTrashForUser: (userId: string) => projectsRepo.listTrashForUser(userId),
  members: (projectId: string) => projectsRepo.members(projectId),
  isMember: (projectId: string, userId: string) => projectsRepo.isMember(projectId, userId),

  async getById(projectId: string): Promise<ActionResult<ProjectDto>> {
    const project = await projectsRepo.findById(projectId);
    if (!project) return fail("Projekat ne postoji");
    return ok(project);
  },

  /** Creates a new project with default board columns; owner becomes the first member. */
  async create(ownerId: string, name: string): Promise<ActionResult<ProjectDto>> {
    return ok(await projectsRepo.create(ownerId, name, generateInviteCode()));
  },

  /** Sadržaj člana (story-ji, komentari) se NE briše — samo članstvo. */
  removeMember: (projectId: string, userId: string) => projectsRepo.removeMember(projectId, userId),

  async joinByInviteCode(code: string, userId: string): Promise<ActionResult<ProjectDto>> {
    const project = await projectsRepo.findByInviteCode(code);
    if (!project) return fail("Invite kod ne postoji ili je deaktiviran");
    if (await projectsRepo.isMember(project.id, userId)) {
      return fail("Već ste član ovog projekta");
    }
    await projectsRepo.addMember(project.id, userId);
    return ok(project);
  },

  /** A new code invalidates the previous one (old links stop working). */
  async regenerateInviteCode(projectId: string): Promise<string> {
    const code = generateInviteCode();
    await projectsRepo.setInviteCode(projectId, code);
    return code;
  },

  disableInviteCode: (projectId: string) => projectsRepo.setInviteCode(projectId, null),

  async findByPublicToken(token: string): Promise<ProjectDto | null> {
    return projectsRepo.findByPublicToken(token);
  },

  /** A new token invalidates the previous public link. */
  async enablePublicLink(projectId: string): Promise<string> {
    const token = crypto.randomUUID();
    await projectsRepo.setPublicToken(projectId, token);
    return token;
  },

  disablePublicLink: (projectId: string) => projectsRepo.setPublicToken(projectId, null),

  /** Public GitHub repo link — entered/edited by members themselves. */
  setRepoUrl: (projectId: string, url: string | null) => projectsRepo.setRepoUrl(projectId, url),

  // ── Trash ────────────────────────────────────────────────────────────────

  async softDelete(projectId: string): Promise<ActionResult<void>> {
    await projectsRepo.softDelete(projectId);
    return ok(undefined);
  },

  async restore(projectId: string): Promise<ActionResult<void>> {
    await projectsRepo.restore(projectId);
    return ok(undefined);
  },

  async permanentDelete(projectId: string): Promise<ActionResult<void>> {
    await projectsRepo.permanentDelete(projectId);
    return ok(undefined);
  },
};
