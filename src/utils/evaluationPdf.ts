/**
 * Formato FS.GA-DOC-006 v6.0 (Evaluación de criterios de selección de proveedores y clientes) en PDF,
 * hoja carta vertical de dos páginas, con la misma distribución del formato oficial y los datos de la
 * evaluación ya diligenciados. Se dibuja con jsPDF y la librería se carga solo al generar el archivo.
 */
import {
  DOC006_AREA,
  DOC006_CODE,
  DOC006_CRITERIA,
  DOC006_DATE,
  DOC006_FOOTER,
  DOC006_MAX_SCORE,
  doc006PassingFor,
  DOC006_TITLE,
  DOC006_VERSION,
} from '../data/evaluationDoc006';

export interface EvaluationPdfInput {
  /** Fecha de la evaluación (dd/mm/aaaa o AAAA-MM-DD). */
  date: string;
  isNatural: boolean;
  supplierName: string;
  /** NIT o cédula, según el tipo de persona. */
  supplierDoc: string;
  address: string;
  city: string;
  /** Puntos obtenidos por criterio, en el orden del formato (I a VI). */
  scores: number[];
  /** Observación por criterio, en el mismo orden. */
  notes: string[];
  /** Partes adicionales que la administración agregó a la evaluación inicial (van en una hoja aparte). */
  extras?: { name: string; points: number; max: number; notes: string }[];
  conclusions: string;
  evaluatorName: string;
  evaluatorPosition: string;
  /** Logo en data URL (PNG). */
  logoDataUrl?: string;
  /** Firma del evaluador en data URL (PNG transparente). Si no hay, el recuadro queda en blanco para firmar a mano. */
  signatureDataUrl?: string;
}

type RGB = [number, number, number];
const BLACK: RGB = [20, 20, 20];
const GRAY_LINE: RGB = [120, 120, 120];
const GRAY_FILL: RGB = [191, 191, 191];
const NAVY: RGB = [11, 29, 58];
const BLUE: RGB = [44, 132, 196];
const PALE_BLUE: RGB = [226, 240, 250];

/** dd/mm/aaaa a partir de dd/mm/aaaa o AAAA-MM-DD. */
export function formatEvaluationDate(value: string): string {
  if (!value) return '';
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const parts = value.split('/');
  if (parts.length === 3) return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
  return value;
}

export const evaluationPdfFileName = (supplierName: string) =>
  `Evaluacion_${DOC006_CODE.replace(/\./g, '-')}_${supplierName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40)}.pdf`;

