import React, { useState } from 'react';
import { EmailNotification } from '../types';
import {
  X,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building2,
  ExternalLink,
  Copy,
  Check,
  Send,
  User,
  FileText,
} from 'lucide-react';

interface EmailModalViewerProps {
  email: EmailNotification | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmailModalViewer: React.FC<EmailModalViewerProps> = ({ email, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !email) return null;

  const handleCopySubject = () => {
    navigator.clipboard.writeText(email.subject);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'CORRECTION_REQUESTED':
        return 'bg-black/[0.04] dark:bg-white/[0.06] text-[#0b1d3a] dark:text-white border-black/10 dark:border-white/10';
      case 'DOSSIER_HABILITADO':
      case 'DOSSIER_APPROVED':
      case 'DOCUMENT_APPROVED':
        return 'bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] border-[#2c84c4]/30';
      case 'DOSSIER_REJECTED':
        return 'bg-black/[0.08] dark:bg-white/10 text-[#0b1d3a] dark:text-white border-black/10 dark:border-white/10';
      case 'SUBMISSION_CONFIRMATION':
      case 'REGISTRATION_CODE':
        return 'bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] border-[#2c84c4]/30';
      default:
        return 'bg-black/[0.04] dark:bg-white/[0.06] text-[#0b1d3a] dark:text-white border-black/10 dark:border-white/10';
    }
  };

  const getTemplateTitle = (type: string) => {
    switch (type) {
      case 'CORRECTION_REQUESTED': return 'Solicitud de Corrección Técnica';
      case 'DOSSIER_HABILITADO': return 'Habilitación Oficial de Proveedor';
      case 'DOSSIER_APPROVED': return 'Aprobación de Expediente';
      case 'DOSSIER_REJECTED': return 'Rechazo de Solicitud';
      case 'DOCUMENT_APPROVED': return 'Aprobación Documental';
      case 'SUBMISSION_CONFIRMATION': return 'Confirmación de Radicación';
      case 'REGISTRATION_CODE': return 'Código de Validación';
      case 'STATUS_CHANGE': return 'Cambio de Estado';
      default: return 'Comunicado Oficial';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 max-w-3xl w-full flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Header */}
        <div className="bg-[#0b1329] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 border border-blue-400/40 flex items-center justify-center text-white shadow-xs shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300">
                  Visor de Correo Institucional
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getBadgeStyle(email.templateType)}`}>
                  {getTemplateTitle(email.templateType)}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-0.5 truncate max-w-sm sm:max-w-md">
                {email.subject}
              </h3>
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

        {/* Email Metadata Bar */}
        <div className="bg-black/[0.04] dark:bg-white/[0.06] border-b border-black/10 dark:border-white/10 px-5 sm:px-6 py-3.5 text-xs text-[#3a5274] dark:text-slate-300 space-y-2 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#5d7392] dark:text-slate-400 w-14">De:</span>
              <span className="font-semibold text-[#0b1d3a] dark:text-white flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7] shrink-0" />
                <span className="truncate">Flota Sugamuxi S.A. &bull; notificaciones@flotasugamuxi.com</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[#5d7392] dark:text-slate-400 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-[#5d7392] dark:text-slate-400" />
              <span>{email.sentAt}</span>
              <span className="bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] border border-[#2c84c4]/30 text-[10px] font-extrabold px-2 py-0.5 rounded ml-1">
                ✓ Entregado
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-[#5d7392] dark:text-slate-400 w-14">Para:</span>
            <span className="font-medium text-[#0b1d3a] dark:text-white flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 text-[#5d7392] dark:text-slate-400 shrink-0" />
              <span className="font-semibold text-[#0b1d3a] dark:text-white">{email.recipientName}</span> &lt;{email.recipientEmail}&gt;
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/10 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#5d7392] dark:text-slate-400 w-14">Radicado:</span>
              <span className="font-mono font-extrabold text-[#1d5fa8] dark:text-[#69bdd7] bg-[#2c84c4]/10 px-2 py-0.5 rounded border border-[#2c84c4]/30">
                {email.fileNumber}
              </span>
            </div>
            <button
              onClick={handleCopySubject}
              className="text-xs font-semibold text-[#3a5274] dark:text-slate-300 hover:text-[#0b1d3a] dark:hover:text-white flex items-center gap-1.5 px-2.5 py-1 bg-white border border-black/10 dark:border-white/10 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#1d5fa8] dark:text-[#69bdd7]" /> : <Copy className="w-3.5 h-3.5 text-[#5d7392] dark:text-slate-400" />}
              <span>{copied ? 'Copiado al portapapeles' : 'Copiar asunto'}</span>
            </button>
          </div>
        </div>

        {/* Rendered Institutional HTML Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-black/[0.04] dark:bg-white/[0.06]">
          <div className="bg-white rounded-xl shadow-xs border border-black/10 dark:border-white/10 p-4 sm:p-6 max-w-2xl mx-auto">
            <div
              className="email-body-content"
              dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-black/[0.04] dark:bg-white/[0.06] px-5 sm:px-6 py-3.5 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs text-[#3a5274] dark:text-slate-300 shrink-0">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#1d5fa8] dark:text-[#69bdd7]" />
            <span className="hidden sm:inline">Notificación certificada del Sistema Integrado de Gestión (SIG) Flota Sugamuxi S.A.</span>
            <span className="sm:hidden">SIG Flota Sugamuxi S.A.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0b1329] hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Cerrar Visor
          </button>
        </div>

      </div>
    </div>
  );
};
