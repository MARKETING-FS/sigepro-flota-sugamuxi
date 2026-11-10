import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserRole } from '../types';
import { IS_DEMO_MODE as DEMO_FLAG } from '../dev/demoData';

// Solo existe en `npm run dev`; en producción es siempre falso y el código de demo se elimina
const IS_DEMO_MODE = import.meta.env.DEV && DEMO_FLAG;

/**
 * Usuario autenticado en Supabase Auth.
 * - role: se lee de app_metadata.role ('ADMIN' | 'REVISOR'). Solo se puede asignar
 *   desde el panel / SQL de Supabase, el usuario no lo puede cambiar.
 * - sigeproUserId: app_metadata.sigepro_user_id opcional ('admin-1', 'revisor-1', ...)
 *   para enlazar la cuenta con las carteras de revisores ya asignadas.
 */
export interface AuthProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole | null;
  sigeproUserId: string | null;
}

export interface AuthResult {
  error?: string;
}

const RECOVERY_HASH_FLAG = 'type=recovery';

const toProfile = (session: Session | null): AuthProfile | null => {
  const user = session?.user;
  if (!user) return null;
  const appMeta = (user.app_metadata || {}) as Record<string, unknown>;
  const userMeta = (user.user_metadata || {}) as Record<string, unknown>;
  const rawRole = String(appMeta.role || '').toUpperCase();
  const role: UserRole | null = rawRole === 'ADMIN' || rawRole === 'REVISOR' ? rawRole : null;
  const email = user.email || '';
  const name = String(userMeta.full_name || userMeta.name || email.split('@')[0] || 'Usuario');
  const sigeproUserId = appMeta.sigepro_user_id ? String(appMeta.sigepro_user_id) : null;
  return { id: user.id, email, name, role, sigeproUserId };
};

// Traduce los mensajes de Supabase Auth a textos claros en español
const translateAuthError = (message: string): string => {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (m.includes('email not confirmed')) return 'Su correo aún no ha sido confirmado. Revise su bandeja de entrada.';
  if (m.includes('rate limit') || m.includes('too many') || m.includes('security purposes')) {
    return 'Demasiados intentos. Espere unos minutos e intente de nuevo.';
  }
  if (m.includes('should be different')) return 'La nueva contraseña debe ser diferente a la anterior.';
  if (m.includes('password should be at least') || m.includes('weak')) {
    return 'La contraseña es demasiado débil. Use al menos 8 caracteres combinando letras y números.';
  }
  if (m.includes('session') && m.includes('missing')) {
    return 'El enlace expiró o ya fue usado. Solicite uno nuevo desde "¿Olvidó su contraseña?".';
  }
  if (m.includes('failed to fetch') || m.includes('network')) {
    return 'No hay conexión con el servidor. Verifique su internet e intente de nuevo.';
  }
  return message;
};

const clearRecoveryHash = () => {
  if (window.location.hash) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
};

// Solo en `npm run dev` con VITE_DEMO_MODE=true: entra como administrador de prueba sin Supabase
const DEMO_PROFILE: AuthProfile = {
  id: 'demo-admin',
  email: 'demo@sigepro.local',
  name: 'Usuario de Demostración',
  role: 'ADMIN',
  sigeproUserId: 'admin-1',
};

export function useSupabaseAuth() {
  const isAuthConfigured = isSupabaseConfigured() || IS_DEMO_MODE;
  const [demoSignedIn, setDemoSignedIn] = useState(IS_DEMO_MODE);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(Boolean(supabase) && !IS_DEMO_MODE);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(() =>
    window.location.hash.includes(RECOVERY_HASH_FLAG)
  );

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
      if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    if (IS_DEMO_MODE) {
      setDemoSignedIn(true);
      return {};
    }
    if (!supabase) return { error: 'El inicio de sesión no está configurado en este servidor.' };
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? { error: translateAuthError(error.message) } : {};
  };

  const signOut = async (): Promise<void> => {
    if (IS_DEMO_MODE) setDemoSignedIn(false);
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
  };

  const sendPasswordReset = async (email: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'El inicio de sesión no está configurado en este servidor.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    return error ? { error: translateAuthError(error.message) } : {};
  };

  const updatePassword = async (password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'El inicio de sesión no está configurado en este servidor.' };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: translateAuthError(error.message) };
    setIsPasswordRecovery(false);
    clearRecoveryHash();
    return {};
  };

  const cancelPasswordRecovery = async (): Promise<void> => {
    setIsPasswordRecovery(false);
    clearRecoveryHash();
    await signOut();
  };

  return {
    isAuthConfigured,
    authLoading,
    authProfile: IS_DEMO_MODE ? (demoSignedIn ? DEMO_PROFILE : null) : toProfile(session),
    isPasswordRecovery,
    signIn,
    signOut,
    sendPasswordReset,
    updatePassword,
    cancelPasswordRecovery,
  };
}
