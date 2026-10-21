import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  Calendar,
  Upload,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { SupplierDossier, SupplierDocument } from '../../types';
import {
  calculateDocumentExpiration,
  getDossierDocumentExpirationSummary,
  DossierDocumentExpirationSummary,
} from '../../utils/contractValidity';

interface DocumentExpirationAlertBannerProps {
  dossier: SupplierDossier;
  onTriggerUpload: (docCode: string) => void;
  onOpenDocPreview?: (doc: SupplierDocument, title: string) => void;
  onScrollToStep?: (stepId: string) => void;
}

export const DocumentExpirationAlertBanner: React.FC<DocumentExpirationAlertBannerProps> = ({
  dossier,
  onTriggerUpload,
  onOpenDocPreview,
  onScrollToStep,
}) => {
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const summary: DossierDocumentExpirationSummary = getDossierDocumentExpirationSummary(dossier);

  const {
    hasExpiredDocs,
    expiredCount,
    expiredDocs,
    hasExpiringSoonDocs,
    expiringSoonCount,
    expiringSoonDocs,
    totalWithExpiration,
    validCount,
  } = summary;

  // Si no hay documentos con vencimiento configurado, no mostrar nada intrusivo
  if (totalWithExpiration === 0 && !hasExpiredDocs && !hasExpiringSoonDocs) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* 1. ALERTA CRÍTICA: DOCUMENTOS VENCIDOS (Inhabilita al proveedor) */}
      {hasExpiredDocs && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-rose-200 dark:border-rose-900/60 pb-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertOctagon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 px-2 py-0.5 rounded-md">
                    Alerta Crítica SIG
                  </span>
                  <span className="text-xs font-black text-rose-900 dark:text-rose-200 font-mono">
                    {expiredCount} {expiredCount === 1 ? 'Documento Vencido' : 'Documentos Vencidos'}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-rose-900 dark:text-rose-100 mt-0.5">
                  Documentación Vencida: Suspensión Preventiva de Conformidad SIG
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/70 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800">
                Inhabilita Ordenes y Pagos
              </span>
            </div>
          </div>

          <p className="text-xs text-rose-800 dark:text-rose-200/90 mt-2.5 leading-relaxed">
            De acuerdo con la <strong>Política de Control Documental del Sistema Integrado de Gestión (SIG) de Flota Sugamuxi S.A.</strong>, el vencimiento de estos soportes suspende automáticamente la validez del expediente para emisión de órdenes de compra, contratos o pagos comerciales.
          </p>

          {/* Lista de Documentos Vencidos con Acción de Carga Directa */}
          <div className="mt-3.5 space-y-2">
            {expiredDocs.map((item) => {
              const doc = dossier.documents[item.code];
              return (
                <div
                  key={item.code}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/80 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                      <AlertOctagon className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.code}
                        </span>
                      </div>
                      <div className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        <span>Fecha límite: {item.expirationDate}</span>
                        <span>&bull;</span>
                        <span className="font-bold underline">Venció hace {item.daysOverdue} días</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {doc && onOpenDocPreview && doc.fileName && (
                      <button
                        type="button"
                        onClick={() => onOpenDocPreview(doc, item.name)}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
                        title="Ver soporte vencido"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ver anterior</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onTriggerUpload(item.code)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir documento renovado</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. ALERTA PREVENTIVA: DOCUMENTOS PRÓXIMOS A VENCER (0 a 30 días según política SIG) */}
      {hasExpiringSoonDocs && (
        <div className="bg-amber-50/90 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-amber-200 dark:border-amber-900/60 pb-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded-md">
                    Alerta Preventiva SIG
                  </span>
                  <span className="text-xs font-black text-amber-900 dark:text-amber-200 font-mono">
                    {expiringSoonCount} {expiringSoonCount === 1 ? 'Documento Próximo a Vencer' : 'Documentos Próximos a Vencer'}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-amber-950 dark:text-amber-100 mt-0.5">
                  Notificación de Vencimiento Próximo (&le; 30 días)
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/70 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800">
                Renovación Oportuna Requerida
              </span>
            </div>
          </div>

          <p className="text-xs text-amber-900 dark:text-amber-200/90 mt-2.5 leading-relaxed">
            Las políticas del <strong>Sistema Integrado de Gestión (SIG)</strong> establecen una alerta preventiva de <strong>30 días de antelación</strong> para tramitar la renovación de documentos periódicos (como pagos de Seguridad Social, Cámaras de Comercio o Pólizas), asegurando la continuidad ininterrumpida de sus operaciones comerciales.
          </p>

          {/* Lista de Documentos Próximos a Vencer con Botón de Carga Directa */}
          <div className="mt-3.5 space-y-2">
            {expiringSoonDocs.map((item) => {
              const doc = dossier.documents[item.code];
              const isToday = item.daysRemaining === 0;

              return (
                <div
                  key={item.code}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/80 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.code}
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>Vence: {item.expirationDate}</span>
                        <span>&bull;</span>
                        <span className="font-bold underline">
                          {isToday ? 'Vence HOY' : `Restan ${item.daysRemaining} días`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {doc && onOpenDocPreview && doc.fileName && (
                      <button
                        type="button"
                        onClick={() => onOpenDocPreview(doc, item.name)}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-slate-700"
                        title="Ver documento actual"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ver actual</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onTriggerUpload(item.code)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Actualizar soporte</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. ESTADO DE CONFORMIDAD GENERAL: Todos los documentos vigentes */}
      {!hasExpiredDocs && !hasExpiringSoonDocs && totalWithExpiration > 0 && (
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                Vigencia Documental al Día (Políticas SIG Cumplidas)
              </div>
              <div className="text-[11px] text-emerald-800 dark:text-emerald-300">
                Los {validCount} documentos periódicos registrados cuentan con más de 30 días de vigencia activa.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMatrixOpen(!isMatrixOpen)}
            className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>{isMatrixOpen ? 'Ocultar Matriz' : 'Ver Matriz de Vigencia'}</span>
            {isMatrixOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* 4. Matriz Desplegable de Vigencia Documental */}
      {(hasExpiredDocs || hasExpiringSoonDocs) && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsMatrixOpen(!isMatrixOpen)}
            className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>{isMatrixOpen ? 'Ocultar matriz de vencimientos' : 'Ver matriz completa de vigencias SIG'}</span>
            {isMatrixOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {isMatrixOpen && (
        <div className="bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-blue-900/60 rounded-xl p-4 shadow-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>Matriz de Vigencia Documental - Políticas SIG Flota Sugamuxi S.A.</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-medium">
              Criterio de alerta preventiva: &le; 30 días
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2 pr-3">Documento / Código</th>
                  <th className="py-2 px-3">Fecha Vencimiento</th>
                  <th className="py-2 px-3">Días Restantes</th>
                  <th className="py-2 px-3">Estado según Política SIG</th>
                  <th className="py-2 pl-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {Object.values(dossier.documents)
                  .filter((d) => d && d.fileName)
                  .map((doc) => {
                    const exp = calculateDocumentExpiration(doc.expirationDate);
                    return (
                      <tr key={doc.id || doc.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                        <td className="py-2.5 pr-3 font-semibold text-slate-900 dark:text-white">
                          <div>{doc.name}</div>
                          <span className="text-[10px] font-mono text-slate-400">{doc.code}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                          {doc.expirationDate || 'Permanente'}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          {exp.status === 'NO_APLICA' ? (
                            <span className="text-slate-400 font-normal">&infin;</span>
                          ) : exp.status === 'VENCIDO' ? (
                            <span className="text-rose-600 dark:text-rose-400">-{exp.daysOverdue}d</span>
                          ) : exp.status === 'POR_VENCER' ? (
                            <span className="text-amber-600 dark:text-amber-400">{exp.daysRemaining}d</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">{exp.daysRemaining}d</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {exp.status === 'VENCIDO' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              <AlertOctagon className="w-3 h-3 text-rose-600" /> Vencido (Inhabilita)
                            </span>
                          ) : exp.status === 'POR_VENCER' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              <Clock className="w-3 h-3 text-amber-600" /> Por Vencer (&le; 30d)
                            </span>
                          ) : exp.status === 'VIGENTE' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Vigente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              Permanente
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pl-3 text-right">
                          <button
                            type="button"
                            onClick={() => onTriggerUpload(doc.code)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-cyan-300 rounded font-bold text-[10px] border border-blue-200 dark:border-blue-800 cursor-pointer"
                          >
                            Actualizar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
