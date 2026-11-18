/**
 * Reglas de los campos del registro de proveedores.
 * Se usan en el asistente de 4 pasos y en el alta rápida, para que los dos validen exactamente igual.
 * Cada campo dice qué caracteres acepta, cuántos y qué mensaje se muestra cuando algo está mal.
 */

export type SupplierType = 'JURIDICA' | 'NATURAL';

export interface SupplierFormValues {
  email: string;
  phone: string;
  city: string;
  address: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  professionOrTrade: string;
  companyName: string;
  nit: string;
  representativeLegalName: string;
  representativeLegalDocType: string;
  representativeLegalDocNumber: string;
  notes: string;
}

export type FieldName =
  | 'companyName'
  | 'nit'
  | 'representativeLegalName'
  | 'representativeLegalDocNumber'
  | 'fullName'
  | 'documentNumber'
  | 'professionOrTrade'
  | 'email'
  | 'phone'
  | 'city'
  | 'address'
  | 'notes';

export type FieldErrors = Partial<Record<FieldName, string>>;

/** Un proveedor ya registrado, para avisar al momento si el NIT, el documento o el correo se repiten */
export interface ExistingSupplierRef {
  fileNumber?: string;
  name: string;
  document: string;
  email: string;
}

// ---------- utilidades ----------

const clean = (v: string) => v.replace(/\s+/g, ' ').trim();
const digitsOf = (v: string) => v.replace(/\D/g, '');

/** Letras de cualquier idioma (con tildes, ñ, ü) */
const LETTER = /\p{L}/u;

/** Dígito de verificación del NIT según el algoritmo de la DIAN */
export function nitCheckDigit(nitBody: string): number {
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const digits = digitsOf(nitBody).split('').reverse();
  const sum = digits.reduce((acc, d, i) => acc + Number(d) * (weights[i] || 0), 0);
  const r = sum % 11;
  return r > 1 ? 11 - r : r;
}

/** Quita puntos y espacios para comparar documentos sin que importe cómo se escribieron */
export const normalizeDoc = (v: string) => v.replace(/[.\s]/g, '').toLowerCase();

// ---------- qué se puede escribir en cada campo ----------

