import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Volume2,
  VolumeX,
  Laptop,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  PushAlert,
  computePushAlerts,
  dismissPushAlert,
  dismissAllPushAlerts,
  requestBrowserPushPermission,
  sendBrowserPushNotification,
  playNotificationChime,
} from '../../utils/pushAlertsService';

interface Props {
  onOpenDossier?: (dossierId: string) => void;
}

export const PushAlertsPopover: React.FC<Props> = ({ onOpenDossier }) => {
  const {
    role,
    dossiers,
    currentDossierId,
    setReviewSelectedDossierId,
    setActiveView,
    showToast,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'ALL' | 'EXPIRED' | 'EXPIRING' | 'CONTRACTS'>('ALL');
  const [dismissedVersion, setDismissedVersion] = useState(0);
  const [hasPermission, setHasPermission] = useState<NotificationPermission>('default');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Compute active alerts reactively
  const alertsSummary = useMemo(() => {
    return computePushAlerts(dossiers, role, currentDossierId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossiers, role, currentDossierId, dismissedVersion]);

  // Check initial browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasPermission(Notification.permission);
    }
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredAlerts = useMemo(() => {
    return alertsSummary.alerts.filter((alert) => {
      if (filterTab === 'EXPIRED') return alert.severity === 'CRITICAL';
      if (filterTab === 'EXPIRING') return alert.severity === 'WARNING';
      if (filterTab === 'CONTRACTS') return alert.type === 'CONTRACT_EXPIRED' || alert.type === 'CONTRACT_EXPIRING';
      return true;
    });
  }, [alertsSummary.alerts, filterTab]);

  const handleDismiss = (e: React.MouseEvent, alertId: string) => {
    e.stopPropagation();
    dismissPushAlert(alertId);
    setDismissedVersion((v) => v + 1);
  };

  const handleDismissAll = () => {
    const ids = alertsSummary.alerts.map((a) => a.id);
    dismissAllPushAlerts(ids);
    setDismissedVersion((v) => v + 1);
    showToast('Todas las alertas actuales han sido marcadas como leídas.', 'info', 'ALERTAS ACTUALIZADAS');
  };

  const handleRequestPushPermission = async () => {
    const perm = await requestBrowserPushPermission();
    setHasPermission(perm);
    if (perm === 'granted') {
      sendBrowserPushNotification(
        'SIGEPRO - Flota Sugamuxi S.A.',
        '¡Notificaciones Push activadas con éxito! Recibirá avisos preventivos de vigencias y alertas críticas.'
      );
      if (soundEnabled) playNotificationChime();
      showToast('Notificaciones Push de escritorio activadas.', 'success', 'NOTIFICACIONES ACTIVAS');
    } else {
      showToast('Permiso de notificaciones push denegado en el navegador.', 'warning', 'AVISO PUSH');
    }
  };

  const handleAction = (alert: PushAlert) => {
    setIsOpen(false);
    dismissPushAlert(alert.id);
    setDismissedVersion((v) => v + 1);

    setReviewSelectedDossierId(alert.dossierId);
    setActiveView('revisores');
    if (onOpenDossier) {
      onOpenDossier(alert.dossierId);
    }
  };

  const unreadCount = alertsSummary.totalUnread;
  const isCritical = alertsSummary.hasCritical;

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button with Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 sm:px-2.5 sm:py-1.5 rounded-lg border transition-all duration-200 shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 ${
          isOpen
            ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-400 dark:border-blue-600 text-blue-900 dark:text-cyan-300'
            : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
        }`}
        title="Centro de Alertas de Vencimiento y Notificaciones Push"
        aria-label="Alertas y Notificaciones"
      >
        <Bell
          className={`w-4 h-4 ${
            unreadCount > 0
              ? isCritical
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-amber-500 dark:text-amber-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        />
        <span className="hidden lg:inline text-[11px] font-bold text-slate-700 dark:text-slate-300">
          Alertas
        </span>

        {/* Counter Badge */}
        {unreadCount > 0 && (
          <span
            className={`flex items-center justify-center px-1.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-black text-white shadow-xs ${
              isCritical
                ? 'bg-rose-600 animate-pulse'
                : 'bg-amber-500'
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[420px] max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0b1329] via-[#0f1d40] to-[#0b1329] text-white p-3.5 sm:p-4 border-b border-slate-800 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/40 border border-blue-400/30 flex items-center justify-center text-cyan-300">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-white tracking-wide flex items-center gap-1.5">
                    <span>Alertas & Vigencias</span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-400/30">
                      PUSH
                    </span>
                  </h3>
                  <p className="text-[10px] text-blue-200/80">
                    Monitoreo en vivo de vencimientos y requisitos
                  </p>
                </div>
              </div>

              {/* Quick Actions Header */}
              <div className="flex items-center gap-1">
                {/* Audio chime toggle */}
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  title={soundEnabled ? 'Sonido activado' : 'Sonido silenciado'}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-300" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  title="Cerrar panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Counters Bar */}
            <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-white/10 text-center">
              <div className="bg-white/5 rounded-lg py-1 px-2">
                <span className="text-[9px] uppercase tracking-wider text-slate-300 block">Críticas</span>
                <span className={`text-xs font-black ${alertsSummary.criticalCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {alertsSummary.criticalCount}
                </span>
              </div>
              <div className="bg-white/5 rounded-lg py-1 px-2">
                <span className="text-[9px] uppercase tracking-wider text-slate-300 block">Por Vencer</span>
                <span className={`text-xs font-black ${alertsSummary.warningCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {alertsSummary.warningCount}
                </span>
              </div>
              <div className="bg-white/5 rounded-lg py-1 px-2">
                <span className="text-[9px] uppercase tracking-wider text-slate-300 block">Total</span>
                <span className="text-xs font-black text-cyan-300">
                  {alertsSummary.alerts.length}
                </span>
              </div>
            </div>
          </div>

          {/* Web Push Permission Banner */}
          {hasPermission !== 'granted' && (
            <div className="bg-blue-50 dark:bg-blue-950/60 border-b border-blue-200 dark:border-blue-900/60 p-2.5 px-3 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Laptop className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400 shrink-0" />
                <span className="text-[11px] text-blue-950 dark:text-slate-200 font-medium truncate">
                  Activar alertas push en tu navegador
                </span>
              </div>
              <button
                type="button"
                onClick={handleRequestPushPermission}
                className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white font-bold text-[10px] rounded-md transition-colors shrink-0 shadow-2xs cursor-pointer"
              >
                Permitir
              </button>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-3 bg-slate-50/70 dark:bg-slate-900/50 shrink-0 text-xs">
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              {[
                { id: 'ALL', label: 'Todas' },
                { id: 'EXPIRED', label: 'Vencidos' },
                { id: 'EXPIRING', label: 'Por Vencer' },
                { id: 'CONTRACTS', label: 'Contratos' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id as any)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                    filterTab === tab.id
                      ? 'bg-blue-900 dark:bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {alertsSummary.totalUnread > 0 && (
              <button
                type="button"
                onClick={handleDismissAll}
                className="text-[10px] font-bold text-blue-700 dark:text-cyan-400 hover:underline shrink-0"
              >
                Limpiar todo
              </button>
            )}
          </div>

          {/* Alerts Scrollable List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/80 p-2 space-y-1">
            {filteredAlerts.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  ¡Al día y en regla!
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  No se registran documentos ni contratos con vencimientos pendientes o alertas de subsanación.
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isCrit = alert.severity === 'CRITICAL';
                return (
                  <div
                    key={alert.id}
                    onClick={() => handleAction(alert)}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer group relative flex items-start gap-2.5 ${
                      alert.read
                        ? 'opacity-60 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        : isCrit
                        ? 'bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 hover:border-rose-400'
                        : 'bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 hover:border-amber-400'
                    }`}
                  >
                    {/* Severity Indicator Icon */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isCrit
                          ? 'bg-rose-100 dark:bg-rose-900/80 text-rose-700 dark:text-rose-200'
                          : 'bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-200'
                      }`}
                    >
                      {isCrit ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`font-black text-xs truncate ${
                            isCrit
                              ? 'text-rose-950 dark:text-rose-200'
                              : 'text-amber-950 dark:text-amber-200'
                          }`}
                        >
                          {alert.title}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleDismiss(e, alert.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-opacity"
                          title="Descartar alerta"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                        {alert.message}
                      </p>

                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{alert.supplierName}</span>
                          <span>&bull;</span>
                          <span>{alert.fileNumber}</span>
                        </div>

                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded shrink-0 ${
                            isCrit
                              ? 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100'
                              : 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100'
                          }`}
                        >
                          {alert.daysOverdue
                            ? `Vencido ${alert.daysOverdue}d`
                            : alert.daysRemaining !== undefined
                            ? alert.daysRemaining === 0
                              ? 'Vence hoy'
                              : `En ${alert.daysRemaining}d`
                            : 'Atención'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 px-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <span className="text-[10px] text-slate-400">
              Sistema Integrado SIG &bull; Flota Sugamuxi S.A.
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setActiveView('bancoProveedores');
              }}
              className="font-bold text-blue-700 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Banco de Proveedores</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
