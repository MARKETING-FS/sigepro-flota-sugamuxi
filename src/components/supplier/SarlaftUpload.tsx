import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, BadgeCheck, Eye, FileText, RefreshCw, ShieldCheck, Upload, X } from 'lucide-react';

export const SARLAFT_MAX_MB = 10;

const formatSize = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(2).replace('.', ',')} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

interface Props {
  file: File | null;
  approved: boolean;
  error?: string;
  onFile: (file: File | null) => void;
  onApprove: () => void;
  onNotice: (msg: string) => void;
}

/**
 * Consulta SARLAFT: se sube el PDF, se puede ver o reemplazar, y solo con "Aprobar" deja registrar al proveedor.
 */
export const SarlaftUpload: React.FC<Props> = ({ file, approved, error, onFile, onApprove, onNotice }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [viewing, setViewing] = useState(false);

  const url = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url]
  );
  useEffect(() => {
    if (!viewing) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setViewing(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewing]);

  const pick = (f?: File | null) => {
    if (!f) return;
    const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
    if (!isPdf) {
      onNotice('El archivo debe ser un PDF.');
      return;
    }
    if (f.size > SARLAFT_MAX_MB * 1024 * 1024) {
      onNotice(`El PDF pesa ${formatSize(f.size)}: el máximo es ${SARLAFT_MAX_MB} MB.`);
      return;
    }
    onFile(f);
  };

  return (
    <div data-field="sarlaft" tabIndex={-1} className="outline-none">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          className={`w-full rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a5473] ${
            error
              ? 'border-red-500 bg-red-50/60 dark:bg-red-950/20'
              : dragging
              ? 'border-[#0a5473] bg-[#e6f2f6] dark:bg-[#0b3347]'
              : 'border-[#b9c8dc] dark:border-white/25 bg-[#f6f9fd] dark:bg-white/[0.03] hover:border-[#0a5473] hover:bg-[#e6f2f6] dark:hover:bg-[#0b3347]'
          }`}
        >
          <span className="mx-auto mb-3 grid place-items-center w-12 h-12 rounded-2xl bg-white dark:bg-white/10 text-[#0a5473] dark:text-[#5db2c9] shadow-sm">
            <Upload className="w-6 h-6" strokeWidth={1.8} />
          </span>
          <span className="block text-[15px] font-semibold text-[#0b1d3a] dark:text-white">Suba el PDF de la consulta SARLAFT</span>
          <span className="block mt-1 text-[13px] text-[#3a5274] dark:text-slate-400">
            Arrastre el archivo hasta aquí o haga clic para elegirlo · PDF de hasta {SARLAFT_MAX_MB} MB
          </span>
        </button>
      ) : (
        <div
          className={`rounded-2xl border p-4 sm:p-5 ${
            error ? 'border-red-500 bg-red-50/60 dark:bg-red-950/20' : approved ? 'border-[#0a5473] bg-[#e6f2f6] dark:bg-[#0b3347] dark:border-[#5ec3eb]' : 'border-[#d9e3ef] dark:border-white/15 bg-white dark:bg-white/[0.03]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <span className="grid place-items-center w-12 h-12 shrink-0 rounded-xl bg-[#e6f2f6] dark:bg-white/10 text-[#0a5473] dark:text-[#5db2c9]">
                <FileText className="w-6 h-6" strokeWidth={1.7} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-[#0b1d3a] dark:text-white" title={file.name}>
                  {file.name}
                </p>
                <p className="text-[13px] text-[#3a5274] dark:text-slate-400">PDF · {formatSize(file.size)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setViewing(true)}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-[#d6e0ec] dark:border-white/20 bg-white dark:bg-white/5 text-sm font-semibold text-[#0b1d3a] dark:text-white hover:bg-[#eaf4f7] dark:hover:bg-white/10 cursor-pointer"
              >
                <Eye className="w-4 h-4" /> Ver
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-[#d6e0ec] dark:border-white/20 bg-white dark:bg-white/5 text-sm font-semibold text-[#0b1d3a] dark:text-white hover:bg-[#eaf4f7] dark:hover:bg-white/10 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Reemplazar
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#d9e3ef] dark:border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {approved ? (
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#0a4561] dark:text-[#5db2c9]">
                <BadgeCheck className="w-5 h-5" /> Consulta aprobada: sin coincidencias en las listas.
              </p>
            ) : (
              <p className="text-[13px] text-[#3a5274] dark:text-slate-300">Revise el PDF y apruebe la consulta para poder registrar al proveedor.</p>
            )}
            {!approved && (
              <button
                type="button"
                onClick={onApprove}
                className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[#0a4561] hover:bg-[#0b455c] dark:bg-[#1a8bb0] dark:hover:bg-[#37b5e6] text-white text-[15px] font-bold cursor-pointer shadow-[0_6px_14px_-8px_rgba(10,69,97,0.9)]"
              >
                <ShieldCheck className="w-5 h-5" /> Aprobar
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 flex items-start gap-1.5 text-[13px] font-semibold text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          <span>{error}</span>
        </p>
      )}

      {viewing && file && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6 bg-[#0b1d3a]/70 backdrop-blur-sm" onClick={() => setViewing(false)}>
          <div
            role="dialog"
            aria-label={`Vista del PDF ${file.name}`}
            className="flex flex-col w-full max-w-5xl h-[90vh] rounded-2xl overflow-hidden bg-white dark:bg-[#0a2c40] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[#e3eaf3] dark:border-white/15">
              <p className="truncate text-sm font-semibold text-[#0b1d3a] dark:text-white">{file.name}</p>
              <button
                type="button"
                onClick={() => setViewing(false)}
                aria-label="Cerrar"
                className="grid place-items-center w-9 h-9 rounded-lg hover:bg-[#eaf4f7] dark:hover:bg-white/10 text-[#0b1d3a] dark:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <iframe title="Consulta SARLAFT" src={url} className="flex-1 w-full bg-[#eef2f7]" />
          </div>
        </div>
      )}
    </div>
  );
};
