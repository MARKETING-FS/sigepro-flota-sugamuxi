import React from 'react';
import {
  AlertTriangle,
  Clock,
  ShieldCheck,
  AlertOctagon,
  Calendar,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { calculateDocumentExpiration } from '../../utils/contractValidity';

interface DocumentExpirationBadgeProps {
  expirationDate?: string;
  validityRule?: string;
  requiresExpirationDate?: boolean;
  showDetails?: boolean;
  className?: string;
}

export const DocumentExpirationBadge: React.FC<DocumentExpirationBadgeProps> = ({
  expirationDate,
  validityRule,
  requiresExpirationDate = false,
  showDetails = false,
  className = '',
}) => {
  const exp = calculateDocumentExpiration(expirationDate);

  if (exp.status === 'NO_APLICA') {
    if (!requiresExpirationDate && !validityRule) {
      return (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 ${className}`}
          title="Documento con vigencia permanente o sin fecha de expiración periódica"
        >
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>Vigencia Permanente</span>
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 ${className}`}
        title={validityRule || 'Regla SIG: Vigente'}
      >
        <Calendar className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
        <span>{validityRule || 'Regla SIG'}</span>
      </span>
    );
  }

  if (exp.status === 'VENCIDO') {
    return (
      <div className={`inline-flex flex-col ${className}`}>
        <span
          className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700 shadow-2xs animate-pulse"
          title={`ALERTA CRÍTICA SIG: Expiró el ${exp.formattedDate}. Hace ${exp.daysOverdue} días. Inhabilita al proveedor según normas del SIG.`}
        >
          <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>VENCIDO: {exp.label}</span>
        </span>
        {showDetails && (
          <span className="text-[9px] text-rose-600 dark:text-rose-400 mt-0.5 font-medium">
            Expiró el {exp.formattedDate} &bull; Inhabilita operaciones SIG
          </span>
        )}
      </div>
    );
  }

  if (exp.status === 'POR_VENCER') {
    return (
      <div className={`inline-flex flex-col ${className}`}>
        <span
          className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shadow-2xs"
          title={`ALERTA PREVENTIVA SIG: Vence el ${exp.formattedDate} (${exp.daysRemaining} días restantes). Requiere renovación oportuna.`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 animate-spin-slow" />
          <span>POR VENCER: {exp.label}</span>
        </span>
        {showDetails && (
          <span className="text-[9px] text-amber-700 dark:text-amber-400 mt-0.5 font-medium">
            Vence el {exp.formattedDate} &bull; Renovar oportunamente
          </span>
        )}
      </div>
    );
  }

  // VIGENTE (> 30 días)
  return (
    <div className={`inline-flex flex-col ${className}`}>
      <span
        className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
        title={`Vigente hasta el ${exp.formattedDate} (${exp.daysRemaining} días restantes)`}
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>Vigente: {exp.formattedDate}</span>
      </span>
      {showDetails && (
        <span className="text-[9px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-medium">
          {exp.daysRemaining} días restantes de vigencia
        </span>
      )}
    </div>
  );
};
