import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit: string;
  label: string;
  onChange: (value: number) => void;
}

/** Número con botones − y + para ajustar puntos o porcentajes sin escribir. */
export const Stepper: React.FC<StepperProps> = ({ value, min = 0, max = 100, step = 5, unit, label, onChange }) => {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, Math.round(Number.isFinite(v) ? v : min))));
  const btn =
    'w-9 h-11 grid place-items-center text-[#1d5fa8] dark:text-[#69bdd7] hover:bg-[#2c84c4]/10 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2c84c4]/50';
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center rounded-xl border border-black/[0.1] dark:border-white/15 bg-white dark:bg-white/[0.04] overflow-hidden shrink-0"
    >
      <button type="button" className={btn} onClick={() => set(value - step)} disabled={value <= min} aria-label={`Restar ${step}`}>
        <Minus className="w-4 h-4" />
      </button>
      <label className="flex items-center justify-center gap-1 w-[84px] self-stretch cursor-text">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => set(Number(e.target.value))}
          aria-label={label}
          className="fs-bare-input w-10 text-right font-display font-semibold tabular-nums text-[#0b1d3a] dark:text-white focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="text-xs font-semibold text-[#5d7392]">{unit}</span>
      </label>
      <button type="button" className={btn} onClick={() => set(value + step)} disabled={value >= max} aria-label={`Sumar ${step}`}>
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};
