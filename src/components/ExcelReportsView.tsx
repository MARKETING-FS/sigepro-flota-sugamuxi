import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, Download, FileSpreadsheet, Loader2, RotateCcw, Search, Table2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageHeader, StatusPill, heroPrimaryBtn } from './ui/archive';
import type { Tone } from './ui/archive';
import { downloadWorkbook } from '../utils/reports/excelBuilder';
import type { CellTone } from '../utils/reports/excelBuilder';
import {
  REPORTS,
  activeFilterCount,
  applyFilters,
  buildConsolidated,
  buildSheets,
  defaultColumns,
  describeFilters,
  fileDate,
  formatCell,
  reportById,
} from '../utils/reports/reportDefs';
import type { FilterValues, ReportCtx, ReportId } from '../utils/reports/reportDefs';

const PREVIEW_ROWS = 8;

const TONE_MAP: Record<CellTone, Tone> = { good: 'ok', neutral: 'muted', info: 'warn', bad: 'bad' };

const labelCls = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0f6b8f] dark:text-[#5db2c9]';
const fieldCls =
  'w-full h-11 px-3.5 text-sm rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/10 text-[#0b1d3a] dark:text-white placeholder:text-[#6b84a3] focus:outline-none focus:border-[#0f6b8f] focus:ring-2 focus:ring-[#0f6b8f]/30';

/** Número de paso: círculo azul con la cifra. */
const StepNumber: React.FC<{ n: number }> = ({ n }) => (
  <span className="w-7 h-7 rounded-full bg-gradient-action text-white grid place-items-center text-[13px] font-bold shrink-0 shadow-glow">{n}</span>
);

export const ExcelReportsView: React.FC = () => {
  const {
    dossiers,
    systemAuditLogs,
    convocatorias,
    supplierEvaluations,
    documentDefinitions,
    categoriesConfig,
    baseRequirementsConfig,
    getRequiredDocumentsForSupplier,
    activeUser,
    showToast,
  } = useApp();

  const [reportId, setReportId] = useState<ReportId>('DIRECTORIO');
  const [filterValues, setFilterValues] = useState<Record<string, FilterValues>>({});
  const [columnChoice, setColumnChoice] = useState<Record<string, string[]>>({});
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [busy, setBusy] = useState<'report' | 'book' | null>(null);

  // El contexto cambia solo cuando cambian los datos o los requisitos (de ahí salen los % de cumplimiento)
  const ctx: ReportCtx = useMemo(
    () => ({
      dossiers,
      evaluations: supplierEvaluations,
      convocatorias,
      auditLogs: systemAuditLogs,
      documentDefinitions,
      getRequired: (type, category) => getRequiredDocumentsForSupplier(type, category),
      userName: activeUser?.name || 'Usuario SIGEPRO',
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dossiers, supplierEvaluations, convocatorias, systemAuditLogs, documentDefinitions, categoriesConfig, baseRequirementsConfig, activeUser?.name]
  );

  const def = reportById(reportId);
  const values = filterValues[reportId] || {};
  const selectedIds = columnChoice[reportId] || defaultColumns(def);
  const selectedCols = def.columns.filter((c) => selectedIds.includes(c.id));
  const rows = useMemo(() => applyFilters(def, ctx, values), [def, ctx, values]);
  const nFilters = activeFilterCount(def, values);
  const totalRows = useMemo(() => def.rows(ctx).length, [def, ctx]);
  const countOf = (id: ReportId) => reportById(id).rows(ctx).length;

  const setValue = (id: string, v: string) =>
    setFilterValues((prev) => ({ ...prev, [reportId]: { ...(prev[reportId] || {}), [id]: v } }));
  const clearFilters = () => setFilterValues((prev) => ({ ...prev, [reportId]: {} }));
  const toggleColumn = (id: string) =>
    setColumnChoice((prev) => {
      const current = prev[reportId] || defaultColumns(def);
      return { ...prev, [reportId]: current.includes(id) ? current.filter((c) => c !== id) : [...current, id] };
    });
  const setAllColumns = (on: boolean) =>
    setColumnChoice((prev) => ({ ...prev, [reportId]: on ? def.columns.map((c) => c.id) : [] }));
  const resetColumns = () => setColumnChoice((prev) => ({ ...prev, [reportId]: defaultColumns(def) }));

  const groups = useMemo(() => {
    const map = new Map<string, typeof def.columns>();
    def.columns.forEach((c) => map.set(c.group, [...(map.get(c.group) || []), c]));
    return Array.from(map.entries());
  }, [def]);

  const noun = rows.length === 1 ? def.noun[0] : def.noun[1];
  const fileName = `SIGEPRO_${def.fileSlug}_${fileDate()}.xlsx`;
  const canDownload = rows.length > 0 && selectedCols.length > 0 && busy === null;

  const handleDownload = async () => {
    if (!canDownload) return;
    setBusy('report');
    try {
      const sheets = buildSheets(def, ctx, rows, selectedIds, describeFilters(def, ctx, values));
      await downloadWorkbook(fileName, { author: ctx.userName, title: def.title, sheets });
      showToast(`Excel descargado: ${rows.length} ${noun}.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('No se pudo generar el Excel. Intenta de nuevo.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const handleBook = async () => {
    if (busy) return;
    setBusy('book');
    try {
      const { summary, sheets } = buildConsolidated(ctx);
      await downloadWorkbook(`SIGEPRO_Libro_completo_${fileDate()}.xlsx`, {
        author: ctx.userName,
        title: 'Libro completo de proveedores',
        summary,
        sheets,
      });
      showToast('Libro completo descargado (resumen + 7 informes).', 'success');
    } catch (err) {
      console.error(err);
      showToast('No se pudo generar el libro completo.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const hiddenCols = selectedCols.length - 7 > 0 ? selectedCols.length - 7 : 0;
  const previewCols = selectedCols.slice(0, 7);

  return (
    <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 pb-8 pt-1 space-y-5">
      <PageHeader
        icon={FileSpreadsheet}
        title="Reportes"
        subtitle="Elige un informe, filtra lo que necesites y descarga el Excel ya formateado"
        actions={
          <button type="button" className={heroPrimaryBtn} onClick={handleBook} disabled={busy !== null} title="Un solo archivo con un resumen y los 7 informes completos, sin filtros">
            {busy === 'book' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            Libro completo
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-5 items-start">
        {/* ── Paso 1: informe ───────────────────────────────────────────── */}
        <aside className="fs-card rounded-[22px] p-4 lg:sticky lg:top-4">
          <div className="flex items-center gap-2.5 px-1 pb-3">
            <StepNumber n={1} />
            <span className="font-display text-base font-semibold text-[#0b1d3a] dark:text-white">Elige el informe</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-1.5" role="radiogroup" aria-label="Informe">
            {REPORTS.map((r) => {
              const Icon = r.icon;
              const active = r.id === reportId;
              return (
                <button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setReportId(r.id);
                    setColumnsOpen(false);
                  }}
                  className={`group flex items-center gap-3 text-left rounded-2xl px-3 h-[54px] border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b8f] ${
                    active
                      ? 'bg-gradient-action text-white border-transparent shadow-glow'
                      : 'border-transparent hover:bg-[#0f6b8f]/[0.08] dark:hover:bg-white/[0.06] text-[#0b1d3a] dark:text-slate-200'
                  }`}
                >
                  <span className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${active ? 'bg-white/20' : 'bg-[#0f6b8f]/12 dark:bg-[#0f6b8f]/25 text-[#0a5473] dark:text-[#5db2c9]'}`}>
                    <Icon className="w-[18px] h-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold leading-tight truncate">{r.short}</span>
                    <span className={`block text-[12px] leading-tight tabular-nums ${active ? 'text-white/80' : 'text-[#5d7392] dark:text-slate-400'}`}>
                      {countOf(r.id)} {countOf(r.id) === 1 ? r.noun[0] : r.noun[1]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="space-y-5 min-w-0">
          {/* Qué contiene este informe */}
          <section className="fs-card rounded-[22px] p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className={labelCls}>Informe seleccionado</div>
                <h2 className="mt-1 font-display text-2xl font-semibold text-[#0b1d3a] dark:text-white">{def.title}</h2>
                <p className="mt-1 text-[15px] text-[#3a5274] dark:text-slate-400 max-w-2xl">{def.purpose}</p>
              </div>
              <div className="flex items-baseline gap-2 shrink-0">
                <span className="font-display text-5xl font-semibold text-[#0b1d3a] dark:text-white tabular-nums leading-none">{rows.length}</span>
                <span className="text-sm text-[#5d7392] dark:text-slate-400 leading-tight">
                  de {totalRows}
                  <br />
                  {def.noun[1]}
                </span>
              </div>
            </div>
          </section>

          {/* ── Paso 2: filtros ─────────────────────────────────────────── */}
          <section className="fs-card rounded-[22px] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <StepNumber n={2} />
                <div>
                  <span className="font-display text-base font-semibold text-[#0b1d3a] dark:text-white">Filtra lo que necesitas</span>
                  <span className="ml-2 text-[13px] text-[#5d7392] dark:text-slate-400">Opcional · sin filtros se descarga todo</span>
                </div>
              </div>
              {nFilters > 0 && (
                <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] font-semibold text-[#0a5473] dark:text-[#5db2c9] hover:bg-[#0f6b8f]/10 cursor-pointer transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" /> Quitar {nFilters} {nFilters === 1 ? 'filtro' : 'filtros'}
                </button>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-3.5">
              {def.filters.map((f) => {
                const id = `flt-${reportId}-${f.id}`;
                const v = values[f.id] || '';
                return (
                  <div key={f.id} className={f.kind === 'search' ? 'sm:col-span-2 xl:col-span-1' : ''}>
                    <label htmlFor={id} className="block text-[13px] font-semibold text-[#0b1d3a] dark:text-slate-200 mb-1.5">{f.label}</label>
                    {f.kind === 'search' && (
                      <div className="relative">
                        <Search className="w-4 h-4 text-[#6b84a3] absolute left-3.5 top-3.5 pointer-events-none" />
                        <input id={id} type="text" value={v} onChange={(e) => setValue(f.id, e.target.value)} placeholder={f.placeholder} className={`${fieldCls} pl-10`} />
                      </div>
                    )}
                    {f.kind === 'select' && (
                      <select id={id} value={v} onChange={(e) => setValue(f.id, e.target.value)} className={`${fieldCls} cursor-pointer`}>
                        <option value="">Todos</option>
                        {(f.options?.(ctx) || []).map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    )}
                    {f.kind === 'date' && <input id={id} type="date" value={v} onChange={(e) => setValue(f.id, e.target.value)} className={`${fieldCls} cursor-pointer`} />}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Paso 3: columnas ────────────────────────────────────────── */}
          <section className="fs-card rounded-[22px] p-5 sm:p-6">
            <button
              type="button"
              onClick={() => setColumnsOpen((o) => !o)}
              aria-expanded={columnsOpen}
              className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <StepNumber n={3} />
                <span>
                  <span className="font-display text-base font-semibold text-[#0b1d3a] dark:text-white">Columnas del Excel</span>
                  <span className="ml-2 text-[13px] text-[#5d7392] dark:text-slate-400">
                    {selectedCols.length} de {def.columns.length} · {columnsOpen ? 'ocultar' : 'cambiar'}
                  </span>
                </span>
              </span>
              <ChevronDown className={`w-5 h-5 text-[#5d7392] transition-transform ${columnsOpen ? 'rotate-180' : ''}`} />
            </button>

            {columnsOpen && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-4 text-[13px] font-semibold">
                  <button type="button" onClick={() => setAllColumns(true)} className="text-[#0a5473] dark:text-[#5db2c9] hover:underline cursor-pointer">Marcar todas</button>
                  <button type="button" onClick={() => setAllColumns(false)} className="text-[#0a5473] dark:text-[#5db2c9] hover:underline cursor-pointer">Quitar todas</button>
                  <button type="button" onClick={resetColumns} className="text-[#3a5274] dark:text-slate-400 hover:underline cursor-pointer">Las recomendadas</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {groups.map(([group, cols]) => (
                    <div key={group} className="rounded-2xl bg-black/[0.025] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/10 p-3.5">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className="font-display text-sm font-semibold text-[#0b1d3a] dark:text-white">{group}</span>
                        <span className="text-[12px] font-semibold text-[#0f6b8f] dark:text-[#5db2c9] tabular-nums">
                          {cols.filter((c) => selectedIds.includes(c.id)).length}/{cols.length}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {cols.map((c) => {
                          const on = selectedIds.includes(c.id);
                          return (
                            <label
                              key={c.id}
                              className={`flex items-center gap-3 px-2.5 h-10 rounded-xl text-sm cursor-pointer transition-colors ${
                                on ? 'bg-[#0f6b8f]/12 dark:bg-[#0f6b8f]/20 text-[#0b1d3a] dark:text-white font-semibold' : 'text-[#3a5274] dark:text-slate-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                              }`}
                            >
                              <input type="checkbox" checked={on} onChange={() => toggleColumn(c.id)} className="sr-only peer" />
                              <span className={`w-5 h-5 rounded-md grid place-items-center shrink-0 border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#0f6b8f]/50 ${on ? 'bg-gradient-action border-transparent text-white' : 'border-[#6b84a3]/60'}`}>
                                {on && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                              </span>
                              <span className="truncate">{c.header}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── Vista previa y descarga ─────────────────────────────────── */}
          <section className="fs-card rounded-[22px] overflow-hidden">
            <div className="p-5 sm:p-6 pb-3 flex items-center gap-2.5">
              <Table2 className="w-5 h-5 text-[#0f6b8f] dark:text-[#5db2c9]" />
              <span className="font-display text-base font-semibold text-[#0b1d3a] dark:text-white">Así quedará</span>
              <span className="text-[13px] text-[#5d7392] dark:text-slate-400">
                {rows.length > PREVIEW_ROWS ? `primeras ${PREVIEW_ROWS} de ${rows.length}` : `${rows.length} ${noun}`}
                {hiddenCols > 0 && ` · se muestran 7 de ${selectedCols.length} columnas`}
              </span>
            </div>

            {selectedCols.length === 0 ? (
              <div className="px-6 py-12 text-center text-[15px] text-[#3a5274] dark:text-slate-400">Marca al menos una columna en el paso 3.</div>
            ) : rows.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-[15px] font-semibold text-[#0b1d3a] dark:text-white">Ningún registro coincide con los filtros.</p>
                <button type="button" onClick={clearFilters} className="mt-2 text-sm font-semibold text-[#0a5473] dark:text-[#5db2c9] hover:underline cursor-pointer">Quitar los filtros</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] text-left border-collapse min-w-[720px]">
                  <thead>
                    <tr className="bg-[#0a5473] text-white">
                      {previewCols.map((c) => (
                        <th key={c.id} className={`px-3.5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap ${c.kind === 'money' || c.kind === 'int' ? 'text-right' : ''}`}>
                          {c.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.06] dark:divide-white/10">
                    {rows.slice(0, PREVIEW_ROWS).map((row, i) => (
                      <tr key={i} className="odd:bg-transparent even:bg-[#0f6b8f]/[0.04] hover:bg-[#0f6b8f]/[0.09] transition-colors">
                        {previewCols.map((c) => {
                          const raw = c.get(row, ctx);
                          const text = formatCell(c.kind, raw);
                          const tone = c.kind === 'status' ? c.tone?.(raw) : undefined;
                          return (
                            <td key={c.id} className={`px-3.5 py-2.5 text-[#0b1d3a] dark:text-slate-200 max-w-[280px] ${c.kind === 'money' || c.kind === 'int' ? 'text-right tabular-nums' : ''}`}>
                              {tone ? <StatusPill tone={TONE_MAP[tone]}>{text}</StatusPill> : <span className="block truncate" title={text}>{text || <span className="text-[#9fb0c7]">—</span>}</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Barra de descarga */}
            <div className="border-t border-black/[0.08] dark:border-white/10 bg-[#0f6b8f]/[0.05] dark:bg-white/[0.03] px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[15px] font-semibold text-[#0b1d3a] dark:text-white">
                  {rows.length} {noun} · {selectedCols.length} {selectedCols.length === 1 ? 'columna' : 'columnas'}
                  {def.extraSheets && <span className="font-normal text-[#5d7392] dark:text-slate-400"> · 2 hojas</span>}
                </div>
                <div className="text-[12px] text-[#5d7392] dark:text-slate-400 truncate" title={fileName}>{fileName}</div>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!canDownload}
                className="h-12 px-7 rounded-2xl bg-gradient-action text-white font-semibold text-[15px] shadow-glow inline-flex items-center justify-center gap-2.5 transition cursor-pointer hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f6b8f]"
              >
                {busy === 'report' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {busy === 'report' ? 'Generando…' : 'Descargar Excel'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
