import type {
  BoardColumnDto,
  BoardColumnWithStories,
  CommentDto,
  MyWorkItem,
  StoryDto,
  StoryPriority,
  StoryTaskDto,
} from "@/domain/types";

export interface BoardRepo {
  columns(projectId: string): Promise<BoardColumnDto[]>;
  columnById(id: string): Promise<BoardColumnDto | null>;
  createColumn(projectId: string, name: string, position: number): Promise<void>;
  renameColumn(id: string, name: string): Promise<void>;
  setColumnWipLimit(id: string, wipLimit: number | null): Promise<void>;
  setColumnDone(projectId: string, id: string, isDone: boolean): Promise<void>;
  removeColumn(id: string): Promise<void>;
  boardWithStories(projectId: string): Promise<BoardColumnWithStories[]>;
  backlog(projectId: string): Promise<StoryDto[]>;
  storiesByProject(projectId: string): Promise<StoryDto[]>;
  assignedToUser(userId: string): Promise<MyWorkItem[]>;
  storyById(id: string): Promise<StoryDto | null>;
  createStory(input: {
    projectId: string;
    columnId: string | null;
    sprintId: string | null;
    title: string;
    description: string;
    position: number;
    authorId: string;
  }): Promise<void>;
  updateStory(id: string, input: { title: string; description: string }): Promise<void>;
  updateStoryDetails(
    id: string,
    input: {
      assigneeId: string | null;
      storyPoints: number | null;
      sprintId: string | null;
      columnId: string | null;
      priority: StoryPriority;
      dueDate: string | null;
    },
  ): Promise<void>;
  updateStoryPlacement(
    id: string,
    input: { sprintId: string | null; columnId: string | null },
  ): Promise<void>;
  placeUnassignedStoriesInColumn(sprintId: string, columnId: string): Promise<void>;
  finishSprintPlacements(
    sprintId: string,
    placements: { id: string; sprintId: string | null; columnId: string | null }[],
  ): Promise<void>;
  removeStory(id: string): Promise<void>;
  tasks(storyId: string): Promise<StoryTaskDto[]>;
  taskById(id: string): Promise<StoryTaskDto | null>;
  addTask(storyId: string, title: string): Promise<void>;
  setTaskDone(id: string, done: boolean): Promise<void>;
  removeTask(id: string): Promise<void>;
  storiesBySprint(sprintId: string): Promise<StoryDto[]>;
  storiesBySprints(sprintIds: string[]): Promise<Record<string, StoryDto[]>>;
  nextStoryPosition(projectId: string, columnId: string | null): Promise<number>;
  moveStory(storyId: string, toColumnId: string | null, toIndex: number): Promise<void>;
  comments(storyId: string): Promise<CommentDto[]>;
  commentById(id: string): Promise<CommentDto | null>;
  addComment(storyId: string, authorId: string, body: string): Promise<CommentDto>;
  removeComment(id: string): Promise<void>;
}
