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
  Users,
  Award,
  UserPlus,
  BarChart3,
  RefreshCw,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProcessStatus, SupplierDossier, SupplierDocument, SupplierTier, SupplierBasicInfo } from '../types';
import { getCreationStatus, getContractualStatus } from '../utils/contractValidity';
import { InternalReviewDossierDetail } from './InternalReviewDossierDetail';
import { SendCustomEmailModal } from './SendCustomEmailModal';
import { AdminCreateSupplierModal } from './AdminCreateSupplierModal';
import { ExecutiveDashboardMetrics } from './dashboard/ExecutiveDashboardMetrics';
import { ExecutiveSIGAnalytics } from './dashboard/ExecutiveSIGAnalytics';

export const InternalReviewView: React.FC = () => {
  const {
    dossiers,
    allDossiers,
    activeUser,
    activeUserId,
    systemUsers,
    assignSupplierReviewer,
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

  // Vista simplificada: 'EXPEDIENTES' por defecto para trabajo operativo directo, o 'ANALYTICS' para tableros ejecutivos
  const [activeTab, setActiveTab] = useState<'EXPEDIENTES' | 'ANALYTICS'>('EXPEDIENTES');

  // Alcance para revisores: Su cartera asignada o vista global
  const [scopeMode, setScopeMode] = useState<'CARTERA' | 'GLOBAL'>('CARTERA');

  // Filtros de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  // Modales
  const [selectedDossierForEmail, setSelectedDossierForEmail] = useState<SupplierDossier | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isAdminCreateModalOpen, setIsAdminCreateModalOpen] = useState(false);

  // Si hay un expediente abierto para auditoría detallada
  if (reviewSelectedDossierId) {
    return (
      <InternalReviewDossierDetail
        dossierId={reviewSelectedDossierId}
        onBack={() => setReviewSelectedDossierId(null)}
      />
    );
  }

  // Dataset según rol y alcance
  const currentDataset = role === 'ADMIN' || scopeMode === 'GLOBAL' ? allDossiers : dossiers;

  // Métricas clave (KPIs limpios de 4 tarjetas)
  const totalCount = currentDataset.length;
  
  const inReviewCount = currentDataset.filter((d) => {
    const c = getCreationStatus(d);
    return c.status === 'EN_REVISION' || c.status === 'CORREGIDO_EN_REVISION';
  }).length;

  const habilitadosCount = currentDataset.filter((d) => {
    const c = getCreationStatus(d);
    return c.status === 'PROVEEDOR_HABILITADO' || c.status === 'APROBADO';
  }).length;

  const requeridosCount = currentDataset.filter((d) => {
    const c = getCreationStatus(d);
    return (
      c.status === 'REQUIERE_CORRECCION' ||
      c.status === 'DOCUMENTACION_PENDIENTE' ||
      c.status === 'DOCUMENTACION_VENCIDA'
    );
  }).length;

  // Filtrado de expedientes
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

    const matchesStatus =
      statusFilter === 'ALL' ||
      creation.status === statusFilter ||
      (statusFilter === 'EN_REVISION' && (creation.status === 'EN_REVISION' || creation.status === 'CORREGIDO_EN_REVISION')) ||
      (statusFilter === 'PROVEEDOR_HABILITADO' && (creation.status === 'PROVEEDOR_HABILITADO' || creation.status === 'APROBADO')) ||
      (statusFilter === 'REQUIERE_CORRECCION' && (creation.status === 'REQUIERE_CORRECCION' || creation.status === 'DOCUMENTACION_PENDIENTE'));

    const matchesCat = categoryFilter === 'ALL' || d.selectedCategory === categoryFilter;
    const matchesTier = tierFilter === 'ALL' || d.supplierTier === tierFilter;

    return matchesSearch && matchesStatus && matchesCat && matchesTier;
  });

  // Cálculo limpio de avance de requisitos
  const getDocumentProgress = (d: SupplierDossier) => {
    const docs = Object.values(d.documents || {});
    const requiredDocs = docs.filter((doc) => doc.isRequired !== false);
    const approvedDocs = requiredDocs.filter((doc) => doc.status === 'APROBADO');
    const totalRequired = requiredDocs.length || 1;
    const percent = Math.round((approvedDocs.length / totalRequired) * 100);

    return {
      approved: approvedDocs.length,
      total: totalRequired,
      percent,
    };
  };

  const renderStatusBadge = (d: SupplierDossier) => {
    const creation = getCreationStatus(d);
    switch (creation.status) {
      case 'PROVEEDOR_HABILITADO':
      case 'APROBADO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-blue-900 text-white dark:bg-blue-950 dark:text-cyan-300 border border-blue-700">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
            <span>Habilitado (100%)</span>
          </span>
        );
      case 'EN_REVISION':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-900 dark:bg-blue-950/70 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>En Revisión</span>
          </span>
        );
      case 'CORREGIDO_EN_REVISION':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-sky-50 text-sky-900 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
            <span>Subsanado</span>
          </span>
        );
      case 'REQUIERE_CORRECCION':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Requiere Corrección</span>
          </span>
        );
      case 'RECHAZADO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-slate-800 text-white border border-slate-700">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-300" />
            <span>Rechazado</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Doc. Pendiente</span>
          </span>
        );
    }
  };

  const handleCardClick = (targetStatus: string) => {
    setActiveTab('EXPEDIENTES');
    setStatusFilter(targetStatus);
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-5 lg:px-6 py-4 space-y-4">
      
      {/* 1. Encabezado Limpio y Profesional */}
      <div className="bg-white rounded-2xl px-5 py-4 text-slate-900 border border-slate-200/80 shadow-xs dark:bg-[#0b1329] dark:text-white dark:border-blue-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Control Operativo de Proveedores
              </h1>
              <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 rounded-full text-blue-800 font-bold text-[10px] uppercase font-mono dark:bg-blue-950 dark:border-blue-800 dark:text-cyan-300">
                {role === 'ADMIN' ? 'Vista Total Administrador' : `Revisor: ${activeUser?.shortName || 'Técnico'}`}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
              Bandeja central para auditar documentación, subsanaciones y habilitación oficial de contratistas.
            </p>
          </div>

          {/* Botones de acción directos */}
          <div className="flex items-center gap-2 shrink-0">
            {role === 'REVISOR' && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold mr-1">
                <button
                  onClick={() => setScopeMode('CARTERA')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    scopeMode === 'CARTERA'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Mostrar solo proveedores asignados a mi cuenta"
                >
                  Mi Cartera ({dossiers.length})
                </button>
                <button
                  onClick={() => setScopeMode('GLOBAL')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    scopeMode === 'GLOBAL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Mostrar todos los proveedores de la empresa"
                >
                  Global ({allDossiers.length})
                </button>
              </div>
            )}

            {(role === 'ADMIN' || role === 'REVISOR') && (
              <button
                onClick={() => setIsAdminCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Registrar Proveedor</span>
              </button>
            )}

            {/* Pestañas de Vista */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                onClick={() => setActiveTab('EXPEDIENTES')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'EXPEDIENTES'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-cyan-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Expedientes</span>
              </button>
              <button
                onClick={() => setActiveTab('ANALYTICS')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'ANALYTICS'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-cyan-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Analítica SIG</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Cuatro Tarjetas KPI Claras y Accionables (Filtros de 1 clic) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Proveedores */}
        <div
          onClick={() => handleCardClick('ALL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-2xs ${
            statusFilter === 'ALL' && activeTab === 'EXPEDIENTES'
              ? 'bg-blue-50/70 border-blue-400 dark:bg-blue-950/60 dark:border-blue-700 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-[#0f172a] dark:border-slate-800'
          }`}
          title="Ver todos los proveedores"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Total Proveedores
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
              {totalCount}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">En registro maestro</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* En Revisión / Subsanados */}
        <div
          onClick={() => handleCardClick('EN_REVISION')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-2xs ${
            statusFilter === 'EN_REVISION' && activeTab === 'EXPEDIENTES'
              ? 'bg-blue-50/70 border-blue-500 dark:bg-blue-950/60 dark:border-blue-700 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-[#0f172a] dark:border-slate-800'
          }`}
          title="Filtrar proveedores que requieren revisión documental"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-cyan-400 block">
              Por Gestionar
            </span>
            <span className="text-2xl font-black text-blue-900 dark:text-white font-mono mt-0.5 block">
              {inReviewCount}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">En revisión o subsanados</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-cyan-300 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Habilitados Oficiales */}
        <div
          onClick={() => handleCardClick('PROVEEDOR_HABILITADO')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-2xs ${
            statusFilter === 'PROVEEDOR_HABILITADO' && activeTab === 'EXPEDIENTES'
              ? 'bg-blue-50/70 border-blue-500 dark:bg-blue-950/60 dark:border-blue-700 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-[#0f172a] dark:border-slate-800'
          }`}
          title="Filtrar proveedores aprobados y habilitados"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
              Habilitados (100%)
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
              {habilitadosCount}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Listos para compras</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-900 text-white dark:bg-blue-950 dark:text-cyan-300 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Requieren Corrección / Observados */}
        <div
          onClick={() => handleCardClick('REQUIERE_CORRECCION')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-2xs ${
            statusFilter === 'REQUIERE_CORRECCION' && activeTab === 'EXPEDIENTES'
              ? 'bg-amber-50/70 border-amber-400 dark:bg-amber-950/60 dark:border-amber-700 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 dark:bg-[#0f172a] dark:border-slate-800'
          }`}
          title="Filtrar proveedores con observaciones o documentos pendientes"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
              Observados
            </span>
            <span className="text-2xl font-black text-amber-900 dark:text-amber-200 font-mono mt-0.5 block">
              {requeridosCount}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Corrección o pendientes</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-300 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Contenido Principal */}
      {activeTab === 'EXPEDIENTES' ? (
        <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          
          {/* Barra de Filtros Rápida y Limpia */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
            {/* Buscador */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por Proveedor, NIT o Radicado..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Selectores de Filtrado */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="EN_REVISION">Por Revisar / Subsanado</option>
                <option value="PROVEEDOR_HABILITADO">Habilitado (100%)</option>
                <option value="REQUIERE_CORRECCION">Requiere Corrección</option>
                <option value="DOCUMENTACION_PENDIENTE">Doc. Pendiente</option>
                <option value="RECHAZADO">Rechazado</option>
              </select>

              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="text-xs px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
              >
                <option value="ALL">Todos los Tiers</option>
                <option value="A">Tier A (Crítico)</option>
                <option value="B">Tier B (Operativo)</option>
                <option value="C">Tier C (Estándar)</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer max-w-[200px] truncate"
              >
                <option value="ALL">Todas las Categorías</option>
                <option value="REPUESTOS_AUTOMOTRICES">Repuestos y Mantenimiento</option>
                <option value="COMBUSTIBLES_LUBRICANTES">Combustibles y Lubricantes</option>
                <option value="SERVICIOS_TECNOLOGICOS">Servicios Tecnológicos</option>
                <option value="SERVICIOS_GENERALES">Servicios Generales</option>
                <option value="SEGUROS_LEGAL">Seguros y Legal</option>
              </select>

              {(statusFilter !== 'ALL' || tierFilter !== 'ALL' || categoryFilter !== 'ALL' || searchTerm) && (
                <button
                  onClick={() => {
                    setStatusFilter('ALL');
                    setTierFilter('ALL');
                    setCategoryFilter('ALL');
                    setSearchTerm('');
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-cyan-400 px-2 py-1 cursor-pointer"
                >
                  Restablecer
                </button>
              )}
            </div>
          </div>

          {/* Tabla Despejada y Optimizada */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Radicado</th>
                  <th className="py-3 px-4">Proveedor / Razón Social</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3">Revisor Responsable</th>
                  <th className="py-3 px-3 text-center">Avance Requisitos</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {filteredDossiers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      No se encontraron proveedores que coincidan con la búsqueda o filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredDossiers.map((d) => {
                    const basic: Partial<SupplierBasicInfo> = d.basicInfo || {};
                    const isNat = basic.supplierType === 'NATURAL';
                    const name = isNat ? (basic.fullName || 'Sin Nombre') : (basic.companyName || 'Sin Razón Social');
                    const docId = isNat ? (basic.documentNumber || '-') : (basic.nit || '-');
                    const progress = getDocumentProgress(d);
                    const categoryDisplay = (d.selectedCategory || 'GENERAL').replace(/_/g, ' ');

                    return (
                      <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                        {/* Radicado */}
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700 dark:text-cyan-400 whitespace-nowrap">
                          {d.fileNumber || d.id}
                        </td>

                        {/* Razón Social */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                            {name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {isNat ? 'CC' : 'NIT'}: {docId} &bull; {basic.email || 'Sin correo'}
                          </div>
                        </td>

                        {/* Categoría y Tier */}
                        <td className="py-3.5 px-3">
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md inline-block">
                            {categoryDisplay}
                          </span>
                          {d.supplierTier && (
                            <span className="ml-1.5 text-[10px] font-bold text-blue-800 dark:text-cyan-300">
                              Tier {d.supplierTier}
                            </span>
                          )}
                        </td>

                        {/* Revisor */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-cyan-300 text-[10px] font-black flex items-center justify-center shrink-0">
                              {d.assignedReviewerId === 'revisor-1'
                                ? 'R1'
                                : d.assignedReviewerId === 'revisor-2'
                                ? 'R2'
                                : d.assignedReviewerId === 'revisor-3'
                                ? 'R3'
                                : 'AD'}
                            </span>
                            <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                              {d.assignedReviewerName || 'Sin asignar'}
                            </span>
                          </div>
                        </td>

                        {/* Avance */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <div className="inline-block w-28">
                            <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                              <span className="text-slate-600 dark:text-slate-400">
                                {progress.approved}/{progress.total}
                              </span>
                              <span className="font-mono text-blue-700 dark:text-cyan-400">
                                {progress.percent}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  progress.percent === 100
                                    ? 'bg-blue-600 dark:bg-cyan-400'
                                    : progress.percent >= 50
                                    ? 'bg-blue-500'
                                    : 'bg-slate-400'
                                }`}
                                style={{ width: `${progress.percent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Estado */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {renderStatusBadge(d)}
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              title="Enviar correo institucional"
                              onClick={() => {
                                setSelectedDossierForEmail(d);
                                setIsEmailModalOpen(true);
                              }}
                              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              title="Calificar Evaluación SIG"
                              onClick={() => openSupplierEvaluation(d.id)}
                              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                            >
                              <Award className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
                            </button>

                            <button
                              type="button"
                              onClick={() => openSupplierReview(d.id)}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
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
      ) : (
        /* Pestaña de Analítica (Ordenada y limpia bajo demanda) */
        <div className="space-y-4">
          <ExecutiveDashboardMetrics
            dossiers={currentDataset}
            allDossiers={allDossiers}
            convocatorias={convocatorias}
            supplierEvaluations={supplierEvaluations}
            auditLogs={systemAuditLogs}
            onFilterByStatus={(status) => {
              setStatusFilter(status);
              setActiveTab('EXPEDIENTES');
            }}
          />

          <ExecutiveSIGAnalytics
            dossiers={currentDataset}
            supplierEvaluations={supplierEvaluations}
            onFilterByTier={(tier) => {
              setTierFilter(tier);
              setActiveTab('EXPEDIENTES');
            }}
            onFilterByStatus={(status) => {
              setStatusFilter(status);
              setActiveTab('EXPEDIENTES');
            }}
            onFilterByCategory={(cat) => {
              setCategoryFilter(cat);
              setActiveTab('EXPEDIENTES');
            }}
            onOpenEvaluationForDossier={(dossierId) => openSupplierEvaluation(dossierId)}
          />
        </div>
      )}

      {/* Modal de Envío de Correo */}
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

      {/* Modal de Registro de Proveedor por Administrador */}
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
