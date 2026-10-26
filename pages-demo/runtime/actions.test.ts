import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { readFile } from "node:fs/promises";
import { createSeed } from "./seed";
import { getState, replaceState, resetDemo, transaction } from "./store";
import { STORAGE_KEY, validateState, storyDto } from "./model";
import * as actions from "./actions";

const memory = new Map<string, string>();
let storageFails = false;
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (storageFails) throw new Error("QuotaExceededError");
      memory.set(key, value);
    },
    removeItem: (key: string) => memory.delete(key),
  },
  configurable: true,
});
beforeEach(() => {
  storageFails = false;
  resetDemo();
});

test("realistic fixtures match OSS DTOs and survive JSON round trip", () => {
  const seed = createSeed(new Date("2026-10-26T12:00:00Z"));
  validateState(JSON.parse(JSON.stringify(seed)));
  assert.equal(seed.projects.filter((x) => !x.deletedAt).length, 2);
  assert.equal(seed.users.length, 6);
  assert.equal(seed.stories.length, 18);
  assert.ok(seed.comments.length);
  assert.ok(seed.retros.length);
  assert.equal(
    seed.sprints.find((x) => x.id === "c-sprint-1")!.startDate,
    "2026-10-19",
  );
  const decorated = storyDto(seed, seed.stories[0]);
  assert.equal(decorated.taskCount, 3);
  assert.equal(decorated.tasksDone, 1);
  assert.equal(decorated.commentCount, 2);
});
test("project creation seeds exactly one Done column; members are assignable; trash restore preserves data", async () => {
  const result = await actions.createProjectAction({
    name: "Vežba integracije",
  });
  assert.ok(result.ok);
  if (!result.ok) return;
  const pid = result.data.projectId;
  assert.equal(
    getState().columns.filter((x) => x.projectId === pid && x.isDone).length,
    1,
  );
  assert.ok((await actions.addProjectMemberAction(pid, "marko")).ok);
  assert.equal((await actions.addProjectMemberAction(pid, "marko")).ok, false);
  assert.equal((await actions.removeProjectMemberAction(pid, "ana")).ok, false);
  await actions.softDeleteProjectAction(pid);
  assert.ok(getState().projects.find((x) => x.id === pid)!.deletedAt);
  await actions.restoreProjectAction(pid);
  assert.equal(getState().projects.find((x) => x.id === pid)!.deletedAt, null);
});
test("story create/edit/move, validation and visible ordering persist", async () => {
  assert.ok(
    (
      await actions.createStoryAction(
        "campus",
        { title: "Nova kartica", description: "Kriterijumi prihvatanja" },
        "c-col-0",
        "c-sprint-1",
      )
    ).ok,
  );
  const s = getState().stories.at(-1)!;
  assert.ok(
    (
      await actions.updateStoryFullAction("campus", s.id, {
        title: "Izmenjena kartica",
        description: "Opis",
        assigneeId: "ana",
        priority: "high",
        storyPoints: 8,
        dueDate: "2026-11-01",
        columnId: "c-col-1",
        sprintId: "c-sprint-1",
      })
    ).ok,
  );
  const before = JSON.stringify(getState());
  assert.equal(
    (
      await actions.updateStoryFullAction("campus", s.id, {
        title: "Ne sme ostati",
        assigneeId: "jelena",
        columnId: "c-col-1",
        sprintId: "c-sprint-1",
      })
    ).ok,
    false,
  );
  assert.equal(JSON.stringify(getState()), before);
  assert.ok(
    (
      await actions.moveStoryAction("campus", {
        storyId: s.id,
        toColumnId: "c-col-0",
        toIndex: 0,
      })
    ).ok,
  );
  const updated = getState().stories.find((x) => x.id === s.id)!;
  assert.equal(updated.position, 0);
  assert.equal(updated.columnId, "c-col-0");
  assert.equal(
    JSON.parse(memory.get(STORAGE_KEY)!).stories.find(
      (x: { id: string }) => x.id === s.id,
    ).title,
    "Izmenjena kartica",
  );
  assert.equal(
    (
      await actions.moveStoryAction("biblioteka", {
        storyId: s.id,
        toColumnId: "b-col-0",
        toIndex: 0,
      })
    ).ok,
    false,
  );
});
test("checklists and comments update the real card counters, then cascade on deletion", async () => {
  const sid = "c-story-4";
  await actions.addStoryTaskAction("campus", sid, {
    title: "Proveriti prikaz",
  });
  const task = getState().tasks.at(-1)!;
  await actions.setStoryTaskDoneAction("campus", task.id, true);
  await actions.addCommentAction("campus", {
    storyId: sid,
    body: "Provera je završena.",
  });
  const s = storyDto(
    getState(),
    getState().stories.find((x) => x.id === sid)!,
  );
  assert.equal(s.tasksDone, 1);
  assert.equal(s.commentCount, 1);
  await actions.deleteStoryAction("campus", sid);
  assert.equal(
    getState().tasks.some((x) => x.storyId === sid),
    false,
  );
  assert.equal(
    getState().comments.some((x) => x.storyId === sid),
    false,
  );
});
test("sprint lifecycle: single active sprint, undo, carryover retaining column, completed history and retro", async () => {
  assert.equal(
    (await actions.setSprintStatusAction("campus", "c-sprint-2", "active")).ok,
    false,
  );
  const originalColumn = getState().stories.find(
    (x) => x.id === "c-story-1",
  )!.columnId;
  await actions.undoSprintStartAction("campus", "c-sprint-1");
  assert.equal(
    getState().stories.find((x) => x.id === "c-story-1")!.columnId,
    originalColumn,
  );
  await actions.setSprintStatusAction("campus", "c-sprint-1", "active");
  assert.ok(
    (
      await actions.finishSprintAction("campus", "c-sprint-1", {
        targetSprintId: "c-sprint-2",
      })
    ).ok,
  );
  assert.equal(
    getState().stories.find((x) => x.id === "c-story-1")!.sprintId,
    "c-sprint-2",
  );
  assert.equal(
    getState().stories.find((x) => x.id === "c-story-1")!.columnId,
    originalColumn,
  );
  assert.equal(
    getState().stories.find((x) => x.id === "c-story-5")!.sprintId,
    "c-sprint-1",
  );
  assert.equal(
    (await actions.undoSprintStartAction("campus", "c-sprint-1")).ok,
    false,
  );
  assert.ok(
    (
      await actions.addSprintRetroItemAction("campus", "c-sprint-1", {
        category: "good",
        body: "Dobar pregled table.",
      })
    ).ok,
  );
  assert.ok(
    (await actions.setSprintStatusAction("campus", "c-sprint-2", "active")).ok,
  );
  assert.equal(
    getState().stories.find((x) => x.id === "c-story-7")!.columnId,
    "c-col-0",
  );
});
test("finish to backlog clears column and removes unfinished cards from the completed sprint", async () => {
  await actions.finishSprintAction("campus", "c-sprint-1", {
    targetSprintId: null,
  });
  const s = getState().stories.find((x) => x.id === "c-story-1")!;
  assert.equal(s.columnId, null);
  assert.equal(s.sprintId, null);
});
test("removing a member clears assignments; deleting a Done column preserves one replacement", async () => {
  await actions.removeProjectMemberAction("campus", "marko");
  assert.equal(
    getState()
      .stories.filter((x) => x.projectId === "campus")
      .some((x) => x.assigneeId === "marko"),
    false,
  );
  await actions.deleteColumnAction("campus", "c-col-2");
  assert.equal(
    getState().columns.filter((x) => x.projectId === "campus" && x.isDone)
      .length,
    1,
  );
  validateState(getState());
});
test("JSON import validates references and duplicate IDs before touching existing data", () => {
  const before = JSON.stringify(getState());
  const invalid = structuredClone(getState());
  invalid.stories[0].columnId = "foreign-column";
  assert.throws(() => replaceState(invalid));
  assert.equal(JSON.stringify(getState()), before);
  const duplicate = structuredClone(getState());
  duplicate.users.push(duplicate.users[0]);
  assert.throws(() => validateState(duplicate));
  const saved = JSON.parse(memory.get(STORAGE_KEY)!);
  resetDemo();
  replaceState(saved);
  assert.deepEqual(getState(), saved);
});
test("storage failure rejects changes atomically instead of claiming they were saved", async () => {
  const before = JSON.stringify(getState());
  storageFails = true;
  assert.equal(
    (await actions.createProjectAction({ name: "Ne sme biti izgubljeno" })).ok,
    false,
  );
  assert.equal(JSON.stringify(getState()), before);
  storageFails = false;
});
test("permanent project deletion cascades through every local collection", async () => {
  await actions.permanentDeleteProjectAction("campus");
  validateState(getState());
  assert.equal(
    getState().stories.some((x) => x.projectId === "campus"),
    false,
  );
  assert.equal(
    getState().events.some((x) => x.projectId === "campus"),
    false,
  );
});
test("compiled demo contains actual OSS views and no database/auth/server action implementation", async () => {
  const meta = JSON.parse(
    await readFile("dist-pages/build-meta.json", "utf8"),
  ) as { inputs: string[] };
  for (const component of [
    "BoardView",
    "BacklogView",
    "SprintsView",
    "StoryCard",
    "StoryDetailPanel",
    "AppShellLayout",
    "AppSidebar",
    "Dashboard",
  ])
    assert.ok(
      meta.inputs.some((x) => x.endsWith(`/${component}.tsx`)),
      component,
    );
  assert.equal(
    meta.inputs.some((x) =>
      /src\/(infrastructure|application)\/|src\/lib\/(actions|auth|guards)/.test(
        x,
      ),
    ),
    false,
  );
});
// Exercise a general transaction too: participant switching never authenticates anyone.
test("participant switching changes only the local identity", () => {
  transaction((d) => {
    d.currentUserId = "marko";
  });
  assert.equal(getState().currentUserId, "marko");
});

