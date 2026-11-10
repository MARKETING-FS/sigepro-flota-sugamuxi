import React from 'react';
import { ProcessStatus, SupplierDossier, SupplierTier } from '../../types';
import { BrandSwoosh } from './BrandSwoosh';
import { useCountUp } from '../../hooks/useCountUp';

const CountUp: React.FC<{ value: React.ReactNode }> = ({ value }) => {
  const n = useCountUp(typeof value === 'number' ? value : 0);
  return <>{typeof value === 'number' ? n : value}</>;
};

/**
 * Piezas visuales compartidas del estilo "Archivo de expedientes":
 * pestaña de color por estado, radicado como rótulo, cifras grandes y paneles con líneas de 1 px.
 */

export type Tone = 'navy' | 'blue' | 'cyan' | 'muted' | 'warn' | 'bad' | 'ok';

export const TONE_COLOR: Record<Tone, string> = {
  navy: '#1a4a92',
  blue: '#1d5fa8',
  cyan: '#50bcd8',
  muted: '#9fb0c7',
  warn: '#69bdd7',
  bad: '#b91c1c',
  ok: '#2c84c4',
};

const TONE_TEXT: Record<Tone, string> = {
  navy: 'text-fs-navy bg-fs-blue-soft dark:text-white dark:bg-[#1d4f9e]',
  blue: 'text-[#1d5fa8] bg-[#e1ecf8] dark:!text-white dark:bg-[#1d6fe0]',
  cyan: 'text-[#13708a] bg-[#e6f6fa]',
  muted: 'text-fs-muted bg-[#eef2f7] dark:text-[#c9d6ea] dark:bg-[#22385f]',
  warn: 'text-[#0e6d8a] bg-[#d6eef6] dark:!text-[#131b2e] dark:bg-[#69bdd7]',
  bad: 'text-[#b91c1c] bg-[#fde3e3] dark:text-white dark:bg-[#dc2626]',
  ok: 'text-[#1d5fa8] bg-[#dbeaf7] dark:!text-white dark:bg-[#2c84c4]',
};

// Etapas del expediente en el orden en que avanzan, con su color de pestaña
export const STAGES: Array<{ key: string; label: string; tone: Tone; statuses: ProcessStatus[] }> = [
  { key: 'borrador', label: 'Borrador', tone: 'muted', statuses: ['BORRADOR', 'LISTO_PARA_ENVIO'] },
  { key: 'pendiente', label: 'Documentos pendientes', tone: 'muted', statuses: ['DOCUMENTACION_PENDIENTE'] },
  { key: 'revision', label: 'En revisión', tone: 'blue', statuses: ['EN_REVISION', 'CORREGIDO_EN_REVISION'] },
  { key: 'correccion', label: 'Corrección', tone: 'warn', statuses: ['REQUIERE_CORRECCION'] },
  { key: 'vencida', label: 'Documentos vencidos', tone: 'bad', statuses: ['DOCUMENTACION_VENCIDA'] },
  { key: 'aprobado', label: 'Aprobado', tone: 'cyan', statuses: ['APROBADO'] },
  {
    key: 'habilitado',
    label: 'Habilitado',
    tone: 'navy',
    statuses: ['PROVEEDOR_HABILITADO', 'DOCUMENTACION_POR_VENCER', 'CONTRATO_VIGENTE', 'CONTRATO_POR_VENCER', 'CONTRATO_VENCIDO'],
  },
  { key: 'suspendido', label: 'Suspendido o rechazado', tone: 'bad', statuses: ['SUSPENDIDO', 'RECHAZADO'] },
];

export const stageOf = (status: ProcessStatus) =>
  STAGES.find((s) => s.statuses.includes(status)) || STAGES[0];

export const supplierName = (d: SupplierDossier) =>
  (d.basicInfo?.supplierType === 'NATURAL' ? d.basicInfo?.fullName : d.basicInfo?.companyName) || 'Sin nombre';

export const supplierDoc = (d: SupplierDossier) =>
  d.basicInfo?.supplierType === 'NATURAL'
    ? `CC ${d.basicInfo?.documentNumber || '—'}`
    : `NIT ${d.basicInfo?.nit || '—'}`;

export const TIER_LABEL: Record<SupplierTier, string> = { A: 'Crítico', B: 'Operativo', C: 'Estándar' };

/** Pestaña de carpeta: marca de color a la izquierda de cada fila de proveedor */
export const ArchiveTab: React.FC<{ tone: Tone; title?: string }> = ({ tone, title }) => (
  <span
    aria-hidden={title ? undefined : true}
    title={title}
    className="block w-1 self-stretch rounded-r-sm shrink-0"
    style={{ backgroundColor: TONE_COLOR[tone] }}
  />
);

