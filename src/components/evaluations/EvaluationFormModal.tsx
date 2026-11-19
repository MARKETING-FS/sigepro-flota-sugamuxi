import React, { useState, useMemo, useEffect } from 'react';
import { X, Award } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  DOC006_CODE,
  DOC006_CRITERIA,
  DOC006_MAX_PER_CRITERION,
  DOC006_MAX_SCORE,
  doc006PassingFor,
} from '../../data/evaluationDoc006';
import {
  SupplierDossier,
  SupplierEvaluation,
  SupplierEvaluationType,
  EvaluationCriterionScore,
  EvaluationConcept,
} from '../../types';
import { SetupCard } from './form/SetupCard';
import { Doc006Section } from './form/Doc006Section';
import { ExtraPartsSection } from './form/ExtraPartsSection';
import { WeightedSection } from './form/WeightedSection';
import { ClosingSection } from './form/ClosingSection';
import { ScoreSummary, SummaryItem, Verdict } from './form/ScoreSummary';
import { FormActions } from './form/FormActions';
import { SignatureStep } from './form/SignatureStep';

interface EvaluationFormModalProps {
  initialSupplier?: SupplierDossier | null;
  initialType?: SupplierEvaluationType;
  onClose: () => void;
  onSuccess?: (evaluation: SupplierEvaluation) => void;
}

const isAnnualType = (t: SupplierEvaluationType) =>
  t === 'ANUAL_1_ANO' || (t as string) === 'ANUAL_PERIODICA';

const jumpTo = (criterionId: string) => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(`crit-${criterionId}`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
};

