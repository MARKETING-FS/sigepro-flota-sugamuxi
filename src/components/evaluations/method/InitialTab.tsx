import React from 'react';
import { Lock, ChevronDown } from 'lucide-react';
import { InitialExtraPart } from '../../../types';
import {
  DOC006_CODE,
  DOC006_CRITERIA,
  DOC006_MAX_PER_CRITERION,
  DOC006_MAX_SCORE,
  DOC006_VERSION,
  doc006PassingFor,
} from '../../../data/evaluationDoc006';
import { cardCls, fieldCls } from '../form/formStyles';
import { AddPartForm } from './AddPartForm';
import { RowTools, Switch } from './RowTools';
import { Stepper } from './Stepper';
import { moveItem, newId } from './methodDraft';

interface InitialTabProps {
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
export const InitialTab: React.FC<InitialTabProps> = ({ extras, onChange, onAskDelete }) => {
  const active = extras.filter((x) => x.isActive);
  const extraMax = active.reduce((sum, x) => sum + x.maxPoints, 0);
  const total = DOC006_MAX_SCORE + extraMax;
  const patch = (id: string, change: Partial<InitialExtraPart>) =>
    onChange(extras.map((x) => (x.id === id ? { ...x, ...change } : x)));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Formato oficial" value={`${DOC006_MAX_SCORE} puntos`} hint="6 criterios de 20" />
        <Stat label="Partes adicionales" value={`+${extraMax} puntos`} hint={`${active.length} activa${active.length === 1 ? '' : 's'}`} />
        <Stat label="Puntaje total" value={`${total} puntos`} hint={`Aprueba con ${doc006PassingFor(total)} o más`} strong />
      </div>

      <details className={`${cardCls} group`}>
        <summary className="flex items-center gap-3 px-4 py-3.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-[#eaf2fb] dark:bg-white/10 text-[#1d5fa8] dark:text-[#69bdd7] shrink-0">
            <Lock className="w-4 h-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-[15px] text-[#0b1d3a] dark:text-white">
              Formato {DOC006_CODE} v{DOC006_VERSION}
            </span>
            <span className="block text-[13px] text-[#3a5274] dark:text-slate-400">
              Documento controlado: sus criterios y puntos no se cambian desde aquí.
            </span>
          </span>
          <ChevronDown className="w-5 h-5 text-[#3a5274] dark:text-slate-300 transition-transform group-open:rotate-180 shrink-0" />
        </summary>
        <ol className="border-t border-black/[0.07] dark:border-white/10 divide-y divide-black/[0.05] dark:divide-white/10">
          {DOC006_CRITERIA.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-6 h-6 rounded-full grid place-items-center bg-[#eaf2fb] dark:bg-white/10 text-xs font-semibold text-[#1d5fa8] dark:text-[#69bdd7] tabular-nums shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 min-w-0 text-sm text-[#0b1d3a] dark:text-slate-100">{c.name}</span>
              <span className="text-sm font-semibold tabular-nums text-[#3a5274] dark:text-slate-300">{DOC006_MAX_PER_CRITERION} pts</span>
            </li>
          ))}
        </ol>
      </details>

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
