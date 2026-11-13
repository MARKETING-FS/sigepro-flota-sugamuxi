import React, { useRef, useState } from 'react';
import { Briefcase, Calendar, CheckCircle2, Clock, Eye, FileText, Loader2, Pencil, ShieldAlert, UploadCloud } from 'lucide-react';
import { SupplierDossier } from '../../types';
import { useApp } from '../../context/AppContext';
import { storageService } from '../../services/storageService';
import { calculateContractValidity } from '../../utils/contractValidity';
import { formatFileSize, validatePdfFile } from '../../utils/formPdf';

interface Props {
  dossier: SupplierDossier;
  isReadOnly: boolean;
  reviewerName: string;
}

const labelCls = 'block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2c84c4] dark:text-[#69bdd7] mb-1.5';
const fieldCls =
  'w-full h-11 px-3.5 rounded-xl bg-white dark:bg-white/[0.05] border border-black/[0.12] dark:border-white/15 text-sm text-[#0b1d3a] dark:text-white focus:outline-none focus:border-[#2c84c4] focus:ring-2 focus:ring-[#2c84c4]/30';

/** "2027-05-20" → "20 de mayo de 2027" (sin desfase de zona horaria). */
const formatDate = (iso?: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
};

/** Texto y tono de la vigencia según la fecha de terminación. */
const describeValidity = (endDate: string) => {
  const v = calculateContractValidity(endDate);
  if (v.status === 'VENCIDO') {
    const days = Math.abs(v.daysRemaining);
    return { tone: 'expired' as const, pill: 'Vencido', headline: `Venció hace ${days} día${days === 1 ? '' : 's'}` };
  }
  if (v.status === 'POR_VENCER') {
    return {
      tone: 'soon' as const,
      pill: 'Por vencer',
      headline: v.daysRemaining === 0 ? 'Vence hoy' : `Vence en ${v.daysRemaining} día${v.daysRemaining === 1 ? '' : 's'}`,
    };
  }
  return { tone: 'ok' as const, pill: 'Vigente', headline: `${v.daysRemaining} días restantes` };
};

const pillCls = {
  expired: 'bg-red-500/12 text-red-600 dark:text-red-300 border-red-500/40',
  soon: 'bg-[#69bdd7]/20 text-[#1d5fa8] dark:text-[#69bdd7] border-[#2c84c4]/40',
  ok: 'bg-[#2c84c4]/12 text-[#1d5fa8] dark:text-[#69bdd7] border-[#2c84c4]/35',
};

