// Entry point. Import order matters: `supabase-global` sets window.supabase
// BEFORE App.tsx evaluates, because the NTN.engine IIFE calls initSupabase()
// synchronously at module-eval and reads window.supabase.createClient.
import './lib/supabase-global';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import App from './App';

const el = document.getElementById('root');
if (el) createRoot(el).render(<App />);
