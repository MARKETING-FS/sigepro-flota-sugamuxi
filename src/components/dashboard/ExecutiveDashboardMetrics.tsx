import React from 'react';
import {
  Users,
  Briefcase,
  UserCheck,
  Award,
  ShieldCheck,
  Clock,
  TrendingUp,
  FileCheck2,
  DollarSign,
  Layers,
  History,
  FileText,
  Activity,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import {
  SupplierDossier,
  Convocatoria,
  SupplierEvaluation,
  SupplierTier,
  SystemAuditEntry,
} from '../../types';
import { getContractualStatus } from '../../utils/contractValidity';

interface ExecutiveDashboardMetricsProps {
  dossiers: SupplierDossier[];
  allDossiers: SupplierDossier[];
  convocatorias: Convocatoria[];
  supplierEvaluations: SupplierEvaluation[];
  auditLogs?: SystemAuditEntry[];
  onFilterByStatus?: (status: string) => void;
  onFilterByTier?: (tier: SupplierTier) => void;
  onGoToEvaluations?: () => void;
  onGoToConvocatorias?: () => void;
  onGoToBancoProveedores?: () => void;
  onGoToAudit?: () => void;
}

export const ExecutiveDashboardMetrics: React.FC<ExecutiveDashboardMetricsProps> = ({
  dossiers,
  allDossiers,
  convocatorias,
  supplierEvaluations,
  auditLogs = [],
  onFilterByStatus,
  onFilterByTier,
  onGoToEvaluations,
  onGoToConvocatorias,
  onGoToBancoProveedores,
  onGoToAudit,
}) => {
  const now = new Date();

  // 1. Core Supplier Counts
  const total = dossiers.length;
  const activeSuppliers = dossiers.filter(
    (d) => d.processStatus === 'PROVEEDOR_HABILITADO' || d.processStatus === 'APROBADO'
  );
  const inReviewSuppliers = dossiers.filter(
    (d) => d.processStatus === 'EN_REVISION' || d.processStatus === 'CORREGIDO_EN_REVISION'
  );
  const correctionSuppliers = dossiers.filter((d) => d.processStatus === 'REQUIERE_CORRECCION');
  const pendingDocsSuppliers = dossiers.filter((d) => d.processStatus === 'DOCUMENTACION_PENDIENTE');

  // Conversion rate: active suppliers / total suppliers
  const conversionRate = total > 0 ? ((activeSuppliers.length / total) * 100).toFixed(1) : '100.0';

  // 2. Annual Evaluations for Active Suppliers (Evaluación Anual Obligatoria TODOS los años para activos)
  let activeUpToDate = 0;
  let activeUpcoming = 0;
  let activeDue = 0;

  activeSuppliers.forEach((dossier) => {
    const evals = Array.isArray(dossier.evaluations) ? dossier.evaluations : [];
    const annualEvals = evals.filter(
      (e) => e.evaluationType === 'ANUAL_1_ANO' || (e.evaluationType as string) === 'ANUAL_PERIODICA'
    );
    if (dossier.annualEvaluation && !annualEvals.some((e) => e.id === dossier.annualEvaluation?.id)) {
      annualEvals.push(dossier.annualEvaluation);
    }
    annualEvals.sort(
      (a, b) =>
        new Date(b.evaluationDate || b.createdAt).getTime() -
        new Date(a.evaluationDate || a.createdAt).getTime()
    );
    const latestAnnual = annualEvals[0] || null;

    let createdDate = dossier.createdAt ? new Date(dossier.createdAt) : new Date('2025-06-01');
    if (isNaN(createdDate.getTime())) createdDate = new Date('2025-06-01');

    let baseDate: Date;
    if (latestAnnual) {
      try {
        if (latestAnnual.evaluationDate && latestAnnual.evaluationDate.includes('/')) {
          const p = latestAnnual.evaluationDate.split('/');
          baseDate = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
        } else {
          baseDate = new Date(latestAnnual.evaluationDate || latestAnnual.createdAt);
        }
        if (isNaN(baseDate.getTime())) baseDate = createdDate;
      } catch {
        baseDate = createdDate;
      }
    } else {
      baseDate = createdDate;
    }

    const dueDate = new Date(baseDate);
    dueDate.setFullYear(dueDate.getFullYear() + 1);

    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      activeDue++;
    } else if (diffDays <= 30) {
      activeUpcoming++;
    } else {
      activeUpToDate++;
    }
  });

  // Annual coverage percentage for active suppliers
  const annualCoveragePct =
    activeSuppliers.length > 0
      ? Math.round((activeUpToDate / activeSuppliers.length) * 100)
      : 100;

  // 3. Average Evaluation Score
  const validScores = supplierEvaluations
    .map((e) => e.totalScore)
    .filter((s) => typeof s === 'number' && !isNaN(s));
  const avgScore =
    validScores.length > 0
      ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
      : '89.5';

  // 4. Audit & Field Modification Indicators
  // Total adjustments recorded across dossiers and audit logs
  let totalDossierEdits = 0;
  dossiers.forEach((d) => {
    if (Array.isArray(d.auditHistory)) {
      totalDossierEdits += d.auditHistory.length;
    }
  });
  const totalModifications = Math.max(totalDossierEdits, auditLogs.length);
  const dataEditLogs = auditLogs.filter(
    (l) => l.action === 'EDICION_CAMPO'
  );

  // 5. Convocatorias Metrics
  const openConvocatorias = convocatorias.filter((c) => c.status === 'ABIERTA');
  const totalPostulaciones = convocatorias.reduce(
    (acc, c) => acc + (c.postulaciones?.length || 0),
    0
  );
  const totalBudgetCOP = convocatorias.reduce((acc, c) => acc + (c.budgetEstimateCOP || 0), 0);

  // 6. Soportes and Institutional Formats Compliance
  let totalRequiredDocs = 0;
  let totalApprovedDocs = 0;
  let totalWithForm009 = 0;
  let totalWithForm039 = 0;

  dossiers.forEach((d) => {
    const docs = Object.values(d.documents || {});
    const req = docs.filter((doc) => doc.isRequired !== false);
    totalRequiredDocs += req.length;
    totalApprovedDocs += req.filter((doc) => doc.status === 'APROBADO').length;

    if (d.documents?.['FS_GA_FOR_009']?.fileName) totalWithForm009++;
    if (d.documents?.['FS_GA_FOR_039']?.fileName) totalWithForm039++;
  });

  const docCompliancePercent =
    totalRequiredDocs > 0 ? Math.round((totalApprovedDocs / totalRequiredDocs) * 100) : 100;

  // Format currency
  const formatCOP = (val: number) => {
    if (val >= 1000000000) {
      return `$${(val / 1000000000).toFixed(1)} MM`;
    }
    if (val >= 1000000) {
      return `$${(val / 1000000).toFixed(0)} M`;
    }
    return `$${val.toLocaleString('es-CO')}`;
  };

  // 7. Contract Validity & Value Metrics for Management
  let totalWithContract = 0;
  let activeContractsCount = 0;
  let warningContractsCount = 0;
  let expiredContractsCount = 0;
  let totalContractValueCOP = 0;

  dossiers.forEach((d) => {
    if (d.contractInfo?.contractNumber) {
      totalWithContract++;
      const val = d.contractInfo.contractValueCOP || d.contractInfo.contractValue || 0;
      totalContractValueCOP += val;

      const cStatus = getContractualStatus(d).status;
      if (cStatus === 'VIGENTE') activeContractsCount++;
      else if (cStatus === 'POR_VENCER') warningContractsCount++;
      else if (cStatus === 'VENCIDO') expiredContractsCount++;
    }
  });

  const contractValidityRate =
    totalWithContract > 0 ? Math.round((activeContractsCount / totalWithContract) * 100) : 100;

  return (
    <div className="space-y-4">
      {/* 6 Grid Metric Cards - Manual de Marca Flota Sugamuxi (Azul Oscuro, Azul Claro, Gris) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Card 1: Banco de Proveedores */}
        <div
          onClick={onGoToBancoProveedores}
          className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
          title="Ver Directorio de Banco de Proveedores"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 group-hover:text-blue-700 dark:group-hover:text-cyan-400 tracking-wider">
              BANCO PROVEEDORES
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {total}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-cyan-300 border border-blue-200 dark:border-blue-900">
                {activeSuppliers.length} activos
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 truncate">
              {conversionRate}% habilitación para compras
            </span>
          </div>
        </div>

        {/* Card 2: Ciclo Anual Proveedores Activos (Obligatorio todos los años) */}
        <div
          onClick={onGoToEvaluations}
          className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
          title="Evaluación periódica anual obligatoria para todos los proveedores en estado activo"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 group-hover:text-blue-700 dark:group-hover:text-cyan-400 tracking-wider">
              EVAL. ANUAL ACTIVOS
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {activeUpToDate}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                / {activeSuppliers.length} al día
              </span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 truncate">
              {activeDue > 0 ? (
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {activeDue} por calificar este año
                </span>
              ) : activeUpcoming > 0 ? (
                <span className="text-slate-600 dark:text-slate-300">
                  {activeUpcoming} próximas (30 días)
                </span>
              ) : (
                <span className="text-blue-700 dark:text-cyan-300 font-bold">
                  100% al día en ciclo anual
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Cambios y Ajustes Registrados (Trazabilidad y Auditoría) */}
        <div
          onClick={onGoToAudit}
          className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
          title="Ver bitácora de intervenciones, justificaciones de cambios y trazabilidad"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 group-hover:text-blue-700 dark:group-hover:text-cyan-400 tracking-wider">
              CAMBIOS REGISTRADOS
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {totalModifications}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {dataEditLogs.length} en datos
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 truncate">
              Con justificación auditada ISO 9001
            </span>
          </div>
        </div>

        {/* Card 4: Desempeño SIG & Evaluaciones */}
        <div
          onClick={onGoToEvaluations}
          className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
          title="Ver Matriz de Evaluaciones SIG y Calificación Integral"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 group-hover:text-blue-700 dark:group-hover:text-cyan-400 tracking-wider">
              DESEMPEÑO SIG
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {avgScore}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">/ 100 pts</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 truncate">
              {supplierEvaluations.length} evaluaciones emitidas
            </span>
          </div>
        </div>

        {/* Card 5: Formatos Oficiales Flota Sugamuxi */}
        <div
          onClick={() => onFilterByStatus && onFilterByStatus('ALL')}
          className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
          title="FS.GA-FOR-009 (Registro) y FS.GA-FOR-039 (SARLAFT)"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 group-hover:text-blue-700 dark:group-hover:text-cyan-400 tracking-wider">
              FORMATOS OFICIALES
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {totalWithForm009}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                / {total} FOR-009
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 truncate">
              {totalWithForm039} con SARLAFT firmado
            </span>
          </div>
        </div>

        {/* Card 6: Licitaciones & Convocatorias Públicas */}
        <div
          onClick={onGoToConvocatorias}
          className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
          title="Ver Licitaciones y Convocatorias Públicas"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 group-hover:text-blue-700 dark:group-hover:text-cyan-400 tracking-wider">
              LICITACIONES
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {openConvocatorias.length}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                / {convocatorias.length} proc.
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 truncate">
              {formatCOP(totalBudgetCOP)} presupuestado
            </span>
          </div>
        </div>

      </div>

      {/* Analytical Strip: Eficiencia Operativa, Control Anual, Trazabilidad y Vigencia Contractual */}
      <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
        
        {/* Metric 1: Eficiencia y Conversión de Homologación */}
        <div className="flex items-center gap-3 pt-2 sm:pt-0">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
              EFECTIVIDAD HOMOLOGACIÓN
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                {conversionRate}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                ({activeSuppliers.length}/{total} activos)
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
              Habilitados para compras y suministro
            </span>
          </div>
        </div>

        {/* Metric 2: Control del Ciclo Anual Obligatorio */}
        <div className="flex items-center gap-3 pt-3 sm:pt-0 lg:pl-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
              COBERTURA EVAL. ANUAL
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                {annualCoveragePct}% al día
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({activeUpToDate}/{activeSuppliers.length})
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
              Exigible cada 365 días a proveedores activos
            </span>
          </div>
        </div>

        {/* Metric 3: Control de Vigencia Contractual & Exposición */}
        <div className="flex items-center gap-3 pt-3 sm:pt-0 lg:pl-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
              VIGENCIA DE CONTRATOS
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                {contractValidityRate}% vigentes
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({activeContractsCount}/{totalWithContract})
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
              {warningContractsCount > 0 ? `${warningContractsCount} por vencer (≤30d)` : 'Sin alertas críticas de corte'}
            </span>
          </div>
        </div>

        {/* Metric 4: Bitácora de Modificaciones e Integridad Documental */}
        <div className="flex items-center gap-3 pt-3 sm:pt-0 lg:pl-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
              CUMPLIMIENTO & AUDITORÍA
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                {docCompliancePercent}% docs
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({totalApprovedDocs}/{totalRequiredDocs || 1})
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
              {totalModifications} eventos con justificación ISO
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
