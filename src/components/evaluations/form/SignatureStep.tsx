import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, PenLine, Save, Trash2, X, Loader2, History } from 'lucide-react';
import { SignaturePad, SignaturePadHandle } from './SignaturePad';
import { chipOff, chipOn, focusRing } from './formStyles';
import {
  clearSavedSignature,
  imageFileToSignature,
  loadSavedSignature,
  saveSignature,
} from '../../../utils/signature';

interface SignatureStepProps {
  evaluatorName: string;
  /** Identifica a la persona para recordar su firma en este equipo */
  userKey: string;
  /** Firma elegida (PNG) o null si se sigue sin firma */
  onConfirm: (signature: string | null) => void;
  onCancel: () => void;
}

type Mode = 'draw' | 'upload' | 'saved';

/** Paso previo a generar el PDF: la persona dibuja su firma o sube una imagen. */
export const SignatureStep: React.FC<SignatureStepProps> = ({ evaluatorName, userKey, onConfirm, onCancel }) => {
  const [saved, setSaved] = useState<string | null>(() => loadSavedSignature(userKey));
  const [mode, setMode] = useState<Mode>(saved ? 'saved' : 'draw');
  const [hasInk, setHasInk] = useState(false);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(false);
  const padRef = useRef<SignaturePadHandle>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onCancel]);

  const ready = mode === 'draw' ? hasInk : mode === 'upload' ? !!uploaded : !!saved;

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setBusy(true);
    try {
      setUploaded(await imageFileToSignature(file));
    } catch (e: any) {
      setUploaded(null);
      setUploadError(e?.message || 'No se pudo leer la imagen.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const confirm = () => {
    const png = mode === 'draw' ? padRef.current?.toPng() ?? null : mode === 'upload' ? uploaded : saved;
    if (!png) return;
    if (mode !== 'saved' && remember) saveSignature(userKey, png);
    onConfirm(png);
  };

  const tabs: { id: Mode; label: string; icon: React.ReactNode }[] = [
    ...(saved ? [{ id: 'saved' as Mode, label: 'Mi firma guardada', icon: <History className="w-4 h-4" /> }] : []),
    { id: 'draw' as Mode, label: 'Dibujar', icon: <PenLine className="w-4 h-4" /> },
    { id: 'upload' as Mode, label: 'Subir imagen', icon: <ImagePlus className="w-4 h-4" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#050b1a]/70 backdrop-blur-sm p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-title"
    >
      <div className="w-full max-w-lg rounded-[22px] bg-[#f4f8fc] dark:bg-[#0c1426] border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden animate-fade-up">
        <div className="px-5 py-4 bg-white dark:bg-[#0a1122] border-b border-black/[0.07] dark:border-white/10 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 id="sign-title" className="font-display text-lg font-semibold text-[#0b1d3a] dark:text-white">
              Firme la calificación
            </h3>
            <p className="text-sm text-[#3a5274] dark:text-slate-400 mt-0.5">
              Su firma aparecerá en el PDF de esta evaluación{evaluatorName ? `, a nombre de ${evaluatorName}` : ''}.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Volver al formulario"
            className="w-9 h-9 grid place-items-center rounded-lg text-[#3a5274] dark:text-slate-300 hover:bg-black/[0.06] dark:hover:bg-white/10 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div role="tablist" aria-label="Cómo firmar" className="flex flex-wrap gap-1.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={mode === t.id}
                onClick={() => setMode(t.id)}
                className={`h-9 px-3.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${focusRing} ${
                  mode === t.id ? chipOn : chipOff
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {mode === 'draw' && <SignaturePad ref={padRef} onInkChange={setHasInk} />}

          {mode === 'upload' && (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                id="sign-file"
                onChange={(e) => pick(e.target.files?.[0])}
              />
              <label
                htmlFor="sign-file"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  pick(e.dataTransfer.files?.[0]);
                }}
                className="flex flex-col items-center justify-center gap-2 min-h-[190px] rounded-xl bg-white border-2 border-dashed border-[#2c84c4]/40 hover:border-[#2c84c4] text-center px-4 cursor-pointer transition-colors"
              >
                {busy ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#2c84c4]" />
                ) : uploaded ? (
                  <>
                    <img src={uploaded} alt="Su firma" className="max-h-[120px] max-w-full object-contain" />
                    <span className="text-xs font-semibold text-[#1d5fa8]">Cambiar imagen</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="w-7 h-7 text-[#2c84c4]" />
                    <span className="text-sm font-semibold text-[#0b1d3a]">Elija o arrastre la imagen de su firma</span>
                    <span className="text-xs text-[#5d7392]">PNG, JPG o WebP. Mejor sobre papel blanco; el fondo se quita solo.</span>
                  </>
                )}
              </label>
              {uploadError && (
                <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
                  {uploadError}
                </p>
              )}
            </div>
          )}

          {mode === 'saved' && saved && (
            <div>
              <div className="rounded-xl bg-white border border-[#2c84c4]/30 min-h-[190px] grid place-items-center p-4">
                <img src={saved} alt="Su firma guardada" className="max-h-[130px] max-w-full object-contain" />
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    clearSavedSignature(userKey);
                    setSaved(null);
                    setMode('draw');
                  }}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Borrar mi firma guardada
                </button>
              </div>
            </div>
          )}

          {mode !== 'saved' && (
            <label className="flex items-start gap-2.5 text-xs text-[#3a5274] dark:text-slate-300 cursor-pointer">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="mt-0.5 accent-[#2c84c4]" />
              <span>
                <span className="font-semibold text-[#0b1d3a] dark:text-slate-100 inline-flex items-center gap-1">
                  <Save className="w-3.5 h-3.5" /> Guardar mi firma en este equipo
                </span>
                <br />
                Así no tiene que firmar de nuevo la próxima vez. Quedará solo en este navegador.
              </span>
            </label>
          )}
        </div>

        <div className="px-5 py-4 bg-white dark:bg-[#0a1122] border-t border-black/[0.07] dark:border-white/10 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            type="button"
            onClick={() => onConfirm(null)}
            className="text-xs font-semibold text-[#3a5274] dark:text-slate-300 hover:underline underline-offset-2 cursor-pointer self-center sm:self-auto"
          >
            Continuar sin firma
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="h-11 px-4 rounded-xl border border-[#2c84c4]/35 text-[#1d5fa8] dark:text-[#69bdd7] hover:bg-[#2c84c4]/10 text-sm font-semibold cursor-pointer"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={!ready || busy}
              className="flex-1 sm:flex-none h-11 px-5 rounded-xl bg-gradient-action text-white text-sm font-semibold shadow-glow hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Firmar y generar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
