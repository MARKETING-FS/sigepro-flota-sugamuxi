import React, { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building2,
  User,
  Layers,
  ArrowRight,
  FileCheck2,
  FileText,
  Mail,
  Send,
  Users,
  Briefcase,
  TrendingUp,
  Activity,
  Award,
  Calendar,
  Sparkles,
  UserPlus,
  BarChart3,
  FileSpreadsheet,
  ShieldAlert,
  SlidersHorizontal,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProcessStatus, SupplierDossier, SupplierDocument, SupplierTier, SupplierBasicInfo } from '../types';
import { getCreationStatus, getContractualStatus } from '../utils/contractValidity';
import { InternalReviewDossierDetail } from './InternalReviewDossierDetail';
import { SendCustomEmailModal } from './SendCustomEmailModal';
import { AdminCreateSupplierModal } from './AdminCreateSupplierModal';
import { FlotaSugamuxiLogo } from './FlotaSugamuxiLogo';
import { ExecutiveDashboardMetrics } from './dashboard/ExecutiveDashboardMetrics';
import { ExecutiveSIGAnalytics } from './dashboard/ExecutiveSIGAnalytics';
import { ExecutiveConvocatoriasOverview } from './dashboard/ExecutiveConvocatoriasOverview';
import { ExecutiveAuditFeed } from './dashboard/ExecutiveAuditFeed';

