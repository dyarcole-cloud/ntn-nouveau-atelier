// Globals the ported artifact relies on (faithful port — not yet refactored).
// `NTN` is referenced bare (window.NTN) throughout App.tsx; `supabase` is the
// CDN-shim set in supabase-global.ts; `storage` is the Claude-artifact bridge.
export {};

declare global {
  interface Window {
    NTN?: any;
    supabase?: any;
    storage?: any;
  }
  // eslint-disable-next-line no-var
  var NTN: any;
}
