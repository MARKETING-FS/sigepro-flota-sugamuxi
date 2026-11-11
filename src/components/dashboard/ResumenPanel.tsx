import React, { useMemo } from 'react';
import { AlertTriangle, ArrowRight, Building2, BadgeCheck, Hourglass, FileClock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupplierDossier } from '../../types';
import { getCreationStatus, getContractualStatus, getDossierDocumentExpirationSummary } from '../../utils/contractValidity';
import { buildEvaluationRow } from '../../utils/evaluationRows';
import { DashboardHero, Kpi, Podium, StageDonut } from './DashboardParts';
import { ActivityTimeline, BarList, GradeBars, PriorityAlerts, TrendChart } from './DashboardCharts';
import { computePushAlerts } from '../../utils/pushAlertsService';
import {
  ArchiveTab,
  TONE_COLOR,
  Meter,
  Panel,
  Radicado,
  STAGES,
  StatusPill,
  stageOf,
  supplierName,
} from '../ui/archive';

interface Props {
  dossiers: SupplierDossier[];
  onFilterStage: (stageKey: string) => void;
  onRegister: () => void;
  tabs?: React.ReactNode;
  scopeLabel: string;
  dateLabel: string;
}

interface DueItem {
  dossier: SupplierDossier;
  what: string;
  kind: 'Documento' | 'Contrato';
  days: number; // negativo = vencido
}

const HORIZON_DAYS = 30;

const ACTION_LABEL: Record<string, string> = {
  EDICION_CAMPO: 'Edición de campo',
  CAMBIO_ESTADO: 'Cambio de estado',
  REVISION_DOCUMENTO: 'Revisión de documento',
  VALIDACION_SARLAFT: 'Validación SARLAFT',
  ALTA_PROVEEDOR: 'Alta de proveedor',
  CREACION_EXPEDIENTE: 'Creación de expediente',
  PARAMETRIZACION_SISTEMA: 'Parametrización',
  CREACION_REGISTRO: 'Creación de registro',
  ASIGNACION_REVISOR: 'Asignación de revisor',
  CALIFICACION_PROVEEDOR: 'Calificación de proveedor',
};

// Un documento marcado vencido sin fecha llega con miles de días: se muestra solo "Vencido"
const UNKNOWN_OVERDUE_DAYS = 900;

const dueLabel = (days: number) =>
  days <= -UNKNOWN_OVERDUE_DAYS
    ? 'Vencido'
    : days < 0
    ? `Vencido hace ${Math.abs(days)} d`
    : days === 0
    ? 'Vence hoy'
    : `En ${days} d`;

