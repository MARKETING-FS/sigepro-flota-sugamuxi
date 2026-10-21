import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
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

  // Quick toggle active / inactive
  const handleToggleDocActive = (doc: DocumentDefinition) => {
    const newStatus = !(doc.isActive !== false);
    updateDocumentDefinition(doc.code, { isActive: newStatus });
    onShowToast(
      `Documento "${doc.name}" ${newStatus ? 'ACTIVADO' : 'INACTIVADO'}. ${
        !newStatus ? 'Se omitirá de nuevos checklists de radicación.' : ''
      }`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Stats */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Catálogo Maestro de Tipos Documentales SIG</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                Control Total de Administrador
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Gestione, active, inactive o modifique las reglas, descripciones y tipos de soporte documental reconocidos por Flota Sugamuxi S.A.
            </p>
          </div>

          <button
            onClick={onOpenNewDocModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nuevo Documento</span>
          </button>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Catálogo</span>
            <strong className="text-lg font-black text-slate-900">{totalCount}</strong>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
            <span className="text-[10px] font-bold text-blue-700 uppercase block">Documentos Activos</span>
            <strong className="text-lg font-black text-blue-800">{activeCount}</strong>
          </div>
          <div className="p-3 bg-slate-100 rounded-xl border border-slate-300">
            <span className="text-[10px] font-bold text-slate-600 uppercase block">Documentos Inactivos</span>
            <strong className="text-lg font-black text-slate-700">{inactiveCount}</strong>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
            <span className="text-[10px] font-bold text-blue-700 uppercase block">Formatos SIG Fijos</span>
            <strong className="text-lg font-black text-blue-800">2</strong>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar documento por código, nombre o pauta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category SIG Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-400 font-bold px-2 text-[10px]">CATEGORÍA:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-2"
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
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-400 font-bold px-2 text-[10px]">ESTADO:</span>
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                  selectedStatusFilter === st
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
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
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
            No se encontraron documentos en el catálogo con los filtros especificados.
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isInstitutional = doc.code === 'FS_GA_FOR_009' || doc.code === 'FS_GA_FOR_039';
            const isAct = doc.isActive !== false;

            const categoryColors: Record<string, string> = {
              LEGAL: 'bg-blue-50 text-blue-800 border-blue-200',
              FINANCIERO: 'bg-blue-50 text-blue-700 border-blue-200',
              TECNICO: 'bg-slate-100 text-slate-800 border-slate-200',
              HSEQ: 'bg-cyan-50 text-cyan-800 border-cyan-200',
              SARLAFT: 'bg-blue-50 text-blue-800 border-blue-200',
              OPERATIVO: 'bg-slate-100 text-slate-700 border-slate-200',
            };

            return (
              <div
                key={doc.code}
                className={`bg-white p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
                  !isAct
                    ? 'border-slate-200 bg-slate-50/60 opacity-70'
                    : 'border-slate-200 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                      {doc.code}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        isAct
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-slate-200 text-slate-600 border-slate-300'
                      }`}
                    >
                      {isAct ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {doc.name}
                  </h4>

                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {doc.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[10px] text-slate-500">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Categoría SIG:</span>
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded border text-[9px] ${
                        categoryColors[doc.category] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {doc.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Regla Vigencia:</span>
                    <span className="font-semibold text-slate-700 truncate max-w-[170px]" title={doc.validityRule}>
                      {doc.validityRule || 'No especificada'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Fecha Vencimiento:</span>
                    <span className="font-semibold text-slate-700">
                      {doc.requiresExpirationDate ? 'Exigida al radicar' : 'No requerida'}
                    </span>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  {isInstitutional ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] text-blue-700 font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Formato Institucional SIG
                      </span>
                      <button
                        onClick={() => handleOpenEdit(doc)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-blue-200"
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
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-300'
                            : 'bg-blue-600 text-white hover:bg-blue-500 border-blue-600'
                        }`}
                        title={isAct ? 'Inactivar documento' : 'Activar documento'}
                      >
                        {isAct ? 'Inactivar' : 'Activar'}
                      </button>

                      <div className="flex items-center gap-1">
                        {/* Edit button */}
                        <button
                          onClick={() => handleOpenEdit(doc)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
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
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"
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
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="bg-[#0b1329] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-cyan-300">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Editar Tipo de Documento</h3>
                  <p className="text-[11px] text-cyan-300 font-mono">{editingDoc.code}</p>
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
