import React, { useState, useMemo } from 'react';
import { Search, Plus, Sliders, Printer, Trash2, FileSpreadsheet, Star } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  SupplierDossier,
  SupplierEvaluation,
  SupplierEvaluationType,
} from '../../types';
import { exportEvaluationsReport } from '../../utils/excelExport';
import { buildEvaluationRow } from '../../utils/evaluationRows';
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
import { EvaluationMethodConfigModal } from './EvaluationMethodConfigModal';
import { EvaluationErrorBoundary } from './EvaluationErrorBoundary';

export const SupplierEvaluationsView: React.FC = () => {
  const {
    allDossiers,
    role,
    activeUser,
    activeUserId,
    setActiveUserId,
    systemUsers,
    supplierEvaluations,
    evaluationMethod,
    selectedEvaluationDossierId,
    setSelectedEvaluationDossierId,
    deleteSupplierEvaluation,
    showToast,
  } = useApp();

  // Active View Tab: 'matrix' (proveedores y sus estados 1/2) vs 'history' (todas las evaluaciones guardadas)
  const [activeTab, setActiveTab] = useState<'matrix' | 'history'>('matrix');

  // Evaluator filter selection in module (syncs with activeUserId or allows switching)
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState<string>(
    role === 'REVISOR' ? (activeUserId || 'revisor-1') : 'ALL'
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
      setActiveUserId(newEvaluatorId);
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
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'PENDING_INITIAL' | 'DUE_ANNUAL' | 'UP_TO_DATE' | 'ACTIVE_ONLY'
  >('ALL');
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
    const now = new Date();

    return relevantDossiers.map((dossier) => ({
      ...buildEvaluationRow(dossier, now),
      isAssignedToMe: activeUser?.id ? dossier.assignedReviewerId === activeUser.id : false,
    }));
  }, [relevantDossiers, activeUser]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return supplierEvaluationRows.filter((row) => {
      const { dossier, initialEval, annualStatus, isSupplierActive } = row;

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

      // Status filter
      if (statusFilter === 'PENDING_INITIAL' && initialEval) return false;
      if (
        statusFilter === 'DUE_ANNUAL' &&
        (!isSupplierActive || (annualStatus !== 'VENCIDA_REQUIERE_EVAL' && annualStatus !== 'PROXIMA_VENCER'))
      ) {
        return false;
      }
      if (
        statusFilter === 'UP_TO_DATE' &&
        (!initialEval || (isSupplierActive && annualStatus === 'VENCIDA_REQUIERE_EVAL'))
      ) {
        return false;
      }
      if (statusFilter === 'ACTIVE_ONLY' && !isSupplierActive) {
        return false;
      }

      // Tier filter
      if (tierFilter !== 'ALL' && dossier.supplierTier !== tierFilter) {
        return false;
      }

      return true;
    });
  }, [supplierEvaluationRows, searchTerm, statusFilter, tierFilter]);

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

  const handleExportEvaluationsExcel = () => {
    const summary =
      selectedEvaluatorId === 'ALL'
        ? `Consolidado General de Todos los Evaluadores (${filteredEvaluations.length} evaluaciones)`
        : `Evaluador: ${currentEvaluatorUser?.name || selectedEvaluatorId} (${filteredEvaluations.length} evaluaciones)`;
    exportEvaluationsReport(filteredEvaluations, summary);
    showToast(
      `¡Reporte de Evaluaciones exportado en Excel con éxito (${filteredEvaluations.length} registros)!`,
      'success',
      'EXPORTACIÓN EXITOSA'
    );
  };

  // Global KPIs corresponding to this evaluator
  const metrics = useMemo(() => {
    const total = supplierEvaluationRows.length;
    const activeSuppliers = supplierEvaluationRows.filter((r) => r.isSupplierActive).length;
    const initialCompleted = supplierEvaluationRows.filter((r) => r.initialEval).length;
    const initialPending = total - initialCompleted;

    const activeRows = supplierEvaluationRows.filter((r) => r.isSupplierActive);
    const annualUpToDate = activeRows.filter((r) => r.annualStatus === 'AL_DIA').length;
    const annualDue = activeRows.filter((r) => r.annualStatus === 'VENCIDA_REQUIERE_EVAL').length;
    const annualUpcoming = activeRows.filter((r) => r.annualStatus === 'PROXIMA_VENCER').length;

    // Average Score
    const allScores = relevantEvaluations.map((e) => e.totalScore);
    const avgScore =
      allScores.length > 0
        ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1)
        : relevantEvaluations.length > 0
        ? '90.0'
        : 'N/A';

    return {
      total,
      activeSuppliers,
      initialCompleted,
      initialPending,
      annualUpToDate,
      annualDue,
      annualUpcoming,
      avgScore,
      totalEvaluationsRecorded: relevantEvaluations.length,
    };
  }, [supplierEvaluationRows, relevantEvaluations]);

  const handleOpenEvaluationModal = (supplier: SupplierDossier | null, type: SupplierEvaluationType) => {
    setEvalModalSupplier(supplier || (relevantDossiers.length > 0 ? relevantDossiers[0] : null));
    setEvalModalType(type);
    setIsEvaluationFormOpen(true);
  };

  // Pestañas: lo que toca calificar primero, luego todos y el historial
  const [view, setView] = useState<'due' | 'all' | 'history'>('due');

  const isDueRow = (r: (typeof supplierEvaluationRows)[number]) =>
    r.dossier.processStatus !== 'RECHAZADO' &&
    (!r.initialEval || r.annualStatus === 'VENCIDA_REQUIERE_EVAL' || r.annualStatus === 'PROXIMA_VENCER');

  const dueRows = filteredRows.filter(isDueRow).sort((a, b) => {
    // Primero las anuales vencidas, luego las próximas, luego iniciales pendientes
    const rank = (r: typeof a) => (r.annualStatus === 'VENCIDA_REQUIERE_EVAL' ? 0 : r.annualStatus === 'PROXIMA_VENCER' ? 1 : 2);
    return rank(a) - rank(b) || a.diffDays - b.diffDays;
  });
  const dueTotal = supplierEvaluationRows.filter(isDueRow).length;
  const tableRows = view === 'due' ? dueRows : filteredRows;

  const fmtDate = (value?: string | Date) => {
    if (!value) return '—';
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const conceptTone = (concept?: string): Tone =>
    concept === 'SOBRESALIENTE' ? 'navy' : concept === 'CONFORME' ? 'blue' : concept === 'CONDICIONAL_MEJORA' ? 'warn' : 'bad';
  const conceptLabel = (concept?: string) =>
    concept === 'SOBRESALIENTE' ? 'Sobresaliente' : concept === 'CONFORME' ? 'Conforme' : concept === 'CONDICIONAL_MEJORA' ? 'Condicional' : 'No conforme';

  const annualView = (r: (typeof supplierEvaluationRows)[number]): { text: string; tone: Tone } => {
    switch (r.annualStatus) {
      case 'VENCIDA_REQUIERE_EVAL':
        return { text: `Vencida hace ${Math.abs(r.diffDays)} d`, tone: 'bad' };
      case 'PROXIMA_VENCER':
        return { text: `Vence en ${r.diffDays} d`, tone: 'warn' };
      case 'AL_DIA':
        return { text: `Al día hasta ${fmtDate(r.annualDueDate)}`, tone: 'navy' };
      case 'NO_APLICA_INACTIVO':
        return { text: 'No aplica', tone: 'muted' };
      default:
        return { text: 'Cuando esté habilitado', tone: 'muted' };
    }
  };

  const rowTone = (r: (typeof supplierEvaluationRows)[number]): Tone =>
    r.annualStatus === 'VENCIDA_REQUIERE_EVAL' ? 'bad' : isDueRow(r) ? 'warn' : r.isSupplierActive ? 'navy' : 'muted';

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
        subtitle="Inicial al registrar · anual mientras esté habilitado"
        actions={
          <>
            <button type="button" className={heroSecondaryBtn} onClick={handleExportEvaluationsExcel}>
              <FileSpreadsheet className="w-4 h-4" /> Exportar
            </button>
            {role === 'ADMIN' && (
              <button type="button" className={heroSecondaryBtn} onClick={() => setIsConfigModalOpen(true)}>
                <Sliders className="w-4 h-4" /> Método de evaluación
              </button>
            )}
            <button type="button" className={heroPrimaryBtn} onClick={() => handleOpenEvaluationModal(null, 'INICIAL')}>
              <Plus className="w-4 h-4" /> Nueva evaluación
            </button>
          </>
        }
        tabs={
          <HeroTabs
            items={[
              { key: 'due', label: 'Por calificar', count: dueRows.length },
              { key: 'all', label: 'Todos los proveedores', count: filteredRows.length },
              { key: 'history', label: 'Historial', count: filteredEvaluations.length },
            ]}
            value={view}
            onChange={(k) => setView(k as 'due' | 'all' | 'history')}
          />
        }
      />

      <PageBody>
      <FigureBand
        items={[
          { label: 'Por calificar', value: dueTotal, note: `${metrics.initialPending} iniciales · ${metrics.annualDue + metrics.annualUpcoming} anuales`, tone: dueTotal ? 'warn' : undefined, onClick: () => setView('due'), active: view === 'due' },
          { label: 'Evaluación inicial', value: `${metrics.initialCompleted} de ${metrics.total}`, note: 'proveedores calificados' },
          { label: 'Anual al día', value: `${metrics.annualUpToDate} de ${metrics.activeSuppliers}`, note: 'proveedores habilitados' },
          {
            label: 'Promedio',
            value: metrics.avgScore === 'N/A' ? '—' : String(metrics.avgScore).replace('.', ','),
            note: `${metrics.totalEvaluationsRecorded} evaluaciones registradas`,
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
          <table className="w-full text-[13px]">
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
                tableRows.map((r) => {
                  const { dossier, initialEval, latestAnnualEval } = r;
                  const annual = annualView(r);
                  const needsInitial = !initialEval;
                  const needsAnnual = r.annualStatus === 'VENCIDA_REQUIERE_EVAL' || r.annualStatus === 'PROXIMA_VENCER';
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
                            <span className="text-sm text-[#3a5274]"> / 100 · {conceptLabel(initialEval.concept)}</span>
                            <div className="text-sm text-[#3a5274]">{fmtDate(initialEval.evaluationDate)}</div>
                          </button>
                        ) : (
                          <StatusPill tone="warn">Pendiente</StatusPill>
                        )}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <StatusPill tone={annual.tone}>{annual.text}</StatusPill>
                        {latestAnnualEval && (
                          <button type="button" onClick={() => setSelectedEvaluationForCert(latestAnnualEval)} className="block text-sm text-[#3a5274] hover:text-fs-blue mt-1 cursor-pointer">
                            Última: {latestAnnualEval.totalScore} / 100 · {fmtDate(latestAnnualEval.evaluationDate)}
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex justify-end">
                          {needsInitial || needsAnnual ? (
                            <button
                              type="button"
                              onClick={() => handleOpenEvaluationModal(dossier, needsInitial ? 'INICIAL' : 'ANUAL_1_ANO')}
                              className={rowPrimaryBtn}
                            >
                              {needsInitial ? 'Evaluar inicial' : `Evaluar año ${r.nextCycleNumber}`}
                            </button>
                          ) : r.isSupplierActive ? (
                            <button
                              type="button"
                              onClick={() => handleOpenEvaluationModal(dossier, 'ANUAL_1_ANO')}
                              className={`${secondaryBtn} h-8 px-3 whitespace-nowrap`}
                            >
                              Evaluar anual
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      ) : (
        <section className={`${cardCls} overflow-x-auto`}>
          <table className="w-full text-[13px]">
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
                    Aún no hay evaluaciones registradas{currentEvaluatorUser ? ` de ${currentEvaluatorUser.name}` : ''}.
                  </td>
                </tr>
              ) : (
                filteredEvaluations.map((ev) => (
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
                      <span className="text-sm text-[#3a5274]"> / 100</span>
                      <div className="mt-1">
                        <StatusPill tone={conceptTone(ev.concept)}>{conceptLabel(ev.concept)}</StatusPill>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap text-fs-navy dark:text-slate-300">{ev.evaluatorName}</td>
                    <td className="py-3.5 px-3 whitespace-nowrap text-fs-muted">{fmtDate(ev.evaluationDate)}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex justify-end items-center gap-4">
                        <button type="button" onClick={() => setSelectedEvaluationForCert(ev)} className={`${secondaryBtn} h-8 px-3`}>
                          <Printer className="w-4 h-4" /> Acta
                        </button>
                        {(role === 'ADMIN' || ev.evaluatorId === activeUser?.id) && (
                          <button
                            type="button"
                            title="Eliminar evaluación"
                            aria-label="Eliminar evaluación"
                            onClick={() => {
                              if (confirm(`¿Eliminar la evaluación ${ev.certificateCode}?`)) {
                                deleteSupplierEvaluation(ev.id);
                              }
                            }}
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
            onSuccess={() => {
              // Evaluacion registrada exitosamente
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
          <EvaluationCertificateModal
            evaluation={selectedEvaluationForCert}
            onClose={() => setSelectedEvaluationForCert(null)}
          />
        </EvaluationErrorBoundary>
      )}

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
