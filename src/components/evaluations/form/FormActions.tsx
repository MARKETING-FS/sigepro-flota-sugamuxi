import React from 'react';
import { CheckCircle2, Info } from 'lucide-react';

interface FormActionsProps {
  canSubmit: boolean;
  /** Por qué todavía no se puede registrar (se muestra solo si no se puede) */
  blockedReason?: string;
  onClose: () => void;
  /** Muestra el texto largo sobre el expediente (solo en la columna de escritorio) */
  showNote?: boolean;
}

export const FormActions: React.FC<FormActionsProps> = ({ canSubmit, blockedReason, onClose, showNote }) => (
  <div className="space-y-3">
    {!canSubmit && blockedReason && (
      <p className="text-xs text-[#3a5274] dark:text-slate-300 flex items-start gap-1.5" role="status">
        <Info className="w-4 h-4 text-[#2c84c4] dark:text-[#69bdd7] shrink-0" />
        {blockedReason}
      </p>
    )}
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onClose}
        className="h-11 px-4 rounded-xl border border-[#2c84c4]/35 text-[#1d5fa8] dark:text-[#69bdd7] hover:bg-[#2c84c4]/10 text-sm font-semibold transition-colors cursor-pointer"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={!canSubmit}
        className="flex-1 h-11 px-5 rounded-xl bg-gradient-action text-white text-sm font-semibold shadow-glow hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer inline-flex items-center justify-center gap-2"
      >
        <CheckCircle2 className="w-4 h-4" />
        Registrar calificación
      </button>
    </div>
    {showNote && (
      <p className="text-[11.5px] leading-relaxed text-[#5d7392] dark:text-slate-400">
        Queda en el expediente oficial del proveedor y en la bitácora de trazabilidad del SIG.
      </p>
    )}
  </div>
);
