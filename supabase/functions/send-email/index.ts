// Supabase Edge Function — send-email
// Proxy seguro para enviar correos vía Resend API
// Despliega con: npx supabase functions deploy send-email --project-ref ztiffglhofzxhlitovkr
// Configura el secreto: npx supabase secrets set RESEND_API_KEY=re_gLjrtYrY_H61VRyyaaeKumnxpzBhGLnna --project-ref ztiffglhofzxhlitovkr

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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

    const resendPayload = {
      from: payload.from || DEFAULT_FROM,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
      ...(payload.reply_to && { reply_to: payload.reply_to }),
      ...(payload.cc && { cc: payload.cc }),
      ...(payload.bcc && { bcc: payload.bcc }),
      ...(payload.tags && { tags: payload.tags }),
    };

    console.log(`[send-email] Enviando correo a: ${JSON.stringify(resendPayload.to)} | Asunto: "${payload.subject}"`);

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
        JSON.stringify({
          error: resendData.message || 'Error al enviar el correo',
          details: resendData,
        }),
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
      JSON.stringify({
        error: 'Error interno del servidor de correo',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
