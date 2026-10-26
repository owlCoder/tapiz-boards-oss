/** Browser implementations of the OSS action contracts. No server imports or requests. */
import { z } from "zod";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import {
  columnSchema,
  commentSchema,
  moveStorySchema,
  storyDetailsSchema,
  storySchema,
  storyTaskSchema,
} from "@/domain/validation/story.schema";
import {
  finishSprintSchema,
  retroItemSchema,
  sprintSchema,
  sprintStatusSchema,
} from "@/domain/validation/sprint.schema";
import {
  createProjectSchema,
  repoUrlSchema,
} from "@/domain/validation/project.schema";
import { updateProfileSchema } from "@/domain/validation/user.schema";
import type { ProjectEventType, StoryDto } from "@/domain/types";
import { getState, transaction } from "./store";
import { nameOf, newId, displayDate, type LocalState } from "./model";
import { navigate } from "./navigation";

function must<T>(value: T | null | undefined, message: string): T {
  if (value == null) throw new Error(message);
  return value;
}
function project(d: LocalState, pid: unknown) {
  return must(
    d.projects.find((x) => x.id === pid),
    "Projekat ne postoji",
  );
}
function story(d: LocalState, pid: unknown, sid: unknown) {
  project(d, pid);
  return must(
    d.stories.find((x) => x.id === sid && x.projectId === pid),
    "Kartica ne postoji",
  );
}
function sprint(d: LocalState, pid: unknown, sid: unknown) {
  project(d, pid);
  return must(
    d.sprints.find((x) => x.id === sid && x.projectId === pid),
    "Sprint ne postoji",
  );
}
function column(d: LocalState, pid: unknown, cid: unknown) {
  project(d, pid);
  return must(
    d.columns.find((x) => x.id === cid && x.projectId === pid),
    "Kolona ne postoji",
  );
}
function current(d: LocalState) {
  return must(
    d.users.find((x) => x.id === d.currentUserId),
    "Demo učesnik ne postoji",
  );
}
function dateDay(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function log(
  d: LocalState,
  pid: string,
  type: ProjectEventType,
  detail: string,
  storyId: string | null = null,
) {
  const now = new Date();
  d.events.push({
    id: newId(),
    projectId: pid,
    type,
    detail,
    storyId,
    actorName: nameOf(current(d)),
    day: dateDay(now),
    time: now.toLocaleTimeString("sr-Latn-RS", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
}
async function run<T>(fn: () => T): Promise<ActionResult<T>> {
  try {
    return ok(fn());
  } catch (error) {
    return fail(
      error instanceof z.ZodError
        ? error.issues[0].message
        : error instanceof Error
          ? error.message
          : "Izmena nije uspela",
    );
  }
}
async function write<T>(fn: (draft: LocalState) => T) {
  return run(() => transaction(fn));
}
const active = (d: LocalState, pid: string) =>
  d.sprints.find((x) => x.projectId === pid && x.status === "active");
function placement(
  d: LocalState,
  pid: string,
  col: string | null,
  sid: string | null,
  previousSprint?: string | null,
) {
  const running = active(d, pid);
  if (col && !sid)
    sid = must(running, "Pokrenite sprint pre dodavanja kartice na tablu").id;
  if (sid === running?.id && !col)
    col =
      d.columns
        .filter((x) => x.projectId === pid)
        .sort((a, b) => a.position - b.position)[0]?.id ?? null;
  if (col) column(d, pid, col);
  if (sid) {
    const target = sprint(d, pid, sid);
    if (target.status === "completed" && sid !== previousSprint)
      throw new Error("Kartica ne može u završen sprint");
  }
  return { columnId: col, sprintId: sid };
}
function nextPosition(d: LocalState, pid: string, col: string | null) {
  return (
    Math.max(
      -1,
      ...d.stories
        .filter((x) => x.projectId === pid && x.columnId === col)
        .map((x) => x.position),
    ) + 1
  );
}

export async function createProjectAction(input: unknown) {
  return write((d) => {
    const { name } = createProjectSchema.parse(input);
    const projectId = newId();
    d.projects.push({
      id: projectId,
      name,
      ownerId: d.currentUserId,
      memberIds: [d.currentUserId],
      deletedAt: null,
      publicToken: null,
      repoUrl: null,
    });
    ["TO DO", "IN PROGRESS", "DONE"].forEach((name, position) =>
      d.columns.push({
        id: newId(),
        projectId,
        name,
        position,
        isDone: position === 2,
        wipLimit: null,
      }),
    );
    return { projectId };
  });
}
export async function getMemberCandidatesAction(pid: unknown) {
  return run(() => {
    project(getState(), pid);
    return getState().users.filter((x) => x.isActive);
  });
}
export async function getProjectMembersAction(pid: unknown) {
  return run(() => {
    const d = getState();
    return project(d, pid).memberIds.map((id) => {
      const u = must(
        d.users.find((x) => x.id === id),
        "Član ne postoji",
      );
      return {
        userId: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
      };
    });
  });
}
export async function addProjectMemberAction(pid: unknown, uid: unknown) {
  return write((d) => {
    const p = project(d, pid);
    const u = must(
      d.users.find((x) => x.id === uid && x.isActive),
      "Član ne postoji",
    );
    if (p.memberIds.includes(u.id))
      throw new Error("Osoba je već član projekta");
    p.memberIds.push(u.id);
    log(d, p.id, "member_added", nameOf(u));
  });
}
export async function removeProjectMemberAction(pid: unknown, uid: unknown) {
  return write((d) => {
    const p = project(d, pid);
    if (p.ownerId === uid)
      throw new Error("Vlasnik projekta se ne može ukloniti");
    p.memberIds = p.memberIds.filter((x) => x !== uid);
    d.stories
      .filter((x) => x.projectId === pid && x.assigneeId === uid)
      .forEach((x) => {
        x.assigneeId = null;
      });
    log(
      d,
      p.id,
      "member_removed",
      nameOf(
        must(
          d.users.find((x) => x.id === uid),
          "Član ne postoji",
        ),
      ),
    );
  });
}
export async function softDeleteProjectAction(pid: unknown) {
  return write((d) => {
    project(d, pid).deletedAt = new Date().toISOString();
  });
}
export async function restoreProjectAction(pid: unknown) {
  return write((d) => {
    project(d, pid).deletedAt = null;
  });
}
export async function permanentDeleteProjectAction(pid: unknown) {
  return write((d) => {
    project(d, pid);
    const stories = new Set(
      d.stories.filter((x) => x.projectId === pid).map((x) => x.id),
    );
    const sprints = new Set(
      d.sprints.filter((x) => x.projectId === pid).map((x) => x.id),
    );
    d.projects = d.projects.filter((x) => x.id !== pid);
    d.columns = d.columns.filter((x) => x.projectId !== pid);
    d.sprints = d.sprints.filter((x) => x.projectId !== pid);
    d.stories = d.stories.filter((x) => x.projectId !== pid);
    d.events = d.events.filter((x) => x.projectId !== pid);
    d.tasks = d.tasks.filter((x) => !stories.has(x.storyId));
    d.comments = d.comments.filter((x) => !stories.has(x.storyId));
    d.retros = d.retros.filter((x) => !sprints.has(x.sprintId));
  });
}
export async function setProjectRepoAction(pid: unknown, input: unknown) {
  return write((d) => {
    const p = project(d, pid);
    p.repoUrl = repoUrlSchema.parse(input);
    log(d, p.id, "repo_linked", p.repoUrl);
  });
}
export async function clearProjectRepoAction(pid: unknown) {
  return write((d) => {
    project(d, pid).repoUrl = null;
  });
}
export async function enablePublicLinkAction(
  _pid: unknown,
): Promise<ActionResult<{ token: string }>> {
  void _pid;
  return fail(
    "Demo podaci su samo u ovom browseru. Za prenos koristite JSON izvoz; javni link zahteva deploy OSS aplikacije.",
  );
}
export async function disablePublicLinkAction(pid: unknown) {
  return write((d) => {
    project(d, pid).publicToken = null;
  });
}

export async function createStoryAction(
  pid: unknown,
  input: unknown,
  cid?: unknown,
  sid?: unknown,
) {
  return write((d) => {
    const p = project(d, pid);
    const parsed = storySchema.parse(input);
    const place = placement(
      d,
      p.id,
      cid == null ? null : z.string().parse(cid),
      sid == null ? null : z.string().parse(sid),
    );
    const s: StoryDto = {
      id: newId(),
      projectId: p.id,
      ...parsed,
      ...place,
      sprintName: null,
      position: nextPosition(d, p.id, place.columnId),
      authorId: d.currentUserId,
      authorName: nameOf(current(d)),
      assigneeId: null,
      assigneeName: null,
      storyPoints: null,
      priority: "medium",
      dueDate: null,
      commentCount: 0,
      taskCount: 0,
      tasksDone: 0,
      createdAt: new Date().toISOString(),
    };
    d.stories.push(s);
    log(d, p.id, "story_created", s.title, s.id);
  });
}
export async function updateStoryFullAction(
  pid: unknown,
  sid: unknown,
  input: unknown,
) {
  return write((d) => {
    const s = story(d, pid, sid);
    const parsed = storySchema.merge(storyDetailsSchema).parse(input);
    const p = project(d, pid);
    if (parsed.assigneeId && !p.memberIds.includes(parsed.assigneeId))
      throw new Error("Dodeljena osoba nije član projekta");
    const place = placement(
      d,
      p.id,
      parsed.columnId,
      parsed.sprintId,
      s.sprintId,
    );
    if (place.columnId !== s.columnId) {
      s.position = nextPosition(d, p.id, place.columnId);
      log(
        d,
        p.id,
        "story_moved",
        `${parsed.title} → ${d.columns.find((c) => c.id === place.columnId)?.name ?? "Backlog"}`,
        s.id,
      );
    }
    Object.assign(s, parsed, place);
    log(d, p.id, "story_updated", s.title, s.id);
  });
}
export async function deleteStoryAction(pid: unknown, sid: unknown) {
  return write((d) => {
    const s = story(d, pid, sid);
    d.stories = d.stories.filter((x) => x.id !== sid);
    d.tasks = d.tasks.filter((x) => x.storyId !== sid);
    d.comments = d.comments.filter((x) => x.storyId !== sid);
    log(d, s.projectId, "story_deleted", s.title);
  });
}
export async function moveStoryAction(pid: unknown, input: unknown) {
  return write((d) => {
    const parsed = moveStorySchema.parse(input);
    const s = story(d, pid, parsed.storyId);
    const running = active(d, s.projectId);
    if (parsed.toColumnId) {
      column(d, pid, parsed.toColumnId);
      must(running, "Pokrenite sprint pre prebacivanja na tablu");
    }
    const target = d.stories
      .filter(
        (x) =>
          x.projectId === pid &&
          x.id !== s.id &&
          (parsed.toColumnId
            ? x.columnId === parsed.toColumnId && x.sprintId === running!.id
            : !running || x.sprintId !== running.id || x.columnId === null),
      )
      .sort((a, b) => a.position - b.position);
    s.columnId = parsed.toColumnId;
    s.sprintId = parsed.toColumnId
      ? running!.id
      : s.sprintId === running?.id
        ? null
        : s.sprintId;
    target.splice(Math.min(parsed.toIndex, target.length), 0, s);
    target.forEach((x, i) => {
      x.position = i;
    });
    log(
      d,
      s.projectId,
      "story_moved",
      `${s.title} → ${d.columns.find((c) => c.id === s.columnId)?.name ?? "Backlog"}`,
      s.id,
    );
  });
}
export async function createColumnAction(pid: unknown, input: unknown) {
  return write((d) => {
    const p = project(d, pid);
    d.columns.push({
      id: newId(),
      projectId: p.id,
      name: columnSchema.parse(input).name,
      position:
        Math.max(
          -1,
          ...d.columns
            .filter((x) => x.projectId === pid)
            .map((x) => x.position),
        ) + 1,
      wipLimit: null,
      isDone: false,
    });
  });
}
export async function renameColumnAction(
  pid: unknown,
  cid: unknown,
  input: unknown,
) {
  return write((d) => {
    column(d, pid, cid).name = columnSchema.parse(input).name;
  });
}
export async function setColumnWipLimitAction(
  pid: unknown,
  cid: unknown,
  value: unknown,
) {
  return write((d) => {
    column(d, pid, cid).wipLimit =
      value == null || value === ""
        ? null
        : z.number().int().min(1).max(99).parse(Number(value));
  });
}
export async function setColumnDoneAction(
  pid: unknown,
  cid: unknown,
  value: unknown,
) {
  return write((d) => {
    const col = column(d, pid, cid);
    const done = z.boolean().parse(value);
    const columns = d.columns.filter((x) => x.projectId === pid);
    if (done)
      columns.forEach((x) => {
        x.isDone = x.id === col.id;
      });
    else if (col.isDone) {
      const replacement = columns
        .filter((x) => x.id !== cid)
        .sort((a, b) => b.position - a.position)[0];
      if (!replacement) throw new Error("Projekat mora imati završnu kolonu");
      col.isDone = false;
      replacement.isDone = true;
    }
  });
}
export async function deleteColumnAction(pid: unknown, cid: unknown) {
  return write((d) => {
    const col = column(d, pid, cid);
    const others = d.columns.filter((x) => x.projectId === pid && x.id !== cid);
    if (!others.length) throw new Error("Poslednja kolona se ne može obrisati");
    d.columns = d.columns.filter((x) => x.id !== cid);
    if (col.isDone)
      others.sort((a, b) => b.position - a.position)[0].isDone = true;
    d.stories
      .filter((x) => x.columnId === cid)
      .forEach((x) => {
        x.columnId = null;
        if (x.sprintId === active(d, x.projectId)?.id) x.sprintId = null;
      });
  });
}
export async function getStoryTasksAction(pid: unknown, sid: unknown) {
  return run(() => {
    story(getState(), pid, sid);
    return getState().tasks.filter((x) => x.storyId === sid);
  });
}
export async function addStoryTaskAction(
  pid: unknown,
  sid: unknown,
  input: unknown,
) {
  return write((d) => {
    const s = story(d, pid, sid);
    d.tasks.push({
      id: newId(),
      storyId: s.id,
      title: storyTaskSchema.parse(input).title,
      done: false,
    });
  });
}
export async function setStoryTaskDoneAction(
  pid: unknown,
  tid: unknown,
  done: unknown,
) {
  return write((d) => {
    const task = must(
      d.tasks.find((x) => x.id === tid),
      "Stavka ne postoji",
    );
    const s = story(d, pid, task.storyId);
    task.done = z.boolean().parse(done);
    if (task.done)
      log(d, s.projectId, "task_done", `${task.title} · ${s.title}`, s.id);
  });
}
export async function deleteStoryTaskAction(pid: unknown, tid: unknown) {
  return write((d) => {
    const task = must(
      d.tasks.find((x) => x.id === tid),
      "Stavka ne postoji",
    );
    story(d, pid, task.storyId);
    d.tasks = d.tasks.filter((x) => x.id !== tid);
  });
}
export async function getCommentsAction(pid: unknown, sid: unknown) {
  return run(() => {
    story(getState(), pid, sid);
    return getState()
      .comments.filter((x) => x.storyId === sid)
      .map((x) => ({
        ...x,
        createdAt: displayDate(x.createdAt, true),
        authorName: nameOf(
          must(
            getState().users.find((u) => u.id === x.authorId),
            "Član ne postoji",
          ),
        ),
      }));
  });
}
export async function addCommentAction(pid: unknown, input: unknown) {
  return write((d) => {
    const parsed = commentSchema.parse(input);
    const s = story(d, pid, parsed.storyId);
    d.comments.push({
      id: newId(),
      ...parsed,
      authorId: d.currentUserId,
      authorName: nameOf(current(d)),
      createdAt: new Date().toISOString(),
    });
    log(d, s.projectId, "comment_added", s.title, s.id);
  });
}
export async function deleteCommentAction(pid: unknown, cid: unknown) {
  return write((d) => {
    const c = must(
      d.comments.find((x) => x.id === cid),
      "Komentar ne postoji",
    );
    story(d, pid, c.storyId);
    d.comments = d.comments.filter((x) => x.id !== cid);
  });
}

export async function createSprintAction(pid: unknown, input: unknown) {
  return write((d) => {
    const p = project(d, pid);
    d.sprints.push({
      id: newId(),
      projectId: p.id,
      ...sprintSchema.parse(input),
      status: "planned",
      storyCount: 0,
      totalPoints: 0,
      retroCount: 0,
    });
  });
}
export async function setSprintStatusAction(
  pid: unknown,
  sid: unknown,
  value: unknown,
) {
  return write((d) => {
    const s = sprint(d, pid, sid);
    const status = sprintStatusSchema.parse(value);
    if (status !== "active")
      throw new Error(
        "Koristite završni tok ili poništavanje pokretanja sprinta",
      );
    if (s.status !== "planned")
      throw new Error("Nedozvoljena promena statusa sprinta");
    if (status === "active" && active(d, s.projectId))
      throw new Error("Projekat već ima aktivan sprint");
    s.status = status;
    if (status === "active") {
      const first = d.columns
        .filter((x) => x.projectId === pid)
        .sort((a, b) => a.position - b.position)[0];
      d.stories
        .filter((x) => x.sprintId === sid && !x.columnId)
        .forEach((x) => {
          x.columnId = first.id;
          x.position = nextPosition(d, s.projectId, first.id);
        });
    }
    log(
      d,
      s.projectId,
      status === "active" ? "sprint_started" : "sprint_completed",
      s.name,
    );
  });
}
export async function undoSprintStartAction(pid: unknown, sid: unknown) {
  return write((d) => {
    const s = sprint(d, pid, sid);
    if (s.status !== "active")
      throw new Error("Samo aktivan sprint može da se vrati u planirano");
    s.status = "planned";
  });
}
export async function finishSprintAction(
  pid: unknown,
  sid: unknown,
  input: unknown,
) {
  return write((d) => {
    const s = sprint(d, pid, sid);
    if (s.status !== "active")
      throw new Error("Može se završiti samo aktivan sprint");
    const { targetSprintId } = finishSprintSchema.parse(input);
    if (targetSprintId) {
      const target = sprint(d, pid, targetSprintId);
      if (target.id === sid || target.status === "completed")
        throw new Error("Neispravan ciljni sprint");
    }
    const done = d.columns.find((x) => x.projectId === pid && x.isDone)!;
    d.stories
      .filter((x) => x.sprintId === sid && x.columnId !== done.id)
      .forEach((x) => {
        x.sprintId = targetSprintId;
        if (!targetSprintId) x.columnId = null;
        x.position = nextPosition(d, s.projectId, null);
      });
    s.status = "completed";
    log(d, s.projectId, "sprint_completed", s.name);
  });
}
export async function deleteSprintAction(pid: unknown, sid: unknown) {
  return write((d) => {
    const removed = sprint(d, pid, sid);
    d.sprints = d.sprints.filter((x) => x.id !== sid);
    d.retros = d.retros.filter((x) => x.sprintId !== sid);
    d.stories
      .filter((x) => x.sprintId === sid)
      .forEach((x) => {
        x.sprintId = null;
        if (removed.status !== "completed") x.columnId = null;
      });
  });
}
export async function getSprintRetroAction(pid: unknown, sid: unknown) {
  return run(() => {
    sprint(getState(), pid, sid);
    return getState()
      .retros.filter((x) => x.sprintId === sid)
      .map((x) => ({ ...x, createdAt: displayDate(x.createdAt) }));
  });
}
export async function addSprintRetroItemAction(
  pid: unknown,
  sid: unknown,
  input: unknown,
) {
  return write((d) => {
    const s = sprint(d, pid, sid);
    if (s.status !== "completed")
      throw new Error("Retrospektiva se piše po završetku sprinta");
    d.retros.push({
      id: newId(),
      sprintId: s.id,
      ...retroItemSchema.parse(input),
      authorId: d.currentUserId,
      authorName: nameOf(current(d)),
      createdAt: new Date().toISOString(),
    });
  });
}
export async function deleteSprintRetroItemAction(pid: unknown, rid: unknown) {
  return write((d) => {
    const r = must(
      d.retros.find((x) => x.id === rid),
      "Stavka ne postoji",
    );
    sprint(d, pid, r.sprintId);
    d.retros = d.retros.filter((x) => x.id !== rid);
  });
}
export async function getProjectActivityAction(pid: unknown, day: unknown) {
  return run(() => {
    project(getState(), pid);
    return {
      events: getState()
        .events.filter((x) => x.projectId === pid && x.day === day)
        .sort((a, b) => b.time.localeCompare(a.time)),
      dueStories: getState()
        .stories.filter((x) => x.projectId === pid && x.dueDate === day)
        .map((x) => x.title),
    };
  });
}
export async function getActivityDaysAction(
  pid: unknown,
  from: unknown,
  to: unknown,
) {
  return run(() => {
    project(getState(), pid);
    const counts = new Map<string, number>();
    getState()
      .events.filter(
        (x) =>
          x.projectId === pid && x.day >= String(from) && x.day <= String(to),
      )
      .forEach((x) => counts.set(x.day, (counts.get(x.day) ?? 0) + 1));
    return [...counts].map(([day, count]) => ({ day, count }));
  });
}
export async function updateMyProfileAction(input: unknown) {
  return write((d) => {
    Object.assign(current(d), updateProfileSchema.parse(input));
    return null;
  });
}
export async function changeMyPasswordAction(
  _input: unknown,
): Promise<ActionResult<null>> {
  void _input;
  return fail("Ovaj demo nema naloge ni lozinke.");
}
export async function logoutAction() {
  navigate("/");
}