test("fixture wording upgrades preserve the learner's workspace and are idempotent", async () => {
  const { upgradeStoryCopy } = await import("./upgrade-story-copy");
  const { LEGACY_STORY_COPY } = await import("./legacy-story-copy");
  const legacy = createSeed();
  legacy.stories.forEach((story) =>
    Object.assign(
      story,
      LEGACY_STORY_COPY[story.id as keyof typeof LEGACY_STORY_COPY],
    ),
  );
  legacy.stories[0].position = 42;
  legacy.stories[0].columnId = "c-col-2";
  legacy.stories[0].assigneeId = "ana";
  legacy.tasks[1].done = true;
  const before = structuredClone(legacy);
  const updated = upgradeStoryCopy(legacy);
  assert.equal(
    updated.stories[0].description,
    createSeed().stories[0].description,
  );
  assert.equal(updated.stories[0].position, 42);
  assert.equal(updated.stories[0].columnId, "c-col-2");
  assert.equal(updated.stories[0].assigneeId, "ana");
  assert.deepEqual(updated.tasks, before.tasks);
  assert.deepEqual(updated.comments, before.comments);
  assert.deepEqual(updated.sprints, before.sprints);
  assert.deepEqual(legacy, before);
  assert.equal(upgradeStoryCopy(updated), updated);
});

test("fixture wording upgrades do not overwrite edited stories or resurrect deleted ones", async () => {
  const { upgradeStoryCopy } = await import("./upgrade-story-copy");
  const { LEGACY_STORY_COPY } = await import("./legacy-story-copy");
  const legacy = createSeed();
  legacy.stories.forEach((story) =>
    Object.assign(
      story,
      LEGACY_STORY_COPY[story.id as keyof typeof LEGACY_STORY_COPY],
    ),
  );
  legacy.stories[0].title = "Moj prilagođeni naslov";
  legacy.stories[1].description =
    "Ja kao student hoću da promenim svoj termin, kako bih uskladio obaveze.";
  const edited = structuredClone(legacy.stories.slice(0, 2));
  legacy.stories = legacy.stories.filter((story) => story.id !== "c-story-3");
  const updated = upgradeStoryCopy(legacy);
  assert.deepEqual(updated.stories.slice(0, 2), edited);
  assert.equal(
    updated.stories.some((story) => story.id === "c-story-3"),
    false,
  );
  assert.equal(updated.stories.length, legacy.stories.length);
});
