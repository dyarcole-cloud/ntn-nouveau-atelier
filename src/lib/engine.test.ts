import { describe, it, expect } from 'vitest';
import {
  gateStatus, lineStatus, l0StatusOf, unmetL0, criticalPath, wayThrough,
  financials, lineMonthly, committedCapital, isoWeek, snapshotMetrics, makeSnapshot,
  taskFromCriticalPath, taskFromBlockingRisk, taskFromDecision,
  LAYER0, LINE_L0_DEPS,
} from './engine';
import { SERVICE_LINES } from '../data/serviceLines';
import { CRITICAL_PATH_14 } from '../data/criticalPath';

describe('financials() — reproduces the dossier headline', () => {
  const fin = financials();
  it('m12 monthly ≈ $820.5K', () => {
    expect(Math.round(fin.m12Monthly)).toBeGreaterThan(819000);
    expect(Math.round(fin.m12Monthly)).toBeLessThan(822000);
  });
  it('annualized = monthly × 12', () => {
    expect(fin.annualized).toBeCloseTo(fin.m12Monthly * 12, 5);
  });
  it('blended GM ≈ 52%', () => {
    expect(fin.blendedGM).toBeGreaterThan(0.51);
    expect(fin.blendedGM).toBeLessThan(0.53);
  });
  it('annual labor = Σ(fte × cost) ≈ $1.74M', () => {
    expect(Math.round(fin.annualLabor)).toBe(1744840);
  });
  it('covers all 10 lines', () => {
    expect(fin.lines.length).toBe(10);
  });
});

describe('lineMonthly() — effRev formula', () => {
  it('mix·payer·PA + (1-mix)·cash, × volume', () => {
    const d = { payerRate: 1000, cashRate: 500, payerMixPct: 0.8, paApprovalPct: 0.5, volume: 10 };
    const { effRev, monthly } = lineMonthly(d);
    expect(effRev).toBeCloseTo(0.8 * 1000 * 0.5 + 0.2 * 500, 6); // 400 + 100 = 500
    expect(monthly).toBeCloseTo(5000, 6);
  });
});

describe('gateStatus()', () => {
  it('BLOCKED with no cleared risks (pgx has 3 gates)', () => {
    const s = gateStatus('pgx', {});
    expect(s.status).toBe('BLOCKED');
    expect(s.total).toBe(3);
    expect(s.cleared).toBe(0);
  });
  it('GO once all per-line risks cleared', () => {
    const s = gateStatus('pgx', { pgx_risk_0: true, pgx_risk_1: true, pgx_risk_2: true });
    expect(s.status).toBe('GO');
    expect(s.cleared).toBe(3);
  });
  it('spravato has no per-line gates (centralized to Layer 0)', () => {
    expect(gateStatus('spravato', {}).total).toBe(0);
  });
});

describe('Layer 0 + lineStatus()', () => {
  it('a line is BLOCKED until per-line AND Layer-0 gates clear', () => {
    expect(lineStatus('pgx', {}, {}).status).toBe('BLOCKED');
  });
  it('pgx GO when its risks + entity + malpractice are done', () => {
    const layer0 = { entity: { status: 'done' }, malpractice: { status: 'done' } };
    const serviceState = { pgx_risk_0: true, pgx_risk_1: true, pgx_risk_2: true };
    expect(lineStatus('pgx', serviceState, layer0).status).toBe('GO');
  });
  it('l0StatusOf defaults to not-started', () => {
    expect(l0StatusOf('entity', {})).toBe('not-started');
    expect(l0StatusOf('entity', { entity: { status: 'done' } })).toBe('done');
  });
  it('unmetL0 lists required-but-undone gates for a line', () => {
    const u = unmetL0('spravato', { entity: { status: 'done' } });
    const ids = u.map(x => x.id);
    expect(ids).not.toContain('entity');
    expect(ids).toContain('rems');
  });
});

