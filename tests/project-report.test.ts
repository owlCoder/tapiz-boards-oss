import assert from "node:assert/strict";
import test from "node:test";
import { buildProjectReport } from "../src/domain/services/project-report";
import type { ProjectExportData, ProjectExportStory } from "../src/domain/types/project-export.types";

function sampleStory(
  id: string,
  sprintId: string | null,
  columnId: string | null,
  points: number | null,
  hours: number | null,
): ProjectExportStory {
  return {
    id, projectId: "project", sprintId, sprintName: null, columnId, columnName: null,
    title: id, description: null, position: 0,
    authorId: null, authorName: "Author", authorEmail: "author@example.test",
    assigneeId: null, assigneeName: null, assigneeEmail: null,
    storyPoints: points, estimatedHours: hours, priority: "medium", dueDate: null,
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function fixture(): ProjectExportData {
  return {
    formatVersion: 1,
    exportedAt: "2026-11-16T10:00:00.000Z",
    project: {
      id: "project", name: "Demo", ownerId: "owner",
      ownerName: "Owner", ownerEmail: "owner@example.test",
      githubRepo: null, createdAt: "2026-01-01T00:00:00.000Z",
    },
    members: [
      {
        userId: "owner", firstName: "Test", lastName: "Owner",
        email: "owner@example.test", weeklyCapacityHours: 20,
        joinedAt: "2026-01-01T00:00:00.000Z", isOwner: true,
      },
    ],
    columns: [
      { id: "todo", projectId: "project", name: "To do", isDone: false, position: 0, wipLimit: null },
      { id: "done", projectId: "project", name: "Done", isDone: true, position: 1, wipLimit: null },
    ],
    sprints: [
      {
        id: "later", projectId: "project", name: "Second sprint",
        goal: "Ship", startDate: "2026-02-01", endDate: "2026-02-14",
        status: "active", createdAt: "2026-02-01T00:00:00.000Z",
        storyCount: 99, totalPoints: 999,
      },
      {
        id: "earlier", projectId: "project", name: "First sprint",
        goal: null, startDate: "2026-01-01", endDate: "2026-01-14",
        status: "completed", createdAt: "2026-01-01T00:00:00.000Z",
        storyCount: 99, totalPoints: 999,
      },
    ],
    stories: [
      sampleStory("done-in-first", "earlier", "done", 3, 5),
      sampleStory("todo-in-first", "earlier", "todo", 2, 8),
      sampleStory("done-in-second", "later", "done", 1, 2),
      sampleStory("backlog", null, null, null, null),
    ],
    tasks: [
      { id: "task-a", storyId: "done-in-first", title: "A", done: true, position: 0, createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "task-b", storyId: "done-in-first", title: "B", done: false, position: 1, createdAt: "2026-01-01T00:00:00.000Z" },
    ],
    comments: [
      { id: "c1", storyId: "done-in-first", authorId: null, authorName: "Author", authorEmail: "author@example.test", body: "Done", createdAt: "2026-01-02T00:00:00.000Z" },
    ],
    retrospectives: [
      { id: "retro1", sprintId: "earlier", category: "good", body: "Great", authorId: null, authorName: "Author", authorEmail: "author@example.test", createdAt: "2026-01-14T00:00:00.000Z" },
    ],
    activities: [],
  };
}

test("report includes all sprints in chronological order and backlog exactly once", () => {
  const report = buildProjectReport(fixture());
  assert.deepEqual(report.groups.map((group) => group.sprint?.id), ["earlier", "later"]);
  assert.deepEqual(report.groups[0].stories.map((item) => item.story.id), ["done-in-first", "todo-in-first"]);
  assert.equal(report.groups[1].stories[0].story.id, "done-in-second");
  assert.deepEqual(report.backlog.stories.map((item) => item.story.id), ["backlog"]);
  assert.equal(report.totals.stories, 4);
  assert.equal(report.totals.sprints, 2);
  assert.equal(report.totals.completedSprints, 1);
});

test("report uses live stories, not stale sprint count snapshots", () => {
  const report = buildProjectReport(fixture());
  assert.equal(report.groups[0].totals.stories, 2);
  assert.equal(report.groups[0].totals.done, 1);
  assert.equal(report.groups[0].totals.storyPoints, 5);
  assert.equal(report.groups[0].totals.donePoints, 3);
  assert.equal(report.totals.done, 2);
  assert.equal(report.totals.storyPoints, 6);
  assert.equal(report.totals.donePoints, 4);
  assert.equal(report.totals.estimatedHours, 15);
  assert.equal(report.totals.checklistItems, 2);
  assert.equal(report.totals.checklistDone, 1);
  assert.equal(report.totals.comments, 1);
  assert.equal(report.totals.retrospectives, 1);
  assert.equal(report.groups[0].retrospectives[0].body, "Great");
});

test("report stays readable for a project without sprints, stories or columns", () => {
  const data = fixture();
  data.sprints = [];
  data.stories = [];
  data.columns = [];
  data.tasks = [];
  data.comments = [];
  data.retrospectives = [];
  const report = buildProjectReport(data);
  assert.equal(report.groups.length, 0);
  assert.equal(report.backlog.totals.stories, 0);
  assert.equal(report.totals.done, 0);
  assert.equal(report.totals.estimatedHours, 0);
});

test("report can use the final column as Done for legacy projects", () => {
  const data = fixture();
  data.columns[1].isDone = false;
  const report = buildProjectReport(data);
  assert.equal(report.totals.done, 2);
});
