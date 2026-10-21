import React, { useState, useEffect } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  Calendar,
  Layers,
  FileUp,
} from 'lucide-react';
import { SupplierDocument, DocumentStatus, UserRole } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  document: SupplierDocument | null;
  docCode: string;
  docTitle?: string;
  documentTitle?: string;
  userRole?: UserRole;
  reviewerName?: string;
  onSave: (
    docCode: string,
    updates: {
      name?: string;
      fileName?: string;
      fileSize?: string;
      customUrl?: string;
      status?: DocumentStatus;
      expirationDate?: string;
      notes?: string;
    },
    justification: string
  ) => void;
}

export const DocumentEditorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  document,
  docCode,
  docTitle,
  documentTitle,
  userRole = 'REVISOR',
  reviewerName = 'Evaluador SIG',
  onSave,
}) => {
  const displayTitle = documentTitle || docTitle || docCode;
  if (!isOpen || !document) return null;

  const [name, setName] = useState(document.name);
  const [fileName, setFileName] = useState(document.fileName || '');
  const [fileSize, setFileSize] = useState(document.fileSize || '1.4 MB');
  const [fileError, setFileError] = useState<string | null>(null);
  const [status, setStatus] = useState<DocumentStatus>(document.status);
  const [expirationDate, setExpirationDate] = useState(document.expirationDate || '');
  const [notes, setNotes] = useState(document.notes || '');
  const [justification, setJustification] = useState('Modificación documental autorizada por Revisor Técnico / Administrador.');
  const [hasFile, setHasFile] = useState(Boolean(document.fileName));

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  useEffect(() => {
    setName(document.name);
    setFileName(document.fileName || '');
    setFileSize(document.fileSize || '1.4 MB');
    setFileError(null);
    setStatus(document.status);
    setExpirationDate(document.expirationDate || '');
    setNotes(document.notes || '');
    setHasFile(Boolean(document.fileName));
  }, [document]);

  const handleSimulateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validación de no permitir subir archivos mayores a 5 MB
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        setFileError(`El archivo "${file.name}" pesa ${sizeMb} MB y excede el límite máximo permitido de 5 MB. Por favor comprima o seleccione un archivo menor a 5 MB.`);
        e.target.value = '';
        return;
      }

      setFileName(file.name);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const formattedSize = file.size > 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`;
      setFileSize(formattedSize);
      setHasFile(true);
      if (status === 'PENDIENTE') {
        setStatus('CARGADO');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) {
      alert('Por favor ingrese la justificación obligatoria para la trazabilidad y auditoría.');
      return;
    }

    onSave(
      docCode,
      {
        name: name.trim(),
        fileName: hasFile ? (fileName || `${docCode.toLowerCase()}.pdf`) : undefined,
        fileSize: hasFile ? fileSize : undefined,
        status,
        expirationDate: expirationDate || undefined,
        notes: notes.trim(),
      },
      justification.trim()
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-blue-950 to-blue-900 text-white px-5 sm:px-6 py-3.5 sm:py-4 border-b border-blue-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-blue-900/90 border border-cyan-500/40 rounded-lg text-cyan-400 shrink-0">
              <FileUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase bg-blue-900 text-cyan-300 px-2 py-0.5 rounded border border-blue-700">
                Gestión Documental &bull; {userRole === 'ADMIN' ? 'Administrador' : 'Revisor Técnico'}
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5 truncate max-w-md">
                Modificar Requisito: {displayTitle || document.name}
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

        {/* Form Container with Flex and Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs text-slate-700 scrollbar-thin scrollbar-thumb-slate-300">
            
            {/* Document Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Nombre Oficial del Requisito / Documento
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            {/* File Upload / Replace */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  Archivo Adjunto / Sustituto
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasFile}
                    onChange={(e) => setHasFile(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[11px] font-semibold text-slate-600">Tiene archivo cargado</span>
                </label>
              </div>

              {fileError && (
                <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-lg flex items-start gap-2 text-white text-[11px] animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Archivo no permitido (Máximo 5 MB)</span>
                    <span className="text-slate-300">{fileError}</span>
                  </div>
                </div>
              )}

              {hasFile && (
                <div className="space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-600">
                        Nombre del Archivo
                      </label>
                      {fileSize && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                          Tamaño: {fileSize} (Máx. 5 MB)
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="ejemplo_documento.pdf"
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-slate-300 font-mono text-[11px] text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-0.5">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs border border-blue-700">
                      <FileUp className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Reemplazar / Subir nuevo archivo (PDF / Excel)</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx"
                        onChange={handleSimulateFileUpload}
                      />
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Límite de tamaño: <strong>5 MB</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Status & Expiration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Estado del Documento
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DocumentStatus)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                >
                  <option value="APROBADO">APROBADO</option>
                  <option value="CARGADO">CARGADO (EN REVISIÓN)</option>
                  <option value="REQUIERE_CORRECCION">REQUIERE CORRECCIÓN</option>
                  <option value="PENDIENTE">PENDIENTE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Fecha de Vigencia / Expiración (Opcional)
                </label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Reviewer Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Observaciones o Notas de Control
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Verificado contra cámara de comercio con código de verificación válido."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
              />
            </div>

            {/* Justification for Audit Trail */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-1.5">
              <label className="block text-xs font-bold text-blue-950">
                Justificación de la Modificación (Trazabilidad y Auditoría) <span className="text-blue-600 font-bold">*</span>
              </label>
              <textarea
                rows={2}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Escriba el motivo institucional de la edición o reemplazo del documento..."
                className="w-full px-3 py-1.5 bg-white rounded border border-blue-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-600"
                required
              />
              <p className="text-[10px] text-blue-800">
                Esta modificación quedará registrada con fecha, hora y firma del usuario <strong>{reviewerName}</strong>.
              </p>
            </div>

          </div>

          {/* Sticky Footer Buttons */}
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
              <span>Guardar Cambios del Documento</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
