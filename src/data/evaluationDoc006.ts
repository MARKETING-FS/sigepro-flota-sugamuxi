/**
 * Formato FS.GA-DOC-006 v6.0 — «Evaluación de criterios de selección de proveedores y clientes».
 * Es un documento controlado del Sistema Integrado de Gestión: la evaluación INICIAL se califica
 * siempre con estos seis criterios (20 puntos cada uno, 120 en total) y se aprueba con 76 puntos o más.
 * Los textos repiten, palabra por palabra, los de la segunda hoja del formato oficial.
 */
export interface Doc006Option {
  /** Puntos que otorga esta opción (20, 15, 10 o 5). */
  points: number;
  /** Cómo se mide: texto de la opción tal como aparece en el formato. */
  label: string;
}

export interface Doc006Criterion {
  id: string;
  /** Numeral romano que usa la primera hoja del formato (I, II, III…). */
  roman: string;
  name: string;
  /** Descripción genérica del criterio (qué se está evaluando). */
  description: string;
  options: Doc006Option[];
  /** Línea que el formato pone antes de las opciones. */
  note?: string;
}

export const DOC006_CODE = 'FS.GA-DOC-006';
export const DOC006_VERSION = '6.0';
export const DOC006_DATE = '01/11/2024';
export const DOC006_AREA = 'GESTION ADMINISTRATIVA';
export const DOC006_TITLE = 'Evaluación de criterios de selección de proveedores y clientes';
export const DOC006_FOOTER = 'Consulte el listado maestro para verificar la versión actualizada del documento';
export const DOC006_MAX_PER_CRITERION = 20;
/** Puntaje mínimo para que se pueda aprobar la vinculación como proveedor. */
export const DOC006_PASSING_SCORE = 76;

export const DOC006_CRITERIA: Doc006Criterion[] = [
  {
    id: 'doc006-calidad',
    roman: 'I',
    name: 'Estándares de Calidad',
    description:
      'Este criterio está definido por el desempeño real de los mismos y su competencia para cumplir con los requisitos descritos en las especificaciones de compra, incluyendo el tiempo efectivo de garantía de la adquisición.',
    options: [
      { points: 20, label: 'Satisface totalmente la calidad' },
      { points: 15, label: 'Satisface medianamente la calidad' },
      { points: 10, label: 'Presenta baja calidad' },
      { points: 5, label: 'No satisface la calidad' },
    ],
  },
  {
    id: 'doc006-precio',
    roman: 'II',
    name: 'Precio',
    description: 'Este criterio se refiere al valor en pesos del producto adquirido.',
    options: [
      { points: 20, label: 'Bajo el promedio (Descuento sobre un 5%)' },
      { points: 15, label: 'Bajo el promedio (hasta un 5% Descuento)' },
      { points: 10, label: 'Precios iguales al mercado' },
      { points: 5, label: 'Precios sobre el promedio (hasta un 5% más)' },
    ],
  },
  {
    id: 'doc006-certificaciones',
    roman: 'III',
    name: 'Certificaciones',
    description:
      'Este criterio se refiere al respaldo que tiene la empresa, producto y/o servicio de certificaciones de calidad, seguridad y salud en el trabajo y demás.',
    options: [
      { points: 20, label: 'Cuenta con más de una certificación' },
      { points: 15, label: 'Cuenta con certificación de producto o servicio' },
      { points: 10, label: 'Cuenta con certificación de los procesos' },
      { points: 5, label: 'No cuenta con certificaciones' },
    ],
  },
  {
    id: 'doc006-referencias',
    roman: 'IV',
    name: 'Referencias y oferta',
    description:
      'Este criterio indica el nivel de cumplimiento de los plazos y acuerdos establecidos en la oferta y/o cotización.',
    options: [
      { points: 20, label: 'Tiene excelentes recomendaciones y satisface totalmente las necesidades de plazos y acuerdos' },
      { points: 15, label: 'Tiene buenas recomendaciones y satisface regularmente las necesidades los plazos y acuerdos' },
      { points: 10, label: 'Tiene Regulares recomendaciones y satisface mínimamente las necesidades de plazos y acuerdos' },
      { points: 5, label: 'No cuenta con recomendaciones y no Satisface las necesidades los plazos y acuerdos' },
    ],
  },
  {
    id: 'doc006-laboral',
    roman: 'V',
    name: 'Cumplimiento laboral',
    description: 'Este criterio mide el nivel de cumplimiento de requisitos legales.',
    options: [
      { points: 20, label: 'Cuenta con certificaciones en seguridad y salud en el trabajo' },
      {
        points: 15,
        label: 'Muestra documentación donde se evidencia la implementación de un sistema de gestión de seguridad y salud en el trabajo',
      },
      { points: 10, label: 'Muestra documentación donde se evidencia la implementación del decreto 1072 capítulo 6' },
      { points: 5, label: 'No se evidencia la implementación del SST' },
    ],
  },
  {
    id: 'doc006-sst',
    roman: 'VI',
    name: 'Seguridad y Salud en el Trabajo',
    description: 'Cumplimiento de la implementación del sistema de gestión de seguridad y salud en el trabajo.',
    note: 'De acuerdo a la tabla de valores de estándares mínimos del SGSST:',
    options: [
      { points: 20, label: 'Puntaje obtenido mayor al 85%' },
      { points: 15, label: 'Puntaje obtenido está entre 61 y 84%' },
      { points: 10, label: 'Puntaje obtenido está entre 51 y 60%' },
      { points: 5, label: 'Puntaje obtenido es menor que 50%' },
    ],
  },
];

export const DOC006_MAX_SCORE = DOC006_CRITERIA.length * DOC006_MAX_PER_CRITERION;
