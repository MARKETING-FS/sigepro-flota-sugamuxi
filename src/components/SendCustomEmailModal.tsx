import React, { useState, useEffect } from 'react';
import { SupplierDossier } from '../types';
import { Mail, Send, X, AlertCircle, Building2, User, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SendCustomEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossiers?: SupplierDossier[];
  dossier?: SupplierDossier;
  initialDossierId?: string;
  onSend?: (dossierId: string, subject: string, message: string, reviewerName: string) => void;
}

export const SendCustomEmailModal: React.FC<SendCustomEmailModalProps> = ({
  isOpen,
  onClose,
  dossiers: propDossiers,
  dossier: propDossier,
  initialDossierId,
  onSend,
}) => {
  const { dossiers: contextDossiers, sendCustomEmail: contextSendEmail } = useApp();

  const allDossiers = propDossiers || (propDossier ? [propDossier] : contextDossiers) || [];
  const defaultDossierId = initialDossierId || propDossier?.id || allDossiers[0]?.id || '';

  const [selectedDossierId, setSelectedDossierId] = useState<string>(defaultDossierId);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [reviewerName, setReviewerName] = useState('Comité de Contratación y Proveedores');
  const [templateType, setTemplateType] = useState('CUSTOM');
  const [successSent, setSuccessSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initId = initialDossierId || propDossier?.id || allDossiers[0]?.id || '';
      setSelectedDossierId(initId);
      setSuccessSent(false);
    }
  }, [isOpen, initialDossierId, propDossier]);

  if (!isOpen) return null;

  const targetDossier = allDossiers.find((d) => d.id === selectedDossierId) || allDossiers[0] || propDossier;

  const targetName = targetDossier?.basicInfo?.supplierType === 'NATURAL'
    ? (targetDossier?.basicInfo?.fullName || 'Proveedor')
    : (targetDossier?.basicInfo?.companyName || targetDossier?.basicInfo?.fullName || 'Proveedor');

  const targetEmail = targetDossier?.basicInfo?.email || 'N/A';
  const targetFileNumber = targetDossier?.fileNumber || 'EXP-S/N';

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setTemplateType(val);
    if (!targetDossier) return;

    if (val === 'RECORDATORIO_CORRECCION') {
      setSubject(`Recordatorio: Correcciones Pendientes en Expediente ${targetFileNumber}`);
      setMessage(
        `Estimado(a) ${targetName}:\n\nLe recordamos cordialmente que su expediente ${targetFileNumber} cuenta con observaciones pendientes de subsanar en nuestro portal de proveedores.\n\nPara continuar con el proceso de homologación y habilitación comercial, le solicitamos ingresar a la plataforma y cargar los soportes corregidos a la mayor brevedad posible.\n\nCualquier inquietud adicional, puede comunicarse con el departamento de compras.`
      );
    } else if (val === 'SOLICITUD_ACLARACION') {
      setSubject(`Solicitud de Aclaración Técnica - Radicado ${targetFileNumber}`);
      setMessage(
        `Estimado(a) ${targetName}:\n\nEn relación con la propuesta técnica y comercial presentada para el expediente ${targetFileNumber}, el comité de compras requiere una aclaración formal sobre las condiciones de entrega, garantía y tiempos de respuesta de los servicios ofertados.\n\nAgradecemos remitir su respuesta detallada respondiendo a este requerimiento en nuestro portal.`
      );
    } else if (val === 'CITACION_REUNION') {
      setSubject(`Citación a Mesa de Validación Técnica - Flota Sugamuxi S.A.`);
      setMessage(
        `Estimado(a) ${targetName}:\n\nNos permitimos convocarlo(a) a una sesión virtual de socialización de requerimientos operativos y de seguridad vial previa a la adjudicación del contrato marco de suministro.\n\nFecha y enlace de conexión serán coordinados a través de este canal.`
      );
    } else if (val === 'CUSTOM') {
      setSubject('');
      setMessage('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveDossierId = selectedDossierId || targetDossier?.id;
    if (!effectiveDossierId || !subject.trim() || !message.trim()) return;

    if (onSend) {
      onSend(effectiveDossierId, subject.trim(), message.trim(), reviewerName.trim());
    } else if (contextSendEmail) {
      contextSendEmail(effectiveDossierId, subject.trim(), message.trim(), reviewerName.trim());
    }

    setSuccessSent(true);
    setTimeout(() => {
      setSuccessSent(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[#0b1329] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 border border-blue-400/40 flex items-center justify-center text-white shadow-xs shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Enviar Notificación por Correo Electrónico
              </h3>
              <p className="text-xs text-slate-300">
                Emisión de comunicado oficial certificado con membrete institucional Flota Sugamuxi S.A.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        {successSent ? (
          <div className="p-8 sm:p-12 text-center space-y-4 my-auto">
            <div className="w-16 h-16 bg-blue-50 border border-blue-200 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">¡Correo Despachado con Éxito!</h4>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              La notificación institucional ha sido generada y entregada al buzón del proveedor <strong className="text-blue-900">{targetEmail}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
            
            {/* Target Supplier Selector */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Destinatario (Proveedor Registrado) <span className="text-blue-600">*</span>
              </label>
              {allDossiers.length > 1 ? (
                <select
                  value={selectedDossierId}
                  onChange={(e) => setSelectedDossierId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
                >
                  {allDossiers.map((d) => {
                    const name =
                      d.basicInfo?.supplierType === 'NATURAL'
                        ? d.basicInfo?.fullName || 'Proveedor Natural'
                        : d.basicInfo?.companyName || 'Proveedor Jurídico';
                    const doc =
                      d.basicInfo?.supplierType === 'NATURAL'
                        ? `CC: ${d.basicInfo?.documentNumber || 'S/N'}`
                        : `NIT: ${d.basicInfo?.nit || 'S/N'}`;
                    return (
                      <option key={d.id} value={d.id}>
                        {d.fileNumber} — {name} ({doc}) &bull; {d.basicInfo?.email || 'Sin correo'} [{d.processStatus}]
                      </option>
                    );
                  })}
                </select>
              ) : (
                <div className="px-3 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800">
                  {targetFileNumber} — {targetName} ({targetEmail})
                </div>
              )}
            </div>

            {/* Recipient Details Preview Box */}
            {targetDossier && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3 shadow-2xs">
                <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">
                    {targetName}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Correo destinatario: <span className="font-bold text-blue-700">{targetEmail}</span> &bull; Estado actual: <span className="font-bold text-slate-800">{targetDossier.processStatus}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Template Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Plantilla Rápida
                </label>
                <select
                  value={templateType}
                  onChange={handleTemplateChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  <option value="CUSTOM">-- Redacción Personalizada --</option>
                  <option value="RECORDATORIO_CORRECCION">Recordatorio de Correcciones Pendientes</option>
                  <option value="SOLICITUD_ACLARACION">Solicitud de Aclaración Técnica</option>
                  <option value="CITACION_REUNION">Citación a Mesa de Validación</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Remitente Institucional <span className="text-blue-600">*</span>
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Departamento de Compras y Contratación"
                  required
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Asunto del Correo <span className="text-blue-600">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Requerimiento de aclaración sobre estados financieros"
                required
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Cuerpo del Mensaje / Observaciones <span className="text-blue-600">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 leading-relaxed"
                placeholder="Escriba aquí el contenido del correo que será despachado con membrete oficial..."
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                El sistema aplicará automáticamente el encabezado institucional, logo de Flota Sugamuxi S.A., pie de página y botones de acceso al portal.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-slate-700 font-bold hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Despachar Correo Ahora</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

