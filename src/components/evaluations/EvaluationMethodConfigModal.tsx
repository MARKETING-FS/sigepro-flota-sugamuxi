import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ClipboardCheck, CalendarClock, Gauge, RotateCcw, Sliders, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useConfirm } from '../ui/ConfirmDialog';
import { chipOff, chipOn, focusRing } from './form/formStyles';
import { InitialTab } from './method/InitialTab';
import { AnnualTab } from './method/AnnualTab';
import { ThresholdsTab } from './method/ThresholdsTab';
import { MethodDraft, draftFromMethod, patchFromDraft, sameDraft } from './method/methodDraft';

interface EvaluationMethodConfigModalProps {
  onClose: () => void;
}

type TabId = 'initial' | 'annual' | 'ranges';

/** «Método de evaluación»: qué partes se califican, cuántos puntos vale cada una y los rangos del concepto. */
export const EvaluationMethodConfigModal: React.FC<EvaluationMethodConfigModalProps> = ({ onClose }) => {
  const { evaluationMethod, updateEvaluationMethod, resetEvaluationMethodToDefault } = useApp();
  const { ask, dialog } = useConfirm();

  const saved = useMemo(() => draftFromMethod(evaluationMethod), [evaluationMethod]);
  const [draft, setDraft] = useState<MethodDraft>(saved);
  const [tab, setTab] = useState<TabId>('initial');

  // Si el método cambia desde afuera (restaurar, otra sesión), la copia editable lo sigue
  useEffect(() => setDraft(saved), [saved]);

  const dirty = !sameDraft(draft, saved);
  const t = draft.thresholds;
  const issues: string[] = [];
  if (!(t.sobresalienteMin > t.conformeMin && t.conformeMin > t.condicionalMin && t.condicionalMin > 0)) {
    issues.push('Revise los rangos del concepto: deben ir de menor a mayor.');
  }
  if (draft.criteria.some((c) => !c.name.trim()) || draft.extras.some((x) => !x.name.trim())) {
    issues.push('Hay una parte sin nombre.');
  }
  if (!draft.criteria.some((c) => c.isActive !== false)) issues.push('Debe haber al menos un criterio activo en la evaluación anual.');
  const canSave = dirty && issues.length === 0;

  const requestClose = useCallback(() => {
    if (!dirty) return onClose();
    ask({
      title: '¿Salir sin guardar?',
      message: 'Hizo cambios en el método de evaluación que todavía no están guardados.',
      confirmLabel: 'Salir sin guardar',
      onConfirm: onClose,
    });
  }, [dirty, ask, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [requestClose]);

  const askDelete = (name: string, run: () => void) =>
    ask({
      title: `¿Eliminar «${name}»?`,
      message: 'Se quita de la lista. Si todavía no guarda, puede salir sin guardar para recuperarla.',
      confirmLabel: 'Sí, eliminar',
      icon: <Trash2 className="w-6 h-6" />,
      onConfirm: run,
    });

  const restore = () =>
    ask({
      title: '¿Restaurar el método?',
      message: 'Los criterios, pesos, rangos y partes adicionales volverán a los valores institucionales.',
      hint: 'Las evaluaciones ya registradas no cambian.',
      hintIcon: <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />,
      confirmLabel: 'Sí, restaurar',
      onConfirm: () => resetEvaluationMethodToDefault(),
    });

  const tabs: { id: TabId; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'initial', label: 'Evaluación inicial', icon: ClipboardCheck, count: 6 + draft.extras.filter((x) => x.isActive).length },
    { id: 'annual', label: 'Evaluación anual', icon: CalendarClock, count: draft.criteria.filter((c) => c.isActive !== false).length },
    { id: 'ranges', label: 'Rangos del concepto', icon: Gauge },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050b1a]/75 backdrop-blur-sm p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="method-title"
    >
      <div className="bg-[#f4f8fc] dark:bg-[#0c1426] rounded-[24px] border border-black/10 dark:border-white/10 shadow-2xl w-full max-w-4xl h-[92vh] flex flex-col overflow-hidden animate-fade-up">
        <header className="px-5 sm:px-7 py-4 bg-white dark:bg-[#0a1122] border-b border-black/[0.07] dark:border-white/10 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="w-11 h-11 rounded-xl bg-[#1d5fa8] text-white grid place-items-center shrink-0">
              <Sliders className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 id="method-title" className="font-display text-lg sm:text-xl font-semibold tracking-tight text-[#0b1d3a] dark:text-white">
                Método de evaluación
              </h3>
              <p className="text-sm text-[#3a5274] dark:text-slate-400">Qué se califica y cuántos puntos vale cada parte</p>
            </div>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Cerrar"
            className="w-10 h-10 grid place-items-center rounded-xl text-[#3a5274] dark:text-slate-300 hover:bg-black/[0.06] dark:hover:bg-white/10 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="px-5 sm:px-7 py-3 bg-white dark:bg-[#0a1122] border-b border-black/[0.07] dark:border-white/10 shrink-0 overflow-x-auto">
          <div role="tablist" aria-label="Partes del método" className="flex gap-1.5 min-w-max">
            {tabs.map((x) => (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={tab === x.id}
                onClick={() => setTab(x.id)}
                className={`h-10 px-4 rounded-full text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${focusRing} ${
                  tab === x.id ? chipOn : chipOff
                }`}
              >
                <x.icon className="w-4 h-4" />
                {x.label}
                {x.count !== undefined && <span className="text-xs tabular-nums text-[#5d7392] dark:text-slate-400">{x.count}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-7 py-6">
          {tab === 'initial' && (
            <InitialTab extras={draft.extras} onChange={(extras) => setDraft((d) => ({ ...d, extras }))} onAskDelete={askDelete} />
          )}
          {tab === 'annual' && (
            <AnnualTab criteria={draft.criteria} onChange={(criteria) => setDraft((d) => ({ ...d, criteria }))} onAskDelete={askDelete} />
          )}
          {tab === 'ranges' && (
            <ThresholdsTab value={draft.thresholds} onChange={(thresholds) => setDraft((d) => ({ ...d, thresholds }))} />
          )}
        </div>

        <footer className="px-5 sm:px-7 py-4 bg-white dark:bg-[#0a1122] border-t border-black/[0.07] dark:border-white/10 shrink-0 space-y-2">
          {dirty && issues.length > 0 && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {issues[0]}
            </p>
          )}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              type="button"
              onClick={restore}
              className="inline-flex items-center justify-center gap-1.5 h-11 px-3 rounded-xl text-sm font-semibold text-[#3a5274] dark:text-slate-300 hover:bg-black/[0.06] dark:hover:bg-white/10 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Restaurar predeterminado
            </button>
            <div className="flex items-center gap-2">
              {dirty && (
                <button
                  type="button"
                  onClick={() => setDraft(saved)}
                  className="h-11 px-4 rounded-xl border border-[#2c84c4]/35 text-[#1d5fa8] dark:text-[#69bdd7] hover:bg-[#2c84c4]/10 text-sm font-semibold cursor-pointer"
                >
                  Descartar cambios
                </button>
              )}
              <button
                type="button"
                onClick={() => updateEvaluationMethod(patchFromDraft(draft))}
                disabled={!canSave}
                className="flex-1 sm:flex-none h-11 px-6 rounded-xl bg-gradient-action text-white text-sm font-semibold shadow-glow hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {dirty ? 'Guardar cambios' : 'Sin cambios'}
              </button>
            </div>
          </div>
        </footer>
      </div>
      {dialog}
    </div>
  );
};
