import React from 'react';
import { Doc006Criterion, doc006MaxOf } from '../../../data/evaluationDoc006';
import { CriterionShell } from './CriterionShell';
import { cardCls, focusRing } from './formStyles';

interface Doc006SectionProps {
  criteria: Doc006Criterion[];
  points: { [criterionId: string]: number };
  notes: { [criterionId: string]: string };
  onPick: (criterionId: string, points: number) => void;
  onNotes: (criterionId: string, value: string) => void;
}

/** Evaluación inicial: seis criterios del formato FS.GA-DOC-006, una opción por criterio. */
export const Doc006Section: React.FC<Doc006SectionProps> = ({ criteria, points, notes, onPick, onNotes }) => {
  const answered = criteria.filter((c) => points[c.id] !== undefined).length;
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="font-display text-lg font-semibold text-[#0b1d3a] dark:text-white">Criterios de selección</h4>
        <span className="text-xs font-semibold text-[#3a5274] dark:text-slate-300 tabular-nums">
          {answered} de {criteria.length} calificados
        </span>
      </div>
      <ol className={`${cardCls} divide-y divide-black/[0.07] dark:divide-white/10`}>
        {criteria.map((criterion, idx) => {
          const picked = points[criterion.id];
          return (
            <CriterionShell
              key={criterion.id}
              id={criterion.id}
              index={idx + 1}
              done={picked !== undefined}
              title={criterion.name}
              description={criterion.description}
              aside={
                <div className="shrink-0 text-right font-display text-xl font-semibold tabular-nums text-[#0b1d3a] dark:text-white leading-none pt-1">
                  {picked ?? '–'}
                  <span className="text-xs font-medium text-[#5d7392]"> /{doc006MaxOf(criterion)}</span>
                </div>
              }
              notes={notes[criterion.id] || ''}
              onNotes={(v) => onNotes(criterion.id, v)}
              notesPlaceholder="Observación de este criterio (opcional)"
            >
              {criterion.note && <p className="text-[13px] text-[#3a5274] dark:text-slate-300">{criterion.note}</p>}
              <div
                role="radiogroup"
                aria-label={`Puntaje de ${criterion.name}`}
                className="grid grid-cols-2 xl:grid-cols-4 gap-2"
              >
                {criterion.options.map((opt) => {
                  const on = picked === opt.points;
                  return (
                    <button
                      key={opt.points}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => onPick(criterion.id, opt.points)}
                      className={`text-left rounded-xl border px-3 py-2.5 transition-[background-color,border-color,box-shadow] duration-150 cursor-pointer ${focusRing} ${
                        on
                          ? 'border-[#1d5fa8] bg-[#eaf2fb] dark:bg-[#0c2350] dark:border-[#4a9bff] shadow-[0_0_0_1px_#1d5fa8] dark:shadow-[0_0_0_1px_#4a9bff]'
                          : 'border-black/[0.1] dark:border-white/10 hover:border-[#2c84c4]/60 hover:bg-[#2c84c4]/[0.05]'
                      }`}
                    >
                      <span
                        className={`inline-grid place-items-center h-8 min-w-[40px] px-2 rounded-lg font-display text-lg font-semibold tabular-nums leading-none transition-colors ${
                          on ? 'bg-[#1d5fa8] text-white' : 'bg-[#eaf2fb] dark:bg-white/10 text-[#1d5fa8] dark:text-[#69bdd7]'
                        }`}
                      >
                        {opt.points}
                      </span>
                      <span
                        className={`block mt-2 text-[12.5px] leading-snug ${
                          on ? 'text-[#0b1d3a] dark:text-white' : 'text-[#3a5274] dark:text-slate-300'
                        }`}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CriterionShell>
          );
        })}
      </ol>
    </section>
  );
};
