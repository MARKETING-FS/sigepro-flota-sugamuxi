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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SystemAuditEntry } from '../types';
import { FlotaSugamuxiLogo } from './FlotaSugamuxiLogo';

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

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'EDICION_CAMPO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700">
            <FileText className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
            <span>Edición de Campo</span>
          </span>
        );
      case 'CAMBIO_ESTADO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
            <Activity className="w-3 h-3 text-slate-700 dark:text-cyan-400" />
            <span>Cambio de Estado</span>
          </span>
        );
      case 'VALIDACION_SARLAFT':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-cyan-200 border border-blue-300 dark:border-blue-700">
            <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
            <span>Debida Diligencia SARLAFT</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <span>{action}</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4">
      {/* 1. Header Banner Estandarizado Claro */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 text-slate-900 border border-slate-200 shadow-xs relative overflow-hidden dark:bg-[#0b1329] dark:text-white dark:border-blue-900/60">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1 w-full">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 p-1.5 dark:bg-slate-900/80 dark:border-blue-800 shadow-2xs">
              <ShieldAlert className="w-5 h-5 text-blue-700 dark:text-cyan-400" />
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 rounded-full text-blue-800 font-bold text-[10px] flex items-center gap-1.5 font-mono dark:bg-blue-500/20 dark:border-blue-400/40 dark:text-cyan-300">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-300" />
                  <span>CONTROL INTERNO & AUDITORÍA SIG</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  Trazabilidad Oficial Inmutable
                </span>
              </div>
              <h1 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                Auditoría y Bitácora de Trazabilidad
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                Registro inmutable de intervenciones, modificaciones a campos, cambios de estados y consultas SARLAFT para <strong>Flota Sugamuxi S.A.</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full xl:w-auto shrink-0 pt-2.5 xl:pt-0 border-t xl:border-t-0 border-slate-100 dark:border-slate-800/80">
            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer border border-blue-600"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Descargar CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#0f172a] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Registros</span>
            <History className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{systemAuditLogs.length}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">En bitácora del sistema</div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Edición de Campos</span>
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-700 dark:text-cyan-400">{totalEdits}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Datos editados directamente</div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Cambios de Estado</span>
            <Activity className="w-4 h-4 text-slate-700 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalStatusChanges}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Habilitaciones y revisiones</div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Validaciones SARLAFT</span>
            <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-700 dark:text-cyan-400">{totalSarlaft}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Consultas de listas</div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Por Rol Editor</span>
            <UserCheck className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
          </div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Admin:</span>
              <span className="text-blue-600 dark:text-cyan-400 font-mono">{adminEdits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Revisores:</span>
              <span className="text-blue-700 dark:text-cyan-300 font-mono">{revisorEdits}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filters & Search Bar */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por proveedor, NIT, radicado, campo o usuario..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todas las acciones registradas</option>
              <option value="EDICION_CAMPO">Ediciones de Campo</option>
              <option value="CAMBIO_ESTADO">Cambios de Estado General</option>
              <option value="VALIDACION_SARLAFT">Consultas SARLAFT / Listas</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos los roles de usuario</option>
              <option value="ADMIN">Administrador General</option>
              <option value="REVISOR">Revisor Técnico</option>
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todas las secciones del expediente</option>
              {uniqueSections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Counter and reset */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>
            Mostrando <strong>{filteredLogs.length}</strong> de <strong>{systemAuditLogs.length}</strong> eventos de auditoría.
          </span>
          {(searchTerm || actionFilter !== 'ALL' || roleFilter !== 'ALL' || sectionFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setActionFilter('ALL');
                setRoleFilter('ALL');
                setSectionFilter('ALL');
              }}
              className="text-blue-600 dark:text-cyan-400 hover:underline font-bold cursor-pointer"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* 4. Audit Log Table */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="sm:hidden px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] text-blue-900 dark:text-cyan-300 flex items-center justify-between font-medium">
          <span>Desliza horizontalmente para ver todos los campos</span>
          <span className="font-bold">↔</span>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800 min-w-[850px] lg:min-w-full">
            <thead className="bg-[#0b1329] text-white select-none">
              <tr>
                <th className="px-3 py-3 font-bold uppercase tracking-wider text-[10px] w-[12%]">Fecha & Hora</th>
                <th className="px-3 py-3 font-bold uppercase tracking-wider text-[10px] w-[18%]">Expediente & Proveedor</th>
                <th className="px-3 py-3 font-bold uppercase tracking-wider text-[10px] w-[13%]">Usuario & Rol</th>
                <th className="px-3 py-3 font-bold uppercase tracking-wider text-[10px] w-[14%]">Acción / Sección</th>
                <th className="px-3 py-3 font-bold uppercase tracking-wider text-[10px] w-[20%]">Campo / Modificación</th>
                <th className="px-3 py-3 font-bold uppercase tracking-wider text-[10px] w-[15%]">Justificación</th>
                <th className="px-3 py-3 font-bold uppercase tracking-wider text-[10px] text-right w-[8%]">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-[#0f172a]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No se encontraron registros de auditoría que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                    {/* 1. Date */}
                    <td className="px-3 py-2.5 align-top">
                      <div className="font-mono font-semibold text-slate-900 dark:text-slate-200 text-[11px]">
                        {log.formattedDate}
                      </div>
                      <div className="text-[9.5px] text-slate-400 font-mono mt-0.5 break-all">{log.id.split('-').slice(0, 3).join('-')}</div>
                    </td>

                    {/* 2. Dossier / Supplier */}
                    <td className="px-3 py-2.5 align-top">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-xs leading-snug break-words">
                        {log.supplierName}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[10.5px] text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="font-mono text-blue-700 dark:text-cyan-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-1 py-0.2 rounded border border-blue-200 dark:border-blue-800">
                          {log.fileNumber}
                        </span>
                        <span className="font-mono text-slate-500">{log.supplierDoc}</span>
                      </div>
                    </td>

                    {/* 3. User & Role */}
                    <td className="px-3 py-2.5 align-top">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] break-words">{log.user}</div>
                      <div className="mt-0.5">
                        <span
                          className={`inline-block text-[8.5px] font-bold px-1.5 py-0.2 rounded ${
                            log.userRole === 'ADMIN'
                              ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                              : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {log.userRole === 'ADMIN' ? 'ADMIN' : 'REVISOR'}
                        </span>
                      </div>
                    </td>

                    {/* 4. Action & Section */}
                    <td className="px-3 py-2.5 align-top">
                      <div>{getActionBadge(log.action)}</div>
                      {log.section && (
                        <div className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-snug break-words">
                          {log.section}
                        </div>
                      )}
                    </td>

                    {/* 5. Field & Change Details (Before vs After) */}
                    <td className="px-3 py-2.5 align-top">
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px] mb-1 break-words">
                        {log.fieldChanged}
                      </div>

                      {log.action === 'EDICION_CAMPO' ? (
                        <div className="text-[10.5px] space-y-0.5 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                          <div className="text-slate-500 dark:text-slate-400 line-through break-words" title={`Antes: ${log.oldValue}`}>
                            <span className="font-semibold text-[8.5px] text-slate-400 mr-1">Antes:</span>
                            {log.oldValue || '(Vacío)'}
                          </div>
                          <div className="text-blue-700 dark:text-cyan-400 font-medium break-words" title={`Ahora: ${log.newValue}`}>
                            <span className="font-semibold text-[8.5px] text-slate-400 mr-1">Ahora:</span>
                            {log.newValue || '(Vacío)'}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10.5px] font-mono text-slate-700 dark:text-slate-300 break-words">
                          {log.oldValue} &rarr; <strong className="text-blue-600 dark:text-cyan-400">{log.newValue}</strong>
                        </div>
                      )}
                    </td>

                    {/* 6. Justification */}
                    <td className="px-3 py-2.5 align-top">
                      <p className="text-slate-600 dark:text-slate-400 italic text-[10.5px] leading-relaxed break-words bg-slate-50/60 dark:bg-slate-900/40 p-1.5 rounded border border-slate-100 dark:border-slate-800" title={log.justification}>
                        "{log.justification || 'Sin justificación registrada.'}"
                      </p>
                    </td>

                    {/* 7. Action: Go to Dossier */}
                    <td className="px-3 py-2.5 text-right align-top">
                      {log.dossierId && (
                        <button
                          type="button"
                          onClick={() => openSupplierReview(log.dossierId)}
                          className="px-2 py-1 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-cyan-300 font-bold rounded-lg text-[11px] border border-blue-200 dark:border-blue-800 inline-flex items-center gap-1 cursor-pointer transition-colors"
                          title="Abrir expediente de este proveedor"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
