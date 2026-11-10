import {
  SupplierDossier,
  SupplierEvaluation,
  ProcessStatus,
  SupplierTier,
  DocumentStatus,
  ContractValidityStatus,
  EvaluationConcept,
  EvaluationType,
} from '../types';

/**
 * Datos de DEMOSTRACIÓN para revisar el diseño en local.
 * Solo se cargan con VITE_DEMO_MODE=true en `npm run dev`; nunca en producción.
 * Todos los nombres, NIT y cifras son inventados.
 */
export const IS_DEMO_MODE = import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true';

const isoDate = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};
const stamp = (offsetDays: number) => `${isoDate(offsetDays)} 09:30`;

const REVIEWERS: Record<string, string> = {
  'revisor-1': 'Ing. Carlos Mendoza',
  'revisor-2': 'Dra. María Fernanda Ortiz',
  'revisor-3': 'Ing. Juan Pablo Gómez',
};

interface Seed {
  name: string;
  natural?: boolean;
  doc: string;
  city: string;
  category: string;
  tier: SupplierTier;
  status: ProcessStatus;
  reviewer: keyof typeof REVIEWERS;
  createdDaysAgo: number;
  docs: Array<[string, string, DocumentStatus, number?]>; // código, nombre, estado, vence en N días
  contract?: [ContractValidityStatus, number]; // estado, termina en N días
}

const BASE_DOCS: Array<[string, string]> = [
  ['RUT', 'Registro Único Tributario (RUT)'],
  ['CAMARA_COMERCIO', 'Certificado de Cámara de Comercio'],
  ['SEGURIDAD_SOCIAL', 'Pago de seguridad social'],
  ['CERTIFICACION_BANCARIA', 'Certificación bancaria'],
  ['FS_GA_FOR_009', 'Formulario de proveedor FS.GA-FOR-009'],
  ['FS_GA_FOR_039', 'Autorización de datos FS.GA-FOR-039'],
];

const docs = (statuses: DocumentStatus[], expiring: Record<number, number> = {}) =>
  BASE_DOCS.map(([code, name], i) => [code, name, statuses[i] ?? 'PENDIENTE', expiring[i]] as [string, string, DocumentStatus, number?]);

const ALL_OK: DocumentStatus[] = ['APROBADO', 'APROBADO', 'VIGENTE', 'APROBADO', 'APROBADO', 'APROBADO'];

