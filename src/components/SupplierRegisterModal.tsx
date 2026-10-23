import React, { useState } from 'react';
import {
  X,
  User,
  Building2,
  Lock,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Award,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SupplierType, SupplierTier, SupplierBasicInfo } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRegisteredSuccess: (dossierId: string, verificationCode: string, email?: string) => void;
}

export const SupplierRegisterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onRegisteredSuccess,
}) => {
  const {
    registerSupplier,
    role,
    isSupplierLoggedIn,
    systemParameters,
    systemUsers,
    activeUserId,
    activeUser,
    showToast,
  } = useApp();
  const [supplierType, setSupplierType] = useState<SupplierType>('JURIDICA');
  const [supplierTier, setSupplierTier] = useState<SupplierTier>('B');
  const [assignedReviewerId, setAssignedReviewerId] = useState<string>(
    role === 'REVISOR' ? activeUserId : 'revisor-1'
  );

  // Form fields
  const [formData, setFormData] = useState({
    // Common
    email: '',
    phone: '',
    city: 'Sogamoso, Boyacá',
    password: '',
    confirmPassword: '',

    // Natural
    fullName: '',
    documentType: 'CC' as 'CC' | 'CE' | 'PASAPORTE',
    documentNumber: '',

    // Juridica
    companyName: '',
    nit: '',
    representativeLegalName: '',
    representativeLegalDocType: 'CC' as 'CC' | 'CE' | 'PASAPORTE',
    representativeLegalDocNumber: '',
  });

  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const handleFillDemoNatural = () => {
    setSupplierType('NATURAL');
    setSupplierTier('B');
    setFormData({
      email: 'mario.bocanegra.ingenieria@gmail.com',
      phone: '314 290 8812',
      city: 'Sogamoso, Boyacá',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: 'Mario Bocanegra Silva',
      documentType: 'CC',
      documentNumber: '74.281.990',
      companyName: '',
      nit: '',
      representativeLegalName: '',
      representativeLegalDocType: 'CC',
      representativeLegalDocNumber: '',
    });
  };

  const handleFillDemoJuridica = () => {
    setSupplierType('JURIDICA');
    setSupplierTier('A');
    setFormData({
      email: 'contratos@autoexpresoboyaca.com',
      phone: '(608) 773-9000',
      city: 'Duitama, Boyacá',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      fullName: '',
      documentType: 'CC',
      documentNumber: '',
      companyName: 'Autoexpreso del Oriente S.A.S.',
      nit: '901.345.890-2',
      representativeLegalName: 'Germán Darío Cárdenas Niño',
      representativeLegalDocType: 'CC',
      representativeLegalDocNumber: '74.150.882',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validations
    if (formData.password.length < 6) {
      const msg = 'La contraseña debe tener mínimo 6 caracteres.';
      setErrorMessage(msg);
      showToast(msg, 'error', 'Error en Registro');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      const msg = 'Las contraseñas no coinciden.';
      setErrorMessage(msg);
      showToast(msg, 'error', 'Error en Registro');
      return;
    }

    if (supplierType === 'NATURAL') {
      if (!formData.fullName.trim() || !formData.documentNumber.trim() || !formData.email.trim() || !formData.phone.trim()) {
        const msg = 'Por favor complete todos los campos obligatorios (*).';
        setErrorMessage(msg);
        showToast(msg, 'error', 'Campos Requeridos');
        return;
      }
    } else {
      if (
        !formData.companyName.trim() ||
        !formData.nit.trim() ||
        !formData.representativeLegalName.trim() ||
        !formData.representativeLegalDocNumber.trim() ||
        !formData.email.trim() ||
        !formData.phone.trim()
      ) {
        const msg = 'Por favor complete todos los campos obligatorios (*).';
        setErrorMessage(msg);
        showToast(msg, 'error', 'Campos Requeridos');
        return;
      }
    }

    const payload: SupplierBasicInfo = {
      supplierType,
      supplierTier,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      city: formData.city.trim(),
      ...(supplierType === 'NATURAL'
        ? {
            fullName: formData.fullName.trim(),
            documentType: formData.documentType,
            documentNumber: formData.documentNumber.trim(),
          }
        : {
            companyName: formData.companyName.trim(),
            nit: formData.nit.trim(),
            representativeLegalName: formData.representativeLegalName.trim(),
            representativeLegalDocType: formData.representativeLegalDocType,
            representativeLegalDocNumber: formData.representativeLegalDocNumber.trim(),
          }),
    };

    try {
      const effectiveReviewerId = (role === 'ADMIN' || role === 'REVISOR')
        ? assignedReviewerId
        : (systemUsers.find((u) => u.role === 'REVISOR')?.id || 'revisor-1');
      const assignedUser = systemUsers.find((u) => u.id === effectiveReviewerId);
      const result = registerSupplier(
        payload,
        formData.password,
        effectiveReviewerId,
        assignedUser?.name
      );
      onRegisteredSuccess(result.dossierId, result.verificationCode, formData.email.trim());
    } catch (err: any) {
      const msg = err?.message || 'Ocurrió un error al registrar el proveedor.';
      setErrorMessage(msg);
      showToast(msg, 'error', 'Error de Registro');
    }
  };

  if (!isOpen || (isSupplierLoggedIn && role === 'PROVEEDOR')) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[94vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Compact, Sleek Header */}
        <div className="bg-[#0b1329] text-white px-4 sm:px-5 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-2xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white leading-tight">Inscripción de Proveedor</h2>
                <span className="text-[10px] font-extrabold uppercase bg-blue-500/20 text-cyan-300 border border-blue-500/40 px-1.5 py-0.2 rounded">
                  {role === 'ADMIN' ? 'Admin General' : role === 'REVISOR' ? 'Revisor Técnico' : 'Flota Sugamuxi S.A.'}
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
                onClick={handleFillDemoNatural}
                className="font-bold text-cyan-300 hover:text-white hover:underline cursor-pointer px-1"
                title="Llenar datos de prueba Persona Natural"
              >
                Natural
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={handleFillDemoJuridica}
                className="font-bold text-cyan-300 hover:text-white hover:underline cursor-pointer px-1"
                title="Llenar datos de prueba Persona Jurídica"
              >
                Jurídica
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile-only demo fill row */}
        <div className="sm:hidden px-4 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-slate-600 font-medium">Autocompletar prueba:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleFillDemoNatural}
              className="text-[11px] font-bold text-blue-700 hover:underline"
            >
              Natural
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={handleFillDemoJuridica}
              className="text-[11px] font-bold text-blue-700 hover:underline"
            >
              Jurídica
            </button>
          </div>
        </div>

        {/* Form Body - Maximized Priority to Inputs */}
        <form
          id="supplier-register-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-slate-700"
        >
          {/* Supplier Type Segmented Control */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                Tipo de Persona / Régimen <span className="text-blue-600 font-bold">*</span>
              </label>
              <span className="text-[11px] text-slate-500 font-normal">
                {supplierType === 'JURIDICA' ? 'Sociedades comerciales, SAS, Ltda.' : 'Comerciantes, profesionales independientes'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/90 gap-1">
              <button
                type="button"
                onClick={() => setSupplierType('NATURAL')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  supplierType === 'NATURAL'
                    ? 'bg-white text-blue-950 shadow-xs border border-slate-300/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <User className={`w-4 h-4 ${supplierType === 'NATURAL' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Persona Natural</span>
              </button>

              <button
                type="button"
                onClick={() => setSupplierType('JURIDICA')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  supplierType === 'JURIDICA'
                    ? 'bg-white text-blue-950 shadow-xs border border-slate-300/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Building2 className={`w-4 h-4 ${supplierType === 'JURIDICA' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Persona Jurídica (Empresa)</span>
              </button>
            </div>
          </div>

          {/* Tipo de Proveedor (A, B y C) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                <span>Tipo de Proveedor (A, B y C)</span>
                <span className="text-blue-600 font-bold">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {supplierTier === 'A'
                  ? 'A: Crítico / Estratégico'
                  : supplierTier === 'B'
                  ? 'B: Importante / Operativo'
                  : 'C: Estándar / Ocasional'}
              </span>
            </div>

            <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl border border-slate-200/90 gap-1 text-xs">
              <button
                type="button"
                onClick={() => setSupplierTier('A')}
                className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  supplierTier === 'A'
                    ? 'bg-slate-900 text-white border border-slate-700 shadow-xs ring-1 ring-slate-400'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>Tipo A (Crítico)</span>
              </button>

              <button
                type="button"
                onClick={() => setSupplierTier('B')}
                className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  supplierTier === 'B'
                    ? 'bg-blue-50 text-blue-900 border border-blue-300 shadow-xs ring-1 ring-blue-300'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Tipo B (Operativo)</span>
              </button>

              <button
                type="button"
                onClick={() => setSupplierTier('C')}
                className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  supplierTier === 'C'
                    ? 'bg-slate-200 text-slate-900 border border-slate-400 shadow-xs ring-1 ring-slate-400'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                <span>Tipo C (Estándar)</span>
              </button>
            </div>
          </div>

          {/* Conditional Fields based on SupplierType */}
          {supplierType === 'NATURAL' ? (
            <div className="space-y-3 pt-0.5">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Nombre Completo del Proveedor / Contratista <span className="text-blue-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Ej. Juan Carlos Pérez Gómez"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 shadow-2xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">Tipo Doc.</label>
                  <select
                    name="documentType"
                    value={formData.documentType}
                    onChange={handleChange}
                    className="w-full px-2.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 shadow-2xs"
                  >
                    {(systemParameters?.documentTypes || [])
                      .filter((d) => d.isActive)
                      .map((doc) => (
                        <option key={doc.code} value={doc.code}>
                          {doc.name} ({doc.code})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Número de Documento <span className="text-blue-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    name="documentNumber"
                    value={formData.documentNumber}
                    onChange={handleChange}
                    placeholder="Ej. 74.198.445"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 shadow-2xs font-mono"
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-0.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Razón Social de la Empresa <span className="text-blue-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Ej. Inversiones y Repuestos Boyacá S.A.S."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 shadow-2xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    NIT (con DV) <span className="text-blue-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    name="nit"
                    value={formData.nit}
                    onChange={handleChange}
                    placeholder="900458712-4"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 font-mono shadow-2xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Representante Legal <span className="text-blue-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    name="representativeLegalName"
                    value={formData.representativeLegalName}
                    onChange={handleChange}
                    placeholder="Ej. Carlos Eduardo Benítez Morales"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 shadow-2xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Cédula / Doc. Rep. <span className="text-blue-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    name="representativeLegalDocNumber"
                    value={formData.representativeLegalDocNumber}
                    onChange={handleChange}
                    placeholder="Ej. 74.321.908"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 font-mono shadow-2xs"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="pt-2 border-t border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  Correo Corporativo / Notificaciones <span className="text-blue-600 font-bold">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contacto@empresa.com"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  Teléfono / Celular Principal <span className="text-blue-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Ej. 312 458 9012"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 shadow-2xs"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Ciudad / Municipio Sede Principal <span className="text-blue-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  list="supplier-register-cities"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Ej. Sogamoso / Tunja / Duitama / Bogotá D.C."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 shadow-2xs"
                  required
                />
                <datalist id="supplier-register-cities">
                  {(systemParameters?.cityOptions || [])
                    .filter((c) => c.isActive)
                    .map((c) => (
                      <option key={c.id} value={`${c.name}, ${c.department}`} />
                    ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Evaluador Asignado / Usuario con Acceso: Solo para Revisor Técnico o Administrador General */}
          <div className="pt-2 border-t border-slate-200">
            {role === 'ADMIN' || role === 'REVISOR' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Evaluador Asignado / Usuario con Acceso</span>
                    <span className="text-blue-600 font-bold">*</span>
                  </span>
                  <span className="text-[10px] text-blue-600 font-medium">Revisión Técnica y Custodia</span>
                </label>
                <select
                  value={assignedReviewerId}
                  onChange={(e) => setAssignedReviewerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 shadow-2xs"
                >
                  {systemUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.role === 'REVISOR' ? 'Evaluador Técnico' : 'Administrador General'} ({u.roleDescription || u.role})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Usuario técnico que recibirá la solicitud para auditar documentos, verificar listas restrictivas y dictaminar la habilitación.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">
                      Asignación y Custodia del Expediente
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      El Revisor Técnico o Evaluador es asignado exclusivamente por el Administrador General o la Dirección del SIG de Flota Sugamuxi S.A., garantizando la imparcialidad del proceso.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Password Fields */}
          <div className="pt-2 border-t border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Crear Contraseña de Acceso <span className="text-blue-600 font-bold">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Confirmar Contraseña <span className="text-blue-600 font-bold">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repita la contraseña"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 shadow-2xs"
                  required
                />
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </form>

        {/* Compact Fixed Footer */}
        <div className="shrink-0 px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="supplier-register-form"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Crear Cuenta de Proveedor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

