import React from 'react';
import { EvaluationCriterionConfig } from '../../../types';
import { CriterionShell } from './CriterionShell';
import { cardCls, chipOff, chipOn } from './formStyles';

interface WeightedSectionProps {
  criteria: EvaluationCriterionConfig[];
  scores: { [criterionId: string]: { score: number; notes: string } };
  onScore: (criterionId: string, value: number) => void;
  onNotes: (criterionId: string, value: string) => void;
  totalWeight: number;
}

const PRESETS = [
  { score: 100, title: 'Excelente' },
  { score: 85, title: 'Bueno' },
  { score: 70, title: 'Aceptable' },
  { score: 50, title: 'Deficiente' },
];

/** Evaluación anual: cada criterio parametrizado se califica de 0 a 100 y pesa según su ponderación. */
export const WeightedSection: React.FC<WeightedSectionProps> = ({ criteria, scores, onScore, onNotes, totalWeight }) => (
  <section className="space-y-3">
    <div className="flex items-baseline justify-between gap-3">
      <h4 className="font-display text-lg font-semibold text-[#0b1d3a] dark:text-white">Criterios de evaluación</h4>
      <span
        className={`text-xs font-semibold tabular-nums ${
          totalWeight === 100 ? 'text-[#0a5473] dark:text-[#5db2c9]' : 'text-red-600 dark:text-red-400'
        }`}
      >
        Peso total {totalWeight}%{totalWeight !== 100 ? ' · debería sumar 100%' : ''}
      </span>
    </div>
    <ol className={`${cardCls} divide-y divide-black/[0.07] dark:divide-white/10`}>
      {criteria.map((criterion, idx) => {
        const state = scores[criterion.id] || { score: 90, notes: '' };
        const weight = criterion.weight ?? criterion.weightInitial ?? 20;
        return (
          <CriterionShell
            key={criterion.id}
            id={criterion.id}
            index={idx + 1}
            done
            title={criterion.name}
            badges={
              <span className="text-[11px] h-5 px-2 inline-flex items-center rounded-full bg-[#5db2c9]/20 text-[#0e6d8a] dark:text-[#5db2c9] font-semibold">
                {criterion.category}
              </span>
            }
            description={criterion.description}
            aside={
              <span className="shrink-0 h-7 px-3 inline-flex items-center rounded-full bg-[#0f6b8f]/12 dark:bg-[#0f6b8f]/25 text-xs font-semibold text-[#0a5473] dark:text-[#5db2c9] tabular-nums">
                Peso {weight}%
              </span>
            }
            notes={state.notes}
            onNotes={(v) => onNotes(criterion.id, v)}
            notesPlaceholder="Observación técnica o justificación (opcional)"
          >
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={state.score}
                onChange={(e) => onScore(criterion.id, Number(e.target.value))}
                aria-label={`Deslizador de ${criterion.name}`}
                className="flex-1 min-w-0 accent-[#0f6b8f] cursor-pointer h-1.5"
              />
              <div className="flex items-baseline gap-1.5 shrink-0">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={state.score}
                  onChange={(e) => onScore(criterion.id, Number(e.target.value))}
                  aria-label={`Puntaje de ${criterion.name}`}
                  className="w-[76px] h-11 text-center font-display text-xl font-semibold tabular-nums rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/10 text-[#0b1d3a] dark:text-white focus:outline-none focus:border-[#0f6b8f] focus:ring-2 focus:ring-[#0f6b8f]/30"
                />
                <span className="text-xs text-[#5d7392]">de 100</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.score}
                  type="button"
                  onClick={() => onScore(criterion.id, p.score)}
                  aria-pressed={state.score === p.score}
                  className={`h-8 px-3 text-xs rounded-full font-semibold transition-colors cursor-pointer ${
                    state.score === p.score ? chipOn : chipOff
                  }`}
                >
                  {p.title} · {p.score}
                </button>
              ))}
            </div>
          </CriterionShell>
        );
      })}
    </ol>
  </section>
);
