import { SupplierDossier, SupplierEvaluation } from '../types';
import { parseLocalDate } from './dateOnly';
import { evaluationPercent } from './evaluationScale';

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
  const timeOf = (e: SupplierEvaluation) => (parseLocalDate(e.evaluationDate) || new Date(e.createdAt)).getTime() || 0;
  // Si hay más de una evaluación inicial (se repitió), cuenta la más reciente
  const initialEval =
    evals
      .filter((e) => e.evaluationType === 'INICIAL')
      .sort((a, b) => timeOf(b) - timeOf(a))[0] ||
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

/** La evaluación vigente de un proveedor: la anual más reciente o, si no tiene, la inicial. */
export const currentEvaluation = (row: EvaluationRow): SupplierEvaluation | null => row.latestAnnualEval || row.initialEval;

/**
 * Puntaje promedio de los proveedores (0 a 100): una sola evaluación por proveedor, la vigente, sin contar los rechazados.
 * Es la misma cuenta en el Resumen y en Evaluaciones, para que los dos números coincidan.
 */
export function averageCurrentScore(rows: EvaluationRow[]): { avg: number | null; count: number } {
  const scores = rows
    .filter((r) => r.dossier.processStatus !== 'RECHAZADO')
    .map(currentEvaluation)
    .filter((e): e is SupplierEvaluation => !!e)
    .map((e) => evaluationPercent(e));
  return { avg: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null, count: scores.length };
}

/**
 * Las evaluaciones que cuentan de un proveedor: la inicial vigente y una anual por ciclo.
 * Si una se repitió o se cambió, solo queda la más reciente; las reemplazadas no cuentan.
 */
export function validEvaluations(row: EvaluationRow): SupplierEvaluation[] {
  const timeOf = (e: SupplierEvaluation) => (parseLocalDate(e.evaluationDate) || new Date(e.createdAt)).getTime() || 0;
  const latestByCycle = new Map<string, SupplierEvaluation>();
  row.annualEvals.forEach((e) => {
    const key = `A-${e.annualCycleNumber ?? e.periodYear ?? ''}`;
    const prev = latestByCycle.get(key);
    // Ante fechas iguales gana la guardada después
    if (!prev || timeOf(e) > timeOf(prev) || (timeOf(e) === timeOf(prev) && String(e.createdAt) > String(prev.createdAt))) {
      latestByCycle.set(key, e);
    }
  });
  return [...(row.initialEval ? [row.initialEval] : []), ...latestByCycle.values()];
}
