export type UserRole = 'REVISOR' | 'ADMIN';
export type ThemeMode = 'light' | 'dark';

export interface SystemUser {
  id: string; // 'admin-1', 'revisor-1', 'revisor-2', 'revisor-3'
  name: string;
  shortName: string; // 'Admin General', 'Revisor 1', 'Revisor 2', 'Revisor 3'
  role: UserRole;
  email: string;
  avatarText: string;
  department: string;
  color?: string;
  description?: string;
  roleDescription?: string;
}

export type AppView =
  | 'convocatorias'
  | 'adminForms'
  | 'revisores'
  | 'evaluaciones'
  | 'documentMatrix'
  | 'bancoProveedores'
  | 'auditoria'
  | 'informesExcel'
  | 'registrarProveedor'
  | 'parametrizacion'
  | 'login';

export type SupplierType = 'NATURAL' | 'JURIDICA';
export type SupplierTier = 'A' | 'B' | 'C'; // Tipo A (Crítico/Estratégico), Tipo B (Importante/Operativo), Tipo C (Estándar/Ocasional)


export type ProcessStatus =
  | 'BORRADOR'
  | 'DOCUMENTACION_PENDIENTE'
  | 'LISTO_PARA_ENVIO'
  | 'EN_REVISION'
  | 'REQUIERE_CORRECCION'
  | 'CORREGIDO_EN_REVISION'
  | 'APROBADO'
  | 'PROVEEDOR_HABILITADO'
  | 'DOCUMENTACION_VENCIDA'
  | 'DOCUMENTACION_POR_VENCER'
  | 'CONTRATO_VIGENTE'
  | 'CONTRATO_POR_VENCER'
  | 'CONTRATO_VENCIDO'
  | 'SUSPENDIDO'
  | 'RECHAZADO';

export type DocumentExpirationStatus = 'NO_APLICA' | 'VIGENTE' | 'POR_VENCER' | 'VENCIDO';

export interface DocumentExpirationInfo {
  status: DocumentExpirationStatus;
  daysRemaining: number;
  daysOverdue?: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  label: string;
  badgeClass: string;
  formattedDate: string;
  explanation: string;
}

export type ContractValidityStatus =
  | 'SIN_CONTRATO'
  | 'VIGENTE'
  | 'POR_VENCER'
  | 'VENCIDO'
  | 'SUSPENDIDO'
  | 'TERMINADO';

export interface SupplierContractInfo {
  contractNumber?: string;
  contractType?: 'SUMINISTRO' | 'PRESTACION_SERVICIOS' | 'MANTENIMIENTO' | 'OBRA_CIVIL' | 'SEGUROS' | 'TRANSPORTE' | string;
  objectDescription?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  contractValueCOP?: number;
  contractValue?: number;
  contractStatus: ContractValidityStatus;
  supervisorName?: string;
  supervisor?: string;
  supervisorRole?: string;
  notes?: string;
  lastUpdated?: string;
  manualOverride?: boolean;
  manualReason?: string;
  autoSyncStatus?: boolean;
}

export type DocumentStatus =
  | 'PENDIENTE'
  | 'CARGADO'
  | 'EN_REVISION'
  | 'APROBADO'
  | 'REQUIERE_CORRECCION'
  | 'RECHAZADO'
  | 'VIGENTE'
  | 'POR_VENCER'
  | 'VENCIDO';

export type DocumentCode =
  | 'FS_GA_FOR_009'
  | 'FS_GA_FOR_039'
  | 'RUT'
  | 'CAMARA_COMERCIO'
  | 'CEDULA_REP_LEGAL'
  | 'CEDULA_NATURAL'
  | 'CERTIFICACION_BANCARIA'
  | 'ESTADOS_FINANCIEROS'
  | 'PORTAFOLIO_SERVICIOS'
  | 'HOJA_DE_VIDA'
  | 'CERTIFICADOS_ESTUDIO'
  | 'SEGURIDAD_SOCIAL'
  | 'CERTIFICADO_CONFORMIDAD'
  | 'DOCUMENTACION_LEGAL_ACTIVIDAD'
  | 'DECLARACION_RENTA'
  | 'POLIZA_RCE'
  | 'SST_PLAN'
  | 'CERTIFICADO_CALIDAD'
  | 'DECLARACION_SARLAFT'
  | string;

export interface DocumentCorrection {
  reason: string;
  sectionOrPage?: string;
  detailedObservation: string;
  requestedAt: string;
  requestedBy: string;
}

