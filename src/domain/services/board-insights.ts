import type { BoardColumnDto, StoryDto } from "@/domain/types";

/**
 * „Završeno" kolona. Prednost ima eksplicitno označena (`isDone`); ako nijedna
 * nije označena, fallback je kolona sa najvećom pozicijom (poslednja) — čuva
 * ponašanje za timove kreirane pre eksplicitnog flag-a.
 */
export function doneColumnId(
  columns: Pick<BoardColumnDto, "id" | "position" | "isDone">[],
): string | null {
  if (columns.length === 0) return null;
  const explicit = columns.find((col) => col.isDone);
  if (explicit) return explicit.id;
  return columns.reduce((max, col) => (col.position > max.position ? col : max)).id;
}

export interface StoryProgress {
  doneCount: number;
  totalCount: number;
  donePoints: number;
  totalPoints: number;
}

export function storyProgress(
  stories: Pick<StoryDto, "columnId" | "storyPoints">[],
  doneId: string | null,
): StoryProgress {
  let doneCount = 0;
  let donePoints = 0;
  let totalPoints = 0;
  for (const story of stories) {
    totalPoints += story.storyPoints ?? 0;
    if (doneId !== null && story.columnId === doneId) {
      doneCount++;
      donePoints += story.storyPoints ?? 0;
    }
  }
  return { doneCount, totalCount: stories.length, donePoints, totalPoints };
}
