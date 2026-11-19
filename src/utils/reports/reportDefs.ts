/**
 * Definición de los informes de SIGEPRO.
 *
 * Cada informe declara UNA sola vez sus columnas y filtros; la pantalla (vista previa y filtros) y el
 * Excel salen de la misma definición, así lo que se ve en pantalla es exactamente lo que se descarga.
 */
import type { ElementType } from 'react';
import { Award, Briefcase, CreditCard, FileText, History, ShieldCheck, Users } from 'lucide-react';
import type {
  Convocatoria,
  ConvocatoriaPostulacion,
  DocumentDefinition,
  SupplierDossier,
  SupplierEvaluation,
  SupplierType,
  SystemAuditEntry,
} from '../../types';
import {
  getContractualStatus,
  getDossierDocumentExpirationSummary,
  getRequiredDocsProgress,
  isDocumentApproved,
} from '../contractValidity';
import { evaluationConceptLabel, evaluationMaxScore, evaluationPercent } from '../evaluationScale';
import { displayDate, parseLocalDate } from '../dateOnly';
import type { CellKind, CellTone, SheetColumn, SheetSpec, SummarySpec } from './excelBuilder';

// ── Contexto con los datos de la aplicación ───────────────────────────────────────────────────────
export interface ReportCtx {
  dossiers: SupplierDossier[];
  evaluations: SupplierEvaluation[];
  convocatorias: Convocatoria[];
  auditLogs: SystemAuditEntry[];
  documentDefinitions: DocumentDefinition[];
  getRequired: (type: SupplierType | undefined, category: string | undefined) => { allMandatory: string[] };
  /** Quién descarga el informe (aparece en el encabezado del Excel). */
  userName: string;
}

export type ReportId =
  | 'DIRECTORIO'
  | 'DOCUMENTOS'
  | 'SARLAFT'
  | 'FINANZAS'
  | 'EVALUACIONES'
  | 'CONVOCATORIAS'
  | 'AUDITORIA';

export interface Opt {
  value: string;
  label: string;
}

export interface ColumnDef<T> {
  id: string;
  header: string;
  group: string;
  width: number;
  kind: CellKind;
  get: (row: T, ctx: ReportCtx) => unknown;
  tone?: (value: unknown) => CellTone | undefined;
  total?: 'sum';
  /** Aparece marcada por defecto. */
  on?: boolean;
}

export interface FilterDef<T> {
  id: string;
  label: string;
  kind: 'search' | 'select' | 'date';
  placeholder?: string;
  options?: (ctx: ReportCtx) => Opt[];
  test: (row: T, value: string, ctx: ReportCtx) => boolean;
}

export interface ReportDef<T = any> {
  id: ReportId;
  /** Nombre corto para el selector. */
  short: string;
  title: string;
  /** Una frase: para qué sirve este informe. */
  purpose: string;
  icon: ElementType;
  /** Nombre del archivo y de la pestaña. */
  fileSlug: string;
  sheetName: string;
  /** Qué cuenta cada fila: «proveedor», «evaluación»… */
  noun: [string, string];
  rows: (ctx: ReportCtx) => T[];
  columns: ColumnDef<T>[];
  filters: FilterDef<T>[];
  /** Hojas adicionales que se agregan al archivo (por ejemplo, las postulaciones). */
  extraSheets?: (rows: T[], ctx: ReportCtx) => SheetSpec[];
  freezeCols?: number;
}

