import type { SupplierEvaluation } from '../types';
import { DOC006_PASSING_SCORE } from '../data/evaluationDoc006';

/**
 * Las evaluaciones iniciales calificadas con el formato FS.GA-DOC-006 suman puntos sobre 120
 * (seis criterios de 20). Las anuales siguen siendo ponderadas sobre 100.
 * La escala se deduce de los propios criterios guardados, así no hace falta una columna nueva.
 */
export function evaluationMaxScore(e: Pick<SupplierEvaluation, 'criteriaScores'>): number {
  const list = e.criteriaScores || [];
  if (list.length > 0 && list.every((c) => typeof c.maxScore === 'number' && c.maxScore > 0)) {
    return list.reduce((sum, c) => sum + (c.maxScore as number), 0);
  }
  return 100;
}

export function isDoc006Evaluation(e: Pick<SupplierEvaluation, 'criteriaScores'>): boolean {
  return evaluationMaxScore(e) !== 100 || (e.criteriaScores || []).some((c) => c.criterionId?.startsWith('doc006-'));
}

/** Puntaje llevado a escala 0–100, para promedios y rangos que mezclan ambos tipos de evaluación. */
export function evaluationPercent(e: Pick<SupplierEvaluation, 'totalScore' | 'criteriaScores'>): number {
  const max = evaluationMaxScore(e);
  return max === 100 ? e.totalScore : Math.round((e.totalScore / max) * 1000) / 10;
}

/** «96 / 120» o «82 / 100». */
export function formatEvaluationScore(e: Pick<SupplierEvaluation, 'totalScore' | 'criteriaScores'>): string {
  return `${e.totalScore} / ${evaluationMaxScore(e)}`;
}

export { DOC006_PASSING_SCORE };

/** «Aprobado / No aprobado» para el formato FS.GA-DOC-006; el resto conserva los conceptos del método anual. */
export function evaluationConceptLabel(e: Pick<SupplierEvaluation, 'concept' | 'criteriaScores'>): string {
  if (isDoc006Evaluation(e)) return e.concept === 'NO_CONFORME' ? 'No aprobado' : 'Aprobado';
  return e.concept === 'SOBRESALIENTE'
    ? 'Sobresaliente'
    : e.concept === 'CONFORME'
    ? 'Conforme'
    : e.concept === 'CONDICIONAL_MEJORA'
    ? 'Condicional'
    : 'No conforme';
}

/** Nota A/B/C para el tablero: en DOC-006 la B es «aprobado» (76 puntos o más) y la A el 85 % o más. */
export function evaluationGrade(e: Pick<SupplierEvaluation, 'totalScore' | 'criteriaScores'>): 'A' | 'B' | 'C' {
  if (isDoc006Evaluation(e)) {
    if (e.totalScore >= evaluationMaxScore(e) * 0.85) return 'A';
    return e.totalScore >= DOC006_PASSING_SCORE ? 'B' : 'C';
  }
  return e.totalScore >= 85 ? 'A' : e.totalScore >= 70 ? 'B' : 'C';
}
