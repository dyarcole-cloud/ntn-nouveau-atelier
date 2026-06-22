# Security Notes — NTN Nouveau

## No private API keys in the browser

The Anthropic API key is **server-side only** (`ANTHROPIC_API_KEY`, read by
`netlify/functions/anthropic.ts`). The client calls `/.netlify/functions/anthropic`
and never sees, stores, or transmits a key. The old browser pattern — a user-entered
key in localStorage and a direct `api.anthropic.com` call with
`anthropic-dangerous-direct-browser-access` — was removed entirely (Phase 7). The
proxy normalizes upstream errors to a generic 502 (no upstream diagnostics leak to
the client) and caps/validates input.

## Supabase: anon key + RLS only

When Supabase persistence is enabled, the client uses the **anon / publishable**
key (`VITE_SUPABASE_ANON_KEY`) — public by design. There is **no service-role key
anywhere** in the client or repo. Access is gated by Row-Level Security scoped to a
single `VITE_WORKSPACE_ID` (see `supabase/schema.sql`).

- This is a **single-workspace, solo-operator** posture. The RLS policies are
  workspace-scoped, not user-scoped — they are **not sufficient for multi-user**.
  Going multi-user requires Supabase Auth + `auth.uid()`-scoped policies.
- `VITE_*` env vars are bundled into the client by Vite by design (that's how the
  browser reads them). Putting the anon key in Netlify env keeps it out of source
  but it will still appear in the shipped bundle when Supabase mode is on — which is
  expected and safe for an anon, RLS-protected key.

## localStorage limitations

Default persistence is `localStorage` (`ntn-nouveau:` prefix). It is per-browser,
per-device, clearable by the user, and not encrypted. Treat the JSON export as the
durable backup. Never put anything sensitive in app state.

## No PHI — business-ops only

This app holds **business-ops state only**: capital, revenue, gates, tasks,
decisions, snapshot metrics. **No patient data, counts, or clinical records** appear
on any surface or in any store (local or Supabase). The Supabase schema has no PHI
columns by construction.

## Source governance, not assertions

The source registry (`src/data/sourceRegistry.ts`) marks volatile clinical /
regulatory / financial claims as `needs-review`. It records *who owns verifying*
each claim — it does not assert any claim is true and contains **no fabricated
citations or URLs**. Treat flagged items as pending Cole's clinical/legal/finance
review.

## Repo note

`index.legacy.html` (the pre-refactor single-file artifact) contained the Supabase
URL + anon key inline; it was removed in Phase 10. The anon key remains in earlier
git history — acceptable because it is a publishable, RLS-protected key, but rotate
it via Supabase if the repo's exposure posture ever changes.
