import React, { useState, useRef, useEffect } from 'react';
import {
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
  ArrowLeft,
  Search,
  Save,
  FileSpreadsheet,
  Users,
  Lock,
  Calendar,
  Check,
  Award,
  Flame,
  ShieldAlert,
  UserCheck,
  Wrench,
  Fuel,
  HardHat,
  Laptop,
  Truck,
  Info,
  BadgeCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { SupplierType, SupplierTier, ProcessStatus, AdminCreateSupplierInput } from '../types';
import { FlotaSugamuxiLogo } from './FlotaSugamuxiLogo';
import { PageHeader, heroPrimaryBtn, heroSecondaryBtn } from './ui/archive';

const getCategoryIcon = (categoryName: string) => {
  const lower = categoryName.toLowerCase();
  if (lower.includes('automotriz') || lower.includes('repuesto')) return Wrench;
  if (lower.includes('combustible') || lower.includes('lubricante')) return Fuel;
  if (lower.includes('dotaci') || lower.includes('epp') || lower.includes('seguridad')) return HardHat;
  if (lower.includes('profesional') || lower.includes('consultor') || lower.includes('asesor')) return FileText;
  if (lower.includes('oficina') || lower.includes('tecnolog') || lower.includes('infraestructura')) return Laptop;
  if (lower.includes('transporte') || lower.includes('logístic') || lower.includes('grúa')) return Truck;
  return Briefcase;
};

export const AdminRegisterSupplierView: React.FC = () => {
  const {
    role,
    categoriesConfig,
    systemParameters,
    createSupplierAdmin,
    setActiveView,
    setCurrentDossierId,
    showToast,
    systemUsers,
    activeUserId,
    activeUser,
    accountRole,
  } = useApp();

  // Solo el superadministrador asigna evaluador; los demás roles quedan como responsables de lo que crean
  const isSuper = accountRole === 'SUPERADMIN';
  const [realUsers, setRealUsers] = useState<
    Array<{ id: string; name: string; email: string; roleLabel: string; isRevisor: boolean }>
  >([]);


  const [currentStep, setCurrentStep] = useState<number>(1);
  const [supplierType, setSupplierType] = useState<SupplierType>('JURIDICA');
  const [supplierTier, setSupplierTier] = useState<SupplierTier>('A');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categoriesConfig[0]?.category || 'Mantenimiento Automotriz y Repuestos'
  );
  const [assignedReviewerId, setAssignedReviewerId] = useState<string>(
    role === 'REVISOR' ? activeUserId : 'revisor-1'
  );

  // Evaluadores reales: los usuarios registrados en la base de datos
  useEffect(() => {
    if (!isSuper || !supabase) return;
    let cancelled = false;
    (async () => {
      const { data: sess } = await supabase!.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) return;
      try {
        const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const json = await res.json();
        const list = (json.users || []).map((u: { id: string; name: string; email: string; role: string }) => ({
          id: u.id,
          name: u.name || u.email,
          email: u.email,
          isRevisor: u.role === 'USUARIO' || u.role === 'REVISOR',
          roleLabel:
            u.role === 'SUPERADMIN' || u.role === 'ADMIN'
              ? 'Superadministrador'
              : u.role === 'ADMINISTRADOR'
              ? 'Administrador'
              : 'Usuario',
        }));
        if (cancelled || list.length === 0) return;
        setRealUsers(list);
        const me = sess.session?.user?.id;
        setAssignedReviewerId((cur) => (list.some((x: { id: string }) => x.id === cur) ? cur : list.find((x: { id: string }) => x.id === me)?.id || list[0].id));
      } catch {
        /* sin conexión: se conserva la asignación por defecto */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSuper]);

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
      nit: '900892410-4',
      representativeLegalName: 'Hernando Rojas Villamil',
      representativeLegalDocType: 'CC',
      representativeLegalDocNumber: '74.312.809',
      notes: 'Proveedor estratégico regional con convenio directo de suministro de combustible para terminal de Sogamoso y Duitama.',
    });
    showToast('Datos de demostración para Persona Jurídica cargados.', 'info', 'DEMO JURÍDICA');
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
    showToast('Datos de demostración para Persona Natural cargados.', 'info', 'DEMO NATURAL');
  };

  const isInitialMount = useRef(true);

  const scrollToTop = (smooth = true) => {
    window.scrollTo({ top: 0, left: 0, behavior: smooth ? 'smooth' : 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };

  useEffect(() => {
    // Force scroll to top on mount when entering the Registrar Proveedor module
    scrollToTop(false);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // When changing steps, smoothly scroll to top
    scrollToTop(true);
  }, [currentStep]);

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!selectedCategory) {
        setErrorMessage('Seleccione una categoría de suministro o servicio.');
        scrollToTop(true);
        return false;
      }
    }
    if (step === 2) {
      if (supplierType === 'JURIDICA') {
        if (!formData.companyName.trim()) {
          const msg = 'Ingrese la Razón Social de la empresa.';
          setErrorMessage(msg);
          showToast(msg, 'error', 'Campo Requerido');
          scrollToTop(true);
          return false;
        }
        if (!formData.nit.trim()) {
          const msg = 'Ingrese el NIT de la empresa.';
          setErrorMessage(msg);
          showToast(msg, 'error', 'Campo Requerido');
          scrollToTop(true);
          return false;
        }
        if (!formData.representativeLegalName.trim()) {
          const msg = 'Ingrese el nombre del Representante Legal.';
          setErrorMessage(msg);
          showToast(msg, 'error', 'Campo Requerido');
          scrollToTop(true);
          return false;
        }
      } else {
        if (!formData.fullName.trim()) {
          const msg = 'Ingrese el Nombre Completo de la persona natural.';
          setErrorMessage(msg);
          showToast(msg, 'error', 'Campo Requerido');
          scrollToTop(true);
          return false;
        }
        if (!formData.documentNumber.trim()) {
          const msg = 'Ingrese el Número de Documento de Identidad.';
          setErrorMessage(msg);
          showToast(msg, 'error', 'Campo Requerido');
          scrollToTop(true);
          return false;
        }
      }
    }
    if (step === 3) {
      if (!formData.email.trim() || !formData.email.includes('@')) {
        const msg = 'Ingrese un correo electrónico corporativo válido.';
        setErrorMessage(msg);
        showToast(msg, 'error', 'Campo Requerido');
        scrollToTop(true);
        return false;
      }
      if (!formData.phone.trim()) {
        const msg = 'Ingrese al menos un número telefónico de contacto.';
        setErrorMessage(msg);
        showToast(msg, 'error', 'Campo Requerido');
        scrollToTop(true);
        return false;
      }
      if (!formData.city.trim()) {
        const msg = 'Ingrese la ciudad o municipio principal.';
        setErrorMessage(msg);
        showToast(msg, 'error', 'Campo Requerido');
        scrollToTop(true);
        return false;
      }
    }
    setErrorMessage('');
    return true;
  };

  const handleNextStep = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (validateStep(currentStep)) {
      setErrorMessage('');
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Strict guard: Never submit or redirect unless user has completed Step 4
    if (currentStep < 4) {
      handleNextStep(e);
      return;
    }

    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      scrollToTop(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: AdminCreateSupplierInput = {
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
        createdByName: role === 'ADMIN' ? 'Administrador General' : activeUser.name || 'Revisor Técnico Evaluador',
        assignedReviewerId: isSuper ? assignedReviewerId : activeUserId,
        assignedReviewerName: isSuper
          ? realUsers.find((u) => u.id === assignedReviewerId)?.name ||
            systemUsers.find((u) => u.id === assignedReviewerId)?.name ||
            activeUser.name
          : activeUser.name,
        complianceChecks: {
          sarlaftResult: compliance.sarlaftResult,
          ofacResult: compliance.ofacResult,
          procuraduriaResult: compliance.procuraduriaResult,
          legalConcept: compliance.legalConcept,
          financialConcept: compliance.financialConcept,
          hseqConcept: compliance.hseqConcept,
        },
      };

      const newDossier = createSupplierAdmin(payload);

      if (newDossier && newDossier.id) {
        setCurrentDossierId(newDossier.id);
        setActiveView('bancoProveedores');
      }
    } catch (err: any) {
      const msg = err?.message || 'Ocurrió un error al crear el proveedor.';
      setErrorMessage(msg);
      showToast(msg, 'error', 'Error al Crear Proveedor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, label: 'Clasificación & Modalidad', icon: Layers },
    { id: 2, label: 'Identificación & Razón Social', icon: Building2 },
    { id: 3, label: 'Contacto & Ubicación', icon: MapPin },
    { id: 4, label: 'Cumplimiento & Alta Inicial', icon: ShieldCheck },
  ];

  return (
    <div className="reg-new w-full max-w-[1520px] mx-auto px-4 sm:px-6 pb-8 pt-1 space-y-5">
      <PageHeader
        icon={ShieldCheck}
        title="Registrar proveedor"
        subtitle="Alta oficial, creación del expediente y asignación de radicado"
      />
      {/* 1. Header Banner Estandarizado Claro */}
      <div className="fs-card rounded-[24px] p-4 sm:p-5 animate-fade-up">

        {/* Steps Progress Bar - Compact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id < currentStep || validateStep(currentStep)) {
                    setCurrentStep(step.id);
                  }
                }}
                className={`group p-3 rounded-2xl border text-left transition-all duration-300 flex items-center gap-3 cursor-pointer ${
                  isCurrent
                    ? 'bg-gradient-action text-white border-transparent shadow-glow'
                    : isCompleted
                    ? 'bg-[#2c84c4]/10 border-[#2c84c4]/40 text-[#0b1d3a] dark:text-white hover:bg-[#2c84c4]/15'
                    : 'bg-white/50 border-black/10 text-[#3a5274] hover:border-[#2c84c4]/50 dark:bg-white/5 dark:border-white/10 dark:text-slate-300'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-semibold text-sm shrink-0 transition-colors ${
                    isCurrent
                      ? 'bg-white/20 text-white ring-1 ring-white/40'
                      : isCompleted
                      ? 'bg-gradient-action text-white shadow-glow'
                      : 'bg-[#e3eaf3] text-[#3a5274] dark:bg-white/10 dark:text-slate-300'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.id}
                </div>
                <div className="min-w-0">
                  <div className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${isCurrent ? 'text-white/75' : 'text-[#2c84c4] dark:text-[#69bdd7]'}`}>
                    Paso {step.id} {isCompleted ? '• Listo' : ''}
                  </div>
                  <div className={`text-xs font-bold truncate ${isCurrent ? 'text-white' : 'text-[#0b1d3a] dark:text-white'}`}>
                    {step.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl glass-dark text-white text-sm font-semibold flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-[#69bdd7] shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form Body */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (currentStep === 4) {
            handleSubmit(e);
          } else {
            handleNextStep(e);
          }
        }}
        className="space-y-6"
      >
        <div className="fs-card rounded-[24px] overflow-hidden p-6 sm:p-8 animate-fade-up">
          
          {/* STEP 1: Tipo de Proveedor y Categoría */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header Step 1 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#2c84c4] dark:text-[#69bdd7]" />
                    Paso 1: Modalidad, Criticidad SIG y Asignación Operativa
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Defina la naturaleza jurídica, el nivel de criticidad según el Sistema Integrado de Gestión y el evaluador a cargo.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Configuración:
                  </span>
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-md border bg-white/70 text-[#0b1d3a] border-black/10 dark:bg-white/10 dark:text-white dark:border-white/15">
                    {supplierType === 'JURIDICA' ? 'Persona Jurídica' : 'Persona Natural'}
                  </span>
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-md border ${
                    supplierTier === 'A'
                      ? 'bg-gradient-action text-white border-transparent'
                      : supplierTier === 'B'
                      ? 'bg-[#2c84c4]/15 text-[#1d5fa8] border-[#2c84c4]/30 dark:text-[#69bdd7]'
                      : 'bg-black/5 text-[#3a5274] border-black/10 dark:bg-white/10 dark:text-slate-300'
                  }`}>
                    Tipo {supplierTier} &bull; {supplierTier === 'A' ? 'Crítico' : supplierTier === 'B' ? 'Importante' : 'Estándar'}
                  </span>
                </div>
              </div>

              {/* BLOQUE 1: Naturaleza Jurídica y Criticidad SIG */}
              <div className="bg-[#2c84c4]/[0.04] dark:bg-white/[0.03] rounded-2xl p-5 border border-black/[0.07] dark:border-white/10 space-y-5">
                {/* 1.1 Persona Jurídica vs Natural Selection */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#2c84c4] dark:text-[#69bdd7]" />
                    <span>1. Naturaleza Jurídica del Tercero *</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div
                      onClick={() => setSupplierType('JURIDICA')}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 ${
                        supplierType === 'JURIDICA'
                          ? 'border-[#2c84c4] bg-[#2c84c4]/10 shadow-glow ring-1 ring-[#2c84c4]/30'
                          : 'border-black/10 dark:border-white/10 hover:border-[#2c84c4]/50 hover:-translate-y-0.5 bg-white/60 dark:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              supplierType === 'JURIDICA'
                                ? 'bg-gradient-action text-white shadow-glow'
                                : 'bg-[#e3eaf3] dark:bg-white/10 text-[#3a5274] dark:text-slate-300'
                            }`}
                          >
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                              Persona Jurídica
                            </h4>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                              Empresas, Sociedades S.A.S., Ltda., Consorcios con NIT
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {supplierType === 'JURIDICA' ? (
                            <div className="w-5 h-5 rounded-full bg-gradient-action text-white flex items-center justify-center shadow-glow">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-[#c3d2e4] dark:border-white/25" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={() => setSupplierType('NATURAL')}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 ${
                        supplierType === 'NATURAL'
                          ? 'border-[#2c84c4] bg-[#2c84c4]/10 shadow-glow ring-1 ring-[#2c84c4]/30'
                          : 'border-black/10 dark:border-white/10 hover:border-[#2c84c4]/50 hover:-translate-y-0.5 bg-white/60 dark:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              supplierType === 'NATURAL'
                                ? 'bg-gradient-action text-white shadow-glow'
                                : 'bg-[#e3eaf3] dark:bg-white/10 text-[#3a5274] dark:text-slate-300'
                            }`}
                          >
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                              Persona Natural
                            </h4>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                              Independientes, Profesionales y Asesores con RUT
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {supplierType === 'NATURAL' ? (
                            <div className="w-5 h-5 rounded-full bg-gradient-action text-white flex items-center justify-center shadow-glow">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-[#c3d2e4] dark:border-white/25" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1.2 Tipo de Proveedor (A, B y C) - Nivel de Criticidad SIG */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#2c84c4] dark:text-[#69bdd7]" />
                      <span>2. Clasificación de Criticidad SIG (Flota Sugamuxi) *</span>
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Define los requisitos documentales, homologación y rigor del proceso
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* TIPO A - Crítico (Corporate Deep Navy Blue) */}
                    <div
                      onClick={() => setSupplierTier('A')}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                        supplierTier === 'A'
                          ? 'border-[#2c84c4] bg-[#2c84c4]/10 shadow-glow ring-1 ring-[#2c84c4]/30'
                          : 'border-black/10 dark:border-white/10 hover:border-[#2c84c4]/50 hover:-translate-y-0.5 bg-white/60 dark:bg-white/[0.03]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-md bg-gradient-action text-white shadow-glow">
                            <Award className="w-3.5 h-3.5 text-cyan-400" />
                            Tipo A - Crítico
                          </span>
                          <div className="shrink-0">
                            {supplierTier === 'A' ? (
                              <div className="w-5 h-5 rounded-full bg-gradient-action text-white flex items-center justify-center shadow-glow">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-[#c3d2e4] dark:border-white/25" />
                            )}
                          </div>
                        </div>
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                          Estratégico / Alto Impacto
                        </h5>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          Combustibles, llantas, mantenimiento mayor de chasises/motores y pólizas de seguros RCE/RCC.
                        </p>
                      </div>
                      <span className="inline-block text-[10px] font-bold text-[#1d5fa8] dark:text-[#69bdd7] bg-[#2c84c4]/12 px-2 py-0.5 rounded-md mt-3 self-start border border-[#2c84c4]/25">
                        Control documental riguroso
                      </span>
                    </div>

                    {/* TIPO B - Importante (Corporate Blue) */}
                    <div
                      onClick={() => setSupplierTier('B')}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                        supplierTier === 'B'
                          ? 'border-[#2c84c4] bg-[#2c84c4]/10 shadow-glow ring-1 ring-[#2c84c4]/30'
                          : 'border-black/10 dark:border-white/10 hover:border-[#2c84c4]/50 hover:-translate-y-0.5 bg-white/60 dark:bg-white/[0.03]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-md bg-[#2c84c4] text-white shadow-glow">
                            <ShieldCheck className="w-3.5 h-3.5 text-white" />
                            Tipo B - Importante
                          </span>
                          <div className="shrink-0">
                            {supplierTier === 'B' ? (
                              <div className="w-5 h-5 rounded-full bg-gradient-action text-white flex items-center justify-center shadow-glow">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-[#c3d2e4] dark:border-white/25" />
                            )}
                          </div>
                        </div>
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                          Soporte Operativo
                        </h5>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          Dotaciones EPP, monitoreo GPS satelital, telecomunicaciones y software de despacho de flota.
                        </p>
                      </div>
                      <span className="inline-block text-[10px] font-bold text-[#1d5fa8] dark:text-[#69bdd7] bg-[#2c84c4]/12 px-2 py-0.5 rounded-md mt-3 self-start border border-[#2c84c4]/25">
                        Homologación periódica
                      </span>
                    </div>

                    {/* TIPO C - Estándar (Slate) */}
                    <div
                      onClick={() => setSupplierTier('C')}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                        supplierTier === 'C'
                          ? 'border-[#2c84c4] bg-[#2c84c4]/10 shadow-glow ring-1 ring-[#2c84c4]/30'
                          : 'border-black/10 dark:border-white/10 hover:border-[#2c84c4]/50 hover:-translate-y-0.5 bg-white/60 dark:bg-white/[0.03]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-2">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-md bg-[#131b2e] text-white dark:bg-white/15 shadow-card">
                            <Layers className="w-3.5 h-3.5 text-slate-300" />
                            Tipo C - Estándar
                          </span>
                          <div className="shrink-0">
                            {supplierTier === 'C' ? (
                              <div className="w-5 h-5 rounded-full bg-gradient-action text-white flex items-center justify-center shadow-glow">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-[#c3d2e4] dark:border-white/25" />
                            )}
                          </div>
                        </div>
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                          Menor / Ocasional
                        </h5>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          Papelería institucional, útiles de oficina e insumos sin impacto directo en rodamiento vehicular.
                        </p>
                      </div>
                      <span className="inline-block text-[10px] font-bold text-[#3a5274] dark:text-slate-300 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-md mt-3 self-start border border-black/10 dark:border-white/15">
                        Requisitos simplificados
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOQUE 2: Dos Columnas Simétricas - Categoría Técnica (Izquierda) y Evaluador Asignado (Derecha) */}
              <div className={`grid grid-cols-1 ${isSuper ? 'lg:grid-cols-2' : ''} gap-5 items-stretch`}>
                {/* 2.1 Categoría de Suministro (Panel Izquierdo) */}
                <div className="fs-card rounded-2xl overflow-hidden flex flex-col">
                  {/* Header Categoría */}
                  <div className="bg-[#2c84c4]/[0.06] dark:bg-white/5 px-4 py-3 border-b border-black/[0.07] dark:border-white/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#2c84c4] dark:text-[#69bdd7]" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        3. Categoría de Suministro / Servicio *
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold text-[#1d5fa8] dark:text-[#69bdd7] bg-[#2c84c4]/12 px-2.5 py-0.5 rounded-md border border-[#2c84c4]/25">
                      {categoriesConfig.length} Categorías
                    </span>
                  </div>

                  {/* Lista desplegable de categorías */}
                  <div className="p-3.5 space-y-2 flex-1">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-white/5 border border-black/15 dark:border-white/15 text-sm font-semibold text-[#0b1d3a] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2c84c4]/40"
                    >
                      {categoriesConfig.map((cat) => (
                        <option key={cat.id} value={cat.category}>
                          {cat.category}{cat.economicCode ? ` (${cat.economicCode})` : ''}
                        </option>
                      ))}
                    </select>
                    {categoriesConfig.find((c) => c.category === selectedCategory)?.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {categoriesConfig.find((c) => c.category === selectedCategory)?.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2.2 Evaluador Asignado (Panel Derecho) — solo superadministrador */}
                {isSuper && (
                <div className="fs-card rounded-2xl overflow-hidden flex flex-col justify-between">
                  <div>
                    {/* Header Evaluador */}
                    <div className="bg-[#2c84c4]/[0.06] dark:bg-white/5 px-4 py-3 border-b border-black/[0.07] dark:border-white/10 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-[#2c84c4] dark:text-[#69bdd7]" />
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          4. Evaluador Asignado *
                        </h4>
                      </div>
                      {role === 'REVISOR' ? (
                        <span className="text-[11px] font-bold text-[#1d5fa8] dark:text-[#69bdd7] bg-[#2c84c4]/12 px-2.5 py-0.5 rounded-md border border-[#2c84c4]/25">
                          Revisor Activo ({activeUser.shortName})
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                          Custodia del Expediente
                        </span>
                      )}
                    </div>

                    {/* Listado de Evaluadores */}
                    <div className="p-3.5 space-y-2">
                      {realUsers.length === 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 px-1">Cargando usuarios registrados…</p>
                      )}
                      {realUsers.map((user) => {
                        const isSelected = assignedReviewerId === user.id;
                        const isReviewerRole = user.isRevisor;
                        return (
                          <div
                            key={user.id}
                            onClick={() => setAssignedReviewerId(user.id)}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all duration-300 flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'border-blue-600 dark:border-cyan-400 bg-blue-50/70 dark:bg-blue-950/60 shadow-xs ring-1 ring-blue-500/20'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900/40'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                                  isSelected
                                    ? 'bg-gradient-action text-white shadow-glow'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {user.name.charAt(user.name.indexOf(' ') + 1) || 'U'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                    {user.name}
                                  </h5>
                                  <span
                                    className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded shrink-0 ${
                                      isReviewerRole
                                        ? 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-cyan-300 border border-blue-200 dark:border-blue-800'
                                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                    }`}
                                  >
                                    {user.roleLabel}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                                  {user.email}
                                </span>
                              </div>
                            </div>

                            <div className="shrink-0 pl-1">
                              {isSelected ? (
                                <div className="w-5 h-5 rounded-full bg-gradient-action text-white flex items-center justify-center shadow-glow">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-[#c3d2e4] dark:border-white/25" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cuadro Institucional de Custodia y SLA para equilibrar visualmente la altura */}
                  <div className="p-3.5 mx-3.5 mb-3.5 rounded-xl border border-blue-100 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30">
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <h6 className="text-xs font-bold text-blue-950 dark:text-cyan-300 flex items-center gap-1.5">
                          Custodia y Responsabilidad Operativa
                        </h6>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                          El evaluador seleccionado asumirá la revisión documental del expediente, el cotejo en listas restrictivas (SARLAFT/OFAC) y la emisión del concepto vinculante para Flota Sugamuxi S.A.
                        </p>
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-100 dark:border-blue-900/50 text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-blue-900 dark:text-cyan-300">
                            Rigor aplicable:
                          </span>
                          <span>
                            {supplierTier === 'A' ? 'Auditoría integral con concepto HSEQ y Legal' : supplierTier === 'B' ? 'Verificación técnica y comercial' : 'Cotejo documental simplificado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Identificación & Razón Social */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#2c84c4] dark:text-[#69bdd7]" />
                  Paso 2: Identificación Tributaria y Legal
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Ingrese los datos jurídicos y la denominación legal conforme al RUT y Certificado de Existencia.
                </p>
              </div>

              {supplierType === 'JURIDICA' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Razón Social o Nombre Comercial *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="Ej. Distribuidora Sugamuxi de Boyacá S.A.S."
                      className="fs-card w-full px-4 py-2.5 rounded-2xl border-slate-300 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Número de Identificación Tributaria (NIT con Dígito) *
                    </label>
                    <input
                      type="text"
                      name="nit"
                      value={formData.nit}
                      onChange={handleInputChange}
                      placeholder="Ej. 900892410-4"
                      className="fs-card w-full px-4 py-2.5 rounded-2xl border-slate-300 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Nombre Completo del Representante Legal *
                    </label>
                    <input
                      type="text"
                      name="representativeLegalName"
                      value={formData.representativeLegalName}
                      onChange={handleInputChange}
                      placeholder="Ej. Hernando Rojas Villamil"
                      className="fs-card w-full px-4 py-2.5 rounded-2xl border-slate-300 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Tipo Doc. Rep.
                      </label>
                      <select
                        name="representativeLegalDocType"
                        value={formData.representativeLegalDocType}
                        onChange={handleInputChange}
                        className="fs-card w-full px-3 py-2.5 rounded-2xl border-slate-300 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
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

                    <div className="col-span-2 space-y-1.5">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Documento Rep. Legal
                      </label>
                      <input
                        type="text"
                        name="representativeLegalDocNumber"
                        value={formData.representativeLegalDocNumber}
                        onChange={handleInputChange}
                        placeholder="Ej. 74.312.809"
                        className="fs-card w-full px-4 py-2.5 rounded-2xl border-slate-300 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Nombre Completo de la Persona Natural *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Ej. Dra. Claudia Patricia Becerra Silva"
                      className="fs-card w-full px-4 py-2.5 rounded-2xl border-slate-300 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Tipo Documento
                      </label>
                      <select
                        name="documentType"
                        value={formData.documentType}
                        onChange={handleInputChange}
                        className="fs-card w-full px-3 py-2.5 rounded-2xl border-slate-300 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
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

                    <div className="col-span-2 space-y-1.5">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Número de Documento *
                      </label>
                      <input
                        type="text"
                        name="documentNumber"
                        value={formData.documentNumber}
                        onChange={handleInputChange}
                        placeholder="Ej. 40.045.678"
                        className="fs-card w-full px-4 py-2.5 rounded-2xl border-slate-300 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Profesión / Oficio / Especialidad
                    </label>
                    <input
                      type="text"
                      name="professionOrTrade"
                      value={formData.professionOrTrade}
                      onChange={handleInputChange}
                      placeholder="Ej. Ingeniero Mecánico / Auditor Vial"
                      className="fs-card w-full px-4 py-2.5 rounded-2xl border-slate-300 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Contacto, Ubicación & CIIU */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#2c84c4] dark:text-[#69bdd7]" />
                  Paso 3: Datos de Contacto, Ubicación y Actividad Económica
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Información para notificaciones formales, órdenes de compra y facturación electrónica.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Correo Electrónico Oficial / Corporativo *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="comercial@proveedor.com"
                      className="fs-card w-full pl-10 pr-4 py-2.5 rounded-2xl border-slate-300 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Teléfonos de Contacto (Fijo / Celular) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(608) 770-1234 / 310 555 6789"
                      className="fs-card w-full pl-10 pr-4 py-2.5 rounded-2xl border-slate-300 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Ciudad / Municipio y Departamento *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      name="city"
                      list="admin-cities-datalist"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Sogamoso, Boyacá"
                      className="fs-card w-full pl-10 pr-4 py-2.5 rounded-2xl border-slate-300 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                    />
                    <datalist id="admin-cities-datalist">
                      {(systemParameters?.cityOptions || [])
                        .filter((c) => c.isActive)
                        .map((c) => (
                          <option key={c.id} value={`${c.name}, ${c.department}`} />
                        ))}
                    </datalist>
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Dirección Comercial / Domicilio Principal
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Carrera 11 # 24-80, Sector Industrial"
                    className="fs-card w-full px-4 py-2.5 rounded-2xl border-slate-300 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Cumplimiento y Alta Inicial */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#2c84c4] dark:text-[#69bdd7]" />
                  Paso 4: Validación de Cumplimiento & Alta de Registro
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Parametrice las validaciones de debida diligencia. El expediente quedará registrado automáticamente con estado inicial para el posterior cargue documental.
                </p>
              </div>

              {/* Pre-check SARLAFT / OFAC */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Verificación SARLAFT
                    </span>
                    <ShieldCheck className="w-4 h-4 text-cyan-500" />
                  </div>
                  <select
                    value={compliance.sarlaftResult}
                    onChange={(e: any) =>
                      setCompliance((prev) => ({ ...prev, sarlaftResult: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="SIN_COINCIDENCIAS">Sin Coincidencias (Limpio)</option>
                    <option value="REQUIERE_VERIFICACION">Requiere Verificación</option>
                    <option value="PENDIENTE">Pendiente por Validar</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Lista OFAC / Clinton
                    </span>
                    <ShieldCheck className="w-4 h-4 text-cyan-500" />
                  </div>
                  <select
                    value={compliance.ofacResult}
                    onChange={(e: any) =>
                      setCompliance((prev) => ({ ...prev, ofacResult: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="LIMPIO">Limpio (Aprobado)</option>
                    <option value="ALERTA">Alerta / Coincidencia</option>
                    <option value="PENDIENTE">Pendiente</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Procuraduría / Policía
                    </span>
                    <ShieldCheck className="w-4 h-4 text-cyan-500" />
                  </div>
                  <select
                    value={compliance.procuraduriaResult}
                    onChange={(e: any) =>
                      setCompliance((prev) => ({ ...prev, procuraduriaResult: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="VIGENTE_SIN_ANTECEDENTES">Vigente Sin Antecedentes</option>
                    <option value="CON_ANTECEDENTES">Con Antecedentes</option>
                    <option value="PENDIENTE">Pendiente</option>
                  </select>
                </div>
              </div>

              {/* Evaluador Asignado y Acceso — solo superadministrador */}
              {isSuper && (
              <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        Avaluador Asignado / Custodia y Acceso al Expediente
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Usuario autorizado para dictaminar este expediente y recibir notificaciones de cargue documental.
                      </p>
                    </div>
                  </div>
                  <div className="sm:w-72">
                    <select
                      value={assignedReviewerId}
                      onChange={(e) => setAssignedReviewerId(e.target.value)}
                      disabled={role === 'REVISOR'}
                      className="fs-card w-full px-3 py-2 border-slate-300 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                    >
                      {realUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.roleLabel})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              )}

              {/* Status and Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Estado Inicial del Expediente
                  </label>
                  <div className="w-full px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                      <span>DOCUMENTACIÓN PENDIENTE (Registro Inicial)</span>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded">
                      Asignado Automático
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Estado inicial fijado automáticamente para proceder inmediatamente con el cargue de documentos por parte del proveedor o revisor técnico.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Verificación de Correo Electrónico
                  </label>
                  <div className="flex items-center gap-3 h-[42px]">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEmailVerified}
                        onChange={(e) => setIsEmailVerified(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span>Marcar correo como verificado institucionalmente</span>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Justificación / Notas de Registro
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Indique los motivos de la inclusión directa o antecedentes del proveedor..."
                    className="fs-card w-full px-4 py-2.5 rounded-2xl border-slate-300 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveView('bancoProveedores')}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>

              {currentStep < 4 ? (
                <button
                  key="admin-reg-btn-next-step"
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-xl bg-[#0b1329] dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <span>Siguiente Paso</span>
                  <Check className="w-4 h-4" />
                </button>
              ) : (
                <button
                  key="admin-reg-btn-submit"
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-950 hover:to-blue-900 text-white text-xs font-extrabold transition-all shadow-lg shadow-blue-950/40 border border-cyan-400/50 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-cyan-400" />
                  <span>{isSubmitting ? 'Registrando...' : 'Registrar y Crear Expediente'}</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </form>

    </div>
  );
};
