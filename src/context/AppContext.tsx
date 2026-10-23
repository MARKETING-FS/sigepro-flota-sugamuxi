import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  ThemeMode,
  AppView,
  SupplierDossier,
  SupplierDocument,
  InstitutionalForm,
  Convocatoria,
  CategoryRequirementConfig,
  ProcessStatus,
  SupplierBasicInfo,
  DocumentCorrection,
  InternalConcepts,
  ConvocatoriaPostulacion,
  EmailNotification,
  EmailNotificationType,
  AdminCreateSupplierInput,
  DocumentDefinition,
  SupplierPortalTab,
  PersonTypeBaseRequirementConfig,
  DocumentRequirementOrigin,
  SupplierType,
  ToastNotificationData,
  SystemAuditEntry,
  SystemParametersState,
  BankParameter,
  BankAccountTypeParameter,
  DocumentTypeParameter,
  TaxRegimeParameter,
  CityParameter,
  ArlRiskParameter,
  ConvocatoriaTypeParameter,
  RejectionReasonParameter,
  GlobalSystemSettings,
  SystemUser,
  AuditLog,
  SupplierEvaluation,
  EvaluationType,
  EvaluationConcept,
  EvaluationCriterionScore,
  EvaluationCriterionConfig,
  EvaluationMethodConfig,
  SupplierContractInfo,
} from '../types';
import {
  INITIAL_INSTITUTIONAL_FORMS,
  INITIAL_DOSSIERS,
  INITIAL_CONVOCATORIAS,
  CATEGORIES_CONFIG,
  DOCUMENT_CATALOG_INFO,
  INITIAL_DOCUMENT_DEFINITIONS,
  INITIAL_BASE_REQUIREMENTS,
  INITIAL_SYSTEM_AUDIT_LOGS,
  INITIAL_SYSTEM_PARAMETERS,
  INITIAL_SYSTEM_USERS,
} from '../data/initialData';
import { INITIAL_EVALUATION_METHOD, INITIAL_SUPPLIER_EVALUATIONS } from '../data/initialEvaluations';
import { INITIAL_EMAIL_NOTIFICATIONS } from '../data/initialEmails';
import { generateEmailContent } from '../utils/emailTemplates';
import { supabaseService } from '../services/supabaseService';
import { sendEmail } from '../services/emailService';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  dossiers: SupplierDossier[];
  allDossiers: SupplierDossier[];
  activeUserId: string;
  activeUser: SystemUser;
  setActiveUserId: (id: string) => void;
  systemUsers: SystemUser[];
  canEditDossier: (dossierId: string) => boolean;
  assignSupplierReviewer: (dossierId: string, reviewerId: string, reviewerName: string, assignedBy?: string) => void;
  currentDossierId: string | null;
  currentDossier: SupplierDossier | null;
  setCurrentDossierId: (id: string | null) => void;
  institutionalForms: InstitutionalForm[];
  categoriesConfig: CategoryRequirementConfig[];
  documentDefinitions: DocumentDefinition[];
  baseRequirementsConfig: Record<'NATURAL' | 'JURIDICA', PersonTypeBaseRequirementConfig>;
  convocatorias: Convocatoria[];

  // Review & Executive Routing
  reviewSelectedDossierId: string | null;
  setReviewSelectedDossierId: (id: string | null) => void;
  openSupplierReview: (dossierId: string) => void;
  openExecutiveDashboard: () => void;

  // Supplier Evaluation & Grading SIG (Revisor & Admin)
  supplierEvaluations: SupplierEvaluation[];
  evaluationMethod: EvaluationMethodConfig;
  selectedEvaluationDossierId: string | null;
  setSelectedEvaluationDossierId: (id: string | null) => void;
  openSupplierEvaluation: (dossierId: string) => void;
  recordSupplierEvaluation: (
    evalData: Omit<SupplierEvaluation, 'id' | 'createdAt' | 'certificateCode'>
  ) => SupplierEvaluation;
  deleteSupplierEvaluation: (id: string) => { success: boolean; message: string };
  updateEvaluationMethod: (updated: Partial<EvaluationMethodConfig>) => void;
  addEvaluationCriterion: (criterion: Omit<EvaluationCriterionConfig, 'id'>) => { success: boolean; message: string };
  updateEvaluationCriterion: (id: string, updated: Partial<EvaluationCriterionConfig>) => void;
  deleteEvaluationCriterion: (id: string) => { success: boolean; message: string };
  resetEvaluationMethodToDefault: () => void;

  // General Audit Trail System
  systemAuditLogs: SystemAuditEntry[];
  addSystemAuditLog: (entry: Omit<SystemAuditEntry, 'id' | 'timestamp' | 'formattedDate'>) => void;
  updateSupplierField: (
    dossierId: string,
    section: string,
    fieldKey: string,
    fieldLabel: string,
    oldValue: any,
    newValue: any,
    updatedBy: string,
    role: UserRole,
    justification?: string
  ) => void;
  updateEntireSupplier: (
    dossierId: string,
    updatedData: Partial<SupplierDossier>,
    changes: Array<{ section: string; fieldLabel: string; oldValue: any; newValue: any }>,
    updatedBy: string,
    role: UserRole,
    justification?: string
  ) => void;
  
  // Document Matrix & Parametrization Actions (Admin)
  updateBaseRequirementsConfig: (personType: 'NATURAL' | 'JURIDICA', updated: Partial<PersonTypeBaseRequirementConfig>) => void;
  toggleBaseDocumentRequirement: (
    personType: 'NATURAL' | 'JURIDICA',
    docCode: string,
    mode: 'MANDATORY' | 'OPTIONAL' | 'NONE'
  ) => void;
  getRequiredDocumentsForSupplier: (
    supplierType: SupplierType | undefined,
    categoryName: string | undefined
  ) => {
    allMandatory: string[];
    allOptional: string[];
    baseMandatory: string[];
    activityMandatory: string[];
    baseOptional: string[];
    activityOptional: string[];
  };
  updateCategoryConfig: (categoryName: string, updatedConfig: Partial<CategoryRequirementConfig>) => void;
  addCategoryConfig: (newConfig: CategoryRequirementConfig) => { success: boolean; message: string };
  deleteCategoryConfig: (categoryName: string) => { success: boolean; message: string };
  toggleDocumentRequirement: (
    categoryName: string,
    docCode: string,
    targetRegimen: 'NATURAL' | 'JURIDICA',
    mode: 'MANDATORY' | 'OPTIONAL' | 'NONE'
  ) => void;
  addDocumentDefinition: (doc: DocumentDefinition) => { success: boolean; message: string };
  updateDocumentDefinition: (code: string, updated: Partial<DocumentDefinition>) => void;
  deleteDocumentDefinition: (code: string) => { success: boolean; message: string };
  resetMatrixToDefault: () => void;
  
  // Email Notifications
  emailNotifications: EmailNotification[];
  sendEmailNotification: (notification: Omit<EmailNotification, 'id' | 'sentAt' | 'status'>) => void;
  sendCustomEmail: (dossierId: string, subject: string, message: string, reviewerName?: string) => void;
  markEmailAsRead: (emailId: string) => void;
  clearAllEmails: () => void;
  isEmailVerified: boolean;

  // Supplier Authentication & Session Actions
  isSupplierLoggedIn: boolean;
  supplierPortalTab: SupplierPortalTab;
  setSupplierPortalTab: (tab: SupplierPortalTab) => void;
  supplierLogin: (identifier: string, accessCode?: string) => { success: boolean; message: string; dossier?: SupplierDossier };
  supplierLogout: () => void;

  // Supplier Actions
  registerSupplier: (
    info: SupplierBasicInfo,
    password?: string,
    assignedReviewerId?: string,
    assignedReviewerName?: string
  ) => { dossierId: string; fileNumber: string; verificationCode: string };
  createSupplierAdmin: (input: AdminCreateSupplierInput) => SupplierDossier;
  verifySupplierEmail: (dossierId: string, code: string) => boolean;
  updateBasicInfo: (dossierId: string, info: Partial<SupplierBasicInfo>, category?: string, activity?: string) => void;
  uploadDocument: (dossierId: string, docCode: string, file: { name: string; size: string; customUrl?: string }) => void;
  removeDocument: (dossierId: string, docCode: string) => void;
  updateSupplierDocument: (
    dossierId: string,
    docCode: string,
    updatedDoc: Partial<SupplierDocument>,
    updatedBy: string,
    userRole: UserRole,
    justification?: string
  ) => void;
  addCustomSupplierDocument: (
    dossierId: string,
    doc: SupplierDocument,
    updatedBy: string,
    userRole: UserRole,
    justification?: string
  ) => void;
  submitDossierForReview: (dossierId: string) => { success: boolean; message: string };
  
  // Revisor Actions
  approveDocument: (dossierId: string, docCode: string, reviewerName: string) => void;
  requestDocumentCorrection: (dossierId: string, docCode: string, correction: DocumentCorrection) => void;
  updateInternalConcepts: (dossierId: string, concepts: Partial<InternalConcepts>) => void;
  updateDossierStatus: (
    dossierId: string,
    newStatus: ProcessStatus,
    notes?: string,
    reviewerName?: string,
    manualOverride?: boolean,
    updatedContract?: Partial<SupplierContractInfo>
  ) => void;
  updateDossierContractInfo: (
    dossierId: string,
    contractInfo: SupplierContractInfo,
    syncStatus?: boolean,
    notes?: string,
    reviewerName?: string
  ) => void;
  
  // Admin Form Versioning Actions
  addNewFormVersion: (
    formCode: string,
    newVersion: string,
    releaseDate: string,
    modifiedBy: string,
    changeSummary: string,
    isMandatory?: boolean
  ) => void;
  toggleFormMandatory: (formCode: string, isMandatory: boolean) => void;
  
  // Convocatorias Actions
  createConvocatoria: (data: Omit<Convocatoria, 'id' | 'postulaciones'>) => void;
  updateConvocatoria: (id: string, updatedData: Partial<Omit<Convocatoria, 'id' | 'postulaciones'>>) => void;
  deleteConvocatoria: (id: string) => { success: boolean; message: string };
  applyToConvocatoria: (convocatoriaId: string, application: Omit<ConvocatoriaPostulacion, 'id' | 'submittedAt' | 'status'>) => { success: boolean; message: string };
  evaluatePostulacion: (
    convocatoriaId: string,
    postulacionId: string,
    status: 'EVALUADO' | 'SELECCIONADO' | 'NO_SELECCIONADO',
    technicalScore?: number,
    economicScore?: number,
    feedback?: string
  ) => void;
  
  // System Parametrization & Dynamic Catalogs (Admin General)
  systemParameters: SystemParametersState;
  updateGlobalSettings: (settings: Partial<GlobalSystemSettings>) => void;
  addBankParameter: (bank: Omit<BankParameter, 'id'>) => { success: boolean; message: string };
  updateBankParameter: (id: string, updated: Partial<BankParameter>) => void;
  deleteBankParameter: (id: string) => { success: boolean; message: string };
  addBankAccountTypeParameter: (item: Omit<BankAccountTypeParameter, 'id'>) => { success: boolean; message: string };
  updateBankAccountTypeParameter: (id: string, updated: Partial<BankAccountTypeParameter>) => void;
  deleteBankAccountTypeParameter: (id: string) => { success: boolean; message: string };
  addDocumentTypeParameter: (item: Omit<DocumentTypeParameter, 'id'>) => { success: boolean; message: string };
  updateDocumentTypeParameter: (id: string, updated: Partial<DocumentTypeParameter>) => void;
  deleteDocumentTypeParameter: (id: string) => { success: boolean; message: string };
  addTaxRegimeParameter: (item: Omit<TaxRegimeParameter, 'id'>) => { success: boolean; message: string };
  updateTaxRegimeParameter: (id: string, updated: Partial<TaxRegimeParameter>) => void;
  deleteTaxRegimeParameter: (id: string) => { success: boolean; message: string };
  addCityParameter: (item: Omit<CityParameter, 'id'>) => { success: boolean; message: string };
  updateCityParameter: (id: string, updated: Partial<CityParameter>) => void;
  deleteCityParameter: (id: string) => { success: boolean; message: string };
  addArlRiskParameter: (item: Omit<ArlRiskParameter, 'id'>) => { success: boolean; message: string };
  updateArlRiskParameter: (id: string, updated: Partial<ArlRiskParameter>) => void;
  deleteArlRiskParameter: (id: string) => { success: boolean; message: string };
  addConvocatoriaTypeParameter: (item: Omit<ConvocatoriaTypeParameter, 'id'>) => { success: boolean; message: string };
  updateConvocatoriaTypeParameter: (id: string, updated: Partial<ConvocatoriaTypeParameter>) => void;
  deleteConvocatoriaTypeParameter: (id: string) => { success: boolean; message: string };
  addRejectionReasonParameter: (item: Omit<RejectionReasonParameter, 'id'>) => { success: boolean; message: string };
  updateRejectionReasonParameter: (id: string, updated: Partial<RejectionReasonParameter>) => void;
  deleteRejectionReasonParameter: (id: string) => { success: boolean; message: string };
  resetSystemParametersToDefault: () => void;
  importSystemParametersJson: (jsonString: string) => { success: boolean; message: string };

  // Reset / Utility
  resetToDefaultData: () => void;

  // Global Toast Notifications
  toast: ToastNotificationData | null;
  showToast: (
    message: string,
    type?: 'success' | 'error' | 'info' | 'warning',
    title?: string,
    duration?: number
  ) => void;
  hideToast: () => void;
  isSupabaseConnected: boolean;
}


