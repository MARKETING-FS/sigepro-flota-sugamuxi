import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  AlertCircle,
  Sparkles,
  Layers,
  Lock,
  Award,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SupplierType, SupplierTier, ProcessStatus, AdminCreateSupplierInput } from '../types';

interface AdminCreateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (dossierId: string) => void;
}

export const AdminCreateSupplierModal: React.FC<AdminCreateSupplierModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { role, categoriesConfig, createSupplierAdmin, setCurrentDossierId, systemUsers, activeUserId, activeUser, showToast } = useApp();

  const [supplierType, setSupplierType] = useState<SupplierType>('JURIDICA');
  const [supplierTier, setSupplierTier] = useState<SupplierTier>('A');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categoriesConfig[0]?.category || 'Mantenimiento Automotriz y Repuestos'
  );
  const [assignedReviewerId, setAssignedReviewerId] = useState<string>(
    role === 'REVISOR' ? activeUserId : 'revisor-1'
  );

  const [initialStatus] = useState<ProcessStatus>('DOCUMENTACION_PENDIENTE');
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(true);

  // Form Fields
  const [formData, setFormData] = useState({
    // Common
    email: '',
    phone: '',
    city: 'Sogamoso, Boyacá',
    address: 'Zona Industrial Lote 4, Sogamoso',
    economicActivity: '',

    // Natural
    fullName: '',
    documentType: 'CC' as 'CC' | 'CE' | 'PASAPORTE',
    documentNumber: '',
    professionOrTrade: 'Ingeniero Mecánico / Técnico Especialista',

    // Jurídica
    companyName: '',
    nit: '',
    representativeLegalName: '',
    representativeLegalDocType: 'CC' as 'CC' | 'CE' | 'PASAPORTE',
    representativeLegalDocNumber: '',

    // Internal notes
    notes: 'Proveedor homologado por trayectoria comercial e idoneidad técnica con Flota Sugamuxi S.A.',
  });

  // Compliance Pre-check options
  const [compliance, setCompliance] = useState({
    sarlaftResult: 'SIN_COINCIDENCIAS' as 'SIN_COINCIDENCIAS' | 'REQUIERE_VERIFICACION' | 'PENDIENTE',
    ofacResult: 'LIMPIO' as 'LIMPIO' | 'ALERTA' | 'PENDIENTE',
    procuraduriaResult: 'VIGENTE_SIN_ANTECEDENTES' as 'VIGENTE_SIN_ANTECEDENTES' | 'CON_ANTECEDENTES' | 'PENDIENTE',
    legalConcept: 'APROBADO' as 'APROBADO' | 'OBSERVADO' | 'PENDIENTE',
    financialConcept: 'APROBADO' as 'APROBADO' | 'OBSERVADO' | 'PENDIENTE',
    hseqConcept: 'APROBADO' as 'APROBADO' | 'OBSERVADO' | 'PENDIENTE',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const handleFillDemoJuridica = () => {
    setSupplierType('JURIDICA');
    setSupplierTier('A');
    setSelectedCategory('Combustibles y Lubricantes');
    setIsEmailVerified(true);
    setFormData({
      email: 'comercial@distribuidorasugamuxioil.com',
      phone: '(608) 770-4590 / 310 889 4411',
      city: 'Sogamoso, Boyacá',
      address: 'Carrera 11 No. 24-80, Sector El Cerrito',
      economicActivity: '',
      fullName: '',
      documentType: 'CC',
      documentNumber: '',
      professionOrTrade: '',
      companyName: 'Distribuidora de Combustibles & Lubricantes Sugamuxi Oil S.A.S.',
      nit: '900.892.410-4',
      representativeLegalName: 'Hernando Rojas Villamil',
      representativeLegalDocType: 'CC',
      representativeLegalDocNumber: '74.312.809',
      notes: 'Proveedor estratégico regional con convenio directo de suministro de combustible para terminal de Sogamoso y Duitama.',
    });
  };

  const handleFillDemoNatural = () => {
    setSupplierType('NATURAL');
    setSupplierTier('B');
    setSelectedCategory('Servicios Profesionales y Consultoría');
    setIsEmailVerified(true);
    setFormData({
      email: 'claudia.patricia.hseq@gmail.com',
      phone: '313 456 7890',
      city: 'Duitama, Boyacá',
      address: 'Calle 16 # 14-22 Oficina 302',
      economicActivity: '',
      fullName: 'Dra. Claudia Patricia Becerra Silva',
      documentType: 'CC',
      documentNumber: '40.045.678',
      professionOrTrade: 'Especialista en Gerencia HSEQ y Auditoría Vial',
      companyName: '',
      nit: '',
      representativeLegalName: '',
      representativeLegalDocType: 'CC',
      representativeLegalDocNumber: '',
      notes: 'Alta administrativa para vinculación de auditora externa para plan estratégico de seguridad vial 2026.',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation
    if (!formData.email.trim()) {
      const msg = 'El correo electrónico corporativo es obligatorio.';
      setErrorMessage(msg);
      showToast(msg, 'error', 'Campo Requerido');
      return;
    }

    if (supplierType === 'JURIDICA') {
      if (!formData.companyName.trim()) {
        const msg = 'La razón social de la empresa es obligatoria.';
        setErrorMessage(msg);
        showToast(msg, 'error', 'Campo Requerido');
        return;
      }
      if (!formData.nit.trim()) {
        const msg = 'El NIT de la empresa es obligatorio.';
        setErrorMessage(msg);
        showToast(msg, 'error', 'Campo Requerido');
        return;
      }
      if (!formData.representativeLegalName.trim()) {
        const msg = 'El nombre del Representante Legal es obligatorio.';
        setErrorMessage(msg);
        showToast(msg, 'error', 'Campo Requerido');
        return;
      }
    } else {
      if (!formData.fullName.trim()) {
        const msg = 'El nombre completo de la persona natural es obligatorio.';
        setErrorMessage(msg);
        showToast(msg, 'error', 'Campo Requerido');
        return;
      }
      if (!formData.documentNumber.trim()) {
        const msg = 'El número de documento de identidad es obligatorio.';
        setErrorMessage(msg);
        showToast(msg, 'error', 'Campo Requerido');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const creatorName =
        role === 'ADMIN'
          ? 'Administrador General'
          : 'Revisor Técnico Evaluador';

      const input: AdminCreateSupplierInput = {
        basicInfo: {
          supplierType,
          supplierTier,
          email: formData.email.trim(),
          phone: formData.phone.trim() || '300 000 0000',
          city: formData.city.trim() || 'Sogamoso, Boyacá',
          address: formData.address.trim(),
          ...(supplierType === 'JURIDICA'
            ? {
                companyName: formData.companyName.trim(),
                nit: formData.nit.trim(),
                representativeLegalName: formData.representativeLegalName.trim(),
                representativeLegalDocType: formData.representativeLegalDocType,
                representativeLegalDocNumber: formData.representativeLegalDocNumber.trim(),
              }
            : {
                fullName: formData.fullName.trim(),
                documentType: formData.documentType,
                documentNumber: formData.documentNumber.trim(),
                professionOrTrade: formData.professionOrTrade.trim(),
              }),
        },
        selectedCategory,
        supplierTier,
        economicActivity: '',
        initialStatus: 'DOCUMENTACION_PENDIENTE',
        isEmailVerified,
        notes: formData.notes.trim(),
        createdByRole: role === 'ADMIN' ? 'ADMIN' : 'REVISOR',
        createdByName: creatorName,
        assignedReviewerId,
        assignedReviewerName:
          systemUsers.find((u) => u.id === assignedReviewerId)?.name || 'Ing. Carlos Mendoza (Revisor 1)',
        complianceChecks: compliance,
      };

      const newDossier = createSupplierAdmin(input);
      setIsSubmitting(false);
      onClose();

      if (onSuccess) {
        onSuccess(newDossier.id);
      } else {
        setCurrentDossierId(newDossier.id);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      const msg = err?.message || 'Ocurrió un error al registrar el proveedor.';
      setErrorMessage(msg);
      showToast(msg, 'error', 'Error al Crear Proveedor');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[94vh]">
        
        {/* Compact Modal Header */}
        <div className="bg-[#0b1329] text-white px-4 sm:px-5 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 border border-blue-400/40 flex items-center justify-center text-cyan-300 shadow-2xs shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
                  Alta Administrativa Directa de Proveedor
                </h3>
                <span className="bg-blue-900/90 text-cyan-300 border border-blue-600 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                  {role === 'ADMIN' ? 'Admin General' : 'Revisor Técnico'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Demo Fill Buttons in Header */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700 text-[11px]">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span className="text-slate-300 text-[10px]">Cargar Demo:</span>
              <button
                type="button"
                onClick={handleFillDemoJuridica}
                className="font-bold text-cyan-300 hover:text-white hover:underline cursor-pointer px-1"
                title="Llenar datos de prueba Persona Jurídica"
              >
                Jurídica
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={handleFillDemoNatural}
                className="font-bold text-cyan-300 hover:text-white hover:underline cursor-pointer px-1"
                title="Llenar datos de prueba Persona Natural"
              >
                Natural
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile-only Demo Fill Bar */}
        <div className="sm:hidden bg-slate-100 border-b border-slate-200 px-4 py-1.5 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-slate-600 font-medium">Autocompletar prueba:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleFillDemoJuridica}
              className="text-[11px] font-bold text-blue-700 hover:underline"
            >
              Jurídica
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={handleFillDemoNatural}
              className="text-[11px] font-bold text-blue-700 hover:underline"
            >
              Natural
            </button>
          </div>
        </div>

        {/* Form Body with Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {errorMessage && (
            <div className="p-3.5 bg-slate-900 border border-blue-600 rounded-xl text-white text-xs flex items-center gap-2 shadow-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Tipo de Persona, Categoría, Tipo de Proveedor (A, B, C) y Revisor */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Naturaleza Jurídica <span className="text-blue-600 font-bold">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSupplierType('JURIDICA')}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                      supplierType === 'JURIDICA'
                        ? 'bg-blue-50 border-blue-600 text-blue-950 shadow-xs ring-1 ring-blue-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Jurídica</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSupplierType('NATURAL')}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                      supplierType === 'NATURAL'
                        ? 'bg-blue-50 border-blue-600 text-blue-950 shadow-xs ring-1 ring-blue-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Natural</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Categoría Económica <span className="text-blue-600 font-bold">*</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setSelectedCategory(newCat);
                    // Smart recommendation for Supplier Tier
                    if (
                      [
                        'Combustibles y Lubricantes',
                        'Mantenimiento Automotriz y Repuestos',
                        'Carrocerías y Metalmecánica',
                        'Llantas y Neumáticos',
                        'Pólizas y Seguros',
                      ].includes(newCat)
                    ) {
                      setSupplierTier('A');
                    } else if (
                      [
                        'Papelería y Útiles de Oficina',
                        'Servicios de Aseo y Cafetería',
                        'Publicidad y Medios Impresos',
                      ].includes(newCat)
                    ) {
                      setSupplierTier('C');
                    } else {
                      setSupplierTier('B');
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-hidden"
                >
                  {categoriesConfig.map((cat) => (
                    <option key={cat.category} value={cat.category}>
                      {cat.category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                  <span>Avaluador / Usuario con Acceso</span>
                  <span className="text-[10px] text-blue-600 font-bold">Custodia y Evaluación</span>
                </label>
                <select
                  value={assignedReviewerId}
                  onChange={(e) => setAssignedReviewerId(e.target.value)}
                  disabled={role === 'REVISOR'}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-hidden disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  {systemUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.role === 'REVISOR' ? 'Evaluador Técnico' : 'Administrador General'}
                    </option>
                  ))}
                </select>
                {role === 'REVISOR' && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Asignado a su usuario ({activeUser.shortName}).
                  </p>
                )}
              </div>
            </div>

            {/* Selector de Tipo de Proveedor (A, B y C) */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tipo de Proveedor (A, B y C) - Nivel de Criticidad SIG</span>
                  <span className="text-blue-600">*</span>
                </label>
                <span className="text-[11px] font-bold text-slate-500">
                  Seleccionado:{' '}
                  <strong className={supplierTier === 'A' ? 'text-blue-950 font-black' : supplierTier === 'B' ? 'text-blue-700 font-black' : 'text-slate-700 font-black'}>
                    Tipo {supplierTier}
                  </strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* TIPO A */}
                <div
                  onClick={() => setSupplierTier('A')}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    supplierTier === 'A'
                      ? 'border-blue-900 bg-blue-50/80 shadow-xs ring-1 ring-blue-900'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-[#0b1329] text-white border border-blue-950">
                      <Award className="w-3 h-3 text-cyan-400" />
                      Tipo A - Crítico
                    </span>
                    {supplierTier === 'A' && (
                      <span className="text-[10px] font-bold text-blue-900 bg-blue-100 px-1.5 py-0.5 rounded shadow-2xs">
                        Activo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-800 leading-tight">
                    Estratégico / Alto Impacto
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                    Combustibles, repuestos críticos de motor/frenos, carrocerías, llantas y seguros obligatorios.
                  </p>
                </div>

                {/* TIPO B */}
                <div
                  onClick={() => setSupplierTier('B')}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    supplierTier === 'B'
                      ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                      <ShieldAlert className="w-3 h-3 text-blue-600" />
                      Tipo B - Importante
                    </span>
                    {supplierTier === 'B' && (
                      <span className="text-[10px] font-bold text-blue-700 bg-white px-1.5 py-0.5 rounded shadow-2xs">
                        Activo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-800 leading-tight">
                    Soporte Operativo
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                    Dotaciones EPP, telecomunicaciones, GPS, software, lubricantes menores y servicios técnicos.
                  </p>
                </div>

                {/* TIPO C */}
                <div
                  onClick={() => setSupplierTier('C')}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    supplierTier === 'C'
                      ? 'border-slate-700 bg-slate-100 shadow-xs ring-1 ring-slate-700'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 border border-slate-300">
                      <Layers className="w-3 h-3 text-slate-600" />
                      Tipo C - Estándar
                    </span>
                    {supplierTier === 'C' && (
                      <span className="text-[10px] font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded shadow-2xs">
                        Activo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-800 leading-tight">
                    Menor / Ocasional
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                    Papelería general, suministros de cafetería, aseo de oficinas y compras puntuales no críticas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Datos de Identificación y Razón Social */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Identificación Legal del Proveedor</span>
            </h4>

            {supplierType === 'JURIDICA' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Razón Social / Nombre Comercial <span className="text-blue-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Ej. Comercializadora de Boyacá S.A.S."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    NIT con Dígito de Verificación <span className="text-blue-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    name="nit"
                    value={formData.nit}
                    onChange={handleInputChange}
                    placeholder="Ej. 901234567-8"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-600 outline-hidden"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nombre del Representante Legal <span className="text-blue-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    name="representativeLegalName"
                    value={formData.representativeLegalName}
                    onChange={handleInputChange}
                    placeholder="Ej. Carlos Alberto Morales Rodríguez"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 outline-hidden"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo</label>
                    <select
                      name="representativeLegalDocType"
                      value={formData.representativeLegalDocType}
                      onChange={handleInputChange}
                      className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="CC">CC</option>
                      <option value="CE">CE</option>
                      <option value="PASAPORTE">Pasaporte</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Doc. Rep. Legal</label>
                    <input
                      type="text"
                      name="representativeLegalDocNumber"
                      value={formData.representativeLegalDocNumber}
                      onChange={handleInputChange}
                      placeholder="74.123.456"
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nombre Completo del Postulante <span className="text-blue-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Ej. Ing. Juan Fernando Silva Gómez"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 outline-hidden"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo Doc.</label>
                    <select
                      name="documentType"
                      value={formData.documentType}
                      onChange={handleInputChange}
                      className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="CC">CC</option>
                      <option value="CE">CE</option>
                      <option value="PASAPORTE">Pasaporte</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      No. Documento <span className="text-blue-600 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      name="documentNumber"
                      value={formData.documentNumber}
                      onChange={handleInputChange}
                      placeholder="Ej. 74.281.990"
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Profesión, Oficio o Especialidad Técnica
                  </label>
                  <input
                    type="text"
                    name="professionOrTrade"
                    value={formData.professionOrTrade}
                    onChange={handleInputChange}
                    placeholder="Ej. Técnico en Inyección Diésel y Mantenimiento de Flotas"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Contacto y Ubicación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Correo Electrónico Notificaciones <span className="text-blue-600 font-bold">*</span>
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="proveedor@empresa.com"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Teléfono / Celular de Contacto
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="310 000 0000"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Ciudad / Municipio Sede
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Sogamoso, Boyacá"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Dirección Comercial / Taller
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Calle 11 # 20-30"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Section 4: Estado Inicial de Homologación & Compliance */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                <span>Asignación de Estado y Debida Diligencia (SARLAFT/OFAC)</span>
              </h4>

              <label className="flex items-center gap-2 text-xs font-semibold text-blue-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEmailVerified}
                  onChange={(e) => setIsEmailVerified(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>Marcar correo como verificado</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Estado Inicial Asignado
                </label>
                <div className="w-full px-3 py-2 bg-blue-100/60 border border-blue-300 rounded-lg text-xs font-bold text-blue-950 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                    <span>DOCUMENTACIÓN PENDIENTE</span>
                  </div>
                  <span className="text-[9px] bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded font-bold">
                    Automático
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Registro inicial para posterior cargue de documentos por el proveedor o revisor.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Validación SARLAFT / Listas
                </label>
                <select
                  value={compliance.sarlaftResult}
                  onChange={(e) =>
                    setCompliance((p) => ({ ...p, sarlaftResult: e.target.value as any }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value="SIN_COINCIDENCIAS">Sin Coincidencias (Limpio)</option>
                  <option value="REQUIERE_VERIFICACION">Requiere Verificación Adicional</option>
                  <option value="PENDIENTE">Pendiente de Consulta</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Lista OFAC / Clinton
                </label>
                <select
                  value={compliance.ofacResult}
                  onChange={(e) =>
                    setCompliance((p) => ({ ...p, ofacResult: e.target.value as any }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value="LIMPIO">Limpio (Sin registros)</option>
                  <option value="ALERTA">Alerta / Coincidencia</option>
                  <option value="PENDIENTE">Pendiente</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Antecedentes Procuraduría / Policía
                </label>
                <select
                  value={compliance.procuraduriaResult}
                  onChange={(e) =>
                    setCompliance((p) => ({ ...p, procuraduriaResult: e.target.value as any }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value="VIGENTE_SIN_ANTECEDENTES">Vigente Sin Antecedentes</option>
                  <option value="CON_ANTECEDENTES">Con Antecedentes</option>
                  <option value="PENDIENTE">Pendiente</option>
                </select>
              </div>
            </div>

            {/* Internal Audit Notes */}
            <div>
              <label className="block text-[11px] font-bold text-slate-800 mb-1">
                Justificación de la Inscripción / Observaciones de Auditoría Interna
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                placeholder="Indique motivo de alta directa, número de contrato, histórico de servicio o acuerdo comercial..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-600 outline-hidden"
              />
            </div>
          </div>

          {/* Institutional Formats Note */}
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-blue-950 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <strong>Formatos Institucionales Automáticos:</strong> Al crear este proveedor, el sistema vinculará automáticamente el formulario oficial <strong>FS.GA-FOR-009 (v14.0)</strong> y la autorización Habeas Data <strong>FS.GA-FOR-039 (v1.0)</strong> con su respectivo número de radicación institucional.
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#0b1329] hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4 text-cyan-300" />
              <span>{isSubmitting ? 'Registrando en Banco...' : 'Registrar y Habilitar en Banco'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
