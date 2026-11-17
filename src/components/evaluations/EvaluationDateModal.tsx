import React, { useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { primaryBtn, secondaryBtn } from '../ui/archive';
import { parseLocalDate } from '../../utils/dateOnly';

interface EvaluationDateModalProps {
  title: string;
  subtitle?: string;
  label: string;
  hint: string;
  /** Fecha inicial (AAAA-MM-DD o dd/mm/aaaa); si no hay, hoy */
  initialValue?: string | Date;
  /** La fecha anual puede ser futura; la de una evaluación ya hecha no */
  allowFuture?: boolean;
  /** Si se pasa, aparece el botón para volver al cálculo automático */
  onReset?: () => void;
  resetLabel?: string;
  onSave: (isoDate: string) => { success: boolean; message: string } | void;
  onClose: () => void;
}

const localIso = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Ventana para cambiar una fecha de evaluación (la de una evaluación hecha o la fecha anual de un proveedor). */
export const EvaluationDateModal: React.FC<EvaluationDateModalProps> = ({
  title,
  subtitle,
  label,
  hint,
  initialValue,
  allowFuture,
  onReset,
  resetLabel,
  onSave,
  onClose,
}) => {
  const [value, setValue] = useState(() => {
    const d = parseLocalDate(initialValue);
    return d ? localIso(d) : localIso();
  });
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) {
      setError('Elija una fecha.');
      return;
    }
    const res = onSave(value);
    if (res && res.success === false) {
      setError(res.message);
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1d3a]/70 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#0f1a30] rounded-2xl w-full max-w-md border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="px-5 py-4 flex items-start justify-between gap-3 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-gradient-action text-white grid place-items-center shrink-0">
              <CalendarDays className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-[#0b1d3a] dark:text-white">{title}</p>
              {subtitle && <p className="text-xs text-[#5d7392] dark:text-slate-400 truncate">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-9 h-9 rounded-xl grid place-items-center text-[#3a5274] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-3">
          <label htmlFor="eval-date-edit" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2c84c4] dark:text-[#69bdd7] block">
            {label}
          </label>
          <input
            id="eval-date-edit"
            type="date"
            value={value}
            max={allowFuture ? undefined : localIso()}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            autoFocus
            required
            className="w-full h-11 px-3.5 text-sm rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/10 text-[#0b1d3a] dark:text-white focus:outline-none focus:border-[#2c84c4] focus:ring-2 focus:ring-[#2c84c4]/30"
          />
          <p className="text-xs text-[#5d7392] dark:text-slate-400 leading-relaxed">{hint}</p>
          {error && <p className="text-xs font-semibold text-red-600 dark:text-red-300">{error}</p>}
        </div>

        <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-2 border-t border-black/10 dark:border-white/10">
          {onReset ? (
            <button
              type="button"
              onClick={() => {
                onReset();
                onClose();
              }}
              className="text-xs font-semibold text-[#2c84c4] hover:underline cursor-pointer"
            >
              {resetLabel || 'Volver al cálculo automático'}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={`${secondaryBtn} h-10 px-4`}>
              Cancelar
            </button>
            <button type="submit" className={`${primaryBtn} h-10 px-5`}>
              Guardar fecha
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
