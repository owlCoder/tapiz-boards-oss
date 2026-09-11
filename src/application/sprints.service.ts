import type { RetroItemInput, SprintInput } from "@/domain/validation/sprint.schema";
import type { SprintDto, SprintStatus } from "@/domain/types";
import { doneColumnId } from "@/domain/services/board-insights";
import { sprintsRepo } from "@/infrastructure/repositories/sprints.repo";
import { boardRepo } from "@/infrastructure/repositories/board.repo";
import { fail, ok, type ActionResult } from "@/lib/action-result";

export const sprintsService = {
  listByProject: (projectId: string) => sprintsRepo.listByProject(projectId),
  activeByProject: (projectId: string) => sprintsRepo.findActiveByProject(projectId),

  async getSprint(sprintId: string): Promise<ActionResult<SprintDto>> {
    const sprint = await sprintsRepo.findById(sprintId);
    if (!sprint) return fail("Sprint ne postoji");
    return ok(sprint);
  },

  getSprintStories: (sprintId: string) => boardRepo.storiesBySprint(sprintId),
  getStoriesBySprints: (sprintIds: string[]) => boardRepo.storiesBySprints(sprintIds),

  create: (projectId: string, input: SprintInput) =>
    sprintsRepo.create({
      projectId,
      name: input.name,
      goal: input.goal,
      startDate: input.startDate,
      endDate: input.endDate,
    }),

  /** Returns the sprint for writing into the project activity log. */
  async setStatus(projectId: string, sprintId: string, status: SprintStatus): Promise<ActionResult<SprintDto>> {
    const sprintResult = await this.getSprint(sprintId);
    if (!sprintResult.ok) return sprintResult;
    const sprint = sprintResult.data;
    if (sprint.projectId !== projectId) return fail("Sprint ne pripada ovom projektu");
    if (sprint.status === "completed") {
      return fail("Završen sprint se ne može ponovo aktivirati");
    }
    if (status === "completed") {
      return fail("Za završavanje sprinta koristite završni tok sprinta");
    }
    if (status === "active") {
      const all = await sprintsRepo.listByProject(projectId);
      if (all.some((s) => s.status === "active" && s.id !== sprintId)) {
        return fail("Projekat već ima aktivan sprint — prvo ga završite");
      }
      const columns = await boardRepo.columns(projectId);
      const firstColumnId = columns[0]?.id ?? null;
      if (firstColumnId !== null) {
        // One UPDATE for all sprint stories not yet on the board
        // (previously: one query per story).
        await boardRepo.placeUnassignedStoriesInColumn(sprintId, firstColumnId);
      }
    }
    await sprintsRepo.setStatus(sprintId, status);
    return ok(sprint);
  },

  async finishSprint(projectId: string, sprintId: string, targetSprintId: string | null): Promise<ActionResult<{
    sprint: SprintDto;
    unfinishedCount: number;
    targetSprint: SprintDto | null;
  }>> {
    const sprintResult = await this.getSprint(sprintId);
    if (!sprintResult.ok) return sprintResult;
    const sprint = sprintResult.data;
    if (sprint.projectId !== projectId) return fail("Sprint ne pripada ovom projektu");
    if (sprint.status !== "active") return fail("Može se završiti samo aktivan sprint");

    let targetSprint: SprintDto | null = null;
    if (targetSprintId) {
      const targetSprintResult = await this.getSprint(targetSprintId);
      if (!targetSprintResult.ok) return targetSprintResult;
      targetSprint = targetSprintResult.data;
      if (targetSprint.projectId !== projectId) return fail("Ciljni sprint ne pripada ovom projektu");
      if (targetSprint.id === sprint.id) return fail("Ciljni sprint mora biti različit");
      if (targetSprint.status === "completed") {
        return fail("Nezavršeni story-ji ne mogu u završen sprint");
      }
    }

    const [columns, stories] = await Promise.all([
      boardRepo.columns(projectId),
      boardRepo.storiesBySprint(sprint.id),
    ]);
    const doneId = doneColumnId(columns);
    const unfinished = stories.filter((story) => story.columnId !== doneId);

    await boardRepo.finishSprintPlacements(
      sprint.id,
      unfinished.map((story) => ({
        id: story.id,
        sprintId: targetSprint?.id ?? null,
        columnId: targetSprint ? story.columnId : null,
      })),
    );

    return ok({
      sprint,
      unfinishedCount: unfinished.length,
      targetSprint,
    });
  },

  async remove(projectId: string, sprintId: string): Promise<ActionResult<void>> {
    const sprintResult = await this.getSprint(sprintId);
    if (!sprintResult.ok) return sprintResult;
    const sprint = sprintResult.data;
    if (sprint.projectId !== projectId) return fail("Sprint ne pripada ovom projektu");
    await sprintsRepo.remove(sprintId);
    return ok(undefined);
  },

  // ── Retrospective — written once the sprint is completed ───────────────────

  async getRetro(projectId: string, sprintId: string): Promise<ActionResult<Awaited<ReturnType<typeof sprintsRepo.retroItems>>>> {
    const sprintResult = await this.getSprint(sprintId);
    if (!sprintResult.ok) return sprintResult;
    const sprint = sprintResult.data;
    if (sprint.projectId !== projectId) return fail("Sprint ne pripada ovom projektu");
    return ok(await sprintsRepo.retroItems(sprint.id));
  },

  async addRetroItem(projectId: string, sprintId: string, authorId: string, input: RetroItemInput): Promise<ActionResult<void>> {
    const sprintResult = await this.getSprint(sprintId);
    if (!sprintResult.ok) return sprintResult;
    const sprint = sprintResult.data;
    if (sprint.projectId !== projectId) return fail("Sprint ne pripada ovom projektu");
    if (sprint.status !== "completed") {
      return fail("Retrospektiva se piše po završetku sprinta");
    }
    await sprintsRepo.addRetroItem(sprint.id, authorId, input.category, input.body);
    return ok(undefined);
  },

  /** Autor briše svoje stavke; vlasnik projekta briše bilo koju. */
  async removeRetroItem(
    projectId: string,
    itemId: string,
    byUserId: string,
    canModerate: boolean,
  ): Promise<ActionResult<void>> {
    const item = await sprintsRepo.retroItemById(itemId);
    if (!item) return fail("Stavka ne postoji");
    const sprintResult = await this.getSprint(item.sprintId);
    if (!sprintResult.ok) return sprintResult;
    const sprint = sprintResult.data;
    if (sprint.projectId !== projectId) return fail("Stavka ne pripada ovom projektu");
    if (!canModerate && item.authorId !== byUserId) {
      return fail("Možete brisati samo svoje stavke");
    }
    await sprintsRepo.removeRetroItem(item.id);
    return ok(undefined);
  },
};
