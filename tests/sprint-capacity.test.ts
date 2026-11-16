import assert from "node:assert/strict";
import test from "node:test";
import {
  formatHours,
  inclusiveSprintDays,
  memberLoads,
  sprintCapacityHours,
  suggestSprintAssignments,
  type CapacityMemberInput,
  type CapacityStoryInput,
} from "../src/domain/services/sprint-capacity";

const sprint = { startDate: "2026-11-02", endDate: "2026-11-15" };

function member(userId: string, weeklyCapacityHours: number | null): CapacityMemberInput {
  return { userId, firstName: userId, lastName: "Member", weeklyCapacityHours };
}

function story(partial: Partial<CapacityStoryInput> & Pick<CapacityStoryInput, "id">): CapacityStoryInput {
  return {
    title: partial.id,
    assigneeId: null,
    estimatedHours: null,
    columnId: "todo",
    ...partial,
  };
}

test("sprint length counts inclusive days and scales weekly capacity", () => {
  assert.equal(inclusiveSprintDays("2026-11-02", "2026-11-08"), 7);
  assert.equal(sprintCapacityHours(20, "2026-11-02", "2026-11-08"), 20);
  assert.equal(inclusiveSprintDays(sprint.startDate, sprint.endDate), 14);
  assert.equal(sprintCapacityHours(20, sprint.startDate, sprint.endDate), 40);
  assert.equal(formatHours(sprintCapacityHours(20, "2026-11-02", "2026-11-11")), "28.6");
});

test("member load sums assigned estimates and flags overload", () => {
  const loads = memberLoads(
    [member("ana", 20), member("boris", null)],
    [
      story({ id: "a", assigneeId: "ana", estimatedHours: 25 }),
      story({ id: "b", assigneeId: "ana", estimatedHours: null }),
      story({ id: "c", assigneeId: "boris", estimatedHours: 8 }),
      story({ id: "d", assigneeId: null, estimatedHours: 4 }),
    ],
    { startDate: "2026-11-02", endDate: "2026-11-08" },
  );

  const ana = loads.find((load) => load.userId === "ana");
  const boris = loads.find((load) => load.userId === "boris");
  assert.ok(ana);
  assert.equal(ana.assignedHours, 25);
  assert.equal(ana.unestimatedCount, 1);
  assert.equal(ana.sprintCapacityHours, 20);
  assert.equal(ana.freeHours, -5);
  assert.equal(ana.overloaded, true);
  assert.ok(boris);
  assert.equal(boris.sprintCapacityHours, null);
  assert.equal(boris.overloaded, false);
  assert.equal(boris.assignedHours, 8);
});

test("suggestions fill the tightest remaining capacity and skip done or unestimated stories", () => {
  const loads = memberLoads(
    [member("ana", 20), member("boris", 10)],
    [
      story({ id: "taken", assigneeId: "ana", estimatedHours: 5, columnId: "todo" }),
    ],
    { startDate: "2026-11-02", endDate: "2026-11-08" },
  );
  const plan = suggestSprintAssignments(
    loads,
    [
      story({ id: "taken", assigneeId: "ana", estimatedHours: 5 }),
      story({ id: "big", estimatedHours: 12, columnId: "todo" }),
      story({ id: "small", estimatedHours: 8, columnId: "todo" }),
      story({ id: "mystery", estimatedHours: null, columnId: "todo" }),
      story({ id: "finished", estimatedHours: 3, columnId: "done" }),
      story({ id: "overflow", estimatedHours: 30, columnId: "todo" }),
    ],
    "done",
  );

  assert.deepEqual(
    plan.suggestions.map((item) => [item.storyId, item.userId, item.freeHoursAfter]),
    [
      ["big", "ana", 3],
      ["small", "boris", 2],
    ],
  );
  assert.deepEqual(
    plan.unplaced.map((item) => [item.storyId, item.reason]),
    [
      ["mystery", "no_estimate"],
      ["overflow", "no_capacity"],
    ],
  );
  assert.equal(plan.missingCapacity, false);
  assert.deepEqual(plan.stillOverloaded, []);
});

