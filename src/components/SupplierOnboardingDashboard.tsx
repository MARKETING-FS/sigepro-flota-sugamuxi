import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Upload,
  Eye,
  FileText,
  Building2,
  User,
  ShieldCheck,
  ArrowRight,
  Info,
  HelpCircle,
  RefreshCw,
  Trash2,
  Send,
  AlertTriangle,
  FileCheck2,
  FileCheck,
  Home,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  Briefcase,
  UserPlus,
  Search,
  Lock,
  Bus,
  AlertOctagon,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { storageService } from '../services/storageService';
import { InstitutionalForm, DocumentCode, SupplierDocument } from '../types';
import { DOCUMENT_CATALOG_INFO } from '../data/initialData';
import { InstitutionalFormsViewerModal } from './InstitutionalFormsViewerModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { FlotaSugamuxiLogo, FlotaSugamuxiEmblem } from './FlotaSugamuxiLogo';
import { SupplierLoginPortal } from './SupplierLoginPortal';
import { ExpedienteProgressBar } from './ExpedienteProgressBar';
import { DocumentExpirationAlertBanner } from './dossier/DocumentExpirationAlertBanner';
import { DocumentExpirationBadge } from './dossier/DocumentExpirationBadge';
import { getDossierDocumentExpirationSummary, calculateDocumentExpiration } from '../utils/contractValidity';

