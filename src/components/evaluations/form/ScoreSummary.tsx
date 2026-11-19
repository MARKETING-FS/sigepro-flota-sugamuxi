import React from 'react';
import { Award } from 'lucide-react';

export interface SummaryItem {
  id: string;
  name: string;
  /** Puntos elegidos; null si todavía no se califica */
  value: number | null;
}

export interface Verdict {
  label: string;
  hint: string;
  tone: 'ok' | 'warn' | 'bad' | 'pending';
}

interface ScoreSummaryProps {
  /** 'panel': columna fija a la derecha (escritorio). 'bar': franja compacta arriba (celular). */
  variant: 'panel' | 'bar';
  title: string;
  total: number;
  max: number;
  /** Puntaje mínimo para aprobar; si existe se marca en la barra */
  passing?: number;
  verdict: Verdict;
  items: SummaryItem[];
  onJump: (id: string) => void;
}

/** Mismo azul que las tarjetas elegidas del Registro de proveedores (ChoiceCard) */
const panelCls =
  'rounded-2xl border border-[#1d5fa8] bg-[#eaf2fb] dark:bg-[#101828] dark:border-[#4a9bff] shadow-[0_0_0_1px_#1d5fa8] dark:shadow-[0_0_0_1px_#4a9bff] text-[#0b1d3a] dark:text-white';
const mutedCls = 'text-[#3a5274] dark:text-slate-300';

const toneCls: Record<Verdict['tone'], string> = {
  ok: 'bg-[#1d5fa8] text-white',
  warn: 'bg-[#69bdd7] text-[#0b1d3a]',
  bad: 'bg-red-500 text-white',
  pending: 'bg-white dark:bg-white/15 text-[#1c3354] dark:text-white border border-[#d9e3ef] dark:border-transparent',
};

const Progress: React.FC<{ total: number; max: number; passing?: number; showLabels?: boolean }> = ({
  total,
  max,
  passing,
  showLabels,
}) => (
  <div className="relative">
    <div className="w-full bg-[#1d5fa8]/15 dark:bg-white/20 rounded-full h-2 overflow-hidden">
      <div
        className="h-full rounded-full bg-[#1d5fa8] dark:bg-white transition-[width] duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, (total / max) * 100))}%` }}
      />
    </div>
    {passing !== undefined && (
      <div
        className="absolute -top-1 h-4 w-px bg-[#0b1d3a] dark:bg-white/90"
        style={{ left: `${(passing / max) * 100}%` }}
        aria-hidden="true"
      />
    )}
    {showLabels && passing !== undefined && (
      <div className="relative h-4 mt-1.5 text-[11px] text-[#3a5274] dark:text-white/80">
        <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${(passing / max) * 100}%` }}>
          Mínimo {passing}
        </span>
        <span className="absolute right-0">{max}</span>
      </div>
    )}
  </div>
);

export const ScoreSummary: React.FC<ScoreSummaryProps> = ({
  variant,
  title,
  total,
  max,
  passing,
  verdict,
  items,
  onJump,
}) => {
  if (variant === 'bar') {
    return (
      <div className={`relative overflow-hidden px-4 py-3 ${panelCls}`}>
        <div className="relative flex items-center justify-between gap-3">
          <div className="font-display text-2xl font-semibold tabular-nums leading-none">
            {total}
            <span className={`text-sm font-medium ${mutedCls}`}>/{max}</span>
          </div>
          <span className={`inline-flex h-7 px-3 items-center rounded-full text-xs font-bold ${toneCls[verdict.tone]}`}>
            {verdict.label}
          </span>
        </div>
        <div className="relative mt-2.5">
          <Progress total={total} max={max} passing={passing} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className={`relative overflow-hidden p-5 ${panelCls}`}>
        <div className="relative">
          <div className={`text-sm font-medium ${mutedCls} flex items-center gap-1.5`}>
            <Award className="w-4 h-4" /> {title}
          </div>
          <div className="mt-3 font-display text-6xl font-semibold leading-none tabular-nums">
            {total}
            <span className={`text-xl font-medium ${mutedCls}`}>/{max}</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className={`inline-flex h-7 px-3 items-center rounded-full text-xs font-bold ${toneCls[verdict.tone]}`}>
              {verdict.label}
            </span>
            <span className={`text-xs ${mutedCls}`}>{verdict.hint}</span>
          </div>
          <div className="mt-5">
            <Progress total={total} max={max} passing={passing} showLabels />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-[#1c3354] dark:text-slate-200 mb-2">Ir a un criterio</h4>
        <ul className="space-y-1">
          {items.map((it, i) => (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => onJump(it.id)}
                className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-[#2c84c4]/[0.07] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c84c4]/50"
              >
                <span
                  className={`w-6 h-6 rounded-full grid place-items-center shrink-0 text-[11px] font-semibold tabular-nums ${
                    it.value === null
                      ? 'bg-black/[0.06] dark:bg-white/10 text-[#3a5274] dark:text-slate-300'
                      : 'bg-[#1d5fa8] text-white'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="flex-1 min-w-0 truncate text-[13px] text-[#0b1d3a] dark:text-slate-100">{it.name}</span>
                <span
                  className={`text-[13px] font-semibold tabular-nums ${
                    it.value === null ? 'text-[#5d7392]' : 'text-[#0b1d3a] dark:text-white'
                  }`}
                >
                  {it.value ?? '—'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
