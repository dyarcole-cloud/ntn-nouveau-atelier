import type { StaffingRow } from '../types/domain';

export const STAFFING_MATRIX: StaffingRow[] = [
  { role:'Medical Director (psychiatrist)', spravato:0.25, pgx:0.10, tms:0.25, art:0.10, sgb:0.10, ketamine:0.25, neuro:0.15, nad:0.10, hbot:0.20, peptides:0.10, total:1.60 },
  { role:'NP/PA (prescribing)', spravato:0.50, pgx:0.15, tms:0.30, art:0, sgb:0, ketamine:0.30, neuro:0, nad:0.15, hbot:0, peptides:0.20, total:1.60 },
  { role:'RN', spravato:1.50, pgx:0.10, tms:1.20, art:0, sgb:0.15, ketamine:1.00, neuro:0, nad:1.00, hbot:0, peptides:1.00, total:5.95 },
  { role:'BCIA Tech / CHT Operator', spravato:0, pgx:0, tms:0, art:0, sgb:0, ketamine:0, neuro:1.00, nad:0, hbot:1.00, peptides:0, total:2.00 },
  { role:'LMFT/LCSW (therapy)', spravato:0, pgx:0, tms:0, art:1.00, sgb:0, ketamine:0, neuro:0.30, nad:0, hbot:0, peptides:0, total:1.30 },
  { role:'MA / Intake Coord', spravato:0.75, pgx:0.20, tms:0.50, art:0.15, sgb:0.10, ketamine:0.50, neuro:0.15, nad:0.20, hbot:0.30, peptides:0.25, total:3.10 },
  { role:'Billing / Auth Specialist', spravato:0.50, pgx:0.10, tms:0.50, art:0.10, sgb:0.10, ketamine:0.20, neuro:0.10, nad:0, hbot:0, peptides:0, total:1.60 },
  { role:'Data Analyst (VBC/DRS)', spravato:0.20, pgx:0.10, tms:0.15, art:0, sgb:0, ketamine:0, neuro:0, nad:0, hbot:0, peptides:0, total:0.45 },
  { role:'Safety Director (HBOT)', spravato:0, pgx:0, tms:0, art:0, sgb:0, ketamine:0, neuro:0, nad:0, hbot:0.15, peptides:0, total:0.15 }
];
