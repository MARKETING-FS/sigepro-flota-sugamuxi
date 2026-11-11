import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { KeyRound, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Check, Loader2 } from 'lucide-react';
import { BrandSwoosh } from '../ui/BrandSwoosh';
import { isPasswordValid, passwordRules } from '../../utils/passwordPolicy';

const inputClass =
  'w-full h-12 pl-10 pr-11 rounded-xl border border-white/15 bg-white/5 text-[15px] text-white placeholder:text-white/35 focus:outline-hidden focus:border-[#69bdd7] focus:ring-4 focus:ring-[#69bdd7]/30 transition-all';

/**
 * Pantalla para definir una contraseña nueva. Se usa en dos casos:
 *  - enlace del correo "Restablecer contraseña" (modo recuperación),
 *  - primer ingreso con la contraseña temporal creada por el superadministrador (modo obligatorio).
 */
export const ResetPasswordView: React.FC<{ forced?: boolean }> = ({ forced = false }) => {
  const { authProfile, updatePassword, cancelPasswordRecovery, signOut, showToast } = useApp();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const rules = passwordRules(password);
  const matches = confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isPasswordValid(password)) {
      setError('La contraseña no cumple todos los requisitos de la lista.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las dos contraseñas no coinciden.');
      return;
    }
    setIsLoading(true);
    const result = await updatePassword(password);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    showToast('Su contraseña fue actualizada. Ya puede usar SIGEPRO.', 'success', 'CONTRASEÑA ACTUALIZADA');
  };

  return (
    <div className="dark fixed inset-0 overflow-y-auto bg-[#131b2e] text-white font-sans antialiased">
      <div className="absolute inset-0 grid-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="absolute -right-32 -top-32 w-[28rem] h-[28rem] rounded-full bg-[#2c84c4]/35 blur-3xl" />
      <div className="absolute -bottom-40 -left-20 w-[26rem] h-[26rem] rounded-full bg-[#69bdd7]/20 blur-3xl" />
      <BrandSwoosh className="absolute -left-10 top-[30%] w-[120%] opacity-40 pointer-events-none" />

      <div className="relative min-h-full flex items-center justify-center p-5">
        <div className="w-full max-w-md gradient-border rounded-[28px] glass-dark p-8 shadow-glow animate-fade-up sm:p-10">
          <div className="flex flex-col items-center text-center">
            <span className="w-16 h-16 rounded-3xl bg-gradient-brand grid place-items-center shadow-glow ring-1 ring-white/25">
              <KeyRound className="w-8 h-8" strokeWidth={1.6} />
            </span>
            <h2 className="mt-5 font-display text-2xl font-semibold">{forced ? 'Cree su contraseña' : 'Nueva contraseña'}</h2>
            <p className="mt-1 text-sm text-white/60">
              {forced ? (
                <>
                  Por seguridad debe cambiar la contraseña temporal antes de continuar
                  {authProfile?.email && <> ({authProfile.email})</>}.
                </>
              ) : authProfile?.email ? (
                <>Defina la nueva contraseña para {authProfile.email}</>
              ) : (
                'Defina la nueva contraseña de su cuenta'
              )}
            </p>
          </div>

          {!authProfile && (
            <div className="mt-5 p-2.5 bg-[#2c84c4]/15 border border-[#2c84c4]/35 rounded-xl text-xs text-[#69bdd7] flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>El enlace expiró o ya fue usado. Vuelva al inicio de sesión y solicite uno nuevo en "¿Olvidó su contraseña?".</span>
            </div>
          )}

          {error && (
            <div role="alert" className="mt-5 p-2.5 bg-red-500/15 border border-red-400/40 rounded-xl text-sm text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-300 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-xs font-medium text-white/70">Nueva contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <ul className="grid grid-cols-1 gap-1.5 rounded-xl bg-white/[0.04] border border-white/10 p-3" aria-label="Requisitos de la contraseña">
              {rules.map((r) => (
                <li key={r.key} className={`flex items-center gap-2 text-xs ${r.ok ? 'text-[#69bdd7]' : 'text-white/55'}`}>
                  <span className={`w-4 h-4 rounded-full grid place-items-center shrink-0 ${r.ok ? 'bg-[#2c84c4] text-white' : 'border border-white/25'}`}>
                    {r.ok && <Check className="w-3 h-3" strokeWidth={3} />}
                  </span>
                  {r.label}
                </li>
              ))}
            </ul>

            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-medium text-white/70">Confirmar contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
                {matches && <Check className="w-4 h-4 text-[#69bdd7] absolute right-3.5 top-1/2 -translate-y-1/2" strokeWidth={3} />}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !authProfile || !isPasswordValid(password) || !matches}
              className="shimmer w-full h-12 rounded-xl bg-gradient-brand text-white text-base font-semibold shadow-glow transition-all hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando…
                </>
              ) : (
                <>
                  <span>Guardar nueva contraseña</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => (forced ? signOut() : cancelPasswordRecovery())}
              className="w-full text-center text-sm text-[#69bdd7] hover:underline font-semibold cursor-pointer"
            >
              {forced ? 'Salir' : 'Cancelar y volver al inicio de sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
