import React from 'react';
import { Scale } from 'lucide-react';
import { EvaluationCriterionConfig } from '../../../types';
import { cardCls, fieldCls } from '../form/formStyles';
import { AddPartForm } from './AddPartForm';
import { RowTools, Switch } from './RowTools';
import { Stepper } from './Stepper';
import { activeWeight, balanceTo100, moveItem, newId, weightOf } from './methodDraft';

interface AnnualTabProps {
  criteria: EvaluationCriterionConfig[];
  onChange: (next: EvaluationCriterionConfig[]) => void;
  onAskDelete: (name: string, run: () => void) => void;
}

const SHADES = ['#0f3d75', '#1d5fa8', '#2c84c4', '#69bdd7', '#4a9bff', '#8fb6d9'];

/** Evaluación anual: criterios ponderados que deben sumar 100 %. */
export const AnnualTab: React.FC<AnnualTabProps> = ({ criteria, onChange, onAskDelete }) => {
  const sum = activeWeight(criteria);
  const exact = sum === 100;
  const active = criteria.filter((c) => c.isActive !== false);
  const patch = (id: string, change: Partial<EvaluationCriterionConfig>) =>
    onChange(criteria.map((c) => (c.id === id ? { ...c, ...change } : c)));
  const scale = Math.max(100, sum);

  return (
    <div className="space-y-6">
      <section
        aria-label="Reparto de los pesos"
        className={`${cardCls} p-4 sm:p-5 space-y-3 ${exact ? '' : '!border-amber-500/50'}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[#3a5274] dark:text-slate-400">Suma de los pesos activos</div>
            <div className="flex items-baseline gap-2">
              <span
                className={`font-display text-3xl font-semibold tabular-nums leading-none ${
                  exact ? 'text-[#1d5fa8] dark:text-[#69bdd7]' : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {sum}%
              </span>
              <span className="text-sm text-[#3a5274] dark:text-slate-300">
                {exact ? 'Completo' : sum < 100 ? `Faltan ${100 - sum}%` : `Sobran ${sum - 100}%`}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(balanceTo100(criteria))}
            disabled={exact || active.length === 0}
            className="h-11 px-4 rounded-xl border border-[#1d5fa8] text-[#1d5fa8] dark:text-[#69bdd7] dark:border-[#4a9bff] hover:bg-[#2c84c4]/10 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
          >
            <Scale className="w-4 h-4" /> Equilibrar a 100%
          </button>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-black/[0.06] dark:bg-white/10" role="img" aria-label={`Reparto: ${sum}%`}>
          {active.map((c, i) => (
            <span
              key={c.id}
              title={`${c.name}: ${weightOf(c)}%`}
              style={{ width: `${(weightOf(c) / scale) * 100}%`, background: SHADES[i % SHADES.length] }}
              className="h-full border-r border-white/70 dark:border-[#0c1426] last:border-r-0"
            />
          ))}
        </div>
        {!exact && (
          <p className="text-[13px] text-[#3a5274] dark:text-slate-400">
            Puede guardar así: al calificar, los pesos se ajustan proporcionalmente. Pero lo claro es que sumen 100%.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <ol className={`${cardCls} divide-y divide-black/[0.07] dark:divide-white/10`}>
          {criteria.map((c, i) => {
            const on = c.isActive !== false;
            return (
              <li key={c.id} className={`p-4 space-y-3 ${on ? '' : 'opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded-full grid place-items-center shrink-0 text-sm font-semibold tabular-nums text-white"
                    style={{ background: on ? SHADES[active.findIndex((a) => a.id === c.id) % SHADES.length] || '#1d5fa8' : '#8a9ab0' }}
                  >
                    {i + 1}
                  </span>
                  <input
                    value={c.name}
                    onChange={(e) => patch(c.id, { name: e.target.value })}
                    aria-label="Nombre del criterio"
                    className={`${fieldCls} !h-10 font-semibold`}
                  />
                  <Switch on={on} onChange={(v) => patch(c.id, { isActive: v })} label={`Usar ${c.name}`} />
                  <RowTools
                    name={c.name}
                    canUp={i > 0}
                    canDown={i < criteria.length - 1}
                    onUp={() => onChange(moveItem(criteria, i, -1))}
                    onDown={() => onChange(moveItem(criteria, i, 1))}
                    onDelete={() => onAskDelete(c.name, () => onChange(criteria.filter((x) => x.id !== c.id)))}
                  />
                </div>
                <div className="grid gap-3 sm:pl-11 sm:grid-cols-[180px_1fr_auto] sm:items-center">
                  <input
                    value={c.category}
                    onChange={(e) => patch(c.id, { category: e.target.value })}
                    placeholder="Categoría"
                    aria-label={`Categoría de ${c.name}`}
                    className={`${fieldCls} !h-10`}
                  />
                  <input
                    value={c.description}
                    onChange={(e) => patch(c.id, { description: e.target.value })}
                    placeholder="Qué se evalúa (opcional)"
                    aria-label={`Descripción de ${c.name}`}
                    className={`${fieldCls} !h-10`}
                  />
                  <Stepper
                    value={weightOf(c)}
                    min={0}
                    max={100}
                    step={5}
                    unit="%"
                    label={`Peso de ${c.name}`}
                    onChange={(v) => patch(c.id, { weight: v })}
                  />
                </div>
              </li>
            );
          })}
        </ol>

        <AddPartForm
          openLabel="Agregar un criterio a la evaluación anual"
          title="Nuevo criterio de la evaluación anual"
          valueLabel="Peso"
          unit="%"
          defaultValue={10}
          maxValue={100}
          step={5}
          withCategory
          onAdd={(v) =>
            onChange([
              ...criteria,
              {
                id: newId('crit'),
                name: v.name,
                category: v.category,
                description: v.description,
                weight: v.value,
                appliesTo: 'AMBOS',
                minScoreToPass: 70,
                minPassingScore: 70,
                isActive: true,
              },
            ])
          }
        />
      </section>
    </div>
  );
};
