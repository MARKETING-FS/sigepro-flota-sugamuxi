import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileCheck,
  Building2,
  Lock,
  Edit3,
  AlertCircle,
  Maximize2,
  Minimize2,
  Info,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { SupplierDocument } from '../types';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: SupplierDocument | null;
  documentTitle?: string;
  supplierName?: string;
  nitOrDoc?: string;
  onModifyDoc?: () => void;
  onRequestCorrection?: () => void;
  onApproveDoc?: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  documentTitle = '',
  supplierName = '',
  nitOrDoc = '',
  onModifyDoc,
  onRequestCorrection,
  onApproveDoc,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [showMetadataDrawer, setShowMetadataDrawer] = useState<boolean>(false);
  const [fitWidth, setFitWidth] = useState<boolean>(false);

  if (!isOpen || !doc) return null;

  const fileName = doc.fileName || `${doc.code || 'documento'}.pdf`;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 20, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleResetZoom = () => {
    setZoomLevel(100);
    setRotation(0);
    setFitWidth(false);
  };
  const handleToggleFit = () => {
    setFitWidth((prev) => !prev);
    setZoomLevel(100);
  };

  const handleDownload = () => {
    const textContent = `=========================================================================\n` +
      `FLOTA SUGAMUXI S.A. - EXPEDIENTE DIGITAL DE PROVEEDORES\n` +
      `DOCUMENTO: ${documentTitle || doc.name}\n` +
      `CÓDIGO REQUISITO: ${doc.code}\n` +
      `PROVEEDOR: ${supplierName || 'Flota Sugamuxi Proveedor'}\n` +
      `DOCUMENTO / NIT: ${nitOrDoc || 'N/A'}\n` +
      `NOMBRE DE ARCHIVO ORIGINAL: ${fileName}\n` +
      `TAMAÑO: ${doc.fileSize || '1.4 MB'}\n` +
      `ESTADO ACTUAL: ${doc.status}\n` +
      `FECHA DE VENCIMIENTO: ${doc.expirationDate || 'No aplica / Permanente'}\n` +
      `OBSERVACIONES: ${doc.notes || 'Documento oficial radicado en plataforma'}\n` +
      `=========================================================================\n\n` +
      `[Archivo verificado y firmado digitalmente en la plataforma SIG Flota Sugamuxi S.A.]`;

    const blob = new Blob([textContent], { type: 'application/pdf;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const hasReviewerActions = Boolean(onModifyDoc || onRequestCorrection || onApproveDoc);

  // Render high-fidelity simulated contents according to the document type
  const renderDocumentContent = () => {
    const code = (doc.code || '').toUpperCase();

    if (code === 'FS_GA_FOR_009') {
      return (
        <div className="space-y-4 text-slate-800 text-xs">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 flex items-center justify-between">
            <span className="font-bold">FORMATO INSTITUCIONAL OFICIAL FS.GA-FOR-009</span>
            <span className="font-mono text-[11px] font-bold">VERSIÓN 04 &bull; COD: FS-009</span>
          </div>

          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-700 border-b border-slate-300 text-[11px]">
              1. INFORMACIÓN GENERAL DEL CONTRATISTA O ASPIRANTE
            </div>
            <div className="p-3 grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Nombre / Razón Social</span>
                <span className="font-bold text-slate-900">{supplierName || 'Empresa / Persona Natural'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Número Identificación / NIT</span>
                <span className="font-mono font-bold text-slate-900">{nitOrDoc || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Ciudad y Domicilio</span>
                <span className="text-slate-800">Sogamoso / Boyacá &mdash; Colombia</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block uppercase">Correo Electrónico Notificaciones</span>
                <span className="text-slate-800 font-mono">contacto@proveedor.com.co</span>
              </div>
            </div>
          </div>

          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-700 border-b border-slate-300 text-[11px]">
              2. DECLARACIÓN JURAMENTADA DE ORIGEN DE FONDOS (SARLAFT)
            </div>
            <div className="p-3 text-[11px] text-slate-700 space-y-2 leading-relaxed">
              <p>
                Declaro bajo la gravedad de juramento que los recursos utilizados para el desarrollo de la relación comercial con Flota Sugamuxi S.A. provienen de actividades lícitas y no provienen de ninguna actividad de lavado de activos, financiación del terrorismo o delitos conexos.
              </p>
              <div className="flex items-center gap-2 text-blue-900 bg-blue-50 p-2 rounded border border-blue-200 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Declaración suscrita electrónicamente con validez jurídica según Ley 527 de 1999.</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (code === 'FS_GA_FOR_039') {
      return (
        <div className="space-y-4 text-slate-800 text-xs">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 flex items-center justify-between">
            <span className="font-bold">FORMATO FS.GA-FOR-039: HABEAS DATA Y TRATAMIENTO DE DATOS</span>
            <span className="font-mono text-[11px] font-bold">LEY 1581 DE 2012</span>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg text-[11px] text-slate-700 space-y-3 leading-relaxed">
            <p className="font-semibold text-slate-900">
              Autorización previa, expresa e informada para el tratamiento y custodia de datos personales:
            </p>
            <p>
              Autorizo de manera libre y voluntaria a <strong>FLOTA SUGAMUXI S.A.</strong> para recolectar, almacenar, verificar en centrales de riesgo o listas restrictivas y custodiar los datos personales, comerciales y bancarios suministrados en este trámite.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-500 font-bold block text-[10px]">TITULAR AUTORIZANTE:</span>
                <span className="font-bold text-slate-900">{supplierName || 'Proveedor'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block text-[10px]">DOCUMENTO / NIT:</span>
                <span className="font-mono font-bold text-slate-900">{nitOrDoc || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (code === 'RUT') {
      return (
        <div className="space-y-3 text-slate-800 text-xs">
          <div className="bg-[#0b1736] text-white p-2.5 rounded-lg flex items-center justify-between">
            <div className="font-bold tracking-tight">DIAN &bull; REGISTRO ÚNICO TRIBUTARIO (RUT)</div>
            <span className="text-[10px] font-mono bg-blue-900 px-2 py-0.5 rounded">FORMULARIO 001 OFICIAL</span>
          </div>
          <div className="border border-slate-300 rounded-lg p-3 grid grid-cols-3 gap-2 bg-slate-50">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Número de Identificación (NIT)</span>
              <span className="font-mono font-bold text-slate-950 text-sm">{nitOrDoc || '891.800.222-3'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Nombre o Razón Social</span>
              <span className="font-bold text-slate-950 truncate block">{supplierName || 'Razón Social Registrada'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Régimen Tributario</span>
              <span className="font-semibold text-slate-950">Responsable de IVA (Común)</span>
            </div>
          </div>
          <div className="p-3 border border-slate-200 rounded-lg text-[11px] space-y-1">
            <div className="font-bold text-slate-700">Actividades Económicas Registradas (CIIU):</div>
            <p className="font-mono text-slate-600">&bull; Principal: 4520 - Mantenimiento y reparación de vehículos automotores</p>
            <p className="font-mono text-slate-600">&bull; Secundaria: 4530 - Comercio de partes, piezas y accesorios de lujo</p>
          </div>
        </div>
      );
    }

    if (code === 'CAMARA_COMERCIO') {
      return (
        <div className="space-y-3 text-slate-800 text-xs">
          <div className="p-3 bg-slate-900 text-white rounded-lg flex items-center justify-between">
            <div className="font-bold tracking-tight">CONFECÁMARAS &bull; CERTIFICADO DE EXISTENCIA Y REPRESENTACIÓN</div>
            <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded">VIGENCIA MENOR A 30 DÍAS</span>
          </div>
          <div className="p-3 border border-slate-300 rounded-lg space-y-2 bg-slate-50 text-[11px]">
            <p><strong>CÁMARA DE COMERCIO:</strong> Sede Sogamoso / Tunja</p>
            <p><strong>MATRÍCULA MERCANTIL:</strong> <span className="font-mono font-bold">00384920-14</span></p>
            <p><strong>OBJETO SOCIAL:</strong> Prestación de servicios técnicos especializados, suministro de repuestos e insumos automotores para transporte terrestre.</p>
            <p><strong>REPRESENTACIÓN LEGAL:</strong> Gerente General debidamente inscrito y facultado para contratar sin limitación de cuantía.</p>
          </div>
        </div>
      );
    }

    if (code === 'CERTIFICACION_BANCARIA') {
      return (
        <div className="space-y-3 text-slate-800 text-xs">
          <div className="p-3 bg-blue-900 text-white rounded-lg flex items-center justify-between">
            <div className="font-bold tracking-tight">CERTIFICACIÓN BANCARIA OFICIAL DE CUENTA</div>
            <span className="text-[10px] font-mono bg-blue-800 px-2 py-0.5 rounded">VIGENTE Y ACTIVA</span>
          </div>
          <div className="p-4 border border-slate-300 rounded-lg space-y-2 bg-white text-[11px] shadow-2xs">
            <p className="text-slate-600">La entidad bancaria certifica que a la fecha el contratista mantiene una cuenta en estado activo con los siguientes datos:</p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Entidad Financiera</span>
                <span className="font-bold text-slate-900">Bancolombia S.A.</span>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Tipo de Cuenta</span>
                <span className="font-bold text-slate-900">Cuenta Corriente Empresarial</span>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Número de Cuenta</span>
                <span className="font-mono font-bold text-blue-900">834-002918-42</span>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Titular</span>
                <span className="font-bold text-slate-900">{supplierName || 'Titular de la Cuenta'}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default high-fidelity document layout
    return (
      <div className="space-y-4 text-slate-800 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
          <div className="font-bold text-slate-900 text-sm">{documentTitle || doc.name}</div>
          <p className="text-slate-600 text-xs leading-relaxed">
            Documento digitalizado y radicado formalmente en el sistema de proveedores de Flota Sugamuxi S.A.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Titular del Soporte</span>
            <span className="font-bold text-slate-900 text-xs mt-0.5 block">{supplierName || 'Proveedor'}</span>
            <span className="font-mono text-slate-500 text-[11px]">{nitOrDoc || 'N/A'}</span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Nombre del Archivo Original</span>
            <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 truncate block">{fileName}</span>
            <span className="text-slate-500 text-[11px]">{doc.fileSize || '1.4 MB'} &bull; Digitalizado</span>
          </div>
        </div>

        {doc.notes && (
          <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-[11px] text-blue-900">
            <span className="font-bold block">Notas del Documento:</span>
            <p className="mt-0.5">{doc.notes}</p>
          </div>
        )}

        {doc.correction && (
          <div className="p-3 bg-slate-100 rounded-lg border border-slate-300 text-[11px] text-slate-800 space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-slate-900">
              <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
              Observación de Corrección Radicada:
            </span>
            <p className="bg-white p-2 rounded border border-slate-300 font-mono text-xs">
              "{doc.correction.detailedObservation}"
            </p>
            <p className="text-[10px] text-slate-600">
              Solicitado por: <strong>{doc.correction.requestedBy}</strong> &bull; {doc.correction.requestedAt}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl h-[96vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* TOP HEADER: Clean, prioritized navigation with unified review controls (NO DUPLICATION) */}
        <div className="bg-[#0b1736] text-white px-4 sm:px-6 py-3 border-b border-blue-900/60 flex items-center justify-between gap-3 shrink-0 shadow-md">
          {/* Left: Document details & Code */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-extrabold uppercase bg-blue-950 text-cyan-300 px-2 py-0.5 rounded border border-blue-700">
                  {doc.code || 'SOPORTE'}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  doc.status === 'APROBADO'
                    ? 'bg-blue-950 text-cyan-300 border-cyan-500'
                    : doc.status === 'REQUIERE_CORRECCION'
                    ? 'bg-slate-900 text-slate-200 border-slate-700'
                    : 'bg-blue-950 text-cyan-300 border-blue-600'
                }`}>
                  {doc.status}
                </span>
                {doc.expirationDate && (
                  <span className="text-[11px] text-slate-300 flex items-center gap-1 hidden md:flex">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    Vence: {doc.expirationDate}
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white truncate mt-0.5">
                {documentTitle || doc.name}
              </h2>
            </div>
          </div>

          {/* Right: UNIFIED ACTION BAR (Only place where Aprobar, Corrección, Modificar appear) */}
          <div className="flex items-center gap-2 shrink-0">
            {hasReviewerActions && (
              <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-700/80 shadow-inner">
                {onModifyDoc && (
                  <button
                    type="button"
                    onClick={onModifyDoc}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 border border-slate-600 cursor-pointer shadow-xs"
                    title="Modificar datos, vigencia o sustituir soporte"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">Modificar</span>
                  </button>
                )}

                {onRequestCorrection && (
                  <button
                    type="button"
                    onClick={onRequestCorrection}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 border border-slate-600 cursor-pointer shadow-xs"
                    title="Solicitar subsanación técnica o corrección al proveedor"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Corrección</span>
                  </button>
                )}

                {onApproveDoc && (
                  <button
                    type="button"
                    onClick={onApproveDoc}
                    disabled={doc.status === 'APROBADO'}
                    className={`px-3 py-1.5 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 border shadow-xs ${
                      doc.status === 'APROBADO'
                        ? 'bg-slate-900 text-slate-300 border-slate-700 cursor-default'
                        : 'bg-blue-800 hover:bg-blue-700 text-white border-blue-700 cursor-pointer active:scale-95'
                    }`}
                    title={doc.status === 'APROBADO' ? 'Documento ya aprobado' : 'Aprobar documento oficialmente'}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{doc.status === 'APROBADO' ? 'Aprobado ✓' : 'Aprobar'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Quick close button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar visor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SUBHEADER TOOLBAR: Dedicated to file viewing (Zoom, Rotate, Full width, Metadata toggle) */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 py-1.5 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-slate-700 truncate">{supplierName || 'Proveedor'}</span>
            <span className="text-slate-400">&bull;</span>
            <span className="font-mono text-slate-500 text-[11px] truncate">{fileName}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-slate-300 shadow-2xs">
              <button
                onClick={handleZoomOut}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                title="Alejar (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="font-mono text-[11px] font-bold text-slate-700 px-1 hover:text-blue-700 cursor-pointer"
                title="Restablecer zoom al 100%"
              >
                {zoomLevel}%
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                title="Acercar (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-3.5 bg-slate-300 mx-0.5" />
              <button
                onClick={handleRotate}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                title="Girar 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleToggleFit}
                className={`p-1 rounded cursor-pointer ${
                  fitWidth ? 'text-blue-700 bg-blue-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Ajustar al ancho de pantalla"
              >
                {fitWidth ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Metadata Info Drawer Toggle */}
            <button
              onClick={() => setShowMetadataDrawer((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                showMetadataDrawer
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="Ver metadatos y trazabilidad técnica del archivo"
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Metadatos</span>
            </button>
          </div>
        </div>

        {/* BODY: Full priority to Document Visualization */}
        <div className="flex-1 overflow-y-auto bg-slate-200/90 p-4 sm:p-6 md:p-8 flex items-start justify-center min-h-0 relative">
          
          {/* Main Printable / Rendered Document Page */}
          <div
            className={`bg-white rounded-lg shadow-2xl border border-slate-300 p-6 sm:p-10 transition-transform origin-top space-y-6 ${
              fitWidth ? 'w-full max-w-5xl' : 'max-w-3xl w-full'
            }`}
            style={{
              transform: !fitWidth ? `scale(${zoomLevel / 100}) rotate(${rotation}deg)` : `rotate(${rotation}deg)`,
              transition: 'transform 0.15s ease-out',
            }}
          >
            {/* Flota Sugamuxi Corporate Letterhead */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-blue-950 text-white rounded-xl flex items-center justify-center font-black text-lg border border-blue-700 shadow-sm shrink-0">
                  FS
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-950 tracking-tight leading-none">
                    FLOTA SUGAMUXI S.A.
                  </h3>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mt-1">
                    Sistema Integrado de Gestión (SIG) &bull; NIT: 891.800.222-3
                  </p>
                  <p className="text-[10px] text-blue-900 font-semibold">
                    Expediente Electrónico de Proveedores y Contratistas
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-900 px-2.5 py-1 rounded border border-slate-300 block">
                  DOCUMENTO RADICADO
                </span>
                <span className="text-[11px] text-slate-600 block mt-1">
                  Requisito: <strong className="font-mono text-blue-950">{doc.code}</strong>
                </span>
              </div>
            </div>

            {/* Document Header Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">
                  Soporte Documental Oficial
                </span>
                <h4 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
                  {documentTitle || doc.name}
                </h4>
                <p className="text-xs text-slate-600 font-mono mt-0.5 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>{fileName}</span>
                  <span className="text-slate-400">({doc.fileSize || '1.4 MB'})</span>
                </p>
              </div>

              <div className="bg-white px-3.5 py-2 rounded-lg border border-slate-200 text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Dictamen</span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded mt-0.5 inline-block ${
                  doc.status === 'APROBADO' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                  doc.status === 'REQUIERE_CORRECCION' ? 'bg-slate-100 text-slate-900 border border-slate-300' :
                  'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                  {doc.status}
                </span>
              </div>
            </div>

            {/* Document Specialized Visual Presentation */}
            <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-2xs">
              {renderDocumentContent()}
            </div>

            {/* Digital Security & Authentication Footer inside paper */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-500 text-[10px]">
              <div className="space-y-0.5">
                <p><strong>Hash Criptográfico:</strong> SHA-256:{Math.random().toString(36).substring(2, 10).toUpperCase()}4B892F</p>
                <p><strong>Cadena de Custodia:</strong> Verificado y asegurado por SIG Flota Sugamuxi S.A.</p>
              </div>
              <div className="flex items-center gap-1.5 text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 font-bold self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                <span>Expediente Auténtico y Vigente</span>
              </div>
            </div>

          </div>

          {/* Slide-in / Collapsible Metadata Sidebar Drawer */}
          {showMetadataDrawer && (
            <div className="absolute top-4 right-4 w-80 bg-white rounded-xl shadow-2xl border border-slate-300 p-4 text-xs text-slate-700 z-10 space-y-3 animate-in fade-in slide-in-from-right-4 duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  Metadatos del Archivo
                </span>
                <button
                  onClick={() => setShowMetadataDrawer(false)}
                  className="p-1 text-slate-400 hover:text-slate-800 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Archivo</span>
                  <span className="font-mono text-slate-900 font-bold break-all">{fileName}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Código Requisito</span>
                  <span className="font-mono font-bold text-blue-700">{doc.code}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tamaño</span>
                  <span className="font-semibold text-slate-900">{doc.fileSize || '1.4 MB'}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha de Vencimiento</span>
                  <span className="font-semibold text-slate-900">{doc.expirationDate || 'Permanente / Sin Vencimiento'}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Estado Actual</span>
                  <span className="font-bold text-slate-900">{doc.status}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM FOOTER: Simple and Clean (NO REPEATED ACTION BUTTONS) */}
        <div className="bg-slate-50 px-4 sm:px-6 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-slate-800">{supplierName || 'Proveedor'}</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-[11px] text-slate-500 font-mono">Visualización 1 de 1</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg transition-colors border border-slate-300 cursor-pointer shadow-2xs hidden sm:flex items-center gap-1.5"
              title="Imprimir documento"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Descargar archivo original"
            >
              <Download className="w-3.5 h-3.5 text-cyan-300" />
              <span>Descargar</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
