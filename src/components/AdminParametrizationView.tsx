import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  CategoryRequirementConfig,
  BankParameter,
  BankAccountTypeParameter,
  DocumentTypeParameter,
  TaxRegimeParameter,
  CityParameter,
  ArlRiskParameter,
  ConvocatoriaTypeParameter,
  RejectionReasonParameter,
  GlobalSystemSettings,
} from '../types';
import {
  Settings,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  Building2,
  CreditCard,
  FileText,
  ShieldCheck,
  MapPin,
  Briefcase,
  AlertCircle,
  RotateCcw,
  Download,
  Upload,
  Sliders,
  SlidersHorizontal,
  Info,
  Check,
  X,
  FileSpreadsheet,
  HelpCircle,
  User,
  Sparkles,
  Lock,
  Zap,
} from 'lucide-react';
import { generateDocumentCodeSuggestions } from '../utils/documentCodeGenerator';
import { FlotaSugamuxiLogo } from './FlotaSugamuxiLogo';
import { BaseRequirementsTab } from './matrix/BaseRequirementsTab';
import { EconomicActivitiesTab } from './matrix/EconomicActivitiesTab';
import { DocumentCatalogTab } from './matrix/DocumentCatalogTab';
import { MatrixSimulatorTab } from './matrix/MatrixSimulatorTab';

export type ParamTab =
  // Matriz de Requisitos Documentales
  | 'matrix_base'
  | 'matrix_activities'
  | 'matrix_documents'
  | 'matrix_simulator'
  // Catálogos y Listas Maestras
  | 'categories'
  | 'banks'
  | 'bankAccountTypes'
  | 'documentTypes'
  | 'taxRegimes'
  | 'cities'
  | 'arlRiskLevels'
  | 'convocatoriaTypes'
  | 'rejectionReasons'
  // Configuración Global
  | 'globalSettings';

export interface AdminParametrizationViewProps {
  initialTab?: ParamTab;
}

