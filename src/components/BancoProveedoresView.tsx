import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, FileSpreadsheet, ChevronLeft, ChevronRight, Users, LayoutGrid, Tag, Folder, Filter, Power, RotateCcw, Trash2 } from 'lucide-react';
import { useConfirm } from './ui/ConfirmDialog';
import { useApp } from '../context/AppContext';
import { SupplierDossier } from '../types';
import { InternalReviewDossierDetail } from './InternalReviewDossierDetail';
import { SupplierCertificateModal } from './SupplierCertificateModal';
import { getCreationStatus, getContractualStatus } from '../utils/contractValidity';
import { BancoTable } from './banco/BancoTable';
import { HeroTabs, IconField, PageBody, PageHeader, cardCls, heroPrimaryBtn, heroSecondaryBtn, inputCls, primaryBtn, secondaryBtn, selectCls } from './ui/archive';

// Filtro rápido de estado: Pendiente, Habilitado y Documento vencido (más el aviso de "por vencer")
const QUICK_FILTERS: Array<{ key: string; label: string }> = [
  { key: 'ALL', label: 'Todos' },
  { key: 'DOCUMENTACION_PENDIENTE', label: 'Pendientes' },
  { key: 'PROVEEDOR_HABILITADO', label: 'Habilitados' },
  { key: 'DOCUMENTACION_VENCIDA', label: 'Documentos vencidos' },
  { key: 'DOCUMENTACION_POR_VENCER', label: 'Por vencer' },
];