export const EvaluationFormModal: React.FC<EvaluationFormModalProps> = ({
  initialSupplier,
  initialType = 'INICIAL',
  onClose,
  onSuccess,
}) => {
  const { allDossiers, activeUser, role, evaluationMethod, recordSupplierEvaluation } = useApp();

  const [selectedDossierId, setSelectedDossierId] = useState<string>(
    initialSupplier?.id || (allDossiers.length > 0 ? allDossiers[0].id : '')
  );
  const [evalType, setEvalType] = useState<SupplierEvaluationType>(initialType);

  const selectedDossier = useMemo(() => {
    return allDossiers.find((d) => d.id === selectedDossierId) || (allDossiers.length > 0 ? allDossiers[0] : null);
  }, [allDossiers, selectedDossierId]);

  const isSupplierActive =
    selectedDossier?.processStatus === 'PROVEEDOR_HABILITADO' || selectedDossier?.processStatus === 'APROBADO';

  // Evaluaciones anuales previas del proveedor
  const existingAnnualEvals = useMemo(() => {
    if (!selectedDossier) return [];
    const evals = Array.isArray(selectedDossier.evaluations) ? selectedDossier.evaluations : [];
    const list = evals.filter(
      (e) => e.evaluationType === 'ANUAL_1_ANO' || (e.evaluationType as string) === 'ANUAL_PERIODICA'
    );
    if (selectedDossier.annualEvaluation && !list.some((e) => e.id === selectedDossier.annualEvaluation?.id)) {
      list.push(selectedDossier.annualEvaluation);
    }
    return list;
  }, [selectedDossier]);

  // Ciclo anual sugerido: Año 1, Año 2, Año 3…
  const suggestedCycleNumber = existingAnnualEvals.length + 1;
  const [selectedCycleNumber, setSelectedCycleNumber] = useState<number>(suggestedCycleNumber);
  useEffect(() => {
    setSelectedCycleNumber(suggestedCycleNumber);
  }, [suggestedCycleNumber, selectedDossierId]);

  // Criterios parametrizados que aplican a este tipo de evaluación
  const applicableCriteria = useMemo(() => {
    const list = evaluationMethod?.criteria || [];
    const annual = isAnnualType(evalType);
    return list.filter(
      (c) =>
        c.isActive !== false &&
        (c.appliesTo === 'AMBOS' ||
          c.appliesTo === 'AMBAS' ||
          c.appliesTo === evalType ||
          (annual && (c.appliesTo === 'ANUAL_1_ANO' || (c.appliesTo as string) === 'ANUAL_PERIODICA')))
    );
  }, [evaluationMethod?.criteria, evalType]);

  const [criterionScores, setCriterionScores] = useState<{ [id: string]: { score: number; notes: string } }>({});
  const activeScoresMap = useMemo(() => {
    const map: { [id: string]: { score: number; notes: string } } = {};
    applicableCriteria.forEach((c) => {
      map[c.id] = criterionScores[c.id] || { score: 90, notes: '' };
    });
    return map;
  }, [applicableCriteria, criterionScores]);

  // Evaluación inicial (formato FS.GA-DOC-006)
  const [doc006Points, setDoc006Points] = useState<{ [id: string]: number }>({});
  const [doc006Notes, setDoc006Notes] = useState<{ [id: string]: string }>({});
  const [evaluatorNameInput, setEvaluatorNameInput] = useState<string>(activeUser?.name || '');
  const [evaluatorPosition, setEvaluatorPosition] = useState<string>('');
  // Fecha en que realmente se hizo la evaluación (por defecto hoy)
  const todayIso = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  })();
  const [evaluationDateInput, setEvaluationDateInput] = useState<string>(todayIso);

  const [generalObservations, setGeneralObservations] = useState<string>('');
  const [hasImprovementPlan, setHasImprovementPlan] = useState<boolean>(false);
  const [improvementAction, setImprovementAction] = useState<string>('');
  const [improvementDeadline, setImprovementDeadline] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Paso de firma: se abre al pulsar «Registrar calificación», antes de guardar y generar el PDF
  const [signing, setSigning] = useState(false);

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !signing) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, signing]);

  // Puntaje
  const isInitialDoc = evalType === 'INICIAL';
  const isAnnualEval = isAnnualType(evalType);
  // Partes que la administración agregó a la evaluación inicial (Método de evaluación)
  const extraParts = useMemo(
    () => (evaluationMethod?.initialExtras || []).filter((p) => p.isActive !== false),
    [evaluationMethod?.initialExtras]
  );
  const initialCount = DOC006_CRITERIA.length + extraParts.length;
  const initialMax = DOC006_MAX_SCORE + extraParts.reduce((sum, p) => sum + p.maxPoints, 0);
  const initialPassing = doc006PassingFor(initialMax);
  const doc006Answered =
    DOC006_CRITERIA.filter((c) => doc006Points[c.id] !== undefined).length +
    extraParts.filter((p) => doc006Points[p.id] !== undefined).length;
  const doc006Total =
    DOC006_CRITERIA.reduce((sum, c) => sum + (doc006Points[c.id] ?? 0), 0) +
    extraParts.reduce((sum, p) => sum + (doc006Points[p.id] ?? 0), 0);
  const doc006Complete = doc006Answered === initialCount;

  const totalScore = useMemo(() => {
    if (isInitialDoc) return doc006Total;
    if (applicableCriteria.length === 0) return 100;
    const totalWeight = applicableCriteria.reduce((sum, c) => sum + (c.weight ?? c.weightInitial ?? 20), 0);
    if (totalWeight === 0) return 0;
    let weightedSum = 0;
    applicableCriteria.forEach((c) => {
      const s = activeScoresMap[c.id]?.score ?? 90;
      const w = c.weight ?? c.weightInitial ?? 20;
      weightedSum += s * (w / totalWeight);
    });
    return Math.round(weightedSum * 10) / 10;
  }, [applicableCriteria, activeScoresMap, isInitialDoc, doc006Total]);

  // Concepto según los umbrales configurados
  const thresholds = useMemo(
    () =>
      evaluationMethod?.thresholds || {
        sobresalienteMin: evaluationMethod?.excellentThreshold ?? 90,
        conformeMin: evaluationMethod?.initialPassingScore ?? 70,
        condicionalMin: evaluationMethod?.conditionalThreshold ?? 60,
      },
    [evaluationMethod]
  );
  const computedConcept = useMemo<EvaluationConcept>(() => {
    if (isInitialDoc) return totalScore >= initialPassing ? 'CONFORME' : 'NO_CONFORME';
    if (totalScore >= (thresholds.sobresalienteMin ?? 90)) return 'SOBRESALIENTE';
    if (totalScore >= (thresholds.conformeMin ?? 70)) return 'CONFORME';
    if (totalScore >= (thresholds.condicionalMin ?? 60)) return 'CONDICIONAL_MEJORA';
    return 'NO_CONFORME';
  }, [totalScore, thresholds, isInitialDoc, initialPassing]);

  const handleScoreChange = (critId: string, val: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    setCriterionScores((prev) => ({ ...prev, [critId]: { score: clamped, notes: prev[critId]?.notes || '' } }));
  };
  const handleNotesChange = (critId: string, notes: string) => {
    setCriterionScores((prev) => ({ ...prev, [critId]: { score: prev[critId]?.score ?? 90, notes } }));
  };

  // El botón solo abre el paso de firma; la calificación se guarda cuando la persona firma (o sigue sin firma)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDossier) return;
    if (isInitialDoc && !doc006Complete) return;
    setSigning(true);
  };

  const register = (signature: string | null) => {
    if (!selectedDossier) return;
    if (isInitialDoc && !doc006Complete) return;

    setIsSubmitting(true);

    const scoresList: EvaluationCriterionScore[] = isInitialDoc
      ? DOC006_CRITERIA.map((c) => ({
          criterionId: c.id,
          criterionName: c.name,
          category: DOC006_CODE,
          weight: DOC006_MAX_PER_CRITERION,
          score: doc006Points[c.id],
          maxScore: DOC006_MAX_PER_CRITERION,
          optionLabel: c.options.find((o) => o.points === doc006Points[c.id])?.label,
          notes: doc006Notes[c.id]?.trim() || undefined,
        })).concat(
          extraParts.map((p) => ({
            criterionId: p.id,
            criterionName: p.name,
            category: 'Parte adicional',
            weight: p.maxPoints,
            score: doc006Points[p.id],
            maxScore: p.maxPoints,
            optionLabel: undefined,
            notes: doc006Notes[p.id]?.trim() || undefined,
          }))
        )
      : applicableCriteria.map((c) => {
          const state = activeScoresMap[c.id] || { score: 90, notes: '' };
          return {
            criterionId: c.id,
            criterionName: c.name,
            category: c.category,
            weight: c.weight ?? c.weightInitial ?? 20,
            score: state.score,
            notes: state.notes || undefined,
          };
        });

    // AAAA-MM-DD: así la base de datos nunca confunde el día con el mes
    const formattedDate = /^\d{4}-\d{2}-\d{2}$/.test(evaluationDateInput) ? evaluationDateInput : todayIso;

    // La próxima evaluación toca un año después de la fecha de ésta
    const nextDate = new Date(`${formattedDate}T12:00:00`);
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    const nextDueDateFormatted = nextDate.toLocaleDateString('es-CO');

    const supplierDocNumber =
      selectedDossier.basicInfo?.nit ||
      (selectedDossier.basicInfo as any)?.documentNumber ||
      (selectedDossier.basicInfo as any)?.identificationNumber ||
      'S/N';

    const saved = recordSupplierEvaluation({
      dossierId: selectedDossier.id,
      supplierName: selectedDossier.basicInfo?.companyName || 'Proveedor Registrado',
      supplierDoc: supplierDocNumber,
      fileNumber: selectedDossier.fileNumber || '',
      categoryName: selectedDossier.selectedCategory || 'General',
      evaluationType: evalType,
      annualCycleNumber: isAnnualEval ? selectedCycleNumber : undefined,
      periodYear: Number(formattedDate.slice(0, 4)),
      evaluationDate: formattedDate,
      evaluatorId: activeUser?.id || 'rev-1',
      evaluatorName: (isInitialDoc ? evaluatorNameInput.trim() : '') || activeUser?.name || 'Administrador',
      evaluatorRole: (isInitialDoc ? evaluatorPosition.trim() : '') || role,
      evaluatorSignature: signature || undefined,
      totalScore,
      concept: computedConcept,
      criteriaScores: scoresList,
      observations: generalObservations.trim() || undefined,
      hasImprovementPlan: isInitialDoc ? false : hasImprovementPlan,
      improvementPlanAction: !isInitialDoc && hasImprovementPlan ? improvementAction.trim() : undefined,
      improvementPlanDeadline: !isInitialDoc && hasImprovementPlan ? improvementDeadline : undefined,
      nextEvaluationDueDate: nextDueDateFormatted,
      status: 'COMPLETADA',
    });

    setIsSubmitting(false);
    if (onSuccess && saved?.id) onSuccess(saved);
    onClose();
  };

  const totalWeight = applicableCriteria.reduce((sum, c) => sum + (c.weight ?? c.weightInitial ?? 20), 0);
  const planForcedByConcept = computedConcept === 'CONDICIONAL_MEJORA';
  const planRequired = hasImprovementPlan || planForcedByConcept;

  // Resumen lateral
  const verdict: Verdict = isInitialDoc
    ? !doc006Complete
      ? {
          tone: 'pending',
          label: `Faltan ${initialCount - doc006Answered}`,
          hint: `${doc006Answered} de ${initialCount} criterios calificados`,
        }
      : computedConcept === 'CONFORME'
        ? { tone: 'ok', label: 'Aprobado', hint: `Cumple el mínimo de ${initialPassing} puntos` }
        : { tone: 'bad', label: 'No aprobado', hint: `Faltan ${initialPassing - doc006Total} puntos para el mínimo` }
    : computedConcept === 'SOBRESALIENTE'
      ? { tone: 'ok', label: 'Sobresaliente', hint: 'Apto con excelencia SIG' }
      : computedConcept === 'CONFORME'
        ? { tone: 'ok', label: 'Conforme', hint: 'Aprobado según los requisitos' }
        : computedConcept === 'CONDICIONAL_MEJORA'
          ? { tone: 'warn', label: 'Condicional', hint: 'Requiere plan de mejora' }
          : { tone: 'bad', label: 'No conforme', hint: 'Por debajo del mínimo exigido' };

  const summaryItems: SummaryItem[] = isInitialDoc
    ? [...DOC006_CRITERIA, ...extraParts].map((c) => ({ id: c.id, name: c.name, value: doc006Points[c.id] ?? null }))
    : applicableCriteria.map((c) => ({ id: c.id, name: c.name, value: activeScoresMap[c.id]?.score ?? 90 }));

  const summaryProps = {
    title: isInitialDoc ? 'Puntaje de la evaluación inicial' : 'Calificación ponderada',
    total: totalScore,
    max: isInitialDoc ? initialMax : 100,
    passing: isInitialDoc ? initialPassing : thresholds.conformeMin ?? 70,
    verdict,
    items: summaryItems,
    onJump: jumpTo,
  };

  const canSubmit = !isSubmitting && !!selectedDossier && (!isInitialDoc || doc006Complete);
  const blockedReason =
    isInitialDoc && !doc006Complete
      ? initialCount - doc006Answered === 1
        ? 'Falta calificar 1 criterio para poder registrar.'
        : `Faltan ${initialCount - doc006Answered} criterios por calificar para poder registrar.`
      : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050b1a]/75 backdrop-blur-sm p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="eval-form-title"
    >
      <div className="dark:bg-[#0c1426] bg-[#f4f8fc] rounded-[24px] border border-black/10 dark:border-white/10 shadow-2xl w-full max-w-6xl h-[94vh] flex flex-col overflow-hidden animate-fade-up">
        {/* Encabezado */}
        <div className="px-5 sm:px-7 py-4 bg-white dark:bg-[#0a1122] border-b border-black/[0.07] dark:border-white/10 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="w-11 h-11 rounded-xl bg-[#1d5fa8] text-white grid place-items-center shrink-0">
              <Award className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 id="eval-form-title" className="font-display text-lg sm:text-xl font-semibold tracking-tight text-[#0b1d3a] dark:text-white truncate">
                Calificar proveedor
              </h3>
              <p className="text-sm text-[#3a5274] dark:text-slate-400 truncate">
                {selectedDossier?.basicInfo?.companyName || selectedDossier?.basicInfo?.fullName || 'Seleccione un proveedor'}
                {selectedDossier?.fileNumber ? ` · ${selectedDossier.fileNumber}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-10 h-10 grid place-items-center rounded-xl text-[#3a5274] dark:text-slate-300 hover:bg-black/[0.06] dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row flex-1 min-h-0">
          {/* Columna principal: se desplaza */}
          <div className="flex-1 min-w-0 min-h-0 overflow-y-auto text-[#0b1d3a] dark:text-slate-100 text-sm">
            <div className="lg:hidden sticky top-0 z-10 px-4 pt-3 pb-2 bg-[#f4f8fc]/95 dark:bg-[#0c1426]/95 backdrop-blur-sm">
              <ScoreSummary variant="bar" {...summaryProps} />
            </div>
            <div className="p-4 sm:p-6 space-y-6">
              <SetupCard
                dossiers={allDossiers}
                selectedDossier={selectedDossier}
                onSelectDossier={setSelectedDossierId}
                supplierLocked={!!initialSupplier}
                evalType={evalType}
                onEvalType={setEvalType}
                isAnnual={isAnnualEval}
                isInitial={isInitialDoc}
                cycle={selectedCycleNumber}
                onCycle={setSelectedCycleNumber}
                previousAnnualCount={existingAnnualEvals.length}
                isSupplierActive={!!isSupplierActive}
                reviewerName={activeUser?.name || 'Revisor SIG'}
                dateValue={evaluationDateInput}
                todayIso={todayIso}
                onDate={setEvaluationDateInput}
              />

              {isInitialDoc ? (
                <>
                  <Doc006Section
                    points={doc006Points}
                    notes={doc006Notes}
                    onPick={(id, pts) => setDoc006Points((prev) => ({ ...prev, [id]: pts }))}
                    onNotes={(id, v) => setDoc006Notes((prev) => ({ ...prev, [id]: v }))}
                  />
                  <ExtraPartsSection
                    parts={extraParts}
                    points={doc006Points}
                    notes={doc006Notes}
                    onPoints={(id, pts) => {
                      const part = extraParts.find((x) => x.id === id);
                      const v = Math.max(0, Math.min(part?.maxPoints ?? 0, Math.round(Number.isFinite(pts) ? pts : 0)));
                      setDoc006Points((prev) => ({ ...prev, [id]: v }));
                    }}
                    onNotes={(id, v) => setDoc006Notes((prev) => ({ ...prev, [id]: v }))}
                  />
                </>
              ) : (
                <WeightedSection
                  criteria={applicableCriteria}
                  scores={activeScoresMap}
                  onScore={handleScoreChange}
                  onNotes={handleNotesChange}
                  totalWeight={totalWeight}
                />
              )}

              <ClosingSection
                isInitial={isInitialDoc}
                observations={generalObservations}
                onObservations={setGeneralObservations}
                evaluatorName={evaluatorNameInput}
                onEvaluatorName={setEvaluatorNameInput}
                evaluatorPosition={evaluatorPosition}
                onEvaluatorPosition={setEvaluatorPosition}
                planRequired={planRequired}
                planForcedByConcept={planForcedByConcept}
                onPlanToggle={setHasImprovementPlan}
                planAction={improvementAction}
                onPlanAction={setImprovementAction}
                planDeadline={improvementDeadline}
                onPlanDeadline={setImprovementDeadline}
              />
            </div>
          </div>

          {/* Escritorio: resumen y botones siempre a la vista */}
          <aside className="hidden lg:flex flex-col w-[340px] shrink-0 border-l border-black/[0.07] dark:border-white/10 bg-white dark:bg-[#0a1122] overflow-y-auto">
            <div className="p-5 flex-1">
              <ScoreSummary variant="panel" {...summaryProps} />
            </div>
            <div className="p-5 border-t border-black/[0.07] dark:border-white/10 shrink-0">
              <FormActions canSubmit={canSubmit} blockedReason={blockedReason} onClose={onClose} showNote />
            </div>
          </aside>

          {/* Celular: botones abajo */}
          <div className="lg:hidden p-3 bg-white dark:bg-[#0a1122] border-t border-black/[0.07] dark:border-white/10 shrink-0">
            <FormActions canSubmit={canSubmit} blockedReason={blockedReason} onClose={onClose} />
          </div>
        </form>
      </div>
      {signing && (
        <SignatureStep
          evaluatorName={(isInitialDoc ? evaluatorNameInput.trim() : '') || activeUser?.name || ''}
          userKey={activeUser?.id || ''}
          onCancel={() => setSigning(false)}
          onConfirm={(sig) => {
            setSigning(false);
            register(sig);
          }}
        />
      )}
    </div>
  );
};
