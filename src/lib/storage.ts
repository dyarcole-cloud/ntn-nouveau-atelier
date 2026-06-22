// ===========================================================================
// NTN Nouveau — STORAGE. Single persistence chokepoint behind ONE swappable
// adapter (localStorage default; Supabase optional cloud sync; Claude-artifact
// bridge). Business-ops state only — apiKey + agentThreads NEVER sync.
// Init runs at module load (reads window.NTN.config + window.supabase, both set
// before this module evaluates: config inline in index.html, supabase shim in
// main.tsx's first import). Logic verbatim from the original engine IIFE.
// ===========================================================================
import { useState, useEffect } from 'react';

export const STORAGE_PREFIX = 'ntn-nouveau:';
// Bumped when the exported state shape changes. Old exports (no _meta or a lower
// version) still load — importAll never rejects on version, it just imports keys.
export const SCHEMA_VERSION = 1;

const PREFIX = STORAGE_PREFIX;
const hasArtifact = typeof window !== 'undefined' && (window as any).storage && typeof (window as any).storage.get === 'function';

// ---- SWAPPABLE ADAPTER (the one seam Supabase replaces) --------------------
const localAdapter = {
  name: 'localStorage',
  async get(k: string)      { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  async set(k: string, v: any)   { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  async remove(k: string)   { try { localStorage.removeItem(k); } catch {} },
  async keys()      { try { return Object.keys(localStorage).filter(x => x.startsWith(PREFIX)); } catch { return []; } }
};
const artifactAdapter = {
  name: 'artifact',
  async get(k: string)      { try { const r = await (window as any).storage.get(k); return r ? JSON.parse(r.value) : null; } catch { return null; } },
  async set(k: string, v: any)   { try { await (window as any).storage.set(k, JSON.stringify(v)); return true; } catch { return false; } },
  async remove(k: string)   { try { await (window as any).storage.delete(k); } catch {} },
  async keys()      { return []; }
};

// ---- SUPABASE ADAPTER (optional cloud sync; same interface) ----------------
// Env-driven (Vite). Default persistence is localStorage — Supabase activates
// ONLY when VITE_PERSISTENCE_MODE=supabase AND the URL + anon key are present.
// No project URL or key is hardcoded in source (set them in the Netlify env).
const ENV: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
const CFG: any = {
  SUPABASE_URL:      ENV.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: ENV.VITE_SUPABASE_ANON_KEY || '',
  WORKSPACE_ID:      ENV.VITE_WORKSPACE_ID || 'default',
  PERSISTENCE:       ENV.VITE_PERSISTENCE_MODE || 'localStorage',
};
const WS  = CFG.WORKSPACE_ID || 'default';
const KEY_TABLE: Record<string, string> = {
  tasks:'tasks', decisions:'decisions', serviceState:'service_lines',
  capMap:'gates', layer0:'gates', checklist:'capital', ganttState:'capital', finModel:'financial_inputs', snapshots:'snapshots'
};
const LOCAL_ONLY = ['agentThreads']; // apiKey removed in phase 7 (server-side proxy)
const bare = (k: string) => k.startsWith(PREFIX) ? k.slice(PREFIX.length) : k;

let sb: any = null;
let syncStatus = 'local';            // local | connecting | connected | offline | error
const syncListeners = new Set<any>();
function setSync(s: string){ if (s !== syncStatus){ syncStatus = s; syncListeners.forEach(f => { try { f(s); } catch {} }); } }
export function currentSync(){ return syncStatus; }
export function subscribeSync(cb: any){ syncListeners.add(cb); return () => syncListeners.delete(cb); }

const supabaseAdapter = {
  name: 'supabase',
  async get(k: string) {
    const key = bare(k);
    if (LOCAL_ONLY.includes(key) || !KEY_TABLE[key] || !sb) return localAdapter.get(k);
    try {
      const { data, error } = await sb.from(KEY_TABLE[key]).select('data').eq('workspace_id', WS).eq('key', key).maybeSingle();
      if (error) throw error;
      setSync('connected');
      if (data) { await localAdapter.set(k, data.data); return data.data; }  // mirror to local cache
      return localAdapter.get(k);                                            // not in cloud yet → local
    } catch (e) { setSync('offline'); return localAdapter.get(k); }          // never crash
  },
  async set(k: string, v: any) {
    const key = bare(k);
    await localAdapter.set(k, v);                                            // always keep a local mirror
    if (LOCAL_ONLY.includes(key) || !KEY_TABLE[key] || !sb) return true;
    try {
      const { error } = await sb.from(KEY_TABLE[key])
        .upsert({ workspace_id: WS, key, data: v, updated_at: new Date().toISOString() }, { onConflict: 'workspace_id,key' });
      if (error) throw error;
      setSync('connected'); return true;
    } catch (e) { setSync('offline'); return true; }                         // local already has it
  },
  async remove(k: string) {
    const key = bare(k);
    await localAdapter.remove(k);
    if (LOCAL_ONLY.includes(key) || !KEY_TABLE[key] || !sb) return;
    try { await sb.from(KEY_TABLE[key]).delete().eq('workspace_id', WS).eq('key', key); setSync('connected'); }
    catch { setSync('offline'); }
  },
  async keys() { return localAdapter.keys(); }
};

function initSupabase() {
  if (CFG.PERSISTENCE !== 'supabase') return false;
  const url = CFG.SUPABASE_URL || '', anon = CFG.SUPABASE_ANON_KEY || '';
  if (!url || !anon || url.indexOf('PUT_') === 0 || anon.indexOf('PUT_') === 0) return false;  // placeholders
  if (!(window as any).supabase || !(window as any).supabase.createClient) return false;        // shim not loaded
  try { sb = (window as any).supabase.createClient(url, anon); return true; } catch { return false; }
}
async function ping() {
  if (!sb) return;
  try { const { error } = await sb.from('tasks').select('workspace_id').limit(1); if (error) throw error; setSync('connected'); }
  catch { setSync('offline'); }
}

// Selection: Supabase if configured & reachable, else transparent local/artifact.
let adapter: any;
if (initSupabase()) { adapter = supabaseAdapter; setSync('connecting'); ping(); }
else { adapter = hasArtifact ? artifactAdapter : localAdapter; setSync('local'); }
export function useAdapter(a: any) { adapter = a; }
export function currentAdapter() { return adapter.name; }

// ---- namespaced IO ---------------------------------------------------------
export const KEYS = ['checklist','tasks','decisions','serviceState','ganttState','agentThreads','finModel','capMap','layer0','snapshots','finScenarios'];
export async function get(key: string)        { return adapter.get(PREFIX + key); }
export async function set(key: string, value: any) { return adapter.set(PREFIX + key, value); }
export async function remove(key: string)     { return adapter.remove(PREFIX + key); }

// ---- JSON export / import (survives a cache-clear) -------------------------
export async function exportAll() {
  const out: any = { _meta: { app: 'ntn-nouveau', schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), adapter: adapter.name } };
  for (const k of KEYS) out[k] = await get(k);
  return out;
}
export async function importAll(obj: any) {
  if (!obj || typeof obj !== 'object') throw new Error('Invalid state file');
  // Schema-tolerant: older exports have no _meta / a lower schemaVersion. We load
  // every known key regardless; unknown keys (incl. _meta) are ignored.
  for (const k of KEYS) if (k in obj && obj[k] !== undefined && obj[k] !== null) await set(k, obj[k]);
  return true;
}

// ---- React hook: persisted state (same [value,setValue,loaded] contract) ---
export function usePersistedState(key: string, defaultValue: any) {
  const [value, setValue] = useState<any>(defaultValue);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let mounted = true;
    get(key).then(v => {
      if (mounted) { if (v !== null && v !== undefined) setValue(v); setLoaded(true); }
    });
    return () => { mounted = false; };
  }, [key]);
  useEffect(() => { if (loaded) set(key, value); }, [key, value, loaded]);
  return [value, setValue, loaded];
}