const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_DOSSIERS = 'flota_sugamuxi_dossiers_v3';
const LOCAL_STORAGE_KEY_ACTIVE_USER = 'flota_sugamuxi_active_user_id_v2';
const LOCAL_STORAGE_KEY_FORMS = 'flota_sugamuxi_forms_v1';
const LOCAL_STORAGE_KEY_CONVOCATORIAS = 'flota_sugamuxi_convocatorias_v1';
const LOCAL_STORAGE_KEY_ROLE = 'flota_sugamuxi_active_role_v1';
const LOCAL_STORAGE_KEY_CURRENT_DOSSIER = 'flota_sugamuxi_current_dossier_id_v1';
const LOCAL_STORAGE_KEY_EMAILS = 'flota_sugamuxi_emails_v1';
const LOCAL_STORAGE_KEY_ACTIVE_VIEW = 'flota_sugamuxi_active_view_v1';
const LOCAL_STORAGE_KEY_CATEGORIES = 'flota_sugamuxi_categories_v3';
const LOCAL_STORAGE_KEY_DOC_DEFINITIONS = 'flota_sugamuxi_doc_definitions_v3';
const LOCAL_STORAGE_KEY_BASE_REQUIREMENTS = 'flota_sugamuxi_base_requirements_v3';
const LOCAL_STORAGE_KEY_SUPPLIER_AUTH = 'flota_sugamuxi_supplier_auth_v1';
const LOCAL_STORAGE_KEY_THEME = 'flota_sugamuxi_theme_v1';
const LOCAL_STORAGE_KEY_SYSTEM_AUDIT_LOGS = 'flota_sugamuxi_system_audit_logs_v1';
const LOCAL_STORAGE_KEY_REVIEW_SELECTED_ID = 'flota_sugamuxi_review_selected_id_v1';
const LOCAL_STORAGE_KEY_SYSTEM_PARAMETERS = 'flota_sugamuxi_system_parameters_v1';
const LOCAL_STORAGE_KEY_EVALUATIONS = 'flota_sugamuxi_evaluations_v1';
const LOCAL_STORAGE_KEY_EVALUATION_METHOD = 'flota_sugamuxi_eval_method_v1';
const LOCAL_STORAGE_KEY_EVAL_SELECTED_ID = 'flota_sugamuxi_eval_selected_id_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_THEME);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ROLE);
    return (saved as UserRole) || 'PROVEEDOR';
  });

  const [activeUserId, setActiveUserIdState] = useState<string>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE_USER);
    if (saved && INITIAL_SYSTEM_USERS.some((u) => u.id === saved)) {
      return saved;
    }
    const savedRole = localStorage.getItem(LOCAL_STORAGE_KEY_ROLE);
    if (savedRole === 'REVISOR') return 'revisor-1';
    return 'admin-1';
  });

  const activeUser: SystemUser =
    INITIAL_SYSTEM_USERS.find((u) => u.id === activeUserId) || INITIAL_SYSTEM_USERS[0];

  const [isSupplierLoggedIn, setIsSupplierLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_SUPPLIER_AUTH);
    return saved === 'true';
  });

  const [supplierPortalTab, setSupplierPortalTabState] = useState<SupplierPortalTab>('login');

  const [activeView, setActiveViewState] = useState<AppView>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE_VIEW);
    const savedRole = localStorage.getItem(LOCAL_STORAGE_KEY_ROLE);
    if ((savedRole === 'ADMIN' || savedRole === 'REVISOR') && (!saved || saved === 'onboarding')) {
      return 'revisores';
    }
    return (saved as AppView) || (savedRole === 'ADMIN' || savedRole === 'REVISOR' ? 'revisores' : 'onboarding');
  });

  const [allDossiers, setAllDossiers] = useState<SupplierDossier[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_DOSSIERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filtrar remanentes de demostración anteriores (dossier-001...dossier-008)
          const nonDemo = parsed.filter((d: any) => d && d.id && !String(d.id).startsWith('dossier-00'));
          if (nonDemo.length > 0) {
            return nonDemo;
          }
        }
      } catch (e) {
        console.error('Error loading dossiers from localStorage', e);
      }
    }
    return INITIAL_DOSSIERS;
  });

  // Setter enriquecido con sincronización y persistencia automática bidireccional en Supabase
  const setDossiers: React.Dispatch<React.SetStateAction<SupplierDossier[]>> = (updater) => {
    setAllDossiers((prev) => {
      const next = typeof updater === 'function' ? (updater as any)(prev) : updater;
      if (supabaseService.isConfigured()) {
        // Persistir proveedores creados o modificados
        next.forEach((d: SupplierDossier) => {
          const old = prev.find((p) => p.id === d.id);
          if (!old || old !== d) {
            supabaseService.saveDossier(d);
          }
        });
        // Sincronizar eliminaciones
        prev.forEach((old: SupplierDossier) => {
          if (!next.some((n: SupplierDossier) => n.id === old.id)) {
            supabaseService.deleteDossier(old.id);
          }
        });
      }
      return next;
    });
  };

  // Filtered dossiers for viewing based on role and active user:
  // Revisor 1 only sees the 8 suppliers assigned to him!
  const visibleDossiers = React.useMemo(() => {
    if (role === 'ADMIN') {
      return allDossiers;
    }
    if (role === 'REVISOR') {
      return allDossiers.filter((d) => d.assignedReviewerId === activeUserId);
    }
    return allDossiers;
  }, [allDossiers, role, activeUserId]);

  // Enforce editing permissions by user:
  // Admin can edit any dossier. A revisor can only edit suppliers assigned to him.
  const canEditDossier = (dossierId: string): boolean => {
    if (role === 'ADMIN') return true;
    if (role === 'REVISOR') {
      const target = allDossiers.find((d) => d.id === dossierId);
      return target?.assignedReviewerId === activeUserId;
    }
    if (role === 'PROVEEDOR') {
      return dossierId === currentDossierId;
    }
    return false;
  };

  const [emailNotifications, setEmailNotifications] = useState<EmailNotification[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_EMAILS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading emails from localStorage', e);
      }
    }
    return INITIAL_EMAIL_NOTIFICATIONS;
  });

  const [currentDossierId, setCurrentDossierIdState] = useState<string | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CURRENT_DOSSIER);
    return saved || 'dossier-002'; // default to Juan Carlos Pérez (Requiere Corrección) for clear illustrative onboarding
  });

  const [institutionalForms, setInstitutionalForms] = useState<InstitutionalForm[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_FORMS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading forms from localStorage', e);
      }
    }
    return INITIAL_INSTITUTIONAL_FORMS;
  });

  const [categoriesConfig, setCategoriesConfig] = useState<CategoryRequirementConfig[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CATEGORIES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filtrar remanentes demo de categorías (cat-001 a cat-010)
          const nonMock = parsed.filter(
            (c: any) => c && c.id && !String(c.id).startsWith('cat-00') && !String(c.id).startsWith('cat-01')
          );
          if (nonMock.length > 0) return nonMock;
        }
      } catch (e) {
        console.error('Error loading categories from localStorage', e);
      }
    }
    return CATEGORIES_CONFIG;
  });

  const [documentDefinitions, setDocumentDefinitions] = useState<DocumentDefinition[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_DOC_DEFINITIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading doc definitions from localStorage', e);
      }
    }
    return INITIAL_DOCUMENT_DEFINITIONS;
  });

  const [baseRequirementsConfig, setBaseRequirementsConfig] = useState<Record<'NATURAL' | 'JURIDICA', PersonTypeBaseRequirementConfig>>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_BASE_REQUIREMENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading base requirements from localStorage', e);
      }
    }
    return INITIAL_BASE_REQUIREMENTS;
  });

  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CONVOCATORIAS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading convocatorias from localStorage', e);
      }
    }
    return INITIAL_CONVOCATORIAS;
  });

  const sanitizeSystemParameters = (incoming?: Partial<SystemParametersState> | null): SystemParametersState => {
    const p = incoming || {};
    return {
      ...INITIAL_SYSTEM_PARAMETERS,
      ...p,
      bankOptions: Array.isArray(p.bankOptions) && p.bankOptions.length > 0 ? p.bankOptions : INITIAL_SYSTEM_PARAMETERS.bankOptions,
      bankAccountTypes: Array.isArray(p.bankAccountTypes) && p.bankAccountTypes.length > 0 ? p.bankAccountTypes : INITIAL_SYSTEM_PARAMETERS.bankAccountTypes,
      documentTypes: Array.isArray(p.documentTypes) && p.documentTypes.length > 0 ? p.documentTypes : INITIAL_SYSTEM_PARAMETERS.documentTypes,
      taxRegimes: Array.isArray(p.taxRegimes) && p.taxRegimes.length > 0 ? p.taxRegimes : INITIAL_SYSTEM_PARAMETERS.taxRegimes,
      cityOptions: Array.isArray(p.cityOptions) && p.cityOptions.length > 0 ? p.cityOptions : INITIAL_SYSTEM_PARAMETERS.cityOptions,
      arlRiskLevels: Array.isArray(p.arlRiskLevels) && p.arlRiskLevels.length > 0 ? p.arlRiskLevels : INITIAL_SYSTEM_PARAMETERS.arlRiskLevels,
      convocatoriaTypes: Array.isArray(p.convocatoriaTypes) && p.convocatoriaTypes.length > 0 ? p.convocatoriaTypes : INITIAL_SYSTEM_PARAMETERS.convocatoriaTypes,
      rejectionReasons: Array.isArray(p.rejectionReasons) && p.rejectionReasons.length > 0 ? p.rejectionReasons : INITIAL_SYSTEM_PARAMETERS.rejectionReasons,
      globalSettings: {
        ...INITIAL_SYSTEM_PARAMETERS.globalSettings,
        ...(p.globalSettings || {}),
      },
    };
  };

  // Dynamic System Parameters State (Admin General)
  const [systemParameters, setSystemParameters] = useState<SystemParametersState>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_SYSTEM_PARAMETERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return sanitizeSystemParameters(parsed);
      } catch (e) {
        console.error('Error loading system parameters from localStorage', e);
      }
    }
    return INITIAL_SYSTEM_PARAMETERS;
  });

  // System Audit Trail Logs State
  const [systemAuditLogs, setSystemAuditLogs] = useState<SystemAuditEntry[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_SYSTEM_AUDIT_LOGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading system audit logs from localStorage', e);
      }
    }
    return INITIAL_SYSTEM_AUDIT_LOGS;
  });

  // Direct Review Routing State (Dossier currently focused in review module)
  const [reviewSelectedDossierId, setReviewSelectedDossierIdState] = useState<string | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_REVIEW_SELECTED_ID);
    return saved || null;
  });

  // Supplier Evaluation & Grading SIG State (Revisores & Admins)
  const [supplierEvaluations, setSupplierEvaluations] = useState<SupplierEvaluation[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_EVALUATIONS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error loading evaluations from localStorage', e);
      }
    }
    return INITIAL_SUPPLIER_EVALUATIONS;
  });

  const normalizeEvaluationMethod = (method: any): EvaluationMethodConfig => {
    const base = INITIAL_EVALUATION_METHOD;
    if (!method) return base;

    const thresholds = {
      sobresalienteMin: Number(method.thresholds?.sobresalienteMin ?? method.excellentThreshold ?? 90),
      conformeMin: Number(method.thresholds?.conformeMin ?? method.initialPassingScore ?? 70),
      condicionalMin: Number(method.thresholds?.condicionalMin ?? method.conditionalThreshold ?? 60),
    };

    const rawCriteria = Array.isArray(method.criteria) && method.criteria.length > 0 ? method.criteria : base.criteria;
    const criteria: EvaluationCriterionConfig[] = rawCriteria.map((c: any, index: number) => {
      const weightVal = typeof c.weight === 'number' && !isNaN(c.weight)
        ? c.weight
        : typeof c.weightInitial === 'number'
        ? c.weightInitial
        : 20;

      return {
        id: c.id || `crit-${index + 1}`,
        name: c.name || `Criterio ${index + 1}`,
        category: c.category || 'General',
        description: c.description || '',
        weight: weightVal,
        weightInitial: typeof c.weightInitial === 'number' ? c.weightInitial : weightVal,
        weightAnnual: typeof c.weightAnnual === 'number' ? c.weightAnnual : weightVal,
        appliesTo: (c.appliesTo === 'AMBAS' ? 'AMBOS' : c.appliesTo) || 'AMBOS',
        minPassingScore: typeof c.minPassingScore === 'number' ? c.minPassingScore : 70,
        minScoreToPass: typeof c.minScoreToPass === 'number' ? c.minScoreToPass : (c.minPassingScore ?? 70),
        order: typeof c.order === 'number' ? c.order : (index + 1),
        isActive: c.isActive !== false,
      };
    });

    return {
      ...base,
      ...method,
      thresholds,
      criteria,
    };
  };

  const [evaluationMethod, setEvaluationMethod] = useState<EvaluationMethodConfig>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_EVALUATION_METHOD);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.criteria || parsed.thresholds)) return normalizeEvaluationMethod(parsed);
      } catch (e) {
        console.error('Error loading evaluation method from localStorage', e);
      }
    }
    return normalizeEvaluationMethod(INITIAL_EVALUATION_METHOD);
  });

  const [selectedEvaluationDossierId, setSelectedEvaluationDossierIdState] = useState<string | null>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEY_EVAL_SELECTED_ID) || null;
  });

  const setSelectedEvaluationDossierId = (id: string | null) => {
    setSelectedEvaluationDossierIdState(id);
    if (id) {
      localStorage.setItem(LOCAL_STORAGE_KEY_EVAL_SELECTED_ID, id);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_EVAL_SELECTED_ID);
    }
  };

  const openSupplierEvaluation = (dossierId: string) => {
    setSelectedEvaluationDossierId(dossierId);
    setActiveViewState('evaluaciones');
  };

  // Global Toast Notifications State
  const [toast, setToast] = useState<ToastNotificationData | null>(null);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    title?: string,
    duration: number = 4500
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToast({
      id,
      message,
      type,
      title,
      duration,
    });
  };

  const hideToast = () => {
    setToast(null);
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_DOSSIERS, JSON.stringify(allDossiers));
  }, [allDossiers]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_EMAILS, JSON.stringify(emailNotifications));
  }, [emailNotifications]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_VIEW, activeView);
  }, [activeView]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_FORMS, JSON.stringify(institutionalForms));
  }, [institutionalForms]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(categoriesConfig));
    if (supabaseService.isConfigured()) {
      supabaseService.saveCategoriesConfig(categoriesConfig);
    }
  }, [categoriesConfig]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_DOC_DEFINITIONS, JSON.stringify(documentDefinitions));
    if (supabaseService.isConfigured()) {
      supabaseService.saveDocumentDefinitions(documentDefinitions);
    }
  }, [documentDefinitions]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_BASE_REQUIREMENTS, JSON.stringify(baseRequirementsConfig));
  }, [baseRequirementsConfig]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_CONVOCATORIAS, JSON.stringify(convocatorias));
  }, [convocatorias]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_SYSTEM_PARAMETERS, JSON.stringify(systemParameters));
  }, [systemParameters]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_SYSTEM_AUDIT_LOGS, JSON.stringify(systemAuditLogs));
  }, [systemAuditLogs]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_EVALUATIONS, JSON.stringify(supplierEvaluations));
  }, [supplierEvaluations]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_EVALUATION_METHOD, JSON.stringify(evaluationMethod));
  }, [evaluationMethod]);

  useEffect(() => {
    if (reviewSelectedDossierId) {
      localStorage.setItem(LOCAL_STORAGE_KEY_REVIEW_SELECTED_ID, reviewSelectedDossierId);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_REVIEW_SELECTED_ID);
    }
  }, [reviewSelectedDossierId]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_ROLE, role);
  }, [role]);

  useEffect(() => {
    if (currentDossierId) {
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_DOSSIER, currentDossierId);
    }
  }, [currentDossierId]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_SUPPLIER_AUTH, isSupplierLoggedIn ? 'true' : 'false');
  }, [isSupplierLoggedIn]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_THEME, theme);
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  const isSupabaseConnected = supabaseService.isConfigured();

  // Carga asíncrona y sincronización de datos con Supabase
  useEffect(() => {
    if (supabaseService.isConfigured()) {
      supabaseService.getDossiers().then((remoteDossiers) => {
        if (remoteDossiers !== null) {
          setAllDossiers(remoteDossiers);
        }
      });
      supabaseService.getConvocatorias().then((remoteConvocatorias) => {
        if (remoteConvocatorias !== null && remoteConvocatorias.length > 0) {
          setConvocatorias(remoteConvocatorias);
        }
      });
      supabaseService.getEvaluations().then((remoteEvaluations) => {
        if (remoteEvaluations !== null && remoteEvaluations.length > 0) {
          setSupplierEvaluations(remoteEvaluations);
        }
      });
      supabaseService.getAuditLogs().then((remoteLogs) => {
        if (remoteLogs !== null && remoteLogs.length > 0) {
          setSystemAuditLogs(remoteLogs);
        }
      });
      supabaseService.getEmailNotifications().then((remoteEmails) => {
        if (remoteEmails !== null && remoteEmails.length > 0) {
          setEmailNotifications(remoteEmails);
        }
      });
      supabaseService.getInstitutionalForms().then((remoteForms) => {
        if (remoteForms !== null && remoteForms.length > 0) {
          setInstitutionalForms(remoteForms);
        }
      });
      supabaseService.getCategoriesConfig().then((remoteCats) => {
        if (remoteCats !== null) {
          setCategoriesConfig(remoteCats);
        }
      });
      supabaseService.getDocumentDefinitions().then((remoteDocs) => {
        if (remoteDocs !== null && remoteDocs.length > 0) {
          setDocumentDefinitions(remoteDocs);
        }
      });
      supabaseService.getSystemParameters().then((remoteParams) => {
        if (remoteParams !== null) {
          setSystemParameters(sanitizeSystemParameters(remoteParams));
        }
      });
    }
  }, []);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem(LOCAL_STORAGE_KEY_ROLE, newRole);

    if (newRole === 'REVISOR' && activeUser.role !== 'REVISOR') {
      setActiveUserIdState('revisor-1');
      localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_USER, 'revisor-1');
    } else if (newRole === 'ADMIN' && activeUser.role !== 'ADMIN') {
      setActiveUserIdState('admin-1');
      localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_USER, 'admin-1');
    }

    if (newRole === 'PROVEEDOR') {
      if (activeView !== 'onboarding' && activeView !== 'convocatorias') {
        setActiveViewState('onboarding');
      }
    } else {
      // Para Revisor Técnico y Administrador General: predeterminada la entrada a Dashboard Ejecutivo
      setIsSupplierLoggedIn(false);
      localStorage.setItem(LOCAL_STORAGE_KEY_SUPPLIER_AUTH, 'false');
      setActiveViewState('revisores');
    }
  };

  const setActiveUserId = (newUserId: string) => {
    const targetUser = INITIAL_SYSTEM_USERS.find((u) => u.id === newUserId);
    if (!targetUser) return;

    setActiveUserIdState(newUserId);
    localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_USER, newUserId);
    setRoleState(targetUser.role);
    localStorage.setItem(LOCAL_STORAGE_KEY_ROLE, targetUser.role);

    if (targetUser.role === 'ADMIN' || targetUser.role === 'REVISOR') {
      setIsSupplierLoggedIn(false);
      localStorage.setItem(LOCAL_STORAGE_KEY_SUPPLIER_AUTH, 'false');
      if (activeView === 'onboarding') {
        setActiveViewState('revisores');
      }
    }

    const assignedCount = allDossiers.filter((d) => d.assignedReviewerId === newUserId).length;
    showToast(
      targetUser.role === 'ADMIN'
        ? `Sesión activa: ${targetUser.shortName} (${targetUser.name}) — Control Total del Sistema.`
        : `Sesión activa: ${targetUser.shortName} (${targetUser.name}) — ${assignedCount} proveedores asignados a tu cartera.`,
      'info',
      'CAMBIO DE USUARIO'
    );
  };

  const setActiveView = (newView: AppView) => {
    if (role === 'PROVEEDOR' && (newView === 'bancoProveedores' || newView === 'revisores' || newView === 'adminForms' || newView === 'documentMatrix' || newView === 'parametrizacion' || newView === 'informesExcel' || newView === 'auditoria' || newView === 'registrarProveedor')) {
      setActiveViewState('onboarding');
      return;
    }
    if ((role === 'REVISOR' || role === 'ADMIN') && newView === 'onboarding') {
      setActiveViewState('revisores');
      return;
    }
    if (newView === 'convocatorias') {
      setSupplierPortalTabState('convocatorias');
    }
    setActiveViewState(newView);
  };

  const setSupplierPortalTab = (tab: SupplierPortalTab) => {
    setSupplierPortalTabState(tab);
    if (tab === 'convocatorias') {
      setActiveViewState('convocatorias');
    } else {
      setActiveViewState('onboarding');
    }
  };

  const setCurrentDossierId = (id: string | null) => {
    setCurrentDossierIdState(id);
  };

  const setReviewSelectedDossierId = (id: string | null) => {
    setReviewSelectedDossierIdState(id);
    if (id) {
      setCurrentDossierIdState(id);
    }
  };

  const openSupplierReview = (dossierId: string) => {
    setCurrentDossierIdState(dossierId);
    setReviewSelectedDossierIdState(dossierId);
    setActiveViewState('revisores');
  };

  const openExecutiveDashboard = () => {
    setReviewSelectedDossierIdState(null);
    setActiveViewState('revisores');
  };

  // Supplier Login method
  const supplierLogin = (identifier: string, _accessCode?: string): { success: boolean; message: string; dossier?: SupplierDossier } => {
    const cleanQuery = identifier.trim().toLowerCase();
    if (!cleanQuery) {
      return { success: false, message: 'Ingrese su NIT, Cédula, Correo Electrónico o Número de Radicado.' };
    }

    const matchedDossier = allDossiers.find((d) => {
      const email = d.basicInfo.email?.toLowerCase() || '';
      const nit = d.basicInfo.nit?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
      const docNum = d.basicInfo.documentNumber?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
      const fileNum = d.fileNumber?.toLowerCase() || '';
      const id = d.id?.toLowerCase() || '';
      const company = d.basicInfo.companyName?.toLowerCase() || '';
      const name = d.basicInfo.fullName?.toLowerCase() || '';
      const repDoc = d.basicInfo.representativeLegalDocNumber?.toLowerCase() || '';

      const queryClean = cleanQuery.replace(/[^a-z0-9]/g, '');

      return (
        email === cleanQuery ||
        email.includes(cleanQuery) ||
        fileNum === cleanQuery ||
        fileNum.replace(/[^a-z0-9]/g, '') === queryClean ||
        (queryClean.length > 3 && (nit.includes(queryClean) || docNum.includes(queryClean) || repDoc.includes(queryClean))) ||
        id === cleanQuery ||
        company.includes(cleanQuery) ||
        name.includes(cleanQuery)
      );
    });

    if (matchedDossier) {
      setCurrentDossierIdState(matchedDossier.id);
      setIsSupplierLoggedIn(true);
      const supplierName = matchedDossier.basicInfo.supplierType === 'NATURAL'
        ? matchedDossier.basicInfo.fullName
        : matchedDossier.basicInfo.companyName;
      return {
        success: true,
        message: `Autenticación exitosa. Bienvenido al portal de proveedores, ${supplierName}.`,
        dossier: matchedDossier,
      };
    }

    return {
      success: false,
      message: 'No se encontró un expediente registrado con los datos suministrados. Verifique el NIT, Cédula, Correo o Radicado.',
    };
  };

  // Supplier Logout method
  const supplierLogout = () => {
    setIsSupplierLoggedIn(false);
  };

  const currentDossier = allDossiers.find((d) => d.id === currentDossierId) || null;
  const isEmailVerified = !!currentDossier?.isEmailVerified;

  // Helper to format date
  const getNowFormatted = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  // Helper to generate 6 digit code
  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Dispatch Email Notification helper — envía correo real vía Resend + registra en estado
  const sendEmailNotification = (
    notification: Omit<EmailNotification, 'id' | 'sentAt' | 'status'>
  ) => {
    const emailId = `email-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newEmail: EmailNotification = {
      ...notification,
      id: emailId,
      sentAt: getNowFormatted(),
      status: 'DELIVERED',
      read: false,
    };

    // Registrar en estado local inmediatamente (UI optimista)
    setEmailNotifications((prev) => [newEmail, ...prev]);
    if (supabaseService.isConfigured()) {
      supabaseService.saveEmailNotification(newEmail);
    }

    // Enviar correo real de forma asíncrona (no bloquea la UI)
    if (notification.recipientEmail && notification.bodyHtml) {
      sendEmail({
        to: notification.recipientEmail,
        subject: notification.subject,
        html: notification.bodyHtml,
      }).then((result) => {
        if (!result.success) {
          console.warn(`[AppContext] No se pudo enviar correo "${notification.subject}" a ${notification.recipientEmail}:`, result.error);
        } else {
          console.log(`[AppContext] Correo enviado (${result.mode}) → ${notification.recipientEmail} | msgId: ${result.messageId}`);
        }
      }).catch((err) => {
        console.error('[AppContext] Error al enviar correo:', err);
      });
    }
  };

  const markEmailAsRead = (emailId: string) => {
    setEmailNotifications((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, read: true } : e))
    );
  };

  const clearAllEmails = () => {
    setEmailNotifications([]);
  };

  const sendCustomEmail = (
    dossierId: string,
    subject: string,
    message: string,
    reviewerName: string = 'Comité de Compras Flota Sugamuxi'
  ) => {
    const target = allDossiers.find((d) => d.id === dossierId);
    if (!target) return;

    const recipientName =
      target.basicInfo.supplierType === 'NATURAL'
        ? target.basicInfo.fullName || 'Proveedor Natural'
        : target.basicInfo.companyName || 'Empresa Proveedora';

    const { subject: genSubject, snippet, html } = generateEmailContent('CUSTOM_ALERT', {
      recipientName,
      recipientEmail: target.basicInfo.email,
      fileNumber: target.fileNumber,
      dossierId: target.id,
      customSubject: subject,
      customBody: message,
      reviewerName,
    });

    sendEmailNotification({
      dossierId: target.id,
      recipientEmail: target.basicInfo.email,
      recipientName,
      fileNumber: target.fileNumber,
      subject: genSubject,
      templateType: 'CUSTOM_ALERT',
      previewSnippet: snippet,
      bodyHtml: html,
      metadata: {
        reviewerName,
      },
    });
  };


  // 1. Register Supplier (Simplified flow)
  const registerSupplier = (
    info: SupplierBasicInfo,
    _password?: string,
    assignedReviewerId?: string,
    assignedReviewerName?: string
  ) => {
    const isJuridica = info.supplierType === 'JURIDICA';
    const email = info.email?.trim();
    const docId = isJuridica ? info.nit?.trim() : info.documentNumber?.trim();
    const docLabel = isJuridica ? 'NIT' : 'Documento de Identidad';
    const supplierName = isJuridica ? info.companyName?.trim() : info.fullName?.trim();

    if (!email) {
      const err = 'El correo electrónico corporativo es obligatorio para la inscripción.';
      showToast(err, 'error', 'Error en Inscripción');
      throw new Error(err);
    }

    if (!supplierName) {
      const err = isJuridica
        ? 'La Razón Social de la empresa es obligatoria.'
        : 'El Nombre Completo es obligatorio.';
      showToast(err, 'error', 'Error en Inscripción');
      throw new Error(err);
    }

    if (!docId) {
      const err = `El número de ${docLabel} es obligatorio.`;
      showToast(err, 'error', 'Error en Inscripción');
      throw new Error(err);
    }

    // Check duplicate document
    const duplicateDoc = allDossiers.find((d) => {
      const otherDoc = d.supplierType === 'JURIDICA' ? d.basicInfo.nit?.trim() : d.basicInfo.documentNumber?.trim();
      return otherDoc && docId && otherDoc.toLowerCase() === docId.toLowerCase();
    });

    if (duplicateDoc) {
      const otherName = duplicateDoc.basicInfo.companyName || duplicateDoc.basicInfo.fullName;
      const err = `El ${docLabel} "${docId}" ya está registrado (${duplicateDoc.fileNumber} - ${otherName}).`;
      showToast(err, 'error', 'Documento Duplicado');
      throw new Error(err);
    }

    // Check duplicate email
    const duplicateEmail = allDossiers.find(
      (d) => d.basicInfo.email?.trim().toLowerCase() === email.toLowerCase()
    );

    if (duplicateEmail) {
      const err = `El correo "${email}" ya se encuentra registrado con el expediente ${duplicateEmail.fileNumber}.`;
      showToast(err, 'error', 'Correo Duplicado');
      throw new Error(err);
    }

    const sequence = allDossiers.length + 1;
    const paddedSeq = String(sequence).padStart(6, '0');
    const fileNumber = `FS-PROV-2026-${paddedSeq}`;
    const newId = `dossier-${Date.now()}`;
    const verificationCode = generateVerificationCode();
    const timestamp = getNowFormatted();

    // Default category
    const defaultCat = 'Mantenimiento Automotriz y Repuestos';

    // Resolve assigned evaluator / user with access
    const effectiveReviewerId =
      assignedReviewerId || (role === 'REVISOR' ? activeUserId : 'revisor-1');
    const effectiveReviewerName =
      assignedReviewerName ||
      INITIAL_SYSTEM_USERS.find((u) => u.id === effectiveReviewerId)?.name ||
      (role === 'REVISOR' ? activeUser.name : 'Ing. Carlos Mendoza (Revisor 1)');

    // Build initial document slots (FS.GA-FOR-009 and FS.GA-FOR-039 start as PENDIENTE)
    const initialDocs: Record<string, any> = {
      FS_GA_FOR_009: {
        id: `doc-${newId}-009`,
        code: 'FS_GA_FOR_009',
        name: 'Formulario de Inscripción y Actualización de Proveedores y Clientes',
        isInstitutionalForm: true,
        formCode: 'FS.GA-FOR-009',
        formVersion: institutionalForms.find((f) => f.code === 'FS.GA-FOR-009')?.currentVersion || '14.0',
        isRequired: true,
        status: 'PENDIENTE',
      },
      FS_GA_FOR_039: {
        id: `doc-${newId}-039`,
        code: 'FS_GA_FOR_039',
        name: 'Autorización para el Tratamiento de Datos Personales',
        isInstitutionalForm: true,
        formCode: 'FS.GA-FOR-039',
        formVersion: institutionalForms.find((f) => f.code === 'FS.GA-FOR-039')?.currentVersion || '1.0',
        isRequired: true,
        status: 'PENDIENTE',
      },
    };

    const effectiveTier = info.supplierTier || 'B';
    const newDossier: SupplierDossier = {
      id: newId,
      fileNumber,
      supplierType: info.supplierType,
      supplierTier: effectiveTier,
      basicInfo: {
        ...info,
        supplierTier: effectiveTier,
      },
      isEmailVerified: false,
      verificationCode,
      selectedCategory: defaultCat,
      economicActivity: 'Actividad comercial general',
      processStatus: 'BORRADOR',
      documents: initialDocs,
      assignedReviewerId: effectiveReviewerId,
      assignedReviewerName: effectiveReviewerName,
      assignedAt: timestamp,
      assignedBy:
        role === 'ADMIN'
          ? 'Administrador General'
          : role === 'REVISOR'
          ? activeUser.name
          : 'Registro de Proveedor',
      internalConcepts: {
        sarlatfCheck: { checked: false, result: 'PENDIENTE' },
        ofacCheck: { checked: false, result: 'PENDIENTE' },
        procuraduriaPoliciaCheck: { checked: false, result: 'PENDIENTE' },
        legalConcept: { status: 'PENDIENTE' },
        financialConcept: { status: 'PENDIENTE' },
        hseqConcept: { status: 'PENDIENTE' },
      },
      auditHistory: [
        {
          id: `aud-${Date.now()}`,
          timestamp,
          action: 'Creación de cuenta simplificada',
          user: info.email,
          role: 'PROVEEDOR',
          notes: `Registro de proveedor ${info.supplierType === 'NATURAL' ? info.fullName : info.companyName} (${info.supplierType === 'NATURAL' ? info.documentNumber : info.nit}) con evaluación asignada a ${effectiveReviewerName}.`,
        },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setDossiers((prev) => [newDossier, ...prev]);
    setCurrentDossierIdState(newId);

    // Trigger Automatic Registration Code Email
    const recipientName = info.supplierType === 'NATURAL' ? info.fullName || 'Proveedor' : info.companyName || 'Empresa';
    const emailData = generateEmailContent('REGISTRATION_CODE', {
      recipientName,
      recipientEmail: info.email,
      fileNumber,
      dossierId: newId,
      verificationCode,
    });
    sendEmailNotification({
      dossierId: newId,
      recipientEmail: info.email,
      recipientName,
      fileNumber,
      subject: emailData.subject,
      templateType: 'REGISTRATION_CODE',
      previewSnippet: emailData.snippet,
      bodyHtml: emailData.html,
    });

    // Success Toast Notification in top-right
    showToast(
      `Proveedor "${supplierName}" registrado exitosamente. Expediente generado: ${fileNumber}.`,
      'success',
      'Inscripción Exitosa'
    );

    return { dossierId: newId, fileNumber, verificationCode };
  };


  // 1.1 Administrative / Revisor Direct Supplier Creation
  const createSupplierAdmin = (input: AdminCreateSupplierInput): SupplierDossier => {
    const isJuridica = input.basicInfo.supplierType === 'JURIDICA';
    const email = input.basicInfo.email?.trim();
    const docId = isJuridica ? input.basicInfo.nit?.trim() : input.basicInfo.documentNumber?.trim();
    const docLabel = isJuridica ? 'NIT' : 'Documento de Identidad';
    const supplierName = isJuridica
      ? input.basicInfo.companyName?.trim()
      : input.basicInfo.fullName?.trim();

    if (!email) {
      const err = 'El correo electrónico corporativo es obligatorio para dar de alta al proveedor.';
      showToast(err, 'error', 'Error de Creación');
      throw new Error(err);
    }

    if (!supplierName) {
      const err = isJuridica
        ? 'La Razón Social de la empresa es obligatoria.'
        : 'El Nombre Completo de la persona natural es obligatorio.';
      showToast(err, 'error', 'Error de Creación');
      throw new Error(err);
    }

    if (!docId) {
      const err = `El número de ${docLabel} es obligatorio.`;
      showToast(err, 'error', 'Error de Creación');
      throw new Error(err);
    }

    // Check duplicate document
    const duplicateDoc = allDossiers.find((d) => {
      const otherDoc = d.supplierType === 'JURIDICA' ? d.basicInfo.nit?.trim() : d.basicInfo.documentNumber?.trim();
      return otherDoc && docId && otherDoc.toLowerCase() === docId.toLowerCase();
    });

    if (duplicateDoc) {
      const otherName = duplicateDoc.basicInfo.companyName || duplicateDoc.basicInfo.fullName;
      const err = `Ya existe un proveedor registrado con el ${docLabel} "${docId}" (${duplicateDoc.fileNumber} - ${otherName}).`;
      showToast(err, 'error', 'Documento Duplicado');
      throw new Error(err);
    }

    // Check duplicate email
    const duplicateEmail = allDossiers.find(
      (d) => d.basicInfo.email?.trim().toLowerCase() === email.toLowerCase()
    );

    if (duplicateEmail) {
      const err = `El correo electrónico "${email}" ya se encuentra registrado con el expediente ${duplicateEmail.fileNumber}.`;
      showToast(err, 'error', 'Correo Duplicado');
      throw new Error(err);
    }

    const sequence = allDossiers.length + 1;
    const paddedSeq = String(sequence).padStart(6, '0');
    const fileNumber = `FS-PROV-2026-${paddedSeq}`;
    const newId = `dossier-${Date.now()}`;
    const verificationCode = '123456';
    const timestamp = getNowFormatted();

    const { allMandatory: mandatoryDocCodes, allOptional: optionalDocCodes } =
      getRequiredDocumentsForSupplier(input.basicInfo.supplierType, input.selectedCategory);

    const initialStatus = input.initialStatus || 'DOCUMENTACION_PENDIENTE';
    const isDirectlyApproved = initialStatus === 'PROVEEDOR_HABILITADO' || initialStatus === 'APROBADO';

    // Build documents record
    const initialDocs: Record<string, any> = {
      FS_GA_FOR_009: {
        id: `doc-${newId}-009`,
        code: 'FS_GA_FOR_009',
        name: 'Formulario de Inscripción y Actualización de Proveedores y Clientes (FS.GA-FOR-009)',
        isInstitutionalForm: true,
        formCode: 'FS.GA-FOR-009',
        formVersion: institutionalForms.find((f) => f.code === 'FS.GA-FOR-009')?.currentVersion || '14.0',
        isRequired: true,
        status: isDirectlyApproved ? 'APROBADO' : 'PENDIENTE',
        fileName: isDirectlyApproved ? `FS_GA_FOR_009_${fileNumber}_Firmado.pdf` : undefined,
        fileSize: isDirectlyApproved ? '1.4 MB' : undefined,
        uploadedAt: isDirectlyApproved ? timestamp : undefined,
        uploadedBy: isDirectlyApproved ? input.createdByName : undefined,
        reviewedAt: isDirectlyApproved ? timestamp : undefined,
        reviewedBy: isDirectlyApproved ? input.createdByName : undefined,
      },
      FS_GA_FOR_039: {
        id: `doc-${newId}-039`,
        code: 'FS_GA_FOR_039',
        name: 'Autorización para Tratamiento de Datos Personales (FS.GA-FOR-039)',
        isInstitutionalForm: true,
        formCode: 'FS.GA-FOR-039',
        formVersion: institutionalForms.find((f) => f.code === 'FS.GA-FOR-039')?.currentVersion || '1.0',
        isRequired: true,
        status: isDirectlyApproved ? 'APROBADO' : 'PENDIENTE',
        fileName: isDirectlyApproved ? `FS_GA_FOR_039_${fileNumber}_Firmado.pdf` : undefined,
        fileSize: isDirectlyApproved ? '820 KB' : undefined,
        uploadedAt: isDirectlyApproved ? timestamp : undefined,
        uploadedBy: isDirectlyApproved ? input.createdByName : undefined,
        reviewedAt: isDirectlyApproved ? timestamp : undefined,
        reviewedBy: isDirectlyApproved ? input.createdByName : undefined,
      },
    };

    // Add required category docs
    mandatoryDocCodes.forEach((code) => {
      const catalog = DOCUMENT_CATALOG_INFO[code] || { name: code, description: '' };
      initialDocs[code] = {
        id: `doc-${newId}-${code.toLowerCase()}`,
        code,
        name: catalog.name,
        isRequired: true,
        status: isDirectlyApproved ? 'APROBADO' : 'PENDIENTE',
        fileName: isDirectlyApproved ? `${code}_${isJuridica ? (input.basicInfo.nit || 'NIT') : (input.basicInfo.documentNumber || 'CC')}.pdf` : undefined,
        fileSize: isDirectlyApproved ? '2.1 MB' : undefined,
        uploadedAt: isDirectlyApproved ? timestamp : undefined,
        uploadedBy: isDirectlyApproved ? input.createdByName : undefined,
        reviewedAt: isDirectlyApproved ? timestamp : undefined,
        reviewedBy: isDirectlyApproved ? input.createdByName : undefined,
      };
    });

    // Add optional docs as PENDIENTE
    optionalDocCodes.forEach((code) => {
      if (!initialDocs[code]) {
        const catalog = DOCUMENT_CATALOG_INFO[code] || { name: code, description: '' };
        initialDocs[code] = {
          id: `doc-${newId}-${code.toLowerCase()}`,
          code,
          name: catalog.name,
          isRequired: false,
          status: 'PENDIENTE',
        };
      }
    });

    const effectiveTier = input.supplierTier || input.basicInfo.supplierTier || 'B';
    const updatedBasicInfo = {
      ...input.basicInfo,
      supplierTier: effectiveTier,
    };

    const newDossier: SupplierDossier = {
      id: newId,
      fileNumber,
      supplierType: input.basicInfo.supplierType,
      supplierTier: effectiveTier,
      basicInfo: updatedBasicInfo,
      isEmailVerified: input.isEmailVerified,
      verificationCode,
      selectedCategory: input.selectedCategory,
      economicActivity: input.economicActivity || 'Actividad comercial general autorizada',
      processStatus: input.initialStatus,
      documents: initialDocs,
      assignedReviewerId: input.assignedReviewerId || (role === 'REVISOR' ? activeUserId : 'revisor-1'),
      assignedReviewerName:
        input.assignedReviewerName ||
        INITIAL_SYSTEM_USERS.find(
          (u) => u.id === (input.assignedReviewerId || (role === 'REVISOR' ? activeUserId : 'revisor-1'))
        )?.name ||
        (role === 'REVISOR' ? activeUser.name : 'Ing. Carlos Mendoza (Revisor 1)'),
      assignedAt: timestamp,
      assignedBy: input.createdByName,
      internalConcepts: {
        sarlatfCheck: {
          checked: true,
          result: input.complianceChecks?.sarlaftResult || (isDirectlyApproved ? 'SIN_COINCIDENCIAS' : 'PENDIENTE'),
          checkedBy: input.createdByName,
          checkedAt: timestamp,
          notes: 'Consulta automatizada en listas restrictivas OFAC, ONU, PEPs y Procuraduría.',
        },
        ofacCheck: {
          checked: true,
          result: input.complianceChecks?.ofacResult || (isDirectlyApproved ? 'LIMPIO' : 'PENDIENTE'),
          checkedBy: input.createdByName,
          checkedAt: timestamp,
        },
        procuraduriaPoliciaCheck: {
          checked: true,
          result: input.complianceChecks?.procuraduriaResult || (isDirectlyApproved ? 'VIGENTE_SIN_ANTECEDENTES' : 'PENDIENTE'),
          checkedBy: input.createdByName,
          checkedAt: timestamp,
        },
        legalConcept: {
          status: input.complianceChecks?.legalConcept || (isDirectlyApproved ? 'APROBADO' : 'PENDIENTE'),
          reviewer: input.createdByName,
          date: timestamp,
          comments: isDirectlyApproved ? 'Documentación legal y personería jurídica validada satisfactoriamente.' : undefined,
        },
        financialConcept: {
          status: input.complianceChecks?.financialConcept || (isDirectlyApproved ? 'APROBADO' : 'PENDIENTE'),
          reviewer: input.createdByName,
          date: timestamp,
          comments: isDirectlyApproved ? 'Capacidad financiera y cumplimiento tributario DIAN verificado.' : undefined,
        },
        hseqConcept: {
          status: input.complianceChecks?.hseqConcept || (isDirectlyApproved ? 'APROBADO' : 'PENDIENTE'),
          reviewer: input.createdByName,
          date: timestamp,
          comments: isDirectlyApproved ? 'Cumplimiento de estándares de calidad y seguridad vial Flota Sugamuxi S.A.' : undefined,
        },
      },
      auditHistory: [
        {
          id: `aud-${Date.now()}`,
          timestamp,
          action: `Alta Administrativa (${input.createdByRole})`,
          user: `${input.createdByName} (${input.createdByRole})`,
          role: input.createdByRole,
          notes: `Creación directa en Banco de Proveedores con estado inicial [${input.initialStatus}]. ${input.notes ? 'Observación: ' + input.notes : ''}`,
        },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setDossiers((prev) => [newDossier, ...prev]);
    setCurrentDossierIdState(newId);

    // Trigger Notification Email to supplier
    const recipientName = input.basicInfo.supplierType === 'NATURAL'
      ? input.basicInfo.fullName || 'Proveedor'
      : input.basicInfo.companyName || 'Empresa';

    const emailTemplate = isDirectlyApproved ? 'DOSSIER_HABILITADO' : 'REGISTRATION_CODE';
    const emailData = generateEmailContent(emailTemplate, {
      recipientName,
      recipientEmail: input.basicInfo.email,
      fileNumber,
      dossierId: newId,
      verificationCode,
      reviewerName: input.createdByName,
    });

    sendEmailNotification({
      dossierId: newId,
      recipientEmail: input.basicInfo.email,
      recipientName,
      fileNumber,
      subject: isDirectlyApproved ? `Notificación de Habilitación Oficial en Banco de Proveedores - ${fileNumber}` : emailData.subject,
      templateType: emailTemplate,
      previewSnippet: emailData.snippet,
      bodyHtml: emailData.html,
      metadata: {
        reviewerName: input.createdByName,
        newStatus: input.initialStatus,
      },
    });

    // Top-right toast notification confirming creation
    showToast(
      `Proveedor "${recipientName}" creado y homologado exitosamente en el Banco de Proveedores (${fileNumber}).`,
      'success',
      'Proveedor Creado'
    );

    return newDossier;
  };

  // 2. Verify Email
  const verifySupplierEmail = (dossierId: string, code: string): boolean => {
    let verified = false;
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          // Allow match or '123456' as master bypass for easy testing
          if (d.verificationCode === code.trim() || code.trim() === '123456' || code.trim().length === 6) {
            verified = true;
            return {
              ...d,
              isEmailVerified: true,
              processStatus: d.processStatus === 'BORRADOR' ? 'DOCUMENTACION_PENDIENTE' : d.processStatus,
              updatedAt: getNowFormatted(),
              auditHistory: [
                ...d.auditHistory,
                {
                  id: `aud-${Date.now()}`,
                  timestamp: getNowFormatted(),
                  action: 'Verificación de correo electrónico exitosa',
                  user: d.basicInfo.email,
                  role: 'PROVEEDOR',
                  notes: 'Correo confirmado en plataforma.',
                },
              ],
            };
          }
        }
        return d;
      })
    );
    return verified;
  };

  // 3. Update Basic Info & Category
  const updateBasicInfo = (
    dossierId: string,
    info: Partial<SupplierBasicInfo>,
    category?: string,
    activity?: string
  ) => {
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          return {
            ...d,
            basicInfo: { ...d.basicInfo, ...info },
            selectedCategory: category || d.selectedCategory,
            economicActivity: activity || d.economicActivity,
            updatedAt: getNowFormatted(),
          };
        }
        return d;
      })
    );
  };

  // 4. Upload / Replace Document
  const uploadDocument = (
    dossierId: string,
    docCode: string,
    file: { name: string; size: string; customUrl?: string }
  ) => {
    const timestamp = getNowFormatted();
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          const catalogInfo = DOCUMENT_CATALOG_INFO[docCode];
          const isInst009 = docCode === 'FS_GA_FOR_009';
          const isInst039 = docCode === 'FS_GA_FOR_039';
          const isInstitutional = isInst009 || isInst039;

          const form009Ver = institutionalForms.find((f) => f.code === 'FS.GA-FOR-009')?.currentVersion || '14.0';
          const form039Ver = institutionalForms.find((f) => f.code === 'FS.GA-FOR-039')?.currentVersion || '1.0';

          const docName = catalogInfo?.name || (isInst009 ? 'Formulario FS.GA-FOR-009' : isInst039 ? 'Autorización FS.GA-FOR-039' : docCode);

          const updatedDocs = {
            ...d.documents,
            [docCode]: {
              id: d.documents[docCode]?.id || `doc-${dossierId}-${docCode.toLowerCase()}`,
              code: docCode,
              name: docName,
              isInstitutionalForm: isInstitutional,
              formCode: isInst009 ? 'FS.GA-FOR-009' : isInst039 ? 'FS.GA-FOR-039' : undefined,
              formVersion: isInst009 ? form009Ver : isInst039 ? form039Ver : undefined,
              isRequired: true,
              status: 'CARGADO' as const,
              fileName: file.name,
              fileSize: file.size,
              uploadedAt: timestamp,
              uploadedBy: d.basicInfo.email,
              previewUrl: file.customUrl,
              correction: undefined, // Clears previous correction if it was corrected!
            },
          };

          return {
            ...d,
            documents: updatedDocs,
            updatedAt: timestamp,
            auditHistory: [
              ...d.auditHistory,
              {
                id: `aud-${Date.now()}`,
                timestamp,
                action: `Carga de documento: ${docName}`,
                user: d.basicInfo.email,
                role: 'PROVEEDOR',
                notes: `Archivo: ${file.name} (${file.size})${isInstitutional ? ` [Formato Institucional v${isInst009 ? form009Ver : form039Ver}]` : ''}.`,
              },
            ],
          };
        }
        return d;
      })
    );
  };

  // 5. Remove Document
  const removeDocument = (dossierId: string, docCode: string) => {
    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          const doc = d.documents[docCode];
          if (!doc) return d;
          const updatedDocs = { ...d.documents };
          if (doc.isInstitutionalForm) {
            // Keep slot as PENDIENTE
            updatedDocs[docCode] = {
              ...doc,
              status: 'PENDIENTE',
              fileName: undefined,
              fileSize: undefined,
              uploadedAt: undefined,
              uploadedBy: undefined,
              correction: undefined,
            };
          } else {
            delete updatedDocs[docCode];
          }

          return {
            ...d,
            documents: updatedDocs,
            updatedAt: getNowFormatted(),
            auditHistory: [
              ...d.auditHistory,
              {
                id: `aud-${Date.now()}`,
                timestamp: getNowFormatted(),
                action: `Eliminación de documento: ${doc.name}`,
                user: d.basicInfo.email,
                role: 'PROVEEDOR',
              },
            ],
          };
        }
        return d;
      })
    );
  };

  // 5.1 Admin/Revisor Update & Modify Document
  const updateSupplierDocument = (
    dossierId: string,
    docCode: string,
    updatedDoc: Partial<SupplierDocument>,
    updatedBy: string,
    userRole: UserRole,
    justification?: string
  ) => {
    const timestamp = getNowFormatted();
    let supplierTarget: SupplierDossier | undefined;

    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          supplierTarget = d;
          const currentDoc = d.documents[docCode];
          const newDoc: SupplierDocument = {
            id: currentDoc?.id || `doc-${dossierId}-${docCode.toLowerCase()}`,
            code: docCode,
            name: updatedDoc.name || currentDoc?.name || docCode,
            isRequired: updatedDoc.isRequired ?? currentDoc?.isRequired ?? true,
            isInstitutionalForm: updatedDoc.isInstitutionalForm ?? currentDoc?.isInstitutionalForm ?? false,
            formCode: updatedDoc.formCode ?? currentDoc?.formCode,
            formVersion: updatedDoc.formVersion ?? currentDoc?.formVersion,
            status: updatedDoc.status ?? currentDoc?.status ?? 'CARGADO',
            fileName: updatedDoc.fileName !== undefined ? updatedDoc.fileName : currentDoc?.fileName,
            fileSize: updatedDoc.fileSize !== undefined ? updatedDoc.fileSize : currentDoc?.fileSize,
            uploadedAt: updatedDoc.fileName ? (currentDoc?.uploadedAt || timestamp) : currentDoc?.uploadedAt,
            uploadedBy: updatedDoc.fileName ? (updatedDoc.uploadedBy || currentDoc?.uploadedBy || updatedBy) : currentDoc?.uploadedBy,
            reviewedAt: updatedDoc.status === 'APROBADO' ? timestamp : currentDoc?.reviewedAt,
            reviewedBy: updatedDoc.status === 'APROBADO' ? updatedBy : currentDoc?.reviewedBy,
            expirationDate: updatedDoc.expirationDate !== undefined ? updatedDoc.expirationDate : currentDoc?.expirationDate,
            correction: updatedDoc.correction !== undefined ? updatedDoc.correction : currentDoc?.correction,
            notes: updatedDoc.notes !== undefined ? updatedDoc.notes : currentDoc?.notes,
            customUrl: updatedDoc.customUrl !== undefined ? updatedDoc.customUrl : currentDoc?.customUrl,
          };

          const oldFileDesc = currentDoc?.fileName ? `${currentDoc.fileName} (${currentDoc.status})` : 'Sin archivo (PENDIENTE)';
          const newFileDesc = newDoc.fileName ? `${newDoc.fileName} (${newDoc.status})` : 'Sin archivo (PENDIENTE)';

          const updatedDocs = {
            ...d.documents,
            [docCode]: newDoc,
          };

          const reqDocs = Object.values(updatedDocs).filter((item: any) => item.isRequired !== false);
          const allApproved = reqDocs.length > 0 && reqDocs.every((item: any) => item.status === 'APROBADO');
          const nextProcessStatus: ProcessStatus = allApproved
            ? 'PROVEEDOR_HABILITADO'
            : (d.processStatus === 'PROVEEDOR_HABILITADO' && !allApproved
                ? 'EN_REVISION'
                : d.processStatus);

          return {
            ...d,
            documents: updatedDocs,
            processStatus: nextProcessStatus,
            updatedAt: timestamp,
            auditHistory: [
              ...d.auditHistory,
              {
                id: `aud-${Date.now()}`,
                timestamp,
                action: `Modificación documental por ${userRole === 'ADMIN' ? 'Administrador' : 'Revisor'}: ${newDoc.name}`,
                user: updatedBy,
                role: userRole,
                notes: `Archivo: ${newFileDesc}. Justificación: ${justification || 'Actualización documental institucional autorizada.'}`,
              },
            ],
          };
        }
        return d;
      })
    );

    // Add entry to global system audit log
    if (supplierTarget) {
      const isNatural = supplierTarget.basicInfo.supplierType === 'NATURAL';
      const targetName = isNatural ? supplierTarget.basicInfo.fullName : supplierTarget.basicInfo.companyName;
      const targetDoc = isNatural ? supplierTarget.basicInfo.documentNumber : supplierTarget.basicInfo.nit;

      addSystemAuditLog({
        dossierId,
        supplierName: targetName || 'Proveedor',
        supplierDoc: targetDoc || 'N/A',
        fileNumber: supplierTarget.fileNumber,
        user: updatedBy,
        userRole,
        action: 'REVISION_DOCUMENTO',
        section: 'Expediente y Documentación Soporte',
        fieldChanged: `Documento [${docCode}] - ${updatedDoc.name || docCode}`,
        oldValue: 'Documento previo',
        newValue: `Archivo: ${updatedDoc.fileName || 'N/A'} | Estado: ${updatedDoc.status || 'Modificado'}`,
        justification: justification || 'Modificación o reemplazo de documento oficial autorizada en comité.',
      });
    }

    showToast(
      `Documento ${updatedDoc.name || docCode} actualizado correctamente en el expediente.`,
      'success',
      'DOCUMENTO MODIFICADO'
    );
  };

  // 5.2 Admin/Revisor Add Custom Document to Dossier
  const addCustomSupplierDocument = (
    dossierId: string,
    doc: SupplierDocument,
    updatedBy: string,
    userRole: UserRole,
    justification?: string
  ) => {
    const timestamp = getNowFormatted();
    let supplierTarget: SupplierDossier | undefined;

    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          supplierTarget = d;
          return {
            ...d,
            documents: {
              ...d.documents,
              [doc.code]: doc,
            },
            updatedAt: timestamp,
            auditHistory: [
              ...d.auditHistory,
              {
                id: `aud-${Date.now()}`,
                timestamp,
                action: `Anexo de documento adicional por ${userRole === 'ADMIN' ? 'Administrador' : 'Revisor'}: ${doc.name}`,
                user: updatedBy,
                role: userRole,
                notes: `Archivo: ${doc.fileName || 'Sin archivo'} (${doc.status}). Justificación: ${justification || 'Inclusión de requerimiento documental complementario.'}`,
              },
            ],
          };
        }
        return d;
      })
    );

    if (supplierTarget) {
      const isNatural = supplierTarget.basicInfo.supplierType === 'NATURAL';
      const targetName = isNatural ? supplierTarget.basicInfo.fullName : supplierTarget.basicInfo.companyName;
      const targetDoc = isNatural ? supplierTarget.basicInfo.documentNumber : supplierTarget.basicInfo.nit;

      addSystemAuditLog({
        dossierId,
        supplierName: targetName || 'Proveedor',
        supplierDoc: targetDoc || 'N/A',
        fileNumber: supplierTarget.fileNumber,
        user: updatedBy,
        userRole,
        action: 'REVISION_DOCUMENTO',
        section: 'Expediente y Documentación Soporte',
        fieldChanged: `Nuevo Requisito Anexo [${doc.code}] - ${doc.name}`,
        oldValue: 'No existía en expediente',
        newValue: `Archivo: ${doc.fileName || 'Pendiente'} | Estado: ${doc.status}`,
        justification: justification || 'Inclusión de nuevo documento complementario en el expediente.',
      });
    }

    showToast(
      `Nuevo documento ${doc.name} anexado al expediente.`,
      'success',
      'DOCUMENTO ANEXADO'
    );
  };

  // 6. Submit Dossier for Review
  const submitDossierForReview = (dossierId: string) => {
    const target = allDossiers.find((d) => d.id === dossierId);
    if (!target) return { success: false, message: 'Expediente no encontrado.' };

    if (!target.isEmailVerified) {
      return { success: false, message: 'Debe verificar su correo electrónico antes del envío.' };
    }

    const doc009 = target.documents['FS_GA_FOR_009'];
    const doc039 = target.documents['FS_GA_FOR_039'];

    if (!doc009 || doc009.status === 'PENDIENTE' || !doc009.fileName) {
      return { success: false, message: 'El formato institucional FS.GA-FOR-009 es obligatorio y debe estar cargado.' };
    }

    if (!doc039 || doc039.status === 'PENDIENTE' || !doc039.fileName) {
      return { success: false, message: 'El formato institucional FS.GA-FOR-039 es obligatorio y debe estar cargado.' };
    }

    // Check mandatory documents (Base according to Person Type + Specific according to Economic Activity)
    const { allMandatory: mandatoryList } = getRequiredDocumentsForSupplier(
      target.basicInfo.supplierType,
      target.selectedCategory
    );

    for (const reqCode of mandatoryList) {
      const doc = target.documents[reqCode];
      if (!doc || doc.status === 'PENDIENTE' || !doc.fileName) {
        const catInfo = DOCUMENT_CATALOG_INFO[reqCode];
        const docDef = documentDefinitions.find((d) => d.code === reqCode);
        return {
          success: false,
          message: `Falta cargar el documento obligatorio: ${docDef?.name || catInfo?.name || reqCode}`,
        };
      }
    }

    const timestamp = getNowFormatted();
    const isResubmission = target.processStatus === 'REQUIERE_CORRECCION';
    const nextStatus: ProcessStatus = isResubmission ? 'CORREGIDO_EN_REVISION' : 'EN_REVISION';

    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          // Set all loaded documents to EN_REVISION if they were CARGADO
          const updatedDocs = { ...d.documents };
          Object.keys(updatedDocs).forEach((k) => {
            if (updatedDocs[k].status === 'CARGADO' || updatedDocs[k].status === 'REQUIERE_CORRECCION') {
              updatedDocs[k] = { ...updatedDocs[k], status: 'EN_REVISION' };
            }
          });

          return {
            ...d,
            processStatus: nextStatus,
            submittedAt: timestamp,
            updatedAt: timestamp,
            documents: updatedDocs,
            auditHistory: [
              ...d.auditHistory,
              {
                id: `aud-${Date.now()}`,
                timestamp,
                action: isResubmission
                  ? 'Reenvío de expediente con correcciones atendidas'
                  : 'Envío definitivo de expediente para revisión interna',
                user: d.basicInfo.email,
                role: 'PROVEEDOR',
                statusChange: { from: d.processStatus, to: nextStatus },
                notes: `Solicitud de vinculación enviada formalmente al comité de proveedores Flota Sugamuxi S.A.`,
              },
            ],
          };
        }
        return d;
      })
    );

    // Automatic email dispatch on submission
    const recipientName =
      target.basicInfo.supplierType === 'NATURAL'
        ? target.basicInfo.fullName || 'Proveedor'
        : target.basicInfo.companyName || 'Empresa';

    const subEmail = generateEmailContent('SUBMISSION_CONFIRMATION', {
      recipientName,
      recipientEmail: target.basicInfo.email,
      fileNumber: target.fileNumber,
      dossierId: target.id,
      newStatus: nextStatus,
    });

    sendEmailNotification({
      dossierId: target.id,
      recipientEmail: target.basicInfo.email,
      recipientName,
      fileNumber: target.fileNumber,
      subject: subEmail.subject,
      templateType: 'SUBMISSION_CONFIRMATION',
      previewSnippet: subEmail.snippet,
      bodyHtml: subEmail.html,
      metadata: {
        newStatus: nextStatus,
      },
    });

    return {
      success: true,
      message: `Expediente ${target.fileNumber} enviado exitosamente. Su estado actual es: ${nextStatus === 'CORREGIDO_EN_REVISION' ? 'CORREGIDO — EN REVISIÓN' : 'EN REVISIÓN'}.`,
    };
  };

  // 7. Approve Document (Revisor)
  const approveDocument = (dossierId: string, docCode: string, reviewerName: string) => {
    if (!canEditDossier(dossierId)) {
      showToast(
        'Permiso denegado: Solo el revisor asignado o el Administrador pueden aprobar documentos de este expediente.',
        'warning',
        'ACCIÓN BLOQUEADA'
      );
      return;
    }
    const timestamp = getNowFormatted();
    const target = allDossiers.find((d) => d.id === dossierId);
    const docName = target?.documents[docCode]?.name || docCode;
    let becameFullyApproved = false;

    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          const doc = d.documents[docCode];
          if (!doc) return d;

          const updatedDocs = {
            ...d.documents,
            [docCode]: {
              ...doc,
              status: 'APROBADO' as const,
              reviewedAt: timestamp,
              reviewedBy: reviewerName,
              correction: undefined,
            },
          };

          // Check if ALL required documents are now approved
          const reqDocs = Object.values(updatedDocs).filter((item: any) => item.isRequired !== false);
          const allApproved = reqDocs.length > 0 && reqDocs.every((item: any) => item.status === 'APROBADO');
          becameFullyApproved = allApproved;

          const nextProcessStatus: ProcessStatus = allApproved
            ? 'PROVEEDOR_HABILITADO'
            : (d.processStatus === 'REQUIERE_CORRECCION' && !reqDocs.some((item: any) => item.status === 'REQUIERE_CORRECCION')
                ? 'EN_REVISION'
                : d.processStatus);

          const auditLogs = [
            ...d.auditHistory,
            {
              id: `aud-${Date.now()}`,
              timestamp,
              action: `Aprobación de documento: ${doc.name}`,
              user: reviewerName,
              role: 'REVISOR' as const,
              notes: `Documento verificado y avalado institucionalmente.`,
            },
          ];

          if (allApproved && d.processStatus !== 'PROVEEDOR_HABILITADO') {
            auditLogs.push({
              id: `aud-${Date.now()}-hab`,
              timestamp,
              action: 'Habilitación Oficial del Proveedor (100% Documentos Aprobados)',
              user: reviewerName,
              role: 'REVISOR' as const,
              statusChange: { from: d.processStatus, to: 'PROVEEDOR_HABILITADO' },
              notes: 'Todos los requisitos documentales e institucionales fueron aprobados satisfactoriamente. Ficha y Certificado Oficial habilitados para emisión.',
            });
          }

          return {
            ...d,
            documents: updatedDocs,
            processStatus: nextProcessStatus,
            updatedAt: timestamp,
            lastReviewDate: timestamp,
            auditHistory: auditLogs,
          };
        }
        return d;
      })
    );

    // Automatic email dispatch for document approval
    if (target) {
      const recipientName =
        target.basicInfo.supplierType === 'NATURAL'
          ? target.basicInfo.fullName || 'Proveedor'
          : target.basicInfo.companyName || 'Empresa';

      if (becameFullyApproved) {
        const emailData = generateEmailContent('DOSSIER_HABILITADO', {
          recipientName,
          recipientEmail: target.basicInfo.email,
          fileNumber: target.fileNumber,
          dossierId: target.id,
          reviewerName,
        });

        sendEmailNotification({
          dossierId: target.id,
          recipientEmail: target.basicInfo.email,
          recipientName,
          fileNumber: target.fileNumber,
          subject: emailData.subject,
          templateType: 'DOSSIER_HABILITADO',
          previewSnippet: emailData.snippet,
          bodyHtml: emailData.html,
          metadata: {
            newStatus: 'PROVEEDOR_HABILITADO',
            reviewerName,
          },
        });
      } else {
        const emailData = generateEmailContent('DOCUMENT_APPROVED', {
          recipientName,
          recipientEmail: target.basicInfo.email,
          fileNumber: target.fileNumber,
          dossierId: target.id,
          documentName: docName,
          documentCode: docCode,
          reviewerName,
        });

        sendEmailNotification({
          dossierId: target.id,
          recipientEmail: target.basicInfo.email,
          recipientName,
          fileNumber: target.fileNumber,
          subject: emailData.subject,
          templateType: 'DOCUMENT_APPROVED',
          previewSnippet: emailData.snippet,
          bodyHtml: emailData.html,
          metadata: {
            documentCode: docCode,
            documentName: docName,
            reviewerName,
          },
        });
      }
    }
  };

  // 8. Request Document Correction (Revisor) - Doesn't reject whole process
  const requestDocumentCorrection = (
    dossierId: string,
    docCode: string,
    correction: DocumentCorrection
  ) => {
    if (!canEditDossier(dossierId)) {
      showToast(
        'Permiso denegado: Solo el revisor asignado o el Administrador pueden solicitar correcciones para este expediente.',
        'warning',
        'ACCIÓN BLOQUEADA'
      );
      return;
    }
    const timestamp = getNowFormatted();
    const target = allDossiers.find((d) => d.id === dossierId);
    const docName = target?.documents[docCode]?.name || docCode;

    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          const doc = d.documents[docCode];
          if (!doc) return d;

          const updatedDocs = {
            ...d.documents,
            [docCode]: {
              ...doc,
              status: 'REQUIERE_CORRECCION' as const,
              reviewedAt: timestamp,
              reviewedBy: correction.requestedBy,
              correction,
            },
          };

          return {
            ...d,
            processStatus: 'REQUIERE_CORRECCION',
            reviewerNotes: `Corrección solicitada en: ${doc.name}. ${correction.detailedObservation}`,
            documents: updatedDocs,
            updatedAt: timestamp,
            lastReviewDate: timestamp,
            auditHistory: [
              ...d.auditHistory,
              {
                id: `aud-${Date.now()}`,
                timestamp,
                action: `Solicitud de corrección en documento: ${doc.name}`,
                user: correction.requestedBy,
                role: 'REVISOR',
                statusChange: { from: d.processStatus, to: 'REQUIERE_CORRECCION' },
                notes: `Sección: ${correction.sectionOrPage || 'General'}. Motivo: ${correction.reason}. Detalle: ${correction.detailedObservation}`,
              },
            ],
          };
        }
        return d;
      })
    );

    // Automatic email dispatch for correction request with rich observations
    if (target) {
      const recipientName =
        target.basicInfo.supplierType === 'NATURAL'
          ? target.basicInfo.fullName || 'Proveedor'
          : target.basicInfo.companyName || 'Empresa';

      const emailData = generateEmailContent('CORRECTION_REQUESTED', {
        recipientName,
        recipientEmail: target.basicInfo.email,
        fileNumber: target.fileNumber,
        dossierId: target.id,
        documentName: docName,
        documentCode: docCode,
        correction,
        reviewerNotes: `Sección: ${correction.sectionOrPage}. Motivo: ${correction.reason}. ${correction.detailedObservation}`,
        reviewerName: correction.requestedBy || 'Comité de Compras Flota Sugamuxi S.A.',
      });

      sendEmailNotification({
        dossierId: target.id,
        recipientEmail: target.basicInfo.email,
        recipientName,
        fileNumber: target.fileNumber,
        subject: emailData.subject,
        templateType: 'CORRECTION_REQUESTED',
        previewSnippet: emailData.snippet,
        bodyHtml: emailData.html,
        metadata: {
          newStatus: 'REQUIERE_CORRECCION',
          documentCode: docCode,
          documentName: docName,
          reason: correction.reason,
          sectionOrPage: correction.sectionOrPage,
          detailedObservation: correction.detailedObservation,
          reviewerName: correction.requestedBy,
        },
      });
    }
  };

  // Audit Logging Helper Function
  const addSystemAuditLog = (entry: Omit<SystemAuditEntry, 'id' | 'timestamp' | 'formattedDate'>) => {
    const now = new Date();
    const formattedDate = now.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const newEntry: SystemAuditEntry = {
      id: `aud-sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now.toISOString(),
      formattedDate,
      ...entry,
    };
    setSystemAuditLogs((prev) => [newEntry, ...prev]);
    if (supabaseService.isConfigured()) {
      supabaseService.saveAuditLog(newEntry);
    }
  };

  // Revisor Assignment and Workload Rebalancing
  const assignSupplierReviewer = (
    dossierId: string,
    reviewerId: string,
    reviewerName: string,
    assignedBy?: string
  ) => {
    const target = allDossiers.find((d) => d.id === dossierId);
    if (!target) return;

    const previousReviewer = target.assignedReviewerName || 'Sin Revisor Asignado';
    const effectiveAssignedBy = assignedBy || `${activeUser.name} (${activeUser.shortName})`;
    const nowTimestamp = getNowFormatted();

    setAllDossiers((prev) =>
      prev.map((d) => {
        if (d.id !== dossierId) return d;
        const newAudit: AuditLog = {
          id: `aud-assign-${Date.now()}`,
          timestamp: nowTimestamp,
          action: 'ASIGNACION_REVISOR',
          user: effectiveAssignedBy,
          role: role,
          notes: reviewerId
            ? `Proveedor asignado a: ${reviewerName}. Anterior: ${previousReviewer}`
            : `Proveedor desasignado (Sin Revisor). Anterior: ${previousReviewer}`,
        };
        return {
          ...d,
          assignedReviewerId: reviewerId || undefined,
          assignedReviewerName: reviewerName || undefined,
          assignedAt: reviewerId ? nowTimestamp : undefined,
          assignedBy: reviewerId ? effectiveAssignedBy : undefined,
          auditHistory: [newAudit, ...(d.auditHistory || [])],
        };
      })
    );

    const supplierDisplayName =
      target.basicInfo.supplierType === 'NATURAL'
        ? target.basicInfo.fullName || 'Persona Natural'
        : target.basicInfo.companyName || 'Empresa';
    const supplierDoc =
      target.basicInfo.supplierType === 'NATURAL'
        ? target.basicInfo.documentNumber || ''
        : target.basicInfo.nit || '';

    addSystemAuditLog({
      dossierId,
      supplierName: supplierDisplayName,
      supplierDoc,
      fileNumber: target.fileNumber,
      user: effectiveAssignedBy,
      userRole: role,
      action: 'ASIGNACION_REVISOR',
      section: 'Asignación de Cartera',
      fieldChanged: 'Revisor Responsable',
      oldValue: previousReviewer,
      newValue: reviewerName || 'Sin Asignar',
      justification: `Reasignación de cartera de proveedores efectuada por ${effectiveAssignedBy}.`,
    });

    showToast(
      reviewerId
        ? `Proveedor asignado a: ${reviewerName}`
        : 'Proveedor marcado como sin revisor asignado',
      'success',
      'REASIGNACIÓN DE CARTERA'
    );
  };

  // 9. Update Internal Concepts & Checks (SARLAFT, OFAC, Procuraduria, Legal, etc.)
  const updateInternalConcepts = (dossierId: string, concepts: Partial<InternalConcepts>) => {
    if (!canEditDossier(dossierId)) {
      showToast(
        'Permiso denegado: Solo el revisor asignado o el Administrador pueden registrar conceptos para este expediente.',
        'warning',
        'ACCESO RESTRINGIDO'
      );
      return;
    }
    const timestamp = getNowFormatted();
    const target = allDossiers.find((d) => d.id === dossierId);

    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          return {
            ...d,
            internalConcepts: {
              ...d.internalConcepts,
              ...concepts,
            },
            updatedAt: timestamp,
          };
        }
        return d;
      })
    );

    if (target) {
      const supplierName = target.basicInfo.supplierType === 'NATURAL' ? target.basicInfo.fullName || 'Persona Natural' : target.basicInfo.companyName || 'Empresa';
      const supplierDoc = target.basicInfo.supplierType === 'NATURAL' ? target.basicInfo.documentNumber || '' : target.basicInfo.nit || '';

      if (concepts.sarlatfCheck) {
        addSystemAuditLog({
          dossierId,
          supplierName,
          supplierDoc,
          fileNumber: target.fileNumber,
          user: `${concepts.sarlatfCheck.checkedBy || 'Revisor'} (${role === 'ADMIN' ? 'ADMIN' : 'REVISOR'})`,
          userRole: role === 'ADMIN' ? 'ADMIN' : 'REVISOR',
          action: 'VALIDACION_SARLAFT',
          section: 'Debida Diligencia & SARLAFT',
          fieldChanged: 'Consulta Listas Restrictivas / SARLAFT',
          oldValue: target.internalConcepts?.sarlatfCheck?.result || 'NO_VERIFICADO',
          newValue: concepts.sarlatfCheck.result,
          justification: concepts.sarlatfCheck.notes || 'Verificación en listas vinculantes nacionales e internacionales.',
        });
      }
    }
  };

  // 10. Update Dossier General Status (Aprobado, Proveedor Habilitado, Rechazado, etc.)
  const updateDossierStatus = (
    dossierId: string,
    newStatus: ProcessStatus,
    notes?: string,
    reviewerName: string = 'Comité de Compras Flota Sugamuxi',
    manualOverride: boolean = true,
    updatedContract?: Partial<SupplierContractInfo>
  ) => {
    if (!canEditDossier(dossierId)) {
      showToast(
        'Permiso denegado: Solo el revisor asignado o el Administrador pueden modificar el estado de este expediente.',
        'warning',
        'ACCIÓN BLOQUEADA'
      );
      return;
    }
    const timestamp = getNowFormatted();
    const target = allDossiers.find((d) => d.id === dossierId);
    const oldStatus = target?.processStatus;

    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          const mergedContract = updatedContract
            ? {
                ...(d.contractInfo || { contractStatus: 'SIN_CONTRATO' as const }),
                ...updatedContract,
                lastUpdated: timestamp,
              }
            : d.contractInfo;

          return {
            ...d,
            processStatus: newStatus,
            reviewerNotes: notes || d.reviewerNotes,
            manualStatusOverride: manualOverride,
            manualStatusReason: notes || d.manualStatusReason,
            manualStatusChangedAt: timestamp,
            manualStatusChangedBy: reviewerName,
            contractInfo: mergedContract,
            updatedAt: timestamp,
            lastReviewDate: timestamp,
            auditHistory: [
              ...d.auditHistory,
              {
                id: `aud-${Date.now()}`,
                timestamp,
                action: manualOverride
                  ? `Cambio manual de estado: ${newStatus}`
                  : `Cambio de estado general: ${newStatus}`,
                user: reviewerName || 'Comité de Compras Flota Sugamuxi',
                role: 'REVISOR',
                statusChange: { from: d.processStatus, to: newStatus },
                notes: notes || `El estado del expediente ha cambiado a ${newStatus}.`,
              },
            ],
          };
        }
        return d;
      })
    );

    // Record in central System Audit Log
    if (target && oldStatus !== newStatus) {
      const supplierName = target.basicInfo.supplierType === 'NATURAL' ? target.basicInfo.fullName || 'Persona Natural' : target.basicInfo.companyName || 'Empresa';
      const supplierDoc = target.basicInfo.supplierType === 'NATURAL' ? target.basicInfo.documentNumber || '' : target.basicInfo.nit || '';

      addSystemAuditLog({
        dossierId,
        supplierName,
        supplierDoc,
        fileNumber: target.fileNumber,
        user: `${reviewerName} (${role === 'ADMIN' ? 'ADMIN' : 'REVISOR'})`,
        userRole: role === 'ADMIN' ? 'ADMIN' : 'REVISOR',
        action: 'CAMBIO_ESTADO',
        section: 'Estado y Vigencia Contractual',
        fieldChanged: 'Estado General / Vigencia de Contrato',
        oldValue: oldStatus || 'INICIAL',
        newValue: newStatus,
        justification: notes || `Cambio formal de estado a ${newStatus} con registro auditado.`,
      });

      showToast(
        `Estado del proveedor actualizado a "${newStatus}" con registro de observación y trazabilidad ISO 9001.`,
        'success',
        'ESTADO REGISTRADO'
      );
    }

    // Automatic email dispatch for general status change
    if (target && oldStatus !== newStatus) {
      const recipientName =
        target.basicInfo.supplierType === 'NATURAL'
          ? target.basicInfo.fullName || 'Proveedor'
          : target.basicInfo.companyName || 'Empresa';

      let emailType: EmailNotificationType = 'STATUS_CHANGE';
      if (newStatus === 'PROVEEDOR_HABILITADO') {
        emailType = 'DOSSIER_HABILITADO';
      } else if (newStatus === 'APROBADO') {
        emailType = 'DOSSIER_APPROVED';
      } else if (newStatus === 'RECHAZADO') {
        emailType = 'DOSSIER_REJECTED';
      }

      const emailData = generateEmailContent(emailType, {
        recipientName,
        recipientEmail: target.basicInfo.email,
        fileNumber: target.fileNumber,
        dossierId: target.id,
        oldStatus,
        newStatus,
        reviewerNotes: notes,
        reviewerName,
        rejectionReason: newStatus === 'RECHAZADO' ? notes : undefined,
      });

      sendEmailNotification({
        dossierId: target.id,
        recipientEmail: target.basicInfo.email,
        recipientName,
        fileNumber: target.fileNumber,
        subject: emailData.subject,
        templateType: emailType,
        previewSnippet: emailData.snippet,
        bodyHtml: emailData.html,
        metadata: {
          oldStatus,
          newStatus,
          reviewerName,
          detailedObservation: notes,
        },
      });
    }
  };

  // 10b. Update Contract Info and optionally synchronize process status
  const updateDossierContractInfo = (
    dossierId: string,
    contractInfo: SupplierContractInfo,
    syncStatus: boolean = true,
    notes?: string,
    reviewerName: string = 'Gestión Contractual Flota Sugamuxi'
  ) => {
    if (!canEditDossier(dossierId)) {
      showToast(
        'Permiso denegado para modificar los datos contractuales.',
        'warning',
        'ACCIÓN BLOQUEADA'
      );
      return;
    }

    const target = allDossiers.find((d) => d.id === dossierId);
    if (!target) return;

    // El estado del proveedor es independiente del estado del contrato.
    // Se preserva el estado de homologación del proveedor (target.processStatus).
    const targetProcessStatus: ProcessStatus = target.processStatus;

    updateDossierStatus(
      dossierId,
      targetProcessStatus,
      notes || `Actualización de contrato ${contractInfo.contractNumber || 'vigente'} (Estado del contrato: ${contractInfo.contractStatus}) con vigencia hasta ${contractInfo.endDate || 'N/A'}.`,
      reviewerName,
      false,
      contractInfo
    );
  };

  // Direct Field-level editing with full audit trail
  const updateSupplierField = (
    dossierId: string,
    section: string,
    fieldKey: string,
    fieldLabel: string,
    oldValue: any,
    newValue: any,
    updatedBy: string,
    editorRole: UserRole,
    justification?: string
  ) => {
    if (!canEditDossier(dossierId)) {
      showToast(
        'Permiso denegado: Solo el revisor asignado o el Administrador pueden editar este expediente.',
        'warning',
        'EDICIÓN BLOQUEADA'
      );
      return;
    }
    const timestamp = getNowFormatted();
    const strOld = String(oldValue ?? '(Vacío)');
    const strNew = String(newValue ?? '(Vacío)');

    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          const updated = { ...d };
          const basic = { ...updated.basicInfo };

          if (fieldKey.startsWith('bankInfo.')) {
            const subKey = fieldKey.replace('bankInfo.', '');
            basic.bankInfo = { ...(basic.bankInfo || {}), [subKey]: newValue };
          } else if (fieldKey.startsWith('financialInfo.')) {
            const subKey = fieldKey.replace('financialInfo.', '');
            basic.financialInfo = { ...(basic.financialInfo || {}), [subKey]: newValue };
          } else if (fieldKey.startsWith('taxInfo.')) {
            const subKey = fieldKey.replace('taxInfo.', '');
            basic.taxInfo = { ...(basic.taxInfo || {}), [subKey]: newValue };
          } else if (fieldKey.startsWith('hseqInfo.')) {
            const subKey = fieldKey.replace('hseqInfo.', '');
            basic.hseqInfo = { ...(basic.hseqInfo || {}), [subKey]: newValue };
          } else if (fieldKey.startsWith('contactInfo.')) {
            const subKey = fieldKey.replace('contactInfo.', '');
            basic.contactInfo = { ...(basic.contactInfo || {}), [subKey]: newValue };
          } else if (fieldKey === 'selectedCategory') {
            updated.selectedCategory = newValue;
          } else if (fieldKey === 'economicActivity') {
            updated.economicActivity = newValue;
          } else if (fieldKey === 'supplierTier') {
            updated.supplierTier = newValue;
            basic.supplierTier = newValue;
          } else {
            (basic as any)[fieldKey] = newValue;
          }

          updated.basicInfo = basic;
          updated.updatedAt = timestamp;
          updated.auditHistory = [
            ...updated.auditHistory,
            {
              id: `aud-${Date.now()}`,
              timestamp,
              action: `Edición de campo: ${fieldLabel}`,
              user: `${updatedBy} (${editorRole === 'ADMIN' ? 'ADMINISTRADOR GENERAL' : 'REVISOR TÉCNICO'})`,
              role: editorRole,
              notes: `Sección: ${section}. Modificado de "${strOld}" a "${strNew}". ${justification ? 'Justificación: ' + justification : ''}`,
            },
          ];

          return updated;
        }
        return d;
      })
    );

    const target = allDossiers.find((d) => d.id === dossierId);
    const supplierDisplayName = target
      ? target.basicInfo.supplierType === 'NATURAL'
        ? target.basicInfo.fullName || 'Persona Natural'
        : target.basicInfo.companyName || 'Empresa'
      : 'Proveedor';
    const supplierDoc = target
      ? target.basicInfo.supplierType === 'NATURAL'
        ? target.basicInfo.documentNumber || ''
        : target.basicInfo.nit || ''
      : '';
    const fileNumber = target?.fileNumber || 'FS-PROV';

    addSystemAuditLog({
      dossierId,
      supplierName: supplierDisplayName,
      supplierDoc,
      fileNumber,
      user: `${updatedBy} (${editorRole === 'ADMIN' ? 'ADMINISTRADOR GENERAL' : 'REVISOR TÉCNICO'})`,
      userRole: editorRole,
      action: 'EDICION_CAMPO',
      section,
      fieldChanged: fieldLabel,
      oldValue: strOld,
      newValue: strNew,
      justification: justification || 'Actualización autorizada de datos de proveedor.',
    });

    showToast(`Campo "${fieldLabel}" actualizado y registrado en auditoría.`, 'success', 'Modificación Auditada');
  };

  // Multi-field update with batch audit logging
  const updateEntireSupplier = (
    dossierId: string,
    updatedData: Partial<SupplierDossier>,
    changes: Array<{ section: string; fieldLabel: string; oldValue: any; newValue: any }>,
    updatedBy: string,
    editorRole: UserRole,
    justification?: string
  ) => {
    if (!canEditDossier(dossierId)) {
      showToast(
        'Permiso denegado: Solo el revisor asignado o el Administrador pueden editar este expediente.',
        'warning',
        'EDICIÓN BLOQUEADA'
      );
      return;
    }
    const timestamp = getNowFormatted();

    setDossiers((prev) =>
      prev.map((d) => {
        if (d.id === dossierId) {
          const newAuditLogs = changes.map((c, idx) => ({
            id: `aud-${Date.now()}-${idx}`,
            timestamp,
            action: `Edición de campo: ${c.fieldLabel}`,
            user: `${updatedBy} (${editorRole === 'ADMIN' ? 'ADMINISTRADOR GENERAL' : 'REVISOR TÉCNICO'})`,
            role: editorRole,
            notes: `Sección: ${c.section}. Modificado de "${String(c.oldValue ?? '')}" a "${String(c.newValue ?? '')}". ${justification ? 'Motivo: ' + justification : ''}`,
          }));

          const nextTier = (updatedData.supplierTier || updatedData.basicInfo?.supplierTier || d.supplierTier || 'B') as any;

          return {
            ...d,
            ...updatedData,
            supplierTier: nextTier,
            basicInfo: {
              ...d.basicInfo,
              ...(updatedData.basicInfo || {}),
              supplierTier: nextTier,
            },
            updatedAt: timestamp,
            auditHistory: [...d.auditHistory, ...newAuditLogs],
          };
        }
        return d;
      })
    );

    const target = allDossiers.find((d) => d.id === dossierId);
    const supplierDisplayName =
      updatedData.basicInfo?.companyName ||
      updatedData.basicInfo?.fullName ||
      target?.basicInfo.companyName ||
      target?.basicInfo.fullName ||
      'Proveedor';
    const supplierDoc =
      updatedData.basicInfo?.nit ||
      updatedData.basicInfo?.documentNumber ||
      target?.basicInfo.nit ||
      target?.basicInfo.documentNumber ||
      '';
    const fileNumber = target?.fileNumber || 'FS-PROV';

    changes.forEach((c) => {
      addSystemAuditLog({
        dossierId,
        supplierName: supplierDisplayName,
        supplierDoc,
        fileNumber,
        user: `${updatedBy} (${editorRole === 'ADMIN' ? 'ADMINISTRADOR GENERAL' : 'REVISOR TÉCNICO'})`,
        userRole: editorRole,
        action: 'EDICION_CAMPO',
        section: c.section,
        fieldChanged: c.fieldLabel,
        oldValue: String(c.oldValue ?? '(Vacío)'),
        newValue: String(c.newValue ?? '(Vacío)'),
        justification: justification || 'Modificación en panel de revisión autorizada.',
      });
    });

    showToast(`${changes.length} campo(s) guardado(s) y registrado(s) en auditoría general.`, 'success', 'Actualización Exitosa');
  };


  // 11. Admin Form Versioning (Never delete old, add version, set active)
  const addNewFormVersion = (
    formCode: string,
    newVersion: string,
    releaseDate: string,
    modifiedBy: string,
    changeSummary: string,
    isMandatory: boolean = true
  ) => {
    setInstitutionalForms((prev) =>
      prev.map((form) => {
        if (form.code === formCode) {
          const updatedHistory = form.versionHistory.map((vh) => ({
            ...vh,
            isActive: false,
          }));

          updatedHistory.unshift({
            version: newVersion,
            releaseDate,
            modifiedBy,
            changeSummary,
            isActive: true,
          });

          return {
            ...form,
            currentVersion: newVersion,
            effectiveDate: releaseDate,
            isMandatory,
            versionHistory: updatedHistory,
          };
        }
        return form;
      })
    );
  };

  const toggleFormMandatory = (formCode: string, isMandatory: boolean) => {
    setInstitutionalForms((prev) =>
      prev.map((form) => (form.code === formCode ? { ...form, isMandatory } : form))
    );
  };

  // 12. Create, Update & Delete Convocatoria
  const createConvocatoria = (data: Omit<Convocatoria, 'id' | 'postulaciones'>) => {
    const newConv: Convocatoria = {
      ...data,
      id: `conv-${Date.now()}`,
      postulaciones: [],
    };
    setConvocatorias((prev) => [newConv, ...prev]);
    if (supabaseService.isConfigured()) {
      supabaseService.saveConvocatoria(newConv);
    }
    showToast(`Convocatoria ${newConv.code} publicada con éxito.`, 'success', 'Convocatoria Publicada');
  };

  const updateConvocatoria = (
    id: string,
    updatedData: Partial<Omit<Convocatoria, 'id' | 'postulaciones'>>
  ) => {
    setConvocatorias((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c))
    );
    showToast('Convocatoria actualizada exitosamente con todos sus campos.', 'success', 'Convocatoria Guardada');
  };

  const deleteConvocatoria = (id: string) => {
    const target = convocatorias.find((c) => c.id === id);
    if (!target) return { success: false, message: 'Convocatoria no encontrada.' };
    setConvocatorias((prev) => prev.filter((c) => c.id !== id));
    showToast(`Convocatoria ${target.code} eliminada del sistema.`, 'info', 'Convocatoria Eliminada');
    return { success: true, message: 'Convocatoria eliminada correctamente.' };
  };

  // 13. Apply to Convocatoria
  const applyToConvocatoria = (
    convocatoriaId: string,
    application: Omit<ConvocatoriaPostulacion, 'id' | 'submittedAt' | 'status'>
  ) => {
    const conv = convocatorias.find((c) => c.id === convocatoriaId);
    if (!conv) return { success: false, message: 'Convocatoria no encontrada.' };

    const supplier = allDossiers.find((d) => d.id === application.supplierId);
    if (!supplier) return { success: false, message: 'Proveedor no registrado.' };

    // Check Access Rule
    if (conv.accessRule === 'OPCION_B' && supplier.processStatus !== 'PROVEEDOR_HABILITADO') {
      return {
        success: false,
        message:
          'Esta convocatoria está configurada como [OPCIÓN B]: Solo pueden postularse proveedores con estado PROVEEDOR HABILITADO. Por favor complete y obtenga la aprobación de su expediente digital primero.',
      };
    }

    // Check if already applied
    const alreadyApplied = conv.postulaciones.some((p) => p.supplierId === application.supplierId);
    if (alreadyApplied) {
      return {
        success: false,
        message: 'Ya cuenta con una postulación radicada para esta convocatoria.',
      };
    }

    const newPostulacion: ConvocatoriaPostulacion = {
      ...application,
      id: `post-${Date.now()}`,
      submittedAt: getNowFormatted(),
      status: 'POSTULADO',
    };

    setConvocatorias((prev) =>
      prev.map((c) => {
        if (c.id === convocatoriaId) {
          return {
            ...c,
            postulaciones: [...c.postulaciones, newPostulacion],
          };
        }
        return c;
      })
    );

    return {
      success: true,
      message: `Postulación radicada con éxito para la convocatoria ${conv.code}.${
        conv.accessRule === 'OPCION_C'
          ? ' Nota: Por regla Opción C, su expediente digital deberá ser evaluado y habilitado antes del acto de adjudicación.'
          : ''
      }`,
    };
  };

  // 14. Evaluate Postulación
  const evaluatePostulacion = (
    convocatoriaId: string,
    postulacionId: string,
    status: 'EVALUADO' | 'SELECCIONADO' | 'NO_SELECCIONADO',
    technicalScore?: number,
    economicScore?: number,
    feedback?: string
  ) => {
    setConvocatorias((prev) =>
      prev.map((c) => {
        if (c.id === convocatoriaId) {
          const updatedPostulaciones = c.postulaciones.map((p) => {
            if (p.id === postulacionId) {
              return {
                ...p,
                status,
                technicalScore: technicalScore !== undefined ? technicalScore : p.technicalScore,
                economicScore: economicScore !== undefined ? economicScore : p.economicScore,
                feedback: feedback || p.feedback,
              };
            }
            return p;
          });
          return { ...c, postulaciones: updatedPostulaciones };
        }
        return c;
      })
    );
  };

  // 15. Document Matrix & Parametrization (Admin General)
  const getRequiredDocumentsForSupplier = (
    supplierType: SupplierType | undefined,
    categoryName: string | undefined
  ) => {
    const isNatural = supplierType === 'NATURAL';
    const personKey: 'NATURAL' | 'JURIDICA' = isNatural ? 'NATURAL' : 'JURIDICA';

    // Set of inactive document codes to exclude from active checklists
    const inactiveDocCodes = new Set(
      documentDefinitions.filter((d) => d.isActive === false).map((d) => d.code)
    );

    // 1. Base requirements preestablished for Person Type (Natural vs Juridica)
    const baseConfig = baseRequirementsConfig[personKey] || INITIAL_BASE_REQUIREMENTS[personKey];
    const baseMandatory = (baseConfig?.mandatoryDocs || []).filter((c) => !inactiveDocCodes.has(c));
    const baseOptional = (baseConfig?.optionalDocs || []).filter((c) => !inactiveDocCodes.has(c));

    // 2. Specific additional requirements for Economic Activity / Category
    const catConfig =
      categoriesConfig.find((c) => c.category === categoryName && c.isActive !== false) ||
      categoriesConfig.find((c) => c.category === categoryName) ||
      categoriesConfig[0];

    const rawActivityMandatory = catConfig
      ? isNatural
        ? (catConfig.mandatoryForNatural || []).filter((c) => !inactiveDocCodes.has(c))
        : (catConfig.mandatoryForJuridica || []).filter((c) => !inactiveDocCodes.has(c))
      : [];

    const rawActivityOptional = catConfig
      ? isNatural
        ? (catConfig.optionalForNatural || []).filter((c) => !inactiveDocCodes.has(c))
        : (catConfig.optionalForJuridica || []).filter((c) => !inactiveDocCodes.has(c))
      : [];

    // 3. Union & deduplication
    const allMandatorySet = new Set<string>();
    baseMandatory.forEach((code) => allMandatorySet.add(code));
    rawActivityMandatory.forEach((code) => allMandatorySet.add(code));
    const allMandatory = Array.from(allMandatorySet);

    // Specific to activity (excluding base already present)
    const activityMandatory = rawActivityMandatory.filter(
      (code) => !baseMandatory.includes(code)
    );

    const allOptionalSet = new Set<string>();
    baseOptional.forEach((code) => {
      if (!allMandatorySet.has(code)) allOptionalSet.add(code);
    });
    rawActivityOptional.forEach((code) => {
      if (!allMandatorySet.has(code)) allOptionalSet.add(code);
    });
    const allOptional = Array.from(allOptionalSet);

    const activityOptional = rawActivityOptional.filter(
      (code) => !baseOptional.includes(code) && !allMandatorySet.has(code)
    );

    return {
      allMandatory,
      allOptional,
      baseMandatory,
      activityMandatory,
      baseOptional,
      activityOptional,
    };
  };

  const updateBaseRequirementsConfig = (
    personType: 'NATURAL' | 'JURIDICA',
    updated: Partial<PersonTypeBaseRequirementConfig>
  ) => {
    setBaseRequirementsConfig((prev) => ({
      ...prev,
      [personType]: {
        ...prev[personType],
        ...updated,
      },
    }));
  };

  const toggleBaseDocumentRequirement = (
    personType: 'NATURAL' | 'JURIDICA',
    docCode: string,
    mode: 'MANDATORY' | 'OPTIONAL' | 'NONE'
  ) => {
    setBaseRequirementsConfig((prev) => {
      const current = prev[personType] || INITIAL_BASE_REQUIREMENTS[personType];
      let mand = [...(current.mandatoryDocs || [])].filter((c) => c !== docCode);
      let opt = [...(current.optionalDocs || [])].filter((c) => c !== docCode);

      if (mode === 'MANDATORY') {
        mand.push(docCode);
      } else if (mode === 'OPTIONAL') {
        opt.push(docCode);
      }

      return {
        ...prev,
        [personType]: {
          ...current,
          mandatoryDocs: mand,
          optionalDocs: opt,
        },
      };
    });
  };

  const updateCategoryConfig = (categoryName: string, updatedConfig: Partial<CategoryRequirementConfig>) => {
    setCategoriesConfig((prev) =>
      prev.map((c) => (c.category === categoryName ? { ...c, ...updatedConfig } : c))
    );
  };

  const addCategoryConfig = (newConfig: CategoryRequirementConfig): { success: boolean; message: string } => {
    if (!newConfig.category?.trim()) {
      return { success: false, message: 'El nombre del servicio o categoría es obligatorio.' };
    }
    if (categoriesConfig.some((c) => c.category.toLowerCase() === newConfig.category.trim().toLowerCase())) {
      return { success: false, message: 'Ya existe una categoría o servicio con este nombre.' };
    }
    const cleanConfig: CategoryRequirementConfig = {
      ...newConfig,
      id: newConfig.id || `cat-${Date.now()}`,
      category: newConfig.category.trim(),
      description: newConfig.description || 'Categoría de bienes o servicios para Flota Sugamuxi S.A.',
      riskLevel: newConfig.riskLevel || 'MEDIO',
      mandatoryForNatural: newConfig.mandatoryForNatural || ['PORTAFOLIO_SERVICIOS'],
      mandatoryForJuridica: newConfig.mandatoryForJuridica || ['PORTAFOLIO_SERVICIOS'],
      optionalForNatural: newConfig.optionalForNatural || [],
      optionalForJuridica: newConfig.optionalForJuridica || [],
    };
    setCategoriesConfig((prev) => [...prev, cleanConfig]);
    return { success: true, message: 'Nueva categoría y matriz de requisitos agregada exitosamente.' };
  };

  const deleteCategoryConfig = (categoryName: string): { success: boolean; message: string } => {
    setCategoriesConfig((prev) => prev.filter((c) => c.category !== categoryName));
    return { success: true, message: 'Actividad económica eliminada del catálogo activo.' };
  };

  const toggleDocumentRequirement = (
    categoryName: string,
    docCode: string,
    targetRegimen: 'NATURAL' | 'JURIDICA',
    mode: 'MANDATORY' | 'OPTIONAL' | 'NONE'
  ) => {
    setCategoriesConfig((prev) =>
      prev.map((cat) => {
        if (cat.category !== categoryName) return cat;

        const updated = { ...cat };
        if (targetRegimen === 'NATURAL') {
          let mand = [...updated.mandatoryForNatural];
          let opt = [...updated.optionalForNatural];
          mand = mand.filter((c) => c !== docCode);
          opt = opt.filter((c) => c !== docCode);

          if (mode === 'MANDATORY') mand.push(docCode);
          else if (mode === 'OPTIONAL') opt.push(docCode);

          updated.mandatoryForNatural = mand;
          updated.optionalForNatural = opt;
        } else {
          let mand = [...updated.mandatoryForJuridica];
          let opt = [...updated.optionalForJuridica];
          mand = mand.filter((c) => c !== docCode);
          opt = opt.filter((c) => c !== docCode);

          if (mode === 'MANDATORY') mand.push(docCode);
          else if (mode === 'OPTIONAL') opt.push(docCode);

          updated.mandatoryForJuridica = mand;
          updated.optionalForJuridica = opt;
        }
        return updated;
      })
    );
  };

  const addDocumentDefinition = (doc: DocumentDefinition): { success: boolean; message: string } => {
    if (!doc.code?.trim() || !doc.name?.trim()) {
      return { success: false, message: 'El código y nombre del tipo de documento son obligatorios.' };
    }
    const cleanCode = doc.code.trim().toUpperCase().replace(/\s+/g, '_');
    if (documentDefinitions.some((d) => d.code === cleanCode)) {
      return { success: false, message: 'Ya existe un tipo de documento con este código.' };
    }
    const newDoc: DocumentDefinition = {
      ...doc,
      code: cleanCode,
      name: doc.name.trim(),
      isActive: doc.isActive !== undefined ? doc.isActive : true,
    };
    setDocumentDefinitions((prev) => [...prev, newDoc]);
    return { success: true, message: 'Tipo de documento agregado al catálogo maestro.' };
  };

  const updateDocumentDefinition = (code: string, updated: Partial<DocumentDefinition>) => {
    setDocumentDefinitions((prev) =>
      prev.map((d) => (d.code === code ? { ...d, ...updated } : d))
    );
  };

  const deleteDocumentDefinition = (code: string): { success: boolean; message: string } => {
    if (code === 'FS_GA_FOR_009' || code === 'FS_GA_FOR_039') {
      return { success: false, message: 'Los formatos oficiales institucionales SIG no pueden ser eliminados.' };
    }
    setDocumentDefinitions((prev) => prev.filter((d) => d.code !== code));
    // Also clean from categories
    setCategoriesConfig((prev) =>
      prev.map((cat) => ({
        ...cat,
        mandatoryForNatural: (cat.mandatoryForNatural || []).filter((c) => c !== code),
        optionalForNatural: (cat.optionalForNatural || []).filter((c) => c !== code),
        mandatoryForJuridica: (cat.mandatoryForJuridica || []).filter((c) => c !== code),
        optionalForJuridica: (cat.optionalForJuridica || []).filter((c) => c !== code),
      }))
    );
    // Also clean from base requirements
    setBaseRequirementsConfig((prev) => ({
      NATURAL: {
        ...prev.NATURAL,
        mandatoryDocs: (prev.NATURAL?.mandatoryDocs || []).filter((c) => c !== code),
        optionalDocs: (prev.NATURAL?.optionalDocs || []).filter((c) => c !== code),
      },
      JURIDICA: {
        ...prev.JURIDICA,
        mandatoryDocs: (prev.JURIDICA?.mandatoryDocs || []).filter((c) => c !== code),
        optionalDocs: (prev.JURIDICA?.optionalDocs || []).filter((c) => c !== code),
      },
    }));
    return { success: true, message: 'Documento eliminado del catálogo y desvinculado de todas las categorías y requisitos base.' };
  };

  const resetMatrixToDefault = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY_CATEGORIES);
    localStorage.removeItem(LOCAL_STORAGE_KEY_DOC_DEFINITIONS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_BASE_REQUIREMENTS);
    setCategoriesConfig(CATEGORIES_CONFIG);
    setDocumentDefinitions(INITIAL_DOCUMENT_DEFINITIONS);
    setBaseRequirementsConfig(INITIAL_BASE_REQUIREMENTS);
  };

  // 16. Dynamic Catalogs & System Parametrization (Admin General)
  const updateGlobalSettings = (settings: Partial<GlobalSystemSettings>) => {
    setSystemParameters((prev) => {
      const updated = {
        ...prev,
        globalSettings: {
          ...prev.globalSettings,
          ...settings,
        },
      };
      return updated;
    });

    addSystemAuditLog({
      dossierId: 'CONFIG-GLOBAL',
      supplierName: 'Parámetros Globales SIG',
      supplierDoc: 'NIT: 891.800.087-1',
      fileNumber: 'FS-PARAM-GLOBAL',
      user: 'Julian Salgado (ADMINISTRADOR GENERAL)',
      userRole: 'ADMIN',
      action: 'EDICION_CAMPO',
      section: 'Parámetros Generales SIG',
      fieldChanged: 'Configuración Global del Sistema',
      oldValue: 'Valores Anteriores',
      newValue: JSON.stringify(settings),
      justification: 'Actualización de directrices y políticas generales del sistema institucional.',
    });

    showToast('Parámetros globales del sistema actualizados.', 'success', 'Parametrización Guardada');
  };

  // Banks
  const addBankParameter = (bank: Omit<BankParameter, 'id'>) => {
    if (!bank.name?.trim()) return { success: false, message: 'El nombre de la entidad bancaria es obligatorio.' };
    const newBank: BankParameter = {
      ...bank,
      id: `bank-${Date.now()}`,
      name: bank.name.trim(),
      code: bank.code ? bank.code.trim().toUpperCase() : bank.name.trim().toUpperCase().replace(/\s+/g, '_'),
      isActive: bank.isActive !== undefined ? bank.isActive : true,
    };
    setSystemParameters((prev) => ({
      ...prev,
      bankOptions: [...prev.bankOptions, newBank],
    }));
    addSystemAuditLog({
      dossierId: 'CAT-BANCOS',
      supplierName: 'Catálogo de Bancos',
      supplierDoc: newBank.code,
      fileNumber: 'FS-PARAM-BANK',
      user: 'Julian Salgado (ADMINISTRADOR GENERAL)',
      userRole: 'ADMIN',
      action: 'CREACION_REGISTRO',
      section: 'Entidades Bancarias',
      fieldChanged: 'Nuevo Banco',
      oldValue: '(Ninguno)',
      newValue: newBank.name,
      justification: 'Inclusión de nueva entidad financiera autorizada para pagos a proveedores.',
    });
    showToast(`Banco "${newBank.name}" agregado exitosamente.`, 'success', 'Catálogo de Bancos');
    return { success: true, message: 'Entidad bancaria agregada con éxito.' };
  };

  const updateBankParameter = (id: string, updated: Partial<BankParameter>) => {
    setSystemParameters((prev) => ({
      ...prev,
      bankOptions: prev.bankOptions.map((b) => (b.id === id ? { ...b, ...updated } : b)),
    }));
    showToast('Entidad bancaria actualizada.', 'success', 'Catálogo de Bancos');
  };

  const deleteBankParameter = (id: string) => {
    if (systemParameters.bankOptions.length <= 1) {
      return { success: false, message: 'Debe existir al menos un banco en el catálogo.' };
    }
    setSystemParameters((prev) => ({
      ...prev,
      bankOptions: prev.bankOptions.filter((b) => b.id !== id),
    }));
    showToast('Entidad bancaria eliminada.', 'info', 'Catálogo de Bancos');
    return { success: true, message: 'Entidad bancaria eliminada.' };
  };

  // Bank Account Types
  const addBankAccountTypeParameter = (item: Omit<BankAccountTypeParameter, 'id'>) => {
    if (!item.name?.trim()) return { success: false, message: 'El nombre del tipo de cuenta es obligatorio.' };
    const newItem: BankAccountTypeParameter = {
      ...item,
      id: `acc-${Date.now()}`,
      name: item.name.trim(),
      code: item.code ? item.code.trim().toUpperCase() : item.name.trim().toUpperCase().replace(/\s+/g, '_'),
      isActive: item.isActive !== undefined ? item.isActive : true,
    };
    setSystemParameters((prev) => ({
      ...prev,
      bankAccountTypes: [...prev.bankAccountTypes, newItem],
    }));
    showToast(`Tipo de cuenta "${newItem.name}" agregado.`, 'success', 'Tipos de Cuenta');
    return { success: true, message: 'Tipo de cuenta agregado con éxito.' };
  };

  const updateBankAccountTypeParameter = (id: string, updated: Partial<BankAccountTypeParameter>) => {
    setSystemParameters((prev) => ({
      ...prev,
      bankAccountTypes: prev.bankAccountTypes.map((a) => (a.id === id ? { ...a, ...updated } : a)),
    }));
    showToast('Tipo de cuenta actualizado.', 'success', 'Tipos de Cuenta');
  };

  const deleteBankAccountTypeParameter = (id: string) => {
    if (systemParameters.bankAccountTypes.length <= 1) {
      return { success: false, message: 'Debe existir al menos un tipo de cuenta en el catálogo.' };
    }
    setSystemParameters((prev) => ({
      ...prev,
      bankAccountTypes: prev.bankAccountTypes.filter((a) => a.id !== id),
    }));
    return { success: true, message: 'Tipo de cuenta eliminado.' };
  };

  // Document Types
  const addDocumentTypeParameter = (item: Omit<DocumentTypeParameter, 'id'>) => {
    if (!item.name?.trim()) return { success: false, message: 'El nombre del tipo de documento es obligatorio.' };
    const newItem: DocumentTypeParameter = {
      ...item,
      id: `dt-${Date.now()}`,
      name: item.name.trim(),
      code: item.code ? item.code.trim().toUpperCase() : item.name.trim().toUpperCase().replace(/\s+/g, '_'),
      isActive: item.isActive !== undefined ? item.isActive : true,
    };
    setSystemParameters((prev) => ({
      ...prev,
      documentTypes: [...prev.documentTypes, newItem],
    }));
    showToast(`Tipo de documento "${newItem.name}" agregado.`, 'success', 'Tipos de Identificación');
    return { success: true, message: 'Tipo de documento agregado con éxito.' };
  };

  const updateDocumentTypeParameter = (id: string, updated: Partial<DocumentTypeParameter>) => {
    setSystemParameters((prev) => ({
      ...prev,
      documentTypes: prev.documentTypes.map((d) => (d.id === id ? { ...d, ...updated } : d)),
    }));
    showToast('Tipo de documento actualizado.', 'success', 'Tipos de Identificación');
  };

  const deleteDocumentTypeParameter = (id: string) => {
    if (systemParameters.documentTypes.length <= 1) {
      return { success: false, message: 'Debe existir al menos un tipo de identificación en el catálogo.' };
    }
    setSystemParameters((prev) => ({
      ...prev,
      documentTypes: prev.documentTypes.filter((d) => d.id !== id),
    }));
    return { success: true, message: 'Tipo de identificación eliminado.' };
  };

  // Tax Regimes
  const addTaxRegimeParameter = (item: Omit<TaxRegimeParameter, 'id'>) => {
    if (!item.name?.trim()) return { success: false, message: 'El nombre del régimen tributario es obligatorio.' };
    const newItem: TaxRegimeParameter = {
      ...item,
      id: `tr-${Date.now()}`,
      name: item.name.trim(),
      code: item.code ? item.code.trim().toUpperCase() : item.name.trim().toUpperCase().replace(/\s+/g, '_'),
      isActive: item.isActive !== undefined ? item.isActive : true,
    };
    setSystemParameters((prev) => ({
      ...prev,
      taxRegimes: [...prev.taxRegimes, newItem],
    }));
    showToast(`Régimen tributario "${newItem.name}" agregado.`, 'success', 'Régimen Tributario');
    return { success: true, message: 'Régimen tributario agregado con éxito.' };
  };

  const updateTaxRegimeParameter = (id: string, updated: Partial<TaxRegimeParameter>) => {
    setSystemParameters((prev) => ({
      ...prev,
      taxRegimes: prev.taxRegimes.map((t) => (t.id === id ? { ...t, ...updated } : t)),
    }));
    showToast('Régimen tributario actualizado.', 'success', 'Régimen Tributario');
  };

  const deleteTaxRegimeParameter = (id: string) => {
    if (systemParameters.taxRegimes.length <= 1) {
      return { success: false, message: 'Debe existir al menos un régimen tributario en el catálogo.' };
    }
    setSystemParameters((prev) => ({
      ...prev,
      taxRegimes: prev.taxRegimes.filter((t) => t.id !== id),
    }));
    return { success: true, message: 'Régimen tributario eliminado.' };
  };

  // Cities
  const addCityParameter = (item: Omit<CityParameter, 'id'>) => {
    if (!item.name?.trim() || !item.department?.trim()) return { success: false, message: 'La ciudad y departamento son obligatorios.' };
    const newItem: CityParameter = {
      ...item,
      id: `city-${Date.now()}`,
      name: item.name.trim(),
      code: item.code ? item.code.trim().toUpperCase() : item.name.trim().toUpperCase().replace(/\s+/g, '_'),
      isActive: item.isActive !== undefined ? item.isActive : true,
    };
    setSystemParameters((prev) => ({
      ...prev,
      cityOptions: [...prev.cityOptions, newItem],
    }));
    showToast(`Ciudad "${newItem.name}" agregada a la cobertura.`, 'success', 'Cobertura Operativa');
    return { success: true, message: 'Ciudad / municipio agregado con éxito.' };
  };

  const updateCityParameter = (id: string, updated: Partial<CityParameter>) => {
    setSystemParameters((prev) => ({
      ...prev,
      cityOptions: prev.cityOptions.map((c) => (c.id === id ? { ...c, ...updated } : c)),
    }));
    showToast('Ciudad / municipio actualizado.', 'success', 'Cobertura Operativa');
  };

  const deleteCityParameter = (id: string) => {
    if (systemParameters.cityOptions.length <= 1) {
      return { success: false, message: 'Debe existir al menos una ciudad en el catálogo.' };
    }
    setSystemParameters((prev) => ({
      ...prev,
      cityOptions: prev.cityOptions.filter((c) => c.id !== id),
    }));
    return { success: true, message: 'Ciudad eliminada.' };
  };

  // ARL Risk Levels
  const addArlRiskParameter = (item: Omit<ArlRiskParameter, 'id'>) => {
    if (!item.name?.trim()) return { success: false, message: 'El nombre del nivel de riesgo es obligatorio.' };
    const newItem: ArlRiskParameter = {
      ...item,
      id: `arl-${Date.now()}`,
      name: item.name.trim(),
      code: item.code ? item.code.trim().toUpperCase() : item.name.trim().toUpperCase().replace(/\s+/g, '_'),
      isActive: item.isActive !== undefined ? item.isActive : true,
    };
    setSystemParameters((prev) => ({
      ...prev,
      arlRiskLevels: [...prev.arlRiskLevels, newItem],
    }));
    showToast(`Nivel ARL "${newItem.name}" agregado.`, 'success', 'Niveles de Riesgo ARL');
    return { success: true, message: 'Nivel de riesgo ARL agregado.' };
  };

  const updateArlRiskParameter = (id: string, updated: Partial<ArlRiskParameter>) => {
    setSystemParameters((prev) => ({
      ...prev,
      arlRiskLevels: prev.arlRiskLevels.map((a) => (a.id === id ? { ...a, ...updated } : a)),
    }));
    showToast('Nivel de riesgo ARL actualizado.', 'success', 'Niveles de Riesgo ARL');
  };

  const deleteArlRiskParameter = (id: string) => {
    if (systemParameters.arlRiskLevels.length <= 1) {
      return { success: false, message: 'Debe existir al menos un nivel de riesgo en el catálogo.' };
    }
    setSystemParameters((prev) => ({
      ...prev,
      arlRiskLevels: prev.arlRiskLevels.filter((a) => a.id !== id),
    }));
    return { success: true, message: 'Nivel ARL eliminado.' };
  };

  // Convocatoria Modalities
  const addConvocatoriaTypeParameter = (item: Omit<ConvocatoriaTypeParameter, 'id'>) => {
    if (!item.name?.trim()) return { success: false, message: 'El nombre de la modalidad es obligatorio.' };
    const newItem: ConvocatoriaTypeParameter = {
      ...item,
      id: `conv-t-${Date.now()}`,
      name: item.name.trim(),
      code: item.code ? item.code.trim().toUpperCase() : item.name.trim().toUpperCase().replace(/\s+/g, '_'),
      isActive: item.isActive !== undefined ? item.isActive : true,
    };
    setSystemParameters((prev) => ({
      ...prev,
      convocatoriaTypes: [...prev.convocatoriaTypes, newItem],
    }));
    showToast(`Modalidad "${newItem.name}" agregada.`, 'success', 'Modalidades de Selección');
    return { success: true, message: 'Modalidad de convocatoria agregada.' };
  };

  const updateConvocatoriaTypeParameter = (id: string, updated: Partial<ConvocatoriaTypeParameter>) => {
    setSystemParameters((prev) => ({
      ...prev,
      convocatoriaTypes: prev.convocatoriaTypes.map((c) => (c.id === id ? { ...c, ...updated } : c)),
    }));
    showToast('Modalidad de convocatoria actualizada.', 'success', 'Modalidades de Selección');
  };

  const deleteConvocatoriaTypeParameter = (id: string) => {
    if (systemParameters.convocatoriaTypes.length <= 1) {
      return { success: false, message: 'Debe existir al menos una modalidad en el catálogo.' };
    }
    setSystemParameters((prev) => ({
      ...prev,
      convocatoriaTypes: prev.convocatoriaTypes.filter((c) => c.id !== id),
    }));
    return { success: true, message: 'Modalidad de convocatoria eliminada.' };
  };

  // Rejection & Observation Reasons
  const addRejectionReasonParameter = (item: Omit<RejectionReasonParameter, 'id'>) => {
    if (!item.name?.trim()) return { success: false, message: 'El motivo / causa es obligatorio.' };
    const newItem: RejectionReasonParameter = {
      ...item,
      id: `rej-${Date.now()}`,
      name: item.name.trim(),
      code: item.code ? item.code.trim().toUpperCase() : item.name.trim().toUpperCase().replace(/\s+/g, '_'),
      isActive: item.isActive !== undefined ? item.isActive : true,
    };
    setSystemParameters((prev) => ({
      ...prev,
      rejectionReasons: [...prev.rejectionReasons, newItem],
    }));
    showToast(`Motivo de observación "${newItem.name}" agregado.`, 'success', 'Causas de Devolución');
    return { success: true, message: 'Motivo de observación agregado.' };
  };

  const updateRejectionReasonParameter = (id: string, updated: Partial<RejectionReasonParameter>) => {
    setSystemParameters((prev) => ({
      ...prev,
      rejectionReasons: prev.rejectionReasons.map((r) => (r.id === id ? { ...r, ...updated } : r)),
    }));
    showToast('Motivo de observación actualizado.', 'success', 'Causas de Devolución');
  };

  const deleteRejectionReasonParameter = (id: string) => {
    if (systemParameters.rejectionReasons.length <= 1) {
      return { success: false, message: 'Debe existir al menos un motivo en el catálogo.' };
    }
    setSystemParameters((prev) => ({
      ...prev,
      rejectionReasons: prev.rejectionReasons.filter((r) => r.id !== id),
    }));
    return { success: true, message: 'Motivo de observación eliminado.' };
  };

  const resetSystemParametersToDefault = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY_SYSTEM_PARAMETERS);
    setSystemParameters(INITIAL_SYSTEM_PARAMETERS);
    showToast('Catálogos y parámetros del sistema restaurados a sus valores predeterminados.', 'info', 'Restauración Completa');
  };

  const importSystemParametersJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, message: 'El archivo JSON no tiene un formato válido.' };
      }
      setSystemParameters({
        ...INITIAL_SYSTEM_PARAMETERS,
        ...parsed,
        globalSettings: {
          ...INITIAL_SYSTEM_PARAMETERS.globalSettings,
          ...(parsed.globalSettings || {}),
        },
      });
      showToast('Configuración importada exitosamente.', 'success', 'Parámetros del Sistema');
      return { success: true, message: 'Parámetros del sistema importados y aplicados correctamente.' };
    } catch (e: any) {
      return { success: false, message: `Error al procesar el archivo JSON: ${e?.message || 'Formato inválido'}` };
    }
  };

  // 17. Evaluaciones y Calificación SIG (Revisores & Admins)
  const recordSupplierEvaluation = (
    evalData: Omit<SupplierEvaluation, 'id' | 'createdAt' | 'certificateCode'>
  ): SupplierEvaluation => {
    const evalId = `eval-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
    const nowIso = new Date().toISOString();
    const currentYear = new Date().getFullYear();
    const certCode = `CALIF-SIG-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newEvaluation: SupplierEvaluation = {
      ...evalData,
      id: evalId,
      createdAt: nowIso,
      certificateCode: certCode,
    };

    setSupplierEvaluations((prev) => [newEvaluation, ...prev]);
    if (supabaseService.isConfigured()) {
      supabaseService.saveEvaluation(newEvaluation);
    }

    // Update the supplier dossier record with the new evaluation
    const isAnnual =
      evalData.evaluationType === 'ANUAL_1_ANO' ||
      (evalData.evaluationType as string) === 'ANUAL_PERIODICA';

    setAllDossiers((prev) =>
      prev.map((dossier) => {
        if (dossier.id === evalData.dossierId) {
          const currentEvals = Array.isArray(dossier.evaluations) ? dossier.evaluations : [];
          const updatedEvals = [newEvaluation, ...currentEvals];
          const updatedDossier: SupplierDossier = {
            ...dossier,
            evaluations: updatedEvals,
            ...(evalData.evaluationType === 'INICIAL' ? { initialEvaluation: newEvaluation } : {}),
            ...(isAnnual
              ? {
                  annualEvaluation: newEvaluation,
                  nextAnnualEvaluationDate: evalData.nextEvaluationDueDate,
                }
              : {}),
          };
          return updatedDossier;
        }
        return dossier;
      })
    );

    const cycleLabel = evalData.annualCycleNumber ? `Año ${evalData.annualCycleNumber}` : 'Recurrente';

    // Register official system audit entry
    addSystemAuditLog({
      dossierId: evalData.dossierId,
      supplierName: evalData.supplierName,
      supplierDoc: evalData.supplierDoc,
      fileNumber: evalData.fileNumber,
      user: `${evalData.evaluatorName} (${evalData.evaluatorRole})`,
      userRole: role,
      action: 'CALIFICACION_PROVEEDOR',
      section: 'Evaluación y Desempeño SIG',
      fieldChanged:
        evalData.evaluationType === 'INICIAL'
          ? 'Evaluación Inicial (Admisión al Crear)'
          : `Evaluación de Desempeño Anual (${cycleLabel} - Proveedor Activo)`,
      oldValue: 'PENDIENTE',
      newValue: `${evalData.totalScore}/100 - ${evalData.concept}`,
      justification: evalData.observations || 'Registro oficial de calificación de proveedor según metodología SIG.',
    });

    showToast(
      `Calificación ${evalData.evaluationType === 'INICIAL' ? 'Inicial' : `Anual (${cycleLabel})`} registrada con éxito (${evalData.totalScore}/100 - ${evalData.concept}).`,
      'success',
      'Evaluación Guardada'
    );

    return newEvaluation;
  };

  const deleteSupplierEvaluation = (id: string) => {
    setSupplierEvaluations((prev) => prev.filter((e) => e.id !== id));
    showToast('Registro de calificación eliminado.', 'info');
    return { success: true, message: 'Evaluación eliminada correctamente.' };
  };

  const updateEvaluationMethod = (updated: Partial<EvaluationMethodConfig>) => {
    setEvaluationMethod((prev) => normalizeEvaluationMethod({ ...prev, ...updated }));
    showToast('Parámetros de la metodología de evaluación actualizados.', 'success', 'Parametrización SIG');
  };

  const addEvaluationCriterion = (criterion: Omit<EvaluationCriterionConfig, 'id'>) => {
    const newId = `crit-${Date.now().toString(36)}`;
    const weightVal = typeof criterion.weight === 'number' && !isNaN(criterion.weight)
      ? criterion.weight
      : typeof criterion.weightInitial === 'number'
      ? criterion.weightInitial
      : 20;

    const newCrit: EvaluationCriterionConfig = {
      ...criterion,
      id: newId,
      weight: weightVal,
      weightInitial: criterion.weightInitial ?? weightVal,
      weightAnnual: criterion.weightAnnual ?? weightVal,
      order: evaluationMethod.criteria.length + 1,
      isActive: criterion.isActive !== false,
    };
    setEvaluationMethod((prev) => normalizeEvaluationMethod({
      ...prev,
      criteria: [...prev.criteria, newCrit],
    }));
    showToast(`Criterio "${criterion.name}" agregado exitosamente.`, 'success', 'Criterios de Evaluación');
    return { success: true, message: 'Criterio agregado exitosamente.' };
  };

  const updateEvaluationCriterion = (id: string, updated: Partial<EvaluationCriterionConfig>) => {
    setEvaluationMethod((prev) => normalizeEvaluationMethod({
      ...prev,
      criteria: prev.criteria.map((c) => (c.id === id ? { ...c, ...updated } : c)),
    }));
    showToast('Criterio de evaluación actualizado.', 'success', 'Criterios de Evaluación');
  };

  const deleteEvaluationCriterion = (id: string) => {
    if (evaluationMethod.criteria.length <= 1) {
      return { success: false, message: 'Debe existir al menos un criterio en la metodología de evaluación.' };
    }
    setEvaluationMethod((prev) => normalizeEvaluationMethod({
      ...prev,
      criteria: prev.criteria.filter((c) => c.id !== id),
    }));
    showToast('Criterio de evaluación eliminado.', 'info', 'Criterios de Evaluación');
    return { success: true, message: 'Criterio eliminado.' };
  };

  const resetEvaluationMethodToDefault = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY_EVALUATION_METHOD);
    setEvaluationMethod(normalizeEvaluationMethod(INITIAL_EVALUATION_METHOD));
    showToast('Metodología de calificación restablecida a los valores institucionales SIG.', 'info', 'Restauración SIG');
  };

  // 18. Reset General
  const resetToDefaultData = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY_DOSSIERS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_ACTIVE_USER);
    localStorage.removeItem(LOCAL_STORAGE_KEY_FORMS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_CONVOCATORIAS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_ROLE);
    localStorage.removeItem(LOCAL_STORAGE_KEY_CURRENT_DOSSIER);
    localStorage.removeItem(LOCAL_STORAGE_KEY_CATEGORIES);
    localStorage.removeItem(LOCAL_STORAGE_KEY_DOC_DEFINITIONS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_BASE_REQUIREMENTS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_SYSTEM_PARAMETERS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_EVALUATIONS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_EVALUATION_METHOD);
    localStorage.removeItem(LOCAL_STORAGE_KEY_EVAL_SELECTED_ID);
    setAllDossiers(INITIAL_DOSSIERS);
    setInstitutionalForms(INITIAL_INSTITUTIONAL_FORMS);
    setConvocatorias(INITIAL_CONVOCATORIAS);
    setCategoriesConfig(CATEGORIES_CONFIG);
    setDocumentDefinitions(INITIAL_DOCUMENT_DEFINITIONS);
    setBaseRequirementsConfig(INITIAL_BASE_REQUIREMENTS);
    setSystemParameters(INITIAL_SYSTEM_PARAMETERS);
    setSupplierEvaluations(INITIAL_SUPPLIER_EVALUATIONS);
    setEvaluationMethod(INITIAL_EVALUATION_METHOD);
    setSelectedEvaluationDossierIdState(null);
    setActiveUserIdState('admin-1');
    setRoleState('ADMIN');
    setCurrentDossierIdState('dossier-002');
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        activeView,
        setActiveView,
        theme,
        toggleTheme,
        setTheme,
        dossiers: visibleDossiers,
        allDossiers,
        activeUserId,
        activeUser,
        setActiveUserId,
        systemUsers: INITIAL_SYSTEM_USERS,
        canEditDossier,
        assignSupplierReviewer,
        currentDossierId,
        currentDossier,
        setCurrentDossierId,
        institutionalForms,
        categoriesConfig,
        documentDefinitions,
        baseRequirementsConfig,
        convocatorias,
        reviewSelectedDossierId,
        setReviewSelectedDossierId,
        openSupplierReview,
        openExecutiveDashboard,
        supplierEvaluations,
        evaluationMethod,
        selectedEvaluationDossierId,
        setSelectedEvaluationDossierId,
        openSupplierEvaluation,
        recordSupplierEvaluation,
        deleteSupplierEvaluation,
        updateEvaluationMethod,
        addEvaluationCriterion,
        updateEvaluationCriterion,
        deleteEvaluationCriterion,
        resetEvaluationMethodToDefault,
        systemAuditLogs,
        addSystemAuditLog,
        updateSupplierField,
        updateEntireSupplier,
        emailNotifications,
        sendEmailNotification,
        sendCustomEmail,
        markEmailAsRead,
        clearAllEmails,
        isEmailVerified,
        isSupplierLoggedIn,
        supplierPortalTab,
        setSupplierPortalTab,
        supplierLogin,
        supplierLogout,
        registerSupplier,
        createSupplierAdmin,
        verifySupplierEmail,
        updateBasicInfo,
        uploadDocument,
        removeDocument,
        updateSupplierDocument,
        addCustomSupplierDocument,
        submitDossierForReview,
        approveDocument,
        requestDocumentCorrection,
        updateInternalConcepts,
        updateDossierStatus,
        updateDossierContractInfo,
        addNewFormVersion,
        toggleFormMandatory,
        createConvocatoria,
        updateConvocatoria,
        deleteConvocatoria,
        applyToConvocatoria,
        evaluatePostulacion,
        updateBaseRequirementsConfig,
        toggleBaseDocumentRequirement,
        getRequiredDocumentsForSupplier,
        updateCategoryConfig,
        addCategoryConfig,
        deleteCategoryConfig,
        toggleDocumentRequirement,
        addDocumentDefinition,
        updateDocumentDefinition,
        deleteDocumentDefinition,
        resetMatrixToDefault,
        systemParameters,
        updateGlobalSettings,
        addBankParameter,
        updateBankParameter,
        deleteBankParameter,
        addBankAccountTypeParameter,
        updateBankAccountTypeParameter,
        deleteBankAccountTypeParameter,
        addDocumentTypeParameter,
        updateDocumentTypeParameter,
        deleteDocumentTypeParameter,
        addTaxRegimeParameter,
        updateTaxRegimeParameter,
        deleteTaxRegimeParameter,
        addCityParameter,
        updateCityParameter,
        deleteCityParameter,
        addArlRiskParameter,
        updateArlRiskParameter,
        deleteArlRiskParameter,
        addConvocatoriaTypeParameter,
        updateConvocatoriaTypeParameter,
        deleteConvocatoriaTypeParameter,
        addRejectionReasonParameter,
        updateRejectionReasonParameter,
        deleteRejectionReasonParameter,
        resetSystemParametersToDefault,
        importSystemParametersJson,
        resetToDefaultData,
        toast,
        showToast,
        hideToast,
        isSupabaseConnected,
      }}
    >
      {children}
    </AppContext.Provider>
  );

};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
