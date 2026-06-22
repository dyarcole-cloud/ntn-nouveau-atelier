// Compact, reusable source-status pill. Lightweight by design — one chip, no
// layout weight. Amber "needs review" is the honest default for ungoverned claims.
import type { SourceStatus } from '../types/sources';

const META: Record<string, { label: string; color: string }> = {
  'verified':     { label: 'verified',     color: 'var(--pos)' },
  'needs-review': { label: 'needs review', color: 'var(--warn)' },
  'stale':        { label: 'stale',        color: 'var(--crit)' },
  'unknown':      { label: 'unverified',   color: 'var(--muted)' },
};

export default function SourceBadge({ status = 'needs-review', title }: { status?: SourceStatus; title?: string }) {
  const m = META[status] || META['unknown'];
  return (
    <span
      title={title}
      className="text-[9px] uppercase tracking-[0.14em] mono px-1.5 py-0.5 rounded inline-flex items-center gap-1 align-middle"
      style={{ color: m.color, border: `1px solid ${m.color}` }}
    >
      <span style={{ fontSize: 8 }}>●</span> {m.label}
    </span>
  );
}
