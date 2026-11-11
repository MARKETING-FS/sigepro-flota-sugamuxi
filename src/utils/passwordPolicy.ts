/** Política de contraseñas de SIGEPRO (se usa al crear usuarios y al cambiar la clave). */
export const MIN_PASSWORD_LENGTH = 10;

export interface PasswordRule {
  key: string;
  label: string;
  ok: boolean;
}

export const passwordRules = (pw: string): PasswordRule[] => [
  { key: 'len', label: `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`, ok: pw.length >= MIN_PASSWORD_LENGTH },
  { key: 'upper', label: 'Una letra mayúscula', ok: /[A-ZÁÉÍÓÚÑ]/.test(pw) },
  { key: 'lower', label: 'Una letra minúscula', ok: /[a-záéíóúñ]/.test(pw) },
  { key: 'digit', label: 'Un número', ok: /\d/.test(pw) },
  { key: 'special', label: 'Un carácter especial (! @ # $ % & * ...)', ok: /[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ\s]/.test(pw) },
  { key: 'space', label: 'Sin espacios', ok: !/\s/.test(pw) },
];

export const isPasswordValid = (pw: string): boolean => passwordRules(pw).every((r) => r.ok);

/** Contraseña temporal aleatoria que cumple toda la política. */
export const generateStrongPassword = (): string => {
  const pick = (set: string) => {
    const b = new Uint32Array(1);
    crypto.getRandomValues(b);
    return set[b[0] % set.length];
  };
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%&*?';
  const all = upper + lower + digits + special;
  const chars = [pick(upper), pick(upper), pick(lower), pick(lower), pick(digits), pick(digits), pick(special)];
  while (chars.length < 14) chars.push(pick(all));
  // mezclar
  for (let i = chars.length - 1; i > 0; i--) {
    const b = new Uint32Array(1);
    crypto.getRandomValues(b);
    const j = b[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
};
