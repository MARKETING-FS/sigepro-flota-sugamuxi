import React, { useEffect, useRef, useState } from 'react';
import { Moon, Sun, Menu, ChevronDown, ChevronRight, LogOut, UserPlus, Home } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppView } from '../types';
import { PushAlertsPopover } from './notifications/PushAlertsPopover';

interface Props {
  onOpenRegisterModal: () => void;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  onToggleSidebar?: () => void;
}

const SECTION_TITLE: Partial<Record<AppView, string>> = {
  revisores: 'Resumen',
  bancoProveedores: 'Banco de proveedores',
  evaluaciones: 'Evaluaciones',
  registrarProveedor: 'Registrar proveedor',
  informesExcel: 'Reportes',
  adminForms: 'Formatos SIG',
  parametrizacion: 'Parametrización',
  documentMatrix: 'Parametrización',
  auditoria: 'Auditoría',
  convocatorias: 'Convocatorias',
};

export const Header: React.FC<Props> = ({ onOpenRegisterModal, activeView, onToggleSidebar }) => {
  const { role, activeUser, signOut, theme, toggleTheme, showToast, setReviewSelectedDossierId } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    if (!isMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [isMenuOpen]);

  const handleSignOut = async () => {
    setIsMenuOpen(false);
    await signOut();
  };

  const iconBtn =
    'w-10 h-10 grid place-items-center rounded-xl text-[#1c3354] dark:text-white hover:bg-[#2c84c4]/10 dark:hover:bg-white/10 transition-colors cursor-pointer';
  const menuItem =
    'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-fs-navy dark:text-slate-200 hover:bg-fs-ground dark:hover:bg-slate-800 cursor-pointer';

  return (
    <header className="sticky top-0 z-20 border-b border-black/5 dark:border-white/10 glass">
      <div className="h-16 px-4 sm:px-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button type="button" onClick={onToggleSidebar} className={`${iconBtn} md:hidden`} aria-label="Abrir menú">
              <Menu className="w-5 h-5" />
            </button>
          )}
          <nav aria-label="Ruta" className="flex items-center gap-3 text-sm text-[#1d5fa8] dark:text-[#69bdd7] truncate">
            <span className="w-9 h-9 rounded-xl bg-gradient-brand text-white grid place-items-center shadow-glow shrink-0"><Home className="w-4 h-4" /></span>
            <span className="hidden sm:inline">SIGEPRO</span>
            <ChevronRight className="hidden sm:block w-4 h-4 shrink-0 text-[#6b84a3]" />
            <span className="font-display font-semibold text-[#0b1d3a] dark:text-white truncate">{SECTION_TITLE[activeView] || 'Inicio'}</span>
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:block mx-1 h-8 w-px bg-black/10 dark:bg-white/15 order-last" />
          <button
            type="button"
            onClick={toggleTheme}
            className={iconBtn}
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <PushAlertsPopover onOpenDossier={(dossierId) => setReviewSelectedDossierId(dossierId)} />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-3 py-1 pl-1 pr-2 rounded-xl hover:bg-[#2c84c4]/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-expanded={isMenuOpen}
            >
              <span className="relative w-9 h-9 rounded-xl bg-gradient-brand text-white text-sm font-display font-semibold grid place-items-center shadow-glow">{activeUser.avatarText}<span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#131b2e] bg-[#2c84c4]" /></span>
              <span className="hidden sm:block text-sm font-semibold text-[#0b1d3a] dark:text-white max-w-[240px] truncate">{activeUser.name}</span>
              <ChevronDown className="w-4 h-4 text-[#0b1d3a] dark:text-slate-300" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 !bg-white dark:!bg-[#061330] border border-fs-line dark:!border-[#24437f] rounded-2xl shadow-[0_18px_40px_-12px_rgba(0,0,0,0.65)] p-2 z-50 backdrop-blur-none">
                <div className="px-3 py-2 border-b border-fs-line dark:border-slate-800 mb-1">
                  <div className="text-sm font-semibold text-fs-navy dark:text-white truncate">{activeUser.name}</div>
                  <div className="text-xs text-fs-muted dark:!text-[#a9c3e0] truncate">
                    {role === 'ADMIN' ? 'Administrador general' : 'Revisor técnico'} · {activeUser.email}
                  </div>
                </div>
                <button
                  type="button"
                  className={menuItem}
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenRegisterModal();
                  }}
                >
                  <UserPlus className="w-4 h-4 text-fs-muted" /> Registrar proveedor
                </button>
                <div className="border-t border-fs-line dark:border-slate-800 mt-1 pt-1">
                  <button type="button" className={menuItem} onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 text-fs-muted" /> Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
