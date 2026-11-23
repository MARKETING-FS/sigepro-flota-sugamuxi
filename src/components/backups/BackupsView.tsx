import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DatabaseBackup,
  Download,
  RotateCcw,
  Trash2,
  RefreshCw,
  Loader2,
  CalendarClock,
  History,
  Info,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useConfirm } from '../ui/ConfirmDialog';
import { BrandSwoosh } from '../ui/BrandSwoosh';
import { PageHeader, StatusPill, cardCls, heroPrimaryBtn, theadRowCls, tbodyCls, rowCls, rowIconBtn } from '../ui/archive';
import { BACKUP_EVERY_DAYS, BackupKind, BackupRow, backupService, nextBackupAt } from '../../services/backupService';

const TZ = 'America/Bogota';

const KIND_LABEL: Record<BackupKind, string> = {
  automatico: 'Automático',
  manual: 'Manual',
  previo_restauracion: 'Previo a restaurar',
};

const fmtDateTime = (iso: string | Date) =>
  new Date(iso).toLocaleString('es-CO', { timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

const fmtDay = (d: Date) => d.toLocaleDateString('es-CO', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });

const fmtSize = (bytes: number) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/** "hace 4 días", "hoy", "ayer" */
function ago(iso: string, now: Date): string {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  return `hace ${days} días`;
}

const countsLine = (c: Record<string, number>) => {
  const parts: string[] = [];
  const add = (n: number | undefined, one: string, many: string) => {
    if (n !== undefined) parts.push(`${n} ${n === 1 ? one : many}`);
  };
  add(c.suppliers, 'proveedor', 'proveedores');
  add(c.supplier_documents, 'documento', 'documentos');
  add(c.supplier_evaluations, 'evaluación', 'evaluaciones');
  return parts.join(' · ');
};

const CONFIRM_WORD = 'RESTAURAR';

export const BackupsView: React.FC = () => {
  const { showToast, addSystemAuditLog, activeUser } = useApp();
  const { ask, dialog } = useConfirm();

  const [rows, setRows] = useState<BackupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [restoreTarget, setRestoreTarget] = useState<BackupRow | null>(null);
  const [typed, setTyped] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState('');

  const who = activeUser?.email || 'Superadministrador';

  const load = useCallback(async () => {
    setLoading(true);
    const r = await backupService.list();
    if (r.ok) {
      setRows(r.data || []);
      setLoadError('');
    } else {
      setLoadError(r.error || 'No se pudo cargar la lista de respaldos.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const now = useMemo(() => new Date(), [rows]);
  const okRows = rows.filter((r) => r.status === 'ok');
  const lastGood = okRows.find((r) => r.kind === 'automatico' || r.kind === 'manual') || null;
  const lastRow = rows[0];
  const failedSinceLast = lastRow && lastRow.status === 'error' && (!lastGood || new Date(lastRow.createdAt) > new Date(lastGood.createdAt)) ? lastRow : null;
  const next = nextBackupAt(lastGood?.createdAt ?? null, now);
  const elapsedDays = lastGood ? Math.min(BACKUP_EVERY_DAYS, Math.max(0, Math.floor((now.getTime() - new Date(lastGood.createdAt).getTime()) / 86400000))) : 0;

  const audit = (newValue: string, justification: string) =>
    addSystemAuditLog({
      dossierId: 'SISTEMA',
      supplierName: 'Sistema',
      supplierDoc: '',
      fileNumber: '',
      user: who,
      userRole: 'ADMIN',
      action: 'RESPALDO_SISTEMA',
      section: 'Respaldos',
      fieldChanged: 'Respaldo',
      oldValue: '',
      newValue,
      justification,
    });

  const createNow = async () => {
    setCreating(true);
    const r = await backupService.create();
    setCreating(false);
    if (!r.ok) return showToast(r.error || 'No se pudo crear el respaldo.', 'error', 'RESPALDOS');
    audit('Creado', 'Respaldo manual creado desde Respaldos.');
    showToast('Respaldo creado. El anterior se borró: solo se conserva el más reciente.', 'success', 'RESPALDOS');
    void load();
  };

  const download = async (row: BackupRow) => {
    setBusyId(row.id);
    const r = await backupService.get(row.id);
    setBusyId(null);
    if (!r.ok) return showToast(r.error || 'No se pudo descargar el respaldo.', 'error', 'RESPALDOS');
    const day = new Date(row.createdAt).toLocaleDateString('en-CA', { timeZone: TZ });
    const blob = new Blob([JSON.stringify(r.data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respaldo-sigepro-${day}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    audit('Descargado', `Se descargó el respaldo del ${fmtDateTime(row.createdAt)}.`);
  };

  const askDelete = (row: BackupRow) =>
    ask({
      title: row.status === 'error' ? 'Quitar este aviso' : 'Borrar este respaldo',
      message:
        row.status === 'error'
          ? 'Se quita el registro del intento fallido. No afecta a los datos del sistema.'
          : `Se borra el respaldo del ${fmtDateTime(row.createdAt)}. Si es el único, no quedará ninguna copia hasta que se cree la siguiente.`,
      confirmLabel: 'Sí, borrar',
      icon: <Trash2 className="w-6 h-6" />,
      onConfirm: async () => {
        setBusyId(row.id);
        const r = await backupService.remove(row.id);
        setBusyId(null);
        if (!r.ok) return showToast(r.error || 'No se pudo borrar.', 'error', 'RESPALDOS');
        if (row.status === 'ok') audit('Borrado', `Se borró el respaldo del ${fmtDateTime(row.createdAt)}.`);
        showToast('Listo, se borró.', 'success', 'RESPALDOS');
        void load();
      },
    });

  const openRestore = (row: BackupRow) => {
    setTyped('');
    setRestoreError('');
    setRestoreTarget(row);
  };

  const doRestore = async () => {
    if (!restoreTarget || typed.trim().toUpperCase() !== CONFIRM_WORD) return;
    setRestoring(true);
    setRestoreError('');
    const r = await backupService.restore(restoreTarget.id);
    if (!r.ok) {
      setRestoring(false);
      setRestoreError(r.error || 'No se pudo restaurar. No se cambió ningún dato.');
      return;
    }
    audit('Restaurado', `Se restauró el respaldo del ${fmtDateTime(restoreTarget.createdAt)}. El estado anterior quedó guardado como «Previo a restaurar».`);
    showToast('Respaldo restaurado. Se recarga el sistema con los datos restaurados…', 'success', 'RESPALDOS');
    setTimeout(() => window.location.reload(), 1600);
  };

  return (
    <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 pb-8 pt-1">
      {dialog}

      <PageHeader
        icon={DatabaseBackup}
        title="Respaldos"
        subtitle="Copia de seguridad de los datos de SIGEPRO cada 7 días, con borrado automático de la anterior. Solo usted, como superadministrador, ve este módulo."
        actions={
          <button type="button" className={heroPrimaryBtn} onClick={() => void createNow()} disabled={creating}>
            {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            {creating ? 'Creando…' : 'Crear respaldo ahora'}
          </button>
        }
      />

      <div className="mt-6 space-y-5">
        {failedSinceLast && (
          <div role="alert" className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-sm text-red-700 dark:text-red-300">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">El respaldo automático del {fmtDateTime(failedSinceLast.createdAt)} falló.</p>
              <p className="mt-0.5 text-[13px]">
                {failedSinceLast.errorMessage || 'Sin detalle.'} Se vuelve a intentar mañana; mientras tanto puede crearlo a mano con «Crear respaldo ahora».
              </p>
            </div>
          </div>
        )}

        {/* Estado */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <section className={`${cardCls} p-6 lg:col-span-3`}>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2c84c4] dark:text-[#69bdd7]">
              <History className="w-4 h-4" /> Último respaldo
            </div>
            {loading && !lastGood ? (
              <p className="mt-3 text-sm text-[#3a5274] dark:text-slate-400">Cargando…</p>
            ) : lastGood ? (
              <>
                <p className="mt-3 font-display text-2xl sm:text-3xl font-semibold text-[#0b1d3a] dark:text-white leading-tight">{fmtDateTime(lastGood.createdAt)}</p>
                <p className="mt-1 text-sm text-[#3a5274] dark:text-slate-300">
                  {ago(lastGood.createdAt, now)} · {KIND_LABEL[lastGood.kind].toLowerCase()} · {fmtSize(lastGood.sizeBytes)}
                </p>
                <p className="mt-3 text-sm text-[#1c3354] dark:text-slate-200">{countsLine(lastGood.rowCounts)}</p>
              </>
            ) : (
              <p className="mt-3 text-sm text-[#3a5274] dark:text-slate-300">Todavía no hay ningún respaldo. El primero se crea solo en la próxima corrida diaria, o puede crearlo ahora.</p>
            )}
          </section>

          <section className={`${cardCls} p-6 lg:col-span-2`}>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2c84c4] dark:text-[#69bdd7]">
              <CalendarClock className="w-4 h-4" /> Próximo automático
            </div>
            {next ? (
              <>
                <p className="mt-3 font-display text-xl font-semibold text-[#0b1d3a] dark:text-white leading-tight capitalize">{fmtDay(next)}</p>
                <p className="mt-1 text-sm text-[#3a5274] dark:text-slate-300">5:30 a. m., hora de Colombia</p>
                <div className="mt-4" role="img" aria-label={`Han pasado ${elapsedDays} de ${BACKUP_EVERY_DAYS} días desde el último respaldo`}>
                  <div className="flex gap-1.5">
                    {Array.from({ length: BACKUP_EVERY_DAYS }).map((_, i) => (
                      <span key={i} className={`h-2 flex-1 rounded-full ${i < elapsedDays ? 'bg-gradient-to-r from-[#2c84c4] to-[#69bdd7]' : 'bg-black/[0.08] dark:bg-white/15'}`} />
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#6b84a3]">
                    Día {elapsedDays} de {BACKUP_EVERY_DAYS}
                  </p>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-[#3a5274] dark:text-slate-300">Se crea el primero en la próxima corrida diaria (5:30 a. m.).</p>
            )}
          </section>
        </div>

        {/* Lista */}
        <section className={`${cardCls} overflow-hidden`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8eef5] dark:border-slate-800">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#0b1d3a] dark:text-white leading-tight">Respaldos guardados</h2>
              <p className="text-xs text-[#3a5274] dark:text-slate-400">
                {okRows.length} {okRows.length === 1 ? 'respaldo' : 'respaldos'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              aria-label="Actualizar lista"
              title="Actualizar lista"
              className="w-10 h-10 grid place-items-center rounded-xl border border-[#2c84c4]/30 text-[#1d5fa8] dark:text-[#69bdd7] hover:bg-[#2c84c4]/10 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadError ? (
            <div className="p-6 text-sm text-red-700 dark:text-red-300">{loadError}</div>
          ) : loading && rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#3a5274] dark:text-slate-400">Cargando…</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#3a5274] dark:text-slate-400">No hay respaldos guardados.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={theadRowCls}>
                    <th className="py-3 pl-5 pr-3 font-bold">Fecha</th>
                    <th className="py-3 px-3 font-bold">Tipo</th>
                    <th className="py-3 px-3 font-bold">Contenido</th>
                    <th className="py-3 px-3 font-bold">Tamaño</th>
                    <th className="py-3 pl-3 pr-5 text-right font-bold">Acciones</th>
                  </tr>
                </thead>
                <tbody className={tbodyCls}>
                  {rows.map((r) => {
                    const failed = r.status === 'error';
                    const busy = busyId === r.id;
                    return (
                      <tr key={r.id} className={rowCls}>
                        <td className="py-3 pl-5 pr-3">
                          <div className="font-semibold text-[#0b1d3a] dark:text-white">{fmtDateTime(r.createdAt)}</div>
                          <div className="text-xs text-[#3a5274] dark:text-slate-400">{r.createdBy || '—'}</div>
                        </td>
                        <td className="py-3 px-3">
                          {failed ? <StatusPill tone="bad">Falló</StatusPill> : <StatusPill tone={r.kind === 'previo_restauracion' ? 'muted' : r.kind === 'manual' ? 'navy' : 'blue'}>{KIND_LABEL[r.kind]}</StatusPill>}
                        </td>
                        <td className="py-3 px-3 text-[#1c3354] dark:text-slate-200">
                          {failed ? <span className="text-xs text-red-700 dark:text-red-300">{r.errorMessage || 'Sin detalle'}</span> : countsLine(r.rowCounts)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-[#1c3354] dark:text-slate-200">{failed ? '—' : fmtSize(r.sizeBytes)}</td>
                        <td className="py-3 pl-3 pr-5">
                          <div className="flex items-center justify-end gap-2">
                            {!failed && (
                              <>
                                <button type="button" className={rowIconBtn} title="Descargar archivo" aria-label="Descargar archivo" disabled={busy} onClick={() => void download(r)}>
                                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                </button>
                                <button type="button" className={rowIconBtn} title="Restaurar este respaldo" aria-label="Restaurar este respaldo" disabled={busy} onClick={() => openRestore(r)}>
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button type="button" className={rowIconBtn} title="Borrar" aria-label="Borrar" disabled={busy} onClick={() => askDelete(r)}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Cómo funciona */}
        <section className="flex items-start gap-3 rounded-2xl border border-[#2c84c4]/25 bg-[#2c84c4]/10 px-5 py-4 text-[13px] text-[#1d5fa8] dark:text-[#69bdd7]">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <ul className="space-y-1 leading-relaxed">
            <li>Cada día a las 5:30 a. m. el sistema revisa si el último respaldo ya tiene 7 días; si es así, crea uno nuevo y <strong>borra el anterior</strong>. Solo se conserva el más reciente.</li>
            <li>Incluye proveedores, documentos (sus datos), evaluaciones, parámetros, formatos SIG y convocatorias.</li>
            <li>No incluye los archivos PDF, que siguen guardados en su almacén aparte, ni las cuentas de usuario, ni el historial de auditoría: al restaurar, estos no se tocan.</li>
            <li>Antes de restaurar, el estado actual se guarda como «Previo a restaurar», por si necesita volver atrás.</li>
          </ul>
        </section>
      </div>

      {/* Restaurar */}
      {restoreTarget && (
        <div
          className="fixed inset-0 z-50 bg-[#050b1a]/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !restoring) setRestoreTarget(null);
          }}
        >
          <div className="bg-[#f4f8fc] dark:bg-[#0c1426] rounded-[28px] border border-black/10 dark:border-white/10 max-w-lg w-full shadow-2xl overflow-hidden animate-fade-up my-8" role="dialog" aria-modal="true" aria-label="Restaurar respaldo">
            <div className="relative overflow-hidden bg-gradient-brand text-white px-6 py-5 flex items-center justify-between">
              <BrandSwoosh className="absolute -right-10 -bottom-12 w-64 opacity-100" />
              <div className="relative flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-white/15 ring-1 ring-white/30 grid place-items-center">
                  <RotateCcw className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold">Restaurar respaldo</h3>
                  <p className="text-xs text-white/75">{fmtDateTime(restoreTarget.createdAt)}</p>
                </div>
              </div>
              <button type="button" disabled={restoring} onClick={() => setRestoreTarget(null)} aria-label="Cerrar" className="relative w-9 h-9 grid place-items-center rounded-xl text-white/80 hover:text-white hover:bg-white/15 text-xl cursor-pointer disabled:opacity-50">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#1c3354] dark:text-slate-200 leading-relaxed">
                Los proveedores, documentos, evaluaciones, parámetros y formatos <strong>volverán a como estaban en este respaldo</strong> ({countsLine(restoreTarget.rowCounts)}). Todo lo que se haya cambiado después se pierde.
              </p>
              <ul className="text-[13px] text-[#3a5274] dark:text-slate-300 space-y-1 list-disc pl-5">
                <li>Antes de restaurar se guarda el estado de hoy como «Previo a restaurar».</li>
                <li>Los archivos PDF, las cuentas de usuario y la auditoría no se tocan.</li>
                <li>Si algo falla, no se cambia ningún dato.</li>
              </ul>
              <div>
                <label htmlFor="restore-word" className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2c84c4] dark:text-[#69bdd7] mb-2">
                  Para confirmar escriba {CONFIRM_WORD}
                </label>
                <input
                  id="restore-word"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                  disabled={restoring}
                  placeholder={CONFIRM_WORD}
                  className="w-full h-11 px-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.1] dark:border-white/10 text-sm text-[#0b1d3a] dark:text-white placeholder:text-[#6b84a3] focus:outline-none focus:border-[#2c84c4] focus:ring-2 focus:ring-[#2c84c4]/30"
                />
              </div>
              {restoreError && (
                <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-700 dark:text-red-300">
                  {restoreError}
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  disabled={restoring}
                  onClick={() => setRestoreTarget(null)}
                  className="h-11 px-5 rounded-xl border border-[#d9e3ef] dark:border-white/15 bg-white dark:bg-white/5 text-sm font-semibold text-[#1c3354] dark:text-white hover:bg-[#eef5fc] dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void doRestore()}
                  disabled={restoring || typed.trim().toUpperCase() !== CONFIRM_WORD}
                  className="h-11 px-5 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-red-600 to-red-500 shadow-[0_8px_20px_-10px_rgba(220,38,38,0.8)] hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-2"
                >
                  {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  {restoring ? 'Restaurando…' : 'Restaurar ahora'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
