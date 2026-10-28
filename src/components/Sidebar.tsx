import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, AppView } from '../types';
import { FlotaSugamuxiLogo } from './FlotaSugamuxiLogo';
import {
  UserPlus,
  Search,
  Users,
  ShieldCheck,
  TrendingUp,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
  FileSpreadsheet,
  Lock,
  User,
  Settings,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  Building2,
  LogIn,
  SlidersHorizontal,
  Award,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onOpenRegisterModal: () => void;
  onOpenHabeasDataModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  onOpenRegisterModal,
  onOpenHabeasDataModal,
}) => {
  const {
    role,
    setRole,
    activeUserId,
    setActiveUserId,
    activeUser,
    systemUsers,
    allDossiers,
    activeView,
    setActiveView,
    setReviewSelectedDossierId,
    showToast,
  } = useApp();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isGestionOpen, setIsGestionOpen] = useState(true);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setIsRoleDropdownOpen(false);
    showToast(
      `Perfil cambiado a ${getRoleDisplayName(newRole)}. Vista actualizada.`,
      'info',
      'CAMBIO DE ROL'
    );
    setActiveView('revisores');
  };

  const getRoleDisplayName = (r: UserRole) => {
    switch (r) {
      case 'REVISOR':
        return 'Revisor Técnico Evaluador';
      case 'ADMIN':
        return 'Administrador General';
    }
  };

  const getActiveEmail = () => {
    if (role === 'ADMIN') return 'auxsistemas@flotasugamuxisa.com.co';
    return activeUser?.email || 'evaluador.sig@flotasugamuxisa.com.co';
  };

  return (
    <aside
      className={`bg-[#0b1329] text-slate-200 transition-all duration-300 flex flex-col shrink-0 border-r border-slate-800/80 z-30 select-none h-screen sticky top-0 ${
        isCollapsed ? 'w-16' : 'w-56 lg:w-60'
      }`}
    >
      {/* 1. Header Logo & Collapse Toggle */}
      <div className="h-14 px-3 flex items-center justify-between border-b border-slate-800/80 bg-[#090f20] shrink-0">
        {!isCollapsed ? (
          <FlotaSugamuxiLogo variant="dark" size="sm" />
        ) : (
          <FlotaSugamuxiLogo variant="icon-only" size="sm" />
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-cyan-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>

      {/* 2. ROL DE ACCESO Card */}
      {!isCollapsed ? (
        <div className="p-2.5 border-b border-slate-800/60 shrink-0">
          <div className="text-[9px] font-bold tracking-wider text-slate-400 uppercase mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-blue-400" />
            <span>ROL DE ACCESO</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 bg-[#121c38] hover:bg-[#162347] border border-slate-700/80 rounded-lg text-left transition-all shadow-inner cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0 ${
                    role === 'ADMIN'
                      ? 'bg-slate-800 border border-slate-700 text-cyan-300'
                      : role === 'REVISOR'
                      ? 'bg-blue-900 border border-blue-700 text-blue-200'
                      : 'bg-blue-600'
                  }`}
                >
                  {role === 'ADMIN' ? (
                    <Settings className="w-3.5 h-3.5" />
                  ) : role === 'REVISOR' ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="truncate">
                  <div className="text-[11px] font-bold text-white truncate">
                    {getRoleDisplayName(role)}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                  isRoleDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Options */}
            {isRoleDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#121c38] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 py-1 divide-y divide-slate-800/60">
                <button
                  onClick={() => handleRoleChange('REVISOR')}
                  className={`w-full px-2.5 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-slate-800 transition-colors ${
                    role === 'REVISOR' ? 'bg-blue-900/40 text-cyan-300 font-bold' : 'text-slate-300'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Revisor Técnico</span>
                </button>
                <button
                  onClick={() => handleRoleChange('ADMIN')}
                  className={`w-full px-2.5 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-slate-800 transition-colors ${
                    role === 'ADMIN' ? 'bg-blue-900/40 text-cyan-300 font-bold' : 'text-slate-300'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5 text-blue-400" />
                  <span>Administrador General</span>
                </button>
              </div>
            )}
          </div>

          <div className="mt-1.5 text-[9px] text-slate-400 flex items-center gap-1 truncate px-0.5">
            <span className="text-slate-500">Email:</span>
            <span className="font-mono text-slate-300 truncate">{getActiveEmail()}</span>
          </div>

          {/* Selector de Revisor Específico (Revisor 1, 2, 3) */}
          {role === 'REVISOR' && (
            <div className="mt-2.5 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[9px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                <span>EVALUADOR ACTIVO</span>
                <span className="font-mono text-cyan-300 bg-cyan-950/90 px-1.5 py-0.5 rounded border border-cyan-800/60 text-[9px]">
                  {allDossiers.filter((d) => d.assignedReviewerId === activeUserId).length} Prov.
                </span>
              </div>
              <select
                id="sidebarActiveReviewerSelect"
                value={activeUserId}
                onChange={(e) => {
                  setActiveUserId(e.target.value);
                  const sel = systemUsers.find((u) => u.id === e.target.value);
                  if (sel) {
                    const count = allDossiers.filter((d) => d.assignedReviewerId === sel.id).length;
                    showToast(
                      `Evaluador cambiado a ${sel.name}. Mostrando sus ${count} proveedores asignados.`,
                      'info',
                      'CAMBIO DE EVALUADOR'
                    );
                  }
                }}
                className="w-full text-[11px] font-semibold px-2 py-1.5 bg-[#090f20] border border-blue-900/80 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
                title="Seleccionar el usuario revisor para ver su cartera asignada"
              >
                {systemUsers
                  .filter((u) => u.role === 'REVISOR')
                  .map((u) => {
                    const count = allDossiers.filter((d) => d.assignedReviewerId === u.id).length;
                    return (
                      <option key={u.id} value={u.id}>
                        {u.shortName}: {u.name.split(' ')[0]} {u.name.split(' ')[1] || ''} ({count})
                      </option>
                    );
                  })}
              </select>
            </div>
          )}

          {/* Direct link to Corporate Login view */}
          <button
            onClick={() => setActiveView('login')}
            className={`mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
              activeView === 'login'
                ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                : 'bg-[#090f20] hover:bg-blue-950/80 text-cyan-300 border-blue-900/80'
            }`}
            title="Módulo de Login Corporativo y Gestión de Cuentas"
          >
            <LogIn className="w-3.5 h-3.5 text-cyan-400" />
            <span>Módulo Login Corporativo</span>
          </button>
        </div>
      ) : (
        <div className="p-2 border-b border-slate-800/60 flex flex-col items-center gap-1 shrink-0">
          <button
            onClick={() => handleRoleChange(role === 'REVISOR' ? 'ADMIN' : 'REVISOR')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-white ${
              role === 'ADMIN'
                ? 'bg-slate-800 border border-slate-700 text-cyan-300'
                : role === 'REVISOR'
                ? 'bg-blue-900 border border-blue-700 text-blue-200'
                : 'bg-blue-600'
            }`}
            title={`Rol actual: ${getRoleDisplayName(role)} (Click para cambiar)`}
          >
            {role === 'ADMIN' ? (
              <Settings className="w-4 h-4" />
            ) : role === 'REVISOR' ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <User className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => setActiveView('login')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              activeView === 'login'
                ? 'bg-blue-600 text-white border border-blue-400'
                : 'bg-[#090f20] hover:bg-blue-950 text-cyan-300 border border-blue-900/80'
            }`}
            title="Módulo Login Corporativo"
          >
            <LogIn className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      )}

      {/* 3. Navigation Links List */}
      <div className="flex-1 flex flex-col justify-start py-3 px-2 overflow-y-auto min-h-0 text-xs scrollbar-thin scrollbar-thumb-slate-800 space-y-3">
        
        {/* === SECTION FOR REVISOR & ADMIN === */}
        {(role === 'REVISOR' || role === 'ADMIN') && (
          <>
            {/* INFORMACIÓN EJECUTIVA */}
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  INFORMACIÓN EJECUTIVA
                </div>
              )}

              {/* Dashboard Ejecutivo */}
              <button
                onClick={() => {
                  setReviewSelectedDossierId(null);
                  setActiveView('revisores');
                }}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0 py-2' : 'justify-start gap-2.5 px-2.5 py-1.5'
                } rounded-lg font-medium transition-all ${
                  activeView === 'revisores'
                    ? 'bg-gradient-to-r from-blue-900/80 to-blue-800/50 text-white border border-blue-500/80 shadow-md shadow-blue-950/50'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
                title="Dashboard Ejecutivo y Revisión de Proveedores"
              >
                <TrendingUp
                  className={`w-4 h-4 shrink-0 ${
                    activeView === 'revisores' ? 'text-cyan-400' : 'text-blue-400'
                  }`}
                />
                {!isCollapsed && <span className="truncate">Dashboard Ejecutivo</span>}
              </button>
            </div>

            {/* GESTIÓN DE PROVEEDORES */}
            <div className="space-y-1.5">
              {!isCollapsed && (
                <div className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  GESTIÓN PROVEEDORES
                </div>
              )}

              {/* Registrar Proveedor (Alta Directa / Inscripción) */}
              <button
                onClick={() => setActiveView('registrarProveedor')}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-start gap-2.5 px-2.5 py-2'
                } rounded-lg font-medium transition-all text-left cursor-pointer ${
                  activeView === 'registrarProveedor'
                    ? 'bg-gradient-to-r from-blue-900/80 to-blue-800/50 text-white border border-blue-500/80 shadow-md shadow-blue-950/50'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
                title="Registrar / Alta Oficial de Proveedor (Ventana Completa)"
              >
                <UserPlus
                  className={`w-4 h-4 shrink-0 ${
                    activeView === 'registrarProveedor' ? 'text-cyan-400' : 'text-blue-400'
                  }`}
                />
                {!isCollapsed && <span className="truncate font-semibold">Registrar Proveedor</span>}
              </button>

              {/* Banco Proveedores */}
              <button
                onClick={() => setActiveView('bancoProveedores')}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-start gap-2.5 px-2.5 py-2'
                } rounded-lg font-medium transition-all text-left ${
                  activeView === 'bancoProveedores'
                    ? 'bg-gradient-to-r from-blue-900/80 to-blue-800/50 text-white border border-blue-500/80 shadow-md shadow-blue-950/50'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
                title="Banco de Proveedores y Contratistas"
              >
                <Users
                  className={`w-4 h-4 shrink-0 ${
                    activeView === 'bancoProveedores' ? 'text-cyan-400' : 'text-blue-400'
                  }`}
                />
                {!isCollapsed && <span className="truncate">Banco Proveedores</span>}
              </button>

              {/* Evaluaciones de Proveedores (Revisor & Admin) */}
              <button
                onClick={() => setActiveView('evaluaciones')}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-start gap-2.5 px-2.5 py-2'
                } rounded-lg font-medium transition-all text-left cursor-pointer ${
                  activeView === 'evaluaciones'
                    ? 'bg-gradient-to-r from-blue-900/80 to-blue-800/50 text-white border border-blue-500/80 shadow-md shadow-blue-950/50'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
                title="Módulo de Evaluaciones de Proveedores (Inicial y Anual a 1 Año)"
              >
                <Award
                  className={`w-4 h-4 shrink-0 ${
                    activeView === 'evaluaciones' ? 'text-cyan-400' : 'text-blue-400'
                  }`}
                />
                {!isCollapsed && <span className="truncate font-semibold">Evaluaciones</span>}
              </button>

              {/* Informes y Reportes Excel */}
              <button
                onClick={() => setActiveView('informesExcel')}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-start gap-2.5 px-2.5 py-2'
                } rounded-lg font-medium transition-all text-left ${
                  activeView === 'informesExcel'
                    ? 'bg-gradient-to-r from-blue-900/80 to-blue-800/50 text-white border border-blue-500/80 shadow-md shadow-blue-950/50'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
                title="Centro de Reportes y Exportación en Excel"
              >
                <FileSpreadsheet
                  className={`w-4 h-4 shrink-0 ${
                    activeView === 'informesExcel' ? 'text-cyan-400' : 'text-blue-400'
                  }`}
                />
                {!isCollapsed && <span className="truncate">Reportes</span>}
              </button>


            </div>

            {/* SISTEMA INTEGRADO SIG */}
            <div className="space-y-1.5">
              {!isCollapsed && (
                <div className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  SISTEMA INTEGRADO SIG
                </div>
              )}

              <button
                onClick={() => setActiveView('adminForms')}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-start gap-2.5 px-2.5 py-2'
                } rounded-lg font-medium transition-all ${
                  activeView === 'adminForms'
                    ? 'bg-gradient-to-r from-blue-900/80 to-blue-800/50 text-white border border-blue-500/80 shadow-md shadow-blue-950/50'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
                title="Formatos Oficiales SIG"
              >
                <Layers
                  className={`w-4 h-4 shrink-0 ${
                    activeView === 'adminForms' ? 'text-cyan-400' : 'text-blue-400'
                  }`}
                />
                {!isCollapsed && <span className="truncate">Formatos SIG</span>}
              </button>

              {/* Parametrización de Requisitos y Documentos (Only Admin General) */}
              {role === 'ADMIN' && (
                <>
                  <button
                    onClick={() => setActiveView('parametrizacion')}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-start gap-2.5 px-2.5 py-2'
                    } rounded-lg font-medium transition-all ${
                      activeView === 'parametrizacion' || activeView === 'documentMatrix'
                        ? 'bg-gradient-to-r from-blue-900/80 to-blue-800/50 text-white border border-blue-500/80 shadow-md shadow-blue-950/50'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                    title="Módulo de Parametrización General, Catálogos Maestros y Matriz de Requisitos SIG"
                  >
                    <SlidersHorizontal
                      className={`w-4 h-4 shrink-0 ${
                        activeView === 'parametrizacion' || activeView === 'documentMatrix' ? 'text-cyan-400' : 'text-blue-400'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate font-semibold">Parametrización</span>}
                  </button>

                  <button
                    onClick={() => setActiveView('auditoria')}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-start gap-2.5 px-2.5 py-2'
                    } rounded-lg font-medium transition-all ${
                      activeView === 'auditoria'
                        ? 'bg-gradient-to-r from-blue-900/80 to-blue-800/50 text-white border border-blue-500/80 shadow-md shadow-blue-950/50'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                    title="Módulo de Auditoría y Trazabilidad General"
                  >
                    <ShieldAlert
                      className={`w-4 h-4 shrink-0 ${
                        activeView === 'auditoria' ? 'text-cyan-400' : 'text-blue-400'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate font-semibold">Módulo Auditoría</span>}
                  </button>
                </>
              )}
            </div>


          </>
        )}
      </div>

      {/* 4. Bottom Footer: Colapsar Menú & Habeas Data & Developer Credit */}
      <div className="p-2.5 border-t border-slate-800/80 bg-[#090f20] space-y-1.5 shrink-0">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors text-xs cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-cyan-400 mx-auto" />
          ) : (
            <>
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px]">Colapsar Menú</span>
            </>
          )}
        </button>

        {!isCollapsed && (
          <div className="px-1 text-[9px] text-slate-400 space-y-1">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-400 uppercase tracking-wider text-[8px]">HABEAS DATA</div>
              <div>
                <button
                  onClick={onOpenHabeasDataModal}
                  className="text-blue-400 hover:text-blue-300 underline font-semibold transition-colors cursor-pointer text-[10px]"
                >
                  Tratamiento de Datos
                </button>
              </div>
              <div className="text-[8px] text-slate-500">Ley 1581 de 2012</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
