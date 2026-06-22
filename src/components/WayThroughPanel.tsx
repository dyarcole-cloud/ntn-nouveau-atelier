// WayThroughPanel — the operating system's answer to "what's the one move?"
// Leads the Command / Now surface above the Command Brief. Distills wayThrough()
// + criticalPath() into a single scannable decision band: the phase, the single
// highest-leverage blocker (+ owner + downstream lines), the next move, lines
// live vs deferred, and the capital/revenue the blocker is holding hostage.
import { wayThrough, criticalPath, lineStatus, financials } from '../lib/engine';
import { SERVICE_LINES } from '../data/serviceLines';

const PHASE_COPY: Record<string, { lead: string; sub: string; cta: string; zone: string }> = {
  'clear-spine':  { lead: 'The way through is the spine.', sub: 'Two universal sign-offs gate every line. Nothing else is the move until they clear.', cta: 'Work the spine', zone: 'spine' },
  'launch-wave1': { lead: 'The way through is Wave 1.',     sub: 'Spine is clear. Prove the loop — PGx, Spravato, TMS — before opening anything else.', cta: 'Run Wave 1', zone: 'lines' },
  'scale':        { lead: 'The way through is scale.',      sub: 'Wave 1 is live and billing. The constraint is throughput now, not permission.', cta: 'Open the model', zone: 'capital' },
};

function money(n: number): string {
  if (!n) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

export default function WayThroughPanel({ layer0, serviceState, fin, setActiveTab, setActiveLine }: any) {
  const way = wayThrough(layer0, serviceState);
  const path = criticalPath(layer0);
  const top = path[0]; // highest-leverage unmet Layer-0 gate (undefined once spine clear)
  const f = fin || financials();
  const goLines = SERVICE_LINES.filter(sl => lineStatus(sl.id, serviceState, layer0).status === 'GO').length;
  const copy = PHASE_COPY[way.phase] || PHASE_COPY['clear-spine'];
  const accent = way.phase === 'scale' ? 'var(--pos)' : 'var(--crit)';

  // Capital + monthly revenue held hostage by the top blocker (the lines it gates).
  let revExposed = 0, capExposed = 0;
  if (top) {
    top.lines.forEach((id: string) => {
      const r = (f.byId || {})[id]; if (r) revExposed += r.monthly;
      const sl = SERVICE_LINES.find(s => s.id === id); if (sl) capExposed += sl.launchCapital || 0;
    });
  }

  const goZone = (z: string) => setActiveTab && setActiveTab(z);

  const stat = (label: string, value: string, tone?: string) => (
    <div className="flex flex-col">
      <span className="text-[9px] uppercase tracking-[0.14em] mono" style={{ color: 'var(--muted)' }}>{label}</span>
      <span className="text-[15px] font-semibold mono mt-0.5" style={{ color: tone || 'var(--ink-bright)' }}>{value}</span>
    </div>
  );

  return (
    <div className="onyx-card-pop p-5 md:p-6 relative overflow-hidden" style={{ border: `1px solid ${way.phase === 'scale' ? 'rgba(45,212,167,0.30)' : 'rgba(244,63,94,0.32)'}` }}>
      <div className="top-accent-bar absolute top-0 left-0 right-0" />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="eyebrow"><span style={{ color: accent }}>Now · The Way Through</span></div>
          <h2 className="serif text-3xl md:text-4xl leading-[1.05] mt-2" style={{ color: 'var(--ink-bright)' }}>{copy.lead}</h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed" style={{ color: 'var(--dim)' }}>{copy.sub}</p>
        </div>
        <button
          onClick={() => goZone(copy.zone)}
          className="flex-shrink-0 text-[10px] uppercase tracking-[0.12em] font-semibold mono px-3.5 py-2 rounded transition hover:opacity-85"
          style={{ color: '#000', background: accent }}
        >
          {copy.cta} →
        </button>
      </div>

      {/* Highest-leverage blocker */}
      {top && (
        <div
          className="mt-4 flex items-center gap-3 p-3.5 rounded-lg cursor-pointer transition hover:opacity-90"
          style={{ background: 'var(--inset)', border: '1px solid rgba(244,63,94,0.25)' }}
          onClick={() => goZone('spine')}
        >
          <span className="text-[9px] uppercase tracking-[0.14em] mono flex-shrink-0" style={{ color: 'var(--crit)' }}>Highest leverage</span>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-medium truncate" style={{ color: 'var(--ink-bright)' }}>{top.name}</div>
            <div className="text-[11px] mono mt-0.5" style={{ color: 'var(--muted)' }}>owner: {top.owner} · unlocks {top.downstream} of {SERVICE_LINES.length} lines</div>
          </div>
        </div>
      )}

      {/* Live / deferred + exposure */}
      <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
        {stat('Wave 1 live', `${way.live} / ${way.launch.length}`, way.live === way.launch.length ? 'var(--pos)' : 'var(--ink-bright)')}
        {stat('Lines GO', `${goLines} / ${SERVICE_LINES.length}`, goLines > 0 ? 'var(--pos)' : 'var(--ink-bright)')}
        {top && stat('Revenue exposed', `${money(revExposed)}/mo`, 'var(--warn)')}
        {top && stat('Capital exposed', money(capExposed), 'var(--warn)')}
      </div>
    </div>
  );
}
