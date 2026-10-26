# Tapiz Boards — classroom demo (no login, no database)

This branch is a **browser-only teaching sandbox**. It is deliberately separate from the production/self-hosted Auth.js + MySQL application.

## Start in under a minute

The published classroom demo is available at **https://owlcoder.github.io/tapiz-boards-oss/**.
Pushes to `demo/browser-only-no-auth` build the standalone browser bundle and deploy it directly through GitHub Pages Actions.
Repository Pages must use **GitHub Actions** as its source, and the `github-pages` environment must allow deployments from `demo/browser-only-no-auth`.

For local development:

Prerequisites: Node.js 20+ and npm. **No MySQL, Docker, `.env`, Auth.js secrets or accounts are required for the demo.**

```bash
git switch demo/browser-only-no-auth
npm install
npm run dev
```

Visit **http://localhost:3004**. The home page redirects to **/demo**; no sign-in is shown.

> This is a locally rendered single-user demo. Your Next.js development server still serves the page, but **all demo records are managed in the browser**, not by server actions or database endpoints.

## What to demonstrate

1. The seeded **Studentski projekat** includes a running sprint, several cards in three columns, a planned sprint and a backlog.
2. Drag and drop cards between board columns. Open cards to update their title, description, priority, assignee, story points, due date, checklist and comments.
3. Open **Backlog** to manage unplanned/planned cards and assign cards to an active sprint.
4. Open **Sprintovi** to create a sprint, edit it, start it, undo its start, finish it and add retrospective notes after completion.
5. Create projects, add/reorder/rename columns, manage fake team members, view **Moj rad**, deadline **Kalendar**, **Statistika**, **Aktivnosti**, project settings and **Korpa** (restore/permanent deletion).
6. Export the demo to JSON, import a saved demo, or **Resetuj demo** to restore the original classroom fixtures.

## Data persistence and limitations

- Local data is stored under the key `tapiz-boards-browser-demo-v1` in this browser's `localStorage`; no database connection, login, user account or external API is involved.
- Reloading the same browser tab retains changes. Opening the app from a different browser, private window, machine or device creates a separate sandbox.
- **Export/import JSON** is the portable backup/move mechanism. Browser storage may be cleared by the browser or disabled by private browsing.
- Members and assignees are **simulated names**, not registered accounts. There is no permission enforcement, password reset, cross-device realtime collaboration, server-sent events or real public-share link in this sandbox.
- Board cards appear only for the **active** sprint. All other cards appear in **Backlog**, matching the production app's sprint convention.
- WIP limits are advisory. The native HTML drag-and-drop behavior works best with a mouse/trackpad; on touch devices, change the column in the story editor.

The default `main` branch is unaffected. Do not deploy this demo branch for handling real user data or confidential projects: it is a single-user teaching sample with **no authentication**.

## Return to normal OSS behavior

```bash
git switch main
```

Then follow the usual database/authentication setup in the main [README](../README.md).

## Suggested verification

```bash
npm run lint
npm run typecheck
npm run build
```

In a browser: create a story, move it, reload, verify persistence; create/start/finish a sprint; export and re-import JSON; reset to initial fixtures. No DB-backed test scripts should be run for this branch's local demo.
