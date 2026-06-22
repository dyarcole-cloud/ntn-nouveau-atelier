# Migration Notes — Single-file artifact → Vite production build

This documents the `cleanup/production-os` refactor: turning the 4,044-line
single-file `index.html` artifact into a maintainable Vite + React + TypeScript
build **without changing product intent, numbers, visual identity, or state**.

## Preservation contract (non-negotiable)

- **No core functionality removed.** Every view, gate, decision, line, driver,
  and snapshot behavior is preserved.
- **No clinical / regulatory / financial claims or numbers changed.** Values are
  moved into typed data structures verbatim. Volatile claims are flagged
  `needs-review` (Phase 6) — never rewritten or fabricated.
- **localStorage keys are stable.** Prefix `ntn-nouveau:` and all 12 keys
  (`checklist, tasks, decisions, serviceState, ganttState, apiKey, agentThreads,
  finModel, capMap, layer0, snapshots, finScenarios`) are untouched. Old state
  loads without migration. Export adds `_meta.schemaVersion` (Phase 3);
  schema-less imports still load.
- **PWA preserved** (`manifest.webmanifest`, `sw.js`, icons — now in `/public`).
- **Visual identity preserved** — 4 themes (onyx/blueprint/noir/atelier), serif
  editorial voice, ember/coral accent. The 322-line `<style>` block moved
  verbatim into `src/styles/globals.css`.
- **No private API keys in the browser** (Phase 7). Supabase uses anon key only.

## Phase 1 strategy (faithful port)

The original `<script type="text/babel">` body was extracted **verbatim** into
`src/App.tsx` (via a one-shot slice script, no hand-transcription). The only
changes:

1. Prepend `import React from 'react'` — the body's existing
   `const { useState, ... } = React` destructure resolves against it.
2. The trailing `ReactDOM.createRoot(...).render(<App/>)` moved to `src/main.tsx`
   (uses `react-dom/client`); `App` is now `export default`.
3. CDN React / ReactDOM / Babel / Tailwind removed. Supabase-js moved from CDN to
   the npm package via `src/lib/supabase-global.ts`, which sets
   `window.supabase = { createClient }` **before** `App.tsx` evaluates — the
   `NTN.engine` IIFE calls `initSupabase()` synchronously at module-eval and
   reads `window.supabase.createClient`.
4. Type-only annotations added at ~20 inference points in the ported body
   (`useState<any>`, `useRef<any>`, `: any` on a few component params and
   `.find()` results, `+date` for Date subtraction). **No behavior changes.**
   `tsconfig` keeps `strict: true` (with `noImplicitAny: false`); typecheck is
   genuinely green — no `@ts-nocheck`.

Later phases extract `src/data/`, `src/lib/`, `src/components/`, `src/views/`
from this monolith incrementally, with a green build at each step.

## Rollback

The original artifact is preserved as `index.legacy.html` (root) until the new
build is verified in production, then removed in Phase 10. Milestone backups of
the original also live in the source folder outside the repo.

## Build / deploy

- `npm run dev | build | preview | typecheck | test`
- Netlify: git-based build (`netlify.toml` → `npm run build`, publish `dist`),
  replacing the prior manual-CLI static deploy. PWA assets ship from `/public`.

## Phases completed (branch `cleanup/production-os`)

0. Baseline branch + these notes.
1. Vite + React 18 + TS scaffold; faithful verbatim port; CDN runtime removed.
2. Typed data extracted to `src/data/*` + `src/types/domain.ts` (numbers verbatim).
3. Engine + storage formalized into pure `src/lib/engine.ts` + `src/lib/storage.ts`
   (32 Vitest tests; dossier numbers + legacy-state migration locked).
4. `WayThroughPanel` leads the Command surface.
5. Operational `Task` objects (factories wired; severity/links; safe migration).
6. Source registry + `needs-review` affordances (no invented citations).
7. Netlify function agent proxy; browser API key removed (code-reviewed + hardened).
8. Env-driven Supabase config (no hardcoded keys); `supabase/schema.sql`.
9. Nav grouped into 5 OS surfaces via the zones manifest.
10. README + SECURITY_NOTES + `.env.example`; `index.legacy.html` removed; final build.

Every phase kept `npm run typecheck` + `npm run build` green and was render-verified.
The `ntn-nouveau:*` localStorage keys, all numbers/claims, the 4 themes, the PWA,
and the full feature set are preserved.
