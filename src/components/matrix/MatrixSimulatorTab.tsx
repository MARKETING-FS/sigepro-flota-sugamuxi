import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SupplierType } from '../../types';
import {
  Sparkles,
  User,
  Building2,
  Briefcase,
  CheckCircle2,
  Info,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export const MatrixSimulatorTab: React.FC = () => {
  const {
    categoriesConfig,
    documentDefinitions,
    getRequiredDocumentsForSupplier,
  } = useApp();

  const [simRegimen, setSimRegimen] = useState<SupplierType>('NATURAL');
  const [simCategory, setSimCategory] = useState<string>(
    categoriesConfig[0]?.category || 'Transporte de Carga'
  );

  const simResults = useMemo(() => {
    return getRequiredDocumentsForSupplier(simRegimen, simCategory);
  }, [getRequiredDocumentsForSupplier, simRegimen, simCategory]);

  const selectedCategoryObj = categoriesConfig.find((c) => c.category === simCategory);

  // Inactive docs
  const inactiveDocs = documentDefinitions.filter((d) => d.isActive === false);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="max-w-3xl">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>Simulador de Checklist y Fusión Dinámica de Requisitos</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Compruebe en tiempo real cómo el motor unifica los <strong>Requisitos Base según Tipo de Persona</strong> con los <strong>Requisitos Específicos de la Actividad Económica</strong>, excluyendo automáticamente cualquier documento o actividad inactivada.
          </p>
        </div>

        {/* Simulator Selector Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              1. Seleccione Tipo de Persona del Aspirante:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSimRegimen('NATURAL')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  simRegimen === 'NATURAL'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Persona Natural</span>
              </button>
              <button
                onClick={() => setSimRegimen('JURIDICA')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  simRegimen === 'JURIDICA'
                    ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Persona Jurídica</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              2. Seleccione Actividad Económica o Servicio:
            </label>
            <select
              value={simCategory}
              onChange={(e) => setSimCategory(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
            >
              {categoriesConfig.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category} {c.economicCode ? `(CIIU ${c.economicCode})` : ''} &bull; Riesgo {c.riskLevel || 'MEDIO'} {c.isActive === false ? '(INACTIVA)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Formula Breakdown Banner */}
        <div className="bg-gradient-to-r from-[#0b1329] via-blue-950 to-slate-900 text-white p-5 rounded-2xl border border-blue-800 flex flex-wrap items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-cyan-300 flex items-center justify-center shrink-0 border border-blue-400/30 font-black text-xl">
              =
            </div>
            <div>
              <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider block">
                Fórmula de Exigibilidad Aplicada:
              </span>
              <div className="text-xs font-bold text-white flex items-center gap-2 flex-wrap mt-0.5">
                <span>{(simResults?.baseMandatory || []).length} Base ({simRegimen === 'NATURAL' ? 'P. Natural' : 'P. Jurídica'})</span>
                <span>+</span>
                <span>{(simResults?.activityMandatory || []).length} Específicos ({simCategory})</span>
                <span>+</span>
                <span>2 Formatos Institucionales SIG</span>
                <span>=</span>
                <strong className="text-cyan-300 text-sm font-black">
                  {(simResults?.allMandatory || []).length + 2} Documentos Obligatorios Bloqueantes
                </strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="bg-slate-900 text-cyan-300 px-3 py-1.5 rounded-lg border border-slate-700">
              {(simResults?.allMandatory || []).length + 2} Total Obligatorios
            </span>
            <span className="bg-slate-900 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
              {(simResults?.allOptional || []).length} Opcionales
            </span>
          </div>
        </div>

        {/* Inactive Documents Note if Any */}
        {inactiveDocs.length > 0 && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 text-xs text-slate-600">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              <strong>{inactiveDocs.length} documentos inactivos</strong> en el catálogo están siendo excluidos de esta simulación automáticamente.
            </span>
          </div>
        )}

        {/* Generated Checklist Preview */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Desglose de Documentos Exigidos en el Proceso de Radicación:
          </h3>

          <div className="space-y-2">
            {/* Fixed institutional formats */}
            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-900">
                    Formulario de Inscripción y Actualización (FS.GA-FOR-009)
                  </span>
                  <p className="text-[10px] text-slate-500">Formato oficial institucional vigente versión 14.0</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 bg-blue-900 text-cyan-300 text-[10px] font-bold rounded-full">
                OBLIGATORIO INSTITUCIONAL
              </span>
            </div>

            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-900">
                    Autorización de Tratamiento de Datos Personales (FS.GA-FOR-039)
                  </span>
                  <p className="text-[10px] text-slate-500">Cumplimiento Ley 1581 de 2012 Habeas Data</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 bg-blue-900 text-cyan-300 text-[10px] font-bold rounded-full">
                OBLIGATORIO INSTITUCIONAL
              </span>
            </div>

            {/* Mandatory List with origin badges */}
            {simResults.allMandatory.map((code) => {
              const docDef = documentDefinitions.find((d) => d.code === code);
              const isBase = simResults.baseMandatory.includes(code);
              const isActivity = simResults.activityMandatory.includes(code);

              return (
                <div
                  key={code}
                  className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        {docDef?.name || code}
                      </span>
                      <p className="text-[10px] text-slate-500">
                        {docDef?.validityRule || 'Documento exigible'} &bull; Código: {code}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isBase && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-bold rounded-md border border-blue-200 flex items-center gap-1">
                        <User className="w-2.5 h-2.5" /> Requisito Base ({simRegimen === 'NATURAL' ? 'P. Natural' : 'P. Jurídica'})
                      </span>
                    )}
                    {isActivity && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-900 text-[10px] font-bold rounded-md border border-slate-300 flex items-center gap-1">
                        <Briefcase className="w-2.5 h-2.5" /> Requisito por Actividad ({simCategory})
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded-full border border-slate-700">
                      OBLIGATORIO
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Optional List */}
            {simResults.allOptional.map((code) => {
              const docDef = documentDefinitions.find((d) => d.code === code);
              const isBaseOpt = simResults.baseOptional.includes(code);
              const isActivityOpt = simResults.activityOptional.includes(code);

              return (
                <div
                  key={code}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-slate-500 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        {docDef?.name || code}
                      </span>
                      <p className="text-[10px] text-slate-500">
                        {docDef?.validityRule || 'Documento complementario'} &bull; Código: {code}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isBaseOpt && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-900 text-[10px] font-bold rounded-md border border-blue-200">
                        Opcional Base
                      </span>
                    )}
                    {isActivityOpt && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded-md border border-slate-300">
                        Opcional por Actividad
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                      SI APLICA
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
