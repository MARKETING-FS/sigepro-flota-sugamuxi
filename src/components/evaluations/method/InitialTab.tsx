import React from 'react';
import { InitialExtraPart } from '../../../types';
import {
  DOC006_CODE,
  DOC006_CRITERIA,
  DOC006_VERSION,
  Doc006Criterion,
  doc006PassingFor,
  doc006TotalMax,
  resolveInitialPassing,
} from '../../../data/evaluationDoc006';
import { QuestionEditor } from './QuestionEditor';
import { cardCls, fieldCls } from '../form/formStyles';
import { AddPartForm } from './AddPartForm';
import { RowTools, Switch } from './RowTools';
import { Stepper } from './Stepper';
import { moveItem, newId } from './methodDraft';

interface InitialTabProps {
  criteria: Doc006Criterion[];
  onCriteria: (next: Doc006Criterion[]) => void;
  passing: number | null;
  onPassing: (value: number) => void;
  extras: InitialExtraPart[];
  onChange: (next: InitialExtraPart[]) => void;
  onAskDelete: (name: string, run: () => void) => void;
}

const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: string; strong?: boolean }> = ({ label, value, hint, strong }) => (
  <div className={`${cardCls} px-4 py-3 ${strong ? '!border-[#1d5fa8] !bg-[#eaf2fb] dark:!bg-[#0c2350] dark:!border-[#4a9bff]' : ''}`}>
    <div className="text-xs font-semibold text-[#3a5274] dark:text-slate-400">{label}</div>
    <div className="font-display text-2xl font-semibold tabular-nums text-[#0b1d3a] dark:text-white leading-tight mt-0.5">{value}</div>
    {hint && <div className="text-xs text-[#5d7392] dark:text-slate-400 mt-0.5">{hint}</div>}
  </div>
);

/** Evaluación inicial: seis criterios fijos del formato y las partes que la administración le suma. */
export const InitialTab: React.FC<InitialTabProps> = ({ criteria, onCriteria, passing, onPassing, extras, onChange, onAskDelete }) => {
  const active = extras.filter((x) => x.isActive);
  const extraMax = active.reduce((sum, x) => sum + x.maxPoints, 0);
  const formatMax = doc006TotalMax(criteria);
  const total = formatMax + extraMax;
  const minimum = resolveInitialPassing(passing ?? undefined, total);
  const patch = (id: string, change: Partial<InitialExtraPart>) =>
    onChange(extras.map((x) => (x.id === id ? { ...x, ...change } : x)));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Preguntas del formato" value={`${formatMax} puntos`} hint={`${criteria.length} criterios`} />
        <Stat label="Partes adicionales" value={`+${extraMax} puntos`} hint={`${active.length} activa${active.length === 1 ? '' : 's'}`} />
        <Stat label="Puntaje total" value={`${total} puntos`} hint="Lo máximo que se puede sacar" strong />
      </div>

      <section className={`${cardCls} p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4`} aria-label="Mínimo para aprobar">
        <div className="min-w-0">
          <h4 className="font-display text-base font-semibold text-[#0b1d3a] dark:text-white">Mínimo para aprobar</h4>
          <p className="text-[13px] text-[#3a5274] dark:text-slate-400 mt-0.5">
            Con este puntaje o más, el proveedor queda <strong>Aprobado</strong>; con menos, <strong>No aprobado</strong>.
            {passing === null && ` Ahora sigue la proporción del formato (${doc006PassingFor(total)} de ${total}).`}
          </p>
        </div>
        <Stepper value={minimum} min={1} max={total} step={1} unit="pts" label="Puntos mínimos para aprobar" onChange={onPassing} />
      </section>

      <section className="space-y-3">
        <div>
          <h4 className="font-display text-lg font-semibold text-[#0b1d3a] dark:text-white">
            Preguntas · formato {DOC006_CODE} v{DOC006_VERSION}
          </h4>
          <p className="text-[13px] text-[#3a5274] dark:text-slate-400 mt-0.5">
            Abra un criterio para cambiar su texto, las opciones y los puntos de cada una. Los cambios aplican a las evaluaciones nuevas y salen en el
            PDF; las ya registradas conservan su puntaje.
          </p>
        </div>
        <QuestionEditor criteria={criteria} onChange={onCriteria} />
      </section>

      <section className="space-y-3">
        <div>
          <h4 className="font-display text-lg font-semibold text-[#0b1d3a] dark:text-white">Partes adicionales</h4>
          <p className="text-[13px] text-[#3a5274] dark:text-slate-400 mt-0.5">
            Se califican después de los seis criterios y suman a la evaluación inicial. Salen en una hoja aparte del PDF.
          </p>
        </div>

        {extras.length > 0 && (
          <ol className={`${cardCls} divide-y divide-black/[0.07] dark:divide-white/10`}>
            {extras.map((x, i) => (
              <li key={x.id} className={`p-4 space-y-3 ${x.isActive ? '' : 'opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full grid place-items-center shrink-0 text-sm font-semibold tabular-nums bg-[#1d5fa8] text-white">
                    {DOC006_CRITERIA.length + i + 1}
                  </span>
                  <input
                    value={x.name}
                    onChange={(e) => patch(x.id, { name: e.target.value })}
                    aria-label="Nombre de la parte"
                    className={`${fieldCls} !h-10 font-semibold`}
                  />
                  <Switch on={x.isActive} onChange={(v) => patch(x.id, { isActive: v })} label={`Usar ${x.name}`} />
                  <RowTools
                    name={x.name}
                    canUp={i > 0}
                    canDown={i < extras.length - 1}
                    onUp={() => onChange(moveItem(extras, i, -1))}
                    onDown={() => onChange(moveItem(extras, i, 1))}
                    onDelete={() => onAskDelete(x.name, () => onChange(extras.filter((e) => e.id !== x.id)))}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:pl-11">
                  <input
                    value={x.description}
                    onChange={(e) => patch(x.id, { description: e.target.value })}
                    placeholder="Qué se evalúa (opcional)"
                    aria-label={`Descripción de ${x.name}`}
                    className={`${fieldCls} !h-10`}
                  />
                  <Stepper
                    value={x.maxPoints}
                    min={1}
                    max={100}
                    step={5}
                    unit="pts"
                    label={`Puntos máximos de ${x.name}`}
                    onChange={(v) => patch(x.id, { maxPoints: v })}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}

        <AddPartForm
          openLabel="Agregar una parte a la evaluación inicial"
          title="Nueva parte de la evaluación inicial"
          valueLabel="Puntos máximos"
          unit="pts"
          defaultValue={10}
          maxValue={100}
          step={5}
          onAdd={(v) =>
            onChange([...extras, { id: newId('extra'), name: v.name, description: v.description, maxPoints: v.value, isActive: true }])
          }
        />
      </section>
    </div>
  );
};
