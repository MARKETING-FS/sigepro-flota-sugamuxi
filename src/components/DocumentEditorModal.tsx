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
} from 'lucide-react';
import { SupplierDocument, DocumentStatus, UserRole } from '../types';
import { useApp } from '../context/AppContext';
import { BrandSwoosh } from './ui/BrandSwoosh';
import { calculateDocumentExpiration } from '../utils/contractValidity';

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
  const { documentDefinitions } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !document) return null;

  // Resolver parametrización de la Matriz de Requisitos Específicos por Actividad Económica
  const docDef = (documentDefinitions || []).find((d) => d.code === docCode);
  const isExpirationRequired = propRequiresExpirationDate ?? docDef?.requiresExpirationDate ?? false;
  const currentValidityRule = propValidityRule || docDef?.validityRule || '';

  const displayTitle = documentTitle || docTitle || docCode;
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

    const initialExpDate = document.expirationDate || '';
    setExpirationDate(initialExpDate);

    // Sincronización del estado inicial basada en la fecha de vigencia y parametrización de matriz
    if (initialExpDate) {
      const expInfo = calculateDocumentExpiration(initialExpDate);
      if (expInfo.status === 'VENCIDO') {
        setStatus('VENCIDO');
      } else if (expInfo.status === 'POR_VENCER') {
        setStatus('POR_VENCER');
      } else if (expInfo.status === 'VIGENTE') {
        setStatus(document.status === 'APROBADO' ? 'APROBADO' : 'VIGENTE');
      } else {
        setStatus(document.status);
      }
    } else if (document.status === 'VENCIDO' || document.status === 'POR_VENCER' || document.status === 'VIGENTE') {
      setStatus(document.status);
    } else if (document.fileName && (document.status === 'CARGADO' || document.status === 'PENDIENTE')) {
      setStatus('APROBADO');
    } else {
      setStatus(document.status);
    }

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

    // Leer Data URL para previsualización directa
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setCustomUrl(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Sincronizar estado al subir archivo considerando vigencia existente
    if (expirationDate) {
      const expInfo = calculateDocumentExpiration(expirationDate);
      if (expInfo.status === 'VENCIDO') {
        setStatus('VENCIDO');
      } else if (expInfo.status === 'POR_VENCER') {
        setStatus('POR_VENCER');
      } else {
        setStatus('VIGENTE');
      }
    } else {
      setStatus('APROBADO');
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
    setStatus('PENDIENTE');
  };

  // Manejo reactivo de cambio de fecha de vigencia / expiración
  const handleExpirationDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setExpirationDate(val);
    setFormError(null);

    if (val && val.trim()) {
      const expInfo = calculateDocumentExpiration(val);
      if (expInfo.status === 'VENCIDO') {
        // Al ingresar una fecha vencida, se cambia inmediatamente a VENCIDO
        setStatus('VENCIDO');
      } else if (expInfo.status === 'POR_VENCER') {
        // Si restan 30 días o menos, se cambia a POR_VENCER
        setStatus('POR_VENCER');
      } else if (expInfo.status === 'VIGENTE') {
        // Si la fecha es válida a futuro, se cambia a VIGENTE
        setStatus('VIGENTE');
      }
    } else {
      if (isExpirationRequired) {
        setFormError('Atención: Este requisito exige fecha de vencimiento según la Matriz de Requisitos.');
      }
      if (hasFile) {
        setStatus('APROBADO');
      } else {
        setStatus('PENDIENTE');
      }
    }
  };

  // Validación si el usuario cambia manualmente el estado en el select
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as DocumentStatus;
    setFormError(null);

    // Si intenta poner VIGENTE o APROBADO pero la fecha ya está vencida
    if ((newStatus === 'VIGENTE' || newStatus === 'APROBADO') && expirationDate) {
      const expInfo = calculateDocumentExpiration(expirationDate);
      if (expInfo.status === 'VENCIDO') {
        setFormError(`Inconsistencia: La fecha ingresada (${expirationDate}) ya expiró hace ${expInfo.daysOverdue} días. No puede seleccionarse ${newStatus}; el documento se registra como VENCIDO.`);
        setStatus('VENCIDO');
        return;
      }
    }

    setStatus(newStatus);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validación 1: Si es obligatorio en expediente, debe adjuntar archivo soporte
    if (isMandatory && (!hasFile || !fileName || !fileName.trim())) {
      setFormError('Este requisito está clasificado como OBLIGATORIO para el expediente del proveedor. El revisor técnico debe adjuntar obligatoriamente el archivo soporte (PDF, Excel o Imagen) antes de poder guardar o certificar este requisito.');
      return;
    }

    // Validación 2: Si el estado es APROBADO o VIGENTE, es obligatorio tener archivo soporte
    if ((status === 'APROBADO' || status === 'VIGENTE') && (!hasFile || !fileName || !fileName.trim())) {
      setFormError(`Para certificar el requisito con estado ${status}, es indispensable adjuntar el archivo soporte correspondiente.`);
      return;
    }

    // Validación 3: Si la Matriz exige fecha de vencimiento, debe ingresarse obligatoriamente
    if (isExpirationRequired && (!expirationDate || !expirationDate.trim())) {
      setFormError('Este requisito está parametrizado en la Matriz de Requisitos por Actividad Económica con exigencia obligatoria de Fecha de Vigencia / Expiración. Por favor ingrese la fecha de caducidad.');
      return;
    }

    // Validación 4: Coherencia temporal: Si la fecha está vencida, no puede guardarse como VIGENTE o APROBADO
    if (expirationDate && (status === 'VIGENTE' || status === 'APROBADO')) {
      const expInfo = calculateDocumentExpiration(expirationDate);
      if (expInfo.status === 'VENCIDO') {
        setFormError(`Inconsistencia de Vigencia: La fecha de expiración ingresada (${expirationDate}) está vencida hace ${expInfo.daysOverdue} días. No puede guardarse como ${status}; debe registrarse como VENCIDO.`);
        setStatus('VENCIDO');
        return;
      }
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
        expirationDate: expirationDate || undefined,
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

  const STATUS_OPTIONS: { value: DocumentStatus; label: string }[] = isExpirationRequired
    ? [
        { value: 'VIGENTE', label: 'VIGENTE (aprobado y en vigencia)' },
        { value: 'POR_VENCER', label: 'POR VENCER (alerta preventiva)' },
        { value: 'VENCIDO', label: 'VENCIDO (expirado, inhabilita al proveedor)' },
        { value: 'APROBADO', label: 'APROBADO (habilitado)' },
        { value: 'CARGADO', label: 'CARGADO (en revisión)' },
        { value: 'REQUIERE_CORRECCION', label: 'REQUIERE CORRECCIÓN' },
        { value: 'PENDIENTE', label: 'PENDIENTE' },
        { value: 'RECHAZADO', label: 'RECHAZADO' },
      ]
    : [
        { value: 'APROBADO', label: 'APROBADO (habilitado)' },
        { value: 'VIGENTE', label: 'VIGENTE' },
        { value: 'POR_VENCER', label: 'POR VENCER' },
        { value: 'VENCIDO', label: 'VENCIDO (expirado)' },
        { value: 'CARGADO', label: 'CARGADO (en revisión)' },
        { value: 'REQUIERE_CORRECCION', label: 'REQUIERE CORRECCIÓN' },
        { value: 'PENDIENTE', label: 'PENDIENTE' },
        { value: 'RECHAZADO', label: 'RECHAZADO' },
      ];

  const labelCls = 'block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2c84c4] dark:text-[#69bdd7] mb-1.5';
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
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#69bdd7]/30 border border-[#69bdd7]/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    {isExpirationRequired ? (
                      <>
                        <Clock className="w-3 h-3" /> Control de vigencia SIG
                      </>
                    ) : (
                      'Permanente'
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
                className="w-full px-3.5 h-11 rounded-xl border border-black/10 dark:border-white/10 font-medium text-[#0b1d3a] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#2c84c4]"
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
                <span className="text-[10px] text-[#1d5fa8] dark:text-[#69bdd7] font-semibold bg-[#2c84c4]/10 border border-[#2c84c4]/30 px-2.5 py-0.5 rounded-full">
                  Evaluador: {reviewerName}
                </span>
              </div>

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
                    <span className="font-semibold block text-red-600 dark:text-red-300">Archivo no permitido (máximo 5 MB)</span>
                    <span className="text-[#3a5274] dark:text-slate-300">{fileError}</span>
                  </div>
                </div>
              )}

              {hasFile ? (
                <div className="rounded-2xl border border-[#2c84c4]/30 bg-[#2c84c4]/[0.07] p-4 space-y-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 w-11 h-11 rounded-xl bg-gradient-action text-white grid place-items-center shadow-glow">
                      <FileCheck className="w-5 h-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-[#1d5fa8] dark:text-[#69bdd7] bg-[#2c84c4]/15 px-2 py-0.5 rounded-full border border-[#2c84c4]/30">
                          Soporte adjunto
                        </span>
                        {fileSize && <span className="text-[10px] font-semibold text-[#5d7392] dark:text-slate-400">{fileSize}</span>}
                      </div>
                      <input
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="nombre_archivo.pdf"
                        className="w-full mt-1.5 px-3 h-9 rounded-lg border border-black/10 dark:border-white/10 font-mono text-[11px] text-[#0b1d3a] dark:text-white focus:ring-2 focus:ring-[#2c84c4] focus:outline-hidden"
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
                      ? 'border-[#2c84c4] bg-[#2c84c4]/15 scale-[1.01]'
                      : 'border-[#2c84c4]/40 bg-[#2c84c4]/[0.05] hover:bg-[#2c84c4]/10 hover:border-[#2c84c4]'
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
                <h4 className="font-display text-sm font-semibold text-[#0b1d3a] dark:text-white">Estado y vigencia</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label className={labelCls}>Estado del documento</label>
                    {isExpirationRequired && (
                      <span className="text-[9.5px] font-semibold text-[#1d5fa8] dark:text-[#69bdd7] bg-[#2c84c4]/12 border border-[#2c84c4]/30 px-2 py-0.5 rounded-full mb-1.5">
                        Sujeto a vigencia
                      </span>
                    )}
                  </div>
                  <select
                    value={status}
                    onChange={handleStatusChange}
                    className={`w-full px-3.5 h-11 rounded-xl border font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#2c84c4] ${
                      status === 'VENCIDO'
                        ? 'border-red-500 text-red-600 dark:text-red-300'
                        : status === 'VIGENTE' || status === 'APROBADO' || status === 'POR_VENCER'
                        ? 'border-[#2c84c4]/50 text-[#1d5fa8] dark:text-[#69bdd7]'
                        : 'border-black/10 dark:border-white/10 text-[#0b1d3a] dark:text-white'
                    }`}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-[#5d7392] dark:text-slate-400 mt-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#2c84c4] dark:text-[#69bdd7] shrink-0" />
                    <span>Se sincroniza automáticamente al evaluar o ingresar la vigencia.</span>
                  </p>
                </div>

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
                    className={`w-full px-3.5 h-11 rounded-xl border font-mono focus:ring-2 focus:ring-[#2c84c4] ${
                      currentExp?.status === 'VENCIDO'
                        ? 'border-red-500 text-red-600 dark:text-red-300 font-bold'
                        : currentExp?.status === 'POR_VENCER'
                        ? 'border-[#2c84c4]/50'
                        : 'border-black/10 dark:border-white/10'
                    }`}
                  />
                  {isExpirationRequired && (
                    <p className="text-[10px] text-[#1d5fa8] dark:text-[#69bdd7] font-medium mt-1.5">Exigida por la matriz SIG</p>
                  )}
                  {currentValidityRule && (
                    <p className="text-[10px] text-[#1d5fa8] dark:text-[#69bdd7] font-medium flex items-center gap-1 mt-0.5 truncate" title={currentValidityRule}>
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>Regla matriz: {currentValidityRule}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Semáforo de expiración */}
              {currentExp && expirationDate && (
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
                    <div className="p-3.5 bg-[#69bdd7]/15 border border-[#2c84c4]/40 rounded-2xl text-xs flex items-start gap-3">
                      <span className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-[#69bdd7] to-[#2c84c4] text-white grid place-items-center">
                        <Clock className="w-4 h-4" />
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-display text-sm font-semibold text-[#1d5fa8] dark:text-[#69bdd7]">
                            Documento por vencer · restan {currentExp.daysRemaining} días
                          </span>
                          <span className="text-[10px] font-mono bg-[#2c84c4]/15 text-[#1d5fa8] dark:text-[#69bdd7] px-2 py-0.5 rounded-lg font-bold">{expirationDate}</span>
                        </div>
                        <p className="text-[#3a5274] dark:text-slate-300 text-[11px] mt-1 leading-snug">
                          El documento está próximo a caducar. El estado se configuró como <strong>POR VENCER</strong> para generar la alerta preventiva de renovación.
                        </p>
                      </div>
                    </div>
                  )}

                  {currentExp.status === 'VIGENTE' && (
                    <div className="p-3.5 bg-[#2c84c4]/10 border border-[#2c84c4]/30 rounded-2xl text-xs flex items-start gap-3">
                      <span className="shrink-0 w-9 h-9 rounded-xl bg-gradient-action text-white grid place-items-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-display text-sm font-semibold text-[#1d5fa8] dark:text-[#69bdd7]">
                            Documento vigente · {currentExp.daysRemaining} días restantes
                          </span>
                          <span className="text-[10px] font-mono bg-[#2c84c4]/15 text-[#1d5fa8] dark:text-[#69bdd7] px-2 py-0.5 rounded-lg font-bold">{expirationDate}</span>
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
                    className="w-full px-3.5 h-11 rounded-xl border border-black/10 dark:border-white/10 text-[#0b1d3a] dark:text-white focus:ring-2 focus:ring-[#2c84c4]"
                  />
                </div>
                <div className="rounded-2xl bg-[#2c84c4]/[0.07] border border-[#2c84c4]/25 p-4 space-y-2">
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2c84c4] dark:text-[#69bdd7]">
                    Justificación de la modificación <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Escriba el motivo institucional del cargue o certificación del documento..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2c84c4]/30 text-[#0b1d3a] dark:text-white text-xs focus:ring-2 focus:ring-[#2c84c4]"
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
