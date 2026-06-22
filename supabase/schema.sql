-- ============================================================================
-- NTN Nouveau — Supabase schema (implementation documentation).
--
-- This file documents the cloud-persistence schema the app expects when
-- VITE_PERSISTENCE_MODE=supabase. It is the source of truth for the structure;
-- the live project was provisioned from an equivalent migration.
--
-- DESIGN: business-ops state only — ZERO PHI. Every store is a uniform
-- doc-per-key row: (workspace_id, key, data jsonb). The client maps its
-- localStorage keys onto these 7 tables (see KEY_TABLE in src/lib/storage.ts):
--
--   tasks            <- tasks
--   decisions        <- decisions
--   service_lines    <- serviceState        (per-line gate cleared-state)
--   gates            <- capMap, layer0       (capability map + Layer 0 status)
--   capital          <- checklist, ganttState
--   financial_inputs <- finModel             (driver model)
--   snapshots        <- snapshots            (weekly changelog)
--
-- Keys that NEVER sync (LOCAL_ONLY): agentThreads, finScenarios. (apiKey was
-- removed entirely in phase 7 — the Anthropic key is server-side only.)
--
-- WORKSPACE ISOLATION: single-workspace, solo-operator by design. All rows are
-- scoped to one WORKSPACE_ID (a UUID). The anon (publishable) key is the only
-- client credential — RLS confines it to that workspace. NEVER use a
-- service-role key in the browser.
--
-- TEAM-SAFE? No. This is single-workspace anon access. To go multi-user you
-- MUST add Supabase Auth + per-user RLS (auth.uid()-scoped policies) — the
-- policies below are workspace-scoped, not user-scoped, and are NOT sufficient
-- to isolate multiple users.
-- ============================================================================

-- Each table is identical in shape: a JSONB document addressed by (workspace, key).
-- Example for one table; repeat for all 7.

create table if not exists public.tasks (
  workspace_id uuid        not null,
  key          text        not null,
  data         jsonb       not null default '{}'::jsonb,
  updated_at   timestamptz not null default now(),
  primary key (workspace_id, key)
);
create table if not exists public.decisions (
  workspace_id uuid not null, key text not null, data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(), primary key (workspace_id, key)
);
create table if not exists public.service_lines (
  workspace_id uuid not null, key text not null, data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(), primary key (workspace_id, key)
);
create table if not exists public.gates (
  workspace_id uuid not null, key text not null, data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(), primary key (workspace_id, key)
);
create table if not exists public.capital (
  workspace_id uuid not null, key text not null, data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(), primary key (workspace_id, key)
);
create table if not exists public.financial_inputs (
  workspace_id uuid not null, key text not null, data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(), primary key (workspace_id, key)
);
create table if not exists public.snapshots (
  workspace_id uuid not null, key text not null, data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(), primary key (workspace_id, key)
);

-- ----------------------------------------------------------------------------
-- RLS: enable on every table, one policy per table scoped to the workspace.
-- Recommendation: replace the broad anon policy below with an auth-scoped policy
-- before any multi-user use. As-is it trusts any anon client that knows the
-- workspace UUID — acceptable for a solo, single-workspace deployment only.
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['tasks','decisions','service_lines','gates','capital','financial_inputs','snapshots']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($p$
      create policy %I on public.%I
        for all to anon
        using (workspace_id = '00000000-0000-0000-0000-000000000001'::uuid)
        with check (workspace_id = '00000000-0000-0000-0000-000000000001'::uuid);
    $p$, 'ws_rw_' || t, t);
  end loop;
end $$;
