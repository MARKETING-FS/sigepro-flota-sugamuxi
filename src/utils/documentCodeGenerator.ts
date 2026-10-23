/**
 * Utilidad para la generación automática inteligente del Código Técnico (Único)
 * de documentos en SIGEPRO basada en las iniciales y palabras clave del nombre.
 */

// Palabras vacías en español que no aportan al nemotécnico
const SPANISH_STOP_WORDS = new Set([
  'DE',
  'DEL',
  'LA',
  'LAS',
  'EL',
  'LOS',
  'Y',
  'E',
  'O',
  'U',
  'EN',
  'POR',
  'PARA',
  'CON',
  'A',
  'AL',
  'UN',
  'UNA',
  'UNOS',
  'UNAS',
  'SU',
  'SUS',
  'SOBRE',
  'ENTRE',
  'SIN',
  'TRAS',
]);

export interface DocumentCodeSuggestions {
  primary: string; // Código sugerido por defecto (iniciales o nemotécnico óptimo)
  initials: string; // Iniciales puras (ej: CRF, RCE, CC, RUT)
  prefixInitials?: string; // Iniciales con prefijo si aplica (ej: CERT_RF, POL_RCE)
  shortSlug: string; // Nemotécnico resumido (ej: CERT_RET_FUENTE)
  fullSlug: string; // Slug completo estandarizado (ej: CERTIFICADO_RETENCIONES_FUENTE)
}

export function generateDocumentCodeSuggestions(rawName: string): DocumentCodeSuggestions {
  if (!rawName || !rawName.trim()) {
    return {
      primary: '',
      initials: '',
      shortSlug: '',
      fullSlug: '',
    };
  }

  // 1. Extraer siglas explícitas entre paréntesis si existían (ej: "(RCE)", "(SST)", "(PESV)", "(RUT)")
  const acronymMatch = rawName.match(/\(([A-Za-z0-9_-]{2,8})\)/);
  const explicitAcronym = acronymMatch ? acronymMatch[1].toUpperCase() : null;

  // 2. Limpiar texto retirando el paréntesis para no duplicar las letras del acrónimo
  const nameWithoutParens = rawName.replace(/\s*\([^)]*\)\s*/g, ' ').trim();

  // 3. Quitar acentos, caracteres especiales y normalizar a mayúsculas
  const normalized = (nameWithoutParens || rawName)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s_-]/g, ' ')
    .trim();

  // 4. Separar palabras
  const allWords = normalized.split(/\s+/).filter(Boolean);
  if (allWords.length === 0) {
    if (explicitAcronym) {
      return {
        primary: explicitAcronym,
        initials: explicitAcronym,
        shortSlug: explicitAcronym,
        fullSlug: explicitAcronym,
      };
    }
    return { primary: '', initials: '', shortSlug: '', fullSlug: '' };
  }

  // Si solo tiene 1 palabra (ej: "RUT", "Contrato", "Factura")
  if (allWords.length === 1 && !explicitAcronym) {
    const single = allWords[0];
    return {
      primary: single,
      initials: single,
      shortSlug: single,
      fullSlug: single,
    };
  }

  // Filtrar palabras vacías
  const meaningfulWords = allWords.filter((w) => !SPANISH_STOP_WORDS.has(w));
  const words = meaningfulWords.length > 0 ? meaningfulWords : allWords;

  // 5. Calcular Iniciales
  const pureInitials = words.map((w) => w[0]).join('');
  let prefixInitials: string | undefined = undefined;
  let primary = explicitAcronym || pureInitials;

  const firstWord = words[0];
  if (words.length >= 3 && (firstWord.startsWith('CERTIF') || firstWord === 'CONSTANCIA')) {
    const rest = words.slice(1).map((w) => w[0]).join('');
    prefixInitials = `CERT_${rest}`;
    if (!explicitAcronym) {
      primary = pureInitials.length <= 4 ? pureInitials : prefixInitials;
    }
  } else if (words.length >= 3 && (firstWord.startsWith('POLIZ') || firstWord === 'SEGURO')) {
    const rest = words.slice(1).map((w) => w[0]).join('');
    prefixInitials = `POL_${rest}`;
    if (!explicitAcronym) {
      primary = pureInitials.length <= 4 ? pureInitials : prefixInitials;
    }
  }

  // 6. Slug corto nemotécnico (ej: "CERT_RET_FUENTE")
  const shortSlug = words
    .slice(0, 3)
    .map((w) => (w.length > 5 ? w.slice(0, 4) : w))
    .join('_');

  // 7. Slug completo estandarizado (ej: "CERTIFICADO_RETENCIONES_FUENTE")
  const fullSlug = words.slice(0, 4).join('_');

  return {
    primary,
    initials: explicitAcronym || pureInitials,
    prefixInitials: prefixInitials && prefixInitials !== primary ? prefixInitials : undefined,
    shortSlug: shortSlug !== primary ? shortSlug : '',
    fullSlug: fullSlug !== primary && fullSlug !== shortSlug ? fullSlug : '',
  };
}
