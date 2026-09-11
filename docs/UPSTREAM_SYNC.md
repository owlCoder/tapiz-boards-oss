# Syncing bug fixes from the original repo

`tapiz-boards-oss` was created from a snapshot of the original (private, hosted) `tapiz-boards` repository, with a fresh git history — the full commit history was intentionally not carried over. The two repos are otherwise independent: separate databases, separate deployments, no shared runtime dependency.

The board/story/sprint/comment core was kept as structurally close to the original as possible specifically so that future bug fixes in that shared core can be cherry-picked across, in either direction. This document describes that workflow.

## One-time setup (maintainers only)

Add the original repository as a local, never-pushed remote:

```bash
git remote add upstream /path/to/tapiz-boards
git fetch upstream
```

`upstream` is for fetching only — never push to it from this repo, and never push this repo's history into it.

## Cherry-picking a fix from the original repo into this one

1. Find the fix commit in the original repo (`git log upstream/main -- <path>` or similar).
2. From this repo, on a feature branch:
   ```bash
   git cherry-pick <sha>
   ```
3. Conflicts are expected wherever the rename pass touched a file — the most common ones are pure renames, resolved with this token map:

   | Original | This repo |
   | --- | --- |
   | `teams` / `Team` / `team` | `projects` / `Project` / `project` |
   | `teamId` | `projectId` |
   | `teamMembers` | `projectMembers` |
   | `teamEvents` | `projectEvents` |
   | `teamsRepo` / `teamsService` | `projectsRepo` / `projectsService` |
   | `requireTeamManager` / `isTeamManager` | `requireProjectManager` / `isProjectManager` |

   If the conflict is a pure rename with no logic change, apply the fix's intent using the renamed identifiers and drop the original names. If the fix touches subject/QA/grading/LMS-SSO code that doesn't exist here, it likely isn't applicable to this edition — evaluate case by case rather than forcing it in.
4. Run the full check suite before merging:
   ```bash
   npm run lint && npm run typecheck && npm run build && npm run smoke
   ```

## Porting a fix the other direction

The same token map applies in reverse. A fix written here against `Project`/`projectId` needs `Team`/`teamId` (and reintroduction of any subject-scoping the original still has) to apply cleanly upstream.
