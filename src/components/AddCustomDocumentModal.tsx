import React, { useMemo, useRef, useState } from 'react';
import { FilePlus, FileUp, Layers, Trash2, Zap, X, Loader2, AlertCircle } from 'lucide-react';
import { generateDocumentCodeSuggestions } from '../utils/documentCodeGenerator';
import { calculateDocumentExpiration } from '../utils/contractValidity';
import { supabaseService } from '../services/supabaseService';
import { storageService } from '../services/storageService';
import { DocumentDefinition, SupplierDocument, UserRole } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dossierId: string;
  fileNumber?: string;
  supplierName?: string;
  /** Categoría del proveedor: el documento queda exigido a todos los que la tengan */
  categoryName?: string;
  userRole?: UserRole;
  reviewerName?: string;
  /** Códigos que ya existen (expediente y Parametrización) */
  takenCodes: string[];
  onAnnex: (
    definition: DocumentDefinition,
    mandatory: boolean,
    doc: SupplierDocument,
    justification: string
  ) => Promise<{ success: boolean; message: string }>;
}

const DIMENSIONS: { value: DocumentDefinition['category']; label: string }[] = [
  { value: 'LEGAL', label: 'Legal y Estatutario' },
  { value: 'FINANCIERO', label: 'Financiero y Tributario' },
  { value: 'TECNICO', label: 'Técnico y Operativo' },
  { value: 'HSEQ', label: 'HSEQ / Seguridad y Salud' },
  { value: 'SARLAFT', label: 'SARLAFT / Cumplimiento' },
  { value: 'OPERATIVO', label: 'Operativo / Flota' },
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const inputCls =
  'w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 text-[#0b1d3a] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0f6b8f]';
const labelCls = 'block text-xs font-bold text-[#0b1d3a] dark:text-white mb-1';

export const AddCustomDocumentModal: React.FC<Props> = (props) => {
  if (!props.isOpen) return null;
  return <AddCustomDocumentForm {...props} />;
};

const AddCustomDocumentForm: React.FC<Props> = ({
  onClose,
  dossierId,
  fileNumber = '',
  supplierName,
  categoryName,
  userRole = 'REVISOR',
  reviewerName = 'Evaluador SIG',
  takenCodes,
  onAnnex,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isCodeCustomized, setIsCodeCustomized] = useState(false);
  const [dimension, setDimension] = useState<DocumentDefinition['category']>('LEGAL');
  const [validityRule, setValidityRule] = useState('');
  const [description, setDescription] = useState('');
  const [requiresExp, setRequiresExp] = useState(false);
  const [mandatory, setMandatory] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [expirationDate, setExpirationDate] = useState('');
  const [justification, setJustification] = useState('Documento complementario solicitado por la administración.');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanCode = useMemo(() => code.trim().toUpperCase().replace(/\s+/g, '_'), [code]);
  const codeTaken = cleanCode !== '' && takenCodes.some((c) => c.toUpperCase() === cleanCode);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isCodeCustomized) setCode(generateDocumentCodeSuggestions(val).primary);
  };

  const pickFile = (f: File | undefined) => {
    setError(null);
    if (!f) return;
    if (f.size > MAX_FILE_SIZE_BYTES) {
      setError(`El archivo "${f.name}" pesa ${(f.size / (1024 * 1024)).toFixed(2)} MB y supera el máximo de 5 MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setFile(f);
  };

  const clearFile = () => {
    setFile(null);
    setExpirationDate('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatSize = (bytes: number) =>
    bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !cleanCode) {
      setError('Escriba el nombre y el código del documento.');
      return;
    }
    if (codeTaken) {
      setError(`Ya existe un documento con el código ${cleanCode}. Use otro código.`);
      return;
    }
    if (file && requiresExp && !expirationDate) {
      setError('Este documento exige fecha de vencimiento: indique hasta cuándo es válido el archivo.');
      return;
    }
    if (!justification.trim()) {
      setError('Escriba el motivo para dejar registro en la auditoría.');
      return;
    }

    setSaving(true);
    try {
      // El archivo se guarda en el almacén privado (o queda en este navegador en modo demostración)
      let fileUrl: string | undefined;
      if (file) {
        if (supabaseService.isConfigured()) {
          const res = await storageService.uploadSupplierDocument({
            file,
            fileName: file.name,
            supplierId: dossierId || 'sin-expediente',
            fileNumber,
            documentCode: cleanCode,
          });
          if (!res.success || !res.url) {
            setError(`No se pudo guardar el archivo${res.error ? `: ${res.error}` : ''}. Intente de nuevo.`);
            return;
          }
          fileUrl = res.url;
        } else {
          fileUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('lectura'));
            reader.readAsDataURL(file);
          });
        }
      }

      const expired = Boolean(file && requiresExp && expirationDate && calculateDocumentExpiration(expirationDate).status === 'VENCIDO');
      const today = new Date().toISOString().split('T')[0];
      const definition: DocumentDefinition = {
        code: cleanCode,
        name: name.trim(),
        category: dimension,
        description: description.trim() || 'Documento soporte SIG.',
        validityRule: validityRule.trim() || 'Vigente.',
        requiresExpirationDate: requiresExp,
        isActive: true,
        suggestedFileTypes: ['PDF'],
      };
      const doc: SupplierDocument = {
        id: `doc-${dossierId}-${cleanCode.toLowerCase()}`,
        code: cleanCode,
        name: name.trim(),
        isRequired: mandatory,
        isInstitutionalForm: false,
        status: !file ? 'PENDIENTE' : expired ? 'VENCIDO' : 'CARGADO',
        fileName: file?.name,
        fileSize: file ? formatSize(file.size) : undefined,
        customUrl: fileUrl,
        uploadedAt: file ? today : undefined,
        uploadedBy: file ? reviewerName : undefined,
        expirationDate: file && requiresExp ? expirationDate || undefined : undefined,
        notes: '',
      };

      const result = await onAnnex(definition, mandatory, doc, justification.trim());
      if (!result.success) {
        setError(result.message);
        return;
      }
      onClose();
    } catch {
      setError('No se pudo anexar el documento. Intente de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = userRole === 'ADMIN' ? 'Administrador' : 'Revisor';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
      <div className="fs-card rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-[#0f6b8f]/10 dark:bg-[#0b1329] text-[#0b1d3a] dark:text-white px-5 sm:px-6 py-4 border-b border-black/10 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex w-10 h-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f6b8f] to-[#5db2c9] text-white">
              <FilePlus className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase bg-blue-600 px-2 py-0.5 rounded text-white">
                Nuevo requisito &bull; {roleLabel}
              </span>
              <h3 className="text-sm sm:text-base font-bold mt-1 truncate">Anexar documento</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-[#3a5274] dark:text-slate-300 hover:text-[#0b1d3a] dark:hover:text-white p-2 rounded-lg hover:bg-black/5 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs text-[#3a5274] dark:text-slate-300">
            <div className="flex items-start gap-2.5 rounded-xl border border-[#0f6b8f]/30 bg-[#0f6b8f]/10 px-3.5 py-3 text-[#0a5473] dark:text-[#5db2c9]">
              <Layers className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {categoryName ? (
                  <>
                    Se guarda en <strong>Parametrización</strong> y se suma a la categoría <strong>«{categoryName}»</strong>: los
                    proveedores nuevos de esa categoría también lo van a pedir.
                  </>
                ) : (
                  <>
                    Este proveedor no tiene categoría, así que el documento queda en <strong>Parametrización</strong> y en este
                    expediente, sin unirse a ninguna categoría.
                  </>
                )}
                {supplierName ? <span className="block mt-0.5 opacity-80">Proveedor: {supplierName}</span> : null}
              </p>
            </div>

            <div>
              <label className={labelCls} htmlFor="annex-name">
                Nombre institucional del documento *
              </label>
              <input
                id="annex-name"
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ej. Certificado de Calidad ISO 9001 (ISO)"
                className={inputCls}
                autoFocus
                required
              />
              <p className="text-[10px] text-[#5d7392] dark:text-slate-400 mt-1">
                Si lo termina con una sigla entre paréntesis, esa sigla será el código.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#0b1d3a] dark:text-white" htmlFor="annex-code">
                    Código técnico (único) *
                  </label>
                  {isCodeCustomized ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCodeCustomized(false);
                        setCode(generateDocumentCodeSuggestions(name).primary);
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0a5473] dark:text-[#5db2c9] hover:underline cursor-pointer"
                    >
                      <Zap className="w-2.5 h-2.5" />
                      Autocalcular
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 rounded text-[10px] font-bold bg-[#0f6b8f]/12 text-[#0a5473] dark:text-[#5db2c9] border border-[#0f6b8f]/35">
                      <Zap className="w-2.5 h-2.5" />
                      Automático
                    </span>
                  )}
                </div>
                <input
                  id="annex-code"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'));
                    setIsCodeCustomized(true);
                  }}
                  placeholder="Ej. ISO"
                  className={`${inputCls} font-mono font-bold tracking-wider uppercase ${codeTaken ? 'border-red-500 focus:ring-red-500' : ''}`}
                  required
                />
                {codeTaken && (
                  <p className="text-[11px] font-semibold text-red-600 dark:text-red-300 mt-1">
                    Ya existe un documento con este código.
                  </p>
                )}
              </div>

              <div>
                <label className={labelCls} htmlFor="annex-dimension">
                  Tipo / dimensión SIG *
                </label>
                <select
                  id="annex-dimension"
                  value={dimension}
                  onChange={(e) => setDimension(e.target.value as DocumentDefinition['category'])}
                  className={inputCls}
                >
                  {DIMENSIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls} htmlFor="annex-validity">
                Regla de vigencia / validez
              </label>
              <input
                id="annex-validity"
                type="text"
                value={validityRule}
                onChange={(e) => setValidityRule(e.target.value)}
                placeholder="Ej. Expedición no mayor a 30 días calendario"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls} htmlFor="annex-description">
                Descripción y finalidad en el SIG
              </label>
              <textarea
                id="annex-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Para qué se pide y qué debe verificarse en el documento…"
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className={labelCls}>En esta categoría el documento es</span>
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05]">
                  {[
                    { v: true, l: 'Obligatorio' },
                    { v: false, l: 'Opcional' },
                  ].map((o) => (
                    <button
                      key={o.l}
                      type="button"
                      onClick={() => setMandatory(o.v)}
                      aria-pressed={mandatory === o.v}
                      className={`h-9 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        mandatory === o.v
                          ? 'bg-gradient-to-r from-[#0f6b8f] to-[#5db2c9] text-white shadow-sm'
                          : 'text-[#3a5274] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
                      }`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className={labelCls}>Fecha de vencimiento</span>
                <label className="flex items-center gap-2.5 h-[46px] px-3 rounded-xl border border-black/10 dark:border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresExp}
                    onChange={(e) => setRequiresExp(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="font-semibold text-[#0b1d3a] dark:text-white leading-tight">Este documento vence</span>
                </label>
              </div>
            </div>

            {/* Archivo */}
            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#0b1d3a] dark:text-white">Archivo del proveedor (opcional)</span>
                <span className="text-[10px] font-semibold text-[#5d7392] dark:text-slate-400">PDF o imagen · máx. 5 MB</span>
              </div>
              {file ? (
                <div className="flex items-center justify-between gap-3 rounded-lg bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 px-3 py-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0b1d3a] dark:text-white truncate">{file.name}</p>
                    <p className="text-[10px] text-[#5d7392] dark:text-slate-400">{formatSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    aria-label="Quitar archivo"
                    className="p-1.5 rounded-lg text-[#3a5274] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 h-11 rounded-lg border border-dashed border-[#0f6b8f]/50 text-[#0a5473] dark:text-[#5db2c9] font-semibold hover:bg-[#0f6b8f]/10 transition-colors cursor-pointer">
                  <FileUp className="w-4 h-4" />
                  Elegir archivo
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => pickFile(e.target.files?.[0])}
                  />
                </label>
              )}
              {!file && (
                <p className="text-[10px] text-[#5d7392] dark:text-slate-400">
                  Si no lo tiene a la mano, el documento queda como pendiente de cargar en el expediente.
                </p>
              )}
              {file && requiresExp && (
                <div>
                  <label className={labelCls} htmlFor="annex-exp">
                    Fecha de vencimiento del archivo *
                  </label>
                  <input
                    id="annex-exp"
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className={`${inputCls} font-mono`}
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <label className={labelCls} htmlFor="annex-reason">
                Motivo de la inclusión *
              </label>
              <textarea
                id="annex-reason"
                rows={2}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Por qué se anexa este requisito…"
                className={inputCls}
                required
              />
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-300/60 bg-red-50 dark:bg-red-500/10 px-3.5 py-3 text-red-700 dark:text-red-300 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl text-[#3a5274] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || codeTaken}
              className="h-11 px-5 bg-gradient-action text-white font-bold text-xs rounded-xl shadow-glow inline-flex items-center gap-2 hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FilePlus className="w-4 h-4" />}
              {saving ? 'Guardando…' : 'Anexar documento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
