import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Award, Download, Loader2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupplierEvaluation } from '../../types';
import { DOC006_CODE, DOC006_VERSION, doc006TotalMax, normalizeInitialCriteria, resolveInitialPassing } from '../../data/evaluationDoc006';
import { buildEvaluationPdf, evaluationPdfFileName } from '../../utils/evaluationPdf';
import { downloadBlob, imageToDataUrl } from '../../utils/certificatePdf';

interface EvaluationPdfModalProps {
  evaluation: SupplierEvaluation | null;
  onClose: () => void;
}

/** PDF ya armado por evaluación: al volver a abrir el acta aparece al instante. */
const pdfCache = new Map<string, { blob: Blob; fileName: string }>();

/**
 * Acta de la evaluación inicial: es el formato FS.GA-DOC-006 ya diligenciado con los datos de la evaluación.
 * Se genera sola al abrirse y se puede descargar en PDF.
 */
export const EvaluationPdfModal: React.FC<EvaluationPdfModalProps> = ({ evaluation, onClose }) => {
  const { allDossiers, evaluationMethod } = useApp();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const fileNameRef = useRef('Evaluacion.pdf');

  const dossier = useMemo(
    () => (evaluation ? allDossiers.find((d) => d.id === evaluation.dossierId) || null : null),
    [allDossiers, evaluation]
  );

  useEffect(() => {
    if (!evaluation) return;
    let cancelled = false;
    let url: string | null = null;
    setPdfUrl(null);
    setError(null);

    const info0 = dossier?.basicInfo;
    const cacheKey = `${evaluation.id}|${evaluation.totalScore}|${evaluation.observations || ''}|${info0?.address || ''}|${info0?.city || ''}|${evaluation.evaluatorSignature ? evaluation.evaluatorSignature.length : 0}|${JSON.stringify(evaluationMethod?.initialCriteria || []).length}|${evaluationMethod?.initialPassingPoints ?? ''}`;
    const hit = pdfCache.get(cacheKey);
    if (hit) {
      blobRef.current = hit.blob;
      fileNameRef.current = hit.fileName;
      url = URL.createObjectURL(hit.blob);
      setPdfUrl(url);
      return () => {
        if (url) URL.revokeObjectURL(url);
      };
    }

    (async () => {
      try {
        // Deja que el cuadro con "Diligenciando el formato…" se pinte antes del trabajo pesado
        await new Promise<void>((r) => requestAnimationFrame(() => window.setTimeout(r, 0)));
        if (cancelled) return;
        const info = dossier?.basicInfo;
        const isNatural = info?.supplierType === 'NATURAL';
        const supplierName = evaluation.supplierName || (isNatural ? info?.fullName : info?.companyName) || 'Proveedor';
        const byId = new Map((evaluation.criteriaScores || []).map((c) => [c.criterionId, c]));
        const criteria = normalizeInitialCriteria(evaluationMethod?.initialCriteria);
        const scores = criteria.map((c) => byId.get(c.id)?.score ?? 0);
        const notes = criteria.map((c) => byId.get(c.id)?.notes || '');
        const known = new Set(criteria.map((c) => c.id));
        const extras = (evaluation.criteriaScores || [])
          .filter((c) => !known.has(c.criterionId))
          .map((c) => ({ name: c.criterionName, points: c.score ?? 0, max: c.maxScore ?? 0, notes: c.notes || '' }));

        const logoDataUrl = await imageToDataUrl('/logo-flota.png');
        const blob = await buildEvaluationPdf({
          date: evaluation.evaluationDate,
          isNatural,
          supplierName,
          supplierDoc: evaluation.supplierDoc || (isNatural ? info?.documentNumber : info?.nit) || '',
          address: info?.address || '',
          city: info?.city || '',
          criteria,
          passing: resolveInitialPassing(
            evaluationMethod?.initialPassingPoints,
            doc006TotalMax(criteria) + extras.reduce((a, e) => a + e.max, 0)
          ),
          scores,
          notes,
          extras,
          conclusions: evaluation.observations || '',
          evaluatorName: evaluation.evaluatorName || '',
          evaluatorPosition: evaluation.evaluatorRole || '',
          logoDataUrl,
          signatureDataUrl: evaluation.evaluatorSignature,
        });
        if (cancelled) return;
        blobRef.current = blob;
        fileNameRef.current = evaluationPdfFileName(supplierName);
        pdfCache.set(cacheKey, { blob, fileName: fileNameRef.current });
        url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (e) {
        if (!cancelled) setError('No se pudo generar el formato. Intente de nuevo.');
        console.error('[evaluacion-pdf]', e);
      }
    })();

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluation?.id, dossier?.id]);

  if (!evaluation) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1d3a]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white dark:bg-[#0f1a30] rounded-2xl w-full max-w-4xl border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col h-[92vh]">
        <div className="px-5 py-3.5 flex items-center justify-between gap-3 border-b border-black/10 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-gradient-action text-white grid place-items-center shrink-0">
              <Award className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-[#0b1d3a] dark:text-white truncate">
                Evaluación inicial · formato {DOC006_CODE} v{DOC006_VERSION}
              </p>
              <p className="text-[11px] text-[#5d7392] dark:text-slate-400 truncate">{evaluation.supplierName}</p>
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
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-300 px-6 text-center">{error}</p>
          ) : pdfUrl ? (
            <iframe title="Evaluación inicial" src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`} className="w-full h-full border-0" />
          ) : (
            <div className="flex items-center gap-2 text-sm text-[#3a5274] dark:text-slate-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Diligenciando el formato…</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
