import type { CriticalPathItem } from '../types/domain';

export const CRITICAL_PATH_14: CriticalPathItem[] = [
  { day:'Day 1', action:'Cole confirms go/no-go on all three Wave 1 lines', owner:'Cole', cost:0 },
  { day:'Day 1-2', action:'Execute GeneSight + Tempus BAAs', owner:'Operations', cost:0 },
  { day:'Day 2-3', action:'Order PGx supplies (Zebra scanner, swabs, lockable cabinet)', owner:'Procurement', cost:3200 },
  { day:'Day 3-5', action:'PGx SOPs 001-005 drafted; staff trained', owner:'Clinical', cost:0 },
  { day:'Day 5-7', action:'First PGx patient swabbed', owner:'Clinical', cost:0 },
  { day:'Day 3-5', action:'Submit REMS Inpatient Healthcare Setting enrollment + KYC', owner:'Compliance', cost:0 },
  { day:'Day 5-7', action:'File DHCS plan-of-operation amendment', owner:'Compliance/Legal', cost:0 },
  { day:'Day 7-10', action:'Verify Dr. Sanchez/Tawfique DEA addresses Neurish Wellness', owner:'Medical Director', cost:0 },
  { day:'Day 7-14', action:'Obtain MagVenture quote; negotiate financing terms', owner:'Procurement', cost:0 },
  { day:'Day 10-14', action:'Hire TMS technician (job posting, interview, offer)', owner:'HR', cost:0 },
  { day:'Day 14', action:'PGx fully operational + REMS submitted + TMS vendor selected', owner:'All', cost:3400 }
];