export const SupplierOnboardingDashboard: React.FC = () => {
  const {
    role,
    isSupplierLoggedIn,
    supplierPortalTab,
    setSupplierPortalTab,
    setActiveView,
    supplierLogout,
    currentDossier,
    institutionalForms,
    categoriesConfig,
    baseRequirementsConfig,
    documentDefinitions,
    getRequiredDocumentsForSupplier,
    uploadDocument,
    removeDocument,
    submitDossierForReview,
    updateBasicInfo,
  } = useApp();

  const getDocInfo = (docCode: string) => {
    const dynamicDoc = documentDefinitions.find((d) => d.code === docCode);
    if (dynamicDoc) {
      return {
        name: dynamicDoc.name,
        category: dynamicDoc.category,
        description: dynamicDoc.description,
        validityRule: dynamicDoc.validityRule,
        requiresExpirationDate: dynamicDoc.requiresExpirationDate ?? false,
      };
    }
    const cat = DOCUMENT_CATALOG_INFO[docCode];
    if (cat) {
      return {
        name: cat.name,
        category: 'LEGAL',
        description: cat.description,
        validityRule: cat.validityRule || 'Vigente',
        requiresExpirationDate: false,
      };
    }
    return {
      name: docCode,
      category: 'LEGAL',
      description: 'Documento soporte exigido para el proceso de habilitación',
      validityRule: 'Vigente',
      requiresExpirationDate: false,
    };
  };

  const [selectedFormForModal, setSelectedFormForModal] = useState<InstitutionalForm | null>(null);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  // File upload simulated input reference
  const [uploadingDocCode, setUploadingDocCode] = useState<string | null>(null);

  // Preview uploaded support document state
  const [isPreviewDocOpen, setIsPreviewDocOpen] = useState(false);
  const [previewDocObj, setPreviewDocObj] = useState<SupplierDocument | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>('');
  const [docVigenciaFilter, setDocVigenciaFilter] = useState<'ALL' | 'EXPIRING_SOON' | 'EXPIRED'>('ALL');

  const handleOpenDocPreview = (doc: SupplierDocument, title?: string) => {
    setPreviewDocObj(doc);
    setPreviewDocTitle(title || doc.name);
    setIsPreviewDocOpen(true);
  };

  // If user is in PROVEEDOR role and is not logged in, show the portal
  // Once logged in as a provider, NEVER show registration or login forms
  if (role === 'PROVEEDOR' && (!isSupplierLoggedIn || !currentDossier)) {
    return <SupplierLoginPortal />;
  }

  if (!currentDossier) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm mt-8">
        <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Ningún expediente de proveedor seleccionado</h2>
        <p className="text-xs text-slate-500 mt-1">
          Por favor seleccione un expediente existente desde la barra superior o cree uno nuevo con el botón "Nuevo Registro".
        </p>
      </div>
    );
  }

  const { basicInfo, documents, processStatus, fileNumber, isEmailVerified, selectedCategory } = currentDossier;
  const isNatural = basicInfo.supplierType === 'NATURAL';
  const supplierDisplayName = isNatural ? basicInfo.fullName : basicInfo.companyName;
  const supplierIdNumber = isNatural ? basicInfo.documentNumber : basicInfo.nit;

  const form009 = institutionalForms.find((f) => f.code === 'FS.GA-FOR-009') || institutionalForms[0];
  const form039 = institutionalForms.find((f) => f.code === 'FS.GA-FOR-039') || institutionalForms[1];

  const currentCatConfig =
    categoriesConfig.find((c) => c.category === selectedCategory) || categoriesConfig[0];

  const currentBaseConfig = baseRequirementsConfig[basicInfo.supplierType] || baseRequirementsConfig['NATURAL'];

  const {
    allMandatory: rawMandatorySupportDocs = [],
    allOptional: rawOptionalSupportDocs = [],
    baseMandatory,
    activityMandatory,
    baseOptional,
    activityOptional,
  } = getRequiredDocumentsForSupplier(basicInfo.supplierType, selectedCategory);

  // Ordenar de acuerdo al orden parametrizado y creado en la Matriz de Requisitos (documentDefinitions)
  const getMatrixDocOrder = (code: string): number => {
    const defIdx = documentDefinitions.findIndex((d) => d.code === code);
    if (defIdx !== -1) return defIdx;

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

  const mandatorySupportDocs = [...rawMandatorySupportDocs].sort((a, b) => {
    const ordA = getMatrixDocOrder(a);
    const ordB = getMatrixDocOrder(b);
    if (ordA !== ordB) return ordA - ordB;
    return a.localeCompare(b);
  });

  const optionalSupportDocs = [...rawOptionalSupportDocs].sort((a, b) => {
    const ordA = getMatrixDocOrder(a);
    const ordB = getMatrixDocOrder(b);
    if (ordA !== ordB) return ordA - ordB;
    return a.localeCompare(b);
  });

  // Calculate Progress %
  const totalMandatoryItems = 1 + 1 + 1 + mandatorySupportDocs.length; // Step 1 + Form 009 + Form 039 + Support docs
  let completedItems = 1; // Basic info is always completed once account is created

  const doc009 = documents['FS_GA_FOR_009'];
  const doc039 = documents['FS_GA_FOR_039'];

  const is009Loaded = doc009 && doc009.status !== 'PENDIENTE' && doc009.fileName;
  const is039Loaded = doc039 && doc039.status !== 'PENDIENTE' && doc039.fileName;

  if (is009Loaded) completedItems += 1;
  if (is039Loaded) completedItems += 1;

  mandatorySupportDocs.forEach((code) => {
    const doc = documents[code];
    if (doc && doc.status !== 'PENDIENTE' && doc.fileName) {
      completedItems += 1;
    }
  });

  const progressPercentage = Math.round((completedItems / totalMandatoryItems) * 100);
  const expirationSummary = getDossierDocumentExpirationSummary(currentDossier);

  // Check if Ready for Submission
  const isReadyToSubmit =
    isEmailVerified &&
    is009Loaded &&
    is039Loaded &&
    mandatorySupportDocs.every((code) => {
      const doc = documents[code];
      return doc && doc.status !== 'PENDIENTE' && doc.fileName;
    });

  // Handle Mock File Upload
  const handleTriggerUpload = (docCode: string) => {
    setUploadingDocCode(docCode);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.png,.jpeg,.xlsx,.xls';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        // Validar tamaño máximo de 5 MB
        if (file.size > 5 * 1024 * 1024) {
          const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
          alert(`El archivo "${file.name}" pesa ${sizeMb} MB y supera el tamaño máximo permitido de 5 MB. Por favor seleccione o comprima un archivo más liviano.`);
          return;
        }

        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        const formattedSize = file.size > 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`;
        uploadDocument(currentDossier.id, docCode, {
          name: file.name,
          size: formattedSize || '850 KB',
        });
      } else {
        // Fallback simulate upload
        const sampleNames: Record<string, string> = {
          FS_GA_FOR_009: `FS.GA-FOR-009_v14_${supplierDisplayName?.replace(/\s+/g, '_')}_Firmado.pdf`,
          FS_GA_FOR_039: `FS.GA-FOR-039_v1.0_HabeasData_${supplierDisplayName?.replace(/\s+/g, '_')}.pdf`,
          RUT: `RUT_2026_${supplierDisplayName?.replace(/\s+/g, '_')}.pdf`,
          CAMARA_COMERCIO: `Camara_Comercio_${supplierDisplayName?.replace(/\s+/g, '_')}_Vigente.pdf`,
          CEDULA_REP_LEGAL: `Cedula_Rep_Legal_150.pdf`,
          CEDULA_NATURAL: `Documento_Identidad_${supplierIdNumber}.pdf`,
          CERTIFICACION_BANCARIA: `Certificacion_Bancaria_Oficial_Agosto2026.pdf`,
          ESTADOS_FINANCIEROS: `Estados_Financieros_2025_Certificados.pdf`,
          PORTAFOLIO_SERVICIOS: `Portafolio_Comercial_${supplierDisplayName?.replace(/\s+/g, '_')}.pdf`,
          HOJA_DE_VIDA: `Hoja_de_Vida_${supplierDisplayName?.replace(/\s+/g, '_')}.pdf`,
          CERTIFICADOS_ESTUDIO: `Diplomas_Certificados_Estudio.pdf`,
          SEGURIDAD_SOCIAL: `Planilla_PILA_Seguridad_Social_MesVigente.pdf`,
          CERTIFICADO_CONFORMIDAD: `Certificado_Conformidad_NormaTecnica.pdf`,
          POLIZA_RCE: `Poliza_Responsabilidad_Civil_Extracontractual.pdf`,
        };
        uploadDocument(currentDossier.id, docCode, {
          name: sampleNames[docCode] || `${docCode}_Soporte.pdf`,
          size: '1.2 MB',
        });
      }
    };
    input.click();
  };

  const handleOpenViewer = (form: InstitutionalForm) => {
    setSelectedFormForModal(form);
    setIsViewerModalOpen(true);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateBasicInfo(currentDossier.id, {}, e.target.value);
  };

  const handleConfirmSubmit = () => {
    const res = submitDossierForReview(currentDossier.id);
    setSubmitFeedback(res);
    if (res.success) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
    }
  };

  const getDocStatusBadge = (status?: string) => {
    switch (status) {
      case 'APROBADO':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200"><CheckCircle2 className="w-3 h-3 text-blue-600" /> Aprobado</span>;
      case 'REQUIERE_CORRECCION':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300"><AlertCircle className="w-3 h-3 text-blue-600" /> Requiere Corrección</span>;
      case 'EN_REVISION':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300"><Clock className="w-3 h-3 text-blue-600" /> En Revisión</span>;
      case 'CARGADO':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200"><FileCheck2 className="w-3 h-3 text-blue-600" /> Cargado (Listo)</span>;
      case 'RECHAZADO':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300"><AlertCircle className="w-3 h-3 text-slate-500" /> Rechazado</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"><Clock className="w-3 h-3 text-slate-400" /> Pendiente</span>;
    }
  };

  const hasCorrections = (Object.values(documents) as SupplierDocument[]).some((d) => d.status === 'REQUIERE_CORRECCION');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      
      {/* Active Supplier Session Banner (When logged in as PROVEEDOR) */}
      {role === 'PROVEEDOR' && (
        <div className="bg-white text-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 dark:from-[#0b1329] dark:via-[#0f1d40] dark:to-[#0b1329] dark:border-blue-900/60 dark:bg-[#0b1329] dark:text-white">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 dark:bg-blue-600/20 dark:border-blue-500/40 dark:text-cyan-300">
              {isNatural ? <User className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                  {supplierDisplayName}
                </span>
                <span className="text-[10px] text-slate-700 font-mono bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 dark:text-cyan-300 dark:bg-blue-950/80 dark:border-cyan-700/50">
                  {isNatural ? `CC: ${supplierIdNumber}` : `NIT: ${supplierIdNumber}`}
                </span>
                <span className="text-[10px] text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 dark:text-slate-300 dark:bg-slate-800/80 dark:border-slate-700">
                  Radicado: <strong className="text-slate-900 dark:text-white">{fileNumber}</strong>
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <span>Estado de Habilitación:</span>
                {processStatus === 'APROBADO' || processStatus === 'PROVEEDOR_HABILITADO' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-950 border border-blue-200 dark:bg-blue-950 dark:text-cyan-300 dark:border-cyan-500/50">
                    <CheckCircle2 className="w-3 h-3 text-blue-700 dark:text-cyan-300" /> Habilitado / Aprobado Oficialmente
                  </span>
                ) : processStatus === 'REQUIERE_CORRECCION' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600">
                    <AlertCircle className="w-3 h-3 text-slate-600 dark:text-slate-300" /> Requiere Corrección de Soportes
                  </span>
                ) : processStatus === 'EN_REVISION' || processStatus === 'CORREGIDO_EN_REVISION' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-cyan-300 dark:border-cyan-500/50">
                    <Clock className="w-3 h-3 text-blue-600 dark:text-cyan-300" /> En Revisión Técnica y SARLAFT
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                    <FileText className="w-3 h-3 text-slate-500 dark:text-blue-200" /> Borrador / Documentación en Carga
                  </span>
                )}

                {/* Badges de Alertas de Vencimiento SIG */}
                {expirationSummary.hasExpiredDocs && (
                  <button
                    type="button"
                    onClick={() => {
                      setSupplierPortalTab('login');
                      setTimeout(() => {
                        const el = document.getElementById('alertas-vencimiento-sig');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 50);
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-700 animate-pulse cursor-pointer shadow-2xs"
                    title="Documento(s) vencido(s): Inhabilita operaciones según políticas del SIG"
                  >
                    <AlertOctagon className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                    <span>{expirationSummary.expiredCount} {expirationSummary.expiredCount === 1 ? 'Doc. vencido' : 'Docs. vencidos'} (Inhabilita SIG)</span>
                  </button>
                )}

                {expirationSummary.hasExpiringSoonDocs && (
                  <button
                    type="button"
                    onClick={() => {
                      setSupplierPortalTab('login');
                      setTimeout(() => {
                        const el = document.getElementById('alertas-vencimiento-sig');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 50);
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700 animate-pulse cursor-pointer shadow-2xs"
                    title="Alerta Preventiva SIG: Documento(s) próximo(s) a vencer en ≤ 30 días"
                  >
                    <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>{expirationSummary.expiringSoonCount} {expirationSummary.expiringSoonCount === 1 ? 'Doc. por vencer' : 'Docs. por vencer'} (&le; 30d SIG)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => supplierLogout()}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs dark:bg-slate-800/90 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700"
              title="Cerrar sesión e ingresar con otro proveedor o NIT"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180 text-blue-600 dark:text-cyan-300" />
              <span>Cerrar Sesión / Cambiar Proveedor</span>
            </button>
          </div>
        </div>
      )}

      {/* Selector de Sección para Proveedor Autenticado (Separación de Bienvenida y Mi Expediente SIG) */}
      {role === 'PROVEEDOR' && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSupplierPortalTab('welcome')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                supplierPortalTab === 'welcome'
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                  : 'bg-white dark:bg-[#0b1329] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Home className={`w-3.5 h-3.5 ${supplierPortalTab === 'welcome' ? 'text-white' : 'text-blue-600 dark:text-cyan-300'}`} />
              <span>Inicio / Bienvenida</span>
            </button>

            <button
              type="button"
              onClick={() => setSupplierPortalTab('login')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                supplierPortalTab !== 'welcome'
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                  : 'bg-white dark:bg-[#0b1329] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <FileCheck className={`w-3.5 h-3.5 ${supplierPortalTab !== 'welcome' ? 'text-white' : 'text-blue-600 dark:text-cyan-300'}`} />
              <span>Mi Expediente SIG</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  supplierPortalTab !== 'welcome'
                    ? 'bg-blue-800 text-cyan-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {fileNumber}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
            <span>Sección activa:</span>
            <span className="font-bold text-slate-800 dark:text-white">
              {supplierPortalTab === 'welcome' ? 'Inicio / Bienvenida SIGEPRO' : 'Gestión Documental de Expediente'}
            </span>
          </div>
        </div>
      )}
      
      {/* ======================================================== */}
      {/* VISTA 1: SECCIÓN DE INICIO / BIENVENIDA (Separada)       */}
      {/* ======================================================== */}
      {role === 'PROVEEDOR' && supplierPortalTab === 'welcome' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* 1. Header Banner Estandarizado Claro */}
          <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs relative overflow-hidden dark:bg-[#0b1329] dark:text-white dark:border-blue-900/60">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-start gap-3 max-w-3xl">
                <div className="hidden sm:flex shrink-0 p-1.5 rounded-xl bg-blue-50/80 border border-blue-100 shadow-xs dark:bg-white">
                  <FlotaSugamuxiEmblem className="w-10 h-10" color="#0080d7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full dark:bg-cyan-950/80 dark:text-cyan-400 dark:border-cyan-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-cyan-300 animate-pulse"></span>
                      CANAL OFICIAL DE PROVEEDORES Y CONTRATISTAS
                    </span>
                  </div>

                  <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>SIGEPRO - Sistema Integral de Gestión de Proveedores y Vinculación</span>
                  </h1>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    Bienvenido al Portal de Proveedores de <strong>Flota Sugamuxi S.A.</strong> Radique su portafolio, diligencie los formatos oficiales y consulte su estado.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2 self-start md:self-center">
                <div className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 dark:border-slate-700/80 dark:bg-slate-900/60 dark:text-slate-300">
                  <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-300" />
                  <span>Acceso Seguro SIG</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Welcome Card matching Screenshot 1 */}
          <div className="bg-white dark:bg-[#0b1329] rounded-2xl border border-slate-200 dark:border-blue-900/60 shadow-xs p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-cyan-300 block">
                    SISTEMA INTEGRAL DE GESTIÓN DE PROVEEDORES
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Bienvenido a Flota Sugamuxi S.A.
                  </h2>
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Conectando aliados estratégicos con los más altos estándares de calidad, seguridad y cumplimiento.
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                En <strong>Flota Sugamuxi S.A.</strong> valoramos el talento, la solidez y el compromiso de nuestros contratistas. Como empresa líder en transporte terrestre en Colombia, garantizamos procesos de selección y homologación transparentes y ágiles a través de nuestra plataforma oficial <strong>SIGEPRO</strong>.
              </p>
            </div>

            {/* Right Logo Card */}
            <div className="shrink-0 p-4 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3 shadow-2xs">
              <FlotaSugamuxiLogo variant="light" size="lg" />
              <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
                  EMPRESA LÍDER
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-white block">
                  Flota Sugamuxi S.A.
                </span>
              </div>
            </div>
          </div>

          {/* 3. Quick Access Cards Row (Interactive) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div
              onClick={() => setSupplierPortalTab('login')}
              className="bg-white dark:bg-[#0b1329] rounded-2xl border border-slate-200 dark:border-blue-900/50 p-5 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 transition-all flex items-start gap-4 cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-cyan-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white block">
                    MI EXPEDIENTE SIG
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-transform group-hover:translate-x-1" />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Diligencie los formatos oficiales FS.GA-FOR-009 y 039, y cargue sus soportes obligatorios.
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-cyan-400 mt-2">
                  Abrir expediente &rarr;
                </span>
              </div>
            </div>

            <div
              onClick={() => setActiveView('convocatorias')}
              className="bg-white dark:bg-[#0b1329] rounded-2xl border border-slate-200 dark:border-blue-900/50 p-5 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 transition-all flex items-start gap-4 cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-cyan-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white block">
                    CONVOCATORIAS VIGENTES
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-transform group-hover:translate-x-1" />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Consulte términos de referencia abiertos para transporte, repuestos y logística.
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-cyan-400 mt-2">
                  Ver convocatorias &rarr;
                </span>
              </div>
            </div>

          </div>

          {/* 4. Tarjeta Destacada de Acceso a Mi Expediente SIG */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-[#0b1329] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-blue-700/50 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider bg-white/10 px-2.5 py-0.5 rounded-full text-cyan-300 border border-white/20">
                  <FileCheck className="w-3.5 h-3.5" /> Expediente Digital Activo
                </span>
                <span className="text-xs font-mono bg-blue-950/90 text-white px-2.5 py-0.5 rounded-md border border-blue-600/60">
                  Radicado: {fileNumber}
                </span>
                <span className="text-xs text-blue-200">
                  Avance: <strong className="text-cyan-300">{progressPercentage}%</strong>
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                Diligenciamiento y Soportes de Vinculación Oficial
              </h3>
              <p className="text-xs text-blue-100/80 leading-relaxed font-normal">
                Ingrese a la sección <strong>Mi Expediente SIG</strong> para completar o actualizar los formatos institucionales FS.GA-FOR-009 y FS.GA-FOR-039, adjuntar certificados y consultar observaciones del comité evaluador de Flota Sugamuxi S.A.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSupplierPortalTab('login')}
                className="px-5 py-3 bg-white hover:bg-blue-50 text-blue-900 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer group"
              >
                <FileCheck className="w-4 h-4 text-blue-700 group-hover:scale-110 transition-transform" />
                <span>Gestionar Mi Expediente SIG</span>
                <ArrowRight className="w-4 h-4 text-blue-700 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 2: SECCIÓN MI EXPEDIENTE SIG (Separada)            */}
      {/* ======================================================== */}
      {!(role === 'PROVEEDOR' && supplierPortalTab === 'welcome') && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* 4. Active Dossier Progress Card */}
          <div className="bg-white dark:bg-[#0b1329] rounded-2xl shadow-xs border border-slate-200 dark:border-blue-900/60 p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-cyan-300 px-2.5 py-0.5 rounded-full">
                Expediente Digital
              </span>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                {fileNumber}
              </span>
              {!isEmailVerified && (
                <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-blue-600 dark:text-cyan-400" /> Correo no verificado
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {supplierDisplayName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{isNatural ? 'Persona Natural' : 'Persona Jurídica'} &bull; {isNatural ? `C.C. ${basicInfo.documentNumber}` : `NIT ${basicInfo.nit}`}</span>
              <span className="text-slate-300 dark:text-slate-700">&bull;</span>
              <span>{basicInfo.city}</span>
              <span className="text-slate-300 dark:text-slate-700">&bull;</span>
              <span className="text-blue-600 dark:text-cyan-400 font-medium">{basicInfo.email}</span>
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estado del Proceso</span>
            <div className="mt-1">
              {processStatus === 'PROVEEDOR_HABILITADO' && (
                <span className="px-3.5 py-1.5 rounded-xl bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-300" /> Proveedor Habilitado (Activo)
                </span>
              )}
              {processStatus === 'APROBADO' && (
                <span className="px-3.5 py-1.5 rounded-xl bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-cyan-300" /> Expediente Aprobado
                </span>
              )}
              {processStatus === 'EN_REVISION' && (
                <span className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs">
                  <Clock className="w-4 h-4 text-cyan-200" /> En Revisión Interna Flota Sugamuxi
                </span>
              )}
              {processStatus === 'CORREGIDO_EN_REVISION' && (
                <span className="px-3.5 py-1.5 rounded-xl bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs">
                  <RefreshCw className="w-4 h-4 text-cyan-200" /> Corregido — En Revisión
                </span>
              )}
              {processStatus === 'REQUIERE_CORRECCION' && (
                <span className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs border border-slate-700 animate-pulse">
                  <AlertCircle className="w-4 h-4 text-blue-400" /> Requiere Corrección de Documentos
                </span>
              )}
              {processStatus === 'DOCUMENTACION_PENDIENTE' && (
                <span className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs">
                  <Layers className="w-4 h-4 text-blue-400" /> Documentación Pendiente
                </span>
              )}
              {processStatus === 'BORRADOR' && (
                <span className="px-3.5 py-1.5 rounded-xl bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs">
                  <FileText className="w-4 h-4 text-slate-300" /> Borrador Inicial
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar with Professional Polish Style */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800">
              Completa tu Inscripción como Proveedor
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Progreso General:</span>
            <div className="w-44 sm:w-56 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full transition-all duration-500 rounded-full bg-blue-600"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="font-extrabold text-blue-600 font-mono text-xs w-10 text-right">
              {progressPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Progreso de Expediente: Formatos FS.GA-FOR-009 y FS.GA-FOR-039 */}
      <ExpedienteProgressBar
        doc009={doc009}
        doc039={doc039}
        form009={form009}
        form039={form039}
        onTriggerUpload={handleTriggerUpload}
        onOpenViewer={handleOpenViewer}
        onOpenDocPreview={handleOpenDocPreview}
        onScrollToStep={(stepId) => {
          const el = document.getElementById(stepId);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      />

      {/* SISTEMA DE ALERTAS DE VIGENCIA Y VENCIMIENTO SIG */}
      <div id="alertas-vencimiento-sig">
        <DocumentExpirationAlertBanner
          dossier={currentDossier}
          onTriggerUpload={handleTriggerUpload}
          onOpenDocPreview={handleOpenDocPreview}
        />
      </div>

      {/* Prominent Correction Alert Banner if REQUIERE_CORRECCION */}
      {processStatus === 'REQUIERE_CORRECCION' && hasCorrections && (
        <div className="bg-slate-100 border-2 border-slate-300 rounded-lg p-5 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-100 text-blue-900 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-sm">
                Atención: Solicitud de Corrección Documental
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                El comité de compras o revisores de Flota Sugamuxi S.A. han revisado su expediente y solicitan corregir exclusivamente los siguientes puntos antes de proceder con la aprobación:
              </p>

              <div className="mt-3 space-y-2">
                {(Object.values(documents) as SupplierDocument[])
                  .filter((d) => d.status === 'REQUIERE_CORRECCION' && d.correction)
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white border border-slate-300 rounded-md p-3 text-xs shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="flex items-center gap-1.5 text-blue-950">
                          <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                          {doc.name} {doc.formCode && `(${doc.formCode})`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Solicitado por: {doc.correction?.requestedBy}
                        </span>
                      </div>
                      {doc.correction?.sectionOrPage && (
                        <div className="text-[11px] font-semibold text-slate-700">
                          Sección o numeral observado: <span className="text-blue-900">{doc.correction.sectionOrPage}</span>
                        </div>
                      )}
                      <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 font-mono">
                        "{doc.correction?.detailedObservation}"
                      </div>
                      <div className="pt-1 flex items-center justify-end">
                        <button
                          onClick={() => handleTriggerUpload(doc.code)}
                          className="px-3 py-1.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-[11px] rounded-md shadow-xs flex items-center gap-1 transition-colors cursor-pointer border border-blue-700"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Subir documento corregido
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Professional Polish Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: 5 Onboarding Steps (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* PASO 1: Información Básica (Completed Style) */}
          <div className="bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-blue-900/50 rounded-lg p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-cyan-300 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                    1. Información Básica de la Cuenta
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Datos de contacto e identificación registrados en el sistema
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-cyan-300 border border-blue-200 dark:border-blue-800 px-2 py-1 rounded font-bold uppercase tracking-wider shrink-0">
                Completado
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50 dark:bg-slate-900/60 p-3 rounded-md">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Tipo Proveedor</span>
                <span className="font-semibold text-slate-900 dark:text-white">{isNatural ? 'Persona Natural' : 'Persona Jurídica'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{isNatural ? 'Cédula' : 'NIT'}</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{supplierIdNumber}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Correo Electrónico</span>
                <span className="font-semibold text-slate-900 dark:text-white truncate block">{basicInfo.email}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Teléfono / Ciudad</span>
                <span className="font-semibold text-slate-900 dark:text-white">{basicInfo.phone} ({basicInfo.city})</span>
              </div>
              {!isNatural && basicInfo.representativeLegalName && (
                <div className="col-span-2 sm:col-span-4 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Representante Legal: <strong className="text-slate-800 dark:text-white">{basicInfo.representativeLegalName}</strong> ({basicInfo.representativeLegalDocType} {basicInfo.representativeLegalDocNumber})</span>
                </div>
              )}
            </div>
          </div>

          {/* PASO 2: Formulario FS.GA-FOR-009 (Active Step Card with Notch) */}
          <div id="paso-form-009" className="bg-white dark:bg-[#0b1329] border-2 border-blue-100 dark:border-blue-900/60 rounded-lg p-6 shadow-xs relative">
            <div className="absolute -left-1 top-6 w-2 h-10 bg-blue-600 rounded-r"></div>

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                  2. FORMATO OFICIAL
                </span>
                <span className="text-[10px] text-slate-400 font-bold font-mono">
                  FS.GA-FOR-009 (v{form009?.currentVersion || '14.0'})
                </span>
              </div>
              <div>{getDocStatusBadge(doc009?.status)}</div>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Formulario de Inscripción y Actualización de Proveedores
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Es obligatorio descargar el formato oficial vigente de Flota Sugamuxi S.A., diligenciar los numerales I al V, firmar con huella o certificado digital, y cargarlo escaneado en PDF.
            </p>

            {/* 3-Column Action Buttons Grid matching Professional Polish theme */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
              <button
                type="button"
                onClick={() => handleOpenViewer(form009)}
                className="flex flex-col items-center justify-center p-3 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group cursor-pointer"
              >
                <Download className="w-5 h-5 text-blue-600 dark:text-cyan-300 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Descargar Formato</span>
                <span className="text-[9px] text-slate-400">PDF Oficial Vigente</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenViewer(form009)}
                className="flex flex-col items-center justify-center p-3 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group cursor-pointer"
              >
                <HelpCircle className="w-5 h-5 text-slate-600 dark:text-slate-300 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Instrucciones SIG</span>
                <span className="text-[9px] text-slate-400">Guía de Diligenciamiento</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerUpload('FS_GA_FOR_009')}
                className="flex flex-col items-center justify-center p-3 bg-blue-600 border border-blue-700 rounded-md hover:bg-blue-700 transition-colors text-white cursor-pointer shadow-xs"
              >
                <Upload className="w-5 h-5 text-white mb-1" />
                <span className="text-[11px] font-bold">
                  {is009Loaded ? 'Reemplazar Archivo' : 'Subir Formato'}
                </span>
                <span className="text-[9px] text-blue-100">PDF Diligenciado y Firmado</span>
              </button>
            </div>

            {/* Uploaded File Slot / Status */}
            {is009Loaded ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-md border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0">
                    PDF
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{doc009.fileName}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{doc009.fileSize}</span>
                      <span>&bull;</span>
                      <span>Cargado: {doc009.uploadedAt}</span>
                      <span>&bull;</span>
                      <span className="text-blue-700 dark:text-cyan-300 font-medium">Versión oficial {doc009.formVersion}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDocPreview(doc009, 'Formulario de Inscripción FS.GA-FOR-009')}
                    className="px-2.5 py-1 text-white bg-blue-700 hover:bg-blue-800 rounded font-semibold transition-colors text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Ver documento cargado"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Documento</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenViewer(form009)}
                    className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                    title="Ver plantilla institucional oficial"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                    <span>Plantilla</span>
                  </button>
                  {processStatus !== 'EN_REVISION' && processStatus !== 'PROVEEDOR_HABILITADO' && (
                    <button
                      type="button"
                      onClick={() => removeDocument(currentDossier.id, 'FS_GA_FOR_009')}
                      className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      title="Eliminar archivo cargado"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-md text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                <span>Formato pendiente de carga. Recuerde firmar la declaración SARLAFT en el numeral V.</span>
              </div>
            )}
          </div>

          {/* PASO 3: Formulario FS.GA-FOR-039 (Habeas Data) */}
          <div id="paso-form-039" className="bg-white dark:bg-[#0b1329] border-2 border-blue-100 dark:border-blue-900/60 rounded-lg p-6 shadow-xs relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded-full font-bold">
                  3. TRATAMIENTO DE DATOS
                </span>
                <span className="text-[10px] text-slate-400 font-bold font-mono">
                  FS.GA-FOR-039 (v{form039.currentVersion})
                </span>
              </div>
              <div>{getDocStatusBadge(doc039?.status)}</div>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Autorización para el Tratamiento de Datos Personales
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Cumplimiento estricto Ley 1581 de 2012 (Habeas Data). Descargue la autorización oficial, firme con cédula y huella, y adjunte el documento escaneado.
            </p>

            {/* 3 Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
              <button
                type="button"
                onClick={() => handleOpenViewer(form039)}
                className="flex flex-col items-center justify-center p-3 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group cursor-pointer"
              >
                <Download className="w-5 h-5 text-blue-600 dark:text-cyan-300 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Descargar Formato</span>
                <span className="text-[9px] text-slate-400">FS.GA-FOR-039 Oficial</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenViewer(form039)}
                className="flex flex-col items-center justify-center p-3 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group cursor-pointer"
              >
                <HelpCircle className="w-5 h-5 text-slate-600 dark:text-slate-300 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">Normatividad</span>
                <span className="text-[9px] text-slate-400">Ley 1581 de 2012</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerUpload('FS_GA_FOR_039')}
                className="flex flex-col items-center justify-center p-3 bg-blue-600 border border-blue-700 rounded-md hover:bg-blue-700 transition-colors text-white cursor-pointer shadow-xs"
              >
                <Upload className="w-5 h-5 text-white mb-1" />
                <span className="text-[11px] font-bold">
                  {is039Loaded ? 'Reemplazar Archivo' : 'Subir Autorización'}
                </span>
                <span className="text-[9px] text-blue-100">PDF Firmado y Escaneado</span>
              </button>
            </div>

            {/* Uploaded File Slot */}
            {is039Loaded ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-md border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0">
                    PDF
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{doc039.fileName}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{doc039.fileSize}</span>
                      <span>&bull;</span>
                      <span>Cargado: {doc039.uploadedAt}</span>
                      <span>&bull;</span>
                      <span className="text-blue-700 dark:text-cyan-300 font-medium">Versión {doc039.formVersion}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDocPreview(doc039, 'Autorización para el Tratamiento de Datos Personales (FS.GA-FOR-039)')}
                    className="px-2.5 py-1 text-white bg-blue-700 hover:bg-blue-800 rounded font-semibold transition-colors text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Ver documento cargado"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Documento</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenViewer(form039)}
                    className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                    title="Ver plantilla institucional oficial"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                    <span>Plantilla</span>
                  </button>
                  {processStatus !== 'EN_REVISION' && processStatus !== 'PROVEEDOR_HABILITADO' && (
                    <button
                      type="button"
                      onClick={() => removeDocument(currentDossier.id, 'FS_GA_FOR_039')}
                      className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      title="Eliminar archivo cargado"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-md text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Obligatorio adjuntar la autorización firmada para la inclusión en el expediente digital.</span>
              </div>
            )}
          </div>

          {/* PASO 4: XII. DOCUMENTOS A ANEXAR CON LA SOLICITUD según Tipo de Persona y Actividad Económica */}
          <div className="bg-white dark:bg-[#0b1329] border-2 border-slate-200 dark:border-blue-900/60 rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-blue-900 text-white px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                  XII. DOCUMENTOS A ANEXAR CON LA SOLICITUD
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                  {isNatural ? '1. PERSONAS NATURALES' : '2. PERSONAS JURÍDICAS'}
                </span>
              </div>
              <div className="text-xs font-bold text-blue-700 dark:text-cyan-300 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded border border-blue-100 dark:border-blue-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-300" />
                <span>{mandatorySupportDocs.filter((code) => documents[code]?.fileName).length} de {mandatorySupportDocs.length} obligatorios cargados</span>
              </div>
            </div>

            {/* Actividad Económica & Parametrización Bar */}
            <div className="bg-gradient-to-r from-blue-50/90 via-slate-50 to-blue-50/70 dark:from-slate-900/90 dark:via-blue-950/50 dark:to-slate-900/90 p-4.5 rounded-xl border border-blue-200/90 dark:border-blue-900/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-300" />
                    <span>Actividad Económica / Categoría del Proveedor:</span>
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    {role === 'PROVEEDOR'
                      ? 'Actividad asignada formalmente por el Revisor Técnico o Administrador General al crear el proveedor.'
                      : 'Los documentos requeridos se parametrizan dinámicamente según la actividad económica seleccionada.'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {role === 'PROVEEDOR' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
                      <Lock className="w-3 h-3 text-blue-700 dark:text-cyan-300" />
                      Asignada por Flota Sugamuxi S.A.
                    </span>
                  )}
                  {currentCatConfig?.economicCode && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1 rounded-md bg-blue-900 text-cyan-300 border border-blue-800 shrink-0">
                      {currentCatConfig.economicCode}
                    </span>
                  )}
                </div>
              </div>

              {role === 'PROVEEDOR' ? (
                /* Modo Solo Lectura / Bloqueado para el Aspirante/Proveedor */
                <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-300/80 dark:border-slate-700 rounded-xl p-3.5 shadow-2xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-cyan-300 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                          {selectedCategory}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {currentCatConfig?.description || 'Línea de servicio registrada'}
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                      <span>Parámetro Fijo (No editable por aspirante)</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <Info className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      Los requisitos y formatos exigidos se configuran de acuerdo a esta actividad. Si requiere reclasificación o modificación de su código CIIU, debe solicitarlo a la Coordinación de Compras / Revisor Técnico.
                    </span>
                  </div>
                </div>
              ) : (
                /* Modo Editable para Revisor Técnico y Administrador General */
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-blue-900 dark:text-cyan-200 bg-blue-100/70 dark:bg-blue-950/70 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900">
                    <span>Privilegio de Revisor Técnico / Administrador: Puede reasignar la actividad</span>
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    {categoriesConfig.map((c) => (
                      <option key={c.category} value={c.category}>
                        {c.category} {c.economicCode ? `(${c.economicCode})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                    {currentCatConfig?.description || ''}
                  </p>
                </div>
              )}
            </div>

            {/* Checklist of Mandatory Support Documents */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <span>Documentos Exigidos Obligatorios ({mandatorySupportDocs.length})</span>
                </h4>

                {/* Filtro interactivo por Alerta de Vigencia SIG */}
                {(expirationSummary.hasExpiringSoonDocs || expirationSummary.hasExpiredDocs) && (
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setDocVigenciaFilter('ALL')}
                      className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                        docVigenciaFilter === 'ALL'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Todos ({mandatorySupportDocs.length})
                    </button>
                    {expirationSummary.hasExpiringSoonDocs && (
                      <button
                        type="button"
                        onClick={() => setDocVigenciaFilter('EXPIRING_SOON')}
                        className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                          docVigenciaFilter === 'EXPIRING_SOON'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>Próximos a vencer ({expirationSummary.expiringSoonCount})</span>
                      </button>
                    )}
                    {expirationSummary.hasExpiredDocs && (
                      <button
                        type="button"
                        onClick={() => setDocVigenciaFilter('EXPIRED')}
                        className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                          docVigenciaFilter === 'EXPIRED'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50'
                        }`}
                      >
                        <AlertOctagon className="w-3 h-3" />
                        <span>Vencidos ({expirationSummary.expiredCount})</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#0b1329] shadow-2xs">
                {mandatorySupportDocs
                  .filter((code) => {
                    if (docVigenciaFilter === 'ALL') return true;
                    const doc = documents[code];
                    if (!doc || !doc.expirationDate) return false;
                    const exp = calculateDocumentExpiration(doc.expirationDate);
                    if (docVigenciaFilter === 'EXPIRING_SOON') return exp.isExpiringSoon;
                    if (docVigenciaFilter === 'EXPIRED') return exp.isExpired;
                    return true;
                  })
                  .map((docCode) => {
                  const catalog = getDocInfo(docCode);
                  const doc = documents[docCode];
                  const isLoaded = doc && doc.status !== 'PENDIENTE' && doc.fileName;
                  const isCorr = doc?.status === 'REQUIERE_CORRECCION';

                  return (
                    <div
                      key={docCode}
                      className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isCorr ? 'bg-slate-50 dark:bg-slate-900/60' : 'hover:bg-slate-50/60 dark:hover:bg-slate-900/40'
                      }`}
                    >
                      <div className="space-y-0.5 max-w-md">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {catalog?.name || docCode}
                          </span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-300 dark:border-slate-700">
                            Obligatorio
                          </span>
                          {baseMandatory.includes(docCode) && (
                            <span className="text-[10px] font-bold text-blue-800 dark:text-cyan-300 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                              <User className="w-2.5 h-2.5" /> Requisito Base {isNatural ? 'P. Natural' : 'P. Jurídica'}
                            </span>
                          )}
                          {activityMandatory.includes(docCode) && (
                            <span className="text-[10px] font-bold text-blue-900 dark:text-cyan-200 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                              <Briefcase className="w-2.5 h-2.5" /> Requisito por Actividad ({selectedCategory})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {catalog?.description}
                        </p>
                        {catalog?.validityRule && (
                          <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                            <strong>Vigencia / Regla:</strong> {catalog.validityRule}
                          </p>
                        )}
                        {isLoaded && (
                          <div className="pt-1.5 flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-mono text-blue-700 dark:text-cyan-400 font-medium">
                              {doc.fileName} ({doc.fileSize})
                            </span>
                            <DocumentExpirationBadge
                              expirationDate={doc.expirationDate}
                              validityRule={catalog?.validityRule}
                              requiresExpirationDate={catalog?.requiresExpirationDate}
                              showDetails={true}
                            />
                          </div>
                        )}
                        {isCorr && doc.correction && (
                          <div className="text-[11px] text-blue-900 dark:text-cyan-200 bg-blue-50 dark:bg-blue-950/60 p-1.5 rounded mt-1 border border-blue-200 dark:border-blue-800 font-mono">
                            ℹ Corrección: {doc.correction.detailedObservation}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {getDocStatusBadge(doc?.status)}
                          {isLoaded && doc.expirationDate && (
                            <DocumentExpirationBadge
                              expirationDate={doc.expirationDate}
                              showDetails={false}
                            />
                          )}
                        </div>
                        {isLoaded ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenDocPreview(doc, catalog?.name || docCode)}
                              className="px-2.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Visualizar documento cargado"
                            >
                              <Eye className="w-3.5 h-3.5 text-cyan-300" />
                              <span>Ver</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTriggerUpload(docCode)}
                              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
                              title="Reemplazar archivo"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Reemplazar</span>
                            </button>
                            {processStatus !== 'EN_REVISION' && processStatus !== 'PROVEEDOR_HABILITADO' && (
                              <button
                                type="button"
                                onClick={() => removeDocument(currentDossier.id, docCode)}
                                className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTriggerUpload(docCode)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Cargar soporte</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Optional Documents (Si aplica / Según aplique) */}
            {optionalSupportDocs.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-slate-500" />
                    <span>Documentos Condicionales / Si Aplica según Actividad ({optionalSupportDocs.length})</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    Según aplique a su actividad o régimen
                  </span>
                </div>
                
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/40 dark:bg-[#0b1329] shadow-2xs">
                  {optionalSupportDocs.map((docCode) => {
                    const catalog = getDocInfo(docCode);
                    const doc = documents[docCode];
                    const isLoaded = doc && doc.status !== 'PENDIENTE' && doc.fileName;

                    return (
                      <div
                        key={docCode}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0b1329]"
                      >
                        <div className="space-y-0.5 max-w-md">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                              {catalog?.name || docCode}
                            </span>
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-300 dark:border-slate-700">
                              Si Aplica
                            </span>
                            {baseOptional.includes(docCode) && (
                              <span className="text-[10px] font-bold text-blue-800 dark:text-cyan-300 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                                <User className="w-2.5 h-2.5" /> Opcional Base {isNatural ? 'P. Natural' : 'P. Jurídica'}
                              </span>
                            )}
                            {activityOptional.includes(docCode) && (
                              <span className="text-[10px] font-bold text-blue-900 dark:text-cyan-200 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                                <Briefcase className="w-2.5 h-2.5" /> Opcional por Actividad ({selectedCategory})
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {catalog?.description}
                          </p>
                          {catalog?.validityRule && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              <strong>Vigencia:</strong> {catalog.validityRule}
                            </p>
                          )}
                          {isLoaded && (
                            <div className="pt-1 flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-mono text-blue-700 dark:text-cyan-400 font-medium">
                                {doc.fileName} ({doc.fileSize})
                              </span>
                              <DocumentExpirationBadge
                                expirationDate={doc.expirationDate}
                                validityRule={catalog?.validityRule}
                                requiresExpirationDate={catalog?.requiresExpirationDate}
                                showDetails={true}
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isLoaded ? (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                {getDocStatusBadge(doc?.status)}
                                {doc.expirationDate && (
                                  <DocumentExpirationBadge
                                    expirationDate={doc.expirationDate}
                                    showDetails={false}
                                  />
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenDocPreview(doc, catalog?.name || docCode)}
                                className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Visualizar documento cargado"
                              >
                                <Eye className="w-3.5 h-3.5 text-cyan-300" />
                                <span>Ver</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => removeDocument(currentDossier.id, docCode)}
                                className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTriggerUpload(docCode)}
                              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-md flex items-center gap-1 cursor-pointer transition-colors border border-slate-200 dark:border-slate-700"
                            >
                              <Upload className="w-3 h-3 text-slate-500" />
                              <span>Adjuntar (Si aplica)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* PASO 5: Enviar Solicitud para Revisión */}
          <div className={`rounded-lg border shadow-xs p-6 text-center transition-all ${
            isReadyToSubmit
              ? 'bg-slate-900 text-white border-slate-800 shadow-md'
              : 'bg-white dark:bg-[#0b1329] border-slate-200 dark:border-blue-900/60 text-slate-700 dark:text-slate-300'
          }`}>
            <div className="max-w-xl mx-auto space-y-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                isReadyToSubmit ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                <Send className="w-5 h-5" />
              </div>

              <div>
                <h3 className={`text-base font-bold uppercase tracking-wider ${
                  isReadyToSubmit ? 'text-white' : 'text-slate-900 dark:text-white'
                }`}>
                  5. Radicación de Expediente Digital
                </h3>
                <p className={`text-xs mt-1 leading-relaxed ${
                  isReadyToSubmit ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {isReadyToSubmit
                    ? 'Todos los requisitos obligatorios han sido completados exitosamente. Puede enviar su expediente digital para la revisión interna por parte del comité de Flota Sugamuxi S.A.'
                    : 'Este botón se habilitará automáticamente una vez estén cargados los formatos FS.GA-FOR-009, FS.GA-FOR-039 y los documentos soporte obligatorios.'}
                </p>
              </div>

              {/* Validation Checklist Indicators */}
              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] py-2 ${
                isReadyToSubmit ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'
              }`}>
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Datos Básicos</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  {is009Loaded ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>FS.GA-FOR-009</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  {is039Loaded ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>FS.GA-FOR-039</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  {mandatorySupportDocs.every((code) => documents[code]?.fileName) ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>Soportes ({mandatorySupportDocs.length})</span>
                </div>
              </div>

              {/* Main Submit Trigger */}
              <button
                type="button"
                disabled={!isReadyToSubmit || processStatus === 'EN_REVISION'}
                onClick={() => setIsSubmitModalOpen(true)}
                className={`w-full sm:w-auto px-8 py-3 rounded-lg font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 mx-auto ${
                  isReadyToSubmit && processStatus !== 'EN_REVISION'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>
                  {processStatus === 'REQUIERE_CORRECCION'
                    ? 'REENVIAR EXPEDIENTE CORREGIDO PARA REVISIÓN'
                    : processStatus === 'EN_REVISION'
                    ? 'EXPEDIENTE ENVIADO (EN REVISIÓN INTERNA)'
                    : 'ENVIAR SOLICITUD PARA REVISIÓN'}
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Dossier Summary, Guidelines & Institutional Form Badges (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Resumen del Expediente Box matching theme */}
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold border-b border-slate-700 pb-3 uppercase tracking-wider text-slate-200">
              Resumen del Expediente
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Tipo de Proveedor:</span>
                <span className="font-semibold text-white">
                  {isNatural ? 'Persona Natural' : 'Persona Jurídica'}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Radicado Oficial:</span>
                <span className="font-mono bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-cyan-300 font-bold">
                  {fileNumber}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Identificación:</span>
                <span className="font-mono text-white font-semibold">
                  {supplierIdNumber}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Confirmación Correo:</span>
                <span className={isEmailVerified ? "text-cyan-400 font-bold flex items-center gap-1" : "text-slate-400 font-semibold"}>
                  {isEmailVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                  {isEmailVerified ? 'Verificado' : 'Pendiente'}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Estado de Vinculación:</span>
                <span className="text-cyan-300 font-bold">
                  {processStatus.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">FS.GA-FOR-009 (v14.0):</span>
                <span className={is009Loaded ? "text-cyan-400 font-semibold" : "text-slate-500"}>
                  {is009Loaded ? 'Cargado' : 'Pendiente'}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">FS.GA-FOR-039 (v1.0):</span>
                <span className={is039Loaded ? "text-cyan-400 font-semibold" : "text-slate-500"}>
                  {is039Loaded ? 'Cargado' : 'Pendiente'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-800 rounded-md border border-slate-700 text-[11px] text-slate-300 space-y-1">
              <span className="font-bold text-white block">Custodia Documental:</span>
              <p className="text-slate-400 leading-relaxed text-[10px]">
                Los documentos y formatos cargados se archivarán bajo protocolos oficiales del Sistema Integrado de Gestión (SIG) de Flota Sugamuxi S.A.
              </p>
            </div>

            <button
              type="button"
              disabled={!isReadyToSubmit || processStatus === 'EN_REVISION'}
              onClick={() => setIsSubmitModalOpen(true)}
              className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors shadow-xs ${
                isReadyToSubmit && processStatus !== 'EN_REVISION'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {processStatus === 'REQUIERE_CORRECCION'
                ? 'Reenviar Corrección'
                : 'Radicar Expediente'}
            </button>
          </div>

          {/* Ayuda al Proveedor Card matching theme */}
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-blue-900 dark:text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-700 dark:text-cyan-400" />
              <span>Ayuda al Proveedor</span>
            </h4>
            <ul className="space-y-2 text-[11px] text-blue-900/80 dark:text-slate-300 leading-relaxed list-disc list-inside">
              <li>
                <strong>Formatos Vigentes:</strong> Descargue siempre los formatos oficiales <strong>FS.GA-FOR-009</strong> y <strong>FS.GA-FOR-039</strong>.
              </li>
              <li>
                <strong>Firma y Huella:</strong> El representante legal o persona natural debe firmar con huella o certificado digital.
              </li>
              <li>
                <strong>Certificación Bancaria:</strong> Debe tener fecha de expedición no mayor a 30 días calendario.
              </li>
              <li>
                <strong>RUT Actualizado:</strong> Asegúrese de que el código CIIU coincida con la actividad económica seleccionada.
              </li>
            </ul>
            <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900 text-[10px] text-blue-800 dark:text-cyan-300">
              Soporte Flota Sugamuxi S.A: <br />
              <a href="mailto:proveedores@flotasugamuxi.com" className="font-bold underline">proveedores@flotasugamuxi.com</a>
            </div>
          </div>

        </div>

      </div>

      {/* Confirmation & Summary Modal before final submit */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0b1329] rounded-xl shadow-2xl border border-slate-200 dark:border-blue-900/60 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Resumen de Inscripción de Proveedor</h3>
              <p className="text-xs text-slate-400 mt-0.5">Expediente: {fileNumber}</p>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Por favor confirme el envío de su expediente digital para evaluación formal por parte de <strong>Flota Sugamuxi S.A.</strong>
              </p>

              {/* Verified Checklist */}
              <div className="bg-slate-50 dark:bg-slate-900/80 rounded-lg p-4 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs text-slate-800 dark:text-slate-200">
                <div className="flex items-center justify-between font-semibold">
                  <span>1. Información básica de identificación</span>
                  <span className="text-blue-900 dark:text-cyan-300 flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-400" /> Verificado</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span>2. Formato institucional FS.GA-FOR-009</span>
                  <span className="text-blue-900 dark:text-cyan-300 flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-400" /> Cargado (v14.0)</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span>3. Formato institucional FS.GA-FOR-039</span>
                  <span className="text-blue-900 dark:text-cyan-300 flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-400" /> Cargado (v1.0)</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span>4. Documentos generales y tributarios</span>
                  <span className="text-blue-900 dark:text-cyan-300 flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-400" /> Completos</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span>5. Requisitos específicos de actividad</span>
                  <span className="text-blue-900 dark:text-cyan-300 flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-400" /> {selectedCategory}</span>
                </div>
              </div>

              {submitFeedback && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  submitFeedback.success ? 'bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-900 text-blue-950 dark:text-cyan-200 font-semibold' : 'bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600 dark:text-cyan-400" />
                  <span>{submitFeedback.message}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitModalOpen(false);
                    setSubmitFeedback(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Confirmar y Enviar Solicitud</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        </div>
      )}

      {/* Institutional Forms Modal */}
      <InstitutionalFormsViewerModal
        form={selectedFormForModal}
        isOpen={isViewerModalOpen}
        onClose={() => setIsViewerModalOpen(false)}
        supplierName={supplierDisplayName}
        nitOrDoc={supplierIdNumber}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={isPreviewDocOpen}
        onClose={() => {
          setIsPreviewDocOpen(false);
          setPreviewDocObj(null);
        }}
        document={previewDocObj}
        documentTitle={previewDocTitle}
        supplierName={supplierDisplayName}
        nitOrDoc={supplierIdNumber}
      />

    </div>
  );
};
