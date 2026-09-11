import type { ProjectEventType } from "@/domain/types";
import { eventsRepo } from "@/infrastructure/repositories/events.repo";

/** Project activity log is kept for ~6 months (the calendar lists it backwards). */
const RETENTION_DAYS = 180;

export const eventsService = {
  /** Writing to the activity log must never fail the calling action — errors are only logged. */
  async log(
    projectId: string,
    actorId: string,
    type: ProjectEventType,
    detail: string,
    storyId: string | null = null,
  ): Promise<void> {
    try {
      await eventsRepo.add(projectId, actorId, type, detail.slice(0, 500), storyId);
    } catch (err) {
      console.error("project_events upis nije uspeo:", err);
    }
  },

  /** Calendar content for the selected day: events + story due dates. */
  async activityForDay(projectId: string, dayIso: string) {
    const [events, dueStories] = await Promise.all([
      eventsRepo.listByDay(projectId, dayIso),
      eventsRepo.dueStoriesByDay(projectId, dayIso),
    ]);
    return { events, dueStories };
  },

  activityDays: (projectId: string, fromIso: string, toIso: string) =>
    eventsRepo.daysInRange(projectId, fromIso, toIso),

  /** Retention (called by the external cron): deletes activity older than RETENTION_DAYS. */
  async applyRetention(): Promise<number> {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    return eventsRepo.deleteOlderThan(cutoff);
  },
};
