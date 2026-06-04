# Magnum Light/Dark Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Magnum light/dark theme with user-specific persistence.

**Architecture:** Store the user's theme preference in Prisma, expose it through the existing current-user flow, apply it as `data-theme` on `AppShell`, and drive both themes through CSS tokens in `globals.css`. Keep login on the light Magnum theme and add the preference control to the existing account page.

**Tech Stack:** Next.js App Router, TypeScript, Prisma 5, PostgreSQL, CSS custom properties.

---

## Files

- Create `src/lib/theme.ts`: small theme validation/normalization helpers.
- Create `tests/theme.test.ts`: node-test compatible unit tests for theme helpers.
- Modify `prisma/schema.prisma`: add `UserThemePreference` enum and `User.themePreference`.
- Create `prisma/migrations/20260604013000_add_user_theme_preference/migration.sql`: add enum/column/default in PostgreSQL.
- Modify `src/lib/auth.ts`: include `themePreference` through the current-user object.
- Modify `src/components/app-shell.tsx`: accept theme preference and apply `data-theme`.
- Modify `src/app/(protected)/layout.tsx`: pass current user's theme to `AppShell`.
- Modify `src/app/(protected)/account/page.tsx`: add account card for theme selection.
- Modify `src/app/actions.ts`: add `updateCurrentUserTheme`.
- Modify `src/app/globals.css`: convert the beige/brown theme to Magnum light/dark tokens and update hard-coded theme colors.

## Tasks

### Task 1: Theme Helper Red Test

- [ ] Create `tests/theme.test.ts` importing `normalizeThemePreference` and `themePreferenceToAttribute` from `src/lib/theme`.
- [ ] Test that `LIGHT` maps to `light`, `DARK` maps to `dark`, and invalid/missing values fall back to `LIGHT`.
- [ ] Run a temporary compile-and-test command and confirm it fails because `src/lib/theme.ts` does not exist.

### Task 2: Data Model And Helper

- [ ] Add `UserThemePreference` to `prisma/schema.prisma`.
- [ ] Add `themePreference UserThemePreference @default(LIGHT)` to `User`.
- [ ] Add the SQL migration with enum creation and `User.themePreference` default.
- [ ] Create `src/lib/theme.ts` with validation helpers.
- [ ] Run the helper test and confirm it passes.

### Task 3: User Flow

- [ ] Update `src/lib/auth.ts` to keep `themePreference` on the returned user.
- [ ] Update `src/components/app-shell.tsx` props and root wrapper.
- [ ] Update `src/app/(protected)/layout.tsx` to pass the preference.
- [ ] Add `updateCurrentUserTheme` to `src/app/actions.ts`.
- [ ] Add the theme settings card to `src/app/(protected)/account/page.tsx`.

### Task 4: CSS Theme

- [ ] Replace the current `:root` colors with Magnum light tokens.
- [ ] Add `[data-theme="dark"]` token overrides.
- [ ] Replace beige/brown hard-coded colors in `globals.css` with token-driven or Magnum-neutral values.
- [ ] Keep semantic success/danger and dynamic status colors intact.

### Task 5: Verification

- [ ] Run `npm exec prisma generate`.
- [ ] Run `npm run build`.
- [ ] Rebuild and restart Docker Compose with local database and MinIO alternate host ports.
- [ ] Run migrations inside Docker if needed.
- [ ] Validate `http://localhost:3000/login` returns `200 OK`.
- [ ] Confirm app containers are running and note any remaining warnings.
