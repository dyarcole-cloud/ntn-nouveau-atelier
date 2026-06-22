import { describe, it, expect, beforeEach } from 'vitest';

// Minimal localStorage mock (node env). storage.ts selects localAdapter when
// no window.NTN.config is present, and reads global localStorage at call time.
const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => (k in store ? store[k] : null),
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
};

import { get, set, exportAll, importAll, KEYS, SCHEMA_VERSION, STORAGE_PREFIX } from './storage';

beforeEach(() => { for (const k of Object.keys(store)) delete store[k]; });

describe('storage round-trip', () => {
  it('set/get a key (prefixed under ntn-nouveau:)', async () => {
    await set('tasks', [{ id: 't1', title: 'x' }]);
    expect(store[STORAGE_PREFIX + 'tasks']).toBeTruthy();
    expect(await get('tasks')).toEqual([{ id: 't1', title: 'x' }]);
  });
  it('missing key returns null', async () => {
    expect(await get('tasks')).toBeNull();
  });
});

describe('exportAll() / importAll()', () => {
  it('exportAll stamps _meta.schemaVersion', async () => {
    const out: any = await exportAll();
    expect(out._meta.schemaVersion).toBe(SCHEMA_VERSION);
    expect(out._meta.app).toBe('ntn-nouveau');
    for (const k of KEYS) expect(k in out).toBe(true);
  });
  it('importAll loads known keys', async () => {
    await importAll({ tasks: [{ id: 'a' }], decisions: { d1: 'yes' } });
    expect(await get('tasks')).toEqual([{ id: 'a' }]);
    expect(await get('decisions')).toEqual({ d1: 'yes' });
  });
  it('importAll tolerates legacy state with no _meta (schema-version migration)', async () => {
    // an old export predating schema versioning — must load without throwing
    await importAll({ checklist: { cp14_0: true }, snapshots: [{ id: 's1' }] });
    expect(await get('checklist')).toEqual({ cp14_0: true });
  });
  it('importAll rejects a non-object', async () => {
    await expect(importAll(null)).rejects.toThrow();
  });
  it('export → import round-trips', async () => {
    await set('finScenarios', [{ name: 'base' }]);
    const dump = await exportAll();
    for (const k of Object.keys(store)) delete store[k];
    await importAll(dump);
    expect(await get('finScenarios')).toEqual([{ name: 'base' }]);
  });
});
