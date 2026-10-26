# Tapiz Boards OSS — browser demo for classroom exercises

Live demo: **https://owlcoder.github.io/tapiz-boards-oss/**

This branch (`demo/browser-only-no-auth`) bundles the **actual OSS React views, design-system components, fonts, global CSS and translations**. It does not maintain a second imitation UI. The sidebar, dashboard, project cards, board, backlog, sprint planning, story panels, checklist, comments, members, calendar, insights, settings and Trash come from `src/`.

Only the demo controls and browser adapters are separate. The demo toolbar offers participant switching, JSON export/import and reset. Login, logout and password changes are absent. No authentication/session, database, API server, Docker or environment variables are required.

The `main` branch remains the real self-hosted OSS application. Students deploy `main` with its normal authentication and MySQL configuration. Do not merge the demo's package scripts or browser adapters into `main`.

## Run locally

```sh
git switch demo/browser-only-no-auth
npm install
npm run dev
```

Open **http://localhost:3004**. Set `PORT=3014` if that port is already in use. The script builds static files and serves them locally. Run it again after source changes; no Next.js server is involved in this demo.

```sh
npm run build
```

This produces `dist-pages/`, which can be hosted as static files. Hash routes (`#/projects/campus/board`) work on GitHub Pages without rewrite rules.

## Classroom data

On the first visit, the browser creates fictional, realistic fixtures:

- CampusHub, a student portal project, and a library reservation project.
- Six fictional participants, with reserved `example.test` email addresses.
- Eighteen stories across active, planned and completed sprints, including backlog items, assignments, acceptance criteria, priorities, points, deadlines, checklist items and comments.
- Completed-sprint retrospective notes, calendar activity and one archived project for a restore exercise.

Each story has a short product-oriented title and a description in this form: **“Ja kao [uloga] hoću da [mogućnost], kako bih [korist].”** The description states the user need and value without implementation details. Technical work and concrete acceptance checks belong in checklist tasks, not in the story sentence.

For example: “Ja kao student hoću da imam mogućnost zakazivanja termina konsultacija, kako bih rešio nedoumice u vezi sa gradivom.”

When updating from the original fixture wording, the app upgrades only examples whose title and description are both unchanged. Learner-written text, new/deleted stories, assignments, sprint/column positions, comments and checklists are retained; no reset is needed.

Dates are relative to the first visit (or reset), so the examples remain useful next semester. The stored dates stay stable between visits.

## Persistence, offline use and backups

- All application records live in `localStorage` under **`tapiz-boards-oss-demo-v2`**. The earlier simplified demo's `tapiz-boards-browser-demo-v1` key is left untouched.
- Refreshing or closing and reopening the same browser preserves edits. Tabs in the same browser synchronize storage changes.
- Theme, language and sidebar preferences are local too. Switching the demo participant simulates another member; it does not sign anyone in.
- Each browser/device has its own independent copy. There is no shared server state, real-time collaboration or real account management.
- A service worker caches the application and fonts after the first successful visit. It can then load and work without the host being reachable. A first-ever visit still needs the site to be reachable. Browser private-mode/storage restrictions may prevent persistence or offline caching.
- Export JSON before clearing browser data or resetting. Import validates the complete shape and references, asks before replacing existing data, and never sends the file to a server.
- Reset asks before replacing the current local copy with fresh classroom fixtures.
- Public-share links cannot publish local records to another device; that requires deploying the real OSS app. The demo explains this when that action is attempted. Use JSON export/import to transfer the sandbox.

## Build boundary

`pages-demo/build.mjs` imports the original OSS views and replaces only server action imports and Next.js navigation/dynamic-loading with browser implementations. The same action names and DTOs let the original forms work without a backend. Pure changelog/legal pages use the local dictionary adapter. Locale controls keep their original UI and save their preference in localStorage.

The build rejects database, authentication and Next.js server-only dependencies. `dist-pages/build-meta.json` records bundled inputs so the contract test can verify the boundary. Shared component changes are restricted to hiding logout/password UI when `NEXT_PUBLIC_BROWSER_DEMO` is set at demo build time; normal OSS behavior stays unchanged otherwise.

## Verification

```sh
npm run lint
npm run typecheck
npm run build
npm run test:demo
```

The action tests cover fixture integrity, project/member/story CRUD, visible ordering, comments/checklists, sprint start/undo/finish/carryover, retrospective notes, Trash cascades, JSON validation, atomic storage failures and the compiled dependency boundary. No DB-backed test scripts are needed for this branch.

Browser checks: create and edit a story, update a checklist and comment, refresh and confirm persistence; open backlog, sprints, calendar, statistics, members and appearance; switch participant; export/import and reset. After the first visit, stop the static host and refresh to verify offline loading.

## Publishing

Pushes to `demo/browser-only-no-auth` build and deploy the static application directly with GitHub Pages Actions. Repository Pages uses **GitHub Actions**, and the `github-pages` environment allows deployment from this demo branch. No change to `main` is required.
