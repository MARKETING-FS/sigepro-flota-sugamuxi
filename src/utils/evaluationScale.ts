import type { SupplierEvaluation } from '../types';
import { DOC006_PASSING_SCORE, doc006PassingFor } from '../data/evaluationDoc006';

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

/** El resultado de toda evaluación es «Aprobado» o «No aprobado» (los conceptos antiguos se agrupan en esos dos). */
export const isApprovedConcept = (concept: SupplierEvaluation['concept'] | undefined): boolean =>
  concept === 'CONFORME' || concept === 'SOBRESALIENTE';

export function evaluationConceptLabel(e: Pick<SupplierEvaluation, 'concept' | 'criteriaScores'>): string {
  return isApprovedConcept(e.concept) ? 'Aprobado' : 'No aprobado';
}

/** Nota A/B/C para el tablero: en DOC-006 la B es «aprobado» (76 puntos o más) y la A el 85 % o más. */
export function evaluationGrade(e: Pick<SupplierEvaluation, 'totalScore' | 'criteriaScores'> & Partial<Pick<SupplierEvaluation, 'concept'>>): 'A' | 'B' | 'C' {
  const max = evaluationMaxScore(e);
  if (e.concept) {
    if (!isApprovedConcept(e.concept)) return 'C';
    return e.totalScore >= max * 0.85 ? 'A' : 'B';
  }
  if (isDoc006Evaluation(e)) {
    if (e.totalScore >= max * 0.85) return 'A';
    return e.totalScore >= doc006PassingFor(max) ? 'B' : 'C';
  }
  return e.totalScore >= 85 ? 'A' : e.totalScore >= 70 ? 'B' : 'C';
}
