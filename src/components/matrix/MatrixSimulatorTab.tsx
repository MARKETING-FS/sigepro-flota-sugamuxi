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
      <div className="fs-card p-6 rounded-2xl space-y-6">
        <div className="max-w-3xl">
          <h2 className="text-base font-bold text-[#0b1d3a] dark:text-white flex items-center gap-2">
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
            <label className="block text-xs font-bold text-[#1d3b63] dark:text-slate-300 mb-1">
              1. Seleccione Tipo de Persona del Aspirante:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSimRegimen('NATURAL')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  simRegimen === 'NATURAL'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white dark:bg-white/5 text-[#1c3354] dark:text-white border-[#d9e3ef] dark:border-white/15 hover:bg-[#eef5fc] dark:hover:bg-white/10'
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
                    : 'bg-white dark:bg-white/5 text-[#1c3354] dark:text-white border-[#d9e3ef] dark:border-white/15 hover:bg-[#eef5fc] dark:hover:bg-white/10'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Persona Jurídica</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1d3b63] dark:text-slate-300 mb-1">
              2. Seleccione Actividad Económica o Servicio:
            </label>
            <select
              value={simCategory}
              onChange={(e) => setSimCategory(e.target.value)}
              className="fs-card w-full border-slate-300 rounded-2xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
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
        <div className="relative overflow-hidden bg-gradient-action text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-glow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl glass-dark text-white flex items-center justify-center shrink-0 font-display font-semibold text-xl">
              =
            </div>
            <div>
              <span className="text-[10px] text-white/75 font-semibold uppercase tracking-[0.18em] block">
                Fórmula de Exigibilidad Aplicada:
              </span>
              <div className="text-xs font-bold text-white flex items-center gap-2 flex-wrap mt-0.5">
                <span>{(simResults?.baseMandatory || []).length} Base ({simRegimen === 'NATURAL' ? 'P. Natural' : 'P. Jurídica'})</span>
                <span>+</span>
                <span>{(simResults?.activityMandatory || []).length} Específicos ({simCategory})</span>
                <span>+</span>
                <span>2 Formatos Institucionales SIG</span>
                <span>=</span>
                <strong className="text-white text-base font-display font-semibold">
                  {(simResults?.allMandatory || []).length + 2} Documentos Obligatorios Bloqueantes
                </strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="glass-dark text-white px-3 py-1.5 rounded-lg">
              {(simResults?.allMandatory || []).length + 2} Total Obligatorios
            </span>
            <span className="glass-dark text-white/80 px-3 py-1.5 rounded-lg">
              {(simResults?.allOptional || []).length} Opcionales
            </span>
          </div>
        </div>

        {/* Inactive Documents Note if Any */}
        {inactiveDocs.length > 0 && (
          <div className="p-3 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl border border-black/10 dark:border-white/10 flex items-center gap-2 text-xs text-[#3a5274] dark:text-slate-300">
            <Info className="w-4 h-4 text-[#5d7392] dark:text-slate-400 shrink-0" />
            <span>
              <strong>{inactiveDocs.length} documentos inactivos</strong> en el catálogo están siendo excluidos de esta simulación automáticamente.
            </span>
          </div>
        )}

        {/* Generated Checklist Preview */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-black text-[#0b1d3a] dark:text-white uppercase tracking-wider">
            Desglose de Documentos Exigidos en el Proceso de Radicación:
          </h3>

          <div className="space-y-2">
            {/* Fixed institutional formats */}
            <div className="p-3.5 bg-[#2c84c4]/10 border border-[#2c84c4]/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#2c84c4] dark:text-[#69bdd7] shrink-0" />
                <div>
                  <span className="text-xs font-bold text-[#0b1d3a] dark:text-white">
                    Formulario de Inscripción y Actualización (FS.GA-FOR-009)
                  </span>
                  <p className="text-[10px] text-[#3a5274] dark:text-slate-400">Formato oficial institucional vigente versión 14.0</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 bg-gradient-action text-white text-[10px] font-bold rounded-full shadow-glow">
                OBLIGATORIO INSTITUCIONAL
              </span>
            </div>

            <div className="p-3.5 bg-[#2c84c4]/10 border border-[#2c84c4]/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#2c84c4] dark:text-[#69bdd7] shrink-0" />
                <div>
                  <span className="text-xs font-bold text-[#0b1d3a] dark:text-white">
                    Autorización de Tratamiento de Datos Personales (FS.GA-FOR-039)
                  </span>
                  <p className="text-[10px] text-[#3a5274] dark:text-slate-400">Cumplimiento Ley 1581 de 2012 Habeas Data</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 bg-gradient-action text-white text-[10px] font-bold rounded-full shadow-glow">
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
                  className="p-3.5 bg-[#2c84c4]/[0.07] border border-[#2c84c4]/25 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2c84c4] dark:text-[#69bdd7] shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-[#0b1d3a] dark:text-white">
                        {docDef?.name || code}
                      </span>
                      <p className="text-[10px] text-[#3a5274] dark:text-slate-400">
                        {docDef?.validityRule || 'Documento exigible'} &bull; Código: {code}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isBase && (
                      <span className="px-2 py-0.5 bg-[#2c84c4]/15 text-[#1d5fa8] dark:text-[#69bdd7] text-[10px] font-bold rounded-md border border-[#2c84c4]/30 flex items-center gap-1">
                        <User className="w-2.5 h-2.5" /> Requisito Base ({simRegimen === 'NATURAL' ? 'P. Natural' : 'P. Jurídica'})
                      </span>
                    )}
                    {isActivity && (
                      <span className="px-2 py-0.5 bg-black/5 dark:bg-white/10 text-[#0b1d3a] dark:text-white text-[10px] font-bold rounded-md border border-black/10 dark:border-white/15 flex items-center gap-1">
                        <Briefcase className="w-2.5 h-2.5" /> Requisito por Actividad ({simCategory})
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 bg-[#131b2e] dark:bg-white/15 text-white text-[10px] font-bold rounded-full">
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
                  className="p-3.5 bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-[#5d7392] dark:text-slate-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-[#0b1d3a] dark:text-white">
                        {docDef?.name || code}
                      </span>
                      <p className="text-[10px] text-[#3a5274] dark:text-slate-400">
                        {docDef?.validityRule || 'Documento complementario'} &bull; Código: {code}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isBaseOpt && (
                      <span className="px-2 py-0.5 bg-[#2c84c4]/15 text-[#1d5fa8] dark:text-[#69bdd7] text-[10px] font-bold rounded-md border border-[#2c84c4]/30">
                        Opcional Base
                      </span>
                    )}
                    {isActivityOpt && (
                      <span className="px-2 py-0.5 bg-black/5 dark:bg-white/10 text-[#0b1d3a] dark:text-white text-[10px] font-bold rounded-md border border-black/10 dark:border-white/15">
                        Opcional por Actividad
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 bg-[#2c84c4] text-white text-[10px] font-bold rounded-full">
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
