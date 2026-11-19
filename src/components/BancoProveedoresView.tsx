import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, FileSpreadsheet, ChevronLeft, ChevronRight, Users, LayoutGrid, Tag, Folder, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SupplierDossier } from '../types';
import { InternalReviewDossierDetail } from './InternalReviewDossierDetail';
import { SupplierCertificateModal } from './SupplierCertificateModal';
import { getCreationStatus, getContractualStatus } from '../utils/contractValidity';
import { BancoTable } from './banco/BancoTable';
import { HeroTabs, IconField, PageBody, PageHeader, cardCls, heroPrimaryBtn, heroSecondaryBtn, inputCls, secondaryBtn, selectCls } from './ui/archive';

// Filtro rápido de estado: Pendiente, Habilitado y Documento vencido (más el aviso de "por vencer")
const QUICK_FILTERS: Array<{ key: string; label: string }> = [
  { key: 'ALL', label: 'Todos' },
  { key: 'DOCUMENTACION_PENDIENTE', label: 'Pendientes' },
  { key: 'PROVEEDOR_HABILITADO', label: 'Habilitados' },
  { key: 'DOCUMENTACION_VENCIDA', label: 'Documentos vencidos' },
  { key: 'DOCUMENTACION_POR_VENCER', label: 'Por vencer' },
];

