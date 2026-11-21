// Supabase Edge Function — send-email
// Proxy seguro para enviar correos vía Resend API
// Despliega con: npx supabase functions deploy send-email --project-ref ztiffglhofzxhlitovkr
// Configura el secreto: npx supabase secrets set RESEND_API_KEY=re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX --project-ref ztiffglhofzxhlitovkr

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM = Deno.env.get('RESEND_FROM_EMAIL') || 'SIGEPRO Flota Sugamuxi <onboarding@resend.dev>';

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  reply_to?: string;
  cc?: string[];
  bcc?: string[];
  tags?: { name: string; value: string }[];
}

// Solo la página de SIGEPRO puede llamar a esta función desde un navegador.
// Se fija con: npx supabase secrets set SIGEPRO_ALLOWED_ORIGIN=https://TU-DOMINIO
const ALLOWED_ORIGIN = Deno.env.get('SIGEPRO_ALLOWED_ORIGIN') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const WRITER_ROLES = new Set(['SUPERADMIN', 'ADMIN', 'ADMINISTRADOR']);
const EMAIL_RE = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;
const MAX_RECIPIENTS = 5;
const MAX_HTML = 200_000;

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN || 'null',
  'Vary': 'Origin',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Solo personal interno con sesión válida (Administrador o Superadministrador)
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token || !SUPABASE_URL) {
      return new Response(JSON.stringify({ error: 'Sesión no válida' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const who = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!who.ok) {
      return new Response(JSON.stringify({ error: 'Sesión no válida o vencida' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const caller = await who.json();
    const role = String(caller?.app_metadata?.role || '').toUpperCase();
    if (!WRITER_ROLES.has(role)) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('[send-email] RESEND_API_KEY no configurado en secrets');
      return new Response(
        JSON.stringify({ error: 'Servicio de correo no configurado correctamente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: EmailPayload = await req.json();

    // Validaciones básicas
    if (!payload.to || !payload.subject || !payload.html) {
      return new Response(
        JSON.stringify({ error: 'Campos requeridos: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validaciones: el remitente es siempre el oficial; destinatarios y tamaño acotados
    const recipients = (Array.isArray(payload.to) ? payload.to : [payload.to]).map((x) => String(x).trim());
    if (
      recipients.length === 0 ||
      recipients.length > MAX_RECIPIENTS ||
      !recipients.every((x) => EMAIL_RE.test(x)) ||
      String(payload.subject).length > 300 ||
      String(payload.html).length > MAX_HTML
    ) {
      return new Response(JSON.stringify({ error: 'Datos de correo no válidos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resendPayload = {
      from: DEFAULT_FROM,
      to: recipients,
      subject: payload.subject,
      html: payload.html,
      ...(payload.reply_to && EMAIL_RE.test(payload.reply_to) && { reply_to: payload.reply_to }),
    };

    console.log(`[send-email] Enviando correo a ${recipients.length} destinatario(s)`);

    const resendResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('[send-email] Error de Resend API:', resendData);
      return new Response(
        JSON.stringify({ error: 'No se pudo enviar el correo' }),
        {
          status: resendResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[send-email] ✅ Correo enviado exitosamente. ID: ${resendData.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: resendData.id,
        to: resendPayload.to,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[send-email] Error inesperado:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor de correo' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
