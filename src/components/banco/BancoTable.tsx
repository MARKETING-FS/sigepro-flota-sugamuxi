import React from 'react';
import { Award, FileBadge2, SlidersHorizontal } from 'lucide-react';
import { SupplierDossier, ContractValidityStatus } from '../../types';
import { getCreationStatus, getContractualStatus } from '../../utils/contractValidity';
import {
  Meter,
  Radicado,
  StatusPill,
  TierBadge,
  Tone,
  rowCls,
  rowIconBtn,
  rowPrimaryBtn,
  stageOf,
  stagePillTone,
  supplierDoc,
  supplierName,
  tbodyCls,
  theadRowCls,
} from '../ui/archive';

const CONTRACT_VIEW: Record<ContractValidityStatus, { label: string; tone: Tone }> = {
  VIGENTE: { label: 'Vigente', tone: 'blue' },
  POR_VENCER: { label: 'Por vencer', tone: 'warn' },
  VENCIDO: { label: 'Vencido', tone: 'bad' },
  SIN_CONTRATO: { label: 'Sin contrato', tone: 'muted' },
  SUSPENDIDO: { label: 'Suspendido', tone: 'bad' },
  TERMINADO: { label: 'Terminado', tone: 'muted' },
};

const SARLAFT_VIEW: Record<string, { label: string; tone: Tone }> = {
  SIN_COINCIDENCIAS: { label: 'Limpio', tone: 'ok' },
  REQUIERE_VERIFICACION: { label: 'Verificar', tone: 'warn' },
  PENDIENTE: { label: 'Pendiente', tone: 'muted' },
};

// Documentos obligatorios aprobados (la ficha oficial exige el 100 %)
export const requiredDocsProgress = (d: SupplierDossier) => {
  const required = Object.values(d.documents || {}).filter((doc) => doc.isRequired !== false);
  const approved = required.filter((doc) => doc.status === 'APROBADO').length;
  return { approved, total: required.length || 1 };
};

interface Props {
  rows: SupplierDossier[];
  emptyText: string;
  onOpen: (id: string) => void;
  onEvaluate: (id: string) => void;
  onCertificate: (d: SupplierDossier) => void;
  onManualStatus: (d: SupplierDossier) => void;
}

const iconBtn = rowIconBtn;

export const BancoTable: React.FC<Props> = ({ rows, emptyText, onOpen, onEvaluate, onCertificate, onManualStatus }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className={theadRowCls}>
          <th className="py-3.5 pl-5 pr-3 font-bold">Proveedor</th>
          <th className="py-3 px-3 font-bold">Tipo</th>
          <th className="py-3 px-3 font-bold">Categoría</th>
          <th className="py-3 px-3 font-bold">Estado</th>
          <th className="py-3 px-3 font-bold">Contrato</th>
          <th className="py-3 px-3 font-medium w-32">Documentos</th>
          <th className="py-3 pl-3 pr-5 text-right font-bold">Acciones</th>
        </tr>
      </thead>
      <tbody className={tbodyCls}>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={8} className="py-14 text-center text-fs-muted">
              {emptyText}
            </td>
          </tr>
        ) : (
          rows.map((d) => {
            const creation = getCreationStatus(d);
            const stage = stageOf(creation.status);
            const contract = getContractualStatus(d);
            const cv = CONTRACT_VIEW[contract.status] || CONTRACT_VIEW.SIN_CONTRATO;
            const sar = SARLAFT_VIEW[d.internalConcepts?.sarlatfCheck?.result || 'PENDIENTE'] || SARLAFT_VIEW.PENDIENTE;
            const prog = requiredDocsProgress(d);
            const complete = prog.approved === prog.total;
            const docNote = creation.expiredCount
              ? `${creation.expiredCount} vencido${creation.expiredCount > 1 ? 's' : ''}`
              : creation.expiringSoonCount
              ? `${creation.expiringSoonCount} por vencer`
              : null;
            return (
              <tr key={d.id} className={rowCls}>
                <td className="py-3 pl-5 pr-3">
                  <button type="button" onClick={() => onOpen(d.id)} className="text-left text-base font-bold text-[#0b1d3a] dark:text-white hover:text-[#1d5fa8] cursor-pointer">
                    {supplierName(d)}
                  </button>
                  <div className="flex items-center gap-x-2 mt-0.5 whitespace-nowrap">
                    <Radicado value={d.fileNumber} />
                    <span className="text-[#c3cfdd]">|</span>
                    <span className="text-[13px] text-[#3a5274]">{supplierDoc(d)}</span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <TierBadge tier={d.supplierTier || d.basicInfo?.supplierTier} />
                </td>
                <td className="py-3 px-3">
                  <div className="text-[15px] text-[#0b1d3a] dark:text-slate-200 max-w-[170px] truncate" title={d.selectedCategory}>{d.selectedCategory || '—'}</div>
                  <div className="text-[13px] text-[#3a5274]">{d.basicInfo?.city || ''}</div>
                </td>
                <td className="py-3 px-3">
                  <StatusPill tone={stagePillTone(stage)}>{stage.label}</StatusPill>
                  <div className={`text-[13px] mt-1 ${sar.tone === 'warn' ? 'text-fs-warn' : 'text-[#3a5274]'}`}>SARLAFT: {sar.label.toLowerCase()}</div>
                </td>
                <td className="py-3 px-3">
                  <StatusPill tone={cv.tone}>{cv.label}</StatusPill>
                  {contract.hasContract && contract.status !== 'SIN_CONTRATO' && (
                    <div className="text-[13px] text-[#3a5274] mt-1 tabular-nums whitespace-nowrap">
                      {contract.contractNumber}
                      {contract.status === 'POR_VENCER' || contract.status === 'VIGENTE' ? ` · ${contract.daysRemaining} d` : ''}
                    </div>
                  )}
                </td>
                <td className="py-3 px-3">
                  <div className="flex gap-2 text-[13px] mb-1.5 tabular-nums whitespace-nowrap">
                    <span className="text-[#1d5fa8] font-medium">
                      {prog.approved} de {prog.total}
                    </span>
                    {docNote && <span className={`font-medium ${creation.expiredCount ? 'text-fs-bad' : 'text-fs-warn'}`}>· {docNote}</span>}
                  </div>
                  <Meter value={prog.approved} max={prog.total} tone={creation.expiredCount ? 'bad' : creation.expiringSoonCount ? 'warn' : 'blue'} />
                </td>
                <td className="py-3 pl-3 pr-5">
                  <div className="flex justify-end gap-2">
                    <button type="button" className={iconBtn} title="Evaluar proveedor" aria-label="Evaluar proveedor" onClick={() => onEvaluate(d.id)}>
                      <Award className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className={iconBtn}
                      disabled={!complete}
                      title={complete ? 'Ficha y certificado del proveedor' : `La ficha requiere todos los documentos aprobados (${prog.approved} de ${prog.total})`}
                      aria-label="Ficha y certificado"
                      onClick={() => onCertificate(d)}
                    >
                      <FileBadge2 className="w-4 h-4" />
                    </button>
                    <button type="button" className={iconBtn} title="Cambiar estado o contrato" aria-label="Cambiar estado o contrato" onClick={() => onManualStatus(d)}>
                      <SlidersHorizontal className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpen(d.id)}
                      className={rowPrimaryBtn}
                    >
                      Abrir
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
);