export const BancoProveedoresView: React.FC = () => {
  const { isReadOnly, accountRole, dossiers, setCurrentDossierId, setActiveView, openSupplierEvaluation, getDossierProgress, highlightedSupplierId, clearHighlightedSupplier } = useApp();

  // Expediente abierto dentro del Banco (mantiene la navegación del Banco)
  const [selectedDossierIdForReview, setSelectedDossierIdForReview] = useState<string | null>(null);

  const [selectedDossierForCertificate, setSelectedDossierForCertificate] = useState<SupplierDossier | null>(null);

  // Filtros: estado de creación y vinculación contractual por separado
  const [searchTerm, setSearchTerm] = useState('');
  const [creationStatusFilter, setCreationStatusFilter] = useState<string>('ALL');
  const [contractStatusFilter, setContractStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [sarlaftFilter, setSarlaftFilter] = useState<string>('ALL');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

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
        (creationStatusFilter === 'DOCUMENTACION_POR_VENCER'
          ? !creation.hasExpiredDocs && creation.hasExpiringSoonDocs
          : d.processStatus === creationStatusFilter);

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

  // Llegada desde un aviso de asignación: se quitan los filtros, se abre la página donde está y se alumbra en azul
  const [blueId, setBlueId] = useState<string | null>(null);
  useEffect(() => {
    if (!highlightedSupplierId) return;
    setBlueId(highlightedSupplierId);
    setSelectedDossierIdForReview(null);
    setSearchTerm('');
    setCreationStatusFilter('ALL');
    setContractStatusFilter('ALL');
    setCategoryFilter('ALL');
    setTypeFilter('ALL');
    setTierFilter('ALL');
    setSarlaftFilter('ALL');
    clearHighlightedSupplier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedSupplierId]);

  useEffect(() => {
    if (!blueId) return;
    const idx = filteredDossiers.findIndex((d) => d.id === blueId);
    if (idx >= 0) setCurrentPage(Math.floor(idx / ITEMS_PER_PAGE) + 1);
    const t1 = window.setTimeout(() => {
      document.querySelector<HTMLElement>(`[data-dossier-id="${CSS.escape(blueId)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 350);
    const t2 = window.setTimeout(() => setBlueId(null), 10000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blueId, filteredDossiers.length]);


  const categories = useMemo(
    () => Array.from(new Set(dossiers.map((d) => d.selectedCategory).filter(Boolean))).sort(),
    [dossiers]
  );

  const quickCount = (key: string) => {
    if (key === 'ALL') return dossiers.length;
    return dossiers.filter((d) => {
      if (key === 'DOCUMENTACION_POR_VENCER') {
        const c = getCreationStatus(d);
        return !c.hasExpiredDocs && c.hasExpiringSoonDocs;
      }
      return d.processStatus === key;
    }).length;
  };

  const activeContracts = dossiers.filter((d) => {
    const s = getContractualStatus(d).status;
    return s === 'VIGENTE' || s === 'POR_VENCER';
  }).length;

  const extraFilters = [typeFilter, sarlaftFilter].filter((v) => v !== 'ALL').length;
  const anyFilter =
    searchTerm || creationStatusFilter !== 'ALL' || contractStatusFilter !== 'ALL' || categoryFilter !== 'ALL' || tierFilter !== 'ALL' || extraFilters > 0;

  const clearFilters = () => {
    setSearchTerm('');
    setCreationStatusFilter('ALL');
    setContractStatusFilter('ALL');
    setCategoryFilter('ALL');
    setTypeFilter('ALL');
    setTierFilter('ALL');
    setSarlaftFilter('ALL');
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
    <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 pb-8 pt-1">
      <PageHeader
        icon={Users}
        title="Banco de proveedores"
        subtitle={`${dossiers.length} proveedores registrados · ${activeContracts} con contrato activo`}
        actions={
          <>
            <button type="button" className={heroSecondaryBtn} onClick={() => setActiveView('informesExcel')}>
              <FileSpreadsheet className="w-5 h-5" /> Reportes
            </button>
            {!isReadOnly && (
              <button type="button" className={heroPrimaryBtn} onClick={() => setActiveView('registrarProveedor')}>
                <Plus className="w-6 h-6" strokeWidth={2.4} /> Registrar proveedor
              </button>
            )}
          </>
        }
        tabs={
          <HeroTabs
            items={QUICK_FILTERS.map((q) => ({ key: q.key, label: q.label, count: quickCount(q.key) }))}
            value={creationStatusFilter}
            onChange={setCreationStatusFilter}
          />
        }
      />

      <PageBody>
        <div className={`${cardCls} p-3.5 space-y-3`}>
          <div className="flex flex-col lg:flex-row gap-3">
            <label className="relative flex-1 min-w-[220px]">
              <span className="sr-only">Buscar</span>
              <Search className="w-[19px] h-[19px] text-[#0b1d3a] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                className={`${inputCls} w-full h-11 pl-11 rounded-full`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, NIT, cédula, radicado, correo o ciudad"
              />
            </label>
            <IconField icon={LayoutGrid} className="lg:w-60"><select className={`${inputCls} ${selectCls}`} value={contractStatusFilter} onChange={(e) => setContractStatusFilter(e.target.value)} aria-label="Contrato">
              <option value="ALL">Todos los contratos</option>
              <option value="CONTRATOS_ACTIVOS">Contratos activos</option>
              <option value="VIGENTE">Vigente</option>
              <option value="POR_VENCER">Por vencer (30 días)</option>
              <option value="VENCIDO">Vencido</option>
              <option value="SIN_CONTRATO">Sin contrato</option>
              <option value="SUSPENDIDO">Suspendido</option>
            </select></IconField>
            <IconField icon={Tag} className="lg:w-52"><select className={`${inputCls} ${selectCls}`} value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} aria-label="Tipo">
              <option value="ALL">Todos los tipos</option>
              <option value="A">Tipo A · Crítico</option>
              <option value="B">Tipo B · Operativo</option>
              <option value="C">Tipo C · Estándar</option>
            </select></IconField>
            <IconField icon={Folder} className="lg:w-64"><select className={`${inputCls} ${selectCls}`} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Categoría">
              <option value="ALL">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select></IconField>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2.5 h-11 px-6 rounded-2xl bg-[#0a4561] hover:bg-[#0b455c] dark:bg-[#0f5b79] dark:ring-1 dark:ring-[#6cc8ed] dark:shadow-[0_0_18px_-4px_rgba(60,150,255,0.8)] text-white text-[15px] font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-[0_8px_18px_-10px_rgba(10,69,97,0.95)]"
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              aria-expanded={showMoreFilters}
            >
              <Filter className="w-5 h-5" /> Más filtros{extraFilters > 0 ? ` (${extraFilters})` : ''}
            </button>
          </div>
          {showMoreFilters && (
            <div className="flex flex-col sm:flex-row gap-3">
              <select className={`${inputCls} w-full sm:w-56`} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Naturaleza">
                <option value="ALL">Personas naturales y jurídicas</option>
                <option value="JURIDICA">Persona jurídica</option>
                <option value="NATURAL">Persona natural</option>
              </select>
              <select className={`${inputCls} w-full sm:w-56`} value={sarlaftFilter} onChange={(e) => setSarlaftFilter(e.target.value)} aria-label="SARLAFT">
                <option value="ALL">Todos los resultados SARLAFT</option>
                <option value="SIN_COINCIDENCIAS">Sin coincidencias</option>
                <option value="REQUIERE_VERIFICACION">Requiere verificación</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>
            </div>
          )}
        </div>

      <section className={`${cardCls} overflow-hidden`}>
        <BancoTable
          rows={paginatedDossiers}
          emptyText={dossiers.length === 0 ? 'Aún no hay proveedores registrados.' : 'Ningún proveedor coincide con la búsqueda o los filtros.'}
          onOpen={handleOpenDossier}
          onEvaluate={openSupplierEvaluation}
          onCertificate={setSelectedDossierForCertificate}
          progressOf={getDossierProgress}
          canEvaluate={!isReadOnly}
          highlightId={blueId}
          showOwners={accountRole === 'SUPERADMIN'}
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#e8eef5] dark:border-slate-800 text-sm text-fs-muted">
          <span>
            {filteredDossiers.length === 0 ? 'Sin resultados' : `${startIndex + 1} a ${endIndex} de ${filteredDossiers.length}`}
            {anyFilter && (
              <button type="button" onClick={clearFilters} className="ml-3 text-fs-blue hover:underline underline-offset-2 cursor-pointer">
                Limpiar filtros
              </button>
            )}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                className={`${secondaryBtn} h-8 px-2.5`}
                disabled={validCurrentPage === 1}
                onClick={() => setCurrentPage(validCurrentPage - 1)}
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <span className="px-3 tabular-nums">
                Página {validCurrentPage} de {totalPages}
              </span>
              <button
                type="button"
                className={`${secondaryBtn} h-8 px-2.5`}
                disabled={validCurrentPage === totalPages}
                onClick={() => setCurrentPage(validCurrentPage + 1)}
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>
      </PageBody>

      <SupplierCertificateModal
        isOpen={Boolean(selectedDossierForCertificate)}
        onClose={() => setSelectedDossierForCertificate(null)}
        dossier={selectedDossierForCertificate}
      />
    </div>
  );
};