export const InternalReviewView: React.FC = () => {
  const {
    dossiers,
    allDossiers,
    activeUser,
    activeUserId,
    systemUsers,
    assignSupplierReviewer,
    canEditDossier,
    setCurrentDossierId,
    setActiveView,
    emailNotifications,
    role,
    reviewSelectedDossierId,
    setReviewSelectedDossierId,
    openSupplierReview,
    openSupplierEvaluation,
    convocatorias,
    supplierEvaluations,
    systemAuditLogs,
    showToast,
  } = useApp();

  // Navigation tabs within Executive Dashboard
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EXPEDIENTES' | 'LICITACIONES' | 'AUDITORIA'>('OVERVIEW');

  // Portfolio scope toggle for Reviewers
  const [scopeMode, setScopeMode] = useState<'CARTERA' | 'GLOBAL'>('CARTERA');

  // Table filters: Separate Creation Status from Contractual Binding Status
  const [searchTerm, setSearchTerm] = useState('');
  const [creationStatusFilter, setCreationStatusFilter] = useState<string>('ALL');
  const [contractStatusFilter, setContractStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  // Modals
  const [selectedDossierForEmail, setSelectedDossierForEmail] = useState<SupplierDossier | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isAdminCreateModalOpen, setIsAdminCreateModalOpen] = useState(false);

  // When a dossier is selected for detailed audit review
  if (reviewSelectedDossierId) {
    return (
      <InternalReviewDossierDetail
        dossierId={reviewSelectedDossierId}
        onBack={() => setReviewSelectedDossierId(null)}
      />
    );
  }

  // Choose the active dataset based on role and scope toggle
  const currentDataset = role === 'ADMIN' || scopeMode === 'GLOBAL' ? allDossiers : dossiers;

  // Filter dossiers
  const filteredDossiers = (currentDataset || []).filter((d) => {
    if (!d) return false;
    const basic: Partial<SupplierBasicInfo> = d.basicInfo || {};
    const isNatural = basic.supplierType === 'NATURAL';
    const name = isNatural ? (basic.fullName || '') : (basic.companyName || '');
    const docId = isNatural ? (basic.documentNumber || '') : (basic.nit || '');
    const fileNum = d.fileNumber || '';
    const email = basic.email || '';

    const query = (searchTerm || '').toLowerCase();
    const matchesSearch =
      !query ||
      name.toLowerCase().includes(query) ||
      docId.toLowerCase().includes(query) ||
      fileNum.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query);

    const creation = getCreationStatus(d);
    const contractual = getContractualStatus(d);

    const matchesCreation =
      creationStatusFilter === 'ALL' ||
      creation.status === creationStatusFilter ||
      (creationStatusFilter === 'PROVEEDOR_HABILITADO' && (creation.status === 'PROVEEDOR_HABILITADO' || creation.status === 'APROBADO')) ||
      (creationStatusFilter === 'EN_REVISION' && (creation.status === 'EN_REVISION' || creation.status === 'CORREGIDO_EN_REVISION'));

    const matchesContract =
      contractStatusFilter === 'ALL' ||
      contractual.status === contractStatusFilter;

    const matchesCat = categoryFilter === 'ALL' || d.selectedCategory === categoryFilter;
    const matchesType = typeFilter === 'ALL' || basic.supplierType === typeFilter;
    const matchesTier = tierFilter === 'ALL' || d.supplierTier === tierFilter;

    return matchesSearch && matchesCreation && matchesContract && matchesCat && matchesType && matchesTier;
  });

  const renderCreationBadge = (d: SupplierDossier) => {
    const creation = getCreationStatus(d);
    switch (creation.status) {
      case 'PROVEEDOR_HABILITADO':
      case 'APROBADO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-900 text-white dark:bg-blue-950 dark:text-cyan-300 border border-blue-700 dark:border-blue-600">
            <ShieldCheck className="w-3 h-3 text-cyan-300" /> Habilitado (100%)
          </span>
        );
      case 'EN_REVISION':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
            <Clock className="w-3 h-3 text-blue-600" /> En Revisión
          </span>
        );
      case 'CORREGIDO_EN_REVISION':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-900 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <RefreshCw className="w-3 h-3 text-sky-600" /> Subsanado
          </span>
        );
      case 'REQUIERE_CORRECCION':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <AlertCircle className="w-3 h-3 text-blue-600" /> Requiere Corrección
          </span>
        );
      case 'RECHAZADO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-white border border-slate-700">
            <ShieldAlert className="w-3 h-3 text-slate-300" /> Rechazado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <FileText className="w-3 h-3 text-slate-400" /> Doc. Pendiente
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
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-950 border border-blue-200 dark:bg-blue-950 dark:text-cyan-300 dark:border-blue-800"
            title={`Contrato Vigente. Días restantes: ${contract.daysRemaining}`}
          >
            <ShieldCheck className="w-3 h-3 text-blue-700 dark:text-cyan-300" />
            <span>Vigente ({contract.daysRemaining}d)</span>
          </span>
        );
      case 'POR_VENCER':
        return (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-900 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            title={`Por vencer en ${contract.daysRemaining} días.`}
          >
            <Clock className="w-3 h-3 text-blue-700 dark:text-cyan-400" />
            <span>Por Vencer ({contract.daysRemaining}d)</span>
          </span>
        );
      case 'VENCIDO':
        return (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"
            title="Contrato Vencido"
          >
            <AlertCircle className="w-3 h-3 text-slate-500" />
            <span>Vencido</span>
          </span>
        );
      case 'SUSPENDIDO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700">
            <ShieldAlert className="w-3 h-3 text-cyan-300" />
            <span>Suspendido</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 border border-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800">
            <span>Sin Contrato Activo</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: ProcessStatus) => {
    switch (status) {
      case 'PROVEEDOR_HABILITADO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900 text-white dark:bg-blue-950 dark:text-cyan-300 border border-blue-700 dark:border-blue-600">
            <ShieldCheck className="w-3 h-3 text-cyan-300" /> Habilitado
          </span>
        );
      case 'APROBADO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-cyan-300 border border-blue-300 dark:border-blue-700">
            <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-cyan-300" /> Aprobado
          </span>
        );
      case 'EN_REVISION':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600">
            <Clock className="w-3 h-3 text-slate-600 dark:text-slate-300" /> En Revisión
          </span>
        );
      case 'CORREGIDO_EN_REVISION':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 dark:bg-blue-950/70 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
            <Clock className="w-3 h-3 text-blue-600 dark:text-cyan-400" /> Corregido
          </span>
        );
      case 'REQUIERE_CORRECCION':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
            <AlertCircle className="w-3 h-3 text-slate-500 dark:text-slate-400" /> Req. Corrección
          </span>
        );
      case 'DOCUMENTACION_PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <Layers className="w-3 h-3 text-slate-500" /> Incompleto
          </span>
        );
      case 'RECHAZADO':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 dark:bg-slate-900 dark:text-slate-300 border border-slate-700 dark:border-slate-700">
            <ShieldAlert className="w-3 h-3 text-slate-400" /> Rechazado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {status}
          </span>
        );
    }
  };

  const getDocumentCompliance = (d: SupplierDossier) => {
    const docs = Object.values(d.documents || {});
    const requiredDocs = docs.filter((doc) => doc.isRequired !== false);
    const approvedDocs = requiredDocs.filter((doc) => doc.status === 'APROBADO');
    const totalRequired = requiredDocs.length || 1;
    const percent = Math.round((approvedDocs.length / totalRequired) * 100);

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
      total: totalRequired,
      percent,
      instApproved,
      instTotal,
      supportApproved,
      supportTotal,
    };
  };

  // Quick action from metric click: switches tab and sets filter
  const handleQuickFilterStatus = (status: string) => {
    setCreationStatusFilter(status);
    setActiveTab('EXPEDIENTES');
  };

  const handleQuickFilterTier = (tier: SupplierTier) => {
    setTierFilter(tier);
    setActiveTab('EXPEDIENTES');
  };

  const handleQuickFilterCategory = (category: string) => {
    setCategoryFilter(category);
    setActiveTab('EXPEDIENTES');
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4">
      
      {/* 1. Header Banner Compacto - Manual de Marca Flota Sugamuxi (Azul oscuro, Azul claro, Gris) */}
      <div className="bg-white rounded-xl px-4 py-3 text-slate-900 border border-slate-200 shadow-xs relative overflow-hidden dark:bg-[#0b1329] dark:text-white dark:border-blue-900/60">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1 w-full">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 p-1.5 dark:bg-slate-900/80 dark:border-blue-800 shadow-2xs">
              <Activity className="w-5 h-5 text-blue-700 dark:text-cyan-400" />
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  Control Operativo y Analítica Estratégica
                </h1>
                <span className="px-2 py-0.2 bg-blue-50 border border-blue-200 rounded-full text-blue-800 font-bold text-[10px] flex items-center gap-1 font-mono dark:bg-blue-500/20 dark:border-blue-400/40 dark:text-cyan-300">
                  <Activity className="w-3 h-3 text-blue-600 dark:text-cyan-300" />
                  <span>DASHBOARD EJECUTIVO</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-300 line-clamp-2 sm:line-clamp-none max-w-2xl">
                Monitoreo en tiempo real de contratistas activos, evaluación anual de desempeño y debida diligencia SIG.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full xl:w-auto shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => setActiveView('evaluaciones')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-800 shadow-2xs transition-all cursor-pointer dark:border-blue-900 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 dark:text-cyan-300"
              title="Ir a Matriz de Evaluaciones de Desempeño Anual"
            >
              <Award className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>Evaluaciones SIG</span>
            </button>

            <button
              onClick={() => setActiveView('informesExcel')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 shadow-2xs transition-all cursor-pointer dark:border-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-200"
              title="Libro de Auditoría y Reportes Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>Reportes Excel</span>
            </button>

            {(role === 'ADMIN' || role === 'REVISOR') && (
              <button
                onClick={() => setIsAdminCreateModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-all cursor-pointer border border-blue-600"
                title="Registrar y dar de alta a un proveedor"
              >
                <UserPlus className="w-3.5 h-3.5 text-white" />
                <span>Registrar Proveedor</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-xs font-bold text-blue-900 shadow-2xs dark:border-blue-500/30 dark:bg-blue-950/60 dark:text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>En Vivo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Portfolio Banner with Scope Toggle */}
      {role === 'REVISOR' ? (
        <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-cyan-500/20 border border-blue-200 dark:border-cyan-400/40 text-blue-700 dark:text-cyan-300 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
              {activeUser.avatarText || 'R1'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-blue-50 text-blue-700 dark:bg-cyan-400/20 dark:text-cyan-300 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-cyan-400/30">
                  REVISOR TÉCNICO &bull; {activeUser.shortName}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {activeUser.name}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                {scopeMode === 'CARTERA'
                  ? `Visualizando los ${dossiers.length} proveedores asignados a su cuenta de revisor.`
                  : `Visualización global de los ${allDossiers.length} proveedores registrados en toda la empresa.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start lg:self-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Alcance:</span>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                onClick={() => setScopeMode('CARTERA')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  scopeMode === 'CARTERA'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Mi Cartera ({dossiers.length})
              </button>
              <button
                onClick={() => setScopeMode('GLOBAL')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  scopeMode === 'GLOBAL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Global ({allDossiers.length})
              </button>
            </div>
          </div>
        </div>
      ) : role === 'ADMIN' ? (
        <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-blue-700 dark:text-cyan-300 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
              {activeUser.avatarText || 'JS'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-extrabold tracking-wider bg-blue-50 text-blue-700 dark:bg-cyan-500/20 dark:text-cyan-300 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-cyan-400/40">
                  ADMINISTRACIÓN GENERAL &bull; VISTA TOTAL
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {activeUser.name || 'Julian Salgado'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Supervisión gerencial sobre los <strong className="text-slate-900 dark:text-white font-semibold">{allDossiers.length} proveedores</strong> y <strong className="text-slate-900 dark:text-white font-semibold">{convocatorias.length} procesos licitatorios</strong>. Control de asignación de revisores y aprobación definitiva.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start lg:self-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold bg-slate-50 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-cyan-200 shadow-2xs">
              {allDossiers.length} Proveedores en Cartera Total
            </span>
          </div>
        </div>
      ) : null}

      {/* 2. Executive Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'OVERVIEW'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Tablero Resumen SIG</span>
        </button>

        <button
          onClick={() => setActiveTab('EXPEDIENTES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'EXPEDIENTES'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Directorio & Expedientes ({currentDataset.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('LICITACIONES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'LICITACIONES'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Licitaciones & Convocatorias ({convocatorias.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDITORIA')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'AUDITORIA'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Bitácora Auditoría ISO 9001 ({systemAuditLogs.length})</span>
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-5">
          {/* High-Level Metric Cards */}
          <ExecutiveDashboardMetrics
            dossiers={currentDataset}
            allDossiers={allDossiers}
            convocatorias={convocatorias}
            supplierEvaluations={supplierEvaluations}
            auditLogs={systemAuditLogs}
            onFilterByStatus={handleQuickFilterStatus}
            onFilterByTier={handleQuickFilterTier}
            onGoToEvaluations={() => setActiveView('evaluaciones')}
            onGoToConvocatorias={() => setActiveTab('LICITACIONES')}
            onGoToBancoProveedores={() => setActiveView('bancoProveedores')}
            onGoToAudit={() => setActiveTab('AUDITORIA')}
          />

          {/* Deep Analytics: Tiers, Funnel, Annual Cycles for Actives, Categories */}
          <ExecutiveSIGAnalytics
            dossiers={currentDataset}
            supplierEvaluations={supplierEvaluations}
            onFilterByTier={handleQuickFilterTier}
            onFilterByStatus={handleQuickFilterStatus}
            onFilterByCategory={handleQuickFilterCategory}
            onGoToEvaluations={() => setActiveView('evaluaciones')}
            onOpenEvaluationForDossier={(dossierId) => openSupplierEvaluation(dossierId)}
          />

          {/* Quick link to see all dossiers */}
          <div className="text-center pt-2">
            <button
              onClick={() => setActiveTab('EXPEDIENTES')}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ver Tabla de Expedientes Completa ({currentDataset.length} proveedores)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'LICITACIONES' && (
        <ExecutiveConvocatoriasOverview
          convocatorias={convocatorias}
          onGoToConvocatorias={() => setActiveView('convocatorias')}
        />
      )}

      {activeTab === 'AUDITORIA' && (
        <ExecutiveAuditFeed
          auditLogs={systemAuditLogs}
          onGoToExcelReports={() => setActiveView('informesExcel')}
        />
      )}

      {activeTab === 'EXPEDIENTES' && (
        <div className="space-y-4">
          {/* Active Filters Summary if set */}
          {(creationStatusFilter !== 'ALL' || contractStatusFilter !== 'ALL' || tierFilter !== 'ALL' || categoryFilter !== 'ALL' || typeFilter !== 'ALL' || searchTerm) && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 flex items-center justify-between gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-blue-900 dark:text-cyan-300 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  Filtros activos:
                </span>
                {creationStatusFilter !== 'ALL' && (
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 font-medium border border-blue-300 dark:border-blue-800 text-blue-900 dark:text-white">
                    Creación: {creationStatusFilter}
                  </span>
                )}
                {contractStatusFilter !== 'ALL' && (
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 font-medium border border-blue-300 dark:border-blue-800 text-blue-900 dark:text-white">
                    Vinculación: {contractStatusFilter}
                  </span>
                )}
                {tierFilter !== 'ALL' && (
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 font-medium border border-blue-300 dark:border-blue-800 text-blue-900 dark:text-white">
                    Tier: {tierFilter}
                  </span>
                )}
                {categoryFilter !== 'ALL' && (
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 font-medium border border-blue-300 dark:border-blue-800 text-blue-900 dark:text-white">
                    Categoría: {categoryFilter}
                  </span>
                )}
                {typeFilter !== 'ALL' && (
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 font-medium border border-blue-300 dark:border-blue-800 text-blue-900 dark:text-white">
                    Tipo: {typeFilter}
                  </span>
                )}
                {searchTerm && (
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 font-medium border border-blue-300 dark:border-blue-800 text-blue-900 dark:text-white">
                    Búsqueda: &ldquo;{searchTerm}&rdquo;
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setCreationStatusFilter('ALL');
                  setContractStatusFilter('ALL');
                  setTierFilter('ALL');
                  setCategoryFilter('ALL');
                  setTypeFilter('ALL');
                  setSearchTerm('');
                }}
                className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {/* Main Filter & Dossier Table */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            
            {/* Top Controls */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] flex flex-col sm:flex-row items-center justify-between gap-3">
              
              {/* Search Box */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por Razón Social, NIT o radicado..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-[#121c38] transition-colors"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">Todos los Tiers</option>
                  <option value="A">Tier A (Crítico)</option>
                  <option value="B">Tier B (Operativo)</option>
                  <option value="C">Tier C (Estándar)</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">Todos los Tipos</option>
                  <option value="JURIDICA">Persona Jurídica</option>
                  <option value="NATURAL">Persona Natural</option>
                </select>

                <select
                  value={creationStatusFilter}
                  onChange={(e) => setCreationStatusFilter(e.target.value)}
                  className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">1. Estado Creación (Todos)</option>
                  <option value="PROVEEDOR_HABILITADO">Habilitado (100%)</option>
                  <option value="EN_REVISION">En Revisión Técnica</option>
                  <option value="REQUIERE_CORRECCION">Requiere Corrección</option>
                  <option value="DOCUMENTACION_PENDIENTE">Doc. Pendiente</option>
                  <option value="RECHAZADO">Rechazado</option>
                </select>

                <select
                  value={contractStatusFilter}
                  onChange={(e) => setContractStatusFilter(e.target.value)}
                  className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">2. Vinculación Contrato (Todas)</option>
                  <option value="VIGENTE">Contrato Vigente (&gt;30d)</option>
                  <option value="POR_VENCER">Por Vencer (≤30d)</option>
                  <option value="VENCIDO">Contrato Vencido</option>
                  <option value="SIN_CONTRATO">Sin Contrato Activo</option>
                  <option value="SUSPENDIDO">Suspendido</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">Todas las Categorías</option>
                  <option value="REPUESTOS_AUTOMOTRICES">Repuestos y Mantenimiento</option>
                  <option value="COMBUSTIBLES_LUBRICANTES">Combustibles y Lubricantes</option>
                  <option value="SERVICIOS_TECNOLOGICOS">Servicios Tecnológicos</option>
                  <option value="SERVICIOS_GENERALES">Servicios Generales</option>
                  <option value="SEGUROS_LEGAL">Seguros y Legal</option>
                </select>
              </div>

            </div>

            {/* Dossiers Table */}
            <div>
              <div className="sm:hidden px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] text-blue-900 dark:text-cyan-300 flex items-center justify-between font-medium">
                <span>Desliza horizontalmente para ver todas las columnas</span>
                <span className="font-bold">↔</span>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800 min-w-[880px] lg:min-w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-2.5 w-[9%]">Radicado</th>
                    <th className="py-3 px-2.5 w-[16%]">Razón Social / Proveedor</th>
                    <th className="py-3 px-2 w-[8%]">NIT / Cédula</th>
                    <th className="py-3 px-2 w-[12%]">Categoría / Tier</th>
                    <th className="py-3 px-2 w-[11%]">Revisor Asignado</th>
                    <th className="py-3 px-2 text-center w-[8%]">Formatos</th>
                    <th className="py-3 px-2 text-center w-[9%]">Cumplimiento</th>
                    <th className="py-3 px-2 text-center w-[9%]">Estado Creación</th>
                    <th className="py-3 px-2 text-center w-[10%]">Vinculación (Objeto)</th>
                    <th className="py-3 px-2 text-right w-[8%]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {filteredDossiers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400 dark:text-slate-500">
                        No se encontraron proveedores con los criterios seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredDossiers.map((d) => {
                      const basic: Partial<SupplierBasicInfo> = d.basicInfo || {};
                      const isNat = basic.supplierType === 'NATURAL';
                      const name = isNat ? (basic.fullName || 'Sin Nombre') : (basic.companyName || 'Sin Razón Social');
                      const docId = isNat ? (basic.documentNumber || '-') : (basic.nit || '-');
                      const docs = d.documents || {};
                      const has009 = docs['FS_GA_FOR_009']?.fileName;
                      const has039 = docs['FS_GA_FOR_039']?.fileName;
                      const supplierEmailsCount = (emailNotifications || []).filter((e) => e.dossierId === d.id).length;
                      const categoryDisplay = (d.selectedCategory || 'GENERAL').replace(/_/g, ' ');
                      const compliance = getDocumentCompliance(d);

                      return (
                        <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-700 dark:text-cyan-400 align-top whitespace-nowrap">
                            {d.fileNumber || d.id}
                          </td>
                          <td className="py-3.5 px-3 align-top">
                            <div className="font-bold text-slate-900 dark:text-white text-xs leading-snug break-words">{name}</div>
                            <div className="text-[11px] text-slate-400 font-normal break-all mt-0.5">{basic.email || 'Sin correo'}</div>
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-600 dark:text-slate-400 align-top whitespace-nowrap">
                            <span className="text-[10px] text-slate-400 mr-1">{isNat ? 'CC' : 'NIT'}</span>
                            {docId}
                          </td>
                          <td className="py-3.5 px-3 align-top">
                            <div className="space-y-1">
                              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg inline-block leading-snug break-words">
                                {categoryDisplay}
                              </span>
                              {d.supplierTier && (
                                <div>
                                  <span
                                    className={`text-[9.5px] px-1.5 py-0.5 rounded font-black inline-block ${
                                      d.supplierTier === 'A'
                                        ? 'bg-blue-900 text-white dark:bg-blue-950 dark:text-cyan-300 border border-blue-700 dark:border-blue-600'
                                        : d.supplierTier === 'B'
                                        ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/60 dark:text-cyan-300 border border-blue-200 dark:border-blue-700'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                    }`}
                                  >
                                    Tier {d.supplierTier}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 align-top">
                            <div className="flex items-start gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-cyan-300 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                                {d.assignedReviewerId === 'revisor-1'
                                  ? 'R1'
                                  : d.assignedReviewerId === 'revisor-2'
                                  ? 'R2'
                                  : d.assignedReviewerId === 'revisor-3'
                                  ? 'R3'
                                  : 'AD'}
                              </span>
                              <div className="min-w-0">
                                <span
                                  className="font-medium text-[11px] text-slate-800 dark:text-slate-200 block break-words"
                                  title={d.assignedReviewerName || 'Sin asignar'}
                                >
                                  {d.assignedReviewerName || 'Sin asignar'}
                                </span>
                                {role === 'ADMIN' && (
                                  <select
                                    value={d.assignedReviewerId || ''}
                                    onChange={(e) => {
                                      const targetRev = systemUsers.find((u) => u.id === e.target.value);
                                      if (targetRev) {
                                        assignSupplierReviewer(d.id, targetRev.id, targetRev.name, activeUser.name);
                                        showToast(
                                          `Proveedor reasignado a ${targetRev.name}`,
                                          'success',
                                          'REASIGNACIÓN'
                                        );
                                      }
                                    }}
                                    className="text-[9.5px] font-bold text-blue-700 dark:text-cyan-400 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 border border-blue-200 dark:border-blue-900 rounded px-1.5 py-0.5 mt-1 cursor-pointer block"
                                    title="Reasignar cartera a otro revisor"
                                  >
                                    {systemUsers
                                      .filter((u) => u.role === 'REVISOR')
                                      .map((u) => (
                                        <option key={u.id} value={u.id}>
                                          &rarr; {u.shortName}
                                        </option>
                                      ))}
                                  </select>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center align-top">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <span
                                title={has009 ? 'FS.GA-FOR-009 Diligenciado y Firmado' : 'FS.GA-FOR-009 Pendiente'}
                                className={`px-2 py-0.5 text-[9px] font-bold rounded-md ${
                                  has009
                                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-cyan-300 border border-blue-200 dark:border-blue-900'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                }`}
                              >
                                FOR-009
                              </span>
                              <span
                                title={has039 ? 'FS.GA-FOR-039 Diligenciado y Firmado' : 'FS.GA-FOR-039 Pendiente'}
                                className={`px-2 py-0.5 text-[9px] font-bold rounded-md ${
                                  has039
                                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-cyan-300 border border-blue-200 dark:border-blue-900'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                }`}
                              >
                                FOR-039
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center whitespace-nowrap align-top">
                            <div
                              className="inline-block text-left cursor-help"
                              title={`Cumplimiento Total: ${compliance.approved} de ${compliance.total} requisitos aprobados (${compliance.percent}%)\n• Formatos Oficiales (009 y 039): ${compliance.instApproved} de ${compliance.instTotal}\n• Soportes y Anexos: ${compliance.supportApproved} de ${compliance.supportTotal}`}
                            >
                              <div className="flex items-center justify-between text-[9px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                                <span className="text-slate-900 dark:text-white font-extrabold">{compliance.approved}/{compliance.total} docs</span>
                                <span className="font-mono text-blue-700 dark:text-cyan-400 font-black ml-2">{compliance.percent}%</span>
                              </div>
                              <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    compliance.percent === 100
                                      ? 'bg-blue-600 dark:bg-cyan-400'
                                      : compliance.percent >= 60
                                      ? 'bg-blue-500/80 dark:bg-cyan-500/80'
                                      : 'bg-slate-400'
                                  }`}
                                  style={{ width: `${compliance.percent}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-center gap-1 text-[8.5px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                                <span
                                  title={`Formatos: ${compliance.instApproved}/${compliance.instTotal}`}
                                  className="text-blue-900 dark:text-cyan-300 bg-blue-50 dark:bg-blue-950 px-1 rounded border border-blue-200 dark:border-blue-900"
                                >
                                  Form: {compliance.instApproved}/{compliance.instTotal}
                                </span>
                                <span className="text-slate-300 dark:text-slate-600 font-bold">+</span>
                                <span
                                  title={`Soportes: ${compliance.supportApproved}/${compliance.supportTotal}`}
                                  className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 rounded border border-slate-200 dark:border-slate-700"
                                >
                                  Sop: {compliance.supportApproved}/{compliance.supportTotal}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center align-top">
                            {renderCreationBadge(d)}
                          </td>
                          <td className="py-3.5 px-3 text-center align-top">
                            <div className="flex flex-col items-center gap-1.5 max-w-[210px] mx-auto">
                              {renderContractualBadge(d)}
                              {d.contractInfo?.contractNumber && (
                                <span className="text-[9.5px] font-mono text-slate-600 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                  Contrato {d.contractInfo.contractNumber}
                                </span>
                              )}
                              {d.contractInfo?.objectDescription && (
                                <span
                                  className="text-[9.5px] text-slate-600 dark:text-slate-300 italic leading-snug break-words bg-slate-50/70 dark:bg-slate-900/40 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800/80 text-left"
                                  title={d.contractInfo.objectDescription}
                                >
                                  "{d.contractInfo.objectDescription}"
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right align-top">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                title={`Enviar correo o ver historial (${supplierEmailsCount} enviados)`}
                                onClick={() => {
                                  setSelectedDossierForEmail(d);
                                  setIsEmailModalOpen(true);
                                }}
                                className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer relative shadow-2xs"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                {supplierEmailsCount > 0 && (
                                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                                    {supplierEmailsCount}
                                  </span>
                                )}
                              </button>

                              <button
                                type="button"
                                title="Calificar Proveedor (Evaluación Inicial o Anual Periódica)"
                                onClick={() => openSupplierEvaluation(d.id)}
                                className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
                              >
                                <Award className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
                              </button>

                              <button
                                type="button"
                                onClick={() => openSupplierReview(d.id)}
                                className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                                title="Abrir panel de auditoría y revisión de expediente"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Revisar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          </div>
        </div>
      )}

      {/* Send Custom Email Modal */}
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

      {/* Admin Create Supplier Direct Modal */}
      <AdminCreateSupplierModal
        isOpen={isAdminCreateModalOpen}
        onClose={() => setIsAdminCreateModalOpen(false)}
        onSuccess={(dossierId) => {
          setIsAdminCreateModalOpen(false);
          openSupplierReview(dossierId);
        }}
      />

    </div>
  );
};
