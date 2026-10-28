import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  X,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  computePushAlerts,
  playNotificationChime,
  sendBrowserPushNotification,
} from '../../utils/pushAlertsService';

const SESSION_SHOWN_KEY = 'sigepro_push_toast_session_shown';

export const PushAlertFloatingToast: React.FC = () => {
  const {
    role,
    dossiers,
    currentDossierId,
    setActiveView,
    setReviewSelectedDossierId,
  } = useApp();

  const [isVisible, setIsVisible] = useState(false);
  const [hasPromptedThisSession, setHasPromptedThisSession] = useState(false);

  const alertsSummary = useMemo(() => {
    return computePushAlerts(dossiers, role, currentDossierId);
  }, [dossiers, role, currentDossierId]);

  useEffect(() => {
    // Only prompt once per browser session if there are unread alerts
    const alreadyShown = sessionStorage.getItem(SESSION_SHOWN_KEY);
    if (!alreadyShown && alertsSummary.totalUnread > 0 && !hasPromptedThisSession) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setHasPromptedThisSession(true);
        sessionStorage.setItem(SESSION_SHOWN_KEY, 'true');

        // Play gentle audio chime
        playNotificationChime();

        // Send native desktop push if permitted
        if (alertsSummary.hasCritical) {
          sendBrowserPushNotification(
            'SIGEPRO - Requisitos Vencidos',
            `Se han detectado ${alertsSummary.criticalCount} documento(s) o contrato(s) vencidos que requieren atención inmediata.`
          );
        } else if (alertsSummary.hasExpiringSoon) {
          sendBrowserPushNotification(
            'SIGEPRO - Próximos Vencimientos',
            `Tiene ${alertsSummary.warningCount} requisito(s) próximos a vencer en los siguientes 30 días.`
          );
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [alertsSummary.totalUnread, alertsSummary.hasCritical, alertsSummary.hasExpiringSoon, alertsSummary.criticalCount, alertsSummary.warningCount, hasPromptedThisSession]);

  if (!isVisible || alertsSummary.totalUnread === 0) return null;

  const isCritical = alertsSummary.hasCritical;
  const topAlert = alertsSummary.alerts[0];

  const handleOpenAlert = () => {
    setIsVisible(false);
    if (!topAlert) return;

    setReviewSelectedDossierId(topAlert.dossierId);
    setActiveView('revisores');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full p-1 animate-in slide-in-from-bottom-5 duration-300">
      <div
        className={`rounded-2xl p-4 shadow-2xl border flex flex-col gap-3 backdrop-blur-md transition-all ${
          isCritical
            ? 'bg-[#0f172a]/95 text-white border-rose-500/80 shadow-rose-950/40 ring-2 ring-rose-500/30'
            : 'bg-[#0b1329]/95 text-white border-blue-500/80 shadow-blue-950/40 ring-2 ring-blue-500/30'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                isCritical
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {isCritical ? <AlertCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                  {isCritical ? 'Alerta Crítica' : 'Aviso Preventivo'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span className="text-[10px] text-slate-300 font-mono">SIGEPRO PUSH</span>
              </div>
              <h4 className="font-extrabold text-xs sm:text-sm text-white">
                {isCritical
                  ? `${alertsSummary.criticalCount} Requisito(s) Vencido(s)`
                  : `${alertsSummary.warningCount} Próximo(s) a Vencer`}
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Descartar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message snippet */}
        {topAlert && (
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 text-xs space-y-1">
            <span className="font-bold text-white block text-[11px] truncate">
              {topAlert.title}
            </span>
            <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
              {topAlert.message}
            </p>
            <div className="text-[10px] text-slate-400 font-mono pt-0.5">
              {topAlert.supplierName} ({topAlert.fileNumber})
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="text-[11px] text-slate-400 hover:text-slate-200 font-bold px-2 py-1"
          >
            Más tarde
          </button>

          <button
            type="button"
            onClick={handleOpenAlert}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
              isCritical
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black'
            }`}
          >
            <span>Ver y Gestionar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
