/**
 * Lee una fecha guardada como texto SIN desfase de zona horaria.
 * `new Date('2026-03-15')` se interpreta en UTC y en Colombia (UTC-5) cae el 14 a las 7 p. m.;
 * aquí un AAAA-MM-DD o un dd/mm/aaaa se toman como el día local indicado.
 */
export function parseLocalDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const parts = value.split('/');
  if (parts.length === 3 && parts[2].length === 4) {
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** dd/mm/aaaa para mostrar (acepta AAAA-MM-DD o dd/mm/aaaa); si no se entiende, devuelve el texto tal cual. */
export function displayDate(value?: string | null): string {
  const d = parseLocalDate(value);
  if (!d) return value || '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
