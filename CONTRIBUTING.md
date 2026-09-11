# Contributing

Thanks for your interest in Tapiz Boards Open Source Edition.

This repository is independent from the hosted Tapiz Boards product — it does not share a database, users, or infrastructure with it. Changes here don't automatically apply there, and vice versa.

## Local setup

See the [README](README.md#local-development) for installing dependencies, setting up a database, and creating the first admin account.

## Before opening a PR

```bash
npm run lint
npm run typecheck
npm run build
```

If your change touches the database schema, run `npm run db:push` against a scratch database and mention the schema change in the PR description.

If your change touches business logic (services, repositories, validation), run the smoke test against a scratch database:

```bash
npm run smoke
```

## Scope

- Bug fixes, self-hosting/deployment improvements, and generic team-collaboration features are welcome.
- Features that reintroduce a dependency on Tapiz LMS, SSO, or any private Tapiz infrastructure are out of scope for this edition.
- Keep changes focused — small, reviewable PRs over large rewrites.

## Code style

- TypeScript, no `any` — use Zod schemas or proper types.
- Follow the existing layering: `domain` → `application` → `infrastructure` → `lib/actions` → `features` → `app`.
- Reuse existing UI primitives from `@tapizlabs/ui` rather than hand-rolling new ones.
