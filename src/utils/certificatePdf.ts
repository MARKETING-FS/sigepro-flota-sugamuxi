/**
 * Certificado de proveedor habilitado (PDF, hoja A4 horizontal).
 * Se dibuja directamente con jsPDF (texto vectorial, pesa poco) y la librería se carga solo al descargar.
 */

export interface CertificateDoc {
  name: string;
  /** AAAA-MM-DD */
  expirationDate?: string;
}

export interface CertificateInput {
  companyName: string;
  companyNit: string;
  supplierName: string;
  /** 'NIT' o 'C.C.' */
  supplierDocLabel: string;
  supplierDoc: string;
  personType: string;
  category: string;
  /** 'A' | 'B' | 'C' */
  tier?: string;
  fileNumber: string;
  dossierId: string;
  docs: CertificateDoc[];
  issuedAt?: Date;
  /** Logo en data URL (PNG) */
  logoDataUrl?: string;
}

const NAVY: [number, number, number] = [11, 29, 58];
const BLUE: [number, number, number] = [44, 132, 196];
const CYAN: [number, number, number] = [105, 189, 215];
const INK: [number, number, number] = [58, 82, 116];
const MUTED: [number, number, number] = [112, 130, 154];
const PALE: [number, number, number] = [244, 248, 252];
const HAIR: [number, number, number] = [213, 224, 236];

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const parseISO = (s?: string): Date | null => {
  if (!s) return null;
  const p = s.split('-');
  if (p.length < 3) return null;
  const d = new Date(+p[0], +p[1] - 1, +p[2]);
  return isNaN(d.getTime()) ? null : d;
};

