import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useConfirm } from '../ui/ConfirmDialog';
import { DocumentDefinition } from '../../types';
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  Calendar,
  Layers,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
} from 'lucide-react';

interface DocumentCatalogTabProps {
  onShowToast: (message: string, type?: 'success' | 'error') => void;
  onOpenNewDocModal: () => void;
}

export const DocumentCatalogTab: React.FC<DocumentCatalogTabProps> = ({
  onShowToast,
  onOpenNewDocModal,
}) => {
  const {
    documentDefinitions,
    updateDocumentDefinition,
    deleteDocumentDefinition,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Edit document modal state
  const [editingDoc, setEditingDoc] = useState<DocumentDefinition | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<DocumentDefinition['category']>('LEGAL');
  const [editDescription, setEditDescription] = useState('');
  const [editValidityRule, setEditValidityRule] = useState('');
  const [editRequiresExp, setEditRequiresExp] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documentDefinitions.filter((doc) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        doc.name.toLowerCase().includes(q) ||
        doc.code.toLowerCase().includes(q) ||
        (doc.description && doc.description.toLowerCase().includes(q)) ||
        (doc.validityRule && doc.validityRule.toLowerCase().includes(q));

      const matchesCat =
        selectedCategoryFilter === 'ALL' || doc.category === selectedCategoryFilter;

      const isAct = doc.isActive !== false;
      const matchesStatus =
        selectedStatusFilter === 'ALL' ||
        (selectedStatusFilter === 'ACTIVE' && isAct) ||
        (selectedStatusFilter === 'INACTIVE' && !isAct);

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [documentDefinitions, searchQuery, selectedCategoryFilter, selectedStatusFilter]);

  // Counts
  const totalCount = documentDefinitions.length;
  const activeCount = documentDefinitions.filter((d) => d.isActive !== false).length;
  const inactiveCount = totalCount - activeCount;

  // Open edit modal
  const handleOpenEdit = (doc: DocumentDefinition) => {
    setEditingDoc(doc);
    setEditName(doc.name);
    setEditCategory(doc.category);
    setEditDescription(doc.description || '');
    setEditValidityRule(doc.validityRule || '');
    setEditRequiresExp(!!doc.requiresExpirationDate);
    setEditIsActive(doc.isActive !== false);
  };

  // Save edit document
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    if (!editName.trim()) {
      onShowToast('El nombre del documento es obligatorio.', 'error');
      return;
    }

    updateDocumentDefinition(editingDoc.code, {
      name: editName.trim(),
      category: editCategory,
      description: editDescription.trim(),
      validityRule: editValidityRule.trim(),
      requiresExpirationDate: editRequiresExp,
      isActive: editIsActive,
    });

    onShowToast(`Documento "${editName.trim()}" actualizado correctamente.`);
    setEditingDoc(null);
  };

  const { ask, dialog } = useConfirm();

  // Quick toggle active / inactive
  const doToggleDocActive = (doc: DocumentDefinition) => {
    const newStatus = !(doc.isActive !== false);
    updateDocumentDefinition(doc.code, { isActive: newStatus });
    onShowToast(
      `Documento "${doc.name}" ${newStatus ? 'ACTIVADO' : 'INACTIVADO'}. ${
        !newStatus ? 'Se omitirá de nuevos checklists de radicación.' : ''
      }`
    );
  };

  const handleToggleDocActive = (doc: DocumentDefinition) => {
    if (doc.isActive === false) {
      doToggleDocActive(doc);
      return;
    }
    ask({
      title: `¿Inactivar «${doc.name}»?`,
      message: 'Se omitirá de los nuevos checklists de radicación. Los expedientes ya radicados no se borran.',
      hint: 'Podrá volver a activarlo cuando quiera con el botón «Activar» de esta misma fila (filtro «Inactivos»).',
      onConfirm: () => doToggleDocActive(doc),
    });
  };

  return (
    <div className="space-y-6">
      {dialog}
      {/* Top Header & Stats */}
      <div className="fs-card p-4 sm:p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-[#0b1d3a] dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#2c84c4] dark:text-[#69bdd7]" />
              <span>Catálogo Maestro de Tipos Documentales SIG</span>
              <span className="text-[10px] bg-[#2c84c4]/15 text-[#1d5fa8] dark:text-[#69bdd7] font-bold px-2 py-0.5 rounded-full">
                Control Total de Administrador
              </span>
            </h2>
            <p className="text-xs text-[#3a5274] dark:text-slate-400">
              Gestione, active, inactive o modifique las reglas, descripciones y tipos de soporte documental reconocidos por Flota Sugamuxi S.A.
            </p>
          </div>

          <button
            onClick={onOpenNewDocModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-action text-white text-xs font-semibold rounded-xl shadow-glow hover:opacity-95 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nuevo Documento</span>
          </button>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-black/[0.07] dark:border-white/10">
          <div className="p-3 bg-black/[0.03] dark:bg-white/[0.04] rounded-xl border border-black/10 dark:border-white/10">
            <span className="text-[10px] font-semibold text-[#3a5274] dark:text-slate-400 uppercase tracking-wider block">Total Catálogo</span>
            <strong className="font-display text-xl font-semibold text-[#0b1d3a] dark:text-white">{totalCount}</strong>
          </div>
          <div className="p-3 bg-[#2c84c4]/10 rounded-xl border border-[#2c84c4]/30">
            <span className="text-[10px] font-semibold text-[#1d5fa8] dark:text-[#69bdd7] uppercase tracking-wider block">Documentos Activos</span>
            <strong className="font-display text-xl font-semibold text-[#1d5fa8] dark:text-[#69bdd7]">{activeCount}</strong>
          </div>
          <div className="p-3 bg-black/[0.05] dark:bg-white/[0.06] rounded-xl border border-black/10 dark:border-white/15">
            <span className="text-[10px] font-semibold text-[#3a5274] dark:text-slate-400 uppercase tracking-wider block">Documentos Inactivos</span>
            <strong className="font-display text-xl font-semibold text-[#3a5274] dark:text-slate-300">{inactiveCount}</strong>
          </div>
          <div className="p-3 bg-[#2c84c4]/10 rounded-xl border border-[#2c84c4]/30">
            <span className="text-[10px] font-semibold text-[#1d5fa8] dark:text-[#69bdd7] uppercase tracking-wider block">Formatos SIG Fijos</span>
            <strong className="font-display text-xl font-semibold text-[#1d5fa8] dark:text-[#69bdd7]">2</strong>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-black/[0.07] dark:border-white/10">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar documento por código, nombre o pauta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-white/5 border border-[#d9e3ef] dark:border-white/15 rounded-xl text-xs text-[#0b1d3a] dark:text-white focus:outline-none focus:border-[#2c84c4]"
            />
          </div>

          {/* Category SIG Filter */}
          <div className="flex items-center gap-1 bg-white dark:bg-white/5 p-1 rounded-xl border border-[#d9e3ef] dark:border-white/15 text-xs">
            <span className="text-[#5d7392] dark:text-slate-400 font-semibold px-2 text-[10px]">CATEGORÍA:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#0b1d3a] dark:text-white focus:outline-none cursor-pointer pr-2"
            >
              <option value="ALL">Todas las Categorías</option>
              <option value="LEGAL">Legal / Estatutaria</option>
              <option value="FINANCIERO">Financiera / Tributaria</option>
              <option value="TECNICO">Técnica / Experiencia</option>
              <option value="HSEQ">HSEQ & Ambiental</option>
              <option value="SARLAFT">SARLAFT & Cumplimiento</option>
              <option value="OPERATIVO">Operativa & Logística</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-white dark:bg-white/5 p-1 rounded-xl border border-[#d9e3ef] dark:border-white/15 text-xs">
            <span className="text-[#5d7392] dark:text-slate-400 font-semibold px-2 text-[10px]">ESTADO:</span>
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                  selectedStatusFilter === st
                    ? 'bg-gradient-action text-white shadow-glow'
                    : 'text-[#3a5274] dark:text-slate-300 hover:text-[#0b1d3a] dark:hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'Todos' : st === 'ACTIVE' ? 'Activos' : 'Inactivos'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.length === 0 ? (
          <div className="fs-card col-span-full p-12 rounded-2xl text-center text-[#3a5274] dark:text-slate-400 text-xs">
            No se encontraron documentos en el catálogo con los filtros especificados.
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isInstitutional = doc.code === 'FS_GA_FOR_009' || doc.code === 'FS_GA_FOR_039';
            const isAct = doc.isActive !== false;

            const categoryColors: Record<string, string> = {
              LEGAL: 'bg-[#2c84c4]/12 text-[#1d5fa8] dark:text-[#69bdd7] border-[#2c84c4]/30',
              FINANCIERO: 'bg-[#2c84c4]/12 text-[#1d5fa8] dark:text-[#69bdd7] border-[#2c84c4]/30',
              TECNICO: 'bg-black/5 dark:bg-white/10 text-[#0b1d3a] dark:text-white border-black/10 dark:border-white/15',
              HSEQ: 'bg-[#69bdd7]/15 text-[#0e6d8a] dark:text-[#69bdd7] border-[#69bdd7]/40',
              SARLAFT: 'bg-[#2c84c4]/12 text-[#1d5fa8] dark:text-[#69bdd7] border-[#2c84c4]/30',
              OPERATIVO: 'bg-black/5 dark:bg-white/10 text-[#3a5274] dark:text-slate-300 border-black/10 dark:border-white/15',
            };

            return (
              <div
                key={doc.code}
                className={`fs-card lift p-4 rounded-2xl flex flex-col justify-between space-y-3 transition-all ${
                  !isAct ? 'opacity-60' : ''
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[#3a5274] dark:text-slate-300 tabular-nums">
                      {doc.code}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        isAct
                          ? 'bg-[#2c84c4]/15 text-[#1d5fa8] dark:text-[#69bdd7] border-[#2c84c4]/30'
                          : 'bg-black/5 dark:bg-white/10 text-[#3a5274] dark:text-slate-400 border-black/10 dark:border-white/15'
                      }`}
                    >
                      {isAct ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </div>

                  <h4 className="font-display text-[13px] font-semibold text-[#0b1d3a] dark:text-white leading-snug">
                    {doc.name}
                  </h4>

                  <p className="text-[11px] text-[#3a5274] dark:text-slate-400 line-clamp-2">
                    {doc.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-black/[0.07] dark:border-white/10 space-y-1.5 text-[10px] text-[#3a5274] dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="text-[#5d7392] dark:text-slate-500">Categoría SIG:</span>
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded border text-xs ${
                        categoryColors[doc.category] || 'bg-black/5 dark:bg-white/10 text-[#3a5274] dark:text-slate-300'
                      }`}
                    >
                      {doc.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5d7392] dark:text-slate-500">Regla Vigencia:</span>
                    <span className="font-semibold text-[#0b1d3a] dark:text-slate-200 truncate max-w-[170px]" title={doc.validityRule}>
                      {doc.validityRule || 'No especificada'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#5d7392] dark:text-slate-500">Fecha Vencimiento:</span>
                    <span className="font-semibold text-[#0b1d3a] dark:text-slate-200">
                      {doc.requiresExpirationDate ? 'Exigida al radicar' : 'No requerida'}
                    </span>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-3 border-t border-black/[0.07] dark:border-white/10 flex items-center justify-between text-xs">
                  {isInstitutional ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] text-[#1d5fa8] dark:text-[#69bdd7] font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Formato Institucional SIG
                      </span>
                      <button
                        onClick={() => handleOpenEdit(doc)}
                        className="p-1.5 text-[#2c84c4] dark:text-[#69bdd7] hover:bg-[#2c84c4]/10 rounded-lg transition-colors cursor-pointer border border-[#2c84c4]/30"
                        title="Editar parámetros del formato institucional"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Inactivate / Activate button */}
                      <button
                        onClick={() => handleToggleDocActive(doc)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                          isAct
                            ? 'bg-black/5 dark:bg-white/10 text-[#3a5274] dark:text-slate-200 hover:bg-black/10 dark:hover:bg-white/15 border-black/10 dark:border-white/15'
                            : 'bg-gradient-action text-white border-transparent shadow-glow'
                        }`}
                        title={isAct ? 'Inactivar documento' : 'Activar documento'}
                      >
                        {isAct ? 'Inactivar' : 'Activar'}
                      </button>

                      <div className="flex items-center gap-1">
                        {/* Edit button */}
                        <button
                          onClick={() => handleOpenEdit(doc)}
                          className="p-1.5 text-[#2c84c4] dark:text-[#69bdd7] hover:bg-[#2c84c4]/10 rounded-lg transition-colors cursor-pointer border border-black/10 dark:border-white/15"
                          title="Editar todos los campos del documento"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `¿Está seguro de eliminar permanentemente el tipo de documento "${doc.name}"? Se desvinculará de los requisitos base y de todas las actividades.`
                              )
                            ) {
                              const res = deleteDocumentDefinition(doc.code);
                              if (res.success) onShowToast(res.message);
                              else onShowToast(res.message, 'error');
                            }
                          }}
                          className="p-1.5 text-[#5d7392] dark:text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer border border-black/10 dark:border-white/15"
                          title="Eliminar documento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Editar Documento */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="fs-card rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="bg-[#0b1329] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-cyan-300">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Editar Tipo de Documento</h3>
                  <p className="text-[11px] text-cyan-300 tabular-nums">{editingDoc.code}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingDoc(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo del Documento *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Categoría SIG
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e: any) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="LEGAL">Legal / Estatutaria</option>
                    <option value="FINANCIERO">Financiera / Tributaria</option>
                    <option value="TECNICO">Técnica / Experiencia</option>
                    <option value="HSEQ">HSEQ & Ambiental</option>
                    <option value="SARLAFT">SARLAFT & Cumplimiento</option>
                    <option value="OPERATIVO">Operativa & Logística</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estado de Disponibilidad
                  </label>
                  <select
                    value={editIsActive ? 'ACTIVE' : 'INACTIVE'}
                    onChange={(e) => setEditIsActive(e.target.value === 'ACTIVE')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ACTIVE">Activo (Disponible en matrices)</option>
                    <option value="INACTIVE">Inactivo (Excluido de radicación)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción y Requisitos de Contenido
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Regla de Validez, Caducidad o Vigencia *
                </label>
                <input
                  type="text"
                  required
                  value={editValidityRule}
                  onChange={(e) => setEditValidityRule(e.target.value)}
                  placeholder="Ej: Expedición no mayor a 30 días calendario..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editRequiresExp"
                  checked={editRequiresExp}
                  onChange={(e) => setEditRequiresExp(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="editRequiresExp" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Exigir fecha de vencimiento obligatoria al radicar
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-2xs cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
