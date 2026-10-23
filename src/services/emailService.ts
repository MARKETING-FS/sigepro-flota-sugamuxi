/**
 * emailService.ts
 * Servicio de envío real de correos electrónicos vía Resend API.
 *
 * Estrategia:
 *  1. Si Supabase está configurado → llama la Edge Function `send-email` (seguro, clave en servidor).
 *  2. Si NO hay Supabase → llama Resend API directamente desde el browser con VITE_RESEND_API_KEY.
 *  3. Si ninguna clave está disponible → modo simulación (console.log).
 *
 * IMPORTANTE: En producción Vercel, la Edge Function de Supabase es la ruta preferida.
 *             VITE_RESEND_API_KEY en el frontend es solo para desarrollo/fallback local.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  reply_to?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  mode: 'edge-function' | 'direct-api' | 'simulation';
}

const RESEND_DIRECT_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM =
  (import.meta.env.VITE_RESEND_FROM_EMAIL as string | undefined) ||
  'SIGEPRO Flota Sugamuxi <onboarding@resend.dev>';

/**
 * Envía un correo electrónico.
 * Usa la Edge Function de Supabase si está disponible, con fallback a llamada directa.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, from = DEFAULT_FROM, reply_to } = options;

  const recipientList = Array.isArray(to) ? to.join(', ') : to;

  // ─── RUTA 1: Edge Function de Supabase (producción segura) ────────────────
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { to, subject, html, from, reply_to },
      });

      if (error) {
        console.warn('[emailService] Edge Function error, intentando fallback:', error.message);
        // No retornamos aquí — intentamos la ruta directa
      } else if (data?.success) {
        console.log(`[emailService] ✅ Correo enviado vía Edge Function → ${recipientList}`);
        return { success: true, messageId: data.messageId, mode: 'edge-function' };
      }
    } catch (err) {
      console.warn('[emailService] Edge Function no disponible, intentando fallback:', err);
    }
  }

  // ─── RUTA 2: Llamada directa a Resend (fallback o dev local) ──────────────
  const resendKey = import.meta.env.VITE_RESEND_API_KEY as string | undefined;
  if (resendKey) {
    try {
      const resp = await fetch(RESEND_DIRECT_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          ...(reply_to && { reply_to }),
        }),
      });

      const result = await resp.json();

      if (resp.ok && result.id) {
        console.log(`[emailService] ✅ Correo enviado vía API directa → ${recipientList}`);
        return { success: true, messageId: result.id, mode: 'direct-api' };
      } else {
        console.error('[emailService] Error Resend API directa:', result);
        return {
          success: false,
          error: result.message || 'Error al enviar el correo vía API directa',
          mode: 'direct-api',
        };
      }
    } catch (err) {
      console.error('[emailService] Error al llamar Resend directamente:', err);
    }
  }

  // ─── RUTA 3: Simulación (sin credenciales configuradas) ───────────────────
  console.log(
    `[emailService] 📧 SIMULACIÓN — Correo NO enviado (sin credenciales).\n` +
      `  Para: ${recipientList}\n` +
      `  Asunto: ${subject}`
  );
  return {
    success: true, // Simulamos éxito para no interrumpir el flujo
    mode: 'simulation',
    messageId: `sim-${Date.now()}`,
  };
}

/**
 * Verifica si el servicio de correo está activo (Edge Function o API Key disponible).
 */
export function isEmailServiceAvailable(): boolean {
  const hasSupabase = isSupabaseConfigured();
  const hasDirectKey = Boolean(import.meta.env.VITE_RESEND_API_KEY);
  return hasSupabase || hasDirectKey;
}
