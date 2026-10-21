import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EmailNotification, EmailNotificationType } from '../types';
import { EmailModalViewer } from './EmailModalViewer';
import { SendCustomEmailModal } from './SendCustomEmailModal';
import { FlotaSugamuxiLogo } from './FlotaSugamuxiLogo';
import {
  Mail,
  Send,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  User,
  Eye,
  Trash2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  FileText,
  Inbox,
} from 'lucide-react';

export const EmailNotificationCenter: React.FC = () => {
  const {
    emailNotifications,
    dossiers,
    sendCustomEmail,
    markEmailAsRead,
    clearAllEmails,
    setCurrentDossierId,
    setActiveView,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedEmail, setSelectedEmail] = useState<EmailNotification | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const filteredEmails = emailNotifications.filter((email) => {
    const matchesSearch =
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.fileNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.previewSnippet.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'ALL' || email.templateType === selectedType;

    return matchesSearch && matchesType;
  });

  const handleViewEmail = (email: EmailNotification) => {
    markEmailAsRead(email.id);
    setSelectedEmail(email);
    setIsViewerOpen(true);
  };

  const handleGoToDossier = (dossierId: string) => {
    setCurrentDossierId(dossierId);
    setActiveView('revisores');
  };

  // Metrics
  const totalEmails = emailNotifications.length;
  const correctionEmails = emailNotifications.filter((e) => e.templateType === 'CORRECTION_REQUESTED').length;
  const approvedEmails = emailNotifications.filter((e) => e.templateType === 'DOSSIER_HABILITADO' || e.templateType === 'DOSSIER_APPROVED').length;
  const statusEmails = emailNotifications.filter((e) => e.templateType === 'STATUS_CHANGE').length;

  const getTypeBadge = (type: EmailNotificationType) => {
    switch (type) {
      case 'CORRECTION_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
            Corrección Solicitada
          </span>
        );
      case 'DOSSIER_HABILITADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Proveedor Habilitado
          </span>
        );
      case 'DOSSIER_APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Expediente Aprobado
          </span>
        );
      case 'DOCUMENT_APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-900 border border-sky-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
            Documento Aprobado
          </span>
        );
      case 'DOSSIER_REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            Rechazado
          </span>
        );
      case 'SUBMISSION_CONFIRMATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Radicación Recibida
          </span>
        );
      case 'REGISTRATION_CODE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Código de Seguridad
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            Notificación
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      
      {/* 1. Header Banner Estandarizado Claro */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 text-slate-900 border border-slate-200 shadow-xs relative overflow-hidden dark:bg-[#0b1329] dark:text-white dark:border-blue-900/60">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1 w-full">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 p-1.5 dark:bg-slate-900/80 dark:border-blue-800 shadow-2xs">
              <Mail className="w-5 h-5 text-blue-700 dark:text-cyan-400" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 rounded-full text-blue-800 font-bold text-[10px] flex items-center gap-1.5 font-mono dark:bg-blue-500/20 dark:border-blue-400/40 dark:text-cyan-300">
                  <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-300" />
                  <span>COMUNICACIONES & NOTIFICACIONES SIG</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  Plantillas y Trazabilidad Transaccional
                </span>
              </div>
              <h1 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                Centro de Notificaciones y Correos
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                Registro y trazabilidad en tiempo real de correos automáticos, observaciones y requerimientos despachados a proveedores de <strong>Flota Sugamuxi S.A.</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full xl:w-auto shrink-0 pt-2.5 xl:pt-0 border-t xl:border-t-0 border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => setIsComposeOpen(true)}
              className="flex-1 sm:flex-none justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer border border-blue-600"
            >
              <Send className="w-4 h-4" />
              <span>Redactar Correo a Proveedor</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Estandarizadas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Total Notificaciones</span>
            <Inbox className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalEmails}</div>
          <div className="text-[11px] text-blue-700 font-medium mt-1">100% Entregados con membrete</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Correcciones Despachadas</span>
            <AlertCircle className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{correctionEmails}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Con observaciones de revisor</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Aprobaciones / Habilitados</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{approvedEmails}</div>
          <div className="text-[11px] text-blue-700 font-medium mt-1">Dictámenes favorables SIG</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Transiciones de Estado</span>
            <RefreshCw className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{statusEmails}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Trazabilidad de avance</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por radicado, empresa, correo..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Todos los tipos de notificación</option>
              <option value="CORRECTION_REQUESTED">Correcciones Solicitadas</option>
              <option value="DOSSIER_HABILITADO">Proveedor Habilitado</option>
              <option value="DOSSIER_APPROVED">Expediente Aprobado</option>
              <option value="DOCUMENT_APPROVED">Documento Aprobado</option>
              <option value="STATUS_CHANGE">Cambio de Estado</option>
              <option value="SUBMISSION_CONFIRMATION">Confirmación de Envío</option>
              <option value="REGISTRATION_CODE">Códigos de Seguridad</option>
              <option value="CUSTOM_ALERT">Comunicados Personalizados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Emails Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {filteredEmails.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-sm">No se encontraron notificaciones</p>
            <p className="text-xs">Pruebe modificando los términos de búsqueda o los filtros.</p>
          </div>
        ) : (
          <div>
            <div className="sm:hidden px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] text-blue-900 dark:text-cyan-300 flex items-center justify-between font-medium">
              <span>Desliza horizontalmente para ver todas las columnas</span>
              <span className="font-bold">↔</span>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[700px] lg:min-w-full">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Tipo y Estado</th>
                  <th className="py-3 px-4">Radicado / Destinatario</th>
                  <th className="py-3 px-4">Asunto y Resumen</th>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmails.map((email) => (
                  <tr
                    key={email.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      !email.read ? 'bg-blue-50/20 font-medium' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getTypeBadge(email.templateType)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-mono text-[11px]">
                        {email.fileNumber}
                      </div>
                      <div className="text-slate-700 truncate max-w-xs">{email.recipientName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{email.recipientEmail}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-md">
                      <div className="font-semibold text-slate-900 truncate">
                        {email.subject}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {email.previewSnippet}
                      </div>
                      {email.metadata?.detailedObservation && (
                        <div className="text-[11px] text-slate-700 bg-slate-50 rounded px-2 py-0.5 mt-1 line-clamp-1 border border-slate-200">
                          <strong className="text-blue-900">Observación:</strong> {email.metadata.detailedObservation}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{email.sentAt}</span>
                      </div>
                      <span className="text-[10px] text-blue-700 font-medium">✓ Entregado</span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewEmail(email)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-md flex items-center gap-1 border border-blue-200 transition-colors"
                          title="Abrir vista de correo"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Correo</span>
                        </button>
                        <button
                          onClick={() => handleGoToDossier(email.dossierId)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md flex items-center gap-1 border border-slate-200 transition-colors"
                          title="Ir al expediente en panel de revisión"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Expediente</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </div>

      {/* Modal Viewers */}
      <EmailModalViewer
        email={selectedEmail}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
      />

      <SendCustomEmailModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        dossiers={dossiers}
        onSend={(dossierId, subject, message, reviewerName) => {
          sendCustomEmail(dossierId, subject, message, reviewerName);
        }}
      />

    </div>
  );
};

