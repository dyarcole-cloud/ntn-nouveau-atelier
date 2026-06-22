// Source Registry — the concentrated governance surface: every volatile claim,
// its status, the review owner, the cadence, and whether it's been verified.
// Makes "what still needs checking" answerable at a glance without bloating the
// rest of the UI. Lives under Evidence (alongside Clinical).
import { SOURCE_REGISTRY, needsReview } from '../data/sourceRegistry';
import type { SourceRef } from '../types/sources';
import SourceBadge from './SourceBadge';

const CAT_LABEL: Record<string, string> = { regulatory: 'Regulatory & statutory', financial: 'Financial model', clinical: 'Clinical evidence' };

function Row({ s }: { s: SourceRef }) {
  return (
    <div className="p-3.5 rounded-md flex items-start gap-3" style={{ background: 'var(--inset)', border: '1px solid var(--border)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-medium" style={{ color: 'var(--ink-bright)' }}>{s.title}</span>
          {s.date && <span className="text-[10px] mono px-1.5 py-0.5 rounded" style={{ color: 'var(--dim)', background: 'var(--glow-soft)' }}>{s.date}</span>}
          <SourceBadge status={s.status} title={s.notes} />
        </div>
        {s.notes && <div className="text-[11.5px] leading-relaxed mt-1" style={{ color: 'var(--dim)' }}>{s.notes}</div>}
        <div className="text-[10px] mono mt-1.5" style={{ color: 'var(--muted)' }}>
          review: {s.reviewOwner || '—'}{s.reviewCadence ? ` · ${s.reviewCadence}` : ''} · verified {s.verifiedAt ? new Date(s.verifiedAt).toLocaleDateString() : 'never'}
        </div>
      </div>
    </div>
  );
}

export default function SourceRegistryView() {
  const cats: SourceRef['category'][] = ['regulatory', 'financial', 'clinical'];
  const open = needsReview().length;
  return (
    <div className="onyx-card p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <div className="eyebrow"><span>Source Registry · Evidence Governance</span></div>
        <span className="text-[10px] uppercase tracking-[0.14em] mono px-2 py-0.5 rounded" style={{ color: 'var(--warn)', border: '1px solid var(--warn)' }}>{open} need review</span>
      </div>
      <p className="text-[12px] leading-relaxed mb-4" style={{ color: 'var(--dim)' }}>
        Volatile statutes, payer rules, device clearances, and model assumptions. Status tracking only — nothing here is asserted as verified, and no citations are invented. Each item names who owns re-checking it.
      </p>
      <div className="space-y-4">
        {cats.map(cat => {
          const rows = SOURCE_REGISTRY.filter(s => s.category === cat);
          if (!rows.length) return null;
          return (
            <div key={cat}>
              <div className="section-eyebrow mb-2"><span>{CAT_LABEL[cat || 'regulatory']}</span></div>
              <div className="space-y-2">{rows.map(s => <Row key={s.id} s={s} />)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
