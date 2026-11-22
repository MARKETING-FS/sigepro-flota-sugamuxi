import React, { useEffect, useState } from 'react';
import { FileText, Download, X, CheckCircle2, Calendar, ZoomIn, ZoomOut, RotateCw, Edit3, Loader2, FileWarning } from 'lucide-react';
import { SupplierDocument } from '../types';
import { downloadFile, fileKind, resolveFileUrl } from '../utils/secureFile';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: SupplierDocument | null;
  documentTitle?: string;
  supplierName?: string;
  nitOrDoc?: string;
  onModifyDoc?: () => void;
  onRequestCorrection?: () => void;
  onApproveDoc?: () => void;
}

type LoadState = 'loading' | 'ready' | 'missing' | 'denied';

/**
 * Visor del archivo real de un documento del expediente.
 * El archivo vive en un almacén privado: se abre con un enlace temporal que solo se entrega con sesión iniciada.
 */
export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  documentTitle = '',
  supplierName = '',
  onModifyDoc,
  onApproveDoc,
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [viewUrl, setViewUrl] = useState('');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [isDownloading, setIsDownloading] = useState(false);

  const storedUrl = doc?.customUrl || doc?.previewUrl || '';

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setZoomLevel(100);
    setRotation(0);
    setViewUrl('');
    if (!storedUrl) {
      setLoadState('missing');
      return;
    }
    setLoadState('loading');
    resolveFileUrl(storedUrl).then((url) => {
      if (cancelled) return;
      setViewUrl(url);
      setLoadState(url ? 'ready' : 'denied');
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, storedUrl]);

  if (!isOpen || !doc) return null;

  const fileName = doc.fileName || `${doc.code || 'documento'}.pdf`;
  const kind = fileKind(fileName, storedUrl);
  const isApproved = doc.status === 'APROBADO';

  const handleDownload = async () => {
    setIsDownloading(true);
    await downloadFile(storedUrl, fileName);
    setIsDownloading(false);
  };

  const notice = (title: string, text: string, action?: React.ReactNode) => (
    <div className="m-auto max-w-md text-center px-6 py-10">
      <span className="w-14 h-14 rounded-2xl bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] grid place-items-center mx-auto border border-[#2c84c4]/25">
        <FileWarning className="w-7 h-7" />
      </span>
      <h3 className="mt-4 font-display text-base font-semibold text-[#0b1d3a] dark:text-white">{title}</h3>
      <p className="mt-1.5 text-sm text-[#3a5274] dark:text-slate-300 leading-relaxed">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="fs-card rounded-2xl w-full max-w-6xl h-[96vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Encabezado: documento y acciones */}
        <div className="px-4 sm:px-6 py-3 border-b border-[#d9e3ef] dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2c84c4] to-[#69bdd7] text-white flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-extrabold uppercase bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] px-2 py-0.5 rounded border border-[#2c84c4]/25">
                  {doc.code || 'SOPORTE'}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] border-[#2c84c4]/25">
                  {doc.status}
                </span>
                {doc.expirationDate && (
                  <span className="text-[11px] text-[#3a5274] dark:text-slate-300 items-center gap-1 hidden md:flex">
                    <Calendar className="w-3.5 h-3.5 text-[#2c84c4] dark:text-[#69bdd7]" />
                    Vence: {doc.expirationDate}
                  </span>
                )}
              </div>
              <h2 className="font-display text-sm sm:text-base font-semibold text-[#0b1d3a] dark:text-white truncate mt-0.5">{documentTitle || doc.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onModifyDoc && (
              <button
                type="button"
                onClick={onModifyDoc}
                className="h-9 px-3 border border-[#d9e3ef] dark:border-white/15 bg-white dark:bg-white/5 hover:bg-[#eef5fc] dark:hover:bg-white/10 text-[#1c3354] dark:text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Modificar datos, vigencia o sustituir el archivo"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#2c84c4] dark:text-[#69bdd7]" />
                <span className="hidden sm:inline">Modificar</span>
              </button>
            )}
            {onApproveDoc && !isApproved && (
              <button
                type="button"
                onClick={onApproveDoc}
                className="h-9 px-3.5 font-semibold text-xs rounded-xl transition-opacity flex items-center gap-1.5 bg-gradient-action text-white shadow-glow hover:opacity-95 cursor-pointer"
                title="Aprobar documento"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aprobar</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#3a5274] dark:text-slate-300 hover:text-[#0b1d3a] dark:hover:text-white rounded-xl hover:bg-[#eef5fc] dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar visor"
              aria-label="Cerrar visor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra del archivo */}
        <div className="bg-[#f4f8fc] dark:bg-white/[0.04] border-b border-[#d9e3ef] dark:border-white/10 px-4 sm:px-6 py-1.5 flex items-center justify-between gap-3 text-xs shrink-0 min-h-[38px]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-[#1c3354] dark:text-white truncate">{supplierName || 'Proveedor'}</span>
            <span className="text-[#5d7392] dark:text-slate-400">&bull;</span>
            <span className="font-mono text-[#5d7392] dark:text-slate-300 text-[11px] truncate">{fileName}</span>
            {doc.fileSize && <span className="text-[#5d7392] dark:text-slate-400 text-[11px] shrink-0">({doc.fileSize})</span>}
          </div>

          {loadState === 'ready' && kind === 'image' && (
            <div className="flex items-center gap-1 bg-white dark:bg-white/5 px-2 py-0.5 rounded-lg border border-[#d9e3ef] dark:border-white/15 shrink-0">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(z - 20, 40))}
                className="p-1 text-[#3a5274] dark:text-slate-300 hover:text-[#0b1d3a] dark:hover:text-white hover:bg-[#eef5fc] dark:hover:bg-white/10 rounded cursor-pointer"
                title="Alejar"
                aria-label="Alejar"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoomLevel(100);
                  setRotation(0);
                }}
                className="font-mono text-[11px] font-bold text-[#1c3354] dark:text-white px-1 hover:text-[#1d5fa8] cursor-pointer"
                title="Restablecer"
              >
                {zoomLevel}%
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(z + 20, 300))}
                className="p-1 text-[#3a5274] dark:text-slate-300 hover:text-[#0b1d3a] dark:hover:text-white hover:bg-[#eef5fc] dark:hover:bg-white/10 rounded cursor-pointer"
                title="Acercar"
                aria-label="Acercar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-3.5 bg-[#d9e3ef] dark:bg-white/20 mx-0.5" />
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1 text-[#3a5274] dark:text-slate-300 hover:text-[#0b1d3a] dark:hover:text-white hover:bg-[#eef5fc] dark:hover:bg-white/10 rounded cursor-pointer"
                title="Girar 90°"
                aria-label="Girar 90 grados"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Cuerpo: el archivo real */}
        <div className="flex-1 min-h-0 bg-[#e6edf6] dark:bg-[#050f26] flex overflow-auto">
          {loadState === 'loading' && (
            <div className="m-auto flex items-center gap-2 text-sm text-[#3a5274] dark:text-slate-300">
              <Loader2 className="w-5 h-5 animate-spin" /> Abriendo documento…
            </div>
          )}

          {loadState === 'ready' && kind === 'pdf' && (
            <iframe key={viewUrl} src={viewUrl} title={documentTitle || doc.name} className="w-full h-full bg-white" />
          )}

          {loadState === 'ready' && kind === 'image' && (
            <div className="m-auto p-6">
              <img
                src={viewUrl}
                alt={documentTitle || doc.name}
                className="max-w-full rounded-lg shadow-2xl border border-slate-300 bg-white"
                style={{ transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`, transition: 'transform 0.15s ease-out' }}
              />
            </div>
          )}

          {loadState === 'ready' &&
            kind === 'other' &&
            notice(
              'Este tipo de archivo no se puede ver aquí',
              'Los archivos de Word y Excel no tienen vista previa. Descárguelo para abrirlo en su equipo.',
              <button
                type="button"
                onClick={handleDownload}
                className="h-10 px-4 rounded-xl bg-gradient-action text-white shadow-glow hover:opacity-95 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Descargar archivo
              </button>
            )}

          {loadState === 'missing' &&
            notice(
              'Este documento no tiene el archivo guardado',
              'Solo quedó registrado el nombre del archivo, no el archivo en sí. Hay que volver a cargarlo para poder verlo.',
              onModifyDoc && (
                <button
                  type="button"
                  onClick={onModifyDoc}
                  className="h-10 px-4 rounded-xl bg-gradient-action text-white shadow-glow hover:opacity-95 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" /> Cargar el archivo
                </button>
              )
            )}

          {loadState === 'denied' &&
            notice(
              'No se pudo abrir el archivo',
              'Los documentos solo se abren con la sesión iniciada. Si su sesión venció, vuelva a iniciar sesión e inténtelo de nuevo.'
            )}
        </div>

        {/* Pie */}
        <div className="bg-[#f4f8fc] dark:bg-white/[0.04] px-4 sm:px-6 py-3 border-t border-[#d9e3ef] dark:border-white/10 flex items-center justify-end gap-2 shrink-0">
          {loadState === 'ready' && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="h-10 px-4 bg-gradient-action text-white shadow-glow hover:opacity-95 disabled:opacity-60 font-semibold text-sm rounded-xl transition-opacity flex items-center gap-2 cursor-pointer"
              title="Descargar el archivo original"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Descargar</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 border border-[#b9c9dd] dark:border-white/25 bg-white dark:bg-white/10 hover:bg-[#eef5fc] dark:hover:bg-white/15 text-[#0b1d3a] dark:text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
