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
    if (doc && (doc.status === 'VENCIDO' || (doc.expirationDate && doc.status !== 'RECHAZADO'))) {
      totalWithExpiration++;
      const exp = calculateDocumentExpiration(doc.expirationDate);
      if (doc.status === 'VENCIDO' || exp.isExpired) {
        expiredDocs.push({
          code: doc.code || code,
          name: doc.name,
          expirationDate: doc.expirationDate || 'Vencido',
          daysOverdue: exp.daysOverdue || Math.abs(exp.daysRemaining) || 1,
          explanation: exp.explanation || 'Documento clasificado como vencido.',
        });
      } else if (exp.isExpiringSoon || doc.status === 'POR_VENCER') {
        expiringSoonDocs.push({
          code: doc.code || code,
          name: doc.name,
          expirationDate: doc.expirationDate || 'Por vencer',
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

/** Un documento cuenta como aprobado solo cuando el administrador le dio "Aprobar". */
export function isDocumentApproved(doc?: { status?: string } | null): boolean {
  return Boolean(doc && (doc.status === 'APROBADO' || doc.status === 'VIGENTE' || doc.status === 'POR_VENCER'));
}

/**
 * Cuántos documentos obligatorios tiene aprobados el proveedor. Los formatos FS.GA-FOR-009 y 039 siempre cuentan;
 * se suman los que exige la categoría (`matrixMandatoryCodes`) y los que el expediente marca como obligatorios.
 */
export function getRequiredDocsProgress(
  dossier: SupplierDossier,
  matrixMandatoryCodes: string[] = []
): { approved: number; total: number } {
  const docs = dossier.documents || {};
  const codes = new Set<string>(['FS_GA_FOR_009', 'FS_GA_FOR_039', ...matrixMandatoryCodes]);
  Object.entries(docs).forEach(([code, d]) => {
    if (d?.isRequired) codes.add(code);
  });
  let approved = 0;
  codes.forEach((code) => {
    if (isDocumentApproved(docs[code])) approved += 1;
  });
  return { approved, total: codes.size };
}

/**
 * Estado del proveedor. Solo hay tres, y salen siempre de sus documentos (nada se cambia a mano):
 * - PROVEEDOR_HABILITADO: todos los documentos obligatorios están aprobados y ninguno está vencido.
 * - DOCUMENTACION_VENCIDA: al menos un documento está vencido.
 * - DOCUMENTACION_PENDIENTE: todavía faltan documentos por cargar o por aprobar.
 *
 * `counts` permite usar el conteo exacto de la pantalla del expediente (incluye los documentos que la
 * categoría exige y que aún no se han cargado).
 */
export function getCreationStatus(
  dossier: SupplierDossier,
  counts?: { approved: number; total: number }
): {
  status: ProcessStatus;
  label: string;
  badgeClass: string;
  isApproved: boolean;
  approvedCount: number;
  totalCount: number;
  hasExpiredDocs: boolean;
  hasExpiringSoonDocs: boolean;
  expiredCount: number;
  expiringSoonCount: number;
  expiredDocNames?: string[];
  expiringDocNames?: string[];
} {
  const expSummary = getDossierDocumentExpirationSummary(dossier);
  const progress = counts ?? getRequiredDocsProgress(dossier);
  const total = progress.total;
  const approved = progress.approved;

  const common = {
    approvedCount: approved,
    totalCount: total,
    hasExpiringSoonDocs: expSummary.hasExpiringSoonDocs,
    expiringSoonCount: expSummary.expiringSoonCount,
    expiringDocNames: expSummary.expiringSoonDocs.map((d) => d.name),
  };

  // Un documento vencido inhabilita al proveedor hasta que se renueve
  if (expSummary.hasExpiredDocs) {
    return {
      ...common,
      status: 'DOCUMENTACION_VENCIDA',
      label: `Documento vencido (${expSummary.expiredCount})`,
      badgeClass: getCreationBadgeClass('DOCUMENTACION_VENCIDA'),
      isApproved: false,
      hasExpiredDocs: true,
      expiredCount: expSummary.expiredCount,
      expiredDocNames: expSummary.expiredDocs.map((d) => d.name),
    };
  }

  if (total > 0 && approved >= total) {
    return {
      ...common,
      status: 'PROVEEDOR_HABILITADO',
      label: 'Habilitado',
      badgeClass: getCreationBadgeClass('PROVEEDOR_HABILITADO'),
      isApproved: true,
      hasExpiredDocs: false,
      expiredCount: 0,
      expiredDocNames: [],
    };
  }

  return {
    ...common,
    status: 'DOCUMENTACION_PENDIENTE',
    label: 'Pendiente',
    badgeClass: getCreationBadgeClass('DOCUMENTACION_PENDIENTE'),
    isApproved: false,
    hasExpiredDocs: false,
    expiredCount: 0,
    expiredDocNames: [],
  };
}

function getCreationBadgeClass(status: ProcessStatus): string {
  switch (status) {
    case 'PROVEEDOR_HABILITADO':
      return 'bg-blue-900 text-white border-blue-700 font-bold';
    case 'DOCUMENTACION_VENCIDA':
      return 'bg-red-500/10 text-red-600 border-red-500/30 font-bold';
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
      hasContract: Boolean(contract?.contractNumber || contract?.endDate),
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
      hasContract: Boolean(contract?.contractNumber || contract?.endDate),
    };
  }

  if (!contract || !contract.endDate || contract.contractStatus === 'SIN_CONTRATO') {
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
  // El estado sale siempre de la fecha de terminación (no de un valor guardado que pudo quedar viejo)
  const effectiveContractStatus: ContractValidityStatus = validity.status;

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
  _calculatedDocStatus?: ProcessStatus
): ProcessStatus {
  return getCreationStatus(dossier).status;
}

/**
 * Returns user-friendly status labels for the Supplier Status
 */
export function getProcessStatusLabel(status: ProcessStatus): string {
  switch (status) {
    case 'PROVEEDOR_HABILITADO':
    case 'APROBADO':
    case 'DOCUMENTACION_POR_VENCER':
    case 'CONTRATO_VIGENTE':
    case 'CONTRATO_POR_VENCER':
      return 'Habilitado';
    case 'DOCUMENTACION_VENCIDA':
      return 'Documento vencido';
    case 'CONTRATO_VENCIDO':
      return 'Contrato vencido';
    default:
      // Todo lo demás (por cargar, en revisión, con observaciones…) es un expediente pendiente
      return 'Pendiente';
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
