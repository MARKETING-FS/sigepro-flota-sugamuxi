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
import { PageHeader, heroPrimaryBtn, heroSecondaryBtn } from './ui/archive';

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
    <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 pb-8 pt-1 space-y-5">
      
      <PageHeader
        icon={FileSpreadsheet}
        title="Formatos institucionales"
        subtitle={`Control oficial de los formatos FS.GA-FOR-009 y FS.GA-FOR-039 · ${institutionalForms.length} formatos vigentes`}
      />
      <div className="h-1" />

      {/* Mandatory Forms Table (As specified in requirement table) */}
      <div className="fs-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 bg-black/[0.04] dark:bg-white/[0.06] border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-[#0b1d3a] dark:text-white uppercase tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1d5fa8] dark:text-[#69bdd7]" />
            Tabla Oficial de Formatos Institucionales
          </h2>
          <span className="text-xs text-[#5d7392] dark:text-slate-400">
            Conservación estricta de documentos institucionales
          </span>
        </div>

        <div>
          <div className="sm:hidden px-3 py-1.5 bg-[#2c84c4]/10 dark:bg-blue-950/40 border-b border-black/10 dark:border-white/10 dark:border-slate-800 text-[10px] text-[#1d5fa8] dark:text-[#69bdd7] dark:text-cyan-300 flex items-center justify-between font-medium">
            <span>Desliza horizontalmente para ver todas las columnas</span>
            <span className="font-bold">↔</span>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px] lg:min-w-full">
            <thead>
              <tr className="bg-black/[0.04] dark:bg-white/[0.06] border-b border-black/10 dark:border-white/10 text-[11px] font-bold text-[#3a5274] dark:text-slate-300 uppercase tracking-wider">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Nombre del Formato</th>
                <th className="py-3 px-3 text-center">Versión Vigente</th>
                <th className="py-3 px-3 text-center">Fecha Vigencia</th>
                <th className="py-3 px-3 text-center">Vigente</th>
                <th className="py-3 px-3 text-center">Obligatorio</th>
                <th className="py-3 px-4 text-right">Acciones de Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10 text-[#0b1d3a] dark:text-white">
              {institutionalForms.map((form) => (
                <tr key={form.id} className="hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-extrabold text-[#1d5fa8] dark:text-[#69bdd7] text-xs">
                    {form.code}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#0b1d3a] dark:text-white max-w-sm">
                    {form.name}
                    <div className="text-[10px] text-[#5d7392] dark:text-slate-400 font-normal mt-0.5">
                      {form.description}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-[#0b1d3a] dark:text-white">
                    <span className="bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 rounded border border-black/10 dark:border-white/10">
                      v{form.currentVersion}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center text-[#3a5274] dark:text-slate-300 font-mono text-[11px]">
                    {form.effectiveDate}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] border border-[#2c84c4]/30">
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
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] border border-[#2c84c4]/30">
                          Sí (Obligatorio)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#3a5274] dark:text-slate-300 border border-black/10 dark:border-white/10">
                          Opcional
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handlePreview(form)}
                      className="px-2.5 py-1.5 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/5 dark:hover:bg-white/10 text-[#3a5274] dark:text-slate-300 text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1"
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
          <div key={form.code} className="fs-card rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 bg-black/[0.04] dark:bg-white/[0.06] border-b border-black/10 dark:border-white/10 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-[#1d5fa8] dark:text-[#69bdd7]">{form.code}</span>
                <h3 className="font-bold text-xs text-[#0b1d3a] dark:text-white">{form.name}</h3>
              </div>
              <span className="text-[10px] font-bold bg-black/[0.08] dark:bg-white/10 text-[#3a5274] dark:text-slate-300 px-2 py-0.5 rounded">
                {form.versionHistory.length} Versiones Históricas
              </span>
            </div>

            <div className="p-4 space-y-3">
              <div className="divide-y divide-black/10 dark:divide-white/10 text-xs">
                {form.versionHistory.map((hist, idx) => (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          hist.isActive
                            ? 'bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] border border-[#2c84c4]/30'
                            : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#3a5274] dark:text-slate-300'
                        }`}>
                          v{hist.version}
                        </span>
                        <span className="text-[#5d7392] dark:text-slate-400 text-[11px] flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {hist.releaseDate}
                        </span>
                      </div>
                      <span className={`text-[10px] font-semibold ${
                        hist.isActive ? 'text-[#1d5fa8] dark:text-[#69bdd7]' : 'text-[#5d7392] dark:text-slate-400'
                      }`}>
                        {hist.isActive ? 'Activa Vigente' : 'No Vigente (Histórica)'}
                      </span>
                    </div>
                    <p className="text-[#3a5274] dark:text-slate-300 text-xs">{hist.changeSummary}</p>
                    <div className="text-[10px] text-[#5d7392] dark:text-slate-400">
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
          <div className="fs-card rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh] sm:max-h-[88vh]">
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

            <form onSubmit={handleSaveNewVersion} className="p-4 sm:p-6 space-y-4 text-xs text-[#3a5274] dark:text-slate-300 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0b1d3a] dark:text-white mb-1">
                    Número de Nueva Versión
                  </label>
                  <input
                    type="text"
                    value={newVersionString}
                    onChange={(e) => setNewVersionString(e.target.value)}
                    placeholder="Ej. 15.0"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 font-mono font-bold text-[#0b1d3a] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0b1d3a] dark:text-white mb-1">
                    Fecha de Entrada en Vigencia
                  </label>
                  <input
                    type="date"
                    value={newReleaseDate}
                    onChange={(e) => setNewReleaseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 font-mono text-[#0b1d3a] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0b1d3a] dark:text-white mb-1">
                  Área / Funcionario Responsable
                </label>
                <input
                  type="text"
                  value={newModifiedBy}
                  onChange={(e) => setNewModifiedBy(e.target.value)}
                  placeholder="Ej. Coordinación SIG / Dirección Jurídica"
                  className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 text-[#0b1d3a] dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0b1d3a] dark:text-white mb-1">
                  Resumen Detallado de Modificaciones (Control de Cambios)
                </label>
                <textarea
                  rows={3}
                  value={newChangeSummary}
                  onChange={(e) => setNewChangeSummary(e.target.value)}
                  placeholder="Describa los cambios efectuados respecto a la versión anterior..."
                  className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 text-[#0b1d3a] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="newIsMandatoryCheckbox"
                  checked={newIsMandatory}
                  onChange={(e) => setNewIsMandatory(e.target.checked)}
                  className="w-4 h-4 text-[#1d5fa8] dark:text-[#69bdd7] rounded-md border-black/10 dark:border-white/10 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="newIsMandatoryCheckbox" className="font-semibold text-[#0b1d3a] dark:text-white cursor-pointer select-none">
                  Marcar como documento institucional obligatorio en el expediente digital
                </label>
              </div>

              <div className="bg-[#2c84c4]/10 border border-[#2c84c4]/30 p-3.5 rounded-xl text-[11px] text-[#3a5274] dark:text-slate-300 space-y-0.5">
                <p className="font-bold text-[#1d5fa8] dark:text-[#69bdd7]">Principio de No Destrucción Documental:</p>
                <p>
                  Las versiones anteriores no serán eliminadas del historial y los proveedores que hayan presentado versiones previas conservarán su registro inalterado.
                </p>
              </div>

              <div className="pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNewVersionModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-[#3a5274] dark:text-slate-300 hover:text-[#0b1d3a] dark:hover:text-white rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
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
