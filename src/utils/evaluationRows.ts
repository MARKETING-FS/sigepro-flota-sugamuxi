import { SupplierDossier, SupplierEvaluation } from '../types';

export type AnnualEvaluationStatus =
  | 'AL_DIA'
  | 'PROXIMA_VENCER'
  | 'VENCIDA_REQUIERE_EVAL'
  | 'NO_APLICA_INACTIVO'
  | 'PENDIENTE_HABILITACION';

export interface EvaluationRow {
  dossier: SupplierDossier;
  isSupplierActive: boolean;
  initialEval: SupplierEvaluation | null;
  annualEvals: SupplierEvaluation[];
  latestAnnualEval: SupplierEvaluation | null;
  completedAnnualCycles: number;
  nextCycleNumber: number;
  createdDate: Date;
  annualDueDate: Date;
  diffDays: number;
  annualStatus: AnnualEvaluationStatus;
}

/**
 * Estado de evaluación inicial y anual de un proveedor.
 * Movido sin cambios desde SupplierEvaluationsView para usarlo también en el Resumen.
 */
export function buildEvaluationRow(dossier: SupplierDossier, now: Date = new Date()): EvaluationRow {
  // 1. Initial Evaluation check
  const evals = Array.isArray(dossier.evaluations) ? dossier.evaluations : [];
  const initialEval =
    evals.find((e) => e.evaluationType === 'INICIAL') ||
    dossier.initialEvaluation ||
    null;

  // 2. All Annual Evaluations history (evaluación recurrente todos los años)
  const annualEvals = evals.filter(
    (e) =>
      e.evaluationType === 'ANUAL_1_ANO' ||
      (e.evaluationType as string) === 'ANUAL_PERIODICA'
  );
  if (
    dossier.annualEvaluation &&
    !annualEvals.some((e) => e.id === dossier.annualEvaluation?.id)
  ) {
    annualEvals.push(dossier.annualEvaluation);
  }

  // Sort newest evaluation first
  annualEvals.sort((a, b) => {
    const timeA = new Date(a.evaluationDate || a.createdAt).getTime();
    const timeB = new Date(b.evaluationDate || b.createdAt).getTime();
    return timeB - timeA;
  });

  const latestAnnualEval = annualEvals[0] || null;
  const completedAnnualCycles = annualEvals.length;
  const nextCycleNumber = completedAnnualCycles + 1;

  // 3. Active Status check:
  // "Ten en cuenta que la evaluación anual en caso de que el proveedor este en estado activo se debera realizar todos los años."
  const isSupplierActive =
    dossier.processStatus === 'PROVEEDOR_HABILITADO' ||
    dossier.processStatus === 'APROBADO';
  const isRejected = dossier.processStatus === 'RECHAZADO';

  // 4. Creation date and Base date for annual calculation
  let createdDate: Date;
  try {
    createdDate = dossier.createdAt ? new Date(dossier.createdAt) : new Date('2025-06-01');
  } catch {
    createdDate = new Date('2025-06-01');
  }

  // 5. Calculate next annual due date:
  // If the active supplier has a previous annual evaluation, next evaluation is due 1 year after the last evaluation.
  // If no annual evaluation has been done yet, it is due 1 year after creation date.
  let annualDueDate: Date;
  if (latestAnnualEval) {
    let baseDate: Date;
    try {
      if (latestAnnualEval.evaluationDate && latestAnnualEval.evaluationDate.includes('/')) {
        const parts = latestAnnualEval.evaluationDate.split('/');
        baseDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      } else {
        baseDate = new Date(latestAnnualEval.evaluationDate || latestAnnualEval.createdAt);
      }
      if (isNaN(baseDate.getTime())) baseDate = new Date(latestAnnualEval.createdAt || createdDate);
    } catch {
      baseDate = createdDate;
    }
    annualDueDate = new Date(baseDate);
    annualDueDate.setFullYear(annualDueDate.getFullYear() + 1);
  } else {
    annualDueDate = new Date(createdDate);
    annualDueDate.setFullYear(annualDueDate.getFullYear() + 1);
  }

  const diffTime = annualDueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Status classification
  let annualStatus:
    | 'AL_DIA'
    | 'PROXIMA_VENCER'
    | 'VENCIDA_REQUIERE_EVAL'
    | 'NO_APLICA_INACTIVO'
    | 'PENDIENTE_HABILITACION';

  if (!isSupplierActive) {
    if (isRejected) {
      annualStatus = 'NO_APLICA_INACTIVO';
    } else {
      annualStatus = 'PENDIENTE_HABILITACION';
    }
  } else {
    // Active supplier: annual evaluation required every year!
    if (diffDays < 0) {
      annualStatus = 'VENCIDA_REQUIERE_EVAL';
    } else if (diffDays <= 30) {
      annualStatus = 'PROXIMA_VENCER';
    } else {
      annualStatus = 'AL_DIA';
    }
  }

  return {
    dossier,
    isSupplierActive,
    initialEval,
    annualEvals,
    latestAnnualEval,
    completedAnnualCycles,
    nextCycleNumber,
    createdDate,
    annualDueDate,
    diffDays,
    annualStatus,
  };
}
