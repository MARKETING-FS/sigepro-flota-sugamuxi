import {
  ContractValidityStatus,
  DocumentExpirationInfo,
  ProcessStatus,
  SupplierContractInfo,
  SupplierDossier,
} from '../types';

/**
 * Utility to calculate document expiration based on expiration date.
 * Regla de negocio Flota Sugamuxi S.A.:
 * - Sin fecha: 'NO_APLICA' / Permanente
 * - > 30 días restantes: 'VIGENTE'
 * - 0 a 30 días restantes: 'POR_VENCER' (Alerta preventiva para trámite de renovación oportuna)
 * - < 0 días: 'VENCIDO' (Inhabilita automáticamente al proveedor para órdenes de compra y contratación)
 */
export function calculateDocumentExpiration(expirationDateStr?: string): DocumentExpirationInfo {
  if (!expirationDateStr || !expirationDateStr.trim()) {
    return {
      status: 'NO_APLICA',
      daysRemaining: 9999,
      isExpired: false,
      isExpiringSoon: false,
      label: 'Permanente',
      badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
      formattedDate: 'Permanente / Sin Vencimiento',
      explanation: 'Requisito permanente sin fecha de expiración periódica.',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = expirationDateStr.split('-');
  if (parts.length < 3) {
    return {
      status: 'NO_APLICA',
      daysRemaining: 9999,
      isExpired: false,
      isExpiringSoon: false,
      label: 'Permanente',
      badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
      formattedDate: expirationDateStr,
      explanation: 'Fecha no estandarizada',
    };
  }

  const expDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdue = Math.abs(diffDays);
    return {
      status: 'VENCIDO',
      daysRemaining: diffDays,
      daysOverdue: overdue,
      isExpired: true,
      isExpiringSoon: false,
      label: `Vencido (${overdue}d)`,
      badgeClass: 'bg-slate-900 text-white border-slate-700 font-bold',
      formattedDate: expirationDateStr,
      explanation: `Documento vencido hace ${overdue} día${overdue === 1 ? '' : 's'} (${expirationDateStr}). Inhabilita la conformidad del proveedor.`,
    };
  } else if (diffDays <= 30) {
    return {
      status: 'POR_VENCER',
      daysRemaining: diffDays,
      daysOverdue: 0,
      isExpired: false,
      isExpiringSoon: true,
      label: diffDays === 0 ? 'Vence hoy' : `Vence en ${diffDays}d`,
      badgeClass: 'bg-blue-50 text-blue-900 border-blue-300 font-bold',
      formattedDate: expirationDateStr,
      explanation: diffDays === 0
        ? `Documento vence HOY (${expirationDateStr}). Requiere renovación inmediata.`
        : `Documento por vencer en ${diffDays} día${diffDays === 1 ? '' : 's'} (${expirationDateStr}). Requiere gestión preventiva.`,
    };
  } else {
    return {
      status: 'VIGENTE',
      daysRemaining: diffDays,
      daysOverdue: 0,
      isExpired: false,
      isExpiringSoon: false,
      label: `Vigente (${diffDays}d)`,
      badgeClass: 'bg-blue-50 text-blue-900 border-blue-200 font-medium',
      formattedDate: expirationDateStr,
      explanation: `Documento vigente hasta el ${expirationDateStr} (${diffDays} días restantes).`,
    };
  }
}

export interface DossierDocumentExpirationSummary {
  hasExpiredDocs: boolean;
  expiredCount: number;
  expiredDocs: Array<{
    code: string;
    name: string;
    expirationDate: string;
    daysOverdue: number;
    explanation: string;
  }>;
  hasExpiringSoonDocs: boolean;
  expiringSoonCount: number;
  expiringSoonDocs: Array<{
    code: string;
    name: string;
    expirationDate: string;
    daysRemaining: number;
    explanation: string;
  }>;
  totalWithExpiration: number;
  validCount: number;
}

/**
 * Summarizes the document expiration status across all documents in a supplier dossier.
 */
export function getDossierDocumentExpirationSummary(dossier: SupplierDossier): DossierDocumentExpirationSummary {
  const docs = Object.entries(dossier.documents || {});
  const expiredDocs: DossierDocumentExpirationSummary['expiredDocs'] = [];
  const expiringSoonDocs: DossierDocumentExpirationSummary['expiringSoonDocs'] = [];
  let totalWithExpiration = 0;

  for (const [code, doc] of docs) {
    if (doc && doc.expirationDate && doc.status !== 'RECHAZADO') {
      totalWithExpiration++;
      const exp = calculateDocumentExpiration(doc.expirationDate);
      if (exp.isExpired) {
        expiredDocs.push({
          code: doc.code || code,
          name: doc.name,
          expirationDate: doc.expirationDate,
          daysOverdue: Math.abs(exp.daysRemaining),
          explanation: exp.explanation,
        });
      } else if (exp.isExpiringSoon) {
        expiringSoonDocs.push({
          code: doc.code || code,
          name: doc.name,
          expirationDate: doc.expirationDate,
          daysRemaining: exp.daysRemaining,
          explanation: exp.explanation,
        });
      }
    }
  }

  const validCount = Math.max(0, totalWithExpiration - expiredDocs.length - expiringSoonDocs.length);

  return {
    hasExpiredDocs: expiredDocs.length > 0,
    expiredCount: expiredDocs.length,
    expiredDocs,
    hasExpiringSoonDocs: expiringSoonDocs.length > 0,
    expiringSoonCount: expiringSoonDocs.length,
    expiringSoonDocs,
    totalWithExpiration,
    validCount,
  };
}

/**
 * Utility to calculate contract validity based on expiration date.
 * Regla de negocio Flota Sugamuxi S.A.:
 * - > 30 días restantes: VIGENTE (Operación normal)
 * - 0 a 30 días restantes: POR_VENCER (Alerta preventiva para trámite de adición o renovación)
 * - < 0 días: VENCIDO (Inhabilitado para órdenes de compra y facturación)
 */
export function calculateContractValidity(input?: string | SupplierContractInfo): {
  status: ContractValidityStatus;
  daysRemaining: number;
  remainingDays: number;
  label: string;
  badgeClass: string;
  description: string;
} {
  const endDateStr = typeof input === 'string' ? input : input?.endDate;

  if (!endDateStr) {
    return {
      status: 'SIN_CONTRATO',
      daysRemaining: 0,
      remainingDays: 0,
      label: 'Sin Contrato Activo',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      description: 'El proveedor no cuenta con contrato formalizado o fecha de fin registrada.',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = endDateStr.split('-');
  const end = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  end.setHours(0, 0, 0, 0);

  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'VENCIDO',
      daysRemaining: diffDays,
      remainingDays: diffDays,
      label: `Vencido (${Math.abs(diffDays)}d)`,
      badgeClass: 'bg-slate-900 text-white border-slate-700',
      description: `Contrato vencido hace ${Math.abs(diffDays)} días. Inhabilitado para nuevas órdenes.`,
    };
  } else if (diffDays <= 30) {
    return {
      status: 'POR_VENCER',
      daysRemaining: diffDays,
      remainingDays: diffDays,
      label: `Por vencer (${diffDays}d)`,
      badgeClass: 'bg-sky-100 text-sky-900 border-sky-300 font-bold',
      description: `Contrato próximo a expirar en ${diffDays} días. Requiere trámite de prórroga o renovación.`,
    };
  } else {
    return {
      status: 'VIGENTE',
      daysRemaining: diffDays,
      remainingDays: diffDays,
      label: `Vigente (${diffDays}d)`,
      badgeClass: 'bg-blue-50 text-blue-900 border-blue-200 font-semibold',
      description: `Contrato vigente con ${diffDays} días restantes de cobertura operativa.`,
    };
  }
}

/**
 * Resolves the Creation/Homologation status of a supplier (Dimensión 1: Ciclo de Creación y Verificación Documental)
 * - PROVEEDOR_HABILITADO: 100% de documentos aprobados y sin ningún soporte vencido.
 * - DOCUMENTACION_VENCIDA: Cuenta con al menos un documento obligatorio expirado (Inhabilitado preventivamente).
 * - DOCUMENTACION_POR_VENCER: Aprobado pero con documentos en alerta preventiva de expiración (≤30 días).
 * - EN_REVISION / CORREGIDO_EN_REVISION: Expediente en verificación por Revisor Técnico.
 * - REQUIERE_CORRECCION: Presenta observaciones documentales pendientes de subsanar.
 * - DOCUMENTACION_PENDIENTE / BORRADOR: Expediente incompleto, cargando soportes.
 * - RECHAZADO: Dictamen desfavorable o incumplimiento de requisitos.
 */
export function getCreationStatus(dossier: SupplierDossier): {
  status: ProcessStatus;
  label: string;
  badgeClass: string;
  isApproved: boolean;
  hasExpiredDocs: boolean;
  hasExpiringSoonDocs: boolean;
  expiredCount: number;
  expiringSoonCount: number;
  expiredDocNames?: string[];
  expiringDocNames?: string[];
} {
  const expSummary = getDossierDocumentExpirationSummary(dossier);

  // If manual override is explicitly about creation status
  if (
    dossier.manualStatusOverride &&
    (dossier.processStatus === 'PROVEEDOR_HABILITADO' ||
      dossier.processStatus === 'DOCUMENTACION_VENCIDA' ||
      dossier.processStatus === 'DOCUMENTACION_POR_VENCER' ||
      dossier.processStatus === 'RECHAZADO' ||
      dossier.processStatus === 'REQUIERE_CORRECCION' ||
      dossier.processStatus === 'EN_REVISION' ||
      dossier.processStatus === 'DOCUMENTACION_PENDIENTE')
  ) {
    return {
      status: dossier.processStatus,
      label: getProcessStatusLabel(dossier.processStatus),
      badgeClass: getCreationBadgeClass(dossier.processStatus),
      isApproved: dossier.processStatus === 'PROVEEDOR_HABILITADO',
      hasExpiredDocs: expSummary.hasExpiredDocs,
      hasExpiringSoonDocs: expSummary.hasExpiringSoonDocs,
      expiredCount: expSummary.expiredCount,
      expiringSoonCount: expSummary.expiringSoonCount,
      expiredDocNames: expSummary.expiredDocs.map((d) => d.name),
      expiringDocNames: expSummary.expiringSoonDocs.map((d) => d.name),
    };
  }

  // Calculate based on required documents
  const docs = Object.values(dossier.documents || {});
  const requiredDocs = docs.filter((d) => d.isRequired !== false);
  const total = requiredDocs.length;
  const approved = requiredDocs.filter((d) => d.status === 'APROBADO').length;
  const requiresCorrection = requiredDocs.filter((d) => d.status === 'REQUIERE_CORRECCION').length;
  const inReview = requiredDocs.filter((d) => d.status === 'EN_REVISION').length;
  const is100Approved = total > 0 && approved === total;

  if (dossier.processStatus === 'RECHAZADO') {
    return {
      status: 'RECHAZADO',
      label: 'Rechazado',
      badgeClass: 'bg-slate-800 text-slate-200 border-slate-700',
      isApproved: false,
      hasExpiredDocs: expSummary.hasExpiredDocs,
      hasExpiringSoonDocs: expSummary.hasExpiringSoonDocs,
      expiredCount: expSummary.expiredCount,
      expiringSoonCount: expSummary.expiringSoonCount,
      expiredDocNames: expSummary.expiredDocs.map((d) => d.name),
      expiringDocNames: expSummary.expiringSoonDocs.map((d) => d.name),
    };
  }

  // CRITICAL BUSINESS RULE: If any document is EXPIRED, the supplier CANNOT be enabled!
  // State switches automatically to DOCUMENTACION_VENCIDA
  if (expSummary.hasExpiredDocs) {
    return {
      status: 'DOCUMENTACION_VENCIDA',
      label: `Doc. Vencida (${expSummary.expiredCount})`,
      badgeClass: 'bg-slate-900 text-white border-slate-700 font-bold',
      isApproved: false,
      hasExpiredDocs: true,
      hasExpiringSoonDocs: expSummary.hasExpiringSoonDocs,
      expiredCount: expSummary.expiredCount,
      expiringSoonCount: expSummary.expiringSoonCount,
      expiredDocNames: expSummary.expiredDocs.map((d) => d.name),
      expiringDocNames: expSummary.expiringSoonDocs.map((d) => d.name),
    };
  }

  if (is100Approved) {
    if (expSummary.hasExpiringSoonDocs) {
      return {
        status: 'DOCUMENTACION_POR_VENCER',
        label: `Habilitado (${expSummary.expiringSoonCount} por vencer)`,
        badgeClass: 'bg-blue-50 text-blue-900 border-blue-300 font-bold',
        isApproved: true,
        hasExpiredDocs: false,
        hasExpiringSoonDocs: true,
        expiredCount: 0,
        expiringSoonCount: expSummary.expiringSoonCount,
        expiredDocNames: [],
        expiringDocNames: expSummary.expiringSoonDocs.map((d) => d.name),
      };
    }

    return {
      status: 'PROVEEDOR_HABILITADO',
      label: 'Habilitado (100% Aprobado)',
      badgeClass: 'bg-blue-900 text-white border-blue-700 font-bold',
      isApproved: true,
      hasExpiredDocs: false,
      hasExpiringSoonDocs: false,
      expiredCount: 0,
      expiringSoonCount: 0,
      expiredDocNames: [],
      expiringDocNames: [],
    };
  }

  if (requiresCorrection > 0) {
    return {
      status: 'REQUIERE_CORRECCION',
      label: 'Requiere Corrección',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
      isApproved: false,
      hasExpiredDocs: false,
      hasExpiringSoonDocs: expSummary.hasExpiringSoonDocs,
      expiredCount: 0,
      expiringSoonCount: expSummary.expiringSoonCount,
      expiredDocNames: [],
      expiringDocNames: expSummary.expiringSoonDocs.map((d) => d.name),
    };
  }

  if (inReview > 0 || dossier.processStatus === 'EN_REVISION' || dossier.processStatus === 'CORREGIDO_EN_REVISION') {
    return {
      status: dossier.processStatus === 'CORREGIDO_EN_REVISION' ? 'CORREGIDO_EN_REVISION' : 'EN_REVISION',
      label: dossier.processStatus === 'CORREGIDO_EN_REVISION' ? 'Corregido / En Revisión' : 'En Revisión Técnica',
      badgeClass: 'bg-blue-50 text-blue-900 border-blue-200 font-semibold',
      isApproved: false,
      hasExpiredDocs: false,
      hasExpiringSoonDocs: expSummary.hasExpiringSoonDocs,
      expiredCount: 0,
      expiringSoonCount: expSummary.expiringSoonCount,
      expiredDocNames: [],
      expiringDocNames: expSummary.expiringSoonDocs.map((d) => d.name),
    };
  }

  return {
    status: 'DOCUMENTACION_PENDIENTE',
    label: 'Documentación Pendiente',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    isApproved: false,
    hasExpiredDocs: false,
    hasExpiringSoonDocs: expSummary.hasExpiringSoonDocs,
    expiredCount: 0,
    expiringSoonCount: expSummary.expiringSoonCount,
    expiredDocNames: [],
    expiringDocNames: expSummary.expiringSoonDocs.map((d) => d.name),
  };
}

function getCreationBadgeClass(status: ProcessStatus): string {
  switch (status) {
    case 'PROVEEDOR_HABILITADO':
    case 'APROBADO':
      return 'bg-blue-900 text-white border-blue-700 font-bold';
    case 'DOCUMENTACION_VENCIDA':
      return 'bg-slate-900 text-white border-slate-700 font-bold';
    case 'DOCUMENTACION_POR_VENCER':
      return 'bg-blue-50 text-blue-900 border-blue-300 font-bold';
    case 'EN_REVISION':
    case 'CORREGIDO_EN_REVISION':
      return 'bg-blue-50 text-blue-900 border-blue-200 font-semibold';
    case 'REQUIERE_CORRECCION':
      return 'bg-slate-100 text-slate-700 border-slate-300 font-medium';
    case 'RECHAZADO':
      return 'bg-slate-800 text-slate-200 border-slate-700';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

/**
 * Resolves the Contractual Binding status of a supplier (Dimensión 2: Vinculación por Objeto del Contrato)
 * - VIGENTE: Contrato activo y en ejecución (> 30 días)
 * - POR_VENCER: Alerta preventiva de vencimiento (≤ 30 días)
 * - VENCIDO: Contrato expirado (inhabilitado para compras)
 * - SIN_CONTRATO: Aspirante registrado o habilitado sin contrato adjudicado/formalizado
 * - SUSPENDIDO: Medida de suspensión temporal por supervisión
 */
export function getContractualStatus(dossier: SupplierDossier): {
  status: ContractValidityStatus;
  daysRemaining: number;
  remainingDays: number;
  label: string;
  badgeClass: string;
  description: string;
  contractNumber?: string;
  contractObject?: string;
  contractValueCOP?: number;
  supervisorName?: string;
  hasContract: boolean;
} {
  const contract = dossier.contractInfo;

  // Si el contrato está explícitamente suspendido
  if (contract?.contractStatus === 'SUSPENDIDO') {
    return {
      status: 'SUSPENDIDO',
      daysRemaining: 0,
      remainingDays: 0,
      label: 'Contrato Suspendido',
      badgeClass: 'bg-slate-800 text-slate-200 border-slate-700 font-bold',
      description: 'Vinculación contractual suspendida temporalmente por supervisión.',
      contractNumber: contract?.contractNumber,
      contractObject: contract?.objectDescription || contract?.notes,
      contractValueCOP: contract?.contractValueCOP || contract?.contractValue,
      supervisorName: contract?.supervisorName || contract?.supervisor,
      hasContract: Boolean(contract?.contractNumber),
    };
  }

  // Si el contrato está explícitamente terminado/liquidado
  if (contract?.contractStatus === 'TERMINADO') {
    return {
      status: 'TERMINADO',
      daysRemaining: 0,
      remainingDays: 0,
      label: 'Contrato Terminado',
      badgeClass: 'bg-slate-700 text-slate-200 border-slate-600',
      description: 'Relación contractual formalmente finalizada y liquidada.',
      contractNumber: contract?.contractNumber,
      contractObject: contract?.objectDescription || contract?.notes,
      contractValueCOP: contract?.contractValueCOP || contract?.contractValue,
      supervisorName: contract?.supervisorName || contract?.supervisor,
      hasContract: Boolean(contract?.contractNumber),
    };
  }

  if (!contract || !contract.contractNumber || !contract.endDate || contract.contractStatus === 'SIN_CONTRATO') {
    return {
      status: 'SIN_CONTRATO',
      daysRemaining: 0,
      remainingDays: 0,
      label: 'Sin Contrato Activo',
      badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
      description: 'El proveedor no cuenta con contrato formalizado o está en trámite previo (compras menores).',
      contractNumber: contract?.contractNumber,
      contractObject: contract?.objectDescription || 'Sin objeto contractual formalizado',
      contractValueCOP: contract?.contractValueCOP || contract?.contractValue || 0,
      hasContract: false,
    };
  }

  // Si el usuario especificó manualmente un estado de contrato (ej. VENCIDO, POR_VENCER, VIGENTE)
  const validity = calculateContractValidity(contract.endDate);
  const effectiveContractStatus: ContractValidityStatus = contract.contractStatus || validity.status;

  let label = validity.label;
  let badgeClass = validity.badgeClass;

  if (effectiveContractStatus === 'VENCIDO') {
    label = validity.daysRemaining < 0 ? `Vencido (${Math.abs(validity.daysRemaining)}d)` : 'Contrato Vencido';
    badgeClass = 'bg-slate-900 text-white border-slate-700 font-bold';
  } else if (effectiveContractStatus === 'POR_VENCER') {
    label = `Por vencer (${validity.daysRemaining}d)`;
    badgeClass = 'bg-sky-100 text-sky-900 border-sky-300 font-bold';
  } else if (effectiveContractStatus === 'VIGENTE') {
    label = `Vigente (${validity.daysRemaining}d)`;
    badgeClass = 'bg-blue-50 text-blue-900 border-blue-200 font-semibold';
  }

  return {
    status: effectiveContractStatus,
    daysRemaining: validity.daysRemaining,
    remainingDays: validity.remainingDays,
    label,
    badgeClass,
    description: validity.description,
    contractNumber: contract.contractNumber,
    contractObject: contract.objectDescription || contract.notes || 'Objeto contractual formalizado',
    contractValueCOP: contract.contractValueCOP || contract.contractValue || 0,
    supervisorName: contract.supervisorName || contract.supervisor,
    hasContract: true,
  };
}

/**
 * Resolves the effective status of a dossier (Estado del Proveedor / Homologación):
 * 1. Manual status change (always respected with registered observation)
 * 2. If supplier has expired documents -> DOCUMENTACION_VENCIDA (compliance hold)
 * 3. Document compliance workflow status
 * 
 * NOTA: El estado del proveedor es INDEPENDIENTE del estado de su contrato.
 */
export function getDossierEffectiveStatus(
  dossier: SupplierDossier,
  calculatedDocStatus?: ProcessStatus
): ProcessStatus {
  // If manual override was recorded for supplier status, respect it
  if (dossier.manualStatusOverride && dossier.processStatus) {
    return dossier.processStatus;
  }

  const creation = getCreationStatus(dossier);

  // If dossier has expired documents, it is blocked from normal operations
  if (creation.status === 'DOCUMENTACION_VENCIDA') {
    return 'DOCUMENTACION_VENCIDA';
  }

  // Preserve explicit supplier status
  if (
    dossier.processStatus === 'SUSPENDIDO' ||
    dossier.processStatus === 'RECHAZADO' ||
    dossier.processStatus === 'REQUIERE_CORRECCION' ||
    dossier.processStatus === 'EN_REVISION' ||
    dossier.processStatus === 'CORREGIDO_EN_REVISION' ||
    dossier.processStatus === 'PROVEEDOR_HABILITADO'
  ) {
    return dossier.processStatus;
  }

  return calculatedDocStatus || creation.status || dossier.processStatus;
}

/**
 * Returns user-friendly status labels for the Supplier Status
 */
export function getProcessStatusLabel(status: ProcessStatus): string {
  switch (status) {
    case 'PROVEEDOR_HABILITADO':
      return 'Proveedor Habilitado (Homologado)';
    case 'DOCUMENTACION_VENCIDA':
      return 'Documentación Vencida (Inhabilitado)';
    case 'DOCUMENTACION_POR_VENCER':
      return 'Documentación Próxima a Vencer (Alerta)';
    case 'CONTRATO_VIGENTE':
      return 'Proveedor Habilitado (Contrato Vigente)';
    case 'CONTRATO_POR_VENCER':
      return 'Proveedor Habilitado (Contrato Por Vencer)';
    case 'CONTRATO_VENCIDO':
      return 'Proveedor con Contrato Vencido';
    case 'SUSPENDIDO':
      return 'Suspendido Administrativamente';
    case 'APROBADO':
      return 'Aprobado';
    case 'EN_REVISION':
      return 'En Revisión Técnica';
    case 'CORREGIDO_EN_REVISION':
      return 'Corregido / En Revisión';
    case 'REQUIERE_CORRECCION':
      return 'Requiere Corrección';
    case 'DOCUMENTACION_PENDIENTE':
      return 'Documentación Pendiente';
    case 'LISTO_PARA_ENVIO':
      return 'Listo para Envío';
    case 'BORRADOR':
      return 'Borrador';
    case 'RECHAZADO':
      return 'Rechazado / No Habilitado';
    default:
      return status;
  }
}

/**
 * Returns user-friendly labels for the Contract Status (Vigencia Contractual)
 */
export function getContractStatusLabel(status: ContractValidityStatus): string {
  switch (status) {
    case 'VIGENTE':
      return 'Contrato Vigente (Activo)';
    case 'POR_VENCER':
      return 'Contrato Próximo a Vencer (≤30d)';
    case 'VENCIDO':
      return 'Contrato Vencido';
    case 'SIN_CONTRATO':
      return 'Sin Contrato Formal (Compras Menores)';
    case 'SUSPENDIDO':
      return 'Contrato Suspendido';
    case 'TERMINADO':
      return 'Contrato Terminado / Liquidado';
    default:
      return status;
  }
}
