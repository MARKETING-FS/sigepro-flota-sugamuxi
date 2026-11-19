import React from 'react';
import { InitialExtraPart } from '../../../types';
import { DOC006_CRITERIA } from '../../../data/evaluationDoc006';
import { CriterionShell } from './CriterionShell';
import { cardCls, chipOff, chipOn } from './formStyles';

interface ExtraPartsSectionProps {
  parts: InitialExtraPart[];
  points: { [partId: string]: number };
  notes: { [partId: string]: string };
  onPoints: (partId: string, value: number) => void;
  onNotes: (partId: string, value: string) => void;
}

/** Evaluación inicial: partes que el administrador agregó en «Método de evaluación», con sus propios puntos. */
export const ExtraPartsSection: React.FC<ExtraPartsSectionProps> = ({ parts, points, notes, onPoints, onNotes }) => {
  if (parts.length === 0) return null;
  const answered = parts.filter((p) => points[p.id] !== undefined).length;
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="font-display text-lg font-semibold text-[#0b1d3a] dark:text-white">Partes adicionales</h4>
        <span className="text-xs font-semibold text-[#3a5274] dark:text-slate-300 tabular-nums">
          {answered} de {parts.length} calificadas
        </span>
      </div>
      <ol className={`${cardCls} divide-y divide-black/[0.07] dark:divide-white/10`}>
        {parts.map((part, idx) => {
          const value = points[part.id];
          const presets = Array.from(
            new Set([part.maxPoints, Math.round(part.maxPoints * 0.75), Math.round(part.maxPoints * 0.5), 0])
          );
          return (
            <CriterionShell
              key={part.id}
              id={part.id}
              index={DOC006_CRITERIA.length + idx + 1}
              done={value !== undefined}
              title={part.name}
              description={part.description || 'Parte agregada por la administración a la evaluación inicial.'}
              aside={
                <div className="shrink-0 text-right font-display text-xl font-semibold tabular-nums text-[#0b1d3a] dark:text-white leading-none pt-1">
                  {value ?? '–'}
                  <span className="text-xs font-medium text-[#5d7392]"> /{part.maxPoints}</span>
                </div>
              }
              notes={notes[part.id] || ''}
              onNotes={(v) => onNotes(part.id, v)}
              notesPlaceholder="Observación de esta parte (opcional)"
            >
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={part.maxPoints}
                  step={1}
                  value={value ?? 0}
                  onChange={(e) => onPoints(part.id, Number(e.target.value))}
                  aria-label={`Deslizador de ${part.name}`}
                  className="flex-1 min-w-0 accent-[#2c84c4] cursor-pointer h-1.5"
                />
                <input
                  type="number"
                  min={0}
                  max={part.maxPoints}
                  value={value ?? ''}
                  placeholder="–"
                  onChange={(e) => onPoints(part.id, e.target.value === '' ? 0 : Number(e.target.value))}
                  aria-label={`Puntos de ${part.name}`}
                  className="w-[76px] h-11 text-center font-display text-xl font-semibold tabular-nums rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/10 text-[#0b1d3a] dark:text-white focus:outline-none focus:border-[#2c84c4] focus:ring-2 focus:ring-[#2c84c4]/30"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onPoints(part.id, p)}
                    aria-pressed={value === p}
                    className={`h-8 px-3 text-xs rounded-full font-semibold transition-colors cursor-pointer ${
                      value === p ? chipOn : chipOff
                    }`}
                  >
                    {p === part.maxPoints ? `Máximo · ${p}` : `${p} puntos`}
                  </button>
                ))}
              </div>
            </CriterionShell>
          );
        })}
      </ol>
    </section>
  );
};
