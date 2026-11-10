import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Building2,
  FileText,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  History,
  Activity,
  UserCheck,
  FileSpreadsheet,
  Quote,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SystemAuditEntry } from '../types';
import { FlotaSugamuxiLogo } from './FlotaSugamuxiLogo';
import { PageHeader, heroPrimaryBtn, heroSecondaryBtn } from './ui/archive';

export const AuditLogView: React.FC = () => {
  const { systemAuditLogs, role, openSupplierReview } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return systemAuditLogs.filter((log) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        log.supplierName.toLowerCase().includes(term) ||
        log.supplierDoc.toLowerCase().includes(term) ||
        log.fileNumber.toLowerCase().includes(term) ||
        log.user.toLowerCase().includes(term) ||
        log.fieldChanged.toLowerCase().includes(term) ||
        (log.justification || '').toLowerCase().includes(term) ||
        (log.oldValue || '').toLowerCase().includes(term) ||
        (log.newValue || '').toLowerCase().includes(term);

      const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
      const matchesRole = roleFilter === 'ALL' || log.userRole === roleFilter;
      const matchesSection = sectionFilter === 'ALL' || log.section === sectionFilter;

      return matchesSearch && matchesAction && matchesRole && matchesSection;
    });
  }, [systemAuditLogs, searchTerm, actionFilter, roleFilter, sectionFilter]);

  // Unique sections for filter
  const uniqueSections = useMemo(() => {
    const set = new Set<string>();
    systemAuditLogs.forEach((l) => {
      if (l.section) set.add(l.section);
    });
    return Array.from(set);
  }, [systemAuditLogs]);

  // Metrics
  const totalEdits = systemAuditLogs.filter((l) => l.action === 'EDICION_CAMPO').length;
  const totalStatusChanges = systemAuditLogs.filter((l) => l.action === 'CAMBIO_ESTADO').length;
  const totalSarlaft = systemAuditLogs.filter((l) => l.action === 'VALIDACION_SARLAFT').length;
  const adminEdits = systemAuditLogs.filter((l) => l.userRole === 'ADMIN').length;
  const revisorEdits = systemAuditLogs.filter((l) => l.userRole === 'REVISOR').length;

  const handleExportCSV = () => {
    const headers = [
      'ID Auditoria',
      'Fecha y Hora',
      'Radicado',
      'Proveedor / Razon Social',
      'Identificacion',
      'Usuario Editor',
      'Rol Editor',
      'Tipo Accion',
      'Modulo / Seccion',
      'Campo Modificado',
      'Valor Anterior',
      'Valor Nuevo',
      'Justificacion',
    ];

    const rows = filteredLogs.map((log) => [
      `"${log.id}"`,
      `"${log.formattedDate}"`,
      `"${log.fileNumber}"`,
      `"${log.supplierName.replace(/"/g, '""')}"`,
      `"${log.supplierDoc}"`,
      `"${log.user.replace(/"/g, '""')}"`,
      `"${log.userRole}"`,
      `"${log.action}"`,
      `"${(log.section || '').replace(/"/g, '""')}"`,
      `"${log.fieldChanged.replace(/"/g, '""')}"`,
      `"${String(log.oldValue ?? '').replace(/"/g, '""')}"`,
      `"${String(log.newValue ?? '').replace(/"/g, '""')}"`,
      `"${(log.justification || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Auditoria_General_Proveedores_Flota_Sugamuxi_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ACTION_META: Record<string, { label: string; icon: React.ElementType }> = {
    EDICION_CAMPO: { label: 'Edición de campo', icon: FileText },
    CAMBIO_ESTADO: { label: 'Cambio de estado', icon: Activity },
    VALIDACION_SARLAFT: { label: 'Consulta SARLAFT', icon: ShieldCheck },
  };

  // Agrupa los eventos por día (la fecha viene como "06/11/2026, 05:13:07 p. m.")
  const groups = useMemo(() => {
    const map = new Map<string, SystemAuditEntry[]>();
    filteredLogs.forEach((l) => {
      const day = (l.formattedDate || '').split(',')[0].trim() || 'Sin fecha';
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(l);
    });
    return Array.from(map.entries());
  }, [filteredLogs]);

  const hasFilters = Boolean(searchTerm) || actionFilter !== 'ALL' || roleFilter !== 'ALL' || sectionFilter !== 'ALL';
  const fieldCls =
    'w-full h-11 px-3.5 text-sm rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/10 text-[#0b1d3a] dark:text-white placeholder:text-[#6b84a3] focus:outline-none focus:border-[#2c84c4] focus:ring-2 focus:ring-[#2c84c4]/30';
  const tileCls = 'rounded-2xl bg-black/[0.025] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/10 p-3.5';
  const labelCls = 'text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2c84c4] dark:text-[#69bdd7]';

  const kpis = [
    { label: 'Total de registros', value: systemAuditLogs.length, hint: 'En la bitácora', icon: History },
    { label: 'Ediciones de campo', value: totalEdits, hint: 'Datos modificados', icon: FileText },
    { label: 'Cambios de estado', value: totalStatusChanges, hint: 'Habilitaciones y revisiones', icon: Activity },
    { label: 'Consultas SARLAFT', value: totalSarlaft, hint: 'Listas restrictivas', icon: ShieldCheck },
  ];

  return (
    <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 pb-8 pt-1 space-y-5">
      <PageHeader
        icon={ShieldAlert}
        title="Auditoría y bitácora"
        subtitle="Registro inmutable de intervenciones, cambios de estado y consultas SARLAFT"
        actions={
          <button type="button" className={heroPrimaryBtn} onClick={handleExportCSV}>
            <Download className="w-5 h-5" /> Descargar CSV
          </button>
        }
      />

      {/* Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
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
        <div className="fs-card lift rounded-[22px] p-4 sm:p-5 col-span-2 lg:col-span-1 animate-fade-up">
          <div className="flex items-start justify-between gap-2">
            <span className={labelCls}>Por rol</span>
            <span className="w-9 h-9 rounded-xl bg-gradient-action text-white grid place-items-center shrink-0 shadow-glow"><UserCheck className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex items-center justify-between"><span className="text-[#3a5274] dark:text-slate-400">Administrador</span><span className="font-display font-semibold text-[#0b1d3a] dark:text-white tabular-nums">{adminEdits}</span></div>
            <div className="flex items-center justify-between"><span className="text-[#3a5274] dark:text-slate-400">Revisores</span><span className="font-display font-semibold text-[#0b1d3a] dark:text-white tabular-nums">{revisorEdits}</span></div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="fs-card rounded-[24px] p-4 sm:p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#6b84a3]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar proveedor, NIT, radicado, campo o usuario"
              className={`${fieldCls} pl-10`}
            />
          </div>
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className={fieldCls}>
            <option value="ALL">Todas las acciones</option>
            <option value="EDICION_CAMPO">Ediciones de campo</option>
            <option value="CAMBIO_ESTADO">Cambios de estado</option>
            <option value="VALIDACION_SARLAFT">Consultas SARLAFT</option>
          </select>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={fieldCls}>
            <option value="ALL">Todos los roles</option>
            <option value="ADMIN">Administrador general</option>
            <option value="REVISOR">Revisor técnico</option>
          </select>
          <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className={fieldCls}>
            <option value="ALL">Todas las secciones</option>
            {uniqueSections.map((sec) => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between text-xs text-[#3a5274] dark:text-slate-400">
          <span>
            Mostrando <strong className="text-[#0b1d3a] dark:text-white">{filteredLogs.length}</strong> de <strong className="text-[#0b1d3a] dark:text-white">{systemAuditLogs.length}</strong> eventos
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setSearchTerm(''); setActionFilter('ALL'); setRoleFilter('ALL'); setSectionFilter('ALL'); }}
              className="font-semibold text-[#2c84c4] dark:text-[#69bdd7] hover:underline cursor-pointer"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Línea de tiempo */}
      {filteredLogs.length === 0 ? (
        <div className="fs-card rounded-[24px] border-dashed p-12 text-center">
          <span className="mx-auto w-12 h-12 rounded-2xl bg-gradient-action text-white grid place-items-center shadow-glow"><History className="w-5 h-5" /></span>
          <p className="mt-4 font-display text-lg font-semibold text-[#0b1d3a] dark:text-white">Sin registros para mostrar</p>
          <p className="mt-1 text-sm text-[#3a5274] dark:text-slate-400">No hay eventos de auditoría que coincidan con los filtros aplicados.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([day, logs]) => (
            <section key={day}>
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-2 h-8 px-3.5 rounded-full bg-gradient-action text-white text-xs font-semibold shadow-glow">
                  <Calendar className="w-3.5 h-3.5" /> {day}
                </span>
                <span className="flex-1 h-px bg-gradient-to-r from-[#2c84c4]/40 to-transparent" />
                <span className="text-xs text-[#3a5274] dark:text-slate-400">{logs.length} {logs.length === 1 ? 'evento' : 'eventos'}</span>
              </div>
              <ol className="relative space-y-3 pl-6 sm:pl-9">
                <span aria-hidden="true" className="absolute left-[7px] sm:left-[10px] top-3 bottom-3 w-px bg-gradient-to-b from-[#2c84c4] via-[#69bdd7]/50 to-transparent" />
                {logs.map((log) => {
                  const meta = ACTION_META[log.action] || { label: log.action, icon: FileText };
                  const Icon = meta.icon;
                  const time = (log.formattedDate || '').split(',').slice(1).join(',').trim();
                  const isEdit = log.action === 'EDICION_CAMPO';
                  return (
                    <li key={log.id} className="relative">
                      <span aria-hidden="true" className="absolute -left-6 sm:-left-9 top-6 w-[15px] h-[15px] sm:w-5 sm:h-5 rounded-full bg-gradient-action ring-4 ring-[#2c84c4]/15" />
                      <article className="fs-card lift rounded-[22px] p-4 sm:p-5 animate-fade-up">
                        <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
                          <span className="w-11 h-11 rounded-2xl bg-[#2c84c4]/10 dark:bg-[#2c84c4]/20 text-[#1d5fa8] dark:text-[#69bdd7] grid place-items-center shrink-0 border border-[#2c84c4]/20">
                            <Icon className="w-5 h-5" />
                          </span>
                          <div className="min-w-0 flex-1 basis-[260px]">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center h-6 px-2.5 rounded-full bg-[#2c84c4]/12 dark:bg-[#2c84c4]/25 text-[11px] font-semibold text-[#1d5fa8] dark:text-[#69bdd7]">{meta.label}</span>
                              {log.section && <span className="text-xs text-[#3a5274] dark:text-slate-400">{log.section}</span>}
                            </div>
                            <h3 className="mt-1.5 font-display text-base font-semibold text-[#0b1d3a] dark:text-white break-words">{log.fieldChanged}</h3>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#3a5274] dark:text-slate-400">
                              <Building2 className="w-3.5 h-3.5 text-[#2c84c4] dark:text-[#69bdd7]" />
                              <span className="font-semibold text-[#0b1d3a] dark:text-slate-100 break-words">{log.supplierName}</span>
                              <span className="font-mono rounded-md px-1.5 py-0.5 bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7]">{log.fileNumber}</span>
                              <span className="font-mono">{log.supplierDoc}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 sm:ml-auto">
                            <div className="text-right">
                              <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-[#0b1d3a] dark:text-slate-100"><Clock className="w-3.5 h-3.5 text-[#2c84c4] dark:text-[#69bdd7]" />{time}</div>
                              <div className="mt-0.5 flex items-center justify-end gap-1.5 text-xs text-[#3a5274] dark:text-slate-400">
                                <span className="truncate max-w-[200px]">{log.user}</span>
                                <span className={`px-1.5 h-5 inline-flex items-center rounded-md text-[10px] font-bold ${log.userRole === 'ADMIN' ? 'bg-gradient-action text-white' : 'bg-[#69bdd7]/25 text-[#0e6d8a] dark:text-[#69bdd7]'}`}>{log.userRole === 'ADMIN' ? 'ADMIN' : 'REVISOR'}</span>
                              </div>
                            </div>
                            {log.dossierId && (
                              <button
                                type="button"
                                onClick={() => openSupplierReview(log.dossierId)}
                                title="Abrir expediente de este proveedor"
                                className="h-10 px-4 rounded-xl bg-gradient-action text-white text-sm font-semibold inline-flex items-center gap-2 shadow-glow cursor-pointer hover:brightness-110 transition"
                              >
                                <Eye className="w-4 h-4" /> Ver
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className={tileCls}>
                            <div className={`${labelCls} mb-2`}>{isEdit ? 'Antes y ahora' : 'Transición'}</div>
                            {isEdit ? (
                              <div className="space-y-1.5 text-sm">
                                <div className="flex gap-2"><span className="w-12 shrink-0 text-xs text-[#6b84a3] pt-0.5">Antes</span><span className="text-[#3a5274] dark:text-slate-400 line-through break-words min-w-0">{log.oldValue || '(vacío)'}</span></div>
                                <div className="flex gap-2"><span className="w-12 shrink-0 text-xs text-[#6b84a3] pt-0.5">Ahora</span><span className="font-semibold text-[#0b1d3a] dark:text-white break-words min-w-0">{log.newValue || '(vacío)'}</span></div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="px-2.5 min-h-7 py-1 inline-flex items-center rounded-lg bg-black/[0.05] dark:bg-white/10 text-[#3a5274] dark:text-slate-300 break-words">{String(log.oldValue ?? '—')}</span>
                                <ArrowRight className="w-4 h-4 text-[#2c84c4] dark:text-[#69bdd7] shrink-0" />
                                <span className="px-2.5 min-h-7 py-1 inline-flex items-center rounded-lg bg-gradient-action text-white font-semibold break-words">{String(log.newValue ?? '—')}</span>
                              </div>
                            )}
                          </div>
                          <div className={tileCls}>
                            <div className={`${labelCls} mb-2`}>Justificación</div>
                            <p className="flex gap-2 text-sm text-[#3a5274] dark:text-slate-300 leading-relaxed">
                              <Quote className="w-4 h-4 shrink-0 mt-0.5 text-[#69bdd7]" />
                              <span className="break-words min-w-0">{log.justification || 'Sin justificación registrada.'}</span>
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 font-mono text-[10px] text-[#6b84a3] break-all">{log.id}</div>
                      </article>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
