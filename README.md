# NTN Nouveau // Live Execution OS

Single-workspace command center for sequencing the launch of a 10-line
interventional-psychiatry / longevity platform across 3 waves — Layer 0 legal
spine, per-line GO/BLOCKED gates, critical path, driver financial model, clinical
reference, source governance, command palette, AI agents, weekly snapshots, and
import/export of state.

> Business-ops state only. **Zero PHI** — no patient data on any surface or in any store.

## Stack

Vite + React 18 + TypeScript. Tailwind v3 (local, no CDN). Optional Supabase
persistence. Optional Anthropic agents via a Netlify function proxy. Installable PWA.

## Local development

```bash
npm install
npm run dev        # Vite dev server
npm run typecheck  # tsc --noEmit (strict)
npm run test       # Vitest (engine + storage)
npm run build      # production build -> dist/
npm run preview    # serve the built dist/
```

For the agent proxy locally, use `netlify dev` (runs the function alongside Vite).

## Environment variables

Copy `.env.example` → `.env.local` for local dev, or set these in Netlify. **Nothing
is required** — with no env, the app runs fully local (localStorage) and the agents
degrade gracefully.

| Var | Where | Purpose |
|---|---|---|
| `VITE_PERSISTENCE_MODE` | client | `localStorage` (default) or `supabase` |
| `VITE_SUPABASE_URL` | client | Supabase project URL (anon access) |
| `VITE_SUPABASE_ANON_KEY` | client | **anon / publishable key only** — never service-role |
| `VITE_WORKSPACE_ID` | client | workspace UUID (RLS scope) |
| `ANTHROPIC_API_KEY` | **server** | agent proxy key — un-prefixed, never bundled |
| `ANTHROPIC_MODEL` | server | optional; defaults to `claude-opus-4-8` |

## Persistence modes

- **localStorage (default):** all state under the `ntn-nouveau:` prefix; nothing leaves the browser.
- **Supabase:** activates only when `VITE_PERSISTENCE_MODE=supabase` *and* the URL +
  anon key are present. Writes always mirror to localStorage (offline-safe). See
  `supabase/schema.sql` for the 7 tables + RLS. Single-workspace anon — **not
  team-safe** without adding Supabase Auth + per-user RLS.

State export/import (sidebar) round-trips a JSON file with `_meta.schemaVersion`;
older exports load without migration.

## Agent proxy

Agents call `/.netlify/functions/anthropic` with `{ agentId, messages,
liveStateSummary }`. The Anthropic key lives **server-side only**. The function
validates the agent against a server-side profile registry, injects live platform
state, and returns the text. Without `ANTHROPIC_API_KEY` set, it returns 503 and the
UI shows a clear "not configured" message.

## Netlify deploy

Git-based build. `netlify.toml`:

```
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"
```

Connect the repo in Netlify, set the env vars above, push. PWA assets ship from
`/public` to the dist root; the SPA redirect serves real files first.

## PWA

`public/manifest.webmanifest` + `public/sw.js` (network-first HTML, cache-first
static; Anthropic + Supabase hosts are never cached). Installable; offline-capable.

## Layout

```
index.html              Vite entry (PWA meta, SW register, no-flash theme)
src/main.tsx            createRoot; loads the Supabase shim first
src/App.tsx             the app (views + NTN.engine assembly)
src/lib/engine.ts       pure constraint + financial logic (unit-tested)
src/lib/storage.ts      persistence chokepoint + usePersistedState
src/data/*              typed data (service lines, gates, drivers, decisions, …)
src/components/*         WayThroughPanel, SourceRegistryView, SourceBadge
src/types/*             domain + source types
netlify/functions/      anthropic agent proxy
supabase/schema.sql     cloud schema + RLS (documentation)
```

See `MIGRATION_NOTES.md` (refactor history) and `SECURITY_NOTES.md`.
