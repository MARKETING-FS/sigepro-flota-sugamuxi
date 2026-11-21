import React, { useEffect, useMemo, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Download,
  Calendar,
  Building2,
  FileText,
  Clock,
  ArrowRight,
  Eye,
  History,
  Activity,
  UserCheck,
  Quote,
  Pencil,
  ClipboardCheck,
  PauseCircle,
  PlayCircle,
  Trash2,
  PlusCircle,
  FolderPlus,
  Settings2,
  Users,
  CalendarDays,
  Info,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SystemAuditEntry } from '../types';
import { PageHeader, heroPrimaryBtn } from './ui/archive';

/* ───────────────────────── Lenguaje claro ───────────────────────── */

/** Qué es cada tipo de evento, dicho en palabras de todos los días. */
const ACTION_META: Record<string, { label: string; hint: string; icon: React.ElementType }> = {
  EDICION_CAMPO: { label: 'Dato modificado', hint: 'Alguien corrigió o cambió un dato', icon: Pencil },
  CAMBIO_ESTADO: { label: 'Cambio de estado', hint: 'El proveedor pasó a otra etapa', icon: Activity },
  VALIDACION_SARLAFT: { label: 'Consulta SARLAFT', hint: 'Se revisó en listas restrictivas', icon: ShieldCheck },
  REVISION_DOCUMENTO: { label: 'Documento', hint: 'Se cambió o anexó un documento', icon: FileText },
  ASIGNACION_REVISOR: { label: 'Asignación de revisor', hint: 'Se asignó quién revisa al proveedor', icon: UserCheck },
  CALIFICACION_PROVEEDOR: { label: 'Evaluación', hint: 'Se calificó al proveedor', icon: ClipboardCheck },
  INACTIVACION_PROVEEDOR: { label: 'Proveedor inactivado', hint: 'Se sacó de la lista de activos', icon: PauseCircle },
  REACTIVACION_PROVEEDOR: { label: 'Proveedor reactivado', hint: 'Volvió a la lista de activos', icon: PlayCircle },
  ELIMINACION_PROVEEDOR: { label: 'Proveedor eliminado', hint: 'Se borró el expediente completo', icon: Trash2 },
  CREACION_REGISTRO: { label: 'Registro nuevo', hint: 'Se agregó algo a un catálogo', icon: PlusCircle },
  ALTA_PROVEEDOR: { label: 'Proveedor nuevo', hint: 'Se creó un proveedor', icon: FolderPlus },
  CREACION_EXPEDIENTE: { label: 'Expediente nuevo', hint: 'Se creó un expediente', icon: FolderPlus },
  PARAMETRIZACION_SISTEMA: { label: 'Configuración', hint: 'Se cambió la parametrización', icon: Settings2 },
};

const STATUS_WORDS: Record<string, string> = {
  BORRADOR: 'Borrador',
  DOCUMENTACION_PENDIENTE: 'Documentación pendiente',
  LISTO_PARA_ENVIO: 'Listo para envío',
  EN_REVISION: 'En revisión',
  REQUIERE_CORRECCION: 'Requiere corrección',
  CORREGIDO_EN_REVISION: 'Corregido, en revisión',
  APROBADO: 'Aprobado',
  PROVEEDOR_HABILITADO: 'Habilitado',
  DOCUMENTACION_VENCIDA: 'Documentación vencida',
  DOCUMENTACION_POR_VENCER: 'Documentación por vencer',
  CONTRATO_VIGENTE: 'Contrato vigente',
  CONTRATO_POR_VENCER: 'Contrato por vencer',
  CONTRATO_VENCIDO: 'Contrato vencido',
  SUSPENDIDO: 'Suspendido',
  INICIAL: 'Inicial',
  SIN_COINCIDENCIAS: 'Sin coincidencias',
  REQUIERE_VERIFICACION: 'Requiere verificación',
  PENDIENTE: 'Pendiente',
  NO_VERIFICADO: 'Sin verificar',
  LIMPIO: 'Limpio',
  ALERTA: 'Alerta',
};

