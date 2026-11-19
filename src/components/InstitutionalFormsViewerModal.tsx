import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  Info,
} from 'lucide-react';
import { InstitutionalForm } from '../types';
import { FlotaSugamuxiEmblem } from './FlotaSugamuxiLogo';
import { getFormPdf } from '../utils/formPdf';

interface Props {
  form: InstitutionalForm | null;
  isOpen: boolean;
  onClose: () => void;
  supplierName?: string;
  nitOrDoc?: string;
  /** Versión a mostrar al abrir (vacío = la vigente) */
  initialVersion?: string;
}

export const InstitutionalFormsViewerModal: React.FC<Props> = ({
  form,
  isOpen,
  onClose,
  supplierName = '',
  nitOrDoc = '',
  initialVersion,
}) => {
  const [activeTab, setActiveTab] = useState<'vista' | 'instrucciones' | 'historial'>('vista');
  // Versión que se está viendo (vacío = la vigente)
  const [viewVersion, setViewVersion] = useState<string>(initialVersion || '');
  useEffect(() => {
    if (isOpen) {
      setViewVersion(initialVersion || '');
      setActiveTab('vista');
    }
  }, [isOpen, initialVersion]);

  if (!isOpen || !form) return null;

  const isForm009 = form.code === 'FS.GA-FOR-009';

  const pdf = getFormPdf(form, viewVersion || undefined);

  // Descarga el PDF real (con respaldo de abrirlo si el servidor no permite descargarlo directo)
  const handleDownload = async () => {
    if (!pdf) return;
    try {
      const res = await fetch(pdf.url);
      if (!res.ok) throw new Error('descarga');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = pdf.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch {
      window.open(pdf.url, '_blank', 'noopener');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-white dark:bg-[#0b1329] rounded-2xl shadow-2xl border border-slate-200 dark:border-blue-900/60 w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-[#0b1329] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#2c84c4]/30 flex items-center justify-center p-1 shadow-xs">
              <FlotaSugamuxiEmblem className="w-full h-full" color="#0080d7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-600 text-white uppercase tracking-wider shadow-2xs">
                  {form.code}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  Versión {form.currentVersion} • Vigente: {form.effectiveDate}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight mt-0.5">
                {form.name}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Descargar plantilla oficial para diligenciar"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar formato</span>
            </button>
            <button
              onClick={() => { setViewVersion(''); onClose(); }}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 sm:px-6 flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('vista')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'vista'
                ? 'border-blue-600 dark:border-cyan-400 text-blue-900 dark:text-cyan-300 bg-white dark:bg-[#0b1329] shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Formato oficial (PDF)
          </button>
          <button
            onClick={() => setActiveTab('instrucciones')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'instrucciones'
                ? 'border-blue-600 dark:border-cyan-400 text-blue-900 dark:text-cyan-300 bg-white dark:bg-[#0b1329] shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            Guía de Diligenciamiento ({form.instructions.length})
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'historial'
                ? 'border-blue-600 dark:border-cyan-400 text-blue-900 dark:text-cyan-300 bg-white dark:bg-[#0b1329] shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Control de Versiones SIG ({form.versionHistory.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-[#050b18]">
          {activeTab === 'vista' && (
            <div className="max-w-4xl mx-auto">
              {viewVersion && (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-[#2c84c4]/30 bg-[#2c84c4]/10 px-4 py-2.5 text-xs text-[#1d5fa8] dark:text-[#69bdd7]">
                  <span>Está viendo la versión {viewVersion}{viewVersion !== form.currentVersion ? ' (histórica, no vigente)' : ''}.</span>
                  {viewVersion !== form.currentVersion && (
                    <button type="button" onClick={() => setViewVersion('')} className="font-bold hover:underline cursor-pointer">
                      Ver la vigente
                    </button>
                  )}
                </div>
              )}
              {pdf ? (
                <iframe
                  key={pdf.url}
                  src={`${pdf.url}#toolbar=1&navpanes=0`}
                  title={`${form.code} versión ${pdf.version}`}
                  className="w-full h-[68vh] rounded-xl border border-black/10 dark:border-white/10 bg-white"
                />
              ) : (
                <div className="rounded-xl border border-dashed border-black/20 dark:border-white/20 bg-white dark:bg-white/[0.03] px-6 py-16 text-center text-sm text-[#3a5274] dark:text-slate-300">
                  Esta versión no tiene un PDF cargado.
                </div>
              )}
            </div>
          )}

          {activeTab === 'instrucciones' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="bg-white p-5 sm:p-6 rounded-xl border border-black/10 dark:border-white/10 shadow-xs">
                <h3 className="font-bold text-[#0b1d3a] dark:text-white text-sm mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1d5fa8] dark:text-[#69bdd7]" />
                  Instrucciones Oficiales de Diligenciamiento
                </h3>
                <ul className="space-y-2.5 text-xs text-[#3a5274] dark:text-slate-300">
                  {form.instructions.map((inst, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 bg-black/[0.04] dark:bg-white/[0.06] p-3 rounded-lg border border-black/10 dark:border-white/10">
                      <span className="w-5 h-5 rounded-full bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{inst}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#2c84c4]/10 border border-[#2c84c4]/30 rounded-xl p-4 text-[#0b1d3a] dark:text-white text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#1d5fa8] dark:text-[#69bdd7] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#0b1d3a] dark:text-white">Evite Devoluciones o Solicitudes de Corrección</p>
                  <p className="text-[#3a5274] dark:text-slate-300 text-[11px] mt-0.5">
                    Asegúrese de que las firmas sean legibles (digitales o escaneadas), que el numeral III (datos bancarios) coincida con la certificación de su banco, y que el archivo esté en formato PDF de alta resolución.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'historial' && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-xl border border-black/10 dark:border-white/10 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 bg-black/[0.04] dark:bg-white/[0.06] border-b border-black/10 dark:border-white/10 flex items-center justify-between">
                  <h3 className="font-bold text-[#0b1d3a] dark:text-white text-xs">
                    Historial Institucional de Modificaciones (SIG)
                  </h3>
                  <span className="text-[11px] text-[#3a5274] dark:text-slate-300 font-mono font-bold">
                    Código {form.code}
                  </span>
                </div>
                <div className="divide-y divide-black/10 dark:divide-white/10">
                  {form.versionHistory.map((hist, idx) => (
                    <div key={idx} className="p-4 sm:p-5 flex items-start justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            hist.isActive
                              ? 'bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] border border-[#2c84c4]/30'
                              : 'bg-black/[0.08] dark:bg-white/10 text-[#3a5274] dark:text-slate-300'
                          }`}>
                            Versión {hist.version} {hist.isActive && '(Vigente Actual)'}
                          </span>
                          <span className="text-[#5d7392] dark:text-slate-400 text-[11px] flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#5d7392] dark:text-slate-400" /> {hist.releaseDate}
                          </span>
                        </div>
                        <p className="text-[#0b1d3a] dark:text-white font-medium">{hist.changeSummary}</p>
                        <p className="text-[#5d7392] dark:text-slate-400 text-[11px]">Aprobado por: {hist.modifiedBy}</p>
                      </div>
                      <div className="shrink-0 text-right space-y-2">
                        {getFormPdf(form, hist.version) ? (
                          <button
                            type="button"
                            onClick={() => {
                              setViewVersion(hist.version);
                              setActiveTab('vista');
                            }}
                            className="block ml-auto text-[11px] font-bold text-[#1d5fa8] dark:text-[#69bdd7] hover:underline cursor-pointer"
                          >
                            Ver PDF
                          </button>
                        ) : (
                          <span className="block text-[10px] text-[#5d7392] dark:text-slate-400">Sin archivo</span>
                        )}
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${
                          hist.isActive ? 'text-[#1d5fa8] dark:text-[#69bdd7] bg-[#2c84c4]/10 border border-[#2c84c4]/30' : 'text-[#5d7392] dark:text-slate-400'
                        }`}>
                          {hist.isActive ? 'Vigente' : 'Histórico'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 dark:bg-slate-900 px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
            <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Flota Sugamuxi S.A. &bull; Calidad y Servicio</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setViewVersion(''); onClose(); }}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