export const BancoProveedoresView: React.FC = () => {
  const { isReadOnly, accountRole, dossiers: activeDossiers, allDossiers, inactiveDossiers, canManageProviders, setSupplierInactive, deleteSupplier, setCurrentDossierId, setActiveView, openSupplierEvaluation, getDossierProgress, highlightedSupplierId, clearHighlightedSupplier } = useApp();
  const { ask, dialog } = useConfirm();

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

  // El superadministrador ve TODOS los proveedores en la tabla (los inactivos, oscurecidos y marcados);
  // los administradores solo ven los activos y sus inactivos quedan en el aviso «Inactivos».
  const isSuper = accountRole === 'SUPERADMIN';
  const [showInactivePanel, setShowInactivePanel] = useState(false);
  const showingInactive = isSuper && creationStatusFilter === 'INACTIVOS';
  const countBase = isSuper ? allDossiers : activeDossiers;
  const dossiers = showingInactive ? inactiveDossiers : countBase;

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
        creationStatusFilter === 'INACTIVOS' ||
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
    if (key === 'INACTIVOS') return inactiveDossiers.length;
    if (key === 'ALL') return countBase.length;
    return countBase.filter((d) => {
      if (key === 'DOCUMENTACION_POR_VENCER') {
        const c = getCreationStatus(d);
        return !c.hasExpiredDocs && c.hasExpiringSoonDocs;
      }
      return d.processStatus === key;
    }).length;
  };

  const activeContracts = activeDossiers.filter((d) => {
    // (solo cuentan los activos)
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

  const name = (d: SupplierDossier) => (d.basicInfo.supplierType === 'NATURAL' ? d.basicInfo.fullName : d.basicInfo.companyName) || 'este proveedor';

  const askSetInactive = (d: SupplierDossier, inactive: boolean) => {
    if (inactive) {
      ask({
        title: `¿Inactivar a ${name(d)}?`,
        message: 'Dejará de aparecer en el Banco, en las evaluaciones, en los reportes y en las gráficas. No se borra nada: su expediente y sus documentos quedan guardados.',
        hint: isSuper
          ? 'Lo sigues viendo en la tabla, oscurecido y marcado como inactivo, y puedes reactivarlo cuando quieras.'
          : 'Lo encuentras en el botón «Inactivos» de arriba y desde ahí puedes activarlo cuando quieras.',
        confirmLabel: 'Sí, inactivar',
        tone: 'primary',
        icon: <Power className="w-6 h-6" />,
        onConfirm: () => setSupplierInactive(d.id, true),
      });
    } else {
      ask({
        title: `¿Reactivar a ${name(d)}?`,
        message: 'Volverá a aparecer en el Banco, en las evaluaciones, en los reportes y en las gráficas, con su información tal como la dejó.',
        confirmLabel: 'Sí, reactivar',
        tone: 'primary',
        icon: <RotateCcw className="w-6 h-6" />,
        onConfirm: () => {
          setSupplierInactive(d.id, false);
          setCreationStatusFilter('ALL');
        },
      });
    }
  };

  const askDelete = (d: SupplierDossier) =>
    ask({
      title: `¿Eliminar a ${name(d)} para siempre?`,
      message: 'Se borran su expediente, todos sus documentos y todas sus evaluaciones. Esta acción no se puede deshacer.',
      hint: 'Si solo quieres que deje de aparecer, mejor inactívalo: así no pierdes nada y puedes reactivarlo.',
      hintIcon: <Power className="w-4 h-4 shrink-0 mt-0.5" />,
      confirmLabel: 'Sí, eliminar definitivamente',
      tone: 'danger',
      icon: <Trash2 className="w-6 h-6" />,
      onConfirm: () => deleteSupplier(d.id),
    });

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
        subtitle={`${countBase.length} proveedores registrados · ${activeContracts} con contrato activo${inactiveDossiers.length ? ` · ${inactiveDossiers.length} inactivo${inactiveDossiers.length > 1 ? 's' : ''}` : ''}`}
        actions={
          <>
            {!isSuper && canManageProviders && inactiveDossiers.length > 0 && (
              <button type="button" className={heroSecondaryBtn} onClick={() => setShowInactivePanel((v) => !v)} aria-expanded={showInactivePanel}>
                <Power className="w-5 h-5" /> Inactivos ({inactiveDossiers.length})
              </button>
            )}
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
            items={[...QUICK_FILTERS, ...(isSuper ? [{ key: 'INACTIVOS', label: 'Inactivos' }] : [])].map((q) => ({ key: q.key, label: q.label, count: quickCount(q.key) }))}
            value={creationStatusFilter}
            onChange={setCreationStatusFilter}
          />
        }
      />

      <PageBody>
        {!isSuper && showInactivePanel && inactiveDossiers.length > 0 && (
          <section className={`${cardCls} p-4 sm:p-5`} aria-label="Proveedores inactivos">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span className="shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-slate-500/12 text-slate-600 dark:text-slate-300">
                  <Power className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[16px] font-bold text-[#0b1d3a] dark:text-white">Proveedores inactivos</h2>
                  <p className="text-[13px] text-[#3a5274] dark:text-slate-400">No aparecen en la tabla ni en evaluaciones, reportes o gráficas. Actívalos para devolverlos.</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowInactivePanel(false)} className={`${secondaryBtn} h-9 px-3 shrink-0`}>
                Cerrar
              </button>
            </div>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {inactiveDossiers.map((d) => {
                const info = d.basicInfo.inactive;
                return (
                  <li key={d.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#dbe5f1] dark:border-white/10 bg-[#f4f7fb] dark:bg-white/5 px-3.5 py-3">
                    <div className="min-w-0">
                      <div className="text-[14.5px] font-bold text-[#0b1d3a] dark:text-white truncate" title={name(d)}>{name(d)}</div>
                      <div className="text-[12px] text-[#5d7392] dark:text-slate-400 truncate">
                        {d.fileNumber}
                        {info?.at ? ` · inactivado el ${new Date(info.at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '')}` : ''}
                      </div>
                    </div>
                    <button type="button" className={`${primaryBtn} h-9 px-3.5 shrink-0`} onClick={() => askSetInactive(d, false)}>
                      <RotateCcw className="w-4 h-4" /> Activar
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
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
              className="inline-flex items-center justify-center gap-2.5 h-11 px-6 rounded-2xl bg-[#0f3d75] hover:bg-[#0b2f5c] dark:bg-[#0e3a7a] dark:ring-1 dark:ring-[#5aa8ff] dark:shadow-[0_0_18px_-4px_rgba(60,150,255,0.8)] text-white text-[15px] font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-[0_8px_18px_-10px_rgba(15,61,117,0.95)]"
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
          emptyText={
            dossiers.length === 0
              ? showingInactive
                ? 'No hay proveedores inactivos.'
                : 'Aún no hay proveedores registrados.'
              : 'Ningún proveedor coincide con la búsqueda o los filtros.'
          }
          onSetInactive={canManageProviders && !isReadOnly ? askSetInactive : undefined}
          onDelete={accountRole === 'SUPERADMIN' ? askDelete : undefined}
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

      {dialog}
      <SupplierCertificateModal
        isOpen={Boolean(selectedDossierForCertificate)}
        onClose={() => setSelectedDossierForCertificate(null)}
        dossier={selectedDossierForCertificate}
      />
    </div>
  );
};