export const formatLongDate = (d: Date) => `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
const formatShortDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

/** Hasta cuándo vale el certificado: un año, o antes si algún documento vence antes. */
export function certificateValidity(docs: CertificateDoc[], issuedAt: Date) {
  const oneYear = new Date(issuedAt);
  oneYear.setFullYear(oneYear.getFullYear() + 1);
  let until = oneYear;
  let limitedBy: string | null = null;
  docs.forEach((d) => {
    const e = parseISO(d.expirationDate);
    if (e && e.getTime() >= issuedAt.getTime() && e.getTime() < until.getTime()) {
      until = e;
      limitedBy = d.name;
    }
  });
  return { until, limitedBy };
}

/** Código corto de control (no es una firma digital: sirve para identificar esta emisión). */
function controlCode(seed: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x1b873593;
  for (let i = 0; i < seed.length; i++) {
    h1 = Math.imul(h1 ^ seed.charCodeAt(i), 16777619) >>> 0;
    h2 = Math.imul(h2 ^ seed.charCodeAt(i), 2246822519) >>> 0;
  }
  const hex = (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

export const certificateNumber = (fileNumber: string) => fileNumber.replace(/^FS-PROV-/, 'CH-');

export const certificateFileName = (supplierName: string, fileNumber: string) =>
  `Certificado_${certificateNumber(fileNumber)}_${supplierName.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40)}.pdf`;

export async function buildCertificatePdf(input: CertificateInput): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4', compress: true });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const issuedAt = input.issuedAt ?? new Date();
  const { until, limitedBy } = certificateValidity(input.docs, issuedAt);
  const certNo = certificateNumber(input.fileNumber);
  const code = controlCode(`${input.dossierId}|${input.fileNumber}|${formatShortDate(issuedAt)}|${input.docs.length}`);

  const L = 48;
  const R = W - 48;
  const CX = W / 2;

  const color = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
  const text = (
    s: string,
    x: number,
    y: number,
    o: { font?: string; style?: string; size?: number; c?: [number, number, number]; align?: 'left' | 'center' | 'right'; space?: number } = {}
  ) => {
    doc.setFont(o.font || 'helvetica', o.style || 'normal');
    doc.setFontSize(o.size || 10);
    color(o.c || INK);
    doc.text(s, x, y, { align: o.align || 'left', charSpace: o.space || 0 });
  };

  // ---------- Marco ----------
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(1.4);
  doc.rect(18, 18, W - 36, H - 36);
  doc.setDrawColor(...CYAN);
  doc.setLineWidth(0.5);
  doc.rect(24, 24, W - 48, H - 48);

  // ---------- Encabezado ----------
  if (input.logoDataUrl) {
    doc.addImage(input.logoDataUrl, 'PNG', L, 44, 66, 48.5);
  }
  text(input.companyName.toUpperCase(), L + 80, 62, { style: 'bold', size: 13, c: NAVY });
  text(`NIT ${input.companyNit}`, L + 80, 76, { size: 8.5, c: MUTED });
  text('Sistema Integrado de Gestión · Homologación de proveedores', L + 80, 88, { size: 8.5, c: MUTED });

  text('CERTIFICADO N.º', R, 58, { size: 6.5, c: MUTED, align: 'right', space: 1.2 });
  text(certNo, R, 73, { font: 'courier', style: 'bold', size: 13, c: NAVY, align: 'right' });
  text(`Radicado ${input.fileNumber}`, R, 86, { size: 8, c: MUTED, align: 'right' });

  doc.setDrawColor(...NAVY);
  doc.setLineWidth(1.2);
  doc.line(L, 104, R, 104);
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(3);
  doc.line(L, 104, L + 92, 104);

  // ---------- Título ----------
  text('CERTIFICADO DE PROVEEDOR HABILITADO', CX, 146, { font: 'times', style: 'bold', size: 25, c: NAVY, align: 'center', space: 0.6 });
  text('FLOTA SUGAMUXI S.A. CERTIFICA QUE', CX, 172, { size: 8, c: BLUE, align: 'center', space: 2.2, style: 'bold' });

  // ---------- Proveedor ----------
  let nameSize = 30;
  doc.setFont('times', 'bold');
  do {
    doc.setFontSize(nameSize);
    if (doc.getTextWidth(input.supplierName) <= 660) break;
    nameSize -= 1;
  } while (nameSize > 15);
  let nameLines = [input.supplierName];
  if (doc.getTextWidth(input.supplierName) > 660) {
    doc.setFontSize(16);
    nameLines = doc.splitTextToSize(input.supplierName, 660).slice(0, 2);
    nameSize = 16;
  }
  const nameY = nameLines.length > 1 ? 208 : 214;
  nameLines.forEach((ln: string, i: number) => text(ln, CX, nameY + i * 19, { font: 'times', style: 'bold', size: nameSize, c: NAVY, align: 'center' }));
  const idY = nameY + (nameLines.length - 1) * 19 + 20;
  text(`${input.supplierDocLabel} ${input.supplierDoc}  ·  ${input.personType}`, CX, idY, { size: 10, c: INK, align: 'center' });

  doc.setDrawColor(...CYAN);
  doc.setLineWidth(0.8);
  doc.line(CX - 36, idY + 12, CX + 36, idY + 12);

  const body = doc.splitTextToSize(
    `Ha presentado y obtenido la aprobación de la totalidad de los documentos exigidos en el proceso de homologación para la categoría «${input.category}», y se encuentra habilitado para contratar con la compañía.`,
    560
  ) as string[];
  const bodyY = idY + 32;
  body.forEach((ln, i) => text(ln, CX, bodyY + i * 14.5, { size: 10.5, c: INK, align: 'center' }));

  // ---------- Estado ----------
  const pillY = bodyY + body.length * 14.5 + 4;
  const pillW = 188;
  doc.setFillColor(...NAVY);
  doc.roundedRect(CX - pillW / 2, pillY, pillW, 21, 10.5, 10.5, 'F');
  const pillText = 'HABILITADO · VIGENTE';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  const pillTextW = doc.getTextWidth(pillText) + pillText.length * 1.3;
  const groupStart = CX - (pillTextW + 14) / 2;
  doc.setFillColor(...CYAN);
  doc.circle(groupStart + 3.2, pillY + 10.5, 3.2, 'F');
  text(pillText, groupStart + 14, pillY + 14, { style: 'bold', size: 9.5, c: [255, 255, 255], space: 1.3 });

  // ---------- Datos ----------
  const stripY = pillY + 36;
  const stripH = 42;
  doc.setFillColor(...PALE);
  doc.setDrawColor(...HAIR);
  doc.setLineWidth(0.6);
  doc.roundedRect(L, stripY, R - L, stripH, 6, 6, 'FD');
  const tierLabel = input.tier ? `Tipo ${input.tier} · ${input.tier === 'A' ? 'Crítico' : input.tier === 'B' ? 'Operativo' : 'Estándar'}` : '—';
  const cells: Array<{ label: string; value: string; sub?: string }> = [
    { label: 'FECHA DE EMISIÓN', value: formatLongDate(issuedAt) },
    {
      label: 'VIGENTE HASTA',
      value: formatLongDate(until),
      sub: limitedBy ? `Vence: ${limitedBy}`.slice(0, 44) : undefined,
    },
    { label: 'CLASIFICACIÓN', value: tierLabel },
    { label: 'DOCUMENTOS APROBADOS', value: `${input.docs.length} de ${input.docs.length}` },
  ];
  const cw = (R - L) / cells.length;
  cells.forEach((c, i) => {
    const x = L + i * cw;
    if (i > 0) {
      doc.setDrawColor(...HAIR);
      doc.line(x, stripY + 8, x, stripY + stripH - 8);
    }
    text(c.label, x + cw / 2, stripY + 14, { size: 6.3, c: MUTED, align: 'center', space: 1.1 });
    text(c.value, x + cw / 2, stripY + 28, { style: 'bold', size: 11, c: NAVY, align: 'center' });
    if (c.sub) text(c.sub, x + cw / 2, stripY + 37, { size: 6.5, c: MUTED, align: 'center' });
  });

  // ---------- Documentos verificados ----------
  const listTitleY = stripY + stripH + 22;
  text('DOCUMENTOS VERIFICADOS', L, listTitleY, { style: 'bold', size: 7, c: BLUE, space: 1.6 });
  doc.setDrawColor(...HAIR);
  doc.setLineWidth(0.6);
  doc.line(L + 128, listTitleY - 2.5, R, listTitleY - 2.5);

  const maxShow = 18;
  const shown = input.docs.slice(0, input.docs.length > maxShow ? maxShow - 1 : maxShow);
  const extra = input.docs.length - shown.length;
  const cols = shown.length > 12 ? 3 : 2;
  const rows = Math.ceil((shown.length + (extra > 0 ? 1 : 0)) / cols);
  const colW = (R - L) / cols;
  const rowH = 12.5;
  const listY = listTitleY + 15;
  const items: Array<CertificateDoc | null> = [...shown, ...(extra > 0 ? [null] : [])];
  items.forEach((d, i) => {
    const col = Math.floor(i / rows);
    const row = i % rows;
    const x = L + col * colW;
    const y = listY + row * rowH;
    if (!d) {
      text(`+ ${extra} documentos más en el expediente`, x + 14, y, { size: 8, c: MUTED, style: 'italic' });
      return;
    }
    // marca de verificación dibujada
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(1.3);
    doc.line(x + 1.5, y - 3.2, x + 4, y - 0.8);
    doc.line(x + 4, y - 0.8, x + 8.5, y - 6);
    const exp = parseISO(d.expirationDate);
    const right = exp ? `vence ${formatShortDate(exp)}` : '';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.3);
    const rightW = right ? (doc.setFontSize(6.8), doc.getTextWidth(right) + 6) : 0;
    doc.setFontSize(8.3);
    const maxW = colW - 22 - rightW - 10;
    let name = d.name;
    if (doc.getTextWidth(name) > maxW) {
      while (doc.getTextWidth(name + '…') > maxW && name.length > 4) name = name.slice(0, -1);
      name = name.trimEnd() + '…';
    }
    text(name, x + 14, y, { size: 8.3, c: NAVY });
    if (right) text(right, x + colW - 14, y, { size: 6.8, c: MUTED, align: 'right' });
  });

  // ---------- Sello y firmas ----------
  const sealY = H - 92;
  const lineY = H - 78;
  // sello
  doc.setFillColor(...NAVY);
  doc.circle(CX, sealY, 27, 'F');
  doc.setDrawColor(...CYAN);
  doc.setLineWidth(1);
  doc.circle(CX, sealY, 23, 'S');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(3);
  doc.line(CX - 9, sealY + 0.5, CX - 3, sealY + 6.5);
  doc.line(CX - 3, sealY + 6.5, CX + 9.5, sealY - 8);

  const sig = (cx: number, title: string, sub: string) => {
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.8);
    doc.line(cx - 90, lineY, cx + 90, lineY);
    text(title, cx, lineY + 11, { style: 'bold', size: 8.5, c: NAVY, align: 'center' });
    text(sub, cx, lineY + 21, { size: 7.5, c: MUTED, align: 'center' });
  };
  sig(L + 130, 'Coordinación SIG / Calidad', input.companyName);
  sig(R - 130, 'Dirección de Compras y Suministros', input.companyName);

  // ---------- Pie ----------
  text(
    `Código de control ${code}  ·  Emitido por SIGEPRO el ${formatShortDate(issuedAt)}. Válido mientras el proveedor se mantenga Habilitado.`,
    L,
    H - 31,
    { size: 6.5, c: MUTED }
  );
  text('Información protegida por la Ley 1581 de 2012 (Habeas Data).', R, H - 31, { size: 6.5, c: MUTED, align: 'right' });

  doc.setProperties({
    title: `Certificado de proveedor habilitado ${certNo}`,
    subject: input.supplierName,
    author: input.companyName,
    creator: 'SIGEPRO',
  });

  return doc.output('blob');
}

/** Descarga el blob como archivo. */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const imageCache = new Map<string, Promise<string | undefined>>();

/**
 * Lee una imagen pública y la devuelve como data URL (para incrustarla en el PDF).
 * La imagen se reduce a `maxWidth` píxeles: jsPDF vuelve a comprimir cada imagen al armar el PDF y con
 * el logo original (2380 px) eso bloqueaba la pantalla cerca de 2 segundos. Queda en memoria para no repetirlo.
 */
export function imageToDataUrl(path: string, maxWidth = 420): Promise<string | undefined> {
  const key = `${path}@${maxWidth}`;
  let cached = imageCache.get(key);
  if (!cached) {
    cached = loadScaledImage(path, maxWidth);
    imageCache.set(key, cached);
  }
  return cached;
}

async function loadScaledImage(path: string, maxWidth: number): Promise<string | undefined> {
  try {
    const res = await fetch(path);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    const original = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = original;
      });
      if (img.width <= maxWidth) return original;
      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = Math.round((img.height * maxWidth) / img.width);
      const ctx = canvas.getContext('2d');
      if (!ctx) return original;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    } catch {
      return original;
    }
  } catch {
    return undefined;
  }
}

/** Calienta lo que más tarda (la librería de PDF y el logo) para que el primer PDF abra rápido. */
export function preloadPdfTools(): void {
  const run = () => {
    void import('jspdf').catch(() => undefined);
    void imageToDataUrl('/logo-flota.png');
  };
  const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
  if (idle) idle(run);
  else window.setTimeout(run, 1200);
}
