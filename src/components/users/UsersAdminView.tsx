import React, { useCallback, useEffect, useState } from 'react';
import { UserCog, UserPlus, Eye, EyeOff, Wand2, Trash2, RefreshCw, ShieldCheck, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { useConfirm } from '../ui/ConfirmDialog';
import { BrandSwoosh } from '../ui/BrandSwoosh';
import { generateStrongPassword, isPasswordValid, passwordRules } from '../../utils/passwordPolicy';
import { PageHeader, StatusPill, cardCls, heroPrimaryBtn, theadRowCls, tbodyCls, rowCls } from '../ui/archive';

interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  lastSignInAt: string | null;
}

type AssignableRole = 'ADMINISTRADOR' | 'USUARIO';

const ROLE_OPTIONS: Array<{ value: AssignableRole; title: string; sub: string }> = [
  { value: 'ADMINISTRADOR', title: 'Administrador', sub: 'Sube documentos y habilita o inhabilita proveedores' },
  { value: 'USUARIO', title: 'Usuario', sub: 'Sube documentos y consulta proveedores' },
];

const labelCls = 'block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2c84c4] dark:text-[#69bdd7] mb-2';
const fieldCls =
  'w-full h-11 px-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.1] dark:border-white/10 text-sm text-[#0b1d3a] dark:text-white placeholder:text-[#6b84a3] focus:outline-none focus:border-[#2c84c4] focus:ring-2 focus:ring-[#2c84c4]/30';

const roleLabel = (r: string) =>
  r === 'SUPERADMIN' || r === 'ADMIN' ? 'Superadministrador' : r === 'ADMINISTRADOR' ? 'Administrador' : 'Usuario';

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Nunca';