export interface SupplierDocument {
  id: string;
  code: DocumentCode | string;
  name: string;
  isInstitutionalForm?: boolean;
  formCode?: string; // e.g. "FS.GA-FOR-009"
  formVersion?: string; // e.g. "14.0"
  isRequired: boolean;
  status: DocumentStatus;
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  correction?: DocumentCorrection;
  previewUrl?: string;
  customUrl?: string;
  expirationDate?: string;
  notes?: string;
}

export interface InstitutionalForm {
  id: string;
  code: 'FS.GA-FOR-009' | 'FS.GA-FOR-039' | string;
  name: string;
  currentVersion: string;
  effectiveDate: string;
  isCurrent: boolean;
  isMandatory: boolean;
  description: string;
  instructions: string[];
  templateFileName: string;
  versionHistory: Array<{
    version: string;
    releaseDate: string;
    modifiedBy: string;
    changeSummary: string;
    isActive: boolean;
  }>;
}

export interface BankInfo {
  bankName?: string;
  accountType?: 'AHORROS' | 'CORRIENTE' | string;
  accountNumber?: string;
  accountHolder?: string;
  holderDocNumber?: string;
}

export interface FinancialInfo {
  totalAssets?: number;
  totalLiabilities?: number;
  netWorth?: number;
  annualRevenue?: number;
  financialCutoffDate?: string;
  grossIncome?: number;
}

export interface TaxInfo {
  taxRegime?: string;
  isGranContribuyente?: boolean;
  isAutoRetenedor?: boolean;
  isIvaResponsible?: boolean;
  ciiuCode?: string;
  icaCity?: string;
  icaRate?: string;
}

export interface HseqInfo {
  certifications?: string[];
  arlRiskLevel?: string;
  responsibleName?: string;
  responsiblePhone?: string;
  hasSSTPlan?: boolean;
}

export interface ContactInfo {
  commercialContactName?: string;
  commercialContactPhone?: string;
  commercialContactEmail?: string;
  commercialContactPosition?: string;
  billingContactName?: string;
  billingContactPhone?: string;
  billingContactEmail?: string;
}

export interface SupplierBasicInfo {
  // Common
  supplierType: SupplierType;
  supplierTier?: SupplierTier; // 'A' | 'B' | 'C'
  email: string;
  phone: string;
  city: string;
  department?: string;
  address?: string;
  website?: string;
  
  // Natural
  fullName?: string;
  documentType?: 'CC' | 'CE' | 'PASAPORTE';
  documentNumber?: string;
  professionOrTrade?: string;

  // Juridica
  companyName?: string;
  nit?: string;
  dv?: string;
  representativeLegalName?: string;
  representativeLegalDocType?: 'CC' | 'CE' | 'PASAPORTE';
  representativeLegalDocNumber?: string;
  economicActivity?: string;
  cellphone?: string;
  legalRepresentative?: string;
  repDocNumber?: string;
  repEmail?: string;
  bankName?: string;
  accountType?: string;
  accountNumber?: string;

  // Extended sections
  bankInfo?: BankInfo;
  financialInfo?: FinancialInfo;
  taxInfo?: TaxInfo;
  hseqInfo?: HseqInfo;
  contactInfo?: ContactInfo;
}

export interface InternalConcepts {
  sarlatfCheck: {
    checked: boolean;
    result: 'SIN_COINCIDENCIAS' | 'REQUIERE_VERIFICACION' | 'PENDIENTE';
    checkedBy?: string;
    checkedAt?: string;
    notes?: string;
  };
  ofacCheck: {
    checked: boolean;
    result: 'LIMPIO' | 'ALERTA' | 'PENDIENTE';
    checkedBy?: string;
    checkedAt?: string;
  };
  procuraduriaPoliciaCheck: {
    checked: boolean;
    result: 'VIGENTE_SIN_ANTECEDENTES' | 'CON_ANTECEDENTES' | 'PENDIENTE';
    checkedBy?: string;
    checkedAt?: string;
  };
  legalConcept: {
    status: 'APROBADO' | 'OBSERVADO' | 'PENDIENTE';
    comments?: string;
    reviewer?: string;
    date?: string;
  };
  financialConcept: {
    status: 'APROBADO' | 'OBSERVADO' | 'PENDIENTE';
    comments?: string;
    reviewer?: string;
    date?: string;
  };
  hseqConcept: {
    status: 'APROBADO' | 'OBSERVADO' | 'PENDIENTE';
    comments?: string;
    reviewer?: string;
    date?: string;
  };
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  role: string;
  notes?: string;
  statusChange?: {
    from: ProcessStatus;
    to: ProcessStatus;
  };
}

