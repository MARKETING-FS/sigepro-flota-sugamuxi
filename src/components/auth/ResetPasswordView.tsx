import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FlotaSugamuxiEmblem } from '../FlotaSugamuxiLogo';
import { KeyRound, Lock, Eye, EyeOff, AlertCircle, ChevronRight } from 'lucide-react';

const MIN_PASSWORD_LENGTH = 8;

const inputClass =
  'w-full pl-9 pr-9 py-2 bg-[#edf3fc] dark:bg-slate-900/90 border border-blue-100/90 dark:border-slate-700/80 rounded-xl text-xs font-medium font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all';

/**
 * Pantalla a la que llega el enlace del correo "Restablecer contraseña".
 * Supabase ya abrió una sesión temporal con el enlace; aquí solo se define la nueva clave.
 */
export const ResetPasswordView: React.FC = () => {
  const { authProfile, updatePassword, cancelPasswordRecovery, showToast } = useApp();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
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
    <div className="min-h-screen w-full bg-[#f1f5f9] dark:bg-[#080e1e] flex items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-md bg-white dark:bg-[#0c152a] rounded-3xl shadow-xl p-5 sm:p-7 border border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#060c1c] p-1 flex items-center justify-center shrink-0">
            <FlotaSugamuxiEmblem className="w-full h-full" color="#38bdf8" />
          </div>
          <div>
            <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">Flota Sugamuxi S.A.</div>
            <div className="text-[10px] font-bold text-[#0a2368] dark:text-[#38bdf8] font-mono tracking-wider">SIGEPRO</div>
          </div>
        </div>

        <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center mx-auto text-[#0a2368] dark:text-[#38bdf8] mb-2">
          <KeyRound className="w-5 h-5 stroke-[1.8]" />
        </div>
        <div className="text-center space-y-0.5 mb-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Nueva Contraseña</h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            {authProfile?.email
              ? <>Defina la nueva contraseña para <strong className="text-slate-700 dark:text-slate-200">{authProfile.email}</strong></>
              : 'Defina la nueva contraseña de su cuenta'}
          </p>
        </div>

        {!authProfile && (
          <div className="mb-3 p-2 bg-[#2c84c4]/12 dark:bg-[#2c84c4]/60 border border-[#2c84c4]/35 dark:border-[#2c84c4]/35 rounded-xl text-xs text-[#1d5fa8] dark:text-[#69bdd7] dark:text-[#69bdd7] flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>El enlace expiró o ya fue usado. Vuelva al inicio de sesión y solicite uno nuevo en "¿Olvidó su contraseña?".</span>
          </div>
        )}

        {error && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="space-y-1">
            <label htmlFor="new-password" className="text-[10px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider block">
              NUEVA CONTRASEÑA
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="confirm-password" className="text-[10px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider block">
              CONFIRMAR CONTRASEÑA
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita la contraseña"
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !authProfile}
            className="w-full py-2.5 bg-[#0a2368] hover:bg-[#07194d] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            {isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Guardar nueva contraseña</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => cancelPasswordRecovery()}
            className="w-full text-center text-[11px] text-[#0a2368] dark:text-[#38bdf8] hover:underline font-bold cursor-pointer"
          >
            Cancelar y volver al inicio de sesión
          </button>
        </form>
      </div>
    </div>
  );
};
