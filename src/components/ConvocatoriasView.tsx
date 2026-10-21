import React, { useState } from 'react';
import {
  Briefcase,
  Calendar,
  DollarSign,
  Send,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Building2,
  Users,
  Plus,
  Clock,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Info,
  UserPlus,
  LogIn,
  Lock,
  User,
  Pencil,
  Trash2,
  Check,
  SlidersHorizontal,
  FileDown,
  ExternalLink,
  Award,
  FileCheck,
  Eye,
  X,
  Paperclip,
  UploadCloud,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Convocatoria, ConvocatoriaAccessRule, ConvocatoriaPostulacion, ConvocatoriaPostulacionQuotation } from '../types';
import { FlotaSugamuxiLogo, FlotaSugamuxiEmblem } from './FlotaSugamuxiLogo';

export const ConvocatoriasView: React.FC = () => {
  const {
    convocatorias,
    currentDossier,
    applyToConvocatoria,
    role,
    setRole,
    createConvocatoria,
    updateConvocatoria,
    deleteConvocatoria,
    evaluatePostulacion,
    supplierPortalTab,
    setSupplierPortalTab,
    isSupplierLoggedIn,
    supplierLogout,
    categoriesConfig,
    systemParameters,
  } = useApp();

  const [selectedConvocatoria, setSelectedConvocatoria] = useState<Convocatoria | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [financialProposal, setFinancialProposal] = useState('');
  const [technicalProposal, setTechnicalProposal] = useState('');
  const [quotationFiles, setQuotationFiles] = useState<ConvocatoriaPostulacionQuotation[]>([]);
  const [applyFeedback, setApplyFeedback] = useState<string | null>(null);

  // New Convocatoria modal for Admin
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState(categoriesConfig[0]?.category || 'Mantenimiento automotriz');
  const [newBudget, setNewBudget] = useState('');
  const [newPublishedDate, setNewPublishedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDeadline, setNewDeadline] = useState('2026-09-30');
  const [newAccessRule, setNewAccessRule] = useState<ConvocatoriaAccessRule>('OPCION_A');
  const [newStatus, setNewStatus] = useState<'ABIERTA' | 'EN_EVALUACION' | 'ADJUDICADA' | 'CERRADA'>('ABIERTA');
  const [newTermsFileName, setNewTermsFileName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRequirements, setNewRequirements] = useState('');

  // Edit Convocatoria modal for Admin/Revisor
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingConvocatoria, setEditingConvocatoria] = useState<Convocatoria | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editPublishedDate, setEditPublishedDate] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editAccessRule, setEditAccessRule] = useState<ConvocatoriaAccessRule>('OPCION_A');
  const [editStatus, setEditStatus] = useState<'ABIERTA' | 'EN_EVALUACION' | 'ADJUDICADA' | 'CERRADA'>('ABIERTA');
  const [editTermsFileName, setEditTermsFileName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRequirements, setEditRequirements] = useState('');

  // Proposals review drawer / modal
  const [proposalsModalConv, setProposalsModalConv] = useState<Convocatoria | null>(null);
  const [evaluatingPostulacion, setEvaluatingPostulacion] = useState<ConvocatoriaPostulacion | null>(null);
  const [evalScoreTech, setEvalScoreTech] = useState<number>(85);
  const [evalScoreEcon, setEvalScoreEcon] = useState<number>(90);
  const [evalFeedback, setEvalFeedback] = useState<string>('');

  // Delete confirmation
  const [convToDelete, setConvToDelete] = useState<Convocatoria | null>(null);

  const isSupplierApproved =
    currentDossier?.processStatus === 'PROVEEDOR_HABILITADO' ||
    currentDossier?.processStatus === 'APROBADO';

  const isNatural = currentDossier?.basicInfo.supplierType === 'NATURAL';
  const supplierDisplayName = currentDossier
    ? (isNatural ? currentDossier.basicInfo.fullName : currentDossier.basicInfo.companyName) || 'Proveedor'
    : '';
  const supplierIdNumber = currentDossier
    ? (isNatural ? currentDossier.basicInfo.documentNumber : currentDossier.basicInfo.nit) || ''
    : '';
  const fileNumber = currentDossier?.fileNumber || '';
  const processStatus = currentDossier?.processStatus || 'BORRADOR';

  const handleOpenApply = (conv: Convocatoria) => {
    setSelectedConvocatoria(conv);
    setFinancialProposal('');
    setTechnicalProposal('');
    setQuotationFiles([]);
    setApplyFeedback(null);
    setIsApplyModalOpen(true);
  };

  const handleAddQuotationFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files: File[] = Array.from(e.target.files);

    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newQuotation: ConvocatoriaPostulacionQuotation = {
          id: `quot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/pdf',
          uploadedAt: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          fileData: typeof reader.result === 'string' ? reader.result : undefined,
          notes: 'Cotización comercial radicada por el oferente',
        };
        setQuotationFiles((prev) => [...prev, newQuotation]);
      };
      reader.readAsDataURL(file);
    });
    // Reset file input
    e.target.value = '';
  };

  const handleRemoveQuotationFile = (quotId: string) => {
    setQuotationFiles((prev) => prev.filter((q) => q.id !== quotId));
  };

  const handleDownloadQuotationFile = (quot: ConvocatoriaPostulacionQuotation) => {
    if (quot.fileData) {
      const a = document.createElement('a');
      a.href = quot.fileData;
      a.download = quot.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const content = `=========================================================================\n` +
        `FLOTA SUGAMUXI S.A. - RADICACIÓN DE COTIZACIÓN Y OFERTA\n` +
        `ARCHIVO: ${quot.name}\n` +
        `FECHA: ${quot.uploadedAt}\n` +
        `TAMAÑO: ${(quot.size / 1024).toFixed(1)} KB\n` +
        `=========================================================================\n` +
        `Documento de cotización anexo al proceso licitatorio de Flota Sugamuxi S.A.`;
      const blob = new Blob([content], { type: 'application/pdf;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = quot.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDossier || !selectedConvocatoria) return;

    if (!financialProposal) {
      alert('Por favor ingrese el valor de su propuesta económica.');
      return;
    }

    const isNat = currentDossier.basicInfo.supplierType === 'NATURAL';
    const sName = isNat ? currentDossier.basicInfo.fullName : currentDossier.basicInfo.companyName;

    applyToConvocatoria(selectedConvocatoria.id, {
      supplierId: currentDossier.id,
      supplierName: sName || 'Proveedor',
      fileNumber: currentDossier.fileNumber,
      supplierStatus: currentDossier.processStatus,
      nitOrDoc: isNat ? currentDossier.basicInfo.documentNumber : currentDossier.basicInfo.nit || '',
      contactEmail: currentDossier.basicInfo.email,
      proposedValue: parseFloat(financialProposal),
      proposalSummary: technicalProposal || 'Propuesta técnica y cotización ajustada a los términos de referencia oficiales.',
      quotationFiles: quotationFiles.length > 0 ? quotationFiles : undefined,
    });

    setApplyFeedback('¡Postulación y cotizaciones radicadas con éxito!');
    setTimeout(() => {
      setIsApplyModalOpen(false);
      setApplyFeedback(null);
      setQuotationFiles([]);
    }, 1500);
  };

  const handleOpenCreateModal = () => {
    setNewCode(`CONV-FS-2026-00${convocatorias.length + 1}`);
    setNewTitle('');
    setNewCategory(categoriesConfig[0]?.category || 'Mantenimiento automotriz');
    setNewBudget('');
    setNewPublishedDate(new Date().toISOString().split('T')[0]);
    setNewDeadline('2026-09-30');
    setNewAccessRule('OPCION_A');
    setNewStatus('ABIERTA');
    setNewTermsFileName('');
    setNewDescription('');
    setNewRequirements('Distribuidor o fabricante autorizado\nGarantía comercial mínima de 12 meses\nCumplimiento de normatividad técnica colombiana');
    setIsCreateModalOpen(true);
  };

  const handleCreateConvocatoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const reqArray = newRequirements
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    createConvocatoria({
      code: newCode.trim() || `CONV-FS-2026-00${convocatorias.length + 1}`,
      title: newTitle.trim(),
      category: newCategory,
      budgetEstimateCOP: parseFloat(newBudget) || 0,
      publishedDate: newPublishedDate || new Date().toISOString().split('T')[0],
      closingDate: newDeadline || '2026-09-30',
      accessRule: newAccessRule,
      status: newStatus,
      termsFileName: newTermsFileName.trim() || `Pliego_${newTitle.replace(/\s+/g, '_').substring(0, 20)}.pdf`,
      description: newDescription.trim(),
      requirementsSummary: reqArray.length > 0 ? reqArray : ['Cumplimiento de especificaciones y fichas técnicas'],
    });

    setIsCreateModalOpen(false);
  };

  const handleOpenEditModal = (conv: Convocatoria) => {
    setEditingConvocatoria(conv);
    setEditCode(conv.code);
    setEditTitle(conv.title);
    setEditCategory(conv.category);
    setEditBudget(conv.budgetEstimateCOP ? String(conv.budgetEstimateCOP) : '');
    setEditPublishedDate(conv.publishedDate || '');
    setEditDeadline(conv.closingDate || '');
    setEditAccessRule(conv.accessRule || 'OPCION_A');
    setEditStatus(conv.status || 'ABIERTA');
    setEditTermsFileName(conv.termsFileName || '');
    setEditDescription(conv.description || '');
    setEditRequirements((conv.requirementsSummary || []).join('\n'));
    setIsEditModalOpen(true);
  };

  const handleSaveEditConvocatoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConvocatoria || !editTitle.trim()) return;

    const reqArray = editRequirements
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    updateConvocatoria(editingConvocatoria.id, {
      code: editCode.trim() || editingConvocatoria.code,
      title: editTitle.trim(),
      category: editCategory,
      status: editStatus,
      accessRule: editAccessRule,
      budgetEstimateCOP: parseFloat(editBudget) || 0,
      publishedDate: editPublishedDate || editingConvocatoria.publishedDate,
      closingDate: editDeadline || editingConvocatoria.closingDate,
      termsFileName: editTermsFileName.trim() || editingConvocatoria.termsFileName,
      description: editDescription.trim(),
      requirementsSummary: reqArray.length > 0 ? reqArray : ['Cumplimiento de especificaciones y fichas técnicas'],
    });

    setIsEditModalOpen(false);
    setEditingConvocatoria(null);
  };

  const handleDeleteConfirm = () => {
    if (!convToDelete) return;
    deleteConvocatoria(convToDelete.id);
    setConvToDelete(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      
      {/* Active Supplier Session Banner (When logged in as PROVEEDOR) */}
      {role === 'PROVEEDOR' && isSupplierLoggedIn && currentDossier && (
        <div className="bg-white text-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 dark:from-[#0b1329] dark:via-[#0f1d40] dark:to-[#0b1329] dark:border-blue-900/60 dark:bg-[#0b1329] dark:text-white">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 dark:bg-blue-950/80 dark:border-cyan-700/50 dark:text-cyan-300">
              {isNatural ? <User className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                  {supplierDisplayName}
                </span>
                <span className="text-[10px] text-slate-700 font-mono bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 dark:text-cyan-300 dark:bg-blue-950/80 dark:border-cyan-700/50">
                  {isNatural ? `CC: ${supplierIdNumber}` : `NIT: ${supplierIdNumber}`}
                </span>
                <span className="text-[10px] text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 dark:text-slate-300 dark:bg-slate-800/80 dark:border-slate-700">
                  Radicado: <strong className="text-slate-900 dark:text-white">{fileNumber}</strong>
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <span>Estado de Habilitación:</span>
                {processStatus === 'APROBADO' || processStatus === 'PROVEEDOR_HABILITADO' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 dark:bg-blue-950 dark:text-cyan-300 dark:border-cyan-500/50">
                    <CheckCircle2 className="w-3 h-3 text-blue-700 dark:text-cyan-300" /> Habilitado / Aprobado Oficialmente
                  </span>
                ) : processStatus === 'REQUIERE_CORRECCION' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600">
                    <AlertTriangle className="w-3 h-3 text-slate-600 dark:text-slate-300" /> Requiere Corrección de Soportes
                  </span>
                ) : processStatus === 'EN_REVISION' || processStatus === 'CORREGIDO_EN_REVISION' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-cyan-300 dark:border-cyan-500/50">
                    <Clock className="w-3 h-3 text-blue-600 dark:text-cyan-300" /> En Revisión Técnica y SARLAFT
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                    <FileText className="w-3 h-3 text-slate-500 dark:text-blue-200" /> Borrador / Documentación en Carga
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => supplierLogout()}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs dark:bg-slate-800/90 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700"
              title="Cerrar sesión e ingresar con otro proveedor o NIT"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180 text-blue-600 dark:text-cyan-300" />
              <span>Cerrar Sesión / Cambiar Proveedor</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. Header Banner for PROVEEDOR role */}
      {role === 'PROVEEDOR' ? (
        /* Header Banner Estandarizado Claro */
        <div className="bg-white rounded-2xl p-4 sm:p-5 text-slate-900 border border-slate-200 shadow-xs relative overflow-hidden dark:bg-[#0b1329] dark:text-white dark:border-blue-900/60">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-start gap-3 max-w-3xl">
              <div className="hidden sm:flex shrink-0 p-1.5 rounded-xl bg-blue-50/80 border border-blue-100 shadow-xs dark:bg-white">
                <FlotaSugamuxiEmblem className="w-10 h-10" color="#0080d7" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 border border-blue-200 rounded-full text-blue-800 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider dark:bg-cyan-950/80 dark:border-cyan-500/40 dark:text-cyan-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-cyan-300 animate-pulse" />
                  <span>CANAL OFICIAL DE PROVEEDORES Y CONTRATISTAS</span>
                </div>

                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>SIGEPRO - Sistema Integral de Gestión de Proveedores y Vinculación</span>
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  Bienvenido al Portal Oficial de Proveedores de <strong>Flota Sugamuxi S.A.</strong> Radique su expediente técnico SIG, cargue soportes y postúlese a convocatorias vigentes.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 self-start md:self-center">
              <button
                onClick={() => setRole('REVISOR')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                title="Cambiar al rol de Revisor Técnico / SIG"
              >
                <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-300" />
                <span>Acceso Revisor / SIG</span>
              </button>
            </div>
          </div>

          {/* Top Navigation Pill Bar */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-2 text-xs font-medium w-full">
            <div className="bg-slate-100/90 p-1 rounded-xl border border-slate-200/90 flex flex-wrap items-center justify-center gap-1 dark:bg-[#0f1b3b]/90 dark:border-slate-700/80">
              <button
                onClick={() => {
                  setSupplierPortalTab('welcome');
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white/80 transition-all cursor-pointer dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80"
              >
                <Info className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-300" />
                <span>Inicio / Bienvenida</span>
              </button>

              <button
                onClick={() => {
                  setSupplierPortalTab('convocatorias');
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-xs transition-all cursor-default"
              >
                <Briefcase className="w-3.5 h-3.5 text-white" />
                <span>Convocatorias Disponibles</span>
              </button>

              <button
                onClick={() => {
                  setSupplierPortalTab('register');
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white/80 transition-all cursor-pointer dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80"
              >
                <UserPlus className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-300" />
                <span>Registrar Proveedor</span>
              </button>

              <button
                onClick={() => {
                  setSupplierPortalTab('login');
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-white/80 transition-all cursor-pointer dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-300" />
                <span>Ingreso / Consultar Proveedor</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Top Banner for Admin & Evaluator - Claro Refinado */
        <div className="bg-white rounded-2xl p-4 sm:p-5 text-slate-900 border border-slate-200 shadow-xs relative overflow-hidden dark:bg-[#0b1329] dark:text-white dark:border-blue-900/60">
          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1 w-full">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 p-1.5 dark:bg-slate-900/80 dark:border-blue-800 shadow-2xs">
                <Briefcase className="w-5 h-5 text-blue-700 dark:text-cyan-400" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 rounded-full text-blue-800 font-bold text-[10px] flex items-center gap-1.5 dark:bg-blue-500/20 dark:border-blue-400/40 dark:text-cyan-300">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-300" />
                    <span>Contratación Flota Sugamuxi S.A.</span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    Licitaciones y Solicitud de Ofertas
                  </span>
                </div>
                <h1 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  Convocatorias Públicas y Privadas de Proveedores
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                  Postulación a compras de repuestos, lubricantes, dotación, seguros y servicios técnicos especializados.
                </p>
              </div>
            </div>

            {(role === 'ADMIN' || role === 'REVISOR') && (
              <div className="flex items-center gap-2 w-full xl:w-auto shrink-0 pt-2.5 xl:pt-0 border-t xl:border-t-0 border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={handleOpenCreateModal}
                  className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publicar Nueva Convocatoria</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Supplier Status Notice */}
      {role === 'PROVEEDOR' && (
        currentDossier && isSupplierLoggedIn ? (
          <div className={`p-4 rounded-2xl border flex items-start gap-3 shadow-xs ${
            isSupplierApproved
              ? 'bg-blue-50 border-blue-200 text-blue-950'
              : 'bg-slate-100 border-slate-300 text-slate-900'
          }`}>
            {isSupplierApproved ? (
              <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <h4 className="font-bold">
                {isSupplierApproved
                  ? `Expediente Habilitado (${currentDossier.fileNumber})`
                  : `Expediente en Trámite (${currentDossier.fileNumber})`}
              </h4>
              <p className="mt-0.5 text-[11px] opacity-90">
                {isSupplierApproved
                  ? 'Su empresa se encuentra habilitada en el registro oficial de proveedores de Flota Sugamuxi S.A. y cumple todos los requisitos para postular ofertas formalmente.'
                  : 'Para que sus postulaciones sean adjudicadas, recuerde completar la carga y aprobación del formulario FS.GA-FOR-009, FS.GA-FOR-039 y los documentos soporte en la pestaña Mi Expediente.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/80 text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <h4 className="font-bold">Consulta Pública de Convocatorias Flota Sugamuxi S.A.</h4>
                <p className="text-[11px] text-blue-800">
                  Puede consultar los términos de referencia de todas las convocatorias vigentes. Para radicar su propuesta económica, ingrese a su expediente o regístrese como nuevo aspirante.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setSupplierPortalTab('login')}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Ingresar con NIT/Cédula</span>
              </button>
            </div>
          </div>
        )
      )}

      {/* Header section with summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <span>Licitaciones y Solicitudes de Suministro Vigentes</span>
          </h2>
          <p className="text-xs text-slate-500">
            {convocatorias.length} procesos registrados para adquisición de bienes y contratación de servicios.
          </p>
        </div>

        {(role === 'ADMIN' || role === 'REVISOR') && (
          <button
            onClick={handleOpenCreateModal}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Convocatoria</span>
          </button>
        )}
      </div>

      {/* Convocatorias Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {convocatorias.map((conv) => {
          const hasApplied = currentDossier && isSupplierLoggedIn
            ? conv.postulaciones?.some((p) => p.supplierId === currentDossier.id)
            : false;
          
          const budgetNumber = typeof conv.budgetEstimateCOP === 'number' 
            ? conv.budgetEstimateCOP 
            : 0;

          return (
            <div
              key={conv.id}
              className="bg-white dark:bg-[#0b1329] rounded-2xl border border-slate-200 dark:border-blue-900/50 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-all p-5 sm:p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header tags */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-extrabold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:bg-blue-950/70 dark:text-cyan-300 dark:border-blue-800">
                      {conv.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      conv.status === 'ABIERTA'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/70 dark:text-cyan-300 dark:border-blue-800'
                        : conv.status === 'EN_EVALUACION'
                        ? 'bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-900/50 dark:text-cyan-200 dark:border-blue-700'
                        : conv.status === 'ADJUDICADA'
                        ? 'bg-blue-900 text-white border border-blue-700 dark:bg-blue-800 dark:text-white'
                        : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}>
                      {conv.status === 'ABIERTA' ? '● ABIERTA' : conv.status === 'EN_EVALUACION' ? '● EN EVALUACIÓN' : conv.status === 'ADJUDICADA' ? '● ADJUDICADA' : '● CERRADA'}
                    </span>
                  </div>

                  {/* Access Rule Pill */}
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                    {conv.accessRule === 'OPCION_B'
                      ? 'Opción B: Solo Habilitados 100%'
                      : conv.accessRule === 'OPCION_C'
                      ? 'Opción C: Registro + Pre-adjudicación'
                      : 'Opción A: Abierta General'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                    {conv.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                    {conv.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase block">Sector / Categoría</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] truncate block">{conv.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase block">Presupuesto Estimado</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-cyan-300 text-[11px]">
                      ${budgetNumber.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase block">Fecha Publicación / Cierre</span>
                    <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {conv.publishedDate || '2026-08-01'} al {conv.closingDate || '2026-09-30'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase block">Postulaciones</span>
                    <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" /> {conv.postulaciones?.length || 0} propuestas recibidas
                    </span>
                  </div>
                </div>

                {/* Pliego / Terms reference */}
                {conv.termsFileName && (
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-700 dark:text-cyan-300 bg-blue-50/60 dark:bg-blue-950/60 p-2 rounded-lg border border-blue-100 dark:border-blue-900">
                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
                    <span className="font-medium truncate">Pliego de Condiciones: <strong>{conv.termsFileName}</strong></span>
                  </div>
                )}

                {/* Specific Requirements Tag list */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Requisitos Específicos Exigidos:</span>
                  <div className="flex flex-wrap gap-1">
                    {(conv.requirementsSummary || []).map((req, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium border border-slate-200 dark:border-slate-700">
                        &bull; {req}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                {/* Admin/Revisor Action Toolbar */}
                {(role === 'ADMIN' || role === 'REVISOR') && (
                  <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(conv)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-700 dark:text-cyan-300 hover:text-blue-800 dark:hover:text-white font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        title="Editar todos los campos de esta convocatoria"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editar Convocatoria</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setProposalsModalConv(conv)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-800 dark:text-cyan-200 hover:text-blue-950 dark:hover:text-white font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        title="Ver y evaluar ofertas radicadas por proveedores"
                      >
                        <Users className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-300" />
                        <span>Propuestas ({conv.postulaciones?.length || 0})</span>
                      </button>
                    </div>

                    {role === 'ADMIN' && (
                      <button
                        type="button"
                        onClick={() => setConvToDelete(conv)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar convocatoria del sistema"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {/* Supplier Action / Postulation Status */}
                {role === 'PROVEEDOR' && (
                  hasApplied ? (
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5 bg-blue-50 px-3 py-2.5 rounded-xl border border-blue-200 w-full justify-center">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" /> Postulación Radicada Exitosamente
                    </span>
                  ) : (!isSupplierLoggedIn || !currentDossier) ? (
                    <button
                      type="button"
                      onClick={() => setSupplierPortalTab('login')}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Ingresar para Postular Oferta</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenApply(conv)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Postular Oferta Económica y Técnica</span>
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Postulation Modal */}
      {isApplyModalOpen && selectedConvocatoria && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
          <div className="bg-white dark:bg-[#0b1329] rounded-2xl shadow-2xl border border-slate-200 dark:border-blue-900/60 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh] sm:max-h-[88vh]">
            <div className="bg-[#0b1329] text-white px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-blue-600 px-2 py-0.5 rounded text-white shadow-2xs">
                  Radicación de Propuesta &bull; {selectedConvocatoria.code}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                  {selectedConvocatoria.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitApplication} className="p-4 sm:p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Propuesta Económica Total (COP) <span className="text-blue-600 dark:text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    value={financialProposal}
                    onChange={(e) => setFinancialProposal(e.target.value)}
                    placeholder="Ej. 185000000"
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Presupuesto oficial referencial: ${(selectedConvocatoria.budgetEstimateCOP || 0).toLocaleString('es-CO')} COP
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Resumen de la Propuesta Técnica y Comercial
                </label>
                <textarea
                  rows={3}
                  value={technicalProposal}
                  onChange={(e) => setTechnicalProposal(e.target.value)}
                  placeholder="Detalle los tiempos de entrega, marcas, fichas técnicas y garantías ofrecidas..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 leading-relaxed"
                  required
                />
              </div>

              {/* Attach Quotations / Cotizaciones Section */}
              <div className="space-y-2 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                    <span>Adjuntar Cotizaciones y Ofertas Económicas</span>
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    (PDF, Excel, Word o Imágenes)
                  </span>
                </div>

                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-3 bg-white dark:bg-slate-900 text-center transition-colors">
                  <input
                    type="file"
                    id="quotation-upload-input"
                    multiple
                    accept=".pdf,.xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={handleAddQuotationFiles}
                    className="hidden"
                  />
                  <label
                    htmlFor="quotation-upload-input"
                    className="cursor-pointer flex flex-col items-center justify-center gap-1 py-1"
                  >
                    <UploadCloud className="w-6 h-6 text-blue-600" />
                    <span className="text-xs font-bold text-blue-700 hover:underline">
                      Haga clic para seleccionar cotizaciones
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Formatos soportados: .PDF, .XLSX, .DOCX, .JPG hasta 25MB
                    </span>
                  </label>
                </div>

                {/* List of attached quotations */}
                {quotationFiles.length > 0 && (
                  <div className="mt-2 space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Cotizaciones y anexos agregados ({quotationFiles.length}):
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {quotationFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2 bg-blue-50/70 border border-blue-200 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
                            <div className="truncate">
                              <p className="font-bold text-slate-900 truncate">{file.name}</p>
                              <p className="text-[10px] text-slate-500">
                                {(file.size / 1024).toFixed(1)} KB &bull; Adjuntado {file.uploadedAt}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={() => handleDownloadQuotationFile(file)}
                              className="p-1 text-blue-700 hover:bg-blue-100 rounded transition-colors"
                              title="Descargar/Ver archivo"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveQuotationFile(file.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                              title="Quitar archivo"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-xl text-[11px] text-slate-700 space-y-0.5">
                <p className="font-bold text-blue-950">Vinculación al Expediente Digital:</p>
                <p>
                  Su postulación y cotizaciones quedarán enlazadas automáticamente con el expediente {currentDossier?.fileNumber}, garantizando que todos sus documentos y certificados sean evaluados por el comité.
                </p>
              </div>

              {applyFeedback && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-950 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{applyFeedback}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={Boolean(applyFeedback)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Radicar Postulación</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin/Revisor EDIT Convocatoria Modal (All Fields) */}
      {isEditModalOpen && editingConvocatoria && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
          <div className="bg-white dark:bg-[#0b1329] rounded-2xl shadow-2xl border border-slate-200 dark:border-blue-900/60 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[94vh]">
            <div className="bg-[#0b1329] text-white px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase bg-blue-600 px-2 py-0.5 rounded text-white shadow-2xs">
                    Edición de Convocatoria &bull; {editingConvocatoria.code}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                    Modificar Datos y Parámetros
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditConvocatoria} className="p-4 sm:p-6 space-y-4 text-xs text-slate-700 overflow-y-auto flex-1">
              
              {/* Row 1: Code & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Código de Convocatoria <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    placeholder="CONV-FS-2026-001"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Título de la Convocatoria <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Título oficial del proceso"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Sector / Categoría <span className="text-blue-600">*</span>
                  </label>
                    <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white bg-white dark:bg-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {categoriesConfig.map((cat) => (
                      <option key={cat.category} value={cat.category}>
                        {cat.category} ({cat.riskLevel || 'MEDIO'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Estado de la Convocatoria <span className="text-blue-600">*</span>
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white bg-white dark:bg-slate-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ABIERTA">ABIERTA (Recibiendo propuestas)</option>
                    <option value="EN_EVALUACION">EN EVALUACIÓN (Comité técnico/financiero)</option>
                    <option value="ADJUDICADA">ADJUDICADA (Contrato asignado)</option>
                    <option value="CERRADA">CERRADA / DESIERTA</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Access Rule & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Regla de Acceso SIG <span className="text-blue-600">*</span>
                  </label>
                  <select
                    value={editAccessRule}
                    onChange={(e) => setEditAccessRule(e.target.value as ConvocatoriaAccessRule)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="OPCION_A">Opción A: Abierta a todos (Homologación previa o posterior)</option>
                    <option value="OPCION_B">Opción B: Restringida (Solo Proveedores HABILITADOS 100%)</option>
                    <option value="OPCION_C">Opción C: Registro inmediato + Habilitación obligatoria pre-adjudicación</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Presupuesto Oficial Estimado (COP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={editBudget}
                      onChange={(e) => setEditBudget(e.target.value)}
                      placeholder="Ej. 150000000"
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Dates & Pliego */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Fecha de Publicación
                  </label>
                  <input
                    type="date"
                    value={editPublishedDate}
                    onChange={(e) => setEditPublishedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Fecha Límite de Cierre
                  </label>
                  <input
                    type="date"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nombre Archivo de Pliego
                  </label>
                  <input
                    type="text"
                    value={editTermsFileName}
                    onChange={(e) => setEditTermsFileName(e.target.value)}
                    placeholder="Pliego_Suministro_2026.pdf"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 5: Description */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Descripción y Alcance del Suministro
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Detalles técnicos, alcance, terminales de entrega, condiciones especiales..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              {/* Row 6: Requirements */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Requisitos Específicos (Un requisito por línea)
                </label>
                <textarea
                  rows={3}
                  value={editRequirements}
                  onChange={(e) => setEditRequirements(e.target.value)}
                  placeholder="Distribuidor autorizado de fábrica&#10;Garantía comercial mínima de 12 meses&#10;Certificado ISO 9001 o NTC"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Cambios de Convocatoria</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin/Revisor CREATE Convocatoria Modal (Full Fields) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
          <div className="bg-white dark:bg-[#0b1329] rounded-2xl shadow-2xl border border-slate-200 dark:border-blue-900/60 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[94vh]">
            <div className="bg-[#0b1329] text-white px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase bg-blue-600 px-2 py-0.5 rounded text-white shadow-2xs">
                    Administración de Licitaciones
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                    Publicar Nueva Convocatoria
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateConvocatoria} className="p-4 sm:p-6 space-y-4 text-xs text-slate-700 overflow-y-auto flex-1">
              
              {/* Row 1: Code & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Código de Convocatoria <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="CONV-FS-2026-004"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Título de la Convocatoria <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ej. Suministro de Neumáticos y Llantas Radiales 295/80R22.5"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Sector / Categoría <span className="text-blue-600">*</span>
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {categoriesConfig.map((cat) => (
                      <option key={cat.category} value={cat.category}>
                        {cat.category} ({cat.riskLevel || 'MEDIO'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Estado Inicial
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ABIERTA">ABIERTA (Recepción de ofertas)</option>
                    <option value="EN_EVALUACION">EN EVALUACIÓN</option>
                    <option value="ADJUDICADA">ADJUDICADA</option>
                    <option value="CERRADA">CERRADA</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Access Rule & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Regla de Acceso SIG <span className="text-blue-600">*</span>
                  </label>
                  <select
                    value={newAccessRule}
                    onChange={(e) => setNewAccessRule(e.target.value as ConvocatoriaAccessRule)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="OPCION_A">Opción A: Abierta a todos (Homologación previa o posterior)</option>
                    <option value="OPCION_B">Opción B: Restringida (Solo Proveedores HABILITADOS 100%)</option>
                    <option value="OPCION_C">Opción C: Registro inmediato + Habilitación obligatoria pre-adjudicación</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Presupuesto Oficial Estimado (COP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      placeholder="Ej. 120000000"
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Dates & Pliego */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Fecha de Publicación
                  </label>
                  <input
                    type="date"
                    value={newPublishedDate}
                    onChange={(e) => setNewPublishedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Fecha Límite de Recepción
                  </label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nombre Archivo de Pliego (.pdf)
                  </label>
                  <input
                    type="text"
                    value={newTermsFileName}
                    onChange={(e) => setNewTermsFileName(e.target.value)}
                    placeholder="Pliego_Suministro_2026.pdf"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 5: Description */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Descripción y Alcance del Suministro
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detalles sobre entregas en terminales, especificaciones técnicas requeridas..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              {/* Row 6: Requirements */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Requisitos Específicos (Uno por línea)
                </label>
                <textarea
                  rows={3}
                  value={newRequirements}
                  onChange={(e) => setNewRequirements(e.target.value)}
                  placeholder="Distribuidor autorizado de fábrica&#10;Garantía mínima de 12 meses&#10;Certificado ISO 9001"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear y Publicar Convocatoria</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proposals Drawer / Modal (Admin Review) */}
      {proposalsModalConv && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
          <div className="bg-white dark:bg-[#0b1329] rounded-2xl shadow-2xl border border-slate-200 dark:border-blue-900/60 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
            <div className="bg-[#0b1329] text-white px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-blue-600 px-2 py-0.5 rounded text-white shadow-2xs">
                  {proposalsModalConv.code} &bull; Propuestas Recibidas ({proposalsModalConv.postulaciones?.length || 0})
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                  {proposalsModalConv.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProposalsModalConv(null);
                  setEvaluatingPostulacion(null);
                }}
                className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 text-xs text-slate-700 overflow-y-auto flex-1">
              {(!proposalsModalConv.postulaciones || proposalsModalConv.postulaciones.length === 0) ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 text-sm">No hay propuestas radicadas aún</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Los proveedores habilitados o en proceso podrán postular sus ofertas técnicas y económicas a través del portal.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {proposalsModalConv.postulaciones.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white dark:bg-slate-900/90 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{post.supplierName}</span>
                          <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {post.nitOrDoc} &bull; {post.fileNumber}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            post.status === 'SELECCIONADO'
                              ? 'bg-blue-900 text-white border border-blue-700'
                              : post.status === 'EVALUADO'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : post.status === 'NO_SELECCIONADO'
                              ? 'bg-slate-800 text-slate-200 border border-slate-700'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {post.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {post.proposalSummary}
                        </p>

                        {/* Quotations attached by the supplier */}
                        {post.quotationFiles && post.quotationFiles.length > 0 && (
                          <div className="pt-2">
                            <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                              Cotizaciones y Anexos Adjuntos ({post.quotationFiles.length}):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {post.quotationFiles.map((quot) => (
                                <button
                                  key={quot.id}
                                  type="button"
                                  onClick={() => handleDownloadQuotationFile(quot)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                  title="Haga clic para descargar o visualizar la cotización"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span className="max-w-[200px] truncate">{quot.name}</span>
                                  <span className="text-[10px] text-blue-500 font-normal">
                                    ({(quot.size / 1024).toFixed(1)} KB)
                                  </span>
                                  <Download className="w-3 h-3 text-blue-500 ml-0.5" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                          <span>
                            Propuesta: <strong className="text-slate-900 font-mono">${post.proposedValue?.toLocaleString('es-CO')} COP</strong>
                          </span>
                          <span>
                            Radicado el: <strong className="text-slate-700">{post.submittedAt}</strong>
                          </span>
                          {post.technicalScore !== undefined && (
                            <span>Puntaje: <strong className="text-blue-700">T:{post.technicalScore} / E:{post.economicScore}</strong></span>
                          )}
                        </div>
                      </div>

                      {/* Quick decision actions for admin */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            evaluatePostulacion(proposalsModalConv.id, post.id, 'SELECCIONADO', 95, 95, 'Oferta óptima seleccionada por comité');
                          }}
                          className="px-2.5 py-1.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          title="Adjudicar / Seleccionar proveedor"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Adjudicar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            evaluatePostulacion(proposalsModalConv.id, post.id, 'EVALUADO', 85, 80, 'Oferta evaluada y calificada en pliego');
                          }}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-lg border border-blue-200 transition-colors cursor-pointer"
                          title="Marcar como Evaluado"
                        >
                          Calificar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setProposalsModalConv(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {convToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-[#0b1329] rounded-2xl shadow-2xl border border-slate-200 dark:border-blue-900/60 max-w-md w-full p-6 text-xs text-slate-700 dark:text-slate-300 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">¿Eliminar Convocatoria?</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  ¿Está seguro de eliminar la convocatoria <strong>{convToDelete.code} - {convToDelete.title}</strong>? Esta acción removerá el proceso del catálogo general.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConvToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmar Eliminación</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
