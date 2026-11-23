import React, { useState, useMemo } from 'react';
import { Search, Sliders, Printer, Trash2, FileSpreadsheet, Star, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  SupplierDossier,
  SupplierEvaluation,
  SupplierEvaluationType,
} from '../../types';
import { exportEvaluationsExcel } from '../../utils/reports/quickExport';
import { averageCurrentScore, buildEvaluationRow } from '../../utils/evaluationRows';
import {
  FigureBand,
  rowCls,
  rowPrimaryBtn,
  tbodyCls,
  theadRowCls,
  HeroTabs,
  PageBody,
  PageHeader,
  cardCls,
  heroPrimaryBtn,
  heroSecondaryBtn,
  Radicado,
  StatusPill,
  TierBadge,
  Tone,
  inputCls,
  primaryBtn,
  secondaryBtn,
  supplierName,
} from '../ui/archive';
import { EvaluationFormModal } from './EvaluationFormModal';
import { EvaluationCertificateModal } from './EvaluationCertificateModal';
import { EvaluationPdfModal } from './EvaluationPdfModal';
import { parseLocalDate } from '../../utils/dateOnly';
import { isDossierInactive } from '../../utils/dossierActive';
import { useConfirm } from '../ui/ConfirmDialog';
import { preloadPdfTools } from '../../utils/certificatePdf';
import { EvaluationMethodConfigModal } from './EvaluationMethodConfigModal';
import { EvaluationErrorBoundary } from './EvaluationErrorBoundary';
import { evaluationConceptLabel, evaluationMaxScore, evaluationPercent, isDoc006Evaluation } from '../../utils/evaluationScale';

