import React, { useRef, useState } from 'react';
import { BadgeCheck, CheckCircle2, Clock, Eye, FileText, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { SupplierDossier } from '../../types';
import { useApp } from '../../context/AppContext';
import { supabaseService } from '../../services/supabaseService';
import { storageService } from '../../services/storageService';
import { isSafeFileUrl, resolveFileUrl } from '../../utils/secureFile';

const MAX_MB = 10;
const sizeLabel = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const nowLabel = () => {
  const n = new Date();
  const p = (v: number) => String(v).padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())} ${p(n.getHours())}:${p(n.getMinutes())}`;
};

interface Props {
  dossier: SupplierDossier;
  reviewerName: string;
  readOnly?: boolean;
}

/** Consulta SARLAFT del expediente: el PDF del registro, que se puede ver, reemplazar y aprobar. */
export const SarlaftCard: React.FC<Props> = ({ dossier, reviewerName, readOnly = false }) => {
  const { updateInternalConcepts, canEditDossier, showToast } = useApp();
  const sarlaft = dossier.internalConcepts?.sarlatfCheck;
  const inputRef = useRef<HTMLInputElement>(null);
  const [opening, setOpening] = useState(false);
  const [failed, setFailed] = useState(false);
  const [replacing, setReplacing] = useState(false);

  if (!sarlaft?.fileUrl) return null;

  const canEdit = !readOnly && canEditDossier(dossier.id);

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
      if (!url || !isSafeFileUrl(url)) throw new Error('sin enlace');
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

  const replaceWith = async (file?: File | null) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
      showToast('El archivo debe ser un PDF.', 'warning', 'ARCHIVO NO VÁLIDO');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      showToast(`El PDF pesa ${sizeLabel(file.size)}: el máximo es ${MAX_MB} MB.`, 'warning', 'ARCHIVO MUY PESADO');
      return;
    }
    setReplacing(true);
    try {
      // Mismo guardado del registro: almacén privado, o el navegador en modo demostración
      let url = '';
      if (supabaseService.isConfigured()) {
        const up = await storageService.uploadSupplierDocument({
          file,
          fileName: file.name,
          supplierId: dossier.id,
          fileNumber: dossier.fileNumber,
          documentCode: 'CONSULTA_SARLAFT',
        });
        if (!up.success || !up.url) {
          showToast(`No se pudo guardar el PDF${up.error ? `: ${up.error}` : ''}. Intente de nuevo.`, 'error', 'ERROR AL SUBIR');
          return;
        }
        url = up.url;
      } else {
        url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('lectura'));
          reader.readAsDataURL(file);
        });
      }
      // El archivo nuevo queda por aprobar: hasta entonces la consulta no cuenta como buena
      updateInternalConcepts(dossier.id, {
        sarlatfCheck: {
          ...sarlaft,
          checked: true,
          result: 'PENDIENTE',
          approved: false,
          fileName: file.name,
          fileSize: sizeLabel(file.size),
          fileUrl: url,
          checkedBy: reviewerName,
          checkedAt: nowLabel(),
          notes: `Archivo reemplazado por ${reviewerName}. Pendiente de aprobación.`,
        },
      });
      showToast('Archivo reemplazado. Revíselo y pulse «Aprobar» para que cuente.', 'success', 'SARLAFT');
    } catch {
      showToast('No se pudo leer el PDF. Intente de nuevo.', 'error', 'ERROR AL SUBIR');
    } finally {
      setReplacing(false);
    }
  };

  const approve = () => {
    updateInternalConcepts(dossier.id, {
      sarlatfCheck: {
        ...sarlaft,
        checked: true,
        result: 'SIN_COINCIDENCIAS',
        approved: true,
        checkedBy: reviewerName,
        checkedAt: nowLabel(),
        notes: 'Consulta SARLAFT revisada y aprobada.',
      },
    });
    showToast('Consulta SARLAFT aprobada.', 'success', 'SARLAFT');
  };

  const btn =
    'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-[#d6e0ec] dark:border-white/20 bg-white dark:bg-white/5 text-sm font-semibold text-[#0b1d3a] dark:text-white hover:bg-[#eef5fc] dark:hover:bg-white/10 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';

  return (
    <section className="fs-card rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4">
      <span className="grid place-items-center w-11 h-11 shrink-0 rounded-xl bg-[#eaf2fb] dark:bg-white/10 text-[#1d5fa8] dark:text-[#69bdd7]">
        <ShieldCheck className="w-5 h-5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold text-[#0b1d3a] dark:text-white flex items-center gap-2 flex-wrap">
          Consulta SARLAFT
          {sarlaft.approved ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0f3d75] dark:text-[#69bdd7]">
              <BadgeCheck className="w-4 h-4" /> Aprobada
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#3a5274] dark:text-slate-300">
              <Clock className="w-4 h-4" /> Pendiente de aprobar
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
            {sarlaft.approved ? 'Aprobada' : 'Archivo cargado'} por {sarlaft.checkedBy} el {sarlaft.checkedAt}
          </p>
        )}
        {failed && <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">No se pudo abrir el PDF. Intente de nuevo.</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button type="button" onClick={open} disabled={opening} className={btn}>
          {opening ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />} Ver PDF
        </button>
        {canEdit && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => {
                replaceWith(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <button type="button" onClick={() => inputRef.current?.click()} disabled={replacing} className={btn}>
              {replacing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Reemplazar archivo
            </button>
            {!sarlaft.approved && (
              <button
                type="button"
                onClick={approve}
                disabled={replacing}
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-gradient-action text-white text-sm font-semibold shadow-glow hover:brightness-110 cursor-pointer disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" /> Aprobar
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
};
