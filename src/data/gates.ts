// Per-line regulatory hard-gates. riskIdx points at SERVICE_LINES[id].blockingRisks[i]
// → cleared-state key `${id}_risk_${i}` in serviceState. Resolving that risk in the
// dossier clears the gate. No parallel copy. (Extracted verbatim from the engine.)

export interface LineGate {
  id: string;
  label: string;
  riskIdx: number;
}

export const GATES: Record<string, LineGate[]> = {
  pgx:      [ {id:'baa',    label:'Lab partner BAA executed',            riskIdx:0},
              {id:'order',  label:'Lab-ordering authority (MD/DO/NP/PA)', riskIdx:1},
              {id:'consent',label:'Genetic-testing informed consent',     riskIdx:2} ],
  spravato: [],   // REMS/DHCS/POS55/DEA centralized into Layer 0 (Build 5)

  tms:      [ {id:'pos',    label:'POS structure (PMC/MSO) resolved',     riskIdx:2},
              {id:'fda510k',label:'MagVenture 510(k) clearances on file', riskIdx:3} ],
  art:      [],
  sgb:      [ {id:'pos',    label:'POS 21/55 billing resolved',          riskIdx:1},   // CPoM → Layer 0 (Build 5)
              {id:'scope',  label:'MD/DO scope confirmed',               riskIdx:2} ],
  ketamine: [ {id:'anes',   label:'Contracted anesthesiologist secured', riskIdx:0},
              {id:'pos55',  label:'POS 55 billing resolved',             riskIdx:1} ],
  neuro:    [ {id:'incident',label:'"Incident to" supervision met',      riskIdx:1},
              {id:'scope',  label:'Technician scope resolved',           riskIdx:2} ],
  nad:      [ {id:'claims', label:'No-disease-claims policy enforced',   riskIdx:0},
              {id:'olympia',label:'Olympia Pharmacy contract executed',  riskIdx:1} ],
  peptides: [ {id:'fdamon', label:'FDA/PCAC weekly monitoring live',     riskIdx:0},
              {id:'pharm',  label:'503A vs 503B sourcing decided',       riskIdx:1},
              {id:'mktg',   label:'Marketing scope counsel review',      riskIdx:2} ],
  hbot:     [ {id:'nfpa',   label:'NFPA 99 compliance verified',         riskIdx:0} ]
};
