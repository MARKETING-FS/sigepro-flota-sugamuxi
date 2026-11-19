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
    baseRequirementsConfig,
    categoriesConfig,
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

  const handleDeleteDoc = (doc: DocumentDefinition) =>
    ask({
      title: `¿Eliminar «${doc.name}»?`,
      message: 'Se elimina de forma permanente el tipo de documento y se desvincula de los requisitos base y de todas las actividades.',
      hint: 'Los expedientes que ya lo tienen cargado conservan el archivo.',
      confirmLabel: 'Sí, eliminar',
      onConfirm: () => {
        const res = deleteDocumentDefinition(doc.code);
        onShowToast(res.message, res.success ? 'success' : 'error');
      },
    });

  // ¿De dónde sale cada documento? Se arma a partir de los requisitos base y de las actividades económicas
  const INSTITUTIONAL = ['FS_GA_FOR_009', 'FS_GA_FOR_039'];
  const origin = useMemo(() => {
    const nat = new Set<string>([...(baseRequirementsConfig?.NATURAL?.mandatoryDocs || []), ...(baseRequirementsConfig?.NATURAL?.optionalDocs || [])]);
    const jur = new Set<string>([...(baseRequirementsConfig?.JURIDICA?.mandatoryDocs || []), ...(baseRequirementsConfig?.JURIDICA?.optionalDocs || [])]);
    const catCodes = (c: (typeof categoriesConfig)[number]) =>
      Array.from(new Set([...(c.mandatoryForJuridica || []), ...(c.mandatoryForNatural || []), ...(c.optionalForJuridica || []), ...(c.optionalForNatural || [])]));
    const usedBy = new Map<string, string[]>();
    categoriesConfig.forEach((c) => catCodes(c).forEach((code) => usedBy.set(code, [...(usedBy.get(code) || []), c.category])));
    return { nat, jur, usedBy, catCodes };
  }, [baseRequirementsConfig, categoriesConfig]);

  const sections = useMemo(() => {
    const byCode = new Map(filteredDocs.map((d) => [d.code, d]));
    const isBase = (code: string) => origin.nat.has(code) || origin.jur.has(code);
    const inst = filteredDocs.filter((d) => INSTITUTIONAL.includes(d.code));
    const both = filteredDocs.filter((d) => !INSTITUTIONAL.includes(d.code) && origin.nat.has(d.code) && origin.jur.has(d.code));
    const onlyNat = filteredDocs.filter((d) => !INSTITUTIONAL.includes(d.code) && origin.nat.has(d.code) && !origin.jur.has(d.code));
    const onlyJur = filteredDocs.filter((d) => !INSTITUTIONAL.includes(d.code) && origin.jur.has(d.code) && !origin.nat.has(d.code));
    const activities = categoriesConfig
      .map((c) => ({
        name: c.category,
        riskLevel: c.riskLevel,
        docs: origin.catCodes(c).filter((code) => !isBase(code) && !INSTITUTIONAL.includes(code)).map((code) => byCode.get(code)).filter(Boolean) as DocumentDefinition[],
      }))
      .filter((a) => a.docs.length > 0);
    const unused = filteredDocs.filter((d) => !INSTITUTIONAL.includes(d.code) && !isBase(d.code) && !origin.usedBy.has(d.code));
    return { inst, both, onlyNat, onlyJur, activities, unused };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredDocs, origin, categoriesConfig]);

  const renderDocRow = (doc: DocumentDefinition, ctx: { currentCategory?: string }) => {
    const isInstitutional = INSTITUTIONAL.includes(doc.code);
    const isAct = doc.isActive !== false;
    const others = (origin.usedBy.get(doc.code) || []).filter((n) => n !== ctx.currentCategory);
    const inNat = origin.nat.has(doc.code);
    const inJur = origin.jur.has(doc.code);
    return (
      <div key={`${ctx.currentCategory || 'x'}-${doc.code}`} className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${!isAct ? 'opacity-60' : ''}`}>
        <div className="min-w-0 space-y-1">
          <p className="font-display text-[13px] font-semibold text-[#0b1d3a] dark:text-white leading-snug">{doc.name}</p>
          <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] text-[#5d7392] dark:text-slate-400">
            {(inNat || inJur) && (
              <span className="font-semibold text-[#1d5fa8] dark:text-[#69bdd7]">
                Se pide a: {inNat && inJur ? 'persona natural y jurídica' : inNat ? 'persona natural' : 'persona jurídica'}
              </span>
            )}
            {!inNat && !inJur && others.length > 0 && <span>También en: {others.join(' · ')}</span>}
            {!isAct && <span className="font-bold">INACTIVO</span>}
            <span>{doc.requiresExpirationDate ? 'Pide fecha de vencimiento' : 'Sin vencimiento'}</span>
            <span className="font-mono opacity-70">{doc.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isInstitutional ? (
            <span className="text-[10px] text-[#1d5fa8] dark:text-[#69bdd7] font-bold flex items-center gap-1 mr-1">
              <Lock className="w-3 h-3" /> Formato fijo
            </span>
          ) : (
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
          )}
          <button
            onClick={() => handleOpenEdit(doc)}
            className="p-1.5 text-[#2c84c4] dark:text-[#69bdd7] hover:bg-[#2c84c4]/10 rounded-lg transition-colors cursor-pointer border border-black/10 dark:border-white/15"
            title="Editar el documento"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          {!isInstitutional && (
            <button
              onClick={() => handleDeleteDoc(doc)}
              className="p-1.5 text-[#5d7392] dark:text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer border border-black/10 dark:border-white/15"
              title="Eliminar documento"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderSection = (title: string, hint: string, docs: DocumentDefinition[], ctx: { currentCategory?: string } = {}, collapsible = false) => {
    if (docs.length === 0) return null;
    const head = (
      <div className="min-w-0">
        <p className="font-display text-sm font-semibold text-[#0b1d3a] dark:text-white">{title}</p>
        <p className="text-[11.5px] text-[#5d7392] dark:text-slate-400">{hint}</p>
      </div>
    );
    const count = <span className="text-[11px] font-bold text-[#1d5fa8] dark:text-[#69bdd7] whitespace-nowrap">{docs.length} documento{docs.length === 1 ? '' : 's'}</span>;
    const rows = <div className="divide-y divide-black/10 dark:divide-white/10">{docs.map((d) => renderDocRow(d, ctx))}</div>;
    return collapsible ? (
      <details key={title} className="fs-card rounded-2xl overflow-hidden group" open={searchQuery !== ''}>
        <summary className="px-4 py-3 bg-[#2c84c4]/[0.07] dark:bg-white/[0.04] flex flex-wrap items-center justify-between gap-2 cursor-pointer list-none">
          {head}
          {count}
        </summary>
        {rows}
      </details>
    ) : (
      <section key={title} className="fs-card rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-[#2c84c4]/[0.07] dark:bg-white/[0.04] flex flex-wrap items-center justify-between gap-2">
          {head}
          {count}
        </div>
        {rows}
      </section>
    );
  };

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

      {/* Documentos agrupados por origen */}
      <div className="space-y-5">
        {filteredDocs.length === 0 ? (
          <div className="fs-card p-12 rounded-2xl text-center text-[#3a5274] dark:text-slate-400 text-xs">
            No se encontraron documentos en el catálogo con los filtros especificados.
          </div>
        ) : (
          <>
            {renderSection('Formatos institucionales', 'Los dos formatos de Flota Sugamuxi que todo proveedor diligencia (FS.GA-FOR-009 y FS.GA-FOR-039).', sections.inst)}
            {renderSection('Documentos de toda persona (natural y jurídica)', 'Formulario FS.GA-FOR-009, sección XII: se piden a todos los proveedores, sin importar su actividad.', sections.both)}
            {renderSection('Documentos solo de persona natural', 'Formulario FS.GA-FOR-009, sección XII, numeral 1.', sections.onlyNat)}
            {renderSection('Documentos solo de persona jurídica', 'Formulario FS.GA-FOR-009, sección XII, numeral 2, y SG-SST (sección XIV).', sections.onlyJur)}
            {sections.activities.length > 0 && (
              <div className="pt-1">
                <p className="font-display text-sm font-semibold text-[#0b1d3a] dark:text-white">Requisitos por actividad económica</p>
                <p className="text-[11.5px] text-[#5d7392] dark:text-slate-400 mb-3">
                  Formulario FS.GA-FOR-009, sección XIII: lo que se pide además de los documentos de la persona, según la categoría del proveedor.
                </p>
                <div className="space-y-3">
                  {sections.activities.map((a) =>
                    renderSection(a.name, a.riskLevel ? `Riesgo ${a.riskLevel}` : 'Documentos propios de esta actividad', a.docs, { currentCategory: a.name }, true)
                  )}
                </div>
              </div>
            )}
            {renderSection('Sin uso en ninguna lista', 'Están en el catálogo pero ningún requisito base ni actividad los pide. Se pueden eliminar o asignar a una actividad.', sections.unused)}
          </>
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
