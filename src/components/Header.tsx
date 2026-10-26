import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  Settings,
  ChevronDown,
  Building,
  RotateCcw,
  Moon,
  Sun,
  Menu,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole, AppView } from '../types';
import { FlotaSugamuxiEmblem } from './FlotaSugamuxiLogo';

interface Props {
  onOpenRegisterModal: () => void;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<Props> = ({
  onOpenRegisterModal,
  activeView,
  setActiveView,
  onToggleSidebar,
}) => {
  const {
    role,
    setRole,
    dossiers,
    allDossiers,
    activeUserId,
    setActiveUserId,
    activeUser,
    systemUsers,
    currentDossierId,
    currentDossier,
    setCurrentDossierId,
    resetToDefaultData,
    theme,
    toggleTheme,
    showToast,
  } = useApp();

  const [isDossierDropdownOpen, setIsDossierDropdownOpen] = useState(false);
  const isDarkMode = theme === 'dark';

  const getUserDetails = () => {
    if (role === 'ADMIN') {
      return {
        initials: 'JS',
        name: 'Julian Salgado',
        roleLabel: 'ADMINISTRADOR GENERAL',
        bg: 'bg-[#0f172a] dark:bg-cyan-950 text-white dark:text-cyan-200 border dark:border-cyan-800/60',
        tagBg: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
      };
    }
    if (role === 'REVISOR') {
      return {
        initials: activeUser.avatarText || 'R1',
        name: activeUser.name,
        roleLabel: `REVISOR (${activeUser.shortName})`,
        bg: 'bg-[#1e293b] dark:bg-blue-950 text-white dark:text-blue-200 border dark:border-blue-800/60',
        tagBg: 'bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800',
      };
    }
    const name = currentDossier
      ? currentDossier.basicInfo.supplierType === 'NATURAL'
        ? currentDossier.basicInfo.fullName
        : currentDossier.basicInfo.companyName
      : 'Aspirante Público';
    
    const initials = name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'PR';

    return {
      initials,
      name,
      roleLabel: 'PROVEEDOR',
      bg: 'bg-blue-900 dark:bg-blue-800 text-white',
      tagBg: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    };
  };

  const user = getUserDetails();

  return (
    <header className="bg-white dark:bg-[#0b1329] text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800/90 sticky top-0 z-20 shadow-xs select-none transition-colors duration-200">
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        
        {/* Left: Platform Title matching screenshot */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Abrir menú de navegación"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2 truncate">
            <div className="w-8 h-8 shrink-0 flex items-center justify-center p-1 rounded-xl bg-white border border-slate-200 dark:border-slate-700 shadow-2xs">
              <FlotaSugamuxiEmblem className="w-full h-full" isDark={isDarkMode} />
            </div>
            <h1 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2 truncate uppercase">
              <span className="hidden sm:inline">SIGEPRO - SISTEMA INTEGRAL DE GESTIÓN DE PROVEEDORES</span>
              <span className="sm:hidden font-bold">SIGEPRO • FLOTA SUGAMUXI</span>
              <span className="hidden lg:inline text-slate-400 dark:text-slate-500 font-normal">•</span>
              <span className="hidden lg:inline text-slate-600 dark:text-cyan-400 font-bold">FLOTA SUGAMUXI S.A.</span>
            </h1>
          </div>
        </div>

        {/* Right Controls: Dark toggle | Mail Simulator | User Badge | Portal Version */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Night mode toggle button with smooth animation */}
          <button
            onClick={toggleTheme}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border transition-all duration-200 shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 ${
              isDarkMode
                ? 'bg-slate-800/90 border-slate-700 text-cyan-300 hover:bg-slate-700 hover:text-cyan-200'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title={isDarkMode ? 'Cambiar a Modo Claro (Luz del día)' : 'Cambiar a Modo Oscuro (Noche)'}
            aria-label={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-cyan-400 animate-spin-once" />
                <span className="hidden lg:inline text-[11px] font-bold text-slate-200">Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-700" />
                <span className="hidden lg:inline text-[11px] font-bold text-slate-700">Oscuro</span>
              </>
            )}
          </button>



          {/* Módulo de Login Corporativo Button */}
          <button
            onClick={() => setActiveView('login')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
              activeView === 'login'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
            title="Módulo de Login Corporativo y Cambio de Cuenta / Rol"
          >
            <LogIn className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <span className="hidden sm:inline">Login Corporativo</span>
          </button>

          <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-800"></div>

          {/* User Profile / Active Dossier Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDossierDropdownOpen(!isDossierDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-2xs cursor-pointer text-left"
            >
              {/* Initials badge */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${user.bg}`}
              >
                {user.initials}
              </div>

              <div className="hidden md:flex flex-col text-left leading-tight pr-1">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 max-w-[120px] truncate">
                  {user.name}
                </span>
                <span className="text-[9px] font-black tracking-wider text-blue-700 dark:text-cyan-400 uppercase">
                  {user.roleLabel}
                </span>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  isDossierDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDossierDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#0f172a] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-50 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <div className="px-4 py-2">
                  <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Usuario / Perfil Activo
                  </span>
                  <p className="font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">{user.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {role === 'ADMIN'
                      ? 'Administrador General (18 Proveedores)'
                      : role === 'REVISOR'
                      ? `${activeUser.name} (${dossiers.length} Proveedores Asignados)`
                      : currentDossier
                      ? currentDossier.fileNumber
                      : 'Expediente General'}
                  </p>
                </div>

                {/* Switch Reviewer (if in REVISOR role) */}
                {role === 'REVISOR' && (
                  <div className="py-1">
                    <div className="px-4 py-1 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase">
                      Cambiar Revisor Técnico
                    </div>
                    <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
                      {systemUsers
                        .filter((u) => u.role === 'REVISOR')
                        .map((u) => {
                          const isCurrent = u.id === activeUserId;
                          const assignedCount = allDossiers.filter((d) => d.assignedReviewerId === u.id).length;
                          return (
                            <button
                              key={u.id}
                              onClick={() => {
                                setActiveUserId(u.id);
                                setIsDossierDropdownOpen(false);
                                showToast(
                                  `Cambiado a ${u.name}. Mostrando sus ${assignedCount} proveedores asignados.`,
                                  'info',
                                  'CAMBIO DE EVALUADOR'
                                );
                              }}
                              className={`w-full text-left px-4 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                                isCurrent
                                  ? 'bg-blue-50/70 dark:bg-blue-950/60 font-bold text-blue-900 dark:text-blue-300'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="truncate pr-2">
                                <div className="text-xs">{u.name}</div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                  {u.shortName} • {assignedCount} proveedores asignados
                                </div>
                              </div>
                              {isCurrent && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Switch Dossier */}
                <div className="py-1">
                  <div className="px-4 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                    Seleccionar Proveedor
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/60">
                    {dossiers.map((d) => {
                      const dName =
                        d.basicInfo.supplierType === 'NATURAL'
                          ? d.basicInfo.fullName
                          : d.basicInfo.companyName;
                      const isSelected = d.id === currentDossierId;
                      return (
                        <button
                          key={d.id}
                          onClick={() => {
                            setCurrentDossierId(d.id);
                            setIsDossierDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                            isSelected
                              ? 'bg-blue-50/70 dark:bg-blue-950/60 font-bold text-blue-900 dark:text-blue-300'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="truncate text-xs">{dName}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{d.fileNumber}</div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      setActiveView('login');
                      setIsDossierDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-cyan-300 hover:bg-blue-100 dark:hover:bg-blue-900 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-blue-200 dark:border-blue-800"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Módulo Login Corporativo</span>
                  </button>

                  {(role === 'REVISOR' || role === 'ADMIN') && (
                    <button
                      onClick={() => {
                        onOpenRegisterModal();
                        setIsDossierDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>+ Registrar Nuevo Proveedor</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (window.confirm('¿Restablecer datos demo a su configuración original?')) {
                        resetToDefaultData();
                        setIsDossierDropdownOpen(false);
                      }
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-400" />
                    <span>Restablecer datos demo</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Portal Version indicator (matches screenshot) */}
          <div className="hidden xl:flex flex-col text-right text-[10px] leading-tight text-slate-400 dark:text-slate-500 pl-1 border-l border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Portal Corporativo</span>
            <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">SIGEPRO v2.1.0</span>
          </div>

        </div>

      </div>
    </header>
  );
};
