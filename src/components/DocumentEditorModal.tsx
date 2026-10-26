import React, { useState, useEffect, useRef } from 'react';
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
  Trash2,
  AlertCircle,
  Clock,
  Sparkles,
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
      uploadedBy?: string;
      uploadedAt?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !document) return null;

  const isMandatory = Boolean(document.isRequired);

  const [name, setName] = useState(document.name);
  const [fileName, setFileName] = useState(document.fileName || '');
  const [fileSize, setFileSize] = useState(document.fileSize || '1.4 MB');
  const [customUrl, setCustomUrl] = useState<string>(document.customUrl || document.previewUrl || '');
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<DocumentStatus>(document.status);
  const [expirationDate, setExpirationDate] = useState(document.expirationDate || '');
  const [notes, setNotes] = useState(document.notes || '');
  const [justification, setJustification] = useState('Cargue y certificación documental realizada por el Revisor Técnico / Evaluador SIG.');
  const [hasFile, setHasFile] = useState(Boolean(document.fileName));
  const [isDragging, setIsDragging] = useState(false);

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  useEffect(() => {
    setName(document.name);
    setFileName(document.fileName || '');
    setFileSize(document.fileSize || '1.4 MB');
    setCustomUrl(document.customUrl || document.previewUrl || '');
    setFileError(null);
    setFormError(null);

    // Si el documento ya tiene archivo cargado y está pendiente o en revisión, precargarlo como APROBADO
    if (document.fileName && (document.status === 'CARGADO' || document.status === 'PENDIENTE')) {
      setStatus('APROBADO');
    } else {
      setStatus(document.status);
    }

    setExpirationDate(document.expirationDate || '');
    setNotes(document.notes || '');
    setHasFile(Boolean(document.fileName));
    setJustification('Cargue y certificación documental realizada por el Revisor Técnico / Evaluador SIG.');
  }, [document]);

  const processSelectedFile = (file: File) => {
    setFileError(null);
    setFormError(null);

    // Validación de tamaño máximo 5 MB
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setFileError(`El archivo "${file.name}" pesa ${sizeMb} MB y excede el límite máximo permitido de 5 MB. Por favor comprima o seleccione un archivo menor a 5 MB.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setFileName(file.name);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    const formattedSize = file.size > 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`;
    setFileSize(formattedSize);
    setHasFile(true);

    // Leer Data URL para previsualización directa en el navegador
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setCustomUrl(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Precarga automática del estado a APROBADO al cargar el archivo
    setStatus('APROBADO');
  };

  const handleSimulateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveFile = () => {
    setFileName('');
    setFileSize('');
    setCustomUrl('');
    setHasFile(false);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Si se remueve el archivo, regresa a PENDIENTE
    setStatus('PENDIENTE');
  };

  const handleExpirationDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setExpirationDate(val);
    setFormError(null);
    // Precarga automática del estado a APROBADO al ingresar o modificar la fecha de vigencia
    if (val) {
      setStatus('APROBADO');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validación 1: Si el requisito es OBLIGATORIO, es estrictamente obligatorio adjuntar el archivo soporte
    if (isMandatory && (!hasFile || !fileName || !fileName.trim())) {
      setFormError('Este requisito está clasificado como OBLIGATORIO para el proveedor. El revisor técnico debe adjuntar obligatoriamente el archivo soporte (PDF, Excel o Imagen) antes de poder guardar o certificar este requisito.');
      return;
    }

    // Validación 2: Si el estado es APROBADO, debe existir archivo soporte adjunto
    if (status === 'APROBADO' && (!hasFile || !fileName || !fileName.trim())) {
      setFormError('Para certificar el requisito con estado APROBADO, es indispensable adjuntar el archivo soporte correspondiente.');
      return;
    }

    // Validación 3: Justificación de trazabilidad y auditoría
    if (!justification.trim()) {
      setFormError('Por favor ingrese la justificación obligatoria para la trazabilidad y auditoría institucional.');
      return;
    }

    onSave(
      docCode,
      {
        name: name.trim(),
        fileName: hasFile ? (fileName.trim() || `${docCode.toLowerCase()}.pdf`) : undefined,
        fileSize: hasFile ? fileSize : undefined,
        customUrl: hasFile ? customUrl : undefined,
        status,
        expirationDate: expirationDate || undefined,
        notes: notes.trim(),
        uploadedBy: hasFile ? reviewerName : undefined,
        uploadedAt: hasFile ? new Date().toLocaleString('es-CO') : undefined,
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase bg-blue-900 text-cyan-300 px-2 py-0.5 rounded border border-blue-700">
                  Cargue &bull; {userRole === 'ADMIN' ? 'Administrador' : 'Revisor Técnico'}
                </span>
                {isMandatory ? (
                  <span className="text-[10px] font-extrabold uppercase bg-red-900/90 text-red-200 px-2 py-0.5 rounded border border-red-600 shadow-2xs">
                    Requisito Obligatorio
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    Requisito Opcional
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5 truncate max-w-md">
                Modificar Requisito: {displayTitle || document.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors shrink-0 ml-2 cursor-pointer"
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

            {/* File Upload Section - Direct Reviewer Upload */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  Cargue de Documento Soporte por el Revisor Técnico
                </span>
                <span className="text-[10px] text-blue-800 font-medium bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded">
                  Evaluador: {reviewerName}
                </span>
              </div>

              {/* Hidden file input controlled via ref or label */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx"
                onChange={handleSimulateFileUpload}
              />

              {fileError && (
                <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-lg flex items-start gap-2 text-white text-[11px] animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Archivo no permitido (Máximo 5 MB)</span>
                    <span className="text-slate-300">{fileError}</span>
                  </div>
                </div>
              )}

              {hasFile ? (
                <div className="bg-white border border-blue-200 rounded-xl p-3 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg shrink-0">
                        <FileCheck className="w-5 h-5 text-blue-700" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Soporte Adjunto
                          </span>
                          {fileSize && (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {fileSize}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                          placeholder="nombre_archivo.pdf"
                          className="w-full mt-1 px-2.5 py-1 bg-slate-50 rounded border border-slate-300 font-mono text-[11px] text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                          title="Nombre del archivo adjunto"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-2xs border border-blue-700"
                    >
                      <FileUp className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Reemplazar Archivo Soporte</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar archivo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-blue-600 bg-blue-100/60'
                      : 'border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/80'
                  }`}
                >
                  <UploadCloud className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800">
                    Haga clic aquí para seleccionar o arrastre el archivo soporte
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Formatos: PDF, Excel (.xlsx, .xls), Word (.docx), Imágenes (.png, .jpg) &bull; Máx. 5 MB
                  </p>
                  {isMandatory && (
                    <div className="mt-2.5 inline-flex items-center gap-1.5 text-[10.5px] font-bold text-red-800 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span>Obligatorio: Se requiere adjuntar el soporte documental para habilitar este requisito.</span>
                    </div>
                  )}
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
                  className={`w-full px-3 py-2 rounded-lg border font-bold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 ${
                    status === 'APROBADO'
                      ? 'border-blue-600 text-blue-900 bg-blue-50/30'
                      : status === 'REQUIERE_CORRECCION'
                      ? 'border-slate-400 text-slate-800'
                      : 'border-slate-300'
                  }`}
                >
                  <option value="APROBADO">✅ APROBADO (Habilitado)</option>
                  <option value="CARGADO">📄 CARGADO (En Revisión)</option>
                  <option value="REQUIERE_CORRECCION">⚠️ REQUIERE CORRECCIÓN</option>
                  <option value="PENDIENTE">⏳ PENDIENTE</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-600 shrink-0" />
                  <span>Se precarga en APROBADO al cargar archivo o editar vigencia.</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Fecha de Vigencia / Expiración (Opcional)
                </label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={handleExpirationDateChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 bg-white focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Al modificar la vigencia se precarga el estado como APROBADO.</span>
                </p>
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
                placeholder="Ej. Soporte revisado y verificado con código de verificación válido."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-600"
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
                placeholder="Escriba el motivo institucional del cargue o certificación del documento..."
                className="w-full px-3 py-1.5 bg-white rounded border border-blue-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-600"
                required
              />
              <p className="text-[10px] text-blue-800">
                Esta acción quedará registrada con fecha, hora y firma del usuario <strong>{reviewerName}</strong>.
              </p>
            </div>

            {/* Form Validation Error Banner */}
            {formError && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block text-red-900">Validación Requerida</span>
                  <span className="text-red-700 leading-snug">{formError}</span>
                </div>
              </div>
            )}

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
              <span>Guardar y Certificar Requisito</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
