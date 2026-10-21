import React, { useState } from 'react';
import {
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  DollarSign,
  ShieldCheck,
  Edit3,
  CheckCircle2,
  AlertCircle,
  History,
  Lock,
  Save,
  X,
  FileText,
  Briefcase,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SupplierDossier } from '../types';
import { useApp } from '../context/AppContext';

interface Props {
  dossier: SupplierDossier;
  reviewerName: string;
}

interface EditModalState {
  isOpen: boolean;
  section: string;
  fieldKey: string;
  fieldLabel: string;
  currentValue: any;
  newValue: any;
  inputType?: 'text' | 'number' | 'email' | 'select' | 'textarea';
  selectOptions?: { value: string; label: string }[];
}

export const SupplierDataEditorTab: React.FC<Props> = ({ dossier, reviewerName }) => {
  const { role, canEditDossier, categoriesConfig, updateSupplierField, updateEntireSupplier, showToast } = useApp();

  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    section: '',
    fieldKey: '',
    fieldLabel: '',
    currentValue: '',
    newValue: '',
    inputType: 'text',
  });
  const [justification, setJustification] = useState('');
  const [isBatchEditing, setIsBatchEditing] = useState(false);
  const [batchFormData, setBatchFormData] = useState<any>(null);
  const [batchJustification, setBatchJustification] = useState('');

  const isNatural = dossier.basicInfo.supplierType === 'NATURAL';
  const hasEditPrivilege = canEditDossier(dossier.id);

  // Open single field editor modal
  const handleOpenFieldEdit = (
    section: string,
    fieldKey: string,
    fieldLabel: string,
    currentValue: any,
    inputType: 'text' | 'number' | 'email' | 'select' | 'textarea' = 'text',
    selectOptions?: { value: string; label: string }[]
  ) => {
    setEditModal({
      isOpen: true,
      section,
      fieldKey,
      fieldLabel,
      currentValue: currentValue ?? '',
      newValue: currentValue ?? '',
      inputType,
      selectOptions,
    });
    setJustification('');
  };

  const handleSaveFieldEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) {
      alert('Por favor ingrese el motivo o justificación del cambio para el registro de auditoría.');
      return;
    }

    // Call updateSupplierField from context
    updateSupplierField(
      dossier.id,
      editModal.section,
      editModal.fieldKey,
      editModal.fieldLabel,
      editModal.currentValue,
      editModal.newValue,
      reviewerName || (role === 'ADMIN' ? 'Julian Salgado (Admin)' : 'Evaluador Técnico SIG'),
      role,
      justification.trim()
    );

    showToast(
      `Campo "${editModal.fieldLabel}" actualizado con éxito y registrado en auditoría.`,
      'success',
      'MODIFICACIÓN AUDITADA'
    );

    setEditModal({ ...editModal, isOpen: false });
  };

  // Batch Editor Setup
  const handleStartBatchEdit = () => {
    setBatchFormData({
      basicInfo: { ...dossier.basicInfo },
      selectedCategory: dossier.selectedCategory,
      supplierTier: dossier.supplierTier || dossier.basicInfo.supplierTier || 'B',
    });
    setBatchJustification('');
    setIsBatchEditing(true);
  };

  const handleSaveBatchEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchJustification.trim()) {
      alert('Debe justificar la actualización masiva para el registro en el Módulo de Auditoría.');
      return;
    }

    updateEntireSupplier(
      dossier.id,
      batchFormData,
      [],
      reviewerName || (role === 'ADMIN' ? 'Julian Salgado (Admin)' : 'Evaluador Técnico SIG'),
      role,
      batchJustification.trim()
    );

    showToast(
      'Información del proveedor actualizada exitosamente. Registro de auditoría generado.',
      'success',
      'EXPEDIENTE ACTUALIZADO'
    );
    setIsBatchEditing(false);
  };

  return (
    <div className="space-y-4">
      {!hasEditPrivilege && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between text-xs text-blue-950 dark:text-cyan-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-700 dark:text-cyan-400 shrink-0" />
            <span>
              <strong>Modo Solo Lectura:</strong> Este expediente está asignado a{' '}
              <strong className="underline">{dossier.assignedReviewerName || 'otro evaluador'}</strong>. La edición de datos está reservada al revisor titular o al Administrador General.
            </span>
          </div>
        </div>
      )}

      {/* 1. SECCIÓN: INFORMACIÓN BÁSICA Y TRIBUTARIA */}
      <div className="bg-white dark:bg-[#0b1329] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-900/60 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
              I. Identificación General y Régimen Tributario
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded">
              {isNatural ? 'Persona Natural' : 'Persona Jurídica'}
            </span>
            {hasEditPrivilege && !isBatchEditing && (
              <button
                type="button"
                onClick={handleStartBatchEdit}
                className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
                title="Editar todos los campos del formulario"
              >
                <Edit3 className="w-3 h-3" />
                <span>Editar Formulario</span>
              </button>
            )}
          </div>
        </div>

        {/* Unified Dossier Data Sheet - Clean Definition Layout without fragmented boxes */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
          {/* Fila 1: Razón Social, NIT y Tipo de Persona */}
          <div className="p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-start bg-slate-50/40 dark:bg-slate-900/20">
            {/* Razón Social / Nombre Completo */}
            <div className="lg:col-span-6 group relative pr-7">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {isNatural ? 'Nombre Completo del Proveedor' : 'Razón Social / Denominación Comercial'}
              </span>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
                {isNatural ? dossier.basicInfo.fullName : dossier.basicInfo.companyName}
              </div>
              {hasEditPrivilege && (
                <button
                  type="button"
                  onClick={() =>
                    handleOpenFieldEdit(
                      'Información Básica',
                      isNatural ? 'basicInfo.fullName' : 'basicInfo.companyName',
                      isNatural ? 'Nombre Completo' : 'Razón Social',
                      isNatural ? dossier.basicInfo.fullName : dossier.basicInfo.companyName,
                      'text'
                    )
                  }
                  className="absolute top-0 right-0 p-1 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Editar este campo"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* NIT / Cédula */}
            <div className="lg:col-span-3 group relative pr-7">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {isNatural ? 'Cédula / Documento' : 'NIT (Identificación Tributaria)'}
              </span>
              <div className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {isNatural ? dossier.basicInfo.documentNumber : `${dossier.basicInfo.nit || ''}${dossier.basicInfo.dv ? `-${dossier.basicInfo.dv}` : ''}`}
              </div>
              {hasEditPrivilege && (
                <button
                  type="button"
                  onClick={() =>
                    handleOpenFieldEdit(
                      'Información Básica',
                      isNatural ? 'basicInfo.documentNumber' : 'basicInfo.nit',
                      isNatural ? 'Cédula / Documento' : 'NIT',
                      isNatural ? dossier.basicInfo.documentNumber : dossier.basicInfo.nit,
                      'text'
                    )
                  }
                  className="absolute top-0 right-0 p-1 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Editar este campo"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Tipo de Persona */}
            <div className="lg:col-span-3 group relative pr-7">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Tipo de Persona
              </span>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
                  {isNatural ? 'Persona Natural' : 'Persona Jurídica'}
                </span>
              </div>
              {hasEditPrivilege && (
                <button
                  type="button"
                  onClick={() =>
                    handleOpenFieldEdit(
                      'Información Básica',
                      'basicInfo.supplierType',
                      'Tipo de Persona',
                      dossier.basicInfo.supplierType,
                      'select',
                      [
                        { value: 'NATURAL', label: 'Persona Natural' },
                        { value: 'JURIDICA', label: 'Persona Jurídica' },
                      ]
                    )
                  }
                  className="absolute top-0 right-0 p-1 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Editar este campo"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Fila 2: Clasificación de Criticidad SIG, Categoría y Actividad CIIU */}
          <div className="p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
            {/* Tipo de Proveedor (A, B, C) */}
            <div className="lg:col-span-4 group relative pr-7">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Criticidad SIG (Tipo A, B, C)
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`text-xs font-black px-2.5 py-0.5 rounded border ${
                    (dossier.supplierTier || dossier.basicInfo.supplierTier || 'B') === 'A'
                      ? 'bg-blue-950 text-white border-blue-900 dark:bg-blue-900 dark:text-cyan-300'
                      : (dossier.supplierTier || dossier.basicInfo.supplierTier || 'B') === 'B'
                      ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-cyan-300'
                      : 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Tipo {dossier.supplierTier || dossier.basicInfo.supplierTier || 'B'}
                </span>
                <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                  {(dossier.supplierTier || dossier.basicInfo.supplierTier || 'B') === 'A'
                    ? 'Crítico (Estratégico / Alto Impacto)'
                    : (dossier.supplierTier || dossier.basicInfo.supplierTier || 'B') === 'B'
                    ? 'Importante (Soporte Operativo)'
                    : 'Estándar (Menor / Ocasional)'}
                </span>
              </div>
              {hasEditPrivilege && (
                <button
                  type="button"
                  onClick={() =>
                    handleOpenFieldEdit(
                      'Información Básica',
                      'supplierTier',
                      'Tipo de Proveedor (A, B, C)',
                      dossier.supplierTier || dossier.basicInfo.supplierTier || 'B',
                      'select',
                      [
                        { value: 'A', label: 'Tipo A - Crítico (Estratégico / Operación / Seguridad)' },
                        { value: 'B', label: 'Tipo B - Importante (Operativo / Mantenimiento / Soporte)' },
                        { value: 'C', label: 'Tipo C - Estándar (General / Servicios Menores / Ocasional)' },
                      ]
                    )
                  }
                  className="absolute top-0 right-0 p-1 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Editar Tipo de Proveedor (A, B, C)"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Categoría Asignada */}
            <div className="lg:col-span-5 group relative pr-7">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Categoría Oficial de Suministro
              </span>
              <div className="text-xs font-bold text-blue-900 dark:text-cyan-300 mt-1 leading-snug">
                {dossier.selectedCategory}
              </div>
              {hasEditPrivilege && (
                <button
                  type="button"
                  onClick={() =>
                    handleOpenFieldEdit(
                      'Información Básica',
                      'selectedCategory',
                      'Categoría de Servicio',
                      dossier.selectedCategory,
                      'select',
                      categoriesConfig.map((c) => ({
                        value: c.category,
                        label: `${c.category}${c.economicCode ? ` (${c.economicCode})` : ''}`,
                      }))
                    )
                  }
                  className="absolute top-0 right-0 p-1 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Editar este campo"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Actividad Económica CIIU */}
            <div className="lg:col-span-3 group relative pr-7">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Actividad Económica CIIU
              </span>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                {dossier.basicInfo.economicActivity || 'No registrada'}
              </div>
              {hasEditPrivilege && (
                <button
                  type="button"
                  onClick={() =>
                    handleOpenFieldEdit(
                      'Información Básica',
                      'basicInfo.economicActivity',
                      'Actividad Económica / CIIU',
                      dossier.basicInfo.economicActivity,
                      'text'
                    )
                  }
                  className="absolute top-0 right-0 p-1 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Editar este campo"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Fila 3: Ubicación, Dirección, Correo y Teléfono */}
          <div className="p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-start bg-slate-50/40 dark:bg-slate-900/20">
            {/* Ciudad y Municipio */}
            <div className="lg:col-span-3 group relative pr-7">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Ciudad / Municipio
              </span>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {dossier.basicInfo.city || 'No registrada'}
              </div>
              {hasEditPrivilege && (
                <button
                  type="button"
                  onClick={() =>
                    handleOpenFieldEdit(
                      'Información Básica',
                      'basicInfo.city',
                      'Ciudad / Municipio',
                      dossier.basicInfo.city,
                      'text'
                    )
                  }
                  className="absolute top-0 right-0 p-1 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Editar este campo"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dirección Principal */}
            <div className="lg:col-span-3 group relative pr-7">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Dirección Principal
              </span>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 leading-snug">
                {dossier.basicInfo.address || 'No registrada'}
              </div>
              {hasEditPrivilege && (
                <button
                  type="button"
                  onClick={() =>
                    handleOpenFieldEdit(
                      'Información Básica',
                      'basicInfo.address',
                      'Dirección Principal',
                      dossier.basicInfo.address,
                      'text'
                    )
                  }
                  className="absolute top-0 right-0 p-1 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Editar este campo"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Correo Electrónico Principal */}
            <div className="lg:col-span-3 group relative pr-7">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Correo Electrónico
              </span>
              <div className="text-xs font-semibold text-blue-700 dark:text-cyan-400 mt-0.5 break-all">
                {dossier.basicInfo.email}
              </div>
              {hasEditPrivilege && (
                <button
                  type="button"
                  onClick={() =>
                    handleOpenFieldEdit(
                      'Información Básica',
                      'basicInfo.email',
                      'Correo Electrónico',
                      dossier.basicInfo.email,
                      'email'
                    )
                  }
                  className="absolute top-0 right-0 p-1 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Editar este campo"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Teléfono / Celular */}
            <div className="lg:col-span-3 group relative pr-7">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Teléfono / Celular
              </span>
              <div className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {dossier.basicInfo.phone || dossier.basicInfo.cellphone || 'No registrado'}
              </div>
              {hasEditPrivilege && (
                <button
                  type="button"
                  onClick={() =>
                    handleOpenFieldEdit(
                      'Información Básica',
                      'basicInfo.phone',
                      'Teléfono / Celular',
                      dossier.basicInfo.phone || dossier.basicInfo.cellphone,
                      'text'
                    )
                  }
                  className="absolute top-0 right-0 p-1 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Editar este campo"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECCIÓN: REPRESENTANTE LEGAL (SI APLICA) */}
      {!isNatural && (
        <div className="bg-white dark:bg-[#0b1329] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-900/60 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                II. Representación Legal y Datos de Identificación
              </h3>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              {/* Nombre Representante */}
              <div className="group relative pr-7">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Nombre del Representante Legal
                </span>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
                  {dossier.basicInfo.legalRepresentative || 'No registrado'}
                </div>
                {hasEditPrivilege && (
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenFieldEdit(
                        'Representante Legal',
                        'basicInfo.legalRepresentative',
                        'Nombre del Representante Legal',
                        dossier.basicInfo.legalRepresentative,
                        'text'
                      )
                    }
                    className="absolute top-0 right-0 p-1 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Editar este campo"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Cédula / Documento */}
              <div className="group relative pr-7">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Cédula / Documento de Identidad
                </span>
                <div className="text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {dossier.basicInfo.repDocNumber || 'No registrado'}
                </div>
                {hasEditPrivilege && (
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenFieldEdit(
                        'Representante Legal',
                        'basicInfo.repDocNumber',
                        'Documento del Representante Legal',
                        dossier.basicInfo.repDocNumber,
                        'text'
                      )
                    }
                    className="absolute top-0 right-0 p-1 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Editar este campo"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Correo del Representante */}
              <div className="group relative pr-7">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Correo del Representante Legal
                </span>
                <div className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-cyan-400 mt-0.5 break-all">
                  {dossier.basicInfo.repEmail || dossier.basicInfo.email}
                </div>
                {hasEditPrivilege && (
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenFieldEdit(
                        'Representante Legal',
                        'basicInfo.repEmail',
                        'Correo del Representante Legal',
                        dossier.basicInfo.repEmail || dossier.basicInfo.email,
                        'email'
                      )
                    }
                    className="absolute top-0 right-0 p-1 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Editar este campo"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SECCIÓN: INFORMACIÓN BANCARIA */}
      <div className="bg-white dark:bg-[#0b1329] rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-900/60 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
              III. Información Bancaria Registrada (FS.GA-FOR-009)
            </h3>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {/* Banco */}
            <div className="group relative pr-7">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Entidad Bancaria
              </span>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {dossier.basicInfo.bankName || 'Bancolombia'}
              </div>
              {hasEditPrivilege && (
                <button
                  type="button"
                  onClick={() =>
                    handleOpenFieldEdit(
                      'Información Bancaria',
                      'basicInfo.bankName',
                      'Entidad Bancaria',
                      dossier.basicInfo.bankName || 'Bancolombia',
                      'text'
                    )
                  }
                  className="absolute top-0 right-0 p-1 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Editar este campo"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Tipo de Cuenta */}
            <div className="group relative pr-7">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Tipo de Cuenta
              </span>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {dossier.basicInfo.accountType || 'Cuenta de Ahorros'}
              </div>
              {hasEditPrivilege && (
                <button
                  type="button"
                  onClick={() =>
                    handleOpenFieldEdit(
                      'Información Bancaria',
                      'basicInfo.accountType',
                      'Tipo de Cuenta',
                      dossier.basicInfo.accountType || 'Cuenta de Ahorros',
                      'select',
                      [
                        { value: 'Ahorros', label: 'Cuenta de Ahorros' },
                        { value: 'Corriente', label: 'Cuenta Corriente' },
                      ]
                    )
                  }
                  className="absolute top-0 right-0 p-1 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Editar este campo"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Número de Cuenta */}
            <div className="group relative pr-7">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Número de Cuenta
              </span>
              <div className="text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {dossier.basicInfo.accountNumber || '230-984712-44'}
              </div>
              {hasEditPrivilege && (
                <button
                  type="button"
                  onClick={() =>
                    handleOpenFieldEdit(
                      'Información Bancaria',
                      'basicInfo.accountNumber',
                      'Número de Cuenta Bancaria',
                      dossier.basicInfo.accountNumber || '230-984712-44',
                      'text'
                    )
                  }
                  className="absolute top-0 right-0 p-1 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Editar este campo"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Titular */}
            <div className="group relative pr-7">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Titular de la Cuenta
              </span>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 leading-snug">
                {isNatural ? dossier.basicInfo.fullName : dossier.basicInfo.companyName}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MODAL: Granular Single Field Editor with Mandatory Audit Justification */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="shrink-0 bg-[#0b1329] text-white px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase bg-blue-500/20 text-cyan-300 px-2 py-0.5 rounded border border-blue-400/30">
                  Edición Auditada &bull; {editModal.section}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  Editar: {editModal.fieldLabel}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditModal({ ...editModal, isOpen: false })}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFieldEdit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs text-slate-700 scrollbar-thin scrollbar-thumb-slate-300">
                {/* Valor Actual */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Valor Actual:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {String(editModal.currentValue) || '(Vacío)'}
                  </div>
                </div>

                {/* Nuevo Valor */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nuevo Valor para "{editModal.fieldLabel}" <span className="text-blue-600 font-bold">*</span>
                  </label>

                  {editModal.inputType === 'select' ? (
                    <select
                      value={editModal.newValue}
                      onChange={(e) => setEditModal({ ...editModal, newValue: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {editModal.selectOptions?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : editModal.inputType === 'textarea' ? (
                    <textarea
                      rows={3}
                      value={editModal.newValue}
                      onChange={(e) => setEditModal({ ...editModal, newValue: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  ) : (
                    <input
                      type={editModal.inputType || 'text'}
                      value={editModal.newValue}
                      onChange={(e) => setEditModal({ ...editModal, newValue: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  )}
                </div>

                {/* Motivo o Justificación Obligatoria */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Motivo / Justificación del Cambio (Para Trazabilidad y Auditoría) <span className="text-blue-600 font-bold">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Ej. Corrección autorizada por el proveedor según RUT actualizado radicado el 26 de agosto..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Esta justificación se almacenará en el <strong>Módulo de Auditoría</strong> accesible por el Administrador General.
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setEditModal({ ...editModal, isOpen: false })}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer rounded-lg hover:bg-slate-200/60 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar y Auditar Modificación</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: Batch Form Editor */}
      {isBatchEditing && batchFormData && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="shrink-0 bg-[#0b1329] text-white px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase bg-blue-500/20 text-cyan-300 px-2 py-0.5 rounded border border-blue-400/30">
                  Edición Integral de Proveedor
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  Actualizar Datos Completos del Proveedor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchEditing(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBatchEdit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs text-slate-700 scrollbar-thin scrollbar-thumb-slate-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nombre / Razón Social */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      {isNatural ? 'Nombre Completo' : 'Razón Social'}
                    </label>
                    <input
                      type="text"
                      value={isNatural ? batchFormData.basicInfo.fullName : batchFormData.basicInfo.companyName}
                      onChange={(e) => {
                        if (isNatural) {
                          setBatchFormData({
                            ...batchFormData,
                            basicInfo: { ...batchFormData.basicInfo, fullName: e.target.value },
                          });
                        } else {
                          setBatchFormData({
                            ...batchFormData,
                            basicInfo: { ...batchFormData.basicInfo, companyName: e.target.value },
                          });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                      required
                    />
                  </div>

                  {/* Documento / NIT */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      {isNatural ? 'Cédula / Documento' : 'NIT'}
                    </label>
                    <input
                      type="text"
                      value={isNatural ? batchFormData.basicInfo.documentNumber : batchFormData.basicInfo.nit}
                      onChange={(e) => {
                        if (isNatural) {
                          setBatchFormData({
                            ...batchFormData,
                            basicInfo: { ...batchFormData.basicInfo, documentNumber: e.target.value },
                          });
                        } else {
                          setBatchFormData({
                            ...batchFormData,
                            basicInfo: { ...batchFormData.basicInfo, nit: e.target.value },
                          });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                      required
                    />
                  </div>

                  {/* Correo */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={batchFormData.basicInfo.email}
                      onChange={(e) =>
                        setBatchFormData({
                          ...batchFormData,
                          basicInfo: { ...batchFormData.basicInfo, email: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                      required
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Teléfono / Celular</label>
                    <input
                      type="text"
                      value={batchFormData.basicInfo.phone || batchFormData.basicInfo.cellphone || ''}
                      onChange={(e) =>
                        setBatchFormData({
                          ...batchFormData,
                          basicInfo: { ...batchFormData.basicInfo, phone: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                    />
                  </div>

                  {/* Ciudad */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Ciudad / Municipio</label>
                    <input
                      type="text"
                      value={batchFormData.basicInfo.city || ''}
                      onChange={(e) =>
                        setBatchFormData({
                          ...batchFormData,
                          basicInfo: { ...batchFormData.basicInfo, city: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                    />
                  </div>

                  {/* Categoría Oficial */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Categoría de Suministro / Servicio <span className="text-blue-600 font-bold">*</span>
                    </label>
                    <select
                      value={batchFormData.selectedCategory || ''}
                      onChange={(e) =>
                        setBatchFormData({
                          ...batchFormData,
                          selectedCategory: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white text-slate-900"
                      required
                    >
                      {categoriesConfig.map((c) => (
                        <option key={c.category} value={c.category}>
                          {c.category} {c.economicCode ? `(${c.economicCode})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tipo de Proveedor (A, B y C) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Tipo de Proveedor (A, B y C) <span className="text-blue-600 font-bold">*</span>
                    </label>
                    <select
                      value={batchFormData.supplierTier || batchFormData.basicInfo?.supplierTier || 'B'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBatchFormData({
                          ...batchFormData,
                          supplierTier: val,
                          basicInfo: { ...batchFormData.basicInfo, supplierTier: val },
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white text-slate-900"
                      required
                    >
                      <option value="A">Tipo A - Crítico (Estratégico / Operación / Seguridad)</option>
                      <option value="B">Tipo B - Importante (Operativo / Mantenimiento / Soporte)</option>
                      <option value="C">Tipo C - Estándar (General / Servicios Menores / Ocasional)</option>
                    </select>
                  </div>

                  {/* Dirección */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Dirección</label>
                    <input
                      type="text"
                      value={batchFormData.basicInfo.address || ''}
                      onChange={(e) =>
                        setBatchFormData({
                          ...batchFormData,
                          basicInfo: { ...batchFormData.basicInfo, address: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                    />
                  </div>

                  {/* Representante Legal si es Jurídica */}
                  {!isNatural && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Representante Legal
                        </label>
                        <input
                          type="text"
                          value={batchFormData.basicInfo.legalRepresentative || ''}
                          onChange={(e) =>
                            setBatchFormData({
                              ...batchFormData,
                              basicInfo: {
                                ...batchFormData.basicInfo,
                                legalRepresentative: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Documento Representante
                        </label>
                        <input
                          type="text"
                          value={batchFormData.basicInfo.repDocNumber || ''}
                          onChange={(e) =>
                            setBatchFormData({
                              ...batchFormData,
                              basicInfo: { ...batchFormData.basicInfo, repDocNumber: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Justificación obligatoria para auditoría */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Justificación de la Actualización Integral (Auditable) <span className="text-blue-600 font-bold">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={batchJustification}
                    onChange={(e) => setBatchJustification(e.target.value)}
                    placeholder="Explique la razón de la actualización de datos para el módulo de auditoría..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsBatchEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer rounded-lg hover:bg-slate-200/60 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar y Registrar en Auditoría</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
