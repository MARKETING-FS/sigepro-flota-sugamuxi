import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Verifica si las credenciales de Supabase están correctamente configuradas
 * en el archivo de entorno (.env o .env.local).
 */
export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('tu-proyecto') &&
    !supabaseAnonKey.includes('tu-anon')
  );
};

// Cliente de Supabase singleton
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

if (!isSupabaseConfigured()) {
  console.info(
    'ℹ️ [SIGEPRO] Supabase no está configurado aún o usa credenciales de ejemplo. La aplicación está operando en modo local/almacenamiento simulado (localStorage).'
  );
}
