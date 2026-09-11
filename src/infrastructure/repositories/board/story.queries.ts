import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { db } from "@/infrastructure/db/client";
import {
  boardColumns,
  comments,
  sprints,
  stories,
  storyTasks,
  projects,
  users,
} from "@/infrastructure/db/schema";
import type { BoardColumnWithStories, MyWorkItem, StoryDto } from "@/domain/types";
import { getColumns } from "./column.queries";

const assignees = alias(users, "assignees");
const ownProjects = alias(projects, "own_projects");

export const storyColumns = {
  id: stories.id,
  projectId: stories.projectId,
  columnId: stories.columnId,
  sprintId: stories.sprintId,
  sprintName: sprints.name,
  title: stories.title,
  description: stories.description,
  position: stories.position,
  authorId: stories.authorId,
  authorName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
  assigneeId: stories.assigneeId,
  assigneeName: sql<
    string | null
  >`if(${assignees.id} is null, null, concat(${assignees.firstName}, ' ', ${assignees.lastName}))`,
  storyPoints: stories.storyPoints,
  priority: stories.priority,
  dueDate: stories.dueDate,
  commentCount: sql<number>`(select count(*) from ${comments} where ${comments.storyId} = ${stories.id})`.mapWith(Number),
  taskCount: sql<number>`(select count(*) from ${storyTasks} where ${storyTasks.storyId} = ${stories.id})`.mapWith(Number),
  tasksDone: sql<number>`(select count(*) from ${storyTasks} where ${storyTasks.storyId} = ${stories.id} and ${storyTasks.done} = true)`.mapWith(Number),
  createdAt: sql<string>`date_format(${stories.createdAt}, '%d.%m.%Y.')`,
};

export function storySelect() {
  return db
    .select(storyColumns)
    .from(stories)
    .innerJoin(users, eq(users.id, stories.authorId))
    .leftJoin(assignees, eq(assignees.id, stories.assigneeId))
    .leftJoin(sprints, eq(sprints.id, stories.sprintId));
}

export async function listStories(projectId: string, columnId: string | null): Promise<StoryDto[]> {
  return storySelect()
    .where(
      and(
        eq(stories.projectId, projectId),
        columnId === null ? isNull(stories.columnId) : eq(stories.columnId, columnId),
      ),
    )
    .orderBy(asc(stories.position), asc(stories.createdAt));
}

export async function getBoardWithStories(projectId: string): Promise<BoardColumnWithStories[]> {
  const cols = await getColumns(projectId);
  const all = await storySelect()
    .where(eq(stories.projectId, projectId))
    .orderBy(asc(stories.position), asc(stories.createdAt));
  return cols.map((col) => ({
    ...col,
    stories: all.filter((s) => s.columnId === col.id),
  }));
}

export async function getStoryById(id: string): Promise<StoryDto | null> {
  const rows = await storySelect().where(eq(stories.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getStoriesBySprint(sprintId: string): Promise<StoryDto[]> {
  return storySelect()
    .where(eq(stories.sprintId, sprintId))
    .orderBy(asc(stories.position), asc(stories.createdAt));
}

/** Batch variant: one query for all sprints (avoids N queries per sprint on the sprints page). */
export async function getStoriesBySprints(
  sprintIds: string[],
): Promise<Record<string, StoryDto[]>> {
  const byId: Record<string, StoryDto[]> = {};
  if (sprintIds.length === 0) return byId;
  const rows = await storySelect()
    .where(inArray(stories.sprintId, sprintIds))
    .orderBy(asc(stories.position), asc(stories.createdAt));
  for (const row of rows) {
    if (row.sprintId === null) continue;
    (byId[row.sprintId] ??= []).push(row);
  }
  return byId;
}

export async function getStoriesByProject(projectId: string): Promise<StoryDto[]> {
  return storySelect()
    .where(eq(stories.projectId, projectId))
    .orderBy(asc(stories.position), asc(stories.createdAt));
}

/** All stories assigned to the user, across all their projects — for "My Work". */
export async function getStoriesAssignedToUser(userId: string): Promise<MyWorkItem[]> {
  return db
    .select({
      ...storyColumns,
      projectName: ownProjects.name,
      columnName: sql<string | null>`${boardColumns.name}`,
    })
    .from(stories)
    .innerJoin(users, eq(users.id, stories.authorId))
    .leftJoin(assignees, eq(assignees.id, stories.assigneeId))
    .leftJoin(sprints, eq(sprints.id, stories.sprintId))
    .innerJoin(ownProjects, eq(ownProjects.id, stories.projectId))
    .leftJoin(boardColumns, eq(boardColumns.id, stories.columnId))
    .where(eq(stories.assigneeId, userId))
    .orderBy(desc(stories.createdAt));
}

export async function createStory(input: {
  projectId: string;
  columnId: string | null;
  sprintId: string | null;
  title: string;
  description: string;
  position: number;
  authorId: string;
}): Promise<void> {
  await db.insert(stories).values(input);
}

export async function updateStory(
  id: string,
  input: { title: string; description: string },
): Promise<void> {
  await db.update(stories).set(input).where(eq(stories.id, id));
}

export async function updateStoryDetails(
  id: string,
  input: {
    assigneeId: string | null;
    storyPoints: number | null;
    sprintId: string | null;
    columnId: string | null;
    priority: StoryDto["priority"];
    dueDate: string | null;
  },
): Promise<void> {
  await db.update(stories).set(input).where(eq(stories.id, id));
}

export async function updateStoryPlacement(
  id: string,
  input: { sprintId: string | null; columnId: string | null },
): Promise<void> {
  await db.update(stories).set(input).where(eq(stories.id, id));
}

/**
 * Moves all not-yet-placed stories of a sprint (columnId = NULL) into a single column —
 * one UPDATE instead of one query per story (called when starting a sprint).
 */
export async function placeUnassignedStoriesInColumn(
  sprintId: string,
  columnId: string,
): Promise<void> {
  await db
    .update(stories)
    .set({ columnId })
    .where(and(eq(stories.sprintId, sprintId), isNull(stories.columnId)));
}

/**
 * Moves unfinished stories (each to its target sprint/column) and completes the
 * sprint in one transaction — if any step fails, no story moves and the sprint
 * doesn't transition to "completed".
 */
export async function finishSprintPlacements(
  sprintId: string,
  placements: { id: string; sprintId: string | null; columnId: string | null }[],
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const { id, sprintId: toSprintId, columnId } of placements) {
      await tx.update(stories).set({ sprintId: toSprintId, columnId }).where(eq(stories.id, id));
    }
    await tx.update(sprints).set({ status: "completed" }).where(eq(sprints.id, sprintId));
  });
}

export async function removeStory(id: string): Promise<void> {
  await db.delete(stories).where(eq(stories.id, id));
}
