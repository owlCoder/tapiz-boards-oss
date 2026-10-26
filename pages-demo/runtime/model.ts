import { z } from "zod";
import type { ProjectDto, SprintDto, StoryDto, UserDto } from "@/domain/types";

const id = z.string().min(1);
const nullable = z.string().nullable();
const user = z.object({
  id,
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  role: z.enum(["admin", "member"]),
  isActive: z.boolean(),
});
const project = z.object({
  id,
  name: z.string().min(1),
  ownerId: id,
  publicToken: nullable,
  repoUrl: nullable,
  deletedAt: nullable,
  memberIds: z.array(id),
});
const column = z.object({
  id,
  projectId: id,
  name: z.string(),
  position: z.number().int(),
  wipLimit: z.number().int().positive().nullable(),
  isDone: z.boolean(),
});
const sprint = z.object({
  id,
  projectId: id,
  name: z.string(),
  goal: nullable,
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(["planned", "active", "completed"]),
  storyCount: z.number(),
  totalPoints: z.number(),
  retroCount: z.number(),
});
const story = z.object({
  id,
  projectId: id,
  columnId: nullable,
  sprintId: nullable,
  sprintName: nullable,
  title: z.string().min(1),
  description: nullable,
  position: z.number().int(),
  authorId: id,
  authorName: z.string(),
  assigneeId: nullable,
  assigneeName: nullable,
  storyPoints: z.number().int().nonnegative().nullable(),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: nullable,
  commentCount: z.number(),
  taskCount: z.number(),
  tasksDone: z.number(),
  createdAt: z.string(),
});
const task = z.object({
  id,
  storyId: id,
  title: z.string(),
  done: z.boolean(),
});
const comment = z.object({
  id,
  storyId: id,
  authorId: id,
  authorName: z.string(),
  body: z.string(),
  createdAt: z.string(),
});
const retro = z.object({
  id,
  sprintId: id,
  category: z.enum(["good", "bad"]),
  body: z.string(),
  authorId: id,
  authorName: z.string(),
  createdAt: z.string(),
});
const event = z.object({
  id,
  projectId: id,
  type: z.enum([
    "story_created",
    "story_moved",
    "story_updated",
    "story_deleted",
    "comment_added",
    "task_done",
    "sprint_started",
    "sprint_completed",
    "member_added",
    "member_removed",
    "repo_linked",
  ]),
  actorName: z.string(),
  storyId: nullable,
  detail: z.string(),
  time: z.string(),
  day: z.string(),
});
export const stateSchema = z.object({
  version: z.literal(2),
  currentUserId: id,
  users: z.array(user).min(1),
  projects: z.array(project),
  columns: z.array(column),
  sprints: z.array(sprint),
  stories: z.array(story),
  tasks: z.array(task),
  comments: z.array(comment),
  retros: z.array(retro),
  events: z.array(event),
});
export type LocalState = z.infer<typeof stateSchema>;
export type LocalProject = LocalState["projects"][number];
export const STORAGE_KEY = "tapiz-boards-oss-demo-v2";
export const nameOf = (user: Pick<UserDto, "firstName" | "lastName">) =>
  `${user.firstName} ${user.lastName}`;
export const newId = () => crypto.randomUUID();
export function validateState(input: unknown): LocalState {
  const data = stateSchema.parse(input);
  const all = [
    data.users,
    data.projects,
    data.columns,
    data.sprints,
    data.stories,
    data.tasks,
    data.comments,
    data.retros,
    data.events,
  ].flat();
  if (new Set(all.map((x) => x.id)).size !== all.length)
    throw new Error("Duplirani identifikatori u demo podacima.");
  const users = new Set(data.users.map((x) => x.id));
  const projects = new Map(data.projects.map((x) => [x.id, x]));
  const stories = new Map(data.stories.map((x) => [x.id, x]));
  const sprints = new Map(data.sprints.map((x) => [x.id, x]));
  const columns = new Map(data.columns.map((x) => [x.id, x]));
  const assert = (ok: unknown) => {
    if (!ok) throw new Error("Neispravne veze u demo podacima.");
  };
  assert(users.has(data.currentUserId));
  for (const p of data.projects) {
    assert(
      users.has(p.ownerId) &&
        p.memberIds.includes(p.ownerId) &&
        p.memberIds.every((x) => users.has(x)),
    );
    assert(new Set(p.memberIds).size === p.memberIds.length);
    assert(
      data.sprints.filter((x) => x.projectId === p.id && x.status === "active")
        .length <= 1,
    );
    assert(
      data.columns.filter((x) => x.projectId === p.id && x.isDone).length === 1,
    );
  }
  for (const c of data.columns) assert(projects.has(c.projectId));
  for (const s of data.sprints) assert(projects.has(s.projectId));
  for (const s of data.stories) {
    assert(projects.has(s.projectId) && users.has(s.authorId));
    assert(
      !s.assigneeId ||
        projects.get(s.projectId)!.memberIds.includes(s.assigneeId),
    );
    assert(!s.sprintId || sprints.get(s.sprintId)?.projectId === s.projectId);
    assert(!s.columnId || columns.get(s.columnId)?.projectId === s.projectId);
  }
  for (const t of data.tasks) assert(stories.has(t.storyId));
  for (const c of data.comments)
    assert(stories.has(c.storyId) && users.has(c.authorId));
  for (const r of data.retros)
    assert(sprints.has(r.sprintId) && users.has(r.authorId));
  for (const e of data.events) assert(projects.has(e.projectId));
  return data;
}
export function projectDto(p: LocalProject): ProjectDto {
  return {
    ...p,
    deletedAt: p.deletedAt ? new Date(p.deletedAt) : null,
    memberCount: p.memberIds.length,
  };
}
export function displayDate(value: string, time = false) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const day = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
  return time
    ? `${day} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
    : day;
}
export function storyDto(data: LocalState, s: StoryDto): StoryDto {
  const tasks = data.tasks.filter((t) => t.storyId === s.id);
  return {
    ...s,
    createdAt: displayDate(s.createdAt),
    authorName: nameOf(data.users.find((u) => u.id === s.authorId)!),
    assigneeName: s.assigneeId
      ? nameOf(data.users.find((u) => u.id === s.assigneeId)!)
      : null,
    sprintName: data.sprints.find((x) => x.id === s.sprintId)?.name ?? null,
    taskCount: tasks.length,
    tasksDone: tasks.filter((t) => t.done).length,
    commentCount: data.comments.filter((c) => c.storyId === s.id).length,
  };
}
export function sprintDto(data: LocalState, s: SprintDto): SprintDto {
  const stories = data.stories.filter((x) => x.sprintId === s.id);
  return {
    ...s,
    storyCount: stories.length,
    totalPoints: stories.reduce((sum, x) => sum + (x.storyPoints ?? 0), 0),
    retroCount: data.retros.filter((x) => x.sprintId === s.id).length,
  };
}
