import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SupplierType, ProcessStatus } from '../types';
import { FlotaSugamuxiLogo, FlotaSugamuxiEmblem } from './FlotaSugamuxiLogo';
import {
  Building2,
  User,
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  FileText,
  Edit3,
  Briefcase,
  LogIn,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  HelpCircle,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Info,
  Layers,
  FileSpreadsheet,
  Check,
  Phone,
  MapPin,
  Bus,
  UserCheck,
} from 'lucide-react';

interface Props {
  onLoginSuccess?: () => void;
}

export const SupplierLoginPortal: React.FC<Props> = ({ onLoginSuccess }) => {
  const {
    dossiers,
    supplierLogin,
    registerSupplier,
    setRole,
    setActiveView,
    categoriesConfig,
    supplierPortalTab,
    setSupplierPortalTab,
    role,
    systemUsers,
    activeUserId,
    isSupplierLoggedIn,
    currentDossier,
  } = useApp();

  // Active tab in auth card: 'login' | 'register'
  const authMode: 'login' | 'register' = supplierPortalTab === 'register' ? 'register' : 'login';
  const setAuthMode = (mode: 'login' | 'register') => {
    setSupplierPortalTab(mode);
  };

  // Login form state
  const [identifierInput, setIdentifierInput] = useState('');
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form state
  const [regSupplierType, setRegSupplierType] = useState<SupplierType>('JURIDICA');
  const [regData, setRegData] = useState({
    companyName: '',
    nit: '',
    fullName: '',
    documentType: 'CC' as 'CC' | 'CE' | 'PASAPORTE',
    documentNumber: '',
    representativeLegalName: '',
    representativeLegalDocNumber: '',
    email: '',
    phone: '',
    city: 'Sogamoso, Boyacá',
    selectedCategory: categoriesConfig[0]?.category || 'Mantenimiento Automotriz y Repuestos',
  });
  const [assignedReviewerId, setAssignedReviewerId] = useState<string>(
    role === 'REVISOR' ? activeUserId : 'revisor-1'
  );
  const [regError, setRegError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Handle standard submit login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!identifierInput.trim()) {
      setLoginError('Por favor ingrese su NIT, Cédula, Correo Electrónico o Número de Radicado.');
      return;
    }

    setIsLoggingIn(true);
    setTimeout(() => {
      const result = supplierLogin(identifierInput, accessCodeInput);
      setIsLoggingIn(false);
      if (result.success) {
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setLoginError(result.message);
      }
    }, 300);
  };

  // Quick 1-click test login
  const handleQuickDemoLogin = (dossierIdentifier: string) => {
    setLoginError('');
    setIsLoggingIn(true);
    setTimeout(() => {
      const result = supplierLogin(dossierIdentifier);
      setIsLoggingIn(false);
      if (result.success && onLoginSuccess) {
        onLoginSuccess();
      }
    }, 200);
  };

  // Handle register submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (regSupplierType === 'JURIDICA') {
      if (!regData.companyName.trim() || !regData.nit.trim()) {
        setRegError('La Razón Social y el NIT son obligatorios para Personas Jurídicas.');
        return;
      }
      if (!regData.email.trim() || !regData.phone.trim()) {
        setRegError('El correo electrónico y el teléfono de contacto son obligatorios.');
        return;
      }
    } else {
      if (!regData.fullName.trim() || !regData.documentNumber.trim()) {
        setRegError('Los Nombres Completos y el Número de Cédula son obligatorios.');
        return;
      }
      if (!regData.email.trim() || !regData.phone.trim()) {
        setRegError('El correo electrónico y el teléfono de contacto son obligatorios.');
        return;
      }
    }

    setIsRegistering(true);

    setTimeout(() => {
      const basicInfoPayload = {
        supplierType: regSupplierType,
        email: regData.email.trim(),
        phone: regData.phone.trim(),
        city: regData.city.trim(),
        fullName: regSupplierType === 'NATURAL' ? regData.fullName.trim() : undefined,
        documentType: regSupplierType === 'NATURAL' ? regData.documentType : undefined,
        documentNumber: regSupplierType === 'NATURAL' ? regData.documentNumber.trim() : undefined,
        companyName: regSupplierType === 'JURIDICA' ? regData.companyName.trim() : undefined,
        nit: regSupplierType === 'JURIDICA' ? regData.nit.trim() : undefined,
        representativeLegalName: regSupplierType === 'JURIDICA' ? regData.representativeLegalName.trim() : undefined,
        representativeLegalDocType: 'CC' as const,
        representativeLegalDocNumber: regSupplierType === 'JURIDICA' ? regData.representativeLegalDocNumber.trim() : undefined,
      };

      const effectiveReviewerId = (role === 'ADMIN' || role === 'REVISOR')
        ? assignedReviewerId
        : (systemUsers.find((u) => u.role === 'REVISOR')?.id || 'revisor-1');

      const reviewer = systemUsers.find((u) => u.id === effectiveReviewerId);
      const regResult = registerSupplier(
        basicInfoPayload,
        undefined,
        effectiveReviewerId,
        reviewer?.name
      );
      setIsRegistering(false);

      if (regResult && regResult.dossierId) {
        supplierLogin(regResult.fileNumber);
        if (onLoginSuccess) onLoginSuccess();
      }
    }, 400);
  };

  const getStatusBadge = (status: ProcessStatus) => {
    switch (status) {
      case 'APROBADO':
      case 'PROVEEDOR_HABILITADO':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-blue-600" /> Habilitado / Aprobado
          </span>
        );
      case 'EN_REVISION':
      case 'CORREGIDO_EN_REVISION':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" /> En Revisión Técnica
          </span>
        );
      case 'REQUIERE_CORRECCION':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-blue-600" /> Requiere Corrección
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
            <FileText className="w-3 h-3 text-slate-500" /> Borrador / Pendiente
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ========================================================= */}
      {/* 1. Header Banner Estandarizado Claro                       */}
      {/* ========================================================= */}
      <div className="bg-white text-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs relative overflow-hidden dark:bg-[#0b1329] dark:text-white dark:border-blue-900/60">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
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
                Bienvenido al Portal Oficial de Proveedores de <strong>Flota Sugamuxi S.A.</strong> Radique su expediente, cargue soportes, postúlese a convocatorias y consulte su estado.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 self-start md:self-center">
            <button
              onClick={() => setActiveView('login')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 hover:text-blue-900 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs dark:bg-blue-950/70 dark:hover:bg-blue-900 dark:border-blue-800 dark:text-cyan-300"
              title="Abrir Módulo de Login Corporativo"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>Login Corporativo</span>
            </button>
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
      </div>

      {/* ========================================================= */}
      {/* 2. CONDITIONAL MODULE RENDERING: WELCOME, LOGIN, REGISTER  */}
      {/* ========================================================= */}

      {/* A. VISTA DE INICIO / BIENVENIDA (Informativa y orientativa, sin formularios de login/registro) */}
      {supplierPortalTab === 'welcome' && (
        <div className="space-y-6">
          {/* Welcome Card */}
          <div className="bg-white dark:bg-[#0b1329] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-cyan-400 block">
                    SISTEMA INTEGRAL DE GESTIÓN DE PROVEEDORES
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Bienvenido a Flota Sugamuxi S.A.
                  </h2>
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Conectando aliados estratégicos con los más altos estándares de calidad, seguridad y cumplimiento.
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                En <strong>Flota Sugamuxi S.A.</strong> valoramos el talento, la solidez y el compromiso de nuestros contratistas. Como empresa líder en transporte terrestre en Colombia, garantizamos procesos de selección y homologación transparentes y ágiles a través de nuestra plataforma oficial <strong>SIGEPRO</strong>.
              </p>
            </div>

            {/* Right Logo Card */}
            <div className="shrink-0 p-4 bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3 shadow-2xs">
              <FlotaSugamuxiLogo variant="light" size="lg" />
              <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">
                  EMPRESA LÍDER
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Flota Sugamuxi S.A.
                </span>
              </div>
            </div>
          </div>

          {/* Quick Access to Specialized Modules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setActiveView('convocatorias')}
              className="bg-white dark:bg-[#0b1329] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 transition-all flex items-start gap-4 text-left cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-cyan-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white block">
                    CONVOCATORIAS VIGENTES
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-transform group-hover:translate-x-1" />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block leading-relaxed">
                  Consulte términos de referencia abiertos para transporte, repuestos y suministros operativos.
                </span>
              </div>
            </button>

            {!isSupplierLoggedIn && (
              <button
                type="button"
                onClick={() => setSupplierPortalTab('register')}
                className="bg-white dark:bg-[#0b1329] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 transition-all flex items-start gap-4 text-left cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-cyan-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white block">
                      REGISTRAR PROVEEDOR
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-transform group-hover:translate-x-1" />
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block leading-relaxed">
                    Inscriba su empresa o persona natural para iniciar su proceso oficial de homologación técnica.
                  </span>
                </div>
              </button>
            )}

            <button
              type="button"
              onClick={() => setSupplierPortalTab('login')}
              className="bg-white dark:bg-[#0b1329] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 transition-all flex items-start gap-4 text-left cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <LogIn className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white block">
                    CONSULTAR RADICADO / INGRESO
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-transform group-hover:translate-x-1" />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block leading-relaxed">
                  Acceda con su NIT o número de expediente para cargar formatos y verificar el dictamen oficial.
                </span>
              </div>
            </button>
          </div>

          {/* Process 4-Steps Overview Card */}
          <div className="bg-white dark:bg-[#0b1329] rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="max-w-2xl">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                <span>Proceso Oficial de Vinculación y Homologación de Proveedores</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Flota Sugamuxi S.A. garantiza la transparencia, objetividad y cumplimiento de los estándares de calidad ISO 9001, ISO 14001, ISO 45001 y PESV en todas las contrataciones.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 pt-1">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Registro Inicial</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Inscripción de datos básicos, identificación tributaria y radicación con número oficial asignado.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Formatos Oficiales SIG</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Diligenciamiento de los formularios institucionales FS.GA-FOR-009 y FS.GA-FOR-039 de Habeas Data.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Carga de Soportes</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Anexo de RUT actualizado, Certificado de Cámara de Comercio, Cédulas y Certificación Bancaria.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Habilitación Oficial</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Revisión técnica, verificación SARLAFT y emisión del Certificado Oficial de Proveedor Apto.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* B. VISTA DEDICADA: INGRESO O CONSULTAR ESTADO (supplierPortalTab !== 'welcome' && supplierPortalTab !== 'register') */}
      {supplierPortalTab !== 'welcome' && supplierPortalTab !== 'register' && (
        <div className="bg-white dark:bg-[#0b1329] rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm max-w-4xl mx-auto space-y-8 transition-colors">
          {/* Center Icon & Header */}
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 flex items-center justify-center mx-auto text-blue-600 dark:text-cyan-400 shadow-inner">
              <LogIn className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">
              INGRESO / CONSULTAR PORTAL DE PROVEEDOR
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Acceda a su portal de proveedor para registrar o actualizar su Expediente SIG, aplicar a convocatorias de suministro y hacer seguimiento en tiempo real.
            </p>
          </div>

          {/* Form Login */}
          <div className="space-y-6">
            <form onSubmit={handleLoginSubmit} className="space-y-4 max-w-lg mx-auto">
              {loginError && (
                <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                  CORREO ELECTRÓNICO REGISTRADO O IDENTIFICACIÓN (NIT / CÉDULA) <span className="text-blue-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifierInput}
                    onChange={(e) => setIdentifierInput(e.target.value)}
                    placeholder="Ej: 900123456, distribuidora@example.com o EXP-2025-001"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Puede ingresar su NIT, Cédula de Ciudadanía, Correo Electrónico o Número de Radicado.
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5 uppercase tracking-wide">
                  NÚMERO DE RADICADO O CONTRASEÑA DE ACCESO <span className="text-blue-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={accessCodeInput}
                    onChange={(e) => setAccessCodeInput(e.target.value)}
                    placeholder="Contraseña o número de radicado (opcional para cuentas demo)"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-[#0b1329] dark:bg-blue-600 hover:bg-blue-900 dark:hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <span>Verificando credenciales...</span>
                ) : (
                  <>
                    <span>Ingresar al Portal del Proveedor</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Accounts for Testing & Instant Access */}
            <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                  <span>Cuentas Demo de Prueba (Acceso Directo con 1 Clic):</span>
                </h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Seleccione cualquier proveedor para probar su interfaz y estado
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {dossiers.map((d) => {
                  const isNat = d.basicInfo.supplierType === 'NATURAL';
                  const title = isNat ? d.basicInfo.fullName : d.basicInfo.companyName;
                  const docNum = isNat ? `CC: ${d.basicInfo.documentNumber}` : `NIT: ${d.basicInfo.nit}`;

                  return (
                    <button
                      key={d.id}
                      onClick={() => handleQuickDemoLogin(d.fileNumber)}
                      className="p-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-blue-50/80 dark:hover:bg-blue-950/60 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 rounded-xl text-left transition-all group flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-900 dark:group-hover:text-cyan-300 truncate">
                            {title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="font-mono">{docNum}</span>
                          <span>&bull;</span>
                          <span className="font-mono text-blue-700 dark:text-cyan-400 font-semibold">{d.fileNumber}</span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {getStatusBadge(d.processStatus)}
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* C. VISTA DEDICADA: REGISTRO DE NUEVO PROVEEDOR (supplierPortalTab === 'register') */}
      {supplierPortalTab === 'register' && (
        isSupplierLoggedIn && currentDossier ? (
          <div className="bg-white dark:bg-[#0b1329] rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 flex items-center justify-center mx-auto text-blue-600 dark:text-cyan-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">
              Sesión Activa de Proveedor
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              Usted ya se encuentra autenticado con el expediente <strong className="text-blue-600 dark:text-cyan-400 font-mono">{currentDossier.fileNumber}</strong> ({currentDossier.basicInfo.companyName || currentDossier.basicInfo.fullName}). Por seguridad, no está permitido acceder al formulario de registro de un nuevo proveedor mientras mantenga su sesión iniciada.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setSupplierPortalTab('login');
                  setActiveView('onboarding');
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Ir a Mi Expediente SIG
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0b1329] rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-sm max-w-4xl mx-auto space-y-8 transition-colors">
            {/* Center Icon & Header */}
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 flex items-center justify-center mx-auto text-blue-600 dark:text-cyan-400 shadow-inner">
                <UserPlus className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">
                REGISTRO DE NUEVO PROVEEDOR
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Inscriba su empresa o persona natural para iniciar su proceso oficial de homologación y habilitación técnica ante Flota Sugamuxi S.A.
              </p>
            </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-5 max-w-2xl mx-auto">
            {regError && (
              <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>{regError}</span>
              </div>
            )}

            {/* Regime Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                Tipo de Persona <span className="text-blue-600 dark:text-cyan-400 font-bold">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRegSupplierType('JURIDICA')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    regSupplierType === 'JURIDICA'
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-cyan-300 border-blue-500 dark:border-cyan-500 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Persona Jurídica (Empresa / SAS)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegSupplierType('NATURAL')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    regSupplierType === 'NATURAL'
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-cyan-300 border-blue-500 dark:border-cyan-500 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Persona Natural (Independiente)</span>
                </button>
              </div>
            </div>

            {/* Dynamic Fields for Juridica vs Natural */}
            {regSupplierType === 'JURIDICA' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Razón Social / Empresa <span className="text-blue-600 dark:text-cyan-400 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regData.companyName}
                    onChange={(e) => setRegData({ ...regData, companyName: e.target.value })}
                    placeholder="Ej: Distribuciones Andinas del Oriente S.A.S."
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    NIT con Dígito de Verificación <span className="text-blue-600 dark:text-cyan-400 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regData.nit}
                    onChange={(e) => setRegData({ ...regData, nit: e.target.value })}
                    placeholder="Ej: 900876543-1"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del Representante Legal
                  </label>
                  <input
                    type="text"
                    value={regData.representativeLegalName}
                    onChange={(e) => setRegData({ ...regData, representativeLegalName: e.target.value })}
                    placeholder="Ej: Mario Roberto Delgado Rojas"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cédula Representante Legal
                  </label>
                  <input
                    type="text"
                    value={regData.representativeLegalDocNumber}
                    onChange={(e) => setRegData({ ...regData, representativeLegalDocNumber: e.target.value })}
                    placeholder="Ej: 79.123.456"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombres y Apellidos Completos <span className="text-blue-600 dark:text-cyan-400 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regData.fullName}
                    onChange={(e) => setRegData({ ...regData, fullName: e.target.value })}
                    placeholder="Ej: Carlos Eduardo Salamanca Niño"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Número de Documento de Identidad <span className="text-blue-600 dark:text-cyan-400 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regData.documentNumber}
                    onChange={(e) => setRegData({ ...regData, documentNumber: e.target.value })}
                    placeholder="Ej: 80.456.789"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Common Contact Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico Oficial <span className="text-blue-600 dark:text-cyan-400 font-bold">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  placeholder="notificaciones@empresa.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono / Celular <span className="text-blue-600 dark:text-cyan-400 font-bold">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={regData.phone}
                  onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                  placeholder="Ej: 310 123 4567"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ciudad / Municipio <span className="text-blue-600 dark:text-cyan-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regData.city}
                  onChange={(e) => setRegData({ ...regData, city: e.target.value })}
                  placeholder="Sogamoso, Boyacá"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Línea Principal de Suministro / Servicio de Interés
              </label>
              <select
                value={regData.selectedCategory}
                onChange={(e) => setRegData({ ...regData, selectedCategory: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {categoriesConfig.map((cat) => (
                  <option key={cat.category} value={cat.category} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {cat.category} (Riesgo {cat.riskLevel || 'MEDIO'})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                * La asignación oficial de actividad económica y código CIIU será ratificada y parametrizada por el Revisor Técnico o Administrador General al crear o auditar el registro.
              </span>
            </div>

            {/* Asignación de Evaluador: Solo para Revisor Técnico o Administrador General */}
            {role === 'ADMIN' || role === 'REVISOR' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                    <span>Evaluador / Revisor Técnico Asignado</span>
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-cyan-400 font-medium">Asignación Oficial (Admin / Revisor)</span>
                </label>
                <select
                  value={assignedReviewerId}
                  onChange={(e) => setAssignedReviewerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-medium focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {systemUsers.map((u) => (
                    <option key={u.id} value={u.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {u.name} — {u.role === 'REVISOR' ? 'Evaluador Técnico' : 'Administrador General'} ({u.roleDescription || u.role})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  * Seleccione el usuario técnico que tendrá la custodia y responsabilidad de auditar este expediente.
                </span>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>Evaluador Técnico Asignado</span>
                      <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">— Asignación Institucional</span>
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      El <strong>Revisor Técnico / Evaluador</strong> será asignado internamente por la Dirección del Sistema Integrado de Gestión (SIG) o Administrador General de Flota Sugamuxi S.A. al radicar su expediente, garantizando la imparcialidad en la auditoría documental y el dictamen de habilitación.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isRegistering}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isRegistering ? (
                  <span>Creando registro y radicando...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Crear Registro y Continuar al Portal del Proveedor</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ))}
    </div>
  );
};
