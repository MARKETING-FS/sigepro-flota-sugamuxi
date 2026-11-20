import React from 'react';
import { Award, FileBadge2, Power, RotateCcw, Trash2 } from 'lucide-react';
import { RowMenu, RowMenuItem } from './RowMenu';
import { SupplierDossier, ContractValidityStatus } from '../../types';
import { getCreationStatus, getContractualStatus } from '../../utils/contractValidity';
import { displayDate } from '../../utils/dateOnly';
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

interface Props {
  rows: SupplierDossier[];
  emptyText: string;
  onOpen: (id: string) => void;
  onEvaluate: (id: string) => void;
  onCertificate: (d: SupplierDossier) => void;
  /** Documentos aprobados de un proveedor contando lo que exige su categoría */
  progressOf: (d: SupplierDossier) => { approved: number; total: number };
  /** Falso para el rol Usuario (solo consulta) */
  canEvaluate?: boolean;
  /** Proveedor que se muestra alumbrado en azul (llegada desde un aviso de asignación) */
  highlightId?: string | null;
  /** Solo el superadministrador: columnas «Creado por» y «Asignado a» */
  showOwners?: boolean;
  /** Administradores: inactivar y reactivar */
  onSetInactive?: (d: SupplierDossier, inactive: boolean) => void;
  /** Solo el superadministrador: eliminar */
  onDelete?: (d: SupplierDossier) => void;
}

const iconBtn = rowIconBtn;

export const BancoTable: React.FC<Props> = ({ rows, emptyText, onOpen, onEvaluate, onCertificate, progressOf, canEvaluate = true, highlightId = null, showOwners = false, onSetInactive, onDelete }) => (
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
          {showOwners && <th className="py-3 px-3 font-bold">Creado por</th>}
          {showOwners && <th className="py-3 px-3 font-bold">Asignado a</th>}
          <th className="py-3 pl-3 pr-5 text-right font-bold">Acciones</th>
        </tr>
      </thead>
      <tbody className={tbodyCls}>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={showOwners ? 9 : 7} className="py-14 text-center text-fs-muted">
              {emptyText}
            </td>
          </tr>
        ) : (
          rows.map((d) => {
            const creation = getCreationStatus(d);
            const stage = stageOf(d.processStatus);
            const contract = getContractualStatus(d);
            const cv = CONTRACT_VIEW[contract.status] || CONTRACT_VIEW.SIN_CONTRATO;
            const prog = progressOf(d);
            const complete = prog.total > 0 && prog.approved >= prog.total && !creation.hasExpiredDocs;
            const docNote = creation.expiredCount
              ? `${creation.expiredCount} vencido${creation.expiredCount > 1 ? 's' : ''}`
              : creation.expiringSoonCount
              ? `${creation.expiringSoonCount} por vencer`
              : null;
            const inactive = !!d.basicInfo?.inactive;
            const menu: RowMenuItem[] = [
              ...(onSetInactive
                ? [
                    inactive
                      ? { key: 'on', label: 'Reactivar proveedor', icon: <RotateCcw className="w-4 h-4" />, onSelect: () => onSetInactive(d, false) }
                      : { key: 'off', label: 'Inactivar proveedor', icon: <Power className="w-4 h-4" />, onSelect: () => onSetInactive(d, true) },
                  ]
                : []),
              ...(onDelete ? [{ key: 'del', label: 'Eliminar proveedor', icon: <Trash2 className="w-4 h-4" />, onSelect: () => onDelete(d), danger: true }] : []),
            ];
            return (
              <tr
                key={d.id}
                data-dossier-id={d.id}
                className={`${rowCls} ${
                  inactive ? 'bg-slate-900/[0.07] dark:bg-black/30 grayscale-[0.6] [&>td:not(:last-child)]:opacity-55' : ''
                } ${
                  highlightId === d.id
                    ? 'bg-[#2c84c4]/20 dark:bg-[#2c84c4]/30 shadow-[inset_0_0_0_2px_#2c84c4,0_0_22px_-2px_rgba(44,132,196,0.85)] animate-pulse'
                    : ''
                }`}
              >
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
                  {showOwners && (
                    <div className={`mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-bold ${inactive ? 'text-slate-500 dark:text-slate-300' : 'text-[#0f6b8f] dark:text-[#8fd0e4]'}`}>
                      <span className={`w-2 h-2 rounded-full ${inactive ? 'bg-slate-500' : 'bg-[#2c84c4]'}`} />
                      {inactive ? 'Inactivo' : 'Activo'}
                    </div>
                  )}
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
                {showOwners && (
                  <td className="py-3 px-3">
                    <div className="text-[14px] text-[#0b1d3a] dark:text-slate-200 max-w-[170px] truncate" title={d.createdByName}>{d.createdByName || <span className="text-[#9fb0c7]">—</span>}</div>
                    <div className="text-[12px] text-[#5d7392] tabular-nums">{displayDate(d.createdAt)}</div>
                  </td>
                )}
                {showOwners && (
                  <td className="py-3 px-3">
                    {d.assignedReviewerName ? (
                      <div className="text-[14px] font-medium text-[#0b1d3a] dark:text-slate-200 max-w-[170px] truncate" title={d.assignedReviewerName}>{d.assignedReviewerName}</div>
                    ) : (
                      <span className="text-[13px] text-[#5d7392]">Sin asignar</span>
                    )}
                  </td>
                )}
                <td className="py-3 pl-3 pr-5">
                  <div className="flex justify-end gap-2">
                    {canEvaluate && !inactive && (
                      <button type="button" className={iconBtn} title="Evaluar proveedor" aria-label="Evaluar proveedor" onClick={() => onEvaluate(d.id)}>
                        <Award className="w-4 h-4" />
                      </button>
                    )}
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
                    <button
                      type="button"
                      onClick={() => onOpen(d.id)}
                      className={rowPrimaryBtn}
                    >
                      Abrir
                    </button>
                    <RowMenu items={menu} label={`Más acciones de ${supplierName(d)}`} className={iconBtn} />
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
