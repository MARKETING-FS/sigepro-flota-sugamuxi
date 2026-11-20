import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  AlertCircle,
  X,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  PushAlert,
  computePushAlerts,
  dismissPushAlert,
  getAnnouncedAlertIds,
  markAlertsAnnounced,
  playNotificationChime,
  sendBrowserPushNotification,
} from '../../utils/pushAlertsService';

const SESSION_SHOWN_KEY = 'sigepro_push_toast_session_shown';

export const PushAlertFloatingToast: React.FC = () => {
  const {
    role,
    dossiers,
    currentDossierId,
    openSupplierReview,
    showSupplierInBank,
    activeUser,
    activeUserId,
  } = useApp();

  const [isVisible, setIsVisible] = useState(false);
  const [hasPromptedThisSession, setHasPromptedThisSession] = useState(false);
  // Lo que muestra la ventanita se fija al abrirla (así no cambia cuando el aviso se marca como ya avisado)
  const [shown, setShown] = useState<{ kind: 'ASSIGNED' | 'OTHER'; alert: PushAlert; count: number } | null>(null);

  const alertsSummary = useMemo(() => {
    return computePushAlerts(dossiers, role, currentDossierId, {
      userId: activeUserId,
      selfLabel: `${activeUser.name} (${activeUser.shortName})`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossiers, role, currentDossierId, activeUserId]);

  // Asignaciones que todavía no han salido en la ventanita: cada una avisa UNA sola vez (aunque se cierre sesión o se recargue)
  const freshAssignments = useMemo(() => {
    const announced = getAnnouncedAlertIds(activeUserId);
    return alertsSummary.alerts.filter((a) => a.type === 'ASSIGNED' && !a.read && !announced.has(a.id));
  }, [alertsSummary.alerts, activeUserId]);
  // Los demás avisos (vencimientos, correcciones) siguen saliendo una vez por sesión del navegador
  const otherUnread = useMemo(
    () => alertsSummary.alerts.filter((a) => a.type !== 'ASSIGNED' && !a.read),
    [alertsSummary.alerts]
  );

  useEffect(() => {
    if (!activeUserId) return;

    // 1) Una asignación nueva avisa en el momento y no vuelve a avisar
    if (freshAssignments.length > 0) {
      const fresh = freshAssignments;
      const timer = setTimeout(() => {
        setShown({ kind: 'ASSIGNED', alert: fresh[0], count: fresh.length });
        setIsVisible(true);
        markAlertsAnnounced(activeUserId, fresh.map((a) => a.id));
        playNotificationChime();
      }, 1500);
      return () => clearTimeout(timer);
    }

    // 2) Resto de avisos: una vez por sesión
    const alreadyShown = sessionStorage.getItem(SESSION_SHOWN_KEY);
    if (!alreadyShown && otherUnread.length > 0 && !hasPromptedThisSession) {
      const timer = setTimeout(() => {
        setShown({ kind: 'OTHER', alert: otherUnread[0], count: otherUnread.length });
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
  }, [freshAssignments, otherUnread, activeUserId, alertsSummary.hasCritical, alertsSummary.hasExpiringSoon, alertsSummary.criticalCount, alertsSummary.warningCount, hasPromptedThisSession]);

  if (!isVisible || !shown) return null;

  const isAssigned = shown.kind === 'ASSIGNED';
  const isCritical = !isAssigned && alertsSummary.hasCritical;
  const topAlert = shown.alert;

  const handleOpenAlert = () => {
    setIsVisible(false);
    if (isAssigned) {
      // Al abrirla se da por leída: no vuelve a salir ni en la campanita
      dismissPushAlert(topAlert.id);
      showSupplierInBank(topAlert.dossierId);
      return;
    }

    const isContract = topAlert.type === 'CONTRACT_EXPIRED' || topAlert.type === 'CONTRACT_EXPIRING';
    openSupplierReview(topAlert.dossierId, isContract ? { tab: 'contrato' } : { tab: 'documentos', docCode: topAlert.docCode });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-[360px] w-[calc(100vw-2rem)] animate-fade-up" style={{ position: 'fixed' }} role="alert">
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#0f1a33] border border-black/[0.08] dark:border-white/10 shadow-[0_18px_44px_-14px_rgba(11,29,58,0.35)] dark:shadow-[0_22px_50px_-16px_rgba(0,0,0,0.8)]">
        <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${isCritical ? 'bg-red-500' : 'bg-gradient-to-b from-[#69bdd7] to-[#2c84c4]'}`} />
        <div className="pl-5 pr-3 pt-3 pb-3 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span className={`grid place-items-center w-10 h-10 shrink-0 rounded-full ${isCritical ? 'bg-red-500/12 text-red-600 dark:text-red-400' : 'bg-[#2c84c4]/12 dark:bg-[#2c84c4]/25 text-[#1d5fa8] dark:text-[#69bdd7]'}`}>
              {isCritical ? <AlertCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-[#2c84c4] dark:text-[#69bdd7]'}`}>
                {isCritical ? 'Alerta crítica' : isAssigned ? 'Nueva asignación' : 'Aviso preventivo'}
              </div>
              <h4 className="font-display font-semibold text-[15px] leading-tight text-[#0b1d3a] dark:text-white mt-0.5">
                {isCritical
                  ? `${alertsSummary.criticalCount} requisito(s) vencido(s)`
                  : isAssigned
                  ? shown.count > 1
                    ? `Te asignaron ${shown.count} proveedores`
                    : 'Te asignaron un proveedor'
                  : `${alertsSummary.warningCount} próximo(s) a vencer`}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="w-7 h-7 grid place-items-center rounded-lg text-[#6b84a3] hover:text-[#0b1d3a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Descartar notificación"
              aria-label="Descartar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {topAlert && (
            <div className="rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/10 px-3 py-2.5 space-y-0.5">
              <span className="font-semibold text-[#0b1d3a] dark:text-white block text-[13px] truncate">{topAlert.title}</span>
              <p className="text-[12px] text-[#3a5274] dark:text-slate-300 line-clamp-2 leading-snug">{topAlert.message}</p>
              <div className="text-[11px] text-[#2c84c4] dark:text-[#69bdd7] truncate pt-0.5">
                {topAlert.supplierName} · {topAlert.fileNumber}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="h-9 px-3.5 rounded-xl text-xs font-semibold text-[#1c3354] dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Más tarde
            </button>
            <button
              type="button"
              onClick={handleOpenAlert}
              className="h-9 px-4 rounded-xl font-semibold text-xs inline-flex items-center gap-1.5 text-white cursor-pointer bg-gradient-action shadow-glow hover:brightness-110 transition"
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
