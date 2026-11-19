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
      <span className="w-14 h-14 rounded-2xl bg-white text-[#1d5fa8] grid place-items-center mx-auto shadow-sm border border-slate-200">
        <FileWarning className="w-7 h-7" />
      </span>
      <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl h-[96vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Encabezado: documento y acciones */}
        <div className="bg-[#0b1736] text-white px-4 sm:px-6 py-3 border-b border-blue-900/60 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-extrabold uppercase bg-blue-950 text-cyan-300 px-2 py-0.5 rounded border border-blue-700">
                  {doc.code || 'SOPORTE'}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-blue-950 text-cyan-300 border-blue-600">
                  {doc.status}
                </span>
                {doc.expirationDate && (
                  <span className="text-[11px] text-slate-300 items-center gap-1 hidden md:flex">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    Vence: {doc.expirationDate}
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white truncate mt-0.5">{documentTitle || doc.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onModifyDoc && (
              <button
                type="button"
                onClick={onModifyDoc}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 border border-slate-600 cursor-pointer"
                title="Modificar datos, vigencia o sustituir el archivo"
              >
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Modificar</span>
              </button>
            )}
            {onApproveDoc && !isApproved && (
              <button
                type="button"
                onClick={onApproveDoc}
                className="px-3 py-1.5 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 border bg-blue-700 hover:bg-blue-600 text-white border-blue-600 cursor-pointer"
                title="Aprobar documento"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aprobar</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar visor"
              aria-label="Cerrar visor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra del archivo */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 py-1.5 flex items-center justify-between gap-3 text-xs shrink-0 min-h-[38px]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-slate-700 truncate">{supplierName || 'Proveedor'}</span>
            <span className="text-slate-400">&bull;</span>
            <span className="font-mono text-slate-500 text-[11px] truncate">{fileName}</span>
            {doc.fileSize && <span className="text-slate-400 text-[11px] shrink-0">({doc.fileSize})</span>}
          </div>

          {loadState === 'ready' && kind === 'image' && (
            <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-300 shrink-0">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(z - 20, 40))}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
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
                className="font-mono text-[11px] font-bold text-slate-700 px-1 hover:text-blue-700 cursor-pointer"
                title="Restablecer"
              >
                {zoomLevel}%
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(z + 20, 300))}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                title="Acercar"
                aria-label="Acercar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-3.5 bg-slate-300 mx-0.5" />
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                title="Girar 90°"
                aria-label="Girar 90 grados"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Cuerpo: el archivo real */}
        <div className="flex-1 min-h-0 bg-slate-200/90 flex overflow-auto">
          {loadState === 'loading' && (
            <div className="m-auto flex items-center gap-2 text-sm text-slate-600">
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
                className="h-10 px-4 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
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
                  className="h-10 px-4 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
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
        <div className="bg-slate-50 px-4 sm:px-6 py-2.5 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          {loadState === 'ready' && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 disabled:opacity-60 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Descargar el archivo original"
            >
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-cyan-300" />}
              <span>Descargar</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
