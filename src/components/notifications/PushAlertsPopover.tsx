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
import { BrandSwoosh } from '../ui/BrandSwoosh';
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

export const PushAlertsPopover: React.FC<Props> = () => {
  const {
    role,
    dossiers,
    currentDossierId,
    openSupplierReview,
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

    // Abre el expediente justo donde hay que actuar: el documento vencido o la pestaña del contrato
    const isContract = alert.type === 'CONTRACT_EXPIRED' || alert.type === 'CONTRACT_EXPIRING';
    openSupplierReview(alert.dossierId, isContract ? { tab: 'contrato' } : { tab: 'documentos', docCode: alert.docCode });
  };

  const unreadCount = alertsSummary.totalUnread;
  const isCritical = alertsSummary.hasCritical;

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button with Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-10 h-10 rounded-xl transition-colors cursor-pointer grid place-items-center ${
          isOpen
            ? 'bg-[#2c84c4]/15 text-[#0b1d3a] dark:bg-white/15 dark:text-white'
            : 'hover:bg-[#2c84c4]/10 dark:hover:bg-white/10 text-[#1c3354] dark:text-white'
        }`}
        title="Centro de Alertas de Vencimiento y Notificaciones Push"
        aria-label="Alertas y Notificaciones"
      >
        <Bell
          className={`w-5 h-5 ${unreadCount > 0 ? 'origin-top animate-[nd-float_2s_ease-in-out_infinite]' : ''}`}
        />

        {/* Counter Badge */}
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 flex items-center justify-center px-1 min-w-[18px] h-[18px] rounded-full text-[11px] font-bold text-white ${
              isCritical
                ? 'bg-[#dc2626] animate-pulse-ring'
                : 'bg-fs-warn'
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de alertas */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[440px] max-w-[calc(100vw-1.5rem)] fs-pop rounded-2xl z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
          <div className="fs-solid fs-hero rounded-none text-white px-5 py-4 shrink-0 overflow-hidden">
            <BrandSwoosh className="absolute -right-10 -top-6 w-72 opacity-60" />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-11 h-11 rounded-2xl bg-white/15 ring-1 ring-white/50 grid place-items-center shrink-0">
                  <Bell className="w-6 h-6" strokeWidth={1.7} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-xl font-bold leading-tight">Alertas</h3>
                  <p className="text-sm text-[#dbe9f7]">
                    {unreadCount === 0 ? 'Todo al día' : `${unreadCount} sin atender`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="w-9 h-9 grid place-items-center rounded-xl text-white/85 hover:bg-white/15 transition-colors cursor-pointer"
                  title={soundEnabled ? 'Silenciar' : 'Activar sonido'}
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-9 h-9 grid place-items-center rounded-xl text-white/85 hover:bg-white/15 transition-colors cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mt-4">
              {[
                { label: 'Vencidos', value: alertsSummary.criticalCount },
                { label: 'Por vencer', value: alertsSummary.warningCount },
                { label: 'Total', value: unreadCount },
              ].map((k) => (
                <div key={k.label} className="rounded-2xl bg-[#061433]/55 px-3 py-2">
                  <div className="text-[13px] text-[#dbe9f7]">{k.label}</div>
                  <div className="text-2xl font-bold leading-tight tabular-nums">{k.value}</div>
                </div>
              ))}
            </div>
          </div>

          {hasPermission === 'default' && (
            <div className="flex items-center justify-between gap-3 px-5 py-3 bg-[#eaf1f9] dark:bg-[#0c2350] shrink-0">
              <span className="flex items-center gap-2 text-sm text-[#0b1d3a] dark:text-white">
                <Laptop className="w-4 h-4 shrink-0" /> Recibir avisos en el escritorio
              </span>
              <button
                type="button"
                onClick={handleRequestPushPermission}
                className="h-9 px-4 rounded-xl bg-[#0f3d75] hover:bg-[#0b2f5c] dark:bg-[#1f7ae8] text-white text-sm font-bold cursor-pointer"
              >
                Activar
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 px-5 pt-3 pb-1 shrink-0">
            <div className="flex items-center gap-1 flex-wrap">
              {([
                ['ALL', 'Todas'],
                ['EXPIRED', 'Vencidos'],
                ['EXPIRING', 'Por vencer'],
                ['CONTRACTS', 'Contratos'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilterTab(key)}
                  className={`h-9 px-3 rounded-full text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    filterTab === key
                      ? 'bg-[#0f3d75] text-white dark:bg-[#0e3a7a] dark:ring-2 dark:ring-[#5aa8ff]'
                      : 'bg-[#e6edf6] text-[#0b1d3a] hover:bg-[#d8e3f0] dark:bg-[#071636]/70 dark:ring-1 dark:ring-[#3f7fd8] dark:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {alertsSummary.alerts.length > 0 && (
              <button
                type="button"
                onClick={handleDismissAll}
                className="text-sm font-semibold text-[#1d5fa8] dark:text-[#74b4ff] hover:underline shrink-0 cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 px-3 py-2">
            {filteredAlerts.length === 0 ? (
              <div className="py-10 text-center">
                <span className="w-12 h-12 rounded-full bg-[#e1ecf8] dark:bg-[#123267] text-[#1d5fa8] dark:text-white grid place-items-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </span>
                <h4 className="mt-3 text-base font-bold text-[#0b1d3a] dark:text-white">Sin alertas</h4>
                <p className="text-sm text-[#3a5274] mt-1">No hay vencimientos pendientes en este filtro.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#e6edf5] dark:divide-[#1d3a70]">
                {filteredAlerts.map((alert) => {
                  const isCrit = alert.severity === 'CRITICAL';
                  const label = alert.daysOverdue
                    ? `Vencido hace ${alert.daysOverdue} d`
                    : alert.daysRemaining !== undefined
                    ? alert.daysRemaining === 0
                      ? 'Vence hoy'
                      : `Vence en ${alert.daysRemaining} d`
                    : 'Atención';
                  return (
                    <li key={alert.id} className="group relative">
                      <button
                        type="button"
                        onClick={() => handleAction(alert)}
                        className="w-full text-left flex items-start gap-3 px-2 py-3.5 rounded-2xl hover:bg-[#eaf2fb] dark:hover:bg-[#0c2350] transition-colors cursor-pointer"
                      >
                        <span
                          className={`mt-0.5 w-10 h-10 rounded-xl grid place-items-center shrink-0 text-white ${
                            isCrit ? 'bg-[#dc2626]' : 'bg-[#69bdd7]'
                          }`}
                        >
                          {isCrit ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-bold text-[#0b1d3a] dark:text-white leading-snug">{alert.title}</span>
                          <span className="block text-sm text-[#3a5274] dark:text-[#b4c7e3] mt-0.5 line-clamp-2">{alert.message}</span>
                          <span className="flex items-center justify-between gap-2 mt-2">
                            <span className="text-sm text-[#0b1d3a] dark:text-white truncate">
                              <span className="font-semibold">{alert.supplierName}</span>
                              <span className="text-[#5d7392] tabular-nums"> · {alert.fileNumber}</span>
                            </span>
                            <span
                              className={`text-[13px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                                isCrit
                                  ? 'bg-[#fde3e3] text-[#b91c1c] dark:bg-[#dc2626] dark:text-white'
                                  : 'bg-[#d6eef6] text-[#0e6d8a] dark:bg-[#69bdd7] dark:!text-[#131b2e]'
                              }`}
                            >
                              {label}
                            </span>
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDismiss(e, alert.id)}
                        className="absolute top-2.5 right-2.5 w-7 h-7 grid place-items-center rounded-lg text-[#5d7392] hover:text-[#0b1d3a] dark:hover:text-white hover:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Marcar como leída"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="px-5 py-3 border-t border-[#e6edf5] dark:border-[#1d3a70] flex items-center justify-between shrink-0">
            <span className="text-sm text-[#5d7392]">Flota Sugamuxi S.A.</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setActiveView('bancoProveedores');
              }}
              className="text-sm font-bold text-[#1d5fa8] dark:text-[#74b4ff] hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              Banco de proveedores <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
