import React, { useMemo } from 'react';
import { Search, Award } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupplierDossier } from '../../types';
import { getCreationStatus } from '../../utils/contractValidity';
import {
  Meter,
  rowCls,
  rowIconBtn,
  rowPrimaryBtn,
  stagePillTone,
  tbodyCls,
  theadRowCls,
  Radicado,
  STAGES,
  StatusPill,
  TierBadge,
  cardCls,
  inputCls,
  secondaryBtn,
  stageOf,
  supplierDoc,
  supplierName,
} from '../ui/archive';

export interface ExpedienteFilters {
  search: string;
  stage: string; // clave de STAGES o 'ALL'
  tier: string;
  category: string;
}

export const EMPTY_FILTERS: ExpedienteFilters = { search: '', stage: 'ALL', tier: 'ALL', category: 'ALL' };

// Avance de requisitos: documentos obligatorios aprobados
const documentProgress = (d: SupplierDossier) => {
  const required = Object.values(d.documents || {}).filter((doc) => doc.isRequired !== false);
  const approved = required.filter((doc) => doc.status === 'APROBADO');
  return { approved: approved.length, total: required.length || 1 };
};

interface Props {
  dossiers: SupplierDossier[];
  filters: ExpedienteFilters;
  onChange: (f: ExpedienteFilters) => void;
}

export const ExpedientesTable: React.FC<Props> = ({ dossiers, filters, onChange }) => {
  const { openSupplierReview, openSupplierEvaluation } = useApp();

  const categories = useMemo(
    () => Array.from(new Set(dossiers.map((d) => d.selectedCategory).filter(Boolean))).sort(),
    [dossiers]
  );

  const rows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return dossiers.filter((d) => {
      const stage = stageOf(getCreationStatus(d).status);
      if (filters.stage !== 'ALL' && stage.key !== filters.stage) return false;
      if (filters.tier !== 'ALL' && d.supplierTier !== filters.tier) return false;
      if (filters.category !== 'ALL' && d.selectedCategory !== filters.category) return false;
      if (!q) return true;
      const b = d.basicInfo || ({} as SupplierDossier['basicInfo']);
      return [supplierName(d), b.nit, b.documentNumber, d.fileNumber, b.email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [dossiers, filters]);

  const hasFilters = filters.search || filters.stage !== 'ALL' || filters.tier !== 'ALL' || filters.category !== 'ALL';
  const set = (patch: Partial<ExpedienteFilters>) => onChange({ ...filters, ...patch });

  return (
    <section className={cardCls}>
      <div className="flex flex-col lg:flex-row gap-3 p-4 border-b border-[#edf1f6] dark:border-slate-800">
        <label className="relative flex-1 min-w-[220px]">
          <span className="sr-only">Buscar</span>
          <Search className="w-4 h-4 text-fs-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className={`${inputCls} w-full h-10 pl-10`}
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Buscar por nombre, NIT, cédula o radicado"
          />
        </label>
        <select className={`${inputCls} w-full lg:w-52`} value={filters.stage} onChange={(e) => set({ stage: e.target.value })} aria-label="Etapa">
          <option value="ALL">Todas las etapas</option>
          {STAGES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <select className={`${inputCls} w-full lg:w-40`} value={filters.tier} onChange={(e) => set({ tier: e.target.value })} aria-label="Tipo">
          <option value="ALL">Todos los tipos</option>
          <option value="A">Tipo A · Crítico</option>
          <option value="B">Tipo B · Operativo</option>
          <option value="C">Tipo C · Estándar</option>
        </select>
        <select className={`${inputCls} w-full lg:w-56`} value={filters.category} onChange={(e) => set({ category: e.target.value })} aria-label="Categoría">
          <option value="ALL">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button type="button" className={secondaryBtn} onClick={() => onChange({ search: '', stage: 'ALL', tier: 'ALL', category: 'ALL' })}>
            Limpiar
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className={theadRowCls}>
              <th className="py-3.5 px-4 font-semibold">Proveedor</th>
              <th className="py-3.5 px-3 font-semibold">Tipo</th>
              <th className="py-3.5 px-3 font-semibold">Categoría</th>
              <th className="py-3.5 px-3 font-semibold">Revisor</th>
              <th className="py-3.5 px-3 font-medium w-36">Requisitos</th>
              <th className="py-3.5 px-3 font-semibold">Etapa</th>
              <th className="py-3.5 px-4" />
            </tr>
          </thead>
          <tbody className={tbodyCls}>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center text-fs-muted">
                  {dossiers.length === 0 ? 'Aún no hay proveedores registrados.' : 'Ningún expediente coincide con la búsqueda o los filtros.'}
                </td>
              </tr>
            ) : (
              rows.map((d) => {
                const stage = stageOf(getCreationStatus(d).status);
                const prog = documentProgress(d);
                return (
                  <tr key={d.id} className={rowCls}>
                    <td className="py-3.5 px-4 min-w-[250px]">
                      <div className="text-[15px] font-bold text-[#0b1d3a] dark:text-white">{supplierName(d)}</div>
                      <div className="flex flex-wrap gap-x-2 mt-0.5 whitespace-nowrap">
                        <Radicado value={d.fileNumber} />
                        <span className="text-sm text-[#3a5274]">{supplierDoc(d)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <TierBadge tier={d.supplierTier} />
                    </td>
                    <td className="py-3.5 px-3 text-fs-muted max-w-[170px] truncate" title={d.selectedCategory}>{d.selectedCategory || '—'}</td>
                    <td className="py-3.5 px-3 text-fs-navy dark:text-slate-300 whitespace-nowrap">{d.assignedReviewerName || 'Sin asignar'}</td>
                    <td className="py-3.5 px-3">
                      <div className="flex justify-between text-sm text-[#3a5274] mb-1 tabular-nums">
                        <span>
                          {prog.approved} de {prog.total}
                        </span>
                      </div>
                      <Meter value={prog.approved} max={prog.total} tone={prog.approved === prog.total ? 'navy' : 'blue'} />
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusPill tone={stagePillTone(stage)}>{stage.label}</StatusPill>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          title="Evaluar proveedor"
                          aria-label="Evaluar proveedor"
                          onClick={() => openSupplierEvaluation(d.id)}
                          className={rowIconBtn}
                        >
                          <Award className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openSupplierReview(d.id)}
                          className={rowPrimaryBtn}
                        >
                          Revisar
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
      <div className="px-4 py-3 border-t border-[#edf1f6] dark:border-slate-800 text-sm text-[#3a5274]">
        {rows.length} de {dossiers.length} expedientes
      </div>
    </section>
  );
};
