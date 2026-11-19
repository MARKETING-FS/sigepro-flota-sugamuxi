import React, { useState } from 'react';
import { BadgeCheck, Eye, FileText, Loader2, ShieldCheck } from 'lucide-react';
import { SupplierDossier } from '../../types';
import { resolveFileUrl } from '../../utils/secureFile';

/** Consulta SARLAFT del expediente: el PDF que se subió al registrar al proveedor, con su aprobación */
export const SarlaftCard: React.FC<{ dossier: SupplierDossier }> = ({ dossier }) => {
  const sarlaft = dossier.internalConcepts?.sarlatfCheck;
  const [opening, setOpening] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!sarlaft?.fileUrl) return null;

  const open = async () => {
    setOpening(true);
    setFailed(false);
    // La pestaña se abre antes de pedir el enlace para que el navegador no la bloquee
    const tab = window.open('', '_blank');
    try {
      let url = await resolveFileUrl(sarlaft.fileUrl);
      // Los PDF guardados en este navegador (modo demostración) vienen como datos: se pasan a un enlace temporal
      if (url.startsWith('data:')) {
        const blob = await (await fetch(url)).blob();
        url = URL.createObjectURL(blob);
      }
      if (!url) throw new Error('sin enlace');
      if (tab) {
        tab.opener = null;
        tab.location.href = url;
      } else {
        window.location.assign(url);
      }
    } catch {
      tab?.close();
      setFailed(true);
    } finally {
      setOpening(false);
    }
  };

  return (
    <section className="fs-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <span className="grid place-items-center w-11 h-11 shrink-0 rounded-xl bg-[#e6f2f6] dark:bg-white/10 text-[#0a5473] dark:text-[#5db2c9]">
        <ShieldCheck className="w-5 h-5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold text-[#0b1d3a] dark:text-white flex items-center gap-2 flex-wrap">
          Consulta SARLAFT
          {sarlaft.approved && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0a4561] dark:text-[#5db2c9]">
              <BadgeCheck className="w-4 h-4" /> Aprobada
            </span>
          )}
        </p>
        <p className="mt-0.5 text-[13px] text-[#3a5274] dark:text-slate-400 flex items-center gap-1.5 min-w-0">
          <FileText className="w-4 h-4 shrink-0" />
          <span className="truncate">{sarlaft.fileName || 'consulta-sarlaft.pdf'}</span>
          {sarlaft.fileSize && <span className="shrink-0">· {sarlaft.fileSize}</span>}
        </p>
        {sarlaft.checkedBy && sarlaft.checkedAt && (
          <p className="mt-0.5 text-xs text-[#3a5274] dark:text-slate-400">
            Aprobada por {sarlaft.checkedBy} el {sarlaft.checkedAt}
          </p>
        )}
        {failed && <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">No se pudo abrir el PDF. Intente de nuevo.</p>}
      </div>
      <button
        type="button"
        onClick={open}
        disabled={opening}
        className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-[#d6e0ec] dark:border-white/20 bg-white dark:bg-white/5 text-sm font-semibold text-[#0b1d3a] dark:text-white hover:bg-[#eaf4f7] dark:hover:bg-white/10 cursor-pointer disabled:opacity-60"
      >
        {opening ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />} Ver PDF
      </button>
    </section>
  );
};
