import React from 'react';
import {
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Upload,
  Eye,
  Download,
  ShieldCheck,
  FileText,
  Lock,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { SupplierDocument, InstitutionalForm } from '../types';
import { DocumentExpirationBadge } from './dossier/DocumentExpirationBadge';

interface ExpedienteProgressBarProps {
  doc009?: SupplierDocument;
  doc039?: SupplierDocument;
  form009: InstitutionalForm;
  form039: InstitutionalForm;
  onTriggerUpload: (docCode: string) => void;
  onOpenViewer: (form: InstitutionalForm) => void;
  onOpenDocPreview?: (doc: SupplierDocument, title: string) => void;
  onScrollToStep?: (stepId: string) => void;
}

export const ExpedienteProgressBar: React.FC<ExpedienteProgressBarProps> = ({
  doc009,
  doc039,
  form009,
  form039,
  onTriggerUpload,
  onOpenViewer,
  onOpenDocPreview,
  onScrollToStep,
}) => {
  // Verificación de carga y estado para FS.GA-FOR-009
  const is009Loaded = Boolean(doc009 && doc009.status !== 'PENDIENTE' && doc009.fileName);
  const is009Correction = doc009?.status === 'REQUIERE_CORRECCION';
  const is009Approved = doc009?.status === 'APROBADO';

  let percent009 = 0;
  if (is009Approved) percent009 = 100;
  else if (is009Loaded && !is009Correction) percent009 = 100;
  else if (is009Correction) percent009 = 50;
  else percent009 = 0;

  // Verificación de carga y estado para FS.GA-FOR-039
  const is039Loaded = Boolean(doc039 && doc039.status !== 'PENDIENTE' && doc039.fileName);
  const is039Correction = doc039?.status === 'REQUIERE_CORRECCION';
  const is039Approved = doc039?.status === 'APROBADO';

  let percent039 = 0;
  if (is039Approved) percent039 = 100;
  else if (is039Loaded && !is039Correction) percent039 = 100;
  else if (is039Correction) percent039 = 50;
  else percent039 = 0;

  // Porcentaje consolidado de formatos institucionales SIG (0 - 100%)
  const totalFormats = 2;
  const completedCount = (is009Loaded ? 1 : 0) + (is039Loaded ? 1 : 0);
  const combinedPercent = Math.round(((percent009 + percent039) / (totalFormats * 100)) * 100);

  const getStatusBadge = (doc?: SupplierDocument, isLoaded?: boolean) => {
    if (!doc || !isLoaded || doc.status === 'PENDIENTE') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <Clock className="w-3 h-3 text-slate-400" /> Pendiente
        </span>
      );
    }
    if (doc.status === 'REQUIERE_CORRECCION') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
          <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Requiere Corrección
        </span>
      );
    }
    if (doc.status === 'APROBADO') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Aprobado Oficial
        </span>
      );
    }
    if (doc.status === 'EN_REVISION') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
          <Clock className="w-3 h-3 text-blue-600 dark:text-cyan-300" /> En Revisión SIG
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
        <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-cyan-400" /> Cargado (Listo)
      </span>
    );
  };

  const scrollToStepId = (id: string) => {
    if (onScrollToStep) {
      onScrollToStep(id);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div className="bg-white dark:bg-[#0b1329] rounded-2xl border border-slate-200 dark:border-blue-900/60 shadow-xs overflow-hidden transition-all">
      {/* Header del Componente */}
      <div className="bg-gradient-to-r from-slate-50 via-blue-50/50 to-white dark:from-[#0d1836] dark:via-[#0f1d40] dark:to-[#0b1329] p-4 sm:p-5 border-b border-slate-200 dark:border-blue-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs ring-2 ring-blue-600/20">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-cyan-300 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                  Formatos Obligatorios SIG
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Flota Sugamuxi S.A.
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mt-0.5">
                <span>Barra de Progreso de Expediente: Formatos Institucionales</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 block">
                Cumplimiento Formatos
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {completedCount} de {totalFormats} cargados
              </span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-black text-sm sm:text-base font-mono shadow-xs flex items-center gap-1">
              <span>{combinedPercent}%</span>
            </div>
          </div>
        </div>

        {/* Barra de Progreso Principal Global de Formatos */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-300" />
              <span>Avance de cargue de formatos oficiales FS.GA-FOR-009 y FS.GA-FOR-039</span>
            </span>
            <span className="font-mono font-bold text-blue-700 dark:text-cyan-300 text-xs">
              {combinedPercent}% Completado
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/80 p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                combinedPercent === 100
                  ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400'
                  : combinedPercent >= 50
                  ? 'bg-gradient-to-r from-blue-700 to-blue-500'
                  : 'bg-gradient-to-r from-slate-400 to-blue-400'
              }`}
              style={{ width: `${combinedPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
            <span>0% (Sin formatos)</span>
            <span className={combinedPercent >= 50 ? 'font-bold text-blue-600 dark:text-cyan-300' : ''}>
              50% (1 formato cargado)
            </span>
            <span className={combinedPercent === 100 ? 'font-black text-blue-700 dark:text-cyan-300 flex items-center gap-1' : ''}>
              {combinedPercent === 100 && <Sparkles className="w-3 h-3 text-cyan-400" />} 100% (Listo para revisión)
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Desglose de Cada Formato (FS.GA-FOR-009 y FS.GA-FOR-039) */}
      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Formato 1: FS.GA-FOR-009 */}
        <div
          className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
            is009Loaded
              ? 'bg-blue-50/40 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/60'
              : 'bg-slate-50/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                    FS.GA-FOR-009
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Versión Oficial {form009.currentVersion}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  Inscripción y Actualización de Proveedores
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Numerales I al V, información tributaria, datos bancarios y declaración SARLAFT obligatoria.
                </p>
              </div>

              <div className="shrink-0">{getStatusBadge(doc009, is009Loaded)}</div>
            </div>

            {/* Barra Individual FS.GA-FOR-009 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Progreso del formato:</span>
                <span className="font-mono font-extrabold text-blue-700 dark:text-cyan-300">
                  {percent009}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percent009 === 100
                      ? 'bg-blue-600 dark:bg-cyan-400'
                      : percent009 === 50
                      ? 'bg-amber-500'
                      : 'bg-transparent'
                  }`}
                  style={{ width: `${percent009}%` }}
                />
              </div>
            </div>

            {/* Checklist de requisitos del 009 */}
            <div className="bg-white dark:bg-slate-900/80 rounded-lg p-2.5 border border-slate-200/80 dark:border-slate-800 text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold ${
                    is009Loaded
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {is009Loaded ? '✓' : '•'}
                </span>
                <span>Numerales I al V diligenciados y firmados</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold ${
                    is009Loaded
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {is009Loaded ? '✓' : '•'}
                </span>
                <span>Declaración de origen de fondos / SARLAFT</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold ${
                    is009Loaded
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {is009Loaded ? '✓' : '•'}
                </span>
                <span>Firma con huella o certificado digital</span>
              </div>
            </div>

            {/* Información del archivo cargado */}
            {is009Loaded && doc009 && (
              <div className="bg-white dark:bg-slate-900/80 rounded-lg p-2 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between gap-2 text-[10px]">
                <div className="min-w-0 space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {doc009.fileName}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap text-slate-400">
                    <span>{doc009.fileSize || '1.2 MB'} &bull; {doc009.uploadedAt || 'Hoy'}</span>
                    <DocumentExpirationBadge
                      expirationDate={doc009.expirationDate}
                      validityRule="Actualización periódica anual (SIG)"
                      requiresExpirationDate={false}
                    />
                  </div>
                </div>
                {onOpenDocPreview && (
                  <button
                    type="button"
                    onClick={() => onOpenDocPreview(doc009, 'Formato FS.GA-FOR-009')}
                    className="p-1 text-blue-600 dark:text-cyan-300 hover:bg-blue-50 dark:hover:bg-slate-800 rounded shrink-0 cursor-pointer"
                    title="Ver archivo PDF cargado"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Acciones para el 009 */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 mt-3">
            <button
              type="button"
              onClick={() => onOpenViewer(form009)}
              className="text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Download className="w-3 h-3 text-blue-600 dark:text-cyan-300" />
              <span>Plantilla Oficial</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onTriggerUpload('FS_GA_FOR_009')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  is009Loaded
                    ? 'bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                }`}
              >
                <Upload className="w-3 h-3" />
                <span>{is009Loaded ? 'Reemplazar' : 'Cargar 009'}</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToStepId('paso-form-009')}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                title="Ir al paso 2 de este formato"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Formato 2: FS.GA-FOR-039 */}
        <div
          className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
            is039Loaded
              ? 'bg-blue-50/40 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/60'
              : 'bg-slate-50/60 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 dark:bg-slate-700 text-white">
                    FS.GA-FOR-039
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Versión Oficial {form039.currentVersion}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  Tratamiento de Datos Personales (Habeas Data)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Autorización expresa conforme a la Ley 1581 de 2012 y Decretos Reglamentarios de Colombia.
                </p>
              </div>

              <div className="shrink-0">{getStatusBadge(doc039, is039Loaded)}</div>
            </div>

            {/* Barra Individual FS.GA-FOR-039 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Progreso del formato:</span>
                <span className="font-mono font-extrabold text-blue-700 dark:text-cyan-300">
                  {percent039}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percent039 === 100
                      ? 'bg-blue-600 dark:bg-cyan-400'
                      : percent039 === 50
                      ? 'bg-amber-500'
                      : 'bg-transparent'
                  }`}
                  style={{ width: `${percent039}%` }}
                />
              </div>
            </div>

            {/* Checklist de requisitos del 039 */}
            <div className="bg-white dark:bg-slate-900/80 rounded-lg p-2.5 border border-slate-200/80 dark:border-slate-800 text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold ${
                    is039Loaded
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {is039Loaded ? '✓' : '•'}
                </span>
                <span>Autorización expresa firmada por el titular o rep. legal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold ${
                    is039Loaded
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {is039Loaded ? '✓' : '•'}
                </span>
                <span>Huella dactilar y número de documento legible</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold ${
                    is039Loaded
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {is039Loaded ? '✓' : '•'}
                </span>
                <span>Cumplimiento Ley 1581 de 2012 verificado</span>
              </div>
            </div>

            {/* Información del archivo cargado */}
            {is039Loaded && doc039 && (
              <div className="bg-white dark:bg-slate-900/80 rounded-lg p-2 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between gap-2 text-[10px]">
                <div className="min-w-0 space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {doc039.fileName}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap text-slate-400">
                    <span>{doc039.fileSize || '620 KB'} &bull; {doc039.uploadedAt || 'Hoy'}</span>
                    <DocumentExpirationBadge
                      expirationDate={doc039.expirationDate}
                      validityRule="Vigencia permanente / Habeas Data"
                      requiresExpirationDate={false}
                    />
                  </div>
                </div>
                {onOpenDocPreview && (
                  <button
                    type="button"
                    onClick={() => onOpenDocPreview(doc039, 'Formato FS.GA-FOR-039')}
                    className="p-1 text-blue-600 dark:text-cyan-300 hover:bg-blue-50 dark:hover:bg-slate-800 rounded shrink-0 cursor-pointer"
                    title="Ver archivo PDF cargado"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Acciones para el 039 */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 mt-3">
            <button
              type="button"
              onClick={() => onOpenViewer(form039)}
              className="text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Download className="w-3 h-3 text-blue-600 dark:text-cyan-300" />
              <span>Plantilla Oficial</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onTriggerUpload('FS_GA_FOR_039')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  is039Loaded
                    ? 'bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                }`}
              >
                <Upload className="w-3 h-3" />
                <span>{is039Loaded ? 'Reemplazar' : 'Cargar 039'}</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToStepId('paso-form-039')}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                title="Ir al paso 3 de este formato"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Informativo de Validación Institucional */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
          <span>
            {combinedPercent === 100 ? (
              <strong className="text-emerald-700 dark:text-emerald-400">
                ¡Formatos obligatorios completos! El expediente cuenta con los requisitos documentales base para radicación.
              </strong>
            ) : combinedPercent === 50 ? (
              <span>
                Falta completar 1 formato obligatorio para habilitar el envío oficial a revisión interna de Sugamuxi.
              </span>
            ) : (
              <span>
                Formatos indispensables para iniciar la vinculación oficial en el Sistema Integrado de Gestión (SIG).
              </span>
            )}
          </span>
        </div>

        <div className="text-[10px] text-slate-400 shrink-0">
          Auditoría SARLAFT &bull; Flota Sugamuxi S.A.
        </div>
      </div>
    </div>
  );
};
