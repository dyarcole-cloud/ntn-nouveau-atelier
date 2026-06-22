// ===========================================================================
// NTN Nouveau — ENGINE. Pure, side-effect-free constraint + financial logic.
// No storage, no React, no globals. Unit-testable. Logic is verbatim from the
// original artifact; the only change is that data is imported (the original used
// `typeof X !== 'undefined'` guards because data was declared later in the file).
// ===========================================================================
import { SERVICE_LINES } from '../data/serviceLines';
import { CRITICAL_PATH_14 } from '../data/criticalPath';
import { OPEN_DECISIONS, DECISION_GATE_MAP } from '../data/decisions';
import { GATES } from '../data/gates';
import { LAYER0, LINE_L0_DEPS } from '../data/layer0';
import { WAVE1 } from '../data/waves';
import { FIN_DRIVERS } from '../data/financialDrivers';
import type { Task, TaskSeverity } from '../types/domain';

// re-exported so the NTN.engine surface keeps exposing the data it always did
export { GATES, LAYER0, LINE_L0_DEPS, FIN_DRIVERS };

// ---- REGULATORY HARD-GATES -------------------------------------------------
export function gateStatus(lineId: string, serviceState: any) {
  const gates = GATES[lineId] || [];
  serviceState = serviceState || {};
  const unmet = gates.filter(g => !serviceState[`${lineId}_risk_${g.riskIdx}`]);
  return { status: unmet.length ? 'BLOCKED' : 'GO', unmet, total: gates.length, cleared: gates.length - unmet.length };
}

// ---- LAYER 0 · LEGAL & ENTITY SPINE ----------------------------------------
export function l0StatusOf(id: string, layer0: any) { return (layer0 && layer0[id] && layer0[id].status) || 'not-started'; }
export function unmetL0(lineId: string, layer0: any) {
  return (LINE_L0_DEPS[lineId] || [])
    .filter(id => l0StatusOf(id, layer0) !== 'done')
    .map(id => { const g = LAYER0.find(x => x.id === id); return { id, label: g ? g.name : id }; });
}
// Combined GO: a line is GO only if its per-line gates AND all required Layer 0
// gates are clear. Layer 0 changes recompute every line live.
export function lineStatus(lineId: string, serviceState: any, layer0: any) {
  const g = gateStatus(lineId, serviceState);
  const l0 = unmetL0(lineId, layer0);
  const total = g.total + (LINE_L0_DEPS[lineId] || []).length;
  const unmet = [
    ...g.unmet.map(u => ({ source: 'line',   label: u.label })),
    ...l0.map(u =>      ({ source: 'layer0', label: u.label }))
  ];
  return { status: unmet.length ? 'BLOCKED' : 'GO', unmet, lineUnmet: g.unmet, l0Unmet: l0, total, cleared: total - unmet.length };
}
// Critical path: unmet Layer 0 gates ranked by how many service lines each unblocks.
export function criticalPath(layer0: any) {
  return LAYER0
    .filter(g => l0StatusOf(g.id, layer0) !== 'done')
    .map(g => {
      const lines = Object.keys(LINE_L0_DEPS).filter(l => LINE_L0_DEPS[l].includes(g.id));
      return { ...g, status: l0StatusOf(g.id, layer0), downstream: lines.length, lines };
    })
    .sort((a, b) => b.downstream - a.downstream);
}
// The decider: the platform collapses to ONE next move. Two universal gates
// (entity + malpractice) block every line; until they clear, nothing else is the
// move. Then prove the loop with a single line before opening any other.
export function wayThrough(layer0: any, serviceState: any) {
  const universal = ['entity', 'malpractice'].map(id => ({ id, gate: LAYER0.find(g => g.id === id), status: l0StatusOf(id, layer0) }));
  const unmet = universal.filter(u => u.status !== 'done');
  const lines = WAVE1.map(id => ({ id, sl: SERVICE_LINES.find(s => s.id === id), status: lineStatus(id, serviceState, layer0) }));
  const live = lines.filter(l => l.status.status === 'GO').length;
  if (unmet.length) return { phase: 'clear-spine', universal, unmet, launch: WAVE1, lines, live };
  if (live < WAVE1.length) return { phase: 'launch-wave1', universal, unmet: [], launch: WAVE1, lines, live };
  return { phase: 'scale', universal, unmet: [], launch: WAVE1, lines, live };
}

// ---- derived counters ------------------------------------------------------
export function tasksLive(tasks: any[]) { return (tasks || []).filter(t => t.status === 'in_progress').length; }
export function committedCapital(checklist: any, items?: any[]) {
  items = items || CRITICAL_PATH_14;
  checklist = checklist || {};
  return items.reduce((s, p, i) => s + (checklist[`cp14_${i}`] ? (p.cost || 0) : 0), 0);
}