/** Radicado como rótulo de archivo */
export const Radicado: React.FC<{ value?: string; className?: string }> = ({ value, className = '' }) => (
  <span className={`text-[13px] text-[#3a5274] dark:text-slate-400 ${className}`}>{value || '—'}</span>
);

export const StatusPill: React.FC<{ tone: Tone; children: React.ReactNode }> = ({ tone, children }) => (
  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[13px] font-semibold whitespace-nowrap ${TONE_TEXT[tone]}`}>
    <span className="w-2 h-2 rounded-full dark:!bg-white" style={{ backgroundColor: TONE_COLOR[tone] }} />
    {children}
  </span>
);

export const TierBadge: React.FC<{ tier?: SupplierTier }> = ({ tier }) =>
  tier ? (
    <span
      title={`Tipo ${tier} · ${TIER_LABEL[tier]}`}
      className={`inline-grid place-items-center w-8 h-8 rounded-lg text-sm font-bold ${
        tier === 'A'
          ? 'bg-[#0b1d3a] text-white dark:bg-[#1f63c4]'
          : tier === 'B'
          ? 'bg-[#e1ecf8] text-[#1d5fa8] dark:!bg-[#4d8fe6] dark:!text-white'
          : 'bg-[#e9edf3] text-[#46607f] dark:!bg-[#3a6fbf] dark:!text-white'
      }`}
    >
      {tier}
    </span>
  ) : null;

/** Degradado del logo: azul oscuro a la izquierda, azul claro a la derecha */
export const LOGO_GRADIENT = 'linear-gradient(118deg, #0b1d3a 0%, #0f2a52 45%, #1d5fa8 80%, #3fa6d8 100%)';

/** Azul de acción (botones principales, pestaña activa, menú activo) */
export const ACTION_BLUE = '#1d5fa8';

/** Franja de encabezado azul oscuro con brillo azul claro a la derecha; las píldoras van debajo */
export const PageHeader: React.FC<{
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
  icon?: React.ElementType;
}> = ({ title, subtitle, actions, tabs, icon: Icon }) => (
  <>
    <div
      className="fs-hero relative overflow-hidden rounded-[24px] px-6 sm:px-8 py-7 text-white animate-fade-up"
          >
      <BrandSwoosh className="absolute -bottom-20 -right-16 w-[48%] opacity-100" />
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full hidden" viewBox="0 0 1200 130" preserveAspectRatio="none" fill="none">
        <defs>
          <linearGradient id="hdrA" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#1456d0" stopOpacity="0" />
            <stop offset="0.5" stopColor="#1b62dc" stopOpacity="0.7" />
            <stop offset="1" stopColor="#2f84f4" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="hdrB" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#2a7eff" stopOpacity="0.2" />
            <stop offset="0.6" stopColor="#3b92ff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#74bcff" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="hdrD" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#2f8cff" stopOpacity="0.3" />
            <stop offset="1" stopColor="#8fd0ff" stopOpacity="1" />
          </linearGradient>
          <filter id="hdrBlur" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
          <filter id="hdrBlurS" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>
        <g filter="url(#hdrBlur)">
          <path d="M300 -10 C 480 10, 640 50, 820 40 L 920 -10 Z" fill="#1f6df0" fillOpacity="0.35" />
          <path d="M200 145 C 450 135, 700 62, 900 -14 L 1215 -14 L 1215 145 Z" fill="url(#hdrA)" />
        </g>
        <g filter="url(#hdrBlurS)">
          <path d="M520 145 C 720 122, 900 62, 1060 -14 L 1215 -14 L 1215 30 C 1050 62, 900 122, 760 145 Z" fill="url(#hdrB)" />
          <path d="M640 145 C 800 112, 960 62, 1215 42 L 1215 82 C 1000 102, 880 132, 800 145 Z" fill="#0a2a78" fillOpacity="0.65" />
          <path d="M820 145 C 960 122, 1080 92, 1215 86 L 1215 145 Z" fill="url(#hdrD)" />
        </g>
      </svg>
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5 min-w-0">
          {Icon && (
            <>
              <span className="flex w-14 h-14 shrink-0 items-center justify-center rounded-2xl glass-dark"><Icon className="w-7 h-7 text-white" strokeWidth={1.6} /></span>
              
            </>
          )}
          <div className="min-w-0">
            <h1 className="font-display text-2xl md:text-[32px] font-semibold leading-tight">{title}</h1>
            {subtitle && <p className="text-[15px] text-white/75 mt-1.5 max-w-2xl">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </div>
    {tabs && <div className="mt-6">{tabs}</div>}
  </>
);

/** Contenido de la página debajo del encabezado */
export const PageBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mt-5 space-y-5">{children}</div>
);

/** Píldoras de filtro o pestañas con su conteo */
export const HeroTabs: React.FC<{
  items: Array<{ key: string; label: React.ReactNode; count?: number }>;
  value: string;
  onChange: (key: string) => void;
}> = ({ items, value, onChange }) => (
  <div role="tablist" className="flex flex-wrap gap-3">
    {items.map((it) => {
      const active = it.key === value;
      return (
        <button
          key={it.key}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(it.key)}
          className={`inline-flex items-center gap-2.5 h-11 px-5 rounded-full text-[15px] font-medium transition-colors cursor-pointer ${
            active
              ? 'bg-[#0f3d75] text-white shadow-[0_10px_22px_-10px_rgba(15,61,117,0.95)] dark:bg-[#0e3a7a] dark:ring-2 dark:ring-[#5aa8ff] dark:shadow-[0_0_20px_-2px_rgba(60,150,255,0.8)]'
              : 'bg-[#e6edf6] text-[#0b1d3a] hover:bg-[#d8e3f0] dark:bg-[#071636]/70 dark:ring-1 dark:ring-[#3f7fd8] dark:text-white dark:hover:bg-[#0c2350]'
          }`}
        >
          {it.label}
          {it.count !== undefined && (
            <span
              className={`min-w-[26px] h-6 px-2 grid place-items-center rounded-full text-[13px] font-bold tabular-nums ${
                active ? 'bg-[#2f7dd6] text-white' : 'text-[#1d5fa8] bg-[#d4e3f6] dark:bg-[#123267]'
              }`}
            >
              {it.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export const heroPrimaryBtn =
  'inline-flex items-center gap-2.5 h-12 px-6 rounded-2xl bg-white text-[#0a1e44] text-base font-bold shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)] hover:bg-[#eef6fd] dark:bg-[#2a63b0] dark:text-white dark:shadow-none dark:hover:bg-[#3470c2] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';
export const heroSecondaryBtn =
  'inline-flex items-center gap-2.5 h-12 px-6 rounded-2xl border-2 border-white/85 text-white text-base font-semibold hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';


/** Cifras grandes en tarjetas blancas */
export const FigureBand: React.FC<{
  items: Array<{ label: string; value: React.ReactNode; note?: React.ReactNode; tone?: 'bad' | 'warn'; onClick?: () => void; active?: boolean }>;
}> = ({ items }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
    {items.map((it, idx) => {
      const Tag = it.onClick ? 'button' : 'div';
      return (
        <Tag
          key={it.label}
          onClick={it.onClick}
          style={{ animationDelay: `${idx * 80}ms` }}
          className={`fs-card lift animate-fade-up relative overflow-hidden text-left rounded-2xl p-5 ${
            it.onClick ? 'cursor-pointer' : ''
          } ${it.active ? 'ring-2 ring-[#2c84c4]' : ''}`}
        >
          <span aria-hidden="true" className="absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl" style={{ background: it.tone === 'bad' ? 'rgba(220,38,38,.18)' : it.tone === 'warn' ? 'rgba(245,158,11,.22)' : 'rgba(44,132,196,.2)' }} />
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-1"
            style={{ background: it.tone === 'bad' ? '#b91c1c' : it.tone === 'warn' ? '#d97706' : LOGO_GRADIENT }}
          />
          <div className="relative text-[13px] font-medium text-[#3a5274] dark:text-slate-400">{it.label}</div>
          <div
            className={`relative font-display text-[34px] font-semibold leading-tight mt-2 tabular-nums ${
              it.tone === 'bad' ? 'text-fs-bad' : it.tone === 'warn' ? 'text-fs-warn' : 'text-[#0b1d3a] dark:text-white'
            }`}
          >
            <CountUp value={it.value} />
          </div>
          {it.note && <div className="text-[13px] text-[#3a5274] dark:text-slate-400 mt-1">{it.note}</div>}
        </Tag>
      );
    })}
  </div>
);

/** Panel blanco con sombra suave y título */
export const Panel: React.FC<{ title?: string; aside?: React.ReactNode; children: React.ReactNode; className?: string; padded?: boolean }> = ({
  title,
  aside,
  children,
  className = '',
  padded = true,
}) => (
  <section className={`fs-card rounded-2xl animate-fade-up ${className}`}>
    {title && (
      <header className={`flex items-baseline justify-between gap-3 ${padded ? 'px-5 pt-5 pb-2' : 'px-5 py-4 border-b border-[#e8eef5] dark:border-slate-800'}`}>
        <h2 className="font-display text-base font-semibold text-[#0b1d3a] dark:text-white">{title}</h2>
        {aside && <div className="text-[13px] text-[#3a5274] dark:text-slate-400">{aside}</div>}
      </header>
    )}
    <div className={padded ? 'px-5 pb-5' : ''}>{children}</div>
  </section>
);

/** Contenedor blanco para tablas */
export const cardCls = 'fs-card rounded-2xl';

/** Encabezado de tabla azul claro y filas alternadas */
export const theadRowCls = 'text-left text-[13px] font-bold uppercase text-[#0b1d3a] dark:text-slate-300 bg-[#eaf1f9] dark:bg-slate-900/60';
export const tbodyCls = 'divide-y divide-[#e6edf5] dark:divide-slate-800';
export const rowCls = 'hover:bg-[#eaf2fb] dark:hover:bg-[#0c2350]/70 transition-colors dark:[&>td:first-child]:shadow-[inset_3px_0_0_#4a9bff]';

/** Botón principal de cada fila */
export const rowPrimaryBtn =
  'h-11 px-5 rounded-xl bg-[#0f3d75] hover:bg-[#0b2f5c] dark:bg-[#1f7ae8] dark:hover:bg-[#2b86f2] text-white text-[15px] font-bold cursor-pointer transition-colors whitespace-nowrap shadow-[0_6px_14px_-8px_rgba(15,61,117,0.9)]';
export const rowIconBtn =
  'w-10 h-10 grid place-items-center rounded-xl border border-[#d6e0ec] dark:border-slate-700 bg-white dark:bg-[#0a1c44] text-[#1c3354] dark:text-white hover:text-[#1d5fa8] hover:bg-[#eef5fc] dark:hover:bg-[#123267] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white';

/** Color de la píldora de estado: habilitado en verde, el resto con el tono de su etapa */
export const stagePillTone = (stage: { key: string; tone: Tone }): Tone => (stage.key === 'habilitado' ? 'ok' : stage.tone);

/** Franja única con las etapas de todos los expedientes, misma escala y misma línea base */
export const StageStrip: React.FC<{
  counts: Array<{ key: string; label: string; tone: Tone; count: number }>;
  onSelect?: (key: string) => void;
}> = ({ counts, onSelect }) => {
  const visible = counts.filter((c) => c.count > 0);
  const total = visible.reduce((a, c) => a + c.count, 0);
  if (total === 0) {
    return <div className="h-9 rounded-md bg-[#eef2f7] dark:bg-slate-800 grid place-items-center text-sm text-fs-muted">Aún no hay expedientes</div>;
  }
  return (
    <div>
      <div className="flex h-9 rounded-md overflow-hidden gap-px bg-white dark:bg-slate-900">
        {visible.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => onSelect?.(c.key)}
            title={`${c.label}: ${c.count}`}
            className="flex items-center pl-2.5 text-sm font-semibold text-white min-w-[28px] cursor-pointer hover:brightness-110 transition-[filter]"
            style={{ flexGrow: c.count, flexBasis: 0, backgroundColor: TONE_COLOR[c.tone] }}
          >
            {c.count}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2.5 text-xs text-fs-muted dark:text-slate-400">
        {visible.map((c) => (
          <span key={c.key} className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: TONE_COLOR[c.tone] }} />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
};

/** Barra horizontal simple para comparar cantidades */
export const Meter: React.FC<{ value: number; max: number; tone?: Tone }> = ({ value, max, tone = 'blue' }) => (
  <div className="h-2 w-24 max-w-full rounded-full bg-[#e3eaf3] dark:bg-slate-800 overflow-hidden">
    <div className="h-full rounded-full" style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`, backgroundColor: TONE_COLOR[tone] }} />
  </div>
);

export const primaryBtn =
  'inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-fs-navy hover:bg-fs-navy-2 text-white text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fs-blue disabled:opacity-50';
export const secondaryBtn =
  'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-fs-line dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-fs-ground dark:hover:bg-slate-800 text-fs-navy dark:text-slate-100 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fs-blue';
export const inputCls =
  'px-4 py-2 rounded-2xl border border-[#d9e3ef] shadow-[0_2px_6px_-3px_rgba(15,42,82,0.18)] text-[15px] bg-white dark:bg-[#0a1c44] text-fs-navy dark:text-white placeholder:text-[#5d7392] focus:outline-none focus:ring-2 focus:ring-fs-blue/40 focus:border-fs-blue';

/** Campo con ícono a la izquierda (para selects de filtro) */
export const IconField: React.FC<{ icon: React.ElementType; className?: string; children: React.ReactNode }> = ({
  icon: Icon,
  className = '',
  children,
}) => (
  <label className={`relative block w-full ${className}`}>
    <Icon className="pointer-events-none w-[19px] h-[19px] text-[#0b1d3a] dark:text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={1.8} />
    {children}
  </label>
);

export const selectCls = 'w-full h-11 pl-11 font-semibold text-[#0b1d3a] cursor-pointer';
