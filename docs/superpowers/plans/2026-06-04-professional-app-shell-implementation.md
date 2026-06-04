# Professional App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the protected application shell with a professional topbar plus collapsible sidebar layout.

**Architecture:** Keep `AppShell` as the single protected layout component. Move brand/session actions to a topbar, keep navigation in a collapsible sidebar, and use a small display helper for collapsed navigation labels.

**Tech Stack:** Next.js App Router, React client component, TypeScript, CSS custom properties, lucide-react.

---

## Tasks

- [ ] Add tests for navigation label abbreviation used in collapsed sidebar.
- [ ] Implement `src/lib/navigation-display.ts`.
- [ ] Generate `public/magnum-logo.png` from the approved client color reference.
- [ ] Refactor `src/components/app-shell.tsx` to add topbar, right-aligned session actions, collapse toggle, and mobile drawer behavior.
- [ ] Replace old sidebar/mobile topbar CSS with professional topbar + collapsible sidebar styles.
- [ ] Run helper test, `tsc`, `npm run build`, rebuild Docker, and validate `/login`.