export const SupplierEvaluationsView: React.FC = () => {
  const {
    allDossiers: everyDossier,
    role,
    isReadOnly,
    activeUser,
    activeUserId,
    systemUsers,
    supplierEvaluations,
    evaluationMethod,
    selectedEvaluationDossierId,
    setSelectedEvaluationDossierId,
    deleteSupplierEvaluation,
    showToast,
  } = useApp();
  // Un proveedor inactivo no se evalúa ni aparece aquí
  const allDossiers = useMemo(() => everyDossier.filter((d) => !isDossierInactive(d)), [everyDossier]);

  // Active View Tab: 'matrix' (proveedores y sus estados 1/2) vs 'history' (todas las evaluaciones guardadas)
  const [activeTab, setActiveTab] = useState<'matrix' | 'history'>('matrix');

  // Evaluator filter selection in module (syncs with activeUserId or allows switching)
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState<string>(
    role === 'REVISOR' ? (activeUserId || 'ALL') : 'ALL'
  );

  // Sync if activeUserId changes externally (e.g. from Sidebar or Header)
  React.useEffect(() => {
    if (role === 'REVISOR' && activeUserId && activeUserId !== selectedEvaluatorId) {
      setSelectedEvaluatorId(activeUserId);
    }
  }, [activeUserId]);

  const currentEvaluatorUser = useMemo(() => {
    if (selectedEvaluatorId === 'ALL') return null;
    return systemUsers.find((u) => u.id === selectedEvaluatorId) || activeUser;
  }, [selectedEvaluatorId, systemUsers, activeUser]);

  const handleEvaluatorChange = (newEvaluatorId: string) => {
    setSelectedEvaluatorId(newEvaluatorId);
    if (newEvaluatorId !== 'ALL') {
      const targetUser = systemUsers.find((u) => u.id === newEvaluatorId);
      const count = allDossiers.filter((d) => {
        if (d.assignedReviewerId === newEvaluatorId) return true;
        if (
          targetUser &&
          d.assignedReviewerName &&
          (d.assignedReviewerName.toLowerCase().includes(targetUser.shortName.toLowerCase()) ||
            d.assignedReviewerName.toLowerCase().includes(targetUser.name.toLowerCase()))
        ) {
          return true;
        }
        return false;
      }).length;
      showToast(
        `Evaluador activo: ${targetUser?.name || newEvaluatorId}. Mostrando únicamente la cartera y evaluaciones de este usuario (${count} proveedores).`,
        'info',
        'EVALUADOR ACTIVO FILTRADO'
      );
    } else {
      showToast(
        `Mostrando consolidado general de todos los evaluadores (${allDossiers.length} proveedores).`,
        'info',
        'VISTA CONSOLIDADA'
      );
    }
  };

  // Dossiers corresponding to the selected evaluator (or all if 'ALL' is chosen)
  const relevantDossiers = useMemo(() => {
    if (selectedEvaluatorId === 'ALL') {
      return allDossiers;
    }
    const targetUser = systemUsers.find((u) => u.id === selectedEvaluatorId);
    return allDossiers.filter((d) => {
      // Direct assignment by reviewer id
      if (d.assignedReviewerId === selectedEvaluatorId) return true;
      // Match by reviewer name or evaluator user shortName / name
      if (
        targetUser &&
        d.assignedReviewerName &&
        (d.assignedReviewerName.toLowerCase().includes(targetUser.shortName.toLowerCase()) ||
          d.assignedReviewerName.toLowerCase().includes(targetUser.name.toLowerCase()))
      ) {
        return true;
      }
      // Check if dossier has evaluations performed by this evaluator
      const hasDossierEval =
        Array.isArray(d.evaluations) &&
        d.evaluations.some(
          (e) =>
            e.evaluatorId === selectedEvaluatorId ||
            (targetUser && e.evaluatorName?.toLowerCase().includes(targetUser.shortName.toLowerCase()))
        );
      if (hasDossierEval) return true;

      // Check global supplierEvaluations table for this dossier
      const hasGlobalEval = supplierEvaluations.some(
        (e) =>
          e.dossierId === d.id &&
          (e.evaluatorId === selectedEvaluatorId ||
            (targetUser && e.evaluatorName?.toLowerCase().includes(targetUser.shortName.toLowerCase())))
      );
      return hasGlobalEval;
    });
  }, [allDossiers, selectedEvaluatorId, systemUsers, supplierEvaluations]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');

  // Modals state
  const [isEvaluationFormOpen, setIsEvaluationFormOpen] = useState(false);
  const [evalModalSupplier, setEvalModalSupplier] = useState<SupplierDossier | null>(null);
  const [evalModalType, setEvalModalType] = useState<SupplierEvaluationType>('INICIAL');

  const [selectedEvaluationForCert, setSelectedEvaluationForCert] = useState<SupplierEvaluation | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Auto-open if selectedEvaluationDossierId was set
  React.useEffect(() => {
    if (selectedEvaluationDossierId) {
      const match = allDossiers.find((d) => d.id === selectedEvaluationDossierId);
      if (match) {
        setEvalModalSupplier(match);
        // Decide if initial or annual is needed
        const hasInitial = match.evaluations?.some((e) => e.evaluationType === 'INICIAL') || match.initialEvaluation;
        setEvalModalType(hasInitial ? 'ANUAL_1_ANO' : 'INICIAL');
        setIsEvaluationFormOpen(true);
      }
      setSelectedEvaluationDossierId(null);
    }
  }, [selectedEvaluationDossierId, allDossiers, setSelectedEvaluationDossierId]);

  // Helper: compute dates, recurring cycles, and statuses for each supplier of this evaluator
  const supplierEvaluationRows = useMemo(() => {
    return relevantDossiers.map((dossier) => ({
      ...buildEvaluationRow(dossier),
      isAssignedToMe: activeUser?.id ? dossier.assignedReviewerId === activeUser.id : false,
    }));
  }, [relevantDossiers, activeUser]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return supplierEvaluationRows.filter((row) => {
      const { dossier } = row;

      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const docVal = dossier.basicInfo?.nit || (dossier.basicInfo as any)?.documentNumber || (dossier.basicInfo as any)?.identificationNumber || '';
        const matchName = (dossier.basicInfo?.companyName || '').toLowerCase().includes(term);
        const matchDoc = docVal.toLowerCase().includes(term);
        const matchFile = (dossier.fileNumber || '').toLowerCase().includes(term);
        const matchCat = (dossier.selectedCategory || '').toLowerCase().includes(term);
        const matchRev = (dossier.assignedReviewerName || '').toLowerCase().includes(term);
        if (!matchName && !matchDoc && !matchFile && !matchCat && !matchRev) return false;
      }

      // Tier filter
      if (tierFilter !== 'ALL' && dossier.supplierTier !== tierFilter) {
        return false;
      }

      return true;
    });
  }, [supplierEvaluationRows, searchTerm, tierFilter]);

  // Filtered evaluations corresponding to selected evaluator
  const relevantEvaluations = useMemo(() => {
    if (selectedEvaluatorId === 'ALL') {
      return supplierEvaluations;
    }
    const targetUser = systemUsers.find((u) => u.id === selectedEvaluatorId);
    const evaluatorDossierIds = new Set(relevantDossiers.map((d) => d.id));
    return supplierEvaluations.filter((e) => {
      if (e.evaluatorId === selectedEvaluatorId) return true;
      if (
        targetUser &&
        e.evaluatorName &&
        (e.evaluatorName.toLowerCase().includes(targetUser.shortName.toLowerCase()) ||
          e.evaluatorName.toLowerCase().includes(targetUser.name.toLowerCase()))
      ) {
        return true;
      }
      return evaluatorDossierIds.has(e.dossierId);
    });
  }, [supplierEvaluations, selectedEvaluatorId, relevantDossiers, systemUsers]);

  // Evaluations for history tab, applying search filter
  const filteredEvaluations = useMemo(() => {
    if (!searchTerm) return relevantEvaluations;
    const term = searchTerm.toLowerCase();
    return relevantEvaluations.filter(
      (e) =>
        (e.supplierName || '').toLowerCase().includes(term) ||
        (e.supplierDoc || '').toLowerCase().includes(term) ||
        (e.certificateCode || '').toLowerCase().includes(term) ||
        (e.fileNumber || '').toLowerCase().includes(term) ||
        (e.evaluatorName || '').toLowerCase().includes(term) ||
        (e.categoryName || '').toLowerCase().includes(term)
    );
  }, [relevantEvaluations, searchTerm]);

  const handleExportEvaluationsExcel = async () => {
    const summary =
      selectedEvaluatorId === 'ALL'
        ? 'Todos los evaluadores'
        : `Evaluador: ${currentEvaluatorUser?.name || selectedEvaluatorId}`;
    try {
      await exportEvaluationsExcel(filteredEvaluations, summary, activeUser?.name || 'Usuario SIGEPRO');
      showToast(
        `Excel descargado: ${filteredEvaluations.length} evaluaciones.`,
        'success',
        'EXPORTACIÓN EXITOSA'
      );
    } catch (err) {
      console.error(err);
      showToast('No se pudo generar el Excel. Intenta de nuevo.', 'error');
    }
  };

  // Global KPIs corresponding to this evaluator
  const metrics = useMemo(() => {
    const total = supplierEvaluationRows.length;
    const activeSuppliers = supplierEvaluationRows.filter((r) => r.isSupplierActive).length;
    const initialCompleted = supplierEvaluationRows.filter((r) => r.initialEval).length;
    const initialPending = total - initialCompleted;
    const annualDone = supplierEvaluationRows.filter((r) => r.isSupplierActive && r.latestAnnualEval).length;

    // Average Score
    // Igual que en el Resumen: una sola evaluación por proveedor (la vigente)
    const { avg, count: scoredSuppliers } = averageCurrentScore(supplierEvaluationRows);
    const avgScore = avg === null ? 'N/A' : avg.toFixed(1);

    return {
      total,
      activeSuppliers,
      initialCompleted,
      initialPending,
      annualDone,
      avgScore,
      scoredSuppliers,
      totalEvaluationsRecorded: relevantEvaluations.length,
    };
  }, [supplierEvaluationRows, relevantEvaluations]);

  const handleOpenEvaluationModal = (supplier: SupplierDossier | null, type: SupplierEvaluationType) => {
    setEvalModalSupplier(supplier || (relevantDossiers.length > 0 ? relevantDossiers[0] : null));
    setEvalModalType(type);
    setIsEvaluationFormOpen(true);
  };

  // Pestañas: lo que toca calificar primero, luego todos y el historial
  const [view, setView] = useState<'due' | 'all' | 'history'>('all');
  // Las listas se muestran por páginas: con cientos de proveedores dibujarlas completas congela el navegador
  const EVAL_PAGE_SIZE = 25;
  const [evalPage, setEvalPage] = useState(1);
  React.useEffect(() => {
    setEvalPage(1);
  }, [view, searchTerm, tierFilter, selectedEvaluatorId]);
  const { ask: askConfirm, dialog: confirmDialog } = useConfirm();

  // Mientras se mira la lista, se deja lista la librería del PDF para que el acta abra de una vez
  React.useEffect(() => {
    preloadPdfTools();
  }, []);

  const canDeleteEvaluation = (ev: SupplierEvaluation) =>
    !isReadOnly && (role === 'ADMIN' || ev.evaluatorId === activeUser?.id);

  /** Alerta de eliminación con el diseño del sistema (reemplaza el cuadro gris del navegador). */
  const askDeleteEvaluation = (ev: SupplierEvaluation) =>
    askConfirm({
      title: '¿Eliminar esta evaluación?',
      message: `Se eliminará la evaluación ${ev.evaluationType === 'INICIAL' ? 'inicial' : `anual${ev.annualCycleNumber ? ` (año ${ev.annualCycleNumber})` : ''}`} de ${ev.supplierName}, con ${ev.totalScore} de ${evaluationMaxScore(ev)} puntos.`,
      hint: 'No se puede deshacer. Si el proveedor se queda sin evaluación inicial, volverá a aparecer como pendiente por calificar.',
      hintIcon: <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />,
      icon: <Trash2 className="w-6 h-6" />,
      confirmLabel: 'Sí, eliminar',
      onConfirm: () => {
        const res = deleteSupplierEvaluation(ev.id);
        if (res && res.success === false) showToast(res.message, 'warning', 'NO SE ELIMINÓ');
      },
    });

  // Por calificar: proveedores que todavía no tienen evaluación inicial
  const isDueRow = (r: (typeof supplierEvaluationRows)[number]) => r.dossier.processStatus !== 'RECHAZADO' && !r.initialEval;

  const dueRows = filteredRows.filter(isDueRow);
  const dueTotal = supplierEvaluationRows.filter(isDueRow).length;
  const tableRows = view === 'due' ? dueRows : filteredRows;

  const listTotal = view === 'history' ? filteredEvaluations.length : tableRows.length;
  const evalPages = Math.max(1, Math.ceil(listTotal / EVAL_PAGE_SIZE));
  const safeEvalPage = Math.min(Math.max(1, evalPage), evalPages);
  const pageFrom = (safeEvalPage - 1) * EVAL_PAGE_SIZE;
  const pageTo = Math.min(pageFrom + EVAL_PAGE_SIZE, listTotal);
  const pagedRows = tableRows.slice(pageFrom, pageTo);
  const pagedEvaluations = filteredEvaluations.slice(pageFrom, pageTo);
  const evalFooter = (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#e8eef5] dark:border-slate-800 text-sm text-fs-muted">
      <span>{listTotal === 0 ? 'Sin resultados' : `${pageFrom + 1} a ${pageTo} de ${listTotal}`}</span>
      {evalPages > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" className={`${secondaryBtn} h-8 px-2.5`} disabled={safeEvalPage === 1} onClick={() => setEvalPage(safeEvalPage - 1)}>
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
          <span className="px-3 tabular-nums">
            Página {safeEvalPage} de {evalPages}
          </span>
          <button type="button" className={`${secondaryBtn} h-8 px-2.5`} disabled={safeEvalPage === evalPages} onClick={() => setEvalPage(safeEvalPage + 1)}>
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  const fmtDate = (value?: string | Date) => {
    if (!value) return '—';
    const d = parseLocalDate(value);
    return !d ? String(value) : d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const conceptTone = (concept?: string): Tone =>
    concept === 'SOBRESALIENTE' ? 'navy' : concept === 'CONFORME' ? 'blue' : 'bad';

  const tabBtn = (key: 'due' | 'all' | 'history', label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={view === key}
      onClick={() => setView(key)}
      className={`h-9 px-4 text-sm font-medium rounded-md transition-colors cursor-pointer ${
        view === key ? 'bg-white dark:bg-slate-800 text-fs-navy dark:text-white shadow-[0_1px_2px_rgba(19,27,46,0.12)]' : 'text-fs-muted hover:text-fs-navy dark:hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 pb-8 pt-1">
      <PageHeader
        icon={Star}
        title="Evaluaciones"
        subtitle="Elija si la evaluación es inicial o anual al calificar"
        actions={
          <>
            <button type="button" className={heroSecondaryBtn} onClick={handleExportEvaluationsExcel}>
              <FileSpreadsheet className="w-4 h-4" /> Exportar
            </button>
            {role === 'ADMIN' && !isReadOnly && (
              <button type="button" className={heroPrimaryBtn} onClick={() => setIsConfigModalOpen(true)}>
                <Sliders className="w-4 h-4" /> Método de evaluación
              </button>
            )}
          </>
        }
        tabs={
          <HeroTabs
            items={[
              { key: 'all', label: 'Todos los proveedores', count: filteredRows.length },
              { key: 'due', label: 'Por calificar', count: dueRows.length },
              { key: 'history', label: 'Evaluados', count: filteredEvaluations.length },
            ]}
            value={view}
            onChange={(k) => setView(k as 'due' | 'all' | 'history')}
          />
        }
      />

      <PageBody>
      <FigureBand
        items={[
          { label: 'Por calificar', value: dueTotal, note: 'sin evaluación inicial', tone: dueTotal ? 'warn' : undefined, onClick: () => setView('due'), active: view === 'due' },
          { label: 'Evaluación inicial', value: `${metrics.initialCompleted} de ${metrics.total}`, note: 'proveedores calificados' },
          { label: 'Evaluación anual', value: `${metrics.annualDone} de ${metrics.activeSuppliers}`, note: 'habilitados con evaluación anual' },
          {
            label: 'Promedio',
            value: metrics.avgScore === 'N/A' ? '—' : String(metrics.avgScore).replace('.', ','),
            note: `${metrics.scoredSuppliers} proveedores evaluados · ${metrics.totalEvaluationsRecorded} evaluaciones`,
            onClick: () => setView('history'),
            active: view === 'history',
          },
        ]}
      />

      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <span className="sr-only">Buscar</span>
            <Search className="w-4 h-4 text-fs-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input className={`${inputCls} h-11 pl-11 w-80 rounded-full`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar proveedor o radicado" />
          </label>
          {view !== 'history' && (
            <select className={`${inputCls} h-11 w-48 font-semibold`} value={tierFilter} onChange={(e) => setTierFilter(e.target.value as typeof tierFilter)} aria-label="Tipo">
              <option value="ALL">Todos los tipos</option>
              <option value="A">Tipo A</option>
              <option value="B">Tipo B</option>
              <option value="C">Tipo C</option>
            </select>
          )}
          <select className={`${inputCls} h-11 w-64 font-semibold`} value={selectedEvaluatorId} onChange={(e) => handleEvaluatorChange(e.target.value)} aria-label="Evaluador">
            <option value="ALL">Todos los evaluadores</option>
            {systemUsers
              .filter((u) => u.role === 'REVISOR')
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {view !== 'history' ? (
        <section className={`${cardCls} overflow-x-auto`}>
          <table className="table-stack w-full text-[13px]">
            <thead>
              <tr className={theadRowCls}>
                  <th className="py-3.5 px-4 font-semibold">Proveedor</th>
                <th className="py-3.5 px-3 font-semibold">Revisor</th>
                <th className="py-3.5 px-3 font-semibold">Evaluación inicial</th>
                <th className="py-3.5 px-3 font-semibold">Evaluación anual</th>
                <th className="py-3.5 px-4" />
              </tr>
            </thead>
            <tbody className={tbodyCls}>
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-fs-muted">
                    {view === 'due' ? 'No hay proveedores pendientes de evaluación con estos filtros.' : 'Ningún proveedor coincide con la búsqueda o los filtros.'}
                  </td>
                </tr>
              ) : (
                pagedRows.map((r) => {
                  const { dossier, initialEval, latestAnnualEval } = r;
                  const needsInitial = !initialEval;
                  return (
                    <tr key={dossier.id} className={rowCls}>
                      <td className="py-3.5 px-4 min-w-[250px]">
                        <div className="flex items-center gap-2">
                          <TierBadge tier={dossier.supplierTier} />
                          <span className="text-[15px] font-bold text-[#0b1d3a] dark:text-white">{supplierName(dossier)}</span>
                        </div>
                        <div className="mt-0.5 ml-8 whitespace-nowrap">
                          <Radicado value={dossier.fileNumber} />
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-fs-navy dark:text-slate-300 whitespace-nowrap">{dossier.assignedReviewerName || 'Sin asignar'}</td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {initialEval ? (
                          <button type="button" onClick={() => setSelectedEvaluationForCert(initialEval)} className="text-left cursor-pointer group" title="Ver acta">
                            <span className="text-base font-bold tabular-nums text-fs-navy dark:text-white group-hover:text-fs-blue">{initialEval.totalScore}</span>
                            <span className="text-sm text-[#3a5274]"> / {evaluationMaxScore(initialEval)} · {evaluationConceptLabel(initialEval)}</span>
                            <div className="text-sm text-[#3a5274]">{fmtDate(initialEval.evaluationDate)}</div>
                          </button>
                        ) : (
                          <StatusPill tone="warn">Pendiente</StatusPill>
                        )}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {latestAnnualEval ? (
                          <button type="button" onClick={() => setSelectedEvaluationForCert(latestAnnualEval)} className="text-left cursor-pointer group" title="Ver acta">
                            <span className="text-base font-bold tabular-nums text-fs-navy dark:text-white group-hover:text-fs-blue">{latestAnnualEval.totalScore}</span>
                            <span className="text-sm text-[#3a5274]"> / {evaluationMaxScore(latestAnnualEval)} · {evaluationConceptLabel(latestAnnualEval)}</span>
                            <div className="text-sm text-[#3a5274]">
                              Año {latestAnnualEval.annualCycleNumber || r.completedAnnualCycles} · {fmtDate(latestAnnualEval.evaluationDate)}
                            </div>
                          </button>
                        ) : (
                          <span className="text-sm text-fs-muted">Sin evaluación anual</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex justify-end items-center gap-3">
                          {(() => {
                            const lastEval = latestAnnualEval || initialEval;
                            if (!lastEval) return null;
                            return (
                              <>
                                <button type="button" onClick={() => setSelectedEvaluationForCert(lastEval)} className={`${secondaryBtn} h-8 px-3`}>
                                  <Printer className="w-4 h-4" /> Acta
                                </button>
                                {canDeleteEvaluation(lastEval) && (
                                  <button
                                    type="button"
                                    title="Eliminar la última evaluación"
                                    aria-label="Eliminar la última evaluación"
                                    onClick={() => askDeleteEvaluation(lastEval)}
                                    className="w-8 h-8 grid place-items-center rounded-md text-fs-muted hover:text-fs-bad hover:bg-fs-bad-soft cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            );
                          })()}
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleOpenEvaluationModal(dossier, needsInitial ? 'INICIAL' : 'ANUAL_1_ANO')}
                              className={needsInitial ? rowPrimaryBtn : `${secondaryBtn} h-8 px-3 whitespace-nowrap`}
                            >
                              Evaluar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {evalFooter}
        </section>
      ) : (
        <section className={`${cardCls} overflow-x-auto`}>
          <table className="table-stack w-full text-[13px]">
            <thead>
              <tr className={theadRowCls}>
                  <th className="py-3.5 px-4 font-semibold">Proveedor</th>
                <th className="py-3.5 px-3 font-semibold">Tipo</th>
                <th className="py-3.5 px-3 font-semibold">Puntaje</th>
                <th className="py-3.5 px-3 font-semibold">Evaluador</th>
                <th className="py-3.5 px-3 font-semibold">Fecha</th>
                <th className="py-3.5 px-4" />
              </tr>
            </thead>
            <tbody className={tbodyCls}>
              {filteredEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-fs-muted">
                    Aún no hay proveedores evaluados{currentEvaluatorUser ? ` de ${currentEvaluatorUser.name}` : ''}.
                  </td>
                </tr>
              ) : (
                pagedEvaluations.map((ev) => (
                  <tr key={ev.id} className={rowCls}>
                    <td className="py-3.5 px-4 min-w-[240px]">
                      <div className="text-[15px] font-bold text-[#0b1d3a] dark:text-white">{ev.supplierName}</div>
                      <div className="flex gap-2 mt-0.5 whitespace-nowrap">
                        <Radicado value={ev.certificateCode} />
                        <span className="text-sm text-[#3a5274]">{ev.supplierDoc}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap text-fs-navy dark:text-slate-200">
                      {ev.evaluationType === 'INICIAL' ? 'Inicial' : `Anual${ev.annualCycleNumber ? ` · año ${ev.annualCycleNumber}` : ''}`}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="text-base font-bold tabular-nums text-fs-navy dark:text-white">{ev.totalScore}</span>
                      <span className="text-sm text-[#3a5274]"> / {evaluationMaxScore(ev)}</span>
                      <div className="mt-1">
                        <StatusPill tone={conceptTone(ev.concept)}>{evaluationConceptLabel(ev)}</StatusPill>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap text-fs-navy dark:text-slate-300">{ev.evaluatorName}</td>
                    <td className="py-3.5 px-3 whitespace-nowrap text-fs-muted">{fmtDate(ev.evaluationDate)}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex justify-end items-center gap-4">
                        <button type="button" onClick={() => setSelectedEvaluationForCert(ev)} className={`${secondaryBtn} h-8 px-3`}>
                          <Printer className="w-4 h-4" /> Acta
                        </button>
                        {canDeleteEvaluation(ev) && (
                          <button
                            type="button"
                            title="Eliminar evaluación"
                            aria-label="Eliminar evaluación"
                            onClick={() => askDeleteEvaluation(ev)}
                            className="w-8 h-8 grid place-items-center rounded-md text-fs-muted hover:text-fs-bad hover:bg-fs-bad-soft cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {evalFooter}
        </section>
      )}
      </PageBody>

      {/* Evaluation Form Modal */}
      {isEvaluationFormOpen && (
        <EvaluationErrorBoundary
          fallbackTitle="Formulario de Evaluación"
          onClose={() => {
            setIsEvaluationFormOpen(false);
            setEvalModalSupplier(null);
          }}
        >
          <EvaluationFormModal
            initialSupplier={evalModalSupplier}
            initialType={evalModalType}
            onClose={() => {
              setIsEvaluationFormOpen(false);
              setEvalModalSupplier(null);
            }}
            onSuccess={(saved) => {
              // Al registrar, el formato ya diligenciado se abre solo
              setSelectedEvaluationForCert(saved);
            }}
          />
        </EvaluationErrorBoundary>
      )}

      {/* Certificate / Acta Modal */}
      {selectedEvaluationForCert && (
        <EvaluationErrorBoundary
          fallbackTitle="Certificado de Evaluación"
          onClose={() => setSelectedEvaluationForCert(null)}
        >
          {isDoc006Evaluation(selectedEvaluationForCert) ? (
            <EvaluationPdfModal evaluation={selectedEvaluationForCert} onClose={() => setSelectedEvaluationForCert(null)} />
          ) : (
            <EvaluationCertificateModal
              evaluation={selectedEvaluationForCert}
              onClose={() => setSelectedEvaluationForCert(null)}
            />
          )}
        </EvaluationErrorBoundary>
      )}

      {confirmDialog}

      {/* Parameterization Modal */}
      {isConfigModalOpen && (
        <EvaluationErrorBoundary
          fallbackTitle="Configuración de Metodología"
          onClose={() => setIsConfigModalOpen(false)}
        >
          <EvaluationMethodConfigModal
            onClose={() => setIsConfigModalOpen(false)}
          />
        </EvaluationErrorBoundary>
      )}
    </div>
  );
};