test("moves five hours off Ana onto Vesna without pushing Vesna over", () => {
  const week = { startDate: "2026-11-02", endDate: "2026-11-08" };
  const loads = memberLoads(
    [member("ana", 20), member("vesna", 15)],
    [
      story({ id: "ana-main", assigneeId: "ana", estimatedHours: 20 }),
      story({ id: "extra", title: "Extra", assigneeId: "ana", estimatedHours: 5 }),
      story({ id: "vesna-main", assigneeId: "vesna", estimatedHours: 10 }),
    ],
    week,
  );
  const plan = suggestSprintAssignments(
    loads,
    [
      story({ id: "ana-main", assigneeId: "ana", estimatedHours: 20 }),
      story({ id: "extra", title: "Extra", assigneeId: "ana", estimatedHours: 5 }),
      story({ id: "vesna-main", assigneeId: "vesna", estimatedHours: 10 }),
    ],
    "done",
  );

  assert.deepEqual(
    plan.suggestions.map((item) => [
      item.storyId,
      item.fromUserId,
      item.userId,
      item.fromAssignedHoursAfter,
      item.assignedHoursAfter,
    ]),
    [["extra", "ana", "vesna", 20, 15]],
  );
  assert.deepEqual(plan.stillOverloaded, []);
});

test("leaves Ana over when Vesna has no room for the story", () => {
  const week = { startDate: "2026-11-02", endDate: "2026-11-08" };
  const stories = [
    story({ id: "kept", assigneeId: "ana", estimatedHours: 17 }),
    story({ id: "heavy", title: "Heavy", assigneeId: "ana", estimatedHours: 8 }),
    story({ id: "vesna-main", assigneeId: "vesna", estimatedHours: 10 }),
  ];
  const loads = memberLoads([member("ana", 20), member("vesna", 15)], stories, week);
  const plan = suggestSprintAssignments(loads, stories, null);

  assert.deepEqual(plan.suggestions, []);
  assert.equal(plan.stillOverloaded[0]?.userId, "ana");
  assert.equal(plan.stillOverloaded[0]?.overHours, 5);
  assert.deepEqual(
    plan.unplaced.map((item) => item.storyId).sort(),
    ["heavy", "kept"],
  );
});

test("moves the five hour story and leaves the larger one with Ana", () => {
  const week = { startDate: "2026-11-02", endDate: "2026-11-08" };
  const stories = [
    story({ id: "base", assigneeId: "ana", estimatedHours: 12 }),
    story({ id: "extra", assigneeId: "ana", estimatedHours: 5 }),
    story({ id: "big", assigneeId: "ana", estimatedHours: 8 }),
    story({ id: "vesna-main", assigneeId: "vesna", estimatedHours: 0 }),
  ];
  const loads = memberLoads([member("ana", 20), member("vesna", 30)], stories, week);
  const plan = suggestSprintAssignments(loads, stories, "done");

  assert.deepEqual(
    plan.suggestions.map((item) => [item.storyId, item.userId, item.fromAssignedHoursAfter, item.assignedHoursAfter]),
    [["extra", "vesna", 20, 5]],
  );
});

test("does not move a finished story off an overloaded member", () => {
  const week = { startDate: "2026-11-02", endDate: "2026-11-08" };
  const stories = [
    story({ id: "done-extra", assigneeId: "ana", estimatedHours: 25, columnId: "done" }),
    story({ id: "vesna-main", assigneeId: "vesna", estimatedHours: 10 }),
  ];
  const loads = memberLoads([member("ana", 20), member("vesna", 15)], stories, week);
  const plan = suggestSprintAssignments(loads, stories, "done");

  assert.deepEqual(plan.suggestions, []);
  assert.equal(plan.stillOverloaded[0]?.userId, "ana");
  assert.equal(plan.stillOverloaded[0]?.overHours, 5);
  assert.deepEqual(plan.unplaced, []);
});

test("says capacity is missing when nobody has weekly hours", () => {
  const week = { startDate: "2026-11-02", endDate: "2026-11-08" };
  const stories = [story({ id: "open", estimatedHours: 5 })];
  const loads = memberLoads([member("ana", null), member("vesna", null)], stories, week);
  const plan = suggestSprintAssignments(loads, stories, null);

  assert.equal(plan.missingCapacity, true);
  assert.deepEqual(plan.suggestions, []);
  assert.deepEqual(plan.unplaced.map((item) => item.reason), ["no_capacity"]);
});
