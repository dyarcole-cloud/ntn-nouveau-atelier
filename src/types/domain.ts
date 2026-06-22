// Domain types for NTN Nouveau. Shapes mirror the original artifact's data
// verbatim. Known fields are typed for documentation + safety; an index
// signature tolerates any extra fields present in the ported data (so the
// data extraction can never fail on a field this file didn't anticipate).

export interface ServiceLine {
  id: string;
  name: string;
  short: string;
  wave: number;
  order: number;
  timeline: string;
  launchCapital: number;
  m12Revenue: number;
  m12RevenueOrig?: number;
  fteTarget: number;
  grossMargin: string;
  risk: string;
  regComplexity: string;
  color: string;
  accent: string;
  payorModel: string;
  evidence: number;
  vbcAlignment: number;
  reasoning: string;
  blockingRisks: string[];
  cptCodes: string[];
  keyDecisions: string[];
  bottomLine: string;
  [key: string]: any;
}

export interface Wave {
  num: number;
  name: string;
  tagline: string;
  capital: number;
  m12Revenue: number;
  fte: number;
  color: string;
  [key: string]: any;
}

export interface ClinicalReference {
  slId: string;
  name: string;
  tier: string;
  tierColor: string;
  classification: string;
  mechanism: string;
  evidence: string[];
  synergies: string;
  contraindications: string;
  [key: string]: any;
}

export interface Decision {
  id: string;
  wave: number;
  q: string;
  impact: string;
  defaultAns: string;
  category: string;
  [key: string]: any;
}

export interface CriticalPathItem {
  day: string;
  action: string;
  owner: string;
  cost: number;
  [key: string]: any;
}

export interface StaffingRow {
  role: string;
  total: number;
  [key: string]: any;
}

export interface CapabilityCell {
  id: string;
  label: string;
  owner: string;
  maturity: string;
  gates?: { line: string; gateId: string }[];
  blocker?: string;
  [key: string]: any;
}

export interface CapabilityLayer {
  n: number;
  name: string;
  accent: string;
  cells: CapabilityCell[];
  [key: string]: any;
}

export interface CapitalMonth {
  month: number;
  w1: number;
  w2: number;
  w3: number;
  [key: string]: any;
}

export interface RevenuePoint {
  month: number;
  conservative: number;
  target: number;
  stretch: number;
  [key: string]: any;
}

// ── Engine-coupled types (data/engine extracted in Phase 3) ──────────────────

export interface Layer0Gate {
  id: string;
  name: string;
  owner: string;
  dependsOn: string;
  status?: string;
  [key: string]: any;
}

export interface FinancialDriver {
  payerRate: number;
  cashRate: number;
  payerMixPct: number;
  volume: number;
  paApprovalPct: number;
  rampMonths: number;
  fte: number;
  fteAnnualCost: number;
  directCostPct: number;
  [key: string]: any;
}

export interface FinancialLineResult {
  effRev: number;
  monthly: number;
  [key: string]: any;
}

export interface Snapshot {
  id: string;
  ts: string;
  isoWeek: string;
  auto: boolean;
  metrics: Record<string, any>;
  [key: string]: any;
}

// ── Task (extended operational object — Phase 5) ─────────────────────────────

export type TaskSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  owner: string;
  status: string;
  source: string;
  created: number | string;
  completedAt?: number | string;
  wave?: number;
  cost?: number;
  severity?: TaskSeverity;
  dueDate?: string;
  linkedLineId?: string;
  linkedGateId?: string;
  linkedDecisionId?: string;
  evidenceRefIds?: string[];
  dependencyIds?: string[];
  [key: string]: any;
}
