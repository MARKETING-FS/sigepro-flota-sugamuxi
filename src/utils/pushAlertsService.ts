import { SupplierDossier, UserRole, AppView } from '../types';
import {
  calculateDocumentExpiration,
  calculateContractValidity,
  getDossierDocumentExpirationSummary,
} from './contractValidity';

export type PushAlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type PushAlertType =
  | 'DOC_EXPIRED'
  | 'DOC_EXPIRING'
  | 'CONTRACT_EXPIRED'
  | 'CONTRACT_EXPIRING'
  | 'CORRECTION_NEEDED'
  | 'PENDING_DOCS';

export interface PushAlert {
  id: string;
  type: PushAlertType;
  severity: PushAlertSeverity;
  title: string;
  message: string;
  dossierId: string;
  supplierName: string;
  fileNumber: string;
  docCode?: string;
  docName?: string;
  daysRemaining?: number;
  daysOverdue?: number;
  date?: string;
  createdAt: string;
  read?: boolean;
  actionView?: AppView;
}

export interface PushAlertsSummary {
  alerts: PushAlert[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  totalUnread: number;
  hasCritical: boolean;
  hasExpiringSoon: boolean;
}

const STORAGE_KEY_DISMISSED_ALERTS = 'sigepro_dismissed_push_alerts_v1';

/**
 * Retrieve dismissed alert IDs from localStorage
 */
export function getDismissedAlertIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DISMISSED_ALERTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Mark alert as dismissed in localStorage
 */
export function dismissPushAlert(alertId: string) {
  try {
    const dismissed = getDismissedAlertIds();
    if (!dismissed.includes(alertId)) {
      dismissed.push(alertId);
      localStorage.setItem(STORAGE_KEY_DISMISSED_ALERTS, JSON.stringify(dismissed));
    }
  } catch {}
}

/**
 * Dismiss all currently active alerts
 */
export function dismissAllPushAlerts(alertIds: string[]) {
  try {
    const dismissed = Array.from(new Set([...getDismissedAlertIds(), ...alertIds]));
    localStorage.setItem(STORAGE_KEY_DISMISSED_ALERTS, JSON.stringify(dismissed));
  } catch {}
}

/**
 * Compute all alerts for a single dossier
 */
export function computeDossierPushAlerts(dossier: SupplierDossier): PushAlert[] {
  const alerts: PushAlert[] = [];
  const supplierName = dossier.basicInfo.companyName || dossier.basicInfo.fullName || 'Proveedor';
  const fileNumber = dossier.fileNumber;
  const now = new Date().toISOString();

  // 1. Check Document Expirations
  const expSummary = getDossierDocumentExpirationSummary(dossier);

  for (const doc of expSummary.expiredDocs) {
    alerts.push({
      id: `alert-doc-exp-${dossier.id}-${doc.code}`,
      type: 'DOC_EXPIRED',
      severity: 'CRITICAL',
      title: `Documento Vencido: ${doc.name}`,
      message: `El requisito venció hace ${doc.daysOverdue} día${doc.daysOverdue === 1 ? '' : 's'} (${doc.expirationDate}). Inhabilita la conformidad del proveedor.`,
      dossierId: dossier.id,
      supplierName,
      fileNumber,
      docCode: doc.code,
      docName: doc.name,
      daysOverdue: doc.daysOverdue,
      date: doc.expirationDate,
      createdAt: now,
      actionView: 'revisores',
    });
  }

  for (const doc of expSummary.expiringSoonDocs) {
    alerts.push({
      id: `alert-doc-soon-${dossier.id}-${doc.code}`,
      type: 'DOC_EXPIRING',
      severity: 'WARNING',
      title: `Próximo a Vencer: ${doc.name}`,
      message: doc.daysRemaining === 0
        ? `El documento vence HOY (${doc.expirationDate}). Requiere cargue de soporte renovado de inmediato.`
        : `Vence en ${doc.daysRemaining} día${doc.daysRemaining === 1 ? '' : 's'} (${doc.expirationDate}). Gestione la actualización preventiva.`,
      dossierId: dossier.id,
      supplierName,
      fileNumber,
      docCode: doc.code,
      docName: doc.name,
      daysRemaining: doc.daysRemaining,
      date: doc.expirationDate,
      createdAt: now,
      actionView: 'revisores',
    });
  }

  // 2. Check Contract Validity
  if (dossier.contractInfo && dossier.contractInfo.endDate) {
    const contractVal = calculateContractValidity(dossier.contractInfo);
    const contractNum = dossier.contractInfo.contractNumber || 'S/N';

    if (contractVal.status === 'VENCIDO') {
      const overdue = Math.abs(contractVal.daysRemaining);
      alerts.push({
        id: `alert-contract-exp-${dossier.id}`,
        type: 'CONTRACT_EXPIRED',
        severity: 'CRITICAL',
        title: `Contrato Vencido: ${contractNum}`,
        message: `El contrato de ${supplierName} finalizó el ${dossier.contractInfo.endDate} (hace ${overdue} días). Inhabilitado para facturación y compras.`,
        dossierId: dossier.id,
        supplierName,
        fileNumber,
        daysOverdue: overdue,
        date: dossier.contractInfo.endDate,
        createdAt: now,
        actionView: 'revisores',
      });
    } else if (contractVal.status === 'POR_VENCER') {
      alerts.push({
        id: `alert-contract-soon-${dossier.id}`,
        type: 'CONTRACT_EXPIRING',
        severity: 'WARNING',
        title: `Contrato por Vencer: ${contractNum}`,
        message: contractVal.daysRemaining === 0
          ? `El contrato de ${supplierName} vence HOY (${dossier.contractInfo.endDate}). Tramite la prórroga o renovación urgente.`
          : `El contrato vence en ${contractVal.daysRemaining} día${contractVal.daysRemaining === 1 ? '' : 's'} (${dossier.contractInfo.endDate}). Gestione la adición o prórroga contractual.`,
        dossierId: dossier.id,
        supplierName,
        fileNumber,
        daysRemaining: contractVal.daysRemaining,
        date: dossier.contractInfo.endDate,
        createdAt: now,
        actionView: 'revisores',
      });
    }
  }

  // 3. Check Corrections Needed
  if (dossier.processStatus === 'REQUIERE_CORRECCION') {
    alerts.push({
      id: `alert-correction-${dossier.id}`,
      type: 'CORRECTION_NEEDED',
      severity: 'WARNING',
      title: `Subsanaciones Requeridas`,
      message: `El expediente radicado bajo ${fileNumber} tiene observaciones formuladas por el evaluador que requieren corrección.`,
      dossierId: dossier.id,
      supplierName,
      fileNumber,
      createdAt: now,
      actionView: 'onboarding',
    });
  }

  return alerts;
}

/**
 * Compute system-wide push alerts, filtered by role and current dossier
 */
export function computePushAlerts(
  dossiers: SupplierDossier[],
  role: UserRole,
  currentDossierId?: string
): PushAlertsSummary {
  let targetDossiers: SupplierDossier[] = [];

  if (role === 'PROVEEDOR') {
    // If supplier, only show alerts for their active dossier
    const current = dossiers.find((d) => d.id === currentDossierId);
    targetDossiers = current ? [current] : [];
  } else {
    // If Admin or Reviewer, show alerts for all dossiers
    targetDossiers = dossiers;
  }

  const allAlerts: PushAlert[] = [];
  for (const d of targetDossiers) {
    allAlerts.push(...computeDossierPushAlerts(d));
  }

  // Filter out dismissed alerts
  const dismissedIds = new Set(getDismissedAlertIds());
  const activeAlerts = allAlerts.map((a) => ({
    ...a,
    read: dismissedIds.has(a.id),
  }));

  // Sort: Critical first, then Warning, then Info; unread first
  activeAlerts.sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    const severityScore = { CRITICAL: 3, WARNING: 2, INFO: 1 };
    return severityScore[b.severity] - severityScore[a.severity];
  });

  const criticalCount = activeAlerts.filter((a) => !a.read && a.severity === 'CRITICAL').length;
  const warningCount = activeAlerts.filter((a) => !a.read && a.severity === 'WARNING').length;
  const infoCount = activeAlerts.filter((a) => !a.read && a.severity === 'INFO').length;
  const totalUnread = activeAlerts.filter((a) => !a.read).length;

  return {
    alerts: activeAlerts,
    criticalCount,
    warningCount,
    infoCount,
    totalUnread,
    hasCritical: criticalCount > 0,
    hasExpiringSoon: warningCount > 0,
  };
}

/**
 * Play a delicate, native 2-tone notification sound via Web Audio API (zero external assets)
 */
export function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // First gentle tone (D5 ~ 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second chime tone (A5 ~ 880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    gain2.gain.setValueAtTime(0.1, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.45);
  } catch {}
}

/**
 * Request native browser Push permission
 */
export async function requestBrowserPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

/**
 * Send an OS-level native desktop push notification if permission is granted
 */
export function sendBrowserPushNotification(title: string, body: string, onClick?: () => void) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const notif = new Notification(title, {
      body,
      icon: '/Logo Flota.png',
      badge: '/Logo Flota.png',
      tag: 'sigepro-vencimientos',
    });

    if (onClick) {
      notif.onclick = () => {
        window.focus();
        onClick();
        notif.close();
      };
    }
  } catch {}
}
