import type { SupplierEvaluation } from '../../types';
import { downloadWorkbook } from './excelBuilder';
import { buildSheets, defaultColumns, fileDate, reportById } from './reportDefs';
import type { ReportCtx } from './reportDefs';

/**
 * Descarga las evaluaciones que se están viendo en pantalla con el mismo formato del módulo Reportes.
 * Lo usa la pestaña «Evaluaciones» para su botón de Excel.
 */
export async function exportEvaluationsExcel(evaluations: SupplierEvaluation[], filtersText: string, userName: string) {
  const def = reportById('EVALUACIONES');
  const ctx: ReportCtx = {
    dossiers: [],
    evaluations,
    convocatorias: [],
    auditLogs: [],
    documentDefinitions: [],
    getRequired: () => ({ allMandatory: [] }),
    userName,
  };
  const sheets = buildSheets(def, ctx, evaluations, defaultColumns(def), filtersText);
  await downloadWorkbook(`SIGEPRO_${def.fileSlug}_${fileDate()}.xlsx`, { author: userName, title: def.title, sheets });
}
