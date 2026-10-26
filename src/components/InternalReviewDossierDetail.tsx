import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  User,
  Building2,
  FileText,
  Eye,
  Download,
  Send,
  HelpCircle,
  FileCheck,
  Search,
  Filter,
  CheckSquare,
  XSquare,
  MessageSquare,
  History,
  ArrowLeft,
  Calendar,
  Mail,
  Inbox,
  ExternalLink,
  Edit3,
  Plus,
  FileUp,
  X,
  Award,
  Briefcase,
  Layers,
  ShieldAlert,
  RefreshCw,
  MapPin,
  Tag,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  SupplierDossier,
  SupplierDocument,
  ProcessStatus,
  DocumentCorrection,
  DocumentStatus,
  EmailNotification,
} from '../types';
import { DOCUMENT_CATALOG_INFO } from '../data/initialData';
import { InstitutionalFormsViewerModal } from './InstitutionalFormsViewerModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { EmailModalViewer } from './EmailModalViewer';
import { SendCustomEmailModal } from './SendCustomEmailModal';
import { SupplierDataEditorTab } from './SupplierDataEditorTab';
import { DocumentEditorModal } from './DocumentEditorModal';
import { AddCustomDocumentModal } from './AddCustomDocumentModal';
import { SupplierCertificateModal } from './SupplierCertificateModal';
import { ManualStatusChangeModal } from './dossier/ManualStatusChangeModal';
import {
  calculateContractValidity,
  calculateDocumentExpiration,
  getDossierDocumentExpirationSummary,
  getProcessStatusLabel,
  getDossierEffectiveStatus,
  getCreationStatus,
  getContractualStatus,
} from '../utils/contractValidity';
import { SupplierContractInfo } from '../types';

interface Props {
  dossierId: string;
  onBack: () => void;
}

