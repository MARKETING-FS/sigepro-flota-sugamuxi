import React, { useState } from 'react';
import {
  FileText,
  Clock,
  User,
  ShieldCheck,
  Award,
  Layers,
  ChevronRight,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react';
import { SystemAuditEntry } from '../../types';

interface ExecutiveAuditFeedProps {
  auditLogs: SystemAuditEntry[];
  onGoToExcelReports?: () => void;
}

export const ExecutiveAuditFeed: React.FC<ExecutiveAuditFeedProps> = ({
  auditLogs,
  onGoToExcelReports,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = (auditLogs || []).filter((log) => {
    const query = searchTerm.toLowerCase();
    const matchesQuery =
      !query ||
      (log.supplierName || '').toLowerCase().includes(query) ||
      (log.user || '').toLowerCase().includes(query) ||
      (log.fieldChanged || '').toLowerCase().includes(query) ||
      (log.justification || '').toLowerCase().includes(query);

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesQuery && matchesAction;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'APROBACION_ESTADO':
      case 'APROBACION_DOCUMENTO':
        return (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md bg-blue-900 text-white dark:bg-blue-950 dark:text-cyan-300 border border-blue-700 dark:border-blue-600">
            Aprobación
          </span>
        );
      case 'EDICION_CAMPO':
      case 'MODIFICACION_DATOS':
        return (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
            Ajuste Datos
          </span>
        );
      case 'REASIGNACION_REVISOR':
        return (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
            Reasignación
          </span>
        );
      case 'EVALUACION_DESEMPENO':
        return (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-cyan-200 border border-blue-300 dark:border-blue-700">
            Evaluación
          </span>
        );
      case 'SOLICITUD_CORRECCION':
        return (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            Corrección
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {action.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Bitácora de Trazabilidad y Auditoría ISO 9001
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registro inmutable de intervenciones del comité, justificaciones de cambios y aprobaciones
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onGoToExcelReports && (
            <button
              onClick={onGoToExcelReports}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <span>Descargar Libro Auditoría</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por proveedor, usuario o motivo..."
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#121c38] rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-white dark:bg-[#121c38] rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
          >
            <option value="ALL">Todas las Acciones</option>
            <option value="EDICION_CAMPO">Edición de Campo</option>
            <option value="REASIGNACION_REVISOR">Reasignación de Revisor</option>
            <option value="APROBACION_ESTADO">Aprobación de Estado</option>
            <option value="EVALUACION_DESEMPENO">Evaluación Desempeño</option>
          </select>
          <span className="text-xs text-slate-400 font-mono">
            {filteredLogs.length} eventos
          </span>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No se registraron eventos con los criterios seleccionados.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {getActionBadge(log.action)}
                  <span className="font-bold text-slate-900 dark:text-white">
                    {log.supplierName || 'Proveedor'}
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    ({log.fileNumber || log.supplierDoc || 'S/R'})
                  </span>
                </div>

                <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                  <strong>Modificación:</strong> {log.section || 'General'} &bull; Campo: <em>{log.fieldChanged || 'Registro'}</em>
                  {log.oldValue && log.newValue && (
                    <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                      «{log.oldValue}» &rarr; «{log.newValue}»
                    </span>
                  )}
                </div>

                {log.justification && (
                  <div className="p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-cyan-300 mt-1">
                    <strong>Motivo/Justificación:</strong> {log.justification}
                  </div>
                )}
              </div>

              <div className="text-right shrink-0 text-[11px] text-slate-400 flex flex-row md:flex-col justify-between items-center md:items-end gap-1">
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {log.user}
                </span>
                <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {log.formattedDate || new Date(log.timestamp).toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