const SEEDS: Seed[] = [
  { name: 'Repuestos Andinos S.A.S.', doc: '900456781', city: 'Sogamoso', category: 'Mantenimiento Automotriz y Repuestos', tier: 'A', status: 'PROVEEDOR_HABILITADO', reviewer: 'revisor-1', createdDaysAgo: 210, docs: docs(ALL_OK, { 2: 140 }), contract: ['VIGENTE', 190] },
  { name: 'Llantas del Oriente Ltda.', doc: '830221457', city: 'Duitama', category: 'Llantas y Neumáticos', tier: 'A', status: 'PROVEEDOR_HABILITADO', reviewer: 'revisor-1', createdDaysAgo: 180, docs: docs(ALL_OK, { 2: 18 }), contract: ['POR_VENCER', 24] },
  { name: 'Combustibles Boyacá S.A.', doc: '891802113', city: 'Tunja', category: 'Combustibles y Lubricantes', tier: 'A', status: 'PROVEEDOR_HABILITADO', reviewer: 'revisor-2', createdDaysAgo: 320, docs: docs(ALL_OK, { 2: 60 }), contract: ['VIGENTE', 280] },
  { name: 'Seguridad Integral del Centro', doc: '901334520', city: 'Sogamoso', category: 'Vigilancia y Seguridad', tier: 'B', status: 'EN_REVISION', reviewer: 'revisor-2', createdDaysAgo: 12, docs: docs(['APROBADO', 'EN_REVISION', 'CARGADO', 'CARGADO', 'APROBADO', 'APROBADO']) },
  { name: 'Lavautos La Pradera', doc: '1052398744', natural: true, city: 'Sogamoso', category: 'Aseo y Lavado de Vehículos', tier: 'C', status: 'REQUIERE_CORRECCION', reviewer: 'revisor-3', createdDaysAgo: 30, docs: docs(['APROBADO', 'REQUIERE_CORRECCION', 'VENCIDO', 'APROBADO', 'APROBADO', 'PENDIENTE']) },
  { name: 'Tecnidiesel Sugamuxi', doc: '900887412', city: 'Sogamoso', category: 'Mantenimiento Automotriz y Repuestos', tier: 'B', status: 'DOCUMENTACION_PENDIENTE', reviewer: 'revisor-1', createdDaysAgo: 6, docs: docs(['CARGADO', 'PENDIENTE', 'PENDIENTE', 'CARGADO', 'PENDIENTE', 'PENDIENTE']) },
  { name: 'Papelería y Suministros Tundama', doc: '830117650', city: 'Duitama', category: 'Papelería y Oficina', tier: 'C', status: 'PROVEEDOR_HABILITADO', reviewer: 'revisor-3', createdDaysAgo: 400, docs: docs(ALL_OK, { 2: -9 }), contract: ['VENCIDO', -15] },
  { name: 'Uniformes Lago de Tota', doc: '901220019', city: 'Aquitania', category: 'Dotación y Uniformes', tier: 'C', status: 'APROBADO', reviewer: 'revisor-3', createdDaysAgo: 45, docs: docs(ALL_OK, { 2: 75 }) },
  { name: 'Transportes Especiales Iza', doc: '900612388', city: 'Iza', category: 'Transporte Especial', tier: 'B', status: 'CORREGIDO_EN_REVISION', reviewer: 'revisor-2', createdDaysAgo: 22, docs: docs(['APROBADO', 'APROBADO', 'EN_REVISION', 'APROBADO', 'EN_REVISION', 'APROBADO']) },
  { name: 'Electroautos Firavitoba', doc: '1057412236', natural: true, city: 'Firavitoba', category: 'Electricidad Automotriz', tier: 'B', status: 'PROVEEDOR_HABILITADO', reviewer: 'revisor-1', createdDaysAgo: 150, docs: docs(ALL_OK, { 2: 9 }), contract: ['VIGENTE', 120] },
  { name: 'Asesorías Contables Monguí', doc: '901455807', city: 'Monguí', category: 'Servicios Profesionales', tier: 'C', status: 'BORRADOR', reviewer: 'revisor-3', createdDaysAgo: 2, docs: docs([]) },
  { name: 'Vidrios y Parabrisas Nobsa', doc: '900301772', city: 'Nobsa', category: 'Carrocería y Vidrios', tier: 'B', status: 'SUSPENDIDO', reviewer: 'revisor-2', createdDaysAgo: 260, docs: docs(['APROBADO', 'VENCIDO', 'VENCIDO', 'APROBADO', 'APROBADO', 'APROBADO']), contract: ['SUSPENDIDO', 40] },
  { name: 'Software de Flotas Andino', doc: '901602241', city: 'Bogotá', category: 'Tecnología y Software', tier: 'A', status: 'EN_REVISION', reviewer: 'revisor-1', createdDaysAgo: 9, docs: docs(['APROBADO', 'APROBADO', 'CARGADO', 'EN_REVISION', 'APROBADO', 'CARGADO']) },
  { name: 'Frenos y Suspensiones Tópaga', doc: '900145863', city: 'Tópaga', category: 'Mantenimiento Automotriz y Repuestos', tier: 'B', status: 'PROVEEDOR_HABILITADO', reviewer: 'revisor-2', createdDaysAgo: 290, docs: docs(ALL_OK, { 2: 33 }), contract: ['VIGENTE', 65] },
];