describe('criticalPath() — ranks unmet Layer-0 gates by downstream lines', () => {
  const path = criticalPath({});
  it('entity + malpractice gate all 10 lines (top of the path)', () => {
    const top = path.slice(0, 2).map(g => g.id).sort();
    expect(top).toEqual(['entity', 'malpractice']);
    expect(path[0].downstream).toBe(10);
  });
  it('drops gates that are done', () => {
    const allDone: any = {};
    LAYER0.forEach(g => { allDone[g.id] = { status: 'done' }; });
    expect(criticalPath(allDone).length).toBe(0);
  });
});

describe('wayThrough() — the decider', () => {
  it('clear-spine while universal gates unmet', () => {
    expect(wayThrough({}, {}).phase).toBe('clear-spine');
  });
  it('launch-wave1 once spine clear but Wave 1 not all GO', () => {
    const layer0 = { entity: { status: 'done' }, malpractice: { status: 'done' } };
    expect(wayThrough(layer0, {}).phase).toBe('launch-wave1');
  });
  it('scale once all Wave 1 lines GO', () => {
    const layer0: any = {};
    LAYER0.forEach(g => { layer0[g.id] = { status: 'done' }; });
    // clear every per-line risk for the 3 Wave-1 lines
    const serviceState: any = {};
    ['pgx', 'spravato', 'tms'].forEach(id => { for (let i = 0; i < 6; i++) serviceState[`${id}_risk_${i}`] = true; });
    expect(wayThrough(layer0, serviceState).phase).toBe('scale');
  });
});

describe('committedCapital()', () => {
  it('sums cost of checked critical-path items', () => {
    expect(committedCapital({})).toBe(0);
    const allChecked: any = {};
    CRITICAL_PATH_14.forEach((_, i) => { allChecked[`cp14_${i}`] = true; });
    const total = CRITICAL_PATH_14.reduce((s, p) => s + (p.cost || 0), 0);
    expect(committedCapital(allChecked)).toBe(total);
  });
});

describe('isoWeek()', () => {
  it('formats YYYY-Www', () => {
    expect(isoWeek(new Date('2026-06-22T00:00:00Z'))).toMatch(/^2026-W\d{2}$/);
  });
});

describe('snapshotMetrics() + makeSnapshot()', () => {
  it('rolls up live business-ops metrics', () => {
    const m = snapshotMetrics({});
    expect(m.l0Total).toBe(LAYER0.length);
    expect(m.linesGo + m.linesBlocked).toBe(SERVICE_LINES.length);
    expect(m.checklistTotal).toBe(CRITICAL_PATH_14.length);
  });
  it('makeSnapshot stamps id/ts/isoWeek/metrics', () => {
    const snap = makeSnapshot({}, true);
    expect(snap.id).toMatch(/^snap_/);
    expect(snap.auto).toBe(true);
    expect(snap.metrics).toBeTruthy();
    expect(typeof snap.isoWeek).toBe('string');
  });
});

describe('task factories', () => {
  it('taskFromCriticalPath carries source/owner/cost/severity', () => {
    const t = taskFromCriticalPath(CRITICAL_PATH_14[0], 0);
    expect(t.title).toBe(CRITICAL_PATH_14[0].action);
    expect(t.severity).toBe('high');
    expect(t.source).toContain('critical path');
    expect(t.id).toMatch(/^task_/);
  });
  it('taskFromBlockingRisk links the line + gate', () => {
    const line = SERVICE_LINES.find(s => s.id === 'pgx')!;
    const t = taskFromBlockingRisk(line, 0);
    expect(t.linkedLineId).toBe('pgx');
    expect(t.linkedGateId).toBe('baa');
    expect(t.title).toContain('Resolve blocking risk');
  });
  it('taskFromDecision links the decision + mapped gate', () => {
    const t = taskFromDecision({ id: 'd2', q: 'POS structure?', wave: 1 }, 'Option A');
    expect(t.linkedDecisionId).toBe('d2');
    expect(t.linkedGateId).toBe('entity'); // DECISION_GATE_MAP seed
    expect(t.severity).toBe('high');
  });
});
