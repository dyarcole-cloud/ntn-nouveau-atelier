import type { Decision } from '../types/domain';

export const OPEN_DECISIONS: Decision[] = [
  // Wave 1 platform-level
  { id:'d1', wave:1, q:'Approve corrected PGx revenue model and revised capital ask?', impact:'Budget reallocation', defaultAns:'Yes — validator-confirmed higher rates', category:'Strategic' },
  { id:'d2', wave:1, q:'Confirm POS 11 structure for TMS (separate PMC/MSO) vs. within Neurish?', impact:'MDR obligations, reimbursement rates, legal structure', defaultAns:'POS 11 standalone (cleanest)', category:'Legal' },
  { id:'d3', wave:1, q:'Authorize $15K multi-purpose build-out for Spravato suite (Ketamine/SGB-ready)?', impact:'Wave 2 capital savings ($40K)', defaultAns:'Yes — saves $40K later', category:'Capital' },
  { id:'d4', wave:1, q:'Select PGx primary lab partner: GeneSight, Tempus, or dual-track?', impact:'Workflow, integration cost, TAT', defaultAns:'GeneSight primary + Tempus backup', category:'Vendor' },
  { id:'d5', wave:1, q:'Select TMS device: MagVenture (cost) vs. BrainsWay (clinical)?', impact:'$60K-$95K capital delta', defaultAns:'MagVenture (fastest ROI)', category:'Vendor' },
  { id:'d6', wave:1, q:'Authorize cross-training RN for multi-service-line coverage?', impact:'$85K/year labor savings', defaultAns:'Yes — start with 1 RN pilot', category:'Staffing' },
  { id:'d7', wave:1, q:'Set Spravato PA failed-antidepressant threshold at 2 or 3?', impact:'UHC/Optum denial risk', defaultAns:'Document 3 for all payors', category:'Clinical' },
  { id:'d8', wave:1, q:'Buy-and-bill or AOB for Spravato drug procurement?', impact:'Clinic license, margin, launch speed', defaultAns:'AOB for speed → buy-and-bill at Month 6', category:'Strategic' },
  { id:'d9', wave:1, q:'In-house supervising psychiatrist (0.3-0.5 FTE) or contracted oversight?', impact:'FTE cost, credentialing timeline', defaultAns:'Contracted for speed; hire in-house after Month 6', category:'Staffing' },
  { id:'d10', wave:1, q:'POS 55 vs. POS 11 for Spravato billing?', impact:'[LEGAL REVIEW] Stark/AKS exposure', defaultAns:'Default POS 11 until counsel opinion', category:'Legal' },
  { id:'d11', wave:1, q:'Adopt 1:8 PA supervision ratio (effective 1/1/2026) or remain at 1:4?', impact:'Operational flexibility vs. risk management', defaultAns:'1:8 — operational flexibility', category:'Staffing' },
  // Wave 2
  { id:'d12', wave:2, q:'Authorize ART as first Wave 2 launch (over original ketamine-first plan)?', impact:'Sequencing, cash flow', defaultAns:'Yes — lowest risk, fastest revenue', category:'Strategic' },
  { id:'d13', wave:2, q:'Package "PTSD Accelerated Protocol" (SGB + ART) at $2,950?', impact:'Per-patient revenue, differentiation', defaultAns:'Yes', category:'Pricing' },
  { id:'d14', wave:2, q:'Hire pre-certified BCIA technician or train existing LMFT?', impact:'Neurofeedback launch speed', defaultAns:'Hire pre-certified', category:'Staffing' },
  { id:'d15', wave:2, q:'Contract anesthesiologist per-procedure or seek employed MD?', impact:'Ketamine cost structure', defaultAns:'Per-procedure initially', category:'Staffing' },
  { id:'d16', wave:2, q:'Pursue VA Community Care enrollment for SGB?', impact:'Volume, revenue mix', defaultAns:'Yes — 30% volume target', category:'Strategic' },
  { id:'d17', wave:2, q:'Add IM ketamine route at Month 6?', impact:'Patient access, capital', defaultAns:'Yes', category:'Clinical' },
  // Wave 3
  { id:'d18', wave:3, q:'Approve total $773K realistic capital ask for full platform?', impact:'Phased over 8 months', defaultAns:'Yes', category:'Strategic' },
  { id:'d19', wave:3, q:'Set peptide regulatory monitoring as weekly (first 6 months)?', impact:'🔴 Critical window', defaultAns:'Yes', category:'Compliance' },
  { id:'d20', wave:3, q:'Healthcare counsel retainer for NAD+/peptide marketing review?', impact:'$5K/month retainer', defaultAns:'Yes', category:'Legal' },
  { id:'d21', wave:3, q:'UHMS accreditation for HBOT?', impact:'Pursue at Month 6', defaultAns:'Yes', category:'Compliance' },
  { id:'d22', wave:3, q:'"NTN Longevity" sub-brand for Tier 3 services?', impact:'Differentiates from psychiatric core', defaultAns:'Yes', category:'Brand' },
  { id:'d23', wave:3, q:'Cap at 10 lines or add 11th/12th?', impact:'Focus discipline', defaultAns:'Cap at 10 — execute these before expanding', category:'Strategic' },
];

// Suggested legal-spine gate each decision most directly informs. Drives the
// pre-selected gate in the Decisions "Clears gate?" control (suggest + confirm
// only — resolving a decision never auto-flips a gate). Kept to genuine 1:1
// correspondences; weak links are left out so the suggestion is trustworthy.
//   d2  entity     — TMS PMC/MSO vs in-Neurish IS the entity/PC-structure call
//   d8  dea        — buy-and-bill Spravato requires per-site DEA registration
//   d9  cpom       — in-house vs contracted physician oversight is the CPOM call
//   d10 pos55      — POS 55 vs 11 for Spravato billing
export const DECISION_GATE_MAP: Record<string, string> = { d2:'entity', d8:'dea', d9:'cpom', d10:'pos55' };
