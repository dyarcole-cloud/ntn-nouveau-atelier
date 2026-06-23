// SOURCE REGISTRY — governance over the platform's volatile clinical / regulatory
// / financial claims. Every dated statute, payer rule, device clearance, and
// model assumption is recorded here with a review owner and a status. NONE are
// marked `verified` and NO urls are invented — they are operating assertions
// awaiting Cole's clinical/legal/finance review. This makes the trust state
// VISIBLE; it does not change any number or claim.

import type { SourceRef, SourceStatus } from '../types/sources';

export const SOURCE_REGISTRY: SourceRef[] = [
  // ── Regulatory / statutory ────────────────────────────────────────────────
  { id: 'reg:ryan-haight', category: 'regulatory', status: 'needs-review',
    title: 'Ryan Haight in-person requirement returns for ketamine telehealth',
    date: 'Jan 1 2027', reviewOwner: 'Healthcare Counsel', reviewCadence: 'quarterly',
    notes: 'Confirm the DEA telemedicine final rule effective date before relying on a hard 1/1/2027 snap-back.' },
  { id: 'reg:cigna-pa', category: 'regulatory', status: 'needs-review',
    title: 'Cigna eliminated prior authorization for TMS',
    date: '3/6/2026', reviewOwner: 'Billing / UR', reviewCadence: 'monthly',
    notes: 'Payer PA policies change frequently — re-confirm against the current Cigna medical policy.' },
  { id: 'reg:ab1501', category: 'regulatory', status: 'needs-review',
    title: 'CA AB 1501 — PA supervision ratio 1:4 → 1:8',
    date: '1/1/2026', reviewOwner: 'Compliance', reviewCadence: 'annual',
    notes: 'Verify enacted text + effective date and any board guidance before changing supervision protocols.' },
  { id: 'reg:s0013-j0013', category: 'regulatory', status: 'needs-review',
    title: 'Spravato HCPCS S0013 → J0013',
    date: '1/1/2026', reviewOwner: 'Billing / UR', reviewCadence: 'quarterly',
    notes: 'Confirm the active code + payer acceptance for the service dates you bill.' },
  { id: 'reg:fda-esketamine-mono', category: 'regulatory', status: 'needs-review',
    title: '2025 FDA esketamine monotherapy approval for TRD',
    date: '2025', reviewOwner: 'Medical Director', reviewCadence: 'annual',
    notes: 'Verify the approved indication + label language before clinical or marketing use.' },
  { id: 'reg:magventure-510k', category: 'regulatory', status: 'needs-review',
    title: 'MagVenture 510(k) clearances for credentialing',
    reviewOwner: 'Compliance', reviewCadence: 'one-time',
    notes: 'K160280 was previously cited in error. Verify the cleared K-numbers on the current device label before credentialing packets go out.' },
  { id: 'reg:pos55', category: 'regulatory', status: 'needs-review',
    title: 'POS 55 billing opinion (Spravato / ketamine setting)',
    reviewOwner: 'CA Healthcare Counsel', reviewCadence: 'one-time',
    notes: 'Janssen guides list POS 11/22/53. Counsel opinion required before relying on POS 55; default POS 11 until confirmed.' },
  { id: 'reg:spravato-pa', category: 'regulatory', status: 'needs-review',
    title: 'UHC/Optum 3-failed-AD PA threshold (2 classes, ≥8 wks)',
    reviewOwner: 'Billing / UR', reviewCadence: 'quarterly',
    notes: 'Re-confirm the failed-trial threshold per payer before building PA templates.' },
  { id: 'reg:hhs-peptide', category: 'regulatory', status: 'needs-review',
    title: 'Feb 2026 HHS peptide reclassification window',
    date: 'Feb 2026', reviewOwner: 'Healthcare Counsel', reviewCadence: 'monthly',
    notes: 'Time-limited and uncertain — verify status before procuring or marketing peptides.' },

  // ── Financial model assumptions ───────────────────────────────────────────
  { id: 'fin:model', category: 'financial', status: 'needs-review',
    title: 'Driver financial model ($820.5K/mo · 52% GM · $1.74M labor)',
    reviewOwner: 'Cole / Finance', reviewCadence: 'quarterly',
    notes: 'Per-encounter rates, payer mix, PA-approval %, and volumes are operating assumptions — not contracted figures.' },
  { id: 'fin:pgx-rate', category: 'financial', status: 'needs-review',
    title: 'PGx CLFS reimbursement (81226 ≈ $406–451)',
    reviewOwner: 'Billing / UR', reviewCadence: 'annual',
    notes: 'Lab fee schedule rates move annually and vary by MAC; re-price before relying on the corrected M12 figure.' },
];

const _byId: Record<string, SourceRef> = Object.fromEntries(SOURCE_REGISTRY.map(s => [s.id, s]));
export function getSource(id: string): SourceRef | undefined { return _byId[id]; }
export function needsReview(): SourceRef[] { return SOURCE_REGISTRY.filter(s => s.status === 'needs-review'); }
export function byCategory(cat: SourceRef['category']): SourceRef[] { return SOURCE_REGISTRY.filter(s => s.category === cat); }

// ── Stateful review overlay ──────────────────────────────────────────────────
// The registry data above is the immutable baseline (no claim is ever asserted
// verified in code). A `reviews` map (persisted, local-only) lets Cole record
// that HE has reviewed a claim on his own clock — it overrides the displayed
// status without rewriting the underlying assertion. Shape:
//   reviews[id] = { status, verifiedAt?, verifiedBy?, note? }
export interface SourceReview { status: SourceStatus; verifiedAt?: string; verifiedBy?: string; note?: string; }

// Effective status = Cole's recorded review if present, else the baseline.
// `base` lets dynamic (clinical:slId) sources, which aren't in the registry,
// pass their own baseline status.
export function reviewStatusOf(id: string, reviews?: Record<string, SourceReview>, base: SourceStatus = 'needs-review'): SourceStatus {
  return (reviews && reviews[id] && reviews[id].status) || (_byId[id] && _byId[id].status) || base;
}
export function reviewOf(id: string, reviews?: Record<string, SourceReview>): SourceReview | undefined {
  return reviews ? reviews[id] : undefined;
}
// Count of registry claims still flagged needs-review, honoring the overlay.
export function countNeedsReview(reviews?: Record<string, SourceReview>): number {
  return SOURCE_REGISTRY.filter(s => reviewStatusOf(s.id, reviews, s.status) === 'needs-review').length;
}

// Clinical evidence governance: each line's evidence summary cites named trials
// but has not been independently re-verified in-app. Synthesized (not fabricated)
// so every clinical card can show an honest status without inventing a citation.
export function clinicalSource(slId: string, name?: string): SourceRef {
  return {
    id: `clinical:${slId}`,
    category: 'clinical',
    lineId: slId,
    status: 'needs-review',
    title: `${name || slId} — evidence summary`,
    reviewOwner: 'Medical Director',
    reviewCadence: 'annual',
    notes: 'Cites named trials; verify against primary sources before external/clinical use.',
  };
}