// ---- DRIVER-BASED FINANCIAL MODEL ------------------------------------------
export function lineMonthly(d: any) {
  const effRev = d.payerMixPct * d.payerRate * d.paApprovalPct + (1 - d.payerMixPct) * d.cashRate;
  return { effRev, monthly: d.volume * effRev };
}
export function financials(drivers?: any) {
  drivers = drivers || FIN_DRIVERS;
  const lines = Object.keys(drivers).map(id => {
    const d = drivers[id];
    const { effRev, monthly } = lineMonthly(d);
    const gm = 1 - d.directCostPct;
    return { id, effRev, monthly, annual: monthly * 12, gm, labor: d.fte * d.fteAnnualCost };
  });
  const m12Monthly  = lines.reduce((s, l) => s + l.monthly, 0);
  const grossDollars = lines.reduce((s, l) => s + l.monthly * l.gm, 0);
  const annualLabor = lines.reduce((s, l) => s + l.labor, 0);
  return {
    lines,
    byId: Object.fromEntries(lines.map(l => [l.id, l])),
    m12Monthly,
    annualized: m12Monthly * 12,
    blendedGM: m12Monthly > 0 ? grossDollars / m12Monthly : 0,
    annualLabor
  };
}

// ---- WEEKLY SNAPSHOT / CHANGELOG (business-ops metrics, zero PHI) -----------
export function isoWeek(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((+date - +yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
export function snapshotMetrics(s?: any) {
  s = s || {};
  const checklist = s.checklist || {}, finModel = s.finModel || FIN_DRIVERS;
  const serviceState = s.serviceState || {}, layer0 = s.layer0 || {}, decisions = s.decisions || {};
  const fin = financials(finModel);
  const lineStatuses: Record<string, any> = {}; let linesGo = 0, linesBlocked = 0;
  SERVICE_LINES.forEach(sl => { const st = lineStatus(sl.id, serviceState, layer0).status; lineStatuses[sl.id] = st; st === 'GO' ? linesGo++ : linesBlocked++; });
  const l0Statuses: Record<string, any> = {}; let l0Cleared = 0;
  LAYER0.forEach(g => { const st = l0StatusOf(g.id, layer0); l0Statuses[g.id] = st; if (st === 'done') l0Cleared++; });
  const cp14 = CRITICAL_PATH_14;
  const checklistDone = cp14.filter((_, i) => checklist[`cp14_${i}`]).length;
  const od = OPEN_DECISIONS;
  const decisionsResolved = Object.keys(decisions).length;
  return {
    committedCapital: committedCapital(checklist),
    m12Monthly: fin.m12Monthly, blendedGM: fin.blendedGM, annualLabor: fin.annualLabor,
    linesGo, linesBlocked, lineStatuses,
    l0Cleared, l0Total: LAYER0.length, l0Statuses,
    checklistDone, checklistTotal: cp14.length, checklistPct: cp14.length ? (checklistDone / cp14.length) * 100 : 0,
    decisionsResolved, decisionsPending: Math.max(0, od.length - decisionsResolved)
  };
}
export function makeSnapshot(state: any, auto?: boolean) {
  const now = new Date();
  return { id: `snap_${now.getTime()}`, ts: now.toISOString(), isoWeek: isoWeek(now), auto: !!auto, metrics: snapshotMetrics(state) };
}

// ===========================================================================
// TASK FACTORIES (Phase 3) — build operational Task objects from the constraint
// graph. Pure: callers persist the result; nothing here flips a gate. Phase 5
// wires these into the UI creation flows.
// ===========================================================================
let _taskSeq = 0;
export function makeTaskId() { return `task_${Date.now()}_${_taskSeq++}`; }

export function taskFromCriticalPath(item: any, index: number): Task {
  return {
    id: makeTaskId(),
    title: item.action,
    owner: item.owner || 'Cole',
    status: 'in_progress',
    source: `critical path · ${item.day}`,
    created: Date.now(),
    cost: item.cost || 0,
    severity: 'high',
    dependencyIds: [],
    metadata: { cpIndex: index },
  } as Task;
}

export function taskFromBlockingRisk(line: any, riskIdx: number): Task {
  const risk = (line.blockingRisks && line.blockingRisks[riskIdx]) || `risk ${riskIdx}`;
  const gate = (GATES[line.id] || []).find(g => g.riskIdx === riskIdx);
  return {
    id: makeTaskId(),
    title: `Resolve blocking risk: ${risk}`,
    owner: 'Compliance/Clinical',
    status: 'in_progress',
    source: `${line.short} blocking risk`,
    created: Date.now(),
    wave: line.wave,
    severity: 'high',
    linkedLineId: line.id,
    linkedGateId: gate ? gate.id : undefined,
  } as Task;
}

export function taskFromDecision(decision: any, choice?: string): Task {
  const sev: TaskSeverity = decision.wave === 1 ? 'high' : 'medium';
  return {
    id: makeTaskId(),
    title: `Decision: ${decision.q}`,
    owner: 'Cole',
    status: 'in_progress',
    source: `decision ${decision.id}${choice ? ` · ${choice}` : ''}`,
    created: Date.now(),
    wave: decision.wave,
    severity: sev,
    linkedDecisionId: decision.id,
    linkedGateId: DECISION_GATE_MAP[decision.id],
  } as Task;
}
