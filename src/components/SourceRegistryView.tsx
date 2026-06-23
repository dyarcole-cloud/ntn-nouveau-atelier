// Source Registry — the concentrated governance surface: every volatile claim,
// its status, the review owner, the cadence, and whether it's been verified.
// Makes "what still needs checking" answerable at a glance without bloating the
// rest of the UI. Lives under Evidence (alongside Clinical).
//
// The registry DATA is an immutable baseline (no claim is ever asserted verified
// in code). Cole records HIS review on his own clock via the per-row control;
// that overlay (persisted, local-only) overrides the displayed status without
// rewriting the underlying assertion.
import { SOURCE_REGISTRY, countNeedsReview, reviewStatusOf } from '../data/sourceRegistry';
import type { SourceRef, SourceStatus } from '../types/sources';
import SourceBadge from './SourceBadge';

const CAT_LABEL: Record<string, string> = { regulatory: 'Regulatory & statutory', financial: 'Financial model', clinical: 'Clinical evidence' };
const STATUS_OPTS: SourceStatus[] = ['needs-review', 'verified', 'stale'];

function Row({ s, reviews, onSet }: { s: SourceRef; reviews: any; onSet: (id: string, status: SourceStatus) => void }) {
  const status = reviewStatusOf(s.id, reviews, s.status);
  const rv = reviews && reviews[s.id];
  const selStyle: any = { background: 'var(--inset)', color: 'var(--ink)', border: '1px solid var(--line-strong)', borderRadius: 6, padding: '3px 7px' };
  return (
    <div className="p-3.5 rounded-md flex items-start gap-3" style={{ background: 'var(--inset)', border: '1px solid var(--border)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-medium" style={{ color: 'var(--ink-bright)' }}>{s.title}</span>
          {s.date && <span className="text-[10px] mono px-1.5 py-0.5 rounded" style={{ color: 'var(--dim)', background: 'var(--glow-soft)' }}>{s.date}</span>}
          <SourceBadge status={status} title={s.notes} />
        </div>
        {s.notes && <div className="text-[11.5px] leading-relaxed mt-1" style={{ color: 'var(--dim)' }}>{s.notes}</div>}
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <span className="text-[10px] mono" style={{ color: 'var(--muted)' }}>
            review: {s.reviewOwner || '—'}{s.reviewCadence ? ` · ${s.reviewCadence}` : ''} · verified {rv && rv.verifiedAt ? new Date(rv.verifiedAt).toLocaleDateString() : 'never'}
          </span>
          <select value={status} onChange={e => onSet(s.id, e.target.value as SourceStatus)} className="mono text-[10px] uppercase tracking-wider" style={selStyle} title="Record your review status">
            {STATUS_OPTS.map(o => <option key={o} value={o}>{o === 'needs-review' ? 'needs review' : o}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

export default function SourceRegistryView({ reviews, setReviews }: { reviews?: any; setReviews?: (fn: any) => void }) {
  const cats: SourceRef['category'][] = ['regulatory', 'financial', 'clinical'];
  const open = countNeedsReview(reviews);
  // Record a review status. Reverting to the baseline 'needs-review' drops the
  // overlay entry; 'verified' stamps the date Cole reviewed it.
  const onSet = (id: string, status: SourceStatus) => {
    if (!setReviews) return;
    setReviews((prev: any) => {
      const next = { ...(prev || {}) };
      if (status === 'needs-review') { delete next[id]; return next; }
      next[id] = { status, verifiedBy: 'Cole', verifiedAt: status === 'verified' ? new Date().toISOString() : (next[id] && next[id].verifiedAt) };
      return next;
    });
  };
  return (
    <div className="onyx-card p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <div className="eyebrow"><span>Source Registry · Evidence Governance</span></div>
        <span className="text-[10px] uppercase tracking-[0.14em] mono px-2 py-0.5 rounded" style={{ color: open ? 'var(--warn)' : 'var(--pos)', border: `1px solid ${open ? 'var(--warn)' : 'var(--pos)'}` }}>{open ? `${open} need review` : 'all reviewed'}</span>
      </div>
      <p className="text-[12px] leading-relaxed mb-4" style={{ color: 'var(--dim)' }}>
        Volatile statutes, payer rules, device clearances, and model assumptions. The baseline asserts nothing as verified and invents no citations. Mark an item <span className="mono" style={{ color: 'var(--pos)' }}>verified</span> once you've checked it against the primary source, or <span className="mono" style={{ color: 'var(--crit)' }}>stale</span> if it's gone out of date.
      </p>
      <div className="space-y-4">
        {cats.map(cat => {
          const rows = SOURCE_REGISTRY.filter(s => s.category === cat);
          if (!rows.length) return null;
          return (
            <div key={cat}>
              <div className="section-eyebrow mb-2"><span>{CAT_LABEL[cat || 'regulatory']}</span></div>
              <div className="space-y-2">{rows.map(s => <Row key={s.id} s={s} reviews={reviews} onSet={onSet} />)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
