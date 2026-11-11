import React, { useRef, useState } from 'react';
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
  Upload,
  Loader2,
  Pencil,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InstitutionalForm } from '../types';
import { InstitutionalFormsViewerModal } from './InstitutionalFormsViewerModal';
import { FlotaSugamuxiLogo } from './FlotaSugamuxiLogo';
import { PageHeader, heroPrimaryBtn, heroSecondaryBtn } from './ui/archive';
import { storageService } from '../services/storageService';
import { supabaseService } from '../services/supabaseService';
import { formatFileSize, getFormPdf, validatePdfFile } from '../utils/formPdf';

export const InstitutionalFormsAdmin: React.FC = () => {
  const { institutionalForms, addNewFormVersion, toggleFormMandatory, updateFormDetails, showToast } = useApp();
  // Edición de los datos del formato
  const [editCode, setEditCode] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: '', description: '', currentVersion: '', effectiveDate: '', isMandatory: true });
  const [selectedFormForModal, setSelectedFormForModal] = useState<InstitutionalForm | null>(null);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);

  // New Version Modal state
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [targetFormCode, setTargetFormCode] = useState('FS.GA-FOR-009');
  const [newVersionString, setNewVersionString] = useState('15.0');
  const [newReleaseDate, setNewReleaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newModifiedBy, setNewModifiedBy] = useState('Coordinación SIG / Calidad');
  const [newChangeSummary, setNewChangeSummary] = useState('');
  const [newIsMandatory, setNewIsMandatory] = useState(true);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Versión que abre el visor al pulsar "Ver PDF" en el historial
  const [viewerVersion, setViewerVersion] = useState<string | null>(null);

  const handleOpenNewVersionModal = (form: InstitutionalForm) => {
    setTargetFormCode(form.code);
    const nextMajor = (parseFloat(form.currentVersion) + 1.0).toFixed(1);
    setNewVersionString(nextMajor);
    setNewChangeSummary('');
    setNewIsMandatory(form.isMandatory);
    setNewFile(null);
    setFileError('');
    setNewReleaseDate(new Date().toISOString().slice(0, 10));
    setIsNewVersionModalOpen(true);
  };

  const handlePickFile = async (file: File | undefined) => {
    setFileError('');
    if (!file) return;
    const problem = await validatePdfFile(file);
    if (problem) {
      setNewFile(null);
      setFileError(problem);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setNewFile(file);
  };

  const handleSaveNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChangeSummary.trim()) {
      showToast('Por favor describa el resumen de cambios de la nueva versión.', 'warning');
      return;
    }

    const target = institutionalForms.find((f) => f.code === targetFormCode);
    if (target?.versionHistory.some((h) => h.version.trim() === newVersionString.trim())) {
      showToast(`La versión ${newVersionString} ya existe en el historial. Use otro número.`, 'warning');
      return;
    }
    if (!newFile) {
      setFileError('Cargue el PDF de la nueva versión.');
      return;
    }

    setIsPublishing(true);
    // Sube el PDF a Storage; sin base de datos conectada queda disponible solo en esta sesión
    let fileUrl = '';
    if (supabaseService.isConfigured()) {
      const up = await storageService.uploadInstitutionalTemplate({
        file: newFile,
        fileName: `${targetFormCode}_v${newVersionString.trim()}.pdf`,
        formCode: targetFormCode,
      });
      if (!up.success || !up.url) {
        setIsPublishing(false);
        setFileError(`No se pudo subir el PDF${up.error ? `: ${up.error}` : '.'}`);
        return;
      }
      fileUrl = up.url;
    } else {
      fileUrl = URL.createObjectURL(newFile);
    }

    addNewFormVersion(
      targetFormCode,
      newVersionString.trim(),
      newReleaseDate,
      newModifiedBy,
      newChangeSummary,
      newIsMandatory,
      { url: fileUrl, fileName: newFile.name, fileSize: formatFileSize(newFile.size) }
    );

    setIsPublishing(false);
    showToast(`Versión ${newVersionString} de ${targetFormCode} publicada exitosamente.`, 'success');
    setIsNewVersionModalOpen(false);
  };

  const handlePreview = (form: InstitutionalForm, version?: string) => {
    setViewerVersion(version || null);
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
                <th className="py-3 px-4 text-right">Botones de acción</th>
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
                      onClick={() => {
                        setDraft({
                          name: form.name,
                          description: form.description,
                          currentVersion: form.currentVersion,
                          effectiveDate: form.effectiveDate,
                          isMandatory: form.isMandatory,
                        });
                        setEditCode(form.code);
                      }}
                      className="px-2.5 py-1.5 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/5 dark:hover:bg-white/10 text-[#3a5274] dark:text-slate-300 text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1"
                      title="Editar datos del formato"
                      aria-label="Editar datos del formato"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
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
                    <div className="flex items-center justify-between gap-3 text-[10px] text-[#5d7392] dark:text-slate-400">
                      <span>Responsable: {hist.modifiedBy}</span>
                      {getFormPdf(form, hist.version) ? (
                        <button
                          type="button"
                          onClick={() => handlePreview(form, hist.version)}
                          className="inline-flex items-center gap-1 font-bold text-[#1d5fa8] dark:text-[#69bdd7] hover:underline cursor-pointer"
                        >
                          <FileText className="w-3 h-3" /> Ver PDF{hist.fileSize ? ` (${hist.fileSize})` : ''}
                        </button>
                      ) : (
                        <span>Sin archivo</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Registering a New Version */}
      {editCode && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
          <div className="fs-card rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-[#0b1329] text-white px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-blue-600 px-2 py-0.5 rounded text-white">Datos del formato</span>
                <h3 className="text-sm sm:text-base font-bold text-white mt-1">Editar &bull; {editCode}</h3>
              </div>
              <button type="button" onClick={() => setEditCode(null)} className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">✕</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!draft.name.trim() || !draft.currentVersion.trim() || !draft.effectiveDate) return;
                updateFormDetails(editCode, {
                  ...draft,
                  name: draft.name.trim(),
                  description: draft.description.trim(),
                  currentVersion: draft.currentVersion.trim(),
                });
                setEditCode(null);
                showToast(`Datos de ${editCode} actualizados.`, 'success');
              }}
              className="p-4 sm:p-6 space-y-4 text-xs text-[#3a5274] dark:text-slate-300 overflow-y-auto flex-1"
            >
              <div>
                <label className="block text-xs font-bold text-[#0b1d3a] dark:text-white mb-1">Nombre del formato</label>
                <input type="text" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 text-[#0b1d3a] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0b1d3a] dark:text-white mb-1">Descripción</label>
                <textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 text-[#0b1d3a] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0b1d3a] dark:text-white mb-1">Versión vigente</label>
                  <input type="text" value={draft.currentVersion} onChange={(e) => setDraft({ ...draft, currentVersion: e.target.value })} required className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 font-mono font-bold text-[#0b1d3a] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0b1d3a] dark:text-white mb-1">Fecha de vigencia</label>
                  <input type="date" value={draft.effectiveDate} onChange={(e) => setDraft({ ...draft, effectiveDate: e.target.value })} required className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 font-mono text-[#0b1d3a] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={draft.isMandatory} onChange={(e) => setDraft({ ...draft, isMandatory: e.target.checked })} className="w-4 h-4" />
                <span className="font-semibold text-[#0b1d3a] dark:text-white">Documento obligatorio</span>
              </label>
              <div className="flex justify-end gap-2 pt-2 border-t border-black/10 dark:border-white/10">
                <button type="button" onClick={() => setEditCode(null)} className="px-4 py-2.5 text-xs font-semibold rounded-xl text-[#3a5274] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

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

              <div>
                <label className="block text-xs font-bold text-[#0b1d3a] dark:text-white mb-1">
                  Archivo PDF de la nueva versión
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => handlePickFile(e.target.files?.[0])}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full flex items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 text-left cursor-pointer transition-colors ${
                    newFile
                      ? 'border-[#2c84c4]/50 bg-[#2c84c4]/10'
                      : 'border-black/15 dark:border-white/20 hover:bg-[#2c84c4]/5'
                  }`}
                >
                  <span className="w-10 h-10 rounded-xl bg-[#2c84c4]/15 text-[#1d5fa8] dark:text-[#69bdd7] grid place-items-center shrink-0">
                    {newFile ? <FileText className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[#0b1d3a] dark:text-white truncate">
                      {newFile ? newFile.name : 'Seleccionar archivo PDF'}
                    </span>
                    <span className="block text-[11px] text-[#5d7392] dark:text-slate-400">
                      {newFile ? formatFileSize(newFile.size) : 'Solo formato PDF · máximo 10 MB'}
                    </span>
                  </span>
                </button>
                {fileError && (
                  <p role="alert" className="mt-1.5 text-[11px] font-semibold text-red-600 dark:text-red-300">{fileError}</p>
                )}
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
                  disabled={isPublishing}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  {isPublishing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isPublishing ? 'Subiendo PDF…' : 'Publicar y Activar Nueva Versión'}
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
        onClose={() => {
          setIsViewerModalOpen(false);
          setViewerVersion(null);
        }}
        initialVersion={viewerVersion || undefined}
      />

    </div>
  );
};
