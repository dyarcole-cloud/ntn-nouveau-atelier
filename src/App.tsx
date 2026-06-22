import React from 'react';
// ── Phase 2: extracted typed data modules ──
import { SERVICE_LINES, GANTT_DATA } from './data/serviceLines';
import { WAVES } from './data/waves';
import { CLINICAL_DATA } from './data/clinicalReference';
import { OPEN_DECISIONS, DECISION_GATE_MAP } from './data/decisions';
import { CRITICAL_PATH_14 } from './data/criticalPath';
import { STAFFING_MATRIX } from './data/staffing';
import { CAPABILITY_LAYERS, MATURITY_META } from './data/capabilityMap';
import { CAPITAL_BY_MONTH, REVENUE_TRAJECTORY } from './data/capital';
import * as engine from './lib/engine';
import * as storage from './lib/storage';
import { usePersistedState } from './lib/storage';
import WayThroughPanel from './components/WayThroughPanel';
import SourceBadge from './components/SourceBadge';
import SourceRegistryView from './components/SourceRegistryView';
import { clinicalSource, getSource } from './data/sourceRegistry';
// NOTE: the body below keeps its original `const { useState, ... } = React`
// destructure (faithful port). React default import satisfies it.


const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ===========================================================================
// NTN.engine — assembled from the extracted pure engine (src/lib/engine.ts) and
// the storage layer (src/lib/storage.ts). Components read it via NTN.engine.*;
// the exposed surface is identical to the original IIFE. usePersistedState is
// imported directly (it talks to storage, not through this object).
// ===========================================================================
window.NTN = window.NTN || {};
NTN.engine = {
  PREFIX: storage.STORAGE_PREFIX,
  SCHEMA_VERSION: storage.SCHEMA_VERSION,
  KEYS: storage.KEYS,
  get: storage.get,
  set: storage.set,
  remove: storage.remove,
  useAdapter: storage.useAdapter,
  currentAdapter: storage.currentAdapter,
  currentSync: storage.currentSync,
  subscribeSync: storage.subscribeSync,
  exportAll: storage.exportAll,
  importAll: storage.importAll,
  GATES: engine.GATES,
  gateStatus: engine.gateStatus,
  LAYER0: engine.LAYER0,
  LINE_L0_DEPS: engine.LINE_L0_DEPS,
  l0StatusOf: engine.l0StatusOf,
  unmetL0: engine.unmetL0,
  lineStatus: engine.lineStatus,
  criticalPath: engine.criticalPath,
  wayThrough: engine.wayThrough,
  tasksLive: engine.tasksLive,
  committedCapital: engine.committedCapital,
  FIN_DRIVERS: engine.FIN_DRIVERS,
  lineMonthly: engine.lineMonthly,
  financials: engine.financials,
  isoWeek: engine.isoWeek,
  snapshotMetrics: engine.snapshotMetrics,
  makeSnapshot: engine.makeSnapshot,
  taskFromCriticalPath: engine.taskFromCriticalPath,
  taskFromBlockingRisk: engine.taskFromBlockingRisk,
  taskFromDecision: engine.taskFromDecision,
};

// ===========================================================================
// PLATFORM DATA — derived from NTN_Nouveau_COMPLETE_PLATFORM.docx
// ===========================================================================



// Clinical Reference — mechanism / evidence / synergies / contraindications for each of the 10 lines

// 14-day critical path


// Proposed decision→gate suggestions (Cole confirms via 1-click; nothing flips silently). Editable per-card.
const GATE_SHORT = { entity:'Entity', cpom:'CPOM', dea:'DEA', rems:'REMS', dhcs:'DHCS', pos55:'POS 55', malpractice:'Malpractice' };

// Capital deployment by month (Wave 1 + 2 + 3)


// Gantt phases for each service line

// Staffing matrix

// ===========================================================================
// COMPONENTS
// ===========================================================================

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-11 h-11 rounded-xl flex items-center justify-center" style={{
        background: 'radial-gradient(circle at 35% 30%, #16161E 0%, #0A0A0F 100%)',
        border: '1px solid #2A2A35',
        boxShadow: '0 0 0 1px var(--glow-soft), 0 0 24px -8px var(--glow)'
      }}>
        <span className="serif text-3xl gradient-text leading-none" style={{transform:'translateY(1px)'}}>n</span>
      </div>
      <div>
        <div className="serif text-[22px] tracking-tight leading-none" style={{color:'var(--ink-bright)'}}>NTN Nouveau</div>
        <div className="text-[10px] uppercase tracking-[0.28em] font-semibold mt-1.5 mono" style={{color:'var(--data)'}}>Live Execution OS</div>
      </div>
    </div>
  );
}