export const AdminParametrizationView: React.FC<AdminParametrizationViewProps> = ({ initialTab }) => {
  const {
    role,
    setRole,
    setActiveView,
    categoriesConfig,
    addCategoryConfig,
    updateCategoryConfig,
    deleteCategoryConfig,
    toggleDocumentRequirement,
    systemParameters,
    updateGlobalSettings,
    addBankParameter,
    updateBankParameter,
    deleteBankParameter,
    addBankAccountTypeParameter,
    updateBankAccountTypeParameter,
    deleteBankAccountTypeParameter,
    addDocumentTypeParameter,
    updateDocumentTypeParameter,
    deleteDocumentTypeParameter,
    addTaxRegimeParameter,
    updateTaxRegimeParameter,
    deleteTaxRegimeParameter,
    addCityParameter,
    updateCityParameter,
    deleteCityParameter,
    addArlRiskParameter,
    updateArlRiskParameter,
    deleteArlRiskParameter,
    addConvocatoriaTypeParameter,
    updateConvocatoriaTypeParameter,
    deleteConvocatoriaTypeParameter,
    addRejectionReasonParameter,
    updateRejectionReasonParameter,
    deleteRejectionReasonParameter,
    resetSystemParametersToDefault,
    importSystemParametersJson,
    documentDefinitions,
    baseRequirementsConfig,
    addDocumentDefinition,
    resetMatrixToDefault,
    showToast,
    addSystemAuditLog,
  } = useApp();

  const [activeTab, setActiveTab] = useState<ParamTab>(initialTab || 'matrix_base');
  const [activeSectionFilter, setActiveSectionFilter] = useState<'ALL' | 'MATRIX' | 'CATALOGS' | 'GLOBAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Matrix Modals State
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);
  const [targetCategoryForNewDoc, setTargetCategoryForNewDoc] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [newCatRisk, setNewCatRisk] = useState<'ALTO' | 'MEDIO' | 'BAJO' | 'CRITICO'>('MEDIO');
  const [newCatEconomicCode, setNewCatEconomicCode] = useState('');
  const [newCatMandatoryNat, setNewCatMandatoryNat] = useState<string[]>([]);
  const [newCatMandatoryJur, setNewCatMandatoryJur] = useState<string[]>([]);

  const [newDocCode, setNewDocCode] = useState('');
  const [newDocName, setNewDocName] = useState('');
  const [isDocCodeCustomized, setIsDocCodeCustomized] = useState(false);
  const [newDocCategory, setNewDocCategory] = useState<
    'LEGAL' | 'FINANCIERO' | 'TECNICO' | 'HSEQ' | 'SARLAFT' | 'OPERATIVO'
  >('TECNICO');
  const [newDocDescription, setNewDocDescription] = useState('');
  const [newDocValidityRule, setNewDocValidityRule] = useState('');
  const [newDocRequiresExp, setNewDocRequiresExp] = useState(false);

  const docCodeSuggestions = useMemo(() => {
    return generateDocumentCodeSuggestions(newDocName);
  }, [newDocName]);

  const handleDocNameChange = (val: string) => {
    setNewDocName(val);
    if (!isDocCodeCustomized) {
      const suggestions = generateDocumentCodeSuggestions(val);
      setNewDocCode(suggestions.primary);
    }
  };

  const handleDocCodeChange = (val: string) => {
    setNewDocCode(val.toUpperCase().replace(/\s+/g, '_'));
    setIsDocCodeCustomized(true);
  };

  const handleApplyDocCodeSuggestion = (suggestionCode: string) => {
    setNewDocCode(suggestionCode);
    setIsDocCodeCustomized(true);
  };

  const handleResetToAutoCode = () => {
    setIsDocCodeCustomized(false);
    const suggestions = generateDocumentCodeSuggestions(newDocName);
    setNewDocCode(suggestions.primary);
  };

  // Handle saving new category for matrix
  const handleSaveNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showToast('Debe ingresar el nombre del servicio o actividad económica.', 'error');
      return;
    }

    const res = addCategoryConfig({
      category: newCatName.trim(),
      description: newCatDescription.trim() || 'Servicio registrado en Flota Sugamuxi S.A.',
      riskLevel: newCatRisk,
      economicCode: newCatEconomicCode.trim() || undefined,
      mandatoryForNatural: [],
      mandatoryForJuridica: [],
      optionalForNatural: [],
      optionalForJuridica: [],
      isActive: true,
    });

    if (res.success) {
      showToast(res.message, 'success');
      setIsNewCategoryModalOpen(false);
      setNewCatName('');
      setNewCatDescription('');
      setNewCatEconomicCode('');
      setNewCatMandatoryNat([]);
      setNewCatMandatoryJur([]);
    } else {
      showToast(res.message, 'error');
    }
  };

  // Handle saving new document definition
  const handleSaveNewDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocCode.trim() || !newDocName.trim()) {
      showToast('El código y nombre del documento son obligatorios.', 'error');
      return;
    }

    const finalDocCode = newDocCode.trim().toUpperCase().replace(/\s+/g, '_');
    const res = addDocumentDefinition({
      code: finalDocCode,
      name: newDocName.trim(),
      category: newDocCategory,
      description: newDocDescription.trim() || 'Documento soporte SIG.',
      validityRule: newDocValidityRule.trim() || 'Vigente.',
      requiresExpirationDate: newDocRequiresExp,
      isActive: true,
      suggestedFileTypes: ['PDF'],
    });

    if (res.success) {
      if (targetCategoryForNewDoc) {
        toggleDocumentRequirement(targetCategoryForNewDoc, finalDocCode, 'JURIDICA', 'MANDATORY');
        toggleDocumentRequirement(targetCategoryForNewDoc, finalDocCode, 'NATURAL', 'MANDATORY');
        showToast(`Documento "${newDocName.trim()}" registrado y vinculado como OBLIGATORIO a ${targetCategoryForNewDoc}.`, 'success');
      } else {
        showToast(res.message, 'success');
      }
      setIsNewDocModalOpen(false);
      setTargetCategoryForNewDoc(null);
      setIsDocCodeCustomized(false);
      setNewDocCode('');
      setNewDocName('');
      setNewDocDescription('');
      setNewDocValidityRule('');
      setNewDocRequiresExp(false);
    } else {
      showToast(res.message, 'error');
    }
  };

  const toggleDocInNewCat = (code: string, target: 'NAT' | 'JUR') => {
    if (target === 'NAT') {
      setNewCatMandatoryNat((prev) =>
        prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
      );
    } else {
      setNewCatMandatoryJur((prev) =>
        prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
      );
    }
  };

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ id: string; name: string; type: string } | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  // Category Form State
  const [categoryForm, setCategoryForm] = useState<{
    category: string;
    description: string;
    riskLevel: 'ALTO' | 'MEDIO' | 'BAJO';
    mandatoryForNatural: string[];
    mandatoryForJuridica: string[];
  }>({
    category: '',
    description: '',
    riskLevel: 'MEDIO',
    mandatoryForNatural: ['PORTAFOLIO_SERVICIOS'],
    mandatoryForJuridica: ['PORTAFOLIO_SERVICIOS'],
  });

  // Generic Parameter Form State
  const [genericForm, setGenericForm] = useState<{
    name: string;
    code: string;
    description?: string;
    department?: string;
    category?: string;
    bankType?: 'BANCO' | 'COOPERATIVA' | 'BILLETERA_DIGITAL';
    percentage?: number;
    appliesTo?: 'NATURAL' | 'JURIDICA' | 'AMBOS';
    isActive: boolean;
  }>({
    name: '',
    code: '',
    description: '',
    department: 'Boyacá',
    category: 'GENERAL',
    bankType: 'BANCO',
    percentage: 0.522,
    appliesTo: 'AMBOS',
    isActive: true,
  });

  // Global Settings Form State
  const [settingsForm, setSettingsForm] = useState<GlobalSystemSettings>(
    systemParameters.globalSettings || {
      companyName: 'Flota Sugamuxi S.A.',
      companyNit: '891.800.075-8',
      systemVersion: 'SIG-PROV v3.5',
      maxFileUploadSizeMB: 15,
      allowedFileExtensions: ['pdf', 'png', 'jpg', 'jpeg'],
      dossierValidityDays: 365,
      enableAutoEmailNotifications: true,
      contactEmailSIG: 'compras@flotasugamuxisa.com.co',
      contactPhoneSIG: '(608) 770 2030 Ext. 104',
      directorComprasName: 'Julian Salgado - Director Administrativo y SIG',
      habeasDataPolicyVersion: 'v2.4 - 2026',
      platformMaintenanceMode: false,
    }
  );

  // Sync settings when context changes
  React.useEffect(() => {
    if (systemParameters.globalSettings) {
      setSettingsForm(systemParameters.globalSettings);
    }
  }, [systemParameters.globalSettings]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingItem(null);
    if (activeTab === 'categories') {
      setCategoryForm({
        category: '',
        description: '',
        riskLevel: 'MEDIO',
        mandatoryForNatural: ['PORTAFOLIO_SERVICIOS'],
        mandatoryForJuridica: ['PORTAFOLIO_SERVICIOS'],
      });
    } else {
      setGenericForm({
        name: '',
        code: '',
        description: '',
        department: 'Boyacá',
        category: 'GENERAL',
        bankType: 'BANCO',
        percentage: 0.522,
        appliesTo: 'AMBOS',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    if (activeTab === 'categories') {
      setCategoryForm({
        category: item.category,
        description: item.description || '',
        riskLevel: item.riskLevel || 'MEDIO',
        mandatoryForNatural: item.mandatoryForNatural || [],
        mandatoryForJuridica: item.mandatoryForJuridica || [],
      });
    } else {
      setGenericForm({
        name: item.name,
        code: item.code || '',
        description: item.description || '',
        department: item.department || 'Boyacá',
        category: item.category || 'GENERAL',
        bankType: item.bankType || 'BANCO',
        percentage: item.percentage !== undefined ? item.percentage : 0.522,
        appliesTo: item.appliesTo || 'AMBOS',
        isActive: item.isActive !== undefined ? item.isActive : true,
      });
    }
    setIsModalOpen(true);
  };

  // Save Modal Form
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'categories') {
      if (!categoryForm.category.trim()) {
        showToast('El nombre de la categoría es obligatorio.', 'error');
        return;
      }

      if (editingItem) {
        // Update existing category
        updateCategoryConfig(editingItem.category, {
          category: categoryForm.category.trim(),
          description: categoryForm.description.trim(),
          riskLevel: categoryForm.riskLevel,
        });
        showToast(`Categoría "${categoryForm.category}" actualizada con éxito.`, 'success', 'Categoría Actualizada');
      } else {
        // Create new category
        const res = addCategoryConfig({
          id: `cat-${Date.now()}`,
          category: categoryForm.category.trim(),
          description: categoryForm.description.trim() || 'Categoría de bienes o servicios para Flota Sugamuxi S.A.',
          riskLevel: categoryForm.riskLevel,
          mandatoryForNatural: categoryForm.mandatoryForNatural,
          mandatoryForJuridica: categoryForm.mandatoryForJuridica,
          optionalForNatural: [],
          optionalForJuridica: [],
        });
        if (!res.success) {
          showToast(res.message, 'error', 'Error al Guardar');
          return;
        }
      }
    } else if (activeTab === 'banks') {
      if (!genericForm.name.trim()) return;
      if (editingItem) {
        updateBankParameter(editingItem.id, {
          name: genericForm.name.trim(),
          code: genericForm.code.trim().toUpperCase(),
          bankType: genericForm.bankType,
          isActive: genericForm.isActive,
        });
      } else {
        addBankParameter({
          name: genericForm.name.trim(),
          code: genericForm.code.trim().toUpperCase(),
          bankType: genericForm.bankType || 'BANCO',
          isActive: genericForm.isActive,
        });
      }
    } else if (activeTab === 'bankAccountTypes') {
      if (!genericForm.name.trim()) return;
      if (editingItem) {
        updateBankAccountTypeParameter(editingItem.id, {
          name: genericForm.name.trim(),
          code: genericForm.code.trim().toUpperCase(),
          isActive: genericForm.isActive,
        });
      } else {
        addBankAccountTypeParameter({
          name: genericForm.name.trim(),
          code: genericForm.code.trim().toUpperCase(),
          isActive: genericForm.isActive,
        });
      }
    } else if (activeTab === 'documentTypes') {
      if (!genericForm.name.trim()) return;
      if (editingItem) {
        updateDocumentTypeParameter(editingItem.id, {
          name: genericForm.name.trim(),
          code: genericForm.code.trim().toUpperCase(),
          appliesTo: genericForm.appliesTo,
          isActive: genericForm.isActive,
        });
      } else {
        addDocumentTypeParameter({
          name: genericForm.name.trim(),
          code: genericForm.code.trim().toUpperCase(),
          appliesTo: genericForm.appliesTo || 'AMBOS',
          isActive: genericForm.isActive,
        });
      }
    } else if (activeTab === 'taxRegimes') {
      if (!genericForm.name.trim()) return;
      if (editingItem) {
        updateTaxRegimeParameter(editingItem.id, {
          name: genericForm.name.trim(),
          code: genericForm.code.trim().toUpperCase(),
          description: genericForm.description,
          isActive: genericForm.isActive,
        });
      } else {
        addTaxRegimeParameter({
          name: genericForm.name.trim(),
          code: genericForm.code.trim().toUpperCase(),
          description: genericForm.description,
          isActive: genericForm.isActive,
        });
      }
    } else if (activeTab === 'cities') {
      if (!genericForm.name.trim() || !genericForm.department?.trim()) return;
      if (editingItem) {
        updateCityParameter(editingItem.id, {
          name: genericForm.name.trim(),
          department: genericForm.department.trim(),
          code: genericForm.code.trim().toUpperCase(),
          isActive: genericForm.isActive,
        });
      } else {
        addCityParameter({
          name: genericForm.name.trim(),
          department: genericForm.department.trim(),
          code: genericForm.code.trim().toUpperCase(),
          isActive: genericForm.isActive,
        });
      }
    } else if (activeTab === 'arlRiskLevels') {
      if (!genericForm.name.trim()) return;
      if (editingItem) {
        updateArlRiskParameter(editingItem.id, {
          name: genericForm.name.trim(),
          code: genericForm.code.trim().toUpperCase(),
          percentage: Number(genericForm.percentage) || 0.522,
          description: genericForm.description,
          isActive: genericForm.isActive,
        });
      } else {
        addArlRiskParameter({
          name: genericForm.name.trim(),
          code: genericForm.code.trim().toUpperCase(),
          percentage: Number(genericForm.percentage) || 0.522,
          description: genericForm.description,
          isActive: genericForm.isActive,
        });
      }
    } else if (activeTab === 'convocatoriaTypes') {
      if (!genericForm.name.trim()) return;
      if (editingItem) {
        updateConvocatoriaTypeParameter(editingItem.id, {
          name: genericForm.name.trim(),
          code: genericForm.code.trim().toUpperCase(),
          description: genericForm.description,
          isActive: genericForm.isActive,
        });
      } else {
        addConvocatoriaTypeParameter({
          name: genericForm.name.trim(),
          code: genericForm.code.trim().toUpperCase(),
          description: genericForm.description,
          isActive: genericForm.isActive,
        });
      }
    } else if (activeTab === 'rejectionReasons') {
      if (!genericForm.name.trim()) return;
      if (editingItem) {
        updateRejectionReasonParameter(editingItem.id, {
          name: genericForm.name.trim(),
          code: genericForm.code.trim().toUpperCase(),
          category: genericForm.category,
          isActive: genericForm.isActive,
        });
      } else {
        addRejectionReasonParameter({
          name: genericForm.name.trim(),
          code: genericForm.code.trim().toUpperCase(),
          category: genericForm.category,
          isActive: genericForm.isActive,
        });
      }
    }

    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Delete Action Confirm
  const executeDelete = () => {
    if (!deleteConfirmItem) return;
    const { id, name, type } = deleteConfirmItem;

    if (type === 'category') {
      const res = deleteCategoryConfig(id);
      if (!res.success) {
        showToast(res.message, 'error', 'No se pudo eliminar');
      } else {
        showToast(`Categoría "${name}" eliminada del catálogo.`, 'info');
      }
    } else if (type === 'bank') {
      deleteBankParameter(id);
    } else if (type === 'bankAccountType') {
      deleteBankAccountTypeParameter(id);
    } else if (type === 'documentType') {
      deleteDocumentTypeParameter(id);
    } else if (type === 'taxRegime') {
      deleteTaxRegimeParameter(id);
    } else if (type === 'city') {
      deleteCityParameter(id);
    } else if (type === 'arlRisk') {
      deleteArlRiskParameter(id);
    } else if (type === 'convocatoriaType') {
      deleteConvocatoriaTypeParameter(id);
    } else if (type === 'rejectionReason') {
      deleteRejectionReasonParameter(id);
    }

    setDeleteConfirmItem(null);
  };

  // Toggle Item Active / Inactive
  const handleToggleStatus = (item: any) => {
    const newStatus = !item.isActive;
    if (activeTab === 'banks') updateBankParameter(item.id, { isActive: newStatus });
    else if (activeTab === 'bankAccountTypes') updateBankAccountTypeParameter(item.id, { isActive: newStatus });
    else if (activeTab === 'documentTypes') updateDocumentTypeParameter(item.id, { isActive: newStatus });
    else if (activeTab === 'taxRegimes') updateTaxRegimeParameter(item.id, { isActive: newStatus });
    else if (activeTab === 'cities') updateCityParameter(item.id, { isActive: newStatus });
    else if (activeTab === 'arlRiskLevels') updateArlRiskParameter(item.id, { isActive: newStatus });
    else if (activeTab === 'convocatoriaTypes') updateConvocatoriaTypeParameter(item.id, { isActive: newStatus });
    else if (activeTab === 'rejectionReasons') updateRejectionReasonParameter(item.id, { isActive: newStatus });
  };

  // Save Global Settings
  const handleSaveGlobalSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateGlobalSettings(settingsForm);
  };

  // Export JSON Configuration
  const handleExportJson = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      systemVersion: 'SIG-PROV v3.5',
      company: 'FLOTA SUGAMUXI S.A.',
      categoriesConfig,
      systemParameters,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parametrizacion_sig_flotasugamuxi_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Archivo JSON de parametrización descargado correctamente.', 'success', 'Exportación Exitosa');
  };

  // Import JSON Configuration
  const handleImportJson = () => {
    if (!importJsonText.trim()) {
      showToast('Por favor pega el contenido JSON de configuración.', 'error');
      return;
    }
    const res = importSystemParametersJson(importJsonText);
    if (res.success) {
      setIsImportModalOpen(false);
      setImportJsonText('');
    } else {
      showToast(res.message, 'error', 'Error de Importación');
    }
  };

  // Tabs List
  const matrixTabs: Array<{ id: ParamTab; label: string; icon: React.FC<any>; count?: number }> = [
    { id: 'matrix_base', label: '1. Requisitos Base (Natural / Jurídica)', icon: User },
    { id: 'matrix_activities', label: '2. Requisitos por Actividad Económica', icon: Briefcase, count: categoriesConfig.length },
    { id: 'matrix_documents', label: '3. Catálogo Maestro de Documentos', icon: FileText, count: documentDefinitions.length },
    { id: 'matrix_simulator', label: '4. Simulador de Requisitos en Vivo', icon: Sparkles },
  ];

  const catalogTabs: Array<{ id: ParamTab; label: string; icon: React.FC<any>; count?: number }> = [
    { id: 'categories', label: 'Categorías de Suministro / Servicio', icon: Layers, count: categoriesConfig.length },
    { id: 'banks', label: 'Entidades Bancarias', icon: Building2, count: (systemParameters?.bankOptions || []).length },
    { id: 'bankAccountTypes', label: 'Tipos de Cuenta', icon: CreditCard, count: (systemParameters?.bankAccountTypes || []).length },
    { id: 'documentTypes', label: 'Tipos de Identificación', icon: FileText, count: (systemParameters?.documentTypes || []).length },
    { id: 'taxRegimes', label: 'Régimen Tributario', icon: ShieldCheck, count: (systemParameters?.taxRegimes || []).length },
    { id: 'cities', label: 'Ciudades y Cobertura', icon: MapPin, count: (systemParameters?.cityOptions || []).length },
    { id: 'arlRiskLevels', label: 'Niveles ARL', icon: AlertCircle, count: (systemParameters?.arlRiskLevels || []).length },
    { id: 'convocatoriaTypes', label: 'Modalidades Convocatorias', icon: Briefcase, count: (systemParameters?.convocatoriaTypes || []).length },
    { id: 'rejectionReasons', label: 'Causas de Devolución / Glosas', icon: AlertTriangle, count: (systemParameters?.rejectionReasons || []).length },
  ];

  const systemTabs: Array<{ id: ParamTab; label: string; icon: React.FC<any> }> = [
    { id: 'globalSettings', label: 'Políticas y Parámetros Globales', icon: Sliders },
  ];

  // Filter items based on search and status
  const filteredCategories = useMemo(() => {
    return categoriesConfig.filter((cat) => {
      const matchSearch =
        cat.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cat.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cat.riskLevel || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [categoriesConfig, searchQuery]);

  const filteredBanks = useMemo(() => {
    return (systemParameters?.bankOptions || []).filter((b) => {
      const matchSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || (filterStatus === 'ACTIVE' ? b.isActive : !b.isActive);
      return matchSearch && matchStatus;
    });
  }, [systemParameters.bankOptions, searchQuery, filterStatus]);

  const filteredBankAccountTypes = useMemo(() => {
    return (systemParameters?.bankAccountTypes || []).filter((a) => {
      const matchSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || (filterStatus === 'ACTIVE' ? a.isActive : !a.isActive);
      return matchSearch && matchStatus;
    });
  }, [systemParameters.bankAccountTypes, searchQuery, filterStatus]);

  const filteredDocumentTypes = useMemo(() => {
    return (systemParameters?.documentTypes || []).filter((d) => {
      const matchSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || (filterStatus === 'ACTIVE' ? d.isActive : !d.isActive);
      return matchSearch && matchStatus;
    });
  }, [systemParameters.documentTypes, searchQuery, filterStatus]);

  const filteredTaxRegimes = useMemo(() => {
    return (systemParameters?.taxRegimes || []).filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || (filterStatus === 'ACTIVE' ? t.isActive : !t.isActive);
      return matchSearch && matchStatus;
    });
  }, [systemParameters.taxRegimes, searchQuery, filterStatus]);

  const filteredCities = useMemo(() => {
    return (systemParameters?.cityOptions || []).filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || (filterStatus === 'ACTIVE' ? c.isActive : !c.isActive);
      return matchSearch && matchStatus;
    });
  }, [systemParameters.cityOptions, searchQuery, filterStatus]);

  const filteredArlRiskLevels = useMemo(() => {
    return (systemParameters?.arlRiskLevels || []).filter((a) => {
      const matchSearch =
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || (filterStatus === 'ACTIVE' ? a.isActive : !a.isActive);
      return matchSearch && matchStatus;
    });
  }, [systemParameters.arlRiskLevels, searchQuery, filterStatus]);

  const filteredConvocatoriaTypes = useMemo(() => {
    return (systemParameters?.convocatoriaTypes || []).filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || (filterStatus === 'ACTIVE' ? c.isActive : !c.isActive);
      return matchSearch && matchStatus;
    });
  }, [systemParameters.convocatoriaTypes, searchQuery, filterStatus]);

  const filteredRejectionReasons = useMemo(() => {
    return (systemParameters?.rejectionReasons || []).filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || (filterStatus === 'ACTIVE' ? r.isActive : !r.isActive);
      return matchSearch && matchStatus;
    });
  }, [systemParameters.rejectionReasons, searchQuery, filterStatus]);

  // Access Security Check
  if (role !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Módulo Restringido</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
          El módulo de Parametrización Central está reservado exclusivamente para el perfil de <strong>Administrador General</strong> de Flota Sugamuxi S.A.
        </p>
        <button
          onClick={() => setActiveView(role === 'PROVEEDOR' ? 'onboarding' : 'revisores')}
          className="mt-4 px-4 py-2 bg-[#0b1329] dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          {role === 'PROVEEDOR' ? 'Volver a Proveedores' : 'Ir al Dashboard Ejecutivo'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      
      {/* 1. Standardized Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 text-slate-900 border border-slate-200 shadow-xs relative overflow-hidden dark:bg-[#0b1329] dark:text-white dark:border-blue-900/60">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1 w-full">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 p-1.5 dark:bg-slate-900/80 dark:border-blue-800 shadow-2xs">
              <Sliders className="w-5 h-5 text-blue-700 dark:text-cyan-400" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-blue-50 text-blue-800 border border-blue-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400/30 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                  ADMIN GENERAL
                </span>
                <span className="bg-slate-100 text-slate-700 border border-slate-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-400/30 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider hidden sm:inline-flex">
                  ISO 9001:2015
                </span>
              </div>
              <h1 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                Parametrización General y Matriz SIG
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                Gestión centralizada de requisitos documentales, listas desplegables, catálogos maestros y políticas SIG
              </p>
            </div>
          </div>

          {/* Action Buttons in Header */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full xl:w-auto shrink-0 pt-2.5 xl:pt-0 border-t xl:border-t-0 border-slate-100 dark:border-slate-800/80">
            <button
              onClick={handleExportJson}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-lg border border-slate-200 transition-all shadow-2xs cursor-pointer dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700"
              title="Exportar configuración en formato JSON"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>Exportar JSON</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-lg border border-slate-200 transition-all shadow-2xs cursor-pointer dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700"
              title="Importar configuración desde JSON"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>Importar</span>
            </button>


          </div>
        </div>
      </div>

      {/* 2. Main Content Grid: Left Tabs Sidebar & Right Active Catalog Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Navigation: Unified Catalog & Matrix Selector Tabs */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3">
          
          {/* Quick Filter Pill Switcher */}
          <div className="bg-white dark:bg-[#0b1329] rounded-xl border border-slate-200 dark:border-slate-800 p-2 shadow-xs flex items-center justify-between gap-1">
            <button
              onClick={() => setActiveSectionFilter('ALL')}
              className={`flex-1 py-1 px-1.5 text-[10px] font-bold rounded-lg transition-colors text-center cursor-pointer ${
                activeSectionFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Todos (14)
            </button>
            <button
              onClick={() => setActiveSectionFilter('MATRIX')}
              className={`flex-1 py-1 px-1.5 text-[10px] font-bold rounded-lg transition-colors text-center cursor-pointer ${
                activeSectionFilter === 'MATRIX'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Matriz (4)
            </button>
            <button
              onClick={() => setActiveSectionFilter('CATALOGS')}
              className={`flex-1 py-1 px-1.5 text-[10px] font-bold rounded-lg transition-colors text-center cursor-pointer ${
                activeSectionFilter === 'CATALOGS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Catálogos (9)
            </button>
          </div>

          <div className="bg-white dark:bg-[#0b1329] rounded-xl border border-slate-200 dark:border-slate-800 p-2 shadow-xs space-y-3">
            
            {/* GROUP 1: MATRIZ DE REQUISITOS DOCUMENTALES */}
            {(activeSectionFilter === 'ALL' || activeSectionFilter === 'MATRIX') && (
              <div>
                <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 border-b border-blue-100 dark:border-blue-900/40 mb-1">
                  <span className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Matriz de Requisitos (SIG)</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    4 vistas
                  </span>
                </div>

                <div className="space-y-1">
                  {matrixTabs.map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setSearchQuery('');
                          setFilterStatus('ALL');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/20 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-blue-500 dark:text-blue-400'}`} />
                          <span className="truncate">{tab.label}</span>
                        </div>
                        {tab.count !== undefined && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                              isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* GROUP 2: CATÁLOGOS Y PARÁMETROS MAESTROS */}
            {(activeSectionFilter === 'ALL' || activeSectionFilter === 'CATALOGS') && (
              <div>
                <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Catálogos Maestros</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    9 catálogos
                  </span>
                </div>

                <div className="space-y-1">
                  {catalogTabs.map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setSearchQuery('');
                          setFilterStatus('ALL');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/20 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-blue-500 dark:text-blue-400'}`} />
                          <span className="truncate">{tab.label}</span>
                        </div>
                        {tab.count !== undefined && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                              isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* GROUP 3: CONFIGURACIÓN GLOBAL */}
            {(activeSectionFilter === 'ALL' || activeSectionFilter === 'GLOBAL') && (
              <div>
                <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Sistema SIG</span>
                  </span>
                </div>

                <div className="space-y-1">
                  {systemTabs.map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setSearchQuery('');
                          setFilterStatus('ALL');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/20 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-blue-500 dark:text-blue-400'}`} />
                          <span className="truncate">{tab.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Quick Context Summary Box */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>Estado de Parámetros</span>
              </span>
              <span className="text-blue-600 font-bold">Activo</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Todas las modificaciones a la matriz y catálogos aplican inmediatamente a los formularios de registro y evaluación SIG.
            </p>
          </div>
        </div>

        {/* Right Content: Active Parameter & Matrix Manager */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          
          {/* MATRIX TAB 1: REQUISITOS BASE */}
          {activeTab === 'matrix_base' && (
            <BaseRequirementsTab
              onShowToast={showToast}
              onOpenDocModal={() => setIsNewDocModalOpen(true)}
            />
          )}

          {/* MATRIX TAB 2: REQUISITOS POR ACTIVIDAD ECONÓMICA */}
          {activeTab === 'matrix_activities' && (
            <EconomicActivitiesTab
              onShowToast={showToast}
              onOpenNewCategoryModal={() => setIsNewCategoryModalOpen(true)}
              onOpenNewDocModal={(categoryName?: string) => {
                setTargetCategoryForNewDoc(categoryName || null);
                setIsNewDocModalOpen(true);
              }}
            />
          )}

          {/* MATRIX TAB 3: CATÁLOGO MAESTRO DE DOCUMENTOS */}
          {activeTab === 'matrix_documents' && (
            <DocumentCatalogTab
              onShowToast={showToast}
              onOpenNewDocModal={() => setIsNewDocModalOpen(true)}
            />
          )}

          {/* MATRIX TAB 4: SIMULADOR DE REQUISITOS */}
          {activeTab === 'matrix_simulator' && (
            <MatrixSimulatorTab />
          )}
          
          {/* TAB 1: CATEGORIAS DE SUMINISTRO / SERVICIO */}
          {activeTab === 'categories' && (
            <div className="bg-white dark:bg-[#0b1329] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              
              {/* Header inside card */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Categorías de Suministro / Servicio Institucional ({categoriesConfig.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Estas categorías aparecen en los formularios de registro, convocatorias y selección de proveedores.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Nueva Categoría</span>
                  </button>
                </div>
              </div>

              {/* Search & Stats Bar */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1329] flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar categoría de suministro, descripción o nivel de riesgo..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Categories Table / List */}
              <div className="sm:hidden px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] text-blue-900 dark:text-cyan-300 flex items-center justify-between font-medium">
                <span>Desliza horizontalmente para ver todos los campos</span>
                <span className="font-bold">↔</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[620px] lg:min-w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-2.5">Categoría / Servicio</th>
                      <th className="px-3 py-2.5">Nivel Riesgo SIG</th>
                      <th className="px-3 py-2.5">Requisitos PN</th>
                      <th className="px-3 py-2.5">Requisitos PJ</th>
                      <th className="px-4 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCategories.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                          No se encontraron categorías con el criterio de búsqueda "{searchQuery}".
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((cat, idx) => (
                        <tr key={cat.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{cat.category}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                              {cat.description || 'Sin descripción'}
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                cat.riskLevel === 'ALTO'
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700'
                                  : cat.riskLevel === 'MEDIO'
                                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
                                  : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              }`}
                            >
                              RIESGO {cat.riskLevel || 'MEDIO'}
                            </span>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="text-[11px] text-slate-700 dark:text-slate-300">
                              <strong>{cat.mandatoryForNatural?.length || 0}</strong> obligatorios
                            </div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="text-[11px] text-slate-700 dark:text-slate-300">
                              <strong>{cat.mandatoryForJuridica?.length || 0}</strong> obligatorios
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEdit(cat)}
                                className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                                title="Editar nombre o nivel de riesgo"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteConfirmItem({
                                    id: cat.category,
                                    name: cat.category,
                                    type: 'category',
                                  })
                                }
                                className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                title="Eliminar categoría"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ENTIDADES BANCARIAS */}
          {activeTab === 'banks' && (
            <div className="bg-white dark:bg-[#0b1329] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Entidades Financieras y Bancos ({(systemParameters?.bankOptions || []).length})</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Entidades bancarias y financieras autorizadas en Colombia para dispersión de pagos.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar Banco</span>
                </button>
              </div>

              {/* Search & Filter */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar banco por nombre o código..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    onClick={() => setFilterStatus('ALL')}
                    className={`px-2.5 py-1 text-[11px] rounded-lg font-medium cursor-pointer ${
                      filterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFilterStatus('ACTIVE')}
                    className={`px-2.5 py-1 text-[11px] rounded-lg font-medium cursor-pointer ${
                      filterStatus === 'ACTIVE' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Activos
                  </button>
                  <button
                    onClick={() => setFilterStatus('INACTIVE')}
                    className={`px-2.5 py-1 text-[11px] rounded-lg font-medium cursor-pointer ${
                      filterStatus === 'INACTIVE' ? 'bg-slate-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Inactivos
                  </button>
                </div>
              </div>

              {/* Banks Table */}
              <div className="sm:hidden px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] text-blue-900 dark:text-cyan-300 flex items-center justify-between font-medium">
                <span>Desliza horizontalmente para ver todos los campos</span>
                <span className="font-bold">↔</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[600px] lg:min-w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-2.5">Entidad Bancaria</th>
                      <th className="px-3 py-2.5">Código / Alias</th>
                      <th className="px-3 py-2.5">Tipo</th>
                      <th className="px-3 py-2.5">Estado</th>
                      <th className="px-4 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredBanks.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-slate-100">{b.name}</td>
                        <td className="px-3 py-2.5 text-slate-500 font-mono text-[11px]">{b.code}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300">
                            {b.bankType || 'BANCO'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => handleToggleStatus(b)}
                            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                              b.isActive
                                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {b.isActive ? <CheckCircle2 className="w-3 h-3 text-blue-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                            <span>{b.isActive ? 'ACTIVO' : 'INACTIVO'}</span>
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(b)}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmItem({ id: b.id, name: b.name, type: 'bank' })}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TIPOS DE CUENTA BANCARIA */}
          {activeTab === 'bankAccountTypes' && (
            <div className="bg-white dark:bg-[#0b1329] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>Tipos de Cuenta Bancaria ({(systemParameters?.bankAccountTypes || []).length})</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Modalidades de cuenta disponibles en certificaciones bancarias de proveedores.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar Tipo de Cuenta</span>
                </button>
              </div>

              <div className="sm:hidden px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] text-blue-900 dark:text-cyan-300 flex items-center justify-between font-medium">
                <span>Desliza horizontalmente para ver todos los campos</span>
                <span className="font-bold">↔</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[550px] lg:min-w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-2.5">Tipo de Cuenta</th>
                      <th className="px-3 py-2.5">Código Interno</th>
                      <th className="px-3 py-2.5">Estado</th>
                      <th className="px-4 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredBankAccountTypes.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-slate-100">{a.name}</td>
                        <td className="px-3 py-2.5 text-slate-500 font-mono text-[11px]">{a.code}</td>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => handleToggleStatus(a)}
                            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                              a.isActive
                                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {a.isActive ? <CheckCircle2 className="w-3 h-3 text-blue-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                            <span>{a.isActive ? 'ACTIVO' : 'INACTIVO'}</span>
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(a)}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmItem({ id: a.id, name: a.name, type: 'bankAccountType' })}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: TIPOS DE IDENTIFICACIÓN */}
          {activeTab === 'documentTypes' && (
            <div className="bg-white dark:bg-[#0b1329] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Tipos de Identificación y Documento ({(systemParameters?.documentTypes || []).length})</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tipos de documentos de identificación tributaria y ciudadana en Colombia.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar Tipo</span>
                </button>
              </div>

              <div className="sm:hidden px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] text-blue-900 dark:text-cyan-300 flex items-center justify-between font-medium">
                <span>Desliza horizontalmente para ver todos los campos</span>
                <span className="font-bold">↔</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[600px] lg:min-w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-2.5">Tipo de Identificación</th>
                      <th className="px-3 py-2.5">Abreviatura</th>
                      <th className="px-3 py-2.5">Aplica A</th>
                      <th className="px-3 py-2.5">Estado</th>
                      <th className="px-4 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDocumentTypes.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-slate-100">{d.name}</td>
                        <td className="px-3 py-2.5 text-slate-500 font-mono text-[11px]">{d.code}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300">
                            {d.appliesTo === 'NATURAL' ? 'Persona Natural' : d.appliesTo === 'JURIDICA' ? 'Persona Jurídica' : 'Ambos Regímenes'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => handleToggleStatus(d)}
                            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                              d.isActive
                                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {d.isActive ? <CheckCircle2 className="w-3 h-3 text-blue-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                            <span>{d.isActive ? 'ACTIVO' : 'INACTIVO'}</span>
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(d)}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmItem({ id: d.id, name: d.name, type: 'documentType' })}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: REGIMEN TRIBUTARIO */}
          {activeTab === 'taxRegimes' && (
            <div className="bg-white dark:bg-[#0b1329] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Régimen Tributario y Calidad Fiscal ({(systemParameters?.taxRegimes || []).length})</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Clasificación fiscal DIAN para retenciones en la fuente e ICA.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar Régimen</span>
                </button>
              </div>

              <div className="sm:hidden px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] text-blue-900 dark:text-cyan-300 flex items-center justify-between font-medium">
                <span>Desliza horizontalmente para ver todos los campos</span>
                <span className="font-bold">↔</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[620px] lg:min-w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-2.5">Régimen / Calidad Fiscal</th>
                      <th className="px-3 py-2.5">Código</th>
                      <th className="px-3 py-2.5">Descripción</th>
                      <th className="px-3 py-2.5">Estado</th>
                      <th className="px-4 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTaxRegimes.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-slate-100">{t.name}</td>
                        <td className="px-3 py-2.5 text-slate-500 font-mono text-[11px]">{t.code}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 text-[11px]">{t.description || 'Sin notas'}</td>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => handleToggleStatus(t)}
                            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                              t.isActive
                                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {t.isActive ? <CheckCircle2 className="w-3 h-3 text-blue-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                            <span>{t.isActive ? 'ACTIVO' : 'INACTIVO'}</span>
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(t)}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmItem({ id: t.id, name: t.name, type: 'taxRegime' })}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: CIUDADES Y COBERTURA */}
          {activeTab === 'cities' && (
            <div className="bg-white dark:bg-[#0b1329] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Ciudades, Municipios y Agencias ({(systemParameters?.cityOptions || []).length})</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Cobertura operativa para radicación y sedes terminales de Flota Sugamuxi S.A.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar Ciudad</span>
                </button>
              </div>

              <div className="sm:hidden px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] text-blue-900 dark:text-cyan-300 flex items-center justify-between font-medium">
                <span>Desliza horizontalmente para ver todos los campos</span>
                <span className="font-bold">↔</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[600px] lg:min-w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-2.5">Ciudad / Municipio</th>
                      <th className="px-3 py-2.5">Departamento</th>
                      <th className="px-3 py-2.5">Código</th>
                      <th className="px-3 py-2.5">Estado</th>
                      <th className="px-4 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCities.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-slate-100">{c.name}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{c.department}</td>
                        <td className="px-3 py-2.5 text-slate-500 font-mono text-[11px]">{c.code}</td>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => handleToggleStatus(c)}
                            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                              c.isActive
                                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {c.isActive ? <CheckCircle2 className="w-3 h-3 text-blue-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                            <span>{c.isActive ? 'ACTIVO' : 'INACTIVO'}</span>
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmItem({ id: c.id, name: c.name, type: 'city' })}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: NIVELES ARL */}
          {activeTab === 'arlRiskLevels' && (
            <div className="bg-white dark:bg-[#0b1329] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <span>Niveles de Riesgo Laboral ARL ({(systemParameters?.arlRiskLevels || []).length})</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Clasificación de riesgo en Seguridad y Salud en el Trabajo (SST - Decreto 1072 de 2015).
                  </p>
                </div>
                <button
                  onClick={handleOpenCreate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar Nivel ARL</span>
                </button>
              </div>

              <div className="sm:hidden px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] text-blue-900 dark:text-cyan-300 flex items-center justify-between font-medium">
                <span>Desliza horizontalmente para ver todos los campos</span>
                <span className="font-bold">↔</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[600px] lg:min-w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-2.5">Clase de Riesgo</th>
                      <th className="px-3 py-2.5">Tarifa ARL (%)</th>
                      <th className="px-3 py-2.5">Actividades de Ejemplo</th>
                      <th className="px-3 py-2.5">Estado</th>
                      <th className="px-4 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredArlRiskLevels.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-slate-100">{a.name}</td>
                        <td className="px-3 py-2.5 font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                          {a.percentage}%
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 text-[11px]">{a.description || 'Sin descripción'}</td>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => handleToggleStatus(a)}
                            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                              a.isActive
                                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {a.isActive ? <CheckCircle2 className="w-3 h-3 text-blue-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                            <span>{a.isActive ? 'ACTIVO' : 'INACTIVO'}</span>
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(a)}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmItem({ id: a.id, name: a.name, type: 'arlRisk' })}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: MODALIDADES DE CONVOCATORIAS */}
          {activeTab === 'convocatoriaTypes' && (
            <div className="bg-white dark:bg-[#0b1329] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <span>Modalidades de Contratación y Convocatorias ({(systemParameters?.convocatoriaTypes || []).length})</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Procesos de selección y modalidades de contratación institucional.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar Modalidad</span>
                </button>
              </div>

              <div className="sm:hidden px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] text-blue-900 dark:text-cyan-300 flex items-center justify-between font-medium">
                <span>Desliza horizontalmente para ver todos los campos</span>
                <span className="font-bold">↔</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[600px] lg:min-w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-2.5">Modalidad de Selección</th>
                      <th className="px-3 py-2.5">Código</th>
                      <th className="px-3 py-2.5">Descripción</th>
                      <th className="px-3 py-2.5">Estado</th>
                      <th className="px-4 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredConvocatoriaTypes.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-slate-100">{c.name}</td>
                        <td className="px-3 py-2.5 text-slate-500 font-mono text-[11px]">{c.code}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 text-[11px]">{c.description || 'Sin notas'}</td>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => handleToggleStatus(c)}
                            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                              c.isActive
                                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {c.isActive ? <CheckCircle2 className="w-3 h-3 text-blue-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                            <span>{c.isActive ? 'ACTIVO' : 'INACTIVO'}</span>
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmItem({ id: c.id, name: c.name, type: 'convocatoriaType' })}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: CAUSAS DE DEVOLUCIÓN */}
          {activeTab === 'rejectionReasons' && (
            <div className="bg-white dark:bg-[#0b1329] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <span>Causas de Devolución y Observaciones SIG ({(systemParameters?.rejectionReasons || []).length})</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Motivos preestablecidos para requerir subsanación en proveedores y documentos.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreate}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar Causa</span>
                </button>
              </div>

              <div className="sm:hidden px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/40 border-b border-slate-200 dark:border-slate-800 text-[10px] text-blue-900 dark:text-cyan-300 flex items-center justify-between font-medium">
                <span>Desliza horizontalmente para ver todos los campos</span>
                <span className="font-bold">↔</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[620px] lg:min-w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-2.5">Causa / Motivo de Subsanación</th>
                      <th className="px-3 py-2.5">Código</th>
                      <th className="px-3 py-2.5">Área de Evaluación</th>
                      <th className="px-3 py-2.5">Estado</th>
                      <th className="px-4 py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRejectionReasons.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-slate-100">{r.name}</td>
                        <td className="px-3 py-2.5 text-slate-500 font-mono text-[11px]">{r.code}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                            {r.category || 'DOCUMENTAL'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => handleToggleStatus(r)}
                            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                              r.isActive
                                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {r.isActive ? <CheckCircle2 className="w-3 h-3 text-blue-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                            <span>{r.isActive ? 'ACTIVO' : 'INACTIVO'}</span>
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(r)}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmItem({ id: r.id, name: r.name, type: 'rejectionReason' })}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 10: PARAMETROS Y POLÍTICAS GLOBALES */}
          {activeTab === 'globalSettings' && (
            <div className="bg-white dark:bg-[#0b1329] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Políticas Operativas y Parámetros Globales SIG</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Directrices técnicas, contactos institucionales y límites de almacenamiento para Flota Sugamuxi S.A.
                </p>
              </div>

              <form onSubmit={handleSaveGlobalSettings} className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Razón Social Institucional
                    </label>
                    <input
                      type="text"
                      value={settingsForm.companyName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, companyName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      NIT Corporativo
                    </label>
                    <input
                      type="text"
                      value={settingsForm.companyNit}
                      onChange={(e) => setSettingsForm({ ...settingsForm, companyNit: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Correo Electrónico de Compras / SIG
                    </label>
                    <input
                      type="email"
                      value={settingsForm.contactEmailSIG}
                      onChange={(e) => setSettingsForm({ ...settingsForm, contactEmailSIG: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Teléfono de Contacto Institucional
                    </label>
                    <input
                      type="text"
                      value={settingsForm.contactPhoneSIG}
                      onChange={(e) => setSettingsForm({ ...settingsForm, contactPhoneSIG: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Director / Responsable de Compras
                    </label>
                    <input
                      type="text"
                      value={settingsForm.directorComprasName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, directorComprasName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tamaño Máximo por Documento (MB)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={settingsForm.maxFileUploadSizeMB}
                      onChange={(e) => setSettingsForm({ ...settingsForm, maxFileUploadSizeMB: Number(e.target.value) || 15 })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Vigencia Máxima de Proveedores (Días)
                    </label>
                    <input
                      type="number"
                      min={30}
                      max={730}
                      value={settingsForm.dossierValidityDays}
                      onChange={(e) => setSettingsForm({ ...settingsForm, dossierValidityDays: Number(e.target.value) || 365 })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Versión Política Habeas Data
                    </label>
                    <input
                      type="text"
                      value={settingsForm.habeasDataPolicyVersion}
                      onChange={(e) => setSettingsForm({ ...settingsForm, habeasDataPolicyVersion: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="enableAutoEmails"
                      checked={settingsForm.enableAutoEmailNotifications}
                      onChange={(e) => setSettingsForm({ ...settingsForm, enableAutoEmailNotifications: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="enableAutoEmails" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      Enviar notificaciones automáticas por correo en cambios de estado de proveedores
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                  >
                    Guardar Configuración Global
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* 3. MODAL FOR CREATE / EDIT PARAMETERS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  {editingItem ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {editingItem ? 'Editar Parámetro' : 'Nuevo Parámetro / Registro'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveModal} className="p-5 space-y-4 text-xs">
              {activeTab === 'categories' ? (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nombre de la Categoría / Servicio <span className="text-blue-600 dark:text-cyan-400 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={categoryForm.category}
                      onChange={(e) => setCategoryForm({ ...categoryForm, category: e.target.value })}
                      placeholder="Ej: SERVICIO DE RECARGA DE EXTINTORES Y SEGURIDAD"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Descripción del Alcance / Objeto
                    </label>
                    <textarea
                      rows={3}
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      placeholder="Descripción detallada de los bienes, insumos o servicios que abarca esta categoría..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nivel de Riesgo Institucional SIG
                    </label>
                    <select
                      value={categoryForm.riskLevel}
                      onChange={(e: any) => setCategoryForm({ ...categoryForm, riskLevel: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="BAJO">BAJO (Insumos generales, papelería, aseo)</option>
                      <option value="MEDIO">MEDIO (Repuestos no críticos, mantenimiento menor)</option>
                      <option value="ALTO">ALTO (Combustibles, frenos, lubricantes, transporte, llantas)</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nombre / Denominación <span className="text-blue-600 dark:text-cyan-400 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={genericForm.name}
                      onChange={(e) => setGenericForm({ ...genericForm, name: e.target.value })}
                      placeholder="Ej: Banco Agrario de Colombia"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Código / Alias Interno
                      </label>
                      <input
                        type="text"
                        value={genericForm.code}
                        onChange={(e) => setGenericForm({ ...genericForm, code: e.target.value })}
                        placeholder="Ej: BANCO_AGRARIO"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                      />
                    </div>

                    {activeTab === 'cities' && (
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Departamento <span className="text-blue-600 dark:text-cyan-400 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={genericForm.department}
                          onChange={(e) => setGenericForm({ ...genericForm, department: e.target.value })}
                          placeholder="Ej: Boyacá, Casanare, Cundinamarca"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    )}

                    {activeTab === 'banks' && (
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Tipo de Entidad
                        </label>
                        <select
                          value={genericForm.bankType}
                          onChange={(e: any) => setGenericForm({ ...genericForm, bankType: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                        >
                          <option value="BANCO">Banco Comercial</option>
                          <option value="COOPERATIVA">Cooperativa Financiera</option>
                          <option value="BILLETERA_DIGITAL">Billetera Digital / SEDPE</option>
                        </select>
                      </div>
                    )}

                    {activeTab === 'documentTypes' && (
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Aplica a Tipo de Persona
                        </label>
                        <select
                          value={genericForm.appliesTo}
                          onChange={(e: any) => setGenericForm({ ...genericForm, appliesTo: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                        >
                          <option value="AMBOS">Ambos Regímenes</option>
                          <option value="NATURAL">Persona Natural</option>
                          <option value="JURIDICA">Persona Jurídica</option>
                        </select>
                      </div>
                    )}

                    {activeTab === 'arlRiskLevels' && (
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Porcentaje Tarifa (%)
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={genericForm.percentage}
                          onChange={(e) => setGenericForm({ ...genericForm, percentage: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Descripción / Notas Aclaratorias
                    </label>
                    <textarea
                      rows={2}
                      value={genericForm.description}
                      onChange={(e) => setGenericForm({ ...genericForm, description: e.target.value })}
                      placeholder="Detalles adicionales para este parámetro en el sistema..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="itemActive"
                      checked={genericForm.isActive}
                      onChange={(e) => setGenericForm({ ...genericForm, isActive: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="itemActive" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      Habilitar parámetro inmediatamente en todas las listas desplegables
                    </label>
                  </div>
                </>
              )}

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  {editingItem ? 'Actualizar Parámetro' : 'Guardar Parámetro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL DELETE CONFIRMATION */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                ¿Eliminar {deleteConfirmItem.name}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Esta acción eliminará el elemento de todas las listas desplegables del sistema SIG.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer border border-slate-700"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}



      {/* 6. MODAL IMPORT JSON */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Importar Configuración JSON
                </h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Pega el código JSON de parametrización:
              </label>
              <textarea
                rows={8}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{ "bankOptions": [...], "cityOptions": [...] }'
                className="w-full p-3 font-mono text-[11px] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportJson}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Aplicar e Importar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL NUEVA ACTIVIDAD / SERVICIO (MATRIX) */}
      {isNewCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Nueva Actividad Económica / Servicio SIG
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Define la categoría y sus documentos específicos obligatorios
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewCategoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewCategory} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del Servicio / Suministro *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Ej. Transporte de Carga Crítica..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Código CIIU (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newCatEconomicCode}
                    onChange={(e) => setNewCatEconomicCode(e.target.value)}
                    placeholder="Ej. 4923"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nivel de Riesgo Operativo / Contractual
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['BAJO', 'MEDIO', 'ALTO', 'CRITICO'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setNewCatRisk(r)}
                      className={`py-1.5 px-2 rounded-lg font-bold text-center border transition-all cursor-pointer ${
                        newCatRisk === r
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción del Alcance
                </label>
                <textarea
                  rows={2}
                  value={newCatDescription}
                  onChange={(e) => setNewCatDescription(e.target.value)}
                  placeholder="Detalle operativo y alcance de contratación en Flota Sugamuxi S.A..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Requisitos Base Oficiales */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-xs space-y-1.5">
                  <div className="font-bold text-blue-950 dark:text-blue-100 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                    <span>Documentos Base Oficiales Preestablecidos</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11.5px] leading-relaxed">
                    Esta nueva actividad económica iniciará automáticamente con los requisitos base oficiales de Flota Sugamuxi S.A. para Persona Natural y Persona Jurídica (RUT, Cámara de Comercio, Cédula, Seguridad Social, Certificación Bancaria, Formatos FS.GA-FOR-009 y 039, etc.).
                  </p>
                  <p className="text-blue-800 dark:text-cyan-300 font-medium text-[10.5px]">
                    ℹ No se traerán campos ni requisitos específicos de otras actividades. Una vez creada, podrá parametrizar o agregar nuevos documentos técnicos directamente en la matriz de esta actividad.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewCategoryModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  Crear Actividad Económica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL NUEVO DOCUMENTO MAESTRO (MATRIX) */}
      {isNewDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {targetCategoryForNewDoc
                      ? `Nuevo Requisito para ${targetCategoryForNewDoc}`
                      : 'Registrar Nuevo Documento en Catálogo Maestro'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {targetCategoryForNewDoc
                      ? `Se guardará en el catálogo maestro y se vinculará a la actividad ${targetCategoryForNewDoc}`
                      : 'Agrega un nuevo tipo de requerimiento documental al SIG'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsNewDocModalOpen(false);
                  setIsDocCodeCustomized(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewDocument} className="space-y-3.5 text-xs">
              {/* 1. NOMBRE INSTITUCIONAL PRIMERO */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Institucional del Documento *
                </label>
                <input
                  type="text"
                  required
                  value={newDocName}
                  onChange={(e) => handleDocNameChange(e.target.value)}
                  placeholder="Ej. Certificado de Retenciones en la Fuente (RCE)..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 Tip: Puedes incluir siglas al final entre paréntesis, ej: <span className="font-semibold text-blue-600 dark:text-blue-400">(RUT)</span>, <span className="font-semibold text-blue-600 dark:text-blue-400">(RCE)</span>, <span className="font-semibold text-blue-600 dark:text-blue-400">(SST)</span>.
                </p>
              </div>

              {/* 2. CÓDIGO TÉCNICO AUTOCALCULADO + TIPO/DIMENSIÓN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Código Técnico (Único) *
                    </label>
                    {isDocCodeCustomized ? (
                      <button
                        type="button"
                        onClick={handleResetToAutoCode}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        title="Recalcular automáticamente a partir de las iniciales"
                      >
                        <Zap className="w-2.5 h-2.5 text-amber-500" />
                        Autocalcular
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        <Zap className="w-2.5 h-2.5" />
                        Auto por iniciales
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={newDocCode}
                    onChange={(e) => handleDocCodeChange(e.target.value)}
                    placeholder="Ej. CRF"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono font-bold tracking-wider text-[11px] focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo / Dimensión SIG *
                  </label>
                  <select
                    value={newDocCategory}
                    onChange={(e: any) => setNewDocCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LEGAL">Legal y Estatutario</option>
                    <option value="FINANCIERO">Financiero y Tributario</option>
                    <option value="TECNICO">Técnico y Operativo</option>
                    <option value="HSEQ">HSEQ / Seguridad y Salud</option>
                    <option value="SARLAFT">SARLAFT / Cumplimiento</option>
                    <option value="OPERATIVO">Operativo / Flota</option>
                  </select>
                </div>
              </div>

              {/* CHIPS DE SUGERENCIAS */}
              {newDocName.trim().length > 2 && (
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Sugerencias de Nemotécnico (haz clic para aplicar):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {docCodeSuggestions.initials && (
                      <button
                        type="button"
                        onClick={() => handleApplyDocCodeSuggestion(docCodeSuggestions.initials)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                          newDocCode === docCodeSuggestions.initials
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        ⚡ {docCodeSuggestions.initials} <span className="opacity-75 font-sans text-[9px]">(Iniciales)</span>
                      </button>
                    )}
                    {docCodeSuggestions.prefixInitials && (
                      <button
                        type="button"
                        onClick={() => handleApplyDocCodeSuggestion(docCodeSuggestions.prefixInitials!)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                          newDocCode === docCodeSuggestions.prefixInitials
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        {docCodeSuggestions.prefixInitials} <span className="opacity-75 font-sans text-[9px]">(Prefijo)</span>
                      </button>
                    )}
                    {docCodeSuggestions.shortSlug && (
                      <button
                        type="button"
                        onClick={() => handleApplyDocCodeSuggestion(docCodeSuggestions.shortSlug)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                          newDocCode === docCodeSuggestions.shortSlug
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        {docCodeSuggestions.shortSlug} <span className="opacity-75 font-sans text-[9px]">(Corto)</span>
                      </button>
                    )}
                    {docCodeSuggestions.fullSlug && (
                      <button
                        type="button"
                        onClick={() => handleApplyDocCodeSuggestion(docCodeSuggestions.fullSlug)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                          newDocCode === docCodeSuggestions.fullSlug
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        {docCodeSuggestions.fullSlug} <span className="opacity-75 font-sans text-[9px]">(Completo)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Regla de Vigencia / Validez
                </label>
                <input
                  type="text"
                  value={newDocValidityRule}
                  onChange={(e) => setNewDocValidityRule(e.target.value)}
                  placeholder="Ej. Expedición no mayor a 30 días calendario"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción y Finalidad en el SIG
                </label>
                <textarea
                  rows={2}
                  value={newDocDescription}
                  onChange={(e) => setNewDocDescription(e.target.value)}
                  placeholder="Objetivo del requerimiento y criterios de verificación técnica..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newDocRequiresExp"
                  checked={newDocRequiresExp}
                  onChange={(e) => setNewDocRequiresExp(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="newDocRequiresExp" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Exigir captura obligatoria de fecha de vencimiento al proveedor
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewDocModalOpen(false);
                    setIsDocCodeCustomized(false);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  Guardar en Catálogo Maestro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};