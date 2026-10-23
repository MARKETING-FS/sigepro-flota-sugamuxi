import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryRequirementConfig, SupplierType, DocumentDefinition } from '../../types';
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  FileText,
  Lock,
  Layers,
  Settings,
  HelpCircle,
  Clock,
  Calendar,
} from 'lucide-react';

interface EconomicActivitiesTabProps {
  onShowToast: (message: string, type?: 'success' | 'error') => void;
  onOpenNewCategoryModal: () => void;
  onOpenNewDocModal: () => void;
}

export const EconomicActivitiesTab: React.FC<EconomicActivitiesTabProps> = ({
  onShowToast,
  onOpenNewCategoryModal,
  onOpenNewDocModal,
}) => {
  const {
    role,
    categoriesConfig,
    baseRequirementsConfig,
    documentDefinitions,
    updateCategoryConfig,
    deleteCategoryConfig,
    toggleDocumentRequirement,
    updateDocumentDefinition,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'ALL' | 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO'>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedRegimenView, setSelectedRegimenView] = useState<'ALL' | 'NATURAL' | 'JURIDICA'>('ALL');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [innerDocSearch, setInnerDocSearch] = useState('');

  // Edit category modal state
  const [editingCategory, setEditingCategory] = useState<CategoryRequirementConfig | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDescription, setEditCatDescription] = useState('');
  const [editCatRisk, setEditCatRisk] = useState<'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO'>('MEDIO');
  const [editCatEconomicCode, setEditCatEconomicCode] = useState('');
  const [editCatIsActive, setEditCatIsActive] = useState(true);
  const [editSpecialConditions, setEditSpecialConditions] = useState({
    requiresRCEPolicy: false,
    requiresSSTPlan: false,
    requiresFinancialAudit: false,
    requiresISO9001: false,
    requiresTechnicalBrochure: false,
  });

  // Edit Document inline from inside an economic activity
  const [editingDocFromCategory, setEditingDocFromCategory] = useState<DocumentDefinition | null>(null);
  const [editDocName, setEditDocName] = useState('');
  const [editDocCategory, setEditDocCategory] = useState<DocumentDefinition['category']>('LEGAL');
  const [editDocValidity, setEditDocValidity] = useState('');
  const [editDocDescription, setEditDocDescription] = useState('');
  const [editDocRequiresExp, setEditDocRequiresExp] = useState(false);
  const [editDocIsActive, setEditDocIsActive] = useState(true);

  const naturalBaseConfig = baseRequirementsConfig['NATURAL'] || { mandatoryDocs: [], optionalDocs: [] };
  const juridicaBaseConfig = baseRequirementsConfig['JURIDICA'] || { mandatoryDocs: [], optionalDocs: [] };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categoriesConfig.filter((cat) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        cat.category.toLowerCase().includes(q) ||
        cat.description?.toLowerCase().includes(q) ||
        (cat.economicCode && cat.economicCode.toLowerCase().includes(q));

      const matchesRisk =
        selectedRiskFilter === 'ALL' || cat.riskLevel === selectedRiskFilter;

      const isAct = cat.isActive !== false;
      const matchesStatus =
        selectedStatusFilter === 'ALL' ||
        (selectedStatusFilter === 'ACTIVE' && isAct) ||
        (selectedStatusFilter === 'INACTIVE' && !isAct);

      return matchesSearch && matchesRisk && matchesStatus;
    });
  }, [categoriesConfig, searchQuery, selectedRiskFilter, selectedStatusFilter]);

  // Handle open edit modal
  const handleOpenEditCategory = (cat: CategoryRequirementConfig) => {
    setEditingCategory(cat);
    setEditCatName(cat.category);
    setEditCatDescription(cat.description || '');
    setEditCatRisk(cat.riskLevel || 'MEDIO');
    setEditCatEconomicCode(cat.economicCode || '');
    setEditCatIsActive(cat.isActive !== false);
    setEditSpecialConditions({
      requiresRCEPolicy: !!cat.specialConditions?.requiresRCEPolicy,
      requiresSSTPlan: !!cat.specialConditions?.requiresSSTPlan,
      requiresFinancialAudit: !!cat.specialConditions?.requiresFinancialAudit,
      requiresISO9001: !!cat.specialConditions?.requiresISO9001,
      requiresTechnicalBrochure: !!cat.specialConditions?.requiresTechnicalBrochure,
    });
  };

  // Handle submit edit category
  const handleSaveEditCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!editCatName.trim()) {
      onShowToast('El nombre de la actividad económica es obligatorio.', 'error');
      return;
    }

    updateCategoryConfig(editingCategory.category, {
      category: editCatName.trim(),
      description: editCatDescription.trim(),
      riskLevel: editCatRisk,
      economicCode: editCatEconomicCode.trim() || undefined,
      isActive: editCatIsActive,
      specialConditions: editSpecialConditions,
    });

    onShowToast(`Actividad económica "${editCatName.trim()}" actualizada exitosamente.`);
    setEditingCategory(null);
  };

  // Quick toggle category active
  const handleToggleCategoryActive = (cat: CategoryRequirementConfig) => {
    const current = cat.isActive !== false;
    updateCategoryConfig(cat.category, { isActive: !current });
    onShowToast(
      `Actividad "${cat.category}" ${!current ? 'ACTIVADA' : 'INACTIVADA'} en el sistema.`
    );
  };

  // Open Doc Definition editor directly from category row
  const handleOpenDocEditor = (doc: DocumentDefinition) => {
    setEditingDocFromCategory(doc);
    setEditDocName(doc.name);
    setEditDocCategory(doc.category);
    setEditDocValidity(doc.validityRule || '');
    setEditDocDescription(doc.description || '');
    setEditDocRequiresExp(!!doc.requiresExpirationDate);
    setEditDocIsActive(doc.isActive !== false);
  };

  const handleSaveDocFromCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocFromCategory) return;
    if (!editDocName.trim()) {
      onShowToast('El nombre del documento es obligatorio.', 'error');
      return;
    }

    updateDocumentDefinition(editingDocFromCategory.code, {
      name: editDocName.trim(),
      category: editDocCategory,
      validityRule: editDocValidity.trim() || 'Documento vigente.',
      description: editDocDescription.trim() || 'Documento de soporte oficial.',
      requiresExpirationDate: editDocRequiresExp,
      isActive: editDocIsActive,
    });

    onShowToast(`Documento "${editDocName.trim()}" actualizado correctamente.`);
    setEditingDocFromCategory(null);
  };

  // Helper to get doc status in category specific
  const getCategoryDocState = (
    cat: CategoryRequirementConfig,
    docCode: string,
    regimen: SupplierType
  ): 'MANDATORY' | 'OPTIONAL' | 'NONE' => {
    if (regimen === 'NATURAL') {
      if ((cat.mandatoryForNatural || []).includes(docCode)) return 'MANDATORY';
      if ((cat.optionalForNatural || []).includes(docCode)) return 'OPTIONAL';
      return 'NONE';
    } else {
      if ((cat.mandatoryForJuridica || []).includes(docCode)) return 'MANDATORY';
      if ((cat.optionalForJuridica || []).includes(docCode)) return 'OPTIONAL';
      return 'NONE';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>Matriz de Requisitos Específicos por Actividad Económica</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                Edición Total de Campos Habilitada
              </span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Supabase Sincronizado
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Parametrice los documentos técnicos, pólizas, condiciones y soportes exigibles para cada línea de bienes y servicios.
            </p>
          </div>

          <button
            onClick={onOpenNewCategoryModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Actividad Económica</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por actividad, CIIU o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-400 font-bold px-2 text-[10px]">RIESGO:</span>
            {(['ALL', 'CRITICO', 'ALTO', 'MEDIO', 'BAJO'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRiskFilter(r)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                  selectedRiskFilter === r
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'ALL' ? 'Todos' : r}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-400 font-bold px-2 text-[10px]">ESTADO:</span>
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer ${
                  selectedStatusFilter === s
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s === 'ALL' ? 'Todas' : s === 'ACTIVE' ? 'Activas' : 'Inactivas'}
              </button>
            ))}
          </div>

          {/* Regimen view toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setSelectedRegimenView('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer ${
                selectedRegimenView === 'ALL' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'
              }`}
            >
              Ambos Regímenes
            </button>
            <button
              onClick={() => setSelectedRegimenView('NATURAL')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer ${
                selectedRegimenView === 'NATURAL' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'
              }`}
            >
              Solo Natural
            </button>
            <button
              onClick={() => setSelectedRegimenView('JURIDICA')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer ${
                selectedRegimenView === 'JURIDICA' ? 'bg-blue-700 text-white shadow-2xs' : 'text-slate-600'
              }`}
            >
              Solo Jurídica
            </button>
          </div>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-slate-600 flex-wrap">
          <span className="font-bold text-slate-700">Convención de Estados por Actividad:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-700 inline-block" />
            <span className="font-semibold text-blue-950">Obligatorio Específico</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-cyan-600 inline-block" />
            <span className="font-semibold text-cyan-950">Opcional / Condicional</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" />
            <span className="text-slate-500 font-medium">Inactivo / No Exigido</span>
          </div>
        </div>
        <div className="text-[11px] text-blue-800 font-medium">
          💡 Los requisitos específicos se suman a los Requisitos Base del Tipo de Persona.
        </div>
      </div>

      {/* Category Cards List */}
      <div className="space-y-4">
        {categoriesConfig.length === 0 ? (
          <div className="bg-white p-10 sm:p-14 rounded-2xl border-2 border-dashed border-blue-200 text-center space-y-4 animate-in fade-in">
            <div className="w-16 h-16 bg-blue-50 text-blue-700 rounded-2xl mx-auto flex items-center justify-center border border-blue-100 shadow-inner">
              <Briefcase className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-base font-extrabold text-slate-900">
                Matriz de Actividades Económicas Lista para Registro Real
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Se ha vaciado la información demo de la base de datos. Como Administrador, ahora puede registrar las actividades económicas, líneas de contratación y suministros reales de <strong>Flota Sugamuxi S.A.</strong>, asociar requisitos y parametrizar la vigencia documental.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenNewCategoryModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer hover:shadow-lg active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Registrar Primera Actividad Económica Real</span>
              </button>
            </div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
            No se encontraron actividades económicas con los filtros seleccionados.
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const isExpanded = expandedCategory === cat.category;
            const isAct = cat.isActive !== false;

            const riskColors: Record<string, string> = {
              BAJO: 'bg-blue-50 text-blue-800 border-blue-200',
              MEDIO: 'bg-cyan-50 text-cyan-800 border-cyan-200',
              ALTO: 'bg-slate-100 text-slate-800 border-slate-300',
              CRITICO: 'bg-blue-900 text-cyan-200 border-blue-800',
            };

            const natMandatoryCount = (cat.mandatoryForNatural || []).length;
            const natOptionalCount = (cat.optionalForNatural || []).length;
            const jurMandatoryCount = (cat.mandatoryForJuridica || []).length;
            const jurOptionalCount = (cat.optionalForJuridica || []).length;

            return (
              <div
                key={cat.category}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  !isAct
                    ? 'border-slate-200 bg-slate-50/50 opacity-80'
                    : 'border-slate-200 shadow-2xs hover:shadow-xs'
                }`}
              >
                {/* Header Bar */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <div className="flex items-start sm:items-center gap-3">
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : cat.category)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title={isExpanded ? 'Contraer matriz' : 'Desplegar matriz'}
                    >
                      <ChevronDown
                        className={`w-5 h-5 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                          {cat.category}
                        </h3>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            isAct
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-slate-200 text-slate-600 border-slate-300'
                          }`}
                        >
                          {isAct ? 'ACTIVA' : 'INACTIVA'}
                        </span>

                        {/* Risk Badge */}
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            riskColors[cat.riskLevel || 'MEDIO'] || riskColors['MEDIO']
                          }`}
                        >
                          Riesgo {cat.riskLevel || 'MEDIO'}
                        </span>

                        {cat.economicCode && (
                          <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-bold">
                            CIIU: {cat.economicCode}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                    </div>
                  </div>

                  {/* Summary Badges & Action Buttons */}
                  <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="bg-blue-50/70 px-2.5 py-1 rounded-lg border border-blue-200">
                        <span className="text-blue-900 font-semibold">P. Natural: </span>
                        <strong className="text-blue-700">+{natMandatoryCount} Ob.</strong>
                        {natOptionalCount > 0 && (
                          <span className="text-cyan-700 font-bold"> / {natOptionalCount} Op.</span>
                        )}
                      </div>
                      <div className="bg-blue-50/70 px-2.5 py-1 rounded-lg border border-blue-200">
                        <span className="text-blue-900 font-semibold">P. Jurídica: </span>
                        <strong className="text-blue-700">+{jurMandatoryCount} Ob.</strong>
                        {jurOptionalCount > 0 && (
                          <span className="text-cyan-700 font-bold"> / {jurOptionalCount} Op.</span>
                        )}
                      </div>
                    </div>

                    {/* Quick Inactivate / Activate Toggle */}
                    <button
                      onClick={() => handleToggleCategoryActive(cat)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                        isAct
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-300'
                          : 'bg-blue-600 text-white hover:bg-blue-500 border-blue-600'
                      }`}
                      title={isAct ? 'Inactivar esta actividad económica' : 'Activar esta actividad económica'}
                    >
                      {isAct ? 'Inactivar' : 'Activar'}
                    </button>

                    {/* Edit Activity Button */}
                    <button
                      onClick={() => handleOpenEditCategory(cat)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                      title="Editar todos los campos de la actividad"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete Activity Button */}
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `¿Está seguro de eliminar permanentemente la actividad "${cat.category}"?`
                          )
                        ) {
                          const res = deleteCategoryConfig(cat.category);
                          if (res.success) onShowToast(res.message);
                          else onShowToast(res.message, 'error');
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"
                      title="Eliminar actividad"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Interactive Requirements Table */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-white space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-slate-600">
                        Configure los documentos exigidos específicamente para la actividad <strong>{cat.category}</strong>:
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Filtrar documentos en esta actividad..."
                            value={innerDocSearch}
                            onChange={(e) => setInnerDocSearch(e.target.value)}
                            className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500 w-56"
                          />
                        </div>

                        <button
                          onClick={onOpenNewDocModal}
                          className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Crear tipo documental</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="sm:hidden px-3 py-1 bg-blue-50/60 border border-b-0 border-slate-200 rounded-t-xl text-[10px] text-blue-900 flex items-center justify-between font-medium">
                        <span>Desliza horizontalmente para ver las columnas</span>
                        <span className="font-bold">↔</span>
                      </div>
                      <div className="overflow-x-auto border border-slate-200 rounded-b-xl sm:rounded-t-xl">
                        <table className="w-full text-left text-xs divide-y divide-slate-200 min-w-[700px] lg:min-w-full">
                        <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Código & Tipo de Documento</th>
                            <th className="px-3 py-3">Clasificación SIG</th>
                            {(selectedRegimenView === 'ALL' || selectedRegimenView === 'NATURAL') && (
                              <th className="px-4 py-3 text-center bg-blue-50/50 border-l border-r border-blue-100">
                                Persona Natural
                              </th>
                            )}
                            {(selectedRegimenView === 'ALL' || selectedRegimenView === 'JURIDICA') && (
                              <th className="px-4 py-3 text-center bg-blue-50/50 border-r border-blue-100">
                                Persona Jurídica
                              </th>
                            )}
                            <th className="px-3 py-3 text-center">Control de Vigencia</th>
                            <th className="px-3 py-3">Regla de Validez / Vigencia</th>
                            <th className="px-3 py-3 text-right">Editar Documento</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {documentDefinitions
                            .filter((d) => {
                              if (d.code === 'FS_GA_FOR_009' || d.code === 'FS_GA_FOR_039') return false;
                              if (!innerDocSearch.trim()) return true;
                              const q = innerDocSearch.toLowerCase();
                              return (
                                d.name.toLowerCase().includes(q) ||
                                d.code.toLowerCase().includes(q) ||
                                d.category.toLowerCase().includes(q) ||
                                (d.validityRule && d.validityRule.toLowerCase().includes(q))
                              );
                            })
                            .map((doc) => {
                              const natState = getCategoryDocState(cat, doc.code, 'NATURAL');
                              const jurState = getCategoryDocState(cat, doc.code, 'JURIDICA');
                              const isBaseNat = (naturalBaseConfig.mandatoryDocs || []).includes(doc.code);
                              const isBaseJur = (juridicaBaseConfig.mandatoryDocs || []).includes(doc.code);
                              const isInactiveDoc = doc.isActive === false;

                              return (
                                <tr
                                  key={doc.code}
                                  className={`hover:bg-slate-50/70 transition-colors ${
                                    isInactiveDoc ? 'bg-slate-50/50 opacity-60' : ''
                                  }`}
                                >
                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                                      <span>{doc.name}</span>
                                      {isInactiveDoc && (
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
                                  </td>

                                  <td className="px-3 py-3">
                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                                      {doc.category}
                                    </span>
                                  </td>

                                  {/* Persona Natural Controls */}
                                  {(selectedRegimenView === 'ALL' || selectedRegimenView === 'NATURAL') && (
                                    <td className="px-4 py-3 text-center bg-blue-50/20 border-l border-r border-blue-100">
                                      {isBaseNat ? (
                                        <span className="px-2.5 py-1 bg-blue-100 text-blue-900 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                                          <User className="w-3 h-3" /> Requisito Base Universal
                                        </span>
                                      ) : (
                                        <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                                          <button
                                            onClick={() => {
                                              toggleDocumentRequirement(cat.category, doc.code, 'NATURAL', 'MANDATORY');
                                              onShowToast(`"${doc.name}" configurado como OBLIGATORIO para Persona Natural en ${cat.category}`);
                                            }}
                                            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                                              natState === 'MANDATORY'
                                                ? 'bg-blue-700 text-white shadow-xs'
                                                : 'text-slate-500 hover:text-slate-900'
                                            }`}
                                          >
                                            Obligatorio
                                          </button>
                                          <button
                                            onClick={() => {
                                              toggleDocumentRequirement(cat.category, doc.code, 'NATURAL', 'OPTIONAL');
                                              onShowToast(`"${doc.name}" configurado como OPCIONAL para Persona Natural en ${cat.category}`);
                                            }}
                                            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                                              natState === 'OPTIONAL'
                                                ? 'bg-cyan-700 text-white shadow-xs'
                                                : 'text-slate-500 hover:text-slate-900'
                                            }`}
                                          >
                                            Opcional
                                          </button>
                                          <button
                                            onClick={() => {
                                              toggleDocumentRequirement(cat.category, doc.code, 'NATURAL', 'NONE');
                                              onShowToast(`"${doc.name}" INACTIVADO / NO APLICA para Persona Natural en ${cat.category}`);
                                            }}
                                            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                                              natState === 'NONE'
                                                ? 'bg-slate-400 text-white shadow-xs'
                                                : 'text-slate-400 hover:text-slate-700'
                                            }`}
                                          >
                                            Inactivar
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  )}

                                  {/* Persona Juridica Controls */}
                                  {(selectedRegimenView === 'ALL' || selectedRegimenView === 'JURIDICA') && (
                                    <td className="px-4 py-3 text-center bg-blue-50/20 border-r border-blue-100">
                                      {isBaseJur ? (
                                        <span className="px-2.5 py-1 bg-blue-100 text-blue-900 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                                          <Building2 className="w-3 h-3" /> Requisito Base Universal
                                        </span>
                                      ) : (
                                        <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                                          <button
                                            onClick={() => {
                                              toggleDocumentRequirement(cat.category, doc.code, 'JURIDICA', 'MANDATORY');
                                              onShowToast(`"${doc.name}" configurado como OBLIGATORIO para Persona Jurídica en ${cat.category}`);
                                            }}
                                            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                                              jurState === 'MANDATORY'
                                                ? 'bg-blue-700 text-white shadow-xs'
                                                : 'text-slate-500 hover:text-slate-900'
                                            }`}
                                          >
                                            Obligatorio
                                          </button>
                                          <button
                                            onClick={() => {
                                              toggleDocumentRequirement(cat.category, doc.code, 'JURIDICA', 'OPTIONAL');
                                              onShowToast(`"${doc.name}" configurado como OPCIONAL para Persona Jurídica en ${cat.category}`);
                                            }}
                                            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                                              jurState === 'OPTIONAL'
                                                ? 'bg-cyan-700 text-white shadow-xs'
                                                : 'text-slate-500 hover:text-slate-900'
                                            }`}
                                          >
                                            Opcional
                                          </button>
                                          <button
                                            onClick={() => {
                                              toggleDocumentRequirement(cat.category, doc.code, 'JURIDICA', 'NONE');
                                              onShowToast(`"${doc.name}" INACTIVADO / NO APLICA para Persona Jurídica en ${cat.category}`);
                                            }}
                                            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                                              jurState === 'NONE'
                                                ? 'bg-slate-400 text-white shadow-xs'
                                                : 'text-slate-400 hover:text-slate-700'
                                            }`}
                                          >
                                            Inactivar
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  )}

                                  {/* Control de Vigencia y Vencimiento */}
                                  <td className="px-3 py-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newRequiresExp = !doc.requiresExpirationDate;
                                        updateDocumentDefinition(doc.code, {
                                          requiresExpirationDate: newRequiresExp,
                                          validityRule: newRequiresExp && (!doc.validityRule || doc.validityRule.includes('permanente'))
                                            ? 'Vigencia sujeta a fecha de vencimiento.'
                                            : doc.validityRule,
                                        });
                                        onShowToast(
                                          `"${doc.name}": ${newRequiresExp ? 'Control de VIGENCIA ACTIVADO (Exigirá fecha de vencimiento y semáforo)' : 'Control de vigencia marcado como PERMANENTE (Sin caducidad)'}`,
                                          newRequiresExp ? 'success' : 'success'
                                        );
                                      }}
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                        doc.requiresExpirationDate
                                          ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-2xs'
                                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                      }`}
                                      title="Clic para alternar si este documento exige fecha de vencimiento y calcula semáforo de vigencia"
                                    >
                                      {doc.requiresExpirationDate ? (
                                        <>
                                          <Clock className="w-3 h-3 text-amber-700" />
                                          <span>Con Vencimiento</span>
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="w-3 h-3 text-slate-400" />
                                          <span>Permanente</span>
                                        </>
                                      )}
                                    </button>
                                  </td>

                                  <td className="px-3 py-3 text-slate-600 text-[11px]">
                                    <div className="font-medium">{doc.validityRule || 'Documento vigente.'}</div>
                                    <div className="text-[10px] text-slate-400 line-clamp-1">{doc.description}</div>
                                  </td>

                                  <td className="px-3 py-3 text-right">
                                    <button
                                      onClick={() => handleOpenDocEditor(doc)}
                                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                                      title="Editar todos los campos de este documento"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Editar Actividad Económica */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="bg-[#0b1329] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-cyan-300">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Editar Actividad Económica & Parámetros</h3>
                  <p className="text-[11px] text-cyan-300">{editingCategory.category}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEditCategory} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre de la Actividad Económica o Servicio *
                </label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nivel de Riesgo Operativo / SIG
                  </label>
                  <select
                    value={editCatRisk}
                    onChange={(e: any) => setEditCatRisk(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="BAJO">Bajo</option>
                    <option value="MEDIO">Medio</option>
                    <option value="ALTO">Alto</option>
                    <option value="CRITICO">Crítico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código CIIU (Opcional)
                  </label>
                  <input
                    type="text"
                    value={editCatEconomicCode}
                    onChange={(e) => setEditCatEconomicCode(e.target.value)}
                    placeholder="Ej: 4921, 4520..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estado de Disponibilidad
                  </label>
                  <select
                    value={editCatIsActive ? 'ACTIVE' : 'INACTIVE'}
                    onChange={(e) => setEditCatIsActive(e.target.value === 'ACTIVE')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ACTIVE">Activa (Disponible)</option>
                    <option value="INACTIVE">Inactiva (Oculta en radicación)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción o Alcance de la Actividad
                </label>
                <textarea
                  rows={2}
                  value={editCatDescription}
                  onChange={(e) => setEditCatDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Special Conditions Checkboxes */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Condiciones Especiales y Pólizas Exigidas por Defecto:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editSpecialConditions.requiresRCEPolicy}
                      onChange={(e) =>
                        setEditSpecialConditions((prev) => ({ ...prev, requiresRCEPolicy: e.target.checked }))
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-700 font-medium">Exigir Póliza de Responsabilidad Civil Extracontractual</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editSpecialConditions.requiresSSTPlan}
                      onChange={(e) =>
                        setEditSpecialConditions((prev) => ({ ...prev, requiresSSTPlan: e.target.checked }))
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-700 font-medium">Exigir Plan de Seguridad y Salud en el Trabajo (SST)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editSpecialConditions.requiresISO9001}
                      onChange={(e) =>
                        setEditSpecialConditions((prev) => ({ ...prev, requiresISO9001: e.target.checked }))
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-700 font-medium">Exigir Certificación de Calidad ISO 9001 / NTC</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editSpecialConditions.requiresFinancialAudit}
                      onChange={(e) =>
                        setEditSpecialConditions((prev) => ({ ...prev, requiresFinancialAudit: e.target.checked }))
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-700 font-medium">Exigir Dictamen de Revisoría Fiscal / Auditoría</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={editSpecialConditions.requiresTechnicalBrochure}
                      onChange={(e) =>
                        setEditSpecialConditions((prev) => ({ ...prev, requiresTechnicalBrochure: e.target.checked }))
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="text-slate-700 font-medium">Exigir Carpeta de Servicios, Brochure Técnico o Cotización Oficial</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-2xs cursor-pointer"
                >
                  Guardar Todos los Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Documento Directamente desde la Actividad */}
      {editingDocFromCategory && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="bg-[#0b1329] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm">Editar Parámetros del Documento</h3>
                <p className="text-[11px] text-cyan-300 font-mono">Código: {editingDocFromCategory.code}</p>
              </div>
              <button
                onClick={() => setEditingDocFromCategory(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveDocFromCategory} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Oficial del Documento *
                </label>
                <input
                  type="text"
                  required
                  value={editDocName}
                  onChange={(e) => setEditDocName(e.target.value)}
                  placeholder="Ej: Certificado de Calidad..."
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

              {/* Parametrización de Vigencia y Vencimiento */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                <label className="flex items-center gap-2.5 text-xs text-amber-950 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editDocRequiresExp}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setEditDocRequiresExp(checked);
                      if (!checked) {
                        setEditDocValidity('Documento permanente sin fecha de caducidad.');
                      } else if (!editDocValidity || editDocValidity.includes('permanente')) {
                        setEditDocValidity('Vigencia periódica requerida sujeta a fecha de vencimiento.');
                      }
                    }}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span>¿Este documento tiene fecha de vencimiento? (Control de Vigencia SIG)</span>
                </label>
                
                {editDocRequiresExp ? (
                  <div className="space-y-2.5 pl-6 pt-1 border-t border-amber-200/80 animate-in fade-in">
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      Al activar esta opción, SIGEPRO exigirá obligatoriamente ingresar la <strong>fecha de vencimiento</strong> al radicar el documento y calculará automáticamente en los expedientes:
                      <span className="block mt-1 text-[10px] text-slate-700 font-mono">
                        🟢 Vigente (&gt;30d) &nbsp;|&nbsp; 🟡 Por vencer (≤30d) &nbsp;|&nbsp; 🔴 Vencido (&lt;0d)
                      </span>
                    </p>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Períodos Frecuentes de Renovación (Presets sugeridos):
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: '30 días (PILA / Banco / Cámara)', rule: 'Expedición no mayor a 30 días calendario.' },
                          { label: '90 días (Trimestral)', rule: 'Vigencia trimestral no mayor a 90 días calendario.' },
                          { label: '180 días (Semestral)', rule: 'Vigencia semestral (180 días).' },
                          { label: '365 días (1 Año: Pólizas / Calidad ISO)', rule: 'Vigencia anual de 365 días calendario.' },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setEditDocValidity(preset.rule)}
                            className="px-2 py-1 bg-white hover:bg-amber-100 border border-amber-300 rounded-md text-[10px] font-semibold text-amber-950 transition-colors cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-600 pl-6">
                    Este requisito se considerará <strong>Permanente</strong> (sin semáforo de expiración periódica).
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDocFromCategory(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-2xs cursor-pointer"
                >
                  Guardar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