// Top KPI strip — flowing 6-box metric ticker (equal weight, auto-scroll, pause on hover)
function KPIStrip({ checklistProgress, taskStats, decisionStats, fin }) {
  const items = [
    { k:'Capital Ask',   v:'$773K',                                          s:'phased · 8mo' },
    { k:'M12 Revenue',   v:`$${(fin.m12Monthly/1000).toFixed(1)}K/mo`,       s:`$${(fin.annualized/1e6).toFixed(2)}M/yr · ${(fin.blendedGM*100).toFixed(0)}% GM`, ember:true },
    { k:'Service Lines', v:'10',                                             s:'across 3 waves' },
    { k:'Total FTE',     v:'18.05',                                          s:'$1.74M labor/yr' },
    { k:'Checklist',     v:`${checklistProgress.toFixed(0)}%`,               s:`${taskStats.complete}/${taskStats.total} tasks` },
    { k:'Decisions',     v:decisionStats.pending,                           s:`${decisionStats.resolved} resolved` }
  ];
  const loop = items.concat(items); // duplicate set → seamless -50% loop
  return (
    <div className="kpi-marquee">
      <div className="kpi-track">
        {loop.map((it, i) => (
          <div key={i} className="kpi-box">
            <span className="k">{it.k}</span>
            <span className={it.ember ? 'v ember' : 'v'}>{it.v}</span>
            <span className="s">{it.s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// COMMAND BRIEF TAB
// ============================================================
const LINEAR = {
  project: 'https://linear.app/crush-coley/project/ntn-nouveau-669b28470933',
  ids: { pgx: 'NTN-42', spravato: 'NTN-43', tms: 'NTN-44' },
  lines: {
    pgx: 'https://linear.app/crush-coley/issue/NTN-42/pgx-go-live-wave-1-week-2',
    spravato: 'https://linear.app/crush-coley/issue/NTN-43/spravato-go-live-wave-1-week-10-regulatory-critical-path',
    tms: 'https://linear.app/crush-coley/issue/NTN-44/tms-go-live-wave-1-week-12-14'
  }
};

function CommandBrief({ checklist, setChecklist, tasks, setTasks, serviceState, layer0, setLayer0, fin, setActiveTab, setSelection, setActiveLine }) {
  const goLines = SERVICE_LINES.filter(sl => NTN.engine.lineStatus(sl.id, serviceState, layer0).status === 'GO').length;
  const way = NTN.engine.wayThrough(layer0, serviceState);
  const markL0Done = (id) => setLayer0 && setLayer0({ ...layer0, [id]: { ...(layer0[id] || {}), status: 'done' } });
  const handle14DayCheck = (idx, action, owner, cost) => {
    const key = `cp14_${idx}`;
    const wasChecked = !!checklist[key];
    setChecklist({ ...checklist, [key]: !wasChecked });

    // If checking on, route to task manager
    if (!wasChecked) {
      const newTask = NTN.engine.taskFromCriticalPath(CRITICAL_PATH_14[idx] || { action, owner, cost, day: `Day ${idx + 1}` }, idx);
      newTask.wave = 1;
      setTasks([newTask, ...tasks]);
    }
  };

  const totalCheckedCost = NTN.engine.committedCapital(checklist);
  const checklistDone = CRITICAL_PATH_14.filter((_, i) => checklist[`cp14_${i}`]).length;
  const checklistTotal = CRITICAL_PATH_14.length;
  const pct = (checklistDone / checklistTotal) * 100;
  const next3 = CRITICAL_PATH_14.map((p, i) => ({ ...p, idx: i, checked: !!checklist[`cp14_${i}`] })).filter(p => !p.checked).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* THE WAY THROUGH — the decider. Your three lines, the spine, the long poles. */}
      <div className="onyx-card-pop p-6 md:p-8 relative overflow-hidden" style={{border:'1px solid rgba(244,63,94,0.28)'}}>
        <div className="top-accent-bar absolute top-0 left-0 right-0"/>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="eyebrow"><span style={{color: way.phase==='scale' ? 'var(--pos)' : 'var(--crit)'}}>The Way Through · Wave 1</span></div>
          <a href={LINEAR.project} target="_blank" rel="noopener" className="text-[11px] mono px-2.5 py-1 rounded-md transition hover:bg-[var(--surface)]" style={{color:'var(--dim)', border:'1px solid var(--border)'}}>tracked in Linear ↗</a>
        </div>

        <h2 className="serif text-4xl md:text-5xl leading-[1.05]" style={{color:'var(--ink-bright)'}}>Command Brief</h2>

        {way.phase === 'clear-spine' && (<>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed" style={{color:'var(--dim)'}}>PGx, Spravato, and TMS all wait on the same two sign-offs. Start them in parallel — and kick off Spravato's REMS the <span style={{color:'var(--ink-bright)'}}>same week</span>, because it's the long pole.</p>
          <div className="mt-5 space-y-2">
            {way.unmet.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-3.5 rounded-lg" style={{background:'var(--inset)', border:'1px solid rgba(244,63,94,0.25)'}}>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium" style={{color:'var(--ink-bright)'}}>{u.gate.name}</div>
                  <div className="text-[11px] mono mt-0.5" style={{color:'var(--muted)'}}>→ {u.id === 'entity' ? 'Call the healthcare attorney — PC/MSO + CPoM' : 'Bind malpractice / professional liability'} · {u.gate.owner}</div>
                </div>
                <button onClick={() => markL0Done(u.id)} className="flex-shrink-0 text-[10px] uppercase tracking-[0.12em] font-semibold mono px-3 py-1.5 rounded transition hover:opacity-85" style={{color:'#000', background:'var(--pos)'}}>mark done</button>
              </div>
            ))}
          </div>
        </>)}

        {way.phase === 'launch-wave1' && (<>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed" style={{color:'var(--dim)'}}>{way.live} of 3 live. Three workstreams, three clocks — run them in parallel, Spravato first because its reg stack is the longest.</p>
        </>)}

        {way.phase === 'scale' && (<>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed" style={{color:'var(--dim)'}}>All three billing. Don't open Wave 2 until the trigger clears — Spravato 15 active + DRS live 3mo + PGx VBC ≥1 payor.</p>
        </>)}

        {/* the three lines — always in view: status, long pole, Linear link */}
        <div className="mt-5 grid md:grid-cols-3 gap-3">
          {way.lines.map(({ id, sl, status }) => {
            const isCrit = id === 'spravato';
            const go = status.status === 'GO';
            const pole = id === 'pgx' ? 'fast dollar · Wk 2' : id === 'spravato' ? 'REGULATORY LONG POLE · Wk 10' : 'capex long pole · Wk 12–14';
            return (
              <a key={id} href={LINEAR.lines[id]} target="_blank" rel="noopener" className="block rounded-xl p-3.5 transition hover:opacity-90" style={{background:'var(--inset)', border:'1px solid var(--border)', borderLeft:`3px solid ${go ? 'var(--pos)' : (isCrit ? 'var(--crit)' : (sl ? sl.color : 'var(--border)'))}`}}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold" style={{color:'var(--ink-bright)'}}>{sl ? sl.short : id}</span>
                  <span className="text-[9px] uppercase tracking-wider mono px-1.5 py-0.5 rounded" style={go ? {color:'var(--pos)', background:'rgba(52,211,153,0.10)'} : {color:'var(--crit)', background:'rgba(244,63,94,0.10)'}}>{go ? 'GO' : `${status.unmet.length} left`}</span>
                </div>
                <div className="text-[10.5px] mono mt-1.5" style={{color: isCrit && !go ? 'var(--crit)' : 'var(--muted)'}}>{pole}</div>
                <div className="text-[10px] mono mt-1" style={{color:'var(--faint)'}}>{LINEAR.ids[id]} ↗</div>
              </a>
            );
          })}
        </div>
      </div>

      {/* LINE STATUS · ALL 10 — the cross-line driver board */}
      <div>
        <div className="section-eyebrow"><span>Line Status · All 10 · click to scope</span></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {SERVICE_LINES.map(sl => {
            const st = NTN.engine.lineStatus(sl.id, serviceState, layer0);
            const go = st.status === 'GO';
            return (
              <button key={sl.id} onClick={() => { setActiveLine && setActiveLine(sl.id); setActiveTab && setActiveTab('lines'); }}
                className="onyx-card onyx-card-interactive text-left p-3" style={{borderLeft:`3px solid ${go ? 'var(--go)' : 'var(--ember)'}`}}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background: sl.color}}/>
                  <span className="text-[9px] uppercase tracking-wider mono px-1.5 py-0.5 rounded" style={go ? {color:'var(--go)', background:'rgba(45,212,167,0.10)'} : {color:'var(--ember)', background:'var(--glow-soft)'}}>{go ? 'GO' : `${st.unmet.length} left`}</span>
                </div>
                <div className="text-[13px] font-semibold leading-tight" style={{color:'var(--ink-bright)'}}>{sl.short}</div>
                <div className="text-[10px] mono mt-1" style={{color:'var(--muted)'}}>Wave {sl.wave}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Pulse · at-a-glance status + next 3 actions */}
      <div className="onyx-card-pop p-6 md:p-7 relative overflow-hidden">
        <div className="top-accent-bar absolute top-0 left-0 right-0"/>
        <div className="grid md:grid-cols-12 gap-6">
          {/* Progress side */}
          <div className="md:col-span-4 md:hairline-r md:pr-6">
            <div className="eyebrow mb-3"><span>Live Pulse · Right Now</span></div>
            <div className="flex items-baseline gap-2">
              <div className="serif text-5xl leading-none data-num">{checklistDone}<span style={{color:'var(--muted)', fontSize:'0.5em'}}>/{checklistTotal}</span></div>
            </div>
            <div className="text-[12px] mt-1 mono" style={{color:'var(--dim)'}}>14-day critical path · {pct.toFixed(0)}% done</div>
            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{background:'var(--border)'}}>
              <div className="h-full progress-bar transition-all" style={{width:`${pct}%`, boxShadow:'0 0 12px var(--glow)'}}/>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5 pt-4 hairline-t">
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] mono" style={{color:'var(--muted)'}}>Committed</div>
                <div className="serif text-2xl leading-none mt-1 pos-text">${totalCheckedCost.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] mono" style={{color:'var(--muted)'}}>Tasks live</div>
                <div className="serif text-2xl leading-none mt-1 accent-text">{NTN.engine.tasksLive(tasks)}</div>
              </div>
            </div>
          </div>
          {/* Next 3 actions */}
          <div className="md:col-span-8">
            <div className="flex items-center justify-between mb-3">
              <div className="eyebrow"><span>Next Up · {next3.length === 0 ? 'all clear' : `top ${next3.length}`}</span></div>
              {next3.length > 0 && <span className="text-[11px] mono" style={{color:'var(--muted)'}}>tap to dispatch → Tasks</span>}
            </div>
            {next3.length === 0 ? (
              <div className="onyx-card p-6 text-center">
                <div className="serif text-2xl pos-text">All 14 days checked.</div>
                <div className="text-[12.5px] mt-2 mono" style={{color:'var(--dim)'}}>Move to Wave 1 execution proper.</div>
              </div>
            ) : (
              <div className="space-y-2">
                {next3.map((p) => (
                  <button key={p.idx} onClick={() => handle14DayCheck(p.idx, p.action, p.owner, p.cost)} className="w-full text-left onyx-card onyx-card-interactive p-3.5 flex items-start gap-3">
                    <div className="w-5 h-5 mt-0.5 rounded-md flex-shrink-0" style={{border:'1px solid var(--border-strong)', background:'transparent'}}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="chip chip-data">{p.day}</span>
                        <span className="text-[11px] mono" style={{color:'var(--muted)'}}>{p.owner}</span>
                        {p.cost > 0 && <span className="data-num text-[11px]">${p.cost.toLocaleString()}</span>}
                      </div>
                      <div className="text-[13.5px] mt-1.5" style={{color:'var(--ink-bright)'}}>{p.action}</div>
                    </div>
                    <div className="text-[12px] mono mt-1 flex-shrink-0" style={{color:'var(--data)'}}>dispatch →</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="onyx-card-pop p-8 md:p-12 relative overflow-hidden">
        <div className="top-accent-bar absolute top-0 left-0 right-0"/>
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div className="flex-1 min-w-0">
            <span className="hero-accent"/>
            <div className="eyebrow mb-4"><span>Master Orchestrator Synthesis · 2026-04-28</span></div>
            <h2 className="serif text-4xl md:text-5xl leading-[1.05]" style={{color:'var(--ink-bright)'}}>
              Three waves. Ten service lines.
            </h2>
            <p className="mt-6 max-w-2xl text-[15px] leading-[1.75]" style={{color:'var(--dim)'}}>
              Total realistic capital: <span className="data-num font-semibold">$773K</span><span className="cite" title="Master Orchestrator synth · 2026-04-28">«</span>, phased over 8 months. Target Month-12 revenue: <span className="data-num font-semibold">${(fin.m12Monthly/1000).toFixed(1)}K/mo</span> (${(fin.annualized/1e6).toFixed(2)}M annualized). Blended gross margin <span className="pos-text mono">~{(fin.blendedGM*100).toFixed(0)}%</span>. Year 2 net at steady state: <span className="data-num">$5.5M–$7.5M</span>.
            </p>
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            <div className="text-[10px] uppercase tracking-[0.24em] font-semibold mono" style={{color: goLines===SERVICE_LINES.length ? 'var(--pos)' : 'var(--warn)'}}>{goLines} of {SERVICE_LINES.length} Lines</div>
            {goLines===SERVICE_LINES.length
              ? <div className="serif text-7xl gradient-text leading-none mt-2">GO</div>
              : <div className="serif text-7xl leading-none mt-2" style={{color:'var(--warn)'}}>{goLines}<span style={{color:'var(--muted)',fontSize:'0.5em'}}>/{SERVICE_LINES.length}</span></div>}
            <div className="w-12 h-[2px] mt-3" style={{background:'linear-gradient(90deg, transparent, var(--data), var(--accent))'}}/>
          </div>
        </div>
      </div>

      {/* Section eyebrow */}
      <div className="section-eyebrow"><span>Three Waves · Sequenced · click for dossier</span></div>

      {/* Wave summary cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {WAVES.map(w => (
          <div key={w.num} onClick={() => setSelection?.({type:'wave', id: w.num})} className="onyx-card onyx-card-interactive p-5 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{background:`linear-gradient(180deg, ${w.color}, ${w.color}33)`, boxShadow:`0 0 14px ${w.color}55`}}/>
            <div className="flex items-baseline justify-between mb-3 pl-2">
              <div className="serif text-4xl leading-none" style={{color:w.color, textShadow:`0 0 24px ${w.color}55`}}>0{w.num}</div>
              <div className="chip mono" style={{color:w.color, borderColor:w.color+'55', background:w.color+'15'}}>{SERVICE_LINES.filter(s=>s.wave===w.num).length} lines</div>
            </div>
            <div className="serif text-xl leading-tight pl-2" style={{color:'var(--ink-bright)'}}>{w.name}</div>
            <div className="text-[12px] mt-1.5 pl-2" style={{color:'var(--dim)'}}>{w.tagline}</div>
            <div className="grid grid-cols-3 gap-2 mt-5 pt-4 pl-2 hairline-t">
              <div><div className="text-[9px] uppercase tracking-[0.16em] mono" style={{color:'var(--muted)'}}>Capital</div><div className="data-num text-base mt-0.5">${(w.capital/1000).toFixed(0)}K</div></div>
              <div><div className="text-[9px] uppercase tracking-[0.16em] mono" style={{color:'var(--muted)'}}>M12/mo</div><div className="data-num text-base mt-0.5">${(w.m12Revenue/1000).toFixed(0)}K</div></div>
              <div><div className="text-[9px] uppercase tracking-[0.16em] mono" style={{color:'var(--muted)'}}>FTE</div><div className="data-num text-base mt-0.5">{w.fte}</div></div>
            </div>
          </div>
        ))}
      </div>

      <div className="aurora-divider"/>

      {/* Critical 14-Day Path with live checklists */}
      <div className="section-eyebrow"><span>Execution · Live Task Routing</span></div>
      <div className="onyx-card p-6 md:p-8">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h3 className="serif text-3xl leading-tight" style={{color:'var(--ink-bright)'}}>Critical Path · Next 14 Days</h3>
            <p className="text-[12px] mt-1.5 mono" style={{color:'var(--dim)'}}>Check items → routes them into the live Task Manager</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider mono" style={{color:'var(--muted)'}}>Cost Committed</div>
            <div className="data-num text-xl font-bold mt-0.5">${totalCheckedCost.toLocaleString()}</div>
          </div>
        </div>
        <div className="space-y-1.5">
          {CRITICAL_PATH_14.map((p, i) => {
            const k = `cp14_${i}`;
            const checked = !!checklist[k];
            return (
              <label key={i} className={`flex items-start gap-3 p-2.5 rounded-md cursor-pointer transition-all border ${checked ? '' : 'hover:border-[var(--border-strong)]'}`} style={checked ? {background:'rgba(52,211,153,0.06)', borderColor:'rgba(52,211,153,0.3)'} : {background:'var(--surface)', borderColor:'var(--border)'}}>
                <button
                  onClick={() => handle14DayCheck(i, p.action, p.owner, p.cost)}
                  className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                  style={checked ? {background:'var(--pos)', border:'1px solid var(--pos)'} : {background:'transparent', border:'1px solid var(--border-strong)'}}
                >
                  {checked && <svg className="w-3 h-3 check-anim" viewBox="0 0 12 12" fill="none" style={{color:'#000'}}><path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="chip chip-data">{p.day}</span>
                    <span className="text-[11px] mono" style={{color:'var(--muted)'}}>{p.owner}</span>
                    {p.cost > 0 && <span className="data-num text-[11px]">${p.cost.toLocaleString()}</span>}
                  </div>
                  <div className="text-[13.5px] mt-1" style={{color: checked ? 'var(--muted)' : 'var(--ink)', textDecoration: checked ? 'line-through' : 'none'}}>{p.action}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="aurora-divider"/>

      {/* Validation Corrections - what changed */}
      <div className="section-eyebrow"><span>Validation · Post-Synthesis Corrections</span></div>
      <div className="onyx-card p-6 md:p-8">
        <h3 className="serif text-3xl leading-tight mb-1.5" style={{color:'var(--ink-bright)'}}>Validation Corrections Applied</h3>
        <p className="text-[12px] mb-5 mono" style={{color:'var(--dim)'}}>Where post-validation findings changed the original dossier numbers</p>
        <div className="space-y-2 text-[13px]">
          {[
            { tone:'pos',  sourceId:'fin:pgx-rate',      title:'PGx Revenue — UP 86%', body:'Medicare CLFS rates 2.5-5x higher than estimated. 81226 (CYP2D6) jumps from $85-150 to $406-451. Corrected M12 revenue: $54,400/mo (was $29,272). Break-even at 15-20 tests/mo, not 30.' },
            { tone:'warn', sourceId:'reg:spravato-pa',   title:'Spravato PA Threshold — Stricter', body:'UHC/Optum require 3 failed antidepressants from 2 different classes, each ≥8 weeks (not 2). Revise all PA templates BEFORE first submission. Document 3 for all payors.' },
            { tone:'crit', sourceId:'reg:pos55',         title:'Spravato POS 55 — Unresolved', body:'Janssen billing guides only list POS 11, 22, 53. Must obtain CA healthcare counsel opinion before launch. Default to POS 11 until confirmed.' },
            { tone:'pos',  sourceId:'reg:ab1501',        title:'TMS PA Supervision — Looser', body:'PA supervision ratio 1:4 → 1:8 effective 1/1/2026 (AB 1501). More staffing flexibility. Update org chart and supervision protocols.' },
            { tone:'warn', sourceId:'reg:magventure-510k', title:'MagVenture 510(k) — Corrected', body:'K160280 was incorrect. Use K150641, K170114, K172667, K173620, K252032, K251119 (MDD clearances) on credentialing packets.' }
          ].map((c: any, i) => {
            const color = c.tone==='pos' ? 'var(--pos)' : c.tone==='warn' ? 'var(--warn)' : 'var(--crit)';
            const bg = c.tone==='pos' ? 'rgba(52,211,153,0.06)' : c.tone==='warn' ? 'rgba(251,191,36,0.06)' : 'rgba(244,63,94,0.06)';
            const border = c.tone==='pos' ? 'rgba(52,211,153,0.25)' : c.tone==='warn' ? 'rgba(251,191,36,0.25)' : 'rgba(244,63,94,0.25)';
            return (
              <div key={i} className="p-3.5 rounded-md border" style={{background:bg, borderColor:border}}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="w-1 h-3.5 rounded-sm" style={{background:color}}/>
                  <div className="font-semibold text-[13px]" style={{color}}>{c.title}</div>
                  {c.sourceId && <SourceBadge status={(getSource(c.sourceId) || {}).status} title={(getSource(c.sourceId) || {}).notes}/>}
                </div>
                <div className="text-[12.5px] mt-1 leading-relaxed pl-3" style={{color:'var(--dim)'}}>{c.body}</div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

// ============================================================
// GANTT TAB
// ============================================================
function GanttView({ ganttState, setGanttState, activeLine, finModel, serviceState, layer0 }: any) {
  const [zoom, setZoom] = useState('platform'); // 'platform' or 'wave1'
  const monthsToShow = zoom === 'platform' ? 9 : 4;

  const monthLabel = (m) => {
    const months = ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan'];
    return months[m] || `M${m+1}`;
  };

  return (
    <div className="space-y-5">
      <div className="glass rounded-3xl p-6 ring-rose">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
          <div>
            <h3 className="serif text-3xl">Launch Gantt</h3>
            <p className="text-[13px] text-[#71717A] mt-1">{zoom === 'platform' ? 'Full 10-line platform · 8-month rollout' : 'Wave 1 · 90-day deep view'}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setZoom('wave1')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${zoom==='wave1' ? 'bg-[#ff3b30] text-white' : 'inset-bg tk-ink hover:bg-[var(--glow-soft)]'}`}>Wave 1 · 90d</button>
            <button onClick={() => setZoom('platform')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${zoom==='platform' ? 'bg-[#ff3b30] text-white' : 'inset-bg tk-ink hover:bg-[var(--glow-soft)]'}`}>Full Platform · 8mo</button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-2 mt-4">
          <div className="min-w-[700px] px-2">
            {/* Month axis */}
            <div className="flex border-b border-[#1C1C24] pb-1 mb-2">
              <div className="w-44 flex-shrink-0 text-[11px] uppercase tracking-wider text-[#71717A] font-medium">Service Line</div>
              <div className="flex-1 flex">
                {Array.from({length: monthsToShow}, (_, i) => (
                  <div key={i} className="flex-1 text-[11px] uppercase tracking-wider text-[#71717A] text-center font-medium border-l border-[#1C1C24]">{monthLabel(i)}</div>
                ))}
              </div>
            </div>
            {/* Bars */}
            <div className="space-y-1.5">
              {GANTT_DATA.filter(s => (zoom==='platform' || s.wave===1) && (!activeLine || activeLine==='all' || s.id===activeLine)).map(sl => {
                const liveStat = (serviceState && layer0 && NTN.engine.lineStatus(sl.id, serviceState, layer0).status === 'GO') ? 'active' : 'blocked';
                const manual = ganttState[sl.id]?.status;          // user override (if any)
                const status = manual || liveStat;                  // manual wins, else live
                const dur = (finModel && finModel[sl.id] && finModel[sl.id].rampMonths) || sl.ganttDuration;
                const start = sl.ganttStart;
                const leftPct = (start / monthsToShow) * 100;
                const widthPct = Math.min((dur / monthsToShow) * 100, 100 - leftPct);
                const statusColors = { planned: 0.5, active: 0.78, complete: 1, blocked: 0.62 };
                const opacity = statusColors[status];
                return (
                  <div key={sl.id} className="flex items-center group">
                    <div className="w-44 flex-shrink-0 flex items-center gap-2 pr-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:sl.color}}/>
                      <div className="text-[12px] truncate" title={sl.name}>{sl.short}</div>
                      <div className="text-[10px] text-[#52525B] mono">W{sl.wave}</div>
                    </div>
                    <div className="flex-1 relative h-7 rounded-lg inset-bg">
                      <div
                        className="gantt-bar absolute h-full rounded-lg flex items-center justify-between px-2"
                        style={{ left: `${leftPct}%`, width: `${widthPct}%`, background: sl.color, opacity, color:'white' }}
                      >
                        <span className="text-[11px] font-semibold mono truncate">{sl.timeline.split(' ')[1] || sl.timeline}</span>
                        <span className="text-[10px] opacity-80 mono">${(sl.launchCapital/1000).toFixed(0)}K</span>
                      </div>
                      {/* Status selector on hover */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 z-10">
                        {['planned','active','complete','blocked'].map(s => (
                          <button
                            key={s}
                            onClick={() => setGanttState({...ganttState, [sl.id]:{status:s}})}
                            title={s}
                            className={`w-3 h-3 rounded-full border-2 ${status===s ? 'border-white scale-110' : 'border-white/50'}`}
                            style={{background: s==='complete' ? '#10B981' : s==='active' ? '#F59E0B' : s==='blocked' ? '#EF4444' : '#94A3B8'}}
                          />
                        ))}
                        {manual
                          ? <button
                              title="Clear override — revert to live status"
                              onClick={() => setGanttState(prev => { const n = {...prev}; delete n[sl.id]; return n; })}
                              className="mono leading-none"
                              style={{fontSize:'9px', color:'var(--muted)', marginLeft:'2px'}}
                            >manual ✕</button>
                          : <span className="mono leading-none" style={{fontSize:'9px', color:'var(--go)', marginLeft:'2px'}}>live</span>
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-[#1C1C24]">
          {[
            { s:'planned', label:'Planned', c:'#94A3B8' },
            { s:'active', label:'Active', c:'#F59E0B' },
            { s:'complete', label:'Complete', c:'#10B981' },
            { s:'blocked', label:'Blocked', c:'#EF4444' }
          ].map(l => (
            <div key={l.s} className="flex items-center gap-1.5 text-[11px] text-[#A1A1AA]">
              <div className="w-3 h-3 rounded-full" style={{background:l.c}}/> {l.label}
            </div>
          ))}
          <div className="text-[11px] text-[#71717A] ml-auto">Bars show live status (GO→active, blocked→blocked) + ramp-month length. Hover to override; ✕ to revert to live.</div>
        </div>
      </div>

      {/* Critical dependencies callout */}
      <div className="glass rounded-3xl p-6 ring-rose">
        <h3 className="serif text-2xl mb-1">Cross-Service Dependencies</h3>
        <p className="text-[12px] text-[#71717A] mb-4">Where one launch unlocks or constrains another</p>
        <div className="grid md:grid-cols-2 gap-3 text-[13px]">
          <div className="p-4 rounded-xl bg-[rgba(244,63,94,0.06)] border border-[#1C1C24]">
            <div className="font-semibold text-[#F0ABFC] mb-1">Spravato Suite = Recovery Hub for 3 Lines</div>
            <div className="tk-ink">2-hour observation suite serves Spravato, Ketamine recovery (30-60 min), SGB recovery (30 min). Build to multi-purpose spec now: +$15K, saves $40K in Wave 2/3.</div>
          </div>
          <div className="p-4 rounded-xl bg-[rgba(52,211,153,0.06)] border border-emerald-100">
            <div className="font-semibold text-emerald-900 mb-1">PGx → Spravato PA Strength</div>
            <div className="tk-ink">A Spravato PA with PGx documentation ("CYP2D6 poor metabolizer — 3 failed antidepressants were genetically mismatched") is dramatically stronger than standard PA templates.</div>
          </div>
          <div className="p-4 rounded-xl bg-[rgba(251,191,36,0.06)] border border-amber-100">
            <div className="font-semibold text-amber-900 mb-1">ART → SGB/Ketamine Funnel</div>
            <div className="tk-ink">"If ART doesn't resolve it in 3 sessions, consider SGB or ketamine." Trains LMFT/LCSW in trauma tool that creates referral funnel for interventional lines.</div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--glow-soft)] border border-purple-100">
            <div className="font-semibold text-purple-900 mb-1">HBOT Cannot Share Space</div>
            <div className="tk-ink">NFPA 99 Ch 14 — dedicated, exclusive-use room. Min 350 sq ft, 2-hr fire-rated, sprinklered, oxygen-monitored. Single biggest infrastructure constraint in the platform.</div>
          </div>
          <div className="p-4 rounded-xl bg-[rgba(99,102,241,0.06)] border border-indigo-100">
            <div className="font-semibold text-indigo-900 mb-1">One RN, Three Infusion Lines</div>
            <div className="tk-ink">Spravato AM → Ketamine midday → NAD+ PM. Same RN covers all three if scheduled sequentially. Cross-training $1,500-5,000, saves $85-130K/yr labor.</div>
          </div>
          <div className="p-4 rounded-xl bg-[rgba(244,114,182,0.06)] border border-pink-100">
            <div className="font-semibold text-pink-900 mb-1">🔴 Peptide Window is Time-Limited</div>
            <div className="tk-ink">Feb 2026 HHS reclassification creates a 6-12 month launch window. If NTN doesn't launch within that window, regulatory landscape may shift. Weekly FDA/PCAC monitoring required first 6 months.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CAPABILITY MAP TAB  (Layer 0–4 platform spine)
// ============================================================
// Each cell shows owner + maturity + current blocker. Cells with `gates`
// read the SAME hard-gate data as Service Lines (NTN.engine.gateStatus) so an
// unmet gate lights the cell red here too. Maturity persists through the Store.
// Layers 1–4 (capability maturity). Layer 0 is the dedicated legal spine (NTN.engine.LAYER0).
const MATURITY_CYCLE = ['not-started','in-progress','done'];

function CapabilityMap({ capMap, setCapMap, layer0, setLayer0, serviceState, setActiveTab }) {
  const cellBlockers = (cell) => {
    if (!cell.gates) return [];
    const out: any[] = [];
    cell.gates.forEach(g => {
      const st = NTN.engine.gateStatus(g.line, serviceState);
      const hit = st.unmet.find(u => u.id === g.gateId);
      if (hit) out.push(hit.label);
    });
    return out;
  };
  const cycleMaturity = (cellId, current) => {
    const next = MATURITY_CYCLE[(MATURITY_CYCLE.indexOf(current) + 1) % MATURITY_CYCLE.length];
    setCapMap({ ...capMap, [cellId]: { ...(capMap[cellId] || {}), maturity: next } });
  };
  const cycleL0 = (id, current) => {
    const next = MATURITY_CYCLE[(MATURITY_CYCLE.indexOf(current) + 1) % MATURITY_CYCLE.length];
    setLayer0({ ...layer0, [id]: { ...(layer0[id] || {}), status: next } });
  };
  const shortOf = (id) => { const s = SERVICE_LINES.find(x => x.id === id); return s ? s.short : id; };
  const path = NTN.engine.criticalPath(layer0);
  const l0Done = NTN.engine.LAYER0.filter(g => NTN.engine.l0StatusOf(g.id, layer0) === 'done').length;
  const l0Total = NTN.engine.LAYER0.length;

  return (
    <div className="space-y-5">
      <div className="glass rounded-3xl p-6 ring-rose">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h3 className="serif text-3xl">Capability Map</h3>
            <p className="text-[13px] text-[#71717A] mt-1">Layer 0 (Legal &amp; Entity Spine) gates everything above it. Flip a gate to <span className="pos-text">done</span> and every dependent line in <button onClick={() => setActiveTab && setActiveTab('lines')} className="underline" style={{color:'var(--data)'}}>Service Lines</button> recomputes live.</p>
            <p className="text-[11px] mt-2 mono" style={{color:'var(--warn)'}}>Status tracking only — not legal advice; confirm each item with counsel.</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="serif text-4xl leading-none" style={{color: l0Done === l0Total ? 'var(--pos)' : 'var(--warn)'}}>{l0Done}/{l0Total}</div>
            <div className="text-[10px] uppercase tracking-wider mono mt-1" style={{color:'var(--muted)'}}>Layer 0 cleared</div>
          </div>
        </div>
      </div>

      {/* CRITICAL PATH — unmet Layer 0 gates ranked by downstream leverage */}
      <div className="glass rounded-3xl p-5 ring-rose">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h4 className="serif text-2xl" style={{color:'var(--ink-bright)'}}>Critical Path</h4>
          <span className="chip mono">highest leverage first</span>
        </div>
        <p className="text-[12px] text-[#71717A] mb-4">Unmet Layer 0 gates, ranked by how many service lines each one unblocks.</p>
        {path.length === 0 ? (
          <div className="text-center py-6 serif text-2xl pos-text">Legal spine clear. Every Layer 0 gate is done.</div>
        ) : (
          <div className="space-y-2">
            {path.map((g, i) => {
              const st = MATURITY_META[g.status] || MATURITY_META['not-started'];
              return (
                <div key={g.id} className="flex items-center gap-3 p-3 rounded-lg" style={{background:'var(--inset)', border:'1px solid var(--border)'}}>
                  <div className="serif text-2xl leading-none w-6 text-center flex-shrink-0" style={{color: i === 0 ? 'var(--crit)' : 'var(--muted)'}}>{i + 1}</div>
                  <div className="flex-shrink-0 text-center" style={{width:54}}>
                    <div className="serif text-2xl leading-none" style={{color:'var(--data)'}}>{g.downstream}</div>
                    <div className="text-[9px] uppercase tracking-wider mono" style={{color:'var(--muted)'}}>lines</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium" style={{color:'var(--ink-bright)'}}>{g.name}</div>
                    <div className="text-[11px] mono mt-0.5 truncate" style={{color:'var(--muted)'}}>{g.owner} · sign-off: {g.dependsOn} · unblocks {g.lines.map(shortOf).join(', ')}</div>
                  </div>
                  <button onClick={() => cycleL0(g.id, g.status)} className="flex-shrink-0 text-[10px] uppercase tracking-[0.12em] font-semibold mono px-2 py-1 rounded transition hover:opacity-80" style={{color:st.color, background:st.bg, border:`1px solid ${st.border}`}}>{st.label}</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LAYER 0 — dedicated legal/entity gate cards */}
      <div className="glass rounded-3xl p-5 ring-rose">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="serif text-3xl leading-none flex-shrink-0" style={{color:'#ff3b30', textShadow:'0 0 22px #ff3b3055'}}>L0</span>
          <div className="w-8 h-[1px]" style={{background:'linear-gradient(90deg, #ff3b30, transparent)'}}/>
          <h4 className="serif text-2xl" style={{color:'var(--ink-bright)'}}>Legal &amp; Entity Spine</h4>
          <span className="chip mono">gates everything above</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {NTN.engine.LAYER0.map(g => {
            const status = NTN.engine.l0StatusOf(g.id, layer0);
            const st = MATURITY_META[status] || MATURITY_META['not-started'];
            const downstream = Object.keys(NTN.engine.LINE_L0_DEPS).filter(l => NTN.engine.LINE_L0_DEPS[l].includes(g.id)).length;
            const done = status === 'done';
            return (
              <div key={g.id} className="rounded-xl p-3.5 flex flex-col" style={{background:'var(--inset)', border:'1px solid var(--border)', borderLeft:`3px solid ${done ? 'var(--pos)' : '#ff3b30'}`}}>
                <div className="text-[13px] leading-snug font-medium" style={{color:'var(--ink-bright)'}}>{g.name}</div>
                <div className="text-[10px] uppercase tracking-wider mono mt-1.5" style={{color:'var(--muted)'}}>owner · {g.owner}</div>
                <div className="text-[10px] mono mt-0.5" style={{color:'var(--muted)'}}>sign-off · {g.dependsOn}</div>
                <button onClick={() => cycleL0(g.id, status)} className="mt-3 self-start text-[10px] uppercase tracking-[0.12em] font-semibold mono px-2 py-1 rounded transition hover:opacity-80" style={{color:st.color, background:st.bg, border:`1px solid ${st.border}`}}>{st.label}</button>
                <div className="mt-2.5 pt-2.5 hairline-t text-[11px] mono" style={{color: done ? 'var(--pos)' : 'var(--dim)'}}>{done ? 'cleared' : `gates ${downstream} line${downstream === 1 ? '' : 's'}`}</div>
              </div>
            );
          })}
        </div>
      </div>

      {CAPABILITY_LAYERS.map(layer => (
        <div key={layer.n} className="glass rounded-3xl p-5 ring-rose">
          <div className="flex items-center gap-3 mb-4">
            <span className="serif text-3xl leading-none flex-shrink-0" style={{color:layer.accent, textShadow:`0 0 22px ${layer.accent}55`}}>L{layer.n}</span>
            <div className="w-8 h-[1px]" style={{background:`linear-gradient(90deg, ${layer.accent}, transparent)`}}/>
            <h4 className="serif text-2xl" style={{color:'var(--ink-bright)'}}>{layer.name}</h4>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {layer.cells.map(cell => {
              const stored = capMap[cell.id] || {};
              const maturity = stored.maturity || cell.maturity;
              const m = MATURITY_META[maturity] || MATURITY_META['not-started'];
              const gateBlockers = cellBlockers(cell);
              const isRed = gateBlockers.length > 0;
              const blockerText = isRed ? gateBlockers.join(' · ') : (cell.blocker || (maturity === 'done' ? '—' : ''));
              return (
                <div key={cell.id} className="rounded-xl p-3.5 flex flex-col"
                     style={{ background:'var(--inset)', border:'1px solid var(--border)', borderLeft:`3px solid ${isRed ? 'var(--crit)' : layer.accent}` }}>
                  <div className="text-[13px] leading-snug font-medium" style={{color:'var(--ink-bright)'}}>{cell.label}</div>
                  <div className="text-[10px] uppercase tracking-wider mono mt-1.5" style={{color:'var(--muted)'}}>owner · {cell.owner}</div>
                  <button onClick={() => cycleMaturity(cell.id, maturity)}
                          className="mt-3 self-start text-[10px] uppercase tracking-[0.12em] font-semibold mono px-2 py-1 rounded transition hover:opacity-80"
                          style={{ color:m.color, background:m.bg, border:`1px solid ${m.border}` }}>
                    {m.label}
                  </button>
                  <div className="mt-2.5 pt-2.5 hairline-t text-[11.5px] leading-snug flex items-start gap-1.5"
                       style={{ color: isRed ? 'var(--crit)' : 'var(--dim)' }}>
                    {blockerText && blockerText !== '—' && <span className="flex-shrink-0 mt-0.5">{isRed ? '▸' : '·'}</span>}
                    <span>{blockerText || 'no blocker'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// SERVICE LINES TAB
// ============================================================
function ServiceLines({ serviceState, setServiceState, tasks, setTasks, layer0, activeLine }: any) {
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(activeLine && activeLine !== 'all' ? activeLine : null);
  const [focus, setFocus] = useState(false);

  const way = NTN.engine.wayThrough(layer0, serviceState);
  const focusing = focus && way.phase !== 'scale';      // hold focus until Wave 1 is live
  const isDeferred = (sl) => focusing && !way.launch.includes(sl.id);
  const deferredCount = focusing ? SERVICE_LINES.length - way.launch.length : 0;

  const filtered = activeLine && activeLine !== 'all'
    ? SERVICE_LINES.filter(sl => sl.id === activeLine)
    : SERVICE_LINES.filter(sl => filter === 'all' ? true : sl.wave === parseInt(filter));

  const toggleRisk = (slId, riskIdx) => {
    const key = `${slId}_risk_${riskIdx}`;
    const wasResolved = !!serviceState[key];
    setServiceState({ ...serviceState, [key]: !wasResolved });

    if (!wasResolved) {
      const sl: any = SERVICE_LINES.find(s => s.id === slId);
      const newTask = NTN.engine.taskFromBlockingRisk(sl, riskIdx);
      setTasks([newTask, ...tasks]);
    }
  };

  return (
    <div className="space-y-5">
      {activeLine && activeLine !== 'all' && (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg" style={{background:'var(--surface)', border:'1px solid var(--line-strong)', borderLeft:'3px solid var(--ember)'}}>
          <span className="mono text-[12px]" style={{color:'var(--ink-bright)'}}><span style={{color:'var(--ember)'}}>● lens</span> · scoped to {(SERVICE_LINES.find(s=>s.id===activeLine)||{}).name || activeLine}</span>
          <span className="mono text-[11px]" style={{color:'var(--muted)'}}>change in the top bar ▾</span>
        </div>
      )}
      {way.phase !== 'scale' && (
        <div className="glass rounded-2xl p-3.5 ring-rose flex items-center justify-between gap-3 flex-wrap" style={{borderLeft:'3px solid var(--crit)'}}>
          <div className="text-[12.5px]" style={{color:'var(--dim)'}}>
            <span className="mono uppercase tracking-wider text-[10px] mr-2" style={{color:'var(--crit)'}}>Focus</span>
            {focusing
              ? <>Wave 1 only — <span style={{color:'var(--ink-bright)'}}>{deferredCount} lines deferred</span>. Your three are live: <span className="mono" style={{color:'var(--data)'}}>PGx · Spravato · TMS</span>. The rest waits for the Wave 2 trigger.</>
              : <>Showing all 10 lines. Waves 2–3 are roadmap, not launch — focus to cut the noise.</>}
          </div>
          <button onClick={() => setFocus(f => !f)} className="flex-shrink-0 text-[11px] mono px-3 py-1.5 rounded-md transition hover:bg-[var(--surface)]" style={{color:'var(--dim)', border:'1px solid var(--border)'}}>{focusing ? 'show all 10' : 'focus'}</button>
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] uppercase tracking-wider text-[#71717A] font-medium mr-2">Filter</span>
        {[
          { v:'all', label:'All 10' },
          { v:1, label:'Wave 1 (3)' },
          { v:2, label:'Wave 2 (4)' },
          { v:3, label:'Wave 3 (3)' }
        ].map(f => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v.toString())}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter===f.v.toString() ? 'bg-[#ff3b30] text-white' : 'inset-bg tk-ink hover:bg-[var(--glow-soft)] ring-rose'}`}
          >{f.label}</button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(sl => {
          const isExpanded = expanded === sl.id;
          const gate = NTN.engine.lineStatus(sl.id, serviceState, layer0);
          const deferred = isDeferred(sl);
          return (
            <div key={sl.id} className="glass rounded-2xl overflow-hidden ring-rose transition" style={deferred ? {opacity:0.6} : undefined}>
              <div className="p-5 border-b border-[#1C1C24]" style={{borderTopColor:sl.color, borderTopWidth:3}}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold text-white" style={{background:sl.color}}>Wave {sl.wave} · #{sl.order}</span>
                      {deferred && <span className="text-[10px] uppercase tracking-wider mono px-1.5 py-0.5 rounded" style={{color:'var(--muted)', border:'1px solid var(--border)'}}>deferred</span>}
                      <span className="text-[11px] text-[#71717A] mono">{sl.timeline}</span>
                    </div>
                    <h4 className="serif text-2xl leading-tight">{sl.name}</h4>
                    <p className="text-[12px] text-[#71717A] mt-1">{sl.payorModel}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-[10px] uppercase tracking-[0.18em] font-bold mono px-2 py-1 rounded inline-block"
                          style={gate.status==='GO'
                            ? {color:'var(--pos)',  background:'rgba(52,211,153,0.10)', border:'1px solid rgba(52,211,153,0.35)'}
                            : {color:'var(--crit)', background:'rgba(244,63,94,0.10)',  border:'1px solid rgba(244,63,94,0.35)'}}>
                      {gate.status}
                    </span>
                    {gate.total > 0 && <div className="text-[10px] mono mt-1" style={{color:'var(--muted)'}}>{gate.cleared}/{gate.total} gates</div>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="inset-bg rounded-lg p-2"><div className="text-[10px] uppercase tracking-wider text-[#71717A]">Capital</div><div className="mono text-sm font-semibold">${(sl.launchCapital/1000).toFixed(1)}K</div></div>
                  <div className="inset-bg rounded-lg p-2"><div className="text-[10px] uppercase tracking-wider text-[#71717A]">M12/mo</div><div className="mono text-sm font-semibold">${(sl.m12Revenue/1000).toFixed(1)}K</div></div>
                  <div className="inset-bg rounded-lg p-2"><div className="text-[10px] uppercase tracking-wider text-[#71717A]">FTE</div><div className="mono text-sm font-semibold">{sl.fteTarget}</div></div>
                </div>

                {gate.status === 'BLOCKED' && (
                  <div className="mt-3 p-2.5 rounded-lg" style={{background:'rgba(244,63,94,0.06)', border:'1px solid rgba(244,63,94,0.25)'}}>
                    <div className="text-[10px] uppercase tracking-wider font-semibold mono" style={{color:'var(--crit)'}}>Hard-gated · unmet dependencies</div>
                    <div className="mt-1.5 space-y-1">
                      {gate.unmet.map((g, gi) => (
                        <div key={gi} className="flex items-start gap-2 text-[12px]" style={{color:'var(--ink)'}}>
                          <span className="mt-0.5" style={{color:'var(--crit)'}}>▸</span>
                          <span>{g.source === 'layer0' && <span className="mono text-[10px] mr-1" style={{color:'var(--warn)'}}>[L0]</span>}{g.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10.5px] mono mt-2" style={{color:'var(--muted)'}}>Line gates → dossier · [L0] gates → Capability Map.</div>
                  </div>
                )}

                <button
                  onClick={() => setExpanded(isExpanded ? null : sl.id)}
                  className="mt-3 text-[12px] text-[#ff3b30] hover:text-[#F0ABFC] font-medium flex items-center gap-1"
                >
                  {isExpanded ? '− Collapse' : '+ Expand dossier'}
                </button>
              </div>

              {isExpanded && (
                <div className="p-5 space-y-4 text-[13px] inset-bg">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold mb-1">Reasoning · Why This Order</div>
                    <p className="tk-ink leading-relaxed">{sl.reasoning}</p>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold mb-1">Bottom Line</div>
                    <p className="tk-ink leading-relaxed">{sl.bottomLine}</p>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold mb-2">Blocking Risks · Tap to send to task manager</div>
                    <div className="space-y-1.5">
                      {sl.blockingRisks.map((r, i) => {
                        const k = `${sl.id}_risk_${i}`;
                        const resolved = !!serviceState[k];
                        return (
                          <button
                            key={i}
                            onClick={() => toggleRisk(sl.id, i)}
                            className={`w-full text-left flex items-start gap-2 p-2 rounded-lg border transition text-[12px] ${resolved ? 'bg-[rgba(52,211,153,0.08)] border-[rgba(52,211,153,0.3)]' : 'bg-[rgba(244,63,94,0.06)] border-[#1C1C24] hover:border-[rgba(244,63,94,0.4)]'}`}
                          >
                            <div className={`mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${resolved ? 'bg-emerald-500 border-emerald-500' : 'border-rose-300'}`}>
                              {resolved && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12"><path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
                            </div>
                            <span className={resolved ? 'line-through text-[#71717A]' : 'tk-ink'}>{r}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold mb-1">CPT Codes</div>
                      <div className="space-y-1">
                        {sl.cptCodes.map((c, i) => <div key={i} className="mono text-[11px] tk-ink">{c}</div>)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold mb-1">Risk · Reg Complexity</div>
                      <div className="text-[11px] tk-ink">Risk: <span className="mono">{sl.risk}</span></div>
                      <div className="text-[11px] tk-ink">Reg: <span className="mono">{sl.regComplexity}</span></div>
                      <div className="text-[11px] tk-ink">GM: <span className="mono">{sl.grossMargin}</span></div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold mb-1">Key Decisions</div>
                    <ul className="space-y-1">
                      {sl.keyDecisions.map((d, i) => <li key={i} className="text-[12px] tk-ink flex items-start gap-2">
                        <span className="text-rose-500 mt-0.5 flex-shrink-0">→</span>
                        <span>{d}</span>
                      </li>)}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// CAPITAL DEPLOYMENT TAB
// ============================================================
function CapitalView({ finModel, setFinModel, fin, activeLine, finScenarios, setFinScenarios }) {
  const [scenario, setScenario] = useState('realistic');

  const totalCapital = useMemo(() => {
    const totals = { low: 483000, realistic: 773000, premium: 1280000 };
    return totals[scenario];
  }, [scenario]);

  // Realistic revenue now comes LIVE from the driver model; low/premium track it.
  const totalRevenue = useMemo(() => {
    const realistic = fin.m12Monthly;
    const totals = { low: realistic * 0.651, realistic, premium: realistic * 1.477 };
    return totals[scenario];
  }, [scenario, fin.m12Monthly]);

  // ----- driver-model editor helpers -----
  const upd = (id, field, raw) => {
    const v = parseFloat(raw);
    setFinModel({ ...finModel, [id]: { ...finModel[id], [field]: isNaN(v) ? 0 : v } });
  };
  const resetModel = () => setFinModel(NTN.engine.FIN_DRIVERS);
  const SL = id => SERVICE_LINES.find(s => s.id === id);
  const numCell = (id, field, val, opts: any = {}) => (
    <input type="number" value={val} step={opts.step || 'any'} onChange={e => upd(id, field, e.target.value)}
      className="w-full inset-bg rounded px-1.5 py-1 mono text-[11px] text-right outline-none focus:ring-1 focus:ring-[#ff3b30]"
      style={{ border: '1px solid var(--border)', color: 'var(--ink)' }}/>
  );
  const pctCell = (id, field, val) => (
    <input type="number" value={Math.round(val * 100)} step="1" onChange={e => upd(id, field, (parseFloat(e.target.value) || 0) / 100)}
      className="w-full inset-bg rounded px-1.5 py-1 mono text-[11px] text-right outline-none focus:ring-1 focus:ring-[#ff3b30]"
      style={{ border: '1px solid var(--border)', color: 'var(--ink)' }}/>
  );

  // Calculate cumulative capital curve
  const cumulative = useMemo(() => {
    const mult = scenario === 'low' ? 0.625 : scenario === 'premium' ? 1.66 : 1;
    let running = 0;
    return CAPITAL_BY_MONTH.map(m => {
      running += (m.w1 + m.w2 + m.w3) * mult;
      return { month:m.month, cumulative:running, w1:m.w1*mult, w2:m.w2*mult, w3:m.w3*mult };
    });
  }, [scenario]);

  const maxCum = cumulative[cumulative.length-1].cumulative;
  const maxRev = totalRevenue;

  const lensed = activeLine && activeLine !== 'all';
  const lid = lensed ? activeLine : null;
  const lineM12 = lensed ? (fin.byId[lid]?.monthly || 0) : null;
  const lineGM = lensed ? (1 - (finModel[lid]?.directCostPct ?? 0)) : null;
  const lineLabor = lensed ? ((finModel[lid]?.fte || 0) * (finModel[lid]?.fteAnnualCost || 0)) : null;

  return (
    <div className="space-y-5">
      {/* ───────── Driver-based financial model (bottoms-up, editable) ───────── */}
      <div className="glass rounded-3xl p-6 ring-rose">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="serif text-3xl">Driver Model · Bottoms-Up</h3>
            <p className="text-[13px] text-[#71717A] mt-1">Edit any cell — M12 revenue, blended GM and annualized recompute live. Seeded to reproduce today's totals (validation-corrected).</p>
          </div>
          <button onClick={resetModel} className="px-3 py-1.5 rounded-md text-[11px] mono hover:bg-[var(--surface)] transition" style={{color:'var(--dim)', border:'1px solid var(--border)'}}>reset seed</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="inset-bg rounded-xl p-3"><div className="text-[11px] uppercase tracking-wider text-[#71717A]">M12 Rev/mo</div><div className="mono text-2xl font-bold mt-1" style={{color:'var(--data)'}}>${((lensed ? lineM12 : fin.m12Monthly)/1000).toFixed(1)}K</div></div>
          <div className="inset-bg rounded-xl p-3"><div className="text-[11px] uppercase tracking-wider text-[#71717A]">Annualized</div><div className="mono text-2xl font-bold mt-1" style={{color:'var(--ink-bright)'}}>${(((lensed ? lineM12*12 : fin.annualized))/1e6).toFixed(2)}M</div></div>
          <div className="inset-bg rounded-xl p-3"><div className="text-[11px] uppercase tracking-wider text-[#71717A]">Blended GM</div><div className="mono text-2xl font-bold mt-1" style={{color:'var(--pos)'}}>{(((lensed ? lineGM : fin.blendedGM))*100).toFixed(1)}%</div></div>
          <div className="inset-bg rounded-xl p-3"><div className="text-[11px] uppercase tracking-wider text-[#71717A]">Annual Labor</div><div className="mono text-2xl font-bold mt-1" style={{color:'var(--ink-bright)'}}>${(((lensed ? lineLabor : fin.annualLabor))/1e6).toFixed(2)}M</div></div>
        </div>
        {lensed && <div className="mono text-[11px] mb-4" style={{color:'var(--ember)'}}>● lens · figures scoped to {(SERVICE_LINES.find(s=>s.id===activeLine)||{}).name || activeLine}. The driver table below shows only this line.</div>}

        <div className="overflow-x-auto">
          <table className="w-full text-[11px] mono" style={{borderCollapse:'separate', borderSpacing:0}}>
            <thead>
              <tr className="text-[#71717A] uppercase tracking-wider" style={{fontSize:'9.5px'}}>
                <th className="text-left font-semibold py-2 pr-3 sticky left-0 inset-bg" style={{minWidth:120}}>Line</th>
                <th className="font-semibold py-2 px-1" title="Payer (insurance) rate per encounter">Payer $</th>
                <th className="font-semibold py-2 px-1" title="Cash / self-pay rate per encounter">Cash $</th>
                <th className="font-semibold py-2 px-1" title="Share billed to payer vs cash">Mix %</th>
                <th className="font-semibold py-2 px-1" title="Encounters / units per month at M12">Vol/mo</th>
                <th className="font-semibold py-2 px-1" title="Prior-auth / collection approval rate">PA %</th>
                <th className="font-semibold py-2 px-1" title="Months to full ramp (shapes trajectory, not M12)">Ramp</th>
                <th className="font-semibold py-2 px-1" title="Budgeted FTE">FTE</th>
                <th className="font-semibold py-2 px-1" title="Annual loaded cost per FTE">$/FTE</th>
                <th className="font-semibold py-2 px-1" title="Gross margin = 1 − direct COGS">GM %</th>
                <th className="text-right font-semibold py-2 pl-2" style={{color:'var(--data)'}}>M12 $/mo</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(finModel).filter(id => !activeLine || activeLine === 'all' || id === activeLine).map(id => {
                const d = finModel[id];
                const sl = SL(id);
                const row = fin.byId[id] || { monthly: 0 };
                return (
                  <tr key={id} style={{borderTop:'1px solid var(--border)'}}>
                    <td className="py-1.5 pr-3 sticky left-0 inset-bg">
                      <span className="flex items-center gap-1.5 whitespace-nowrap" style={{color:'var(--ink)'}}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background: sl ? sl.color : 'var(--muted)'}}/>{sl ? sl.short : id}
                      </span>
                    </td>
                    <td className="px-1" style={{width:64}}>{numCell(id,'payerRate',d.payerRate)}</td>
                    <td className="px-1" style={{width:64}}>{numCell(id,'cashRate',d.cashRate)}</td>
                    <td className="px-1" style={{width:52}}>{pctCell(id,'payerMixPct',d.payerMixPct)}</td>
                    <td className="px-1" style={{width:80}}>{numCell(id,'volume',d.volume)}</td>
                    <td className="px-1" style={{width:56}}>{pctCell(id,'paApprovalPct',d.paApprovalPct)}</td>
                    <td className="px-1" style={{width:52}}>{numCell(id,'rampMonths',d.rampMonths,{step:1})}</td>
                    <td className="px-1" style={{width:64}}>{numCell(id,'fte',d.fte,{step:0.05})}</td>
                    <td className="px-1" style={{width:72}}>{numCell(id,'fteAnnualCost',d.fteAnnualCost,{step:1000})}</td>
                    <td className="px-1" style={{width:52}}>
                      <input type="number" value={Math.round((1 - d.directCostPct) * 100)} step="1"
                        onChange={e => upd(id, 'directCostPct', 1 - (parseFloat(e.target.value) || 0) / 100)}
                        className="w-full inset-bg rounded px-1.5 py-1 mono text-[11px] text-right outline-none focus:ring-1 focus:ring-[#ff3b30]"
                        style={{ border: '1px solid var(--border)', color: 'var(--ink)' }}/>
                    </td>
                    <td className="text-right pl-2 font-semibold whitespace-nowrap" style={{color:'var(--data)'}}>${Math.round(row.monthly).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{borderTop:'2px solid var(--border-strong)'}}>
                <td className="py-2 pr-3 sticky left-0 inset-bg uppercase tracking-wider font-semibold" style={{color:'var(--ink-bright)', fontSize:'10px'}}>Total · {(fin.blendedGM*100).toFixed(1)}% GM</td>
                <td colSpan={8}/>
                <td className="text-right text-[#71717A] pr-1" style={{fontSize:'9.5px'}}>blended</td>
                <td className="text-right pl-2 font-bold whitespace-nowrap" style={{color:'var(--data)'}}>${Math.round(fin.m12Monthly).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="glass rounded-3xl p-6 ring-rose">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="serif text-3xl">Capital Deployment</h3>
            <p className="text-[13px] text-[#71717A] mt-1">Where the money goes, when it goes — across all 3 waves</p>
          </div>
          <div className="flex gap-1 inset-bg rounded-lg p-1">
            {['low','realistic','premium'].map(s => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition ${scenario===s ? 'bg-[#ff6a5c] text-white' : 'tk-ink hover:text-[#ff3b30]'}`}
              >{s}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="inset-bg rounded-xl p-3"><div className="text-[11px] uppercase tracking-wider text-[#71717A]">Total Capital</div><div className="mono text-2xl font-bold mt-1" style={{color:'var(--data)'}}>${(totalCapital/1000).toFixed(0)}K</div></div>
          <div className="inset-bg rounded-xl p-3"><div className="text-[11px] uppercase tracking-wider text-[#71717A]">M12 Rev/mo</div><div className="mono text-2xl font-bold mt-1" style={{color:'var(--ink-bright)'}}>${(totalRevenue/1000).toFixed(0)}K</div></div>
          <div className="inset-bg rounded-xl p-3"><div className="text-[11px] uppercase tracking-wider text-[#71717A]">Annualized</div><div className="mono text-2xl font-bold mt-1" style={{color:'var(--ink-bright)'}}>${(totalRevenue*12/1000000).toFixed(2)}M</div></div>
          <div className="inset-bg rounded-xl p-3"><div className="text-[11px] uppercase tracking-wider text-[#71717A]">Capital ROI Y1</div><div className="mono text-2xl font-bold mt-1" style={{color:'var(--ink-bright)'}}>{((totalRevenue*12/totalCapital)*100).toFixed(0)}%</div></div>
        </div>

        {/* Capital deployment bar chart */}
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold mb-3">Monthly Capital Spend</div>
          <div className="space-y-1.5">
            {cumulative.map(m => {
              const total = m.w1 + m.w2 + m.w3;
              const pct = (total / 250000) * 100;
              return (
                <div key={m.month} className="flex items-center gap-3">
                  <div className="w-12 mono text-xs text-[#71717A] flex-shrink-0">M{m.month}</div>
                  <div className="flex-1 h-6 inset-bg rounded-md overflow-hidden flex">
                    {m.w1 > 0 && <div className="h-full transition-all" style={{width:`${(m.w1/250000)*100}%`, background:'#E11D48'}} title={`W1: $${m.w1.toLocaleString()}`}/>}
                    {m.w2 > 0 && <div className="h-full transition-all" style={{width:`${(m.w2/250000)*100}%`, background:'#10B981'}} title={`W2: $${m.w2.toLocaleString()}`}/>}
                    {m.w3 > 0 && <div className="h-full transition-all" style={{width:`${(m.w3/250000)*100}%`, background:'#ff6a5c'}} title={`W3: $${m.w3.toLocaleString()}`}/>}
                  </div>
                  <div className="w-20 text-right mono text-xs font-semibold flex-shrink-0">${(total/1000).toFixed(0)}K</div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 text-[11px]">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{background:'#E11D48'}}/> Wave 1</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{background:'#10B981'}}/> Wave 2</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{background:'#ff6a5c'}}/> Wave 3</div>
          </div>
        </div>
      </div>

      {/* Revenue trajectory */}
      <div className="glass rounded-3xl p-6 ring-rose">
        <h3 className="serif text-2xl mb-1">Revenue Trajectory</h3>
        <p className="text-[12px] text-[#71717A] mb-5">Conservative · Target · Stretch — across all 10 lines</p>

        {/* Simple SVG line chart */}
        <svg viewBox="0 0 600 280" className="w-full h-auto">
          <defs>
            <linearGradient id="targetGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ff3b30" stopOpacity="0.25"/>
              <stop offset="100%" stopColor="#ff3b30" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {/* Grid */}
          {[0,300000,600000,900000,1200000].map((v,i) => (
            <g key={v}>
              <line x1="60" y1={250 - (v/1300000)*220} x2="580" y2={250 - (v/1300000)*220} stroke="#FCA5A5" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.5"/>
              <text x="50" y={254 - (v/1300000)*220} fontSize="9" fill="#94A3B8" textAnchor="end" fontFamily="JetBrains Mono">${(v/1000).toFixed(0)}K</text>
            </g>
          ))}
          {/* X axis */}
          {[3,6,9,12].map((m,i) => (
            <text key={m} x={60 + ((m-2)/11)*520} y="270" fontSize="10" fill="#64748B" textAnchor="middle" fontFamily="JetBrains Mono">M{m}</text>
          ))}
          {/* Lines */}
          {['stretch','target','conservative'].map((scen, idx) => {
            const colors = { conservative:'#8a9099', target:'#ff3b30', stretch:'#f5a524' };
            const widths = { conservative:1.5, target:2.5, stretch:1.5 };
            const points = REVENUE_TRAJECTORY.map(d => {
              const x = 60 + ((d.month-2)/11)*520;
              const y = 250 - (d[scen]/1300000)*220;
              return `${x},${y}`;
            }).join(' ');
            return (
              <g key={scen}>
                {scen === 'target' && <polygon points={`60,250 ${points} 580,250`} fill="url(#targetGrad)"/>}
                <polyline points={points} fill="none" stroke={colors[scen]} strokeWidth={widths[scen]}/>
                {REVENUE_TRAJECTORY.map((d,i) => {
                  const x = 60 + ((d.month-2)/11)*520;
                  const y = 250 - (d[scen]/1300000)*220;
                  return <circle key={i} cx={x} cy={y} r={scen==='target'?4:3} fill={colors[scen]}/>;
                })}
              </g>
            );
          })}
          {/* Legend */}
          <g transform="translate(70,15)">
            <circle cx="0" cy="0" r="3" fill="#f5a524"/><text x="8" y="3" fontSize="10" fill="#8a9099">Stretch · $1.21M/mo</text>
            <circle cx="160" cy="0" r="4" fill="#ff3b30"/><text x="170" y="3" fontSize="10" fill="#8a9099" fontWeight="600">Target · $820K/mo</text>
            <circle cx="320" cy="0" r="3" fill="#8a9099"/><text x="328" y="3" fontSize="10" fill="#8a9099">Conservative · $534K/mo</text>
          </g>
        </svg>
      </div>

      {/* Financial scenario snapshots */}
      <div className="glass rounded-3xl p-6 ring-rose">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="serif text-3xl">Scenarios</h3>
            <p className="text-[13px] mt-1" style={{color:'var(--muted)'}}>Save the current driver model as a named what-if. Load to restore it into the live model. Local to this browser.</p>
          </div>
          <button onClick={() => { const name = window.prompt('Name this scenario:'); if (name) setFinScenarios([{ id:'sc_'+Date.now(), name, ts:new Date().toISOString(), drivers: JSON.parse(JSON.stringify(finModel)), m12: fin.m12Monthly, annualized: fin.annualized, gm: fin.blendedGM }, ...finScenarios]); }}
            className="px-3 py-1.5 rounded-md text-[11px] mono" style={{background:'var(--glow-soft)', color:'var(--ember)', border:'1px solid var(--line-strong)'}}>+ Save current</button>
        </div>
        {(!finScenarios || finScenarios.length === 0)
          ? <div className="text-[12px] mono" style={{color:'var(--faint)'}}>No saved scenarios yet. Edit the driver model above, then "Save current".</div>
          : <div className="space-y-2">
              {finScenarios.map(s => (
                <div key={s.id} className="flex items-center gap-3 flex-wrap inset-bg rounded-lg p-3" style={{border:'1px solid var(--line-strong)'}}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold" style={{color:'var(--ink-bright)'}}>{s.name}</div>
                    <div className="text-[11px] mono mt-0.5" style={{color:'var(--muted)'}}>${(s.m12/1000).toFixed(1)}K/mo · ${(s.annualized/1e6).toFixed(2)}M/yr · {(s.gm*100).toFixed(1)}% GM</div>
                  </div>
                  <button onClick={() => setFinModel(JSON.parse(JSON.stringify(s.drivers)))} className="mono text-[11px]" style={{background:'var(--surface)', color:'var(--data)', border:'1px solid var(--line-strong)', borderRadius:6, padding:'5px 11px'}}>Load →</button>
                  <button onClick={() => setFinScenarios(finScenarios.filter(x => x.id !== s.id))} className="mono text-[11px]" style={{color:'var(--muted)', border:'1px solid var(--line-strong)', borderRadius:6, padding:'5px 9px'}}>✕</button>
                </div>
              ))}
            </div>}
      </div>

      {/* Combined platform P&L */}
      <div className="glass rounded-3xl p-6 ring-rose">
        <h3 className="serif text-2xl mb-1">Complete Platform P&L · Month 12</h3>
        <p className="text-[12px] text-[#71717A] mb-4">All 10 lines at target volume</p>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-[12px] min-w-[500px]">
            <thead>
              <tr className="border-b border-[#1C1C24]">
                <th className="text-left py-2 px-3 font-semibold text-[#71717A] uppercase tracking-wider text-[11px]">Line</th>
                <th className="text-left py-2 px-3 font-semibold text-[#71717A] uppercase tracking-wider text-[11px]">Tier</th>
                <th className="text-left py-2 px-3 font-semibold text-[#71717A] uppercase tracking-wider text-[11px]">Payor Model</th>
                <th className="text-right py-2 px-3 font-semibold text-[#71717A] uppercase tracking-wider text-[11px]">M12 Revenue</th>
              </tr>
            </thead>
            <tbody>
              {SERVICE_LINES.map(sl => (
                <tr key={sl.id} className="border-b border-[#1C1C24] hover:bg-[var(--glow-soft)] transition">
                  <td className="py-2.5 px-3"><span className="inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{background:sl.color}}/>{sl.short}</span></td>
                  <td className="py-2.5 px-3 mono text-[#A1A1AA]">T{sl.wave}</td>
                  <td className="py-2.5 px-3 text-[#A1A1AA]">{sl.payorModel}</td>
                  <td className="py-2.5 px-3 mono font-semibold text-right">${(sl.m12Revenue/1000).toFixed(1)}K</td>
                </tr>
              ))}
              <tr className="font-semibold bg-[rgba(244,63,94,0.06)]">
                <td className="py-3 px-3" colSpan={3}>TOTAL · 10 lines · 3 waves</td>
                <td className="py-3 px-3 mono text-right text-[#ff3b30]">$820K/mo</td>
              </tr>
              <tr className="text-[11px] text-[#71717A]">
                <td colSpan={4} className="px-3 py-2">Blended gross margin ~52-58% · Year 2 net (steady-state) $5.5M-$7.5M</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STAFFING TAB
// ============================================================
function StaffingView() {
  const totalFTE = STAFFING_MATRIX.reduce((s,r) => s+r.total, 0);
  const totalLaborTarget = 1738000;

  return (
    <div className="space-y-5">
      <div className="glass rounded-3xl p-6 ring-rose">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="serif text-3xl">Staffing Matrix</h3>
            <p className="text-[13px] text-[#71717A] mt-1">FTE by role × service line at target volume · Cross-training reduces total by ~3 FTE</p>
          </div>
          <div className="flex gap-3">
            <div className="text-right"><div className="text-[11px] uppercase tracking-wider text-[#71717A]">Total FTE</div><div className="mono text-2xl font-bold text-[#ff3b30]">{totalFTE.toFixed(2)}</div></div>
            <div className="text-right"><div className="text-[11px] uppercase tracking-wider text-[#71717A]">Annual Labor</div><div className="mono text-2xl font-bold text-[#ff3b30]">$1.74M</div></div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-[11px] min-w-[800px]">
            <thead>
              <tr>
                <th className="sticky left-0 inset-bg backdrop-blur text-left py-2 px-3 font-semibold text-[#71717A] uppercase tracking-wider text-[10px] z-10">Role</th>
                {SERVICE_LINES.map(sl => (
                  <th key={sl.id} className="px-1.5 py-2 text-center font-semibold uppercase tracking-wider text-[10px]" style={{color:sl.color}}>{sl.short.length>10?sl.short.slice(0,8)+'…':sl.short}</th>
                ))}
                <th className="px-3 py-2 text-right font-semibold text-[#ff3b30] uppercase tracking-wider text-[10px]">Total</th>
              </tr>
            </thead>
            <tbody>
              {STAFFING_MATRIX.map(row => (
                <tr key={row.role} className="border-t border-[#1C1C24] hover:bg-[var(--glow-soft)]">
                  <td className="sticky left-0 inset-bg backdrop-blur py-2 px-3 font-medium tk-ink">{row.role}</td>
                  {SERVICE_LINES.map(sl => {
                    const v = row[sl.id];
                    return (
                      <td key={sl.id} className="px-1.5 py-2 text-center">
                        {v > 0 ? <span className="mono text-[11px]" style={{color:v>0.5?sl.color:'#94A3B8'}}>{v.toFixed(2)}</span> : <span className="text-[#3F3F46]">·</span>}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right mono font-semibold text-[#ff3b30]">{row.total.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#2A2A35] font-semibold" style={{background:'var(--glow-soft)'}}>
                <td className="sticky left-0 py-3 px-3 mono text-[11px] uppercase tracking-wider" style={{background:'var(--inset)', color:'var(--data)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)'}}>FTE TOTAL</td>
                {SERVICE_LINES.map(sl => {
                  const colTotal = STAFFING_MATRIX.reduce((s,r) => s + (r[sl.id]||0), 0);
                  return <td key={sl.id} className="px-1.5 py-3 text-center mono" style={{color:sl.color}}>{colTotal.toFixed(2)}</td>;
                })}
                <td className="px-3 py-3 text-right mono text-[#ff3b30] text-base">{totalFTE.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 ring-rose">
          <div className="text-[11px] uppercase tracking-wider text-emerald-700 font-semibold mb-2">Cross-Training Savings</div>
          <div className="serif text-3xl text-emerald-700">$110K/yr</div>
          <p className="text-[12px] text-[#A1A1AA] mt-2 leading-relaxed">RN cross-trained for Spravato + TMS + PGx + ketamine + SGB recovery + NAD+. LMFT cross-trained for ART + neurofeedback supervision. Total cross-training investment ~$8K.</p>
        </div>
        <div className="glass rounded-2xl p-5 ring-rose">
          <div className="text-[11px] uppercase tracking-wider text-amber-700 font-semibold mb-2">Critical Hires (Lead Time)</div>
          <ul className="space-y-1.5 text-[12px] tk-ink mt-2">
            <li>• <span className="font-semibold">BCIA Tech:</span> 2-3 months (Wave 2)</li>
            <li>• <span className="font-semibold">REMS RN:</span> 6-8 weeks + 2-4 weeks training</li>
            <li>• <span className="font-semibold">CHT Operator:</span> 2-3 months (Wave 3 HBOT)</li>
            <li>• <span className="font-semibold">Contracted Anesthesiologist:</span> Active outreach now</li>
          </ul>
        </div>
        <div className="glass rounded-2xl p-5 ring-rose">
          <div className="text-[11px] uppercase tracking-wider text-[#ff3b30] font-semibold mb-2">Already In Hand</div>
          <ul className="space-y-1.5 text-[12px] tk-ink mt-2">
            <li>• <span className="font-semibold">Dr. Sanchez (Sydea):</span> CA license + DEA</li>
            <li>• <span className="font-semibold">Dr. Tawfique:</span> CA license + DEA</li>
            <li>• <span className="font-semibold">REMS prescriber cert:</span> 1-2 days online</li>
            <li>• <span className="font-semibold">Existing residential staff:</span> Cross-training base</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DECISIONS TAB
// ============================================================
function DecisionsView({ decisions, setDecisions, tasks, setTasks, activeLine, layer0, setLayer0 }: any) {
  const [filter, setFilter] = useState('all');
  const [gateSel, setGateSel] = useState({});

  const filtered = OPEN_DECISIONS.filter(d => {
    const passWave = (!activeLine || activeLine === 'all' || d.wave === 0 || d.wave === (SERVICE_LINES.find(s => s.id === activeLine) || {}).wave);
    if (!passWave) return false;
    if (filter === 'all') return true;
    if (filter === 'pending') return !decisions[d.id];
    if (filter === 'resolved') return !!decisions[d.id];
    if (['1','2','3'].includes(filter)) return d.wave === parseInt(filter);
    return d.category === filter;
  });

  const setDecision = (id, choice, decision) => {
    if (choice === 'clear') {
      const next = { ...decisions };
      delete next[id];
      setDecisions(next);
    } else {
      setDecisions({ ...decisions, [id]: { choice, decidedAt: new Date().toISOString() }});

      // Route to task manager if "Defer to legal" or "Yes"
      if (choice === 'yes' || choice === 'legal') {
        const newTask = NTN.engine.taskFromDecision(decision, choice);
        newTask.title = choice === 'legal' ? `[LEGAL REVIEW] ${decision.q}` : `Implement decision: ${decision.q}`;
        newTask.owner = choice === 'legal' ? 'Healthcare Counsel' : 'Operations';
        newTask.source = `Decision ${id} · ${decision.category}`;
        setTasks([newTask, ...tasks]);
      }
    }
  };

  const categories = [...new Set(OPEN_DECISIONS.map(d => d.category))];

  return (
    <div className="space-y-5">
      <div className="glass rounded-3xl p-6 ring-rose">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-2">
          <div>
            <h3 className="serif text-3xl">Open Decisions</h3>
            <p className="text-[13px] text-[#71717A] mt-1">{OPEN_DECISIONS.length} total · {Object.keys(decisions).length} resolved · {OPEN_DECISIONS.length - Object.keys(decisions).length} pending</p>
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap mt-4">
          {[
            { v:'all', label:'All' },
            { v:'pending', label:'Pending' },
            { v:'resolved', label:'Resolved' },
            { v:'1', label:'Wave 1' },
            { v:'2', label:'Wave 2' },
            { v:'3', label:'Wave 3' },
            ...categories.map(c => ({ v:c, label:c }))
          ].map(f => (
            <button
              key={f.v}
              onClick={() => setFilter(f.v)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${filter===f.v ? 'bg-[#ff6a5c] text-white' : 'inset-bg tk-ink hover:bg-[var(--glow-soft)] ring-rose'}`}
            >{f.label}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(d => {
          const resolved = decisions[d.id];
          const choice = resolved?.choice;
          return (
            <div key={d.id} className={`glass rounded-2xl p-5 ring-rose transition ${resolved ? 'border-l-4' : ''}`} style={resolved ? {borderLeftColor: choice==='yes'?'#10B981':choice==='no'?'#EF4444':choice==='legal'?'#F59E0B':'#94A3B8'} : {}}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold text-white" style={{background:WAVES[d.wave-1].color}}>Wave {d.wave}</span>
                    <span className="text-[11px] text-[#71717A] uppercase tracking-wider">{d.category}</span>
                    {choice && <span className={`text-[11px] uppercase tracking-wider font-semibold ${choice==='yes'?'text-emerald-700':choice==='no'?'text-[#ff3b30]':choice==='legal'?'text-amber-700':'text-[#71717A]'}`}>· {choice}</span>}
                  </div>
                  <div className="text-sm font-medium tk-inkb leading-snug">{d.q}</div>
                  <div className="text-[12px] text-[#71717A] mt-1.5"><span className="font-semibold">Impact:</span> {d.impact}</div>
                  <div className="text-[12px] text-[#71717A] mt-0.5"><span className="font-semibold">Suggested:</span> {d.defaultAns}</div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { v:'yes', label:'Approve', color:'#10B981', bg:'bg-emerald-600' },
                  { v:'no', label:'Hold', color:'#EF4444', bg:'bg-rose-700' },
                  { v:'legal', label:'Defer to Legal', color:'#F59E0B', bg:'bg-amber-600' },
                  { v:'discuss', label:'Discuss', color:'#6366F1', bg:'bg-indigo-600' }
                ].map(opt => (
                  <button
                    key={opt.v}
                    onClick={() => setDecision(d.id, opt.v, d)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition ${choice===opt.v ? `${opt.bg} text-white` : 'inset-bg tk-ink hover:bg-[var(--glow-soft)] ring-rose'}`}
                  >{opt.label}</button>
                ))}
                {resolved && (
                  <button
                    onClick={() => setDecision(d.id, 'clear', d)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-[#71717A] hover:text-[#ff3b30] transition ml-auto"
                  >Clear</button>
                )}
              </div>
              {decisions[d.id] && (() => {
                const sel = gateSel[d.id] ?? DECISION_GATE_MAP[d.id] ?? 'none';
                const gObj = NTN.engine.LAYER0.find(g => g.id === sel);
                const done = gObj && (layer0[sel]?.status === 'done');
                return (
                  <div className="mt-3 pt-3 flex items-center gap-2 flex-wrap" style={{borderTop:'1px solid var(--line-strong)'}}>
                    <span className="mono text-[10px] uppercase tracking-wider" style={{color:'var(--muted)'}}>Clears gate?</span>
                    <select value={sel} onChange={e => setGateSel(s => ({ ...s, [d.id]: e.target.value }))}
                      className="mono text-[11px]" style={{background:'var(--inset)', color:'var(--ink)', border:'1px solid var(--line-strong)', borderRadius:6, padding:'4px 8px'}}>
                      <option value="none">— none —</option>
                      {NTN.engine.LAYER0.map(g => <option key={g.id} value={g.id}>{GATE_SHORT[g.id] || g.id}</option>)}
                    </select>
                    {gObj && (done
                      ? <span className="mono text-[11px]" style={{color:'var(--go)'}}>✓ {GATE_SHORT[sel]} cleared</span>
                      : <button onClick={() => setLayer0({ ...layer0, [sel]: { ...(layer0[sel] || {}), status:'done' } })}
                          className="mono text-[11px]" style={{background:'var(--glow-soft)', color:'var(--ember)', border:'1px solid var(--line-strong)', borderRadius:6, padding:'4px 10px'}}>
                          Mark {GATE_SHORT[sel]} done →
                        </button>)}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// TASK MANAGER TAB
// ============================================================
function TaskManager({ tasks, setTasks, activeLine }) {
  const [filter, setFilter] = useState('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskOwner, setNewTaskOwner] = useState('');
  const [newTaskSeverity, setNewTaskSeverity] = useState('medium');
  const [newTaskDue, setNewTaskDue] = useState('');
  const sevColor = (s) => (s === 'critical' || s === 'high') ? 'var(--crit)' : s === 'medium' ? 'var(--warn)' : 'var(--muted)';

  const filtered = tasks.filter(t => {
    const passWave = (!activeLine || activeLine === 'all' || t.wave === 0 || t.wave === (SERVICE_LINES.find(s => s.id === activeLine) || {}).wave);
    if (!passWave) return false;
    if (filter === 'all') return true;
    if (filter === 'in_progress') return t.status === 'in_progress';
    if (filter === 'complete') return t.status === 'complete';
    if (['1','2','3'].includes(filter)) return t.wave === parseInt(filter);
    return true;
  });

  const updateStatus = (id, status) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status, completedAt: status==='complete' ? new Date().toISOString() : null } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const addManual = () => {
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: `task_manual_${Date.now()}`,
      title: newTaskTitle,
      owner: newTaskOwner || 'Cole',
      cost: 0,
      source: 'Manual entry',
      status: 'in_progress',
      created: new Date().toISOString(),
      wave: 0,
      severity: newTaskSeverity,
      dueDate: newTaskDue || undefined
    };
    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setNewTaskOwner('');
    setNewTaskSeverity('medium');
    setNewTaskDue('');
  };

  const stats = {
    total: tasks.length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    complete: tasks.filter(t => t.status === 'complete').length
  };

  return (
    <div className="space-y-5">
      <div className="glass rounded-3xl p-6 ring-rose">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="serif text-3xl">Live Task Manager</h3>
            <p className="text-[13px] text-[#71717A] mt-1">Auto-populated from checklists, decisions, and agent outputs · Persists across sessions</p>
          </div>
          <div className="flex gap-3">
            <div className="text-right"><div className="text-[11px] uppercase tracking-wider text-[#71717A]">Active</div><div className="mono text-2xl font-bold text-amber-600">{stats.inProgress}</div></div>
            <div className="text-right"><div className="text-[11px] uppercase tracking-wider text-[#71717A]">Complete</div><div className="mono text-2xl font-bold text-emerald-600">{stats.complete}</div></div>
          </div>
        </div>

        {/* Manual task entry */}
        <div className="inset-bg rounded-xl p-3 mb-4">
          <div className="text-[11px] uppercase tracking-wider text-[#71717A] font-semibold mb-2">Add Task Manually</div>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addManual()}
              placeholder="Task description…"
              className="flex-1 min-w-[200px] px-3 py-2 rounded-lg inset-bg border border-[#1C1C24] text-sm focus:outline-none focus:border-rose-400"
            />
            <input
              type="text"
              value={newTaskOwner}
              onChange={e => setNewTaskOwner(e.target.value)}
              placeholder="Owner"
              className="w-32 px-3 py-2 rounded-lg inset-bg border border-[#1C1C24] text-sm focus:outline-none focus:border-rose-400"
            />
            <select
              value={newTaskSeverity}
              onChange={e => setNewTaskSeverity(e.target.value)}
              title="Severity"
              className="w-28 px-2 py-2 rounded-lg inset-bg border border-[#1C1C24] text-sm focus:outline-none focus:border-rose-400 mono"
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>
            <input
              type="date"
              value={newTaskDue}
              onChange={e => setNewTaskDue(e.target.value)}
              title="Due date (optional)"
              className="w-36 px-3 py-2 rounded-lg inset-bg border border-[#1C1C24] text-sm focus:outline-none focus:border-rose-400 mono"
            />
            <button onClick={addManual} className="btn-primary px-4 py-2 rounded-lg text-sm font-medium">Add</button>
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {[
            { v:'all', label:`All (${stats.total})` },
            { v:'in_progress', label:`Active (${stats.inProgress})` },
            { v:'complete', label:`Done (${stats.complete})` },
            { v:'1', label:'Wave 1' },
            { v:'2', label:'Wave 2' },
            { v:'3', label:'Wave 3' }
          ].map(f => (
            <button
              key={f.v}
              onClick={() => setFilter(f.v)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${filter===f.v ? 'bg-[#ff6a5c] text-white' : 'inset-bg tk-ink hover:bg-[var(--glow-soft)] ring-rose'}`}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center ring-rose">
          <div className="serif text-2xl text-[#52525B]">No tasks here yet</div>
          <p className="text-[13px] text-[#71717A] mt-2">Check items in Command Brief, Service Lines, or Decisions tabs to populate this list automatically. Or add one manually above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <div key={t.id} className={`glass rounded-xl p-4 ring-rose transition ${t.status==='complete' ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <button
                  onClick={() => updateStatus(t.id, t.status==='complete' ? 'in_progress' : 'complete')}
                  className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${t.status==='complete' ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300 hover:border-rose-400'}`}
                >
                  {t.status==='complete' && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${t.status==='complete' ? 'line-through text-[#71717A]' : 'tk-inkb'}`}>{t.title}</div>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    {t.severity && <span className="text-[10px] uppercase tracking-wider mono px-1.5 py-0.5 rounded font-semibold" style={{ color: sevColor(t.severity), border: `1px solid ${sevColor(t.severity)}` }}>{t.severity}</span>}
                    <span className="text-[11px] text-[#71717A]">{t.owner}</span>
                    {t.cost > 0 && <span className="mono text-[11px] text-[#ff3b30]">${t.cost.toLocaleString()}</span>}
                    <span className="text-[11px] text-[#52525B]">·</span>
                    <span className="text-[11px] text-[#71717A]">{t.source}</span>
                    {t.linkedLineId && <span className="text-[10px] mono px-1.5 py-0.5 rounded" style={{ color: 'var(--data)', background: 'var(--glow-soft)' }}>line:{t.linkedLineId}</span>}
                    {t.linkedGateId && <span className="text-[10px] mono px-1.5 py-0.5 rounded" style={{ color: 'var(--data)', background: 'var(--glow-soft)' }}>gate:{t.linkedGateId}</span>}
                    {t.linkedDecisionId && <span className="text-[10px] mono px-1.5 py-0.5 rounded" style={{ color: 'var(--data)', background: 'var(--glow-soft)' }}>{t.linkedDecisionId}</span>}
                    {t.dueDate && <span className="text-[10px] mono text-[#71717A]">due {t.dueDate}</span>}
                    {t.wave > 0 && <span className="text-[11px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold text-white" style={{background:WAVES[t.wave-1].color}}>W{t.wave}</span>}
                  </div>
                </div>
                <button onClick={() => deleteTask(t.id)} className="text-[#52525B] hover:text-rose-600 transition text-sm flex-shrink-0">×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// AGENT CONSOLE TAB
// ============================================================
const AGENT_PROFILES = [
  {
    id:'orchestrator', name:'Master Orchestrator',
    description:'Cross-wave strategic synthesis. Use for sequencing decisions, capital reallocation, dependency analysis.',
    color:'#E11D48',
    systemPrompt:`You are the Master Orchestrator agent for NTN Nouveau, a 10-service-line interventional psychiatry and longevity platform Cole Dyar (DMFT, LAADC, CEAP, SVP Strategy & Innovation at Northbound Treatment Network) is building inside Neurish Wellness.

Platform context:
- Wave 1 (Tier 1): PGx, Spravato, TMS — $468K capital, $655K/mo M12 revenue
- Wave 2 (Tier 2): ART, SGB, Ketamine, Neurofeedback — $77K capital, $108K/mo M12 revenue  
- Wave 3 (Tier 3): NAD+, Peptides, HBOT — $228K capital, $57K/mo M12 revenue
- Total: $773K capital, $820K/mo M12 ($9.84M annualized), 18 FTE, 52-58% blended GM
- Sequencing: PGx first (Wk 2), Spravato (Wk 8-10), TMS (Wk 12-14), ART (W2 Wk 2), SGB (W2 Wk 4-5), Ketamine (W2 Wk 6-8), Neurofeedback (W2 Wk 10-12), NAD+ (W3 Wk 4-5), Peptides (W3 Wk 6-8), HBOT (W3 Wk 12-16)

Cole is a peer. Skip explanatory preamble. Lead with the answer. Strong, kind, composed. Push back when he's wrong. No "consult a professional" caveats. No mushy talk. Match his urgency. Flag fear-based decisions if you see them. Match his communication style: prose over bullets, tight on mobile, peer-to-peer always.

When asked to plan, generate concrete steps with owners, costs, and timelines. When asked to analyze, be specific about tradeoffs. When asked for opinions, give them with reasoning.`
  },
  {
    id:'compliance', name:'Compliance & Legal',
    description:'REMS, DHCS, DEA, NFPA 99, FDA monitoring, HIPAA, AKS/Stark exposure analysis.',
    color:'#F59E0B',
    systemPrompt:`You are the Compliance & Legal agent for NTN Nouveau. Cole Dyar is the SVP making decisions. Critical compliance items in scope:

- Spravato: REMS Inpatient Healthcare Setting cert + DHCS plan-of-operation amendment + DEA site registration. POS 55 unresolved (Janssen lists POS 11/22/53 only) — needs CA healthcare counsel opinion.
- TMS: PA supervision ratio 1:8 effective 1/1/2026 (AB 1501). MagVenture 510(k): K150641, K170114, K172667, K173620, K252032, K251119.
- PGx: No new license required for collection-only. GINA, CalGINA, CA Civ Code §56.17 apply. AKS/Stark exposure if bundled with residential admission.
- Ketamine: DEA Schedule III. Ryan Haight in-person snap-back Jan 1 2027.
- SGB: Corporate practice of medicine if contracting physician.
- NAD+/Peptides: FDA warning-letter risk for disease claims. Strict no-disease-claims marketing policy required.
- HBOT: NFPA 99 Ch 14 — exclusive-use room, 2-hr fire-rated, sprinklered, oxygen-monitored.
- Peptides: 🔴 Time-limited window (Feb 2026 HHS reclassification). Weekly FDA/PCAC monitoring first 6 months mandatory.

Cole is a peer (DMFT, LAADC, CEAP). Skip preamble. Lead with the answer. Cite specific statutes and citations. Flag [LEGAL REVIEW] items explicitly. Never give "consult a professional" boilerplate — Cole IS the professional. He needs strategic compliance navigation, not disclaimers.`
  },
  {
    id:'capital', name:'Capital & P&L',
    description:'Capital deployment, revenue modeling, payor mix, gross margin scenarios, ROI analysis.',
    color:'#10B981',
    systemPrompt:`You are the Capital & P&L agent for NTN Nouveau. Cole Dyar is making capital allocation calls.

Capital model:
- Low scenario: $483K total ($277K W1 + $45K W2 + $161K W3)
- Realistic: $773K ($468K W1 + $77K W2 + $228K W3) — RECOMMENDED
- Premium: $1.28M ($781K W1 + $158K W2 + $343K W3)

Revenue M12:
- Conservative: $534K/mo ($6.4M annualized)
- Target: $820K/mo ($9.84M annualized)  
- Stretch: $1.21M/mo ($14.5M annualized)

Year 2 net at steady-state target: $5.5M-$7.5M.

Payor mix: 4 insurance-primary lines (Spravato, TMS, ART, PGx), 4 cash-primary (Ketamine, Neurofeedback, NAD+, HBOT), 2 hybrid (SGB, Peptides).

Validation corrections applied: PGx revenue +86% ($54K vs $29K) due to CLFS rates 2.5-5x higher than original estimates. Spravato confirmed. TMS confirmed.

Cole is a peer. Lead with the math. Show your work. No preamble. Reference specific dollar figures and percentages. When he asks for a recommendation, give it with reasoning.`
  },
  {
    id:'staffing', name:'Staffing & Workflow',
    description:'FTE planning, credentialing timelines, cross-training matrix, hiring sequence.',
    color:'#6366F1',
    systemPrompt:`You are the Staffing & Workflow agent for NTN Nouveau. Total target FTE: 18.05 across 10 service lines, $1.74M annual labor.

Critical hires: BCIA Tech (Wave 2, 2-3 mo lead time), REMS RN (6-8 weeks + 2-4 weeks training), CHT Operator (Wave 3 HBOT, 2-3 mo), Contracted anesthesiologist (active outreach).

Already in hand: Dr. Sanchez (Sydea — CA license + DEA), Dr. Tawfique (CA license + DEA), existing residential staff base. REMS prescriber cert is 1-2 days online.

Cross-training matrix saves ~$110K/yr: One RN covers Spravato + TMS + PGx + Ketamine + SGB recovery + NAD+. One LMFT covers ART + neurofeedback supervision. Cross-training cost ~$8K total.

PA supervision ratio 1:8 effective 1/1/2026 (AB 1501) — operational flexibility.

Cole is a peer. Skip preamble. Be specific about timelines and costs. Flag staffing dependencies (e.g., "Can't launch X until you hire Y"). Strategist Cole lets the team make wrong moves and uses aftermath as teaching moment — don't over-protect his subordinates in your analysis.`
  }
];

function AgentConsole({ apiKey, setApiKey, agentThreads, setAgentThreads }) {
  const [activeAgent, setActiveAgent] = useState('orchestrator');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showApiSetup, setShowApiSetup] = useState(!apiKey);
  const [tempKey, setTempKey] = useState('');
  const messagesEndRef = useRef<any>(null);

  const currentThread = agentThreads[activeAgent] || [];
  const profile: any = AGENT_PROFILES.find(p => p.id === activeAgent);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentThread]);

  const callAPI = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role:'user', content: input, ts: Date.now() };
    const newThread = [...currentThread, userMsg];
    setAgentThreads({ ...agentThreads, [activeAgent]: newThread });
    setInput('');
    setLoading(true);

    try {
      // Build conversation history for API
      const messages = newThread.map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-opus-4-7',
          max_tokens: 1500,
          system: profile.systemPrompt,
          messages: messages
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`API ${response.status}: ${err.slice(0,200)}`);
      }

      const data = await response.json();
      const assistantText = (data.content || [])
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('\n');

      const assistantMsg = { role:'assistant', content: assistantText, ts: Date.now() };
      setAgentThreads(prev => ({ ...prev, [activeAgent]: [...newThread, assistantMsg] }));
    } catch (e: any) {
      const errMsg = { role:'assistant', content: `[Error: ${e.message}]\n\nIf this is a CORS issue, the Anthropic API needs to be called from a server. For a deployed version, set up a Netlify function proxy. For now, you can paste responses manually or use this UI as a planning surface.`, ts: Date.now(), error:true };
      setAgentThreads(prev => ({ ...prev, [activeAgent]: [...newThread, errMsg] }));
    } finally {
      setLoading(false);
    }
  };

  const clearThread = () => {
    setAgentThreads({ ...agentThreads, [activeAgent]: [] });
  };

  const saveKey = () => {
    if (tempKey.trim()) {
      setApiKey(tempKey.trim());
      setShowApiSetup(false);
      setTempKey('');
    }
  };

  return (
    <div className="space-y-5">
      <div className="glass rounded-3xl p-6 ring-rose">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="serif text-3xl">Agent Console</h3>
            <p className="text-[13px] text-[#71717A] mt-1">Live AI agents working inside the roadmap · Each pre-loaded with platform context</p>
          </div>
          <button onClick={() => setShowApiSetup(!showApiSetup)} className="text-[12px] text-[#ff3b30] hover:text-[#F0ABFC]">
            {apiKey ? '✓ API Connected · Edit' : '⚠ Set API Key'}
          </button>
        </div>

        {showApiSetup && (
          <div className="rounded-xl p-4 mb-4 border" style={{background:'rgba(251,191,36,0.06)', borderColor:'rgba(251,191,36,0.3)'}}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{background:'var(--warn)'}}/>
              <div className="text-[11px] uppercase tracking-[0.2em] font-semibold mono warn-text">Anthropic API Key</div>
            </div>
            <p className="text-[11.5px] mb-3 leading-relaxed" style={{color:'var(--dim)'}}>Stored locally via persistent storage. Direct browser-to-API calls use the <span className="mono" style={{color:'var(--ink)'}}>dangerous-direct-browser-access</span> header — for production, route through a Netlify function proxy (your embr/ComplianceIQ pattern).</p>
            <div className="flex gap-2">
              <input
                type="password"
                value={tempKey}
                onChange={e => setTempKey(e.target.value)}
                placeholder="sk-ant-…"
                className="field mono flex-1"
              />
              <button onClick={saveKey} disabled={!tempKey.trim()} className="btn-primary">Save Key</button>
            </div>
          </div>
        )}

        {/* Agent selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {AGENT_PROFILES.map(p => {
            const isActive = activeAgent === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActiveAgent(p.id)}
                className="text-left p-3.5 rounded-xl transition"
                style={isActive ? {
                  background: `linear-gradient(180deg, ${p.color}1F, ${p.color}0A)`,
                  border: `1px solid ${p.color}66`,
                  boxShadow: `0 0 0 1px ${p.color}22, 0 0 24px -6px ${p.color}44`
                } : {
                  background: 'var(--surface)',
                  border: '1px solid var(--border)'
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{background:p.color, boxShadow:`0 0 8px ${p.color}`}}/>
                  <div className="text-[12.5px] font-semibold" style={{color: isActive ? 'var(--ink-bright)' : 'var(--ink)'}}>{p.name}</div>
                </div>
                <div className="text-[11px] leading-snug" style={{color: isActive ? 'var(--dim)' : 'var(--muted)'}}>{p.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation */}
      <div className="onyx-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full pulse-data" style={{background:profile.color, boxShadow:`0 0 10px ${profile.color}`}}/>
            <div className="font-semibold text-[13.5px]" style={{color:'var(--ink-bright)'}}>{profile.name}</div>
            <span className="chip mono">claude-opus-4-7</span>
            {currentThread.length > 0 && <span className="text-[11px] mono" style={{color:'var(--muted)'}}>· {currentThread.length} msgs</span>}
          </div>
          {currentThread.length > 0 && (
            <button onClick={clearThread} className="text-[11px] mono hover:text-[var(--data)] transition" style={{color:'var(--muted)'}}>clear thread ×</button>
          )}
        </div>

        <div className="rounded-xl p-3 mb-3 max-h-[460px] overflow-y-auto" style={{background:'var(--bg)', border:'1px solid var(--border)'}}>
          {currentThread.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="serif text-2xl" style={{color:'var(--ink-bright)'}}>Ask {profile.name} anything</div>
              <div className="text-[12.5px] mt-3 max-w-md mx-auto leading-relaxed" style={{color:'var(--dim)'}}>Each agent has the full Nouveau platform loaded. Try <span className="mono" style={{color:'var(--data)'}}>"Build me a 30-day plan to launch PGx"</span> · <span className="mono" style={{color:'var(--data)'}}>"What blocks Spravato launch right now?"</span> · <span className="mono" style={{color:'var(--data)'}}>"Recompute capital if we drop HBOT."</span></div>
            </div>
          ) : (
            <div className="space-y-3">
              {currentThread.map((m, i) => (
                <div key={i} className={`agent-msg ${m.role==='user' ? 'ml-8' : 'mr-8'}`}>
                  {m.role === 'user' ? (
                    <div className="rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap" style={{background:'linear-gradient(180deg, var(--glow-soft), var(--glow-soft))', border:'1px solid var(--glow-soft)', color:'var(--ink-bright)'}}>
                      {m.content}
                    </div>
                  ) : m.error ? (
                    <div className="rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap" style={{background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.3)', color:'#FCA5A5'}}>
                      {m.content}
                    </div>
                  ) : (
                    <div className="rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap" style={{background:'var(--elevated)', border:'1px solid var(--border-strong)', color:'var(--ink)'}}>
                      {m.content}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="mr-8 agent-msg">
                  <div className="rounded-xl px-3.5 py-2.5 inline-flex items-center gap-2" style={{background:'var(--elevated)', border:'1px solid var(--border-strong)'}}>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:'var(--data)', animationDelay:'0ms'}}/>
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:'var(--data)', animationDelay:'150ms'}}/>
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:'var(--data)', animationDelay:'300ms'}}/>
                    </div>
                    <span className="text-[11px] mono" style={{color:'var(--muted)'}}>{profile.name} is thinking…</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef}/>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) callAPI(); }}
            placeholder={apiKey ? `Ask ${profile.name}…  ⌘+Enter to send` : 'Set API key above to enable agents'}
            disabled={!apiKey || loading}
            rows={2}
            className="field flex-1 resize-none disabled:opacity-50"
          />
          <button
            onClick={callAPI}
            disabled={!apiKey || !input.trim() || loading}
            className="btn-primary self-end"
          >Send</button>
        </div>
      </div>

      {/* Quick prompts */}
      <div className="onyx-card p-5">
        <div className="eyebrow mb-3"><span>Quick Prompts</span></div>
        <div className="flex flex-wrap gap-2">
          {[
            'Build a 30-day plan to launch PGx',
            'What blocks Spravato launch right now?',
            'Recompute capital if we drop HBOT',
            'Write the REMS Authorized Rep job description',
            'Draft email to Olympia Pharmacy for NAD+ contract',
            'Risk-rank the 10 service lines for me',
            'Critical path if Cigna keeps PA after 3/6/2026',
            'What if PGx volume hits 60/mo by Month 6?'
          ].map(q => (
            <button
              key={q}
              onClick={() => setInput(q)}
              disabled={!apiKey}
              className="btn-ghost disabled:opacity-40"
            >{q}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CLINICAL REFERENCE · mechanism / evidence / synergies / contraindications
// ============================================================
function ClinicalReferenceView({ setSelection, setActiveTab }) {
  const [expanded, setExpanded] = useState<any>(null);
  const [tierFilter, setTierFilter] = useState('all');

  const filtered = CLINICAL_DATA.filter(c => tierFilter === 'all' || c.tier === tierFilter);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="onyx-card-pop p-6 md:p-8 relative overflow-hidden">
        <div className="top-accent-bar absolute top-0 left-0 right-0"/>
        <span className="hero-accent"/>
        <div className="eyebrow mb-3"><span>Clinical Reference · Evidence Base</span></div>
        <h2 className="serif text-4xl md:text-5xl leading-[1.05] tracking-tight" style={{color:'var(--ink-bright)'}}>
          The science <span className="gradient-text">behind the ten</span>
        </h2>
        <p className="mt-4 max-w-2xl text-[14px] leading-[1.7]" style={{color:'var(--dim)'}}>
          Mechanism of action, evidence base with citations, synergies with current evidence-based practice, and contraindications for all 10 Nouveau service lines. Tap any line to expand the dossier.
        </p>
      </div>

      {/* Source governance — the volatile-claim registry */}
      <SourceRegistryView />

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-[0.18em] mono mr-1" style={{color:'var(--muted)'}}>Filter</span>
        {[
          { v: 'all', label: 'All 10' },
          { v: 'Tier 1', label: 'Tier 1 (3)' },
          { v: 'Tier 2', label: 'Tier 2 (4)' },
          { v: 'Tier 3', label: 'Tier 3 (3)' }
        ].map(f => (
          <button key={f.v} onClick={() => setTierFilter(f.v)} className={`btn-ghost ${tierFilter === f.v ? 'active' : ''}`}>{f.label}</button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {filtered.map((svc, i) => {
          const isOpen = expanded === svc.slId;
          return (
            <div key={svc.slId} className="onyx-card onyx-card-interactive p-5 relative overflow-hidden" onClick={() => setExpanded(isOpen ? null : svc.slId)}>
              <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{background:`linear-gradient(180deg, ${svc.tierColor}, ${svc.tierColor}33)`, boxShadow:isOpen?`0 0 14px ${svc.tierColor}66`:'none'}}/>
              <div className="flex items-center justify-between gap-3 pl-2 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:svc.tierColor, boxShadow:`0 0 8px ${svc.tierColor}`}}/>
                  <h3 className="serif text-xl leading-tight" style={{color:'var(--ink-bright)'}}>{svc.name}</h3>
                  <span className="chip" style={{color:svc.tierColor, borderColor:svc.tierColor+'55', background:svc.tierColor+'15'}}>{svc.tier}</span>
                </div>
                <div className="text-[14px] mono flex-shrink-0" style={{color:'var(--muted)', transform:isOpen?'rotate(180deg)':'rotate(0deg)', transition:'transform 240ms ease'}}>▾</div>
              </div>

              {isOpen && (
                <div className="mt-5 pt-5 hairline-t pl-2 space-y-5" onClick={e => e.stopPropagation()}>
                  <div className="text-[11px] mono" style={{color:'var(--muted)'}}>classification · {svc.classification}</div>

                  <div>
                    <div className="eyebrow mb-2"><span style={{color:svc.tierColor}}>Mechanism of Action</span></div>
                    <p className="text-[13px] leading-[1.75]" style={{color:'var(--dim)'}}>{svc.mechanism}</p>
                  </div>

                  <div>
                    <div className="eyebrow mb-3"><span style={{color:svc.tierColor}}>Evidence Base · {svc.evidence.length}</span></div>
                    <div className="space-y-0">
                      {svc.evidence.map((ev, ei) => (
                        <div key={ei} className="text-[12.5px] leading-[1.65] flex gap-3 py-2.5 hairline-b last:border-0" style={{color:'var(--dim)'}}>
                          <span className="data-num text-[11px] flex-shrink-0 mt-0.5">{String(ei+1).padStart(2,'0')}</span>
                          <span className="flex-1">{ev}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="eyebrow mb-2"><span>Synergies with Current EBP</span></div>
                    <p className="text-[13px] leading-[1.75]" style={{color:'var(--dim)'}}>{svc.synergies}</p>
                  </div>

                  <div className="p-4 rounded-md" style={{background:'rgba(244,63,94,0.06)', border:'1px solid rgba(244,63,94,0.25)'}}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-1 h-3.5 rounded-sm" style={{background:'var(--crit)'}}/>
                      <div className="text-[10px] uppercase tracking-[0.18em] font-semibold mono crit-text">Contraindications &amp; Precautions</div>
                    </div>
                    <div className="text-[12.5px] leading-[1.75] pl-3" style={{color:'var(--dim)'}}>{svc.contraindications}</div>
                  </div>

                  <div className="pt-3 flex items-center justify-between flex-wrap gap-2 hairline-t">
                    <div className="flex items-center gap-2 flex-wrap text-[10px] mono" style={{color:'var(--faint)'}}>
                      <SourceBadge status="needs-review" title={clinicalSource(svc.slId, svc.name).notes}/>
                      <span>review: Medical Director · annual · verified never</span>
                    </div>
                    {setSelection && SERVICE_LINES.find(s => s.id === svc.slId) && (
                      <button onClick={(e) => { e.stopPropagation(); setSelection({type:'service-line', id: svc.slId}); }} className="btn-primary text-[11px]">Operational dossier →</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Closing — The Neuroplasticity Convergence */}
      <div className="aurora-divider"/>
      <div className="onyx-card-pop p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full" style={{background:'radial-gradient(circle, var(--glow-soft), transparent 60%)', pointerEvents:'none'}}/>
        <div className="eyebrow mb-3"><span>Closing Framework</span></div>
        <h3 className="serif text-3xl md:text-4xl leading-[1.1] relative" style={{color:'var(--ink-bright)'}}>
          The <span className="gradient-text">Neuroplasticity Convergence</span>
        </h3>
        <p className="mt-4 text-[13.5px] leading-[1.8] relative" style={{color:'var(--dim)'}}>
          All 10 Nouveau service lines share a common neurobiological thread: <span style={{color:'var(--ink)'}}>enhanced neuroplasticity</span>. Spravato and ketamine drive glutamatergic synaptogenesis via NMDA/AMPA/BDNF/mTOR pathways. TMS induces LTP-like plasticity through electromagnetic cortical stimulation. SGB resets sympathetic tone, removing the autonomic barrier to neural circuit repair. Neurofeedback trains self-regulation through operant conditioning of brain activity patterns. ART leverages memory reconsolidation to rescript traumatic memory traces. HBOT promotes neurogenesis, synaptogenesis, and angiogenesis through oxygen-mediated molecular cascades. Even NAD+ supports neuroplasticity by restoring mitochondrial energy supply to metabolically depleted neurons.
        </p>
        <div className="mt-6 pt-5 hairline-t relative">
          <div className="text-[10px] uppercase tracking-[0.18em] font-semibold mono mb-2 data-num">The Thesis</div>
          <p className="serif text-xl md:text-2xl leading-[1.4]" style={{color:'var(--ink-bright)'}}>
            "Ten modalities, one common substrate. The platform treats the brain's capacity to change — and the change itself."
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// GUIDE · operator manual + live state snapshot
// ============================================================
function GuideView({ checklist, tasks, decisions, serviceState, setActiveTab }) {
  const checkedDays = CRITICAL_PATH_14.filter((_, i) => checklist[`cp14_${i}`]);
  const checklistDone = checkedDays.length;
  const checklistTotal = CRITICAL_PATH_14.length;
  const checklistPct = (checklistDone / checklistTotal) * 100;
  const costCommitted = checkedDays.reduce((s, p) => s + (p.cost || 0), 0);
  const decisionsResolved = Object.keys(decisions).length;
  const decisionsPending = OPEN_DECISIONS.length - decisionsResolved;
  const tasksActive = tasks.filter(t => t.status === 'in_progress').length;
  const tasksComplete = tasks.filter(t => t.status === 'complete').length;
  const risksResolved = Object.keys(serviceState || {}).filter(k => k.includes('_risk_') && serviceState[k]).length;
  const totalRisks = SERVICE_LINES.reduce((s, sl) => s + sl.blockingRisks.length, 0);

  const tabsManifest = [
    { id:'command',      label:'Command',      icon:'◉', desc:'Mission control. The Way Through decider, the all-10 Line Status board, live pulse + next-3 actions, the synthesis, the three waves, and the 14-day critical path.' },
    { id:'lines',        label:'Lines',        icon:'◇', desc:`All ${SERVICE_LINES.length} service lines. Filter by wave or focus on the launch three. Expand any line for its dossier; click a blocking risk to dispatch it to Tasks. Use the top-bar lens to scope the whole app to one line.` },
    { id:'clinical',     label:'Clinical',     icon:'⊕', desc:'Clinical reference for each line — mechanism, evidence, synergies, contraindications. The science behind the ten.' },
    { id:'spine',        label:'Spine',        icon:'▦', desc:'The Layer-0 legal/entity spine + the capability map (L0–L4). Flip a gate and every dependent line recomputes live. The ranked critical path lives here.' },
    { id:'capital',      label:'Capital',      icon:'◈', desc:'The bottoms-up driver model (edit any cell, totals recompute live), capital deployment by month, scenario toggles, revenue trajectory, and the full platform P&L. Lens-aware — scope to one line.' },
    { id:'staffing',     label:'Staffing',     icon:'◆', desc:'FTE × service-line matrix, cross-training savings, critical hires by lead time, and assets already in hand.' },
    { id:'execution',    label:'Execution',    icon:'☑', desc:`Where the work lives — Tasks, Decisions (${OPEN_DECISIONS.length} open), and the Gantt as sub-tabs. Auto-populated from critical-path checks, blocking risks, and resolved decisions.` },
    { id:'intelligence', label:'Intelligence', icon:'◢', desc:'Agent + Changelog. Four AI specialists pre-loaded with full platform context, plus the append-only weekly snapshot history.' }
  ];

  return (
    <div className="space-y-6">
      {/* Hero · what this is */}
      <div className="onyx-card-pop p-8 md:p-10 relative overflow-hidden">
        <div className="top-accent-bar absolute top-0 left-0 right-0"/>
        <span className="hero-accent"/>
        <div className="eyebrow mb-4"><span>Operator Manual · v2 · 2026-04-28</span></div>
        <h2 className="serif text-4xl md:text-5xl leading-[1.05] tracking-tight" style={{color:'var(--ink-bright)'}}>
          How to operate the <span className="gradient-text">Live Execution OS</span>
        </h2>
        <p className="mt-5 max-w-2xl text-[14.5px] leading-[1.7]" style={{color:'var(--dim)'}}>
          This is a command center for the 10-service-line interventional psychiatry platform. State persists locally per browser. Every check, decision, and risk routes data into the Task Manager so nothing falls through. The four AI agents have the full platform brief loaded as system context.
        </p>
      </div>

      {/* Live state · where you are right now */}
      <div className="section-eyebrow"><span>Live State · Where You Are Right Now</span></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="onyx-card p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] font-semibold mono" style={{color:'var(--muted)'}}>14-Day Critical Path</div>
          <div className="flex items-baseline gap-2 mt-2">
            <div className="serif text-4xl leading-none data-num">{checklistDone}<span style={{color:'var(--muted)'}}>/{checklistTotal}</span></div>
          </div>
          <div className="mt-3 h-1 rounded-full overflow-hidden" style={{background:'var(--border)'}}>
            <div className="h-full progress-bar transition-all" style={{width:`${checklistPct}%`}}/>
          </div>
          <div className="text-[11px] mt-2 mono" style={{color:'var(--dim)'}}>{checklistPct.toFixed(0)}% complete</div>
        </div>
        <div className="onyx-card p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] font-semibold mono" style={{color:'var(--muted)'}}>Cost Committed</div>
          <div className="serif text-4xl leading-none mt-2 pos-text">${costCommitted.toLocaleString()}</div>
          <div className="text-[11px] mt-3 mono" style={{color:'var(--dim)'}}>from checked critical path items</div>
        </div>
        <div className="onyx-card p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] font-semibold mono" style={{color:'var(--muted)'}}>Decisions</div>
          <div className="flex items-baseline gap-3 mt-2">
            <div className="serif text-4xl leading-none warn-text">{decisionsPending}</div>
            <span className="text-[11px] mono" style={{color:'var(--muted)'}}>pending</span>
          </div>
          <div className="text-[11px] mt-3 mono" style={{color:'var(--dim)'}}>{decisionsResolved} resolved · {OPEN_DECISIONS.length} total</div>
        </div>
        <div className="onyx-card p-4">
          <div className="text-[10px] uppercase tracking-[0.18em] font-semibold mono" style={{color:'var(--muted)'}}>Tasks</div>
          <div className="flex items-baseline gap-3 mt-2">
            <div className="serif text-4xl leading-none accent-text">{tasksActive}</div>
            <span className="text-[11px] mono" style={{color:'var(--muted)'}}>active</span>
          </div>
          <div className="text-[11px] mt-3 mono" style={{color:'var(--dim)'}}>{tasksComplete} complete · {risksResolved}/{totalRisks} risks resolved</div>
        </div>
      </div>

      <div className="aurora-divider"/>

      {/* Quick orient */}
      <div className="section-eyebrow"><span>Quick Orient · 4 Things to Know</span></div>
      <div className="grid md:grid-cols-2 gap-3">
        {[
          { num:'01', title:'Every check routes to Tasks', body:'Critical-path checks, blocking-risk dispatches, and approved decisions all auto-create Task Manager entries with source attribution. Nothing falls through.' },
          { num:'02', title:'Click any card → drawer opens', body:'Wave cards open a wave dossier. Service-line cards open the full dossier with reasoning, bottom line, blocking risks, CPT codes, key decisions. Same for decisions.' },
          { num:'03', title:'⌘K opens the command palette', body:`Search across ${SERVICE_LINES.length} service lines, ${OPEN_DECISIONS.length} decisions, the 14-day path, and your tasks. ↑↓ to navigate, ⏎ to open. Works from any zone. Esc to close.` },
          { num:'04', title:'Agents have full platform context', body:'Set your Anthropic key once (stored locally). Each agent\'s system prompt has the platform brief. Try: "Build a 30-day plan to launch PGx" or "Risk-rank the 10 lines."' }
        ].map(b => (
          <div key={b.num} className="onyx-card p-5">
            <div className="serif text-3xl leading-none mb-2 data-num">{b.num}</div>
            <div className="serif text-lg leading-tight" style={{color:'var(--ink-bright)'}}>{b.title}</div>
            <p className="text-[13px] mt-2 leading-relaxed" style={{color:'var(--dim)'}}>{b.body}</p>
          </div>
        ))}
      </div>

      <div className="aurora-divider"/>

      {/* The 8 tabs */}
      <div className="section-eyebrow"><span>The Tabs · What Each One Does</span></div>
      <div className="onyx-card p-6 md:p-8">
        <div className="space-y-1">
          {tabsManifest.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className="w-full text-left flex items-start gap-4 p-3 rounded-md hover:bg-[var(--surface)] transition group">
              <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 mono text-base" style={{background:'var(--surface)', border:'1px solid var(--border)', color:'var(--data)'}}>{t.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="serif text-lg leading-tight" style={{color:'var(--ink-bright)'}}>{t.label}</div>
                  <span className="text-[10px] mono group-hover:text-[var(--data)] transition" style={{color:'var(--muted)'}}>→ open</span>
                </div>
                <div className="text-[12.5px] mt-1 leading-relaxed" style={{color:'var(--dim)'}}>{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="aurora-divider"/>

      {/* Data flow */}
      <div className="section-eyebrow"><span>Data Flow · How Actions Route</span></div>
      <div className="onyx-card p-6 md:p-8">
        <div className="space-y-3 text-[13.5px] leading-relaxed">
          <div className="flex items-start gap-3">
            <span className="chip chip-data mt-0.5">Check</span>
            <div style={{color:'var(--dim)'}}>Check a <span style={{color:'var(--ink)'}}>Critical Path</span> item <span className="accent-text">→</span> creates a new Task with owner, cost, source = "Critical Path 14-Day"</div>
          </div>
          <div className="flex items-start gap-3">
            <span className="chip chip-crit mt-0.5">Risk</span>
            <div style={{color:'var(--dim)'}}>Click a <span style={{color:'var(--ink)'}}>blocking risk</span> on any service line <span className="accent-text">→</span> creates a Task with owner = "Compliance/Clinical", source = "{`{line.short}`} blocking risk"</div>
          </div>
          <div className="flex items-start gap-3">
            <span className="chip chip-accent mt-0.5">Decide</span>
            <div style={{color:'var(--dim)'}}>Approve or Defer-to-Legal a <span style={{color:'var(--ink)'}}>decision</span> <span className="accent-text">→</span> creates a Task; Hold and Discuss do not route (yet)</div>
          </div>
          <div className="flex items-start gap-3">
            <span className="chip chip-pos mt-0.5">Manual</span>
            <div style={{color:'var(--dim)'}}>Add any <span style={{color:'var(--ink)'}}>ad-hoc task</span> in the Tasks tab with title + owner</div>
          </div>
          <div className="flex items-start gap-3">
            <span className="chip chip-warn mt-0.5">Persist</span>
            <div style={{color:'var(--dim)'}}>Everything saves to <span className="mono" style={{color:'var(--ink)'}}>localStorage</span> under <span className="mono" style={{color:'var(--data)'}}>ntn-nouveau:*</span> keys. Persists across reloads on this browser.</div>
          </div>
        </div>
      </div>

      <div className="aurora-divider"/>

      {/* AI agents */}
      <div className="section-eyebrow"><span>AI Agents · Four Specialists</span></div>
      <div className="grid md:grid-cols-2 gap-3">
        {[
          { name:'Master Orchestrator', color:'#E11D48', use:'Cross-wave strategic synthesis. Use for sequencing decisions, capital reallocation, dependency analysis.', try:'"Build me a 30-day plan to launch PGx" · "Sequence the next 90 days assuming Wave 1 is fully funded"' },
          { name:'Compliance & Legal', color:'#FBBF24', use:'REMS, DHCS, DEA, NFPA 99, FDA monitoring, HIPAA, AKS/Stark exposure analysis.', try:'"What blocks Spravato launch right now?" · "Map the regulatory path for peptides given the Feb 2026 HHS decision"' },
          { name:'Capital & P&L', color:'#2dd4a7', use:'Capital deployment, revenue modeling, payor mix, gross margin scenarios, ROI analysis.', try:'"Recompute capital if we drop HBOT" · "What if PGx volume hits 60/mo by Month 6?"' },
          { name:'Staffing & Workflow', color:'#ff6a5c', use:'FTE planning, credentialing timelines, cross-training matrix, hiring sequence.', try:'"Write the REMS Authorized Rep job description" · "What hires need to happen in the next 30 days for Wave 1 to launch on time?"' }
        ].map(a => (
          <div key={a.name} className="onyx-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{background:a.color, boxShadow:`0 0 8px ${a.color}`}}/>
              <div className="serif text-lg leading-tight" style={{color:'var(--ink-bright)'}}>{a.name}</div>
            </div>
            <p className="text-[12.5px] leading-relaxed" style={{color:'var(--dim)'}}>{a.use}</p>
            <div className="mt-3 pt-3 hairline-t">
              <div className="text-[10px] uppercase tracking-[0.18em] mono mb-1" style={{color:'var(--muted)'}}>Try</div>
              <div className="text-[12px] mono leading-relaxed" style={{color:'var(--data)'}}>{a.try}</div>
            </div>
          </div>
        ))}
        <div className="md:col-span-2 onyx-card p-5" style={{borderColor:'var(--glow)'}}>
          <div className="flex items-center gap-2 mb-2">
            <span className="chip chip-data">model</span>
            <div className="mono text-[13px]" style={{color:'var(--ink-bright)'}}>claude-opus-4-7</div>
          </div>
          <p className="text-[12.5px] leading-relaxed" style={{color:'var(--dim)'}}>API key stored locally in your browser. Direct browser-to-API calls use <span className="mono" style={{color:'var(--ink)'}}>anthropic-dangerous-direct-browser-access</span>. For a production multi-user version, route through a Netlify function proxy (your <span className="mono" style={{color:'var(--data)'}}>embr</span> / <span className="mono" style={{color:'var(--data)'}}>ComplianceIQ</span> pattern).</p>
        </div>
      </div>

      <div className="aurora-divider"/>

      {/* Keyboard */}
      <div className="section-eyebrow"><span>Keyboard · Shortcuts</span></div>
      <div className="onyx-card p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
          {[
            ['⌘ K', 'Ctrl K', 'Open command palette'],
            ['↑ ↓', '', 'Navigate palette results'],
            ['⏎', '', 'Open selected result'],
            ['Esc', '', 'Close palette / drawer'],
            ['⌘ + ⏎', 'Ctrl ⏎', 'Send agent message'],
            ['Click ×', '', 'Close drawer (top-right)']
          ].map(([mac, win, what], i) => (
            <div key={i} className="flex items-center justify-between py-2 hairline-b">
              <span className="text-[13px]" style={{color:'var(--ink)'}}>{what}</span>
              <span className="flex items-center gap-1.5">
                {mac.split(' ').map((k, j) => <span key={j} className="kbd">{k}</span>)}
                {win && (
                  <>
                    <span className="text-[10px] mono mx-1" style={{color:'var(--muted)'}}>or</span>
                    {win.split(' ').map((k, j) => <span key={j} className="kbd">{k}</span>)}
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="aurora-divider"/>

      {/* Deploy / source */}
      <div className="section-eyebrow"><span>Deploy · Source · Reset</span></div>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="onyx-card p-5">
          <div className="text-[10px] uppercase tracking-[0.18em] mono mb-2" style={{color:'var(--muted)'}}>Hosted at</div>
          <div className="mono text-[13px] data-num">ntn-nouveau-atelier<br/>.netlify.app</div>
        </div>
        <div className="onyx-card p-5">
          <div className="text-[10px] uppercase tracking-[0.18em] mono mb-2" style={{color:'var(--muted)'}}>Deploy a new version</div>
          <div className="text-[12.5px] leading-relaxed" style={{color:'var(--dim)'}}>Drag the source folder onto the Netlify dashboard, or run <span className="mono" style={{color:'var(--data)'}}>netlify deploy --prod</span> from the folder.</div>
        </div>
        <div className="onyx-card p-5">
          <div className="text-[10px] uppercase tracking-[0.18em] mono mb-2" style={{color:'var(--muted)'}}>Reset all state</div>
          <div className="text-[12.5px] leading-relaxed" style={{color:'var(--dim)'}}>DevTools console: <span className="mono text-[11px]" style={{color:'var(--data)'}}>{`Object.keys(localStorage).filter(k=>k.startsWith('ntn-nouveau:')).forEach(k=>localStorage.removeItem(k));location.reload()`}</span></div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SIDEBAR
// ============================================================
function Changelog({ snapshots, setSnapshots, liveState }) {
  const ordered = [...snapshots].sort((a, b) => b.ts.localeCompare(a.ts)); // newest first
  const capture = () => setSnapshots([...snapshots, NTN.engine.makeSnapshot(liveState, false)]);

  const money  = (n) => `$${Math.round(n).toLocaleString()}`;
  const signed = (n, fmt) => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n));
  const SLname = (id) => { const s = SERVICE_LINES.find(x => x.id === id); return s ? s.short : id; };
  const L0name = (id) => { const g = NTN.engine.LAYER0.find(x => x.id === id); return g ? g.name : id; };

  const deltasFor = (cur, prev) => {
    if (!prev) return [];
    const c = cur.metrics, p = prev.metrics, rows: any[] = [];
    const push = (label, dv, fmt) => { if (Math.round(dv * 100) !== 0) rows.push({ label, text: signed(dv, fmt) }); };
    push('committed capital', c.committedCapital - p.committedCapital, money);
    push('M12 revenue', c.m12Monthly - p.m12Monthly, (n) => money(n) + '/mo');
    push('blended GM', (c.blendedGM - p.blendedGM) * 100, (n) => n.toFixed(1) + 'pts');
    push('lines GO', c.linesGo - p.linesGo, (n) => String(n));
    push('Layer 0 cleared', c.l0Cleared - p.l0Cleared, (n) => String(n));
    push('checklist', c.checklistPct - p.checklistPct, (n) => n.toFixed(0) + '%');
    push('decisions resolved', c.decisionsResolved - p.decisionsResolved, (n) => String(n));
    return rows;
  };
  const transitionsFor = (cur, prev) => {
    if (!prev) return [];
    const cs = cur.metrics, ps = prev.metrics, out: any[] = [];
    Object.keys(cs.lineStatuses || {}).forEach(id => {
      const a = ps.lineStatuses ? ps.lineStatuses[id] : undefined, b = cs.lineStatuses[id];
      if (a && b && a !== b) out.push({ kind: b === 'GO' ? 'go' : 'block', text: `${SLname(id)} ${a} → ${b}` });
    });
    Object.keys(cs.l0Statuses || {}).forEach(id => {
      const a = ps.l0Statuses ? ps.l0Statuses[id] : undefined, b = cs.l0Statuses[id];
      if (b === 'done' && a !== 'done') out.push({ kind: 'go', text: `${L0name(id)} → done` });
    });
    return out;
  };

  return (
    <div className="space-y-5">
      <div className="glass rounded-3xl p-6 ring-rose">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h3 className="serif text-3xl">Changelog / Trajectory</h3>
            <p className="text-[13px] text-[#71717A] mt-1">Append-only weekly snapshots. One auto-captures per ISO week; capture more anytime. History is never edited or deleted — and rides along in <span className="mono" style={{color:'var(--data)'}}>export ↓</span>.</p>
            <p className="text-[11px] mt-2 mono" style={{color:'var(--warn)'}}>Business-ops metrics only — zero PHI.</p>
          </div>
          <button onClick={capture} className="flex-shrink-0 px-4 py-2 rounded-lg text-[12px] font-semibold mono transition hover:opacity-85" style={{color:'#000', background:'var(--data)'}}>Capture snapshot</button>
        </div>
      </div>

      {ordered.length === 0 ? (
        <div className="glass rounded-3xl p-10 ring-rose text-center">
          <div className="serif text-2xl" style={{color:'var(--dim)'}}>No snapshots yet.</div>
          <div className="text-[12px] mono mt-2" style={{color:'var(--muted)'}}>One auto-captures on first load each week, or hit Capture snapshot.</div>
        </div>
      ) : ordered.map((snap, i) => {
        const prev = ordered[i + 1], m = snap.metrics;
        const deltas = deltasFor(snap, prev), transitions = transitionsFor(snap, prev);
        const d = new Date(snap.ts);
        return (
          <div key={snap.id} className="glass rounded-3xl p-5 ring-rose">
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="serif text-2xl" style={{color:'var(--ink-bright)'}}>{snap.isoWeek}</span>
              <span className="text-[11px] mono" style={{color:'var(--muted)'}}>{d.toLocaleString()}</span>
              <span className="chip mono">{snap.auto ? 'auto' : 'manual'}</span>
              {i === 0 && <span className="chip chip-data">latest</span>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {[
                { k:'Committed capital', v: money(m.committedCapital) },
                { k:'M12 revenue', v: money(m.m12Monthly) + '/mo' },
                { k:'Blended GM', v: (m.blendedGM*100).toFixed(1) + '%' },
                { k:'Lines GO / BLK', v: `${m.linesGo} / ${m.linesBlocked}` },
                { k:'Layer 0 cleared', v: `${m.l0Cleared}/${m.l0Total}` },
                { k:'Checklist', v: m.checklistPct.toFixed(0) + '%' },
                { k:'Decisions resolved', v: String(m.decisionsResolved) },
                { k:'Decisions pending', v: String(m.decisionsPending) }
              ].map(x => (
                <div key={x.k} className="inset-bg rounded-lg p-2.5">
                  <div className="text-[9.5px] uppercase tracking-wider mono" style={{color:'var(--muted)'}}>{x.k}</div>
                  <div className="mono text-base font-semibold mt-0.5" style={{color:'var(--ink-bright)'}}>{x.v}</div>
                </div>
              ))}
            </div>

            {transitions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {transitions.map((t, ti) => (
                  <span key={ti} className="text-[11px] mono px-2 py-1 rounded" style={t.kind === 'go'
                    ? { color:'var(--pos)', background:'rgba(52,211,153,0.10)', border:'1px solid rgba(52,211,153,0.30)' }
                    : { color:'var(--crit)', background:'rgba(244,63,94,0.10)', border:'1px solid rgba(244,63,94,0.30)' }}>{t.text}</span>
                ))}
              </div>
            )}

            {prev && (
              <div className="mt-3 pt-3 hairline-t">
                <div className="text-[10px] uppercase tracking-wider mono mb-1.5" style={{color:'var(--muted)'}}>Δ vs {prev.isoWeek}</div>
                {deltas.length === 0 ? (
                  <div className="text-[12px] mono" style={{color:'var(--muted)'}}>no metric change</div>
                ) : (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] mono" style={{color:'var(--dim)'}}>
                    {deltas.map((dd, di) => <span key={di}>{dd.label} <span style={{color:'var(--data)'}}>{dd.text}</span></span>)}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SyncStatus() {
  const [status, setStatus] = useState(NTN.engine.currentSync());
  useEffect(() => NTN.engine.subscribeSync(setStatus), []);
  const meta = ({
    local:      { dot:'var(--muted)', label:'local only' },
    connecting: { dot:'var(--warn)',  label:'connecting…' },
    connected:  { dot:'var(--pos)',   label:'synced' },
    offline:    { dot:'var(--warn)',  label:'offline · local' },
    error:      { dot:'var(--crit)',  label:'sync error' }
  })[status] || { dot:'var(--muted)', label:status };
  return (
    <div className="px-3 flex items-center gap-1.5 text-[10px] mono" style={{color:'var(--faint)'}}>
      <span className="w-1.5 h-1.5 rounded-full" style={{background:meta.dot, boxShadow:`0 0 6px ${meta.dot}`}}/>
      <span>{NTN.engine.currentAdapter()} · {meta.label}</span>
    </div>
  );
}

function Sidebar({ tabs, activeTab, setActiveTab, taskStats, decisionStats, checklistDone, checklistTotal, openCmdk, mobileOpen, closeMobile, openGuide }) {
  const fileRef = useRef<any>(null);
  const doExport = async () => {
    const data = await NTN.engine.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ntn-nouveau-state-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  };
  const doImport = (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = async () => {
      try { await NTN.engine.importAll(JSON.parse(r.result as string)); location.reload(); }
      catch (err: any) { alert('Import failed: ' + err.message); }
    };
    r.readAsText(f); e.target.value = '';
  };
  return (
    <>
      <div className={`sidebar-backdrop ${mobileOpen ? 'open' : ''}`} onClick={closeMobile}/>
      <aside className={`sidebar w-[224px] flex-shrink-0 flex flex-col h-screen sticky top-0 z-40 ${mobileOpen ? 'open' : ''}`}>
      <div className="px-5 py-5 hairline-b flex items-center justify-between gap-2">
        <Logo/>
        <button onClick={closeMobile} className="mobile-only" aria-label="Close menu" style={{width:36, height:36, borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--dim)', display:'inline-flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></svg>
        </button>
      </div>
      <nav className="flex-1 py-3 overflow-y-auto">
        {tabs.map(t => (
          <div key={t.id} className={`nav-item ${activeTab===t.id?'active':''}`} onClick={() => setActiveTab(t.id)}>
            <span className="icon text-[14px]">{t.icon}</span>
            <span className="flex-1">{t.label}</span>
            {t.id==='execution' && taskStats.inProgress>0 && <span className="chip chip-data">{taskStats.inProgress}</span>}
            {t.id==='execution' && decisionStats.pending>0 && <span className="chip chip-warn">{decisionStats.pending}</span>}
            {t.id==='command' && checklistDone>0 && <span className="chip chip-pos">{checklistDone}/{checklistTotal}</span>}
          </div>
        ))}
      </nav>
      <div className="px-3 py-3 hairline-t space-y-2">
        <button onClick={openCmdk} className="w-full flex items-center justify-between px-3 py-2 rounded-md text-[12px] hover:bg-[var(--surface)] transition" style={{color:'var(--dim)'}}>
          <span className="mono">search · jump</span>
          <span className="flex items-center gap-1"><span className="kbd">⌘</span><span className="kbd">K</span></span>
        </button>
        <button onClick={openGuide} className="w-full flex items-center justify-center gap-2.5 px-3 py-3 rounded-lg text-[13px] font-bold mono uppercase tracking-wider transition hover:brightness-110" style={{color:'var(--ember)', background:'var(--glow-soft)', border:'1.5px solid var(--ember)', boxShadow:'0 0 20px var(--glow), inset 0 0 12px var(--glow-soft)'}}>
          <span style={{display:'inline-flex', alignItems:'center', justifyContent:'center', width:24, height:24, borderRadius:'50%', background:'var(--ember)', color:'#fff', fontWeight:800, fontSize:14, boxShadow:'0 0 14px var(--glow)'}}>?</span>
          Help &amp; Guide
        </button>
        <div className="flex gap-2">
          <button onClick={doExport} className="flex-1 px-3 py-2 rounded-md text-[11px] mono hover:bg-[var(--surface)] transition" style={{color:'var(--dim)', border:'1px solid var(--border)'}}>export ↓</button>
          <button onClick={() => fileRef.current && fileRef.current.click()} className="flex-1 px-3 py-2 rounded-md text-[11px] mono hover:bg-[var(--surface)] transition" style={{color:'var(--dim)', border:'1px solid var(--border)'}}>import ↑</button>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={doImport} style={{display:'none'}}/>
        </div>
        <div className="px-3 text-[10px] mono" style={{color:'var(--faint)'}}>
          state · backup via export ↓
        </div>
        <SyncStatus/>
      </div>
    </aside>
    </>
  );
}

// ============================================================
// TOP BAR
// ============================================================
function TopBar({ tabs, activeTab, onMenuClick, openCmdk, fin, activeLine, setActiveLine, lines }) {
  const t = tabs.find(x => x.id === activeTab);
  const THEME_ORDER = ['onyx','blueprint','noir','atelier'];
  const THEME_LABEL = { onyx:'Onyx', blueprint:'Blueprint', noir:'Noir', atelier:'Atelier' };
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('ntn-nouveau:theme') || 'onyx'; } catch(e){ return 'onyx'; } });
  const flipTheme = () => {
    const next = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];
    setTheme(next);
    try { localStorage.setItem('ntn-nouveau:theme', next); } catch(e){}
    if (next === 'onyx') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', next);
  };
  return (
    <div className="top-bar-mobile hairline-b px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-30 gap-3" style={{background:'var(--chrome)', backdropFilter:'blur(10px) saturate(140%)', WebkitBackdropFilter:'blur(10px) saturate(140%)'}}>
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <button className="hamburger" onClick={onMenuClick} aria-label="Open menu">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="3" y1="5" x2="15" y2="5"/>
            <line x1="3" y1="9" x2="15" y2="9"/>
            <line x1="3" y1="13" x2="15" y2="13"/>
          </svg>
        </button>
        <span className="mono text-[12px]" style={{color:'var(--faint)'}}>/</span>
        <span className="mono text-[12px] truncate" style={{color:'var(--dim)'}}>ntn-nouveau</span>
        <span className="text-[12px]" style={{color:'var(--faint)'}}>›</span>
        <span className="mono text-[12px] truncate" style={{color:'var(--ink-bright)'}}>{t?.label.toLowerCase()}</span>
      </div>
      <select value={activeLine} onChange={e=>setActiveLine(e.target.value)} aria-label="Line lens"
        className="mono text-[12px] flex-shrink-0" style={{background:'var(--surface)',color:activeLine!=='all'?'var(--ink-bright)':'var(--ink)',border:'1px solid '+(activeLine!=='all'?'var(--ember)':'var(--line-strong)'),borderRadius:7,padding:'7px 10px'}}>
        <option value="all">All lines ▾</option>
        {(lines||[]).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
      <div className="hidden md:flex items-center gap-3 text-[11px] mono flex-shrink-0" style={{color:'var(--dim)'}}>
        <span>$773K cap</span>
        <span style={{color:'var(--faint)'}}>·</span>
        <span>10 lines</span>
        <span style={{color:'var(--faint)'}}>·</span>
        <span>3 waves</span>
        <span style={{color:'var(--faint)'}}>·</span>
        <span className="data-num font-semibold">${(fin.annualized/1e6).toFixed(2)}M target</span>
      </div>
      <button onClick={flipTheme} title="Flip theme" aria-label="Flip theme"
        className="mono text-[11px] flex-shrink-0 flex items-center gap-1.5" style={{background:'var(--surface)',color:'var(--ink)',border:'1px solid var(--line-strong)',borderRadius:7,padding:'7px 11px'}}>
        <span style={{width:8,height:8,borderRadius:'50%',background:'var(--data)',boxShadow:'0 0 8px var(--glow)'}}/>
        {THEME_LABEL[theme]} <span style={{color:'var(--faint)'}}>⇄</span>
      </button>
      <button onClick={openCmdk} className="mobile-only flex-shrink-0" aria-label="Open command palette" style={{width:40, height:40, borderRadius:8, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--data)', display:'inline-flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontFamily:"'JetBrains Mono', monospace", fontSize:13, fontWeight:600}}>⌖</button>
    </div>
  );
}

// ============================================================
// DRAWER · KB context for selection
// ============================================================
function Drawer({ selection, setSelection, setActiveTab }) {
  if (!selection) return null;
  const { type, id } = selection;
  const onClose = () => setSelection(null);

  if (type === 'service-line') {
    const sl = SERVICE_LINES.find(s => s.id === id);
    if (!sl) return null;
    return (
      <DrawerShell onClose={onClose} eyebrow="Service Line · Dossier">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{background: sl.color, boxShadow:`0 0 8px ${sl.color}`}}/>
          <span className="chip" style={{color:sl.color, borderColor:sl.color+'55', background:sl.color+'15'}}>Wave {sl.wave} · #{sl.order}</span>
          <span className="chip">{sl.risk} risk</span>
        </div>
        <h3 className="serif text-2xl leading-tight" style={{color:'var(--ink-bright)'}}>{sl.name}</h3>
        <div className="text-[12px] mt-1" style={{color:'var(--dim)'}}>{sl.payorModel}</div>
        <div className="text-[11px] mono mt-1" style={{color:'var(--muted)'}}>timeline · {sl.timeline}</div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            ['Capital', '$' + (sl.launchCapital/1000).toFixed(1) + 'K', 'var(--pos)'],
            ['M12/mo', '$' + (sl.m12Revenue/1000).toFixed(1) + 'K', 'var(--data)'],
            ['FTE', sl.fteTarget, 'var(--accent)']
          ].map(([l,v,c]) => (
            <div key={l} className="onyx-card-pop p-2.5">
              <div className="text-[9px] uppercase tracking-[0.14em] mono" style={{color:'var(--muted)'}}>{l}</div>
              <div className="serif text-xl mt-0.5" style={{color: c as any}}>{v}</div>
            </div>
          ))}
        </div>

        <DrawerSection title="Why This Order">
          <p style={{color:'var(--dim)'}}>{sl.reasoning}</p>
        </DrawerSection>

        <DrawerSection title="Bottom Line">
          <p style={{color:'var(--ink)'}}>{sl.bottomLine}</p>
        </DrawerSection>

        <DrawerSection title={`Blocking Risks · ${sl.blockingRisks.length}`}>
          <ul className="space-y-1.5">
            {sl.blockingRisks.map((r,i) => (
              <li key={i} className="text-[12px] flex gap-2 leading-snug" style={{color:'var(--dim)'}}>
                <span className="crit-text mt-0.5">▸</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </DrawerSection>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <div className="eyebrow mb-2"><span>CPT</span></div>
            <div className="space-y-0.5">
              {sl.cptCodes.map((c,i) => <div key={i} className="data-num text-[11px]">{c}</div>)}
            </div>
          </div>
          <div>
            <div className="eyebrow mb-2"><span>Profile</span></div>
            <div className="space-y-0.5 text-[11px]">
              <div><span style={{color:'var(--muted)'}}>reg:</span> <span style={{color:'var(--ink)'}}>{sl.regComplexity}</span></div>
              <div><span style={{color:'var(--muted)'}}>GM:</span> <span className="pos-text">{sl.grossMargin}</span></div>
              <div><span style={{color:'var(--muted)'}}>EV:</span> <span className="data-num">{sl.evidence}/5</span></div>
              <div><span style={{color:'var(--muted)'}}>VBC:</span> <span className="data-num">{sl.vbcAlignment}/5</span></div>
            </div>
          </div>
        </div>

        <DrawerSection title={`Key Decisions · ${sl.keyDecisions.length}`}>
          <ul className="space-y-1.5">
            {sl.keyDecisions.map((d,i) => (
              <li key={i} className="text-[12px] flex gap-2" style={{color:'var(--dim)'}}>
                <span className="accent-text">→</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </DrawerSection>

        <div className="pt-4 mt-4 hairline-t flex gap-2">
          <button onClick={() => { setActiveTab('lines'); onClose(); }} className="btn-primary flex-1 justify-center">Open in Service Lines →</button>
        </div>
        <div className="text-[10px] mt-3 mono" style={{color:'var(--faint)'}}>
          src · master orchestrator synth · 2026-04-28
        </div>
      </DrawerShell>
    );
  }

  if (type === 'wave') {
    const w = WAVES.find(x => x.num === id);
    if (!w) return null;
    const lines = SERVICE_LINES.filter(s => s.wave === id);
    return (
      <DrawerShell onClose={onClose} eyebrow={`Wave ${w.num} · Detail`}>
        <div className="serif text-5xl leading-none mb-2" style={{color:w.color}}>0{w.num}</div>
        <h3 className="serif text-xl leading-tight" style={{color:'var(--ink-bright)'}}>{w.name}</h3>
        <div className="text-[12px] mt-1" style={{color:'var(--dim)'}}>{w.tagline}</div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="onyx-card-pop p-2.5"><div className="text-[9px] uppercase tracking-wider mono" style={{color:'var(--muted)'}}>Capital</div><div className="serif text-xl mt-0.5 pos-text">${(w.capital/1000).toFixed(0)}K</div></div>
          <div className="onyx-card-pop p-2.5"><div className="text-[9px] uppercase tracking-wider mono" style={{color:'var(--muted)'}}>M12/mo</div><div className="serif text-xl mt-0.5 data-num">${(w.m12Revenue/1000).toFixed(0)}K</div></div>
          <div className="onyx-card-pop p-2.5"><div className="text-[9px] uppercase tracking-wider mono" style={{color:'var(--muted)'}}>FTE</div><div className="serif text-xl mt-0.5 accent-text">{w.fte}</div></div>
        </div>
        <DrawerSection title={`Lines · ${lines.length}`}>
          <div className="space-y-1.5">
            {lines.map(s => (
              <button key={s.id} onClick={() => setSelection({type:'service-line', id:s.id})} className="w-full flex items-center justify-between p-2.5 onyx-card onyx-card-interactive text-left">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{background:s.color}}/>
                  <span className="text-[12px]" style={{color:'var(--ink)'}}>{s.short}</span>
                  <span className="text-[10px] mono" style={{color:'var(--muted)'}}>{s.timeline}</span>
                </span>
                <span className="data-num text-[11px]">${(s.m12Revenue/1000).toFixed(0)}K</span>
              </button>
            ))}
          </div>
        </DrawerSection>
      </DrawerShell>
    );
  }

  if (type === 'decision') {
    const d = OPEN_DECISIONS.find(x => x.id === id);
    if (!d) return null;
    return (
      <DrawerShell onClose={onClose} eyebrow="Decision · Detail">
        <div className="flex items-center gap-2 mb-2">
          <span className="chip chip-accent">Wave {d.wave}</span>
          <span className="chip">{d.category}</span>
        </div>
        <h3 className="serif text-xl leading-tight" style={{color:'var(--ink-bright)'}}>{d.q}</h3>
        <DrawerSection title="Impact">
          <p style={{color:'var(--dim)'}}>{d.impact}</p>
        </DrawerSection>
        <DrawerSection title="Suggested">
          <p style={{color:'var(--ink)'}}>{d.defaultAns}</p>
        </DrawerSection>
        <div className="pt-4 mt-4 hairline-t">
          <button onClick={() => { setActiveTab('decisions'); onClose(); }} className="btn-primary w-full justify-center">Open in Decisions →</button>
        </div>
      </DrawerShell>
    );
  }

  return null;
}

function DrawerShell({ onClose, eyebrow, children }) {
  return (
    <>
      <div className="drawer-backdrop open mobile-only" onClick={onClose}/>
      <aside className="drawer open w-[360px] flex-shrink-0 h-screen sticky top-0 overflow-y-auto z-30">
        <div className="px-5 py-4 hairline-b flex items-center justify-between sticky top-0 z-10" style={{background:'rgba(8,8,12,0.96)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)'}}>
          <span className="eyebrow"><span>{eyebrow}</span></span>
          <button onClick={onClose} className="leading-none flex items-center justify-center rounded hover:bg-[var(--surface)] transition" style={{color:'var(--muted)', width:32, height:32, fontSize:20}} aria-label="close">×</button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </aside>
    </>
  );
}

function DrawerSection({ title, children }) {
  return (
    <div className="mt-4">
      <div className="eyebrow mb-2"><span>{title}</span></div>
      <div className="text-[12.5px] leading-relaxed">{children}</div>
    </div>
  );
}

// ============================================================
// CMD+K PALETTE
// ============================================================
function CmdPalette({ onClose, setActiveTab, setSelection, tasks, tabs }) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<any>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const q = query.toLowerCase().trim();

  const results = useMemo(() => {
    const r: any[] = [];
    // Tabs (always show when no query, else filter)
    tabs.forEach(t => {
      if (q === '' || t.label.toLowerCase().includes(q) || ('go to ' + t.label.toLowerCase()).includes(q)) {
        r.push({ group: 'navigation', label: 'Go to · ' + t.label, meta: t.icon, action: () => { setActiveTab(t.id); onClose(); }});
      }
    });
    // Service lines
    SERVICE_LINES.forEach(s => {
      if (q === '' || s.name.toLowerCase().includes(q) || s.short.toLowerCase().includes(q) || s.id.includes(q)) {
        r.push({ group: 'service line', label: s.name, meta: 'W' + s.wave + ' · $' + (s.m12Revenue/1000).toFixed(0) + 'K/mo', action: () => { setSelection({type:'service-line', id: s.id}); setActiveTab('lines'); onClose(); }});
      }
    });
    // Decisions
    OPEN_DECISIONS.forEach(d => {
      if (q && (d.q.toLowerCase().includes(q) || d.category.toLowerCase().includes(q))) {
        r.push({ group: 'decision', label: d.q, meta: 'W' + d.wave + ' · ' + d.category, action: () => { setSelection({type:'decision', id: d.id}); setActiveTab('decisions'); onClose(); }});
      }
    });
    // Critical path
    CRITICAL_PATH_14.forEach(p => {
      if (q && (p.action.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q))) {
        r.push({ group: 'critical path', label: p.action, meta: p.day + ' · ' + p.owner, action: () => { setActiveTab('command'); onClose(); }});
      }
    });
    // Tasks
    tasks.forEach(t => {
      if (q && t.title.toLowerCase().includes(q)) {
        r.push({ group: 'task', label: t.title, meta: t.owner + ' · ' + t.status, action: () => { setActiveTab('tasks'); onClose(); }});
      }
    });
    return r.slice(0, 40);
  }, [q, tasks, tabs, setActiveTab, setSelection, onClose]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  const grouped = useMemo(() => {
    const g = {};
    results.forEach(r => { (g[r.group] = g[r.group] || []).push(r); });
    return g;
  }, [results]);

  return (
    <div className="cmdk-overlay" onClick={onClose}>
      <div className="cmdk-panel" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="cmdk-input"
          placeholder="search lines, decisions, tasks · type to filter"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && results[activeIdx]) { e.preventDefault(); results[activeIdx].action(); }
            if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i+1, results.length-1)); }
            if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i-1, 0)); }
            if (e.key === 'Escape')    { onClose(); }
          }}
        />
        <div className="cmdk-results">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <div className="cmdk-group-label">{group}</div>
              {(items as any[]).map((r) => {
                const globalIdx = results.indexOf(r);
                return (
                  <div key={globalIdx} className={`cmdk-result ${globalIdx === activeIdx ? 'active' : ''}`} onClick={r.action} onMouseEnter={() => setActiveIdx(globalIdx)}>
                    <span className="text-[13px] flex-1 truncate" style={{color:'var(--ink)'}}>{r.label}</span>
                    {r.meta && <span className="text-[11px] mono" style={{color:'var(--muted)'}}>{r.meta}</span>}
                  </div>
                );
              })}
            </div>
          ))}
          {results.length === 0 && <div className="px-4 py-8 text-center text-[12px]" style={{color:'var(--muted)'}}>No matches. Try "spravato", "wave 2", "REMS", "PGx"…</div>}
        </div>
        <div className="cmdk-hint">
          <span><span className="kbd">↑↓</span> nav · <span className="kbd">⏎</span> open · <span className="kbd">esc</span> close</span>
          <span style={{color:'var(--faint)'}}>nouveau · v2</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
function SubTabs({ tabs, active, set }) {
  return (
    <div className="flex gap-1 mb-5" style={{borderBottom:'1px solid var(--line-strong)'}}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => set(t.id)} className="px-3 py-2 mono text-[12px] transition"
          style={{color: active===t.id ? 'var(--ember)' : 'var(--muted)',
                  borderBottom: active===t.id ? '2px solid var(--ember)' : '2px solid transparent',
                  marginBottom:'-1px'}}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
function ExecutionZone(props) {
  const [sub, setSub] = useState('tasks');
  return (
    <div>
      <SubTabs tabs={[{id:'tasks',label:'Tasks'},{id:'decisions',label:'Decisions'},{id:'gantt',label:'Gantt'}]} active={sub} set={setSub}/>
      {props.activeLine && props.activeLine !== 'all' && (() => { const L = SERVICE_LINES.find(s=>s.id===props.activeLine); return (
        <div className="mono text-[11px] mb-4" style={{color:'var(--ember)'}}>● lens · {L ? L.name : props.activeLine}: Gantt shows this line; Tasks &amp; Decisions are wave-level, so they show Wave {L ? L.wave : '?'} (plus any manually-added items).</div>
      ); })()}
      {sub==='tasks' && <TaskManager tasks={props.tasks} setTasks={props.setTasks} activeLine={props.activeLine}/>}
      {sub==='decisions' && <DecisionsView decisions={props.decisions} setDecisions={props.setDecisions} tasks={props.tasks} setTasks={props.setTasks} setSelection={props.setSelection} activeLine={props.activeLine} layer0={props.layer0} setLayer0={props.setLayer0}/>}
      {sub==='gantt' && <GanttView ganttState={props.ganttState} setGanttState={props.setGanttState} setSelection={props.setSelection} activeLine={props.activeLine} finModel={props.finModel} serviceState={props.serviceState} layer0={props.layer0}/>}
    </div>
  );
}
function IntelligenceZone(props) {
  const [sub, setSub] = useState('agent');
  return (
    <div>
      <SubTabs tabs={[{id:'agent',label:'Agent'},{id:'changelog',label:'Changelog'}]} active={sub} set={setSub}/>
      {sub==='agent' && <AgentConsole apiKey={props.apiKey} setApiKey={props.setApiKey} agentThreads={props.agentThreads} setAgentThreads={props.setAgentThreads}/>}
      {sub==='changelog' && <Changelog snapshots={props.snapshots} setSnapshots={props.setSnapshots} liveState={props.liveState}/>}
    </div>
  );
}

// MAIN APP
// ============================================================
function App() {
  const [activeTab, setActiveTab] = useState('command');
  const [activeLine, setActiveLine] = useState('all');   // ephemeral lens — NOT persisted
  const [guideOpen, setGuideOpen] = useState(false);
  const [checklist, setChecklist, clLoaded] = usePersistedState('checklist', {});
  const [tasks, setTasks] = usePersistedState('tasks', []);
  const [decisions, setDecisions, decLoaded] = usePersistedState('decisions', {});
  const [serviceState, setServiceState, ssLoaded] = usePersistedState('serviceState', {});
  const [ganttState, setGanttState] = usePersistedState('ganttState', {});
  const [apiKey, setApiKey] = usePersistedState('apiKey', '');
  const [agentThreads, setAgentThreads] = usePersistedState('agentThreads', {});
  const [finModel, setFinModel, fmLoaded] = usePersistedState('finModel', NTN.engine.FIN_DRIVERS);
  const [capMap, setCapMap] = usePersistedState('capMap', {});
  const [layer0, setLayer0, l0Loaded] = usePersistedState('layer0', {});
  const [snapshots, setSnapshots, snapsLoaded] = usePersistedState('snapshots', []);
  const [finScenarios, setFinScenarios] = usePersistedState('finScenarios', []);
  const fin = NTN.engine.financials(finModel);

  // Auto-capture exactly one snapshot per ISO week, once all inputs have loaded.
  const autoSnap = useRef(false);
  useEffect(() => {
    if (autoSnap.current) return;
    if (!(snapsLoaded && clLoaded && decLoaded && ssLoaded && fmLoaded && l0Loaded)) return;
    autoSnap.current = true;
    const wk = NTN.engine.isoWeek(new Date());
    if (!snapshots.some(s => s.isoWeek === wk)) {
      setSnapshots(prev => [...prev, NTN.engine.makeSnapshot({ checklist, finModel, serviceState, layer0, decisions }, true)]);
    }
  }, [snapsLoaded, clLoaded, decLoaded, ssLoaded, fmLoaded, l0Loaded]);

  const checklistTotal = CRITICAL_PATH_14.length;
  const checklistDone = Object.keys(checklist).filter(k => checklist[k]).length;
  const checklistProgress = (checklistDone / checklistTotal) * 100;

  const taskStats = {
    total: tasks.length,
    complete: tasks.filter(t => t.status === 'complete').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length
  };

  const decisionStats = {
    pending: OPEN_DECISIONS.length - Object.keys(decisions).length,
    resolved: Object.keys(decisions).length
  };

  const tabs = [
    { id:'command',      label:'Command',      icon:'◉' },
    { id:'lines',        label:'Lines',        icon:'◇' },
    { id:'clinical',     label:'Clinical',     icon:'⊕' },
    { id:'spine',        label:'Spine',        icon:'▦' },
    { id:'capital',      label:'Capital',      icon:'◈' },
    { id:'staffing',     label:'Staffing',     icon:'◆' },
    { id:'execution',    label:'Execution',    icon:'☑' },
    { id:'intelligence', label:'Intelligence', icon:'◢' },
  ];

  // Legacy tab ids (used by deep-links throughout the app) → new zone ids.
  const TAB_TO_ZONE = { command:'command', gantt:'execution', capmap:'spine', lines:'lines', clinical:'clinical', capital:'capital', staffing:'staffing', decisions:'execution', tasks:'execution', changelog:'intelligence', agent:'intelligence' };
  const goZone = (id) => {
    if (id === 'guide') { setGuideOpen(true); return; }
    setActiveTab(TAB_TO_ZONE[id] || id);   // zone ids (spine/execution/intelligence) pass through unchanged
    setSelection(null);
    setMobileNavOpen(false);
  };

  // Drawer + Cmd+K + mobile nav state
  const [selection, setSelection] = useState<any>(null);
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Lock body scroll when mobile drawer or palette is open
  useEffect(() => {
    const locked = mobileNavOpen || !!selection || cmdkOpen;
    document.body.style.overflow = locked && window.matchMedia('(max-width: 768px)').matches ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileNavOpen, selection, cmdkOpen]);

  // Global keyboard: ⌘K / Ctrl+K to open palette, Esc to close
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdkOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Scroll to top on tab change (any path: sidebar click, cmd+K, drawer link)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  return (
    <div className="min-h-screen flex onyx-bg">
      {/* Top accent bar */}
      <div className="top-accent-bar fixed top-0 left-0 right-0 z-[60]"/>

      <Sidebar tabs={tabs} activeTab={activeTab}
               setActiveTab={goZone}
               taskStats={taskStats} decisionStats={decisionStats}
               checklistDone={checklistDone} checklistTotal={checklistTotal}
               openCmdk={() => { setCmdkOpen(true); setMobileNavOpen(false); }}
               mobileOpen={mobileNavOpen} closeMobile={() => setMobileNavOpen(false)}
               openGuide={() => setGuideOpen(true)}/>

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar tabs={tabs} activeTab={activeTab}
                onMenuClick={() => setMobileNavOpen(true)}
                openCmdk={() => setCmdkOpen(true)} fin={fin}
                activeLine={activeLine} setActiveLine={setActiveLine} lines={SERVICE_LINES}/>
        <main className="app-main flex-1 px-4 md:px-6 py-4 md:py-6 space-y-5 md:space-y-6 min-w-0">
          <KPIStrip checklistProgress={checklistProgress} taskStats={taskStats} decisionStats={decisionStats} fin={fin}/>

          {activeTab === 'command' && (
            <div className="space-y-6">
              <WayThroughPanel layer0={layer0} serviceState={serviceState} fin={fin} setActiveTab={goZone} setActiveLine={setActiveLine}/>
              <CommandBrief checklist={checklist} setChecklist={setChecklist} tasks={tasks} setTasks={setTasks} serviceState={serviceState} layer0={layer0} setLayer0={setLayer0} fin={fin} setActiveTab={goZone} setSelection={setSelection} setActiveLine={setActiveLine}/>
            </div>
          )}
          {activeTab === 'lines' && <ServiceLines serviceState={serviceState} setServiceState={setServiceState} tasks={tasks} setTasks={setTasks} layer0={layer0} setSelection={setSelection} activeLine={activeLine}/>}
          {activeTab === 'spine' && <CapabilityMap capMap={capMap} setCapMap={setCapMap} layer0={layer0} setLayer0={setLayer0} serviceState={serviceState} setActiveTab={goZone}/>}
          {activeTab === 'capital' && <CapitalView finModel={finModel} setFinModel={setFinModel} fin={fin} activeLine={activeLine} finScenarios={finScenarios} setFinScenarios={setFinScenarios}/>}
          {activeTab === 'execution' && <ExecutionZone tasks={tasks} setTasks={setTasks} decisions={decisions} setDecisions={setDecisions} ganttState={ganttState} setGanttState={setGanttState} setSelection={setSelection} activeLine={activeLine} finModel={finModel} serviceState={serviceState} layer0={layer0} setLayer0={setLayer0}/>}
          {activeTab === 'intelligence' && <IntelligenceZone apiKey={apiKey} setApiKey={setApiKey} agentThreads={agentThreads} setAgentThreads={setAgentThreads} snapshots={snapshots} setSnapshots={setSnapshots} liveState={{ checklist, finModel, serviceState, layer0, decisions }}/>}
          {activeTab === 'clinical' && <ClinicalReferenceView setSelection={setSelection} setActiveTab={goZone}/>}
          {activeTab === 'staffing' && <StaffingView/>}
        </main>
        <footer className="app-footer px-4 md:px-6 py-4 hairline-t flex items-center justify-between flex-wrap gap-3">
          <div className="serif text-[14px]" style={{color:'var(--dim)'}}>NTN Nouveau · Live OS <span className="not-italic mono text-[11px]" style={{color:'var(--muted)'}}>· master orchestrator synth · 2026-04-28</span></div>
          <div className="flex items-center gap-2 mono text-[11px]" style={{color:'var(--muted)'}}>
            <span>{taskStats.total} tasks</span>
            <span style={{color:'var(--faint)'}}>·</span>
            <span>{checklistDone}/{checklistTotal} checked</span>
            <span style={{color:'var(--faint)'}}>·</span>
            <span>{decisionStats.pending} decisions pending</span>
            <span style={{color:'var(--faint)'}}>·</span>
            <span className="data-num">live</span>
          </div>
        </footer>
      </div>

      <Drawer selection={selection} setSelection={setSelection} setActiveTab={goZone}/>
      {cmdkOpen && <CmdPalette onClose={() => setCmdkOpen(false)} setActiveTab={goZone} setSelection={setSelection} tasks={tasks} tabs={tabs}/>}
      {guideOpen && (
        <div onClick={() => setGuideOpen(false)} style={{position:'fixed',inset:0,zIndex:80,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(6px)',display:'flex',justifyContent:'center',alignItems:'flex-start',overflowY:'auto',padding:'5vh 16px'}}>
          <div onClick={e=>e.stopPropagation()} style={{maxWidth:'960px',width:'100%',background:'var(--surface)',border:'1px solid var(--line-strong)',borderRadius:14,padding:'8px 8px 24px'}}>
            <div style={{display:'flex',justifyContent:'flex-end',padding:'8px 8px 0'}}>
              <button onClick={() => setGuideOpen(false)} className="mono text-[12px]" style={{color:'var(--muted)',border:'1px solid var(--line-strong)',borderRadius:7,padding:'6px 12px'}}>close ✕</button>
            </div>
            <GuideView checklist={checklist} tasks={tasks} decisions={decisions} serviceState={serviceState} setActiveTab={(id)=>{ setGuideOpen(false); goZone(id); }}/>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
