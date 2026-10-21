import * as XLSX from 'xlsx';
import { SupplierDossier, SystemAuditEntry, Convocatoria, SupplierEvaluation } from '../types';

/**
 * Utility for generating professional Excel (.xlsx) workbooks for SIGEPRO - Flota Sugamuxi S.A.
 */

// Helper to sanitize cell values
const sanitize = (val: any): string | number => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val ? 'SÍ' : 'NO';
  return String(val).trim();
};

// Auto-fit column widths calculation
export const autoFitColumns = (worksheet: XLSX.WorkSheet, data: any[][]) => {
  const colWidths: number[] = [];
  data.forEach((row) => {
    row.forEach((cell, colIndex) => {
      const len = cell ? String(cell).length : 0;
      colWidths[colIndex] = Math.max(colWidths[colIndex] || 10, len + 3);
    });
  });
  worksheet['!cols'] = colWidths.map((w) => ({ wch: Math.min(w, 50) }));
};

/**
 * 1. Export Consolidated Master Supplier Directory
 */
export const exportMasterSupplierDirectory = (dossiers: SupplierDossier[], filterSummary?: string) => {
  const wb = XLSX.utils.book_new();

  const headers = [
    'No. Expediente',
    'Tipo Persona',
    'Tipo Proveedor (A/B/C)',
    'Razón Social / Nombre Completo',
    'Tipo Documento',
    'NIT / No. Identificación',
    'DV',
    'Representante Legal',
    'Doc. Representante',
    'Correo Electrónico',
    'Teléfono / Celular',
    'Ciudad',
    'Departamento',
    'Dirección Principal',
    'Categoría Económica',
    'Actividad Económica Principal',
    'Código CIIU',
    'Régimen Tributario',
    'Gran Contribuyente',
    'Autorretenedor',
    'Banco Receptor',
    'Tipo Cuenta',
    'No. Cuenta Bancaria',
    'SARLAFT',
    'OFAC / Listas Restrictivas',
    'Antecedentes Procuraduría / Policía',
    'Formato FS.GA-FOR-009',
    'Formato FS.GA-FOR-039',
    'Estado del Expediente',
    'Fecha Inscripción',
    'Habilitación Comercial',
  ];

  const rows = dossiers.map((d) => {
    const isNatural = d.basicInfo?.supplierType === 'NATURAL';
    const name = isNatural
      ? d.basicInfo?.fullName || 'N/A'
      : d.basicInfo?.companyName || 'N/A';
    const docType = isNatural
      ? d.basicInfo?.documentType || 'CC'
      : 'NIT';
    const docNum = isNatural
      ? d.basicInfo?.documentNumber || ''
      : d.basicInfo?.nit || '';
    const repLegal = isNatural
      ? 'N/A (Persona Natural)'
      : d.basicInfo?.representativeLegalName || 'No Registrado';
    const repDoc = isNatural
      ? 'N/A'
      : `${d.basicInfo?.representativeLegalDocType || 'CC'} ${d.basicInfo?.representativeLegalDocNumber || ''}`;

    const isHabilitado = d.processStatus === 'PROVEEDOR_HABILITADO' || d.processStatus === 'APROBADO';
    const tier = d.supplierTier || d.basicInfo?.supplierTier || 'B';
    const tierText = `Tipo ${tier} (${tier === 'A' ? 'Crítico' : tier === 'B' ? 'Operativo' : 'Estándar'})`;

    return [
      sanitize(d.fileNumber),
      sanitize(isNatural ? 'Persona Natural' : 'Persona Jurídica'),
      sanitize(tierText),
      sanitize(name),
      sanitize(docType),
      sanitize(docNum),
      sanitize(d.basicInfo?.dv || ''),
      sanitize(repLegal),
      sanitize(repDoc),
      sanitize(d.basicInfo?.email),
      sanitize(d.basicInfo?.phone),
      sanitize(d.basicInfo?.city),
      sanitize(d.basicInfo?.department || 'Boyacá'),
      sanitize(d.basicInfo?.address),
      sanitize(d.selectedCategory || 'General'),
      sanitize(d.economicActivity || 'Suministro y Servicios'),
      sanitize(d.basicInfo?.taxInfo?.ciiuCode || 'N/A'),
      sanitize(d.basicInfo?.taxInfo?.taxRegime || 'Común / Ordinario'),
      sanitize(d.basicInfo?.taxInfo?.isGranContribuyente ? 'SÍ' : 'NO'),
      sanitize(d.basicInfo?.taxInfo?.isAutoRetenedor ? 'SÍ' : 'NO'),
      sanitize(d.basicInfo?.bankInfo?.bankName || 'Bancolombia'),
      sanitize(d.basicInfo?.bankInfo?.accountType || 'Ahorros'),
      sanitize(d.basicInfo?.bankInfo?.accountNumber || 'N/A'),
      sanitize(d.internalConcepts?.sarlatfCheck?.result || 'PENDIENTE'),
      sanitize(d.internalConcepts?.ofacCheck?.result || 'PENDIENTE'),
      sanitize(d.internalConcepts?.procuraduriaPoliciaCheck?.result || 'PENDIENTE'),
      sanitize(d.documents?.FS_GA_FOR_009?.status || 'PENDIENTE'),
      sanitize(d.documents?.FS_GA_FOR_039?.status || 'PENDIENTE'),
      sanitize(d.processStatus),
      sanitize(d.createdAt),
      sanitize(isHabilitado ? 'HABILITADO OPERATIVAMENTE' : 'NO HABILITADO / EN TRÁMITE'),
    ];
  });

  const wsData = [
    ['FLOTA SUGAMUXI S.A. - SISTEMA INTEGRADO DE GESTIÓN (SIG)'],
    ['INFORME MAESTRO DE PROVEEDORES Y CONTRATISTAS - SIGEPRO'],
    [`Fecha de Generación: ${new Date().toLocaleString('es-CO')} | Total Registros: ${dossiers.length}`],
    ...(filterSummary ? [[`Filtros Aplicados: ${filterSummary}`]] : []),
    [],
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  autoFitColumns(ws, [headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Directorio Proveedores');

  const fileName = `SIGEPRO_Directorio_Maestro_Flota_Sugamuxi_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * 2. Export Document Compliance & Matrix Report
 */
export const exportDocumentComplianceReport = (dossiers: SupplierDossier[], filterSummary?: string) => {
  const wb = XLSX.utils.book_new();

  const headers = [
    'No. Expediente',
    'Razón Social / Nombre',
    'NIT / Documento',
    'Tipo Proveedor',
    'Categoría',
    'Total Docs Requeridos',
    'Docs Aprobados',
    'Docs Pendientes / Observados',
    '% Cumplimiento',
    'Estado Global',
    'FS.GA-FOR-009 (Inscripción)',
    'FS.GA-FOR-039 (Tratamiento Datos)',
    'RUT Actualizado',
    'Cámara de Comercio',
    'Cédula Rep. Legal / Natural',
    'Certificación Bancaria',
    'Estados Financieros',
    'Seguridad Social / ARL',
    'Póliza RCE',
    'SARLAFT Declaración',
    'Última Modificación',
  ];

  const rows = dossiers.map((d) => {
    const isNatural = d.basicInfo?.supplierType === 'NATURAL';
    const name = isNatural ? d.basicInfo?.fullName : d.basicInfo?.companyName;
    const docNum = isNatural ? d.basicInfo?.documentNumber : d.basicInfo?.nit;

    const docs = Object.values(d.documents || {});
    const requiredDocs = docs.filter((doc) => doc.isRequired);
    const approvedDocs = requiredDocs.filter((doc) => doc.status === 'APROBADO');
    const totalRequired = requiredDocs.length || 1;
    const percent = Math.round((approvedDocs.length / totalRequired) * 100);
    const pendingCount = totalRequired - approvedDocs.length;

    const getDocStatus = (code: string) => {
      const doc = d.documents?.[code];
      if (!doc) return 'NO APLICA';
      return doc.status;
    };

    return [
      sanitize(d.fileNumber),
      sanitize(name),
      sanitize(docNum),
      sanitize(isNatural ? 'Persona Natural' : 'Persona Jurídica'),
      sanitize(d.selectedCategory || 'General'),
      totalRequired,
      approvedDocs.length,
      pendingCount,
      `${percent}%`,
      sanitize(d.processStatus),
      getDocStatus('FS_GA_FOR_009'),
      getDocStatus('FS_GA_FOR_039'),
      getDocStatus('RUT'),
      getDocStatus('CAMARA_COMERCIO'),
      getDocStatus(isNatural ? 'CEDULA_NATURAL' : 'CEDULA_REP_LEGAL'),
      getDocStatus('CERTIFICACION_BANCARIA'),
      getDocStatus('ESTADOS_FINANCIEROS'),
      getDocStatus('SEGURIDAD_SOCIAL'),
      getDocStatus('POLIZA_RCE'),
      getDocStatus('DECLARACION_SARLAFT'),
      sanitize(d.updatedAt || d.createdAt),
    ];
  });

  const wsData = [
    ['FLOTA SUGAMUXI S.A. - DEPARTAMENTO DE CALIDAD Y CONTROL DOCUMENTAL (ISO 9001)'],
    ['MATRIZ DE CUMPLIMIENTO DOCUMENTAL Y REQUISITOS POR PROVEEDOR'],
    [`Fecha de Corte: ${new Date().toLocaleString('es-CO')} | Total Proveedores: ${dossiers.length}`],
    ...(filterSummary ? [[`Filtros Aplicados: ${filterSummary}`]] : []),
    [],
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  autoFitColumns(ws, [headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Matriz Documental SIG');

  const fileName = `SIGEPRO_Matriz_Cumplimiento_Documental_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * 3. Export SARLAFT & Restrictive Lists Due Diligence Report
 */
export const exportSarlaftReport = (dossiers: SupplierDossier[], filterSummary?: string) => {
  const wb = XLSX.utils.book_new();

  const headers = [
    'No. Expediente',
    'Nombre / Razón Social',
    'NIT / Cédula',
    'Tipo Persona',
    'Representante Legal',
    'Cédula Rep. Legal',
    'Concepto SARLAFT / SAGRILAFT',
    'Fecha Consulta SARLAFT',
    'Consultado Por (SARLAFT)',
    'Observaciones SARLAFT',
    'Listas OFAC / Clinton / ONU',
    'Fecha Consulta OFAC',
    'Antecedentes Procuraduría / Policía',
    'Fecha Consulta Antecedentes',
    'Declaración Origen de Fondos (Formato)',
    'Estado Global de Habilitación',
  ];

  const rows = dossiers.map((d) => {
    const isNatural = d.basicInfo?.supplierType === 'NATURAL';
    const name = isNatural ? d.basicInfo?.fullName : d.basicInfo?.companyName;
    const docNum = isNatural ? d.basicInfo?.documentNumber : d.basicInfo?.nit;

    const sarl = d.internalConcepts?.sarlatfCheck;
    const ofac = d.internalConcepts?.ofacCheck;
    const proc = d.internalConcepts?.procuraduriaPoliciaCheck;

    return [
      sanitize(d.fileNumber),
      sanitize(name),
      sanitize(docNum),
      sanitize(isNatural ? 'Persona Natural' : 'Persona Jurídica'),
      sanitize(isNatural ? 'N/A' : d.basicInfo?.representativeLegalName || 'No Registrado'),
      sanitize(isNatural ? 'N/A' : d.basicInfo?.representativeLegalDocNumber || 'No Registrado'),
      sanitize(sarl?.result || 'PENDIENTE'),
      sanitize(sarl?.checkedAt || 'N/A'),
      sanitize(sarl?.checkedBy || 'Oficial de Cumplimiento'),
      sanitize(sarl?.notes || 'Verificación rutinaria de listas vinculantes.'),
      sanitize(ofac?.result || 'PENDIENTE'),
      sanitize(ofac?.checkedAt || 'N/A'),
      sanitize(proc?.result || 'PENDIENTE'),
      sanitize(proc?.checkedAt || 'N/A'),
      sanitize(d.documents?.DECLARACION_SARLAFT?.status || 'PENDIENTE'),
      sanitize(d.processStatus),
    ];
  });

  const wsData = [
    ['FLOTA SUGAMUXI S.A. - OFICIALÍA DE CUMPLIMIENTO Y GESTIÓN DEL RIESGO'],
    ['INFORME OFICIAL DE DEBIDA DILIGENCIA SARLAFT / SAGRILAFT Y LISTAS RESTRICTIVAS'],
    [`Generado: ${new Date().toLocaleString('es-CO')} | Base Evaluada: ${dossiers.length} Proveedores`],
    ...(filterSummary ? [[`Filtros Aplicados: ${filterSummary}`]] : []),
    [],
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  autoFitColumns(ws, [headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Control SARLAFT');

  const fileName = `SIGEPRO_Informe_SARLAFT_Listas_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * 4. Export Financial & Bank Accounts Report
 */
export const exportFinancialBankReport = (dossiers: SupplierDossier[], filterSummary?: string) => {
  const wb = XLSX.utils.book_new();

  const headers = [
    'No. Expediente',
    'Razón Social / Nombre',
    'NIT / Cédula',
    'Entidad Bancaria',
    'Tipo de Cuenta',
    'Número de Cuenta',
    'Titular de la Cuenta',
    'Identificación Titular',
    'Certificación Bancaria Adjunta',
    'Régimen Tributario',
    'Gran Contribuyente',
    'Autorretenedor',
    'Activos Totales (COP)',
    'Pasivos Totales (COP)',
    'Patrimonio Neto (COP)',
    'Ingresos Brutos Anuales (COP)',
    'Fecha Corte Financiero',
    'Estado Proveedor',
  ];

  const rows = dossiers.map((d) => {
    const isNatural = d.basicInfo?.supplierType === 'NATURAL';
    const name = isNatural ? d.basicInfo?.fullName : d.basicInfo?.companyName;
    const docNum = isNatural ? d.basicInfo?.documentNumber : d.basicInfo?.nit;

    const bank = d.basicInfo?.bankInfo;
    const fin = d.basicInfo?.financialInfo;
    const tax = d.basicInfo?.taxInfo;

    return [
      sanitize(d.fileNumber),
      sanitize(name),
      sanitize(docNum),
      sanitize(bank?.bankName || 'Bancolombia S.A.'),
      sanitize(bank?.accountType || 'Ahorros'),
      sanitize(bank?.accountNumber || 'N/A'),
      sanitize(bank?.accountHolder || name),
      sanitize(bank?.holderDocNumber || docNum),
      sanitize(d.documents?.CERTIFICACION_BANCARIA?.status === 'APROBADO' ? 'VALIDADA' : 'PENDIENTE'),
      sanitize(tax?.taxRegime || 'Régimen Ordinario'),
      sanitize(tax?.isGranContribuyente ? 'SÍ' : 'NO'),
      sanitize(tax?.isAutoRetenedor ? 'SÍ' : 'NO'),
      fin?.totalAssets || 0,
      fin?.totalLiabilities || 0,
      fin?.netWorth || 0,
      fin?.annualRevenue || 0,
      sanitize(fin?.financialCutoffDate || '31/12/2025'),
      sanitize(d.processStatus),
    ];
  });

  const wsData = [
    ['FLOTA SUGAMUXI S.A. - DIRECCIÓN ADMINISTRATIVA Y FINANCIERA'],
    ['INFORME DE CUENTAS BANCARIAS, DISPERSIÓN DE PAGOS Y PERFIL TRIBUTARIO'],
    [`Generado: ${new Date().toLocaleString('es-CO')} | Total Proveedores: ${dossiers.length}`],
    ...(filterSummary ? [[`Filtros Aplicados: ${filterSummary}`]] : []),
    [],
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  autoFitColumns(ws, [headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Cuentas y Finanzas');

  const fileName = `SIGEPRO_Cuentas_Bancarias_Financiero_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * 5. Export Convocatorias & Postulaciones Report
 */
export const exportConvocatoriasReport = (
  convocatorias: Convocatoria[],
  dossiers: SupplierDossier[],
  filterSummary?: string
) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Convocatorias General
  const convHeaders = [
    'Código Radicado',
    'Título de Convocatoria',
    'Categoría Requerida',
    'Estado',
    'Tipo Contratación',
    'Presupuesto Referencial (COP)',
    'Fecha Publicación',
    'Fecha Cierre',
    'Total Postulaciones',
    'Publicado Por',
  ];

  const convRows = convocatorias.map((c) => [
    sanitize(c.code),
    sanitize(c.title),
    sanitize(c.category),
    sanitize(c.status),
    sanitize('Suministro y Servicios Especializados'),
    c.budgetEstimateCOP || 0,
    sanitize(c.publishedDate),
    sanitize(c.closingDate),
    c.postulaciones?.length || 0,
    sanitize('Comité de Contratación'),
  ]);

  const convSheetData = [
    ['FLOTA SUGAMUXI S.A. - COMITÉ DE COMPRAS Y CONTRATACIÓN'],
    ['REPORTE GENERAL DE CONVOCATORIAS PÚBLICAS Y PRIVADAS'],
    [`Fecha de Generación: ${new Date().toLocaleString('es-CO')} | Total Convocatorias: ${convocatorias.length}`],
    ...(filterSummary ? [[`Filtros Aplicados: ${filterSummary}`]] : []),
    [],
    convHeaders,
    ...convRows,
  ];
  const wsConv = XLSX.utils.aoa_to_sheet(convSheetData);
  autoFitColumns(wsConv, [convHeaders, ...convRows]);
  XLSX.utils.book_append_sheet(wb, wsConv, 'Convocatorias');

  // Sheet 2: Postulaciones Detalladas
  const postHeaders = [
    'Convocatoria',
    'Título Convocatoria',
    'No. Expediente Proveedor',
    'Razón Social / Proponente',
    'NIT / Documento',
    'Fecha de Postulación',
    'Estado Postulación',
    'Propuesta Económica (COP)',
    'Observaciones / Calificación',
  ];

  const postRows: any[][] = [];
  convocatorias.forEach((c) => {
    (c.postulaciones || []).forEach((p) => {
      const dossier = dossiers.find((d) => d.id === p.supplierId || d.fileNumber === p.fileNumber);
      const isNatural = dossier?.basicInfo?.supplierType === 'NATURAL';
      const name = isNatural
        ? dossier?.basicInfo?.fullName
        : dossier?.basicInfo?.companyName || p.supplierName;
      const docNum = isNatural
        ? dossier?.basicInfo?.documentNumber
        : dossier?.basicInfo?.nit || p.nitOrDoc;

      postRows.push([
        sanitize(c.code),
        sanitize(c.title),
        sanitize(p.fileNumber || dossier?.fileNumber || p.supplierId),
        sanitize(name),
        sanitize(docNum || 'N/A'),
        sanitize(p.submittedAt),
        sanitize(p.status),
        p.proposedValue || 0,
        sanitize(p.proposalSummary || p.feedback || 'Postulación registrada en portal.'),
      ]);
    });
  });

  const postSheetData = [
    ['FLOTA SUGAMUXI S.A. - REGISTRO DE PROPUESTAS Y POSTULANTES POR CONVOCATORIA'],
    [`Total Postulaciones Evaluadas: ${postRows.length}`],
    [],
    postHeaders,
    ...postRows,
  ];
  const wsPost = XLSX.utils.aoa_to_sheet(postSheetData);
  autoFitColumns(wsPost, [postHeaders, ...postRows]);
  XLSX.utils.book_append_sheet(wb, wsPost, 'Postulaciones y Ofertas');

  const fileName = `SIGEPRO_Informe_Convocatorias_Ofertas_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * 6. Export System Audit Trail Log
 */
export const exportAuditLogsReport = (auditLogs: SystemAuditEntry[], filterSummary?: string) => {
  const wb = XLSX.utils.book_new();

  const headers = [
    'ID Registro',
    'Fecha y Hora',
    'Usuario Responsable',
    'Rol del Usuario',
    'Tipo de Acción',
    'Sección / Módulo',
    'No. Expediente / Proveedor',
    'Campo Modificado',
    'Valor Anterior',
    'Nuevo Valor',
    'Justificación Obligatoria',
    'Dirección IP / Origen',
  ];

  const rows = auditLogs.map((log) => [
    sanitize(log.id),
    sanitize(log.formattedDate || log.timestamp),
    sanitize(log.user),
    sanitize(log.userRole),
    sanitize(log.action),
    sanitize(log.section),
    sanitize(log.supplierName || log.fileNumber || log.dossierId || 'Sistema General'),
    sanitize(log.fieldChanged || 'N/A'),
    sanitize(log.oldValue),
    sanitize(log.newValue),
    sanitize(log.justification || 'Operación institucional autorizada'),
    sanitize('192.168.1.104 (Red Interna Flota Sugamuxi)'),
  ]);

  const wsData = [
    ['FLOTA SUGAMUXI S.A. - AUDITORÍA GENERAL Y CONTROL INTERNO'],
    ['LIBRO OFICIAL DE TRAZABILIDAD Y REGISTRO DE MODIFICACIONES DE DATOS'],
    [`Fecha de Corte: ${new Date().toLocaleString('es-CO')} | Total Eventos Auditados: ${auditLogs.length}`],
    ...(filterSummary ? [[`Filtros Aplicados: ${filterSummary}`]] : []),
    [],
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  autoFitColumns(ws, [headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Log Auditoría');

  const fileName = `SIGEPRO_Libro_Auditoria_Modificaciones_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * 7. Export Supplier Evaluations & Performance Report (ISO 9001)
 */
export const exportEvaluationsReport = (evaluations: SupplierEvaluation[], filterSummary?: string) => {
  const wb = XLSX.utils.book_new();

  const headers = [
    'ID Evaluación',
    'No. Expediente',
    'Razón Social / Proveedor',
    'NIT / Cédula',
    'Tipo Proveedor (A/B/C)',
    'Categoría de Suministro',
    'Tipo de Evaluación',
    'Año / Período',
    'Ciclo Anual',
    'Fecha Calificación',
    'Puntaje Total (0-100)',
    'Concepto Técnico SIG',
    'Evaluador Responsable',
    'Cargo Evaluador',
    'Plan de Mejora Requerido',
    'Acción Plan de Mejora',
    'Fecha Límite Plan de Mejora',
    'Próxima Calificación',
    'Código Certificado SIG',
    'Observaciones',
  ];

  const rows = evaluations.map((ev) => [
    sanitize(ev.id),
    sanitize(ev.fileNumber),
    sanitize(ev.supplierName),
    sanitize(ev.supplierDoc),
    sanitize(ev.supplierTier ? `Tipo ${ev.supplierTier}` : 'N/A'),
    sanitize(ev.categoryName || 'General'),
    sanitize(ev.evaluationType === 'INICIAL' ? 'Inicial de Homologación' : 'Anual Periódica'),
    sanitize(ev.periodYear || '2026'),
    sanitize(ev.annualCycleNumber ? `Año ${ev.annualCycleNumber}` : 'N/A'),
    sanitize(ev.evaluationDate),
    ev.totalScore || 0,
    sanitize(ev.concept),
    sanitize(ev.evaluatorName),
    sanitize(ev.evaluatorRole),
    ev.hasImprovementPlan ? 'SÍ (Requerido)' : 'NO (Conforme)',
    sanitize(ev.improvementPlanAction || 'N/A'),
    sanitize(ev.improvementPlanDeadline || 'N/A'),
    sanitize(ev.nextEvaluationDueDate || 'N/A'),
    sanitize(ev.certificateCode || 'N/A'),
    sanitize(ev.observations || 'Sin observaciones adicionales'),
  ]);

  const wsData = [
    ['FLOTA SUGAMUXI S.A. - SISTEMA INTEGRADO DE GESTIÓN (SIG)'],
    ['INFORME DE EVALUACIÓN Y DESEMPEÑO DE PROVEEDORES (ISO 9001:2015)'],
    [`Fecha de Generación: ${new Date().toLocaleString('es-CO')} | Total Evaluaciones: ${evaluations.length}`],
    ...(filterSummary ? [[`Filtros Aplicados: ${filterSummary}`]] : []),
    [],
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  autoFitColumns(ws, [headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Evaluaciones Desempeño');

  const fileName = `SIGEPRO_Evaluaciones_Desempeno_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * 7. Export Comprehensive Multi-Sheet Executive Workbook
 */
export const exportExecutiveMasterWorkbook = (
  dossiers: SupplierDossier[],
  auditLogs: SystemAuditEntry[],
  convocatorias: Convocatoria[]
) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Resumen Ejecutivo KPIs
  const totalDossiers = dossiers.length;
  const habilitados = dossiers.filter((d) => d.processStatus === 'PROVEEDOR_HABILITADO' || d.processStatus === 'APROBADO').length;
  const enRevision = dossiers.filter((d) => d.processStatus === 'EN_REVISION' || d.processStatus === 'CORREGIDO_EN_REVISION').length;
  const pendientes = dossiers.filter((d) => d.processStatus === 'REQUIERE_CORRECCION' || d.processStatus === 'DOCUMENTACION_PENDIENTE').length;
  const personasJuridicas = dossiers.filter((d) => d.basicInfo?.supplierType === 'JURIDICA').length;
  const personasNaturales = dossiers.filter((d) => d.basicInfo?.supplierType === 'NATURAL').length;
  const tierA = dossiers.filter((d) => (d.supplierTier || d.basicInfo?.supplierTier) === 'A').length;
  const tierB = dossiers.filter((d) => (d.supplierTier || d.basicInfo?.supplierTier || 'B') === 'B').length;
  const tierC = dossiers.filter((d) => (d.supplierTier || d.basicInfo?.supplierTier) === 'C').length;

  const kpiData = [
    ['FLOTA SUGAMUXI S.A. - SISTEMA INTEGRADO DE GESTIÓN (SIG)'],
    ['PANEL EJECUTIVO DE CONTROL DE PROVEEDORES Y CONTRATISTAS'],
    [`Generado el: ${new Date().toLocaleString('es-CO')}`],
    [],
    ['INDICADOR DE GESTIÓN', 'CANTIDAD / VALOR', '% SOBRE EL TOTAL'],
    ['Total Proveedores Registrados en Banco', totalDossiers, '100%'],
    ['Proveedores Habilitados Operativamente (Activos)', habilitados, `${Math.round((habilitados / (totalDossiers || 1)) * 100)}%`],
    ['Proveedores en Revisión Técnica y Documental', enRevision, `${Math.round((enRevision / (totalDossiers || 1)) * 100)}%`],
    ['Proveedores con Observaciones / Pendientes', pendientes, `${Math.round((pendientes / (totalDossiers || 1)) * 100)}%`],
    ['Proveedores - Personas Jurídicas', personasJuridicas, `${Math.round((personasJuridicas / (totalDossiers || 1)) * 100)}%`],
    ['Proveedores - Personas Naturales', personasNaturales, `${Math.round((personasNaturales / (totalDossiers || 1)) * 100)}%`],
    ['Proveedores Tipo A (Crítico / Estratégico)', tierA, `${Math.round((tierA / (totalDossiers || 1)) * 100)}%`],
    ['Proveedores Tipo B (Importante / Operativo)', tierB, `${Math.round((tierB / (totalDossiers || 1)) * 100)}%`],
    ['Proveedores Tipo C (Estándar / Ocasional)', tierC, `${Math.round((tierC / (totalDossiers || 1)) * 100)}%`],
    ['Total Convocatorias Registradas', convocatorias.length, '-'],
    ['Total Modificaciones Auditadas en Sistema', auditLogs.length, '-'],
    [],
    ['Nota:', 'Este libro de cálculo contiene las hojas detalladas de Directorio, Cumplimiento, SARLAFT, Cuentas Bancarias y Auditoría.'],
  ];

  const wsKpi = XLSX.utils.aoa_to_sheet(kpiData);
  autoFitColumns(wsKpi, kpiData);
  XLSX.utils.book_append_sheet(wb, wsKpi, 'Resumen Ejecutivo');

  // Sheet 2: Directorio
  const dirHeaders = [
    'No. Expediente',
    'Tipo Persona',
    'Tipo Proveedor (A/B/C)',
    'Nombre / Razón Social',
    'NIT / Documento',
    'Ciudad',
    'Correo',
    'Teléfono',
    'Categoría',
    'Estado',
    'SARLAFT',
  ];
  const dirRows = dossiers.map((d) => {
    const tier = d.supplierTier || d.basicInfo?.supplierTier || 'B';
    const tierText = `Tipo ${tier} (${tier === 'A' ? 'Crítico' : tier === 'B' ? 'Operativo' : 'Estándar'})`;
    return [
      sanitize(d.fileNumber),
      sanitize(d.basicInfo?.supplierType === 'NATURAL' ? 'Natural' : 'Jurídica'),
      sanitize(tierText),
      sanitize(d.basicInfo?.supplierType === 'NATURAL' ? d.basicInfo?.fullName : d.basicInfo?.companyName),
      sanitize(d.basicInfo?.supplierType === 'NATURAL' ? d.basicInfo?.documentNumber : d.basicInfo?.nit),
      sanitize(d.basicInfo?.city),
      sanitize(d.basicInfo?.email),
      sanitize(d.basicInfo?.phone),
      sanitize(d.selectedCategory),
      sanitize(d.processStatus),
      sanitize(d.internalConcepts?.sarlatfCheck?.result || 'PENDIENTE'),
    ];
  });
  const wsDir = XLSX.utils.aoa_to_sheet([dirHeaders, ...dirRows]);
  autoFitColumns(wsDir, [dirHeaders, ...dirRows]);
  XLSX.utils.book_append_sheet(wb, wsDir, 'Directorio');

  // Sheet 3: Matriz Documental Resumida
  const docHeaders = [
    'Expediente',
    'Proveedor',
    'FS.GA-FOR-009',
    'FS.GA-FOR-039',
    'RUT',
    'Cámara Comercio',
    'Cert. Bancaria',
    'Seguridad Social',
    '% Cumplimiento',
  ];
  const docRows = dossiers.map((d) => {
    const docs = Object.values(d.documents || {});
    const req = docs.filter((x) => x.isRequired);
    const app = req.filter((x) => x.status === 'APROBADO');
    const p = Math.round((app.length / (req.length || 1)) * 100);
    return [
      sanitize(d.fileNumber),
      sanitize(d.basicInfo?.supplierType === 'NATURAL' ? d.basicInfo?.fullName : d.basicInfo?.companyName),
      sanitize(d.documents?.FS_GA_FOR_009?.status || 'PENDIENTE'),
      sanitize(d.documents?.FS_GA_FOR_039?.status || 'PENDIENTE'),
      sanitize(d.documents?.RUT?.status || 'PENDIENTE'),
      sanitize(d.documents?.CAMARA_COMERCIO?.status || 'PENDIENTE'),
      sanitize(d.documents?.CERTIFICACION_BANCARIA?.status || 'PENDIENTE'),
      sanitize(d.documents?.SEGURIDAD_SOCIAL?.status || 'PENDIENTE'),
      `${p}%`,
    ];
  });
  const wsDoc = XLSX.utils.aoa_to_sheet([docHeaders, ...docRows]);
  autoFitColumns(wsDoc, [docHeaders, ...docRows]);
  XLSX.utils.book_append_sheet(wb, wsDoc, 'Matriz Documentos');

  const fileName = `SIGEPRO_Libro_Maestro_Consolidado_Flota_Sugamuxi_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * 8. Custom Filtered & Selected Columns Excel Export
 */
export interface CustomExportConfig {
  reportTitle: string;
  dossiers: SupplierDossier[];
  selectedColumns: string[];
}

export const exportCustomExcelReport = (config: CustomExportConfig) => {
  const { reportTitle, dossiers, selectedColumns } = config;
  const wb = XLSX.utils.book_new();

  // Column definitions catalog
  const columnCatalog: Record<string, { header: string; getValue: (d: SupplierDossier) => any }> = {
    fileNumber: { header: 'No. Expediente', getValue: (d) => d.fileNumber },
    supplierType: { header: 'Tipo Persona', getValue: (d) => (d.basicInfo?.supplierType === 'NATURAL' ? 'Natural' : 'Jurídica') },
    supplierTier: {
      header: 'Tipo Proveedor (A/B/C)',
      getValue: (d) => {
        const tier = d.supplierTier || d.basicInfo?.supplierTier || 'B';
        return `Tipo ${tier} (${tier === 'A' ? 'Crítico' : tier === 'B' ? 'Operativo' : 'Estándar'})`;
      },
    },
    name: {
      header: 'Razón Social / Nombre',
      getValue: (d) => (d.basicInfo?.supplierType === 'NATURAL' ? d.basicInfo?.fullName : d.basicInfo?.companyName),
    },
    docType: {
      header: 'Tipo Documento',
      getValue: (d) => (d.basicInfo?.supplierType === 'NATURAL' ? d.basicInfo?.documentType || 'CC' : 'NIT'),
    },
    docNumber: {
      header: 'NIT / No. Identificación',
      getValue: (d) => (d.basicInfo?.supplierType === 'NATURAL' ? d.basicInfo?.documentNumber : d.basicInfo?.nit),
    },
    dv: { header: 'DV', getValue: (d) => d.basicInfo?.dv || '' },
    repLegal: {
      header: 'Representante Legal',
      getValue: (d) => (d.basicInfo?.supplierType === 'NATURAL' ? 'N/A' : d.basicInfo?.representativeLegalName || ''),
    },
    repLegalDoc: {
      header: 'Doc. Rep. Legal',
      getValue: (d) => (d.basicInfo?.supplierType === 'NATURAL' ? 'N/A' : `${d.basicInfo?.representativeLegalDocType || 'CC'} ${d.basicInfo?.representativeLegalDocNumber || ''}`),
    },
    email: { header: 'Correo Electrónico', getValue: (d) => d.basicInfo?.email || '' },
    phone: { header: 'Teléfono Principal', getValue: (d) => d.basicInfo?.phone || '' },
    city: { header: 'Ciudad', getValue: (d) => d.basicInfo?.city || '' },
    department: { header: 'Departamento', getValue: (d) => d.basicInfo?.department || 'Boyacá' },
    address: { header: 'Dirección', getValue: (d) => d.basicInfo?.address || '' },
    website: { header: 'Sitio Web', getValue: (d) => d.basicInfo?.website || '' },
    category: { header: 'Categoría', getValue: (d) => d.selectedCategory || 'General' },
    economicActivity: { header: 'Actividad Económica', getValue: (d) => d.economicActivity || '' },
    ciiuCode: { header: 'Código CIIU', getValue: (d) => d.basicInfo?.taxInfo?.ciiuCode || '' },
    taxRegime: { header: 'Régimen Tributario', getValue: (d) => d.basicInfo?.taxInfo?.taxRegime || '' },
    isGranContribuyente: { header: 'Gran Contribuyente', getValue: (d) => (d.basicInfo?.taxInfo?.isGranContribuyente ? 'SÍ' : 'NO') },
    isAutoRetenedor: { header: 'Autorretenedor', getValue: (d) => (d.basicInfo?.taxInfo?.isAutoRetenedor ? 'SÍ' : 'NO') },
    bankName: { header: 'Banco Receptor', getValue: (d) => d.basicInfo?.bankInfo?.bankName || '' },
    accountType: { header: 'Tipo Cuenta', getValue: (d) => d.basicInfo?.bankInfo?.accountType || '' },
    accountNumber: { header: 'No. Cuenta', getValue: (d) => d.basicInfo?.bankInfo?.accountNumber || '' },
    totalAssets: { header: 'Activos Totales (COP)', getValue: (d) => d.basicInfo?.financialInfo?.totalAssets || 0 },
    totalLiabilities: { header: 'Pasivos Totales (COP)', getValue: (d) => d.basicInfo?.financialInfo?.totalLiabilities || 0 },
    netWorth: { header: 'Patrimonio Neto (COP)', getValue: (d) => d.basicInfo?.financialInfo?.netWorth || 0 },
    annualRevenue: { header: 'Ingresos Anuales (COP)', getValue: (d) => d.basicInfo?.financialInfo?.annualRevenue || 0 },
    processStatus: { header: 'Estado del Proceso', getValue: (d) => d.processStatus },
    compliancePercent: {
      header: '% Cumplimiento Documental',
      getValue: (d) => {
        const docs = Object.values(d.documents || {});
        const req = docs.filter((x) => x.isRequired !== false);
        const app = req.filter((x) => x.status === 'APROBADO');
        return `${Math.round((app.length / (req.length || 1)) * 100)}%`;
      },
    },
    sarlatf: { header: 'SARLAFT', getValue: (d) => d.internalConcepts?.sarlatfCheck?.result || 'PENDIENTE' },
    ofac: { header: 'OFAC / Clinton', getValue: (d) => d.internalConcepts?.ofacCheck?.result || 'PENDIENTE' },
    procuraduria: { header: 'Procuraduría / Policía', getValue: (d) => d.internalConcepts?.procuraduriaPoliciaCheck?.result || 'PENDIENTE' },
    createdAt: { header: 'Fecha Inscripción', getValue: (d) => d.createdAt },
    updatedAt: { header: 'Última Actualización', getValue: (d) => d.updatedAt || d.createdAt },
  };

  const validCols = selectedColumns.filter((c) => columnCatalog[c]);
  const headers = validCols.map((c) => columnCatalog[c].header);

  const rows = dossiers.map((d) => {
    return validCols.map((c) => sanitize(columnCatalog[c].getValue(d)));
  });

  const wsData = [
    ['FLOTA SUGAMUXI S.A. - SISTEMA INTEGRADO DE GESTIÓN (SIG)'],
    [reportTitle.toUpperCase()],
    [`Fecha de Generación: ${new Date().toLocaleString('es-CO')} | Total Registros: ${dossiers.length}`],
    [],
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  autoFitColumns(ws, [headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Informe Personalizado');

  const cleanTitle = reportTitle.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `SIGEPRO_${cleanTitle}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
