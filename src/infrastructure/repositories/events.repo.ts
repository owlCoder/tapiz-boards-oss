import { and, asc, eq, lt, sql } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { stories, projectEvents, users } from "@/infrastructure/db/schema";
import type { EventsRepo } from "@/application/ports";
import type { ActivityDay, ProjectEventDto, ProjectEventType } from "@/domain/types";

export const eventsRepo: EventsRepo = {
  async add(
    projectId: string,
    actorId: string,
    type: ProjectEventType,
    detail: string,
    storyId: string | null = null,
  ): Promise<void> {
    await db.insert(projectEvents).values({ projectId, actorId, type, detail, storyId });
  },

  /** Retention: deletes events older than `cutoff`. Returns the number of rows deleted. */
  async deleteOlderThan(cutoff: Date): Promise<number> {
    const result = await db.delete(projectEvents).where(lt(projectEvents.createdAt, cutoff));
    return (result[0] as { affectedRows: number }).affectedRows ?? 0;
  },

  async listByDay(projectId: string, dayIso: string): Promise<ProjectEventDto[]> {
    return db
      .select({
        id: projectEvents.id,
        type: projectEvents.type,
        actorName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
        storyId: projectEvents.storyId,
        detail: projectEvents.detail,
        time: sql<string>`date_format(${projectEvents.createdAt}, '%H:%i')`,
      })
      .from(projectEvents)
      .innerJoin(users, eq(users.id, projectEvents.actorId))
      .where(
        and(eq(projectEvents.projectId, projectId), sql`date(${projectEvents.createdAt}) = ${dayIso}`),
      )
      .orderBy(asc(projectEvents.createdAt));
  },

  async daysInRange(projectId: string, fromIso: string, toIso: string): Promise<ActivityDay[]> {
    return db
      .select({
        day: sql<string>`date_format(${projectEvents.createdAt}, '%Y-%m-%d')`,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(projectEvents)
      .where(
        and(
          eq(projectEvents.projectId, projectId),
          sql`date(${projectEvents.createdAt}) between ${fromIso} and ${toIso}`,
        ),
      )
      .groupBy(sql`date_format(${projectEvents.createdAt}, '%Y-%m-%d')`);
  },

  async dueStoriesByDay(projectId: string, dayIso: string): Promise<string[]> {
    const rows = await db
      .select({ title: stories.title })
      .from(stories)
      .where(and(eq(stories.projectId, projectId), eq(stories.dueDate, dayIso)))
      .orderBy(asc(stories.title));
    return rows.map((row) => row.title);
  },
};
