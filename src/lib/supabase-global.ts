// Replaces the old Supabase CDN <script>. The persistence adapter in App.tsx
// reads window.supabase.createClient (faithful to the original artifact); we
// satisfy that contract here from the npm package, before App.tsx evaluates.
import { createClient } from '@supabase/supabase-js';

(window as any).supabase = { createClient };
