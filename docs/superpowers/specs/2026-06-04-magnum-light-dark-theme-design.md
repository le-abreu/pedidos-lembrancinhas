# Magnum Light/Dark Theme Design

## Context

The client reference image, `cores_cliente.png`, defines a Magnum Tires identity built around strong red, charcoal/black, white, and neutral gray. The current application theme is warm beige/brown and does not match that identity.

The application is a Next.js App Router system. Most visual styling is centralized in `src/app/globals.css`, with global CSS tokens in `:root` and additional hard-coded color values throughout the same file. Authenticated pages render through `src/app/(protected)/layout.tsx`, which loads the current user and passes user data into `src/components/app-shell.tsx`. The account page already supports user-specific settings for avatar and password.

## Goal

Update the system color direction to match the Magnum reference and support a user-specific theme preference:

- Light theme is the default.
- Dark theme is optional per user.
- The selected theme is persisted in the database and follows the user across sessions/devices.
- Both themes share the same brand language instead of feeling like separate products.

## Non-Goals

- Do not redesign navigation, page structure, or workflows.
- Do not introduce a full design system package.
- Do not change order status colors, financial status colors, or user-managed color fields beyond ensuring they remain readable.
- Do not add a public marketing page or brand/logo implementation.

## Visual Direction

### Light Theme

The light theme follows the approved option A:

- Main background: cool off-white/light gray.
- Sidebar and high-contrast surfaces: charcoal/near black.
- Primary action and emphasis: Magnum red.
- Text: near black on light surfaces, white on dark surfaces.
- Supporting UI: neutral grays for borders, muted labels, inactive navigation, cards, table dividers, and form controls.

This theme should be the default for all users, including users created before the migration.

### Dark Theme

The dark theme follows the approved option C:

- Main background: near black/charcoal.
- Cards and form surfaces: slightly lighter charcoal.
- Borders: restrained gray with enough contrast to separate sections.
- Primary action and emphasis: the same Magnum red, with minor contrast adjustments if needed.
- Text: white/off-white primary text and muted gray secondary text.

The dark theme should keep the same layout, hierarchy, and interaction patterns as the light theme.

## Data Model

Add a Prisma enum:

```prisma
enum UserThemePreference {
  LIGHT
  DARK
}
```

Add a field to `User`:

```prisma
themePreference UserThemePreference @default(LIGHT)
```

This requires a Prisma migration. Existing users should receive `LIGHT` through the database default.

## Theme Application

`requireCurrentUser()` should include the new `themePreference` value as part of the current user object.

`src/app/(protected)/layout.tsx` should pass the value to `AppShell`.

`AppShell` should apply a theme attribute on its root wrapper:

```tsx
<div className="app-shell" data-theme={themePreference.toLowerCase()}>
```

If the value is missing for any reason, the UI should fall back to `light`.

The login page is outside `AppShell`. For this scope, it should always use the light Magnum theme.

## CSS Token Strategy

Keep `src/app/globals.css` as the main styling surface. Define shared tokens under `:root` for the light theme and override them under `[data-theme="dark"]`.

Core tokens:

- `--bg`
- `--bg-strong`
- `--surface`
- `--surface-strong`
- `--surface-soft`
- `--surface-contrast`
- `--border`
- `--border-strong`
- `--text`
- `--muted`
- `--accent`
- `--accent-strong`
- `--accent-soft`
- `--success`
- `--danger`
- shadow tokens

Replace the existing beige/brown hard-coded values in `globals.css` with token-based values where practical. Leave semantic colors such as success, danger, order status colors, and dynamically stored status colors intact unless they create a contrast issue in the new theme.

## Account UI

Add a new settings card on `src/app/(protected)/account/page.tsx`:

- Title: `Tema do sistema`
- Description: explains that the preference changes the interface for the current user.
- Control: a segmented control for `Claro` and `Escuro`.
- Submit button: `Salvar tema`

Add a server action:

```ts
export async function updateCurrentUserTheme(formData: FormData)
```

The action should:

- Require the current user.
- Accept only `LIGHT` or `DARK`.
- Update `themePreference`.
- Revalidate `/account` and `/`.
- Redirect back to `/account` with a success message.

## Accessibility And Usability

The implementation should preserve readable contrast for:

- Sidebar navigation.
- Primary and secondary buttons.
- Form fields and focus states.
- Tables on desktop and mobile card layout.
- Badges, warnings, timelines, and modal surfaces.
- Login page.

Text should not rely on red alone for meaning. Existing labels and status text should remain visible in both themes.

## Testing And Verification

There is no automated test runner configured. Verification should include:

- `yarn db:generate` after the schema change.
- `yarn db:migrate` or equivalent migration flow in the local database.
- `yarn build`.
- Manual checks in:
  - login page,
  - dashboard,
  - orders list,
  - order detail,
  - account page,
  - user forms,
  - tables on a narrow viewport.

Manual checks should confirm that switching the account preference persists after navigation and after logging in again.

## Implementation Boundaries

This design is intentionally scoped to color tokens and persisted theme preference. Any larger layout redesign, logo asset integration, typography change, or navigation redesign should be handled as a separate follow-up.