const emptyConcepts = (done: boolean) => ({
  sarlatfCheck: { checked: done, result: done ? 'SIN_COINCIDENCIAS' : 'PENDIENTE' },
  ofacCheck: { checked: done, result: done ? 'LIMPIO' : 'PENDIENTE' },
  procuraduriaPoliciaCheck: { checked: done, result: done ? 'VIGENTE_SIN_ANTECEDENTES' : 'PENDIENTE' },
  legalConcept: { status: done ? 'APROBADO' : 'PENDIENTE' },
  financialConcept: { status: done ? 'APROBADO' : 'PENDIENTE' },
  hseqConcept: { status: done ? 'APROBADO' : 'PENDIENTE' },
}) as SupplierDossier['internalConcepts'];

const APPROVED: ProcessStatus[] = ['APROBADO', 'PROVEEDOR_HABILITADO'];

const buildDossiers = (): SupplierDossier[] => SEEDS.map((s, i) => {
  const seq = String(i + 1).padStart(6, '0');
  const documents: SupplierDossier['documents'] = {};
  s.docs.forEach(([code, name, status, expiresIn]) => {
    const loaded = status !== 'PENDIENTE';
    documents[code] = {
      id: `demo-doc-${i}-${code}`,
      code,
      name,
      isRequired: true,
      isInstitutionalForm: code.startsWith('FS_GA'),
      status,
      fileName: loaded ? `${code.toLowerCase()}.pdf` : undefined,
      fileSize: loaded ? '420 KB' : undefined,
      uploadedAt: loaded ? stamp(-s.createdDaysAgo + 1) : undefined,
      expirationDate: expiresIn !== undefined ? isoDate(expiresIn) : undefined,
    };
  });
  const contract = s.contract
    ? {
        contractNumber: `CT-2026-${String(40 + i).padStart(3, '0')}`,
        contractType: 'SUMINISTRO',
        objectDescription: `Suministro de ${s.category.toLowerCase()}`,
        startDate: isoDate(s.contract[1] - 365),
        endDate: isoDate(s.contract[1]),
        contractValueCOP: 18_000_000 + i * 7_500_000,
        contractStatus: s.contract[0],
      }
    : undefined;
  return {
    id: `demo-${seq}`,
    fileNumber: `FS-PROV-2026-${seq}`,
    supplierType: s.natural ? 'NATURAL' : 'JURIDICA',
    supplierTier: s.tier,
    basicInfo: {
      supplierType: s.natural ? 'NATURAL' : 'JURIDICA',
      supplierTier: s.tier,
      email: `contacto${i + 1}@proveedor-demo.co`,
      phone: `310 555 ${String(1000 + i * 37).slice(0, 4)}`,
      city: s.city,
      department: s.city === 'Bogotá' ? 'Cundinamarca' : 'Boyacá',
      ...(s.natural
        ? { fullName: s.name, documentType: 'CC' as const, documentNumber: s.doc }
        : { companyName: s.name, nit: s.doc, dv: String(i % 10), representativeLegalName: 'Representante de ejemplo' }),
    },
    isEmailVerified: s.status !== 'BORRADOR',
    selectedCategory: s.category,
    economicActivity: s.category,
    documents,
    processStatus: s.status,
    internalConcepts: emptyConcepts(APPROVED.includes(s.status)),
    auditHistory: [
      { id: `demo-aud-${i}`, timestamp: stamp(-s.createdDaysAgo), action: 'Expediente creado', user: 'Administrador', role: 'ADMIN' },
    ],
    createdAt: stamp(-s.createdDaysAgo),
    updatedAt: stamp(-Math.min(s.createdDaysAgo, (i % 5) + 1)),
    submittedAt: s.status === 'BORRADOR' ? undefined : stamp(-s.createdDaysAgo + 2),
    assignedReviewerId: s.reviewer,
    assignedReviewerName: REVIEWERS[s.reviewer],
    contractInfo: contract,
  } as SupplierDossier;
});