export const InternalReviewDossierDetail: React.FC<Props> = ({ dossierId, onBack }) => {
  const {
    role,
    dossiers,
    approveDocument,
    requestDocumentCorrection,
    updateSupplierDocument,
    addCustomSupplierDocument,
    updateInternalConcepts,
    updateDossierStatus,
    institutionalForms,
    emailNotifications,
    systemAuditLogs,
    sendCustomEmail,
    markEmailAsRead,
    categoriesConfig,
    documentDefinitions,
    getRequiredDocumentsForSupplier,
    showToast,
  } = useApp();

  const dossier = dossiers.find((d) => d.id === dossierId);

  const getDocInstitutionalName = (docCode: string, fallbackName?: string) => {
    const docDef = (documentDefinitions || []).find((d) => d.code === docCode);
    if (docDef && docDef.name) return docDef.name;
    const cat = DOCUMENT_CATALOG_INFO[docCode];
    if (cat && cat.name) return cat.name;
    return fallbackName || docCode;
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [dossierId]);

  const [activeTab, setActiveTab] = useState<'datos' | 'contrato' | 'documentos' | 'listas' | 'auditoria' | 'correos'>('datos');
  const [selectedFormForModal, setSelectedFormForModal] = useState<any>(null);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [isManualStatusModalOpen, setIsManualStatusModalOpen] = useState(false);

  // Email Viewer & Sender Modals
  const [selectedEmailForView, setSelectedEmailForView] = useState<EmailNotification | null>(null);
  const [isEmailViewerOpen, setIsEmailViewerOpen] = useState(false);
  const [isComposeEmailOpen, setIsComposeEmailOpen] = useState(false);

  // Document Editing & Creation Modals
  const [isDocEditorOpen, setIsDocEditorOpen] = useState(false);
  const [editingDocCode, setEditingDocCode] = useState<string>('');
  const [editingDocObj, setEditingDocObj] = useState<SupplierDocument | null>(null);
  const [editingDocTitle, setEditingDocTitle] = useState<string>('');
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);

  // Document Preview Modal State
  const [isPreviewDocOpen, setIsPreviewDocOpen] = useState(false);
  const [previewDocObj, setPreviewDocObj] = useState<SupplierDocument | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>('');
  const [previewDocCode, setPreviewDocCode] = useState<string>('');

  const handleOpenDocPreview = (doc: SupplierDocument, title?: string, code?: string) => {
    setPreviewDocObj(doc);
    setPreviewDocTitle(title || doc.name);
    setPreviewDocCode(code || doc.code || '');
    setIsPreviewDocOpen(true);
  };

  // Correction Request Modal State
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [targetDocCode, setTargetDocCode] = useState('');
  const [targetDocName, setTargetDocName] = useState('');
  const [correctionReason, setCorrectionReason] = useState('Información bancaria incompleta');
  const [correctionSection, setCorrectionSection] = useState('Numeral III (Información Bancaria)');
  const [correctionDetail, setCorrectionDetail] = useState('');
  const [reviewerName, setReviewerName] = useState('Comité de Compras Flota Sugamuxi');

  // Official Certificate Modal State
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);


  if (!dossier) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-600">Expediente no encontrado.</p>
        <button onClick={onBack} className="mt-3 px-4 py-2 bg-slate-800 text-white rounded text-xs">
          Volver a la lista
        </button>
      </div>
    );
  }

  const isNatural = dossier.basicInfo.supplierType === 'NATURAL';
  const supplierName = isNatural ? dossier.basicInfo.fullName : dossier.basicInfo.companyName;
  const supplierDoc = isNatural ? dossier.basicInfo.documentNumber : dossier.basicInfo.nit;

  const supplierCategoryReqs = getRequiredDocumentsForSupplier
    ? getRequiredDocumentsForSupplier(dossier.basicInfo.supplierType, dossier.selectedCategory)
    : null;

  const institutionalDocKeys = ['FS_GA_FOR_009', 'FS_GA_FOR_039'];
  const doc009 = (dossier.documents || {})['FS_GA_FOR_009'];
  const doc039 = (dossier.documents || {})['FS_GA_FOR_039'];
  const institutionalApprovedCount = [doc009, doc039].filter((d) => d && d.status === 'APROBADO').length;
  const institutionalTotalCount = 2;

  // Recopilar todos los códigos exigidos por la matriz + cualquier soporte ya adjunto
  const matrixMandatoryCodes = supplierCategoryReqs?.allMandatory || [];
  const matrixOptionalCodes = supplierCategoryReqs?.allOptional || [];
  const matrixSupportCodes = Array.from(new Set([...matrixMandatoryCodes, ...matrixOptionalCodes]));
  const customSupportCodes = Object.keys(dossier.documents || {}).filter(
    (code) => !institutionalDocKeys.includes(code) && !matrixSupportCodes.includes(code)
  );

  // Función de ordenamiento canónico de acuerdo a la Matriz de Requisitos Específicos por Actividad Económica
  const getMatrixDocOrderIndex = (code: string): number => {
    // 1. Posición en el catálogo maestro de tipos documentales (orden en que fueron parametrizados/creados)
    const defIdx = (documentDefinitions || []).findIndex((d) => d.code === code);
    if (defIdx !== -1) return defIdx;

    // 2. Posición en la matriz de la actividad económica específica
    const catMand = isNatural
      ? currentCatConfig?.mandatoryForNatural || []
      : currentCatConfig?.mandatoryForJuridica || [];
    const actIdx = catMand.indexOf(code);
    if (actIdx !== -1) return 2000 + actIdx;

    const catOpt = isNatural
      ? currentCatConfig?.optionalForNatural || []
      : currentCatConfig?.optionalForJuridica || [];
    const optIdx = catOpt.indexOf(code);
    if (optIdx !== -1) return 3000 + optIdx;

    return 9999;
  };

  // Organizar todos los soportes estrictamente en el orden parametrizado y creado en la Matriz de Requisitos (documentDefinitions)
  const allSupportCodes = Array.from(
    new Set([...matrixMandatoryCodes, ...matrixOptionalCodes, ...customSupportCodes])
  ).sort((a, b) => {
    const idxA = getMatrixDocOrderIndex(a);
    const idxB = getMatrixDocOrderIndex(b);
    if (idxA !== idxB) return idxA - idxB;
    return a.localeCompare(b);
  });

  const supportDocsList: [string, SupplierDocument][] = allSupportCodes.map((code) => {
    const existing = (dossier.documents || {})[code];
    const docDef = (documentDefinitions || []).find((d) => d.code === code);
    const catalog = DOCUMENT_CATALOG_INFO[code];
    const isMandatory = matrixMandatoryCodes.includes(code) || Boolean(existing?.isRequired);
    const docName = docDef?.name || existing?.name || catalog?.name || code;

    if (existing) {
      return [
        code,
        {
          ...existing,
          name: docName,
          isRequired: isMandatory,
        },
      ];
    }

    return [
      code,
      {
        id: `doc-${dossier.id}-${code.toLowerCase()}`,
        code,
        name: docName,
        isRequired: isMandatory,
        isInstitutionalForm: false,
        status: 'PENDIENTE',
      },
    ];
  });

  const mandatorySupportCount = supportDocsList.filter(([_, d]) => d.isRequired).length;
  const supportApprovedCount = supportDocsList.filter(([_, d]) => d.isRequired && d.status === 'APROBADO').length;
  const supportTotalCount = mandatorySupportCount;

  const totalMandatoryDocs = institutionalTotalCount + mandatorySupportCount;
  const approvedDocsCount = institutionalApprovedCount + supportApprovedCount;
  const allDocumentsApproved = totalMandatoryDocs > 0 && approvedDocsCount >= totalMandatoryDocs;
  const totalDocs = totalMandatoryDocs;

  // Estado efectivo resolviendo: 1. Cambio manual con motivo, 2. Vigencia de contrato, 3. Cumplimiento documental
  const effectiveStatus: ProcessStatus = getDossierEffectiveStatus(dossier);
  const contractValidity = calculateContractValidity(dossier.contractInfo?.endDate);
  const creationStatus = getCreationStatus(dossier);
  const contractualStatus = getContractualStatus(dossier);
  const expSummary = getDossierDocumentExpirationSummary(dossier);

  const renderCreationBadge = () => {
    switch (creationStatus.status) {
      case 'DOCUMENTACION_VENCIDA':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-900 text-white border border-slate-700 shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-300" />
            <span>Documentación Vencida ({creationStatus.expiredCount} expirados)</span>
          </span>
        );
      case 'DOCUMENTACION_POR_VENCER':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-300 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-blue-700" />
            <span>Habilitado ({creationStatus.expiringSoonCount} por vencer ≤30d)</span>
          </span>
        );
      case 'PROVEEDOR_HABILITADO':
      case 'APROBADO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-900 text-white dark:bg-blue-950 dark:text-cyan-300 border border-blue-700 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
            <span>Proveedor Habilitado (100% Homologado)</span>
          </span>
        );
      case 'EN_REVISION':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>En Revisión Técnica</span>
          </span>
        );
      case 'CORREGIDO_EN_REVISION':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-sky-50 text-sky-900 border border-sky-200">
            <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
            <span>Subsanado — En Revisión</span>
          </span>
        );
      case 'REQUIERE_CORRECCION':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
            <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Requiere Corrección</span>
          </span>
        );
      case 'RECHAZADO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-100 border border-slate-700">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            <span>Rechazado (No Conforme)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Documentación Pendiente</span>
          </span>
        );
    }
  };

  const renderContractualBadge = () => {
    switch (contractualStatus.status) {
      case 'VIGENTE':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-950 border border-blue-200 shadow-2xs dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-800">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
            <span>Contrato Vigente ({contractualStatus.daysRemaining}d restantes)</span>
          </span>
        );
      case 'POR_VENCER':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
            <span>Por Vencer ({contractualStatus.daysRemaining}d restantes)</span>
          </span>
        );
      case 'VENCIDO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            <AlertCircle className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>Contrato Vencido</span>
          </span>
        );
      case 'SUSPENDIDO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            <span>Contrato Suspendido</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            <span>Sin Contrato Activo</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: ProcessStatus) => {
    switch (status) {
      case 'CONTRATO_VIGENTE':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-950 border border-blue-200 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
            <span>Contrato Vigente (Activo)</span>
          </span>
        );
      case 'CONTRATO_POR_VENCER':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-blue-700" />
            <span>Contrato Próximo a Vencer (≤30d)</span>
          </span>
        );
      case 'CONTRATO_VENCIDO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
            <AlertCircle className="w-3.5 h-3.5 text-slate-600" />
            <span>Contrato Vencido</span>
          </span>
        );
      case 'SUSPENDIDO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-200 text-slate-800 border border-slate-300">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
            <span>Suspendido</span>
          </span>
        );
      case 'PROVEEDOR_HABILITADO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-950 border border-blue-200 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Proveedor Habilitado (Homologado)</span>
          </span>
        );
      case 'APROBADO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Aprobado</span>
          </span>
        );
      case 'EN_REVISION':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>En Revisión Técnica</span>
          </span>
        );
      case 'CORREGIDO_EN_REVISION':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-sky-50 text-sky-900 border border-sky-200">
            <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
            <span>Subsanado</span>
          </span>
        );
      case 'REQUIERE_CORRECCION':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
            <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Requiere Corrección</span>
          </span>
        );
      case 'DOCUMENTACION_PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Documentación Pendiente</span>
          </span>
        );
      case 'DOCUMENTACION_VENCIDA':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-900 text-white border border-slate-700 shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-300" />
            <span>Documentación Vencida (Inhabilitado)</span>
          </span>
        );
      case 'DOCUMENTACION_POR_VENCER':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-300 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-blue-700" />
            <span>Documentación Próxima a Vencer (≤30d)</span>
          </span>
        );
      case 'RECHAZADO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
            <span>No Habilitado</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {getProcessStatusLabel(status)}
          </span>
        );
    }
  };

  const form009 = institutionalForms.find((f) => f.code === 'FS.GA-FOR-009');
  const form039 = institutionalForms.find((f) => f.code === 'FS.GA-FOR-039');

  const currentCatConfig = categoriesConfig?.find(
    (c) => c.category === dossier.selectedCategory
  );

  const handleOpenEditDocModal = (code: string, doc: SupplierDocument, title?: string) => {
    setEditingDocCode(code);
    setEditingDocObj(doc);
    setEditingDocTitle(title || doc.name);
    setIsDocEditorOpen(true);
  };

  const handleSaveDocEdit = (
    code: string,
    updates: {
      name?: string;
      fileName?: string;
      fileSize?: string;
      customUrl?: string;
      status?: DocumentStatus;
      expirationDate?: string;
      notes?: string;
    },
    justification: string
  ) => {
    updateSupplierDocument(dossier.id, code, updates, reviewerName, role, justification);
  };

  const handleAddCustomDoc = (newDoc: SupplierDocument, justification: string) => {
    addCustomSupplierDocument(dossier.id, newDoc, reviewerName, role, justification);
  };

  const handleOpenCorrectionModal = (docCode: string, docName: string) => {
    setTargetDocCode(docCode);
    setTargetDocName(docName);
    if (docCode === 'FS_GA_FOR_009') {
      setCorrectionReason('Información bancaria incompleta en el numeral III');
      setCorrectionSection('Numeral III (Información Bancaria)');
      setCorrectionDetail('Por favor completar la información correspondiente a la entidad bancaria en el numeral III.');
    } else if (docCode === 'CERTIFICACION_BANCARIA') {
      setCorrectionReason('Antigüedad superior a la permitida');
      setCorrectionSection('Documento soporte');
      setCorrectionDetail('El documento presentado supera la antigüedad permitida (máximo 30 días).');
    } else {
      setCorrectionReason('Documento ilegible o incompleto');
      setCorrectionSection('Página principal');
      setCorrectionDetail('Por favor adjuntar archivo PDF con mayor resolución y firmas legibles.');
    }
    setIsCorrectionModalOpen(true);
  };

  const handleConfirmCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionDetail.trim()) {
      alert('Por favor ingrese la observación detallada.');
      return;
    }

    const correction: DocumentCorrection = {
      reason: correctionReason,
      sectionOrPage: correctionSection,
      detailedObservation: correctionDetail.trim(),
      requestedAt: new Date() ? new Date().toLocaleString('es-CO') : new Date().toISOString(),
      requestedBy: reviewerName,
    };

    requestDocumentCorrection(dossier.id, targetDocCode, correction);
    setIsCorrectionModalOpen(false);
  };

  const handleApproveDoc = (docCode: string) => {
    approveDocument(dossier.id, docCode, reviewerName);
  };

  const handleCheckRestrictiveList = (type: 'sarlaft' | 'ofac' | 'procuraduria') => {
    const timestamp = new Date().toISOString().split('T')[0];
    if (type === 'sarlaft') {
      updateInternalConcepts(dossier.id, {
        sarlatfCheck: {
          checked: true,
          result: 'SIN_COINCIDENCIAS',
          checkedBy: reviewerName,
          checkedAt: timestamp,
          notes: 'Consulta automática en listas vinculantes nacionales efectuada con éxito.',
        },
      });
    } else if (type === 'ofac') {
      updateInternalConcepts(dossier.id, {
        ofacCheck: {
          checked: true,
          result: 'LIMPIO',
          checkedBy: reviewerName,
          checkedAt: timestamp,
        },
      });
    } else {
      updateInternalConcepts(dossier.id, {
        procuraduriaPoliciaCheck: {
          checked: true,
          result: 'VIGENTE_SIN_ANTECEDENTES',
          checkedBy: reviewerName,
          checkedAt: timestamp,
        },
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4 animate-in fade-in">
      
      {/* 1. Header Banner Estandarizado y Limpio */}
      <div className="bg-white text-slate-900 rounded-xl p-3 sm:p-4 border border-slate-200 shadow-xs relative dark:bg-[#0b1329] dark:text-white dark:border-slate-800">
        {/* Top Control Bar: Navigation + Meta Information + Reviewer */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5 flex-wrap text-xs text-slate-500 dark:text-slate-400">
            <button
              onClick={onBack}
              className="font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer dark:text-slate-300 dark:hover:text-white dark:bg-slate-800/90 dark:hover:bg-slate-700 dark:border-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span>Volver</span>
            </button>

            <span className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:inline-block" />

            <span className="font-semibold text-slate-600 dark:text-slate-300">
              Expediente:
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-xs">
              {dossier.fileNumber}
            </span>

            <span className="hidden md:inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <span>•</span>
              <span>Radicado:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{dossier.submittedAt || dossier.createdAt}</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="reviewerInput" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Revisor:
            </label>
            <input
              id="reviewerInput"
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="text-xs font-medium px-2.5 py-1 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white w-44 sm:w-56 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              title="Nombre del revisor para auditoría y trazabilidad"
            />
          </div>
        </div>

        {/* Main Header Content: Full Supplier Title & Clear Metadata + Action Toolbar + Organized Status Cards */}
        <div className="pt-1.5 space-y-2.5">
          {/* Row 1: Company Title, Badges & Action Toolbar */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight break-words tracking-tight">
                {supplierName}
              </h1>
              
              {/* Clean, Non-saturated Metadata line with Icons */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full border ${
                    (dossier.supplierTier || dossier.basicInfo.supplierTier || 'B') === 'A'
                      ? 'bg-blue-950 text-white border-blue-900 dark:bg-blue-900 dark:text-cyan-300 dark:border-blue-700'
                      : (dossier.supplierTier || dossier.basicInfo.supplierTier || 'B') === 'B'
                      ? 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:text-cyan-300 dark:border-blue-900/60'
                      : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  }`}
                >
                  Tipo {dossier.supplierTier || dossier.basicInfo.supplierTier || 'B'} &bull;{' '}
                  {(dossier.supplierTier || dossier.basicInfo.supplierTier || 'B') === 'A'
                    ? 'Crítico'
                    : (dossier.supplierTier || dossier.basicInfo.supplierTier || 'B') === 'B'
                    ? 'Operativo'
                    : 'Estándar'}
                </span>

                <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 font-medium text-[11px]">
                  {isNatural ? <User className="w-3 h-3 text-slate-500" /> : <Building2 className="w-3 h-3 text-slate-500" />}
                  <span>{isNatural ? 'Persona Natural' : 'Persona Jurídica'}</span>
                </span>

                <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 font-mono font-semibold text-[11px]">
                  <span className="text-slate-400 font-sans font-normal">NIT:</span>
                  <span>{supplierDoc}</span>
                </span>

                {dossier.basicInfo.city && (
                  <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 font-medium text-[11px]">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{dossier.basicInfo.city}</span>
                  </span>
                )}

                {dossier.selectedCategory && (
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/60 font-semibold text-[11px]">
                    <Tag className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span>{dossier.selectedCategory}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Primary Actions: Grouped, Aligned Toolbar with Consistent Height and Hierarchy */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 self-start xl:self-center">
              {allDocumentsApproved && !expSummary.hasExpiredDocs ? (
                <button
                  type="button"
                  onClick={() => setIsCertificateModalOpen(true)}
                  className="h-8 px-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-xs hover:shadow cursor-pointer"
                  title="Ficha Oficial & Certificado de Proveedor Habilitado disponible (100% documentos aprobados y vigentes)"
                >
                  <Award className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Ficha Oficial & Certificado</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="h-8 px-3 bg-slate-100 text-slate-400 font-medium text-xs rounded-lg flex items-center gap-1.5 border border-slate-200 cursor-not-allowed dark:bg-slate-800/60 dark:text-slate-500 dark:border-slate-700 opacity-85"
                  title={
                    expSummary.hasExpiredDocs
                      ? `Certificado bloqueado: El proveedor posee ${expSummary.expiredCount} documento(s) vencido(s). Debe actualizar soportes para rehabilitarse.`
                      : `Certificado bloqueado: Requiere que todos los documentos (${approvedDocsCount}/${totalDocs}) estén en estado APROBADO.`
                  }
                >
                  <Award className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>
                    Ficha & Certificado{' '}
                    {expSummary.hasExpiredDocs ? '(Bloqueado)' : `(${approvedDocsCount}/${totalDocs})`}
                  </span>
                </button>
              )}

              {(role === 'ADMIN' || role === 'REVISOR') && (
                <button
                  type="button"
                  onClick={() => setIsManualStatusModalOpen(true)}
                  className="h-8 px-3 bg-[#0b1329] hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-xs hover:shadow cursor-pointer border border-blue-900 dark:border-slate-700"
                  title="Gestionar estado por vigencia de contrato o registrar cambio manual con motivo / observación"
                >
                  <Briefcase className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Gestionar Estado & Contrato</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsComposeEmailOpen(true)}
                className="h-8 px-3 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors border border-slate-300 cursor-pointer shadow-2xs dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700"
                title="Redactar correo oficial al proveedor"
              >
                <Mail className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Redactar Correo</span>
              </button>
            </div>
          </div>

          {/* Row 2: Status & Contractual Intelligence Panel - Compact Balanced 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            {/* Dimensión 1: Estado de Creación (Homologación Documental) */}
            <div className="bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/80 rounded-xl px-3 py-2 flex flex-col justify-between gap-1.5 transition-all">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-cyan-300 text-[10px] font-black flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-slate-800 dark:text-slate-200 font-extrabold truncate">
                    Estado de Creación
                  </span>
                  <span className="hidden sm:inline text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    &bull; Homologación SIG
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                  {approvedDocsCount}/{totalDocs} Aprobados ({Math.round((approvedDocsCount / (totalDocs || 1)) * 100)}%)
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  {renderCreationBadge()}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {expSummary.hasExpiredDocs ? (
                    <span className="text-slate-900 dark:text-slate-100 font-bold flex items-center gap-1 text-[11px]">
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-700 dark:text-cyan-300" />
                      Inhabilitado preventivamente
                    </span>
                  ) : allDocumentsApproved ? (
                    <span className="text-blue-900 dark:text-cyan-300 font-semibold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
                      Expediente 100% conforme
                    </span>
                  ) : (
                    <span className="text-[11px]">
                      {totalDocs - approvedDocsCount} soporte(s) pendiente(s)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Dimensión 2: Vinculación Contractual por Objeto del Contrato */}
            <div className="bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/80 rounded-xl px-3 py-2 flex flex-col justify-between gap-1.5 transition-all">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-cyan-300 text-[10px] font-black flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-slate-800 dark:text-slate-200 font-extrabold truncate">
                    Vinculación Contractual
                  </span>
                  <span className="hidden sm:inline text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    &bull; Vigencia de Contrato
                  </span>
                </div>

                {(role === 'ADMIN' || role === 'REVISOR') && (
                  <button
                    type="button"
                    onClick={() => setIsManualStatusModalOpen(true)}
                    className="text-[10px] text-blue-700 dark:text-cyan-400 hover:text-blue-900 dark:hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs shrink-0"
                    title="Gestionar vigencia de contrato u observación de estado manual"
                  >
                    <Calendar className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
                    <span>{dossier.contractInfo?.contractNumber ? 'Editar Contrato' : '+ Vincular Contrato'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  {renderContractualBadge()}
                  {dossier.contractInfo?.contractNumber && (
                    <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
                      No. {dossier.contractInfo.contractNumber}
                    </span>
                  )}
                </div>

                {dossier.contractInfo?.objectDescription ? (
                  <div
                    className="text-[11px] text-slate-600 dark:text-slate-400 max-w-[280px] sm:max-w-[340px] truncate"
                    title={`Objeto completo: ${dossier.contractInfo.objectDescription}`}
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-200 mr-1">Objeto:</span>
                    <span className="italic">{dossier.contractInfo.objectDescription}</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">
                    Sin contrato marco vinculado
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Alertas Críticas y Preventivas de Vencimiento de Documentación - Compactadas */}
          {expSummary.hasExpiredDocs && (
            <div className="mt-2 bg-slate-50 dark:bg-[#0b1329] text-slate-900 dark:text-white border border-slate-300 dark:border-blue-900 rounded-xl px-3 py-2 text-xs flex items-center justify-between gap-3 shadow-xs flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <ShieldAlert className="w-4 h-4 text-blue-700 dark:text-cyan-300 shrink-0" />
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="text-xs font-black text-slate-900 dark:text-white shrink-0">
                    ALERTA: Requisitos Vencidos ({expSummary.expiredCount})
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 border border-slate-300 dark:bg-blue-900 dark:text-cyan-200 dark:border-blue-700 font-bold text-[9px] uppercase tracking-wider shrink-0">
                    Inhabilitado
                  </span>
                  <span className="text-slate-600 dark:text-blue-200/90 text-[11px] truncate max-w-md hidden md:inline">
                    {expSummary.expiredDocs.map(d => `${getDocInstitutionalName(d.code, d.name)} (${d.daysOverdue}d)`).join(', ')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('documentos')}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg shrink-0 transition-colors cursor-pointer shadow-xs"
              >
                Revisar Documentos
              </button>
            </div>
          )}

          {!expSummary.hasExpiredDocs && expSummary.hasExpiringSoonDocs && (
            <div className="mt-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs flex items-center justify-between gap-3 shadow-xs text-slate-900 dark:text-slate-100 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <Clock className="w-4 h-4 text-blue-700 dark:text-cyan-400 shrink-0" />
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="text-xs font-black text-slate-900 dark:text-white shrink-0">
                    ALERTA PREVENTIVA (≤30 días):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {expSummary.expiringSoonDocs.map((doc) => (
                      <span key={doc.code} className="inline-flex items-center gap-1 text-[11px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{getDocInstitutionalName(doc.code, doc.name)}</span>
                        <span className="text-slate-500 dark:text-slate-400">({doc.expirationDate})</span>
                        <span className="bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-cyan-300 px-1 rounded text-[10px] font-bold">
                          {doc.daysRemaining}d
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsComposeEmailOpen(true)}
                  className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  Notificar
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('documentos')}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Ver Documentos
                </button>
              </div>
            </div>
          )}

          {/* Institutional Alert: Manual Status Override Active */}
          {dossier.manualStatusOverride && (
            <div className="mt-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl p-3 text-xs flex items-start justify-between gap-3 text-blue-950 dark:text-blue-200">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-cyan-300 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold flex items-center gap-2 flex-wrap">
                    <span>Estado Establecido Manualmente:</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-cyan-300 font-mono text-[11px] font-extrabold">
                      {getProcessStatusLabel(dossier.processStatus)}
                    </span>
                    {dossier.manualStatusChangedBy && (
                      <span className="text-[11px] font-normal text-slate-600 dark:text-slate-400">
                        por <strong>{dossier.manualStatusChangedBy}</strong> {dossier.manualStatusChangedAt && `el ${dossier.manualStatusChangedAt}`}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-slate-700 dark:text-slate-300 text-[11px] bg-white/80 dark:bg-slate-900/60 p-2 rounded-lg border border-blue-100 dark:border-blue-900/30">
                    <span className="font-semibold text-slate-500">Motivo / Observación Registrada:</span> "{dossier.manualStatusReason || 'Sin observación registrada'}"
                  </p>
                </div>
              </div>
              {(role === 'ADMIN' || role === 'REVISOR') && (
                <button
                  type="button"
                  onClick={() => setIsManualStatusModalOpen(true)}
                  className="text-[11px] font-bold text-blue-700 dark:text-cyan-400 hover:underline shrink-0 cursor-pointer"
                >
                  Cambiar Estado
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden dark:bg-[#0b1329] dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 px-3 flex flex-wrap items-center gap-1">
          <button
            onClick={() => setActiveTab('datos')}
            className={`py-2.5 px-3.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'datos'
                ? 'border-blue-600 text-blue-900 bg-white dark:bg-[#0b1329] dark:text-blue-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Información del Proveedor</span>
          </button>
          <button
            onClick={() => setActiveTab('contrato')}
            className={`py-2.5 px-3.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'contrato'
                ? 'border-blue-600 text-blue-900 bg-white dark:bg-[#0b1329] dark:text-blue-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Vigencia & Contrato</span>
          </button>
          <button
            onClick={() => setActiveTab('documentos')}
            className={`py-2.5 px-3.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'documentos'
                ? 'border-blue-600 text-blue-900 bg-white dark:bg-[#0b1329] dark:text-blue-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Documentación ({Object.keys(dossier.documents).length})</span>
          </button>
          <button
            onClick={() => setActiveTab('listas')}
            className={`py-2.5 px-3.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'listas'
                ? 'border-blue-600 text-blue-900 bg-white dark:bg-[#0b1329] dark:text-blue-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Listas Restrictivas / SARLAFT</span>
          </button>
          <button
            onClick={() => setActiveTab('correos')}
            className={`py-2.5 px-3.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'correos'
                ? 'border-blue-600 text-blue-900 bg-white dark:bg-[#0b1329] dark:text-blue-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Notificaciones ({emailNotifications.filter((e) => e.dossierId === dossier.id).length})</span>
          </button>
          <button
            onClick={() => setActiveTab('auditoria')}
            className={`py-2.5 px-3.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'auditoria'
                ? 'border-blue-600 text-blue-900 bg-white dark:bg-[#0b1329] dark:text-blue-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Auditoría ({(systemAuditLogs || []).filter((l) => l.dossierId === dossier.id).length || (dossier.auditHistory || []).length})</span>
          </button>
        </div>

        {/* Tab 0: Supplier Data & Full Editing */}
        {activeTab === 'datos' && (
          <div className="p-4 sm:p-5">
            <SupplierDataEditorTab dossier={dossier} reviewerName={reviewerName} />
          </div>
        )}

        {/* Tab Contrato & Vigencia */}
        {activeTab === 'contrato' && (
          <div className="p-4 sm:p-5 space-y-5">
            {/* Header section with Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-700 dark:text-cyan-400" />
                  <span>Control de Vigencia Contractual y Estado Operativo</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Gestión del estado del proveedor según vigencia de contrato o mediante cambio manual motivado con observación registrada (ISO 9001 / SARLAFT).
                </p>
              </div>

              {(role === 'ADMIN' || role === 'REVISOR') && (
                <button
                  type="button"
                  onClick={() => setIsManualStatusModalOpen(true)}
                  className="px-4 py-2 bg-[#0b1329] hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2 transition-colors border border-blue-900 self-start sm:self-auto cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Actualizar Contrato / Modificar Estado</span>
                </button>
              )}
            </div>

            {/* Status Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Estado Efectivo */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Estado Operativo Actual
                </span>
                <div className="pt-1">
                  {getStatusBadge(effectiveStatus)}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  {dossier.manualStatusOverride
                    ? 'Determinado manualmente por el comité con justificación registrada.'
                    : dossier.contractInfo?.contractNumber
                    ? 'Sincronizado automáticamente con la vigencia del contrato formal.'
                    : 'Determinado por la verificación de documentos cargados.'}
                </p>
              </div>

              {/* Card 2: Vigencia de Contrato */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Vigencia Contractual
                </span>
                <div className="flex items-center gap-2 pt-1">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${contractValidity.badgeClass}`}>
                    {contractValidity.label}
                  </span>
                  {contractValidity.daysRemaining !== null && (
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-mono font-bold">
                      {contractValidity.daysRemaining > 0
                        ? `${contractValidity.daysRemaining} días restantes`
                        : `${Math.abs(contractValidity.daysRemaining)} días vencido`}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  {contractValidity.description}
                </p>
              </div>

              {/* Card 3: Modo de Operación */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Control de Modificación
                </span>
                <div className="pt-1">
                  {dossier.manualStatusOverride ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-cyan-300 bg-blue-100 dark:bg-blue-950 px-2.5 py-1 rounded-md border border-blue-300 dark:border-blue-900">
                      <ShieldAlert className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
                      <span>Modo Manual Activo</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700">
                      <RefreshCw className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                      <span>Modo Automático</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  {dossier.manualStatusOverride
                    ? 'El estado manual prevalece sobre el cálculo automático hasta ser restablecido.'
                    : 'El estado se actualiza dinámicamente según la fecha de terminación del contrato.'}
                </p>
              </div>
            </div>

            {/* Manual Override Log (if active) */}
            {dossier.manualStatusOverride && (
              <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="font-bold text-xs text-blue-950 dark:text-blue-200 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-cyan-400" />
                    <span>Registro Oficial de Cambio de Estado Manual (ISO 9001 / SARLAFT)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Modificado por: <strong>{dossier.manualStatusChangedBy || 'Revisor'}</strong> el {dossier.manualStatusChangedAt || 'Reciente'}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-500 block mb-0.5">Motivo / Observación Registrada Obligatoria:</span>
                  <p className="italic">"{dossier.manualStatusReason || 'Sin observación registrada'}"</p>
                </div>
              </div>
            )}

            {/* Contract Detailed Information Card */}
            {dossier.contractInfo?.contractNumber ? (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-700 dark:text-cyan-400" />
                    <span>Datos Contractuales Registrados</span>
                  </h4>
                  <span className="font-mono text-xs font-bold text-blue-900 dark:text-cyan-300 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-900">
                    {dossier.contractInfo.contractNumber}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">Tipo de Contrato</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {dossier.contractInfo.contractType || 'Contrato de Suministro / Servicios'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">Fecha de Inicio</span>
                    <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                      {dossier.contractInfo.startDate || 'No registrada'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">Fecha de Vencimiento</span>
                    <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                      {dossier.contractInfo.endDate || 'No registrada'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">Valor Total (COP)</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">
                      {dossier.contractInfo.contractValue != null
                        ? `$ ${dossier.contractInfo.contractValue.toLocaleString('es-CO')}`
                        : 'A convenir'}
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">Supervisor Flota Sugamuxi</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {dossier.contractInfo.supervisor || 'Coordinación Administrativa y de Compras'}
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">Sincronización Automática de Estado</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {dossier.contractInfo.autoSyncStatus !== false
                        ? 'Habilitada (Actualiza a Vigente / Por Vencer / Vencido)'
                        : 'Deshabilitada'}
                    </span>
                  </div>

                  {dossier.contractInfo.objectDescription && (
                    <div className="sm:col-span-2 lg:col-span-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium mb-0.5">Objeto Contractual</span>
                      <p className="text-slate-800 dark:text-slate-200 text-xs">
                        {dossier.contractInfo.objectDescription}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center space-y-3">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    No se ha vinculado contrato formal a este expediente
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                    El proveedor está operando actualmente bajo el esquema de habilitación documental. Puede registrar los datos contractuales y su fecha de vigencia para control automático.
                  </p>
                </div>
                {(role === 'ADMIN' || role === 'REVISOR') && (
                  <button
                    type="button"
                    onClick={() => setIsManualStatusModalOpen(true)}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-xs inline-flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Vincular y Registrar Contrato</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}


        {/* Tab 1: Documents Review */}
        {activeTab === 'documentos' && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                  Documentos y Requisitos Obligatorios del Proveedor
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Los revisores técnicos y administradores pueden validar, aprobar, pedir corrección, o modificar y reemplazar directamente los archivos cargados.
                </p>
              </div>

              {(role === 'ADMIN' || role === 'REVISOR') && (
                <button
                  type="button"
                  onClick={() => setIsAddDocOpen(true)}
                  className="px-3.5 py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors border border-cyan-500/50 self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>+ Anexar Documento</span>
                </button>
              )}
            </div>

            {/* Banner Informativo / Habilitación Ficha & Certificado Oficial */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                allDocumentsApproved
                  ? 'bg-blue-50/90 border-blue-200 text-blue-950'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    allDocumentsApproved
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase flex items-center gap-2 flex-wrap">
                    <span>Ficha Oficial & Certificado de Habilitación</span>
                    {allDocumentsApproved ? (
                      <span className="px-2 py-0.5 bg-blue-700 text-white rounded-full text-[10px] font-bold">
                        100% APROBADO &bull; DISPONIBLE
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[10px] font-extrabold tracking-wide">
                        Total Expediente: {approvedDocsCount} de {totalDocs} Aprobados ({Math.round((approvedDocsCount / (totalDocs || 1)) * 100)}%)
                      </span>
                    )}
                  </div>

                  {/* Coherent Breakdown between Forms and Support Documents */}
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                      <FileText className="w-3 h-3 text-blue-600" />
                      Formatos Oficiales: <strong className="text-slate-900">{institutionalApprovedCount} de {institutionalTotalCount}</strong>
                    </span>
                    <span className="text-slate-400 font-bold">+</span>
                    <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                      <Briefcase className="w-3 h-3 text-blue-600" />
                      Soportes & Anexos: <strong className="text-slate-900">{supportApprovedCount} de {supportTotalCount}</strong>
                    </span>
                    <span className="text-slate-400 font-bold">=</span>
                    <span className="font-bold text-blue-900">
                      {approvedDocsCount} de {totalDocs} Total Requisitos
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 mt-1.5 leading-snug">
                    {allDocumentsApproved
                      ? 'Todos los requisitos del expediente (formatos institucionales y soportes tributarios) se encuentran en estado APROBADO. Puede generar la Ficha Oficial y Certificado de Habilitación para imprimir o exportar a PDF.'
                      : `La Ficha Oficial y Certificado se habilitará automáticamente cuando todos los requisitos se encuentren en estado APROBADO (${totalDocs - approvedDocsCount} pendientes en total: ${institutionalTotalCount - institutionalApprovedCount > 0 ? `${institutionalTotalCount - institutionalApprovedCount} formato(s) oficial(es) y ` : ''}${supportTotalCount - supportApprovedCount} soporte(s) y anexo(s)).`}
                  </p>
                </div>
              </div>

              {allDocumentsApproved && !expSummary.hasExpiredDocs ? (
                <button
                  type="button"
                  onClick={() => setIsCertificateModalOpen(true)}
                  className="px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
                >
                  <Award className="w-4 h-4 text-cyan-300" />
                  <span>Generar Ficha & Certificado</span>
                </button>
              ) : allDocumentsApproved && expSummary.hasExpiredDocs ? (
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 cursor-not-allowed border border-slate-200 opacity-60 self-start sm:self-auto"
                  title="Bloqueado: El proveedor posee documentos vencidos"
                >
                  <Award className="w-4 h-4 text-slate-400" />
                  <span>Ficha Bloqueada ({expSummary.expiredCount} doc vencido)</span>
                </button>
              ) : null}
            </div>
            
            {/* Resumen de Vigencias Documentales en Tab Documentos */}
            {expSummary.totalWithExpiration > 0 && (
              <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-2xs ${
                expSummary.hasExpiredDocs
                  ? 'bg-[#0b1329] text-white border-blue-900'
                  : expSummary.hasExpiringSoonDocs
                  ? 'bg-slate-50 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-700'
                  : 'bg-blue-50/70 text-blue-950 border-blue-200 dark:bg-blue-950/40 dark:text-blue-100 dark:border-blue-900'
              }`}>
                <div className="flex items-center gap-2">
                  {expSummary.hasExpiredDocs ? (
                    <ShieldAlert className="w-4 h-4 text-cyan-300 shrink-0" />
                  ) : expSummary.hasExpiringSoonDocs ? (
                    <Clock className="w-4 h-4 text-blue-700 dark:text-cyan-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-blue-700 dark:text-cyan-400 shrink-0" />
                  )}
                  <span className="font-bold">
                    {expSummary.hasExpiredDocs
                      ? `Control de Vigencias SIG: ${expSummary.expiredCount} documento(s) vencido(s). El proveedor se encuentra inhabilitado preventivamente.`
                      : expSummary.hasExpiringSoonDocs
                      ? `Control de Vigencias SIG: ${expSummary.expiringSoonCount} documento(s) próximo(s) a vencer en los próximos 30 días.`
                      : `Control de Vigencias SIG: Los ${expSummary.totalWithExpiration} documentos con vigencia periódica se encuentran al día.`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-mono font-bold">
                  {expSummary.hasExpiredDocs && (
                    <span className="bg-blue-900 text-cyan-200 border border-blue-700 px-2 py-0.5 rounded">
                      {expSummary.expiredCount} Vencido(s)
                    </span>
                  )}
                  {expSummary.hasExpiringSoonDocs && (
                    <span className="bg-blue-100 text-blue-900 border border-blue-200 px-2 py-0.5 rounded">
                      {expSummary.expiringSoonCount} Por Vencer (≤30d)
                    </span>
                  )}
                  <span className={expSummary.hasExpiredDocs ? 'text-blue-200' : expSummary.hasExpiringSoonDocs ? 'text-slate-600' : 'text-blue-800'}>
                    {expSummary.validCount} Vigente(s)
                  </span>
                </div>
              </div>
            )}
            
            {/* BLOQUE 1: FORMULARIOS INSTITUCIONALES OFICIALES */}
            <div className="space-y-3">
              <div className="bg-slate-100/90 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-extrabold uppercase bg-blue-900 text-white px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1.5 shadow-2xs">
                    <FileText className="w-3.5 h-3.5 text-cyan-300" />
                    <span>1. Formularios Institucionales Oficiales</span>
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    Formatos FS.GA-FOR-009 y FS.GA-FOR-039
                  </span>
                </div>
                <span className="text-xs font-bold text-blue-900 bg-white px-3 py-1 rounded-lg border border-blue-200 shadow-2xs flex items-center gap-1.5 self-start sm:self-auto">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Formatos Oficiales: {institutionalApprovedCount} de {institutionalTotalCount} aprobados</span>
                </span>
              </div>

              {/* Institutional Form Form 009 Row */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded border border-blue-200">
                    Formato Oficial
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    FS.GA-FOR-009 &bull; Formulario de Inscripción y Actualización de Proveedores
                  </h3>
                </div>
                <div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    dossier.documents['FS_GA_FOR_009']?.status === 'APROBADO'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : dossier.documents['FS_GA_FOR_009']?.status === 'REQUIERE_CORRECCION'
                      ? 'bg-slate-100 text-slate-800 border-slate-300'
                      : 'bg-slate-100 text-slate-800 border-slate-300'
                  }`}>
                    {dossier.documents['FS_GA_FOR_009']?.status || 'PENDIENTE'}
                  </span>
                </div>
              </div>

              {dossier.documents['FS_GA_FOR_009']?.fileName ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200">
                  <div>
                    <div className="font-bold text-xs text-slate-900">{dossier.documents['FS_GA_FOR_009'].fileName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Tamaño: {dossier.documents['FS_GA_FOR_009'].fileSize} &bull; Cargado por: {dossier.documents['FS_GA_FOR_009'].uploadedBy} &bull; Versión: {dossier.documents['FS_GA_FOR_009'].formVersion}
                    </div>
                    {dossier.documents['FS_GA_FOR_009'].correction && (
                      <div className="text-[11px] text-slate-800 bg-slate-100 p-2 rounded mt-2 border border-slate-200 font-mono">
                        ℹ Corrección solicitada: "{dossier.documents['FS_GA_FOR_009'].correction?.detailedObservation}"
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenDocPreview(dossier.documents['FS_GA_FOR_009'], 'Formulario de Inscripción FS.GA-FOR-009', 'FS_GA_FOR_009')}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded flex items-center gap-1 border border-blue-200 cursor-pointer shadow-2xs transition-colors"
                      title="Visualizar documento cargado"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ver Documento</span>
                    </button>

                    {form009 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFormForModal(form009);
                          setIsViewerModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded flex items-center gap-1 border border-slate-300 cursor-pointer transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        Formato Blanco
                      </button>
                    )}

                    {(role === 'ADMIN' || role === 'REVISOR') && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditDocModal('FS_GA_FOR_009', dossier.documents['FS_GA_FOR_009'], 'Formulario FS.GA-FOR-009')}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded flex items-center gap-1 border border-slate-300 cursor-pointer shadow-2xs transition-colors"
                        title="Modificar o reemplazar este archivo y sus campos"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                        <span>Modificar / Reemplazar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenCorrectionModal('FS_GA_FOR_009', 'Formulario FS.GA-FOR-009')}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded flex items-center gap-1 border border-slate-300 cursor-pointer transition-colors shadow-2xs"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                      Pedir Corrección
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveDoc('FS_GA_FOR_009')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-2xs flex items-center gap-1 border border-blue-600 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      Aprobar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 italic">Documento no cargado aún.</span>
                  {(role === 'ADMIN' || role === 'REVISOR') && (
                    <button
                      type="button"
                      onClick={() => handleOpenEditDocModal('FS_GA_FOR_009', dossier.documents['FS_GA_FOR_009'] || {
                        id: 'doc-009',
                        code: 'FS_GA_FOR_009',
                        name: 'Formulario de Inscripción FS.GA-FOR-009',
                        isRequired: true,
                        isInstitutionalForm: true,
                        status: 'PENDIENTE',
                      }, 'Formulario FS.GA-FOR-009')}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded flex items-center gap-1 border border-blue-200 cursor-pointer transition-colors"
                    >
                      <FileUp className="w-3.5 h-3.5 text-blue-600" />
                      <span>Cargar / Asignar Archivo</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Institutional Form Form 039 Row */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded border border-blue-200">
                    Formato Oficial
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    FS.GA-FOR-039 &bull; Autorización para el Tratamiento de Datos Personales
                  </h3>
                </div>
                <div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    dossier.documents['FS_GA_FOR_039']?.status === 'APROBADO'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-slate-100 text-slate-800 border-slate-300'
                  }`}>
                    {dossier.documents['FS_GA_FOR_039']?.status || 'PENDIENTE'}
                  </span>
                </div>
              </div>

              {dossier.documents['FS_GA_FOR_039']?.fileName ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200">
                  <div>
                    <div className="font-bold text-xs text-slate-900">{dossier.documents['FS_GA_FOR_039'].fileName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Tamaño: {dossier.documents['FS_GA_FOR_039'].fileSize} &bull; Versión: {dossier.documents['FS_GA_FOR_039'].formVersion}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenDocPreview(dossier.documents['FS_GA_FOR_039'], 'Autorización FS.GA-FOR-039', 'FS_GA_FOR_039')}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded flex items-center gap-1 border border-blue-200 cursor-pointer shadow-2xs transition-colors"
                      title="Visualizar documento cargado"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ver Documento</span>
                    </button>

                    {form039 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFormForModal(form039);
                          setIsViewerModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded flex items-center gap-1 border border-slate-300 cursor-pointer transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        Formato Blanco
                      </button>
                    )}

                    {(role === 'ADMIN' || role === 'REVISOR') && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditDocModal('FS_GA_FOR_039', dossier.documents['FS_GA_FOR_039'], 'Autorización FS.GA-FOR-039')}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded flex items-center gap-1 border border-slate-300 cursor-pointer shadow-2xs transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                        <span>Modificar / Reemplazar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenCorrectionModal('FS_GA_FOR_039', 'Autorización FS.GA-FOR-039')}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded flex items-center gap-1 border border-slate-300 cursor-pointer transition-colors shadow-2xs"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                      Pedir Corrección
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveDoc('FS_GA_FOR_039')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-2xs flex items-center gap-1 border border-blue-600 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      Aprobar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 italic">Documento no cargado aún.</span>
                  {(role === 'ADMIN' || role === 'REVISOR') && (
                    <button
                      type="button"
                      onClick={() => handleOpenEditDocModal('FS_GA_FOR_039', dossier.documents['FS_GA_FOR_039'] || {
                        id: 'doc-039',
                        code: 'FS_GA_FOR_039',
                        name: 'Autorización FS.GA-FOR-039',
                        isRequired: true,
                        isInstitutionalForm: true,
                        status: 'PENDIENTE',
                      }, 'Autorización FS.GA-FOR-039')}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded flex items-center gap-1 border border-blue-200 cursor-pointer transition-colors"
                    >
                      <FileUp className="w-3.5 h-3.5 text-blue-600" />
                      <span>Cargar / Asignar Archivo</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* BLOQUE 2: DOCUMENTOS SOPORTE Y ANEXOS TRIBUTARIOS */}
          <div className="space-y-3">
            {/* Category / Service Assigned Header Callout in Light Tone */}
            <div className="bg-gradient-to-r from-blue-50/80 via-slate-50 to-blue-50/60 p-4 rounded-xl border border-blue-200/80 shadow-2xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-extrabold uppercase bg-blue-900 text-white px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1.5 shadow-2xs">
                      <Briefcase className="w-3.5 h-3.5 text-blue-200" />
                      <span>2. Documentos Soporte y Anexos Tributarios</span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                      {isNatural ? 'Régimen: Persona Natural' : 'Régimen: Persona Jurídica'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-xs font-semibold text-slate-600">
                      Categoría / Servicio Asignado:
                    </span>
                    <span className="text-xs font-black text-blue-950 bg-blue-100/90 px-2.5 py-0.5 rounded-md border border-blue-300/80 inline-flex items-center gap-1.5 shadow-2xs">
                      <Layers className="w-3.5 h-3.5 text-blue-700" />
                      <span>{dossier.selectedCategory}</span>
                    </span>
                    {currentCatConfig?.economicCode && (
                      <span className="text-[11px] font-mono font-bold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
                        Código: {currentCatConfig.economicCode}
                      </span>
                    )}
                    {currentCatConfig?.riskLevel && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-800 border-slate-300">
                        Riesgo: {currentCatConfig.riskLevel}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-1 shrink-0">
                  <span className="text-xs font-bold text-blue-800 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-2xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Soportes y Anexos: {supportApprovedCount} de {supportTotalCount} aprobados</span>
                  </span>
                  <span className="text-[10.5px] text-slate-500 font-medium">
                    (+ {institutionalApprovedCount} formatos oficiales = {approvedDocsCount} de {totalDocs} total expediente)
                  </span>
                </div>
              </div>

              <p className="text-[11.5px] text-slate-600 leading-relaxed border-t border-blue-100/80 pt-2">
                ℹ Los requerimientos documentales y anexos tributarios de este bloque se parametrizan dinámicamente según la <strong>Categoría o Servicio Asignado ({dossier.selectedCategory})</strong> y la naturaleza jurídica del postulante para el Sistema Integrado de Gestión de Flota Sugamuxi S.A.
              </p>
            </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                {supportDocsList.map(([code, doc]) => {
                    const docDef = (documentDefinitions || []).find((d) => d.code === code);
                    const catalog = DOCUMENT_CATALOG_INFO[code];
                    const docTitle = docDef?.name || doc.name || catalog?.name || code;
                    const isActivityReq = supplierCategoryReqs?.activityMandatory?.includes(code) || supplierCategoryReqs?.activityOptional?.includes(code);
                    const isBaseReq = supplierCategoryReqs?.baseMandatory?.includes(code) || supplierCategoryReqs?.baseOptional?.includes(code);
                    const docExp = calculateDocumentExpiration(doc.expirationDate);

                    return (
                      <div
                        key={code}
                        className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                          docExp.status === 'VENCIDO'
                            ? 'bg-slate-900/5 border-l-4 border-l-slate-900 dark:border-l-cyan-400'
                            : docExp.status === 'POR_VENCER'
                            ? 'bg-blue-50/50 border-l-4 border-l-blue-600'
                            : doc.status === 'REQUIERE_CORRECCION'
                            ? 'bg-slate-50/90 border-l-4 border-l-slate-400'
                            : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="space-y-1.5 max-w-lg">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">
                              {docTitle}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              [{code}]
                            </span>
                            {isActivityReq && (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                Exigencia por Actividad
                              </span>
                            )}
                            {isBaseReq && !isActivityReq && (
                              <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                Requisito Base
                              </span>
                            )}
                          </div>

                          {docDef?.description && (
                            <p className="text-[11px] text-slate-500 leading-snug">
                              {docDef.description}
                            </p>
                          )}

                          {docDef?.validityRule && (
                            <div className="text-[10.5px] text-blue-700 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                              <span>Regla SIG: {docDef.validityRule}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                            <span>{doc.fileName ? `Archivo: ${doc.fileName} (${doc.fileSize || '1.4 MB'})` : 'Pendiente de adjuntar por el proveedor'}</span>
                            {doc.expirationDate && (
                              <span className="font-mono text-slate-700 font-semibold">
                                • Vence: {doc.expirationDate}
                              </span>
                            )}
                          </div>

                          {/* Indicador y Alerta de Vigencia / Vencimiento */}
                          {docExp.status === 'VENCIDO' && (
                            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white bg-slate-900 px-2.5 py-0.5 rounded border border-slate-700 shadow-2xs">
                              <ShieldAlert className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                              <span>VENCIDO: Expiró hace {docExp.daysOverdue} días ({doc.expirationDate}) — Inhabilita al proveedor</span>
                            </div>
                          )}
                          {docExp.status === 'POR_VENCER' && (
                            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-300 shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                              <span>POR VENCER: Restan {docExp.daysRemaining} días para vencer ({doc.expirationDate})</span>
                            </div>
                          )}
                          {docExp.status === 'VIGENTE' && (
                            <div className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              <CheckCircle2 className="w-3 h-3 text-blue-700 shrink-0" />
                              <span>Vigente (restan {docExp.daysRemaining} días)</span>
                            </div>
                          )}

                          {doc.notes && (
                            <p className="text-[11px] text-slate-600 italic">
                              Nota: {doc.notes}
                            </p>
                          )}
                          {doc.correction && (
                            <div className="text-[11px] text-slate-800 bg-slate-100 p-2 rounded mt-1 border border-slate-200 font-mono">
                              ℹ Observación: "{doc.correction.detailedObservation}"
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            doc.status === 'APROBADO'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : doc.status === 'REQUIERE_CORRECCION'
                              ? 'bg-slate-100 text-slate-800 border-slate-300'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}>
                            {doc.status}
                          </span>

                          {doc.fileName && (
                            <button
                              type="button"
                              onClick={() => handleOpenDocPreview(doc, docTitle, code)}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded flex items-center gap-1 border border-blue-200 cursor-pointer shadow-2xs transition-colors"
                              title="Visualizar documento cargado"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>Ver Documento</span>
                            </button>
                          )}

                          {(role === 'ADMIN' || role === 'REVISOR') && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditDocModal(code, doc, docTitle)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded flex items-center gap-1 border border-slate-300 cursor-pointer shadow-2xs transition-colors"
                              title="Modificar información, vigencia o sustituir archivo"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                              <span>Modificar Doc</span>
                            </button>
                          )}

                          {doc.fileName && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenCorrectionModal(code, docTitle)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded flex items-center gap-1 border border-slate-300 cursor-pointer transition-colors shadow-2xs"
                              >
                                <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                                Corrección
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApproveDoc(code)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-2xs flex items-center gap-1 border border-blue-600 cursor-pointer transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                Aprobar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Restrictive Lists Check */}
        {activeTab === 'listas' && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 text-xs text-blue-950 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-blue-950">
                  Módulo de Prevención SARLAFT y Control de Riesgos
                </h4>
                <p className="text-blue-800 text-xs mt-0.5">
                  Validación obligatoria de antecedentes en listas vinculantes nacionales e internacionales (OFAC, ONU, Fiscalía, Contraloría, Procuraduría y Policía Nacional).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* SARLAFT Card */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Listas SARLAFT Nacionales</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    dossier.internalConcepts?.sarlatfCheck?.checked ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {dossier.internalConcepts?.sarlatfCheck?.result || 'NO_VERIFICADO'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Búsqueda por NIT / Cédula en listas de lavado de activos y financiamiento del terrorismo.
                </p>
                <button
                  type="button"
                  onClick={() => handleCheckRestrictiveList('sarlaft')}
                  className="w-full py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 border border-blue-700 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-cyan-400" />
                  {dossier.internalConcepts?.sarlatfCheck?.checked ? 'Revalidar SARLAFT' : 'Ejecutar Consulta SARLAFT'}
                </button>
              </div>

              {/* OFAC / Clinton Card */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Lista OFAC / ONU / Internacional</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    dossier.internalConcepts?.ofacCheck?.checked ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {dossier.internalConcepts?.ofacCheck?.result || 'NO_VERIFICADO'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Validación contra sanciones internacionales del Departamento del Tesoro de EE.UU.
                </p>
                <button
                  type="button"
                  onClick={() => handleCheckRestrictiveList('ofac')}
                  className="w-full py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 border border-blue-700 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-cyan-400" />
                  {dossier.internalConcepts?.ofacCheck?.checked ? 'Revalidar OFAC' : 'Ejecutar Consulta OFAC'}
                </button>
              </div>

              {/* Procuraduria / Policía Card */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">Procuraduría y Policía</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    dossier.internalConcepts?.procuraduriaPoliciaCheck?.checked ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {dossier.internalConcepts?.procuraduriaPoliciaCheck?.result || 'NO_VERIFICADO'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Certificados de antecedentes fiscales, disciplinarios y medidas correctivas.
                </p>
                <button
                  type="button"
                  onClick={() => handleCheckRestrictiveList('procuraduria')}
                  className="w-full py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 border border-blue-700 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-cyan-400" />
                  {dossier.internalConcepts?.procuraduriaPoliciaCheck?.checked ? 'Revalidar Antecedentes' : 'Consultar Antecedentes'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Tab 5: Emails and Notifications sent to this supplier */}
        {activeTab === 'correos' && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                  Historial de Notificaciones y Correos Electrónicos Despachados
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Trazabilidad de todos los mensajes institucionales automáticos y personalizados enviados a {dossier.basicInfo.email}.
                </p>
              </div>
              <button
                onClick={() => setIsComposeEmailOpen(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Redactar Nuevo Correo</span>
              </button>
            </div>

            {emailNotifications.filter((e) => e.dossierId === dossier.id).length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 space-y-2">
                <Inbox className="w-8 h-8 mx-auto text-slate-400" />
                <p className="font-semibold text-xs text-slate-700">No hay notificaciones emitidas aún para este expediente.</p>
                <p className="text-[11px]">Los correos se generan automáticamente con cada revisión, solicitud de corrección o cambio de estado.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                {emailNotifications
                  .filter((e) => e.dossierId === dossier.id)
                  .map((email) => (
                    <div key={email.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{email.subject}</span>
                          <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.2 rounded border border-blue-200">
                            {email.templateType}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs line-clamp-1">{email.previewSnippet}</p>
                        {email.metadata?.detailedObservation && (
                          <div className="text-[11px] text-blue-900 bg-blue-50/70 rounded px-2 py-1 font-mono border border-blue-200">
                            <strong>Detalle:</strong> {email.metadata.detailedObservation}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                          <span>Fecha: {email.sentAt}</span>
                          <span>&bull;</span>
                          <span>Destino: {email.recipientEmail}</span>
                          <span>&bull;</span>
                          <span className="text-blue-700 font-bold">✓ Entregado</span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <button
                          onClick={() => {
                            markEmailAsRead(email.id);
                            setSelectedEmailForView(email);
                            setIsEmailViewerOpen(true);
                          }}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-md flex items-center gap-1.5 border border-blue-200 text-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Correo Completo</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Audit Trail */}
        {activeTab === 'auditoria' && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                  Historial y Trazabilidad Completa del Proveedor
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registro inmutable de todas las modificaciones y acciones auditables para {supplierName} ({dossier.fileNumber}).
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200">
                {systemAuditLogs.filter((l) => l.dossierId === dossier.id).length} Eventos Registrados
              </span>
            </div>

            {/* System Audit Logs for this Dossier */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Eventos de Auditoría y Modificaciones de Datos
              </h4>

              {systemAuditLogs.filter((l) => l.dossierId === dossier.id).length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                  {systemAuditLogs
                    .filter((l) => l.dossierId === dossier.id)
                    .map((log) => (
                      <div key={log.id} className="p-4 space-y-2 hover:bg-slate-50/70 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{log.fieldChanged}</span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                log.action === 'EDICION_CAMPO'
                                  ? 'bg-blue-100 text-blue-800'
                                  : log.action === 'CAMBIO_ESTADO'
                                  ? 'bg-slate-200 text-slate-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {log.action}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                              {log.userRole === 'ADMIN' ? 'ADMINISTRADOR' : 'REVISOR TÉCNICO'}
                            </span>
                          </div>
                          <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {log.formattedDate}
                          </span>
                        </div>

                        {log.action === 'EDICION_CAMPO' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px]">
                            <div className="text-slate-500 line-through">
                              <span className="font-semibold text-slate-400 mr-1">Valor Anterior:</span>
                              {log.oldValue || '(Vacío)'}
                            </div>
                            <div className="text-blue-900 font-medium">
                              <span className="font-semibold text-slate-400 mr-1">Nuevo Valor:</span>
                              {log.newValue || '(Vacío)'}
                            </div>
                          </div>
                        )}

                        {log.justification && (
                          <p className="text-slate-600 text-xs italic bg-slate-50 p-2 rounded border border-slate-200">
                            <strong>Motivo / Justificación:</strong> "{log.justification}"
                          </p>
                        )}

                        <div className="text-[10px] text-slate-400">
                          Usuario Responsable: <strong className="text-slate-700">{log.user}</strong> &bull; Sección: {log.section}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  No hay modificaciones de campos registradas para este expediente.
                </div>
              )}
            </div>

            {/* General Workflow Audit History */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Línea de Tiempo del Flujo de Revisión
              </h4>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                {(dossier.auditHistory || []).map((aud) => (
                  <div key={aud.id} className="p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{aud.action}</span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {aud.role}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {aud.timestamp}
                      </span>
                    </div>
                    {aud.notes && <p className="text-slate-600 text-[11px] font-mono">{aud.notes}</p>}
                    <div className="text-[10px] text-slate-400">Usuario: {aud.user}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>


      {/* Modal for Requesting Granular Correction */}
      {isCorrectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="shrink-0 bg-slate-900 text-white px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-bold uppercase bg-blue-900 text-blue-200 px-2 py-0.5 rounded">
                  Solicitud de Corrección
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {targetDocName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCorrectionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors shrink-0 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCorrection} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs text-slate-700 scrollbar-thin scrollbar-thumb-slate-300">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Motivo Principal de Corrección
                  </label>
                  <input
                    type="text"
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="Ej. Información bancaria incompleta"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Página o Sección Específica Observada
                  </label>
                  <input
                    type="text"
                    value={correctionSection}
                    onChange={(e) => setCorrectionSection(e.target.value)}
                    placeholder="Ej. Numeral III (Información Bancaria) o Página 2"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Observación Detallada para el Proveedor <span className="text-blue-600">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={correctionDetail}
                    onChange={(e) => setCorrectionDetail(e.target.value)}
                    placeholder="Escriba la instrucción clara y detallada para que el proveedor subsane el documento..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                    required
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-[11px] text-slate-800">
                  <p className="font-semibold text-slate-900">Principio de No Rechazo Total:</p>
                  <p className="text-slate-600">
                    El expediente pasará a estado <strong>REQUIERE CORRECCIÓN</strong> permitiendo al proveedor reemplazar únicamente este requisito sin reiniciar todo su proceso.
                  </p>
                </div>
              </div>

              <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsCorrectionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer rounded-lg hover:bg-slate-200/60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Notificar y Solicitar Corrección
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Institutional Form Modal */}
      <InstitutionalFormsViewerModal
        form={selectedFormForModal}
        isOpen={isViewerModalOpen}
        onClose={() => setIsViewerModalOpen(false)}
        supplierName={supplierName}
        nitOrDoc={supplierDoc}
      />

      {/* Email Notification Viewer Modal */}
      <EmailModalViewer
        email={selectedEmailForView}
        isOpen={isEmailViewerOpen}
        onClose={() => {
          setIsEmailViewerOpen(false);
          setSelectedEmailForView(null);
        }}
      />

      {/* Send Custom Email Modal */}
      {dossier && (
        <SendCustomEmailModal
          isOpen={isComposeEmailOpen}
          onClose={() => setIsComposeEmailOpen(false)}
          dossier={dossier}
          initialDossierId={dossier.id}
          dossiers={dossiers}
          onSend={(targetId, subject, message, revName) => {
            sendCustomEmail(targetId, subject, message, revName);
          }}
        />
      )}

      {/* Edit Document Modal */}
      {editingDocObj && (
        <DocumentEditorModal
          isOpen={isDocEditorOpen}
          onClose={() => {
            setIsDocEditorOpen(false);
            setEditingDocObj(null);
          }}
          docCode={editingDocCode}
          document={editingDocObj}
          documentTitle={editingDocTitle}
          onSave={handleSaveDocEdit}
        />
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={isPreviewDocOpen}
        onClose={() => {
          setIsPreviewDocOpen(false);
          setPreviewDocObj(null);
          setPreviewDocCode('');
        }}
        document={
          previewDocCode && dossier.documents[previewDocCode]
            ? dossier.documents[previewDocCode]
            : previewDocObj
        }
        documentTitle={previewDocTitle}
        supplierName={supplierName}
        nitOrDoc={supplierDoc}
        onModifyDoc={
          (role === 'ADMIN' || role === 'REVISOR') && (previewDocCode || previewDocObj)
            ? () => {
                const code = previewDocCode || previewDocObj?.code || '';
                const docToEdit = (code && dossier.documents[code]) || previewDocObj;
                const titleToEdit = previewDocTitle;
                setIsPreviewDocOpen(false);
                if (docToEdit) {
                  handleOpenEditDocModal(code, docToEdit, titleToEdit);
                }
              }
            : undefined
        }
        onRequestCorrection={
          (role === 'ADMIN' || role === 'REVISOR') && (previewDocCode || previewDocObj)
            ? () => {
                const code = previewDocCode || previewDocObj?.code || '';
                const titleToCorrect = previewDocTitle;
                setIsPreviewDocOpen(false);
                handleOpenCorrectionModal(code, titleToCorrect);
              }
            : undefined
        }
        onApproveDoc={
          (role === 'ADMIN' || role === 'REVISOR') && (previewDocCode || previewDocObj)
            ? () => {
                const code = previewDocCode || previewDocObj?.code || '';
                if (code) {
                  handleApproveDoc(code);
                  showToast(`Documento "${previewDocTitle || code}" aprobado con éxito.`, 'success', 'DOCUMENTO APROBADO');
                }
              }
            : undefined
        }
      />

      {/* Add Custom Document Requirement Modal */}
      <AddCustomDocumentModal
        isOpen={isAddDocOpen}
        onClose={() => setIsAddDocOpen(false)}
        existingDocCodes={Object.keys(dossier.documents)}
        onAdd={handleAddCustomDoc}
      />

      {/* Ficha Oficial & Certificado de Habilitación de Proveedor Modal */}
      <SupplierCertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        dossier={dossier}
      />

      {/* Manual Status & Contract Validity Management Modal */}
      <ManualStatusChangeModal
        isOpen={isManualStatusModalOpen}
        onClose={() => setIsManualStatusModalOpen(false)}
        dossier={dossier}
        onConfirmStatusChange={(dossierId, newStatus, reason, reviewer, updatedContract) => {
          updateDossierStatus(dossierId, newStatus, reason, reviewer, true, updatedContract);
          showToast(`Estado actualizado a "${getProcessStatusLabel(newStatus)}" con observación registrada.`, 'success', 'ESTADO ACTUALIZADO');
        }}
      />

    </div>
  );
};

