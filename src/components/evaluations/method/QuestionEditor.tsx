import React from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { DOC006_CRITERIA, Doc006Criterion, doc006MaxOf } from '../../../data/evaluationDoc006';
import { areaCls, cardCls, fieldCls, labelCls } from '../form/formStyles';
import { Stepper } from './Stepper';

interface QuestionEditorProps {
  criteria: Doc006Criterion[];
  onChange: (next: Doc006Criterion[]) => void;
}

/** Las seis preguntas de la evaluación inicial: se abre una para cambiar su texto, sus opciones y los puntos de cada opción. */
export const QuestionEditor: React.FC<QuestionEditorProps> = ({ criteria, onChange }) => {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const patch = (id: string, change: Partial<Doc006Criterion>) =>
    onChange(criteria.map((c) => (c.id === id ? { ...c, ...change } : c)));

  return (
    <ol className={`${cardCls} divide-y divide-black/[0.07] dark:divide-white/10`}>
      {criteria.map((c, i) => {
        const open = openId === c.id;
        const official = DOC006_CRITERIA.find((d) => d.id === c.id);
        const changed = !!official && JSON.stringify(official) !== JSON.stringify(c);
        const duplicated = new Set(c.options.map((o) => o.points)).size !== c.options.length;
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : c.id)}
              aria-expanded={open}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer hover:bg-[#2c84c4]/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2c84c4]/50"
            >
              <span className="w-8 h-8 rounded-full grid place-items-center shrink-0 text-sm font-semibold tabular-nums bg-[#1d5fa8] text-white">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-[15px] text-[#0b1d3a] dark:text-white truncate">{c.name}</span>
                <span className="block text-[13px] text-[#3a5274] dark:text-slate-400">
                  Hasta {doc006MaxOf(c)} puntos · {c.options.length} opciones
                  {changed ? ' · editada' : ''}
                </span>
              </span>
              <ChevronDown className={`w-5 h-5 text-[#3a5274] dark:text-slate-300 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="px-4 pb-5 sm:pl-[60px] space-y-4">
                <div>
                  <label className={labelCls} htmlFor={`q-name-${c.id}`}>
                    Nombre del criterio
                  </label>
                  <input
                    id={`q-name-${c.id}`}
                    value={c.name}
                    onChange={(e) => patch(c.id, { name: e.target.value })}
                    className={`${fieldCls} font-semibold`}
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor={`q-desc-${c.id}`}>
                    Qué se evalúa
                  </label>
                  <textarea
                    id={`q-desc-${c.id}`}
                    rows={3}
                    value={c.description}
                    onChange={(e) => patch(c.id, { description: e.target.value })}
                    className={areaCls}
                  />
                </div>
                <div>
                  <div className={labelCls}>Opciones y puntos</div>
                  <ul className="space-y-2">
                    {c.options.map((o, k) => (
                      <li key={k} className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <Stepper
                          value={o.points}
                          min={0}
                          max={100}
                          step={5}
                          unit="pts"
                          label={`Puntos de la opción ${k + 1}`}
                          onChange={(v) =>
                            patch(c.id, { options: c.options.map((x, j) => (j === k ? { ...x, points: v } : x)) })
                          }
                        />
                        <textarea
                          rows={2}
                          value={o.label}
                          onChange={(e) =>
                            patch(c.id, { options: c.options.map((x, j) => (j === k ? { ...x, label: e.target.value } : x)) })
                          }
                          aria-label={`Texto de la opción ${k + 1}`}
                          className={`${areaCls} !py-2`}
                        />
                      </li>
                    ))}
                  </ul>
                  {duplicated && (
                    <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
                      Dos opciones tienen los mismos puntos. Cada opción debe valer algo distinto.
                    </p>
                  )}
                </div>
                {changed && official && (
                  <button
                    type="button"
                    onClick={() => patch(c.id, { name: official.name, description: official.description, options: official.options.map((x) => ({ ...x })) })}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1d5fa8] dark:text-[#69bdd7] hover:underline underline-offset-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Volver al texto del formato oficial
                  </button>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
};
