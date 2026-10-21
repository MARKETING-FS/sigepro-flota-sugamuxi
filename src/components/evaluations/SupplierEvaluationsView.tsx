import React, { useState, useMemo } from 'react';
import {
  Award,
  Search,
  Filter,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Plus,
  Sliders,
  Printer,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  History,
  FileSpreadsheet,
  AlertCircle,
  TrendingUp,
  Eye,
  Trash2,
  RefreshCw,
  ShieldAlert,
  Lock,
  Download,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  SupplierDossier,
  SupplierEvaluation,
  SupplierEvaluationType,
} from '../../types';
import { exportEvaluationsReport } from '../../utils/excelExport';
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
    role === 'REVISOR' ? (activeUserId || 'revisor-1') : (activeUserId || 'ALL')
  );

  // Sync if activeUserId changes externally (e.g. from Sidebar or Header)
  React.useEffect(() => {
    if (activeUserId && activeUserId !== selectedEvaluatorId) {
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

    return relevantDossiers.map((dossier) => {
      // 1. Initial Evaluation check
      const evals = Array.isArray(dossier.evaluations) ? dossier.evaluations : [];
      const initialEval =
        evals.find((e) => e.evaluationType === 'INICIAL') ||
        dossier.initialEvaluation ||
        null;

      // 2. All Annual Evaluations history (evaluación recurrente todos los años)
      const annualEvals = evals.filter(
        (e) =>
          e.evaluationType === 'ANUAL_1_ANO' ||
          (e.evaluationType as string) === 'ANUAL_PERIODICA'
      );
      if (
        dossier.annualEvaluation &&
        !annualEvals.some((e) => e.id === dossier.annualEvaluation?.id)
      ) {
        annualEvals.push(dossier.annualEvaluation);
      }

      // Sort newest evaluation first
      annualEvals.sort((a, b) => {
        const timeA = new Date(a.evaluationDate || a.createdAt).getTime();
        const timeB = new Date(b.evaluationDate || b.createdAt).getTime();
        return timeB - timeA;
      });

      const latestAnnualEval = annualEvals[0] || null;
      const completedAnnualCycles = annualEvals.length;
      const nextCycleNumber = completedAnnualCycles + 1;

      // 3. Active Status check:
      // "Ten en cuenta que la evaluación anual en caso de que el proveedor este en estado activo se debera realizar todos los años."
      const isSupplierActive =
        dossier.processStatus === 'PROVEEDOR_HABILITADO' ||
        dossier.processStatus === 'APROBADO';
      const isRejected = dossier.processStatus === 'RECHAZADO';

      // 4. Creation date and Base date for annual calculation
      let createdDate: Date;
      try {
        createdDate = dossier.createdAt ? new Date(dossier.createdAt) : new Date('2025-06-01');
      } catch {
        createdDate = new Date('2025-06-01');
      }

      // 5. Calculate next annual due date:
      // If the active supplier has a previous annual evaluation, next evaluation is due 1 year after the last evaluation.
      // If no annual evaluation has been done yet, it is due 1 year after creation date.
      let annualDueDate: Date;
      if (latestAnnualEval) {
        let baseDate: Date;
        try {
          if (latestAnnualEval.evaluationDate && latestAnnualEval.evaluationDate.includes('/')) {
            const parts = latestAnnualEval.evaluationDate.split('/');
            baseDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          } else {
            baseDate = new Date(latestAnnualEval.evaluationDate || latestAnnualEval.createdAt);
          }
          if (isNaN(baseDate.getTime())) baseDate = new Date(latestAnnualEval.createdAt || createdDate);
        } catch {
          baseDate = createdDate;
        }
        annualDueDate = new Date(baseDate);
        annualDueDate.setFullYear(annualDueDate.getFullYear() + 1);
      } else {
        annualDueDate = new Date(createdDate);
        annualDueDate.setFullYear(annualDueDate.getFullYear() + 1);
      }

      const diffTime = annualDueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Status classification
      let annualStatus:
        | 'AL_DIA'
        | 'PROXIMA_VENCER'
        | 'VENCIDA_REQUIERE_EVAL'
        | 'NO_APLICA_INACTIVO'
        | 'PENDIENTE_HABILITACION';

      if (!isSupplierActive) {
        if (isRejected) {
          annualStatus = 'NO_APLICA_INACTIVO';
        } else {
          annualStatus = 'PENDIENTE_HABILITACION';
        }
      } else {
        // Active supplier: annual evaluation required every year!
        if (diffDays < 0) {
          annualStatus = 'VENCIDA_REQUIERE_EVAL';
        } else if (diffDays <= 30) {
          annualStatus = 'PROXIMA_VENCER';
        } else {
          annualStatus = 'AL_DIA';
        }
      }

      return {
        dossier,
        isSupplierActive,
        initialEval,
        annualEvals,
        latestAnnualEval,
        completedAnnualCycles,
        nextCycleNumber,
        createdDate,
        annualDueDate,
        diffDays,
        annualStatus,
        isAssignedToMe: activeUser?.id ? dossier.assignedReviewerId === activeUser.id : false,
      };
    });
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

  const getConceptColor = (concept: string) => {
    switch (concept) {
      case 'SOBRESALIENTE':
        return 'text-blue-950 dark:text-cyan-200 bg-blue-100 dark:bg-blue-950/70 border-blue-300 dark:border-blue-700';
      case 'CONFORME':
        return 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800';
      case 'CONDICIONAL_MEJORA':
        return 'text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
      default:
        return 'text-white bg-slate-900 dark:bg-slate-950 border-slate-700';
    }
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs relative flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 dark:bg-[#0b1329] dark:border-slate-800">
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1 w-full">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 dark:bg-blue-950/60 dark:border-blue-800 dark:text-cyan-400 shadow-2xs">
            <Award className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-slate-900 dark:text-white leading-snug">
                Módulo de Evaluaciones de Proveedores
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 dark:bg-blue-950/80 dark:text-cyan-300 text-[10px] font-bold border border-blue-200 dark:border-blue-700">
                Rol: {role === 'ADMIN' ? 'Administrador General' : 'Revisor Técnico SIG'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              Gestione las dos evaluaciones oficiales del Sistema Integrado de Gestión: <strong className="text-slate-800 dark:text-white font-semibold">Evaluación Inicial (al crearlo)</strong> y la <strong className="text-slate-800 dark:text-white font-semibold">Evaluación de Desempeño Anual</strong> (obligatoria para proveedores activos).
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full xl:w-auto shrink-0 pt-2.5 xl:pt-0 border-t xl:border-t-0 border-slate-100 dark:border-slate-800/80">
          {role === 'ADMIN' ? (
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              title="Parametrizar Criterios, Pesos y Umbrales de Calificación (Solo Administrador General)"
            >
              <Sliders className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>Parametrizar Método</span>
            </button>
          ) : (
            <div
              className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-100/70 border border-slate-200 text-slate-400 dark:bg-slate-800/50 dark:border-slate-700/60 dark:text-slate-400 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-not-allowed"
              title="El proceso de parametrización del método solo puede ser realizado por el Administrador General."
            >
              <Lock className="w-4 h-4 text-slate-400" />
              <span>Parametrizar Método (Solo Admin)</span>
            </div>
          )}

          <button
            onClick={() => {
              setEvalModalSupplier(relevantDossiers.length > 0 ? relevantDossiers[0] : null);
              setEvalModalType('INICIAL');
              setIsEvaluationFormOpen(true);
            }}
            className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Evaluación</span>
          </button>
        </div>
      </div>

      {/* 1.1 Selector y Estado del Evaluador Activo */}
      <div className="bg-white dark:bg-[#0f172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-900/10 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-700 dark:text-cyan-300 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Evaluador Activo Seleccionado
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-cyan-300 border border-blue-300 dark:border-blue-800">
                {selectedEvaluatorId === 'ALL'
                  ? 'Todos los Evaluadores'
                  : currentEvaluatorUser?.shortName || currentEvaluatorUser?.name || 'Evaluador'}
              </span>
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
              {selectedEvaluatorId === 'ALL'
                ? `Consolidado General Institucional (${relevantDossiers.length} Proveedores Registrados)`
                : `${currentEvaluatorUser?.name} — ${currentEvaluatorUser?.department || 'Evaluación Técnica SIG'}`}
            </p>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
              <span>
                Cartera asignada:{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-mono">
                  {relevantDossiers.length} proveedores
                </strong>
              </span>
              <span>•</span>
              <span>
                Evaluaciones realizadas:{' '}
                <strong className="text-blue-700 dark:text-cyan-300 font-mono">
                  {relevantEvaluations.length} registradas
                </strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
          <label
            htmlFor="topEvaluatorSelect"
            className="text-xs font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap pl-1 flex items-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Modificar Evaluador:</span>
          </label>
          <select
            id="topEvaluatorSelect"
            value={selectedEvaluatorId}
            onChange={(e) => handleEvaluatorChange(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-[#121c38] border border-blue-300 dark:border-blue-900/80 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
          >
            <option value="ALL">
              🌐 Todos los Evaluadores (Consolidado - {allDossiers.length} prov.)
            </option>
            {systemUsers
              .filter((u) => u.role === 'REVISOR' || u.role === 'ADMIN')
              .map((u) => {
                const count = allDossiers.filter(
                  (d) =>
                    d.assignedReviewerId === u.id ||
                    (Array.isArray(d.evaluations) && d.evaluations.some((e) => e.evaluatorId === u.id))
                ).length;
                const evCount = supplierEvaluations.filter((e) => e.evaluatorId === u.id).length;
                return (
                  <option key={u.id} value={u.id}>
                    👤 {u.name} ({u.shortName}) — {count} prov. / {evCount} evals
                  </option>
                );
              })}
          </select>
        </div>
      </div>

      {/* 2. Executive KPIs & Status Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Proveedores */}
        <div className="bg-white dark:bg-[#0f172a] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Proveedores en Cartera</span>
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {metrics.total}
            </span>
            <span className="text-xs text-slate-400">({metrics.activeSuppliers} activos)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Evaluados bajo Sistema Integrado de Gestión</span>
          </div>
        </div>

        {/* Evaluaciones Iniciales (Al Crearlo) */}
        <div className="bg-white dark:bg-[#0f172a] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Evaluación Inicial (Al Crear)</span>
            <FileCheck className="w-4 h-4 text-blue-700 dark:text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {metrics.initialCompleted}
            </span>
            <span className="text-xs text-slate-400">/ {metrics.total} realizados</span>
          </div>
          <div className="text-[11px] mt-1 font-medium">
            {metrics.initialPending > 0 ? (
              <span className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {metrics.initialPending} pendientes de calificar al ingreso
              </span>
            ) : (
              <span className="text-blue-900 dark:text-cyan-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
                100% de proveedores con calificación inicial
              </span>
            )}
          </div>
        </div>

        {/* Evaluaciones Anuales Recurrentes (Proveedores Activos) */}
        <div className="bg-white dark:bg-[#0f172a] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Desempeño Anual (Activos)</span>
            <RefreshCw className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {metrics.annualUpToDate}
            </span>
            <span className="text-xs text-slate-400">/ {metrics.activeSuppliers} activos al día</span>
          </div>
          <div className="text-[11px] mt-1 font-medium">
            {metrics.annualDue > 0 ? (
              <span className="text-slate-900 dark:text-slate-100 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                {metrics.annualDue} activos con evaluación anual vencida
              </span>
            ) : metrics.annualUpcoming > 0 ? (
              <span className="text-blue-900 dark:text-cyan-300 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                {metrics.annualUpcoming} próximos a vencer ciclo anual (30 días)
              </span>
            ) : (
              <span className="text-blue-900 dark:text-cyan-300 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
                100% de activos al día en su ciclo anual
              </span>
            )}
          </div>
        </div>

        {/* Promedio Calificación SIG */}
        <div className="bg-white dark:bg-[#0f172a] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Promedio Global SIG</span>
            <TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-blue-900 dark:text-cyan-300 font-mono">
            {metrics.avgScore}
            <span className="text-sm font-semibold text-slate-400">/100</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {metrics.totalEvaluationsRecorded} calificaciones oficiales registradas
          </div>
        </div>
      </div>

      {/* 3. Main Tabs & Filters Bar */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'matrix'
                  ? 'bg-[#0b1329] dark:bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Matriz de Seguimiento ({filteredRows.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-[#0b1329] dark:bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Historial de Evaluaciones ({filteredEvaluations.length})</span>
            </button>
          </div>

          {/* Evaluator Context Indicator & Export Button */}
          <div className="flex items-center gap-3 self-end md:self-auto text-xs flex-wrap justify-end">
            <button
              onClick={handleExportEvaluationsExcel}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Exportar listado de evaluaciones filtradas en archivo Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Excel ({filteredEvaluations.length})</span>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Evaluador Activo:</span>
              <span className="px-2.5 py-1 rounded-lg font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-cyan-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                <span>
                  {selectedEvaluatorId === 'ALL'
                    ? 'Todos los Evaluadores'
                    : currentEvaluatorUser?.shortName || currentEvaluatorUser?.name || 'Evaluador'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por NIT, Razón Social, Expediente o Categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-[#121c38] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Evaluator Selector in Toolbar */}
          <div>
            <select
              value={selectedEvaluatorId}
              onChange={(e) => handleEvaluatorChange(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-white dark:bg-[#121c38] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">🌐 Todos los Evaluadores</option>
              {systemUsers
                .filter((u) => u.role === 'REVISOR' || u.role === 'ADMIN')
                .map((u) => {
                  const count = allDossiers.filter((d) => d.assignedReviewerId === u.id).length;
                  return (
                    <option key={u.id} value={u.id}>
                      👤 {u.shortName} ({count} prov.)
                    </option>
                  );
                })}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#121c38] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="DUE_ANNUAL">Activos: Evaluación Anual Vencida</option>
              <option value="PENDING_INITIAL">Pendiente Evaluación Inicial</option>
              <option value="UP_TO_DATE">Al Día en Evaluaciones</option>
              <option value="ACTIVE_ONLY">Solo Proveedores en Estado Activo</option>
            </select>
          </div>

          {/* Filter Tier */}
          <div>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#121c38] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todos los Tiers (A, B, C)</option>
              <option value="A">Tier A (Estratégico / Alto)</option>
              <option value="B">Tier B (Operativo / Medio)</option>
              <option value="C">Tier C (Ocasional / Menor)</option>
            </select>
          </div>
        </div>

        {/* 4. Tab Content: Matrix of Suppliers vs History */}
        {activeTab === 'matrix' ? (
          <div>
            <div className="sm:hidden px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] text-blue-900 dark:text-cyan-300 flex items-center justify-between font-medium">
              <span>Desliza horizontalmente para ver todas las columnas</span>
              <span className="font-bold">↔</span>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300 divide-y divide-slate-200 dark:divide-slate-800 min-w-[820px] lg:min-w-full">
              <thead className="bg-slate-100 dark:bg-[#121c38] text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-3 py-3 w-[22%]">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
                      <span>Proveedor / Razón Social</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 w-[15%]">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
                      <span>Evaluador Asignado</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 w-[11%]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
                      <span>Fecha Ingreso</span>
                    </div>
                  </th>
                  <th className="px-3 py-3 w-[18%]">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
                      <div>
                        <span>Evaluación Inicial</span>
                        <span className="text-[10px] font-normal lowercase text-slate-400 block sm:inline sm:ml-1">(al crearlo)</span>
                      </div>
                    </div>
                  </th>
                  <th className="px-3 py-3 w-[22%]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
                      <div>
                        <span>Evaluación Anual</span>
                        <span className="text-[10px] font-normal lowercase text-slate-400 block sm:inline sm:ml-1">(activos)</span>
                      </div>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-right w-[12%]">
                    <div className="flex items-center justify-end gap-1.5">
                      <Award className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
                      <span>Acciones</span>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      <UserCheck className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        No se encontraron proveedores asignados al evaluador
                        {currentEvaluatorUser ? ` ${currentEvaluatorUser.name}` : ''} con los filtros seleccionados.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Pruebe seleccionando "Todos los Evaluadores" o ajuste los términos de búsqueda.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const {
                      dossier,
                      initialEval,
                      annualEvals,
                      latestAnnualEval,
                      completedAnnualCycles,
                      nextCycleNumber,
                      createdDate,
                      annualDueDate,
                      diffDays,
                      annualStatus,
                      isSupplierActive,
                    } = row;
                    const formattedCreated = createdDate.toLocaleDateString('es-CO');
                    const formattedAnniversary = annualDueDate.toLocaleDateString('es-CO');

                    return (
                      <tr
                        key={dossier.id}
                        className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* Supplier Info */}
                        <td className="px-3 py-3 align-top">
                          <div className="font-bold text-slate-900 dark:text-white text-xs leading-snug break-words">
                            {dossier.basicInfo?.companyName || 'Proveedor'}
                          </div>
                          <div className="text-[10.5px] text-slate-500 dark:text-slate-400 font-mono mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              NIT: {dossier.basicInfo?.nit || (dossier.basicInfo as any)?.documentNumber || (dossier.basicInfo as any)?.identificationNumber || 'S/N'}
                            </span>
                            <span>•</span>
                            <span className="text-slate-600 dark:text-slate-300 font-medium">
                              {dossier.fileNumber || 'Sin Radicado'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            <span className="text-[9.5px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                              {dossier.selectedCategory}
                            </span>
                            {dossier.supplierTier && (
                              <span className="text-[9.5px] px-1.5 py-0.5 rounded-md font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
                                Tier {dossier.supplierTier}
                              </span>
                            )}
                            <span
                              className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-bold border flex items-center gap-1 ${
                                isSupplierActive
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {isSupplierActive ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>Activo</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>En Trámite</span>
                                </>
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Assigned Evaluator */}
                        <td className="px-3 py-3 align-top">
                          <div className="flex items-start gap-1.5">
                            <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200 dark:border-blue-800 mt-0.5">
                              <UserCheck className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-slate-900 dark:text-slate-100 break-words">
                                {dossier.assignedReviewerName || 'Sin asignar'}
                              </div>
                              <div className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {dossier.assignedReviewerId === activeUserId ? (
                                  <span className="text-blue-700 dark:text-cyan-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-1 py-0.2 rounded border border-blue-200 dark:border-blue-800 inline-block">
                                    Evaluador Actual
                                  </span>
                                ) : (
                                  <span>Cartera SIG</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Creation Date */}
                        <td className="px-3 py-3 align-top">
                          <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-blue-600 dark:text-cyan-400 shrink-0" />
                            <span>{formattedCreated}</span>
                          </div>
                          <div className="text-[9.5px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Radicación SIG
                          </div>
                        </td>

                        {/* Initial Evaluation (Al Crearlo) */}
                        <td className="px-3 py-3 align-top">
                          {initialEval ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-black text-sm text-blue-900 dark:text-cyan-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                  {initialEval.totalScore}/100
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${getConceptColor(initialEval.concept)}`}>
                                  {initialEval.concept}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>Calificado el {initialEval.evaluationDate}</span>
                              </div>
                              <div>
                                <button
                                  onClick={() => setSelectedEvaluationForCert(initialEval)}
                                  className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-800 dark:text-cyan-300 rounded border border-slate-200 dark:border-slate-700 font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Ver Acta Oficial de Evaluación Inicial"
                                >
                                  <Eye className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
                                  <span>Ver Acta Inicial</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                <AlertCircle className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
                                <span>Pendiente al ingreso</span>
                              </span>
                              <div>
                                <button
                                  onClick={() => handleOpenEvaluationModal(dossier, 'INICIAL')}
                                  className="text-[11px] px-3 py-1.5 bg-blue-900 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-white font-bold rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Calificar Inicial</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Annual Evaluation (Recurrente Todos los Años para Proveedores Activos) */}
                        <td className="px-3 py-3 align-top">
                          {!isSupplierActive ? (
                            <div className="space-y-1 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                              {annualStatus === 'NO_APLICA_INACTIVO' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                  <ShieldAlert className="w-3 h-3 text-slate-400" />
                                  No Aplica (Inactivo / Rechazado)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  Pendiente Habilitación Activa
                                </span>
                              )}
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                                La evaluación periódica aplica cada 12 meses una vez el proveedor está activo en el banco.
                              </div>
                            </div>
                          ) : latestAnnualEval ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-black text-sm text-blue-900 dark:text-cyan-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                  {latestAnnualEval.totalScore}/100
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${getConceptColor(latestAnnualEval.concept)}`}>
                                  {latestAnnualEval.concept}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
                                  Año {latestAnnualEval.annualCycleNumber || completedAnnualCycles}
                                </span>
                              </div>

                              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-1">
                                <span>Última: {latestAnnualEval.evaluationDate}</span>
                                <button
                                  onClick={() => setSelectedEvaluationForCert(latestAnnualEval)}
                                  className="text-[10px] text-blue-600 dark:text-cyan-400 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Acta Año {latestAnnualEval.annualCycleNumber || completedAnnualCycles}</span>
                                </button>
                              </div>

                              {/* Next annual cycle alert or up-to-date indicator */}
                              {annualStatus === 'VENCIDA_REQUIERE_EVAL' ? (
                                <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800 text-[10px] space-y-1.5">
                                  <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                    Vencida Año {nextCycleNumber} (Debía realizarse el {formattedAnniversary})
                                  </span>
                                  <button
                                    onClick={() => handleOpenEvaluationModal(dossier, 'ANUAL_1_ANO')}
                                    className="w-full text-center py-1.5 px-2.5 bg-blue-900 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold rounded-md shadow-xs cursor-pointer transition-colors"
                                  >
                                    Calificar Año {nextCycleNumber} (Vencida)
                                  </button>
                                </div>
                              ) : annualStatus === 'PROXIMA_VENCER' ? (
                                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800 text-[10px] space-y-1.5">
                                  <span className="font-bold text-blue-900 dark:text-cyan-300 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
                                    Próxima a vencer Año {nextCycleNumber} ({diffDays} días restantes)
                                  </span>
                                  <button
                                    onClick={() => handleOpenEvaluationModal(dossier, 'ANUAL_1_ANO')}
                                    className="w-full text-center py-1.5 px-2.5 bg-blue-900 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold rounded-md shadow-xs cursor-pointer transition-colors"
                                  >
                                    Calificar Año {nextCycleNumber}
                                  </button>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                                  <span className="text-blue-900 dark:text-cyan-300 font-semibold block">
                                    ✓ Al día en ciclo anual (Año {completedAnnualCycles})
                                  </span>
                                  <div className="flex items-center justify-between mt-1">
                                    <span>Próxima: Año {nextCycleNumber} ({formattedAnniversary})</span>
                                    <button
                                      onClick={() => handleOpenEvaluationModal(dossier, 'ANUAL_1_ANO')}
                                      className="text-blue-600 dark:text-cyan-400 hover:underline font-bold cursor-pointer"
                                    >
                                      Nueva Anual
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {annualStatus === 'VENCIDA_REQUIERE_EVAL' ? (
                                <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800 text-[10px] space-y-1.5">
                                  <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                    <span>Vencida Año 1 (Cumplió 1 año el {formattedAnniversary})</span>
                                  </span>
                                  <div>
                                    <button
                                      onClick={() => handleOpenEvaluationModal(dossier, 'ANUAL_1_ANO')}
                                      className="w-full text-center py-1.5 px-2.5 bg-blue-900 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold rounded-md shadow-xs transition-colors cursor-pointer"
                                    >
                                      Calificar Año 1 (Obligatoria)
                                    </button>
                                  </div>
                                </div>
                              ) : annualStatus === 'PROXIMA_VENCER' ? (
                                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800 text-[10px] space-y-1.5">
                                  <span className="font-bold text-blue-900 dark:text-cyan-300 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
                                    <span>Próxima a Año 1 ({diffDays} días restantes)</span>
                                  </span>
                                  <div>
                                    <button
                                      onClick={() => handleOpenEvaluationModal(dossier, 'ANUAL_1_ANO')}
                                      className="text-xs text-blue-600 dark:text-cyan-400 hover:underline font-bold cursor-pointer inline-flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Anticipar Calificación Anual</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                                  <span className="block text-slate-800 dark:text-slate-200 font-semibold">
                                    Programada Año 1: {formattedAnniversary}
                                  </span>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                                    (Faltan {diffDays} días para cumplir el 1er año)
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Actions Revisor */}
                        <td className="px-3 py-3 align-top text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Primary Action Button */}
                            <button
                              onClick={() => {
                                const defaultType = initialEval ? 'ANUAL_1_ANO' : 'INICIAL';
                                handleOpenEvaluationModal(dossier, defaultType);
                              }}
                              className="px-2 py-1.5 bg-blue-900 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                              title={initialEval ? 'Registrar Evaluación Anual' : 'Registrar Evaluación Inicial'}
                            >
                              <Award className="w-3.5 h-3.5 text-cyan-300 dark:text-cyan-200" />
                              <span>{initialEval ? 'Anual' : 'Calificar'}</span>
                            </button>

                            {/* View Certificate if any evaluation exists */}
                            {(initialEval || latestAnnualEval) && (
                              <button
                                onClick={() => setSelectedEvaluationForCert(latestAnnualEval || initialEval)}
                                className="p-1.5 text-slate-700 dark:text-slate-300 hover:text-blue-900 dark:hover:text-cyan-300 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                                title="Ver Acta / Certificado Oficial de Calificación"
                              >
                                <FileCheck className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
                              </button>
                            )}

                            {/* History shortcut for this supplier */}
                            <button
                              onClick={() => {
                                setActiveTab('history');
                                setSearchTerm(dossier.basicInfo?.companyName || dossier.basicInfo?.nit || '');
                              }}
                              className="p-1.5 text-slate-700 dark:text-slate-300 hover:text-blue-900 dark:hover:text-cyan-300 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                              title="Consultar Historial de Evaluaciones de este proveedor"
                            >
                              <History className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
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
          /* TAB 2: HISTORY OF RECORDED EVALUATIONS */
          <div>
            <div className="sm:hidden px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] text-blue-900 dark:text-cyan-300 flex items-center justify-between font-medium">
              <span>Desliza horizontalmente para ver todas las columnas</span>
              <span className="font-bold">↔</span>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300 divide-y divide-slate-200 dark:divide-slate-800 min-w-[780px] lg:min-w-full">
              <thead className="bg-slate-100 dark:bg-[#121c38] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-3 py-3 w-[15%]">Certificado</th>
                  <th className="px-3 py-3 w-[22%]">Proveedor / NIT</th>
                  <th className="px-3 py-3 w-[18%]">Tipo de Evaluación</th>
                  <th className="px-3 py-3 w-[13%]">Puntuación SIG</th>
                  <th className="px-3 py-3 w-[14%]">Evaluador</th>
                  <th className="px-3 py-3 w-[10%]">Fecha</th>
                  <th className="px-3 py-3 text-right w-[8%]">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredEvaluations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      <UserCheck className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        No hay evaluaciones registradas para el evaluador
                        {currentEvaluatorUser ? ` ${currentEvaluatorUser.name}` : ' seleccionado'}.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Utilice el botón "Nueva Evaluación" para registrar una calificación o seleccione "Todos los Evaluadores".
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredEvaluations.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-3 py-2.5 font-mono font-bold text-blue-900 dark:text-cyan-300 align-top">
                        {ev.certificateCode || 'CALIF-SIG-2026'}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <div className="font-bold text-slate-900 dark:text-slate-100 leading-snug break-words">{ev.supplierName}</div>
                        <div className="text-[10.5px] text-slate-500 font-mono mt-0.5">NIT: {ev.supplierDoc}</div>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block leading-snug ${
                            ev.evaluationType === 'INICIAL'
                              ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-300'
                          }`}
                        >
                          {ev.evaluationType === 'INICIAL'
                            ? 'Inicial (Admisión)'
                            : `Anual - Año ${ev.annualCycleNumber || 1}`}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                            {ev.totalScore}/100
                          </span>
                          <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold border ${getConceptColor(ev.concept)}`}>
                            {ev.concept}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <div className="font-medium text-slate-800 dark:text-slate-200 leading-snug break-words text-[11px]">{ev.evaluatorName}</div>
                        <div className="text-[9.5px] text-slate-400 mt-0.5">{ev.evaluatorRole}</div>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200 align-top text-[11px]">
                        {ev.evaluationDate}
                      </td>
                      <td className="px-3 py-2.5 text-right align-top">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedEvaluationForCert(ev)}
                            className="p-1.5 text-blue-700 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
                            title="Ver e Imprimir Acta Oficial"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {(role === 'ADMIN' || ev.evaluatorId === activeUser?.id) && (
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar la evaluación ${ev.certificateCode}?`)) {
                                  deleteSupplierEvaluation(ev.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
                              title="Eliminar Registro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </div>

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
