import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useConfirm } from '../ui/ConfirmDialog';
import { BrandSwoosh } from '../ui/BrandSwoosh';
import { StatusPill, rowCls, rowIconBtn, tbodyCls, theadRowCls } from '../ui/archive';
import { SupplierType, DocumentDefinition } from '../../types';
import {
  User,
  Building2,
  ShieldCheck,
  Edit3,
  Check,
  Plus,
  Trash2,
  Lock,
  FileText,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Search,
  CheckCircle2,
  Sliders,
  Settings,
  Calendar,
  Sparkles,
  Layers,
} from 'lucide-react';

interface BaseRequirementsTabProps {
  onShowToast: (message: string, type?: 'success' | 'error') => void;
  onOpenDocModal: () => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  LEGAL: 'Legal / Estatutaria',
  FINANCIERO: 'Financiera / Tributaria',
  TECNICO: 'Técnica / Experiencia',
  HSEQ: 'HSEQ y Ambiental',
  SARLAFT: 'SARLAFT y Cumplimiento',
  OPERATIVO: 'Operativa y Logística',
};

/** Lista desplegable propia: búsqueda, grupos por categoría y código visible. */
const DocPicker: React.FC<{
  docs: DocumentDefinition[];
  value: string;
  onChange: (code: string) => void;
}> = ({ docs, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = docs.find((d) => d.code === value);

  const groups = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? docs.filter((d) => `${d.name} ${d.code} ${d.category}`.toLowerCase().includes(q))
      : docs;
    const map = new Map<string, DocumentDefinition[]>();
    filtered.forEach((d) => {
      const k = String(d.category || 'OTROS');
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(d);
    });
    return Array.from(map.entries());
  }, [docs, query]);

  return (
    <div className="rounded-2xl border border-black/[0.1] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 min-h-14 py-2.5 text-left cursor-pointer hover:bg-[#2c84c4]/[0.06] transition-colors"
      >
        <span className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${selected ? 'bg-gradient-action text-white shadow-glow' : 'bg-[#2c84c4]/12 text-[#1d5fa8] dark:text-[#69bdd7]'}`}>
          <FileText className="w-4 h-4" />
        </span>
        <span className="min-w-0 flex-1">
          {selected ? (
            <>
              <span className="block text-sm font-semibold text-[#0b1d3a] dark:text-white truncate">{selected.name}</span>
              <span className="block text-[11px] text-[#3a5274] dark:text-slate-400 truncate">{selected.code} · {CATEGORY_LABEL[String(selected.category)] || selected.category}</span>
            </>
          ) : (
            <span className="block text-sm text-[#6b84a3]">Seleccione un documento del catálogo</span>
          )}
        </span>
        <span className={`text-[#2c84c4] dark:text-[#69bdd7] transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="border-t border-black/[0.08] dark:border-white/10">
          <div className="p-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#6b84a3]" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, código o categoría"
                className="w-full h-10 pl-9 pr-3 text-sm rounded-xl bg-white dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/10 text-[#0b1d3a] dark:text-white placeholder:text-[#6b84a3] focus:outline-none focus:border-[#2c84c4] focus:ring-2 focus:ring-[#2c84c4]/30"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto px-2 pb-2">
            {groups.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-[#3a5274] dark:text-slate-400">Ningún documento coincide con la búsqueda.</div>
            )}
            {groups.map(([cat, list]) => (
              <div key={cat} className="mb-1">
                <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2c84c4] dark:text-[#69bdd7]">
                  {CATEGORY_LABEL[cat] || cat}
                </div>
                {list.map((d) => {
                  const active = d.code === value;
                  return (
                    <button
                      key={d.code}
                      type="button"
                      onClick={() => {
                        onChange(d.code);
                        setOpen(false);
                        setQuery('');
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-colors ${
                        active ? 'bg-[#2c84c4]/15 dark:bg-[#2c84c4]/25' : 'hover:bg-[#2c84c4]/[0.08]'
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-[#0b1d3a] dark:text-white truncate">{d.name}</span>
                        <span className="block text-[11px] font-mono text-[#3a5274] dark:text-slate-400 truncate">{d.code}</span>
                      </span>
                      {active && <Check className="w-4 h-4 text-[#2c84c4] dark:text-[#69bdd7] shrink-0" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const BaseRequirementsTab: React.FC<BaseRequirementsTabProps> = ({
  onShowToast,
  onOpenDocModal,
}) => {
  const {
    role,
    baseRequirementsConfig,
    documentDefinitions,
    institutionalForms,
    updateBaseRequirementsConfig,
    toggleBaseDocumentRequirement,
    updateDocumentDefinition,
    deleteDocumentDefinition,
    addNewFormVersion,
  } = useApp();

  const { ask, dialog } = useConfirm();
  const [selectedPersonType, setSelectedPersonType] = useState<SupplierType>('NATURAL');
  const [isEditingGuideline, setIsEditingGuideline] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedGuideline, setEditedGuideline] = useState('');
  
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [selectedDocToAdd, setSelectedDocToAdd] = useState('');
  const [addMode, setAddMode] = useState<'MANDATORY' | 'OPTIONAL'>('MANDATORY');

  // Edit complete doc definition modal state
  const [editingDoc, setEditingDoc] = useState<DocumentDefinition | null>(null);
  const [editDocName, setEditDocName] = useState('');
  const [editDocCategory, setEditDocCategory] = useState<DocumentDefinition['category']>('LEGAL');
  const [editDocValidity, setEditDocValidity] = useState('');
  const [editDocDescription, setEditDocDescription] = useState('');
  const [editDocRequiresExp, setEditDocRequiresExp] = useState(false);
  const [editDocIsActive, setEditDocIsActive] = useState(true);

  // Edit Institutional Form Modal
  const [editingInstForm, setEditingInstForm] = useState<{
    code: string;
    name: string;
    version: string;
    description: string;
    validityRule: string;
  } | null>(null);

  const activeBaseConfig =
    baseRequirementsConfig[selectedPersonType] || {
      personType: selectedPersonType,
      title: selectedPersonType === 'NATURAL' ? 'Requisitos Base Persona Natural' : 'Requisitos Base Persona Jurídica',
      description: 'Documentos base exigidos por el SIG institucional.',
      mandatoryDocs: [],
      optionalDocs: [],
      legalBasisNotes: '',
    };

  const naturalBaseConfig = baseRequirementsConfig['NATURAL'] || { mandatoryDocs: [], optionalDocs: [] };
  const juridicaBaseConfig = baseRequirementsConfig['JURIDICA'] || { mandatoryDocs: [], optionalDocs: [] };

  const handleStartEditingGuideline = () => {
    setEditedTitle(activeBaseConfig.title || '');
    setEditedDescription(activeBaseConfig.description || '');
    setEditedGuideline(activeBaseConfig.legalBasisNotes || '');
    setIsEditingGuideline(true);
  };

  const handleSaveGuideline = () => {
    updateBaseRequirementsConfig(selectedPersonType, {
      title: editedTitle.trim() || activeBaseConfig.title,
      description: editedDescription.trim() || activeBaseConfig.description,
      legalBasisNotes: editedGuideline.trim(),
    });
    setIsEditingGuideline(false);
    onShowToast(
      `Parámetros y pauta normativa de ${
        selectedPersonType === 'NATURAL' ? 'Persona Natural' : 'Persona Jurídica'
      } actualizados con éxito.`
    );
  };

  // Get base doc state
  const getDocBaseStatus = (code: string): 'MANDATORY' | 'OPTIONAL' | 'NONE' => {
    if ((activeBaseConfig.mandatoryDocs || []).includes(code)) return 'MANDATORY';
    if ((activeBaseConfig.optionalDocs || []).includes(code)) return 'OPTIONAL';
    return 'NONE';
  };

  // Handle adding document to base
  const handleAddDocumentToBase = () => {
    if (!selectedDocToAdd) {
      onShowToast('Seleccione un documento para agregar a la base.', 'error');
      return;
    }
    toggleBaseDocumentRequirement(selectedPersonType, selectedDocToAdd, addMode);
    const docObj = documentDefinitions.find((d) => d.code === selectedDocToAdd);
    onShowToast(
      `"${docObj?.name || selectedDocToAdd}" configurado como ${
        addMode === 'MANDATORY' ? 'OBLIGATORIO' : 'OPCIONAL'
      } en Requisitos Base de ${selectedPersonType === 'NATURAL' ? 'Persona Natural' : 'Persona Jurídica'}.`
    );
    setIsAddDocModalOpen(false);
    setSelectedDocToAdd('');
  };

  // Open full doc editor modal
  const handleOpenDocEdit = (doc: DocumentDefinition) => {
    setEditingDoc(doc);
    setEditDocName(doc.name);
    setEditDocCategory(doc.category);
    setEditDocValidity(doc.validityRule || '');
    setEditDocDescription(doc.description || '');
    setEditDocRequiresExp(!!doc.requiresExpirationDate);
    setEditDocIsActive(doc.isActive !== false);
  };

  // Handle saving complete doc definition
  const handleSaveDocRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    if (!editDocName.trim()) {
      onShowToast('El nombre del documento es obligatorio.', 'error');
      return;
    }

    updateDocumentDefinition(editingDoc.code, {
      name: editDocName.trim(),
      category: editDocCategory,
      validityRule: editDocValidity.trim() || 'Documento vigente.',
      description: editDocDescription.trim() || 'Documento de soporte oficial.',
      requiresExpirationDate: editDocRequiresExp,
      isActive: editDocIsActive,
    });
    onShowToast(`Documento "${editDocName.trim()}" (${editingDoc.code}) actualizado con éxito.`);
    setEditingDoc(null);
  };

  // Handle saving institutional form edit
  const handleSaveInstForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInstForm) return;

    updateDocumentDefinition(editingInstForm.code, {
      name: editingInstForm.name.trim(),
      description: editingInstForm.description.trim(),
      validityRule: editingInstForm.validityRule.trim(),
    });

    onShowToast(`Formato Institucional "${editingInstForm.name}" actualizado correctamente.`);
    setEditingInstForm(null);
  };

  // Docs available in catalog that are not yet in this base
  const availableDocsToAdd = documentDefinitions.filter(
    (d) =>
      d.code !== 'FS_GA_FOR_009' &&
      d.code !== 'FS_GA_FOR_039' &&
      !activeBaseConfig.mandatoryDocs?.includes(d.code) &&
      !activeBaseConfig.optionalDocs?.includes(d.code)
  );

  // Filtered docs list for base table
  const allDocCodesInBase = [
    ...(activeBaseConfig.mandatoryDocs || []),
    ...(activeBaseConfig.optionalDocs || []),
  ];

  const filteredBaseDocs = documentDefinitions.filter((d) => {
    if (d.code === 'FS_GA_FOR_009' || d.code === 'FS_GA_FOR_039') return false; // Handled in header
    const isInBase = allDocCodesInBase.includes(d.code);
    const matchesSearch =
      d.name.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      (d.validityRule && d.validityRule.toLowerCase().includes(searchDocQuery.toLowerCase()));
    return isInBase && matchesSearch;
  });

  const form009Def = documentDefinitions.find((d) => d.code === 'FS_GA_FOR_009');
  const form039Def = documentDefinitions.find((d) => d.code === 'FS_GA_FOR_039');
  const form009Inst = institutionalForms.find((f) => f.code === 'FS.GA-FOR-009');
  const form039Inst = institutionalForms.find((f) => f.code === 'FS.GA-FOR-039');

  return (
    <div className="space-y-6">
      {dialog}
      {/* Top Selector: Persona Natural vs Persona Juridica */}
      <div className="fs-card p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#0b1d3a] dark:text-white flex items-center gap-2">
            <span>Configuración de Requisitos Base por Régimen Jurídico</span>
            <span className="text-[10px] bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] font-bold px-2 py-0.5 rounded-full">
              Edición Total Habilitada
            </span>
          </h2>
          <p className="text-sm text-[#5d7392] dark:text-slate-400">
            Como Administrador General, puede editar cualquier título, texto orientador, obligatoriedad o regla de validez.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#e6edf6] dark:bg-[#071636]/70 p-1.5 rounded-2xl">
          <button
            onClick={() => setSelectedPersonType('NATURAL')}
            className={`flex items-center gap-2 px-5 py-2.5 text-[15px] font-bold rounded-xl transition-all cursor-pointer ${
              selectedPersonType === 'NATURAL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-[#3a5274] dark:text-slate-300 hover:text-[#0b1d3a] dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Persona Natural ({(naturalBaseConfig.mandatoryDocs || []).length + 2} Ob.)</span>
          </button>
          <button
            onClick={() => setSelectedPersonType('JURIDICA')}
            className={`flex items-center gap-2 px-5 py-2.5 text-[15px] font-bold rounded-xl transition-all cursor-pointer ${
              selectedPersonType === 'JURIDICA'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-[#3a5274] dark:text-slate-300 hover:text-[#0b1d3a] dark:hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Persona Jurídica ({(juridicaBaseConfig.mandatoryDocs || []).length + 2} Ob.)</span>
          </button>
        </div>
      </div>

      {/* Guideline Banner & Editor */}
      <div className="hidden fs-solid text-white p-6 rounded-[22px] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-xl font-bold text-white">
                {activeBaseConfig.title || (selectedPersonType === 'NATURAL' ? 'Requisitos Base Persona Natural' : 'Requisitos Base Persona Jurídica')}
              </h3>
              <p className="text-[15px] text-[#dbe9f7] font-normal">
                {activeBaseConfig.description}
              </p>
            </div>
          </div>

          <div>
            {!isEditingGuideline ? (
              <button
                onClick={handleStartEditingGuideline}
                className="flex items-center gap-2 h-11 px-4 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-2xl transition-colors cursor-pointer border-2 border-white/80"
                title="Editar título, descripción y pauta legal"
              >
                <Edit3 className="w-3.5 h-3.5 text-cyan-300" />
                <span>Editar Parámetros Base</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingGuideline(false)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveGuideline}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {!isEditingGuideline ? (
          <div className="p-4 bg-[#061433]/50 rounded-2xl text-[15px] text-white leading-relaxed font-normal">
            <span className="font-bold text-[#9fd8ff] block mb-1">Fundamento & Pauta Normativa Oficial:</span>
            {activeBaseConfig.legalBasisNotes || activeBaseConfig.description || 'Sin pauta normativa registrada.'}
          </div>
        ) : (
          <div className="space-y-3 pt-2 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div>
              <label className="block text-[11px] font-bold text-cyan-300 mb-1">
                Título del Módulo Base:
              </label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-sans"
                placeholder="Título del bloque de requisitos base..."
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-cyan-300 mb-1">
                Descripción Corta / Subtítulo:
              </label>
              <input
                type="text"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-sans"
                placeholder="Descripción del régimen para los aspirantes..."
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-cyan-300 mb-1">
                Texto de Pauta Normativa & Requisitos a Anexar:
              </label>
              <textarea
                rows={3}
                value={editedGuideline}
                onChange={(e) => setEditedGuideline(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-sans"
                placeholder="Detalle los documentos oficiales que el aspirante debe anexar..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Base Document Configuration Table */}
      <div className="fs-card rounded-2xl overflow-hidden">
        {/* Table Top Actions Bar */}
        <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold text-[#0b1d3a]">
              Documentos base · {selectedPersonType === 'NATURAL' ? 'Persona natural' : 'Persona jurídica'}
            </span>
            <span className="text-sm font-semibold text-[#1d5fa8] bg-[#e1ecf8] dark:bg-[#123267] dark:text-white px-3 py-1 rounded-full">
              {(activeBaseConfig.mandatoryDocs || []).length + 2} Obligatorios Totales
            </span>
            <span className="text-sm font-semibold text-[#3a5274] bg-[#eef2f7] dark:bg-[#22385f] dark:text-[#c9d6ea] px-3 py-1 rounded-full">
              {(activeBaseConfig.optionalDocs || []).length} Opcionales
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search within base docs */}
            <div className="relative">
              <Search className="w-[18px] h-[18px] absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5d7392]" />
              <input
                type="text"
                placeholder="Buscar documento base..."
                value={searchDocQuery}
                onChange={(e) => setSearchDocQuery(e.target.value)}
                className="pl-10 pr-3 h-11 bg-white dark:bg-[#0a1c44] border border-[#d9e3ef] rounded-2xl text-[15px] text-[#0b1d3a] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2b78b3]/40 w-64"
              />
            </div>

            {/* Add Document to Base Button */}
            <button
              onClick={() => setIsAddDocModalOpen(true)}
              className="flex items-center gap-2 h-11 px-5 bg-blue-600 text-white text-[15px] font-bold rounded-2xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Requisito Base</span>
            </button>
          </div>
        </div>

        <div>
          <div className="sm:hidden px-3 py-1.5 bg-[#2c84c4]/10 dark:bg-blue-950/40 border-b border-black/10 dark:border-white/10 dark:border-slate-800 text-[10px] text-[#1d5fa8] dark:text-[#69bdd7] dark:text-cyan-300 flex items-center justify-between font-medium">
            <span>Desliza horizontalmente para ver todas las columnas</span>
            <span className="font-bold">↔</span>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-[15px] min-w-[700px] lg:min-w-full">
            <thead>
              <tr className={theadRowCls}>
                <th className="px-4 py-3.5">Código & Tipo de Documento</th>
                <th className="px-3 py-3.5">Clasificación SIG</th>
                <th className="px-4 py-3.5 text-center">Exigibilidad en Base</th>
                <th className="px-3 py-3.5">Regla de Validez / Vigencia</th>
                <th className="px-4 py-3.5 text-right">Acciones de Edición</th>
              </tr>
            </thead>
            <tbody className={tbodyCls}>
              {/* Formato 1: FS.GA-FOR-009 (Institucional) */}
              <tr className={rowCls}>
                <td className="px-4 py-3">
                  <div className="font-bold text-[#0b1d3a] flex items-center gap-2 text-base">
                    <Lock className="w-4 h-4 text-[#1d5fa8] shrink-0" />
                    <span>{form009Def?.name || 'Formulario de Inscripción y Actualización (FS.GA-FOR-009)'}</span>
                  </div>
                  <div className="text-[13px] text-[#1d5fa8] tabular-nums flex items-center gap-2 mt-0.5">
                    <span>FS.GA-FOR-009</span>
                    <span>&bull;</span>
                    <span className="font-bold">v{form009Inst?.currentVersion || '14.0'}</span>
                    <span>&bull;</span>
                    <span>Formato Institucional Oficial</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <StatusPill tone="blue">Institucional</StatusPill>
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusPill tone="ok">Obligatorio fijo SIG</StatusPill>
                </td>
                <td className="px-3 py-3 text-[#3a5274] text-sm">
                  {form009Def?.validityRule || 'Versión oficial vigente debidamente diligenciada y firmada.'}
                </td>
                <td className="px-4 py-3 text-right">
                </td>
              </tr>

              {/* Formato 2: FS.GA-FOR-039 (Institucional) */}
              <tr className={rowCls}>
                <td className="px-4 py-3">
                  <div className="font-bold text-[#0b1d3a] flex items-center gap-2 text-base">
                    <Lock className="w-4 h-4 text-[#1d5fa8] shrink-0" />
                    <span>{form039Def?.name || 'Autorización de Tratamiento de Datos Personales (FS.GA-FOR-039)'}</span>
                  </div>
                  <div className="text-[13px] text-[#1d5fa8] tabular-nums flex items-center gap-2 mt-0.5">
                    <span>FS.GA-FOR-039</span>
                    <span>&bull;</span>
                    <span className="font-bold">v{form039Inst?.currentVersion || '1.0'}</span>
                    <span>&bull;</span>
                    <span>Ley 1581 Habeas Data</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <StatusPill tone="blue">Institucional</StatusPill>
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusPill tone="ok">Obligatorio fijo SIG</StatusPill>
                </td>
                <td className="px-3 py-3 text-[#3a5274] text-sm">
                  {form039Def?.validityRule || 'Firma física o digital del titular o representante legal.'}
                </td>
                <td className="px-4 py-3 text-right">
                </td>
              </tr>

              {/* Configured Base Documents */}
              {filteredBaseDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#5d7392] dark:text-slate-400 text-xs">
                    No hay documentos base adicionales que coincidan con la búsqueda. Use el botón "Agregar Requisito Base" para vincular nuevos soportes.
                  </td>
                </tr>
              ) : (
                filteredBaseDocs.map((doc) => {
                  const status = getDocBaseStatus(doc.code);
                  const isInactiveInCatalog = doc.isActive === false;

                  return (
                    <tr
                      key={doc.code}
                      className={`${rowCls} ${isInactiveInCatalog ? 'opacity-60' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#5d7392] dark:text-slate-400 shrink-0" />
                          <div>
                            <div className="font-bold text-[#0b1d3a] flex items-center gap-2 text-base">
                              <span>{doc.name}</span>
                              {isInactiveInCatalog && (
                                <span className="px-1.5 py-0.5 bg-black/[0.08] dark:bg-white/10 text-[#3a5274] dark:text-slate-300 text-xs font-bold rounded">
                                  INACTIVO EN CATÁLOGO
                                </span>
                              )}
                              {doc.requiresExpirationDate && (
                                <span className="px-1.5 py-0.5 bg-[#2c84c4]/10 text-[#1d5fa8] dark:text-[#69bdd7] text-xs font-bold rounded">
                                  Caducidad
                                </span>
                              )}
                            </div>
                            <div className="text-[13px] text-[#5d7392] tabular-nums">{doc.code}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <StatusPill tone="muted">{doc.category}</StatusPill>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center bg-[#e6edf6] dark:bg-[#071636]/70 dark:ring-1 dark:ring-[#3f7fd8] p-1 rounded-xl text-sm font-semibold">
                          <button
                            onClick={() => {
                              toggleBaseDocumentRequirement(selectedPersonType, doc.code, 'MANDATORY');
                              onShowToast(`"${doc.name}" configurado como OBLIGATORIO BASE para ${selectedPersonType === 'NATURAL' ? 'Persona Natural' : 'Persona Jurídica'}`);
                            }}
                            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                              status === 'MANDATORY'
                                ? 'bg-[#0f3d75] dark:bg-[#1f7ae8] text-white shadow-xs'
                                : 'text-[#3a5274] dark:text-[#b4c7e3] hover:text-[#0b1d3a] dark:hover:text-white'
                            }`}
                          >
                            Obligatorio
                          </button>
                          <button
                            onClick={() => {
                              toggleBaseDocumentRequirement(selectedPersonType, doc.code, 'OPTIONAL');
                              onShowToast(`"${doc.name}" configurado como OPCIONAL BASE para ${selectedPersonType === 'NATURAL' ? 'Persona Natural' : 'Persona Jurídica'}`);
                            }}
                            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                              status === 'OPTIONAL'
                                ? 'bg-[#2f86d6] text-white shadow-xs'
                                : 'text-[#3a5274] dark:text-[#b4c7e3] hover:text-[#0b1d3a] dark:hover:text-white'
                            }`}
                          >
                            Opcional
                          </button>
                          <button
                            onClick={() =>
                              ask({
                                title: `¿Inactivar «${doc.name}»?`,
                                message: `Dejará de exigirse en los requisitos base de ${selectedPersonType === 'NATURAL' ? 'Persona Natural' : 'Persona Jurídica'}. Los expedientes ya radicados no se borran.`,
                                hint: 'Podrá volver a activarlo cuando quiera con los botones «Obligatorio» u «Opcional» de esta misma fila.',
                                onConfirm: () => {
                                  toggleBaseDocumentRequirement(selectedPersonType, doc.code, 'NONE');
                                  onShowToast(`"${doc.name}" INACTIVADO / REMOVIDO de los requisitos base de ${selectedPersonType === 'NATURAL' ? 'Persona Natural' : 'Persona Jurídica'}`);
                                },
                              })
                            }
                            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                              status === 'NONE'
                                ? 'bg-[#6b84a6] text-white shadow-xs'
                                : 'text-[#5d7392] hover:text-[#0b1d3a] dark:hover:text-white'
                            }`}
                            title="Quitar / Inactivar de la base universal"
                          >
                            Inactivar
                          </button>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-[#3a5274] text-sm">
                        <div className="font-medium">{doc.validityRule || 'Documento vigente'}</div>
                        <div className="text-[13px] text-[#5d7392] line-clamp-1">{doc.description}</div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDocEdit(doc)}
                            className={rowIconBtn}
                            title="Editar todos los campos del documento"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              ask({
                                title: `¿Quitar «${doc.name}» de la base?`,
                                message: `Se inactivará en los requisitos base de ${selectedPersonType === 'NATURAL' ? 'Persona Natural' : 'Persona Jurídica'}.`,
                                hint: 'Podrá volver a activarlo con «Agregar requisito base», escogiéndolo de nuevo del catálogo.',
                                confirmLabel: 'Sí, quitar',
                                onConfirm: () => {
                                  toggleBaseDocumentRequirement(selectedPersonType, doc.code, 'NONE');
                                  onShowToast(`"${doc.name}" removido de la base de ${selectedPersonType === 'NATURAL' ? 'Persona Natural' : 'Persona Jurídica'}.`);
                                },
                              })
                            }
                            className={rowIconBtn}
                            title="Quitar de requisitos base"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Modal: Agregar Requisito Base */}
      {isAddDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#050b1a]/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#f4f8fc] dark:bg-[#0c1426] rounded-[28px] border border-black/10 dark:border-white/10 max-w-xl w-full shadow-2xl overflow-hidden animate-fade-up my-8">
            <div className="relative overflow-hidden bg-gradient-brand text-white px-6 py-5 flex items-center justify-between">
              <BrandSwoosh className="absolute -right-10 -bottom-12 w-64 opacity-100" />
              <div className="relative flex items-center gap-3 min-w-0">
                <span className="w-11 h-11 rounded-2xl bg-white/15 ring-1 ring-white/30 grid place-items-center shrink-0">
                  <Plus className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-semibold truncate">Agregar documento a requisitos base</h3>
                  <p className="text-xs text-white/75">
                    {selectedPersonType === 'NATURAL' ? 'Para persona natural' : 'Para persona jurídica'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDocModalOpen(false)}
                aria-label="Cerrar"
                className="relative w-9 h-9 grid place-items-center rounded-xl text-white/80 hover:text-white hover:bg-white/15 text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2c84c4] dark:text-[#69bdd7] mb-2">
                  1. Documento del catálogo maestro
                </label>
                {availableDocsToAdd.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 text-sm text-[#0b1d3a] dark:text-white">
                    Todos los documentos del catálogo ya forman parte de los requisitos base. Si necesita uno nuevo, puede crearlo ahora mismo.
                  </div>
                ) : (
                  <DocPicker docs={availableDocsToAdd} value={selectedDocToAdd} onChange={setSelectedDocToAdd} />
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2c84c4] dark:text-[#69bdd7] mb-2">
                  2. Tipo de exigibilidad en base
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05]">
                  {([
                    ['MANDATORY', 'Obligatorio', 'Bloqueante para radicar'],
                    ['OPTIONAL', 'Opcional', 'Sujeto a condición o complementario'],
                  ] as const).map(([mode, title, sub]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setAddMode(mode)}
                      aria-pressed={addMode === mode}
                      className={`min-h-14 px-3 py-2 rounded-xl flex flex-col items-center justify-center leading-tight transition-all cursor-pointer ${
                        addMode === mode
                          ? 'bg-gradient-action text-white shadow-glow'
                          : 'text-[#1c3354] dark:text-slate-200 hover:bg-[#2c84c4]/10'
                      }`}
                    >
                      <span className="text-sm font-semibold">{title}</span>
                      <span className={`text-[10.5px] text-center ${addMode === mode ? 'text-white/85' : 'text-[#6b84a3]'}`}>{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-black/[0.08] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddDocModalOpen(false);
                    onOpenDocModal();
                  }}
                  className="text-sm text-[#2c84c4] dark:text-[#69bdd7] hover:underline font-semibold cursor-pointer text-left"
                >
                  + Crear nuevo tipo documental
                </button>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setIsAddDocModalOpen(false)}
                    className="h-11 px-5 rounded-xl border border-[#2c84c4]/35 text-[#1d5fa8] dark:text-[#69bdd7] hover:bg-[#2c84c4]/10 text-sm font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!selectedDocToAdd}
                    onClick={handleAddDocumentToBase}
                    className="h-11 px-5 rounded-xl bg-gradient-action text-white text-sm font-semibold shadow-glow hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Confirmar e incluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Documento Completo */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="fs-card rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="bg-[#0b1329] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-white/15 ring-1 ring-white/25 grid place-items-center text-xl">✎</span>
                <div>
                  <h3 className="font-bold">Editar documento</h3>
                  <p className="text-[13px] text-white/75 tabular-nums mt-0.5">Código <span className="ml-1 px-2 py-0.5 rounded-md bg-white/15 font-semibold">{editingDoc.code}</span></p>
                </div>
              </div>
              <button
                onClick={() => setEditingDoc(null)}
                className="text-[#5d7392] dark:text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveDocRule} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-[#3a5274] dark:text-slate-300 mb-1">
                  Nombre Oficial del Documento *
                </label>
                <input
                  type="text"
                  required
                  value={editDocName}
                  onChange={(e) => setEditDocName(e.target.value)}
                  placeholder="Ej: Certificación Bancaria Oficial..."
                  className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-xl text-xs text-[#0b1d3a] dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3a5274] dark:text-slate-300 mb-1">
                    Categoría SIG
                  </label>
                  <select
                    value={editDocCategory}
                    onChange={(e: any) => setEditDocCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-xl text-xs font-semibold text-[#0b1d3a] dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
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
                  <label className="block text-xs font-bold text-[#3a5274] dark:text-slate-300 mb-1">
                    Estado en Catálogo
                  </label>
                  <select
                    value={editDocIsActive ? 'ACTIVE' : 'INACTIVE'}
                    onChange={(e) => setEditDocIsActive(e.target.value === 'ACTIVE')}
                    className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-xl text-xs font-semibold text-[#0b1d3a] dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3a5274] dark:text-slate-300 mb-1">
                  Regla de Validez, Caducidad o Vigencia *
                </label>
                <input
                  type="text"
                  required
                  value={editDocValidity}
                  onChange={(e) => setEditDocValidity(e.target.value)}
                  placeholder="Ej: Expedición no mayor a 30 días calendario..."
                  className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-xl text-xs text-[#0b1d3a] dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3a5274] dark:text-slate-300 mb-1">
                  Descripción e Instrucciones para el Proveedor
                </label>
                <textarea
                  rows={3}
                  value={editDocDescription}
                  onChange={(e) => setEditDocDescription(e.target.value)}
                  placeholder="Detalle los puntos clave que el revisor o aspirante deben tener en cuenta..."
                  className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-xl text-xs text-[#0b1d3a] dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl border border-black/10 dark:border-white/10">
                <label className="flex items-center gap-2.5 text-xs text-[#0b1d3a] dark:text-white font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editDocRequiresExp}
                    onChange={(e) => setEditDocRequiresExp(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1d5fa8] dark:text-[#69bdd7] focus:ring-blue-500"
                  />
                  <span>Requiere que el proveedor ingrese Fecha de Caducidad / Vencimiento</span>
                </label>
              </div>

              <div className="pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 text-xs font-bold text-[#3a5274] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-2xs cursor-pointer"
                >
                  Guardar Todos los Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Formato Institucional */}
      {editingInstForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="fs-card rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="bg-[#0b1329] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm">Editar Parámetros de Formato Institucional</h3>
                <p className="text-[11px] text-cyan-300 tabular-nums">{editingInstForm.code} &bull; v{editingInstForm.version}</p>
              </div>
              <button
                onClick={() => setEditingInstForm(null)}
                className="text-[#5d7392] dark:text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveInstForm} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3a5274] dark:text-slate-300 mb-1">
                  Nombre Institucional del Formato *
                </label>
                <input
                  type="text"
                  required
                  value={editingInstForm.name}
                  onChange={(e) => setEditingInstForm({ ...editingInstForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-xl text-xs text-[#0b1d3a] dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3a5274] dark:text-slate-300 mb-1">
                  Regla de Validez & Diligenciamiento *
                </label>
                <input
                  type="text"
                  required
                  value={editingInstForm.validityRule}
                  onChange={(e) => setEditingInstForm({ ...editingInstForm, validityRule: e.target.value })}
                  className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-xl text-xs text-[#0b1d3a] dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3a5274] dark:text-slate-300 mb-1">
                  Descripción & Alcance del Formato
                </label>
                <textarea
                  rows={3}
                  value={editingInstForm.description}
                  onChange={(e) => setEditingInstForm({ ...editingInstForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-xl text-xs text-[#0b1d3a] dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingInstForm(null)}
                  className="px-4 py-2 text-xs font-bold text-[#3a5274] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-2xs cursor-pointer"
                >
                  Guardar Formato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

