import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, LogOut } from 'lucide-react';

// Pantalla mientras Supabase confirma si hay una sesión guardada
export const AuthLoadingScreen: React.FC = () => (
  <div className="min-h-screen w-full bg-[#f1f5f9] dark:bg-[#080e1e] flex flex-col items-center justify-center gap-3 font-sans">
    <div className="w-8 h-8 border-[3px] border-[#0a2368] dark:border-[#38bdf8] border-t-transparent rounded-full animate-spin" />
    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Verificando sesión...</span>
  </div>
);

// La cuenta existe en Supabase pero el administrador aún no le asignó rol (app_metadata.role)
export const NoRoleScreen: React.FC = () => {
  const { authProfile, signOut } = useApp();
  return (
    <div className="min-h-screen w-full bg-[#f1f5f9] dark:bg-[#080e1e] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#0c152a] rounded-3xl shadow-xl p-6 border border-slate-100 dark:border-slate-800/80 text-center">
        <div className="w-11 h-11 rounded-xl bg-[#2c84c4]/12 dark:bg-[#2c84c4]/60 text-[#1d5fa8] dark:text-[#69bdd7] dark:text-[#69bdd7] flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white">Cuenta sin permisos asignados</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
          La cuenta <strong>{authProfile?.email}</strong> inició sesión correctamente, pero todavía no tiene un rol
          (Revisor o Administrador) en SIGEPRO. Solicite al Administrador General que le asigne uno.
        </p>
        <button
          onClick={() => signOut()}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0a2368] hover:bg-[#07194d] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
};
