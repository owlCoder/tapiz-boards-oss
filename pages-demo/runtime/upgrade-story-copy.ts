import { LEGACY_STORY_COPY } from "./legacy-story-copy";
import { createSeed } from "./seed";
import type { LocalState } from "./model";

/** Upgrade untouched examples without resetting the learner's local workspace. */
export function upgradeStoryCopy(data: LocalState): LocalState {
  const latest = new Map(
    createSeed().stories.map((story) => [story.id, story]),
  );
  let changed = false;
  const stories = data.stories.map((story) => {
    const original =
      LEGACY_STORY_COPY[story.id as keyof typeof LEGACY_STORY_COPY];
    const replacement = latest.get(story.id);
    // Title and description form one authored unit. Preserve either edited field.
    if (
      !original ||
      !replacement ||
      story.projectId !== original.projectId ||
      story.title !== original.title ||
      story.description !== original.description
    )
      return story;
    changed = true;
    return {
      ...story,
      title: replacement.title,
      description: replacement.description,
    };
  });
  return changed ? { ...data, stories } : data;
}
