import { SupplierDossier, SupplierEvaluation } from '../types';
import { parseLocalDate } from './dateOnly';

export interface EvaluationRow {
  dossier: SupplierDossier;
  isSupplierActive: boolean;
  initialEval: SupplierEvaluation | null;
  annualEvals: SupplierEvaluation[];
  latestAnnualEval: SupplierEvaluation | null;
  completedAnnualCycles: number;
  nextCycleNumber: number;
}

/**
 * Evaluaciones de un proveedor: la inicial y las anuales que ya tiene.
 * No calcula fechas ni vencimientos: quien evalúa elige si hace la inicial o la anual.
 */
export function buildEvaluationRow(dossier: SupplierDossier): EvaluationRow {
  const evals = Array.isArray(dossier.evaluations) ? dossier.evaluations : [];
  const initialEval =
    evals.find((e) => e.evaluationType === 'INICIAL') ||
    dossier.initialEvaluation ||
    null;

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

  // La más reciente primero
  annualEvals.sort((a, b) => {
    const timeA = (parseLocalDate(a.evaluationDate) || new Date(a.createdAt)).getTime();
    const timeB = (parseLocalDate(b.evaluationDate) || new Date(b.createdAt)).getTime();
    return timeB - timeA;
  });

  const isSupplierActive =
    dossier.processStatus === 'PROVEEDOR_HABILITADO' ||
    dossier.processStatus === 'APROBADO';

  return {
    dossier,
    isSupplierActive,
    initialEval,
    annualEvals,
    latestAnnualEval: annualEvals[0] || null,
    completedAnnualCycles: annualEvals.length,
    nextCycleNumber: annualEvals.length + 1,
  };
}