export interface SystemAuditEntry {
  id: string;
  timestamp: string; // ISO string
  formattedDate: string; // e.g. "26/08/2026 10:15:30"
  dossierId: string;
  supplierName: string;
  supplierDoc: string;
  fileNumber: string;
  user: string;
  userRole: UserRole | 'SYSTEM';
  action: 'EDICION_CAMPO' | 'CAMBIO_ESTADO' | 'REVISION_DOCUMENTO' | 'VALIDACION_SARLAFT' | 'ALTA_PROVEEDOR' | 'CREACION_EXPEDIENTE' | 'PARAMETRIZACION_SISTEMA' | 'CREACION_REGISTRO' | 'ASIGNACION_REVISOR' | 'CALIFICACION_PROVEEDOR';
  section: string; // e.g. "Información General", "Información Bancaria", "Información Financiera", "Información Tributaria", "Conceptos y SARLAFT"
  fieldChanged: string; // e.g. "Razón Social", "NIT", "Entidad Bancaria", "Total Activos"
  oldValue: string;
  newValue: string;
  justification?: string;
}

export interface SupplierDossier {
  id: string;
  fileNumber: string; // e.g. "FS-PROV-2026-000001"
  supplierType?: SupplierType;
  supplierTier?: SupplierTier; // 'A' | 'B' | 'C'
  basicInfo: SupplierBasicInfo;
  isEmailVerified: boolean;
  verificationCode?: string;
  emailVerificationCode?: string;
  selectedCategory: string;
  economicActivity: string;
  documents: Record<string, SupplierDocument>;
  processStatus: ProcessStatus;
  internalConcepts: InternalConcepts;
  auditHistory: AuditLog[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  lastReviewDate?: string;
  reviewerNotes?: string;
  assignedReviewerId?: string; // 'revisor-1' | 'revisor-2' | 'revisor-3'
  assignedReviewerName?: string; // e.g. 'Revisor 1 - Carlos Mendoza'
  assignedAt?: string;
  assignedBy?: string;
  evaluations?: SupplierEvaluation[];
  initialEvaluation?: SupplierEvaluation;
  annualEvaluation?: SupplierEvaluation;
  nextAnnualEvaluationDate?: string;
  contractInfo?: SupplierContractInfo;
  manualStatusOverride?: boolean;
  manualStatusReason?: string;
  manualStatusChangedAt?: string;
  manualStatusChangedBy?: string;
  manualStatusUpdatedBy?: string;
}

export type EvaluationType = 'INICIAL' | 'ANUAL_1_ANO' | 'ANUAL_PERIODICA';
export type SupplierEvaluationType = EvaluationType;

export type EvaluationConcept =
  | 'SOBRESALIENTE'
  | 'CONFORME'
  | 'CONDICIONAL_MEJORA'
  | 'NO_CONFORME';

export interface EvaluationCriterionScore {
  criterionId: string;
  criterionName: string;
  category: string; // e.g. 'Calidad y Especificaciones', 'Oportunidad y Entregas', 'HSEQ y SST', 'Garantía y Servicio', 'Gestión Comercial'
  weight: number; // percentage (e.g., 25)
  score: number; // 0 to 100
  notes?: string;
}

export interface SupplierEvaluation {
  id: string;
  dossierId: string;
  supplierName: string;
  supplierDoc: string;
  fileNumber: string;
  supplierTier?: SupplierTier;
  categoryName?: string;
  evaluationType: EvaluationType;
  annualCycleNumber?: number; // 1, 2, 3, 4... Año de calificación anual recurrente
  periodYear?: number; // e.g. 2025, 2026, 2027
  evaluationDate: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  evaluatorId: string;
  evaluatorName: string;
  evaluatorRole: string;
  totalScore: number; // 0 to 100
  concept: EvaluationConcept;
  criteriaScores: EvaluationCriterionScore[];
  observations?: string;
  hasImprovementPlan: boolean;
  improvementPlanAction?: string;
  improvementPlanDeadline?: string;
  nextEvaluationDueDate?: string; // e.g. 1 year from evaluation
  status?: 'COMPLETADA' | 'BORRADOR';
  certificateCode?: string;
  createdAt: string;
}

export interface EvaluationThresholds {
  sobresalienteMin: number; // default 85 or 90
  conformeMin: number;      // default 70
  condicionalMin: number;   // default 60
}

export interface EvaluationCriterionConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  weight?: number; // percentage (e.g. 20)
  weightInitial?: number; // percentage for initial eval
  weightAnnual?: number; // percentage for annual eval
  appliesTo: 'INICIAL' | 'ANUAL_1_ANO' | 'AMBOS' | 'AMBAS';
  minPassingScore?: number;
  minScoreToPass?: number;
  order?: number;
  isActive: boolean;
}

