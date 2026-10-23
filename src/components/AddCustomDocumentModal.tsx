import React, { useState } from 'react';
import {
  FilePlus,
  UploadCloud,
  CheckCircle2,
  X,
  FileUp,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { generateDocumentCodeSuggestions } from '../utils/documentCodeGenerator';
import { SupplierDocument, DocumentStatus, UserRole } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dossierId?: string;
  userRole?: UserRole;
  reviewerName?: string;
  existingDocCodes?: string[];
  onAdd: (newDoc: SupplierDocument, justification: string) => void;
}

export const AddCustomDocumentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  dossierId = '',
  userRole = 'REVISOR',
  reviewerName = 'Evaluador SIG',
  existingDocCodes = [],
  onAdd,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('Certificación / Anexo Técnico Especial');
  const [code, setCode] = useState(() => generateDocumentCodeSuggestions('Certificación / Anexo Técnico Especial').primary || `DOC_ESP_${Date.now().toString().slice(-4)}`);
  const [isCodeCustomized, setIsCodeCustomized] = useState(false);

  const docSuggestions = React.useMemo(() => {
    return generateDocumentCodeSuggestions(name);
  }, [name]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isCodeCustomized) {
      const suggestions = generateDocumentCodeSuggestions(val);
      setCode(suggestions.primary);
    }
  };

  const handleCodeChange = (val: string) => {
    setCode(val.toUpperCase().replace(/\s+/g, '_'));
    setIsCodeCustomized(true);
  };

  const handleApplySuggestion = (sugCode: string) => {
    setCode(sugCode);
    setIsCodeCustomized(true);
  };

  const handleResetToAuto = () => {
    setIsCodeCustomized(false);
    const suggestions = generateDocumentCodeSuggestions(name);
    setCode(suggestions.primary);
  };
  const [isRequired, setIsRequired] = useState(false);
  const [status, setStatus] = useState<DocumentStatus>('CARGADO');
  const [fileName, setFileName] = useState('anexo_tecnico_especial.pdf');
  const [fileSize, setFileSize] = useState('1.5 MB');
  const [fileError, setFileError] = useState<string | null>(null);
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('Documento complementario solicitado en comité técnico.');
  const [justification, setJustification] = useState('Adición de documento específico para homologación.');

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        setFileError(`El archivo "${file.name}" pesa ${sizeMb} MB y excede el límite máximo permitido de 5 MB.`);
        e.target.value = '';
        return;
      }

      setFileName(file.name);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const formattedSize = file.size > 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`;
      setFileSize(formattedSize);
      setStatus('CARGADO');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !justification.trim()) {
      alert('Por favor complete el nombre, código y la justificación obligatoria.');
      return;
    }

    const newDoc: SupplierDocument = {
      id: `doc-${dossierId}-${code.toLowerCase().replace(/\s+/g, '_')}`,
      code: code.toUpperCase().replace(/\s+/g, '_'),
      name: name.trim(),
      isRequired,
      isInstitutionalForm: false,
      status,
      fileName: fileName ? fileName.trim() : undefined,
      fileSize: fileName ? fileSize : undefined,
      uploadedAt: new Date().toISOString().split('T')[0],
      uploadedBy: reviewerName,
      reviewedAt: status === 'APROBADO' ? new Date().toISOString().split('T')[0] : undefined,
      reviewedBy: status === 'APROBADO' ? reviewerName : undefined,
      expirationDate: expirationDate || undefined,
      notes: notes.trim(),
    };

    onAdd(newDoc, justification.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-blue-950 to-blue-900 text-white px-5 sm:px-6 py-3.5 sm:py-4 border-b border-blue-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-blue-900/90 border border-cyan-500/40 rounded-lg text-cyan-400 shrink-0">
              <FilePlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase bg-blue-900 text-cyan-300 px-2 py-0.5 rounded border border-blue-700">
                Nuevo Requisito Especial &bull; {userRole === 'ADMIN' ? 'Administrador' : 'Revisor'}
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5 truncate">
                Anexar Documento al Expediente
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs text-slate-700 scrollbar-thin scrollbar-thumb-slate-300">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Nombre Oficial del Documento <span className="text-blue-600 font-bold">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ej. Certificado de Calidad ISO 9001 o Póliza de Responsabilidad Civil"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-800">
                    Código del Documento <span className="text-blue-600 font-bold">*</span>
                  </label>
                  {isCodeCustomized ? (
                    <button
                      type="button"
                      onClick={handleResetToAuto}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer"
                      title="Recalcular automáticamente"
                    >
                      <Zap className="w-2.5 h-2.5 text-amber-500" />
                      Auto iniciales
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Zap className="w-2.5 h-2.5" />
                      Auto iniciales
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="CERT_ISO, POLIZA_RC, etc."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold tracking-wider text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Obligatoriedad
                </label>
                <div className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isRequiredCustom"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="isRequiredCustom" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Requisito Obligatorio
                  </label>
                </div>
              </div>
            </div>

            {name.trim().length > 2 && (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Sugerencias nemotécnicas (clic para aplicar):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {docSuggestions.initials && (
                    <button
                      type="button"
                      onClick={() => handleApplySuggestion(docSuggestions.initials)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                        code === docSuggestions.initials
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400'
                      }`}
                    >
                      ⚡ {docSuggestions.initials} <span className="opacity-75 font-sans text-[9px]">(Iniciales)</span>
                    </button>
                  )}
                  {docSuggestions.prefixInitials && (
                    <button
                      type="button"
                      onClick={() => handleApplySuggestion(docSuggestions.prefixInitials!)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                        code === docSuggestions.prefixInitials
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400'
                      }`}
                    >
                      {docSuggestions.prefixInitials} <span className="opacity-75 font-sans text-[9px]">(Prefijo)</span>
                    </button>
                  )}
                  {docSuggestions.shortSlug && (
                    <button
                      type="button"
                      onClick={() => handleApplySuggestion(docSuggestions.shortSlug)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                        code === docSuggestions.shortSlug
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400'
                      }`}
                    >
                      {docSuggestions.shortSlug} <span className="opacity-75 font-sans text-[9px]">(Corto)</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* File attachment */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-800">
                  Adjuntar Archivo de Soporte (Opcional)
                </label>
                {fileSize && (
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                    Tamaño: {fileSize} (Máx. 5 MB)
                  </span>
                )}
              </div>

              {fileError && (
                <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-lg flex items-start gap-2 text-white text-[11px] animate-in fade-in">
                  <X className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Archivo excede el límite (Máximo 5 MB)</span>
                    <span className="text-slate-300">{fileError}</span>
                  </div>
                </div>
              )}

              <div>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="nombre_archivo.pdf"
                  className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 font-mono text-[11px] text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-0.5">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs border border-blue-700">
                  <FileUp className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Cargar archivo desde el equipo</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx"
                    onChange={handleFileUpload}
                  />
                </label>
                <span className="text-[10px] text-slate-500">
                  Límite de tamaño: <strong>5 MB</strong>
                </span>
              </div>
            </div>

            {/* Status & Expiration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Estado Inicial
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DocumentStatus)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white"
                >
                  <option value="CARGADO">CARGADO (EN REVISIÓN)</option>
                  <option value="APROBADO">APROBADO</option>
                  <option value="PENDIENTE">PENDIENTE (POR SUBIR)</option>
                  <option value="REQUIERE_CORRECCION">REQUIERE CORRECCIÓN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Justification */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-1.5">
              <label className="block text-xs font-bold text-blue-950">
                Justificación de Inclusión del Documento <span className="text-blue-600 font-bold">*</span>
              </label>
              <textarea
                rows={2}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Motivo por el cual se anexa este requisito..."
                className="w-full px-3 py-1.5 bg-white rounded border border-blue-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors border border-blue-700 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Anexar Documento al Expediente</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
