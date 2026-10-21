import React, { useState } from 'react';
import {
  X,
  Sliders,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  Percent,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  EvaluationCriterionConfig,
  EvaluationMethodConfig,
} from '../../types';

interface EvaluationMethodConfigModalProps {
  onClose: () => void;
}

export const EvaluationMethodConfigModal: React.FC<EvaluationMethodConfigModalProps> = ({
  onClose,
}) => {
  const {
    evaluationMethod,
    updateEvaluationMethod,
    addEvaluationCriterion,
    updateEvaluationCriterion,
    deleteEvaluationCriterion,
    resetEvaluationMethodToDefault,
    showToast,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'criteria' | 'thresholds' | 'general'>('criteria');

  // Editing Criterion State
  const [editingCriterionId, setEditingCriterionId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<EvaluationCriterionConfig>>({});

  // Adding New Criterion State
  const [isAddingCriterion, setIsAddingCriterion] = useState(false);
  const [newForm, setNewForm] = useState<Omit<EvaluationCriterionConfig, 'id' | 'order'>>({
    name: '',
    category: 'CALIDAD_TECNICA',
    description: '',
    weight: 15,
    appliesTo: 'AMBOS',
    isActive: true,
    minScoreToPass: 70,
  });

  // Thresholds state
  const [thresholds, setThresholds] = useState(
    evaluationMethod.thresholds || {
      sobresalienteMin: evaluationMethod.excellentThreshold ?? 90,
      conformeMin: evaluationMethod.initialPassingScore ?? 70,
      condicionalMin: evaluationMethod.conditionalThreshold ?? 60,
    }
  );

  // Total weight check
  const totalWeight = (evaluationMethod.criteria || [])
    .filter((c) => c.isActive !== false)
    .reduce((sum, c) => sum + (c.weight ?? c.weightInitial ?? 20), 0);

  const handleStartEdit = (crit: EvaluationCriterionConfig) => {
    setEditingCriterionId(crit.id);
    setEditForm({ ...crit });
  };

  const handleSaveEdit = (id: string) => {
    updateEvaluationCriterion(id, editForm);
    setEditingCriterionId(null);
    setEditForm({});
  };

  const handleSaveNewCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim()) {
      showToast('El nombre del criterio es obligatorio.', 'error');
      return;
    }

    addEvaluationCriterion({
      name: newForm.name.trim(),
      category: newForm.category,
      description: newForm.description.trim(),
      weight: Number(newForm.weight) || 10,
      appliesTo: newForm.appliesTo,
      isActive: true,
      minScoreToPass: Number(newForm.minScoreToPass) || 70,
    });

    setIsAddingCriterion(false);
    setNewForm({
      name: '',
      category: 'CALIDAD_TECNICA',
      description: '',
      weight: 15,
      appliesTo: 'AMBOS',
      isActive: true,
      minScoreToPass: 70,
    });
  };

  const handleSaveThresholds = () => {
    updateEvaluationMethod({ thresholds });
    showToast('Umbrales de calificación guardados.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0b1329] text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-cyan-300">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Parametrización del Método de Calificación
              </h3>
              <p className="text-xs text-slate-300">
                Personalización de Criterios, Pesos Ponderados y Umbrales SIG
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setActiveSubTab('criteria')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'criteria'
                  ? 'border-blue-600 text-blue-600 dark:text-cyan-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Criterios y Ponderaciones ({evaluationMethod.criteria.length})
            </button>
            <button
              onClick={() => setActiveSubTab('thresholds')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'thresholds'
                  ? 'border-blue-600 text-blue-600 dark:text-cyan-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Umbrales y Escalas Conceptuales
            </button>
            <button
              onClick={() => setActiveSubTab('general')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'general'
                  ? 'border-blue-600 text-blue-600 dark:text-cyan-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Periodicidad y Frecuencias (1 Año)
            </button>
          </div>

          <button
            onClick={() => {
              if (confirm('¿Restaurar la metodología de evaluación a los valores institucionales SIG por defecto?')) {
                resetEvaluationMethodToDefault();
              }
            }}
            className="text-xs text-slate-500 hover:text-blue-600 dark:hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
            title="Restaurar valores iniciales"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Predeterminado</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800 dark:text-slate-100 text-sm">
          {/* TAB 1: CRITERIA */}
          {activeSubTab === 'criteria' && (
            <div className="space-y-4">
              {/* Weight indicator banner */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  totalWeight === 100
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-cyan-300'
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 shrink-0" />
                  <span>
                    Suma total de ponderación activa:{' '}
                    <strong className="font-mono font-bold text-sm">{totalWeight}%</strong>
                  </span>
                </div>
                {totalWeight !== 100 && (
                  <span className="text-[11px] font-medium">
                    (Se recomienda ajustar los pesos para que sumen 100%)
                  </span>
                )}
                <button
                  onClick={() => setIsAddingCriterion(true)}
                  className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Criterio</span>
                </button>
              </div>

              {/* Add New Criterion Inline Form */}
              {isAddingCriterion && (
                <form
                  onSubmit={handleSaveNewCriterion}
                  className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-blue-400/60 dark:border-blue-700/60 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase">
                      Crear Nuevo Criterio de Calificación
                    </h5>
                    <button
                      type="button"
                      onClick={() => setIsAddingCriterion(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Nombre del Criterio:
                      </label>
                      <input
                        type="text"
                        value={newForm.name}
                        onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                        placeholder="Ej: Cumplimiento de Políticas de Facturación Electrónica"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#121c38] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Categoría SIG:
                      </label>
                      <select
                        value={newForm.category}
                        onChange={(e) => setNewForm({ ...newForm, category: e.target.value as any })}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#121c38] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                      >
                        <option value="CALIDAD_TECNICA">Calidad y Servicio</option>
                        <option value="CUMPLIMIENTO_LEGAL">Jurídico y Cumplimiento</option>
                        <option value="FINANCIERO">Financiero y Facturación</option>
                        <option value="HSEQ_SEGURIDAD">HSEQ / Seguridad Vial</option>
                        <option value="ATENCION_COMERCIAL">Atención y Garantía</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Peso Ponderado (%):
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={newForm.weight}
                        onChange={(e) => setNewForm({ ...newForm, weight: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#121c38] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Aplica en Evento:
                      </label>
                      <select
                        value={newForm.appliesTo}
                        onChange={(e) => setNewForm({ ...newForm, appliesTo: e.target.value as any })}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#121c38] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                      >
                        <option value="AMBOS">Ambas (Inicial y Anual 1 Año)</option>
                        <option value="INICIAL">Solo Inicial (Al Crearlo)</option>
                        <option value="ANUAL_1_ANO">Solo Anual (1 Año Después)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Puntaje Mínimo Esperado:
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={newForm.minScoreToPass}
                        onChange={(e) => setNewForm({ ...newForm, minScoreToPass: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#121c38] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Descripción Guía para el Revisor:
                    </label>
                    <textarea
                      rows={2}
                      value={newForm.description}
                      onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                      placeholder="Explicación de qué se evalúa bajo este criterio..."
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#121c38] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingCriterion(false)}
                      className="px-3 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Guardar Criterio
                    </button>
                  </div>
                </form>
              )}

              {/* Criteria List */}
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#121c38]">
                {evaluationMethod.criteria.map((crit) => {
                  const isEditing = editingCriterionId === crit.id;

                  if (isEditing) {
                    return (
                      <div key={crit.id} className="p-4 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Nombre:
                            </label>
                            <input
                              type="text"
                              value={editForm.name || ''}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full px-3 py-1 text-xs bg-white dark:bg-[#090f20] border border-slate-300 dark:border-slate-700 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Peso (%):
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={editForm.weight || 0}
                              onChange={(e) => setEditForm({ ...editForm, weight: Number(e.target.value) })}
                              className="w-full px-3 py-1 text-xs font-mono font-bold bg-white dark:bg-[#090f20] border border-slate-300 dark:border-slate-700 rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Aplica en Evento:
                            </label>
                            <select
                              value={editForm.appliesTo || 'AMBOS'}
                              onChange={(e) => setEditForm({ ...editForm, appliesTo: e.target.value as any })}
                              className="w-full px-3 py-1 text-xs bg-white dark:bg-[#090f20] border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer"
                            >
                              <option value="AMBOS">Ambas (Inicial y Anual 1 Año)</option>
                              <option value="INICIAL">Solo Inicial (Al Crearlo)</option>
                              <option value="ANUAL_1_ANO">Solo Anual (1 Año Después)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Categoría:
                            </label>
                            <select
                              value={editForm.category || 'CALIDAD_TECNICA'}
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value as any })}
                              className="w-full px-3 py-1 text-xs bg-white dark:bg-[#090f20] border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer"
                            >
                              <option value="CALIDAD_TECNICA">Calidad y Servicio</option>
                              <option value="CUMPLIMIENTO_LEGAL">Jurídico y Cumplimiento</option>
                              <option value="FINANCIERO">Financiero y Facturación</option>
                              <option value="HSEQ_SEGURIDAD">HSEQ / Seguridad Vial</option>
                              <option value="ATENCION_COMERCIAL">Atención y Garantía</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Descripción:
                          </label>
                          <input
                            type="text"
                            value={editForm.description || ''}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full px-3 py-1 text-xs bg-white dark:bg-[#090f20] border border-slate-300 dark:border-slate-700 rounded-lg"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingCriterionId(null)}
                            className="px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 rounded cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(crit.id)}
                            className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-bold cursor-pointer"
                          >
                            Guardar Cambios
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={crit.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{crit.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {crit.category}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.2 rounded font-semibold ${
                              crit.appliesTo === 'AMBOS'
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                : crit.appliesTo === 'INICIAL'
                                ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
                                : 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300'
                            }`}
                          >
                            {crit.appliesTo === 'AMBOS'
                              ? 'Inicial y Anual'
                              : crit.appliesTo === 'INICIAL'
                              ? 'Solo Inicial'
                              : 'Solo Anual (1 Año)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {crit.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="font-mono font-bold text-xs text-blue-700 dark:text-cyan-400">
                            {crit.weight ?? crit.weightInitial ?? 20}%
                          </span>
                          <span className="text-[10px] text-slate-400 block">peso</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(crit)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Editar criterio"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar el criterio "${crit.name}"?`)) {
                                deleteEvaluationCriterion(crit.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Eliminar criterio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: THRESHOLDS */}
          {activeSubTab === 'thresholds' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Escalas de Calificación y Umbrales Conceptuales
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define la puntuación mínima requerida para clasificar el dictamen del proveedor en el SIG.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-white dark:bg-[#121c38] rounded-xl border border-blue-300 dark:border-blue-800">
                    <div className="text-xs font-bold text-blue-800 dark:text-cyan-300 uppercase mb-1">
                      Sobresaliente (Mínimo)
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={80}
                        max={100}
                        value={thresholds.sobresalienteMin}
                        onChange={(e) =>
                          setThresholds({ ...thresholds, sobresalienteMin: Number(e.target.value) })
                        }
                        className="w-20 px-2 py-1 text-center font-mono font-bold text-sm bg-slate-50 dark:bg-[#090f20] border rounded-lg"
                      />
                      <span className="text-xs text-slate-500">puntos (90-100)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Proveedor apto sin observaciones.
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-[#121c38] rounded-xl border border-blue-300 dark:border-blue-800">
                    <div className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase mb-1">
                      Conforme (Mínimo)
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={65}
                        max={89}
                        value={thresholds.conformeMin}
                        onChange={(e) =>
                          setThresholds({ ...thresholds, conformeMin: Number(e.target.value) })
                        }
                        className="w-20 px-2 py-1 text-center font-mono font-bold text-sm bg-slate-50 dark:bg-[#090f20] border rounded-lg"
                      />
                      <span className="text-xs text-slate-500">puntos (75-89)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Aprobado con requisitos cumplidos.
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-[#121c38] rounded-xl border border-slate-300 dark:border-slate-700">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase mb-1">
                      Condicional (Mínimo)
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={50}
                        max={74}
                        value={thresholds.condicionalMin}
                        onChange={(e) =>
                          setThresholds({ ...thresholds, condicionalMin: Number(e.target.value) })
                        }
                        className="w-20 px-2 py-1 text-center font-mono font-bold text-sm bg-slate-50 dark:bg-[#090f20] border rounded-lg"
                      />
                      <span className="text-xs text-slate-500">puntos (60-74)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Requiere Plan de Acción Correctiva.
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveThresholds}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Guardar Umbrales
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GENERAL & FREQUENCIES */}
          {activeSubTab === 'general' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Reglas de Periodicidad de Evaluación de Proveedores
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Conforme al requerimiento institucional de Flota Sugamuxi S.A.:
                  </p>
                </div>

                <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                  <div className="p-3 bg-white dark:bg-[#121c38] rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                      1
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        Evaluación Inicial (Al Crearlo)
                      </div>
                      <p className="text-slate-500 mt-0.5">
                        Se aplica en el momento de la creación, habilitación o admisión del expediente del proveedor. Evalúa idoneidad jurídica, antecedentes SARLAFT, capacidad instalada y documentación básica.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-[#121c38] rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                      2
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        Evaluación Anual de Desempeño (1 Año Después)
                      </div>
                      <p className="text-slate-500 mt-0.5">
                        Se programa automáticamente exactamente a los <strong className="text-blue-600 dark:text-cyan-400">365 días (1 año)</strong> contados desde la fecha oficial de registro del proveedor. Mide calidad en la entrega, soporte postventa, cumplimiento de garantías y estándares HSEQ.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 dark:bg-[#090f20] border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar Parametrización
          </button>
        </div>
      </div>
    </div>
  );
};
