/**
 * Gestión de usuarios de SIGEPRO (solo superadministrador).
 *
 * Función serverless de Vercel. Usa la clave "service_role" de Supabase, que NUNCA
 * debe llegar al navegador: se configura como variable de entorno en Vercel:
 *   SUPABASE_SERVICE_ROLE_KEY  (Supabase → Project Settings → API → service_role)
 * La URL y la clave pública se toman de VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
 *
 * Antes de hacer nada se verifica con Supabase que quien llama tiene sesión válida
 * y que su rol es SUPERADMIN (o el antiguo ADMIN, que es el dueño).
 */

interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}
interface Res {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  setHeader: (k: string, v: string) => void;
}

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const ASSIGNABLE = new Set(['ADMINISTRADOR', 'USUARIO']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Misma política que la pantalla (src/utils/passwordPolicy.ts)
const passwordProblem = (pw: string): string => {
  if (pw.length < 10) return 'La contraseña debe tener al menos 10 caracteres.';
  if (/\s/.test(pw)) return 'La contraseña no puede tener espacios.';
  if (!/[A-ZÁÉÍÓÚÑ]/.test(pw)) return 'La contraseña debe tener una letra mayúscula.';
  if (!/[a-záéíóúñ]/.test(pw)) return 'La contraseña debe tener una letra minúscula.';
  if (!/\d/.test(pw)) return 'La contraseña debe tener un número.';
  if (!/[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ\s]/.test(pw)) return 'La contraseña debe tener un carácter especial.';
  return '';
};

const adminFetch = (path: string, init: RequestInit = {}) =>
  fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      // Las claves nuevas (sb_secret_...) no son JWT: Supabase las acepta solo en el encabezado apikey
      ...(SERVICE_KEY.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${SERVICE_KEY}` }),
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

const publicUser = (u: any) => ({
  id: u.id as string,
  email: (u.email || '') as string,
  name: String(u.user_metadata?.full_name || u.user_metadata?.name || ''),
  role: String(u.app_metadata?.role || '').toUpperCase(),
  createdAt: u.created_at as string,
  lastSignInAt: (u.last_sign_in_at || null) as string | null,
});

export default async function handler(req: Req, res: Res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
    return res.status(500).json({
      error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en las variables de entorno del servidor (Vercel).',
    });
  }

  // 1. Identificar a quien llama con su propio token
  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Sesión no válida.' });

  const who = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!who.ok) return res.status(401).json({ error: 'Sesión no válida o vencida.' });
  const caller: any = await who.json();
  const callerRole = String(caller?.app_metadata?.role || '').toUpperCase();
  if (callerRole !== 'SUPERADMIN' && callerRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Solo el superadministrador puede gestionar usuarios.' });
  }

  try {
    // 2. Listar
    if (req.method === 'GET') {
      const r = await adminFetch('/admin/users?per_page=200');
      const data: any = await r.json();
      if (!r.ok) return res.status(502).json({ error: data?.msg || data?.message || 'No se pudo leer la lista.' });
      const users = (data.users || []).map(publicUser).sort((a: any, b: any) => a.email.localeCompare(b.email));
      return res.status(200).json({ users });
    }

    const body: any = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    // 3. Crear
    if (req.method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const name = String(body.name || '').trim();
      const password = String(body.password || '');
      const role = String(body.role || '').toUpperCase();
      if (!name) return res.status(400).json({ error: 'Escriba el nombre completo.' });
      if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'El correo no es válido.' });
      const pwProblem = passwordProblem(password);
      if (pwProblem) return res.status(400).json({ error: pwProblem });
      if (!ASSIGNABLE.has(role)) return res.status(400).json({ error: 'El rol debe ser Administrador o Usuario.' });

      const r = await adminFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
          app_metadata: { role },
          user_metadata: { full_name: name, must_change_password: true },
        }),
      });
      const data: any = await r.json();
      if (!r.ok) {
        const msg = String(data?.msg || data?.message || data?.error_description || '');
        if (/already|registered|exists/i.test(msg)) return res.status(409).json({ error: 'Ya existe un usuario con ese correo.' });
        return res.status(502).json({ error: msg || 'No se pudo crear el usuario.' });
      }
      return res.status(200).json({ user: publicUser(data) });
    }

    // 4. Cambiar rol o contraseña
    if (req.method === 'PATCH') {
      const id = String(body.id || '');
      if (!id) return res.status(400).json({ error: 'Falta el usuario.' });
      if (id === caller.id) return res.status(400).json({ error: 'No puede modificar su propia cuenta desde aquí.' });
      const patch: Record<string, unknown> = {};
      if (body.role !== undefined) {
        const role = String(body.role).toUpperCase();
        if (!ASSIGNABLE.has(role)) return res.status(400).json({ error: 'El rol debe ser Administrador o Usuario.' });
        patch.app_metadata = { role };
      }
      if (body.password !== undefined) {
        const pwProblem = passwordProblem(String(body.password));
        if (pwProblem) return res.status(400).json({ error: pwProblem });
        patch.password = String(body.password);
        patch.user_metadata = { must_change_password: true };
      }
      if (Object.keys(patch).length === 0) return res.status(400).json({ error: 'No hay nada que cambiar.' });
      const r = await adminFetch(`/admin/users/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(patch) });
      const data: any = await r.json();
      if (!r.ok) return res.status(502).json({ error: data?.msg || data?.message || 'No se pudo actualizar.' });
      return res.status(200).json({ user: publicUser(data) });
    }

    // 5. Eliminar
    if (req.method === 'DELETE') {
      const id = String(body.id || '');
      if (!id) return res.status(400).json({ error: 'Falta el usuario.' });
      if (id === caller.id) return res.status(400).json({ error: 'No puede eliminar su propia cuenta.' });
      const r = await adminFetch(`/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!r.ok) {
        const data: any = await r.json().catch(() => ({}));
        return res.status(502).json({ error: data?.msg || data?.message || 'No se pudo eliminar.' });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Método no permitido.' });
  } catch {
    return res.status(500).json({ error: 'Error inesperado en el servidor.' });
  }
}
