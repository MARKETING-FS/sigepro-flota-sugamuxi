import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Plus,
  History,
  ShieldCheck,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  ToggleLeft,
  ToggleRight,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InstitutionalForm } from '../types';
import { InstitutionalFormsViewerModal } from './InstitutionalFormsViewerModal';
import { FlotaSugamuxiLogo } from './FlotaSugamuxiLogo';

export const InstitutionalFormsAdmin: React.FC = () => {
  const { institutionalForms, addNewFormVersion, toggleFormMandatory, showToast } = useApp();
  const [selectedFormForModal, setSelectedFormForModal] = useState<InstitutionalForm | null>(null);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);

  // New Version Modal state
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [targetFormCode, setTargetFormCode] = useState('FS.GA-FOR-009');
  const [newVersionString, setNewVersionString] = useState('15.0');
  const [newReleaseDate, setNewReleaseDate] = useState('2026-09-01');
  const [newModifiedBy, setNewModifiedBy] = useState('Coordinación SIG / Calidad');
  const [newChangeSummary, setNewChangeSummary] = useState('');
  const [newIsMandatory, setNewIsMandatory] = useState(true);

  const handleOpenNewVersionModal = (form: InstitutionalForm) => {
    setTargetFormCode(form.code);
    const nextMajor = (parseFloat(form.currentVersion) + 1.0).toFixed(1);
    setNewVersionString(nextMajor);
    setNewChangeSummary('');
    setNewIsMandatory(form.isMandatory);
    setIsNewVersionModalOpen(true);
  };

  const handleSaveNewVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChangeSummary.trim()) {
      showToast('Por favor describa el resumen de cambios de la nueva versión.', 'warning');
      return;
    }

    addNewFormVersion(
      targetFormCode,
      newVersionString,
      newReleaseDate,
      newModifiedBy,
      newChangeSummary,
      newIsMandatory
    );

    showToast(`Versión ${newVersionString} de ${targetFormCode} publicada exitosamente.`, 'success');
    setIsNewVersionModalOpen(false);
  };

  const handlePreview = (form: InstitutionalForm) => {
    setSelectedFormForModal(form);
    setIsViewerModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      
      {/* 1. Header Banner Estandarizado Claro */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 text-slate-900 border border-slate-200 shadow-xs relative overflow-hidden dark:bg-[#0b1329] dark:text-white dark:border-blue-900/60">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1 w-full">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 p-1.5 dark:bg-slate-900/80 dark:border-blue-800 shadow-2xs">
              <FileSpreadsheet className="w-5 h-5 text-blue-700 dark:text-cyan-400" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 rounded-full text-blue-800 font-bold text-[10px] flex items-center gap-1.5 font-mono dark:bg-blue-500/20 dark:border-blue-400/40 dark:text-cyan-300">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-300" />
                  <span>Módulo de Administración SIG</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  Gestión de Calidad ISO 9001
                </span>
              </div>
              <h1 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                Formatos Institucionales y Versionamiento
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                Control oficial de los formatos <strong>FS.GA-FOR-009</strong> y <strong>FS.GA-FOR-039</strong> de Flota Sugamuxi S.A.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full xl:w-auto shrink-0 pt-2.5 xl:pt-0 border-t xl:border-t-0 border-slate-100 dark:border-slate-800/80">
            <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-left sm:text-right dark:bg-slate-900/80 dark:border-slate-700/80 w-full sm:w-auto">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase block">Formatos Vigentes</span>
              <span className="text-xs sm:text-sm font-black text-blue-700 dark:text-cyan-300">{institutionalForms.length} Formatos Oficiales</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Forms Table (As specified in requirement table) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-700" />
            Tabla Oficial de Formatos Institucionales
          </h2>
          <span className="text-xs text-slate-500">
            Conservación estricta de documentos institucionales
          </span>
        </div>

        <div>
          <div className="sm:hidden px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] text-blue-900 dark:text-cyan-300 flex items-center justify-between font-medium">
            <span>Desliza horizontalmente para ver todas las columnas</span>
            <span className="font-bold">↔</span>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px] lg:min-w-full">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Nombre del Formato</th>
                <th className="py-3 px-3 text-center">Versión Vigente</th>
                <th className="py-3 px-3 text-center">Fecha Vigencia</th>
                <th className="py-3 px-3 text-center">Vigente</th>
                <th className="py-3 px-3 text-center">Obligatorio</th>
                <th className="py-3 px-4 text-right">Acciones de Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {institutionalForms.map((form) => (
                <tr key={form.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-extrabold text-blue-900 text-xs">
                    {form.code}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-sm">
                    {form.name}
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                      {form.description}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-800">
                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      v{form.currentVersion}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-600 font-mono text-[11px]">
                    {form.effectiveDate}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                      Sí
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleFormMandatory(form.code, !form.isMandatory)}
                      className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold"
                      title="Haga clic para alternar obligatoriedad"
                    >
                      {form.isMandatory ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                          Sí (Obligatorio)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-300">
                          Opcional
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handlePreview(form)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1"
                      title="Previsualizar formato oficial"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenNewVersionModal(form)}
                      className="px-2.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-md shadow-2xs transition-colors inline-flex items-center gap-1"
                      title="Emitir nueva versión formal en el SIG"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nueva Versión</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      {/* Version History Detail Sections for Auditing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {institutionalForms.map((form) => (
          <div key={form.code} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-blue-900">{form.code}</span>
                <h3 className="font-bold text-xs text-slate-900">{form.name}</h3>
              </div>
              <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                {form.versionHistory.length} Versiones Históricas
              </span>
            </div>

            <div className="p-4 space-y-3">
              <div className="divide-y divide-slate-100 text-xs">
                {form.versionHistory.map((hist, idx) => (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          hist.isActive
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          v{hist.version}
                        </span>
                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {hist.releaseDate}
                        </span>
                      </div>
                      <span className={`text-[10px] font-semibold ${
                        hist.isActive ? 'text-blue-700' : 'text-slate-400'
                      }`}>
                        {hist.isActive ? 'Activa Vigente' : 'No Vigente (Histórica)'}
                      </span>
                    </div>
                    <p className="text-slate-700 text-xs">{hist.changeSummary}</p>
                    <div className="text-[10px] text-slate-400">
                      Responsable: {hist.modifiedBy}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Registering a New Version */}
      {isNewVersionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh] sm:max-h-[88vh]">
            <div className="bg-[#0b1329] text-white px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-blue-600 px-2 py-0.5 rounded text-white shadow-2xs">
                  Control de Cambios SIG
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                  Registrar Nueva Versión &bull; {targetFormCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewVersionModalOpen(false)}
                className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewVersion} className="p-4 sm:p-6 space-y-4 text-xs text-slate-700 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Número de Nueva Versión
                  </label>
                  <input
                    type="text"
                    value={newVersionString}
                    onChange={(e) => setNewVersionString(e.target.value)}
                    placeholder="Ej. 15.0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Fecha de Entrada en Vigencia
                  </label>
                  <input
                    type="date"
                    value={newReleaseDate}
                    onChange={(e) => setNewReleaseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Área / Funcionario Responsable
                </label>
                <input
                  type="text"
                  value={newModifiedBy}
                  onChange={(e) => setNewModifiedBy(e.target.value)}
                  placeholder="Ej. Coordinación SIG / Dirección Jurídica"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Resumen Detallado de Modificaciones (Control de Cambios)
                </label>
                <textarea
                  rows={3}
                  value={newChangeSummary}
                  onChange={(e) => setNewChangeSummary(e.target.value)}
                  placeholder="Describa los cambios efectuados respecto a la versión anterior..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="newIsMandatoryCheckbox"
                  checked={newIsMandatory}
                  onChange={(e) => setNewIsMandatory(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="newIsMandatoryCheckbox" className="font-semibold text-slate-800 cursor-pointer select-none">
                  Marcar como documento institucional obligatorio en el expediente digital
                </label>
              </div>

              <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-xl text-[11px] text-slate-700 space-y-0.5">
                <p className="font-bold text-blue-950">Principio de No Destrucción Documental:</p>
                <p>
                  Las versiones anteriores no serán eliminadas del historial y los proveedores que hayan presentado versiones previas conservarán su registro inalterado.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNewVersionModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Publicar y Activar Nueva Versión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewer Modal */}
      <InstitutionalFormsViewerModal
        form={selectedFormForModal}
        isOpen={isViewerModalOpen}
        onClose={() => setIsViewerModalOpen(false)}
      />

    </div>
  );
};