export interface EvaluationMethodConfig {
  id: string;
  title: string;
  description: string;
  initialPassingScore: number; // default 70
  annualPassingScore: number; // default 75
  excellentThreshold: number; // default 90
  conditionalThreshold: number; // default 60
  annualPeriodicityDays: number; // default 365
  thresholds: EvaluationThresholds;
  criteria: EvaluationCriterionConfig[];
}

export type ConvocatoriaAccessRule = 'OPCION_A' | 'OPCION_B' | 'OPCION_C';

export interface ConvocatoriaPostulacionQuotation {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  fileData?: string; // base64 or object URL
  notes?: string;
}

export interface ConvocatoriaPostulacion {
  id: string;
  supplierId: string;
  supplierName: string;
  fileNumber: string;
  supplierStatus: ProcessStatus;
  nitOrDoc: string;
  contactEmail: string;
  proposedValue: number;
  proposalSummary: string;
  submittedAt: string;
  status: 'POSTULADO' | 'EN_EVALUACION' | 'EVALUADO' | 'SELECCIONADO' | 'NO_SELECCIONADO';
  technicalScore?: number;
  economicScore?: number;
  feedback?: string;
  quotationFiles?: ConvocatoriaPostulacionQuotation[];
}

export interface Convocatoria {
  id: string;
  code: string; // e.g. "CONV-FS-2026-003"
  title: string;
  category: string;
  description: string;
  requirementsSummary: string[];
  budgetEstimateCOP?: number;
  publishedDate: string;
  closingDate: string;
  accessRule: ConvocatoriaAccessRule;
  status: 'ABIERTA' | 'EN_EVALUACION' | 'ADJUDICADA' | 'CERRADA';
  termsFileName: string;
  postulaciones: ConvocatoriaPostulacion[];
}

export interface DocumentDefinition {
  code: string;
  name: string;
  category: 'LEGAL' | 'FINANCIERO' | 'TECNICO' | 'HSEQ' | 'SARLAFT' | 'OPERATIVO';
  description: string;
  validityRule?: string;
  isInstitutionalForm?: boolean;
  formCode?: string;
  suggestedFileTypes?: string[];
  requiresExpirationDate?: boolean;
  validityDays?: number;
  alertDaysBefore?: number;
  isActive?: boolean;
}

export interface PersonTypeBaseRequirementConfig {
  personType: SupplierType;
  title: string;
  description: string;
  mandatoryDocs: string[];
  optionalDocs: string[];
  legalBasisNotes?: string;
}

export type DocumentRequirementOrigin = 'BASE_PERSON' | 'ECONOMIC_ACTIVITY' | 'INSTITUTIONAL_FORM';

export interface CategoryRequirementConfig {
  id?: string;
  category: string;
  name?: string;
  description: string;
  riskLevel?: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO';
  economicCode?: string;
  isActive?: boolean;
  mandatoryForNatural: string[];
  mandatoryForJuridica: string[];
  optionalForNatural: string[];
  optionalForJuridica: string[];
  specialConditions?: {
    requiresRCEPolicy?: boolean;
    requiresSSTPlan?: boolean;
    requiresFinancialAudit?: boolean;
    requiresISO9001?: boolean;
    requiresTechnicalBrochure?: boolean;
  };
}

export type EmailNotificationType =
  | 'STATUS_CHANGE'
  | 'CORRECTION_REQUESTED'
  | 'DOCUMENT_APPROVED'
  | 'DOSSIER_APPROVED'
  | 'DOSSIER_HABILITADO'
  | 'DOSSIER_REJECTED'
  | 'REGISTRATION_CODE'
  | 'SUBMISSION_CONFIRMATION'
  | 'CUSTOM_ALERT';

export interface EmailNotification {
  id: string;
  dossierId: string;
  recipientEmail: string;
  recipientName: string;
  fileNumber: string;
  subject: string;
  templateType: EmailNotificationType;
  sentAt: string;
  status: 'DELIVERED' | 'SENT';
  previewSnippet: string;
  bodyHtml: string;
  read?: boolean;
  metadata?: {
    oldStatus?: ProcessStatus;
    newStatus?: ProcessStatus;
    documentCode?: string;
    documentName?: string;
    reason?: string;
    sectionOrPage?: string;
    detailedObservation?: string;
    reviewerName?: string;
    rejectionReason?: string;
  };
}