export async function buildEvaluationPdf(input: EvaluationPdfInput): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter', compress: true });
  const W = doc.internal.pageSize.getWidth();
  const L = 56;
  const R = W - 56;
  const TW = R - L;

  const font = (family: 'helvetica' | 'times', style: 'normal' | 'bold' | 'italic' | 'bolditalic', size: number, c: RGB = BLACK) => {
    doc.setFont(family, style);
    doc.setFontSize(size);
    doc.setTextColor(c[0], c[1], c[2]);
  };
  const lineStyle = (w = 0.6, c: RGB = GRAY_LINE) => {
    doc.setLineWidth(w);
    doc.setDrawColor(c[0], c[1], c[2]);
  };
  const box = (x: number, y: number, w: number, h: number, fill?: RGB) => {
    lineStyle();
    if (fill) {
      doc.setFillColor(fill[0], fill[1], fill[2]);
      doc.rect(x, y, w, h, 'FD');
    } else {
      doc.rect(x, y, w, h);
    }
  };
  /** Texto en una sola línea que se achica (y al final se corta) hasta caber en el ancho dado. */
  const fit = (s: string, maxW: number, size: number, minSize = 6.5): { text: string; size: number } => {
    let sz = size;
    doc.setFontSize(sz);
    while (doc.getTextWidth(s) > maxW && sz > minSize) {
      sz -= 0.5;
      doc.setFontSize(sz);
    }
    let out = s;
    while (doc.getTextWidth(out) > maxW && out.length > 1) out = out.slice(0, -1);
    return { text: out === s ? s : `${out.trimEnd()}…`, size: sz };
  };
  const checkbox = (x: number, y: number, checked: boolean) => {
    lineStyle(0.8, BLACK);
    doc.rect(x, y - 7.5, 8, 8);
    if (checked) {
      doc.setLineWidth(1.3);
      doc.line(x + 1.5, y - 6, x + 6.5, y - 1);
      doc.line(x + 6.5, y - 6, x + 1.5, y - 1);
    }
  };

  const drawHeader = (page: number) => {
    const top = 26;
    const h = 66;
    const logoW = 76;
    const rightX = L + 330;
    box(L, top, TW, h);
    doc.line(L + logoW, top, L + logoW, top + h);
    doc.line(rightX, top, rightX, top + h);
    doc.line(L + logoW, top + h / 2, rightX, top + h / 2);
    for (let i = 1; i < 4; i++) doc.line(rightX, top + (h / 4) * i, R, top + (h / 4) * i);

    if (input.logoDataUrl) {
      try {
        const p = doc.getImageProperties(input.logoDataUrl);
        const maxW = logoW - 14;
        const maxH = h - 12;
        const k = Math.min(maxW / p.width, maxH / p.height);
        doc.addImage(input.logoDataUrl, 'PNG', L + (logoW - p.width * k) / 2, top + (h - p.height * k) / 2, p.width * k, p.height * k);
      } catch {
        /* sin logo */
      }
    }
    const midX = (L + logoW + rightX) / 2;
    font('helvetica', 'bold', 8.5);
    doc.text(DOC006_AREA, midX, top + h / 4 + 3, { align: 'center' });
    font('helvetica', 'bold', 8);
    doc.text('EVALUACION DE CRITERIOS DE SELECCIÓN DE', midX, top + h * 0.75 - 4, { align: 'center' });
    doc.text('PROVEEDORES Y CLIENTES', midX, top + h * 0.75 + 7, { align: 'center' });

    const cell = (i: number, label: string, value: string) => {
      const y = top + (h / 4) * i + h / 8 + 3;
      font('helvetica', 'bold', 7.5);
      doc.text(label, rightX + 5, y);
      const w = doc.getTextWidth(label);
      font('helvetica', 'normal', 7.5);
      doc.text(value, rightX + 5 + w + 3, y);
    };
    cell(0, 'CÓDIGO:', DOC006_CODE);
    cell(1, 'VERSIÓN:', DOC006_VERSION);
    cell(2, 'FECHA:', DOC006_DATE);
    cell(3, 'PÁGINA:', `${page} de ${(input.extras || []).length > 0 ? 3 : 2}`);
  };

  const drawFooter = () => {
    font('times', 'normal', 9.5);
    doc.text(DOC006_FOOTER, W / 2, 745, { align: 'center' });
  };

  // ================= Página 1: formulario diligenciado =================
  drawHeader(1);

  font('times', 'bold', 11);
  doc.text('FECHA:', L + 8, 128);
  lineStyle(0.8, BLACK);
  doc.line(L + 52, 130, L + 190, 130);
  font('helvetica', 'normal', 9.5);
  doc.text(formatEvaluationDate(input.date), L + 121, 126, { align: 'center' });

  // Datos generales
  let y = 148;
  box(L, y, TW, 14, GRAY_FILL);
  font('helvetica', 'bold', 8);
  doc.text('DATOS GENERALES', L + TW / 2, y + 10, { align: 'center' });
  y += 14;

  box(L, y, TW, 17);
  font('helvetica', 'bold', 8);
  doc.text('PERSONAS JURÍDICA', L + 6, y + 12);
  checkbox(L + 112, y + 12, !input.isNatural);
  doc.text('PERSONA NATURAL', L + 175, y + 12);
  checkbox(L + 270, y + 12, input.isNatural);
  y += 17;

  box(L, y, TW, 17);
  font('helvetica', 'bold', 8);
  const nameLabel = 'NOMBRE O RAZÓN SOCIAL:';
  doc.text(nameLabel, L + 6, y + 12);
  const nameLabelW = doc.getTextWidth(nameLabel);
  const nameFit = fit(input.supplierName, TW - 12 - nameLabelW - 6, 8.5);
  font('helvetica', 'normal', nameFit.size);
  doc.text(nameFit.text, L + 6 + nameLabelW + 6, y + 12);
  y += 17;

  box(L, y, TW, 17);
  font('helvetica', 'bold', 8);
  doc.text('IDENTIFICACIÓN', L + 6, y + 12);
  doc.text('NIT.', L + 78, y + 12);
  checkbox(L + 98, y + 12, !input.isNatural);
  doc.text('C.C.', L + 138, y + 12);
  checkbox(L + 158, y + 12, input.isNatural);
  doc.text('NUMERO:', L + 205, y + 12);
  font('helvetica', 'normal', 8.5);
  doc.text(fit(input.supplierDoc, TW - 270, 8.5).text, L + 252, y + 12);
  y += 17;

  const splitX = L + TW * 0.64;
  box(L, y, TW, 17);
  doc.line(splitX, y, splitX, y + 17);
  font('helvetica', 'bold', 8);
  const addrLabel = 'DIRECCIÓN FUNCIONAMIENTO:';
  doc.text(addrLabel, L + 6, y + 12);
  const addrLabelW = doc.getTextWidth(addrLabel);
  const addrFit = fit(input.address || '—', splitX - L - 12 - addrLabelW - 6, 8);
  font('helvetica', 'normal', addrFit.size);
  doc.text(addrFit.text, L + 6 + addrLabelW + 6, y + 12);
  font('helvetica', 'bold', 8);
  const cityLabel = 'CIUDAD:';
  doc.text(cityLabel, splitX + 6, y + 12);
  const cityLabelW = doc.getTextWidth(cityLabel);
  const cityFit = fit(input.city || '—', R - splitX - 12 - cityLabelW - 6, 8);
  font('helvetica', 'normal', cityFit.size);
  doc.text(cityFit.text, splitX + 6 + cityLabelW + 6, y + 12);
  y += 17;

  font('times', 'italic', 7.8);
  doc.text('Para calificar al proveedor se tienen en cuenta los criterios y las ponderaciones establecidas en la siguiente hoja', W / 2, y + 18, {
    align: 'center',
  });
  y += 28;

  // Tabla de criterios
  const c1 = L + 118;
  const c2 = c1 + 62;
  box(L, y, c1 - L, 14, GRAY_FILL);
  box(c1, y, c2 - c1, 14, GRAY_FILL);
  box(c2, y, R - c2, 14, GRAY_FILL);
  font('times', 'bold', 8.5);
  doc.text('CRITERIO', (L + c1) / 2, y + 10, { align: 'center' });
  doc.text('PUNTAJE', (c1 + c2) / 2, y + 10, { align: 'center' });
  doc.text('OBSERVACIÓN', (c2 + R) / 2, y + 10, { align: 'center' });
  y += 14;

  const rowH = 27;
  DOC006_CRITERIA.forEach((crit, i) => {
    box(L, y, c1 - L, rowH);
    box(c1, y, c2 - c1, rowH);
    box(c2, y, R - c2, rowH);
    font('times', 'normal', 8.2);
    const label = doc.splitTextToSize(`${crit.roman}. ${crit.name}`, c1 - L - 12) as string[];
    label.slice(0, 3).forEach((ln, k) => doc.text(ln, L + 5, y + 10 + k * 9));
    font('helvetica', 'bold', 10);
    doc.text(String(input.scores[i] ?? ''), (c1 + c2) / 2, y + rowH / 2 + 3.5, { align: 'center' });
    font('helvetica', 'normal', 7.5);
    const lines = (doc.splitTextToSize(input.notes[i] || '', R - c2 - 10) as string[]).slice(0, 3);
    lines.forEach((ln, k) => doc.text(ln, c2 + 5, y + 9 + k * 8.2));
    y += rowH;
  });

  const extras = input.extras || [];
  if (extras.length > 0) {
    box(L, y, c1 - L, 20);
    box(c1, y, c2 - c1, 20);
    box(c2, y, R - c2, 20);
    font('times', 'normal', 8.2);
    doc.text('Partes adicionales (ver hoja 3)', L + 5, y + 13);
    font('helvetica', 'bold', 10);
    doc.text(String(extras.reduce((a, e) => a + (e.points || 0), 0)), (c1 + c2) / 2, y + 14, { align: 'center' });
    font('helvetica', 'normal', 7.5);
    doc.text(`de ${extras.reduce((a, e) => a + e.max, 0)} puntos`, c2 + 5, y + 13);
    y += 20;
  }

  const total = input.scores.reduce((a, b) => a + (b || 0), 0) + extras.reduce((a, e) => a + (e.points || 0), 0);
  const maxTotal = DOC006_MAX_SCORE + extras.reduce((a, e) => a + e.max, 0);
  const passing = doc006PassingFor(maxTotal);
  const approved = total >= passing;
  box(L, y, c1 - L, 17, GRAY_FILL);
  box(c1, y, c2 - c1, 17, GRAY_FILL);
  font('times', 'bold', 9);
  doc.text('TOTAL', c1 - 8, y + 12, { align: 'right' });
  font('helvetica', 'bold', 10.5);
  doc.text(String(total), (c1 + c2) / 2, y + 12.5, { align: 'center' });
  font('helvetica', 'normal', 8);
  doc.text(`de ${maxTotal} puntos`, c2 + 8, y + 12);
  const resultColor: RGB = approved ? NAVY : [190, 30, 30];
  font('helvetica', 'bold', 9, resultColor);
  doc.text(approved ? 'RESULTADO: APROBADO' : 'RESULTADO: NO APROBADO', R, y + 12, { align: 'right' });
  y += 17;

  font('helvetica', 'normal', 9.5);
  const rule = doc.splitTextToSize(
    `Si el proveedor obtiene una calificación de ${passing} puntos o más podrá ser tenido en cuenta para ser aprobado su vinculación como proveedor de la empresa.`,
    TW - 24
  ) as string[];
  rule.forEach((ln, k) => doc.text(ln, L + 14, y + 22 + k * 13));
  y += 22 + rule.length * 13 + 8;

  // Conclusiones
  font('helvetica', 'normal', 8.5);
  const concLinesFit = (doc.splitTextToSize(input.conclusions || '', TW - 16) as string[]);
  const rows = Math.max(3, Math.min(concLinesFit.length, extras.length > 0 ? 4 : 6));
  box(L, y, TW, 17);
  font('times', 'bold', 9.5);
  doc.text('CONCLUSIONES:', L + 4, y + 12);
  y += 17;
  const concRowH = 17;
  for (let r = 0; r < rows; r++) {
    box(L, y + r * concRowH, TW, concRowH);
    let ln = concLinesFit[r] || '';
    if (r === rows - 1 && concLinesFit.length > rows) ln = `${ln.slice(0, Math.max(0, ln.length - 3)).trimEnd()}…`;
    font('helvetica', 'normal', 8.5);
    doc.text(ln, L + 6, y + r * concRowH + 12);
  }
  y += rows * concRowH + 28;

  // Evaluador y firma
  const sx = L + TW * 0.64;
  box(L, y, sx - L, 16, GRAY_FILL);
  box(sx, y, R - sx, 16, GRAY_FILL);
  font('times', 'bold', 8.5);
  doc.text('NOMBRE Y CARGO DEL EVALUADOR', (L + sx) / 2, y + 11, { align: 'center' });
  doc.text('FIRMA', (sx + R) / 2, y + 11, { align: 'center' });
  y += 16;
  const signH = 58;
  box(L, y, sx - L, signH);
  box(sx, y, R - sx, signH);
  if (input.signatureDataUrl) {
    try {
      const p = doc.getImageProperties(input.signatureDataUrl);
      const maxW = R - sx - 20;
      const maxH = signH - 12;
      const k = Math.min(maxW / p.width, maxH / p.height);
      doc.addImage(input.signatureDataUrl, 'PNG', sx + (R - sx - p.width * k) / 2, y + (signH - p.height * k) / 2, p.width * k, p.height * k);
    } catch {
      /* firma ilegible: el recuadro queda para firmar a mano */
    }
  }
  const evName = fit(input.evaluatorName, sx - L - 14, 9.5);
  font('helvetica', 'bold', evName.size);
  doc.text(evName.text, L + 7, y + 16);
  const evPos = fit(input.evaluatorPosition, sx - L - 14, 8.5);
  font('helvetica', 'normal', evPos.size);
  doc.text(evPos.text, L + 7, y + 29);

  drawFooter();

  // ================= Página 2: criterios y cómo se mide =================
  doc.addPage();
  drawHeader(2);

  font('helvetica', 'bold', 11);
  doc.text('Criterios de Selección de proveedores', L + 8, 130);

  const d1 = L + 98;
  const d2 = d1 + 150;
  y = 144;
  box(L, y, d1 - L, 17, GRAY_FILL);
  box(d1, y, d2 - d1, 17, GRAY_FILL);
  box(d2, y, R - d2, 17, GRAY_FILL);
  font('times', 'bold', 9);
  doc.text('Criterio', (L + d1) / 2, y + 12, { align: 'center' });
  doc.text('Descripción genérica del criterio', (d1 + d2) / 2, y + 12, { align: 'center' });
  doc.text('Puntaje', (d2 + R) / 2, y + 12, { align: 'center' });
  y += 17;

  const lead = 9.2;
  DOC006_CRITERIA.forEach((crit, i) => {
    const picked = input.scores[i];
    font('helvetica', 'normal', 7.8);
    const descLines = doc.splitTextToSize(crit.description, d2 - d1 - 14) as string[];
    // La opción marcada va en negrita (más ancha): se mide con su propia fuente para que no se salga del recuadro
    const optLines = crit.options.map((o) => {
      doc.setFont('helvetica', picked === o.points ? 'bold' : 'normal');
      return doc.splitTextToSize(`${o.label}: ${o.points} puntos`, R - d2 - 30) as string[];
    });
    doc.setFont('helvetica', 'normal');
    const noteLines = crit.note ? (doc.splitTextToSize(crit.note, R - d2 - 14) as string[]) : [];
    const rightCount = noteLines.length + optLines.reduce((a, l) => a + l.length, 0);
    const h = Math.max(descLines.length, rightCount, 3) * lead + 14;

    box(L, y, d1 - L, h);
    box(d1, y, d2 - d1, h);
    box(d2, y, R - d2, h);

    font('times', 'bold', 8.5);
    const nm = doc.splitTextToSize(`${i + 1}. ${crit.name}`, d1 - L - 16) as string[];
    nm.forEach((ln, k) => doc.text(ln, L + 8, y + h / 2 - ((nm.length - 1) * 10) / 2 + 3 + k * 10));

    font('helvetica', 'normal', 7.8);
    descLines.forEach((ln, k) => doc.text(ln, d1 + 7, y + 11 + k * lead));

    let ry = y + 11;
    noteLines.forEach((ln) => {
      font('helvetica', 'normal', 7.8);
      doc.text(ln, d2 + 7, ry);
      ry += lead;
    });
    crit.options.forEach((o, k) => {
      const lines = optLines[k];
      const on = picked === o.points;
      if (on) {
        doc.setFillColor(PALE_BLUE[0], PALE_BLUE[1], PALE_BLUE[2]);
        doc.rect(d2 + 2, ry - 8, R - d2 - 4, lines.length * lead + 1.5, 'F');
      }
      doc.setFillColor(on ? BLUE[0] : 40, on ? BLUE[1] : 40, on ? BLUE[2] : 40);
      doc.circle(d2 + 11, ry - 2.6, on ? 2.4 : 1.4, 'F');
      font('helvetica', on ? 'bold' : 'normal', 7.8, on ? NAVY : BLACK);
      lines.forEach((ln, j) => doc.text(ln, d2 + 20, ry + j * lead));
      ry += lines.length * lead;
    });
    y += h;
  });

  font('helvetica', 'italic', 7.5, [90, 90, 90]);
  doc.text(`Opción calificada resaltada en azul. Total: ${total} de ${maxTotal} puntos.`, L, y + 14);
  drawFooter();

  // ================= Página 3: partes adicionales (solo si la administración las agregó) =================
  if (extras.length > 0) {
    doc.addPage();
    drawHeader(3);
    font('helvetica', 'bold', 11);
    doc.text('Partes adicionales de la evaluación', L + 8, 130);
    const e1 = L + 190;
    const e2 = e1 + 70;
    y = 144;
    box(L, y, e1 - L, 17, GRAY_FILL);
    box(e1, y, e2 - e1, 17, GRAY_FILL);
    box(e2, y, R - e2, 17, GRAY_FILL);
    font('times', 'bold', 9);
    doc.text('Parte', (L + e1) / 2, y + 12, { align: 'center' });
    doc.text('Puntaje', (e1 + e2) / 2, y + 12, { align: 'center' });
    doc.text('Observación', (e2 + R) / 2, y + 12, { align: 'center' });
    y += 17;
    extras.forEach((ex) => {
      font('helvetica', 'normal', 8.5);
      const nameLines = doc.splitTextToSize(ex.name, e1 - L - 14) as string[];
      const noteLines = doc.splitTextToSize(ex.notes || '', R - e2 - 12) as string[];
      const h = Math.max(nameLines.length, noteLines.length, 2) * 10.5 + 12;
      if (y + h > 720) return;
      box(L, y, e1 - L, h);
      box(e1, y, e2 - e1, h);
      box(e2, y, R - e2, h);
      font('times', 'bold', 9);
      nameLines.forEach((ln, k) => doc.text(ln, L + 7, y + 14 + k * 10.5));
      font('helvetica', 'bold', 10);
      doc.text(`${ex.points} / ${ex.max}`, (e1 + e2) / 2, y + h / 2 + 3.5, { align: 'center' });
      font('helvetica', 'normal', 8);
      noteLines.forEach((ln, k) => doc.text(ln, e2 + 6, y + 13 + k * 10));
      y += h;
    });
    font('helvetica', 'italic', 7.5, [90, 90, 90]);
    doc.text(`Total de la evaluación: ${total} de ${maxTotal} puntos (mínimo para aprobar: ${passing}).`, L, y + 14);
    drawFooter();
  }

  doc.setProperties({
    title: `${DOC006_CODE} v${DOC006_VERSION} · ${input.supplierName}`,
    subject: DOC006_TITLE,
    author: 'Flota Sugamuxi S.A.',
    creator: 'SIGEPRO',
  });
  return doc.output('blob');
}