// ── Utilidades ───────────────────────────────────────────────────────────────────────────────────
const isNatural = (d: SupplierDossier) => d.basicInfo?.supplierType === 'NATURAL';
const nameOf = (d: SupplierDossier) => (isNatural(d) ? d.basicInfo?.fullName : d.basicInfo?.companyName) || '';
const docOf = (d: SupplierDossier) => {
  if (isNatural(d)) return d.basicInfo?.documentNumber || '';
  const nit = d.basicInfo?.nit || '';
  const dv = d.basicInfo?.dv;
  return dv && !nit.includes('-') ? `${nit}-${dv}` : nit;
};
const tierOf = (d: SupplierDossier) => d.supplierTier || d.basicInfo?.supplierTier || 'B';
const TIER_LABEL: Record<string, string> = { A: 'Tipo A · Crítico', B: 'Tipo B · Operativo', C: 'Tipo C · Estándar' };
const personLabel = (d: SupplierDossier) => (isNatural(d) ? 'Persona natural' : 'Persona jurídica');
const norm = (s: unknown) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
const hasText = (q: string, ...fields: unknown[]) => {
  const needle = norm(q).trim();
  return !needle || fields.some((f) => norm(f).includes(needle));
};
const distinct = (values: Array<string | undefined | null>): Opt[] =>
  Array.from(new Set(values.map((v) => (v || '').trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, 'es'))
    .map((v) => ({ value: v, label: v }));
const yesNo = (v: unknown) => (v ? 'Sí' : 'No');

/** Estado del proveedor tal como lo muestra el panel (solo hay tres). */
const supplierStage = (d: SupplierDossier): 'Habilitado' | 'Pendiente' | 'Documento vencido' => {
  if (d.processStatus === 'DOCUMENTACION_VENCIDA') return 'Documento vencido';
  if (
    ['PROVEEDOR_HABILITADO', 'APROBADO', 'DOCUMENTACION_POR_VENCER', 'CONTRATO_VIGENTE', 'CONTRATO_POR_VENCER', 'CONTRATO_VENCIDO'].includes(
      d.processStatus
    )
  )
    return 'Habilitado';
  return 'Pendiente';
};
const stageTone = (v: unknown): CellTone | undefined =>
  v === 'Habilitado' ? 'good' : v === 'Documento vencido' ? 'bad' : v ? 'neutral' : undefined;
const STAGE_OPTS: Opt[] = [
  { value: 'Habilitado', label: 'Habilitado' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Documento vencido', label: 'Documento vencido' },
];
const PERSON_OPTS: Opt[] = [
  { value: 'JURIDICA', label: 'Persona jurídica' },
  { value: 'NATURAL', label: 'Persona natural' },
];
const TIER_OPTS: Opt[] = [
  { value: 'A', label: 'Tipo A · Crítico' },
  { value: 'B', label: 'Tipo B · Operativo' },
  { value: 'C', label: 'Tipo C · Estándar' },
];
const YESNO_OPTS: Opt[] = [
  { value: 'SI', label: 'Sí' },
  { value: 'NO', label: 'No' },
];

const dayOf = (v: unknown): number | null => {
  const d = parseLocalDate(v as string);
  if (!d) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};
const inRange = (value: unknown, from: string, to: string): boolean => {
  const t = dayOf(value);
  if (from) {
    const f = dayOf(from);
    if (f !== null && (t === null || t < f)) return false;
  }
  if (to) {
    const e = dayOf(to);
    if (e !== null && (t === null || t > e)) return false;
  }
  return true;
};

// Estado de un documento (código → texto)
const DOC_STATUS_LABEL: Record<string, string> = {
  APROBADO: 'Aprobado',
  VIGENTE: 'Aprobado',
  POR_VENCER: 'Por vencer',
  VENCIDO: 'Vencido',
  CARGADO: 'Cargado',
  EN_REVISION: 'En revisión',
  REQUIERE_CORRECCION: 'Por corregir',
  RECHAZADO: 'Rechazado',
  PENDIENTE: 'Sin cargar',
};
const docStatusTone = (v: unknown): CellTone | undefined => {
  if (v === 'Aprobado') return 'good';
  if (v === 'Vencido' || v === 'Rechazado') return 'bad';
  if (v === 'No aplica') return undefined;
  if (v === 'Por vencer' || v === 'En revisión' || v === 'Cargado') return 'info';
  return v ? 'neutral' : undefined;
};

interface DocStats {
  total: number;
  approved: number;
  expired: number;
  expiringSoon: number;
  /** Aprobados y vigentes sobre el total exigido, 0..1 (la misma cuenta del panel «Resumen»). */
  pct: number;
  missing: string[];
}
const docStatsCache = new WeakMap<ReportCtx, Map<string, DocStats>>();
function docStats(d: SupplierDossier, ctx: ReportCtx): DocStats {
  let cache = docStatsCache.get(ctx);
  if (!cache) {
    cache = new Map();
    docStatsCache.set(ctx, cache);
  }
  const hit = cache.get(d.id);
  if (hit) return hit;

  const reqs = ctx.getRequired(d.basicInfo?.supplierType, d.selectedCategory);
  const progress = getRequiredDocsProgress(d, reqs.allMandatory);
  const exp = getDossierDocumentExpirationSummary(d);
  const docs = d.documents || {};
  const codes = new Set<string>(['FS_GA_FOR_009', 'FS_GA_FOR_039', ...reqs.allMandatory]);
  Object.entries(docs).forEach(([code, doc]) => {
    if (doc?.isRequired) codes.add(code);
  });
  const nameOfDoc = (code: string) =>
    ctx.documentDefinitions.find((x) => x.code === code)?.name || docs[code]?.name || code;
  const missing = Array.from(codes)
    .filter((code) => !isDocumentApproved(docs[code]) || exp.expiredDocs.some((e) => e.code === code))
    .map(nameOfDoc);
  const ok = Math.max(0, progress.approved - exp.expiredCount);
  const stats: DocStats = {
    total: progress.total,
    approved: progress.approved,
    expired: exp.expiredCount,
    expiringSoon: exp.expiringSoonCount,
    pct: progress.total ? ok / progress.total : 0,
    missing,
  };
  cache.set(d.id, stats);
  return stats;
}

const docStatusOf = (d: SupplierDossier, code: string): string => {
  const doc = d.documents?.[code];
  if (!doc) return 'No aplica';
  return DOC_STATUS_LABEL[doc.status] || doc.status;
};

const SARLAFT_LABEL: Record<string, string> = {
  SIN_COINCIDENCIAS: 'Sin coincidencias',
  REQUIERE_VERIFICACION: 'Requiere verificación',
  PENDIENTE: 'Pendiente',
};
const sarlaftTone = (v: unknown): CellTone | undefined =>
  v === 'Sin coincidencias' ? 'good' : v === 'Requiere verificación' ? 'bad' : v ? 'neutral' : undefined;
const sarlaftOf = (d: SupplierDossier) => d.internalConcepts?.sarlatfCheck;

const CONTRACT_LABEL: Record<string, string> = {
  VIGENTE: 'Vigente',
  POR_VENCER: 'Por vencer (≤ 30 días)',
  VENCIDO: 'Vencido',
  SIN_CONTRATO: 'Sin contrato',
  SUSPENDIDO: 'Suspendido',
  TERMINADO: 'Terminado',
};
const contractTone = (v: unknown): CellTone | undefined =>
  v === 'Vigente' ? 'good' : v === 'Vencido' ? 'bad' : v === 'Por vencer (≤ 30 días)' ? 'info' : v ? 'neutral' : undefined;

// ── 1. Directorio de proveedores ─────────────────────────────────────────────────────────────────
const directorio: ReportDef<SupplierDossier> = {
  id: 'DIRECTORIO',
  short: 'Directorio',
  title: 'Directorio de proveedores',
  purpose: 'Quién es cada proveedor: datos, contacto, categoría, estado y contrato. El informe más completo.',
  icon: Users,
  fileSlug: 'Directorio_de_proveedores',
  sheetName: 'Directorio',
  noun: ['proveedor', 'proveedores'],
  rows: (ctx) => ctx.dossiers,
  columns: [
    { id: 'fileNumber', header: 'No. de expediente', group: 'Identificación', width: 22, kind: 'text', on: true, get: (d) => d.fileNumber },
    { id: 'name', header: 'Razón social / nombre', group: 'Identificación', width: 38, kind: 'text', on: true, get: (d) => nameOf(d) },
    { id: 'doc', header: 'NIT / cédula', group: 'Identificación', width: 18, kind: 'text', on: true, get: (d) => docOf(d) },
    { id: 'person', header: 'Tipo de persona', group: 'Identificación', width: 18, kind: 'text', on: true, get: (d) => personLabel(d) },
    { id: 'tier', header: 'Tipo de proveedor', group: 'Identificación', width: 20, kind: 'text', on: true, get: (d) => TIER_LABEL[tierOf(d)] },
    { id: 'rep', header: 'Representante legal', group: 'Identificación', width: 30, kind: 'text', get: (d) => (isNatural(d) ? '' : d.basicInfo?.representativeLegalName || '') },
    {
      id: 'repDoc',
      header: 'Documento del representante',
      group: 'Identificación',
      width: 22,
      kind: 'text',
      get: (d) =>
        isNatural(d) || !d.basicInfo?.representativeLegalDocNumber
          ? ''
          : `${d.basicInfo?.representativeLegalDocType || 'CC'} ${d.basicInfo.representativeLegalDocNumber}`,
    },
    { id: 'email', header: 'Correo electrónico', group: 'Contacto', width: 32, kind: 'text', on: true, get: (d) => d.basicInfo?.email || '' },
    { id: 'phone', header: 'Teléfono', group: 'Contacto', width: 16, kind: 'text', on: true, get: (d) => d.basicInfo?.phone || '' },
    { id: 'city', header: 'Ciudad', group: 'Contacto', width: 18, kind: 'text', on: true, get: (d) => d.basicInfo?.city || '' },
    { id: 'department', header: 'Departamento', group: 'Contacto', width: 18, kind: 'text', get: (d) => d.basicInfo?.department || '' },
    { id: 'address', header: 'Dirección', group: 'Contacto', width: 34, kind: 'text', get: (d) => d.basicInfo?.address || '' },
    { id: 'website', header: 'Sitio web', group: 'Contacto', width: 26, kind: 'text', get: (d) => d.basicInfo?.website || '' },
    { id: 'category', header: 'Categoría de servicio', group: 'Clasificación', width: 30, kind: 'text', on: true, get: (d) => d.selectedCategory || '' },
    { id: 'activity', header: 'Actividad económica', group: 'Clasificación', width: 34, kind: 'text', get: (d) => d.economicActivity || d.basicInfo?.economicActivity || '' },
    { id: 'ciiu', header: 'Código CIIU', group: 'Clasificación', width: 14, kind: 'text', get: (d) => d.basicInfo?.taxInfo?.ciiuCode || '' },
    { id: 'stage', header: 'Estado del proveedor', group: 'Estado', width: 22, kind: 'status', tone: stageTone, on: true, get: (d) => supplierStage(d) },
    { id: 'docs', header: '% documentos al día', group: 'Estado', width: 16, kind: 'percent', on: true, get: (d, ctx) => docStats(d, ctx).pct },
    {
      id: 'sarlaft',
      header: 'Concepto SARLAFT',
      group: 'Estado',
      width: 22,
      kind: 'status',
      tone: sarlaftTone,
      on: true,
      get: (d) => SARLAFT_LABEL[sarlaftOf(d)?.result || 'PENDIENTE'],
    },
    { id: 'contract', header: 'Estado del contrato', group: 'Contrato', width: 24, kind: 'status', tone: contractTone, get: (d) => CONTRACT_LABEL[getContractualStatus(d).status] || '' },
    { id: 'contractNo', header: 'No. de contrato', group: 'Contrato', width: 18, kind: 'text', get: (d) => d.contractInfo?.contractNumber || '' },
    { id: 'contractEnd', header: 'Vence el contrato', group: 'Contrato', width: 16, kind: 'date', get: (d) => d.contractInfo?.endDate || '' },
    { id: 'contractValue', header: 'Valor del contrato', group: 'Contrato', width: 20, kind: 'money', get: (d) => d.contractInfo?.contractValueCOP ?? d.contractInfo?.contractValue ?? null },
    { id: 'createdAt', header: 'Fecha de inscripción', group: 'Fechas', width: 17, kind: 'date', on: true, get: (d) => d.createdAt },
    { id: 'updatedAt', header: 'Última actualización', group: 'Fechas', width: 19, kind: 'date', get: (d) => d.updatedAt || d.createdAt },
  ],
  filters: [
    {
      id: 'q',
      label: 'Buscar',
      kind: 'search',
      placeholder: 'Nombre, NIT, expediente, correo o ciudad',
      test: (d, v) => hasText(v, nameOf(d), docOf(d), d.fileNumber, d.basicInfo?.email, d.basicInfo?.city),
    },
    { id: 'stage', label: 'Estado del proveedor', kind: 'select', options: () => STAGE_OPTS, test: (d, v) => supplierStage(d) === v },
    {
      id: 'contract',
      label: 'Estado del contrato',
      kind: 'select',
      options: () => Object.entries(CONTRACT_LABEL).map(([value, label]) => ({ value, label })),
      test: (d, v) => getContractualStatus(d).status === v,
    },
    { id: 'person', label: 'Tipo de persona', kind: 'select', options: () => PERSON_OPTS, test: (d, v) => d.basicInfo?.supplierType === v },
    { id: 'tier', label: 'Tipo de proveedor', kind: 'select', options: () => TIER_OPTS, test: (d, v) => tierOf(d) === v },
    { id: 'category', label: 'Categoría', kind: 'select', options: (ctx) => distinct(ctx.dossiers.map((d) => d.selectedCategory)), test: (d, v) => d.selectedCategory === v },
    {
      id: 'sarlaft',
      label: 'Concepto SARLAFT',
      kind: 'select',
      options: () => Object.entries(SARLAFT_LABEL).map(([value, label]) => ({ value, label })),
      test: (d, v) => (sarlaftOf(d)?.result || 'PENDIENTE') === v,
    },
    { id: 'from', label: 'Inscrito desde', kind: 'date', test: (d, v) => inRange(d.createdAt, v, '') },
    { id: 'to', label: 'Inscrito hasta', kind: 'date', test: (d, v) => inRange(d.createdAt, '', v) },
  ],
};

// ── 2. Cumplimiento documental ───────────────────────────────────────────────────────────────────
const KEY_DOCS: Array<{ code: string | ((d: SupplierDossier) => string); header: string; filter: string }> = [
  { code: 'FS_GA_FOR_009', header: 'FS.GA-FOR-009 (inscripción)', filter: 'Formato FS.GA-FOR-009' },
  { code: 'FS_GA_FOR_039', header: 'FS.GA-FOR-039 (datos personales)', filter: 'Formato FS.GA-FOR-039' },
  { code: 'RUT', header: 'RUT', filter: 'RUT' },
  { code: 'CAMARA_COMERCIO', header: 'Cámara de comercio', filter: 'Cámara de comercio' },
  { code: (d) => (isNatural(d) ? 'CEDULA_NATURAL' : 'CEDULA_REP_LEGAL'), header: 'Cédula', filter: 'Cédula' },
  { code: 'CERTIFICACION_BANCARIA', header: 'Certificación bancaria', filter: 'Certificación bancaria' },
  { code: 'ESTADOS_FINANCIEROS', header: 'Estados financieros', filter: 'Estados financieros' },
  { code: 'SEGURIDAD_SOCIAL', header: 'Seguridad social', filter: 'Seguridad social' },
];
const keyDocCode = (item: (typeof KEY_DOCS)[number], d: SupplierDossier) => (typeof item.code === 'function' ? item.code(d) : item.code);

const documentos: ReportDef<SupplierDossier> = {
  id: 'DOCUMENTOS',
  short: 'Documentos',
  title: 'Cumplimiento documental',
  purpose: 'Qué documentos tiene cada proveedor, cuántos le faltan y cuáles están vencidos.',
  icon: FileText,
  fileSlug: 'Cumplimiento_documental',
  sheetName: 'Cumplimiento documental',
  noun: ['proveedor', 'proveedores'],
  rows: (ctx) => ctx.dossiers,
  columns: [
    { id: 'fileNumber', header: 'No. de expediente', group: 'Proveedor', width: 22, kind: 'text', on: true, get: (d) => d.fileNumber },
    { id: 'name', header: 'Razón social / nombre', group: 'Proveedor', width: 38, kind: 'text', on: true, get: (d) => nameOf(d) },
    { id: 'doc', header: 'NIT / cédula', group: 'Proveedor', width: 18, kind: 'text', get: (d) => docOf(d) },
    { id: 'person', header: 'Tipo de persona', group: 'Proveedor', width: 18, kind: 'text', get: (d) => personLabel(d) },
    { id: 'category', header: 'Categoría', group: 'Proveedor', width: 30, kind: 'text', on: true, get: (d) => d.selectedCategory || '' },
    { id: 'stage', header: 'Estado del proveedor', group: 'Resultado', width: 22, kind: 'status', tone: stageTone, on: true, get: (d) => supplierStage(d) },
    { id: 'pct', header: '% documentos al día', group: 'Resultado', width: 16, kind: 'percent', on: true, get: (d, ctx) => docStats(d, ctx).pct },
    { id: 'total', header: 'Documentos obligatorios', group: 'Resultado', width: 16, kind: 'int', on: true, total: 'sum', get: (d, ctx) => docStats(d, ctx).total },
    { id: 'approved', header: 'Aprobados', group: 'Resultado', width: 13, kind: 'int', on: true, total: 'sum', get: (d, ctx) => docStats(d, ctx).approved },
    { id: 'expired', header: 'Vencidos', group: 'Resultado', width: 12, kind: 'int', on: true, total: 'sum', get: (d, ctx) => docStats(d, ctx).expired },
    { id: 'soon', header: 'Por vencer (30 días)', group: 'Resultado', width: 15, kind: 'int', total: 'sum', get: (d, ctx) => docStats(d, ctx).expiringSoon },
    { id: 'missing', header: 'Documentos que faltan o están vencidos', group: 'Resultado', width: 60, kind: 'long', on: true, get: (d, ctx) => docStats(d, ctx).missing.join(', ') },
    ...KEY_DOCS.map((item, i) => ({
      id: `doc${i}`,
      header: item.header,
      group: 'Estado de cada documento',
      width: 19,
      kind: 'status' as const,
      tone: docStatusTone,
      get: (d: SupplierDossier) => docStatusOf(d, keyDocCode(item, d)),
    })),
    { id: 'updatedAt', header: 'Última actualización', group: 'Fechas', width: 19, kind: 'date', get: (d) => d.updatedAt || d.createdAt },
  ],
  filters: [
    { id: 'q', label: 'Buscar', kind: 'search', placeholder: 'Nombre, NIT o expediente', test: (d, v) => hasText(v, nameOf(d), docOf(d), d.fileNumber) },
    { id: 'stage', label: 'Estado del proveedor', kind: 'select', options: () => STAGE_OPTS, test: (d, v) => supplierStage(d) === v },
    {
      id: 'range',
      label: '% documentos al día',
      kind: 'select',
      options: () => [
        { value: '100', label: 'Completo (100 %)' },
        { value: '70', label: 'Entre 70 % y 99 %' },
        { value: '40', label: 'Entre 40 % y 69 %' },
        { value: '0', label: 'Menos de 40 %' },
      ],
      test: (d, v, ctx) => {
        const p = Math.round(docStats(d, ctx).pct * 100);
        if (v === '100') return p >= 100;
        if (v === '70') return p >= 70 && p < 100;
        if (v === '40') return p >= 40 && p < 70;
        return p < 40;
      },
    },
    { id: 'category', label: 'Categoría', kind: 'select', options: (ctx) => distinct(ctx.dossiers.map((d) => d.selectedCategory)), test: (d, v) => d.selectedCategory === v },
    { id: 'person', label: 'Tipo de persona', kind: 'select', options: () => PERSON_OPTS, test: (d, v) => d.basicInfo?.supplierType === v },
    {
      id: 'expired',
      label: 'Vencimientos',
      kind: 'select',
      options: () => [
        { value: 'EXPIRED', label: 'Con documentos vencidos' },
        { value: 'SOON', label: 'Con documentos por vencer' },
      ],
      test: (d, v, ctx) => (v === 'EXPIRED' ? docStats(d, ctx).expired > 0 : docStats(d, ctx).expiringSoon > 0),
    },
    {
      id: 'missing',
      label: 'Le falta el documento',
      kind: 'select',
      options: () => KEY_DOCS.map((k, i) => ({ value: String(i), label: k.filter })),
      test: (d, v) => {
        const item = KEY_DOCS[Number(v)];
        if (!item) return true;
        const doc = d.documents?.[keyDocCode(item, d)];
        return !isDocumentApproved(doc);
      },
    },
  ],
};

// ── 3. SARLAFT ───────────────────────────────────────────────────────────────────────────────────
const sarlaft: ReportDef<SupplierDossier> = {
  id: 'SARLAFT',
  short: 'SARLAFT',
  title: 'Debida diligencia SARLAFT',
  purpose: 'Resultado de la consulta SARLAFT de cada proveedor y si su PDF está cargado y aprobado.',
  icon: ShieldCheck,
  fileSlug: 'Debida_diligencia_SARLAFT',
  sheetName: 'SARLAFT',
  noun: ['proveedor', 'proveedores'],
  rows: (ctx) => ctx.dossiers,
  columns: [
    { id: 'fileNumber', header: 'No. de expediente', group: 'Proveedor', width: 22, kind: 'text', on: true, get: (d) => d.fileNumber },
    { id: 'name', header: 'Razón social / nombre', group: 'Proveedor', width: 38, kind: 'text', on: true, get: (d) => nameOf(d) },
    { id: 'doc', header: 'NIT / cédula', group: 'Proveedor', width: 18, kind: 'text', on: true, get: (d) => docOf(d) },
    { id: 'person', header: 'Tipo de persona', group: 'Proveedor', width: 18, kind: 'text', on: true, get: (d) => personLabel(d) },
    { id: 'rep', header: 'Representante legal', group: 'Proveedor', width: 30, kind: 'text', get: (d) => (isNatural(d) ? '' : d.basicInfo?.representativeLegalName || '') },
    { id: 'repDoc', header: 'Cédula del representante', group: 'Proveedor', width: 20, kind: 'text', get: (d) => (isNatural(d) ? '' : d.basicInfo?.representativeLegalDocNumber || '') },
    { id: 'concept', header: 'Concepto SARLAFT', group: 'Resultado', width: 24, kind: 'status', tone: sarlaftTone, on: true, get: (d) => SARLAFT_LABEL[sarlaftOf(d)?.result || 'PENDIENTE'] },
    {
      id: 'hasPdf',
      header: 'PDF cargado',
      group: 'Resultado',
      width: 14,
      kind: 'status',
      on: true,
      tone: (v) => (v === 'Sí' ? 'good' : v ? 'neutral' : undefined),
      get: (d) => yesNo(sarlaftOf(d)?.fileUrl || sarlaftOf(d)?.fileName),
    },
    {
      id: 'approved',
      header: 'Aprobado por el administrador',
      group: 'Resultado',
      width: 20,
      kind: 'status',
      on: true,
      tone: (v) => (v === 'Aprobado' ? 'good' : v ? 'neutral' : undefined),
      get: (d) => (sarlaftOf(d)?.approved ? 'Aprobado' : 'Sin aprobar'),
    },
    { id: 'file', header: 'Nombre del archivo', group: 'Resultado', width: 34, kind: 'text', get: (d) => sarlaftOf(d)?.fileName || '' },
    { id: 'by', header: 'Consultado por', group: 'Seguimiento', width: 26, kind: 'text', on: true, get: (d) => sarlaftOf(d)?.checkedBy || '' },
    { id: 'at', header: 'Fecha de la consulta', group: 'Seguimiento', width: 18, kind: 'date', on: true, get: (d) => sarlaftOf(d)?.checkedAt || '' },
    { id: 'notes', header: 'Observaciones', group: 'Seguimiento', width: 50, kind: 'long', get: (d) => sarlaftOf(d)?.notes || '' },
    { id: 'stage', header: 'Estado del proveedor', group: 'Seguimiento', width: 22, kind: 'status', tone: stageTone, on: true, get: (d) => supplierStage(d) },
  ],
  filters: [
    { id: 'q', label: 'Buscar', kind: 'search', placeholder: 'Nombre, NIT, expediente o representante', test: (d, v) => hasText(v, nameOf(d), docOf(d), d.fileNumber, d.basicInfo?.representativeLegalName) },
    {
      id: 'concept',
      label: 'Concepto SARLAFT',
      kind: 'select',
      options: () => Object.entries(SARLAFT_LABEL).map(([value, label]) => ({ value, label })),
      test: (d, v) => (sarlaftOf(d)?.result || 'PENDIENTE') === v,
    },
    {
      id: 'pdf',
      label: 'PDF del SARLAFT',
      kind: 'select',
      options: () => [
        { value: 'WITH', label: 'Con PDF cargado' },
        { value: 'WITHOUT', label: 'Sin PDF' },
      ],
      test: (d, v) => {
        const has = Boolean(sarlaftOf(d)?.fileUrl || sarlaftOf(d)?.fileName);
        return v === 'WITH' ? has : !has;
      },
    },
    {
      id: 'approved',
      label: 'Aprobación',
      kind: 'select',
      options: () => [
        { value: 'YES', label: 'Aprobado' },
        { value: 'NO', label: 'Sin aprobar' },
      ],
      test: (d, v) => (v === 'YES' ? Boolean(sarlaftOf(d)?.approved) : !sarlaftOf(d)?.approved),
    },
    { id: 'person', label: 'Tipo de persona', kind: 'select', options: () => PERSON_OPTS, test: (d, v) => d.basicInfo?.supplierType === v },
  ],
};

// ── 4. Cuentas y finanzas ────────────────────────────────────────────────────────────────────────
const bankOf = (d: SupplierDossier) => ({
  bank: d.basicInfo?.bankInfo?.bankName || d.basicInfo?.bankName || '',
  type: d.basicInfo?.bankInfo?.accountType || d.basicInfo?.accountType || '',
  number: d.basicInfo?.bankInfo?.accountNumber || d.basicInfo?.accountNumber || '',
});
const ACCOUNT_LABEL: Record<string, string> = { AHORROS: 'Ahorros', CORRIENTE: 'Corriente' };
const accountTypeLabel = (t: string) => ACCOUNT_LABEL[(t || '').toUpperCase()] || t;
const money = (n: number | undefined) => (typeof n === 'number' ? n : null);

const finanzas: ReportDef<SupplierDossier> = {
  id: 'FINANZAS',
  short: 'Cuentas y finanzas',
  title: 'Cuentas bancarias y perfil financiero',
  purpose: 'Cuenta para pagos, régimen tributario y cifras financieras de cada proveedor, con totales.',
  icon: CreditCard,
  fileSlug: 'Cuentas_y_finanzas',
  sheetName: 'Cuentas y finanzas',
  noun: ['proveedor', 'proveedores'],
  rows: (ctx) => ctx.dossiers,
  columns: [
    { id: 'fileNumber', header: 'No. de expediente', group: 'Proveedor', width: 22, kind: 'text', on: true, get: (d) => d.fileNumber },
    { id: 'name', header: 'Razón social / nombre', group: 'Proveedor', width: 38, kind: 'text', on: true, get: (d) => nameOf(d) },
    { id: 'doc', header: 'NIT / cédula', group: 'Proveedor', width: 18, kind: 'text', on: true, get: (d) => docOf(d) },
    { id: 'bank', header: 'Banco', group: 'Cuenta bancaria', width: 24, kind: 'text', on: true, get: (d) => bankOf(d).bank },
    { id: 'accountType', header: 'Tipo de cuenta', group: 'Cuenta bancaria', width: 16, kind: 'text', on: true, get: (d) => accountTypeLabel(bankOf(d).type) },
    { id: 'accountNumber', header: 'Número de cuenta', group: 'Cuenta bancaria', width: 22, kind: 'text', on: true, get: (d) => bankOf(d).number },
    { id: 'holder', header: 'Titular de la cuenta', group: 'Cuenta bancaria', width: 34, kind: 'text', get: (d) => d.basicInfo?.bankInfo?.accountHolder || '' },
    { id: 'holderDoc', header: 'Documento del titular', group: 'Cuenta bancaria', width: 20, kind: 'text', get: (d) => d.basicInfo?.bankInfo?.holderDocNumber || '' },
    {
      id: 'cert',
      header: 'Certificación bancaria',
      group: 'Cuenta bancaria',
      width: 20,
      kind: 'status',
      on: true,
      tone: (v) => (v === 'Validada' ? 'good' : v ? 'neutral' : undefined),
      get: (d) => (isDocumentApproved(d.documents?.CERTIFICACION_BANCARIA) ? 'Validada' : 'Pendiente'),
    },
    { id: 'regime', header: 'Régimen tributario', group: 'Tributario', width: 26, kind: 'text', on: true, get: (d) => d.basicInfo?.taxInfo?.taxRegime || '' },
    { id: 'gran', header: 'Gran contribuyente', group: 'Tributario', width: 16, kind: 'text', on: true, get: (d) => yesNo(d.basicInfo?.taxInfo?.isGranContribuyente) },
    { id: 'auto', header: 'Autorretenedor', group: 'Tributario', width: 15, kind: 'text', on: true, get: (d) => yesNo(d.basicInfo?.taxInfo?.isAutoRetenedor) },
    { id: 'assets', header: 'Activos totales', group: 'Financiero', width: 20, kind: 'money', total: 'sum', on: true, get: (d) => money(d.basicInfo?.financialInfo?.totalAssets) },
    { id: 'liabilities', header: 'Pasivos totales', group: 'Financiero', width: 20, kind: 'money', total: 'sum', on: true, get: (d) => money(d.basicInfo?.financialInfo?.totalLiabilities) },
    { id: 'netWorth', header: 'Patrimonio neto', group: 'Financiero', width: 20, kind: 'money', total: 'sum', on: true, get: (d) => money(d.basicInfo?.financialInfo?.netWorth) },
    { id: 'revenue', header: 'Ingresos anuales', group: 'Financiero', width: 20, kind: 'money', total: 'sum', on: true, get: (d) => money(d.basicInfo?.financialInfo?.annualRevenue) },
    { id: 'cutoff', header: 'Fecha de corte', group: 'Financiero', width: 16, kind: 'date', get: (d) => d.basicInfo?.financialInfo?.financialCutoffDate || '' },
    { id: 'stage', header: 'Estado del proveedor', group: 'Proveedor', width: 22, kind: 'status', tone: stageTone, on: true, get: (d) => supplierStage(d) },
  ],
  filters: [
    { id: 'q', label: 'Buscar', kind: 'search', placeholder: 'Nombre, NIT, banco o número de cuenta', test: (d, v) => hasText(v, nameOf(d), docOf(d), d.fileNumber, bankOf(d).bank, bankOf(d).number) },
    { id: 'bank', label: 'Banco', kind: 'select', options: (ctx) => distinct(ctx.dossiers.map((d) => bankOf(d).bank)), test: (d, v) => bankOf(d).bank === v },
    {
      id: 'type',
      label: 'Tipo de cuenta',
      kind: 'select',
      options: () => [
        { value: 'AHORROS', label: 'Ahorros' },
        { value: 'CORRIENTE', label: 'Corriente' },
      ],
      test: (d, v) => bankOf(d).type.toUpperCase() === v,
    },
    {
      id: 'cert',
      label: 'Certificación bancaria',
      kind: 'select',
      options: () => [
        { value: 'OK', label: 'Validada' },
        { value: 'PENDING', label: 'Pendiente' },
      ],
      test: (d, v) => (v === 'OK') === isDocumentApproved(d.documents?.CERTIFICACION_BANCARIA),
    },
    { id: 'regime', label: 'Régimen tributario', kind: 'select', options: (ctx) => distinct(ctx.dossiers.map((d) => d.basicInfo?.taxInfo?.taxRegime)), test: (d, v) => d.basicInfo?.taxInfo?.taxRegime === v },
    { id: 'gran', label: 'Gran contribuyente', kind: 'select', options: () => YESNO_OPTS, test: (d, v) => Boolean(d.basicInfo?.taxInfo?.isGranContribuyente) === (v === 'SI') },
    { id: 'auto', label: 'Autorretenedor', kind: 'select', options: () => YESNO_OPTS, test: (d, v) => Boolean(d.basicInfo?.taxInfo?.isAutoRetenedor) === (v === 'SI') },
  ],
};

// ── 5. Evaluaciones ──────────────────────────────────────────────────────────────────────────────
const EVAL_TYPE_LABEL: Record<string, string> = {
  INICIAL: 'Inicial (homologación)',
  ANUAL_1_ANO: 'Anual · primer año',
  ANUAL_PERIODICA: 'Anual periódica',
};
const conceptTone = (v: unknown): CellTone | undefined =>
  v === 'Sobresaliente' || v === 'Conforme' || v === 'Aprobado' ? 'good' : v === 'No conforme' || v === 'No aprobado' ? 'bad' : v ? 'info' : undefined;

const evaluaciones: ReportDef<SupplierEvaluation> = {
  id: 'EVALUACIONES',
  short: 'Evaluaciones',
  title: 'Evaluación de proveedores',
  purpose: 'Calificaciones de cada proveedor: puntaje, concepto, evaluador y planes de mejora.',
  icon: Award,
  fileSlug: 'Evaluacion_de_proveedores',
  sheetName: 'Evaluaciones',
  noun: ['evaluación', 'evaluaciones'],
  rows: (ctx) => ctx.evaluations,
  columns: [
    { id: 'fileNumber', header: 'No. de expediente', group: 'Proveedor', width: 22, kind: 'text', on: true, get: (e) => e.fileNumber },
    { id: 'name', header: 'Razón social / nombre', group: 'Proveedor', width: 38, kind: 'text', on: true, get: (e) => e.supplierName },
    { id: 'doc', header: 'NIT / cédula', group: 'Proveedor', width: 18, kind: 'text', get: (e) => e.supplierDoc },
    { id: 'tier', header: 'Tipo de proveedor', group: 'Proveedor', width: 20, kind: 'text', get: (e) => (e.supplierTier ? TIER_LABEL[e.supplierTier] : '') },
    { id: 'category', header: 'Categoría', group: 'Proveedor', width: 28, kind: 'text', on: true, get: (e) => e.categoryName || '' },
    { id: 'type', header: 'Tipo de evaluación', group: 'Evaluación', width: 24, kind: 'text', on: true, get: (e) => EVAL_TYPE_LABEL[e.evaluationType] || e.evaluationType },
    { id: 'year', header: 'Año', group: 'Evaluación', width: 9, kind: 'text', on: true, get: (e) => e.periodYear || '' },
    { id: 'date', header: 'Fecha', group: 'Evaluación', width: 14, kind: 'date', on: true, get: (e) => e.evaluationDate },
    { id: 'score', header: 'Puntaje', group: 'Resultado', width: 11, kind: 'int', on: true, get: (e) => e.totalScore },
    { id: 'max', header: 'Sobre', group: 'Resultado', width: 9, kind: 'int', on: true, get: (e) => evaluationMaxScore(e) },
    { id: 'pct', header: '% obtenido', group: 'Resultado', width: 13, kind: 'percent', on: true, get: (e) => evaluationPercent(e) / 100 },
    { id: 'concept', header: 'Concepto', group: 'Resultado', width: 18, kind: 'status', tone: conceptTone, on: true, get: (e) => evaluationConceptLabel(e) },
    { id: 'evaluator', header: 'Evaluador', group: 'Seguimiento', width: 28, kind: 'text', on: true, get: (e) => e.evaluatorName },
    { id: 'role', header: 'Cargo del evaluador', group: 'Seguimiento', width: 26, kind: 'text', get: (e) => e.evaluatorRole },
    {
      id: 'plan',
      header: 'Plan de mejora',
      group: 'Seguimiento',
      width: 16,
      kind: 'status',
      on: true,
      tone: (v) => (v === 'Requerido' ? 'bad' : v ? 'neutral' : undefined),
      get: (e) => (e.hasImprovementPlan ? 'Requerido' : 'No requerido'),
    },
    { id: 'planAction', header: 'Acción del plan de mejora', group: 'Seguimiento', width: 44, kind: 'long', get: (e) => e.improvementPlanAction || '' },
    { id: 'planDeadline', header: 'Fecha límite del plan', group: 'Seguimiento', width: 18, kind: 'date', get: (e) => e.improvementPlanDeadline || '' },
    { id: 'next', header: 'Próxima evaluación', group: 'Seguimiento', width: 18, kind: 'date', on: true, get: (e) => e.nextEvaluationDueDate || '' },
    { id: 'cert', header: 'Código del certificado', group: 'Seguimiento', width: 22, kind: 'text', get: (e) => e.certificateCode || '' },
    { id: 'obs', header: 'Observaciones', group: 'Seguimiento', width: 50, kind: 'long', get: (e) => e.observations || '' },
  ],
  filters: [
    { id: 'q', label: 'Buscar', kind: 'search', placeholder: 'Proveedor, NIT, expediente o evaluador', test: (e, v) => hasText(v, e.supplierName, e.supplierDoc, e.fileNumber, e.evaluatorName) },
    {
      id: 'type',
      label: 'Tipo de evaluación',
      kind: 'select',
      options: () => Object.entries(EVAL_TYPE_LABEL).map(([value, label]) => ({ value, label })),
      test: (e, v) => e.evaluationType === v,
    },
    {
      id: 'concept',
      label: 'Concepto',
      kind: 'select',
      options: (ctx) => distinct(ctx.evaluations.map((e) => evaluationConceptLabel(e))),
      test: (e, v) => evaluationConceptLabel(e) === v,
    },
    {
      id: 'plan',
      label: 'Plan de mejora',
      kind: 'select',
      options: () => [
        { value: 'YES', label: 'Requerido' },
        { value: 'NO', label: 'No requerido' },
      ],
      test: (e, v) => Boolean(e.hasImprovementPlan) === (v === 'YES'),
    },
    {
      id: 'range',
      label: '% obtenido',
      kind: 'select',
      options: () => [
        { value: '90', label: '90 % o más' },
        { value: '70', label: 'Entre 70 % y 89 %' },
        { value: '60', label: 'Entre 60 % y 69 %' },
        { value: '0', label: 'Menos de 60 %' },
      ],
      test: (e, v) => {
        const p = evaluationPercent(e);
        if (v === '90') return p >= 90;
        if (v === '70') return p >= 70 && p < 90;
        if (v === '60') return p >= 60 && p < 70;
        return p < 60;
      },
    },
    { id: 'from', label: 'Desde', kind: 'date', test: (e, v) => inRange(e.evaluationDate, v, '') },
    { id: 'to', label: 'Hasta', kind: 'date', test: (e, v) => inRange(e.evaluationDate, '', v) },
  ],
};

// ── 6. Convocatorias ─────────────────────────────────────────────────────────────────────────────
const CONV_STATUS: Record<string, string> = { ABIERTA: 'Abierta', EN_EVALUACION: 'En evaluación', ADJUDICADA: 'Adjudicada', CERRADA: 'Cerrada' };
const POST_STATUS: Record<string, string> = {
  POSTULADO: 'Postulado',
  EN_EVALUACION: 'En evaluación',
  EVALUADO: 'Evaluado',
  SELECCIONADO: 'Seleccionado',
  NO_SELECCIONADO: 'No seleccionado',
};
const convTone = (v: unknown): CellTone | undefined =>
  v === 'Abierta' || v === 'Adjudicada' || v === 'Seleccionado' ? 'good' : v === 'No seleccionado' ? 'bad' : v ? 'neutral' : undefined;

const convocatorias: ReportDef<Convocatoria> = {
  id: 'CONVOCATORIAS',
  short: 'Convocatorias',
  title: 'Convocatorias y postulaciones',
  purpose: 'Procesos de contratación publicados y las ofertas que recibió cada uno (2 hojas en el Excel).',
  icon: Briefcase,
  fileSlug: 'Convocatorias_y_postulaciones',
  sheetName: 'Convocatorias',
  noun: ['convocatoria', 'convocatorias'],
  rows: (ctx) => ctx.convocatorias,
  columns: [
    { id: 'code', header: 'Código', group: 'Convocatoria', width: 20, kind: 'text', on: true, get: (c) => c.code },
    { id: 'title', header: 'Título', group: 'Convocatoria', width: 46, kind: 'text', on: true, get: (c) => c.title },
    { id: 'category', header: 'Categoría', group: 'Convocatoria', width: 28, kind: 'text', on: true, get: (c) => c.category },
    { id: 'status', header: 'Estado', group: 'Convocatoria', width: 18, kind: 'status', tone: convTone, on: true, get: (c) => CONV_STATUS[c.status] || c.status },
    { id: 'budget', header: 'Presupuesto estimado', group: 'Convocatoria', width: 22, kind: 'money', total: 'sum', on: true, get: (c) => money(c.budgetEstimateCOP) },
    { id: 'published', header: 'Publicada', group: 'Fechas', width: 14, kind: 'date', on: true, get: (c) => c.publishedDate },
    { id: 'closing', header: 'Cierra', group: 'Fechas', width: 14, kind: 'date', on: true, get: (c) => c.closingDate },
    { id: 'count', header: 'Postulaciones', group: 'Resultado', width: 15, kind: 'int', total: 'sum', on: true, get: (c) => c.postulaciones?.length || 0 },
    {
      id: 'winner',
      header: 'Proveedor seleccionado',
      group: 'Resultado',
      width: 34,
      kind: 'text',
      get: (c) => (c.postulaciones || []).filter((p) => p.status === 'SELECCIONADO').map((p) => p.supplierName).join(', '),
    },
    { id: 'description', header: 'Descripción', group: 'Convocatoria', width: 56, kind: 'long', get: (c) => c.description || '' },
  ],
  filters: [
    { id: 'q', label: 'Buscar', kind: 'search', placeholder: 'Código, título o categoría', test: (c, v) => hasText(v, c.code, c.title, c.category) },
    {
      id: 'status',
      label: 'Estado',
      kind: 'select',
      options: () => Object.entries(CONV_STATUS).map(([value, label]) => ({ value, label })),
      test: (c, v) => c.status === v,
    },
    { id: 'category', label: 'Categoría', kind: 'select', options: (ctx) => distinct(ctx.convocatorias.map((c) => c.category)), test: (c, v) => c.category === v },
    {
      id: 'posts',
      label: 'Postulaciones',
      kind: 'select',
      options: () => [
        { value: 'WITH', label: 'Con postulaciones' },
        { value: 'WITHOUT', label: 'Sin postulaciones' },
      ],
      test: (c, v) => ((c.postulaciones?.length || 0) > 0) === (v === 'WITH'),
    },
  ],
  extraSheets: (rows, ctx) => {
    const columns: SheetColumn[] = [
      { header: 'Convocatoria', width: 20, kind: 'text' },
      { header: 'Título', width: 40, kind: 'text' },
      { header: 'No. de expediente', width: 22, kind: 'text' },
      { header: 'Proponente', width: 36, kind: 'text' },
      { header: 'NIT / cédula', width: 18, kind: 'text' },
      { header: 'Fecha de postulación', width: 18, kind: 'date' },
      { header: 'Estado', width: 18, kind: 'status', tone: convTone },
      { header: 'Propuesta económica', width: 22, kind: 'money', total: 'sum' },
      { header: 'Puntaje técnico', width: 14, kind: 'int' },
      { header: 'Puntaje económico', width: 14, kind: 'int' },
      { header: 'Resumen / observaciones', width: 56, kind: 'long' },
    ];
    const data: unknown[][] = [];
    rows.forEach((c) =>
      (c.postulaciones || []).forEach((p: ConvocatoriaPostulacion) => {
        const dossier = ctx.dossiers.find((d) => d.id === p.supplierId || d.fileNumber === p.fileNumber);
        data.push([
          c.code,
          c.title,
          p.fileNumber || dossier?.fileNumber || '',
          dossier ? nameOf(dossier) : p.supplierName,
          dossier ? docOf(dossier) : p.nitOrDoc,
          p.submittedAt,
          POST_STATUS[p.status] || p.status,
          typeof p.proposedValue === 'number' ? p.proposedValue : null,
          typeof p.technicalScore === 'number' ? p.technicalScore : null,
          typeof p.economicScore === 'number' ? p.economicScore : null,
          p.proposalSummary || p.feedback || '',
        ]);
      })
    );
    return [
      {
        name: 'Postulaciones',
        title: 'Postulaciones recibidas por convocatoria',
        meta: `${data.length} postulaciones`,
        columns,
        rows: data,
        freezeCols: 1,
      },
    ];
  },
};

// ── 7. Auditoría ─────────────────────────────────────────────────────────────────────────────────
const AUDIT_ACTION: Record<string, string> = {
  EDICION_CAMPO: 'Edición de campo',
  CAMBIO_ESTADO: 'Cambio de estado',
  REVISION_DOCUMENTO: 'Revisión de documento',
  VALIDACION_SARLAFT: 'Validación SARLAFT',
  ALTA_PROVEEDOR: 'Alta de proveedor',
  CREACION_EXPEDIENTE: 'Creación de expediente',
  PARAMETRIZACION_SISTEMA: 'Parametrización del sistema',
  CREACION_REGISTRO: 'Creación de registro',
  ASIGNACION_REVISOR: 'Asignación de revisor',
  CALIFICACION_PROVEEDOR: 'Calificación de proveedor',
};
const auditActionLabel = (a: string) => AUDIT_ACTION[a] || a;
const ROLE_LABEL: Record<string, string> = { ADMIN: 'Administrador', REVISOR: 'Revisor', SYSTEM: 'Sistema' };

const auditoria: ReportDef<SystemAuditEntry> = {
  id: 'AUDITORIA',
  short: 'Auditoría',
  title: 'Registro de auditoría',
  purpose: 'Quién cambió qué y cuándo: valor anterior, valor nuevo y justificación de cada cambio.',
  icon: History,
  fileSlug: 'Registro_de_auditoria',
  sheetName: 'Auditoría',
  noun: ['evento', 'eventos'],
  rows: (ctx) => [...ctx.auditLogs].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp))),
  freezeCols: 1,
  columns: [
    { id: 'when', header: 'Fecha y hora', group: 'Cuándo y quién', width: 20, kind: 'datetime', on: true, get: (l) => l.timestamp },
    { id: 'user', header: 'Usuario', group: 'Cuándo y quién', width: 28, kind: 'text', on: true, get: (l) => l.user },
    { id: 'role', header: 'Rol', group: 'Cuándo y quién', width: 16, kind: 'text', on: true, get: (l) => ROLE_LABEL[l.userRole] || l.userRole },
    { id: 'action', header: 'Acción', group: 'Qué se hizo', width: 26, kind: 'text', on: true, get: (l) => auditActionLabel(l.action) },
    { id: 'section', header: 'Sección', group: 'Qué se hizo', width: 24, kind: 'text', on: true, get: (l) => l.section },
    { id: 'supplier', header: 'Proveedor', group: 'Qué se hizo', width: 34, kind: 'text', on: true, get: (l) => l.supplierName || '' },
    { id: 'file', header: 'No. de expediente', group: 'Qué se hizo', width: 22, kind: 'text', get: (l) => l.fileNumber || '' },
    { id: 'field', header: 'Campo modificado', group: 'Qué cambió', width: 26, kind: 'text', on: true, get: (l) => l.fieldChanged },
    { id: 'old', header: 'Valor anterior', group: 'Qué cambió', width: 30, kind: 'long', on: true, get: (l) => l.oldValue },
    { id: 'new', header: 'Valor nuevo', group: 'Qué cambió', width: 30, kind: 'long', on: true, get: (l) => l.newValue },
    { id: 'why', header: 'Justificación', group: 'Qué cambió', width: 44, kind: 'long', on: true, get: (l) => l.justification || '' },
  ],
  filters: [
    {
      id: 'q',
      label: 'Buscar',
      kind: 'search',
      placeholder: 'Usuario, proveedor, campo o justificación',
      test: (l, v) => hasText(v, l.user, l.supplierName, l.fileNumber, l.fieldChanged, l.justification, l.oldValue, l.newValue),
    },
    { id: 'action', label: 'Acción', kind: 'select', options: (ctx) => distinct(ctx.auditLogs.map((l) => l.action)).map((o) => ({ value: o.value, label: auditActionLabel(o.value) })), test: (l, v) => l.action === v },
    { id: 'section', label: 'Sección', kind: 'select', options: (ctx) => distinct(ctx.auditLogs.map((l) => l.section)), test: (l, v) => l.section === v },
    { id: 'role', label: 'Rol', kind: 'select', options: (ctx) => distinct(ctx.auditLogs.map((l) => l.userRole)).map((o) => ({ value: o.value, label: ROLE_LABEL[o.value] || o.value })), test: (l, v) => l.userRole === v },
    { id: 'from', label: 'Desde', kind: 'date', test: (l, v) => inRange(l.timestamp, v, '') },
    { id: 'to', label: 'Hasta', kind: 'date', test: (l, v) => inRange(l.timestamp, '', v) },
  ],
};