export interface AdminCreateSupplierInput {
  basicInfo: SupplierBasicInfo;
  selectedCategory: string;
  supplierTier?: SupplierTier; // 'A' | 'B' | 'C'
  economicActivity?: string;
  initialStatus: ProcessStatus;
  isEmailVerified: boolean;
  notes?: string;
  createdByRole: 'REVISOR' | 'ADMIN';
  createdByName: string;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  complianceChecks?: {
    sarlaftResult?: 'SIN_COINCIDENCIAS' | 'REQUIERE_VERIFICACION' | 'PENDIENTE';
    ofacResult?: 'LIMPIO' | 'ALERTA' | 'PENDIENTE';
    procuraduriaResult?: 'VIGENTE_SIN_ANTECEDENTES' | 'CON_ANTECEDENTES' | 'PENDIENTE';
    legalConcept?: 'APROBADO' | 'OBSERVADO' | 'PENDIENTE';
    financialConcept?: 'APROBADO' | 'OBSERVADO' | 'PENDIENTE';
    hseqConcept?: 'APROBADO' | 'OBSERVADO' | 'PENDIENTE';
  };
}

export interface ToastNotificationData {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  duration?: number;
}

// =========================================================
// SYSTEM PARAMETERS & CONFIGURABLE CATALOGS (ADMIN GENERAL)
// =========================================================

export interface BankParameter {
  id: string;
  code: string;
  name: string;
  type?: 'BANCO_COMERCIAL' | 'COOPERATIVA' | 'BILLETERA_DIGITAL' | 'OTRO' | string;
  bankType?: string;
  isActive: boolean;
  order?: number;
}

export interface BankAccountTypeParameter {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface DocumentTypeParameter {
  id: string;
  code: string;
  name: string;
  appliesTo: 'NATURAL' | 'JURIDICA' | 'AMBOS';
  isActive: boolean;
}

export interface TaxRegimeParameter {
  id: string;
  code: string;
  name: string;
  description?: string;
  isIvaResponsible?: boolean;
  isActive: boolean;
}

export interface CityParameter {
  id: string;
  code: string;
  name: string;
  department: string;
  region?: string;
  isMainHub?: boolean;
  isActive: boolean;
}

export interface ArlRiskParameter {
  id: string;
  code: string; // e.g. "CLASE_I", "CLASE_II", etc.
  name: string; // e.g. "Clase I - Riesgo Mínimo"
  percentage: string | number; // e.g. "0.522%" or 0.522
  description: string;
  isActive: boolean;
}

export interface ConvocatoriaTypeParameter {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface RejectionReasonParameter {
  id: string;
  code: string;
  name: string;
  category: 'LEGAL' | 'FINANCIERO' | 'TECNICO' | 'HSEQ' | 'SARLAFT' | 'GENERAL' | string;
  defaultObservation?: string;
  isActive: boolean;
}

export interface GlobalSystemSettings {
  camaraComercioMaxDays?: number;
  certificacionBancariaMaxDays?: number;
  notificationEmail?: string;
  supportPhone?: string;
  sigDepartmentName?: string;
  minCompletionForSubmit?: number;
  companyName: string;
  companyNit: string;
  portalWelcomeMessage?: string;
  enableEmailAutoVerify?: boolean;
  allowUnregisteredBidding?: boolean;
  directorComprasName?: string;
  maxFileUploadSizeMB?: number;
  dossierValidityDays?: number;
  habeasDataPolicyVersion?: string;
  enableAutoEmailNotifications?: boolean;
  contactEmailSIG?: string;
  contactPhoneSIG?: string;
  systemVersion?: string;
  allowedFileExtensions?: string[];
  platformMaintenanceMode?: boolean;
}

export interface SystemParametersState {
  bankOptions: BankParameter[];
  bankAccountTypes: BankAccountTypeParameter[];
  documentTypes: DocumentTypeParameter[];
  taxRegimes: TaxRegimeParameter[];
  cityOptions: CityParameter[];
  arlRiskLevels: ArlRiskParameter[];
  convocatoriaTypes: ConvocatoriaTypeParameter[];
  rejectionReasons: RejectionReasonParameter[];
  globalSettings: GlobalSystemSettings;
}

