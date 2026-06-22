// Layer 0 · legal & entity spine — shared gates that gate every service line.
// First-class gate objects (name, owner, dependsOn); status lives in the `layer0`
// store. STATUS TRACKING ONLY — records whether a sign-off exists, asserts nothing
// about compliance and gives no legal advice. (Extracted verbatim from the engine.)

import type { Layer0Gate } from '../types/domain';

export const LAYER0: Layer0Gate[] = [
  { id:'entity',      name:'Entity / PC structure + MSO/MSA agreement',          owner:'Healthcare Attorney', dependsOn:'Healthcare attorney' },
  { id:'cpom',        name:'Corporate-practice-of-medicine compliance opinion',  owner:'Healthcare Attorney', dependsOn:'Healthcare counsel' },
  { id:'dea',         name:'Per-site DEA registration',                          owner:'Medical Director',    dependsOn:'DEA' },
  { id:'rems',        name:'REMS certification (Inpatient Healthcare Setting enrollment)', owner:'Compliance', dependsOn:'Janssen REMS' },
  { id:'dhcs',        name:'DHCS plan-of-operation amendment',                   owner:'Compliance/Legal',    dependsOn:'CMS / DHCS' },
  { id:'pos55',       name:'POS 55 billing opinion',                             owner:'CA Healthcare Counsel', dependsOn:'Healthcare counsel' },
  { id:'malpractice', name:'Malpractice / professional liability coverage',      owner:'Operations',          dependsOn:'Insurer' }
];

// Each service line → the Layer 0 gates it requires (seeded from the dossiers).
export const LINE_L0_DEPS: Record<string, string[]> = {
  pgx:      ['entity','malpractice'],
  spravato: ['entity','malpractice','rems','dhcs','dea','pos55'],
  tms:      ['entity','malpractice'],
  art:      ['entity','malpractice'],
  sgb:      ['entity','malpractice','cpom'],
  ketamine: ['entity','malpractice','dea','cpom'],
  neuro:    ['entity','malpractice'],
  nad:      ['entity','malpractice'],
  peptides: ['entity','malpractice'],
  hbot:     ['entity','malpractice']
};
