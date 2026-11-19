import React from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

const iconBtn =
  'w-9 h-9 grid place-items-center rounded-lg text-[#3a5274] dark:text-slate-300 hover:bg-black/[0.06] dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c84c4]/50';

/** Subir, bajar y eliminar: los controles que se repiten en cada fila. */
export const RowTools: React.FC<{
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
  name: string;
}> = ({ canUp, canDown, onUp, onDown, onDelete, name }) => (
  <div className="flex items-center gap-0.5 shrink-0">
    <button type="button" className={iconBtn} onClick={onUp} disabled={!canUp} aria-label={`Subir ${name}`} title="Subir">
      <ChevronUp className="w-4 h-4" />
    </button>
    <button type="button" className={iconBtn} onClick={onDown} disabled={!canDown} aria-label={`Bajar ${name}`} title="Bajar">
      <ChevronDown className="w-4 h-4" />
    </button>
    <button
      type="button"
      className={`${iconBtn} hover:!bg-red-500/10 hover:text-red-600 dark:hover:text-red-400`}
      onClick={onDelete}
      aria-label={`Eliminar ${name}`}
      title="Eliminar"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
);

/** Interruptor activo / inactivo. */
export const Switch: React.FC<{ on: boolean; onChange: (v: boolean) => void; label: string }> = ({ on, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    title={on ? 'Se usa al calificar' : 'No se usa al calificar'}
    onClick={() => onChange(!on)}
    className={`relative w-10 h-6 !min-h-0 rounded-full transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c84c4]/50 ${
      on ? 'bg-[#1d5fa8]' : 'bg-[#b9c8dc] dark:bg-white/25'
    }`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
  </button>
);
