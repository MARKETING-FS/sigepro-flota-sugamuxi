/**
 * Generador de libros de Excel con formato institucional (Flota Sugamuxi S.A.).
 *
 * Todas las hojas salen con el mismo aspecto: banda azul oscuro con el nombre de la empresa y el
 * informe, línea de filtros aplicados, encabezado azul fijo con filtros de Excel, filas alternadas,
 * bordes finos, formatos reales (pesos, fechas, porcentajes), estados con color y fila de totales.
 *
 * La librería (exceljs, ~1 MB) se carga solo cuando el usuario descarga un archivo.
 */

export type CellKind = 'text' | 'long' | 'int' | 'money' | 'percent' | 'date' | 'datetime' | 'status';
/** Color de un estado: azul = bien, gris = pendiente, celeste = informativo, rojo = problema. */
export type CellTone = 'good' | 'neutral' | 'info' | 'bad';

export interface SheetColumn {
  header: string;
  /** Ancho en caracteres (como en Excel). */
  width: number;
  kind: CellKind;
  /** Si se indica, la fila de totales suma esta columna (respeta los filtros que se apliquen en Excel). */
  total?: 'sum';
  /** Color de la celda según su valor (para kind 'status'). */
  tone?: (value: unknown) => CellTone | undefined;
}

export interface SheetSpec {
  /** Nombre de la pestaña (máx. 31 caracteres). */
  name: string;
  /** Título del informe que aparece en la banda superior. */
  title: string;
  /** Línea pequeña bajo el título: fecha de generación, quién lo generó y cuántos registros. */
  meta: string;
  /** Texto de los filtros aplicados. */
  filters?: string;
  columns: SheetColumn[];
  rows: unknown[][];
  /** Columnas fijas a la izquierda al desplazarse (por defecto 1). */
  freezeCols?: number;
}

export interface SummarySection {
  heading: string;
  rows: Array<{ label: string; value: number | string; /** 0..1, dibuja una barra */ share?: number }>;
}

export interface SummarySpec {
  name: string;
  title: string;
  meta: string;
  sections: SummarySection[];
}

// ── Paleta (azules de la marca; rojo solo para problemas) ─────────────────────────────────────────
const C = {
  navy: 'FF0B1D3A',
  blue: 'FF1D5FA8',
  sky: 'FF2C84C4',
  cyan: 'FF69BDD7',
  ink: 'FF0B1D3A',
  text: 'FF1F3350',
  muted: 'FF5D7392',
  line: 'FFD9E3EF',
  zebra: 'FFF4F8FC',
  tint: 'FFEEF5FC',
  white: 'FFFFFFFF',
  onNavy: 'FFB9CDE3',
};

const TONE_STYLE: Record<CellTone, { fill: string; font: string }> = {
  good: { fill: 'FFD6E8F8', font: 'FF1D5FA8' },
  info: { fill: 'FFE0F2F8', font: 'FF0E6D8A' },
  neutral: { fill: 'FFEEF1F5', font: 'FF4A5D78' },
  bad: { fill: 'FFFDE2E2', font: 'FFB91C1C' },
};

const FONT = 'Calibri';
const HEADER_ROW = 7;

const NUMFMT: Partial<Record<CellKind, string>> = {
  int: '#,##0',
  money: '"$" #,##0',
  percent: '0%',
  date: 'dd/mm/yyyy',
  datetime: 'dd/mm/yyyy hh:mm',
};

const borderAll = {
  top: { style: 'thin' as const, color: { argb: C.line } },
  left: { style: 'thin' as const, color: { argb: C.line } },
  bottom: { style: 'thin' as const, color: { argb: C.line } },
  right: { style: 'thin' as const, color: { argb: C.line } },
};

