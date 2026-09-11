import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { sprintRetroItems, sprints, stories, users } from "@/infrastructure/db/schema";
import type { SprintsRepo } from "@/application/ports";
import type {
  RetroCategory,
  SprintDto,
  SprintRetroItemDto,
  SprintStatus,
} from "@/domain/types";

const sprintColumns = {
  id: sprints.id,
  projectId: sprints.projectId,
  name: sprints.name,
  goal: sprints.goal,
  startDate: sprints.startDate,
  endDate: sprints.endDate,
  status: sprints.status,
  storyCount: sql<number>`(select count(*) from ${stories} where ${stories.sprintId} = ${sprints.id})`.mapWith(Number),
  totalPoints: sql<number>`(select coalesce(sum(${stories.storyPoints}), 0) from ${stories} where ${stories.sprintId} = ${sprints.id})`.mapWith(Number),
  retroCount: sql<number>`(select count(*) from ${sprintRetroItems} where ${sprintRetroItems.sprintId} = ${sprints.id})`.mapWith(Number),
};

const retroItemColumns = {
  id: sprintRetroItems.id,
  sprintId: sprintRetroItems.sprintId,
  category: sprintRetroItems.category,
  body: sprintRetroItems.body,
  authorId: sprintRetroItems.authorId,
  authorName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
  createdAt: sql<string>`date_format(${sprintRetroItems.createdAt}, '%d.%m.%Y.')`,
};

export const sprintsRepo: SprintsRepo = {
  async listByProject(projectId: string): Promise<SprintDto[]> {
    return db
      .select(sprintColumns)
      .from(sprints)
      .where(eq(sprints.projectId, projectId))
      .orderBy(asc(sprints.createdAt), asc(sprints.startDate));
  },

  async findActiveByProject(projectId: string): Promise<SprintDto | null> {
    const rows = await db
      .select(sprintColumns)
      .from(sprints)
      .where(and(eq(sprints.projectId, projectId), eq(sprints.status, "active")))
      .limit(1);
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<SprintDto | null> {
    const rows = await db.select(sprintColumns).from(sprints).where(eq(sprints.id, id)).limit(1);
    return rows[0] ?? null;
  },

  async create(input): Promise<void> {
    await db.insert(sprints).values({
      projectId: input.projectId,
      name: input.name,
      goal: input.goal || null,
      startDate: input.startDate,
      endDate: input.endDate,
    });
  },

  async setStatus(id: string, status: SprintStatus): Promise<void> {
    await db.update(sprints).set({ status }).where(eq(sprints.id, id));
  },

  async remove(id: string): Promise<void> {
    // FK on delete set null — stories remain, they just lose their sprint.
    await db.delete(sprints).where(eq(sprints.id, id));
  },

  async retroItems(sprintId: string): Promise<SprintRetroItemDto[]> {
    return db
      .select(retroItemColumns)
      .from(sprintRetroItems)
      .innerJoin(users, eq(users.id, sprintRetroItems.authorId))
      .where(eq(sprintRetroItems.sprintId, sprintId))
      .orderBy(asc(sprintRetroItems.createdAt));
  },

  async retroItemById(id: string): Promise<SprintRetroItemDto | null> {
    const rows = await db
      .select(retroItemColumns)
      .from(sprintRetroItems)
      .innerJoin(users, eq(users.id, sprintRetroItems.authorId))
      .where(eq(sprintRetroItems.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  async addRetroItem(
    sprintId: string,
    authorId: string,
    category: RetroCategory,
    body: string,
  ): Promise<void> {
    await db.insert(sprintRetroItems).values({ sprintId, authorId, category, body });
  },

  async removeRetroItem(id: string): Promise<void> {
    await db.delete(sprintRetroItems).where(eq(sprintRetroItems.id, id));
  },
};