export const REPORTS: ReportDef[] = [directorio, documentos, sarlaft, finanzas, evaluaciones, convocatorias, auditoria];
export const reportById = (id: ReportId): ReportDef => REPORTS.find((r) => r.id === id) as ReportDef;

// ── Filtros, formato y armado de hojas ───────────────────────────────────────────────────────────
export type FilterValues = Record<string, string>;
export const defaultColumns = (def: ReportDef): string[] => def.columns.filter((c) => c.on).map((c) => c.id);

export function applyFilters(def: ReportDef, ctx: ReportCtx, values: FilterValues): any[] {
  const active = def.filters.filter((f) => (values[f.id] || '').trim() !== '');
  return def.rows(ctx).filter((row) => active.every((f) => f.test(row, values[f.id].trim(), ctx)));
}

export const activeFilterCount = (def: ReportDef, values: FilterValues) =>
  def.filters.filter((f) => (values[f.id] || '').trim() !== '').length;

/** «Estado: Habilitado · Tipo de persona: Persona jurídica» */
export function describeFilters(def: ReportDef, ctx: ReportCtx, values: FilterValues): string {
  const parts = def.filters
    .filter((f) => (values[f.id] || '').trim() !== '')
    .map((f) => {
      const v = values[f.id].trim();
      if (f.kind === 'select') return `${f.label}: ${f.options?.(ctx).find((o) => o.value === v)?.label || v}`;
      if (f.kind === 'date') return `${f.label}: ${displayDate(v)}`;
      return `${f.label}: «${v}»`;
    });
  return parts.length ? parts.join('  ·  ') : 'Ninguno (todos los registros)';
}

