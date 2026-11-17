/**
 * Formato FS.GA-DOC-006 v6.0 — «Evaluación de criterios de selección de proveedores y clientes».
 * Es un documento controlado del Sistema Integrado de Gestión: la evaluación INICIAL se califica
 * siempre con estos seis criterios (20 puntos cada uno, 120 en total) y se aprueba con 76 puntos o más.
 */
export interface Doc006Option {
  /** Puntos que otorga esta opción (20, 15, 10 o 5). */
  points: number;
  /** Cómo se mide: texto de la opción tal como aparece en el formato. */
  label: string;
}

export interface Doc006Criterion {
  id: string;
  name: string;
  /** Explicación del criterio (qué se está evaluando). */
  description: string;
  options: Doc006Option[];
  /** Nota aclaratoria opcional que el formato trae al pie del criterio. */
  note?: string;
}

export const DOC006_CODE = 'FS.GA-DOC-006';
export const DOC006_VERSION = '6.0';
export const DOC006_TITLE = 'Evaluación de criterios de selección de proveedores y clientes';
export const DOC006_MAX_PER_CRITERION = 20;
/** Puntaje mínimo para que se pueda aprobar la vinculación como proveedor. */
export const DOC006_PASSING_SCORE = 76;

export const DOC006_CRITERIA: Doc006Criterion[] = [
  {
    id: 'doc006-calidad',
    name: 'Estándares de calidad',
    description:
      'Se define por el desempeño real de los productos o servicios y por la competencia del proveedor para cumplir los requisitos descritos en las especificaciones de compra, incluyendo el tiempo efectivo de garantía de la adquisición.',
    options: [
      { points: 20, label: 'Satisface totalmente la calidad' },
      { points: 15, label: 'Satisface medianamente la calidad' },
      { points: 10, label: 'Presenta baja calidad' },
      { points: 5, label: 'No satisface la calidad' },
    ],
  },
  {
    id: 'doc006-precio',
    name: 'Precio',
    description: 'Se refiere al valor en pesos del producto o servicio adquirido, comparado con el promedio del mercado.',
    options: [
      { points: 20, label: 'Bajo el promedio del mercado (descuento superior al 5 %)' },
      { points: 15, label: 'Bajo el promedio del mercado (hasta un 5 % de descuento)' },
      { points: 10, label: 'Precios iguales al mercado' },
      { points: 5, label: 'Precios sobre el promedio (hasta un 5 % más)' },
    ],
  },
  {
    id: 'doc006-certificaciones',
    name: 'Certificaciones',
    description:
      'Respaldo que tiene la empresa, el producto o el servicio en certificaciones de calidad, de seguridad y salud en el trabajo y demás.',
    options: [
      { points: 20, label: 'Cuenta con más de una certificación' },
      { points: 15, label: 'Cuenta con certificación de producto o servicio' },
      { points: 10, label: 'Cuenta con certificación de los procesos' },
      { points: 5, label: 'No cuenta con certificaciones' },
    ],
  },
  {
    id: 'doc006-referencias',
    name: 'Referencias y oferta',
    description: 'Nivel de cumplimiento de los plazos y de los acuerdos establecidos en la oferta o cotización, respaldado por las recomendaciones de otros clientes.',
    options: [
      { points: 20, label: 'Excelentes recomendaciones y satisface totalmente plazos y acuerdos' },
      { points: 15, label: 'Buenas recomendaciones y satisface regularmente plazos y acuerdos' },
      { points: 10, label: 'Regulares recomendaciones y satisface mínimamente plazos y acuerdos' },
      { points: 5, label: 'No cuenta con recomendaciones y no satisface plazos ni acuerdos' },
    ],
  },
  {
    id: 'doc006-laboral',
    name: 'Cumplimiento laboral',
    description: 'Mide el nivel de cumplimiento de los requisitos legales en materia laboral y de seguridad y salud en el trabajo.',
    options: [
      { points: 20, label: 'Cuenta con certificaciones en seguridad y salud en el trabajo' },
      { points: 15, label: 'Muestra documentación de la implementación de un sistema de gestión de SST' },
      { points: 10, label: 'Muestra documentación de la implementación del Decreto 1072, capítulo 6' },
      { points: 5, label: 'No se evidencia la implementación del SST' },
    ],
  },
  {
    id: 'doc006-sst',
    name: 'Seguridad y salud en el trabajo',
    description:
      'Cumplimiento de la implementación del sistema de gestión de SST, medido con la tabla de estándares mínimos del SG-SST.',
    options: [
      { points: 20, label: 'Puntaje obtenido mayor al 85 %' },
      { points: 15, label: 'Puntaje obtenido entre el 61 % y el 84 %' },
      { points: 10, label: 'Puntaje obtenido entre el 51 % y el 60 %' },
      { points: 5, label: 'Puntaje obtenido menor al 50 %' },
    ],
  },
];

export const DOC006_MAX_SCORE = DOC006_CRITERIA.length * DOC006_MAX_PER_CRITERION;
