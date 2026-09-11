import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { stories } from "@/infrastructure/db/schema";
import { getStoryById } from "./story.queries";

/** Drizzle transaction handle (same API as `db`, scoped to the transaction). */
type MySqlTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function nextStoryPosition(
  projectId: string,
  columnId: string | null,
): Promise<number> {
  const rows = await db
    .select({ max: sql<number | null>`max(${stories.position})` })
    .from(stories)
    .where(
      and(
        eq(stories.projectId, projectId),
        columnId === null ? isNull(stories.columnId) : eq(stories.columnId, columnId),
      ),
    );
  const max = rows[0]?.max;
  return max === null || max === undefined ? 0 : Number(max) + 1;
}

/**
 * Renormalizes `position` within one column (or the backlog, columnId=null) to
 * 0..n-1 with a single UPDATE via ROW_NUMBER() — no per-row loop.
 */
function renormalizeColumn(tx: MySqlTx, projectId: string, columnId: string | null) {
  const colMatch = columnId === null ? sql`${stories.columnId} is null` : sql`${stories.columnId} = ${columnId}`;
  return tx.execute(sql`
    update ${stories} as s
    join (
      select id, row_number() over (order by position asc, created_at asc) - 1 as rn
      from ${stories}
      where project_id = ${projectId} and ${colMatch}
    ) ranked on ranked.id = s.id
    set s.position = ranked.rn
  `);
}

export async function moveStory(
  storyId: string,
  toColumnId: string | null,
  toIndex: number,
): Promise<void> {
  const story = await getStoryById(storyId);
  if (!story) return;
  const fromColumnId = story.columnId;

  await db.transaction(async (tx) => {
    // Sentinel position (toIndex*2 - 1) inserts the moved story exactly between
    // its neighbors before renormalization; ROW_NUMBER then packs everything to 0..n-1.
    await tx
      .update(stories)
      .set({ columnId: toColumnId, position: toIndex * 2 - 1 })
      .where(eq(stories.id, storyId));

    await renormalizeColumn(tx, story.projectId, toColumnId);
    if (fromColumnId !== toColumnId) {
      await renormalizeColumn(tx, story.projectId, fromColumnId);
    }
  });
}
