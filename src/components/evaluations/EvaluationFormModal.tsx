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
        return {
          text: 'Sobresaliente (Apto con Excelencia SIG)',
          bg: 'bg-white/15 text-white border-white/40',
        };
      case 'CONFORME':
        return {
          text: 'Conforme (Aprobado según Requisitos)',
          bg: 'bg-white/12 text-white border-white/30',
        };
      case 'CONDICIONAL_MEJORA':
        return {
          text: 'Condicional (Requiere Plan de Mejora)',
          bg: 'bg-slate-700 text-slate-100 border-slate-500',
        };
      case 'NO_CONFORME':
      default:
        return {
          text: 'No Conforme (Bajo Umbral Requerido)',
          bg: 'bg-slate-900 text-white border-slate-700',
        };
    }
  };

  const badgeInfo = getConceptBadge(computedConcept) || {
    text: 'En Evaluación',
    bg: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#f3f7fc] dark:bg-[#07142f] rounded-[26px] border border-[#d5e2f1] dark:border-[#1e3a6e] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-7 py-5 bg-gradient-to-r from-[#0a2a5e] to-[#134a8f] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/12 ring-1 ring-white/25 flex items-center justify-center text-white">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Calificación y Evaluación de Proveedor
              </h3>
              <p className="text-[13px] text-[#bcd2ea]">
                Sistema Integrado de Gestión (SIG) - Flota Sugamuxi S.A.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#bcd2ea] hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 sm:p-7 overflow-y-auto space-y-5 flex-1 text-[#0b1d3a] dark:text-slate-100 text-sm">
            {/* 1. Supplier & Type Selection Bar */}
            <div className="bg-white dark:bg-[#0b1f4a] p-5 rounded-2xl border border-[#d5e2f1] dark:border-[#1e3a6e] shadow-[0_8px_22px_-16px_rgba(15,61,117,0.35)] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select Supplier */}
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wide text-[#1d3b63] dark:text-[#9fc2ee] mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Proveedor a Calificar
                  </label>
                  <select
                    value={selectedDossierId}
                    onChange={(e) => setSelectedDossierId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#f1f6fc] dark:bg-[#0a1c44] border border-[#d5e2f1] dark:border-[#1e3a6e] rounded-xl text-sm font-semibold text-[#0b1d3a] dark:text-white focus:ring-2 focus:ring-[#2b78b3]/40 focus:outline-none cursor-pointer"
                    disabled={!!initialSupplier}
                  >
                    {allDossiers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.basicInfo?.companyName || 'Proveedor'} - {d.basicInfo?.nit || (d.basicInfo as any)?.documentNumber || (d.basicInfo as any)?.identificationNumber || 'S/N'} ({d.fileNumber || 'Sin Radicado'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Evaluation Event Selector: Inicial vs Anual */}
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wide text-[#1d3b63] dark:text-[#9fc2ee] mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Tipo de Evaluación
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEvalType('INICIAL')}
                      className={`px-3 py-3 rounded-xl text-sm font-bold border transition-all text-center cursor-pointer flex flex-col items-center justify-center ${
                        evalType === 'INICIAL'
                          ? 'bg-[#0f3d75] text-white border-[#0f3d75] dark:bg-[#1b4f94] dark:border-[#3d78c4] shadow-sm'
                          : 'bg-[#f1f6fc] dark:bg-[#0a1c44] text-[#1d3b63] dark:text-slate-200 border-[#d5e2f1] dark:border-[#1e3a6e] hover:bg-[#e6eef8] dark:hover:bg-[#0f2a5c]'
                      }`}
                    >
                      <span>Evaluación Inicial</span>
                      <span className="text-[11px] font-medium opacity-85">(Admisión al Ingreso)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEvalType('ANUAL_1_ANO')}
                      className={`px-3 py-3 rounded-xl text-sm font-bold border transition-all text-center cursor-pointer flex flex-col items-center justify-center ${
                        evalType === 'ANUAL_1_ANO' || (evalType as string) === 'ANUAL_PERIODICA'
                          ? 'bg-[#0f3d75] text-white border-[#0f3d75] dark:bg-[#1b4f94] dark:border-[#3d78c4] shadow-sm'
                          : 'bg-[#f1f6fc] dark:bg-[#0a1c44] text-[#1d3b63] dark:text-slate-200 border-[#d5e2f1] dark:border-[#1e3a6e] hover:bg-[#e6eef8] dark:hover:bg-[#0f2a5c]'
                      }`}
                    >
                      <span>Evaluación Anual</span>
                      <span className="text-[11px] font-medium opacity-85">(Recurrente Cada Año)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Annual Cycle Selection if Annual Evaluation is chosen */}
              {(evalType === 'ANUAL_1_ANO' || (evalType as string) === 'ANUAL_PERIODICA') && (
                <div className="p-4 bg-[#eaf2fb] dark:bg-[#0a1c44] rounded-xl border border-[#cfe0f2] dark:border-[#1e3a6e] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[13px] font-bold text-[#0f3d75] dark:text-[#9fc2ee] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                        Ciclo Anual a Calificar (Periodicidad Obligatoria Anual)
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Los proveedores en <strong className="text-slate-800 dark:text-slate-200">estado activo</strong> deben evaluarse de manera periódica <strong className="text-blue-700 dark:text-cyan-300">todos los años</strong>.
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((cycle) => (
                        <button
                          key={cycle}
                          type="button"
                          onClick={() => setSelectedCycleNumber(cycle)}
                          className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors cursor-pointer ${
                            selectedCycleNumber === cycle
                              ? 'bg-[#0f3d75] text-white shadow-sm dark:bg-[#1b4f94]'
                              : 'bg-white dark:bg-[#0b1f4a] text-[#1d3b63] dark:text-slate-200 border border-[#cfe0f2] dark:border-[#1e3a6e] hover:bg-[#f1f6fc]'
                          }`}
                        >
                          Año {cycle}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-[11px] flex items-center justify-between text-[#5d7392] dark:text-slate-400 pt-1 border-t border-blue-100 dark:border-blue-900/40">
                    <span>
                      Evaluaciones anuales previas registradas:{' '}
                      <strong className="text-blue-900 dark:text-cyan-300 font-mono">
                        {existingAnnualEvals.length}
                      </strong>
                    </span>
                    <span className="text-blue-900 dark:text-cyan-300 font-medium">
                      Calificando ciclo: <strong>Año {selectedCycleNumber}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Supplier Context Details */}
              {selectedDossier && (
                <div className="pt-4 border-t border-[#e1e9f3] dark:border-[#1e3a6e] grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Estado Proveedor:</span>
                    <span
                      className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] mt-0.5 ${
                        isSupplierActive
                          ? 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 border border-blue-300 dark:border-blue-800'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSupplierActive ? '● ACTIVO / HABILITADO' : `● ${selectedDossier.processStatus}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Fecha Creación:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-500" />
                      {supplierCreatedDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                      {evalType === 'INICIAL' ? 'Vencimiento Anual (Año 1):' : `Próximo Ciclo Anual (Año ${selectedCycleNumber + 1}):`}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-500" />
                      {supplierAnniversaryDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Revisor Asignado:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
                      {activeUser?.name || 'Revisor SIG'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Real-time Score Preview Card */}
            <div className="p-5 bg-gradient-to-r from-[#0a2a5e] to-[#0f3d75] rounded-2xl text-white shadow-[0_14px_28px_-18px_rgba(10,42,94,0.9)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[12px] uppercase tracking-wider text-[#bcd8f7] font-bold flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#bcd8f7]" />
                    <span>Calificación Ponderada en Tiempo Real</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Metodología SIG: Ponderación sobre 100 puntos según criterios parametrizados.
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-3xl sm:text-4xl font-black text-white font-mono leading-none">
                      {totalScore}
                      <span className="text-sm font-semibold text-[#5d7392] dark:text-slate-400">/100</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${badgeInfo.bg}`}>
                    {badgeInfo.text}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/15 rounded-full h-2.5 mt-4 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    totalScore >= 85
                      ? 'bg-[#7cc4ff]'
                      : totalScore >= 70
                      ? 'bg-[#5a9be0]'
                      : 'bg-[#8aa3c4]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, totalScore))}%` }}
                />
              </div>
            </div>

            {/* 3. Evaluation Criteria Form */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[13px] font-bold uppercase tracking-wide text-[#0f3d75] dark:text-[#9fc2ee] flex items-center gap-1.5">
                  <span>Criterios de Evaluación Parametrizados ({applicableCriteria.length})</span>
                </h4>
                <span className="text-[11px] text-[#5d7392] dark:text-slate-400">
                  Total Peso: {applicableCriteria.reduce((sum, c) => sum + (c.weight ?? c.weightInitial ?? 20), 0)}%
                </span>
              </div>

              <div className="space-y-3">
                {applicableCriteria.map((criterion, idx) => {
                  const state = activeScoresMap[criterion.id] || { score: 90, notes: '' };
                  const critWeight = criterion.weight ?? criterion.weightInitial ?? 20;
                  return (
                    <div
                      key={criterion.id}
                      className="p-5 bg-white dark:bg-[#0b1f4a] rounded-2xl border border-[#d5e2f1] dark:border-[#1e3a6e] shadow-[0_8px_22px_-16px_rgba(15,61,117,0.35)] hover:border-[#2b78b3] dark:hover:border-[#3d78c4] transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-xl bg-[#e1ecf8] dark:bg-[#123267] text-[#0f3d75] dark:text-white text-sm font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <h5 className="text-[15px] font-bold text-[#0b1d3a] dark:text-white">
                              {criterion.name}
                            </h5>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                              {criterion.category}
                            </span>
                          </div>
                          <p className="text-[12.5px] text-[#4b6485] dark:text-slate-300 mt-1 ml-10">
                            {criterion.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <span className="text-[11px] text-[#5d7392] dark:text-slate-400 font-medium">
                            Peso: <strong className="text-blue-600 dark:text-blue-400">{critWeight}%</strong>
                          </span>
                          <div className="w-16">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={state.score}
                              onChange={(e) => handleScoreChange(criterion.id, Number(e.target.value))}
                              className="w-full px-2 py-1.5 text-center font-mono font-bold text-sm bg-[#f1f6fc] dark:bg-[#0a1c44] border border-[#d5e2f1] dark:border-[#1e3a6e] rounded-lg text-[#0b1d3a] dark:text-white focus:ring-2 focus:ring-[#2b78b3]/40 focus:outline-none"
                            />
                          </div>
                          <span className="text-xs text-[#5d7392] dark:text-slate-400">pts</span>
                        </div>
                      </div>

                      {/* Slider and Quick Grade Buttons */}
                      <div className="ml-0 sm:ml-10 pt-2 space-y-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={state.score}
                            onChange={(e) => handleScoreChange(criterion.id, Number(e.target.value))}
                            className="w-full accent-[#1d5fa8] cursor-pointer h-1.5 rounded-lg"
                          />
                          <div className="flex items-center gap-1 shrink-0">
                            {[
                              { label: '100', score: 100, title: 'Excelente' },
                              { label: '85', score: 85, title: 'Bueno' },
                              { label: '70', score: 70, title: 'Aceptable' },
                              { label: '50', score: 50, title: 'Deficiente' },
                            ].map((btn) => (
                              <button
                                key={btn.score}
                                type="button"
                                onClick={() => handleScoreChange(criterion.id, btn.score)}
                                className={`px-2.5 py-1 text-[11px] rounded-lg font-bold transition-colors cursor-pointer ${
                                  state.score === btn.score
                                    ? 'bg-[#0f3d75] text-white dark:bg-[#1b4f94]'
                                    : 'bg-[#e6eef8] dark:bg-[#123267] text-[#1d3b63] dark:text-slate-200 hover:bg-[#d8e5f5]'
                                }`}
                                title={btn.title}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Criterion Specific Note */}
                        <input
                          type="text"
                          placeholder="Observación técnica o justificación para este criterio (opcional)..."
                          value={state.notes}
                          onChange={(e) => handleNotesChange(criterion.id, e.target.value)}
                          className="w-full px-3 py-2 text-[12.5px] bg-[#f1f6fc] dark:bg-[#0a1c44] border border-[#d5e2f1] dark:border-[#1e3a6e] rounded-xl text-[#0b1d3a] dark:text-slate-100 placeholder:text-[#7b90ab] focus:outline-none focus:ring-2 focus:ring-[#2b78b3]/40"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Improvement Plan & Observations */}
            <div className="p-5 bg-white dark:bg-[#0b1f4a] rounded-2xl border border-[#d5e2f1] dark:border-[#1e3a6e] shadow-[0_8px_22px_-16px_rgba(15,61,117,0.35)] space-y-4">
              <div>
                <label className="block text-[13px] font-bold uppercase tracking-wide text-[#0f3d75] dark:text-[#9fc2ee] mb-2">
                  Observaciones Generales y Dictamen del Revisor
                </label>
                <textarea
                  rows={3}
                  value={generalObservations}
                  onChange={(e) => setGeneralObservations(e.target.value)}
                  placeholder="Escriba aquí los comentarios institucionales, fortalezas y oportunidades identificadas en el proveedor..."
                  className="w-full px-3.5 py-2.5 bg-[#f1f6fc] dark:bg-[#0a1c44] border border-[#d5e2f1] dark:border-[#1e3a6e] rounded-xl text-sm text-[#0b1d3a] dark:text-slate-100 placeholder:text-[#7b90ab] focus:ring-2 focus:ring-[#2b78b3]/40 focus:outline-none"
                />
              </div>

              {/* Improvement Plan Toggle */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="planMejoraCheck"
                      checked={hasImprovementPlan || computedConcept === 'CONDICIONAL_MEJORA'}
                      onChange={(e) => setHasImprovementPlan(e.target.checked)}
                      className="w-4 h-4 text-[#1d5fa8] dark:text-[#69bdd7] rounded border-black/10 dark:border-white/10 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="planMejoraCheck" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                      ¿Exigir Plan de Acción / Mejora Continua al Proveedor?
                    </label>
                  </div>
                  {computedConcept === 'CONDICIONAL_MEJORA' && (
                    <span className="text-[10px] text-slate-800 dark:text-slate-200 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                      Requerido por Calificación Condicional
                    </span>
                  )}
                </div>

                {(hasImprovementPlan || computedConcept === 'CONDICIONAL_MEJORA') && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Acción Correctiva o Compromiso Exigido:
                      </label>
                      <input
                        type="text"
                        value={improvementAction}
                        onChange={(e) => setImprovementAction(e.target.value)}
                        placeholder="Ej: Remitir actualización de póliza RCE y certificación técnica ISO 9001..."
                        className="w-full px-3.5 py-2.5 bg-[#f1f6fc] dark:bg-[#0a1c44] border border-[#d5e2f1] dark:border-[#1e3a6e] rounded-xl text-sm text-[#0b1d3a] dark:text-slate-100 placeholder:text-[#7b90ab] focus:ring-2 focus:ring-[#2b78b3]/40 focus:outline-none"
                        required={hasImprovementPlan || computedConcept === 'CONDICIONAL_MEJORA'}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Fecha Límite de Entrega:
                      </label>
                      <input
                        type="date"
                        value={improvementDeadline}
                        onChange={(e) => setImprovementDeadline(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#f1f6fc] dark:bg-[#0a1c44] border border-[#d5e2f1] dark:border-[#1e3a6e] rounded-xl text-sm text-[#0b1d3a] dark:text-slate-100 placeholder:text-[#7b90ab] focus:ring-2 focus:ring-[#2b78b3]/40 focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-7 py-4 bg-white dark:bg-[#061330] border-t border-[#d5e2f1] dark:border-[#1e3a6e] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#1d5fa8] dark:text-[#69bdd7] shrink-0" />
              <span>
                La evaluación se registrará en el expediente oficial y en la bitácora de trazabilidad SIG.
              </span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="h-11 px-5 bg-[#e6eef8] dark:bg-[#123267] hover:bg-[#d8e5f5] dark:hover:bg-[#1a3f7a] text-[#0f3d75] dark:text-white rounded-xl text-sm font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedDossier}
                className="h-11 px-6 bg-[#0f3d75] hover:bg-[#0b2f5c] dark:bg-[#1b4f94] dark:hover:bg-[#2259a6] disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Registrar Calificación Oficial</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