export const ResumenPanel: React.FC<Props> = ({ dossiers, onFilterStage, onRegister, tabs, scopeLabel, dateLabel }) => {
  const { role, accountRole, isReadOnly, activeUser, currentDossierId, systemAuditLogs, systemUsers, openSupplierReview, openSupplierEvaluation, setActiveView } = useApp();

  const stats = useMemo(() => {
    const stageCounts = STAGES.map((s) => ({ key: s.key, label: s.label, tone: s.tone, count: 0 }));
    const due: DueItem[] = [];
    let habilitados = 0;
    let enRevision = 0;
    let conVencimientos = 0;

    dossiers.forEach((d) => {
      const creation = getCreationStatus(d);
      const stage = stageOf(creation.status);
      stageCounts.find((s) => s.key === stage.key)!.count++;
      if (stage.key === 'habilitado' || stage.key === 'aprobado') habilitados++;
      if (stage.key === 'revision') enRevision++;

      const exp = getDossierDocumentExpirationSummary(d);
      exp.expiredDocs.forEach((doc) => due.push({ dossier: d, what: doc.name, kind: 'Documento', days: -Math.max(1, doc.daysOverdue) }));
      exp.expiringSoonDocs.forEach((doc) => due.push({ dossier: d, what: doc.name, kind: 'Documento', days: doc.daysRemaining }));

      const contract = getContractualStatus(d);
      if (contract.hasContract && (contract.status === 'VENCIDO' || contract.status === 'POR_VENCER')) {
        due.push({ dossier: d, what: `Contrato ${contract.contractNumber || ''}`.trim(), kind: 'Contrato', days: contract.daysRemaining });
      }
      if (exp.hasExpiredDocs || exp.hasExpiringSoonDocs || contract.status === 'VENCIDO' || contract.status === 'POR_VENCER') {
        conVencimientos++;
      }
    });

    due.sort((a, b) => a.days - b.days);

    const evalRows = dossiers.map((d) => buildEvaluationRow(d));
    const active = evalRows.filter((r) => r.isSupplierActive);
    const evalDue = evalRows.filter(
      (r) => !r.initialEval || r.annualStatus === 'VENCIDA_REQUIERE_EVAL' || r.annualStatus === 'PROXIMA_VENCER'
    );
    const scores = evalRows.flatMap((r) => [r.initialEval, r.latestAnnualEval]).filter(Boolean).map((e) => e!.totalScore);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    const ranked = evalRows
      .map((r) => {
        const e = r.latestAnnualEval || r.initialEval;
        return e ? { id: r.dossier.id, name: supplierName(r.dossier), sub: r.dossier.fileNumber || '', score: e.totalScore } : null;
      })
      .filter((x): x is { id: string; name: string; sub: string; score: number } => !!x)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Puntaje promedio por mes (últimos 12 meses) y clasificación por último puntaje
    const parseD = (v?: string) => {
      if (!v) return null;
      const d = v.includes('/') ? new Date(+v.split('/')[2], +v.split('/')[1] - 1, +v.split('/')[0]) : new Date(v);
      return isNaN(d.getTime()) ? null : d;
    };
    const seen = new Set<string>();
    const allEvals = dossiers
      .flatMap((d) => [d.initialEvaluation, ...(Array.isArray(d.evaluations) ? d.evaluations : [])])
      .filter((e): e is NonNullable<typeof e> => {
        if (!e || seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });
    const now = new Date();
    const trend = Array.from({ length: 12 }, (_, i) => {
      const m = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const inMonth = allEvals.filter((e) => {
        const d = parseD(e.evaluationDate);
        return d && d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
      });
      return {
        label: m.toLocaleDateString('es-CO', { month: 'short' }).replace('.', ''),
        value: inMonth.length ? Math.round(inMonth.reduce((a, e) => a + e.totalScore, 0) / inMonth.length) : null,
      };
    });
    const grades = { A: 0, B: 0, C: 0 };
    evalRows.forEach((r) => {
      const e = r.latestAnnualEval || r.initialEval;
      if (!e) return;
      if (e.totalScore >= 85) grades.A++;
      else if (e.totalScore >= 70) grades.B++;
      else grades.C++;
    });
    const catMap = new Map<string, number>();
    dossiers.forEach((d) => {
      const c = d.selectedCategory || 'Sin categoría';
      catMap.set(c, (catMap.get(c) || 0) + 1);
    });
    const byCat = Array.from(catMap, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

    return {
      trend,
      grades,
      byCat,
      ranked,
      stageCounts,
      due: due.filter((x) => x.days <= HORIZON_DAYS),
      habilitados,
      enRevision,
      conVencimientos,
      evalUpToDate: active.filter((r) => r.annualStatus === 'AL_DIA' && r.initialEval).length,
      evalDue,
      avg,
    };
  }, [dossiers]);

  const reviewers = systemUsers
    .filter((u) => u.role === 'REVISOR')
    .map((u) => ({ user: u, count: dossiers.filter((d) => d.assignedReviewerId === u.id).length }));
  const maxLoad = Math.max(1, ...reviewers.map((r) => r.count));

  const juridicas = dossiers.filter((d) => d.basicInfo?.supplierType !== 'NATURAL').length;
  const pct = (n: number) => (dossiers.length ? Math.round((n / dossiers.length) * 100) : 0);

  const priorityAlerts = useMemo(() => computePushAlerts(dossiers, role, currentDossierId).alerts.slice(0, 6), [dossiers, role, currentDossierId]);
  const health = dossiers.length ? Math.round(((dossiers.length - stats.conVencimientos) / dossiers.length) * 100) : 100;

  return (
    <div className="space-y-7">
      <DashboardHero
        userName={activeUser?.name || ''}
        dateLabel={dateLabel}
        scopeLabel={scopeLabel}
        critical={stats.conVencimientos}
        pendingEval={stats.evalDue.length}
        health={health}
        alerts={stats.due.length}
        habilitados={stats.habilitados}
        avg={stats.avg}
        onRegister={onRegister}
        onEvaluate={() => setActiveView('evaluaciones')}
      />

      {tabs}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Building2} label="Proveedores" value={dossiers.length} hint={`${juridicas} jurídicas · ${dossiers.length - juridicas} naturales`} progress={100} delay={0} />
        <Kpi icon={BadgeCheck} label="Habilitados" value={stats.habilitados} hint={`${pct(stats.habilitados)} % de la cartera`} tone="info" progress={pct(stats.habilitados)} delay={80} onClick={() => onFilterStage('habilitado')} />
        <Kpi icon={Hourglass} label="En revisión" value={stats.enRevision} hint="esperan al revisor" tone="warning" progress={pct(stats.enRevision)} delay={160} onClick={() => onFilterStage('revision')} />
        <Kpi icon={FileClock} label="Con vencimientos" value={stats.conVencimientos} hint={`${stats.due.length} pendientes en ${HORIZON_DAYS} días`} tone="danger" progress={pct(stats.conVencimientos)} delay={240} />
      </div>

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-12 [&>*]:min-w-0">
        <Panel title="Desempeño de proveedores" aside={stats.avg !== null ? `Promedio ${stats.avg.toFixed(1).replace('.', ',')} pts` : 'Sin calificaciones'} className="xl:col-span-8">
          <div className="text-[#0b1d3a] dark:text-slate-200"><TrendChart data={stats.trend} /></div>
          <p className="text-[12px] text-[#3a5274] dark:text-slate-400">Puntaje promedio de las evaluaciones en los últimos 12 meses</p>
        </Panel>
        <Panel title="Clasificación actual" aside="último puntaje de cada proveedor" className="xl:col-span-4">
          <div className="pt-2"><GradeBars grades={stats.grades} /></div>
        </Panel>
      </div>

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-12 [&>*]:min-w-0">
        <Panel title="Proveedores por categoría" aside="distribución del banco" className="xl:col-span-7">
          <div className="pt-2 max-h-[340px] overflow-y-auto pr-1"><BarList items={stats.byCat} /></div>
        </Panel>
        <div className="xl:col-span-5">
          <Panel title="Estado de los expedientes" aside="Toque una porción para filtrar">
            <StageDonut
              parts={stats.stageCounts.map((c) => ({ key: c.key, label: c.label, color: TONE_COLOR[c.tone], count: c.count }))}
              onSelect={onFilterStage}
            />
          </Panel>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 [&>*]:min-w-0">
        <div className={`grid gap-6 grid-cols-1 items-start ${accountRole === 'SUPERADMIN' ? 'xl:grid-cols-2' : ''}`}>
          <Panel
            title="Evaluaciones"
            aside={stats.avg !== null ? `Promedio ${stats.avg.toFixed(1).replace('.', ',')} / 100` : 'Sin calificaciones'}
          >
            <div className="grid grid-cols-2 gap-4 py-2">
              <div>
                <div className="text-3xl font-bold tabular-nums text-fs-navy dark:text-white">{stats.evalUpToDate}</div>
                <div className="text-[13px] text-[#3a5274]">al día</div>
              </div>
              <div>
                <div className={`text-3xl font-bold tabular-nums ${stats.evalDue.length ? 'text-fs-warn' : 'text-fs-navy dark:text-white'}`}>
                  {stats.evalDue.length}
                </div>
                <div className="text-[13px] text-[#3a5274]">por calificar</div>
              </div>
            </div>
            {stats.evalDue.slice(0, 3).map((r) => (
              <button
                key={r.dossier.id}
                type="button"
                disabled={isReadOnly}
                onClick={() => openSupplierEvaluation(r.dossier.id)}
                className="w-full flex items-center justify-between gap-3 py-2 border-t border-[#edf1f6] dark:border-slate-800 text-left text-sm hover:text-fs-blue cursor-pointer"
              >
                <span className="truncate text-fs-navy dark:text-slate-200">{supplierName(r.dossier)}</span>
                <span className="text-xs text-fs-muted whitespace-nowrap">{r.initialEval ? 'Anual' : 'Inicial'}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setActiveView('evaluaciones')}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-fs-blue hover:underline underline-offset-2 cursor-pointer"
            >
              Ir a evaluaciones <ArrowRight className="w-4 h-4" />
            </button>
          </Panel>

          {role === 'ADMIN' && (
            <Panel title="Carga por revisor" aside="expedientes asignados">
              <ul className="space-y-3 pt-1">
                {reviewers.map(({ user, count }) => (
                  <li key={user.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-fs-navy dark:text-slate-200">{user.name}</span>
                      <span className="font-semibold tabular-nums text-fs-navy dark:text-white">{count}</span>
                    </div>
                    <Meter value={count} max={maxLoad} />
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>

      {stats.ranked.length > 0 && (
        <Podium items={stats.ranked} onOpen={openSupplierReview} />
      )}

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-12 [&>*]:min-w-0">
        <Panel
          title="Alertas prioritarias"
          aside={
            <span className="flex w-10 h-10 items-center justify-center rounded-xl bg-[#2c84c4]/20">
              <AlertTriangle className="w-5 h-5 text-[#1d5fa8] dark:text-[#69bdd7] dark:text-[#69bdd7]" />
            </span>
          }
          className={accountRole === 'SUPERADMIN' ? 'xl:col-span-5' : 'xl:col-span-12'}
        >
          <p className="-mt-1 mb-3 text-[13px] text-[#3a5274] dark:text-slate-400">Lo que hay que atender primero</p>
          {priorityAlerts.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#3a5274] dark:text-slate-400">Sin alertas abiertas.</p>
          ) : (
            <PriorityAlerts
              items={priorityAlerts.map((a) => ({ id: a.dossierId, title: a.supplierName, message: a.message, critical: a.severity === 'CRITICAL' }))}
              onOpen={openSupplierReview}
            />
          )}
        </Panel>

        {accountRole === 'SUPERADMIN' && (
        <Panel
          title="Actividad reciente"
          aside={
            accountRole === 'SUPERADMIN' ? (
              <button type="button" onClick={() => setActiveView('auditoria')} className="inline-flex items-center gap-1 font-semibold text-fs-blue hover:underline cursor-pointer">
                Ver auditoría <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : undefined
          }
          className="xl:col-span-7"
        >
          <p className="-mt-1 mb-4 text-[13px] text-[#3a5274] dark:text-slate-400">Últimos cambios en el sistema</p>
          {systemAuditLogs.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#3a5274] dark:text-slate-400">Aún no hay actividad registrada.</p>
          ) : (
            <ActivityTimeline
              items={[...systemAuditLogs]
                .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
                .slice(0, 6)
                .map((l) => ({
                  id: l.id,
                  title: ACTION_LABEL[l.action] || l.action,
                  badge: l.section,
                  when: l.formattedDate,
                  detail: `${l.supplierName}${l.fieldChanged ? ' · ' + l.fieldChanged : ''}${l.newValue ? ': ' + l.newValue : ''}`,
                }))}
            />
          )}
        </Panel>
        )}
      </div>
    </div>
  );
};
