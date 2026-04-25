# Repository Guidelines

## Project Structure & Module Organization
`src/app` contains Next.js App Router pages, layouts, and API routes. Shared UI lives in `src/components`, reusable helpers in `src/lib`, and business logic in `src/server/services`. Database schema, migrations, and bootstrap data live in `prisma/`. Local infrastructure files are split between `docker/` and `infra/kubernetes/`. Reference prompts and local skills are kept in `PROMPT*.md` and `skills/`.

## Build, Test, and Development Commands
- `yarn dev`: starts the Next.js app locally.
- `yarn build`: creates the production build.
- `yarn start`: runs the built app.
- `yarn db:generate`: regenerates Prisma Client after schema changes.
- `yarn db:migrate`: applies existing Prisma migrations.
- `yarn db:setup`: bootstrap for a fresh database (`generate + migrate + seed`).
- `yarn db:reset`: drops and recreates the database via Prisma migrations, then reruns seed.
- `yarn docker:up` / `yarn docker:down`: start or stop the local Docker stack.

## Coding Style & Naming Conventions
Use TypeScript throughout the app and keep indentation consistent with the existing codebase: 2 spaces in JSON, 2-space style in TS/TSX files. Prefer named exports for shared helpers and keep service logic in `src/server/services`. Use `kebab-case` for route folders, `camelCase` for variables/functions, and `PascalCase` for React components and Prisma model-aligned types. There is no configured ESLint or Prettier script, so match the surrounding file style and keep imports organized.

## Testing Guidelines
There is currently no automated test runner configured in `package.json`. Until a test suite is introduced, validate changes with targeted manual checks: run `yarn build`, exercise the affected screen or API route, and verify Prisma flows with `yarn db:setup` when schema or seed data changes. If you add tests later, place them close to the feature or under a dedicated `tests/` folder and follow `<feature>.test.ts` naming.

## Commit & Pull Request Guidelines
Recent history shows short, imperative commits with optional Conventional Commit prefixes, for example `feat: financeiro` and `fix: ajustes`. Prefer `feat:`, `fix:`, and similarly scoped messages. Pull requests should explain user-visible impact, mention schema or environment changes, link the related issue when available, and include screenshots for UI changes.

## Security & Configuration Tips
Do not commit real `.env` files or credentials. Keep `DATABASE_URL`, S3, and Docker settings aligned with the examples in `README.md` and `docker/compose/.env.example`. When changing Prisma models, commit the generated migration and confirm the seed still works on an empty database.
