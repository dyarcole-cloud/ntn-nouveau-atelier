import type { CapabilityLayer } from '../types/domain';

export const CAPABILITY_LAYERS: CapabilityLayer[] = [
  { n:1, name:'Clinical Governance', accent:'#ff6a5c', cells:[
      { id:'sops',        label:'Clinical SOPs & protocols', owner:'Clinical',           maturity:'in-progress' },
      { id:'supervision', label:'Supervision & scope',       owner:'Medical Director',   maturity:'in-progress', gates:[{line:'neuro', gateId:'incident'}, {line:'sgb', gateId:'scope'}] },
      { id:'consent',     label:'Informed-consent suite',    owner:'Clinical',           maturity:'not-started', gates:[{line:'pgx', gateId:'consent'}] },
      { id:'pa-templates',label:'PA / medical-necessity templates', owner:'Clinical',    maturity:'in-progress', blocker:'Spravato 3-failed-AD threshold revision' }
  ]},
  { n:2, name:'Revenue Cycle', accent:'#ff3b30', cells:[
      { id:'credentialing', label:'Payer credentialing & enrollment', owner:'RCM',       maturity:'in-progress' },
      { id:'pos-billing',   label:'POS / place-of-service mapping',   owner:'RCM',       maturity:'not-started', gates:[{line:'spravato', gateId:'pos55'}, {line:'tms', gateId:'pos'}, {line:'sgb', gateId:'pos'}, {line:'ketamine', gateId:'pos55'}] },
      { id:'charge-capture',label:'Charge capture & coding',         owner:'RCM',       maturity:'not-started' },
      { id:'drug-procure',  label:'Buy-and-bill / AOB drug procurement', owner:'Pharmacy', maturity:'not-started', blocker:'Spravato drug-procurement model (d8) pending' }
  ]},
  { n:3, name:'Patient Operations', accent:'#10B981', cells:[
      { id:'scheduling', label:'Scheduling & intake',     owner:'Operations',  maturity:'in-progress' },
      { id:'kipu',       label:'Kipu / EHR integration',  owner:'Operations',  maturity:'not-started' },
      { id:'care-coord', label:'Care coordination',       owner:'Clinical',    maturity:'not-started' },
      { id:'facilities', label:'Supplies & facilities',   owner:'Procurement', maturity:'not-started', gates:[{line:'hbot', gateId:'nfpa'}] }
  ]},
  { n:4, name:'Business Intelligence', accent:'#F59E0B', cells:[
      { id:'complianceiq',label:'ComplianceIQ documentation scoring', owner:'Cole',     maturity:'in-progress' },
      { id:'mbc',         label:'Measurement-based care (MBC)',        owner:'Clinical', maturity:'not-started' },
      { id:'vbc-data',    label:'VBC / CalAIM data generation',       owner:'Strategy', maturity:'not-started' },
      { id:'dashboards',  label:'Exec dashboards & KPIs',             owner:'Cole',     maturity:'in-progress' }
  ]}
];

export const MATURITY_META: Record<string, any> = {
  'not-started': { label:'not started', color:'var(--faint)', bg:'rgba(255,255,255,0.04)', border:'var(--line-strong)' },
  'in-progress': { label:'in progress', color:'var(--amber)', bg:'rgba(245,165,36,0.10)', border:'rgba(245,165,36,0.30)' },
  'done':        { label:'done',        color:'var(--go)',    bg:'rgba(45,212,167,0.10)', border:'rgba(45,212,167,0.30)' }
};
