import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Building2, BadgeCheck, Hourglass, FileClock, FileSignature } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupplierDossier } from '../../types';
import { getContractualStatus, getDossierDocumentExpirationSummary, getRequiredDocsProgress } from '../../utils/contractValidity';
import { averageCurrentScore, buildEvaluationRow } from '../../utils/evaluationRows';
import { DashboardHero, Kpi, Podium, StageDonut } from './DashboardParts';
import { ActivityTimeline, BarList, GradeBars, PriorityAlerts, TrendChart } from './DashboardCharts';
import { computePushAlerts } from '../../utils/pushAlertsService';
import { evaluationGrade, evaluationMaxScore, evaluationPercent } from '../../utils/evaluationScale';
import { parseLocalDate } from '../../utils/dateOnly';
import {
  ArchiveTab,
  TONE_COLOR,
  Meter,
  Panel,
  Radicado,
  STAGES,
  StatusPill,
  inputCls,
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
  const { role, accountRole, isReadOnly, activeUser, currentDossierId, systemAuditLogs, systemUsers, authProfile, openSupplierReview, openSupplierEvaluation, setActiveView, getRequiredDocumentsForSupplier } = useApp();

  const stats = useMemo(() => {
    const stageCounts = STAGES.map((s) => ({ key: s.key, label: s.label, tone: s.tone, count: 0 }));
    const due: DueItem[] = [];
    let habilitados = 0;
    let conVencimientos = 0;
    let conContrato = 0;
    // Salud documental: de todos los documentos obligatorios que se les piden a los proveedores, cuántos están aprobados y vigentes
    let reqTotal = 0;
    let reqOk = 0;

    dossiers.forEach((d) => {
      const stage = stageOf(d.processStatus);
      stageCounts.find((s) => s.key === stage.key)!.count++;
      if (stage.key === 'habilitado') habilitados++;

      const exp = getDossierDocumentExpirationSummary(d);
      const reqs = getRequiredDocumentsForSupplier(d.basicInfo?.supplierType, d.selectedCategory);
      const progress = getRequiredDocsProgress(d, reqs.allMandatory);
      reqTotal += progress.total;
      reqOk += Math.max(0, progress.approved - exp.expiredCount);
      exp.expiredDocs.forEach((doc) => due.push({ dossier: d, what: doc.name, kind: 'Documento', days: -Math.max(1, doc.daysOverdue) }));
      exp.expiringSoonDocs.forEach((doc) => due.push({ dossier: d, what: doc.name, kind: 'Documento', days: doc.daysRemaining }));

      const contract = getContractualStatus(d);
      if (contract.hasContract) conContrato++;
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
    // Por calificar: los que todavía no tienen evaluación inicial
    const evalDue = evalRows.filter((r) => !r.initialEval && r.dossier.processStatus !== 'RECHAZADO');
    // Puntaje promedio: la última evaluación de cada proveedor, en porcentaje (la inicial es sobre 120 y la anual sobre 100)
    const { avg, count: evaluatedCount } = averageCurrentScore(evalRows);

    // Puntaje promedio por mes (últimos 12 meses) y clasificación por último puntaje
    const parseD = (v?: string) => {
      return parseLocalDate(v);
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
        value: inMonth.length ? Math.round(inMonth.reduce((a, e) => a + evaluationPercent(e), 0) / inMonth.length) : null,
      };
    });
    const grades = { A: 0, B: 0, C: 0 };
    evalRows.forEach((r) => {
      const e = r.latestAnnualEval || r.initialEval;
      if (!e) return;
      grades[evaluationGrade(e)]++;
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
      stageCounts,
      due: due.filter((x) => x.days <= HORIZON_DAYS),
      habilitados,
      conVencimientos,
      conContrato,
      evalUpToDate: evalRows.filter((r) => r.initialEval).length,
      evalDue,
      avg,
      evaluated: evaluatedCount,
      reqTotal,
      reqOk,
    };
  }, [dossiers]);

  // Solo los administradores (el superadministrador no entra); lo que no es de un administrador se cuenta aparte
  // Un expediente es de una persona si lleva su identificador de siempre o el de su cuenta
  const admins = systemUsers.filter((u) => u.shortName === 'Administrador');
  const ownerOf = (d: { assignedReviewerId?: string }) =>
    admins.find(
      (u) => u.id === d.assignedReviewerId || (d.assignedReviewerId === authProfile?.id && !!u.email && u.email === authProfile?.email)
    );
  const reviewers = admins.map((u) => ({ user: u, count: dossiers.filter((d) => ownerOf(d)?.id === u.id).length }));
  const unassigned = dossiers.filter((d) => !ownerOf(d)).length;
  const maxLoad = Math.max(1, unassigned, ...reviewers.map((r) => r.count));

  // Ranking: la última evaluación de cada proveedor llevada a porcentaje (la inicial es sobre 120 y la anual sobre 100).
  // No cuentan los rechazados. Si hay empate gana la evaluación más reciente.
  const [rankOwner, setRankOwner] = useState<string>('ALL');
  const rankedAll = dossiers
    .filter((d) => d.processStatus !== 'RECHAZADO')
    .map((d) => {
      const row = buildEvaluationRow(d);
      const e = row.latestAnnualEval || row.initialEval;
      if (!e) return null;
      const owner = ownerOf(d);
      return {
        id: d.id,
        name: supplierName(d),
        sub: d.fileNumber || '',
        category: d.selectedCategory || 'Sin categoría',
        ownerId: owner?.id || '',
        ownerName: owner?.name || 'Sin asignar',
        score: evaluationPercent(e),
        detail: `${e.totalScore} / ${evaluationMaxScore(e)} puntos`,
        grade: evaluationGrade(e),
        time: (parseLocalDate(e.evaluationDate) || new Date(e.createdAt)).getTime() || 0,
      };
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => b.score - a.score || b.time - a.time || a.name.localeCompare(b.name));
  const isSuper = accountRole === 'SUPERADMIN';
  const rankShown =
    isSuper && rankOwner !== 'ALL' ? rankedAll.filter((x) => (rankOwner === 'NONE' ? !x.ownerId : x.ownerId === rankOwner)) : rankedAll;
  const rankTop = rankShown.slice(0, 10);
  const fmtPct = (n: number) => `${String(Math.round(n * 10) / 10).replace('.', ',')} %`;

  const juridicas = dossiers.filter((d) => d.basicInfo?.supplierType !== 'NATURAL').length;
  const pct = (n: number) => (dossiers.length ? Math.round((n / dossiers.length) * 100) : 0);

  const priorityAlerts = useMemo(() => computePushAlerts(dossiers, role, currentDossierId).alerts.slice(0, 6), [dossiers, role, currentDossierId]);
  const health = stats.reqTotal ? Math.round((stats.reqOk / stats.reqTotal) * 100) : null;
  const overdueCount = stats.due.filter((x) => x.days < 0).length;
  const dueSoonCount = stats.due.length - overdueCount;
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  return (
    <div className="space-y-7">
      <DashboardHero
        userName={activeUser?.name || ''}
        dateLabel={dateLabel}
        scopeLabel={scopeLabel}
        critical={stats.conVencimientos}
        pendingEval={stats.evalDue.length}
        health={health}
        healthHint={stats.reqTotal ? `${stats.reqOk} de ${stats.reqTotal} documentos obligatorios aprobados y vigentes` : 'Aún no hay documentos obligatorios'}
        alerts={stats.due.length}
        alertsHint={stats.due.length ? `${plural(overdueCount, 'vencido', 'vencidos')} · ${plural(dueSoonCount, 'por vencer', 'por vencer')} en ${HORIZON_DAYS} días` : `Nada vencido ni por vencer en ${HORIZON_DAYS} días`}
        habilitados={stats.habilitados}
        habilitadosHint={`de ${plural(dossiers.length, 'proveedor', 'proveedores')} · ${pct(stats.habilitados)} %`}
        avg={stats.avg}
        avgHint={stats.evaluated ? `Promedio de ${plural(stats.evaluated, 'proveedor evaluado', 'proveedores evaluados')}` : 'Todavía no hay evaluaciones'}
        onHabilitados={() => onFilterStage('habilitado')}
        onRegister={onRegister}
        onEvaluate={() => setActiveView('evaluaciones')}
      />

      {tabs}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Building2} label="Proveedores" value={dossiers.length} hint={`${juridicas} jurídicas · ${dossiers.length - juridicas} naturales`} progress={100} delay={0} />
        <Kpi icon={BadgeCheck} label="Habilitados" value={stats.habilitados} hint={`${pct(stats.habilitados)} % de la cartera`} tone="info" progress={pct(stats.habilitados)} delay={80} onClick={() => onFilterStage('habilitado')} />
        <Kpi icon={FileSignature} label="Contratos" value={stats.conContrato} hint={`de ${dossiers.length} proveedores · ${pct(stats.conContrato)} %`} tone="info" progress={pct(stats.conContrato)} delay={160} />
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
                <div className="text-[13px] text-[#3a5274]">con evaluación</div>
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
                <span className="text-xs text-fs-muted whitespace-nowrap">Inicial</span>
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
            <Panel title="Carga por administrador" aside="expedientes asignados">
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
                {unassigned > 0 && (
                  <li>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#5d7392] dark:text-slate-400">Sin administrador asignado</span>
                      <span className="font-semibold tabular-nums text-fs-navy dark:text-white">{unassigned}</span>
                    </div>
                    <Meter value={unassigned} max={maxLoad} />
                  </li>
                )}
              </ul>
            </Panel>
          )}
        </div>
      </div>

      {rankedAll.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-fs-navy dark:text-white">Ranking de proveedores</h3>
              <p className="text-[13px] text-[#3a5274] dark:text-slate-400">
                {isSuper ? 'Los mejor evaluados entre todos los administradores' : 'Los mejor evaluados de su cartera'} · según la última evaluación de cada proveedor, en porcentaje
              </p>
            </div>
            {isSuper && (
              <select
                className={`${inputCls} h-11 w-64 font-semibold`}
                value={rankOwner}
                onChange={(e) => setRankOwner(e.target.value)}
                aria-label="Administrador del ranking"
              >
                <option value="ALL">Todos los administradores</option>
                {admins.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
                <option value="NONE">Sin administrador asignado</option>
              </select>
            )}
          </div>

          {rankTop.length === 0 ? (
            <div className="fs-card rounded-2xl p-8 text-center text-sm text-[#3a5274] dark:text-slate-400">Este administrador todavía no tiene proveedores evaluados.</div>
          ) : (
            <>
              <Podium
                items={rankTop.slice(0, 3).map((x) => ({ id: x.id, name: x.name, sub: x.sub, score: x.score, detail: x.detail, owner: isSuper ? x.ownerName : undefined }))}
                onOpen={openSupplierReview}
              />
              {rankTop.length > 3 && (
                <div className="fs-card rounded-2xl divide-y divide-[#edf1f6] dark:divide-slate-800 overflow-hidden">
                  {rankTop.slice(3).map((x, i) => (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => openSupplierReview(x.id)}
                      className="w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-[#eaf2fb] dark:hover:bg-[#0c2350]/70 transition-colors cursor-pointer"
                    >
                      <span className="w-8 text-center font-display text-base font-semibold text-[#3a5274] dark:text-slate-400 tabular-nums">{i + 4}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-fs-navy dark:text-white">{x.name}</span>
                        <span className="block truncate text-xs text-[#3a5274] dark:text-slate-400">
                          {x.category}
                          {isSuper ? ` · ${x.ownerName}` : ''}
                        </span>
                      </span>
                      <span className="hidden sm:block text-xs text-[#3a5274] dark:text-slate-400 whitespace-nowrap">{x.detail}</span>
                      <span className="w-7 h-7 grid place-items-center rounded-lg bg-[#e3eaf3] dark:bg-white/10 text-xs font-bold text-fs-navy dark:text-white">{x.grade}</span>
                      <span className="w-20 text-right font-display font-semibold text-fs-navy dark:text-white tabular-nums">{fmtPct(x.score)}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
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
