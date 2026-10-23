import { EvaluationMethodConfig, SupplierEvaluation } from '../types';

export const INITIAL_EVALUATION_METHOD: EvaluationMethodConfig = {
  id: 'method-sig-01',
  title: 'Metodología Institucional de Calificación SIG - Flota Sugamuxi S.A.',
  description:
    'Modelo estandarizado para la evaluación inicial de admisión al crear el proveedor y la evaluación de desempeño anual periódica a los 365 días de su creación.',
  initialPassingScore: 70,
  annualPassingScore: 75,
  excellentThreshold: 90,
  conditionalThreshold: 60,
  annualPeriodicityDays: 365,
  thresholds: {
    sobresalienteMin: 90,
    conformeMin: 70,
    condicionalMin: 60,
  },
  criteria: [
    {
      id: 'crit-01',
      name: 'Calidad Técnica y Especificaciones del Suministro / Servicio',
      category: 'Calidad y Especificaciones',
      description:
        'Conformidad con las fichas técnicas, normatividad vigente, certificados de calidad de producto y ausencia de defectos o garantías reiteradas.',
      weight: 30,
      weightInitial: 30,
      weightAnnual: 30,
      appliesTo: 'AMBOS',
      minPassingScore: 70,
      minScoreToPass: 70,
      order: 1,
      isActive: true,
    },
    {
      id: 'crit-02',
      name: 'Oportunidad en Entregas y Capacidad Logística',
      category: 'Oportunidad y Entregas',
      description:
        'Cumplimiento estricto de tiempos de entrega pactados en órdenes de compra, capacidad de stock en Boyacá/terminales y atención de contingencias operativas.',
      weight: 25,
      weightInitial: 25,
      weightAnnual: 25,
      appliesTo: 'AMBOS',
      minPassingScore: 70,
      minScoreToPass: 70,
      order: 2,
      isActive: true,
    },
    {
      id: 'crit-03',
      name: 'Seguridad y Salud en el Trabajo (SG-SST), HSEQ y SARLAFT',
      category: 'HSEQ y Normatividad',
      description:
        'Acreditación de estándares mínimos SG-SST (Res. 0312), planillas PILA al día, vigencia de pólizas RCE y transparencia en listas restrictivas.',
      weight: 20,
      weightInitial: 20,
      weightAnnual: 20,
      appliesTo: 'AMBOS',
      minPassingScore: 75,
      minScoreToPass: 75,
      order: 3,
      isActive: true,
    },
    {
      id: 'crit-04',
      name: 'Soporte Postventa, Garantías y Capacidad de Respuesta',
      category: 'Garantía y Servicio',
      description:
        'Eficacia en trámites de garantías, reposición inmediata de piezas no conformes, asesoría técnica calificada y disposición del canal de atención.',
      weight: 15,
      weightInitial: 15,
      weightAnnual: 15,
      appliesTo: 'AMBOS',
      minPassingScore: 65,
      minScoreToPass: 65,
      order: 4,
      isActive: true,
    },
    {
      id: 'crit-05',
      name: 'Gestión Comercial, Facturación Electrónica y Estabilidad de Precios',
      category: 'Comercial y Financiera',
      description:
        'Emisión correcta de facturas electrónicas validadas por DIAN, concordancia con cotizaciones aprobadas y respeto a los acuerdos comerciales pactados.',
      weight: 10,
      weightInitial: 10,
      weightAnnual: 10,
      appliesTo: 'AMBOS',
      minPassingScore: 60,
      minScoreToPass: 60,
      order: 5,
      isActive: true,
    },
  ],
};

/**
 * Evaluaciones de proveedores iniciales (vaciadas para operar directamente con la base de datos Supabase).
 */
export const INITIAL_SUPPLIER_EVALUATIONS: SupplierEvaluation[] = [];
