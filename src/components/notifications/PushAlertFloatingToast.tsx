import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  AlertCircle,
  X,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandSwoosh } from '../ui/BrandSwoosh';
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

  const tone = isCritical ? '#f87171' : '#69bdd7';
  const glow = isCritical ? 'rgba(248,113,113,0.45)' : 'rgba(105,189,215,0.45)';

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-[320px] w-[calc(100vw-2rem)] animate-fade-up" style={{ position: 'fixed' }} role="alert">
      <div
        className="gradient-border relative overflow-hidden rounded-xl bg-[#131b2e]/95 text-white backdrop-blur-xl"
        style={{ boxShadow: `0 28px 60px -20px rgba(3,10,30,0.85), 0 0 44px -12px ${glow}` }}
      >
        <BrandSwoosh className="absolute -right-10 -top-10 w-44 opacity-30" />
        <div className="relative px-3 pt-3 pb-3 flex flex-col gap-2">
          <div className="flex items-start gap-2.5">
            <span
              className={`flex w-9 h-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white ${
                isCritical ? 'from-red-500 to-red-400' : 'from-[#2c84c4] to-[#69bdd7]'
              }`}
              style={{ boxShadow: `0 8px 20px -8px ${glow}` }}
            >
              {isCritical ? <AlertCircle className="w-4.5 h-4.5" /> : <Bell className="w-4.5 h-4.5" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: tone }}>
                {isCritical ? 'Alerta crítica' : 'Aviso preventivo'}
              </div>
              <h4 className="font-display font-semibold text-[14px] leading-tight text-white mt-0.5">
                {isCritical
                  ? `${alertsSummary.criticalCount} requisito(s) vencido(s)`
                  : `${alertsSummary.warningCount} próximo(s) a vencer`}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="p-1 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Descartar notificación"
              aria-label="Descartar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {topAlert && (
            <div className="rounded-lg glass-dark px-3 py-2 space-y-0.5">
              <span className="font-semibold text-white block text-[12.5px] truncate">{topAlert.title}</span>
              <p className="text-[11.5px] text-white/70 line-clamp-2 leading-snug">{topAlert.message}</p>
              <div className="text-[10.5px] text-[#69bdd7]/80 truncate">
                {topAlert.supplierName} · {topAlert.fileNumber}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="h-8 px-3 rounded-lg text-xs font-semibold text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Más tarde
            </button>
            <button
              type="button"
              onClick={handleOpenAlert}
              className="shimmer h-8 px-3.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 text-white cursor-pointer bg-gradient-brand shadow-glow hover:opacity-95 transition-opacity"
            >
              <span>Ver y gestionar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
