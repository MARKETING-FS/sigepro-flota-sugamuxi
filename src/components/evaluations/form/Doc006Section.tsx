import React from 'react';
import { DOC006_CRITERIA, DOC006_MAX_PER_CRITERION } from '../../../data/evaluationDoc006';
import { CriterionShell } from './CriterionShell';
import { cardCls, focusRing } from './formStyles';

interface Doc006SectionProps {
  points: { [criterionId: string]: number };
  notes: { [criterionId: string]: string };
  onPick: (criterionId: string, points: number) => void;
  onNotes: (criterionId: string, value: string) => void;
}

/** Evaluación inicial: seis criterios del formato FS.GA-DOC-006, una opción por criterio. */
export const Doc006Section: React.FC<Doc006SectionProps> = ({ points, notes, onPick, onNotes }) => {
  const answered = DOC006_CRITERIA.filter((c) => points[c.id] !== undefined).length;
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="font-display text-lg font-semibold text-[#0b1d3a] dark:text-white">Criterios de selección</h4>
        <span className="text-xs font-semibold text-[#3a5274] dark:text-slate-300 tabular-nums">
          {answered} de {DOC006_CRITERIA.length} calificados
        </span>
      </div>
      <ol className={`${cardCls} divide-y divide-black/[0.07] dark:divide-white/10`}>
        {DOC006_CRITERIA.map((criterion, idx) => {
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
                  <span className="text-xs font-medium text-[#5d7392]"> /{DOC006_MAX_PER_CRITERION}</span>
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
                          ? 'border-transparent bg-gradient-action text-white shadow-glow'
                          : 'border-black/[0.1] dark:border-white/10 hover:border-[#0f6b8f]/60 hover:bg-[#0f6b8f]/[0.05]'
                      }`}
                    >
                      <span className="block font-display text-xl font-semibold tabular-nums leading-none">{opt.points}</span>
                      <span
                        className={`block mt-1.5 text-[12.5px] leading-snug ${
                          on ? 'text-white/90' : 'text-[#3a5274] dark:text-slate-300'
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
