import React from 'react';
import { Check } from 'lucide-react';
import { areaCls, cardCls, fieldCls, labelCls } from './formStyles';

interface ClosingSectionProps {
  isInitial: boolean;
  observations: string;
  onObservations: (v: string) => void;
  // Evaluación inicial: quién firma
  evaluatorName: string;
  onEvaluatorName: (v: string) => void;
  evaluatorPosition: string;
  onEvaluatorPosition: (v: string) => void;
  // Evaluación anual: plan de mejora
  planRequired: boolean;
  planForcedByConcept: boolean;
  onPlanToggle: (v: boolean) => void;
  planAction: string;
  onPlanAction: (v: string) => void;
  planDeadline: string;
  onPlanDeadline: (v: string) => void;
}

export const ClosingSection: React.FC<ClosingSectionProps> = (p) => (
  <section className="space-y-3">
    <h4 className="font-display text-lg font-semibold text-[#0b1d3a] dark:text-white">Cierre de la evaluación</h4>
    <div className={`${cardCls} p-4 sm:p-5 space-y-5`}>
      <div>
        <label htmlFor="eval-obs" className={labelCls}>
          {p.isInitial ? 'Conclusiones' : 'Observaciones generales y dictamen del revisor'}
        </label>
        <textarea
          id="eval-obs"
          rows={3}
          value={p.observations}
          onChange={(e) => p.onObservations(e.target.value)}
          placeholder={
            p.isInitial
              ? 'Conclusiones de la evaluación y decisión sobre la vinculación del proveedor…'
              : 'Fortalezas y oportunidades de mejora que se identificaron en el proveedor…'
          }
          className={areaCls}
        />
      </div>

      {p.isInitial ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-black/[0.07] dark:border-white/10">
          <div>
            <label htmlFor="eval-name" className={labelCls}>Nombre del evaluador</label>
            <input id="eval-name" type="text" value={p.evaluatorName} onChange={(e) => p.onEvaluatorName(e.target.value)} className={fieldCls} required />
          </div>
          <div>
            <label htmlFor="eval-position" className={labelCls}>Cargo</label>
            <input id="eval-position" type="text" value={p.evaluatorPosition} onChange={(e) => p.onEvaluatorPosition(e.target.value)} placeholder="Ej: Coordinador de compras" className={fieldCls} required />
          </div>
        </div>
      ) : (
        <div className="pt-4 border-t border-black/[0.07] dark:border-white/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="planMejoraCheck" className={`flex items-center gap-3 ${p.planForcedByConcept ? '' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                id="planMejoraCheck"
                checked={p.planRequired}
                disabled={p.planForcedByConcept}
                onChange={(e) => p.onPlanToggle(e.target.checked)}
                className="sr-only peer"
              />
              <span
                className={`w-5 h-5 rounded-md grid place-items-center border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#0f6b8f]/50 ${
                  p.planRequired ? 'bg-gradient-action border-transparent text-white' : 'border-[#5d7392]/60'
                }`}
              >
                {p.planRequired && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              </span>
              <span className="text-sm font-semibold text-[#0b1d3a] dark:text-slate-100">
                Exigir al proveedor un plan de mejora
              </span>
            </label>
            {p.planForcedByConcept && (
              <span className="h-7 px-3 inline-flex items-center rounded-full bg-[#5db2c9]/25 text-[#0e6d8a] dark:text-[#5db2c9] text-xs font-semibold">
                Obligatorio: la calificación es condicional
              </span>
            )}
          </div>

          {p.planRequired && (
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_200px] gap-4">
              <div>
                <label htmlFor="plan-action" className={labelCls}>Acción o compromiso que se le exige</label>
                <input
                  id="plan-action"
                  type="text"
                  value={p.planAction}
                  onChange={(e) => p.onPlanAction(e.target.value)}
                  placeholder="Ej: enviar la póliza RCE actualizada y la certificación ISO 9001"
                  className={fieldCls}
                  required
                />
              </div>
              <div>
                <label htmlFor="plan-deadline" className={labelCls}>Fecha límite</label>
                <input
                  id="plan-deadline"
                  type="date"
                  value={p.planDeadline}
                  onChange={(e) => p.onPlanDeadline(e.target.value)}
                  className={`${fieldCls} cursor-pointer`}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </section>
);
