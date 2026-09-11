import { cache } from "react";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { boardColumns, projectMembers, projects, users } from "@/infrastructure/db/schema";
import type { ProjectsRepo } from "@/application/ports";
import type { ProjectDto, ProjectMemberDto } from "@/domain/types";

const DEFAULT_COLUMNS = ["TO DO", "IN PROGRESS", "DONE"];

const dtoColumns = {
  id: projects.id,
  name: projects.name,
  ownerId: projects.ownerId,
  inviteCode: projects.inviteCode,
  publicToken: projects.publicToken,
  repoUrl: projects.repoUrl,
  deletedAt: projects.deletedAt,
};

function seedColumns(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], projectId: string) {
  return tx.insert(boardColumns).values(
    DEFAULT_COLUMNS.map((name, position) => ({
      id: crypto.randomUUID(),
      projectId,
      name,
      position,
      isDone: name === "DONE",
    })),
  );
}

/** Dedupe identical calls within the same request — several guards/actions on
 * the same page often look up the same project (see guards.ts). */
const findByIdCached = cache(async (id: string): Promise<ProjectDto | null> => {
  const rows = await db
    .select(dtoColumns)
    .from(projects)
    .where(and(eq(projects.id, id), isNull(projects.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
});

const isMemberCached = cache(async (projectId: string, userId: string): Promise<boolean> => {
  const rows = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);
  return rows.length > 0;
});

export const projectsRepo: ProjectsRepo = {
  async listForUser(userId: string): Promise<ProjectDto[]> {
    return db
      .select({
        ...dtoColumns,
        memberCount:
          sql<number>`(select count(*) from project_members pm where pm.project_id = ${projects.id})`.mapWith(
            Number,
          ),
      })
      .from(projectMembers)
      .innerJoin(projects, eq(projects.id, projectMembers.projectId))
      .where(and(eq(projectMembers.userId, userId), isNull(projects.deletedAt)))
      .orderBy(asc(projects.name));
  },

  async listTrashForUser(userId: string): Promise<ProjectDto[]> {
    return db
      .select(dtoColumns)
      .from(projects)
      .where(and(eq(projects.ownerId, userId), sql`${projects.deletedAt} is not null`))
      .orderBy(asc(projects.name));
  },

  findById: findByIdCached,

  async findByIdIncludingDeleted(id: string): Promise<ProjectDto | null> {
    const rows = await db.select(dtoColumns).from(projects).where(eq(projects.id, id)).limit(1);
    return rows[0] ?? null;
  },

  async findByInviteCode(code: string): Promise<ProjectDto | null> {
    const rows = await db
      .select(dtoColumns)
      .from(projects)
      .where(and(eq(projects.inviteCode, code), isNull(projects.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  },

  async findByPublicToken(token: string): Promise<ProjectDto | null> {
    const rows = await db
      .select(dtoColumns)
      .from(projects)
      .where(and(eq(projects.publicToken, token), isNull(projects.deletedAt)))
      .limit(1);
    return rows[0] ?? null;
  },

  async setPublicToken(projectId: string, token: string | null): Promise<void> {
    await db.update(projects).set({ publicToken: token }).where(eq(projects.id, projectId));
  },

  async setRepoUrl(projectId: string, url: string | null): Promise<void> {
    await db.update(projects).set({ repoUrl: url }).where(eq(projects.id, projectId));
  },

  async create(ownerId: string, name: string, inviteCode: string): Promise<ProjectDto> {
    const projectId = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(projects).values({ id: projectId, name, ownerId, inviteCode });
      await seedColumns(tx, projectId);
      await tx.insert(projectMembers).values({ projectId, userId: ownerId });
    });
    return {
      id: projectId,
      name,
      ownerId,
      inviteCode,
      publicToken: null,
      repoUrl: null,
      deletedAt: null,
    };
  },

  async setInviteCode(projectId: string, code: string | null): Promise<void> {
    await db.update(projects).set({ inviteCode: code }).where(eq(projects.id, projectId));
  },

  async softDelete(id: string): Promise<void> {
    await db.update(projects).set({ deletedAt: new Date() }).where(eq(projects.id, id));
  },

  async restore(id: string): Promise<void> {
    await db.update(projects).set({ deletedAt: null }).where(eq(projects.id, id));
  },

  async permanentDelete(id: string): Promise<void> {
    // All child tables declare onDelete: "cascade" on their project_id FK
    // (board_columns, sprints, stories, project_events, project_members), and
    // stories cascades further into story_tasks/comments. A single delete is
    // sufficient — verified against the generated migration SQL.
    await db.delete(projects).where(eq(projects.id, id));
  },

  async transferOwnership(id: string, newOwnerId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.update(projects).set({ ownerId: newOwnerId }).where(eq(projects.id, id));
      const existing = await tx
        .select({ userId: projectMembers.userId })
        .from(projectMembers)
        .where(and(eq(projectMembers.projectId, id), eq(projectMembers.userId, newOwnerId)))
        .limit(1);
      if (existing.length === 0) {
        await tx.insert(projectMembers).values({ projectId: id, userId: newOwnerId });
      }
    });
  },

  async countOwnedByUser(userId: string): Promise<number> {
    const rows = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.ownerId, userId), isNull(projects.deletedAt)));
    return rows.length;
  },

  async members(projectId: string): Promise<ProjectMemberDto[]> {
    return db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(projectMembers)
      .innerJoin(users, eq(users.id, projectMembers.userId))
      .where(eq(projectMembers.projectId, projectId))
      .orderBy(asc(users.lastName), asc(users.firstName));
  },

  isMember: isMemberCached,

  async addMember(projectId: string, userId: string): Promise<void> {
    await db.insert(projectMembers).values({ projectId, userId });
  },

  async removeMember(projectId: string, userId: string): Promise<void> {
    await db
      .delete(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
  },
};