/** Texto para mostrar una celda en la vista previa. */
export function formatCell(kind: CellKind, value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  switch (kind) {
    case 'money':
      return typeof value === 'number' ? `$ ${Math.round(value).toLocaleString('es-CO')}` : String(value);
    case 'percent':
      return typeof value === 'number' ? `${Math.round(value * 100)} %` : String(value);
    case 'int':
      return typeof value === 'number' ? value.toLocaleString('es-CO') : String(value);
    case 'date':
      return displayDate(value as string);
    case 'datetime': {
      const d = parseLocalDate(value as string);
      if (!d) return String(value);
      const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      return `${displayDate(value as string)} ${time}`;
    }
    default:
      return String(value);
  }
}

const stamp = () => {
  const n = new Date();
  return `${displayDate(n.toISOString().slice(0, 10))} ${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
};
export const fileDate = () => new Date().toISOString().slice(0, 10);

export function buildSheets(def: ReportDef, ctx: ReportCtx, rows: any[], columnIds: string[], filtersText: string): SheetSpec[] {
  const cols = def.columns.filter((c) => columnIds.includes(c.id));
  const main: SheetSpec = {
    name: def.sheetName,
    title: def.title,
    meta: `Generado el ${stamp()}  ·  por ${ctx.userName}  ·  ${rows.length} ${rows.length === 1 ? def.noun[0] : def.noun[1]}`,
    filters: filtersText,
    columns: cols.map((c) => ({ header: c.header, width: c.width, kind: c.kind, total: c.total, tone: c.tone })),
    rows: rows.map((row) => cols.map((c) => c.get(row, ctx))),
    freezeCols: def.freezeCols ?? 1,
  };
  const extra = def.extraSheets ? def.extraSheets(rows, ctx) : [];
  return [main, ...extra.map((s) => ({ ...s, meta: `Generado el ${stamp()}  ·  por ${ctx.userName}  ·  ${s.meta}` }))];
}

/** Libro con todas las hojas y un resumen al inicio (sin filtros, columnas por defecto). */
export function buildConsolidated(ctx: ReportCtx): { summary: SummarySpec; sheets: SheetSpec[] } {
  const ds = ctx.dossiers;
  const total = ds.length || 1;
  const count = (fn: (d: SupplierDossier) => boolean) => ds.filter(fn).length;
  const habil = count((d) => supplierStage(d) === 'Habilitado');
  const venc = count((d) => supplierStage(d) === 'Documento vencido');
  const pend = ds.length - habil - venc;
  const juridica = count((d) => !isNatural(d));
  const natural = count(isNatural);
  const avgDocs = ds.length ? ds.reduce((acc, d) => acc + docStats(d, ctx).pct, 0) / ds.length : 0;
  const withPdf = count((d) => Boolean(sarlaftOf(d)?.fileUrl || sarlaftOf(d)?.fileName));
  const approved = count((d) => Boolean(sarlaftOf(d)?.approved));
  const avgEval = ctx.evaluations.length ? ctx.evaluations.reduce((acc, e) => acc + evaluationPercent(e), 0) / ctx.evaluations.length / 100 : 0;
  const openConv = ctx.convocatorias.filter((c) => c.status === 'ABIERTA').length;

  const summary: SummarySpec = {
    name: 'Resumen',
    title: 'Resumen ejecutivo de proveedores',
    meta: `Generado el ${stamp()}  ·  por ${ctx.userName}`,
    sections: [
      {
        heading: 'Proveedores por estado',
        rows: [
          { label: 'Total de proveedores en el banco', value: ds.length, share: 1 },
          { label: 'Habilitados', value: habil, share: habil / total },
          { label: 'Pendientes (faltan documentos por cargar o aprobar)', value: pend, share: pend / total },
          { label: 'Con documento vencido', value: venc, share: venc / total },
        ],
      },
      {
        heading: 'Proveedores por tipo',
        rows: [
          { label: 'Personas jurídicas', value: juridica, share: juridica / total },
          { label: 'Personas naturales', value: natural, share: natural / total },
          ...(['A', 'B', 'C'] as const).map((t) => {
            const n = count((d) => tierOf(d) === t);
            return { label: TIER_LABEL[t], value: n, share: n / total };
          }),
        ],
      },
      {
        heading: 'Cumplimiento y control',
        rows: [
          { label: 'Documentos obligatorios al día (promedio)', value: `${Math.round(avgDocs * 100)} %`, share: avgDocs },
          { label: 'Proveedores con PDF de SARLAFT cargado', value: withPdf, share: withPdf / total },
          { label: 'Proveedores con SARLAFT aprobado', value: approved, share: approved / total },
          { label: 'Evaluaciones registradas', value: ctx.evaluations.length },
          { label: 'Puntaje promedio de las evaluaciones', value: `${Math.round(avgEval * 100)} %`, share: avgEval },
          { label: 'Convocatorias abiertas', value: openConv },
          { label: 'Eventos de auditoría registrados', value: ctx.auditLogs.length },
        ],
      },
    ],
  };

  const sheets = REPORTS.flatMap((def) => buildSheets(def, ctx, def.rows(ctx), defaultColumns(def), 'Ninguno (todos los registros)'));
  return { summary, sheets };
}