const CRITERIA = [
  ['crit-01', 'Calidad Técnica y Especificaciones del Suministro / Servicio', 'Calidad y Especificaciones', 30],
  ['crit-02', 'Oportunidad en Entregas y Capacidad Logística', 'Oportunidad y Entregas', 25],
  ['crit-03', 'Seguridad y Salud en el Trabajo (SG-SST), HSEQ y SARLAFT', 'HSEQ y Normatividad', 20],
  ['crit-04', 'Soporte Postventa, Garantías y Capacidad de Respuesta', 'Garantía y Servicio', 15],
  ['crit-05', 'Gestión Comercial, Facturación Electrónica y Estabilidad de Precios', 'Comercial y Financiera', 10],
] as const;

const conceptFor = (score: number): EvaluationConcept =>
  score >= 90 ? 'SOBRESALIENTE' : score >= 70 ? 'CONFORME' : score >= 60 ? 'CONDICIONAL_MEJORA' : 'NO_CONFORME';

const EVAL_SEEDS: Array<[number, EvaluationType, number[], number]> = [
  // índice del proveedor, tipo, puntajes por criterio, hace N días
  [0, 'INICIAL', [92, 95, 90, 88, 94], 200],
  [0, 'ANUAL_1_ANO', [94, 91, 93, 90, 96], 20],
  [1, 'INICIAL', [85, 80, 78, 82, 75], 170],
  [2, 'INICIAL', [96, 94, 92, 95, 90], 300],
  [2, 'ANUAL_1_ANO', [72, 65, 70, 68, 74], 35],
  [6, 'INICIAL', [62, 58, 66, 60, 55], 380],
  [9, 'INICIAL', [78, 82, 75, 80, 70], 140],
  [13, 'INICIAL', [88, 84, 90, 86, 80], 280],
  [11, 'ANUAL_1_ANO', [55, 50, 48, 60, 58], 60],
];

const buildEvaluations = (dossiers: SupplierDossier[]): SupplierEvaluation[] => EVAL_SEEDS.map(([idx, type, scores, daysAgo], n) => {
  const d = dossiers[idx];
  const name = d.basicInfo.companyName || d.basicInfo.fullName || '';
  const total = Math.round(CRITERIA.reduce((acc, c, k) => acc + (scores[k] * c[3]) / 100, 0));
  return {
    id: `demo-eval-${n}`,
    dossierId: d.id,
    supplierName: name,
    supplierDoc: d.basicInfo.nit || d.basicInfo.documentNumber || '',
    fileNumber: d.fileNumber,
    supplierTier: d.supplierTier,
    categoryName: d.selectedCategory,
    evaluationType: type,
    annualCycleNumber: type === 'INICIAL' ? undefined : 1,
    periodYear: 2026,
    evaluationDate: isoDate(-daysAgo),
    evaluatorId: d.assignedReviewerId || 'revisor-1',
    evaluatorName: d.assignedReviewerName || 'Revisor',
    evaluatorRole: 'REVISOR',
    totalScore: total,
    concept: conceptFor(total),
    criteriaScores: CRITERIA.map((c, k) => ({ criterionId: c[0], criterionName: c[1], category: c[2], weight: c[3], score: scores[k] })),
    hasImprovementPlan: total < 70,
    improvementPlanAction: total < 70 ? 'Plan de mejora en tiempos de entrega' : undefined,
    nextEvaluationDueDate: isoDate(365 - daysAgo),
    status: 'COMPLETADA',
    certificateCode: `CAL-2026-${String(n + 1).padStart(4, '0')}`,
    createdAt: stamp(-daysAgo),
  };
});

/**
 * Arma los datos de ejemplo. Es una función (y no datos sueltos) para que la
 * versión de producción no los incluya: solo se llama en `npm run dev` con demo.
 */
export function buildDemoData(): { dossiers: SupplierDossier[]; evaluations: SupplierEvaluation[] } {
  const dossiers = buildDossiers();
  const evaluations = buildEvaluations(dossiers);
  // Las pantallas leen las evaluaciones desde cada expediente
  evaluations.forEach((ev) => {
    const d = dossiers.find((x) => x.id === ev.dossierId);
    if (d) d.evaluations = [...(d.evaluations || []), ev];
  });
  return { dossiers, evaluations };
}
