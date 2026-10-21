import React, { useRef } from 'react';
import {
  X,
  Printer,
  Award,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileCheck,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { SupplierEvaluation } from '../../types';
import { FlotaSugamuxiLogo } from '../FlotaSugamuxiLogo';

interface EvaluationCertificateModalProps {
  evaluation: SupplierEvaluation | null;
  onClose: () => void;
}

export const EvaluationCertificateModal: React.FC<EvaluationCertificateModalProps> = ({
  evaluation,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!evaluation) return null;

  const handlePrint = () => {
    window.print();
  };

  const isInitial = evaluation.evaluationType === 'INICIAL';
  const evalTitle = isInitial
    ? 'EVALUACIÓN INICIAL DE SELECCIÓN Y ADMISIÓN (AL CREARLO)'
    : 'EVALUACIÓN DE DESEMPEÑO ANUAL DE PROVEEDORES (1 AÑO DESPUÉS DE CREACIÓN)';

  const getConceptColor = (concept: string) => {
    switch (concept) {
      case 'SOBRESALIENTE':
        return 'text-blue-950 dark:text-cyan-200 bg-blue-100 dark:bg-blue-950/70 border-blue-300 dark:border-blue-700';
      case 'CONFORME':
        return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800';
      case 'CONDICIONAL_MEJORA':
        return 'text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
      default:
        return 'text-white bg-slate-900 dark:bg-slate-950 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Toolbar */}
        <div className="px-6 py-4 bg-[#0b1329] text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-cyan-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Acta Oficial de Evaluación SIG - Flota Sugamuxi S.A.
              </h3>
              <p className="text-xs text-slate-300">
                Código Certificado: <span className="text-cyan-400 font-mono font-bold">{evaluation.certificateCode || 'CALIF-SIG-2026-001'}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-900" ref={printRef}>
          {/* Institutional Header */}
          <div className="border border-slate-300 rounded-xl p-5 mb-6 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <FlotaSugamuxiLogo variant="light" size="md" />
                <div className="border-l border-slate-300 pl-4 text-xs text-slate-600 leading-tight">
                  <div className="font-bold text-slate-900">FLOTA SUGAMUXI S.A.</div>
                  <div>NIT: 891.800.087-1</div>
                  <div>Sistema Integrado de Gestión (SIG) - ISO 9001 / ISO 39001</div>
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="font-mono font-bold text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1 rounded-md inline-block">
                  CÓDIGO: FS.SIG-ACT-005
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Versión 3.0 | Aprobado</div>
              </div>
            </div>

            <div className="text-center pt-4">
              <h2 className="text-base font-extrabold tracking-tight text-slate-900 uppercase">
                ACTA DE CALIFICACIÓN Y EVALUACIÓN DE PROVEEDORES
              </h2>
              <div className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
                {evalTitle}
              </div>
            </div>
          </div>

          {/* Supplier & Reviewer Data Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-700" />
                Datos del Proveedor Evaluado
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Razón Social / Titular:</span>
                  <span className="font-bold text-slate-900 text-right">{evaluation.supplierName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Documento / NIT:</span>
                  <span className="font-mono font-bold text-slate-800">{evaluation.supplierDoc}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Expediente Digital:</span>
                  <span className="font-mono text-slate-700">{evaluation.fileNumber}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Categoría Suministro:</span>
                  <span className="font-medium text-slate-800">{evaluation.categoryName || 'Bienes y Servicios Operativos'}</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                Datos de la Evaluación y Revisor
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Fecha de Evaluación:</span>
                  <span className="font-bold text-slate-900">{evaluation.evaluationDate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Tipo de Evento:</span>
                  <span className="font-semibold text-blue-900">
                    {isInitial ? 'Inicial (Creación)' : 'Anual (1 Año)'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Revisor / Evaluador:</span>
                  <span className="font-medium text-slate-900">{evaluation.evaluatorName}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Rol Evaluador:</span>
                  <span className="font-medium text-slate-700">{evaluation.evaluatorRole}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Criteria Evaluation Table */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider mb-2 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-blue-700" />
              Desglose de Criterios y Puntuación SIG
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Criterio de Evaluación</th>
                    <th className="px-3 py-2.5">Categoría</th>
                    <th className="px-3 py-2.5 text-center">Peso (%)</th>
                    <th className="px-3 py-2.5 text-center">Puntaje (0-100)</th>
                    <th className="px-3 py-2.5 text-center">Ponderado</th>
                    <th className="px-3 py-2.5">Observaciones Técnicas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(evaluation.criteriaScores || []).map((c, idx) => {
                    const weightVal = c.weight ?? 20;
                    const weighted = (((c.score ?? 0) * weightVal) / 100).toFixed(1);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2.5 font-semibold text-slate-900 max-w-xs">{c.criterionName}</td>
                        <td className="px-3 py-2.5 text-slate-600">{c.category}</td>
                        <td className="px-3 py-2.5 text-center font-mono font-medium text-slate-700">{weightVal}%</td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs ${
                              c.score >= 85
                                ? 'bg-blue-100 text-blue-900'
                                : c.score >= 70
                                ? 'bg-slate-100 text-slate-800'
                                : 'bg-slate-200 text-slate-900'
                            }`}
                          >
                            {c.score}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-blue-900">{weighted}</td>
                        <td className="px-3 py-2.5 text-slate-600 text-[11px] italic">
                          {c.notes || 'Conforme a especificaciones'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t border-slate-200 text-slate-900">
                  <tr>
                    <td colSpan={2} className="px-3 py-3 text-right uppercase text-slate-700">
                      Puntaje Global Ponderado:
                    </td>
                    <td className="px-3 py-3 text-center font-mono">100%</td>
                    <td colSpan={2} className="px-3 py-3 text-center">
                      <span className="text-base font-black text-blue-900 font-mono">
                        {evaluation.totalScore} / 100
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-black border ${getConceptColor(evaluation.concept)}`}>
                        {evaluation.concept}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Observations & Improvement Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/30">
              <h5 className="text-xs font-bold text-slate-700 mb-1.5 uppercase">Observaciones y Dictamen del Revisor</h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                {evaluation.observations || 'Sin observaciones adicionales registradas durante la evaluación.'}
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/30">
              <h5 className="text-xs font-bold text-slate-700 mb-1.5 uppercase">Plan de Acción / Mejora Continua</h5>
              {evaluation.hasImprovementPlan ? (
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
                    <span>Requiere Plan de Acción Obligatorio</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{evaluation.improvementPlanAction}</p>
                  {evaluation.improvementPlanDeadline && (
                    <div className="text-[11px] text-slate-500 pt-1">
                      Fecha límite de entrega: <strong>{evaluation.improvementPlanDeadline}</strong>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-blue-900 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-blue-700" />
                  <span>No requiere plan de mejora. Desempeño acorde a estándares SIG.</span>
                </div>
              )}
            </div>
          </div>

          {/* Next Due Date & Signatures */}
          <div className="border-t border-slate-200 pt-6 mt-4">
            <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 mb-8 gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-700" />
                <span>
                  Próxima Evaluación de Seguimiento Programada:{' '}
                  <strong className="text-slate-900 font-mono">
                    {evaluation.nextEvaluationDueDate || 'A los 365 días del período'}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>Firma digital institucional registrada en el sistema de gestión.</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-6">
              <div className="text-center">
                <div className="border-b border-slate-400 pb-1 w-48 mx-auto font-serif italic text-sm text-slate-800">
                  {evaluation.evaluatorName}
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1">{evaluation.evaluatorName}</div>
                <div className="text-[10px] text-slate-500">{evaluation.evaluatorRole} - Flota Sugamuxi S.A.</div>
              </div>
              <div className="text-center">
                <div className="border-b border-slate-400 pb-1 w-48 mx-auto font-serif italic text-sm text-slate-800">
                  Coordinación SIG
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1">Dirección de Operaciones y SIG</div>
                <div className="text-[10px] text-slate-500">Flota Sugamuxi S.A. - NIT: 891.800.087-1</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 dark:bg-[#090f20] border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <span>Documento interno generado conforme a políticas del Sistema Integrado de Gestión.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar Vista Previa
          </button>
        </div>
      </div>
    </div>
  );
};
