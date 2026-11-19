import { EvaluationCriterionConfig, EvaluationMethodConfig, EvaluationThresholds, InitialExtraPart } from '../../../types';
import { Doc006Criterion, normalizeInitialCriteria } from '../../../data/evaluationDoc006';

/** Copia editable del método: se cambia libremente y se guarda de una sola vez. */
export interface MethodDraft {
  criteria: EvaluationCriterionConfig[];
  extras: InitialExtraPart[];
  /** Las seis preguntas de la evaluación inicial con su texto y puntos */
  initialCriteria: Doc006Criterion[];
  /** Puntos mínimos para aprobar la evaluación inicial; null = el proporcional del formato */
  initialPassing: number | null;
  thresholds: EvaluationThresholds;
}

export const weightOf = (c: EvaluationCriterionConfig): number => c.weight ?? c.weightAnnual ?? c.weightInitial ?? 0;

export const draftFromMethod = (m: EvaluationMethodConfig): MethodDraft => ({
  criteria: m.criteria.map((c) => ({ ...c })),
  extras: (m.initialExtras || []).map((x) => ({ ...x })),
  initialCriteria: normalizeInitialCriteria(m.initialCriteria),
  initialPassing: m.initialPassingPoints ?? null,
  thresholds: {
    sobresalienteMin: m.thresholds?.sobresalienteMin ?? m.excellentThreshold ?? 90,
    conformeMin: m.thresholds?.conformeMin ?? m.initialPassingScore ?? 70,
    condicionalMin: m.thresholds?.condicionalMin ?? m.conditionalThreshold ?? 60,
  },
});

/** Lo que se guarda: el orden de la lista pasa a ser el orden del formulario y el peso queda igual en ambos campos. */
export const patchFromDraft = (d: MethodDraft): Partial<EvaluationMethodConfig> => ({
  criteria: d.criteria.map((c, i) => ({
    ...c,
    order: i + 1,
    weightInitial: weightOf(c),
    weightAnnual: weightOf(c),
  })),
  initialExtras: d.extras.map((x) => ({ ...x, name: x.name.trim() })),
  initialCriteria: d.initialCriteria,
  initialPassingPoints: d.initialPassing ?? undefined,
  thresholds: d.thresholds,
});

export const sameDraft = (a: MethodDraft, b: MethodDraft): boolean => JSON.stringify(a) === JSON.stringify(b);

export const activeWeight = (criteria: EvaluationCriterionConfig[]): number =>
  criteria.filter((c) => c.isActive !== false).reduce((sum, c) => sum + weightOf(c), 0);

/** Sube o baja un elemento de la lista una posición. */
export function moveItem<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const to = index + delta;
  if (to < 0 || to >= list.length) return list;
  const next = list.slice();
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

/**
 * Reparte 100 % entre los criterios activos manteniendo su proporción actual
 * (si todos están en 0, en partes iguales). El redondeo sobrante va al de mayor peso.
 */
export function balanceTo100(criteria: EvaluationCriterionConfig[]): EvaluationCriterionConfig[] {
  const active = criteria.filter((c) => c.isActive !== false);
  if (active.length === 0) return criteria;
  const sum = activeWeight(criteria);
  const raw = active.map((c) => (sum > 0 ? (weightOf(c) / sum) * 100 : 100 / active.length));
  const rounded = raw.map((v) => Math.floor(v));
  let rest = 100 - rounded.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => ({ i, frac: v - Math.floor(v) })).sort((a, b) => b.frac - a.frac);
  for (let k = 0; rest > 0; k = (k + 1) % order.length, rest--) rounded[order[k].i] += 1;
  const byId = new Map(active.map((c, i) => [c.id, rounded[i]]));
  return criteria.map((c) => (byId.has(c.id) ? { ...c, weight: byId.get(c.id)! } : c));
}

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