/** Convierte códigos técnicos (EN_REVISION) en texto normal (En revisión). El resto queda tal cual. */
const humanize = (value: unknown): string => {
  const v = String(value ?? '').trim();
  if (!v) return '';
  if (STATUS_WORDS[v]) return STATUS_WORDS[v];
  if (/^[A-Z0-9_]{3,}$/.test(v) && v.includes('_')) {
    const t = v.toLowerCase().replace(/_/g, ' ');
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  return v;
};

/** "Ana Pérez (ADMINISTRADOR GENERAL)" → "Ana Pérez" */
const cleanName = (user: string): string => {
  const n = (user || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
  return n || 'Alguien del equipo';
};

const roleLabel = (r: SystemAuditEntry['userRole']) => (r === 'ADMIN' ? 'Administrador' : r === 'SYSTEM' ? 'Sistema' : 'Revisor');

/** Movimientos del sistema (catálogos y configuración) no pertenecen a un proveedor. */
const isSystemEntry = (log: SystemAuditEntry) => !log.dossierId || /^(CONFIG|CAT|PARAM)-/.test(log.dossierId);

/** Un valor largo o en formato JSON no se muestra crudo: se resume y el detalle queda plegado. */
const isBig = (v: string) => v.length > 160 || /^\s*[{[]/.test(v);
const summarizeBig = (v: string): string => {
  try {
    const parsed = JSON.parse(v);
    if (parsed && typeof parsed === 'object') {
      const n = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
      return `Se guardó una configuración completa (${n} ajustes)`;
    }
  } catch {
    /* no era JSON */
  }
  return 'Texto largo (ver detalle)';
};

/** La frase que resume el evento, sin tecnicismos. */
const describe = (log: SystemAuditEntry): string => {
  const next = humanize(log.newValue);
  switch (log.action) {
    case 'EDICION_CAMPO':
      return `cambió «${log.fieldChanged}»`;
    case 'CAMBIO_ESTADO':
      return `cambió el estado del proveedor a «${next}»`;
    case 'VALIDACION_SARLAFT':
      return `consultó las listas restrictivas (SARLAFT) y el resultado fue «${next}»`;
    case 'REVISION_DOCUMENTO':
      return /^Nuevo Requisito/i.test(log.fieldChanged) ? 'anexó un documento nuevo' : 'actualizó un documento';
    case 'ASIGNACION_REVISOR':
      return /sin asignar/i.test(String(log.newValue)) ? 'quitó el revisor asignado' : `asignó el proveedor a ${log.newValue}`;
    case 'CALIFICACION_PROVEEDOR':
      return 'registró una evaluación';
    case 'INACTIVACION_PROVEEDOR':
      return 'inactivó al proveedor';
    case 'REACTIVACION_PROVEEDOR':
      return 'reactivó al proveedor';
    case 'ELIMINACION_PROVEEDOR':
      return 'eliminó al proveedor';
    case 'CREACION_REGISTRO':
      return `agregó «${log.newValue}» en ${log.section || 'un catálogo'}`;
    case 'ALTA_PROVEEDOR':
    case 'CREACION_EXPEDIENTE':
      return 'creó el expediente del proveedor';
    case 'PARAMETRIZACION_SISTEMA':
      return 'cambió la configuración del sistema';
    default:
      return `hizo un cambio: ${log.fieldChanged}`;
  }
};

/* ───────────────────────── Fechas ───────────────────────── */

/** "06/11/2026, 05:13:07 p. m." → fecha local a medianoche (o null si no se entiende). */
const parseDay = (formatted: string): Date | null => {
  const m = (formatted || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(d.getTime()) ? null : d;
};
const startOfToday = () => {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
};
const daysAgo = (d: Date) => Math.round((startOfToday().getTime() - d.getTime()) / 86400000);

const dayHeading = (d: Date | null, raw: string): { main: string; sub: string } => {
  if (!d) return { main: raw || 'Sin fecha', sub: '' };
  const full = d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const n = daysAgo(d);
  const pretty = full.charAt(0).toUpperCase() + full.slice(1);
  if (n === 0) return { main: 'Hoy', sub: pretty };
  if (n === 1) return { main: 'Ayer', sub: pretty };
  return { main: pretty, sub: '' };
};

/* ───────────────────────── Estilos compartidos ───────────────────────── */

const fieldCls =
  'w-full h-11 px-3.5 text-sm rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/10 text-[#0b1d3a] dark:text-white placeholder:text-[#6b84a3] focus:outline-none focus:border-[#2c84c4] focus:ring-2 focus:ring-[#2c84c4]/30';
const tileCls = 'rounded-2xl bg-black/[0.025] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/10 p-3.5';
const labelCls = 'text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2c84c4] dark:text-[#69bdd7]';
const filterLabelCls = 'block mb-1 text-[11px] font-semibold text-[#3a5274] dark:text-slate-400';

const PAGE = 30;

type Period = 'ALL' | 'TODAY' | '7' | '30';

/* ───────────────────────── Un valor (antes / ahora) ───────────────────────── */

const ValueText: React.FC<{ value: unknown; strong?: boolean }> = ({ value, strong }) => {
  const raw = String(value ?? '').trim();
  if (!raw) return <span className="italic text-[#6b84a3]">(vacío)</span>;
  if (isBig(raw)) {
    return (
      <details className="min-w-0">
        <summary className={`cursor-pointer ${strong ? 'font-semibold text-[#0b1d3a] dark:text-white' : 'text-[#3a5274] dark:text-slate-400'}`}>
          {summarizeBig(raw)} <span className="text-xs text-[#2c84c4] dark:text-[#69bdd7] underline">ver detalle</span>
        </summary>
        <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-black/[0.04] dark:bg-black/30 p-2 text-[11px] whitespace-pre-wrap break-all text-[#3a5274] dark:text-slate-300">{raw}</pre>
      </details>
    );
  }
  return <span className={`break-words min-w-0 ${strong ? 'font-semibold text-[#0b1d3a] dark:text-white' : 'text-[#3a5274] dark:text-slate-400'}`}>{humanize(raw)}</span>;
};

/* ───────────────────────── Pantalla ───────────────────────── */

export const AuditLogView: React.FC = () => {
  const { systemAuditLogs, openSupplierReview } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [personFilter, setPersonFilter] = useState<string>('ALL');
  const [period, setPeriod] = useState<Period>('ALL');
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => {
    setLimit(PAGE);
  }, [searchTerm, actionFilter, personFilter, period]);

  // Lo que se puede elegir en los filtros: solo lo que realmente existe en la bitácora
  const actionOptions = useMemo(() => {
    const counts = new Map<string, number>();
    systemAuditLogs.forEach((l) => counts.set(l.action, (counts.get(l.action) || 0) + 1));
    return Array.from(counts.entries())
      .map(([value, n]) => ({ value, n, label: ACTION_META[value]?.label || humanize(value) }))
      .sort((a, b) => b.n - a.n);
  }, [systemAuditLogs]);

  const people = useMemo(() => {
    const counts = new Map<string, number>();
    systemAuditLogs.forEach((l) => {
      const n = cleanName(l.user);
      counts.set(n, (counts.get(n) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [systemAuditLogs]);

  const filteredLogs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return systemAuditLogs.filter((log) => {
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
      if (personFilter !== 'ALL' && cleanName(log.user) !== personFilter) return false;
      if (period !== 'ALL') {
        const d = parseDay(log.formattedDate);
        if (!d) return false;
        const n = daysAgo(d);
        if (period === 'TODAY' && n !== 0) return false;
        if (period === '7' && n > 6) return false;
        if (period === '30' && n > 29) return false;
      }
      if (!term) return true;
      return [
        log.supplierName,
        log.supplierDoc,
        log.fileNumber,
        log.user,
        log.fieldChanged,
        log.section,
        log.justification,
        log.oldValue,
        log.newValue,
        describe(log),
        ACTION_META[log.action]?.label,
      ]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(term));
    });
  }, [systemAuditLogs, searchTerm, actionFilter, personFilter, period]);

  const visibleLogs = useMemo(() => filteredLogs.slice(0, limit), [filteredLogs, limit]);

  // Agrupa por día manteniendo el orden en que llegan (lo más nuevo primero)
  const groups = useMemo(() => {
    const map = new Map<string, { date: Date | null; raw: string; logs: SystemAuditEntry[] }>();
    visibleLogs.forEach((l) => {
      const raw = (l.formattedDate || '').split(',')[0].trim() || 'Sin fecha';
      if (!map.has(raw)) map.set(raw, { date: parseDay(l.formattedDate), raw, logs: [] });
      map.get(raw)!.logs.push(l);
    });
    return Array.from(map.values());
  }, [visibleLogs]);

  // Indicadores
  const stats = useMemo(() => {
    let today = 0;
    let week = 0;
    systemAuditLogs.forEach((l) => {
      const d = parseDay(l.formattedDate);
      if (!d) return;
      const n = daysAgo(d);
      if (n === 0) today++;
      if (n <= 6) week++;
    });
    return { today, week };
  }, [systemAuditLogs]);

  const kpis = [
    { label: 'Registros en total', value: systemAuditLogs.length, hint: 'Todo lo que ha pasado', icon: History },
    { label: 'Hoy', value: stats.today, hint: 'Movimientos de hoy', icon: Clock },
    { label: 'Últimos 7 días', value: stats.week, hint: 'Incluye hoy', icon: CalendarDays },
    { label: 'Personas', value: people.length, hint: 'Han hecho cambios', icon: Users },
  ];

  const hasFilters = Boolean(searchTerm) || actionFilter !== 'ALL' || personFilter !== 'ALL' || period !== 'ALL';
  const resetFilters = () => {
    setSearchTerm('');
    setActionFilter('ALL');
    setPersonFilter('ALL');
    setPeriod('ALL');
  };

  const handleExportCSV = () => {
    // Una celda que empieza con = + - @ se abriría como fórmula en Excel: se neutraliza
    const cell = (v: unknown) => {
      let s = String(v ?? '');
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const headers = [
      'Fecha y hora',
      'Quién',
      'Rol',
      'Tipo de evento',
      'Qué pasó',
      'Proveedor',
      'Radicado',
      'Identificación',
      'Dónde',
      'Dato',
      'Antes',
      'Ahora',
      'Motivo',
      'ID del registro',
    ];
    const rows = filteredLogs.map((log) =>
      [
        log.formattedDate,
        cleanName(log.user),
        roleLabel(log.userRole),
        ACTION_META[log.action]?.label || log.action,
        `${cleanName(log.user)} ${describe(log)}`,
        isSystemEntry(log) ? '' : log.supplierName,
        isSystemEntry(log) ? '' : log.fileNumber,
        isSystemEntry(log) ? '' : log.supplierDoc,
        log.section,
        log.fieldChanged,
        humanize(log.oldValue),
        humanize(log.newValue),
        log.justification || '',
        log.id,
      ]
        .map(cell)
        .join(',')
    );
    const blob = new Blob(['﻿' + [headers.map(cell).join(','), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Auditoria_Proveedores_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 pb-8 pt-1 space-y-5">
      <PageHeader
        icon={ShieldAlert}
        title="Auditoría y bitácora"
        subtitle="Quién cambió qué en el sistema, cuándo y por qué. Nada se borra de aquí."
        actions={
          <button type="button" className={heroPrimaryBtn} onClick={handleExportCSV}>
            <Download className="w-5 h-5" /> Descargar en Excel (CSV)
          </button>
        }
      />

      {/* Cómo leer */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#2c84c4]/25 bg-[#2c84c4]/[0.06] dark:bg-[#2c84c4]/10 px-4 py-3 text-sm text-[#3a5274] dark:text-slate-300">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-[#2c84c4] dark:text-[#69bdd7]" />
        <p className="leading-relaxed">
          <strong className="text-[#0b1d3a] dark:text-white">Cómo leerla:</strong> cada tarjeta es algo que alguien hizo. Arriba dice <em>quién</em> y <em>qué hizo</em>; abajo, <em>qué cambió</em> (antes → ahora) y <em>por qué</em>. Lo más reciente va primero.
        </p>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="fs-card lift rounded-[22px] p-4 sm:p-5 animate-fade-up">
              <div className="flex items-start justify-between gap-2">
                <span className={labelCls}>{k.label}</span>
                <span className="w-9 h-9 rounded-xl bg-gradient-action text-white grid place-items-center shrink-0 shadow-glow"><Icon className="w-4 h-4" /></span>
              </div>
              <div className="mt-3 font-display text-3xl font-semibold text-[#0b1d3a] dark:text-white tabular-nums">{k.value}</div>
              <div className="text-xs text-[#3a5274] dark:text-slate-400 mt-0.5">{k.hint}</div>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="fs-card rounded-[24px] p-4 sm:p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] gap-3">
          <label className="block">
            <span className={filterLabelCls}>Buscar</span>
            <span className="relative block">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#6b84a3]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Proveedor, NIT, radicado, persona…"
                className={`${fieldCls} pl-10`}
              />
            </span>
          </label>
          <label className="block">
            <span className={filterLabelCls}>Qué pasó</span>
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className={fieldCls}>
              <option value="ALL">Todo tipo de eventos</option>
              {actionOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label} ({o.n})</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={filterLabelCls}>Quién lo hizo</span>
            <select value={personFilter} onChange={(e) => setPersonFilter(e.target.value)} className={fieldCls}>
              <option value="ALL">Todas las personas</option>
              {people.map(([name, n]) => (
                <option key={name} value={name}>{name} ({n})</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={filterLabelCls}>Cuándo</span>
            <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className={fieldCls}>
              <option value="ALL">Todo el historial</option>
              <option value="TODAY">Solo hoy</option>
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#3a5274] dark:text-slate-400">
          <span>
            Mostrando <strong className="text-[#0b1d3a] dark:text-white">{visibleLogs.length}</strong> de <strong className="text-[#0b1d3a] dark:text-white">{filteredLogs.length}</strong>
            {hasFilters && <> (de {systemAuditLogs.length} en total)</>}
          </span>
          {hasFilters && (
            <button type="button" onClick={resetFilters} className="font-semibold text-[#2c84c4] dark:text-[#69bdd7] hover:underline cursor-pointer">
              Quitar filtros
            </button>
          )}
        </div>
      </div>

      {/* Línea de tiempo */}
      {filteredLogs.length === 0 ? (
        <div className="fs-card rounded-[24px] border-dashed p-12 text-center">
          <span className="mx-auto w-12 h-12 rounded-2xl bg-gradient-action text-white grid place-items-center shadow-glow"><History className="w-5 h-5" /></span>
          <p className="mt-4 font-display text-lg font-semibold text-[#0b1d3a] dark:text-white">
            {systemAuditLogs.length === 0 ? 'Todavía no hay movimientos' : 'Nada coincide con lo que buscas'}
          </p>
          <p className="mt-1 text-sm text-[#3a5274] dark:text-slate-400">
            {systemAuditLogs.length === 0
              ? 'Cuando alguien cambie un dato, un estado o un documento, aparecerá aquí.'
              : 'Prueba con otra palabra o quita algún filtro.'}
          </p>
          {hasFilters && (
            <button type="button" onClick={resetFilters} className="mt-4 h-10 px-4 rounded-xl bg-gradient-action text-white text-sm font-semibold cursor-pointer">
              Quitar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => {
            const head = dayHeading(g.date, g.raw);
            return (
              <section key={g.raw}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                  <span className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-gradient-action text-white text-xs font-semibold shadow-glow">
                    <Calendar className="w-3.5 h-3.5" /> {head.main}
                  </span>
                  {head.sub && <span className="text-xs text-[#3a5274] dark:text-slate-400">{head.sub}</span>}
                  <span className="flex-1 h-px min-w-6 bg-gradient-to-r from-[#2c84c4]/40 to-transparent" />
                  <span className="text-xs text-[#3a5274] dark:text-slate-400">{g.logs.length} {g.logs.length === 1 ? 'movimiento' : 'movimientos'}</span>
                </div>
                <ol className="relative space-y-3 pl-6 sm:pl-9">
                  <span aria-hidden="true" className="absolute left-[7px] sm:left-[10px] top-3 bottom-3 w-px bg-gradient-to-b from-[#2c84c4] via-[#69bdd7]/50 to-transparent" />
                  {g.logs.map((log) => {
                    const meta = ACTION_META[log.action] || { label: humanize(log.action), hint: '', icon: FileText };
                    const Icon = meta.icon;
                    const time = (log.formattedDate || '').split(',').slice(1).join(',').trim();
                    const system = isSystemEntry(log);
                    const showDiff = log.action === 'EDICION_CAMPO' || log.action === 'REVISION_DOCUMENTO' || log.action === 'CREACION_REGISTRO' || log.action === 'ASIGNACION_REVISOR';
                    return (
                      <li key={log.id} className="relative">
                        <span aria-hidden="true" className="absolute -left-6 sm:-left-9 top-6 w-[15px] h-[15px] sm:w-5 sm:h-5 rounded-full bg-gradient-action ring-4 ring-[#2c84c4]/15" />
                        <article className="fs-card lift rounded-[22px] p-4 sm:p-5 animate-fade-up">
                          <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
                            <span title={meta.hint} className="w-11 h-11 rounded-2xl bg-[#2c84c4]/10 dark:bg-[#2c84c4]/20 text-[#1d5fa8] dark:text-[#69bdd7] grid place-items-center shrink-0 border border-[#2c84c4]/20">
                              <Icon className="w-5 h-5" />
                            </span>
                            <div className="min-w-0 flex-1 basis-[260px]">
                              <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-[#2c84c4]/12 dark:bg-[#2c84c4]/25 text-[11px] font-semibold text-[#1d5fa8] dark:text-[#69bdd7]">{meta.label}</span>
                              <h3 className="mt-1.5 text-base leading-snug text-[#0b1d3a] dark:text-white break-words">
                                <strong className="font-display font-semibold">{cleanName(log.user)}</strong>{' '}
                                <span className="font-normal text-[#2a3f5f] dark:text-slate-200">{describe(log)}</span>
                              </h3>
                              {system ? (
                                <div className="mt-1.5 text-xs text-[#3a5274] dark:text-slate-400">
                                  Dónde: <span className="font-semibold text-[#0b1d3a] dark:text-slate-100">{log.section || log.supplierName}</span>
                                </div>
                              ) : (
                                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#3a5274] dark:text-slate-400">
                                  <Building2 className="w-3.5 h-3.5 text-[#2c84c4] dark:text-[#69bdd7]" />
                                  <span>Proveedor:</span>
                                  <span className="font-semibold text-[#0b1d3a] dark:text-slate-100 break-words">{log.supplierName}</span>
                                  {log.supplierDoc && <span className="font-mono">{log.supplierDoc}</span>}
                                  {log.fileNumber && <span className="font-mono rounded-md px-1.5 py-0.5 bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7]" title="Número de radicado">{log.fileNumber}</span>}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 sm:ml-auto">
                              <div className="text-right">
                                <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-[#0b1d3a] dark:text-slate-100"><Clock className="w-3.5 h-3.5 text-[#2c84c4] dark:text-[#69bdd7]" />{time}</div>
                                <div className="mt-0.5 text-[11px] text-[#3a5274] dark:text-slate-400">
                                  <span className={`px-1.5 h-5 inline-flex items-center rounded-md text-[10px] font-bold ${log.userRole === 'ADMIN' ? 'bg-gradient-action text-white' : 'bg-[#69bdd7]/25 text-[#0e6d8a] dark:text-[#69bdd7]'}`}>{roleLabel(log.userRole)}</span>
                                </div>
                              </div>
                              {!system && (
                                <button
                                  type="button"
                                  onClick={() => openSupplierReview(log.dossierId)}
                                  title="Abrir el expediente de este proveedor"
                                  className="h-10 px-4 rounded-xl bg-gradient-action text-white text-sm font-semibold inline-flex items-center gap-2 shadow-glow cursor-pointer hover:brightness-110 transition"
                                >
                                  <Eye className="w-4 h-4" /> Ver proveedor
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className={tileCls}>
                              <div className={`${labelCls} mb-2`}>Qué cambió</div>
                              {showDiff ? (
                                <div className="space-y-1.5 text-sm">
                                  {log.fieldChanged && log.action !== 'CREACION_REGISTRO' && (
                                    <div className="text-xs text-[#6b84a3]">{log.fieldChanged}</div>
                                  )}
                                  <div className="flex gap-2"><span className="w-12 shrink-0 text-xs text-[#6b84a3] pt-0.5">Antes</span><span className="min-w-0 line-through decoration-[#6b84a3]/50"><ValueText value={log.oldValue} /></span></div>
                                  <div className="flex gap-2"><span className="w-12 shrink-0 text-xs text-[#6b84a3] pt-0.5">Ahora</span><span className="min-w-0"><ValueText value={log.newValue} strong /></span></div>
                                </div>
                              ) : (
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                  <span className="px-2.5 min-h-7 py-1 inline-flex items-center rounded-lg bg-black/[0.05] dark:bg-white/10 text-[#3a5274] dark:text-slate-300 break-words">{humanize(log.oldValue) || '—'}</span>
                                  <ArrowRight className="w-4 h-4 text-[#2c84c4] dark:text-[#69bdd7] shrink-0" />
                                  <span className="px-2.5 min-h-7 py-1 inline-flex items-center rounded-lg bg-gradient-action text-white font-semibold break-words">{humanize(log.newValue) || '—'}</span>
                                </div>
                              )}
                            </div>
                            <div className={tileCls}>
                              <div className={`${labelCls} mb-2`}>Por qué</div>
                              <p className="flex gap-2 text-sm text-[#3a5274] dark:text-slate-300 leading-relaxed">
                                <Quote className="w-4 h-4 shrink-0 mt-0.5 text-[#69bdd7]" />
                                <span className="break-words min-w-0">{log.justification || 'No se escribió un motivo.'}</span>
                              </p>
                            </div>
                          </div>

                          <details className="group mt-3 text-[11px] text-[#6b84a3]">
                            <summary className="inline-flex cursor-pointer list-none items-center gap-1 hover:text-[#2c84c4] dark:hover:text-[#69bdd7]">
                              <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" /> Datos técnicos
                            </summary>
                            <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr] break-all">
                              <dt className="font-semibold">Sección</dt><dd>{log.section || '—'}</dd>
                              <dt className="font-semibold">Fecha exacta</dt><dd>{log.formattedDate}</dd>
                              <dt className="font-semibold">Hecho por</dt><dd>{log.user}</dd>
                              <dt className="font-semibold">Código del registro</dt><dd className="font-mono">{log.id}</dd>
                            </dl>
                          </details>
                        </article>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}

          {visibleLogs.length < filteredLogs.length && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setLimit((n) => n + PAGE)}
                className="h-11 px-6 rounded-xl bg-gradient-action text-white text-sm font-semibold shadow-glow cursor-pointer hover:brightness-110 transition"
              >
                Ver {Math.min(PAGE, filteredLogs.length - visibleLogs.length)} más · quedan {filteredLogs.length - visibleLogs.length}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
