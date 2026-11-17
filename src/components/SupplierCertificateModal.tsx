import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Award, Download, Loader2, X, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SupplierDossier } from '../types';
import { getCreationStatus, isDocumentApproved } from '../utils/contractValidity';
import {
  buildCertificatePdf,
  certificateFileName,
  downloadBlob,
  imageToDataUrl,
  type CertificateInput,
} from '../utils/certificatePdf';

interface SupplierCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: SupplierDossier | null;
}

/**
 * Certificado de proveedor habilitado. Al abrirse genera el PDF, lo descarga y lo deja a la vista
 * (por si hay que volver a descargarlo). Solo se emite si el proveedor está Habilitado.
 */
export const SupplierCertificateModal: React.FC<SupplierCertificateModalProps> = ({ isOpen, onClose, dossier }) => {
  const { documentDefinitions, systemParameters, getDossierProgress, showToast } = useApp();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const fileNameRef = useRef('Certificado.pdf');

  const enabled = useMemo(() => {
    if (!dossier) return false;
    return getCreationStatus(dossier, getDossierProgress(dossier)).status === 'PROVEEDOR_HABILITADO';
  }, [dossier, getDossierProgress]);

  useEffect(() => {
    if (!isOpen || !dossier || !enabled) return;
    let cancelled = false;
    let url: string | null = null;
    setPdfUrl(null);
    setError(null);

    (async () => {
      try {
        const isNatural = dossier.basicInfo.supplierType === 'NATURAL';
        const supplierName = (isNatural ? dossier.basicInfo.fullName : dossier.basicInfo.companyName) || 'Proveedor';
        const docs = (Object.values(dossier.documents || {}) as Array<{ code?: string; name: string; status: string; expirationDate?: string }>)
          .filter((d) => isDocumentApproved(d as any))
          .map((d) => ({
            code: d.code,
            name: documentDefinitions?.find((def) => def.code === d.code)?.name || d.name,
            expirationDate: d.expirationDate,
          }));
        // Primero los formatos oficiales, luego el resto en el orden de la matriz
        const order = (code?: string) => {
          if (code === 'FS_GA_FOR_009') return -2;
          if (code === 'FS_GA_FOR_039') return -1;
          const i = (documentDefinitions || []).findIndex((d) => d.code === code);
          return i === -1 ? 9999 : i;
        };
        docs.sort((a, b) => order(a.code) - order(b.code));

        const logoDataUrl = await imageToDataUrl('/logo-flota.png');
        const input: CertificateInput = {
          companyName: systemParameters.globalSettings.companyName || 'FLOTA SUGAMUXI S.A.',
          companyNit: systemParameters.globalSettings.companyNit || '',
          supplierName,
          supplierDocLabel: isNatural ? 'C.C.' : 'NIT',
          supplierDoc: (isNatural ? dossier.basicInfo.documentNumber : dossier.basicInfo.nit) || '',
          personType: isNatural ? 'Persona natural' : 'Persona jurídica',
          category: dossier.selectedCategory || '',
          tier: dossier.supplierTier || dossier.basicInfo.supplierTier,
          fileNumber: dossier.fileNumber || dossier.id,
          dossierId: dossier.id,
          docs: docs.map(({ name, expirationDate }) => ({ name, expirationDate })),
          logoDataUrl,
        };
        const blob = await buildCertificatePdf(input);
        if (cancelled) return;
        blobRef.current = blob;
        fileNameRef.current = certificateFileName(supplierName, input.fileNumber);
        url = URL.createObjectURL(blob);
        setPdfUrl(url);
        downloadBlob(blob, fileNameRef.current);
        showToast('El certificado se descargó en su equipo.', 'success', 'CERTIFICADO');
      } catch (e) {
        if (!cancelled) setError('No se pudo generar el certificado. Intente de nuevo.');
        console.error('[certificado]', e);
      }
    })();

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, dossier?.id, enabled]);

  if (!isOpen || !dossier) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1d3a]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white dark:bg-[#0f1a30] rounded-2xl w-full max-w-5xl border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        <div className="px-5 py-3.5 flex items-center justify-between gap-3 border-b border-black/10 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-gradient-action text-white grid place-items-center shrink-0">
              <Award className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-[#0b1d3a] dark:text-white truncate">Certificado de proveedor habilitado</p>
              <p className="text-[11px] text-[#5d7392] dark:text-slate-400 truncate">{dossier.fileNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={!pdfUrl}
              onClick={() => blobRef.current && downloadBlob(blobRef.current, fileNameRef.current)}
              className="h-10 px-4 rounded-xl bg-gradient-action text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Descargar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl grid place-items-center text-[#3a5274] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-[#eef3f9] dark:bg-black/30 grid place-items-center">
          {!enabled ? (
            <div className="text-center px-6 max-w-sm">
              <ShieldAlert className="w-8 h-8 text-red-500 mx-auto" />
              <p className="mt-3 text-sm font-semibold text-[#0b1d3a] dark:text-white">El proveedor todavía no está habilitado</p>
              <p className="mt-1 text-xs text-[#5d7392] dark:text-slate-400">
                El certificado se emite cuando todos los documentos están aprobados y ninguno está vencido.
              </p>
            </div>
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-300 px-6 text-center">{error}</p>
          ) : pdfUrl ? (
            <iframe title="Certificado" src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`} className="w-full h-full border-0" />
          ) : (
            <div className="flex items-center gap-2 text-sm text-[#3a5274] dark:text-slate-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generando certificado…</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
