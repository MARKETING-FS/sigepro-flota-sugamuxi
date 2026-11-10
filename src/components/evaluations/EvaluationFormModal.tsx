import React, { useState, useMemo } from 'react';
import {
  X,
  Award,
  Calendar,
  Building2,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandSwoosh } from '../ui/BrandSwoosh';
import {
  SupplierDossier,
  SupplierEvaluationType,
  EvaluationCriterionScore,
  EvaluationConcept,
} from '../../types';

interface EvaluationFormModalProps {
  initialSupplier?: SupplierDossier | null;
  initialType?: SupplierEvaluationType;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EvaluationFormModal: React.FC<EvaluationFormModalProps> = ({
  initialSupplier,
  initialType = 'INICIAL',
  onClose,
  onSuccess,
}) => {
  const {
    allDossiers,
    activeUser,
    role,
    evaluationMethod,
    recordSupplierEvaluation,
  } = useApp();

  const [selectedDossierId, setSelectedDossierId] = useState<string>(
    initialSupplier?.id || (allDossiers.length > 0 ? allDossiers[0].id : '')
  );

  const [evalType, setEvalType] = useState<SupplierEvaluationType>(initialType);

  const selectedDossier = useMemo(() => {
    return allDossiers.find((d) => d.id === selectedDossierId) || (allDossiers.length > 0 ? allDossiers[0] : null);
  }, [allDossiers, selectedDossierId]);

  // Check if supplier is in active status
  const isSupplierActive =
    selectedDossier?.processStatus === 'PROVEEDOR_HABILITADO' ||
    selectedDossier?.processStatus === 'APROBADO';

  // Find previous annual evaluations for this supplier
  const existingAnnualEvals = useMemo(() => {
    if (!selectedDossier) return [];
    const evals = Array.isArray(selectedDossier.evaluations) ? selectedDossier.evaluations : [];
    const list = evals.filter(
      (e) =>
        e.evaluationType === 'ANUAL_1_ANO' ||
        (e.evaluationType as string) === 'ANUAL_PERIODICA'
    );
    if (selectedDossier.annualEvaluation && !list.some((e) => e.id === selectedDossier.annualEvaluation?.id)) {
      list.push(selectedDossier.annualEvaluation);
    }
    return list;
  }, [selectedDossier]);

  // Suggested annual cycle number: Año 1, Año 2, Año 3...
  const suggestedCycleNumber = existingAnnualEvals.length + 1;
  const [selectedCycleNumber, setSelectedCycleNumber] = useState<number>(suggestedCycleNumber);

  // Sync selected cycle when supplier or existing evaluations change
  React.useEffect(() => {
    setSelectedCycleNumber(suggestedCycleNumber);
  }, [suggestedCycleNumber, selectedDossierId]);

  // Filter criteria applicable to this evaluation type
  const applicableCriteria = useMemo(() => {
    const list = evaluationMethod?.criteria || [];
    const isAnnual =
      evalType === 'ANUAL_1_ANO' || (evalType as string) === 'ANUAL_PERIODICA';
    return list.filter(
      (c) =>
        c.isActive !== false &&
        (c.appliesTo === 'AMBOS' ||
          c.appliesTo === 'AMBAS' ||
          c.appliesTo === evalType ||
          (isAnnual &&
            (c.appliesTo === 'ANUAL_1_ANO' ||
              (c.appliesTo as string) === 'ANUAL_PERIODICA')))
    );
  }, [evaluationMethod?.criteria, evalType]);

  // Track scores for each criterion
  const [criterionScores, setCriterionScores] = useState<{
    [criterionId: string]: { score: number; notes: string };
  }>({});

  // Keep state synchronized if applicable criteria changes
  const activeScoresMap = useMemo(() => {
    const map: { [id: string]: { score: number; notes: string } } = {};
    applicableCriteria.forEach((c) => {
      map[c.id] = criterionScores[c.id] || { score: 90, notes: '' };
    });
    return map;
  }, [applicableCriteria, criterionScores]);

  // Global notes and improvement plan
  const [generalObservations, setGeneralObservations] = useState<string>('');
  const [hasImprovementPlan, setHasImprovementPlan] = useState<boolean>(false);
  const [improvementAction, setImprovementAction] = useState<string>('');
  const [improvementDeadline, setImprovementDeadline] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Total Score Calculation
  const totalScore = useMemo(() => {
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
  }, [applicableCriteria, activeScoresMap]);

  // Concept derivation based on configured thresholds
  const computedConcept = useMemo<EvaluationConcept>(() => {
    const thresholds = evaluationMethod?.thresholds || {
      sobresalienteMin: evaluationMethod?.excellentThreshold ?? 90,
      conformeMin: evaluationMethod?.initialPassingScore ?? 70,
      condicionalMin: evaluationMethod?.conditionalThreshold ?? 60,
    };
    if (totalScore >= (thresholds.sobresalienteMin ?? 90)) return 'SOBRESALIENTE';
    if (totalScore >= (thresholds.conformeMin ?? 70)) return 'CONFORME';
    if (totalScore >= (thresholds.condicionalMin ?? 60)) return 'CONDICIONAL_MEJORA';
    return 'NO_CONFORME';
  }, [totalScore, evaluationMethod]);

  // Calculate anniversary date (1 year after supplier creation)
  const supplierCreatedDate = selectedDossier?.createdAt
    ? new Date(selectedDossier.createdAt).toLocaleDateString('es-CO')
    : 'No registrada';

  const supplierAnniversaryDate = useMemo(() => {
    if (!selectedDossier?.createdAt) return 'Pendiente';
    try {
      const created = new Date(selectedDossier.createdAt);
      const nextYear = new Date(created);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      return nextYear.toLocaleDateString('es-CO');
    } catch {
      return '1 año después de la creación';
    }
  }, [selectedDossier?.createdAt]);

  const handleScoreChange = (critId: string, val: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    setCriterionScores((prev) => ({
      ...prev,
      [critId]: {
        score: clamped,
        notes: prev[critId]?.notes || '',
      },
    }));
  };

  const handleNotesChange = (critId: string, notes: string) => {
    setCriterionScores((prev) => ({
      ...prev,
      [critId]: {
        score: prev[critId]?.score ?? 90,
        notes,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDossier) return;

    setIsSubmitting(true);

    const scoresList: EvaluationCriterionScore[] = applicableCriteria.map((c) => {
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

    const nowIso = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('es-CO');

    // Calculate next due date (1 year later if initial, or 1 year after current if annual)
    const nextDate = new Date();
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    const nextDueDateFormatted = nextDate.toLocaleDateString('es-CO');

    const supplierDocNumber =
      selectedDossier.basicInfo?.nit ||
      (selectedDossier.basicInfo as any)?.documentNumber ||
      (selectedDossier.basicInfo as any)?.identificationNumber ||
      'S/N';

    const isAnnual =
      evalType === 'ANUAL_1_ANO' || (evalType as string) === 'ANUAL_PERIODICA';

    recordSupplierEvaluation({
      dossierId: selectedDossier.id,
      supplierName: selectedDossier.basicInfo?.companyName || 'Proveedor Registrado',
      supplierDoc: supplierDocNumber,
      fileNumber: selectedDossier.fileNumber || '',
      categoryName: selectedDossier.selectedCategory || 'General',
      evaluationType: evalType,
      annualCycleNumber: isAnnual ? selectedCycleNumber : undefined,
      periodYear: new Date().getFullYear(),
      evaluationDate: formattedDate,
      evaluatorId: activeUser?.id || 'rev-1',
      evaluatorName: activeUser?.name || (role === 'REVISOR' ? 'Ing. Carlos Mendoza' : 'Administrador General'),
      evaluatorRole: role,
      totalScore,
      concept: computedConcept,
      criteriaScores: scoresList,
      observations: generalObservations.trim() || undefined,
      hasImprovementPlan,
      improvementPlanAction: hasImprovementPlan ? improvementAction.trim() : undefined,
      improvementPlanDeadline: hasImprovementPlan ? improvementDeadline : undefined,
      nextEvaluationDueDate: nextDueDateFormatted,
      status: 'COMPLETADA',
    });

    setIsSubmitting(false);
    if (onSuccess) onSuccess();
    onClose();
  };

  const getConceptBadge = (concept: EvaluationConcept) => {
    switch (concept) {
      case 'SOBRESALIENTE':
        return { text: 'Sobresaliente', hint: 'Apto con excelencia SIG', bg: 'bg-white text-[#0b1d3a]' };
      case 'CONFORME':
        return { text: 'Conforme', hint: 'Aprobado según requisitos', bg: 'bg-white/90 text-[#0b1d3a]' };
      case 'CONDICIONAL_MEJORA':
        return { text: 'Condicional', hint: 'Requiere plan de mejora', bg: 'bg-[#69bdd7] text-[#0b1d3a]' };
      case 'NO_CONFORME':
      default:
        return { text: 'No conforme', hint: 'Bajo el umbral requerido', bg: 'bg-red-500 text-white' };
    }
  };

  const badgeInfo = getConceptBadge(computedConcept);
  const isAnnualEval = evalType === 'ANUAL_1_ANO' || (evalType as string) === 'ANUAL_PERIODICA';
  const totalWeight = applicableCriteria.reduce((sum, c) => sum + (c.weight ?? c.weightInitial ?? 20), 0);
  const planRequired = hasImprovementPlan || computedConcept === 'CONDICIONAL_MEJORA';

  const labelCls = 'text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2c84c4] dark:text-[#69bdd7]';
  const fieldCls =
    'w-full h-11 px-3.5 text-sm rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/10 text-[#0b1d3a] dark:text-white placeholder:text-[#6b84a3] focus:outline-none focus:border-[#2c84c4] focus:ring-2 focus:ring-[#2c84c4]/30';
  const cardCls = 'rounded-[22px] bg-white dark:bg-white/[0.04] border border-black/[0.07] dark:border-white/10 p-4 sm:p-5';
  const segOn = 'bg-gradient-action text-white shadow-glow';
  const segOff = 'bg-black/[0.04] dark:bg-white/[0.06] text-[#1c3354] dark:text-slate-200 hover:bg-[#2c84c4]/10';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050b1a]/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="dark:bg-[#0c1426] bg-[#f4f8fc] rounded-[28px] border border-black/10 dark:border-white/10 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-fade-up">
        {/* Encabezado */}
        <div className="relative overflow-hidden px-6 sm:px-8 py-5 bg-gradient-brand text-white flex items-center justify-between shrink-0">
          <BrandSwoosh className="absolute -right-10 -bottom-12 w-72 opacity-100" />
          <div className="relative flex items-center gap-4 min-w-0">
            <span className="w-12 h-12 rounded-2xl bg-white/15 ring-1 ring-white/30 grid place-items-center shrink-0">
              <Award className="w-6 h-6" />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-xl font-semibold tracking-tight truncate">Calificación de proveedor</h3>
              <p className="text-sm text-white/75 truncate">Sistema Integrado de Gestión (SIG) · Flota Sugamuxi S.A.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="relative w-10 h-10 grid place-items-center rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 sm:p-7 overflow-y-auto space-y-5 flex-1 text-[#0b1d3a] dark:text-slate-100 text-sm">
            {/* 1. Proveedor y tipo */}
            <section className={`${cardCls} space-y-5`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={`${labelCls} flex items-center gap-1.5 mb-2`}>
                    <Building2 className="w-3.5 h-3.5" /> Proveedor a calificar
                  </label>
                  <select
                    value={selectedDossierId}
                    onChange={(e) => setSelectedDossierId(e.target.value)}
                    className={`${fieldCls} font-semibold cursor-pointer`}
                    disabled={!!initialSupplier}
                  >
                    {allDossiers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.basicInfo?.companyName || 'Proveedor'} - {d.basicInfo?.nit || (d.basicInfo as any)?.documentNumber || (d.basicInfo as any)?.identificationNumber || 'S/N'} ({d.fileNumber || 'Sin Radicado'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`${labelCls} flex items-center gap-1.5 mb-2`}>
                    <Clock className="w-3.5 h-3.5" /> Tipo de evaluación
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05]">
                    {[
                      { on: evalType === 'INICIAL', set: () => setEvalType('INICIAL'), title: 'Inicial', sub: 'Admisión al ingreso' },
                      { on: isAnnualEval, set: () => setEvalType('ANUAL_1_ANO'), title: 'Anual', sub: 'Recurrente cada año' },
                    ].map((o) => (
                      <button
                        key={o.title}
                        type="button"
                        onClick={o.set}
                        aria-pressed={o.on}
                        className={`h-12 rounded-xl flex flex-col items-center justify-center leading-tight transition-all cursor-pointer ${o.on ? segOn : 'text-[#1c3354] dark:text-slate-200 hover:bg-[#2c84c4]/10'}`}
                      >
                        <span className="text-sm font-semibold">{o.title}</span>
                        <span className={`text-[10.5px] ${o.on ? 'text-white/85' : 'text-[#6b84a3]'}`}>{o.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {isAnnualEval && (
                <div className="rounded-2xl bg-[#2c84c4]/[0.07] dark:bg-[#2c84c4]/10 border border-[#2c84c4]/20 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-display text-sm font-semibold text-[#0b1d3a] dark:text-white flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#2c84c4] dark:text-[#69bdd7]" /> Ciclo anual a calificar
                      </div>
                      <p className="text-xs text-[#3a5274] dark:text-slate-400 mt-0.5">
                        Los proveedores en estado activo se evalúan periódicamente <strong className="text-[#1d5fa8] dark:text-[#69bdd7]">todos los años</strong>.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((cycle) => (
                        <button
                          key={cycle}
                          type="button"
                          onClick={() => setSelectedCycleNumber(cycle)}
                          className={`h-9 px-3.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${selectedCycleNumber === cycle ? segOn : segOff}`}
                        >
                          Año {cycle}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs flex items-center justify-between text-[#3a5274] dark:text-slate-400 pt-2 border-t border-[#2c84c4]/15">
                    <span>Evaluaciones anuales previas: <strong className="text-[#0b1d3a] dark:text-white font-mono">{existingAnnualEvals.length}</strong></span>
                    <span>Calificando: <strong className="text-[#0b1d3a] dark:text-white">Año {selectedCycleNumber}</strong></span>
                  </div>
                </div>
              )}

              {selectedDossier && (
                <div className="pt-4 border-t border-black/[0.07] dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[#6b84a3] block text-[11px] mb-1">Estado del proveedor</span>
                    <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-[10px] font-bold ${isSupplierActive ? 'bg-gradient-action text-white' : 'bg-black/[0.06] dark:bg-white/10 text-[#1c3354] dark:text-slate-200'}`}>
                      {isSupplierActive ? 'ACTIVO / HABILITADO' : selectedDossier.processStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6b84a3] block text-[11px] mb-1">Fecha de creación</span>
                    <span className="font-semibold flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#2c84c4] dark:text-[#69bdd7]" />{supplierCreatedDate}</span>
                  </div>
                  <div>
                    <span className="text-[#6b84a3] block text-[11px] mb-1">
                      {evalType === 'INICIAL' ? 'Vencimiento anual (Año 1)' : `Próximo ciclo (Año ${selectedCycleNumber + 1})`}
                    </span>
                    <span className="font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#2c84c4] dark:text-[#69bdd7]" />{supplierAnniversaryDate}</span>
                  </div>
                  <div>
                    <span className="text-[#6b84a3] block text-[11px] mb-1">Revisor asignado</span>
                    <span className="font-semibold flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-[#2c84c4] dark:text-[#69bdd7]" />{activeUser?.name || 'Revisor SIG'}</span>
                  </div>
                </div>
              )}
            </section>

            {/* 2. Calificación en tiempo real */}
            <section className="relative overflow-hidden rounded-[24px] bg-gradient-brand text-white p-5 sm:p-6 shadow-glow">
              <BrandSwoosh className="absolute -right-10 -bottom-16 w-[60%] opacity-100" />
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75 flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> Calificación ponderada en tiempo real
                  </div>
                  <p className="text-xs text-white/70 mt-1 max-w-sm">Ponderación sobre 100 puntos según los criterios parametrizados.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="font-display text-5xl font-semibold leading-none tabular-nums">
                    {totalScore}<span className="text-base font-medium text-white/70">/100</span>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex h-8 px-3.5 items-center rounded-full text-xs font-bold ${badgeInfo.bg}`}>{badgeInfo.text}</span>
                    <div className="text-[11px] text-white/75 mt-1">{badgeInfo.hint}</div>
                  </div>
                </div>
              </div>
              <div className="relative w-full bg-white/20 rounded-full h-2.5 mt-5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, totalScore))}%` }}
                />
              </div>
            </section>

            {/* 3. Criterios */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className={labelCls}>Criterios de evaluación parametrizados ({applicableCriteria.length})</h4>
                <span className={`text-xs font-semibold ${totalWeight === 100 ? 'text-[#2c84c4] dark:text-[#69bdd7]' : 'text-red-500'}`}>Peso total: {totalWeight}%</span>
              </div>

              <div className="space-y-3">
                {applicableCriteria.map((criterion, idx) => {
                  const state = activeScoresMap[criterion.id] || { score: 90, notes: '' };
                  const critWeight = criterion.weight ?? criterion.weightInitial ?? 20;
                  return (
                    <article key={criterion.id} className={`${cardCls} hover:border-[#2c84c4]/50 transition-colors`}>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex gap-3 min-w-0">
                          <span className="w-10 h-10 rounded-2xl bg-gradient-action text-white font-display font-semibold grid place-items-center shrink-0 shadow-glow">{idx + 1}</span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="font-display text-base font-semibold text-[#0b1d3a] dark:text-white">{criterion.name}</h5>
                              <span className="text-[10px] h-5 px-2 inline-flex items-center rounded-full bg-[#69bdd7]/20 text-[#0e6d8a] dark:text-[#69bdd7] font-semibold">{criterion.category}</span>
                            </div>
                            <p className="text-[13px] text-[#3a5274] dark:text-slate-400 mt-1 leading-relaxed">{criterion.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-start shrink-0">
                          <span className="h-8 px-3 inline-flex items-center rounded-full bg-[#2c84c4]/12 dark:bg-[#2c84c4]/25 text-xs font-semibold text-[#1d5fa8] dark:text-[#69bdd7]">Peso {critWeight}%</span>
                          <div className="flex items-baseline gap-1.5">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={state.score}
                              onChange={(e) => handleScoreChange(criterion.id, Number(e.target.value))}
                              aria-label={`Puntaje de ${criterion.name}`}
                              className="w-[72px] h-12 text-center font-display text-xl font-semibold tabular-nums rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/10 text-[#0b1d3a] dark:text-white focus:outline-none focus:border-[#2c84c4] focus:ring-2 focus:ring-[#2c84c4]/30"
                            />
                            <span className="text-xs text-[#6b84a3]">pts</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 sm:pl-[52px] space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={state.score}
                            onChange={(e) => handleScoreChange(criterion.id, Number(e.target.value))}
                            aria-label={`Deslizador de ${criterion.name}`}
                            className="flex-1 accent-[#2c84c4] cursor-pointer h-1.5"
                          />
                          <div className="flex items-center gap-1.5 shrink-0">
                            {[
                              { score: 100, title: 'Excelente' },
                              { score: 85, title: 'Bueno' },
                              { score: 70, title: 'Aceptable' },
                              { score: 50, title: 'Deficiente' },
                            ].map((btn) => (
                              <button
                                key={btn.score}
                                type="button"
                                onClick={() => handleScoreChange(criterion.id, btn.score)}
                                title={btn.title}
                                className={`h-9 min-w-[44px] px-3 text-xs rounded-xl font-semibold transition-all cursor-pointer ${state.score === btn.score ? segOn : segOff}`}
                              >
                                {btn.score}
                              </button>
                            ))}
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Observación técnica o justificación para este criterio (opcional)"
                          value={state.notes}
                          onChange={(e) => handleNotesChange(criterion.id, e.target.value)}
                          className={fieldCls}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* 4. Observaciones y plan de mejora */}
            <section className={`${cardCls} space-y-5`}>
              <div>
                <label className={`${labelCls} block mb-2`}>Observaciones generales y dictamen del revisor</label>
                <textarea
                  rows={3}
                  value={generalObservations}
                  onChange={(e) => setGeneralObservations(e.target.value)}
                  placeholder="Comentarios institucionales, fortalezas y oportunidades identificadas en el proveedor…"
                  className="w-full px-3.5 py-3 text-sm rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/10 text-[#0b1d3a] dark:text-white placeholder:text-[#6b84a3] focus:outline-none focus:border-[#2c84c4] focus:ring-2 focus:ring-[#2c84c4]/30"
                />
              </div>

              <div className="pt-4 border-t border-black/[0.07] dark:border-white/10 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label htmlFor="planMejoraCheck" className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      id="planMejoraCheck"
                      checked={planRequired}
                      onChange={(e) => setHasImprovementPlan(e.target.checked)}
                      className="sr-only peer"
                    />
                    <span className={`w-5 h-5 rounded-md grid place-items-center border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#2c84c4]/50 ${planRequired ? 'bg-gradient-action border-transparent text-white' : 'border-[#6b84a3]/60'}`}>
                      {planRequired && <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={3} />}
                    </span>
                    <span className="text-sm font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-[#2c84c4] dark:text-[#69bdd7]" />
                      ¿Exigir plan de acción / mejora continua al proveedor?
                    </span>
                  </label>
                  {computedConcept === 'CONDICIONAL_MEJORA' && (
                    <span className="h-7 px-3 inline-flex items-center rounded-full bg-[#69bdd7]/25 text-[#0e6d8a] dark:text-[#69bdd7] text-[11px] font-semibold">
                      Requerido por calificación condicional
                    </span>
                  )}
                </div>

                {planRequired && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1.5">Acción correctiva o compromiso exigido</label>
                      <input
                        type="text"
                        value={improvementAction}
                        onChange={(e) => setImprovementAction(e.target.value)}
                        placeholder="Ej: remitir actualización de póliza RCE y certificación técnica ISO 9001"
                        className={fieldCls}
                        required={planRequired}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Fecha límite de entrega</label>
                      <input
                        type="date"
                        value={improvementDeadline}
                        onChange={(e) => setImprovementDeadline(e.target.value)}
                        className={`${fieldCls} cursor-pointer`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Pie */}
          <div className="px-5 sm:px-7 py-4 bg-white dark:bg-[#0a1122] border-t border-black/[0.07] dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-[#3a5274] dark:text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#2c84c4] dark:text-[#69bdd7] shrink-0" />
              <span>La evaluación se registra en el expediente oficial y en la bitácora de trazabilidad SIG.</span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="h-11 px-5 rounded-xl border border-[#2c84c4]/35 text-[#1d5fa8] dark:text-[#69bdd7] hover:bg-[#2c84c4]/10 text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedDossier}
                className="h-11 px-6 rounded-xl bg-gradient-action text-white text-sm font-semibold shadow-glow hover:brightness-110 disabled:opacity-50 transition cursor-pointer inline-flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Registrar calificación oficial</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
