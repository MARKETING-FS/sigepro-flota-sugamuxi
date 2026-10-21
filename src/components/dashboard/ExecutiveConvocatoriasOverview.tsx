import React from 'react';
import {
  Briefcase,
  DollarSign,
  Users,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Convocatoria } from '../../types';

interface ExecutiveConvocatoriasOverviewProps {
  convocatorias: Convocatoria[];
  onGoToConvocatorias?: () => void;
}

export const ExecutiveConvocatoriasOverview: React.FC<ExecutiveConvocatoriasOverviewProps> = ({
  convocatorias,
  onGoToConvocatorias,
}) => {
  const total = convocatorias.length;
  const openList = convocatorias.filter((c) => c.status === 'ABIERTA');
  const inEvalList = convocatorias.filter((c) => c.status === 'EN_EVALUACION');
  const awardedList = convocatorias.filter((c) => c.status === 'ADJUDICADA');
  const closedList = convocatorias.filter((c) => c.status === 'CERRADA');

  const totalProposals = convocatorias.reduce((acc, c) => acc + (c.postulaciones?.length || 0), 0);
  const totalBudgetCOP = convocatorias.reduce((acc, c) => acc + (c.budgetEstimateCOP || 0), 0);
  const avgProposalsPerTender = total > 0 ? (totalProposals / total).toFixed(1) : '0';

  const formatCOP = (val: number) => {
    return `$${val.toLocaleString('es-CO')} COP`;
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Banner & Summary Cards - Brand Colors: Dark Blue, Light Blue, Slate */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 tracking-wider">
              LICITACIONES ABIERTAS
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {openList.length}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Recepción de ofertas en curso
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 tracking-wider">
              EN COMITÉ DE EVALUACIÓN
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-cyan-300 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {inEvalList.length}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Ponderación técnica y económica
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 tracking-wider">
              OFERTAS RECIBIDAS
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {totalProposals}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Promedio de {avgProposalsPerTender} ofertas por proceso
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 tracking-wider">
              PRESUPUESTO TOTAL ESTIMADO
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-cyan-300 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono truncate">
              {formatCOP(totalBudgetCOP)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Bolsa contractual licitada 2026
            </span>
          </div>
        </div>

      </div>

      {/* List of Convocatorias */}
      <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Procesos de Contratación Pública en Vivo
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Licitaciones estructuradas para la flota vehicular y terminales de transporte
            </p>
          </div>
          <button
            onClick={onGoToConvocatorias}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Gestionar Convocatorias</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {convocatorias.map((c) => {
            const proposalCount = (c.postulaciones || []).length;
            const isOpen = c.status === 'ABIERTA';

            return (
              <div
                key={c.id}
                className="p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-extrabold text-blue-700 dark:text-cyan-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
                      {c.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        isOpen
                          ? 'bg-blue-900 text-white dark:bg-blue-950 dark:text-cyan-300 border-blue-700 dark:border-blue-600'
                          : c.status === 'EN_EVALUACION'
                          ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/60 dark:text-cyan-300 border-blue-200 dark:border-blue-700'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isOpen ? '● Abierta / Recibiendo Ofertas' : c.status}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {c.category}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {c.title}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                </div>

                <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 dark:border-slate-800">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 block">
                      Presupuesto Oficial
                    </span>
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                      {formatCOP(c.budgetEstimateCOP || 0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      {proposalCount} {proposalCount === 1 ? 'propuesta' : 'propuestas'}
                    </span>
                    <button
                      onClick={onGoToConvocatorias}
                      className="text-xs text-blue-600 dark:text-cyan-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver Pliego</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
