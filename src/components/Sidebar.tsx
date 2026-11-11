import React from 'react';
import { useApp } from '../context/AppContext';
import { AppView } from '../types';
import { FlotaSugamuxiLogo } from './FlotaSugamuxiLogo';
import {
  Home,
  Users,
  Star,
  UserPlus,
  BarChart3,
  Layers,
  Settings,
  ShieldCheck,
  UserCog,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onOpenRegisterModal: () => void;
  onOpenHabeasDataModal?: () => void;
}

interface NavItem {
  view: AppView;
  label: string;
  icon: React.ElementType;
  /** Solo lo ve el superadministrador */
  superOnly?: boolean;
  alsoActiveOn?: AppView[];
}

const GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Proveedores',
    items: [
      { view: 'revisores', label: 'Resumen', icon: Home },
      { view: 'bancoProveedores', label: 'Banco de proveedores', icon: Users },
      { view: 'evaluaciones', label: 'Evaluaciones', icon: Star },
      { view: 'registrarProveedor', label: 'Registrar proveedor', icon: UserPlus },
      { view: 'informesExcel', label: 'Reportes', icon: BarChart3 },
    ],
  },
  {
    title: 'Configuración',
    items: [
      { view: 'adminForms', label: 'Formatos SIG', icon: Layers, superOnly: true },
      { view: 'parametrizacion', label: 'Parametrización', icon: Settings, superOnly: true, alsoActiveOn: ['documentMatrix'] },
      { view: 'auditoria', label: 'Auditoría', icon: ShieldCheck, superOnly: true },
      { view: 'usuarios', label: 'Usuarios', icon: UserCog, superOnly: true },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed, onOpenHabeasDataModal }) => {
  const { accountRole, activeUser, signOut, activeView, setActiveView, setReviewSelectedDossierId, showToast } = useApp();

  const handleSignOut = async () => {
    await signOut();
  };

  const go = (view: AppView) => {
    if (view === 'revisores') setReviewSelectedDossierId(null);
    setActiveView(view);
  };

  return (
    <aside
      className={`relative overflow-hidden text-sidebar flex flex-col shrink-0 z-30 select-none h-screen sticky top-0 transition-[width] duration-300 bg-gradient-sidebar text-[#d5e3f3] ${
        isCollapsed ? 'w-[84px]' : 'w-[264px]'
      }`}
    >
      {/* Trazos del logo y cuadrícula de fondo */}
      <svg aria-hidden="true" viewBox="0 0 800 600" fill="none" className="pointer-events-none absolute -bottom-10 -left-24 w-[200%] opacity-30">
        <defs>
          <linearGradient id="sbA" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#69bdd7" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="sbB" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#69bdd7" stopOpacity="0" />
            <stop offset="0.6" stopColor="#69bdd7" stopOpacity="0.8" />
            <stop offset="1" stopColor="#2c84c4" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M-40 470 C 180 330, 420 250, 840 120" stroke="url(#sbA)" strokeWidth="3" strokeLinecap="round" />
        <path d="M-40 520 C 220 400, 500 330, 840 230" stroke="url(#sbB)" strokeWidth="2" strokeLinecap="round" />
        <path d="M60 600 C 300 460, 560 380, 840 340" stroke="url(#sbA)" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      </svg>
      <div className="absolute inset-0 grid-pattern opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_40%)] pointer-events-none" />

      <div className={`relative h-[92px] flex items-center shrink-0 gap-3 ${isCollapsed ? 'justify-center' : 'px-5'}`}>
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-2xl bg-[#69bdd7]/40 blur-md" />
          <img src="/nd/flotasugamuxi_logo.png" alt="Flota Sugamuxi" className="relative w-11 h-11 rounded-2xl ring-1 ring-white/20 object-cover" />
        </div>
        {!isCollapsed && (
          <div className="leading-tight min-w-0">
            <p className="font-display text-base font-semibold text-white truncate">Flota Sugamuxi</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#69bdd7]/80">Proveedores</p>
          </div>
        )}
      </div>

      <nav className="relative flex-1 overflow-y-auto min-h-0 px-4 pb-3 pt-2" aria-label="Menú principal">
        {GROUPS.map((group, gi) => {
          const items = group.items.filter((it) => !it.superOnly || accountRole === 'SUPERADMIN');
          if (items.length === 0) return null;
          return (
            <div key={group.title} className={gi > 0 ? 'mt-6' : ''}>
              {!isCollapsed && (
                <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">{group.title}</div>
              )}
              <ul className="space-y-1">
                {items.map((it) => {
                  const Icon = it.icon;
                  const active = activeView === it.view || (it.alsoActiveOn || []).includes(activeView);
                  return (
                    <li key={it.view}>
                      <button
                        type="button"
                        onClick={() => go(it.view)}
                        title={isCollapsed ? it.label : undefined}
                        aria-current={active ? 'page' : undefined}
                        className={`group relative w-full flex items-center rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#69bdd7] ${
                          isCollapsed ? 'justify-center h-12' : 'gap-3 px-3 h-12'
                        } ${
                          active
                            ? 'text-white shadow-glow bg-gradient-to-r from-[#2c84c4]/90 to-[#2c84c4]/40'
                            : 'text-white/70 hover:bg-white/[0.07] hover:text-white'
                        }`}
                      >
                        {active && <span className="absolute -left-4 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#69bdd7] shadow-glow" />}
                        <span className={`flex w-8 h-8 shrink-0 items-center justify-center rounded-lg transition-colors ${active ? 'bg-white/15' : 'bg-white/[0.06] group-hover:bg-white/10'}`}>
                          <Icon className="w-4 h-4" strokeWidth={1.9} />
                        </span>
                        {!isCollapsed && <span className="truncate text-left flex-1">{it.label}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="relative shrink-0 px-4 pb-4 pt-2 flex items-center justify-between gap-2">
        {!isCollapsed && onOpenHabeasDataModal && (
          <button
            type="button"
            onClick={onOpenHabeasDataModal}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-white/60 hover:bg-white/[0.07] hover:text-white cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            Tratamiento de datos (Ley 1581)
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
          className={`w-8 h-8 grid place-items-center rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer ${isCollapsed ? 'mx-auto' : ''}`}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
