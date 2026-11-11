import React, { useState, useEffect } from 'react';
import { BrandSwoosh } from './ui/BrandSwoosh';
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
} from '../types';
import { DOCUMENT_CATALOG_INFO } from '../data/initialData';
import { InstitutionalFormsViewerModal } from './InstitutionalFormsViewerModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
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
    isReadOnly,
    dossiers,
    approveDocument,
    requestDocumentCorrection,
    updateSupplierDocument,
    addCustomSupplierDocument,
    updateDossierStatus,
    institutionalForms,
    systemAuditLogs,
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

  const [activeTab, setActiveTab] = useState<'datos' | 'contrato' | 'documentos' | 'auditoria'>('datos');
  const [selectedFormForModal, setSelectedFormForModal] = useState<any>(null);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [isManualStatusModalOpen, setIsManualStatusModalOpen] = useState(false);

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
      <div className="fs-card p-8 text-center rounded-2xl">
        <p className="text-[#3a5274] dark:text-slate-300">Expediente no encontrado.</p>
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
  const institutionalApprovedCount = [doc009, doc039].filter((d) => d && (d.status === 'APROBADO' || d.status === 'VIGENTE' || d.status === 'POR_VENCER')).length;
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
  const supportApprovedCount = supportDocsList.filter(([_, d]) => d.isRequired && (d.status === 'APROBADO' || d.status === 'VIGENTE' || d.status === 'POR_VENCER')).length;
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
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] border border-[#2c84c4]/30 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
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
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] border border-[#2c84c4]/30">
            <Clock className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
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
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#0b1d3a] dark:text-white border border-black/10 dark:border-white/10">
            <AlertCircle className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
            <span>Requiere Corrección</span>
          </span>
        );
      case 'RECHAZADO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-100 border border-slate-700">
            <ShieldAlert className="w-3.5 h-3.5 text-[#5d7392] dark:text-slate-400" />
            <span>Rechazado (No Conforme)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#3a5274] dark:text-slate-300 border border-black/10 dark:border-white/10">
            <FileText className="w-3.5 h-3.5 text-[#5d7392] dark:text-slate-400" />
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
            <ShieldAlert className="w-3.5 h-3.5 text-[#5d7392] dark:text-slate-400" />
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
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] border border-[#2c84c4]/30 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
            <span>Contrato Vigente (Activo)</span>
          </span>
        );
      case 'CONTRATO_POR_VENCER':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#0b1d3a] dark:text-white border border-black/10 dark:border-white/10 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
            <span>Contrato Próximo a Vencer (≤30d)</span>
          </span>
        );
      case 'CONTRATO_VENCIDO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#3a5274] dark:text-slate-300 border border-black/10 dark:border-white/10">
            <AlertCircle className="w-3.5 h-3.5 text-[#3a5274] dark:text-slate-300" />
            <span>Contrato Vencido</span>
          </span>
        );
      case 'SUSPENDIDO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-black/[0.08] dark:bg-white/10 text-[#0b1d3a] dark:text-white border border-black/10 dark:border-white/10">
            <ShieldAlert className="w-3.5 h-3.5 text-[#3a5274] dark:text-slate-300" />
            <span>Suspendido</span>
          </span>
        );
      case 'PROVEEDOR_HABILITADO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] border border-[#2c84c4]/30 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
            <span>Proveedor Habilitado (Homologado)</span>
          </span>
        );
      case 'APROBADO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] border border-[#2c84c4]/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
            <span>Aprobado</span>
          </span>
        );
      case 'EN_REVISION':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#0b1d3a] dark:text-white border border-black/10 dark:border-white/10">
            <Clock className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
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
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#0b1d3a] dark:text-white border border-black/10 dark:border-white/10">
            <AlertCircle className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
            <span>Requiere Corrección</span>
          </span>
        );
      case 'DOCUMENTACION_PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#3a5274] dark:text-slate-300 border border-black/10 dark:border-white/10">
            <FileText className="w-3.5 h-3.5 text-[#5d7392] dark:text-slate-400" />
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
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] border border-[#2c84c4]/30 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
            <span>Documentación Próxima a Vencer (≤30d)</span>
          </span>
        );
      case 'RECHAZADO':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#3a5274] dark:text-slate-300 border border-black/10 dark:border-white/10">
            <ShieldAlert className="w-3.5 h-3.5 text-[#5d7392] dark:text-slate-400" />
            <span>No Habilitado</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#3a5274] dark:text-slate-300 border border-black/10 dark:border-white/10">
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
      uploadedBy?: string;
      uploadedAt?: string;
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4 animate-in fade-in">
      
      {/* ENCABEZADO DEL EXPEDIENTE — banner de marca */}
      <section className="fs-hero relative overflow-hidden rounded-[28px] px-5 sm:px-8 py-6 text-white shadow-glow animate-fade-up">
        <BrandSwoosh className="absolute -right-16 -bottom-14 w-[48%] opacity-100" />

        {/* Barra superior: volver, expediente y revisor */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold backdrop-blur-sm transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>
            <span className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-black/20 border border-white/15 backdrop-blur-sm">
              <span className="text-white/60 uppercase tracking-[0.16em] text-[10px] font-semibold">Expediente</span>
              <span className="font-mono font-bold text-white">{dossier.fileNumber}</span>
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-white/70">
              <Clock className="w-3.5 h-3.5" />
              <span>Radicado {dossier.submittedAt || dossier.createdAt}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="reviewerInput" className="text-[10px] uppercase tracking-[0.16em] font-semibold text-white/60">
              Revisor
            </label>
            <input
              id="reviewerInput"
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="text-xs font-medium px-3 h-9 rounded-xl bg-black/20 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#69bdd7]/60 w-44 sm:w-56"
              title="Nombre del revisor para auditoría y trazabilidad"
            />
          </div>
        </div>

        {/* Identidad del proveedor + acciones */}
        <div className="mt-6 flex flex-col xl:flex-row xl:items-end justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div className="shrink-0 w-16 h-16 rounded-2xl bg-white/15 border border-white/30 backdrop-blur-sm grid place-items-center font-display text-2xl font-semibold shadow-glow">
              {(supplierName || '?')
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((w: string) => w[0])
                .join('')
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-2xl sm:text-4xl font-semibold leading-tight tracking-tight break-words">
                {supplierName}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-[#131b2e] font-bold shadow-card">
                  Tipo {dossier.supplierTier || dossier.basicInfo.supplierTier || 'B'} &bull;{' '}
                  {(dossier.supplierTier || dossier.basicInfo.supplierTier || 'B') === 'A'
                    ? 'Crítico'
                    : (dossier.supplierTier || dossier.basicInfo.supplierTier || 'B') === 'B'
                    ? 'Operativo'
                    : 'Estándar'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/12 border border-white/25 backdrop-blur-sm font-medium">
                  {isNatural ? <User className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                  <span>{isNatural ? 'Persona Natural' : 'Persona Jurídica'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/12 border border-white/25 backdrop-blur-sm font-mono font-semibold">
                  <span className="font-sans font-normal text-white/60">NIT</span>
                  <span>{supplierDoc}</span>
                </span>
                {dossier.basicInfo.city && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/12 border border-white/25 backdrop-blur-sm font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{dossier.basicInfo.city}</span>
                  </span>
                )}
                {dossier.selectedCategory && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#69bdd7]/25 border border-[#69bdd7]/50 backdrop-blur-sm font-semibold">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{dossier.selectedCategory}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {allDocumentsApproved && !expSummary.hasExpiredDocs ? (
              <button
                type="button"
                onClick={() => setIsCertificateModalOpen(true)}
                className="shimmer h-11 px-5 rounded-xl bg-white text-[#131b2e] font-semibold text-sm flex items-center gap-2 shadow-glow hover:opacity-95 transition-opacity cursor-pointer"
                title="Ficha Oficial & Certificado de Proveedor Habilitado disponible (100% documentos aprobados y vigentes)"
              >
                <Award className="w-4 h-4 text-[#2c84c4]" />
                <span>Ficha Oficial & Certificado</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="h-11 px-5 rounded-xl bg-white/10 border border-white/20 text-white/60 font-medium text-sm flex items-center gap-2 cursor-not-allowed"
                title={
                  expSummary.hasExpiredDocs
                    ? `Certificado bloqueado: El proveedor posee ${expSummary.expiredCount} documento(s) vencido(s). Debe actualizar soportes para rehabilitarse.`
                    : `Certificado bloqueado: Requiere que todos los documentos (${approvedDocsCount}/${totalDocs}) estén en estado APROBADO.`
                }
              >
                <Award className="w-4 h-4" />
                <span>
                  Ficha & Certificado{' '}
                  {expSummary.hasExpiredDocs ? '(Bloqueado)' : `(${approvedDocsCount}/${totalDocs})`}
                </span>
              </button>
            )}

            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setIsManualStatusModalOpen(true)}
                className="h-11 px-5 rounded-xl bg-white/12 hover:bg-white/20 border border-white/30 backdrop-blur-sm text-white font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer"
                title="Gestionar estado por vigencia de contrato o registrar cambio manual con motivo / observación"
              >
                <Briefcase className="w-4 h-4" />
                <span>Gestionar Estado & Contrato</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* TARJETAS DE ESTADO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Homologación documental */}
        <div className="fs-card lift rounded-[24px] p-5 animate-fade-up">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="shrink-0 w-11 h-11 rounded-2xl bg-gradient-action text-white grid place-items-center shadow-glow">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2c84c4] dark:text-[#69bdd7]">Estado de creación</p>
                <p className="font-display text-base font-semibold text-[#0b1d3a] dark:text-white truncate">Homologación SIG</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-display text-3xl font-semibold leading-none text-[#0b1d3a] dark:text-white tabular-nums">
                {Math.round((approvedDocsCount / (totalDocs || 1)) * 100)}%
              </p>
              <p className="mt-1 text-[11px] text-[#3a5274] dark:text-slate-400">
                {approvedDocsCount}/{totalDocs} aprobados
              </p>
            </div>
          </div>

          <div className="mt-4 h-2 rounded-full bg-[#e3eaf3] dark:bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-action transition-all duration-700"
              style={{ width: `${Math.round((approvedDocsCount / (totalDocs || 1)) * 100)}%` }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
            <div>{renderCreationBadge()}</div>
            <div className="text-xs text-[#3a5274] dark:text-slate-400 font-medium">
              {expSummary.hasExpiredDocs ? (
                <span className="text-red-500 font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  Inhabilitado preventivamente
                </span>
              ) : allDocumentsApproved ? (
                <span className="text-[#1d5fa8] dark:text-[#69bdd7] dark:text-[#69bdd7] font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Expediente 100% conforme
                </span>
              ) : (
                <span>{totalDocs - approvedDocsCount} soporte(s) pendiente(s)</span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Vinculación contractual */}
        <div className="fs-card lift rounded-[24px] p-5 animate-fade-up" style={{ animationDelay: '80ms' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-[#69bdd7] to-[#2c84c4] text-white grid place-items-center shadow-glow">
                <Briefcase className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2c84c4] dark:text-[#69bdd7]">Vinculación contractual</p>
                <p className="font-display text-base font-semibold text-[#0b1d3a] dark:text-white truncate">Vigencia de contrato</p>
              </div>
            </div>

            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setIsManualStatusModalOpen(true)}
                className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[#2c84c4]/40 text-[#1d5fa8] dark:text-[#69bdd7] hover:bg-[#2c84c4]/10 text-xs font-semibold transition-colors cursor-pointer"
                title="Gestionar vigencia de contrato u observación de estado manual"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{dossier.contractInfo?.contractNumber ? 'Editar contrato' : 'Vincular contrato'}</span>
              </button>
            )}
          </div>

          <div className="mt-5 flex items-center gap-2 flex-wrap">
            {renderContractualBadge()}
            {dossier.contractInfo?.contractNumber && (
              <span className="font-mono text-[11px] font-bold text-[#0b1d3a] dark:text-slate-200 bg-black/[0.04] dark:bg-white/[0.08] px-2.5 py-1 rounded-lg border border-black/10 dark:border-white/10">
                No. {dossier.contractInfo.contractNumber}
              </span>
            )}
          </div>

          <div className="mt-4 text-xs">
            {dossier.contractInfo?.objectDescription ? (
              <p className="text-[#3a5274] dark:text-slate-300 leading-relaxed line-clamp-2" title={`Objeto completo: ${dossier.contractInfo.objectDescription}`}>
                <span className="font-semibold text-[#0b1d3a] dark:text-white">Objeto: </span>
                {dossier.contractInfo.objectDescription}
              </p>
            ) : (
              <p className="italic text-[#5d7392] dark:text-slate-400">Sin contrato marco vinculado</p>
            )}
          </div>
        </div>
      </div>

      {/* Alertas de vencimiento */}
      {expSummary.hasExpiredDocs && (
        <div className="relative overflow-hidden rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap animate-fade-up">
          <div className="flex items-center gap-3 min-w-0">
            <span className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-400 text-white grid place-items-center shadow-[0_8px_20px_-8px_rgba(248,113,113,0.7)]">
              <ShieldAlert className="w-4.5 h-4.5" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-[#0b1d3a] dark:text-white">
                Requisitos vencidos ({expSummary.expiredCount}) · <span className="text-red-500">Inhabilitado</span>
              </p>
              <p className="text-[11px] text-[#3a5274] dark:text-slate-300 truncate max-w-xl hidden md:block">
                {expSummary.expiredDocs.map((d) => `${getDocInstitutionalName(d.code, d.name)} (${d.daysOverdue}d)`).join(', ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('documentos')}
            className="h-9 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-semibold shrink-0 hover:opacity-95 transition-opacity cursor-pointer"
          >
            Revisar documentos
          </button>
        </div>
      )}

      {!expSummary.hasExpiredDocs && expSummary.hasExpiringSoonDocs && (
        <div className="rounded-2xl border border-[#2c84c4]/35 bg-[#2c84c4]/10 px-4 py-3 text-xs flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap animate-fade-up">
          <div className="flex items-center gap-3 min-w-0">
            <span className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-[#2c84c4] to-[#69bdd7] text-white grid place-items-center">
              <Clock className="w-4.5 h-4.5" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-[#0b1d3a] dark:text-white">Alerta preventiva (≤30 días)</p>
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                {expSummary.expiringSoonDocs.map((doc) => (
                  <span key={doc.code} className="inline-flex items-center gap-1.5 text-[11px] bg-white/70 dark:bg-white/[0.06] px-2.5 py-1 rounded-lg border border-black/10 dark:border-white/10">
                    <span className="font-semibold text-[#0b1d3a] dark:text-white truncate max-w-[200px]">{getDocInstitutionalName(doc.code, doc.name)}</span>
                    <span className="text-[#5d7392] dark:text-slate-400">({doc.expirationDate})</span>
                    <span className="bg-[#2c84c4]/30 text-[#1d5fa8] dark:text-[#69bdd7] dark:text-[#69bdd7] px-1.5 rounded text-[10px] font-bold">{doc.daysRemaining}d</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('documentos')}
            className="h-9 px-4 rounded-xl border border-black/15 dark:border-white/20 text-[#0b1d3a] dark:text-white text-xs font-semibold shrink-0 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            Ver documentos
          </button>
        </div>
      )}

      {dossier.manualStatusOverride && (
        <div className="rounded-2xl border border-[#2c84c4]/35 bg-[#2c84c4]/10 p-4 text-xs flex items-start justify-between gap-3 animate-fade-up">
          <div className="flex items-start gap-3">
            <span className="shrink-0 w-9 h-9 rounded-xl bg-gradient-action text-white grid place-items-center">
              <ShieldCheck className="w-4.5 h-4.5" />
            </span>
            <div>
              <div className="font-semibold flex items-center gap-2 flex-wrap text-[#0b1d3a] dark:text-white">
                <span>Estado establecido manualmente:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-[#2c84c4]/20 text-[#1d5fa8] dark:text-[#69bdd7] font-mono text-[11px] font-bold">
                  {getProcessStatusLabel(dossier.processStatus)}
                </span>
                {dossier.manualStatusChangedBy && (
                  <span className="text-[11px] font-normal text-[#3a5274] dark:text-slate-400">
                    por <strong>{dossier.manualStatusChangedBy}</strong> {dossier.manualStatusChangedAt && `el ${dossier.manualStatusChangedAt}`}
                  </span>
                )}
              </div>
              <p className="mt-2 text-[11px] text-[#3a5274] dark:text-slate-300 bg-white/60 dark:bg-white/[0.05] p-2.5 rounded-xl border border-black/10 dark:border-white/10">
                <span className="font-semibold text-[#5d7392] dark:text-slate-400">Motivo / observación registrada:</span> "{dossier.manualStatusReason || 'Sin observación registrada'}"
              </p>
            </div>
          </div>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setIsManualStatusModalOpen(true)}
              className="text-[11px] font-semibold text-[#1d5fa8] dark:text-[#69bdd7] hover:underline shrink-0 cursor-pointer"
            >
              Cambiar estado
            </button>
          )}
        </div>
      )}

      {/* PESTAÑAS */}
      <div className="fs-card rounded-[24px] overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-black/[0.07] dark:border-white/10">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/10">
            {(
              [
                { id: 'datos', label: 'Información del Proveedor', icon: User },
                { id: 'contrato', label: 'Vigencia & Contrato', icon: Calendar },
                { id: 'documentos', label: `Documentación (${Object.keys(dossier.documents).length})`, icon: FileText },
                {
                  id: 'auditoria',
                  label: `Auditoría (${(systemAuditLogs || []).filter((l) => l.dossierId === dossier.id).length || (dossier.auditHistory || []).length})`,
                  icon: History,
                },
              ] as const
            ).map((t) => {
              const TabIcon = t.icon;
              const on = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`h-10 px-4 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all duration-300 cursor-pointer ${
                    on
                      ? 'bg-gradient-action text-white shadow-glow'
                      : 'text-[#3a5274] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 0: Supplier Data & Full Editing */}
        {activeTab === 'datos' && (
          <div className="p-4 sm:p-5">
            {/* Rol Usuario: se ven los datos pero ningún campo ni botón de edición responde */}
            <fieldset disabled={isReadOnly} className="contents">
              <SupplierDataEditorTab dossier={dossier} reviewerName={reviewerName} />
            </fieldset>
          </div>
        )}

        {/* Tab Contrato & Vigencia */}
        {activeTab === 'contrato' && (
          <div className="p-4 sm:p-6 space-y-5">
            {/* Encabezado de la sección */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <span className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-action text-white grid place-items-center shadow-glow">
                  <Calendar className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-[#0b1d3a] dark:text-white">
                    Vigencia contractual y estado operativo
                  </h3>
                  <p className="text-xs text-[#3a5274] dark:text-slate-400 mt-1 max-w-2xl">
                    Gestión del estado del proveedor según vigencia de contrato o mediante cambio manual motivado con observación registrada (ISO 9001 / SARLAFT).
                  </p>
                </div>
              </div>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => setIsManualStatusModalOpen(true)}
                  className="h-11 px-5 bg-gradient-action text-white font-semibold text-sm rounded-xl shadow-glow flex items-center gap-2 hover:opacity-95 transition-opacity self-start sm:self-auto cursor-pointer shrink-0"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Actualizar contrato / estado</span>
                </button>
              )}
            </div>

            {/* Resumen de estado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="fs-card lift rounded-[22px] p-5 space-y-3 animate-fade-up">
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-gradient-action text-white grid place-items-center">
                    <ShieldCheck className="w-[18px] h-[18px]" />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2c84c4] dark:text-[#69bdd7]">Estado operativo actual</span>
                </div>
                <div>{getStatusBadge(effectiveStatus)}</div>
                <p className="text-[12px] text-[#3a5274] dark:text-slate-400 leading-relaxed">
                  {dossier.manualStatusOverride
                    ? 'Determinado manualmente por el comité con justificación registrada.'
                    : dossier.contractInfo?.contractNumber
                    ? 'Sincronizado automáticamente con la vigencia del contrato formal.'
                    : 'Determinado por la verificación de documentos cargados.'}
                </p>
              </div>

              <div className="fs-card lift rounded-[22px] p-5 space-y-3 animate-fade-up" style={{ animationDelay: '70ms' }}>
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#69bdd7] to-[#2c84c4] text-white grid place-items-center">
                    <Clock className="w-[18px] h-[18px]" />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2c84c4] dark:text-[#69bdd7]">Vigencia contractual</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${contractValidity.badgeClass}`}>
                    {contractValidity.label}
                  </span>
                  {contractValidity.daysRemaining !== null && (
                    <span className="font-display text-lg font-semibold text-[#0b1d3a] dark:text-white tabular-nums">
                      {contractValidity.daysRemaining > 0
                        ? `${contractValidity.daysRemaining} días restantes`
                        : `${Math.abs(contractValidity.daysRemaining)} días vencido`}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[#3a5274] dark:text-slate-400 leading-relaxed">{contractValidity.description}</p>
              </div>

              <div className="fs-card lift rounded-[22px] p-5 space-y-3 animate-fade-up" style={{ animationDelay: '140ms' }}>
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2c84c4] to-[#1d6fb8] text-white grid place-items-center">
                    <RefreshCw className="w-[18px] h-[18px]" />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2c84c4] dark:text-[#69bdd7]">Control de modificación</span>
                </div>
                <div>
                  {dossier.manualStatusOverride ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1d5fa8] dark:text-[#69bdd7] bg-[#2c84c4]/15 px-3 py-1 rounded-lg border border-[#2c84c4]/30">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Modo manual activo</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3a5274] dark:text-slate-200 bg-black/[0.05] dark:bg-white/10 px-3 py-1 rounded-lg border border-black/10 dark:border-white/15">
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Modo automático</span>
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[#3a5274] dark:text-slate-400 leading-relaxed">
                  {dossier.manualStatusOverride
                    ? 'El estado manual prevalece sobre el cálculo automático hasta ser restablecido.'
                    : 'El estado se actualiza dinámicamente según la fecha de terminación del contrato.'}
                </p>
              </div>
            </div>

            {/* Registro de cambio manual */}
            {dossier.manualStatusOverride && (
              <div className="rounded-[22px] border border-[#2c84c4]/35 bg-[#2c84c4]/10 p-5 space-y-3 animate-fade-up">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="font-display text-sm font-semibold text-[#0b1d3a] dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#2c84c4] dark:text-[#69bdd7]" />
                    <span>Registro oficial de cambio de estado manual (ISO 9001 / SARLAFT)</span>
                  </h4>
                  <span className="text-[11px] text-[#3a5274] dark:text-slate-400">
                    Modificado por: <strong>{dossier.manualStatusChangedBy || 'Revisor'}</strong> el {dossier.manualStatusChangedAt || 'Reciente'}
                  </span>
                </div>
                <div className="bg-white/60 dark:bg-white/[0.05] p-3.5 rounded-xl border border-black/10 dark:border-white/10 text-xs text-[#3a5274] dark:text-slate-300">
                  <span className="font-semibold text-[#5d7392] dark:text-slate-400 block mb-1">Motivo / observación registrada obligatoria:</span>
                  <p className="italic">"{dossier.manualStatusReason || 'Sin observación registrada'}"</p>
                </div>
              </div>
            )}

            {/* Datos del contrato */}
            {dossier.contractInfo?.contractNumber ? (
              <div className="fs-card rounded-[24px] overflow-hidden animate-fade-up">
                <div className="flex items-center justify-between gap-3 flex-wrap bg-[#2c84c4]/[0.08] px-5 py-3.5 border-b border-black/[0.07] dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-gradient-action text-white grid place-items-center shadow-glow">
                      <Briefcase className="w-[18px] h-[18px]" />
                    </span>
                    <h4 className="font-display text-base font-semibold text-[#0b1d3a] dark:text-white">Datos contractuales registrados</h4>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#1d5fa8] dark:text-[#69bdd7] bg-[#2c84c4]/12 px-3 py-1 rounded-full border border-[#2c84c4]/30">
                    {dossier.contractInfo.contractNumber}
                  </span>
                </div>

                <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {[
                    { label: 'Tipo de contrato', value: dossier.contractInfo.contractType || 'Contrato de Suministro / Servicios', mono: false, span: '' },
                    { label: 'Fecha de inicio', value: dossier.contractInfo.startDate || 'No registrada', mono: true, span: '' },
                    { label: 'Fecha de vencimiento', value: dossier.contractInfo.endDate || 'No registrada', mono: true, span: '' },
                    {
                      label: 'Valor total (COP)',
                      value: dossier.contractInfo.contractValue != null ? `$ ${dossier.contractInfo.contractValue.toLocaleString('es-CO')}` : 'A convenir',
                      mono: true,
                      span: '',
                    },
                    { label: 'Supervisor Flota Sugamuxi', value: dossier.contractInfo.supervisor || 'Coordinación Administrativa y de Compras', mono: false, span: 'sm:col-span-2' },
                    {
                      label: 'Sincronización automática de estado',
                      value: dossier.contractInfo.autoSyncStatus !== false ? 'Habilitada (Actualiza a Vigente / Por Vencer / Vencido)' : 'Deshabilitada',
                      mono: false,
                      span: 'sm:col-span-2',
                    },
                  ].map((f) => (
                    <div
                      key={f.label}
                      className={`rounded-2xl p-3.5 bg-black/[0.025] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/10 ${f.span}`}
                    >
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2c84c4] dark:text-[#69bdd7]">{f.label}</span>
                      <span className={`block mt-1 text-[15px] font-semibold text-[#0b1d3a] dark:text-white ${f.mono ? 'font-mono' : 'font-display'}`}>
                        {f.value}
                      </span>
                    </div>
                  ))}

                  {dossier.contractInfo.objectDescription && (
                    <div className="sm:col-span-2 lg:col-span-4 rounded-2xl p-4 bg-[#2c84c4]/[0.07] border border-[#2c84c4]/20">
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2c84c4] dark:text-[#69bdd7] mb-1">Objeto contractual</span>
                      <p className="text-[#0b1d3a] dark:text-white text-[13px] leading-relaxed">{dossier.contractInfo.objectDescription}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border-2 border-dashed border-[#2c84c4]/40 bg-[#2c84c4]/[0.04] p-8 text-center space-y-4 animate-fade-up">
                <span className="w-14 h-14 rounded-2xl bg-gradient-action text-white grid place-items-center mx-auto shadow-glow">
                  <Calendar className="w-7 h-7" />
                </span>
                <div>
                  <h4 className="font-display text-lg font-semibold text-[#0b1d3a] dark:text-white">
                    No se ha vinculado contrato formal a este expediente
                  </h4>
                  <p className="text-xs text-[#3a5274] dark:text-slate-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                    El proveedor está operando actualmente bajo el esquema de habilitación documental. Puede registrar los datos contractuales y su fecha de vigencia para control automático.
                  </p>
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setIsManualStatusModalOpen(true)}
                    className="h-11 px-5 bg-gradient-action text-white font-semibold text-sm rounded-xl shadow-glow inline-flex items-center gap-2 cursor-pointer hover:opacity-95 transition-opacity"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Vincular y registrar contrato</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Documents Review */}
        {activeTab === 'documentos' && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-black/10 dark:border-white/10">
              <div>
                <h3 className="font-display text-xl font-semibold text-[#0b1d3a] dark:text-white">
                  Documentos y Requisitos Obligatorios del Proveedor
                </h3>
                <p className="text-xs text-[#5d7392] dark:text-slate-400 mt-0.5">
                  Los revisores técnicos y administradores pueden validar, aprobar, pedir corrección, o modificar y reemplazar directamente los archivos cargados.
                </p>
              </div>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => setIsAddDocOpen(true)}
                  className="h-11 px-5 bg-gradient-action text-white font-semibold text-sm rounded-xl shadow-glow flex items-center gap-2 hover:opacity-95 transition-opacity self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Anexar Documento</span>
                </button>
              )}
            </div>

            {/* Banner Informativo / Habilitación Ficha & Certificado Oficial */}
            <div
              className={`p-5 rounded-[22px] border flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up ${
                allDocumentsApproved
                  ? 'bg-[#2c84c4]/10 border-[#2c84c4]/30 text-[#1d5fa8] dark:text-[#69bdd7]'
                  : 'bg-black/[0.04] dark:bg-white/[0.06] border-black/10 dark:border-white/10 text-[#0b1d3a] dark:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    allDocumentsApproved
                      ? 'bg-gradient-action text-white shadow-glow'
                      : 'bg-black/[0.08] dark:bg-white/10 text-[#3a5274] dark:text-slate-300'
                  }`}
                >
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase flex items-center gap-2 flex-wrap">
                    <span>Ficha Oficial & Certificado de Habilitación</span>
                    {allDocumentsApproved ? (
                      <span className="px-2.5 py-0.5 bg-gradient-action text-white rounded-full text-[10px] font-bold shadow-glow">
                        100% APROBADO &bull; DISPONIBLE
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-black/[0.08] dark:bg-white/10 text-[#3a5274] dark:text-slate-300 rounded-full text-[10px] font-extrabold tracking-wide">
                        Total Expediente: {approvedDocsCount} de {totalDocs} Aprobados ({Math.round((approvedDocsCount / (totalDocs || 1)) * 100)}%)
                      </span>
                    )}
                  </div>

                  {/* Coherent Breakdown between Forms and Support Documents */}
                  <div className="flex items-center gap-2 text-[11px] font-medium text-[#3a5274] dark:text-slate-300 mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 bg-white/70 dark:bg-white/[0.08] px-2.5 py-1 rounded-lg border border-black/10 dark:border-white/10">
                      <FileText className="w-3 h-3 text-[#1d5fa8] dark:text-[#69bdd7]" />
                      Formatos Oficiales: <strong className="text-[#0b1d3a] dark:text-white">{institutionalApprovedCount} de {institutionalTotalCount}</strong>
                    </span>
                    <span className="text-[#5d7392] dark:text-slate-400 font-bold">+</span>
                    <span className="inline-flex items-center gap-1.5 bg-white/70 dark:bg-white/[0.08] px-2.5 py-1 rounded-lg border border-black/10 dark:border-white/10">
                      <Briefcase className="w-3 h-3 text-[#1d5fa8] dark:text-[#69bdd7]" />
                      Soportes & Anexos: <strong className="text-[#0b1d3a] dark:text-white">{supportApprovedCount} de {supportTotalCount}</strong>
                    </span>
                    <span className="text-[#5d7392] dark:text-slate-400 font-bold">=</span>
                    <span className="font-bold text-[#1d5fa8] dark:text-[#69bdd7]">
                      {approvedDocsCount} de {totalDocs} Total Requisitos
                    </span>
                  </div>

                  <p className="text-[11px] text-[#3a5274] dark:text-slate-300 mt-1.5 leading-snug">
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
                  className="h-11 px-5 bg-gradient-action text-white font-semibold text-sm rounded-xl shadow-glow flex items-center gap-2 hover:opacity-95 transition-opacity shrink-0 cursor-pointer self-start sm:self-auto"
                >
                  <Award className="w-4 h-4" />
                  <span>Generar Ficha & Certificado</span>
                </button>
              ) : allDocumentsApproved && expSummary.hasExpiredDocs ? (
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 bg-black/[0.04] dark:bg-white/[0.06] text-[#5d7392] dark:text-slate-400 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 cursor-not-allowed border border-black/10 dark:border-white/10 opacity-60 self-start sm:self-auto"
                  title="Bloqueado: El proveedor posee documentos vencidos"
                >
                  <Award className="w-4 h-4 text-[#5d7392] dark:text-slate-400" />
                  <span>Ficha Bloqueada ({expSummary.expiredCount} doc vencido)</span>
                </button>
              ) : null}
            </div>
            
            {/* Resumen de Vigencias Documentales en Tab Documentos */}
            {expSummary.totalWithExpiration > 0 && (
              <div className={`px-4 py-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                expSummary.hasExpiredDocs
                  ? 'bg-red-500/10 text-[#0b1d3a] border-red-500/40 dark:text-white'
                  : expSummary.hasExpiringSoonDocs
                  ? 'bg-[#2c84c4]/10 text-[#0b1d3a] border-[#2c84c4]/35 dark:text-white'
                  : 'bg-[#2c84c4]/10 text-[#0b1d3a] border-[#2c84c4]/30 dark:text-white'
              }`}>
                <div className="flex items-center gap-2">
                  {expSummary.hasExpiredDocs ? (
                    <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
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
                    <span className="bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/40 px-2 py-0.5 rounded">
                      {expSummary.expiredCount} Vencido(s)
                    </span>
                  )}
                  {expSummary.hasExpiringSoonDocs && (
                    <span className="bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] border border-[#2c84c4]/30 px-2 py-0.5 rounded">
                      {expSummary.expiringSoonCount} Por Vencer (≤30d)
                    </span>
                  )}
                  <span className={expSummary.hasExpiredDocs ? 'text-[#3a5274] dark:text-slate-300' : expSummary.hasExpiringSoonDocs ? 'text-[#3a5274] dark:text-slate-300' : 'text-[#1d5fa8] dark:text-[#69bdd7]'}>
                    {expSummary.validCount} Vigente(s)
                  </span>
                </div>
              </div>
            )}
            
            {/* BLOQUE 1: FORMULARIOS INSTITUCIONALES OFICIALES */}
            <div className="space-y-3">
              <div className="bg-[#2c84c4]/[0.07] p-4 rounded-2xl border border-[#2c84c4]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold uppercase bg-gradient-action text-white px-3 py-1 rounded-full tracking-wider flex items-center gap-1.5 shadow-glow">
                    <FileText className="w-3.5 h-3.5 text-cyan-300" />
                    <span>1. Formularios Institucionales Oficiales</span>
                  </span>
                  <span className="text-xs font-semibold text-[#3a5274] dark:text-slate-300">
                    Formatos FS.GA-FOR-009 y FS.GA-FOR-039
                  </span>
                </div>
                <span className="text-xs font-semibold text-[#1d5fa8] dark:text-[#69bdd7] bg-white/70 dark:bg-white/[0.08] px-3 py-1.5 rounded-xl border border-[#2c84c4]/30 flex items-center gap-1.5 self-start sm:self-auto">
                  <CheckCircle2 className="w-4 h-4 text-[#1d5fa8] dark:text-[#69bdd7]" />
                  <span>Formatos Oficiales: {institutionalApprovedCount} de {institutionalTotalCount} aprobados</span>
                </span>
              </div>

              {/* Institutional Form Form 009 Row */}
            <div className="fs-card lift rounded-[22px] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] px-2.5 py-0.5 rounded border border-[#2c84c4]/30">
                    Formato Oficial
                  </span>
                  <h3 className="font-display text-[15px] font-semibold text-[#0b1d3a] dark:text-white">
                    FS.GA-FOR-009 &bull; Formulario de Inscripción y Actualización de Proveedores
                  </h3>
                </div>
                <div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    dossier.documents['FS_GA_FOR_009']?.status === 'APROBADO'
                      ? 'bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] border-[#2c84c4]/30'
                      : dossier.documents['FS_GA_FOR_009']?.status === 'REQUIERE_CORRECCION'
                      ? 'bg-black/[0.04] dark:bg-white/[0.06] text-[#0b1d3a] dark:text-white border-black/10 dark:border-white/10'
                      : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#0b1d3a] dark:text-white border-black/10 dark:border-white/10'
                  }`}>
                    {dossier.documents['FS_GA_FOR_009']?.status || 'PENDIENTE'}
                  </span>
                </div>
              </div>

              {dossier.documents['FS_GA_FOR_009']?.fileName ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/[0.03] dark:bg-white/[0.05] p-4 rounded-2xl border border-black/[0.06] dark:border-white/10">
                  <div>
                    <div className="font-bold text-xs text-[#0b1d3a] dark:text-white">{dossier.documents['FS_GA_FOR_009'].fileName}</div>
                    <div className="text-[11px] text-[#5d7392] dark:text-slate-400 mt-0.5">
                      Tamaño: {dossier.documents['FS_GA_FOR_009'].fileSize} &bull; Cargado por: {dossier.documents['FS_GA_FOR_009'].uploadedBy} &bull; Versión: {dossier.documents['FS_GA_FOR_009'].formVersion}
                    </div>
                    {dossier.documents['FS_GA_FOR_009'].correction && (
                      <div className="text-[11px] text-[#0b1d3a] dark:text-white bg-black/[0.04] dark:bg-white/[0.06] p-2 rounded mt-2 border border-black/10 dark:border-white/10 font-mono">
                        ℹ Corrección solicitada: "{dossier.documents['FS_GA_FOR_009'].correction?.detailedObservation}"
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenDocPreview(dossier.documents['FS_GA_FOR_009'], 'Formulario de Inscripción FS.GA-FOR-009', 'FS_GA_FOR_009')}
                      className="h-9 px-3 bg-[#2c84c4]/10 hover:bg-black/5 dark:hover:bg-white/10 text-[#1d5fa8] dark:text-[#69bdd7] text-xs font-bold rounded-xl flex items-center gap-1.5 border border-[#2c84c4]/30 cursor-pointer shadow-2xs transition-colors"
                      title="Visualizar documento cargado"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
                      <span>Ver Documento</span>
                    </button>

                    {form009 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFormForModal(form009);
                          setIsViewerModalOpen(true);
                        }}
                        className="h-9 px-3 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/5 dark:hover:bg-white/10 text-[#3a5274] dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-black/10 dark:border-white/10 cursor-pointer transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
                        Formato Blanco
                      </button>
                    )}

                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditDocModal('FS_GA_FOR_009', dossier.documents['FS_GA_FOR_009'], 'Formulario FS.GA-FOR-009')}
                        className="h-9 px-3 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/5 dark:hover:bg-white/10 text-[#0b1d3a] dark:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 border border-black/10 dark:border-white/10 cursor-pointer shadow-2xs transition-colors"
                        title="Modificar o reemplazar este archivo y sus campos"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#3a5274] dark:text-slate-300" />
                        <span>Modificar / Reemplazar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenCorrectionModal('FS_GA_FOR_009', 'Formulario FS.GA-FOR-009')}
                      className="h-9 px-3 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/5 dark:hover:bg-white/10 text-[#0b1d3a] dark:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 border border-black/10 dark:border-white/10 cursor-pointer transition-colors shadow-2xs"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
                      Pedir Corrección
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveDoc('FS_GA_FOR_009')}
                      className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-blue-600 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      Aprobar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-black/[0.03] dark:bg-white/[0.05] p-4 rounded-2xl border border-black/[0.06] dark:border-white/10">
                  <span className="text-xs text-[#5d7392] dark:text-slate-400 italic">Documento no cargado aún.</span>
                  {!isReadOnly && (
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
                      className="h-9 px-3 bg-[#2c84c4]/10 hover:bg-black/5 dark:hover:bg-white/10 text-[#1d5fa8] dark:text-[#69bdd7] text-xs font-bold rounded-xl flex items-center gap-1.5 border border-[#2c84c4]/30 cursor-pointer transition-colors"
                    >
                      <FileUp className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
                      <span>Cargar / Asignar Archivo</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Institutional Form Form 039 Row */}
            <div className="fs-card lift rounded-[22px] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] px-2.5 py-0.5 rounded border border-[#2c84c4]/30">
                    Formato Oficial
                  </span>
                  <h3 className="font-display text-[15px] font-semibold text-[#0b1d3a] dark:text-white">
                    FS.GA-FOR-039 &bull; Autorización para el Tratamiento de Datos Personales
                  </h3>
                </div>
                <div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    dossier.documents['FS_GA_FOR_039']?.status === 'APROBADO'
                      ? 'bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] border-[#2c84c4]/30'
                      : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#0b1d3a] dark:text-white border-black/10 dark:border-white/10'
                  }`}>
                    {dossier.documents['FS_GA_FOR_039']?.status || 'PENDIENTE'}
                  </span>
                </div>
              </div>

              {dossier.documents['FS_GA_FOR_039']?.fileName ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/[0.03] dark:bg-white/[0.05] p-4 rounded-2xl border border-black/[0.06] dark:border-white/10">
                  <div>
                    <div className="font-bold text-xs text-[#0b1d3a] dark:text-white">{dossier.documents['FS_GA_FOR_039'].fileName}</div>
                    <div className="text-[11px] text-[#5d7392] dark:text-slate-400 mt-0.5">
                      Tamaño: {dossier.documents['FS_GA_FOR_039'].fileSize} &bull; Versión: {dossier.documents['FS_GA_FOR_039'].formVersion}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenDocPreview(dossier.documents['FS_GA_FOR_039'], 'Autorización FS.GA-FOR-039', 'FS_GA_FOR_039')}
                      className="h-9 px-3 bg-[#2c84c4]/10 hover:bg-black/5 dark:hover:bg-white/10 text-[#1d5fa8] dark:text-[#69bdd7] text-xs font-bold rounded-xl flex items-center gap-1.5 border border-[#2c84c4]/30 cursor-pointer shadow-2xs transition-colors"
                      title="Visualizar documento cargado"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
                      <span>Ver Documento</span>
                    </button>

                    {form039 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFormForModal(form039);
                          setIsViewerModalOpen(true);
                        }}
                        className="h-9 px-3 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/5 dark:hover:bg-white/10 text-[#3a5274] dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-black/10 dark:border-white/10 cursor-pointer transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
                        Formato Blanco
                      </button>
                    )}

                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditDocModal('FS_GA_FOR_039', dossier.documents['FS_GA_FOR_039'], 'Autorización FS.GA-FOR-039')}
                        className="h-9 px-3 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/5 dark:hover:bg-white/10 text-[#0b1d3a] dark:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 border border-black/10 dark:border-white/10 cursor-pointer shadow-2xs transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#3a5274] dark:text-slate-300" />
                        <span>Modificar / Reemplazar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenCorrectionModal('FS_GA_FOR_039', 'Autorización FS.GA-FOR-039')}
                      className="h-9 px-3 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/5 dark:hover:bg-white/10 text-[#0b1d3a] dark:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 border border-black/10 dark:border-white/10 cursor-pointer transition-colors shadow-2xs"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
                      Pedir Corrección
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveDoc('FS_GA_FOR_039')}
                      className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-blue-600 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      Aprobar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-black/[0.03] dark:bg-white/[0.05] p-4 rounded-2xl border border-black/[0.06] dark:border-white/10">
                  <span className="text-xs text-[#5d7392] dark:text-slate-400 italic">Documento no cargado aún.</span>
                  {!isReadOnly && (
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
                      className="h-9 px-3 bg-[#2c84c4]/10 hover:bg-black/5 dark:hover:bg-white/10 text-[#1d5fa8] dark:text-[#69bdd7] text-xs font-bold rounded-xl flex items-center gap-1.5 border border-[#2c84c4]/30 cursor-pointer transition-colors"
                    >
                      <FileUp className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
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
            <div className="bg-[#2c84c4]/[0.07] p-4 rounded-xl border border-[#2c84c4]/30 shadow-2xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold uppercase bg-gradient-action text-white px-3 py-1 rounded-full tracking-wider flex items-center gap-1.5 shadow-glow">
                      <Briefcase className="w-3.5 h-3.5 text-blue-200" />
                      <span>2. Documentos Soporte y Anexos Tributarios</span>
                    </span>
                    <span className="text-[11px] font-bold text-[#3a5274] dark:text-slate-300 bg-white px-2.5 py-0.5 rounded-full border border-black/10 dark:border-white/10 shadow-2xs">
                      {isNatural ? 'Régimen: Persona Natural' : 'Régimen: Persona Jurídica'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-xs font-semibold text-[#3a5274] dark:text-slate-300">
                      Categoría / Servicio Asignado:
                    </span>
                    <span className="text-xs font-black text-[#1d5fa8] dark:text-[#69bdd7] bg-[#2c84c4]/10 px-2.5 py-0.5 rounded-md border border-[#2c84c4]/30 inline-flex items-center gap-1.5 shadow-2xs">
                      <Layers className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
                      <span>{dossier.selectedCategory}</span>
                    </span>
                    {currentCatConfig?.economicCode && (
                      <span className="text-[11px] font-mono font-bold text-[#1d5fa8] dark:text-[#69bdd7] bg-white px-2 py-0.5 rounded border border-[#2c84c4]/30 shadow-2xs">
                        Código: {currentCatConfig.economicCode}
                      </span>
                    )}
                    {currentCatConfig?.riskLevel && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-black/[0.04] dark:bg-white/[0.06] text-[#0b1d3a] dark:text-white border-black/10 dark:border-white/10">
                        Riesgo: {currentCatConfig.riskLevel}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-1 shrink-0">
                  <span className="text-xs font-bold text-[#1d5fa8] dark:text-[#69bdd7] bg-white px-3 py-1.5 rounded-lg border border-[#2c84c4]/30 shadow-2xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1d5fa8] dark:text-[#69bdd7]" />
                    <span>Soportes y Anexos: {supportApprovedCount} de {supportTotalCount} aprobados</span>
                  </span>
                  <span className="text-[10.5px] text-[#5d7392] dark:text-slate-400 font-medium">
                    (+ {institutionalApprovedCount} formatos oficiales = {approvedDocsCount} de {totalDocs} total expediente)
                  </span>
                </div>
              </div>

              <p className="text-[11.5px] text-[#3a5274] dark:text-slate-300 leading-relaxed border-t border-[#2c84c4]/30 pt-2">
                ℹ Los requerimientos documentales y anexos tributarios de este bloque se parametrizan dinámicamente según la <strong>Categoría o Servicio Asignado ({dossier.selectedCategory})</strong> y la naturaleza jurídica del postulante para el Sistema Integrado de Gestión de Flota Sugamuxi S.A.
              </p>
            </div>

              <div className="fs-card divide-y divide-black/10 dark:divide-white/10 rounded-2xl overflow-hidden">
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
                            ? 'bg-[#2c84c4]/10 border-l-4 border-l-blue-600'
                            : doc.status === 'REQUIERE_CORRECCION'
                            ? 'bg-black/[0.04] dark:bg-white/[0.06] border-l-4 border-l-slate-400'
                            : 'hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                      >
                        <div className="space-y-1.5 max-w-lg">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-[#0b1d3a] dark:text-white">
                              {docTitle}
                            </span>
                            <span className="font-mono text-[10px] text-[#5d7392] dark:text-slate-400 bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded border border-black/10 dark:border-white/10">
                              [{code}]
                            </span>
                            {isActivityReq && (
                              <span className="text-[10px] font-bold text-[#1d5fa8] dark:text-[#69bdd7] bg-[#2c84c4]/10 px-2 py-0.5 rounded border border-[#2c84c4]/30">
                                Exigencia por Actividad
                              </span>
                            )}
                            {isBaseReq && !isActivityReq && (
                              <span className="text-[10px] font-medium text-[#3a5274] dark:text-slate-300 bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 rounded border border-black/10 dark:border-white/10">
                                Requisito Base
                              </span>
                            )}
                          </div>

                          {docDef?.description && (
                            <p className="text-[11px] text-[#5d7392] dark:text-slate-400 leading-snug">
                              {docDef.description}
                            </p>
                          )}

                          {docDef?.validityRule && (
                            <div className="text-[10.5px] text-[#1d5fa8] dark:text-[#69bdd7] font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#1d5fa8] dark:text-[#69bdd7] shrink-0" />
                              <span>Regla SIG: {docDef.validityRule}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-[#5d7392] dark:text-slate-400">
                            <span>{doc.fileName ? `Archivo: ${doc.fileName} (${doc.fileSize || '1.4 MB'})` : 'Pendiente de cargue de soporte por el revisor'}</span>
                            {doc.expirationDate && (
                              <span className="font-mono text-[#3a5274] dark:text-slate-300 font-semibold">
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
                            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#1d5fa8] dark:text-[#69bdd7] bg-[#2c84c4]/10 px-2.5 py-0.5 rounded border border-[#2c84c4]/30 shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7] shrink-0" />
                              <span>POR VENCER: Restan {docExp.daysRemaining} días para vencer ({doc.expirationDate})</span>
                            </div>
                          )}
                          {docExp.status === 'VIGENTE' && (
                            <div className="inline-flex items-center gap-1 text-[10px] font-medium text-[#1d5fa8] dark:text-[#69bdd7] bg-[#2c84c4]/10 px-2 py-0.5 rounded border border-[#2c84c4]/30">
                              <CheckCircle2 className="w-3 h-3 text-[#1d5fa8] dark:text-[#69bdd7] shrink-0" />
                              <span>Vigente (restan {docExp.daysRemaining} días)</span>
                            </div>
                          )}

                          {doc.notes && (
                            <p className="text-[11px] text-[#3a5274] dark:text-slate-300 italic">
                              Nota: {doc.notes}
                            </p>
                          )}
                          {doc.correction && (
                            <div className="text-[11px] text-[#0b1d3a] dark:text-white bg-black/[0.04] dark:bg-white/[0.06] p-2 rounded mt-1 border border-black/10 dark:border-white/10 font-mono">
                              ℹ Observación: "{doc.correction.detailedObservation}"
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            doc.status === 'APROBADO' || doc.status === 'VIGENTE'
                              ? 'bg-[#2c84c4]/12 text-[#1d5fa8] dark:text-[#69bdd7] border-[#2c84c4]/35'
                              : doc.status === 'POR_VENCER'
                              ? 'bg-[#2c84c4]/12 text-[#1d5fa8] dark:text-[#69bdd7] border-[#2c84c4]/35 font-bold'
                              : doc.status === 'VENCIDO'
                              ? 'bg-slate-900 text-cyan-300 border-slate-700 font-bold'
                              : doc.status === 'REQUIERE_CORRECCION'
                              ? 'bg-[#2c84c4]/12 text-[#1d5fa8] dark:text-[#69bdd7] border-[#2c84c4]/35'
                              : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#0b1d3a] dark:text-white border-black/10 dark:border-white/10'
                          }`}>
                            {doc.status}
                          </span>

                          {doc.fileName && (
                            <button
                              type="button"
                              onClick={() => handleOpenDocPreview(doc, docTitle, code)}
                              className="h-9 px-3 bg-[#2c84c4]/10 hover:bg-black/5 dark:hover:bg-white/10 text-[#1d5fa8] dark:text-[#69bdd7] text-xs font-bold rounded-xl flex items-center gap-1.5 border border-[#2c84c4]/30 cursor-pointer shadow-2xs transition-colors"
                              title="Visualizar documento cargado"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
                              <span>Ver Documento</span>
                            </button>
                          )}

                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditDocModal(code, doc, docTitle)}
                              className={`h-9 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 border cursor-pointer shadow-2xs transition-colors ${
                                doc.fileName
                                  ? 'bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/5 dark:hover:bg-white/10 text-[#0b1d3a] dark:text-white border-black/10 dark:border-white/10'
                                  : 'bg-[#2c84c4]/10 hover:bg-black/5 dark:hover:bg-white/10 text-[#1d5fa8] dark:text-[#69bdd7] border-[#2c84c4]/30'
                              }`}
                              title={doc.fileName ? 'Modificar información, vigencia o sustituir archivo' : 'Cargar archivo soporte por el revisor'}
                            >
                              {doc.fileName ? (
                                <>
                                  <Edit3 className="w-3.5 h-3.5 text-[#3a5274] dark:text-slate-300" />
                                  <span>Modificar Doc</span>
                                </>
                              ) : (
                                <>
                                  <FileUp className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
                                  <span>Cargar Doc</span>
                                </>
                              )}
                            </button>
                          )}

                          {doc.fileName && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenCorrectionModal(code, docTitle)}
                                className="h-9 px-3 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/5 dark:hover:bg-white/10 text-[#0b1d3a] dark:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 border border-black/10 dark:border-white/10 cursor-pointer transition-colors shadow-2xs"
                              >
                                <AlertCircle className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" />
                                Corrección
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApproveDoc(code)}
                                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-blue-600 cursor-pointer transition-colors"
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



        {/* Tab 5: Audit Trail */}
        {activeTab === 'auditoria' && (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <span className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-action text-white grid place-items-center shadow-glow">
                  <History className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-[#0b1d3a] dark:text-white">
                    Historial y trazabilidad del proveedor
                  </h3>
                  <p className="text-xs text-[#3a5274] dark:text-slate-400 mt-1">
                    Registro inmutable de todas las modificaciones y acciones auditables para {supplierName} ({dossier.fileNumber}).
                  </p>
                </div>
              </div>
              <span className="self-start sm:self-auto shrink-0 text-xs font-semibold bg-[#2c84c4]/12 text-[#1d5fa8] dark:text-[#69bdd7] px-3.5 py-1.5 rounded-full border border-[#2c84c4]/30">
                {systemAuditLogs.filter((l) => l.dossierId === dossier.id).length} eventos registrados
              </span>
            </div>

            {/* Eventos de modificación de datos */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2c84c4] dark:text-[#69bdd7]">
                Eventos de auditoría y modificaciones de datos
              </h4>

              {systemAuditLogs.filter((l) => l.dossierId === dossier.id).length > 0 ? (
                <ol className="relative space-y-3 pl-7 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-[#2c84c4] before:to-transparent">
                  {systemAuditLogs
                    .filter((l) => l.dossierId === dossier.id)
                    .map((log) => (
                      <li key={log.id} className="relative">
                        <span className="absolute -left-7 top-4 w-[23px] h-[23px] rounded-full bg-gradient-action grid place-items-center ring-4 ring-[#2c84c4]/15">
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        </span>
                        <div className="fs-card rounded-2xl p-4 space-y-2.5 text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display text-sm font-semibold text-[#0b1d3a] dark:text-white">{log.fieldChanged}</span>
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  log.action === 'CAMBIO_ESTADO'
                                    ? 'bg-[#2c84c4]/20 text-[#1d5fa8] dark:text-[#69bdd7] dark:text-[#69bdd7]'
                                    : 'bg-[#2c84c4]/15 text-[#1d5fa8] dark:text-[#69bdd7]'
                                }`}
                              >
                                {log.action}
                              </span>
                              <span className="text-[10px] font-semibold text-[#5d7392] dark:text-slate-400 bg-black/[0.05] dark:bg-white/10 px-2 py-0.5 rounded-full">
                                {log.userRole === 'ADMIN' ? 'ADMINISTRADOR' : 'REVISOR TÉCNICO'}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] text-[#5d7392] dark:text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {log.formattedDate}
                            </span>
                          </div>

                          {log.action === 'EDICION_CAMPO' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              <div className="rounded-xl p-2.5 bg-red-500/[0.07] border border-red-500/20 text-[#5d7392] dark:text-slate-400 line-through">
                                <span className="font-semibold no-underline mr-1">Anterior:</span>
                                {log.oldValue || '(Vacío)'}
                              </div>
                              <div className="rounded-xl p-2.5 bg-[#2c84c4]/[0.08] border border-[#2c84c4]/35 text-[#1d5fa8] dark:text-[#69bdd7] dark:text-[#69bdd7] font-medium">
                                <span className="font-semibold text-[#5d7392] dark:text-slate-400 mr-1">Nuevo:</span>
                                {log.newValue || '(Vacío)'}
                              </div>
                            </div>
                          )}

                          {log.justification && (
                            <p className="text-[#3a5274] dark:text-slate-300 text-xs italic bg-black/[0.04] dark:bg-white/[0.06] p-2.5 rounded-xl border border-black/10 dark:border-white/10">
                              <strong>Motivo / justificación:</strong> "{log.justification}"
                            </p>
                          )}

                          <div className="text-[10px] text-[#5d7392] dark:text-slate-400">
                            Responsable: <strong className="text-[#3a5274] dark:text-slate-300">{log.user}</strong> &bull; Sección: {log.section}
                          </div>
                        </div>
                      </li>
                    ))}
                </ol>
              ) : (
                <div className="p-6 text-center text-[#5d7392] dark:text-slate-400 rounded-2xl border border-dashed border-[#2c84c4]/35 bg-[#2c84c4]/[0.04] text-xs">
                  No hay modificaciones de campos registradas para este expediente.
                </div>
              )}
            </div>

            {/* Línea de tiempo del flujo de revisión */}
            <div className="space-y-3 pt-5 border-t border-black/[0.07] dark:border-white/10">
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2c84c4] dark:text-[#69bdd7]">
                Línea de tiempo del flujo de revisión
              </h4>

              <ol className="relative space-y-3 pl-7 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-[#69bdd7] before:to-transparent">
                {(dossier.auditHistory || []).map((aud) => (
                  <li key={aud.id} className="relative">
                    <span className="absolute -left-7 top-3.5 w-[23px] h-[23px] rounded-full bg-gradient-to-br from-[#69bdd7] to-[#2c84c4] grid place-items-center ring-4 ring-[#69bdd7]/15">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </span>
                    <div className="fs-card rounded-2xl p-3.5 space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-semibold text-[#0b1d3a] dark:text-white">{aud.action}</span>
                          <span className="text-[10px] font-semibold text-[#5d7392] dark:text-slate-400 bg-black/[0.05] dark:bg-white/10 px-2 py-0.5 rounded-full">
                            {aud.role}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-[#5d7392] dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {aud.timestamp}
                        </span>
                      </div>
                      {aud.notes && <p className="text-[#3a5274] dark:text-slate-300 text-[11px] font-mono">{aud.notes}</p>}
                      <div className="text-[10px] text-[#5d7392] dark:text-slate-400">Usuario: {aud.user}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

      </div>


      {/* Modal for Requesting Granular Correction */}
      {isCorrectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
          <div className="fs-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
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
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs text-[#3a5274] dark:text-slate-300 scrollbar-thin scrollbar-thumb-slate-300">
                <div>
                  <label className="block text-xs font-semibold text-[#0b1d3a] dark:text-white mb-1">
                    Motivo Principal de Corrección
                  </label>
                  <input
                    type="text"
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="Ej. Información bancaria incompleta"
                    className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 font-semibold text-[#0b1d3a] dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0b1d3a] dark:text-white mb-1">
                    Página o Sección Específica Observada
                  </label>
                  <input
                    type="text"
                    value={correctionSection}
                    onChange={(e) => setCorrectionSection(e.target.value)}
                    placeholder="Ej. Numeral III (Información Bancaria) o Página 2"
                    className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 font-semibold text-[#0b1d3a] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0b1d3a] dark:text-white mb-1">
                    Observación Detallada para el Proveedor <span className="text-[#1d5fa8] dark:text-[#69bdd7]">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={correctionDetail}
                    onChange={(e) => setCorrectionDetail(e.target.value)}
                    placeholder="Escriba la instrucción clara y detallada para que el proveedor subsane el documento..."
                    className="w-full px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 text-[#0b1d3a] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                    required
                  />
                </div>

                <div className="bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 p-3 rounded-lg text-[11px] text-[#0b1d3a] dark:text-white">
                  <p className="font-semibold text-[#0b1d3a] dark:text-white">Principio de No Rechazo Total:</p>
                  <p className="text-[#3a5274] dark:text-slate-300">
                    El expediente pasará a estado <strong>REQUIERE CORRECCIÓN</strong> permitiendo al proveedor reemplazar únicamente este requisito sin reiniciar todo su proceso.
                  </p>
                </div>
              </div>

              <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-black/[0.04] dark:bg-white/[0.06] border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsCorrectionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#3a5274] dark:text-slate-300 hover:text-[#0b1d3a] dark:hover:text-white cursor-pointer rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
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
          requiresExpirationDate={
            (documentDefinitions || []).find((d) => d.code === editingDocCode)?.requiresExpirationDate ?? false
          }
          validityRule={
            (documentDefinitions || []).find((d) => d.code === editingDocCode)?.validityRule
          }
          userRole={role}
          reviewerName={reviewerName}
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
          !isReadOnly && (previewDocCode || previewDocObj)
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
          !isReadOnly && (previewDocCode || previewDocObj)
            ? () => {
                const code = previewDocCode || previewDocObj?.code || '';
                const titleToCorrect = previewDocTitle;
                setIsPreviewDocOpen(false);
                handleOpenCorrectionModal(code, titleToCorrect);
              }
            : undefined
        }
        onApproveDoc={
          !isReadOnly && (previewDocCode || previewDocObj)
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