const ALLOWED: Record<FieldName, RegExp | null> = {
  // Razón social: letras, números y los signos normales de una empresa (S.A.S., &, guion, paréntesis)
  companyName: /[^\p{L}\p{N} .,&'’"\-/()]/gu,
  nit: /[^\d.\-\s]/g,
  // Nombres de personas: solo letras, espacio, punto, apóstrofo y guion
  representativeLegalName: /[^\p{L} .'’\-]/gu,
  representativeLegalDocNumber: null, // depende del tipo de documento
  fullName: /[^\p{L} .'’\-]/gu,
  documentNumber: null, // depende del tipo de documento
  professionOrTrade: /[^\p{L} .,/&()'’\-]/gu,
  email: /[\s,;:]/g,
  phone: /[^\d\s()+\-/,.;]/g,
  city: /[^\p{L} .,'’\-]/gu,
  address: /[^\p{L}\p{N} #.,\-°ºª/()'’]/gu,
  notes: null,
};

export const FIELD_LIMITS: Record<FieldName, number> = {
  companyName: 120,
  nit: 14,
  representativeLegalName: 80,
  representativeLegalDocNumber: 15,
  fullName: 80,
  documentNumber: 15,
  professionOrTrade: 80,
  email: 100,
  phone: 60,
  city: 60,
  address: 120,
  notes: 500,
};

/** Qué teclado mostrar en el celular */
export const FIELD_INPUT_MODE: Partial<Record<FieldName, 'numeric' | 'tel' | 'email' | 'text'>> = {
  nit: 'numeric',
  phone: 'tel',
  email: 'email',
};

const NUMERIC_DOC_TYPES = ['CC', 'CE', 'TI', 'NIT', 'RC'];

const isNumericDocType = (type: string) => NUMERIC_DOC_TYPES.includes((type || '').toUpperCase());

/** Mensaje cuando alguien intenta escribir un carácter que ese campo no acepta */
const REJECT_MESSAGE: Record<FieldName, string> = {
  companyName: 'Ese carácter no se permite en la razón social.',
  nit: 'El NIT solo lleva números y un guion antes del dígito de verificación.',
  representativeLegalName: 'El nombre solo lleva letras (sin números ni símbolos).',
  representativeLegalDocNumber: 'El documento solo lleva números.',
  fullName: 'El nombre solo lleva letras (sin números ni símbolos).',
  documentNumber: 'El documento solo lleva números.',
  professionOrTrade: 'La profesión solo lleva letras.',
  email: 'El correo no lleva espacios ni comas.',
  phone: 'El teléfono solo lleva números.',
  city: 'La ciudad solo lleva letras.',
  address: 'Ese carácter no se permite en la dirección.',
  notes: '',
};

export interface SanitizeResult {
  value: string;
  /** Si se quitó algo que la persona escribió; sirve para avisarle en rojo en el momento */
  rejected: string;
}

/**
 * Limpia lo que se escribe mientras se escribe. Lo que sobra se quita y se devuelve un aviso.
 * Los puntos y espacios de un documento numérico se quitan sin avisar (40.045.678 → 40045678).
 */
export function sanitizeField(name: FieldName, raw: string, ctx: { docType?: string } = {}): SanitizeResult {
  let value = raw;

  if (name === 'documentNumber' || name === 'representativeLegalDocNumber') {
    const numeric = isNumericDocType(ctx.docType || 'CC');
    if (numeric) {
      const stripped = value.replace(/[.\s]/g, '');
      const bad = /\D/.test(stripped);
      value = stripped.replace(/\D/g, '');
      return { value: value.slice(0, 12), rejected: bad ? REJECT_MESSAGE[name] : '' };
    }
    const stripped = value.replace(/\s/g, '');
    const bad = /[^A-Za-z0-9]/.test(stripped);
    value = stripped.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return { value: value.slice(0, 15), rejected: bad ? 'El pasaporte solo lleva letras y números.' : '' };
  }

  if (name === 'nit') {
    const bad = /[^\d.\-\s]/.test(value);
    value = value.replace(/[^\d.\-]/g, '');
    // Un solo guion y un solo dígito después de él (el de verificación)
    const hyphen = value.indexOf('-');
    if (hyphen >= 0) {
      const body = value.slice(0, hyphen).replace(/[.-]/g, '');
      const dv = value.slice(hyphen + 1).replace(/\D/g, '').slice(0, 1);
      value = `${body.slice(0, 10)}-${dv}`;
    } else {
      value = value.replace(/-/g, '');
      if (digitsOf(value).length > 10) value = value.replace(/\D/g, '').slice(0, 10);
    }
    return { value, rejected: bad ? REJECT_MESSAGE.nit : '' };
  }

  if (name === 'email') {
    const bad = /[\s,;:]/.test(value);
    value = value.replace(/[\s,;:]/g, '').toLowerCase();
    return { value: value.slice(0, FIELD_LIMITS.email), rejected: bad ? REJECT_MESSAGE.email : '' };
  }

  const rx = ALLOWED[name];
  if (rx) {
    const bad = new RegExp(rx.source, rx.flags.replace('g', '')).test(value);
    value = value.replace(rx, '');
    // Sin espacios dobles ni al comienzo mientras se escribe
    value = value.replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
    return { value: value.slice(0, FIELD_LIMITS[name]), rejected: bad ? REJECT_MESSAGE[name] : '' };
  }

  return { value: value.slice(0, FIELD_LIMITS[name]), rejected: '' };
}

// ---------- validación de cada campo ----------

const REQUIRED_MSG: Record<FieldName, string> = {
  companyName: 'Escriba la razón social de la empresa.',
  nit: 'Escriba el NIT con su dígito de verificación (ej. 900892410-8).',
  representativeLegalName: 'Escriba el nombre del representante legal.',
  representativeLegalDocNumber: '',
  fullName: 'Escriba el nombre completo de la persona.',
  documentNumber: 'Escriba el número de documento.',
  professionOrTrade: '',
  email: 'Escriba el correo electrónico.',
  phone: 'Escriba un teléfono de contacto.',
  city: 'Escriba la ciudad o municipio.',
  address: '',
  notes: '',
};

const docNumberError = (value: string, type: string, who: string): string => {
  const t = (type || 'CC').toUpperCase();
  value = value.replace(/[.\s]/g, '');
  if (isNumericDocType(t)) {
    if (/\D/.test(value)) return `El documento ${who ? who + ' ' : ''}solo lleva números.`;
    const len = value.length;
    const [min, max] = t === 'CE' ? [5, 10] : t === 'TI' ? [6, 11] : [6, 10];
    if (len < min || len > max) {
      const label = t === 'CC' ? 'La cédula' : t === 'CE' ? 'La cédula de extranjería' : `El documento (${t})`;
      return `${label} ${who} debe tener entre ${min} y ${max} números (lleva ${len}).`;
    }
    return '';
  }
  if (value.length < 5 || value.length > 15) return `El pasaporte ${who} debe tener entre 5 y 15 letras o números.`;
  return '';
};

const personNameError = (value: string, what: string): string => {
  const v = clean(value);
  if (!v) return '';
  const words = v.split(' ').filter((w) => LETTER.test(w));
  if (v.length < 5 || words.length < 2) return `Escriba ${what} completo: nombre y apellido.`;
  if (words.some((w) => w.replace(/[^\p{L}]/gu, '').length < 2 && !/^[A-ZÁÉÍÓÚÑ]\.?$/u.test(w))) {
    return 'Cada nombre o apellido debe tener al menos 2 letras.';
  }
  return '';
};

const phoneError = (value: string): string => {
  const parts = value
    .split(/[\/,;]/)
    .map((p) => digitsOf(p))
    .filter((p) => p.length > 0);
  if (parts.length === 0) return REQUIRED_MSG.phone;
  for (const d of parts) {
    const okMobile = d.length === 10 && d.startsWith('3');
    const okLandline = (d.length === 10 && d.startsWith('60')) || d.length === 7;
    const okCountry = d.length === 12 && d.startsWith('57');
    if (!(okMobile || okLandline || okCountry)) {
      if (d.length < 7) return `El teléfono ${d} es muy corto: un celular tiene 10 números y un fijo 7.`;
      if (d.length > 12) return `El teléfono ${d} es muy largo.`;
      if (d.length === 10) return `El número ${d} no es válido: un celular empieza por 3 (310 555 6789) y un fijo por 60 (608 770 1234).`;
      return `El teléfono ${d} no es válido: use un celular de 10 números (310 555 6789) o un fijo de 7 números o con indicativo (608 770 1234).`;
    }
  }
  return '';
};

const emailError = (value: string): string => {
  const v = value.trim();
  if (!v) return REQUIRED_MSG.email;
  if (!v.includes('@')) return 'Al correo le falta el @ (ej. comercial@empresa.com).';
  const [local, domain, ...rest] = v.split('@');
  if (rest.length > 0) return 'El correo solo puede tener un @.';
  if (!local) return 'Escriba lo que va antes del @ (ej. comercial@empresa.com).';
  if (!domain) return 'Escriba lo que va después del @ (ej. comercial@empresa.com).';
  if (!domain.includes('.')) return 'Al dominio le falta el punto (ej. empresa.com).';
  if (!/^[a-z0-9._%+\-]+$/.test(local) || local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return 'Lo que va antes del @ solo lleva letras, números y . _ - +';
  }
  if (!/^[a-z0-9\-]+(\.[a-z0-9\-]+)+$/.test(domain) || /(^|\.)-|-(\.|$)/.test(domain) || domain.includes('..')) {
    return 'El dominio del correo no es válido (ej. empresa.com).';
  }
  if (!/\.[a-z]{2,}$/.test(domain)) return 'El final del correo no es válido (ej. .com, .co, .com.co).';
  return '';
};

const nitError = (value: string): string => {
  const v = value.trim();
  if (!v) return REQUIRED_MSG.nit;
  if (!v.includes('-')) {
    const n = digitsOf(v).length;
    return n >= 6
      ? 'Falta el dígito de verificación: escriba el NIT con guion (ej. 900892410-8).'
      : 'El NIT es muy corto: debe tener entre 6 y 10 números antes del guion.';
  }
  const [bodyRaw, dvRaw] = v.split('-');
  const body = digitsOf(bodyRaw);
  if (body.length < 6 || body.length > 10) return `El NIT debe tener entre 6 y 10 números antes del guion (lleva ${body.length}).`;
  if (!dvRaw) return `Falta el dígito de verificación después del guion (debería ser ${nitCheckDigit(body)}).`;
  const expected = nitCheckDigit(body);
  if (Number(dvRaw) !== expected) {
    return `El dígito de verificación no corresponde: para ${body} debería ser ${expected}, no ${dvRaw}.`;
  }
  return '';
};

const cityError = (value: string): string => {
  const v = clean(value);
  if (!v) return REQUIRED_MSG.city;
  if (v.replace(/[^\p{L}]/gu, '').length < 3) return 'La ciudad debe tener al menos 3 letras.';
  return '';
};

const addressError = (value: string): string => {
  const v = clean(value);
  if (!v) return '';
  if (v.length < 5) return 'La dirección es muy corta (ej. Carrera 11 # 24-80).';
  if (!LETTER.test(v)) return 'La dirección debe incluir letras (ej. Carrera 11 # 24-80).';
  return '';
};

export interface ValidationContext {
  supplierType: SupplierType;
  existing?: ExistingSupplierRef[];
}

/** Valida un solo campo. Devuelve el mensaje de error o '' si está bien. */
export function validateField(name: FieldName, values: SupplierFormValues, ctx: ValidationContext): string {
  const existing = ctx.existing || [];
  const isJuridica = ctx.supplierType === 'JURIDICA';

  switch (name) {
    case 'companyName': {
      if (!isJuridica) return '';
      const v = clean(values.companyName);
      if (!v) return REQUIRED_MSG.companyName;
      if (v.length < 3) return 'La razón social debe tener al menos 3 caracteres.';
      if (!LETTER.test(v)) return 'La razón social debe incluir letras, no solo números.';
      return '';
    }
    case 'nit': {
      if (!isJuridica) return '';
      const err = nitError(values.nit);
      if (err) return err;
      const mine = normalizeDoc(values.nit);
      const dup = existing.find((e) => normalizeDoc(e.document) === mine);
      if (dup) return `Ya existe un proveedor con este NIT: ${dup.name}${dup.fileNumber ? ` (${dup.fileNumber})` : ''}.`;
      return '';
    }
    case 'representativeLegalName': {
      if (!isJuridica) return '';
      if (!clean(values.representativeLegalName)) return REQUIRED_MSG.representativeLegalName;
      return personNameError(values.representativeLegalName, 'el nombre del representante');
    }
    case 'representativeLegalDocNumber': {
      if (!isJuridica || !values.representativeLegalDocNumber) return '';
      return docNumberError(values.representativeLegalDocNumber, values.representativeLegalDocType, 'del representante');
    }
    case 'fullName': {
      if (isJuridica) return '';
      if (!clean(values.fullName)) return REQUIRED_MSG.fullName;
      return personNameError(values.fullName, 'el nombre');
    }
    case 'documentNumber': {
      if (isJuridica) return '';
      if (!values.documentNumber) return REQUIRED_MSG.documentNumber;
      const err = docNumberError(values.documentNumber, values.documentType, '');
      if (err) return err.replace('  ', ' ');
      const mine = normalizeDoc(values.documentNumber);
      const dup = existing.find((e) => normalizeDoc(e.document) === mine);
      if (dup) return `Ya existe un proveedor con este documento: ${dup.name}${dup.fileNumber ? ` (${dup.fileNumber})` : ''}.`;
      return '';
    }
    case 'professionOrTrade': {
      if (isJuridica) return '';
      const v = clean(values.professionOrTrade);
      if (!v) return '';
      if (v.replace(/[^\p{L}]/gu, '').length < 3) return 'La profesión debe tener al menos 3 letras.';
      return '';
    }
    case 'email': {
      const err = emailError(values.email);
      if (err) return err;
      const mine = values.email.trim().toLowerCase();
      const dup = existing.find((e) => (e.email || '').trim().toLowerCase() === mine);
      if (dup) return `Ya existe un proveedor con este correo: ${dup.name}${dup.fileNumber ? ` (${dup.fileNumber})` : ''}.`;
      return '';
    }
    case 'phone':
      return phoneError(values.phone);
    case 'city':
      return cityError(values.city);
    case 'address':
      return addressError(values.address);
    case 'notes':
      return values.notes.length > FIELD_LIMITS.notes ? `Máximo ${FIELD_LIMITS.notes} caracteres.` : '';
  }
}

export const ALL_FIELDS: FieldName[] = [
  'companyName',
  'nit',
  'representativeLegalName',
  'representativeLegalDocNumber',
  'fullName',
  'documentNumber',
  'professionOrTrade',
  'email',
  'phone',
  'city',
  'address',
  'notes',
];

/** Valida todo el formulario y devuelve solo los campos con error */
export function validateSupplierForm(values: SupplierFormValues, ctx: ValidationContext): FieldErrors {
  const out: FieldErrors = {};
  for (const f of ALL_FIELDS) {
    const msg = validateField(f, values, ctx);
    if (msg) out[f] = msg;
  }
  return out;
}

/** Campos de cada paso del asistente */
export function fieldsOfStep(step: number, supplierType: SupplierType): FieldName[] {
  if (step === 2) {
    return supplierType === 'JURIDICA'
      ? ['companyName', 'nit', 'representativeLegalName', 'representativeLegalDocNumber']
      : ['fullName', 'documentNumber', 'professionOrTrade'];
  }
  if (step === 3) return ['email', 'phone', 'city', 'address'];
  if (step === 4) return ['notes'];
  return [];
}

/** Deja los datos ordenados antes de guardarlos: sin puntos en documentos, correo en minúsculas, sin espacios de más */
export function normalizeSupplierValues<T extends SupplierFormValues>(values: T): T {
  return {
    ...values,
    email: values.email.trim().toLowerCase(),
    phone: clean(values.phone),
    city: clean(values.city),
    address: clean(values.address),
    fullName: clean(values.fullName),
    documentNumber: values.documentNumber.replace(/[.\s]/g, ''),
    professionOrTrade: clean(values.professionOrTrade),
    companyName: clean(values.companyName),
    nit: values.nit.replace(/[.\s]/g, ''),
    representativeLegalName: clean(values.representativeLegalName),
    representativeLegalDocNumber: values.representativeLegalDocNumber.replace(/[.\s]/g, ''),
    notes: values.notes.trim(),
  };
}