export const ContractTab: React.FC<Props> = ({ dossier, isReadOnly, reviewerName }) => {
  const { saveSupplierContract } = useApp();
  const contract = dossier.contractInfo;
  const hasContract = Boolean(contract?.endDate) && contract?.contractStatus !== 'SIN_CONTRATO';

  const [isEditing, setIsEditing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [endDate, setEndDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sin contrato registrado, quien puede editar ve directamente el formulario
  const showForm = !isReadOnly && (isEditing || !hasContract);

  const openEditor = () => {
    setFile(null);
    setError('');
    setEndDate(contract?.endDate || '');
    setStartDate(contract?.startDate || '');
    setContractNumber(contract?.contractNumber || '');
    setIsEditing(true);
  };

  const pickFile = async (picked?: File) => {
    setError('');
    if (!picked) return;
    const problem = await validatePdfFile(picked);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (problem) {
      setFile(null);
      setError(problem);
      return;
    }
    setFile(picked);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!file && !contract?.fileUrl) return setError('Suba el PDF del contrato.');
    if (!endDate) return setError('Indique hasta qué fecha va el contrato.');
    if (startDate && startDate > endDate) return setError('La fecha de inicio no puede ser posterior a la fecha de terminación.');

    let fileData: { fileUrl?: string; fileName?: string; fileSize?: string; fileUploadedAt?: string; fileUploadedBy?: string } = {};
    if (file) {
      setIsSaving(true);
      const up = await storageService.uploadSupplierDocument({
        file,
        fileName: file.name,
        supplierId: dossier.id,
        fileNumber: dossier.fileNumber,
        documentCode: 'CONTRATO',
      });
      setIsSaving(false);
      if (!up.success || !up.url) return setError(`No se pudo subir el PDF${up.error ? `: ${up.error}` : '.'} Intente de nuevo.`);
      fileData = {
        fileUrl: up.url,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileUploadedAt: new Date().toLocaleString('es-CO'),
        fileUploadedBy: reviewerName,
      };
    }

    saveSupplierContract(
      dossier.id,
      {
        ...fileData,
        endDate,
        startDate: startDate || undefined,
        contractNumber: contractNumber.trim() || undefined,
        contractStatus: calculateContractValidity(endDate).status,
      },
      reviewerName
    );
    setIsEditing(false);
    setFile(null);
  };

  const preview = endDate ? describeValidity(endDate) : null;
  const current = hasContract && contract?.endDate ? describeValidity(contract.endDate) : null;

  return (
    <div id="contrato-tab" className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <span className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-action text-white grid place-items-center shadow-glow">
            <Briefcase className="w-6 h-6" />
          </span>
          <div>
            <h3 className="font-display text-xl font-semibold text-[#0b1d3a] dark:text-white">Contrato del proveedor</h3>
            <p className="text-xs text-[#3a5274] dark:text-slate-400 mt-1 max-w-2xl">
              Suba el contrato firmado en PDF y marque hasta qué fecha va. El sistema avisa 30 días antes de que venza.
            </p>
          </div>
        </div>
        {hasContract && !showForm && !isReadOnly && (
          <button
            type="button"
            onClick={openEditor}
            className="h-11 px-5 bg-gradient-action text-white font-semibold text-sm rounded-xl shadow-glow flex items-center gap-2 hover:opacity-95 transition-opacity self-start sm:self-auto cursor-pointer shrink-0"
          >
            <Pencil className="w-4 h-4" />
            <span>Actualizar contrato</span>
          </button>
        )}
      </div>

      {/* Vista: contrato registrado */}
      {hasContract && !showForm && current && (
        <div className="fs-card rounded-[24px] overflow-hidden animate-fade-up">
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/[0.07] dark:divide-white/10">
            <div className="p-5 sm:p-6">
              <span className={labelCls}>Vigencia</span>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span
                  className={`font-display text-2xl font-semibold tabular-nums ${
                    current.tone === 'expired' ? 'text-red-600 dark:text-red-300' : 'text-[#0b1d3a] dark:text-white'
                  }`}
                >
                  {current.headline}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${pillCls[current.tone]}`}>
                  {current.tone === 'expired' ? (
                    <ShieldAlert className="w-3.5 h-3.5" />
                  ) : current.tone === 'soon' ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {current.pill}
                </span>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex gap-2">
                  <dt className="w-32 shrink-0 text-[#5d7392] dark:text-slate-400">Va hasta</dt>
                  <dd className="font-semibold text-[#0b1d3a] dark:text-white">{formatDate(contract?.endDate)}</dd>
                </div>
                {contract?.startDate && (
                  <div className="flex gap-2">
                    <dt className="w-32 shrink-0 text-[#5d7392] dark:text-slate-400">Inició</dt>
                    <dd className="text-[#0b1d3a] dark:text-white">{formatDate(contract.startDate)}</dd>
                  </div>
                )}
                {contract?.contractNumber && (
                  <div className="flex gap-2">
                    <dt className="w-32 shrink-0 text-[#5d7392] dark:text-slate-400">Número</dt>
                    <dd className="font-mono text-[#0b1d3a] dark:text-white">{contract.contractNumber}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="p-5 sm:p-6">
              <span className={labelCls}>Contrato firmado (PDF)</span>
              {contract?.fileUrl ? (
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  <span className="shrink-0 w-11 h-11 rounded-xl bg-[#2c84c4]/15 text-[#1d5fa8] dark:text-[#69bdd7] grid place-items-center">
                    <FileText className="w-5 h-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#0b1d3a] dark:text-white truncate" title={contract.fileName}>
                      {contract.fileName || 'contrato.pdf'}
                    </p>
                    <p className="text-[11px] text-[#5d7392] dark:text-slate-400 truncate">
                      {[contract.fileSize, contract.fileUploadedBy && `Subido por ${contract.fileUploadedBy}`, contract.fileUploadedAt]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <a
                    href={contract.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 h-10 px-4 rounded-xl border border-[#2c84c4]/40 text-[#1d5fa8] dark:text-[#69bdd7] hover:bg-[#2c84c4]/10 text-sm font-semibold inline-flex items-center gap-2 transition-colors"
                  >
                    <Eye className="w-4 h-4" /> Ver PDF
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-[#3a5274] dark:text-slate-300">Este contrato todavía no tiene el PDF cargado.</p>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={openEditor}
                      className="h-10 px-4 rounded-xl border border-[#2c84c4]/40 text-[#1d5fa8] dark:text-[#69bdd7] hover:bg-[#2c84c4]/10 text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4" /> Subir PDF
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sin contrato y sin permiso de edición */}
      {!hasContract && isReadOnly && (
        <div className="rounded-[24px] border border-dashed border-black/15 dark:border-white/15 px-6 py-10 text-center text-sm text-[#3a5274] dark:text-slate-300">
          Este proveedor todavía no tiene un contrato registrado.
        </div>
      )}

      {/* Formulario: subir PDF y marcar la fecha */}
      {showForm && (
        <form onSubmit={handleSave} className="fs-card rounded-[24px] p-5 sm:p-6 space-y-5 animate-fade-up">
          <div>
            <span className={labelCls}>
              Contrato firmado (PDF) {!contract?.fileUrl && <span className="text-red-500">*</span>}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                pickFile(e.dataTransfer.files?.[0]);
              }}
              className={`w-full flex items-center gap-4 rounded-2xl border-2 border-dashed px-5 py-5 text-left cursor-pointer transition-colors ${
                isDragging || file
                  ? 'border-[#2c84c4] bg-[#2c84c4]/10'
                  : 'border-[#2c84c4]/40 bg-[#2c84c4]/[0.04] hover:bg-[#2c84c4]/10'
              }`}
            >
              <span className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-action text-white grid place-items-center shadow-glow">
                {file ? <FileText className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[#0b1d3a] dark:text-white truncate">
                  {file
                    ? file.name
                    : contract?.fileUrl
                    ? `Actual: ${contract.fileName || 'contrato.pdf'} — haga clic para reemplazarlo`
                    : 'Haga clic para seleccionar el PDF o arrástrelo aquí'}
                </span>
                <span className="block text-[12px] text-[#5d7392] dark:text-slate-400 mt-0.5">
                  {file ? formatFileSize(file.size) : 'Solo formato PDF · máximo 10 MB'}
                </span>
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="contrato-fin" className={labelCls}>
                Va hasta <span className="text-red-500">*</span>
              </label>
              <input
                id="contrato-fin"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={fieldCls}
              />
            </div>
            <div>
              <label htmlFor="contrato-inicio" className={labelCls}>
                Fecha de inicio <span className="normal-case tracking-normal font-normal text-[#5d7392] dark:text-slate-400">(opcional)</span>
              </label>
              <input
                id="contrato-inicio"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={fieldCls}
              />
            </div>
            <div>
              <label htmlFor="contrato-numero" className={labelCls}>
                Número de contrato <span className="normal-case tracking-normal font-normal text-[#5d7392] dark:text-slate-400">(opcional)</span>
              </label>
              <input
                id="contrato-numero"
                type="text"
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                placeholder="Ej. CT-2026-040"
                className={fieldCls}
              />
            </div>
          </div>

          {preview && (
            <p className="flex items-center gap-2 text-sm text-[#3a5274] dark:text-slate-300">
              <Calendar className="w-4 h-4 text-[#2c84c4] dark:text-[#69bdd7] shrink-0" />
              <span>
                Con esa fecha el contrato queda{' '}
                <strong className={preview.tone === 'expired' ? 'text-red-600 dark:text-red-300' : 'text-[#0b1d3a] dark:text-white'}>
                  {preview.pill.toLowerCase()}
                </strong>{' '}
                ({preview.headline.toLowerCase()}).
              </span>
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm font-semibold text-red-600 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            {hasContract && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="h-11 px-4 rounded-xl text-sm font-semibold text-[#3a5274] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="h-11 px-5 bg-gradient-action text-white font-semibold text-sm rounded-xl shadow-glow inline-flex items-center gap-2 hover:opacity-95 disabled:opacity-60 transition-opacity cursor-pointer"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving ? 'Subiendo PDF…' : 'Guardar contrato'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
