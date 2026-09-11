import type {
  MoveStoryInput,
  StoryDetailsInput,
  StoryInput,
} from "@/domain/validation/story.schema";
import type { StoryDto } from "@/domain/types";
import { boardRepo } from "@/infrastructure/repositories/board.repo";
import { sprintsRepo } from "@/infrastructure/repositories/sprints.repo";
import { projectsRepo } from "@/infrastructure/repositories/projects.repo";
import { fail, ok, type ActionResult } from "@/lib/action-result";

export const boardService = {
  async getBoard(projectId: string) {
    const [columns, activeSprint] = await Promise.all([
      boardRepo.boardWithStories(projectId),
      sprintsRepo.findActiveByProject(projectId),
    ]);
    if (!activeSprint) {
      return columns.map((column) => ({ ...column, stories: [] }));
    }
    return columns.map((column) => ({
      ...column,
      stories: column.stories.filter((story) => story.sprintId === activeSprint.id),
    }));
  },

  async getBacklog(projectId: string) {
    const [stories, activeSprint] = await Promise.all([
      boardRepo.storiesByProject(projectId),
      sprintsRepo.findActiveByProject(projectId),
    ]);
    if (!activeSprint) return stories;
    return stories.filter((story) => story.sprintId !== activeSprint.id);
  },
  getColumns: (projectId: string) => boardRepo.columns(projectId),
  getComments: (storyId: string) => boardRepo.comments(storyId),

  /** "My Work" — all stories assigned to the user, across all projects. */
  myWork: (userId: string) => boardRepo.assignedToUser(userId),

  async getStory(storyId: string): Promise<ActionResult<StoryDto>> {
    const story = await boardRepo.storyById(storyId);
    if (!story) return fail("User story ne postoji");
    return ok(story);
  },

  async createColumn(projectId: string, name: string): Promise<ActionResult<void>> {
    const cols = await boardRepo.columns(projectId);
    await boardRepo.createColumn(projectId, name, cols.length);
    return ok(undefined);
  },

  async renameColumn(projectId: string, columnId: string, name: string): Promise<ActionResult<void>> {
    const col = await boardRepo.columnById(columnId);
    if (!col || col.projectId !== projectId) return fail("Kolona ne postoji");
    await boardRepo.renameColumn(columnId, name);
    return ok(undefined);
  },

  async setColumnWipLimit(projectId: string, columnId: string, wipLimit: number | null): Promise<ActionResult<void>> {
    const col = await boardRepo.columnById(columnId);
    if (!col || col.projectId !== projectId) return fail("Kolona ne postoji");
    await boardRepo.setColumnWipLimit(columnId, wipLimit);
    return ok(undefined);
  },

  /** Sets/unsets the "Done" column; repo guarantees exactly one per project. */
  async setColumnDone(projectId: string, columnId: string, isDone: boolean): Promise<ActionResult<void>> {
    const col = await boardRepo.columnById(columnId);
    if (!col || col.projectId !== projectId) return fail("Kolona ne postoji");
    await boardRepo.setColumnDone(projectId, columnId, isDone);
    return ok(undefined);
  },

  /** Deleting a column sends its stories to the backlog (FK on delete set null). */
  async removeColumn(projectId: string, columnId: string): Promise<ActionResult<void>> {
    const col = await boardRepo.columnById(columnId);
    if (!col || col.projectId !== projectId) return fail("Kolona ne postoji");
    await boardRepo.removeColumn(columnId);
    return ok(undefined);
  },

  async createStory(
    projectId: string,
    authorId: string,
    input: StoryInput & { columnId?: string | null; sprintId?: string | null },
  ): Promise<ActionResult<void>> {
    let columnId = input.columnId ?? null;
    let sprintId = input.sprintId ?? null;
    const [activeSprint, columns] = await Promise.all([
      sprintsRepo.findActiveByProject(projectId),
      boardRepo.columns(projectId),
    ]);
    const firstColumnId = columns[0]?.id ?? null;

    if (columnId && sprintId === null) {
      if (!activeSprint) return fail("Pokrenite sprint pre dodavanja story-ja na board");
      sprintId = activeSprint.id;
    }
    if (sprintId && activeSprint?.id === sprintId && columnId === null) {
      columnId = firstColumnId;
    }
    if (columnId) {
      const col = await boardRepo.columnById(columnId);
      if (!col || col.projectId !== projectId) return fail("Kolona ne postoji");
    }
    if (sprintId) {
      const sprint = await sprintsRepo.findById(sprintId);
      if (!sprint || sprint.projectId !== projectId) return fail("Sprint ne postoji");
      if (sprint.status === "completed") return fail("Story ne može biti dodat u završen sprint");
    }
    const position = await boardRepo.nextStoryPosition(projectId, columnId);
    await boardRepo.createStory({
      projectId,
      columnId,
      sprintId,
      title: input.title,
      description: input.description,
      position,
      authorId,
    });
    return ok(undefined);
  },

  /** Updates details (column, assignee, sprint, priority). The passed-in `story`
   *  is used directly — no redundant DB read inside the service. */
  async updateStoryDetails(
    projectId: string,
    story: StoryDto,
    input: StoryDetailsInput,
  ): Promise<ActionResult<void>> {
    let sprintId = input.sprintId;
    let columnId = input.columnId;
    const [activeSprint, columns] = await Promise.all([
      sprintsRepo.findActiveByProject(projectId),
      boardRepo.columns(projectId),
    ]);
    const firstColumnId = columns[0]?.id ?? null;

    if (columnId && sprintId === null) {
      if (!activeSprint) return fail("Pokrenite sprint pre prebacivanja story-ja na board");
      sprintId = activeSprint.id;
    }
    if (sprintId && activeSprint?.id === sprintId && columnId === null) {
      columnId = firstColumnId;
    }

    if (story.projectId !== projectId) return fail("Story ne pripada ovom projektu");
    if (input.assigneeId) {
      const isMember = await projectsRepo.isMember(projectId, input.assigneeId);
      if (!isMember) return fail("Dodeljena osoba nije član projekta");
    }
    if (sprintId) {
      const sprint = await sprintsRepo.findById(sprintId);
      if (!sprint || sprint.projectId !== projectId) return fail("Sprint ne postoji");
      if (sprint.status === "completed" && sprint.id !== story.sprintId) {
        return fail("Story ne može biti premešten u završen sprint");
      }
    }
    if (columnId) {
      const col = await boardRepo.columnById(columnId);
      if (!col || col.projectId !== projectId) return fail("Kolona ne postoji");
    }
    if (columnId !== story.columnId) {
      const nextPosition = await boardRepo.nextStoryPosition(projectId, columnId);
      await boardRepo.moveStory(story.id, columnId, nextPosition);
    }
    await boardRepo.updateStoryDetails(story.id, {
      ...input,
      sprintId,
      columnId,
    });
    return ok(undefined);
  },

  /** Updates title/description and all details in one call — for a full save from StoryDetailPanel. */
  async updateStoryFull(
    projectId: string,
    story: StoryDto,
    titleDesc: StoryInput,
    details: StoryDetailsInput,
  ): Promise<ActionResult<void>> {
    await boardRepo.updateStory(story.id, {
      title: titleDesc.title,
      description: titleDesc.description,
    });
    return this.updateStoryDetails(projectId, story, details);
  },

  removeStory: (storyId: string) => boardRepo.removeStory(storyId),

  async moveStory(projectId: string, input: MoveStoryInput): Promise<ActionResult<void>> {
    const storyResult = await this.getStory(input.storyId);
    if (!storyResult.ok) return storyResult;
    const story = storyResult.data;
    if (story.projectId !== projectId) return fail("Story ne pripada ovom projektu");
    if (input.toColumnId) {
      const col = await boardRepo.columnById(input.toColumnId);
      if (!col || col.projectId !== projectId) return fail("Kolona ne postoji");
      const activeSprint = await sprintsRepo.findActiveByProject(projectId);
      if (!activeSprint) return fail("Pokrenite sprint pre prebacivanja story-ja na board");
      if (story.sprintId !== activeSprint.id) {
        await boardRepo.updateStoryPlacement(story.id, {
          sprintId: activeSprint.id,
          columnId: story.columnId,
        });
      }
    }
    await boardRepo.moveStory(input.storyId, input.toColumnId, input.toIndex);
    return ok(undefined);
  },

  async getTasks(projectId: string, storyId: string): Promise<ActionResult<Awaited<ReturnType<typeof boardRepo.tasks>>>> {
    const storyResult = await this.getStory(storyId);
    if (!storyResult.ok) return storyResult;
    const story = storyResult.data;
    if (story.projectId !== projectId) return fail("Story ne pripada ovom projektu");
    return ok(await boardRepo.tasks(story.id));
  },

  async addTask(projectId: string, storyId: string, title: string): Promise<ActionResult<void>> {
    const storyResult = await this.getStory(storyId);
    if (!storyResult.ok) return storyResult;
    const story = storyResult.data;
    if (story.projectId !== projectId) return fail("Story ne pripada ovom projektu");
    await boardRepo.addTask(story.id, title);
    return ok(undefined);
  },

  /** Returns titles for writing into the project activity log. */
  async setTaskDone(projectId: string, taskId: string, done: boolean): Promise<ActionResult<{ taskTitle: string; storyTitle: string; storyId: string }>> {
    const task = await boardRepo.taskById(taskId);
    if (!task) return fail("Stavka ne postoji");
    const storyResult = await this.getStory(task.storyId);
    if (!storyResult.ok) return storyResult;
    const story = storyResult.data;
    if (story.projectId !== projectId) return fail("Stavka ne pripada ovom projektu");
    await boardRepo.setTaskDone(task.id, done);
    return ok({ taskTitle: task.title, storyTitle: story.title, storyId: story.id });
  },

  async removeTask(projectId: string, taskId: string): Promise<ActionResult<void>> {
    const task = await boardRepo.taskById(taskId);
    if (!task) return fail("Stavka ne postoji");
    const storyResult = await this.getStory(task.storyId);
    if (!storyResult.ok) return storyResult;
    const story = storyResult.data;
    if (story.projectId !== projectId) return fail("Stavka ne pripada ovom projektu");
    await boardRepo.removeTask(task.id);
    return ok(undefined);
  },

  addComment: (storyId: string, authorId: string, body: string) =>
    boardRepo.addComment(storyId, authorId, body),

  async removeComment(
    projectId: string,
    commentId: string,
    byUserId: string,
    canModerate: boolean,
  ): Promise<ActionResult<void>> {
    const comment = await boardRepo.commentById(commentId);
    if (!comment) return fail("Komentar ne postoji");
    const story = await boardRepo.storyById(comment.storyId);
    if (!story || story.projectId !== projectId) return fail("Komentar ne postoji");
    if (!canModerate && comment.authorId !== byUserId) {
      return fail("Možete brisati samo svoje komentare");
    }
    await boardRepo.removeComment(commentId);
    return ok(undefined);
  },
};