const safeSheetName = (name: string, used: Set<string>): string => {
  let base = name.replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31) || 'Hoja';
  let candidate = base;
  let n = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${n++})`;
    candidate = base.slice(0, 31 - suffix.length) + suffix;
  }
  used.add(candidate.toLowerCase());
  return candidate;
};

/** Convierte lo que haya en la celda al valor que Excel debe guardar. */
const toDateValue = (v: unknown): Date | null => {
  if (v === null || v === undefined || v === '') return null;
  let d: Date | null = null;
  if (v instanceof Date) d = v;
  else if (typeof v === 'string') {
    const s = v.trim();
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    const dmy = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(s);
    if (iso) d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    else if (dmy) d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    else {
      const t = new Date(s);
      d = isNaN(t.getTime()) ? null : t;
    }
  }
  if (!d || isNaN(d.getTime())) return null;
  // Excel guarda las fechas como UTC: se corre el reloj para que muestre la hora local de Colombia.
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000);
};

const colLetter = (n: number): string => {
  let s = '';
  let x = n;
  while (x > 0) {
    const m = (x - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
};

type Workbook = import('exceljs').Workbook;
type Worksheet = import('exceljs').Worksheet;

/** Banda superior: empresa, título, línea de metadatos y filete de color. */
const paintBanner = (ws: Worksheet, cols: number, title: string, meta: string, filters?: string) => {
  const merge = (row: number, text: string, opts: { size: number; bold?: boolean; color: string; fill: string; height: number; italic?: boolean }) => {
    ws.mergeCells(row, 1, row, cols);
    const cell = ws.getCell(row, 1);
    cell.value = text;
    cell.font = { name: FONT, size: opts.size, bold: opts.bold, italic: opts.italic, color: { argb: opts.color } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    ws.getRow(row).height = opts.height;
    for (let c = 1; c <= cols; c++) {
      ws.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.fill } };
    }
  };

  merge(1, 'FLOTA SUGAMUXI S.A.  ·  SIGEPRO', { size: 15, bold: true, color: C.white, fill: C.navy, height: 30 });
  merge(2, title.toUpperCase(), { size: 12, bold: true, color: C.cyan, fill: C.navy, height: 22 });
  merge(3, meta, { size: 10, color: C.onNavy, fill: C.navy, height: 20 });

  // Filete de color
  ws.getRow(4).height = 5;
  for (let c = 1; c <= cols; c++) {
    ws.getCell(4, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.sky } };
  }

  if (filters) {
    merge(5, `Filtros aplicados:  ${filters}`, { size: 10, italic: true, color: C.muted, fill: C.tint, height: 22 });
  } else {
    ws.getRow(5).height = 6;
  }
  ws.getRow(6).height = 8;
};

const pageSetup = (ws: Worksheet, headerRow: number | null) => {
  ws.pageSetup = {
    orientation: 'landscape',
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.6, header: 0.3, footer: 0.3 },
    ...(headerRow ? { printTitlesRow: `${headerRow}:${headerRow}` } : {}),
  } as Worksheet['pageSetup'];
  ws.headerFooter = {
    oddFooter: '&L&"Calibri,Italic"&9Flota Sugamuxi S.A. · SIGEPRO&R&"Calibri"&9Página &P de &N',
  };
};

const addDataSheet = (wb: Workbook, spec: SheetSpec, used: Set<string>) => {
  const cols = spec.columns.length;
  const ws = wb.addWorksheet(safeSheetName(spec.name, used), {
    properties: { tabColor: { argb: C.sky } },
    views: [
      {
        showGridLines: false,
        state: 'frozen',
        xSplit: Math.min(spec.freezeCols ?? 1, cols),
        ySplit: HEADER_ROW,
        topLeftCell: `${colLetter(Math.min(spec.freezeCols ?? 1, cols) + 1)}${HEADER_ROW + 1}`,
      },
    ],
  });

  ws.columns = spec.columns.map((c) => ({ width: c.width }));
  paintBanner(ws, Math.max(cols, 2), spec.title, spec.meta, spec.filters);

  // Encabezado
  const header = ws.getRow(HEADER_ROW);
  header.height = 36;
  spec.columns.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.header;
    cell.font = { name: FONT, size: 10, bold: true, color: { argb: C.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.blue } };
    cell.alignment = { vertical: 'middle', horizontal: c.kind === 'money' || c.kind === 'int' ? 'right' : 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: C.blue } },
      bottom: { style: 'medium', color: { argb: C.cyan } },
      left: { style: 'thin', color: { argb: 'FF2A72BE' } },
      right: { style: 'thin', color: { argb: 'FF2A72BE' } },
    };
  });

  // Filas
  if (spec.rows.length === 0) {
    const r = HEADER_ROW + 1;
    ws.mergeCells(r, 1, r, Math.max(cols, 2));
    const cell = ws.getCell(r, 1);
    cell.value = 'No hay registros con los filtros aplicados.';
    cell.font = { name: FONT, size: 11, italic: true, color: { argb: C.muted } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(r).height = 34;
  }

  spec.rows.forEach((values, idx) => {
    const row = ws.getRow(HEADER_ROW + 1 + idx);
    const zebra = idx % 2 === 1;
    let maxLines = 1;
    spec.columns.forEach((col, i) => {
      const cell = row.getCell(i + 1);
      const raw = values[i];
      let value: unknown = raw ?? null;
      if (col.kind === 'date' || col.kind === 'datetime') value = toDateValue(raw);
      else if (col.kind === 'money' || col.kind === 'int' || col.kind === 'percent') {
        value = typeof raw === 'number' && isFinite(raw) ? raw : null;
      } else if (value !== null) value = String(value);
      cell.value = value as never;

      const numFmt = NUMFMT[col.kind];
      if (numFmt) cell.numFmt = numFmt;

      cell.font = { name: FONT, size: 10, color: { argb: C.text } };
      cell.border = borderAll;
      if (zebra) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.zebra } };

      const centered = col.kind === 'date' || col.kind === 'datetime' || col.kind === 'status' || col.kind === 'percent';
      const right = col.kind === 'money' || col.kind === 'int';
      cell.alignment = {
        vertical: 'middle',
        horizontal: right ? 'right' : centered ? 'center' : 'left',
        wrapText: col.kind === 'long',
        indent: !right && !centered ? 1 : 0,
      };

      if (col.kind === 'status' && value) {
        const tone = col.tone?.(value);
        if (tone) {
          const t = TONE_STYLE[tone];
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: t.fill } };
          cell.font = { name: FONT, size: 10, bold: true, color: { argb: t.font } };
        }
      }
      if (col.kind === 'long' && typeof value === 'string') {
        maxLines = Math.max(maxLines, Math.ceil(value.length / Math.max(8, col.width * 1.05)));
      }
    });
    row.height = Math.min(120, Math.max(20, maxLines * 14 + 6));
  });

  // Totales (SUBTOTAL: se recalculan si el usuario filtra en Excel)
  const sumCols = spec.columns.map((c, i) => (c.total === 'sum' ? i : -1)).filter((i) => i >= 0);
  const firstData = HEADER_ROW + 1;
  const lastData = HEADER_ROW + spec.rows.length;
  if (sumCols.length > 0 && spec.rows.length > 0) {
    const r = lastData + 1;
    const row = ws.getRow(r);
    row.height = 24;
    spec.columns.forEach((col, i) => {
      const cell = row.getCell(i + 1);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.navy } };
      cell.font = { name: FONT, size: 10, bold: true, color: { argb: C.white } };
      cell.alignment = { vertical: 'middle', horizontal: col.kind === 'money' || col.kind === 'int' ? 'right' : 'left', indent: i === 0 ? 1 : 0 };
      if (i === 0) cell.value = 'TOTAL';
      if (col.total === 'sum') {
        const L = colLetter(i + 1);
        const result = spec.rows.reduce((acc, v) => acc + (typeof v[i] === 'number' ? (v[i] as number) : 0), 0);
        cell.value = { formula: `SUBTOTAL(109,${L}${firstData}:${L}${lastData})`, result } as never;
        cell.numFmt = NUMFMT[col.kind] || '#,##0';
      }
    });
  }

  if (spec.rows.length > 0) {
    ws.autoFilter = {
      from: { row: HEADER_ROW, column: 1 },
      to: { row: HEADER_ROW, column: cols },
    };
  }
  pageSetup(ws, HEADER_ROW);
};

const addSummarySheet = (wb: Workbook, spec: SummarySpec, used: Set<string>) => {
  const ws = wb.addWorksheet(safeSheetName(spec.name, used), {
    properties: { tabColor: { argb: C.navy } },
    views: [{ showGridLines: false }],
  });
  ws.columns = [{ width: 56 }, { width: 16 }, { width: 14 }, { width: 38 }];
  paintBanner(ws, 4, spec.title, spec.meta);

  let r = 7;
  spec.sections.forEach((section) => {
    // Encabezado de sección
    ws.mergeCells(r, 1, r, 4);
    const h = ws.getCell(r, 1);
    h.value = section.heading;
    h.font = { name: FONT, size: 11, bold: true, color: { argb: C.white } };
    h.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    for (let c = 1; c <= 4; c++) ws.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.blue } };
    ws.getRow(r).height = 24;
    r += 1;

    section.rows.forEach((item, i) => {
      const row = ws.getRow(r);
      row.height = 22;
      const fill = i % 2 === 1 ? C.zebra : C.white;
      const label = row.getCell(1);
      label.value = item.label;
      label.font = { name: FONT, size: 10, color: { argb: C.text } };
      label.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

      const value = row.getCell(2);
      value.value = item.value as never;
      if (typeof item.value === 'number') value.numFmt = '#,##0';
      value.font = { name: FONT, size: 11, bold: true, color: { argb: C.ink } };
      value.alignment = { vertical: 'middle', horizontal: 'right' };

      const share = row.getCell(3);
      if (typeof item.share === 'number') {
        share.value = item.share;
        share.numFmt = '0%';
      }
      share.font = { name: FONT, size: 10, color: { argb: C.muted } };
      share.alignment = { vertical: 'middle', horizontal: 'center' };

      const bar = row.getCell(4);
      if (typeof item.share === 'number') {
        bar.value = '█'.repeat(Math.max(0, Math.round(item.share * 28)));
      }
      bar.font = { name: FONT, size: 10, color: { argb: C.sky } };
      bar.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

      for (let c = 1; c <= 4; c++) {
        const cell = row.getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
        cell.border = borderAll;
      }
      r += 1;
    });
    r += 1;
  });

  pageSetup(ws, null);
  ws.pageSetup.orientation = 'portrait';
};

export interface WorkbookSpec {
  author: string;
  title: string;
  /** Hojas en el orden en que aparecen; un resumen va primero si se incluye. */
  summary?: SummarySpec;
  sheets: SheetSpec[];
}

/** Construye el libro en memoria (sin descargarlo). */
export async function buildWorkbookBuffer(spec: WorkbookSpec): Promise<ArrayBuffer> {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = spec.author || 'SIGEPRO';
  wb.lastModifiedBy = spec.author || 'SIGEPRO';
  wb.company = 'Flota Sugamuxi S.A.';
  wb.title = spec.title;
  wb.created = new Date();

  const used = new Set<string>();
  if (spec.summary) addSummarySheet(wb, spec.summary, used);
  spec.sheets.forEach((s) => addDataSheet(wb, s, used));

  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

/** Construye el libro y lo entrega como archivo descargable. */
export async function downloadWorkbook(fileName: string, spec: WorkbookSpec): Promise<void> {
  const buffer = await buildWorkbookBuffer(spec);
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
