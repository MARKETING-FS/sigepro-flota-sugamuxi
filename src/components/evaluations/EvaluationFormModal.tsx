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
          bg: 'bg-blue-600 text-white border-blue-400',
        };
      case 'CONFORME':
        return {
          text: 'Conforme (Aprobado según Requisitos)',
          bg: 'bg-blue-500/20 text-blue-700 dark:text-cyan-300 border-blue-400/40',
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
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0b1329] text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-cyan-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Calificación y Evaluación de Proveedor
              </h3>
              <p className="text-xs text-slate-300">
                Sistema Integrado de Gestión (SIG) - Flota Sugamuxi S.A.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-100 text-sm">
            {/* 1. Supplier & Type Selection Bar */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select Supplier */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Proveedor a Calificar
                  </label>
                  <select
                    value={selectedDossierId}
                    onChange={(e) => setSelectedDossierId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#121c38] border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
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
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Tipo de Evaluación
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEvalType('INICIAL')}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer flex flex-col items-center justify-center ${
                        evalType === 'INICIAL'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                          : 'bg-white dark:bg-[#121c38] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>Evaluación Inicial</span>
                      <span className="text-[10px] font-normal opacity-90">(Admisión al Ingreso)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEvalType('ANUAL_1_ANO')}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer flex flex-col items-center justify-center ${
                        evalType === 'ANUAL_1_ANO' || (evalType as string) === 'ANUAL_PERIODICA'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                          : 'bg-white dark:bg-[#121c38] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>Evaluación Anual</span>
                      <span className="text-[10px] font-normal opacity-90">(Recurrente Cada Año)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Annual Cycle Selection if Annual Evaluation is chosen */}
              {(evalType === 'ANUAL_1_ANO' || (evalType as string) === 'ANUAL_PERIODICA') && (
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/60 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-blue-900 dark:text-cyan-300 flex items-center gap-1.5">
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
                          className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                            selectedCycleNumber === cycle
                              ? 'bg-blue-700 text-white shadow-xs'
                              : 'bg-white dark:bg-[#121c38] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Año {cycle}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-[11px] flex items-center justify-between text-slate-500 pt-1 border-t border-blue-100 dark:border-blue-900/40">
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
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
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
            <div className="p-4 bg-gradient-to-r from-blue-950 via-[#0b1329] to-slate-900 rounded-xl text-white border border-blue-900/60 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-cyan-400" />
                    <span>Calificación Ponderada en Tiempo Real</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Metodología SIG: Ponderación sobre 100 puntos según criterios parametrizados.
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono leading-none">
                      {totalScore}
                      <span className="text-sm font-semibold text-slate-400">/100</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${badgeInfo.bg}`}>
                    {badgeInfo.text}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    totalScore >= 85
                      ? 'bg-cyan-400'
                      : totalScore >= 70
                      ? 'bg-blue-500'
                      : 'bg-slate-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, totalScore))}%` }}
                />
              </div>
            </div>

            {/* 3. Evaluation Criteria Form */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>Criterios de Evaluación Parametrizados ({applicableCriteria.length})</span>
                </h4>
                <span className="text-[11px] text-slate-500">
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
                      className="p-4 bg-white dark:bg-[#121c38] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {criterion.name}
                            </h5>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                              {criterion.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 ml-7">
                            {criterion.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <span className="text-[11px] text-slate-500 font-medium">
                            Peso: <strong className="text-blue-600 dark:text-blue-400">{critWeight}%</strong>
                          </span>
                          <div className="w-16">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={state.score}
                              onChange={(e) => handleScoreChange(criterion.id, Number(e.target.value))}
                              className="w-full px-2 py-1 text-center font-mono font-bold text-xs bg-slate-50 dark:bg-[#090f20] border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>
                          <span className="text-xs text-slate-400">pts</span>
                        </div>
                      </div>

                      {/* Slider and Quick Grade Buttons */}
                      <div className="ml-0 sm:ml-7 pt-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={state.score}
                            onChange={(e) => handleScoreChange(criterion.id, Number(e.target.value))}
                            className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
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
                                className={`px-2 py-0.5 text-[10px] rounded font-semibold transition-colors cursor-pointer ${
                                  state.score === btn.score
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
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
                          className="w-full px-2.5 py-1 text-[11px] bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-md text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Improvement Plan & Observations */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Observaciones Generales y Dictamen del Revisor
                </label>
                <textarea
                  rows={3}
                  value={generalObservations}
                  onChange={(e) => setGeneralObservations(e.target.value)}
                  placeholder="Escriba aquí los comentarios institucionales, fortalezas y oportunidades identificadas en el proveedor..."
                  className="w-full px-3 py-2 bg-white dark:bg-[#121c38] border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
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
                        className="w-full px-3 py-1.5 bg-white dark:bg-[#121c38] border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600 focus:outline-none"
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
                        className="w-full px-3 py-1.5 bg-white dark:bg-[#121c38] border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-slate-100 dark:bg-[#090f20] border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                La evaluación se registrará en el expediente oficial y en la bitácora de trazabilidad SIG.
              </span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedDossier}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
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
