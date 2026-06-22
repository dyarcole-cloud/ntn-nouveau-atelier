// Source governance types. The registry records whether a claim has been
// verified and who owns re-checking it — it never asserts a claim is true and
// never fabricates a citation. A missing url means "no source captured yet".

export type SourceStatus = 'verified' | 'needs-review' | 'stale' | 'unknown';
export type ReviewCadence = 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'one-time';
export type SourceCategory = 'clinical' | 'regulatory' | 'financial';

export interface SourceRef {
  id: string;
  title: string;
  url?: string;
  publisher?: string;
  date?: string;          // the date the claim asserts (e.g. "1/1/2027")
  verifiedAt?: string;    // when a human last verified it (ISO); absent = never
  reviewOwner?: string;
  reviewCadence?: ReviewCadence;
  status?: SourceStatus;
  notes?: string;
  category?: SourceCategory;
  lineId?: string;        // optional link to a service line
}
