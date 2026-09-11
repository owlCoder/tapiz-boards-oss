import { asc, eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { boardColumns } from "@/infrastructure/db/schema";
import type { BoardColumnDto } from "@/domain/types";

export async function getColumns(projectId: string): Promise<BoardColumnDto[]> {
  return db
    .select()
    .from(boardColumns)
    .where(eq(boardColumns.projectId, projectId))
    .orderBy(asc(boardColumns.position));
}

export async function getColumnById(id: string): Promise<BoardColumnDto | null> {
  const rows = await db.select().from(boardColumns).where(eq(boardColumns.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createColumn(projectId: string, name: string, position: number): Promise<void> {
  await db.insert(boardColumns).values({ projectId, name, position });
}

export async function renameColumn(id: string, name: string): Promise<void> {
  await db.update(boardColumns).set({ name }).where(eq(boardColumns.id, id));
}

export async function setColumnWipLimit(id: string, wipLimit: number | null): Promise<void> {
  await db.update(boardColumns).set({ wipLimit }).where(eq(boardColumns.id, id));
}

/**
 * Marks a column as "Done". Exactly one column per project may be Done, so
 * setting it clears the flag on all other columns of the project first.
 * Unsetting (isDone=false) only clears the flag on the given column.
 */
export async function setColumnDone(projectId: string, id: string, isDone: boolean): Promise<void> {
  if (isDone) {
    await db.update(boardColumns).set({ isDone: false }).where(eq(boardColumns.projectId, projectId));
  }
  await db.update(boardColumns).set({ isDone }).where(eq(boardColumns.id, id));
}

export async function removeColumn(id: string): Promise<void> {
  await db.delete(boardColumns).where(eq(boardColumns.id, id));
}