/** Llama a la función segura /api/users con la sesión del superadministrador. */
async function callUsersApi<T>(method: string, body?: unknown): Promise<{ data?: T; error?: string }> {
  if (!supabase) return { error: 'El inicio de sesión no está configurado en este servidor.' };
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) return { error: 'Su sesión venció. Inicie sesión de nuevo.' };
  try {
    const res = await fetch('/api/users', {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { error: json?.error || 'No se pudo completar la acción.' };
    return { data: json as T };
  } catch {
    return { error: 'No hay conexión con el servidor.' };
  }
}

export const UsersAdminView: React.FC = () => {
  const { showToast } = useApp();
  const { ask, dialog } = useConfirm();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState<AssignableRole>('USUARIO');
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    const r = await callUsersApi<{ users: ManagedUser[] }>('GET');
    setLoading(false);
    if (r.error) setLoadError(r.error);
    else setUsers(r.data?.users || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) return setFormError('Escriba el nombre completo.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setFormError('Escriba un correo válido.');
    if (!isPasswordValid(password)) return setFormError('La contraseña temporal no cumple todos los requisitos.');
    setSaving(true);
    const r = await callUsersApi<{ user: ManagedUser }>('POST', { name, email, password, role });
    setSaving(false);
    if (r.error) return setFormError(r.error);
    showToast(`Usuario creado: ${email.trim().toLowerCase()}. Entréguele la contraseña de forma segura.`, 'success', 'USUARIOS');
    setName('');
    setEmail('');
    setPassword('');
    setShowPass(false);
    setRole('USUARIO');
    setIsFormOpen(false);
    void load();
  };

  const changeRole = async (u: ManagedUser, next: AssignableRole) => {
    const r = await callUsersApi('PATCH', { id: u.id, role: next });
    if (r.error) return showToast(r.error, 'error', 'USUARIOS');
    showToast(`${u.email} ahora es ${roleLabel(next)}.`, 'success', 'USUARIOS');
    void load();
  };

  const remove = (u: ManagedUser) =>
    ask({
      title: 'Eliminar usuario',
      message: `${u.name || u.email} perderá el acceso a SIGEPRO de inmediato.`,
      hint: 'Podrá volver a crearlo más adelante con el mismo correo.',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        const r = await callUsersApi('DELETE', { id: u.id });
        if (r.error) return showToast(r.error, 'error', 'USUARIOS');
        showToast('Usuario eliminado.', 'success', 'USUARIOS');
        void load();
      },
    });

  return (
    <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 pb-8 pt-1">
      <PageHeader
        icon={UserCog}
        title="Usuarios"
        subtitle="Cree las cuentas del equipo y elija su rol. Solo usted, como superadministrador, ve este módulo."
        actions={
          <button type="button" className={heroPrimaryBtn} onClick={() => { setFormError(''); setIsFormOpen(true); }}>
            <UserPlus className="w-5 h-5" /> Crear usuario
          </button>
        }
      />

      <div className="mt-6">
        {/* Formulario (ventana) */}
        {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-[#050b1a]/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsFormOpen(false); }}>
        <form onSubmit={submit} className="bg-[#f4f8fc] dark:bg-[#0c1426] rounded-[28px] border border-black/10 dark:border-white/10 max-w-lg w-full shadow-2xl overflow-hidden animate-fade-up my-8">
          <div className="relative overflow-hidden bg-gradient-brand text-white px-6 py-5 flex items-center justify-between">
            <BrandSwoosh className="absolute -right-10 -bottom-12 w-64 opacity-100" />
            <div className="relative flex items-center gap-3">
              <span className="w-11 h-11 rounded-2xl bg-white/15 ring-1 ring-white/30 grid place-items-center">
                <UserPlus className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold">Nuevo usuario</h3>
                <p className="text-xs text-white/75">Se crea con acceso inmediato.</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsFormOpen(false)} aria-label="Cerrar" className="relative w-9 h-9 grid place-items-center rounded-xl text-white/80 hover:text-white hover:bg-white/15 text-xl cursor-pointer">&times;</button>
          </div>
          <div className="p-6 space-y-5">

          {formError && (
            <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-700 dark:text-red-300">
              {formError}
            </div>
          )}

          <div>
            <label htmlFor="u-name" className={labelCls}>Nombre completo</label>
            <input id="u-name" className={fieldCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. María Pérez" autoComplete="off" />
          </div>

          <div>
            <label htmlFor="u-email" className={labelCls}>Correo</label>
            <input id="u-email" type="email" className={fieldCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@flotasugamuxisa.com.co" autoComplete="off" />
          </div>

          <div>
            <label htmlFor="u-pass" className={labelCls}>Contraseña temporal</label>
            <div className="relative">
              <input
                id="u-pass"
                type={showPass ? 'text' : 'password'}
                className={`${fieldCls} pr-24`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Use la varita para generar una"
                autoComplete="new-password"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    setPassword(generateStrongPassword());
                    setShowPass(true);
                  }}
                  title="Generar contraseña segura"
                  aria-label="Generar contraseña segura"
                  className="w-9 h-9 grid place-items-center rounded-lg text-[#2c84c4] hover:bg-[#2c84c4]/10 cursor-pointer"
                >
                  <Wand2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  title={showPass ? 'Ocultar' : 'Mostrar'}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="w-9 h-9 grid place-items-center rounded-lg text-[#6b84a3] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
              {passwordRules(password).map((r) => (
                <li key={r.key} className={`text-[11px] ${r.ok ? 'text-[#1d5fa8] dark:text-[#69bdd7] font-semibold' : 'text-[#6b84a3]'}`}>
                  {r.ok ? '✓' : '○'} {r.label}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-[#6b84a3]">En su primer ingreso la persona deberá cambiar esta contraseña por una propia.</p>
          </div>

          <div>
            <span className={labelCls}>Rol</span>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05]">
              {ROLE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setRole(o.value)}
                  aria-pressed={role === o.value}
                  className={`min-h-16 px-3 py-2 rounded-xl flex flex-col items-center justify-center leading-tight transition-all cursor-pointer ${
                    role === o.value ? 'bg-gradient-action text-white shadow-glow' : 'text-[#1c3354] dark:text-slate-200 hover:bg-[#2c84c4]/10'
                  }`}
                >
                  <span className="text-sm font-semibold">{o.title}</span>
                  <span className={`mt-0.5 text-[10.5px] text-center ${role === o.value ? 'text-white/85' : 'text-[#6b84a3]'}`}>{o.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full h-12 rounded-xl bg-gradient-action text-white text-sm font-semibold shadow-glow hover:brightness-110 disabled:opacity-60 cursor-pointer inline-flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {saving ? 'Creando…' : 'Crear usuario'}
          </button>
          </div>
        </form>
        </div>
        )}

        {/* Lista */}
        <section className={`${cardCls} overflow-hidden`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8eef5] dark:border-slate-800">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#0b1d3a] dark:text-white leading-tight">Cuentas del sistema</h2>
              <p className="text-xs text-[#3a5274] dark:text-slate-400">{users.length} {users.length === 1 ? 'cuenta' : 'cuentas'}</p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              aria-label="Actualizar lista"
              title="Actualizar lista"
              className="w-10 h-10 grid place-items-center rounded-xl border border-[#2c84c4]/30 text-[#1d5fa8] dark:text-[#69bdd7] hover:bg-[#2c84c4]/10 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadError ? (
            <div className="p-6 text-sm text-red-700 dark:text-red-300">{loadError}</div>
          ) : loading && users.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#3a5274] dark:text-slate-400">Cargando…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={theadRowCls}>
                    <th className="py-3 pl-5 pr-3 font-bold">Usuario</th>
                    <th className="py-3 px-3 font-bold">Rol</th>
                    <th className="py-3 px-3 font-bold">Último ingreso</th>
                    <th className="py-3 pl-3 pr-5 text-right font-bold">Acciones</th>
                  </tr>
                </thead>
                <tbody className={tbodyCls}>
                  {users.map((u) => {
                    const isOwner = u.role === 'SUPERADMIN' || u.role === 'ADMIN';
                    return (
                      <tr key={u.id} className={rowCls}>
                        <td className="py-3 pl-5 pr-3">
                          <div className="font-semibold text-[#0b1d3a] dark:text-white">{u.name || u.email.split('@')[0]}</div>
                          <div className="text-xs text-[#3a5274] dark:text-slate-400">{u.email}</div>
                        </td>
                        <td className="py-3 px-3">
                          {isOwner ? (
                            <StatusPill tone="blue">
                              <ShieldCheck className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                              Superadministrador
                            </StatusPill>
                          ) : (
                            <select
                              value={u.role === 'ADMINISTRADOR' ? 'ADMINISTRADOR' : 'USUARIO'}
                              onChange={(e) => void changeRole(u, e.target.value as AssignableRole)}
                              aria-label={`Rol de ${u.email}`}
                              className="h-9 px-2.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.1] dark:border-white/10 text-sm font-semibold text-[#0b1d3a] dark:text-white cursor-pointer"
                            >
                              <option value="ADMINISTRADOR">Administrador</option>
                              <option value="USUARIO">Usuario</option>
                            </select>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[#3a5274] dark:text-slate-300 whitespace-nowrap">{fmtDate(u.lastSignInAt)}</td>
                        <td className="py-3 pl-3 pr-5">
                          <div className="flex justify-end">
                            {!isOwner && (
                              <button
                                type="button"
                                onClick={() => remove(u)}
                                title="Eliminar usuario"
                                aria-label={`Eliminar ${u.email}`}
                                className="w-9 h-9 grid place-items-center rounded-xl border border-red-500/30 text-red-600 dark:text-red-300 hover:bg-red-500/10 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      {dialog}
    </div>
  );
};
