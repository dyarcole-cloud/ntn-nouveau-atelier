// Driver-based financial model (bottoms-up; replaces the old hardcoded headline).
// Seeded so the lines sum to the dossier total ($820,540/mo, $9.85M, 52.3% GM,
// $1.74M labor) INCLUDING validation corrections (PGx 81226 ≈ $428, not $85-150).
// rate = per-encounter; effRev = mix·payer·PA + (1-mix)·cash; monthly = vol·effRev.
// gm = 1 - directCostPct (COGS only; labor tracked separately). rampMonths shapes
// the trajectory, not the fully-ramped M12 figure. (Extracted verbatim from engine.)
//
// TODO(source-review): per-encounter rates, payer mix, PA-approval %, and volumes
// are operating assumptions — flag in the Phase-6 source registry as needs-review.

import type { FinancialDriver } from '../types/domain';

export const FIN_DRIVERS: Record<string, FinancialDriver> = {
  pgx:      { payerRate:428,  cashRate:349, payerMixPct:0.55, volume:169.0,  paApprovalPct:0.70, rampMonths:2, fte:0.75, fteAnnualCost:96400, directCostPct:0.80 },
  spravato: { payerRate:1100, cashRate:900, payerMixPct:0.95, volume:349.1,  paApprovalPct:0.75, rampMonths:3, fte:3.7,  fteAnnualCost:96400, directCostPct:0.53 },
  tms:      { payerRate:300,  cashRate:250, payerMixPct:0.92, volume:1291.5, paApprovalPct:0.80, rampMonths:4, fte:2.9,  fteAnnualCost:96400, directCostPct:0.40 },
  art:      { payerRate:150,  cashRate:120, payerMixPct:0.85, volume:126.6,  paApprovalPct:0.85, rampMonths:2, fte:1.35, fteAnnualCost:96400, directCostPct:0.30 },
  sgb:      { payerRate:900,  cashRate:950, payerMixPct:0.40, volume:19.5,   paApprovalPct:0.70, rampMonths:2, fte:0.55, fteAnnualCost:96400, directCostPct:0.45 },
  ketamine: { payerRate:600,  cashRate:650, payerMixPct:0.15, volume:76.8,   paApprovalPct:0.30, rampMonths:3, fte:2.5,  fteAnnualCost:96400, directCostPct:0.55 },
  neuro:    { payerRate:120,  cashRate:150, payerMixPct:0.10, volume:228.9,  paApprovalPct:0.40, rampMonths:4, fte:1.7,  fteAnnualCost:96400, directCostPct:0.40 },
  nad:      { payerRate:750,  cashRate:750, payerMixPct:0.00, volume:22.4,   paApprovalPct:1.00, rampMonths:2, fte:1.45, fteAnnualCost:96400, directCostPct:0.35 },
  peptides: { payerRate:550,  cashRate:550, payerMixPct:0.00, volume:40.91,  paApprovalPct:1.00, rampMonths:3, fte:1.55, fteAnnualCost:96400, directCostPct:0.30 },
  hbot:     { payerRate:300,  cashRate:300, payerMixPct:0.00, volume:60.0,   paApprovalPct:1.00, rampMonths:4, fte:1.65, fteAnnualCost:96400, directCostPct:0.45 }
};
