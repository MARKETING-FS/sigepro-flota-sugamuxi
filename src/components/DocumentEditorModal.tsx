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
  ShieldAlert,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { SupplierDocument, DocumentStatus, UserRole } from '../types';
import { useApp } from '../context/AppContext';
import { BrandSwoosh } from './ui/BrandSwoosh';
import { supabaseService } from '../services/supabaseService';
import { storageService } from '../services/storageService';
import { calculateDocumentExpiration } from '../utils/contractValidity';
import { getFormPdf } from '../utils/formPdf';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  document: SupplierDocument | null;
  docCode: string;
  docTitle?: string;
  documentTitle?: string;
  userRole?: UserRole;
  reviewerName?: string;
  requiresExpirationDate?: boolean;
  validityRule?: string;
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
  requiresExpirationDate: propRequiresExpirationDate,
  validityRule: propValidityRule,
  onSave,
}) => {
  const { documentDefinitions, currentDossierId, institutionalForms } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !document) return null;

  // Resolver parametrización de la Matriz de Requisitos Específicos por Actividad Económica
  const docDef = (documentDefinitions || []).find((d) => d.code === docCode);
  const isExpirationRequired = propRequiresExpirationDate ?? docDef?.requiresExpirationDate ?? false;
  const currentValidityRule = propValidityRule || docDef?.validityRule || '';
  // La fecha de vigencia solo se pide en los documentos que la exigen según la parametrización.
  // Un documento agregado a mano (sin definición) conserva la fecha con la que se creó.
  const showExpiration = isExpirationRequired || (!docDef && Boolean(document.expirationDate));

  // Plantilla oficial (PDF vigente del formato institucional) asociada a este documento
  const templateFormCode =
    document.formCode ||
    (docDef as { formCode?: string } | undefined)?.formCode ||
    (/^FS_GA_FOR_\d+$/.test(docCode) ? docCode.replace('FS_GA_FOR_', 'FS.GA-FOR-') : undefined);
  const templateForm = templateFormCode ? (institutionalForms || []).find((f) => f.code === templateFormCode) : undefined;
  const templatePdf = templateForm ? getFormPdf(templateForm) : null;

  const handleDownloadTemplate = async () => {
    if (!templatePdf) return;
    try {
      const res = await fetch(templatePdf.url);
      if (!res.ok) throw new Error('descarga');
      const blob = await res.blob();
      const a = window.document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = templatePdf.fileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch {
      window.open(templatePdf.url, '_blank', 'noopener');
    }
  };

  const displayTitle = documentTitle || docTitle || docCode;
  const isMandatory = Boolean(document.isRequired);

  const [name, setName] = useState(document.name);
  const [fileName, setFileName] = useState(document.fileName || '');
  const [fileSize, setFileSize] = useState(document.fileSize || '1.4 MB');
  const [customUrl, setCustomUrl] = useState<string>(document.customUrl || document.previewUrl || '');
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [expirationDate, setExpirationDate] = useState(showExpiration ? document.expirationDate || '' : '');
  const [notes, setNotes] = useState(document.notes || '');
  const [justification, setJustification] = useState('Cargue y certificación documental realizada por el Revisor Técnico / Evaluador SIG.');
  const [hasFile, setHasFile] = useState(Boolean(document.fileName));
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // El estado del documento se calcula solo. Aprobar se hace con el botón «Aprobar» del expediente:
  // sin archivo queda Pendiente; con archivo nuevo queda Cargado; un documento ya aprobado sigue aprobado
  // mientras no se cambie el archivo; con la fecha vencida queda Vencido.
  const originalUrl = document.customUrl || document.previewUrl || '';
  const fileChanged = fileName !== (document.fileName || '') || customUrl !== originalUrl;
  const wasApproved = document.status === 'APROBADO' || document.status === 'VIGENTE' || document.status === 'POR_VENCER';
  const dateInfo = showExpiration && expirationDate ? calculateDocumentExpiration(expirationDate) : null;
  const status: DocumentStatus = !hasFile
    ? 'PENDIENTE'
    : dateInfo?.status === 'VENCIDO'
    ? 'VENCIDO'
    : wasApproved && !fileChanged
    ? 'APROBADO'
    : 'CARGADO';

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  useEffect(() => {
    setName(document.name);
    setFileName(document.fileName || '');
    setFileSize(document.fileSize || '1.4 MB');
    setCustomUrl(document.customUrl || document.previewUrl || '');
    setFileError(null);
    setFormError(null);

    const initialExpDate = showExpiration ? document.expirationDate || '' : '';
    setExpirationDate(initialExpDate);

    setNotes(document.notes || '');
    setHasFile(Boolean(document.fileName));
    setJustification('Cargue y certificación documental realizada por el Revisor Técnico / Evaluador SIG.');
  }, [document]);

  /** La subida falló: se descarta el archivo para no dejar registrado un documento sin su archivo. */
  const failUpload = (reason?: string) => {
    setFileName('');
    setFileSize('');
    setCustomUrl('');
    setHasFile(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFileError(`No se pudo guardar el archivo${reason ? `: ${reason}` : ''}. Intente de nuevo.`);
  };

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

    if (supabaseService.isConfigured()) {
      // Con la base de datos conectada el archivo se guarda en el almacén privado
      setCustomUrl('');
      setIsUploading(true);
      storageService
        .uploadSupplierDocument({
          file,
          fileName: file.name,
          supplierId: currentDossierId || 'sin-expediente',
          fileNumber: '',
          documentCode: docCode,
        })
        .then((res) => {
          if (res.success && res.url) {
            setCustomUrl(res.url);
          } else {
            failUpload(res.error);
          }
        })
        .catch(() => failUpload())
        .finally(() => setIsUploading(false));
    } else {
      // Sin base de datos (modo de demostración) el archivo queda solo en este navegador
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setCustomUrl(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
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
  };

  // Cambio de la fecha de vigencia / expiración
  const handleExpirationDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setExpirationDate(val);
    setFormError(null);
    if (!val.trim() && isExpirationRequired) {
      setFormError('Atención: Este requisito exige fecha de vencimiento según la Matriz de Requisitos.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isUploading) {
      setFormError('El archivo todavía se está guardando. Espere unos segundos y vuelva a intentar.');
      return;
    }

    // Validación 1: Si es obligatorio en expediente, debe adjuntar archivo soporte
    if (isMandatory && (!hasFile || !fileName || !fileName.trim())) {
      setFormError('Este requisito está clasificado como OBLIGATORIO para el expediente del proveedor. El revisor técnico debe adjuntar obligatoriamente el archivo soporte (PDF, Excel o Imagen) antes de poder guardar o certificar este requisito.');
      return;
    }

    // Validación 3: Si la Matriz exige fecha de vencimiento, debe ingresarse obligatoriamente
    if (isExpirationRequired && (!expirationDate || !expirationDate.trim())) {
      setFormError('Este requisito está parametrizado en la Matriz de Requisitos por Actividad Económica con exigencia obligatoria de Fecha de Vigencia / Expiración. Por favor ingrese la fecha de caducidad.');
      return;
    }

    // Validación 5: Justificación de auditoría obligatoria
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
        expirationDate: showExpiration ? expirationDate || undefined : '',
        notes: notes.trim(),
        uploadedBy: hasFile ? reviewerName : undefined,
        uploadedAt: hasFile ? new Date().toLocaleString('es-CO') : undefined,
      },
      justification.trim()
    );
    onClose();
  };

  // Cálculo en tiempo real de semáforo de expiración para renderizar alerta
  const currentExp = expirationDate ? calculateDocumentExpiration(expirationDate) : null;

  const STATUS_VIEW: Record<string, { label: string; hint: string; cls: string }> = {
    PENDIENTE: {
      label: 'Pendiente',
      hint: 'Todavía no tiene archivo.',
      cls: 'border-black/10 dark:border-white/10 text-[#0b1d3a] dark:text-white',
    },
    CARGADO: {
      label: 'Cargado · falta aprobar',
      hint: 'Para aprobarlo use el botón «Aprobar» del documento.',
      cls: 'border-[#0f6b8f]/50 text-[#0a5473] dark:text-[#5db2c9]',
    },
    APROBADO: {
      label: 'Aprobado',
      hint: 'Sigue aprobado mientras no se cambie el archivo.',
      cls: 'border-[#0f6b8f]/50 text-[#0a5473] dark:text-[#5db2c9]',
    },
    VENCIDO: {
      label: 'Vencido',
      hint: 'La fecha ya pasó: hay que cargar el documento renovado.',
      cls: 'border-red-500 text-red-600 dark:text-red-300',
    },
  };
  const statusView = STATUS_VIEW[status] || STATUS_VIEW.PENDIENTE;

  const labelCls = 'block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0f6b8f] dark:text-[#5db2c9] mb-1.5';
  const stepNum = (n: number) => (
    <span className="w-6 h-6 rounded-lg bg-gradient-action text-white text-[11px] font-semibold grid place-items-center shrink-0">{n}</span>
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#131b2e]/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
      <div className="fs-card rounded-[28px] max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-fade-up">

        {/* Encabezado */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-brand text-white px-6 py-5">
          <BrandSwoosh className="absolute -right-10 -bottom-10 w-72 opacity-60" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5 min-w-0">
              <span className="shrink-0 w-12 h-12 rounded-2xl bg-white/15 border border-white/30 backdrop-blur-sm grid place-items-center">
                <FileUp className="w-6 h-6" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/15 border border-white/25 px-2.5 py-0.5 rounded-full">
                    Gestión documental &bull; {userRole === 'ADMIN' ? 'Administrador' : 'Revisor técnico'}
                  </span>
                  {isMandatory ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-red-500/90 text-white px-2.5 py-0.5 rounded-full">
                      Obligatorio
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full">
                      Opcional
                    </span>
                  )}
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#5db2c9]/30 border border-[#5db2c9]/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    {showExpiration ? (
                      <>
                        <Clock className="w-3 h-3" /> Control de vigencia SIG
                      </>
                    ) : (
                      'Sin fecha de vencimiento'
                    )}
                  </span>
                </div>
                <h3 className="font-display text-xl font-semibold mt-2 leading-tight truncate max-w-md">
                  {displayTitle || document.name}
                </h3>
                <p className="text-xs text-white/70 mt-0.5">Modificar requisito</p>
              </div>
            </div>
            <button
              onClick={onClose}
              type="button"
              aria-label="Cerrar"
              className="shrink-0 w-9 h-9 grid place-items-center rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs text-[#3a5274] dark:text-slate-300">

            {/* 1. Nombre */}
            <section>
              <div className="flex items-center gap-2.5 mb-2.5">
                {stepNum(1)}
                <h4 className="font-display text-sm font-semibold text-[#0b1d3a] dark:text-white">Documento</h4>
              </div>
              <label className={labelCls}>Nombre oficial del requisito</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 h-11 rounded-xl border border-black/10 dark:border-white/10 font-medium text-[#0b1d3a] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0f6b8f]"
                required
              />
            </section>

            {/* 2. Soporte */}
            <section>
              <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5">
                <div className="flex items-center gap-2.5">
                  {stepNum(2)}
                  <h4 className="font-display text-sm font-semibold text-[#0b1d3a] dark:text-white">Documento soporte</h4>
                </div>
                <span className="text-[10px] text-[#0a5473] dark:text-[#5db2c9] font-semibold bg-[#0f6b8f]/10 border border-[#0f6b8f]/30 px-2.5 py-0.5 rounded-full">
                  Evaluador: {reviewerName}
                </span>
              </div>

              {templatePdf && (
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="mb-2.5 w-full flex items-center gap-3 rounded-xl border border-[#0f6b8f]/30 bg-white dark:bg-white/[0.04] px-3.5 py-2.5 text-left cursor-pointer hover:bg-[#0f6b8f]/10 transition-colors"
                >
                  <span className="shrink-0 w-9 h-9 rounded-lg bg-[#0f6b8f]/15 text-[#0a5473] dark:text-[#5db2c9] grid place-items-center">
                    <Download className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-[#0b1d3a] dark:text-white">Descargar plantilla oficial</span>
                    <span className="block text-[11px] text-[#5d7392] dark:text-slate-400 truncate">
                      {templateFormCode} · versión {templatePdf.version} · diligéncielo y cárguelo aquí
                    </span>
                  </span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx"
                onChange={handleSimulateFileUpload}
              />

              {fileError && (
                <div className="mb-2.5 p-3 bg-red-500/10 border border-red-500/40 rounded-xl flex items-start gap-2 text-[11px] animate-fade-up">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-red-600 dark:text-red-300">No se pudo cargar el archivo</span>
                    <span className="text-[#3a5274] dark:text-slate-300">{fileError}</span>
                  </div>
                </div>
              )}

              {hasFile ? (
                <div className="rounded-2xl border border-[#0f6b8f]/30 bg-[#0f6b8f]/[0.07] p-4 space-y-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 w-11 h-11 rounded-xl bg-gradient-action text-white grid place-items-center shadow-glow">
                      <FileCheck className="w-5 h-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-[#0a5473] dark:text-[#5db2c9] bg-[#0f6b8f]/15 px-2 py-0.5 rounded-full border border-[#0f6b8f]/30">
                          Soporte adjunto
                        </span>
                        {fileSize && <span className="text-[10px] font-semibold text-[#5d7392] dark:text-slate-400">{fileSize}</span>}
                        {isUploading && <span className="text-[10px] font-semibold text-[#0a5473] dark:text-[#5db2c9]">Guardando archivo…</span>}
                      </div>
                      <input
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="nombre_archivo.pdf"
                        className="w-full mt-1.5 px-3 h-9 rounded-lg border border-black/10 dark:border-white/10 font-mono text-[11px] text-[#0b1d3a] dark:text-white focus:ring-2 focus:ring-[#0f6b8f] focus:outline-hidden"
                        title="Nombre del archivo adjunto"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 h-9 px-4 bg-gradient-action text-white text-xs font-semibold rounded-xl shadow-glow cursor-pointer hover:opacity-95 transition-opacity"
                    >
                      <FileUp className="w-3.5 h-3.5" />
                      <span>Reemplazar archivo</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="inline-flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600 font-semibold px-2.5 h-9 rounded-xl hover:bg-red-500/10 transition-colors cursor-pointer"
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
                  className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-300 ${
                    isDragging
                      ? 'border-[#0f6b8f] bg-[#0f6b8f]/15 scale-[1.01]'
                      : 'border-[#0f6b8f]/40 bg-[#0f6b8f]/[0.05] hover:bg-[#0f6b8f]/10 hover:border-[#0f6b8f]'
                  }`}
                >
                  <span className="w-14 h-14 rounded-2xl bg-gradient-action text-white grid place-items-center mx-auto mb-3 shadow-glow">
                    <UploadCloud className="w-7 h-7" />
                  </span>
                  <p className="text-sm font-semibold text-[#0b1d3a] dark:text-white">Haga clic para seleccionar o arrastre el archivo</p>
                  <p className="text-[11px] text-[#5d7392] dark:text-slate-400 mt-1">
                    PDF, Excel (.xlsx, .xls), Word (.docx), imágenes (.png, .jpg) &bull; máx. 5 MB
                  </p>
                  {isMandatory && (
                    <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-600 dark:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/30">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Obligatorio: adjunte el soporte para habilitar este requisito.</span>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* 3. Estado y vigencia */}
            <section>
              <div className="flex items-center gap-2.5 mb-2.5">
                {stepNum(3)}
                <h4 className="font-display text-sm font-semibold text-[#0b1d3a] dark:text-white">{showExpiration ? 'Estado y vigencia' : 'Estado'}</h4>
              </div>
              <div className={`grid grid-cols-1 ${showExpiration ? 'sm:grid-cols-2' : ''} gap-4`}>
                <div>
                  <div className="flex items-center justify-between">
                    <label className={labelCls}>Estado del documento</label>
                    {isExpirationRequired && (
                      <span className="text-[9.5px] font-semibold text-[#0a5473] dark:text-[#5db2c9] bg-[#0f6b8f]/12 border border-[#0f6b8f]/30 px-2 py-0.5 rounded-full mb-1.5">
                        Sujeto a vigencia
                      </span>
                    )}
                  </div>
                  <div
                    role="status"
                    className={`w-full px-3.5 h-11 rounded-xl border font-semibold flex items-center bg-black/[0.02] dark:bg-white/[0.04] ${statusView.cls}`}
                  >
                    {statusView.label}
                  </div>
                  <p className="text-[10px] text-[#5d7392] dark:text-slate-400 mt-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#0f6b8f] dark:text-[#5db2c9] shrink-0" />
                    <span>{statusView.hint}</span>
                  </p>
                </div>

                {showExpiration && (
                <div>
                  <div className="flex items-center justify-between">
                    <label className={labelCls}>
                      Fecha de vigencia / expiración{' '}
                      {isExpirationRequired ? <span className="text-red-500">*</span> : <span className="normal-case tracking-normal font-normal text-[#5d7392] dark:text-slate-400">(opcional)</span>}
                    </label>
                  </div>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={handleExpirationDateChange}
                    className={`w-full px-3.5 h-11 rounded-xl border font-mono focus:ring-2 focus:ring-[#0f6b8f] ${
                      currentExp?.status === 'VENCIDO'
                        ? 'border-red-500 text-red-600 dark:text-red-300 font-bold'
                        : currentExp?.status === 'POR_VENCER'
                        ? 'border-[#0f6b8f]/50'
                        : 'border-black/10 dark:border-white/10'
                    }`}
                  />
                  {isExpirationRequired && (
                    <p className="text-[10px] text-[#0a5473] dark:text-[#5db2c9] font-medium mt-1.5">Exigida por la matriz SIG</p>
                  )}
                  {currentValidityRule && (
                    <p className="text-[10px] text-[#0a5473] dark:text-[#5db2c9] font-medium flex items-center gap-1 mt-0.5 truncate" title={currentValidityRule}>
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>Regla matriz: {currentValidityRule}</span>
                    </p>
                  )}
                </div>
                )}
              </div>

              {/* Semáforo de expiración */}
              {showExpiration && currentExp && expirationDate && (
                <div className="mt-4 animate-fade-up">
                  {currentExp.status === 'VENCIDO' && (
                    <div className="p-3.5 bg-red-500/10 border border-red-500/40 rounded-2xl text-xs flex items-start gap-3">
                      <span className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-400 text-white grid place-items-center">
                        <ShieldAlert className="w-4 h-4" />
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-display text-sm font-semibold text-red-600 dark:text-red-300">
                            Requisito vencido · expiró hace {currentExp.daysOverdue} días
                          </span>
                          <span className="text-[10px] font-mono bg-red-500/15 text-red-600 dark:text-red-300 px-2 py-0.5 rounded-lg font-bold">{expirationDate}</span>
                        </div>
                        <p className="text-[#3a5274] dark:text-slate-300 text-[11px] mt-1 leading-snug">
                          La fecha ingresada ya caducó. El estado cambió automáticamente a <strong>VENCIDO</strong>, lo que inhabilita temporalmente al proveedor hasta su renovación.
                        </p>
                      </div>
                    </div>
                  )}

                  {currentExp.status === 'POR_VENCER' && (
                    <div className="p-3.5 bg-[#5db2c9]/15 border border-[#0f6b8f]/40 rounded-2xl text-xs flex items-start gap-3">
                      <span className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-[#5db2c9] to-[#0f6b8f] text-white grid place-items-center">
                        <Clock className="w-4 h-4" />
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-display text-sm font-semibold text-[#0a5473] dark:text-[#5db2c9]">
                            Documento por vencer · restan {currentExp.daysRemaining} días
                          </span>
                          <span className="text-[10px] font-mono bg-[#0f6b8f]/15 text-[#0a5473] dark:text-[#5db2c9] px-2 py-0.5 rounded-lg font-bold">{expirationDate}</span>
                        </div>
                        <p className="text-[#3a5274] dark:text-slate-300 text-[11px] mt-1 leading-snug">
                          El documento está próximo a caducar. El estado se configuró como <strong>POR VENCER</strong> para generar la alerta preventiva de renovación.
                        </p>
                      </div>
                    </div>
                  )}

                  {currentExp.status === 'VIGENTE' && (
                    <div className="p-3.5 bg-[#0f6b8f]/10 border border-[#0f6b8f]/30 rounded-2xl text-xs flex items-start gap-3">
                      <span className="shrink-0 w-9 h-9 rounded-xl bg-gradient-action text-white grid place-items-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-display text-sm font-semibold text-[#0a5473] dark:text-[#5db2c9]">
                            Documento vigente · {currentExp.daysRemaining} días restantes
                          </span>
                          <span className="text-[10px] font-mono bg-[#0f6b8f]/15 text-[#0a5473] dark:text-[#5db2c9] px-2 py-0.5 rounded-lg font-bold">{expirationDate}</span>
                        </div>
                        <p className="text-[#3a5274] dark:text-slate-300 text-[11px] mt-1 leading-snug">
                          Vigencia conforme con las políticas del Sistema Integrado de Gestión de Flota Sugamuxi S.A.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* 4. Observaciones y justificación */}
            <section>
              <div className="flex items-center gap-2.5 mb-2.5">
                {stepNum(4)}
                <h4 className="font-display text-sm font-semibold text-[#0b1d3a] dark:text-white">Trazabilidad</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Observaciones o notas de control</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej. Certificado revisado en auditoría; vigencia verificada con el emisor."
                    className="w-full px-3.5 h-11 rounded-xl border border-black/10 dark:border-white/10 text-[#0b1d3a] dark:text-white focus:ring-2 focus:ring-[#0f6b8f]"
                  />
                </div>
                <div className="rounded-2xl bg-[#0f6b8f]/[0.07] border border-[#0f6b8f]/25 p-4 space-y-2">
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0f6b8f] dark:text-[#5db2c9]">
                    Justificación de la modificación <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Escriba el motivo institucional del cargue o certificación del documento..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#0f6b8f]/30 text-[#0b1d3a] dark:text-white text-xs focus:ring-2 focus:ring-[#0f6b8f]"
                    required
                  />
                  <p className="text-[10px] text-[#3a5274] dark:text-slate-400">
                    Esta acción quedará registrada con fecha, hora y firma de <strong>{reviewerName}</strong>.
                  </p>
                </div>
              </div>
            </section>

            {formError && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/40 rounded-2xl text-xs flex items-start gap-3 animate-fade-up">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block text-red-600 dark:text-red-300">Validación requerida</span>
                  <span className="text-[#3a5274] dark:text-slate-300 leading-snug">{formError}</span>
                </div>
              </div>
            )}
          </div>

          {/* Pie */}
          <div className="shrink-0 px-5 sm:px-6 py-4 border-t border-black/[0.07] dark:border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-5 text-sm font-semibold text-[#3a5274] dark:text-slate-300 hover:text-[#0b1d3a] dark:hover:text-white cursor-pointer rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`h-11 px-6 font-semibold text-sm rounded-xl flex items-center gap-2 transition-opacity cursor-pointer text-white hover:opacity-95 ${
                status === 'VENCIDO' ? 'bg-gradient-to-r from-red-600 to-red-500' : 'bg-gradient-action shadow-glow'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{status === 'VENCIDO' ? 'Guardar como requisito vencido' : 'Guardar y certificar requisito'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
