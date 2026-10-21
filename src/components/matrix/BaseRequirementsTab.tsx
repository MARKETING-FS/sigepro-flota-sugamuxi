import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
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
      {/* Top Selector: Persona Natural vs Persona Juridica */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Configuración de Requisitos Base por Régimen Jurídico</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
              Edición Total Habilitada
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Como Administrador General, puede editar cualquier título, texto orientador, obligatoriedad o regla de validez.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setSelectedPersonType('NATURAL')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedPersonType === 'NATURAL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Persona Natural ({(naturalBaseConfig.mandatoryDocs || []).length + 2} Ob.)</span>
          </button>
          <button
            onClick={() => setSelectedPersonType('JURIDICA')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedPersonType === 'JURIDICA'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Persona Jurídica ({(juridicaBaseConfig.mandatoryDocs || []).length + 2} Ob.)</span>
          </button>
        </div>
      </div>

      {/* Guideline Banner & Editor */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-cyan-300">
                {activeBaseConfig.title || (selectedPersonType === 'NATURAL' ? 'Requisitos Base Persona Natural' : 'Requisitos Base Persona Jurídica')}
              </h3>
              <p className="text-[11px] text-slate-300 font-normal">
                {activeBaseConfig.description}
              </p>
            </div>
          </div>

          <div>
            {!isEditingGuideline ? (
              <button
                onClick={handleStartEditingGuideline}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer border border-white/20 shadow-xs"
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
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-slate-200 leading-relaxed font-normal">
            <span className="font-bold text-cyan-300 block mb-1">Fundamento & Pauta Normativa Oficial:</span>
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Top Actions Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-xs text-slate-900">
              DOCUMENTOS BASE PARA {selectedPersonType === 'NATURAL' ? 'PERSONA NATURAL' : 'PERSONA JURÍDICA'}
            </span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {(activeBaseConfig.mandatoryDocs || []).length + 2} Obligatorios Totales
            </span>
            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-300">
              {(activeBaseConfig.optionalDocs || []).length} Opcionales
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search within base docs */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar documento base..."
                value={searchDocQuery}
                onChange={(e) => setSearchDocQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-500 w-48"
              />
            </div>

            {/* Add Document to Base Button */}
            <button
              onClick={() => setIsAddDocModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Requisito Base</span>
            </button>
          </div>
        </div>

        <div>
          <div className="sm:hidden px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] text-blue-900 dark:text-cyan-300 flex items-center justify-between font-medium">
            <span>Desliza horizontalmente para ver todas las columnas</span>
            <span className="font-bold">↔</span>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200 min-w-[700px] lg:min-w-full">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Código & Tipo de Documento</th>
                <th className="px-3 py-3">Clasificación SIG</th>
                <th className="px-4 py-3 text-center">Exigibilidad en Base</th>
                <th className="px-3 py-3">Regla de Validez / Vigencia</th>
                <th className="px-4 py-3 text-right">Acciones de Edición</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Formato 1: FS.GA-FOR-009 (Institucional) */}
              <tr className="bg-blue-50/20 hover:bg-blue-50/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span>{form009Def?.name || 'Formulario de Inscripción y Actualización (FS.GA-FOR-009)'}</span>
                  </div>
                  <div className="text-[10px] text-blue-700 font-mono flex items-center gap-2 mt-0.5">
                    <span>FS.GA-FOR-009</span>
                    <span>&bull;</span>
                    <span className="font-bold">v{form009Inst?.currentVersion || '14.0'}</span>
                    <span>&bull;</span>
                    <span>Formato Institucional Oficial</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    INSTITUCIONAL
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="px-3 py-1 bg-slate-900 text-white rounded-full font-bold text-[10px] shadow-2xs inline-flex items-center gap-1 border border-slate-700">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    <span>OBLIGATORIO FIJO SIG</span>
                  </span>
                </td>
                <td className="px-3 py-3 text-slate-600 text-[11px]">
                  {form009Def?.validityRule || 'Versión oficial vigente debidamente diligenciada y firmada.'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      setEditingInstForm({
                        code: 'FS_GA_FOR_009',
                        name: form009Def?.name || 'Formulario de Inscripción y Actualización de Proveedores y Clientes (FS.GA-FOR-009)',
                        version: form009Inst?.currentVersion || '14.0',
                        description: form009Def?.description || 'Formato Institucional Oficial para inscripción y actualización.',
                        validityRule: form009Def?.validityRule || 'Versión oficial vigente 14.0 con firma y huella.',
                      });
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer transition-colors"
                    title="Editar parámetros del formato FS.GA-FOR-009"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Editar Formato</span>
                  </button>
                </td>
              </tr>

              {/* Formato 2: FS.GA-FOR-039 (Institucional) */}
              <tr className="bg-blue-50/20 hover:bg-blue-50/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span>{form039Def?.name || 'Autorización de Tratamiento de Datos Personales (FS.GA-FOR-039)'}</span>
                  </div>
                  <div className="text-[10px] text-blue-700 font-mono flex items-center gap-2 mt-0.5">
                    <span>FS.GA-FOR-039</span>
                    <span>&bull;</span>
                    <span className="font-bold">v{form039Inst?.currentVersion || '1.0'}</span>
                    <span>&bull;</span>
                    <span>Ley 1581 Habeas Data</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    INSTITUCIONAL
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="px-3 py-1 bg-slate-900 text-white rounded-full font-bold text-[10px] shadow-2xs inline-flex items-center gap-1 border border-slate-700">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    <span>OBLIGATORIO FIJO SIG</span>
                  </span>
                </td>
                <td className="px-3 py-3 text-slate-600 text-[11px]">
                  {form039Def?.validityRule || 'Firma física o digital del titular o representante legal.'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      setEditingInstForm({
                        code: 'FS_GA_FOR_039',
                        name: form039Def?.name || 'Autorización para el Tratamiento de Datos Personales (FS.GA-FOR-039)',
                        version: form039Inst?.currentVersion || '1.0',
                        description: form039Def?.description || 'Formato Institucional Oficial para tratamiento de datos personales conforme a la Ley 1581.',
                        validityRule: form039Def?.validityRule || 'Firma física o digital del titular o representante legal.',
                      });
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer transition-colors"
                    title="Editar parámetros del formato FS.GA-FOR-039"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Editar Formato</span>
                  </button>
                </td>
              </tr>

              {/* Configured Base Documents */}
              {filteredBaseDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">
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
                      className={`hover:bg-slate-50 transition-colors ${
                        isInactiveInCatalog ? 'bg-slate-50/70 opacity-60' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-2">
                              <span>{doc.name}</span>
                              {isInactiveInCatalog && (
                                <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-bold rounded">
                                  INACTIVO EN CATÁLOGO
                                </span>
                              )}
                              {doc.requiresExpirationDate && (
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 text-[9px] font-bold rounded">
                                  Caducidad
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{doc.code}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {doc.category}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                          <button
                            onClick={() => {
                              toggleBaseDocumentRequirement(selectedPersonType, doc.code, 'MANDATORY');
                              onShowToast(`"${doc.name}" configurado como OBLIGATORIO BASE para ${selectedPersonType === 'NATURAL' ? 'Persona Natural' : 'Persona Jurídica'}`);
                            }}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              status === 'MANDATORY'
                                ? 'bg-blue-700 text-white shadow-xs'
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            Obligatorio
                          </button>
                          <button
                            onClick={() => {
                              toggleBaseDocumentRequirement(selectedPersonType, doc.code, 'OPTIONAL');
                              onShowToast(`"${doc.name}" configurado como OPCIONAL BASE para ${selectedPersonType === 'NATURAL' ? 'Persona Natural' : 'Persona Jurídica'}`);
                            }}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              status === 'OPTIONAL'
                                ? 'bg-cyan-700 text-white shadow-xs'
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            Opcional
                          </button>
                          <button
                            onClick={() => {
                              toggleBaseDocumentRequirement(selectedPersonType, doc.code, 'NONE');
                              onShowToast(`"${doc.name}" INACTIVADO / REMOVIDO de los requisitos base de ${selectedPersonType === 'NATURAL' ? 'Persona Natural' : 'Persona Jurídica'}`);
                            }}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              status === 'NONE'
                                ? 'bg-slate-400 text-white shadow-xs'
                                : 'text-slate-400 hover:text-slate-700'
                            }`}
                            title="Quitar / Inactivar de la base universal"
                          >
                            Inactivar
                          </button>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-slate-600 text-[11px]">
                        <div className="font-medium">{doc.validityRule || 'Documento vigente'}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{doc.description}</div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDocEdit(doc)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                            title="Editar todos los campos del documento"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              toggleBaseDocumentRequirement(selectedPersonType, doc.code, 'NONE');
                              onShowToast(`"${doc.name}" removido de la base de ${selectedPersonType === 'NATURAL' ? 'Persona Natural' : 'Persona Jurídica'}.`);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"
                            title="Quitar de requisitos base"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="bg-[#0b1329] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-cyan-300">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Agregar Documento a Requisitos Base</h3>
                  <p className="text-[11px] text-cyan-300">
                    {selectedPersonType === 'NATURAL' ? 'Para Persona Natural' : 'Para Persona Jurídica'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddDocModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Seleccione Documento del Catálogo Maestro:
                </label>
                {availableDocsToAdd.length === 0 ? (
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 text-xs text-slate-800">
                    Todos los documentos registrados en el catálogo ya forman parte de los requisitos base. Si necesita uno nuevo, puede crearlo inmediatamente.
                  </div>
                ) : (
                  <select
                    value={selectedDocToAdd}
                    onChange={(e) => setSelectedDocToAdd(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">-- Seleccione un documento --</option>
                    {availableDocsToAdd.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.name} ({d.code}) &bull; {d.category}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Tipo de Exigibilidad en Base:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAddMode('MANDATORY')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      addMode === 'MANDATORY'
                        ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="px-2 py-0.5 bg-blue-700 text-white rounded-full text-[10px]">OBLIGATORIO</span>
                    <span className="text-[11px] text-slate-500 text-center">Bloqueante para radicar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddMode('OPTIONAL')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      addMode === 'OPTIONAL'
                        ? 'bg-cyan-50 border-cyan-400 text-cyan-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="px-2 py-0.5 bg-cyan-700 text-white rounded-full text-[10px]">OPCIONAL</span>
                    <span className="text-[11px] text-slate-500 text-center">Sujeto a condición o complementario</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddDocModalOpen(false);
                    onOpenDocModal();
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                >
                  + Crear nuevo tipo documental en catálogo
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddDocModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!selectedDocToAdd}
                    onClick={handleAddDocumentToBase}
                    className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl shadow-2xs cursor-pointer"
                  >
                    Confirmar e Incluir
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
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="bg-[#0b1329] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm">Editar Todos los Campos del Documento</h3>
                <p className="text-[11px] text-cyan-300 font-mono">Código: {editingDoc.code}</p>
              </div>
              <button
                onClick={() => setEditingDoc(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveDocRule} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Oficial del Documento *
                </label>
                <input
                  type="text"
                  required
                  value={editDocName}
                  onChange={(e) => setEditDocName(e.target.value)}
                  placeholder="Ej: Certificación Bancaria Oficial..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Categoría SIG
                  </label>
                  <select
                    value={editDocCategory}
                    onChange={(e: any) => setEditDocCategory(e.target.value)}
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
                    Estado en Catálogo
                  </label>
                  <select
                    value={editDocIsActive ? 'ACTIVE' : 'INACTIVE'}
                    onChange={(e) => setEditDocIsActive(e.target.value === 'ACTIVE')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Regla de Validez, Caducidad o Vigencia *
                </label>
                <input
                  type="text"
                  required
                  value={editDocValidity}
                  onChange={(e) => setEditDocValidity(e.target.value)}
                  placeholder="Ej: Expedición no mayor a 30 días calendario..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción e Instrucciones para el Proveedor
                </label>
                <textarea
                  rows={3}
                  value={editDocDescription}
                  onChange={(e) => setEditDocDescription(e.target.value)}
                  placeholder="Detalle los puntos clave que el revisor o aspirante deben tener en cuenta..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2.5 text-xs text-slate-800 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editDocRequiresExp}
                    onChange={(e) => setEditDocRequiresExp(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Requiere que el proveedor ingrese Fecha de Caducidad / Vencimiento</span>
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
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="bg-[#0b1329] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm">Editar Parámetros de Formato Institucional</h3>
                <p className="text-[11px] text-cyan-300 font-mono">{editingInstForm.code} &bull; v{editingInstForm.version}</p>
              </div>
              <button
                onClick={() => setEditingInstForm(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveInstForm} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Institucional del Formato *
                </label>
                <input
                  type="text"
                  required
                  value={editingInstForm.name}
                  onChange={(e) => setEditingInstForm({ ...editingInstForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Regla de Validez & Diligenciamiento *
                </label>
                <input
                  type="text"
                  required
                  value={editingInstForm.validityRule}
                  onChange={(e) => setEditingInstForm({ ...editingInstForm, validityRule: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción & Alcance del Formato
                </label>
                <textarea
                  rows={3}
                  value={editingInstForm.description}
                  onChange={(e) => setEditingInstForm({ ...editingInstForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingInstForm(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
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

