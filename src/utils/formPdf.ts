import { InstitutionalForm } from '../types';

/** PDF oficiales que vienen con el sistema (carpeta public/formatos). */
export const DEFAULT_FORM_PDFS: Record<string, string> = {
  'FS.GA-FOR-009': '/formatos/FS.GA-FOR-009.pdf',
  'FS.GA-FOR-039': '/formatos/FS.GA-FOR-039.pdf',
};

/** Versión de cada formato a la que corresponde el PDF oficial entregado con el sistema. */
const DEFAULT_FORM_PDF_VERSION: Record<string, string> = {
  'FS.GA-FOR-009': '14.0',
  'FS.GA-FOR-039': '1.0',
};

export interface FormPdf {
  url: string;
  fileName: string;
  version: string;
}

/**
 * PDF de una versión del formato. Sin versión indicada devuelve el de la versión vigente.
 * Si la versión vigente no tiene archivo propio se usa el PDF oficial entregado con el sistema.
 */
export const getFormPdf = (form: InstitutionalForm, version?: string): FormPdf | null => {
  const hist = form.versionHistory.find((h) => (version ? h.version === version : h.isActive));
  if (hist?.fileUrl) {
    return { url: hist.fileUrl, fileName: hist.fileName || `${form.code}_v${hist.version}.pdf`, version: hist.version };
  }
  const fallback = DEFAULT_FORM_PDFS[form.code];
  if (fallback && hist && hist.version === DEFAULT_FORM_PDF_VERSION[form.code]) {
    return { url: fallback, fileName: `${form.code}.pdf`, version: hist.version };
  }
  return null;
};

export const MAX_FORM_PDF_BYTES = 10 * 1024 * 1024;

/** Solo PDF reales: extensión, tipo y firma "%PDF-" al inicio del archivo. Devuelve el motivo del rechazo o ''. */
export const validatePdfFile = async (file: File): Promise<string> => {
  if (!/\.pdf$/i.test(file.name)) return 'Solo se permiten archivos con extensión .pdf.';
  if (file.type && file.type !== 'application/pdf') return 'El archivo no es un PDF.';
  if (file.size === 0) return 'El archivo está vacío.';
  if (file.size > MAX_FORM_PDF_BYTES) return 'El PDF pesa más de 10 MB.';
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const sig = String.fromCharCode(...head);
  if (sig !== '%PDF-') return 'El archivo no es un PDF válido.';
  return '';
};

export const formatFileSize = (bytes: number): string =>
  bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : `${Math.round(bytes / 1024)} KB`;
