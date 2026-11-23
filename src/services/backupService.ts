import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type BackupKind = 'automatico' | 'manual' | 'previo_restauracion';

export interface BackupRow {
  id: string;
  createdAt: string;
  kind: BackupKind;
  status: 'ok' | 'error';
  createdBy: string | null;
  sizeBytes: number;
  rowCounts: Record<string, number>;
  errorMessage: string | null;
}

export interface BackupResult<T = void> {
  ok: boolean;
  data?: T;
  error?: string;
}

/** Cada cuántos días se crea el respaldo automático (la base de datos lo hace sola; aquí solo se usa para la cuenta regresiva). */
export const BACKUP_EVERY_DAYS = 7;

/** Hora de la tarea programada: 10:30 UTC = 5:30 a. m. en Colombia. */
export const BACKUP_RUN_UTC = { hour: 10, minute: 30 };

// ─── Modo de demostración (sin base de datos): una lista en memoria para poder ver la pantalla ───
let demoRows: BackupRow[] | null = null;
const demoNow = () => new Date().toISOString();
function demo(): BackupRow[] {
  if (!demoRows) {
    demoRows = [
      {
        id: 'demo-1',
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        kind: 'automatico',
        status: 'ok',
        createdBy: 'Programado (cada 7 dias)',
        sizeBytes: 228_000,
        rowCounts: { suppliers: 14, supplier_documents: 146, supplier_evaluations: 9, system_parameters: 1, institutional_forms: 2, convocatorias: 2, evaluation_method_config: 1, convocatoria_postulaciones: 0 },
        errorMessage: null,
      },
    ];
  }
  return demoRows;
}

const fail = (e: unknown): BackupResult<never> => ({
  ok: false,
  error: (e as { message?: string })?.message || 'No se pudo completar la acción.',
});

const toRow = (r: any): BackupRow => ({
  id: r.id,
  createdAt: r.created_at,
  kind: r.kind,
  status: r.status,
  createdBy: r.created_by,
  sizeBytes: Number(r.size_bytes) || 0,
  rowCounts: r.row_counts || {},
  errorMessage: r.error_message,
});

export const backupService = {
  async list(): Promise<BackupResult<BackupRow[]>> {
    if (!isSupabaseConfigured() || !supabase) return { ok: true, data: [...demo()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
    const { data, error } = await supabase.rpc('sigepro_backups_list');
    if (error) return fail(error);
    return { ok: true, data: ((data as any[]) || []).map(toRow) };
  },

  async create(): Promise<BackupResult> {
    if (!isSupabaseConfigured() || !supabase) {
      const rows = demo();
      const copy = rows.find((r) => r.kind === 'automatico') || rows[0];
      demoRows = [
        { id: `demo-${Date.now()}`, createdAt: demoNow(), kind: 'manual', status: 'ok', createdBy: 'Usuario de demostración', sizeBytes: copy?.sizeBytes ?? 200_000, rowCounts: copy?.rowCounts ?? {}, errorMessage: null },
        ...rows.filter((r) => r.kind === 'previo_restauracion'),
      ];
      return { ok: true };
    }
    const { error } = await supabase.rpc('sigepro_backup_create');
    return error ? fail(error) : { ok: true };
  },

  /** Devuelve el contenido completo del respaldo, listo para guardarse como archivo. */
  async get(id: string): Promise<BackupResult<unknown>> {
    if (!isSupabaseConfigured() || !supabase) return { ok: true, data: { sistema: 'SIGEPRO', demo: true } };
    const { data, error } = await supabase.rpc('sigepro_backup_get', { p_id: id });
    return error ? fail(error) : { ok: true, data };
  },

  async remove(id: string): Promise<BackupResult> {
    if (!isSupabaseConfigured() || !supabase) {
      demoRows = demo().filter((r) => r.id !== id);
      return { ok: true };
    }
    const { error } = await supabase.rpc('sigepro_backup_delete', { p_id: id });
    return error ? fail(error) : { ok: true };
  },

  async restore(id: string): Promise<BackupResult> {
    if (!isSupabaseConfigured() || !supabase) return { ok: true };
    const { error } = await supabase.rpc('sigepro_backup_restore', { p_id: id });
    return error ? fail(error) : { ok: true };
  },
};

/** Primera corrida de la tarea programada (a la hora fija) desde `from`. */
export function nextRunAfter(from: Date): Date {
  const run = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), BACKUP_RUN_UTC.hour, BACKUP_RUN_UTC.minute));
  if (run.getTime() < from.getTime()) run.setUTCDate(run.getUTCDate() + 1);
  return run;
}

/** Cuándo se crea el próximo respaldo automático: la primera corrida diaria desde que el último cumple 7 días (con una hora de margen). */
export function nextBackupAt(lastCreatedAt: string | null, now: Date = new Date()): Date | null {
  if (!lastCreatedAt) return null;
  const due = new Date(new Date(lastCreatedAt).getTime() + BACKUP_EVERY_DAYS * 86400000 - 3600000);
  return nextRunAfter(due.getTime() > now.getTime() ? due : now);
}
