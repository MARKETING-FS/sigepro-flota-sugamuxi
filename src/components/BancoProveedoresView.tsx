import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  List,
  ShieldAlert,
  ArrowUpDown,
  Calendar,
  Layers,
  Award,
  RefreshCw,
  Send,
  X,
  FileCheck2,
  Check,
  Briefcase,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SupplierDossier, ProcessStatus, SupplierType, SupplierDocument } from '../types';
import { AdminCreateSupplierModal } from './AdminCreateSupplierModal';
import { SendCustomEmailModal } from './SendCustomEmailModal';
import { InternalReviewDossierDetail } from './InternalReviewDossierDetail';
import { FlotaSugamuxiLogo, FlotaSugamuxiEmblem } from './FlotaSugamuxiLogo';
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

export const BancoProveedoresView: React.FC = () => {
  const {
    role,
    theme,
    dossiers,
    allDossiers,
    activeUser,
    setCurrentDossierId,
    setActiveView,
    updateDossierStatus,
    categoriesConfig,
    openSupplierEvaluation,
  } = useApp();

  // Selected dossier for full audit inside Banco de Proveedores (retains active Banco Proveedores navigation)
  const [selectedDossierIdForReview, setSelectedDossierIdForReview] = useState<string | null>(null);

  // Modals state
  const [isAdminCreateModalOpen, setIsAdminCreateModalOpen] = useState(false);
  const [selectedDossierForEmail, setSelectedDossierForEmail] = useState<SupplierDossier | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedDossierForManualStatus, setSelectedDossierForManualStatus] = useState<SupplierDossier | null>(null);
  
  // Certificate / Supplier Sheet Modal
  const [selectedDossierForCertificate, setSelectedDossierForCertificate] = useState<SupplierDossier | null>(null);

  // Filters & Search: Separate Creation Status from Contractual Binding Status
  const [searchTerm, setSearchTerm] = useState('');
  const [creationStatusFilter, setCreationStatusFilter] = useState<string>('ALL');
  const [contractStatusFilter, setContractStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [sarlaftFilter, setSarlaftFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Filtered List based on both dimensions
  const filteredDossiers = useMemo(() => {
    return dossiers.filter((d) => {
      const isNatural = d.basicInfo.supplierType === 'NATURAL';
      const name = isNatural ? d.basicInfo.fullName || '' : d.basicInfo.companyName || '';
      const docId = isNatural ? d.basicInfo.documentNumber || '' : d.basicInfo.nit || '';
      const email = d.basicInfo.email || '';
      const city = d.basicInfo.city || '';

      const term = searchTerm.toLowerCase();
      const matchesSearch =
        name.toLowerCase().includes(term) ||
        docId.toLowerCase().includes(term) ||
        d.fileNumber.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term) ||
        city.toLowerCase().includes(term);

      const creation = getCreationStatus(d);
      const contractual = getContractualStatus(d);

      const matchesCreation =
        creationStatusFilter === 'ALL' ||
        (creationStatusFilter === 'DOCUMENTACION_VENCIDA' && (creation.status === 'DOCUMENTACION_VENCIDA' || creation.hasExpiredDocs)) ||
        (creationStatusFilter === 'DOCUMENTACION_POR_VENCER' && (creation.status === 'DOCUMENTACION_POR_VENCER' || (!creation.hasExpiredDocs && creation.hasExpiringSoonDocs))) ||
        (creationStatusFilter === 'PROVEEDOR_HABILITADO' && (creation.status === 'PROVEEDOR_HABILITADO' || creation.status === 'APROBADO')) ||
        (creationStatusFilter === 'EN_REVISION' && (creation.status === 'EN_REVISION' || creation.status === 'CORREGIDO_EN_REVISION')) ||
        (creationStatusFilter === 'REQUIERE_CORRECCION' && creation.status === 'REQUIERE_CORRECCION') ||
        creation.status === creationStatusFilter;

      const matchesContract =
        contractStatusFilter === 'ALL' ||
        (contractStatusFilter === 'CONTRATOS_ACTIVOS' && (contractual.status === 'VIGENTE' || contractual.status === 'POR_VENCER')) ||
        contractual.status === contractStatusFilter;

      const matchesCategory = categoryFilter === 'ALL' || d.selectedCategory === categoryFilter;
      const matchesType = typeFilter === 'ALL' || d.basicInfo.supplierType === typeFilter;
      const effectiveTier = d.supplierTier || d.basicInfo?.supplierTier || 'B';
      const matchesTier = tierFilter === 'ALL' || effectiveTier === tierFilter;
      const matchesSarlaft =
        sarlaftFilter === 'ALL' || (d.internalConcepts?.sarlatfCheck?.result || 'PENDIENTE') === sarlaftFilter;

      return matchesSearch && matchesCreation && matchesContract && matchesCategory && matchesType && matchesTier && matchesSarlaft;
    });
  }, [dossiers, searchTerm, creationStatusFilter, contractStatusFilter, categoryFilter, typeFilter, tierFilter, sarlaftFilter]);

  // Paginación de 10 proveedores por página
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reiniciar a la página 1 cuando se modifique cualquier filtro o término de búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, creationStatusFilter, contractStatusFilter, categoryFilter, typeFilter, tierFilter, sarlaftFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDossiers.length / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredDossiers.length);

  const paginatedDossiers = useMemo(() => {
    return filteredDossiers.slice(startIndex, endIndex);
  }, [filteredDossiers, startIndex, endIndex]);

  // Metrics separated by: 1. Estado de Creación (Homologación) & 2. Estado de Vinculación Contractual
  const totalCount = (dossiers || []).length;

  // Document Expiration Metrics and Alerts (SIG)
  const dossiersWithExpiredDocs = useMemo(() => {
    return (dossiers || []).filter((d) => {
      const exp = getDossierDocumentExpirationSummary(d);
      return exp.hasExpiredDocs;
    });
  }, [dossiers]);

  const dossiersWithExpiringSoonDocs = useMemo(() => {
    return (dossiers || []).filter((d) => {
      const exp = getDossierDocumentExpirationSummary(d);
      return !exp.hasExpiredDocs && exp.hasExpiringSoonDocs;
    });
  }, [dossiers]);

  const docsVencidosCount = dossiersWithExpiredDocs.length;
  const docsPorVencerCount = dossiersWithExpiringSoonDocs.length;
  
  // 1. Estado de Creación
  const habilitadosCreationCount = (dossiers || []).filter((d) => {
    const c = getCreationStatus(d);
    return c.status === 'PROVEEDOR_HABILITADO' || c.status === 'APROBADO';
  }).length;
  const enRevisionCreationCount = (dossiers || []).filter((d) => {
    const c = getCreationStatus(d);
    return c.status === 'EN_REVISION' || c.status === 'CORREGIDO_EN_REVISION';
  }).length;
  const requiereCorreccionCount = (dossiers || []).filter((d) => {
    const c = getCreationStatus(d);
    return c.status === 'REQUIERE_CORRECCION';
  }).length;
  const docPendienteCount = (dossiers || []).filter((d) => {
    const c = getCreationStatus(d);
    return c.status === 'DOCUMENTACION_PENDIENTE' || c.status === 'BORRADOR';
  }).length;

  // 2. Estado de Vinculación Contractual
  const vigentesContractCount = (dossiers || []).filter(
    (d) => getContractualStatus(d).status === 'VIGENTE'
  ).length;
  const porVencerContractCount = (dossiers || []).filter(
    (d) => getContractualStatus(d).status === 'POR_VENCER'
  ).length;
  const vencidosContractCount = (dossiers || []).filter(
    (d) => getContractualStatus(d).status === 'VENCIDO'
  ).length;
  const sinContratoCount = (dossiers || []).filter(
    (d) => getContractualStatus(d).status === 'SIN_CONTRATO'
  ).length;

  const personasJuridicasCount = (dossiers || []).filter(
    (d) => d.basicInfo?.supplierType === 'JURIDICA'
  ).length;
  const personasNaturalesCount = (dossiers || []).filter(
    (d) => d.basicInfo?.supplierType === 'NATURAL'
  ).length;

  // Renderers for both dimensions
  const renderCreationBadge = (d: SupplierDossier) => {
    const creation = getCreationStatus(d);
    switch (creation.status) {
      case 'DOCUMENTACION_VENCIDA':
        return (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white border border-slate-700 shadow-2xs dark:bg-slate-950 dark:border-red-900/60 dark:text-red-300"
            title={`Inhabilitado preventivamente por documento vencido: ${creation.expiredDocNames?.join(', ') || 'Documentos expirados'}`}
          >
            <ShieldAlert className="w-3 h-3 text-cyan-300 dark:text-red-400" />
            <span>Doc. Vencida ({creation.expiredCount})</span>
          </span>
        );
      case 'DOCUMENTACION_POR_VENCER':
        return (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-300 shadow-2xs dark:bg-blue-950/70 dark:text-cyan-300 dark:border-blue-800"
            title={`Habilitado con documentos próximos a vencer: ${creation.expiringDocNames?.join(', ')}`}
          >
            <Clock className="w-3 h-3 text-blue-700 dark:text-cyan-400" />
            <span>Habilitado ({creation.expiringSoonCount} por vencer)</span>
          </span>
        );
      case 'PROVEEDOR_HABILITADO':
      case 'APROBADO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-900 text-white border border-blue-800 shadow-2xs dark:bg-blue-950/90 dark:text-cyan-300 dark:border-blue-700">
            <ShieldCheck className="w-3 h-3 text-cyan-300" />
            <span>Habilitado (100%)</span>
          </span>
        );
      case 'EN_REVISION':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 border border-blue-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
            <Clock className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
            <span>En Revisión</span>
          </span>
        );
      case 'CORREGIDO_EN_REVISION':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-900 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800">
            <RefreshCw className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            <span>Subsanado</span>
          </span>
        );
      case 'REQUIERE_CORRECCION':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
            <AlertCircle className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
            <span>Requiere Corrección</span>
          </span>
        );
      case 'RECHAZADO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-white border border-slate-700 dark:bg-slate-900 dark:border-slate-700">
            <ShieldAlert className="w-3 h-3 text-slate-300" />
            <span>Rechazado</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700">
            <FileText className="w-3 h-3 text-slate-400" />
            <span>Doc. Pendiente</span>
          </span>
        );
    }
  };

  const renderContractualBadge = (d: SupplierDossier) => {
    const contract = getContractualStatus(d);
    switch (contract.status) {
      case 'VIGENTE':
        return (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-950 border border-blue-200 shadow-2xs dark:bg-blue-950/70 dark:text-cyan-300 dark:border-blue-900/80"
            title={`Contrato Vigente. Días restantes: ${contract.daysRemaining}`}
          >
            <ShieldCheck className="w-3 h-3 text-blue-700 dark:text-cyan-300" />
            <span>Vigente ({contract.daysRemaining}d)</span>
          </span>
        );
      case 'POR_VENCER':
        return (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-900 border border-slate-300 shadow-2xs dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            title={`Contrato por vencer en ${contract.daysRemaining} días. Requiere gestión de prórroga o licitación.`}
          >
            <Clock className="w-3 h-3 text-blue-700 dark:text-cyan-400" />
            <span>Por Vencer ({contract.daysRemaining}d)</span>
          </span>
        );
      case 'VENCIDO':
        return (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700"
            title="Contrato finalizado. Bloqueado para nuevas órdenes de compra hasta renovación."
          >
            <AlertCircle className="w-3 h-3 text-slate-500" />
            <span>Contrato Vencido</span>
          </span>
        );
      case 'SUSPENDIDO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700 dark:bg-slate-900 dark:border-slate-700">
            <ShieldAlert className="w-3 h-3 text-slate-400" />
            <span>Suspendido</span>
          </span>
        );
      default:
        return (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 border border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/60"
            title="Aspirante o proveedor registrado sin contrato formal adjudicado"
          >
            <span>Sin Contrato Activo</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: ProcessStatus) => {
    switch (status) {
      case 'CONTRATO_VIGENTE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-950 border border-blue-200 shadow-2xs dark:bg-blue-950/70 dark:text-cyan-300 dark:border-blue-900/80">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-300" />
            <span>Contrato Vigente</span>
          </span>
        );
      case 'CONTRATO_POR_VENCER':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
            <span>Por Vencer (≤30d)</span>
          </span>
        );
      case 'CONTRATO_VENCIDO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700">
            <AlertCircle className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>Contrato Vencido</span>
          </span>
        );
      case 'SUSPENDIDO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>Suspendido</span>
          </span>
        );
      case 'PROVEEDOR_HABILITADO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs dark:bg-blue-950/70 dark:text-cyan-300 dark:border-blue-900/80">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-300" />
            <span>Habilitado Oficial</span>
          </span>
        );
      case 'APROBADO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 dark:bg-blue-950/70 dark:text-cyan-300 dark:border-blue-900/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-300" />
            <span>Aprobado</span>
          </span>
        );
      case 'EN_REVISION':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>En Revisión</span>
          </span>
        );
      case 'CORREGIDO_EN_REVISION':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-900 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800">
            <RefreshCw className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Subsanado</span>
          </span>
        );
      case 'REQUIERE_CORRECCION':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
            <AlertCircle className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Subsanación</span>
          </span>
        );
      case 'DOCUMENTACION_PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700">
            <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Doc. Pendiente</span>
          </span>
        );
      case 'RECHAZADO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>No Habilitado</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700">
            <span>{getProcessStatusLabel(status)}</span>
          </span>
        );
    }
  };

  const getDocumentCompliance = (d: SupplierDossier) => {
    const docs = Object.values(d.documents || {});
    const requiredDocs = docs.filter((doc) => doc.isRequired !== false);
    const approvedDocs = requiredDocs.filter((doc) => doc.status === 'APROBADO');
    const inReviewDocs = requiredDocs.filter((doc) => doc.status === 'EN_REVISION' || doc.status === 'CARGADO');
    const requiresCorrectionDocs = requiredDocs.filter((doc) => doc.status === 'REQUIERE_CORRECCION');
    const pendingDocs = requiredDocs.filter((doc) => doc.status === 'PENDIENTE');
    const totalRequired = requiredDocs.length || 1;
    const percent = Math.round((approvedDocs.length / totalRequired) * 100);

    // Precise coherent breakdown matching review detail
    const institutionalDocKeys = ['FS_GA_FOR_009', 'FS_GA_FOR_039'];
    const instDocs = institutionalDocKeys
      .map((k) => (d.documents || {})[k])
      .filter(Boolean) as SupplierDocument[];
    const instApproved = instDocs.filter((x) => x.status === 'APROBADO').length;
    const instTotal = instDocs.length;

    const supportDocs = (Object.entries(d.documents || {}) as [string, SupplierDocument][])
      .filter(([code, doc]) => !institutionalDocKeys.includes(code) && doc.isRequired !== false);
    const supportApproved = supportDocs.filter(([_, x]) => x.status === 'APROBADO').length;
    const supportTotal = supportDocs.length;

    return {
      approved: approvedDocs.length,
      inReview: inReviewDocs.length,
      requiresCorrection: requiresCorrectionDocs.length,
      pending: pendingDocs.length,
      total: totalRequired,
      percent,
      instApproved,
      instTotal,
      supportApproved,
      supportTotal,
    };
  };

  const handleOpenDossier = (dossierId: string) => {
    setCurrentDossierId(dossierId);
    setSelectedDossierIdForReview(dossierId);
  };

  if (selectedDossierIdForReview) {
    return (
      <InternalReviewDossierDetail
        dossierId={selectedDossierIdForReview}
        onBack={() => {
          setSelectedDossierIdForReview(null);
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-[1700px] mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4 animate-in fade-in">
      
      {/* 1. Header Banner Estandarizado Claro */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 text-slate-900 border border-slate-200 shadow-xs relative overflow-hidden dark:bg-[#0b1329] dark:text-white dark:border-blue-900/60">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1 w-full">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 p-1.5 dark:bg-slate-900/80 dark:border-blue-800 shadow-2xs">
              <Users className="w-5 h-5 text-blue-700 dark:text-cyan-400" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 rounded-full text-blue-800 font-bold text-[11px] flex items-center gap-1.5 dark:bg-blue-500/20 dark:border-blue-400/40 dark:text-cyan-300">
                  <Users className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-300" />
                  <span>Directorio Maestro Oficial SIG</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Gestión Integral (ISO 9001)
                </span>
              </div>
              <h1 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                Banco de Proveedores y Contratistas
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                Registro maestro, habilitación documental y consulta centralizada de proveedores para <strong>Flota Sugamuxi S.A.</strong>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full xl:w-auto shrink-0 pt-2.5 xl:pt-0 border-t xl:border-t-0 border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => setActiveView('informesExcel')}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:text-slate-200 dark:border-slate-700"
              title="Ir al Centro de Generación y Descarga de Reportes en Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-700 dark:text-cyan-300" />
              <span>Módulo de Reportes</span>
            </button>

            {(role === 'ADMIN' || role === 'REVISOR') && (
              <button
                onClick={() => setActiveView('registrarProveedor')}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-blue-600"
                title="Crear y dar de alta a un proveedor en ventana completa"
              >
                <UserPlus className="w-4 h-4 text-white" />
                <span>Registrar Proveedor</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scope Indicator for Revisor Role */}
      {role === 'REVISOR' && (
        <div className="bg-blue-900/10 border border-blue-200 dark:border-blue-900/60 dark:bg-blue-950/40 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-slate-700 dark:text-slate-200">
              Directorio filtrado para <strong>{activeUser.name} ({activeUser.shortName})</strong>: mostrando únicamente sus <strong>{dossiers.length} proveedores asignados</strong> para consulta y homologación.
            </span>
          </div>
          <span className="text-[11px] font-bold text-blue-700 dark:text-cyan-300 bg-blue-50 dark:bg-blue-900/50 px-2 py-0.5 rounded-md shrink-0">
            {dossiers.length} Asignados
          </span>
        </div>
      )}

      {/* 2. KPI Metrics Grid - Separated: Creación vs Vinculación Contractual */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        {/* Dimensión 1: Estado de Creación (Homologación Documental) */}
        <div className="bg-white dark:bg-[#0b1329] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-blue-900/50 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-cyan-300 flex items-center justify-center font-bold text-xs border border-blue-200/60 dark:border-blue-800 shrink-0">
                1
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider block truncate sm:whitespace-normal">
                  Estado de Creación & Homologación
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 block truncate sm:whitespace-normal">Verificación documental y vigencia de soportes</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCreationStatusFilter('ALL')}
              className={`self-start sm:self-auto text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer shrink-0 ${
                creationStatusFilter === 'ALL'
                  ? 'text-blue-900 bg-blue-50 border-blue-300 shadow-2xs dark:bg-blue-950 dark:text-cyan-300 dark:border-blue-800'
                  : 'text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100 hover:text-blue-900 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
              }`}
              title="Restablecer a todos los proveedores registrados"
            >
              {totalCount} Registrados
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            {/* 1. Habilitados */}
            <button
              type="button"
              onClick={() => setCreationStatusFilter((prev) => prev === 'PROVEEDOR_HABILITADO' ? 'ALL' : 'PROVEEDOR_HABILITADO')}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer select-none ${
                creationStatusFilter === 'PROVEEDOR_HABILITADO'
                  ? 'bg-slate-900 border-slate-800 text-white shadow-xs ring-2 ring-blue-500/40 dark:bg-blue-900/90 dark:border-blue-600 dark:ring-blue-400/50'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-800/60 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-slate-600'
              }`}
              title="Filtrar proveedores habilitados (100% aprobados) - Clic para alternar"
            >
              <span className={`text-lg font-black block ${
                creationStatusFilter === 'PROVEEDOR_HABILITADO' ? 'text-white' : 'text-slate-800 dark:text-slate-100'
              }`}>
                {habilitadosCreationCount}
              </span>
              <span className={`text-[9px] font-bold block truncate ${
                creationStatusFilter === 'PROVEEDOR_HABILITADO' ? 'text-cyan-300' : 'text-slate-600 dark:text-slate-400'
              }`}>
                Habilitados
              </span>
            </button>

            {/* 2. En Revisión */}
            <button
              type="button"
              onClick={() => setCreationStatusFilter((prev) => prev === 'EN_REVISION' ? 'ALL' : 'EN_REVISION')}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer select-none ${
                creationStatusFilter === 'EN_REVISION'
                  ? 'bg-slate-900 border-slate-800 text-white shadow-xs ring-2 ring-blue-500/40 dark:bg-blue-900/90 dark:border-blue-600 dark:ring-blue-400/50'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-800/60 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-slate-600'
              }`}
              title="Filtrar proveedores en revisión técnica - Clic para alternar"
            >
              <span className={`text-lg font-black block ${
                creationStatusFilter === 'EN_REVISION' ? 'text-white' : 'text-slate-800 dark:text-slate-100'
              }`}>
                {enRevisionCreationCount}
              </span>
              <span className={`text-[9px] font-bold block truncate ${
                creationStatusFilter === 'EN_REVISION' ? 'text-cyan-300' : 'text-slate-600 dark:text-slate-400'
              }`}>
                En Revisión
              </span>
            </button>

            {/* 3. Vencidos */}
            <button
              type="button"
              onClick={() => setCreationStatusFilter((prev) => prev === 'DOCUMENTACION_VENCIDA' ? 'ALL' : 'DOCUMENTACION_VENCIDA')}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer select-none ${
                creationStatusFilter === 'DOCUMENTACION_VENCIDA'
                  ? 'bg-slate-900 border-slate-800 text-white shadow-xs ring-2 ring-blue-500/40 dark:bg-blue-900/90 dark:border-blue-600 dark:ring-blue-400/50'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-800/60 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-slate-600'
              }`}
              title="Filtrar proveedores con documentos obligatorios vencidos - Clic para alternar"
            >
              <span className={`text-lg font-black block ${
                creationStatusFilter === 'DOCUMENTACION_VENCIDA' ? 'text-white' : 'text-slate-800 dark:text-slate-100'
              }`}>
                {docsVencidosCount}
              </span>
              <span className={`text-[9px] font-bold block truncate ${
                creationStatusFilter === 'DOCUMENTACION_VENCIDA' ? 'text-cyan-300' : 'text-slate-600 dark:text-slate-400'
              }`}>
                Vencidos
              </span>
            </button>

            {/* 4. Por Vencer */}
            <button
              type="button"
              onClick={() => setCreationStatusFilter((prev) => prev === 'DOCUMENTACION_POR_VENCER' ? 'ALL' : 'DOCUMENTACION_POR_VENCER')}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer select-none ${
                creationStatusFilter === 'DOCUMENTACION_POR_VENCER'
                  ? 'bg-slate-900 border-slate-800 text-white shadow-xs ring-2 ring-blue-500/40 dark:bg-blue-900/90 dark:border-blue-600 dark:ring-blue-400/50'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-800/60 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-slate-600'
              }`}
              title="Filtrar proveedores con documentos por vencer (≤ 30 días) - Clic para alternar"
            >
              <span className={`text-lg font-black block ${
                creationStatusFilter === 'DOCUMENTACION_POR_VENCER' ? 'text-white' : 'text-slate-800 dark:text-slate-100'
              }`}>
                {docsPorVencerCount}
              </span>
              <span className={`text-[9px] font-bold block truncate ${
                creationStatusFilter === 'DOCUMENTACION_POR_VENCER' ? 'text-cyan-300' : 'text-slate-600 dark:text-slate-400'
              }`}>
                Por Vencer
              </span>
            </button>

            {/* 5. Subsanación */}
            <button
              type="button"
              onClick={() => setCreationStatusFilter((prev) => prev === 'REQUIERE_CORRECCION' ? 'ALL' : 'REQUIERE_CORRECCION')}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer select-none col-span-2 sm:col-span-1 ${
                creationStatusFilter === 'REQUIERE_CORRECCION'
                  ? 'bg-slate-900 border-slate-800 text-white shadow-xs ring-2 ring-blue-500/40 dark:bg-blue-900/90 dark:border-blue-600 dark:ring-blue-400/50'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-800/60 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-slate-600'
              }`}
              title="Filtrar proveedores que requieren subsanación / corrección - Clic para alternar"
            >
              <span className={`text-lg font-black block ${
                creationStatusFilter === 'REQUIERE_CORRECCION' ? 'text-white' : 'text-slate-800 dark:text-slate-100'
              }`}>
                {requiereCorreccionCount}
              </span>
              <span className={`text-[9px] font-bold block truncate ${
                creationStatusFilter === 'REQUIERE_CORRECCION' ? 'text-cyan-300' : 'text-slate-600 dark:text-slate-400'
              }`}>
                Subsanación
              </span>
            </button>
          </div>
        </div>

        {/* Dimensión 2: Estado de Vinculación Contractual (por Objeto del Contrato) */}
        <div className="bg-white dark:bg-[#0b1329] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-blue-900/50 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-900 dark:bg-blue-950 text-white dark:text-cyan-300 flex items-center justify-center font-bold text-xs border border-blue-800 dark:border-blue-700 shrink-0">
                2
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider block truncate sm:whitespace-normal">
                  Vinculación por Objeto del Contrato
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 block truncate sm:whitespace-normal">Vigencia temporal y relación jurídica formal</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setContractStatusFilter((prev) => prev === 'CONTRATOS_ACTIVOS' ? 'ALL' : 'CONTRATOS_ACTIVOS')}
              className={`self-start sm:self-auto text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer shrink-0 ${
                contractStatusFilter === 'CONTRATOS_ACTIVOS'
                  ? 'bg-blue-900 text-white border-blue-900 shadow-2xs dark:bg-blue-900 dark:border-blue-700'
                  : 'text-blue-900 bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-slate-800/80 dark:text-cyan-300 dark:border-slate-700 dark:hover:bg-slate-700'
              }`}
              title="Filtrar contratos activos (vigentes o por vencer) - Clic para alternar"
            >
              {vigentesContractCount + porVencerContractCount} Contratos Activos
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {/* 1. Vigente (>30d) */}
            <button
              type="button"
              onClick={() => setContractStatusFilter((prev) => prev === 'VIGENTE' ? 'ALL' : 'VIGENTE')}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer select-none ${
                contractStatusFilter === 'VIGENTE'
                  ? 'bg-slate-900 border-slate-800 text-white shadow-xs ring-2 ring-blue-500/40 dark:bg-blue-900/90 dark:border-blue-600 dark:ring-blue-400/50'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-800/60 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-slate-600'
              }`}
              title="Filtrar contratos vigentes > 30 días - Clic para alternar"
            >
              <span className={`text-lg font-black block ${
                contractStatusFilter === 'VIGENTE' ? 'text-white' : 'text-slate-800 dark:text-slate-100'
              }`}>
                {vigentesContractCount}
              </span>
              <span className={`text-[9px] font-bold block truncate ${
                contractStatusFilter === 'VIGENTE' ? 'text-cyan-300' : 'text-slate-600 dark:text-slate-400'
              }`}>
                Vigente (&gt;30d)
              </span>
            </button>

            {/* 2. Por Vencer (≤30d) */}
            <button
              type="button"
              onClick={() => setContractStatusFilter((prev) => prev === 'POR_VENCER' ? 'ALL' : 'POR_VENCER')}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer select-none ${
                contractStatusFilter === 'POR_VENCER'
                  ? 'bg-slate-900 border-slate-800 text-white shadow-xs ring-2 ring-blue-500/40 dark:bg-blue-900/90 dark:border-blue-600 dark:ring-blue-400/50'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-800/60 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-slate-600'
              }`}
              title="Filtrar contratos por vencer en ≤ 30 días - Clic para alternar"
            >
              <span className={`text-lg font-black block ${
                contractStatusFilter === 'POR_VENCER' ? 'text-white' : 'text-slate-800 dark:text-slate-100'
              }`}>
                {porVencerContractCount}
              </span>
              <span className={`text-[9px] font-bold block truncate ${
                contractStatusFilter === 'POR_VENCER' ? 'text-cyan-300' : 'text-slate-600 dark:text-slate-400'
              }`}>
                Por Vencer (≤30d)
              </span>
            </button>

            {/* 3. Vencido */}
            <button
              type="button"
              onClick={() => setContractStatusFilter((prev) => prev === 'VENCIDO' ? 'ALL' : 'VENCIDO')}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer select-none ${
                contractStatusFilter === 'VENCIDO'
                  ? 'bg-slate-900 border-slate-800 text-white shadow-xs ring-2 ring-blue-500/40 dark:bg-blue-900/90 dark:border-blue-600 dark:ring-blue-400/50'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-800/60 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-slate-600'
              }`}
              title="Filtrar contratos formalmente vencidos - Clic para alternar"
            >
              <span className={`text-lg font-black block ${
                contractStatusFilter === 'VENCIDO' ? 'text-white' : 'text-slate-800 dark:text-slate-100'
              }`}>
                {vencidosContractCount}
              </span>
              <span className={`text-[9px] font-bold block truncate ${
                contractStatusFilter === 'VENCIDO' ? 'text-cyan-300' : 'text-slate-600 dark:text-slate-400'
              }`}>
                Vencido
              </span>
            </button>

            {/* 4. Sin Contrato */}
            <button
              type="button"
              onClick={() => setContractStatusFilter((prev) => prev === 'SIN_CONTRATO' ? 'ALL' : 'SIN_CONTRATO')}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer select-none ${
                contractStatusFilter === 'SIN_CONTRATO'
                  ? 'bg-slate-900 border-slate-800 text-white shadow-xs ring-2 ring-blue-500/40 dark:bg-blue-900/90 dark:border-blue-600 dark:ring-blue-400/50'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-800/60 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-slate-600'
              }`}
              title="Filtrar proveedores sin contrato formal activo - Clic para alternar"
            >
              <span className={`text-lg font-black block ${
                contractStatusFilter === 'SIN_CONTRATO' ? 'text-white' : 'text-slate-800 dark:text-slate-100'
              }`}>
                {sinContratoCount}
              </span>
              <span className={`text-[9px] font-bold block truncate ${
                contractStatusFilter === 'SIN_CONTRATO' ? 'text-cyan-300' : 'text-slate-600 dark:text-slate-400'
              }`}>
                Sin Contrato
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Search and Multi-Filter Controls */}
      <div className="bg-white dark:bg-[#0b1329] rounded-2xl p-4 border border-slate-200 dark:border-blue-900/50 shadow-xs space-y-3">
        
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Razón Social, NIT, Cédula, No. Expediente (FS-PROV-...), Ciudad o Email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-hidden transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 self-end lg:self-auto bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-blue-600 text-blue-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Vista de Tabla Detallada"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Tabla</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-blue-600 text-blue-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Vista de Tarjetas / Cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Tarjetas</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            <span>Filtro rápido:</span>
          </span>
          <button
            onClick={() => setCreationStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
              creationStatusFilter === 'ALL'
                ? 'bg-blue-900 dark:bg-blue-600 text-white border-blue-900 dark:border-blue-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>Todos</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              creationStatusFilter === 'ALL'
                ? 'bg-blue-800 text-white dark:bg-blue-700'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {totalCount}
            </span>
          </button>
          <button
            onClick={() => setCreationStatusFilter('PROVEEDOR_HABILITADO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
              creationStatusFilter === 'PROVEEDOR_HABILITADO'
                ? 'bg-blue-900 dark:bg-blue-600 text-white border-blue-900 dark:border-blue-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${creationStatusFilter === 'PROVEEDOR_HABILITADO' ? 'text-white' : 'text-blue-700 dark:text-cyan-400'}`} />
            <span>Habilitados</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              creationStatusFilter === 'PROVEEDOR_HABILITADO'
                ? 'bg-blue-800 text-white dark:bg-blue-700'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {habilitadosCreationCount}
            </span>
          </button>
          <button
            onClick={() => setCreationStatusFilter('DOCUMENTACION_VENCIDA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
              creationStatusFilter === 'DOCUMENTACION_VENCIDA'
                ? 'bg-blue-900 dark:bg-blue-600 text-white border-blue-900 dark:border-blue-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
            }`}
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${creationStatusFilter === 'DOCUMENTACION_VENCIDA' ? 'text-white' : docsVencidosCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
            <span>Docs Vencidos</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              creationStatusFilter === 'DOCUMENTACION_VENCIDA'
                ? 'bg-blue-800 text-white dark:bg-blue-700'
                : docsVencidosCount > 0
                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {docsVencidosCount}
            </span>
          </button>
          <button
            onClick={() => setCreationStatusFilter('DOCUMENTACION_POR_VENCER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
              creationStatusFilter === 'DOCUMENTACION_POR_VENCER'
                ? 'bg-blue-900 dark:bg-blue-600 text-white border-blue-900 dark:border-blue-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${creationStatusFilter === 'DOCUMENTACION_POR_VENCER' ? 'text-white' : docsPorVencerCount > 0 ? 'text-blue-600 dark:text-cyan-400' : 'text-slate-400'}`} />
            <span>Por Vencer</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              creationStatusFilter === 'DOCUMENTACION_POR_VENCER'
                ? 'bg-blue-800 text-white dark:bg-blue-700'
                : docsPorVencerCount > 0
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-cyan-300 border border-blue-200 dark:border-blue-800'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {docsPorVencerCount}
            </span>
          </button>
          <button
            onClick={() => setCreationStatusFilter('EN_REVISION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
              creationStatusFilter === 'EN_REVISION'
                ? 'bg-blue-900 dark:bg-blue-600 text-white border-blue-900 dark:border-blue-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Search className={`w-3.5 h-3.5 ${creationStatusFilter === 'EN_REVISION' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
            <span>En Revisión</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              creationStatusFilter === 'EN_REVISION'
                ? 'bg-blue-800 text-white dark:bg-blue-700'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {enRevisionCreationCount}
            </span>
          </button>
          <button
            onClick={() => setCreationStatusFilter('REQUIERE_CORRECCION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
              creationStatusFilter === 'REQUIERE_CORRECCION'
                ? 'bg-blue-900 dark:bg-blue-600 text-white border-blue-900 dark:border-blue-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${creationStatusFilter === 'REQUIERE_CORRECCION' ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} />
            <span>Subsanación</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              creationStatusFilter === 'REQUIERE_CORRECCION'
                ? 'bg-blue-800 text-white dark:bg-blue-700'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {requiereCorreccionCount}
            </span>
          </button>
        </div>

        {/* Filter Dropdowns: Distinct for Creation Status & Contractual Binding */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">1. Estado Creación</label>
            <select
              value={creationStatusFilter}
              onChange={(e) => setCreationStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 outline-hidden"
            >
              <option value="ALL">Todos los estados</option>
              <option value="PROVEEDOR_HABILITADO">Habilitado (100% Homologado)</option>
              <option value="DOCUMENTACION_VENCIDA">Doc. Vencida ({docsVencidosCount})</option>
              <option value="DOCUMENTACION_POR_VENCER">Doc. Por Vencer ({docsPorVencerCount})</option>
              <option value="EN_REVISION">En Revisión Técnica</option>
              <option value="REQUIERE_CORRECCION">Requiere Corrección</option>
              <option value="DOCUMENTACION_PENDIENTE">Doc. Pendiente</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">2. Vinculación Contrato</label>
            <select
              value={contractStatusFilter}
              onChange={(e) => setContractStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 outline-hidden"
            >
              <option value="ALL">Todas las vinculaciones</option>
              <option value="CONTRATOS_ACTIVOS">Contratos Activos ({vigentesContractCount + porVencerContractCount})</option>
              <option value="VIGENTE">Contrato Vigente (&gt;30d)</option>
              <option value="POR_VENCER">Por Vencer (≤30d)</option>
              <option value="VENCIDO">Contrato Vencido</option>
              <option value="SIN_CONTRATO">Sin Contrato Activo</option>
              <option value="SUSPENDIDO">Suspendido</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase mb-1">Tipo Proveedor (A/B/C)</label>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 outline-hidden"
            >
              <option value="ALL">Todos los tipos (A, B, C)</option>
              <option value="A">Tipo A - Crítico (Estratégico)</option>
              <option value="B">Tipo B - Importante (Operativo)</option>
              <option value="C">Tipo C - Estándar (Ocasional)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase mb-1">Categoría</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 outline-hidden"
            >
              <option value="ALL">Todas las categorías</option>
              {categoriesConfig.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase mb-1">Naturaleza</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 outline-hidden"
            >
              <option value="ALL">Natural y Jurídica</option>
              <option value="JURIDICA">Persona Jurídica (Empresas)</option>
              <option value="NATURAL">Persona Natural</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase mb-1">SARLAFT / Listas</label>
            <select
              value={sarlaftFilter}
              onChange={(e) => setSarlaftFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 outline-hidden"
            >
              <option value="ALL">Todos los resultados</option>
              <option value="SIN_COINCIDENCIAS">Sin Coincidencias (Limpio)</option>
              <option value="REQUIERE_VERIFICACION">Requiere Verificación</option>
              <option value="PENDIENTE">Pendiente</option>
            </select>
          </div>

        </div>

        {/* Results counter & Clear filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Mostrando <strong className="text-slate-800 dark:text-slate-200">{filteredDossiers.length === 0 ? 0 : startIndex + 1} - {endIndex}</strong> de <strong className="text-slate-800 dark:text-slate-200">{filteredDossiers.length}</strong> proveedores filtrados
              {filteredDossiers.length !== dossiers.length && (
                <span className="text-slate-400 dark:text-slate-500"> (Total en banco: {dossiers.length})</span>
              )}
            </span>
            {totalPages > 1 && (
              <span className="font-bold text-blue-700 dark:text-cyan-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 text-[11px]">
                Página {validCurrentPage} de {totalPages} (10 por pág.)
              </span>
            )}
          </div>
          {(searchTerm || creationStatusFilter !== 'ALL' || contractStatusFilter !== 'ALL' || categoryFilter !== 'ALL' || typeFilter !== 'ALL' || tierFilter !== 'ALL' || sarlaftFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCreationStatusFilter('ALL');
                setContractStatusFilter('ALL');
                setCategoryFilter('ALL');
                setTypeFilter('ALL');
                setTierFilter('ALL');
                setSarlaftFilter('ALL');
              }}
              className="text-blue-600 dark:text-cyan-400 hover:text-blue-800 dark:hover:text-cyan-300 font-bold underline cursor-pointer self-start sm:self-auto"
            >
              Limpiar todos los filtros
            </button>
          )}
        </div>

      </div>

      {/* 4. Display Area: Table View vs Card Grid View */}
      {filteredDossiers.length === 0 ? (
        <div className="bg-white dark:bg-[#0b1329] rounded-2xl p-12 text-center border border-slate-200 dark:border-blue-900/50 shadow-xs space-y-3">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No se encontraron proveedores</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            No hay registros que coincidan con los criterios de búsqueda o filtros seleccionados.
          </p>
          {(role === 'ADMIN' || role === 'REVISOR') && (
            <button
              onClick={() => setIsAdminCreateModalOpen(true)}
              className="px-4 py-2 bg-[#0b1329] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4 text-cyan-300" />
              <span>Crear Nuevo Proveedor Ahora</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        
        /* TABLE VIEW */
        <div className="bg-white dark:bg-[#0b1329] rounded-2xl border border-slate-200 dark:border-blue-900/50 shadow-xs overflow-hidden">
          <div className="sm:hidden px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] text-blue-900 dark:text-cyan-300 flex items-center justify-between font-medium">
            <span>Desliza horizontalmente para ver todas las columnas</span>
            <span className="font-bold">↔</span>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800 min-w-[860px] lg:min-w-full">
              <thead className="bg-[#0b1329] dark:bg-[#070d1e] text-white select-none">
                <tr>
                  <th className="w-[23%] px-3 py-3 font-bold uppercase tracking-wider text-[11px]">
                    Proveedor / Razón Social
                  </th>
                  <th className="w-[17%] px-2.5 py-3 font-bold uppercase tracking-wider text-[11px]">
                    Categoría & Clasificación
                  </th>
                  <th className="w-[13%] px-2 py-3 font-bold uppercase tracking-wider text-[11px] text-center">
                    Estado Creación
                  </th>
                  <th className="w-[19%] px-2.5 py-3 font-bold uppercase tracking-wider text-[11px]">
                    Vinculación Contractual
                  </th>
                  <th className="w-[17%] px-2.5 py-3 font-bold uppercase tracking-wider text-[11px]">
                    Cumplimiento & SARLAFT
                  </th>
                  <th className="w-[11%] px-2 py-3 font-bold uppercase tracking-wider text-[11px] text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-[#0b1329]">
                {paginatedDossiers.map((dossier) => {
                  const isNatural = dossier.basicInfo.supplierType === 'NATURAL';
                  const name = isNatural ? dossier.basicInfo.fullName : dossier.basicInfo.companyName;
                  const docId = isNatural ? dossier.basicInfo.documentNumber : dossier.basicInfo.nit;
                  const compliance = getDocumentCompliance(dossier);
                  const contractValidity = calculateContractValidity(dossier.contractInfo);
                  const tier = dossier.supplierTier || dossier.basicInfo.supplierTier || 'B';
                  const tierLabel = tier === 'A' ? 'Crítico' : tier === 'B' ? 'Operativo' : 'Estándar';
                  const creationStatus = getCreationStatus(dossier).status;

                  return (
                    <tr
                      key={dossier.id}
                      className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors group"
                    >
                      {/* 1. Proveedor / Razón Social & Identificación */}
                      <td className="px-3 py-3 align-top">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                              isNatural
                                ? 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-900 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800'
                                : 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-cyan-300 border border-blue-200 dark:border-blue-800'
                            }`}
                          >
                            {isNatural ? <User className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="font-extrabold text-slate-900 dark:text-white text-xs leading-snug break-words" title={name || 'Proveedor'}>
                              {name || 'Proveedor'}
                            </div>
                            <div className="text-[10.5px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 flex-wrap font-mono">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {isNatural ? 'CC: ' : 'NIT: '}
                                {docId || '-'}
                              </span>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <span className="text-blue-700 dark:text-cyan-300 bg-blue-50 dark:bg-blue-950/60 px-1 py-0.2 rounded border border-blue-200 dark:border-blue-800 text-[9px] font-semibold">
                                Rad: {dossier.fileNumber || dossier.id}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded text-[9px]">
                                {isNatural ? 'Natural' : 'Jurídica'}
                              </span>
                              {dossier.basicInfo.email && (
                                <>
                                  <span className="text-slate-300 dark:text-slate-600">•</span>
                                  <span className="break-all font-mono text-[9.5px] text-slate-500 dark:text-slate-400">{dossier.basicInfo.email}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Categoría & Clasificación */}
                      <td className="px-2.5 py-3 align-top">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded border ${
                                tier === 'A'
                                  ? 'bg-blue-950 text-white border-blue-900 dark:bg-blue-900 dark:border-blue-700'
                                  : tier === 'B'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-cyan-300 dark:border-blue-800'
                                  : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                              }`}
                            >
                              Tipo {tier} • {tierLabel}
                            </span>
                          </div>
                          <div
                            className="font-bold text-slate-800 dark:text-slate-200 text-xs leading-snug break-words"
                          >
                            {dossier.selectedCategory || 'Sin categoría asignada'}
                          </div>
                          <div
                            className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 leading-snug break-words"
                          >
                            <MapPin className="w-3 h-3 text-blue-600 dark:text-cyan-400 shrink-0" />
                            <span>{dossier.basicInfo.city || 'Colombia'}{dossier.basicInfo.department ? `, ${dossier.basicInfo.department}` : ''}</span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Estado de Creación (Homologación) */}
                      <td className="px-2 py-3 text-center align-top">
                        <div className="inline-flex flex-col items-center gap-1">
                          <div>{renderCreationBadge(dossier)}</div>
                          <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                            {creationStatus === 'PROVEEDOR_HABILITADO' || creationStatus === 'APROBADO'
                              ? 'Homologado SIG'
                              : creationStatus === 'EN_REVISION' || creationStatus === 'CORREGIDO_EN_REVISION'
                              ? 'Auditoría en curso'
                              : creationStatus === 'REQUIERE_CORRECCION'
                              ? 'Subsanación requerida'
                              : creationStatus === 'RECHAZADO'
                              ? 'No conforme'
                              : 'Doc. pendiente'}
                          </span>
                          {dossier.manualStatusOverride && (
                            <div
                              className="inline-flex items-center gap-1 text-[8.5px] font-bold text-blue-900 dark:text-cyan-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800 cursor-help"
                              title={`Cambio manual por ${dossier.manualStatusUpdatedBy || 'Administrador'}: "${dossier.manualStatusReason}"`}
                            >
                              <span>Manual:</span>
                              <span className="max-w-[80px] truncate">{dossier.manualStatusReason}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 4. Vinculación Contractual (por Objeto del Contrato) */}
                      <td className="px-2.5 py-3 align-top">
                        <div className="space-y-1.5">
                          <div>{renderContractualBadge(dossier)}</div>
                          {dossier.contractInfo?.contractNumber ? (
                            <div className="text-[10px] text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1">
                              <span className="font-bold text-slate-500 dark:text-slate-400 text-[9.5px]">Contr:</span>
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700 text-[9.5px] font-bold">
                                {dossier.contractInfo.contractNumber}
                              </span>
                            </div>
                          ) : (
                            <div className="text-[9.5px] text-slate-400 dark:text-slate-500 italic">
                              Sin contrato formalizado
                            </div>
                          )}
                          {dossier.contractInfo?.objectDescription ? (
                            <p
                              className="text-[10px] text-slate-600 dark:text-slate-300 italic leading-snug break-words bg-slate-50/70 dark:bg-slate-900/40 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800/80"
                              title={`Objeto del contrato: ${dossier.contractInfo.objectDescription}`}
                            >
                              "{dossier.contractInfo.objectDescription}"
                            </p>
                          ) : null}
                        </div>
                      </td>

                      {/* 5. Cumplimiento Documental & SARLAFT */}
                      <td className="px-2.5 py-3 align-top">
                        <div className="space-y-1.5">
                          <div
                            className="cursor-help"
                            title={`Cumplimiento Total: ${compliance.approved} de ${compliance.total} requisitos aprobados (${compliance.percent}%)\n• Formatos Oficiales (009 y 039): ${compliance.instApproved} de ${compliance.instTotal} aprobados\n• Soportes y Anexos Tributarios: ${compliance.supportApproved} de ${compliance.supportTotal} aprobados`}
                          >
                            <div className="flex items-center justify-between text-[9.5px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                              <span className="text-slate-900 dark:text-slate-100 font-extrabold">{compliance.approved}/{compliance.total} reqs</span>
                              <span className="font-mono text-blue-700 dark:text-cyan-400 font-black">{compliance.percent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  compliance.percent === 100
                                    ? 'bg-blue-600 dark:bg-blue-500'
                                    : compliance.percent >= 60
                                    ? 'bg-cyan-600 dark:bg-cyan-400'
                                    : 'bg-slate-500'
                                }`}
                                style={{ width: `${compliance.percent}%` }}
                              />
                            </div>
                            <div className="flex items-center gap-1 text-[8.5px] font-semibold text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                              <span
                                title={`Formatos Oficiales: ${compliance.instApproved} de ${compliance.instTotal} aprobados`}
                                className="text-blue-900 dark:text-cyan-300 bg-blue-50 dark:bg-blue-950/60 px-1 py-0.2 rounded border border-blue-200 dark:border-blue-800"
                              >
                                Form: {compliance.instApproved}/{compliance.instTotal}
                              </span>
                              <span className="text-slate-300 dark:text-slate-600 font-bold">+</span>
                              <span
                                title={`Soportes y Anexos: ${compliance.supportApproved} de ${compliance.supportTotal} aprobados`}
                                className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded border border-slate-200 dark:border-slate-700"
                              >
                                Sop: {compliance.supportApproved}/{compliance.supportTotal}
                              </span>
                            </div>
                          </div>

                          {/* SARLAFT & SIG debida diligencia */}
                          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-[9px] flex-wrap">
                            <div className="flex items-center gap-0.5">
                              <span className="font-bold text-slate-400 dark:text-slate-500 text-[8.5px]">SAR:</span>
                              {dossier.internalConcepts?.sarlatfCheck?.result === 'SIN_COINCIDENCIAS' ? (
                                <span className="text-blue-700 dark:text-cyan-400 font-bold flex items-center gap-0.5 text-[9px]">
                                  <Check className="w-2.5 h-2.5 text-blue-600 dark:text-cyan-400 stroke-[3]" /> Limpio
                                </span>
                              ) : dossier.internalConcepts?.sarlatfCheck?.result === 'REQUIERE_VERIFICACION' ? (
                                <span className="text-blue-900 dark:text-cyan-300 bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 px-1 py-0.2 rounded font-bold text-[8.5px]">Alerta</span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 text-[9px]">Pend.</span>
                              )}
                            </div>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <div className="flex items-center gap-0.5">
                              <span className="font-bold text-slate-400 dark:text-slate-500 text-[8.5px]">SIG:</span>
                              <span className="text-[9px] font-mono text-slate-600 dark:text-slate-400 font-semibold">
                                009•039
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 6. Acciones */}
                      <td className="px-2 py-3 text-right align-top">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 w-fit ml-auto items-center justify-items-center">
                          
                          {/* Ver Expediente / Auditar */}
                          <button
                            onClick={() => handleOpenDossier(dossier.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-blue-800 dark:text-slate-300 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
                            title="Auditar y Ver Expediente Completo"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Ficha / Certificado Oficial (Solo si todos los documentos están APROBADOS) */}
                          {compliance.percent === 100 && compliance.total > 0 ? (
                            <button
                              onClick={() => setSelectedDossierForCertificate(dossier)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-800 dark:text-cyan-300 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer shadow-2xs"
                              title="Generar Ficha Oficial & Certificado de Habilitación de Proveedor (100% Documentos Aprobados)"
                            >
                              <Award className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800/50 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-40 shadow-2xs"
                              title={`Ficha Oficial & Certificado bloqueado: Requiere que todos los documentos adjuntos (${compliance.approved}/${compliance.total}) estén en estado APROBADO.`}
                            >
                              <Award className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          )}

                          {/* Calificar Proveedor (SIG Inicial / Anual) */}
                          {(role === 'ADMIN' || role === 'REVISOR') && (
                            <button
                              onClick={() => openSupplierEvaluation(dossier.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-blue-800 dark:text-slate-300 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
                              title="Calificar Proveedor en Sistema Integrado de Gestión (Inicial / Anual a 1 Año)"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
                            </button>
                          )}

                          {/* Cambiar Estado Manual / Vigencia de Contrato */}
                          {(role === 'ADMIN' || role === 'REVISOR') && (
                            <button
                              onClick={() => setSelectedDossierForManualStatus(dossier)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-900 dark:text-cyan-300 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer shadow-2xs"
                              title="Gestionar Estado Manual & Vigencia de Contrato (con registro de motivo/observación obligatoria)"
                            >
                              <Briefcase className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
                            </button>
                          )}

                          {/* Enviar Notificación */}
                          {(role === 'ADMIN' || role === 'REVISOR') && (
                            <button
                              onClick={() => {
                                setSelectedDossierForEmail(dossier);
                                setIsEmailModalOpen(true);
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-blue-900 dark:text-slate-300 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
                              title="Enviar Correo Institucional"
                            >
                              <Mail className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Controles de Paginación para Tabla */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-600 dark:text-slate-400 font-medium">
                Mostrando <span className="font-bold text-slate-900 dark:text-slate-100">{startIndex + 1}</span> a{' '}
                <span className="font-bold text-slate-900 dark:text-slate-100">{endIndex}</span> de{' '}
                <span className="font-bold text-slate-900 dark:text-slate-100">{filteredDossiers.length}</span> proveedores (Página {validCurrentPage} de {totalPages})
              </div>

              <div className="flex items-center gap-1.5 select-none">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={validCurrentPage === 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    validCurrentPage === 1
                      ? 'text-slate-300 dark:text-slate-600 bg-slate-100 dark:bg-slate-800/40 cursor-not-allowed border border-transparent'
                      : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs'
                  }`}
                  title="Página anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const isActive = p === validCurrentPage;
                    return (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`min-w-[32px] h-8 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={validCurrentPage === totalPages}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    validCurrentPage === totalPages
                      ? 'text-slate-300 dark:text-slate-600 bg-slate-100 dark:bg-slate-800/40 cursor-not-allowed border border-transparent'
                      : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs'
                  }`}
                  title="Página siguiente"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (

        /* CARD GRID VIEW */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedDossiers.map((dossier) => {
            const isNatural = dossier.basicInfo.supplierType === 'NATURAL';
            const name = isNatural ? dossier.basicInfo.fullName : dossier.basicInfo.companyName;
            const docId = isNatural ? dossier.basicInfo.documentNumber : dossier.basicInfo.nit;
            const compliance = getDocumentCompliance(dossier);
            const effectiveStatus = getDossierEffectiveStatus(dossier);
            const contractValidity = calculateContractValidity(dossier.contractInfo);

            return (
              <div
                key={dossier.id}
                className="bg-white dark:bg-[#0b1329] rounded-2xl p-5 border border-slate-200 dark:border-blue-900/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isNatural
                            ? 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-900 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800'
                            : 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-cyan-300 border border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        {isNatural ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-blue-700 dark:text-cyan-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            {dossier.fileNumber}
                          </span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                              (dossier.supplierTier || dossier.basicInfo.supplierTier || 'B') === 'A'
                                ? 'bg-blue-950 text-white border-blue-900 dark:bg-blue-900 dark:border-blue-700'
                                : (dossier.supplierTier || dossier.basicInfo.supplierTier || 'B') === 'B'
                                ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-cyan-300 dark:border-blue-800'
                                : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                            }`}
                          >
                            Tipo {dossier.supplierTier || dossier.basicInfo.supplierTier || 'B'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 block">
                          {isNatural ? 'Persona Natural' : 'Persona Jurídica'}
                        </span>
                      </div>
                    </div>

                    <div>
                      {renderCreationBadge(dossier)}
                    </div>
                  </div>

                  {/* Supplier Title */}
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-3 line-clamp-2 leading-snug">
                    {name}
                  </h3>

                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold mt-1">
                    NIT/CC: {docId}
                  </div>

                  {/* Dimensión 2: Vinculación Contractual (por Objeto del Contrato) */}
                  <div className="mt-2.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                        Vinculación Contractual
                      </span>
                      {renderContractualBadge(dossier)}
                    </div>
                    {dossier.contractInfo?.contractNumber ? (
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-500 dark:text-slate-400 font-bold">N° Contrato:</span>
                        <span className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold">
                          {dossier.contractInfo.contractNumber}
                        </span>
                      </div>
                    ) : null}
                    {dossier.contractInfo?.objectDescription ? (
                      <p
                        className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-2 italic pt-1 border-t border-slate-100 dark:border-slate-800"
                        title={dossier.contractInfo.objectDescription}
                      >
                        <strong>Objeto:</strong> "{dossier.contractInfo.objectDescription}"
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 italic pt-1 border-t border-slate-100 dark:border-slate-800">
                        Sin objeto contractual registrado
                      </p>
                    )}
                  </div>

                  {/* Manual Override Indicator */}
                  {dossier.manualStatusOverride && (
                    <div
                      className="mt-2 bg-blue-50/70 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg p-2 text-[10px] text-slate-700 dark:text-slate-300 cursor-help"
                      title={`Motivo: ${dossier.manualStatusReason}`}
                    >
                      <span className="font-bold text-blue-900 dark:text-cyan-300">Estado Manual ({dossier.manualStatusUpdatedBy || 'Admin'}): </span>
                      <span className="italic">"{dossier.manualStatusReason}"</span>
                    </div>
                  )}

                  {/* Category & Location */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      <strong>Categoría:</strong> {dossier.selectedCategory}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{dossier.basicInfo.city}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{dossier.basicInfo.email}</span>
                    </div>
                  </div>

                  {/* Compliance Progress */}
                  <div
                    className="mt-3.5 bg-slate-50 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 cursor-help"
                    title={`Cumplimiento Total: ${compliance.approved} de ${compliance.total} requisitos aprobados (${compliance.percent}%)\n• Formatos Oficiales: ${compliance.instApproved} de ${compliance.instTotal}\n• Soportes y Anexos: ${compliance.supportApproved} de ${compliance.supportTotal}`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      <span className="flex items-center gap-1">
                        <span>Cumplimiento Doc:</span>
                        <span className="text-blue-900 dark:text-cyan-300 font-extrabold">{compliance.approved}/{compliance.total}</span>
                      </span>
                      <span className="font-mono text-blue-700 dark:text-cyan-400 font-black">{compliance.percent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          compliance.percent === 100 ? 'bg-blue-600 dark:bg-blue-500' : 'bg-cyan-600 dark:bg-cyan-400'
                        }`}
                        style={{ width: `${compliance.percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 mt-2 pt-1.5 border-t border-slate-200/80 dark:border-slate-800 font-medium">
                      <span className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[9px]">
                        Formatos: <strong className="text-blue-900 dark:text-cyan-300 font-bold">{compliance.instApproved}/{compliance.instTotal}</strong>
                      </span>
                      <span className="text-slate-400 dark:text-slate-600 font-bold">+</span>
                      <span className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[9px]">
                        Soportes: <strong className="text-slate-900 dark:text-slate-200 font-bold">{compliance.supportApproved}/{compliance.supportTotal}</strong>
                      </span>
                      <span className="text-[9px] font-bold text-blue-900 dark:text-cyan-300">
                        = {compliance.approved}/{compliance.total} Total
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 flex-wrap">
                  {compliance.percent === 100 && compliance.total > 0 ? (
                    <button
                      onClick={() => setSelectedDossierForCertificate(dossier)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-800 dark:text-cyan-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      title="Generar Ficha Oficial & Certificado de Habilitación (100% Aprobado)"
                    >
                      <Award className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
                      <span>Ficha</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/40 text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-not-allowed opacity-60"
                      title={`Ficha Oficial bloqueada: Requiere que todos los documentos adjuntos (${compliance.approved}/${compliance.total}) estén en estado APROBADO.`}
                    >
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span className="line-through">Ficha</span>
                    </button>
                  )}

                  {(role === 'ADMIN' || role === 'REVISOR') && (
                    <button
                      onClick={() => setSelectedDossierForManualStatus(dossier)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-blue-900 dark:text-slate-300 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      title="Gestionar Estado Manual & Vigencia de Contrato"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
                      <span>Estado</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenDossier(dossier.id)}
                    className="px-3 py-1.5 bg-[#0b1329] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs ml-auto"
                  >
                    <span>Auditar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
          </div>

          {/* Controles de Paginación para Vista Cuadrícula */}
          {totalPages > 1 && (
            <div className="bg-white dark:bg-[#0b1329] rounded-2xl border border-slate-200 dark:border-blue-900/50 px-4 py-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-600 dark:text-slate-400 font-medium">
                Mostrando <span className="font-bold text-slate-900 dark:text-slate-100">{startIndex + 1}</span> a{' '}
                <span className="font-bold text-slate-900 dark:text-slate-100">{endIndex}</span> de{' '}
                <span className="font-bold text-slate-900 dark:text-slate-100">{filteredDossiers.length}</span> proveedores (Página {validCurrentPage} de {totalPages})
              </div>

              <div className="flex items-center gap-1.5 select-none">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={validCurrentPage === 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    validCurrentPage === 1
                      ? 'text-slate-300 dark:text-slate-600 bg-slate-100 dark:bg-slate-800/40 cursor-not-allowed border border-transparent'
                      : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs'
                  }`}
                  title="Página anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const isActive = p === validCurrentPage;
                    return (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`min-w-[32px] h-8 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={validCurrentPage === totalPages}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    validCurrentPage === totalPages
                      ? 'text-slate-300 dark:text-slate-600 bg-slate-100 dark:bg-slate-800/40 cursor-not-allowed border border-transparent'
                      : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs'
                  }`}
                  title="Página siguiente"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: Admin Direct Supplier Creation */}
      {/* ========================================================================= */}
      <AdminCreateSupplierModal
        isOpen={isAdminCreateModalOpen}
        onClose={() => setIsAdminCreateModalOpen(false)}
        onSuccess={(newId) => {
          setIsAdminCreateModalOpen(false);
        }}
      />

      {/* ========================================================================= */}
      {/* 6. MODAL: Send Custom Email */}
      {/* ========================================================================= */}
      {selectedDossierForEmail && (
        <SendCustomEmailModal
          isOpen={isEmailModalOpen}
          onClose={() => {
            setIsEmailModalOpen(false);
            setSelectedDossierForEmail(null);
          }}
          dossier={selectedDossierForEmail}
        />
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: Ficha Técnica & Certificado Oficial de Proveedor Habilitado */}
      {/* ========================================================================= */}
      <SupplierCertificateModal
        isOpen={Boolean(selectedDossierForCertificate)}
        onClose={() => setSelectedDossierForCertificate(null)}
        dossier={selectedDossierForCertificate}
      />

      {/* ========================================================================= */}
      {/* 8. MODAL: Gestión Manual de Estado y Vigencia de Contrato */}
      {/* ========================================================================= */}
      <ManualStatusChangeModal
        isOpen={Boolean(selectedDossierForManualStatus)}
        onClose={() => setSelectedDossierForManualStatus(null)}
        dossier={selectedDossierForManualStatus}
        onConfirmStatusChange={(dossierId, newStatus, reason, reviewer, updatedContract) => {
          updateDossierStatus(dossierId, newStatus, reason, reviewer, true, updatedContract);
          setSelectedDossierForManualStatus(null);
        }}
      />

    </div>
  );
};
