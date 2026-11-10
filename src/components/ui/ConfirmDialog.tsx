import React, { useCallback, useState } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export interface ConfirmOptions {
  title: string;
  message: string;
  /** Aviso sobre cómo volver a activarlo */
  hint?: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

/** Ventana de confirmación con el estilo del diseño nuevo. */
export const ConfirmDialog: React.FC<{ options: ConfirmOptions | null; onClose: () => void }> = ({ options, onClose }) => {
  if (!options) return null;
  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="fs-card rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <span className="flex w-12 h-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2c84c4] to-[#69bdd7] text-white shadow-[0_8px_20px_-8px_rgba(105,189,215,0.7)]">
              <AlertTriangle className="w-6 h-6" />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-semibold text-[#0b1d3a] dark:text-white leading-tight">{options.title}</h3>
              <p className="mt-1.5 text-sm text-[#3a5274] dark:text-slate-300 leading-relaxed">{options.message}</p>
            </div>
          </div>
          {options.hint && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#2c84c4]/25 bg-[#2c84c4]/10 px-3.5 py-3 text-[13px] text-[#1d5fa8] dark:text-[#69bdd7]">
              <RotateCcw className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{options.hint}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-xl border border-[#d9e3ef] dark:border-white/15 bg-white dark:bg-white/5 text-sm font-semibold text-[#1c3354] dark:text-white hover:bg-[#eef5fc] dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => {
              const fn = options.onConfirm;
              onClose();
              fn();
            }}
            className="h-11 px-5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-semibold shadow-[0_8px_20px_-10px_rgba(220,38,38,0.8)] hover:opacity-95 transition-opacity cursor-pointer"
          >
            {options.confirmLabel || 'Sí, inactivar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const ask = useCallback((o: ConfirmOptions) => setOptions(o), []);
  const dialog = <ConfirmDialog options={options} onClose={() => setOptions(null)} />;
  return { ask, dialog };
}
