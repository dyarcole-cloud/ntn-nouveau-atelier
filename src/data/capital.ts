import type { CapitalMonth, RevenuePoint } from '../types/domain';

export const CAPITAL_BY_MONTH: CapitalMonth[] = [
  { month:1, w1:25000, w2:0, w3:0 },
  { month:2, w1:110000, w2:0, w3:0 },
  { month:3, w1:185000, w2:15000, w3:0 },
  { month:4, w1:95000, w2:22000, w3:15000 },
  { month:5, w1:53000, w2:20000, w3:20000 },
  { month:6, w1:0, w2:12000, w3:30000 },
  { month:7, w1:0, w2:7950, w3:40000 },
  { month:8, w1:0, w2:0, w3:45000 },
  { month:9, w1:0, w2:0, w3:78000 }
];

export const REVENUE_TRAJECTORY: RevenuePoint[] = [
  { month:3, conservative:107000, target:175000, stretch:295000 },
  { month:6, conservative:240000, target:381000, stretch:585000 },
  { month:9, conservative:380000, target:580000, stretch:880000 },
  { month:12, conservative:534000, target:820000, stretch:1211000 }
];
