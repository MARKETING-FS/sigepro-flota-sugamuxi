import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SystemUser, SupplierDossier } from '../types';
import { FlotaSugamuxiEmblem } from './FlotaSugamuxiLogo';
import {
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  ArrowLeft,
  Search,
  ChevronRight,
  Clock,
  User,
  Briefcase,
  BarChart3,
} from 'lucide-react';

interface CorporateLoginViewProps {
  onOpenRegisterModal?: () => void;
  onOpenHabeasDataModal?: () => void;
  onBackToApp?: () => void;
}

export const CorporateLoginView: React.FC<CorporateLoginViewProps> = ({
  onOpenRegisterModal,
  onBackToApp,
}) => {
  const {
    role,
    setRole,
    activeUserId,
    setActiveUserId,
    systemUsers,
    allDossiers,
    currentDossierId,
    setCurrentDossierId,
    supplierLogin,
    setActiveView,
    showToast,
    toggleTheme,
    setSupplierPortalTab,
  } = useApp();

  // Mode: 'corporate' (Personal Corporativo) or 'supplier' (Portal de Proveedores)
  const [activePortalTab, setActivePortalTab] = useState<'corporate' | 'supplier'>('corporate');

  // Corporate login form state
  const [corporateEmail, setCorporateEmail] = useState('auxsistemas@flotasugamuxisa.com.co');
  const [corporatePassword, setCorporatePassword] = useState('••••••••••');
  const [showCorporatePassword, setShowCorporatePassword] = useState(false);
  const [corporateError, setCorporateError] = useState('');
  const [isCorporateLoading, setIsCorporateLoading] = useState(false);

  // Supplier login form state
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierIdentifier, setSupplierIdentifier] = useState('');
  const [supplierCode, setSupplierCode] = useState('');
  const [supplierError, setSupplierError] = useState('');
  const [isSupplierLoading, setIsSupplierLoading] = useState(false);
  const [showManualSupplierInput, setShowManualSupplierInput] = useState(false);

  // Filtered suppliers for quick 1-click login
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return allDossiers;
    const q = supplierSearch.toLowerCase().trim();
    return allDossiers.filter((d) => {
      const name = (
        d.supplierType === 'NATURAL' ? d.basicInfo.fullName : d.basicInfo.companyName
      ).toLowerCase();
      const nit = (d.basicInfo.nit || '').toLowerCase();
      const doc = (d.basicInfo.documentNumber || '').toLowerCase();
      const file = (d.fileNumber || '').toLowerCase();
      return name.includes(q) || nit.includes(q) || doc.includes(q) || file.includes(q);
    });
  }, [allDossiers, supplierSearch]);

  // Handle corporate standard login
  const handleCorporateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setCorporateError('');

    if (!corporateEmail.trim()) {
      setCorporateError('Ingrese su correo corporativo institucional.');
      return;
    }

    const emailClean = corporateEmail.trim().toLowerCase();
    const matchedUser = systemUsers.find(
      (u) => u.email.toLowerCase() === emailClean || u.id === emailClean
    );

    setIsCorporateLoading(true);

    setTimeout(() => {
      setIsCorporateLoading(false);
      if (matchedUser) {
        setActiveUserId(matchedUser.id);
        setRole(matchedUser.role);
        showToast(`Bienvenido, ${matchedUser.name}`, 'success', 'ACCESO CORPORATIVO');
        setActiveView('revisores');
      } else if (emailClean.includes('sistemas') || emailClean.includes('admin')) {
        setActiveUserId('admin-1');
        setRole('ADMIN');
        showToast('Bienvenido, Julian Salgado (Administrador General)', 'success', 'ACCESO ADMINISTRATIVO');
        setActiveView('revisores');
      } else {
        setCorporateError('Usuario o contraseña no autorizados en Flota Sugamuxi S.A.');
      }
    }, 300);
  };

  // Quick 1-click select corporate user pill
  const handleSelectCorporateUser = (user: SystemUser) => {
    setCorporateEmail(user.email);
    setCorporatePassword('••••••••••');
    setCorporateError('');
    setIsCorporateLoading(true);

    setTimeout(() => {
      setIsCorporateLoading(false);
      setActiveUserId(user.id);
      setRole(user.role);
      showToast(`Sesión autorizada: ${user.name} (${user.shortName})`, 'success', 'ACCESO CORPORATIVO');
      setActiveView('revisores');
    }, 200);
  };

  // 1-Click login as a specific supplier from the list
  const handleSelectSupplierDossier = (dossier: SupplierDossier) => {
    setCurrentDossierId(dossier.id);
    supplierLogin(dossier.fileNumber, '123456');
    setRole('PROVEEDOR');
    setSupplierPortalTab('login');
    const name =
      dossier.supplierType === 'NATURAL'
        ? dossier.basicInfo.fullName
        : dossier.basicInfo.companyName;

    showToast(`Expediente ${dossier.fileNumber} cargado. Bienvenido, ${name}.`, 'success', 'PORTAL PROVEEDORES');
    setActiveView('onboarding');
  };

  // Manual supplier login
  const handleSupplierManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setSupplierError('');

    if (!supplierIdentifier.trim()) {
      setSupplierError('Ingrese su NIT, Cédula o Número de Radicado.');
      return;
    }

    setIsSupplierLoading(true);

    setTimeout(() => {
      setIsSupplierLoading(false);
      const res = supplierLogin(supplierIdentifier, supplierCode);
      if (res.success) {
        setRole('PROVEEDOR');
        setSupplierPortalTab('login');
        showToast(res.message, 'success', 'PORTAL PROVEEDORES');
        setActiveView('onboarding');
      } else {
        setSupplierError(res.message);
      }
    }, 300);
  };

  // Render badge for supplier status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'HABILITADO':
        return (
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" /> Habilitado
          </span>
        );
      case 'EN_REVISION':
      case 'CORREGIDO_EN_REVISION':
      case 'LISTO_PARA_ENVIO':
        return (
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center gap-1 shrink-0">
            <Clock className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" /> En Revisión
          </span>
        );
      case 'REQUIERE_CORRECCION':
        return (
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1 shrink-0">
            <AlertCircle className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" /> Corrección
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center gap-1 shrink-0">
            <FileText className="w-2.5 h-2.5 text-slate-500" /> Trámite
          </span>
        );
    }
  };

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-[#060b18] font-sans antialiased text-slate-900 dark:text-white select-none overflow-y-auto lg:overflow-hidden">
      
      {/* ========================================================================= */}
      {/* COLUMNA IZQUIERDA (Dark Corporate Side) - Ajustado 100% al alto de pantalla */}
      {/* ========================================================================= */}
      <div className="lg:w-[46%] xl:w-[44%] bg-[#060c1c] text-white p-5 sm:p-6 lg:p-6 xl:p-8 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-blue-950/60 lg:h-full shrink-0">
        
        {/* Subtle background glow effect */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header con Logo Institucional */}
        <div className="relative z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-800/60 p-1.5 flex items-center justify-center shrink-0 shadow-inner">
              <FlotaSugamuxiEmblem className="w-full h-full" color="#38bdf8" />
            </div>
            <div>
              <div className="text-sm font-black tracking-tight text-white leading-tight">
                Flota Sugamuxi S.A.
              </div>
              <div className="text-[10px] font-bold text-[#38bdf8] font-mono tracking-wider">
                SIGEPRO V2.1.0
              </div>
            </div>
          </div>
        </div>

        {/* Central Content: Badge, Main Headline & 4 Feature Cards */}
        <div className="relative z-10 my-auto py-2 xl:py-4 space-y-3 xl:space-y-4">
          
          {/* Pill Badge with Green Dot */}
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#0b1836] border border-blue-800/80 rounded-full text-[#38bdf8] text-[11px] font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ACCESO CORPORATIVO SEGURO</span>
          </div>

          {/* Big Headline */}
          <h1 className="text-2xl sm:text-3xl xl:text-4xl font-black text-white leading-[1.15] tracking-tight">
            Sistema Integral de <br />
            <span className="text-[#38bdf8]">Gestión de Proveedores</span> <br />
            y Contratistas
          </h1>

          {/* Subtitle description */}
          <p className="text-xs text-slate-300 leading-relaxed font-light max-w-lg">
            <span className="font-bold text-[#38bdf8] mr-1">SIGEPRO</span>— Plataforma corporativa de Flota Sugamuxi S.A. para la administración, homologación técnica, debida diligencia SARLAFT y gestión de proveedores de bienes y servicios.
          </p>

          {/* 4 Feature Cards (exact vertical stack layout from screenshot) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0c162e]/80 border border-blue-900/50 hover:bg-[#101e3d] transition-colors shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-blue-950/90 border border-blue-800/70 text-[#38bdf8] flex items-center justify-center shrink-0">
                <Briefcase className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                Homologación y Registro de Proveedores
              </span>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0c162e]/80 border border-blue-900/50 hover:bg-[#101e3d] transition-colors shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-blue-950/90 border border-blue-800/70 text-[#38bdf8] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                Debida Diligencia & SARLAFT
              </span>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0c162e]/80 border border-blue-900/50 hover:bg-[#101e3d] transition-colors shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-blue-950/90 border border-blue-800/70 text-[#38bdf8] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                Evaluación Técnica ISO 9001 & HSEQ
              </span>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0c162e]/80 border border-blue-900/50 hover:bg-[#101e3d] transition-colors shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-blue-950/90 border border-blue-800/70 text-[#38bdf8] flex items-center justify-center shrink-0">
                <BarChart3 className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                Reportes y Auditoría del Sistema
              </span>
            </div>
          </div>

        </div>

        {/* Footer Izquierdo */}
        <div className="relative z-10 pt-2 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>&copy; {new Date().getFullYear()} Flota Sugamuxi S.A. — Todos los derechos reservados</span>
          <span className="px-2 py-0.5 rounded-md bg-[#0c1833] border border-blue-900/70 text-[#38bdf8] text-[9px] font-bold font-mono">
            SIGEPRO
          </span>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* COLUMNA DERECHA (Light Side with Card) - Ajustado 100% al alto de pantalla */}
      {/* ========================================================================= */}
      <div className="lg:w-[54%] xl:w-[56%] bg-[#f1f5f9] dark:bg-[#080e1e] flex flex-col justify-between p-4 sm:p-6 lg:p-6 xl:p-8 transition-colors duration-200 lg:h-full lg:overflow-hidden shrink-0">
        
        {/* Top bar on right: Return to platform link & Theme toggle */}
        <div className="flex items-center justify-between shrink-0 pb-1">
          {onBackToApp ? (
            <button
              onClick={onBackToApp}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0a2368] dark:hover:text-[#38bdf8] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la plataforma</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Lock className="w-3 h-3" />
              <span>Portal Oficial Flota Sugamuxi S.A.</span>
            </span>
          )}

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-[#38bdf8] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
            title="Alternar Tema Claro / Oscuro"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Floating Centered Card (exact card from screenshot) */}
        <div className="my-auto py-1 flex items-center justify-center w-full">
          <div className="w-full max-w-md bg-white dark:bg-[#0c152a] rounded-3xl shadow-xl p-5 sm:p-6 xl:p-7 border border-slate-100 dark:border-slate-800/80 transition-all">
            
            {/* Top Shield Icon in soft blue container */}
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center mx-auto text-[#0a2368] dark:text-[#38bdf8] mb-2 shadow-2xs">
              <ShieldCheck className="w-5 h-5 stroke-[1.8]" />
            </div>

            {/* Title & Subtitle */}
            <div className="text-center space-y-0.5 mb-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {activePortalTab === 'corporate' ? 'Acceso Corporativo' : 'Portal de Proveedores'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-light">
                {activePortalTab === 'corporate'
                  ? 'Ingrese con sus credenciales institucionales de SIGEPRO'
                  : 'Seleccione su expediente o ingrese sus credenciales de proveedor'}
              </p>
            </div>

            {/* Portal Switcher Tabs (Pills style) */}
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <button
                type="button"
                onClick={() => {
                  setActivePortalTab('corporate');
                  setCorporateError('');
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  activePortalTab === 'corporate'
                    ? 'bg-[#0a2368] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Personal Corporativo
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePortalTab('supplier');
                  setSupplierError('');
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  activePortalTab === 'supplier'
                    ? 'bg-[#0a2368] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Portal de Proveedores
              </button>
            </div>

            {/* ======================================================== */}
            {/* PESTAÑA 1: PERSONAL CORPORATIVO                          */}
            {/* ======================================================== */}
            {activePortalTab === 'corporate' && (
              <div className="space-y-3">
                
                {/* Quick 1-Click Role Pills (like in the screenshot) */}
                <div className="flex flex-wrap items-center justify-center gap-1 mb-2.5">
                  {systemUsers.map((u) => {
                    const isSelected = activeUserId === u.id && role === u.role;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectCorporateUser(u)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-100 dark:bg-blue-900/60 text-[#0a2368] dark:text-[#38bdf8] border-[#0a2368] dark:border-[#38bdf8]'
                            : 'bg-blue-50/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-blue-200/80 dark:border-slate-700 hover:bg-blue-100/60'
                        }`}
                        title={u.name}
                      >
                        {u.shortName}
                      </button>
                    );
                  })}
                </div>

                {corporateError && (
                  <div className="p-2 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                    <span>{corporateError}</span>
                  </div>
                )}

                {/* Corporate Form (exact inputs from screenshot) */}
                <form onSubmit={handleCorporateLogin} className="space-y-2.5">
                  
                  {/* Correo Corporativo */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider block">
                      CORREO CORPORATIVO
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={corporateEmail}
                        onChange={(e) => setCorporateEmail(e.target.value)}
                        placeholder="auxsistemas@flotasugamuxisa.com.co"
                        className="w-full pl-9 pr-3 py-2 bg-[#edf3fc] dark:bg-slate-900/90 border border-blue-100/90 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all"
                      />
                    </div>
                  </div>

                  {/* Contraseña */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-wider block">
                        CONTRASEÑA
                      </label>
                      <button
                        type="button"
                        onClick={() => showToast('Comuníquese con auxsistemas@flotasugamuxisa.com.co', 'info', 'SOPORTE')}
                        className="text-[10px] text-[#0a2368] dark:text-[#38bdf8] hover:underline font-bold cursor-pointer"
                      >
                        ¿Olvidó su contraseña?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showCorporatePassword ? 'text' : 'password'}
                        value={corporatePassword}
                        onChange={(e) => setCorporatePassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-9 py-2 bg-[#edf3fc] dark:bg-slate-900/90 border border-blue-100/90 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCorporatePassword(!showCorporatePassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showCorporatePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button (Corporate Blue with Arrow) */}
                  <button
                    type="submit"
                    disabled={isCorporateLoading}
                    className="w-full py-2.5 bg-[#0a2368] hover:bg-[#07194d] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-1"
                  >
                    {isCorporateLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Iniciar Sesión Corporativa</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                </form>

              </div>
            )}

            {/* ======================================================== */}
            {/* PESTAÑA 2: PORTAL DE PROVEEDORES (LISTADO 1-CLICK)        */}
            {/* ======================================================== */}
            {activePortalTab === 'supplier' && (
              <div className="space-y-2.5">
                
                {/* Search Bar + Register Button */}
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={supplierSearch}
                      onChange={(e) => setSupplierSearch(e.target.value)}
                      placeholder="Buscar por NIT, nombre..."
                      className="w-full pl-8 pr-2.5 py-1.5 bg-[#edf3fc] dark:bg-slate-900/90 border border-blue-100 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {onOpenRegisterModal && (
                    <button
                      onClick={onOpenRegisterModal}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
                    >
                      + Inscribir
                    </button>
                  )}
                </div>

                {/* List of Registered Suppliers for 1-Click login */}
                <div className="max-h-36 xl:max-h-44 overflow-y-auto space-y-1 pr-1 border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-slate-50/50 dark:bg-slate-900/40">
                  {filteredSuppliers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No se encontraron proveedores coincidentes.
                    </div>
                  ) : (
                    filteredSuppliers.map((d) => {
                      const isNatural = d.supplierType === 'NATURAL';
                      const name = isNatural ? d.basicInfo.fullName : d.basicInfo.companyName;
                      const idNum = isNatural ? d.basicInfo.documentNumber : d.basicInfo.nit;
                      const isCurrent = d.id === currentDossierId && role === 'PROVEEDOR';

                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => handleSelectSupplierDossier(d)}
                          className={`w-full text-left p-2 rounded-lg transition-all flex items-center justify-between gap-2 cursor-pointer border ${
                            isCurrent
                              ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-400 dark:border-blue-700 shadow-2xs'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950 text-[#0a2368] dark:text-[#38bdf8] border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                              {isNatural ? <User className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {name}
                                </span>
                                <span className="text-[9px] font-mono text-blue-700 dark:text-[#38bdf8] font-bold shrink-0">
                                  {d.fileNumber}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                                {isNatural ? 'CC' : 'NIT'}: {idNum}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1">
                            {renderStatusBadge(d.processStatus)}
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Manual Input Toggle */}
                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setShowManualSupplierInput(!showManualSupplierInput)}
                    className="text-[11px] text-[#0a2368] dark:text-[#38bdf8] hover:underline font-bold cursor-pointer"
                  >
                    {showManualSupplierInput ? 'Ocultar ingreso manual' : '¿Ingresar con NIT o Radicado manualmente?'}
                  </button>

                  {showManualSupplierInput && (
                    <form onSubmit={handleSupplierManualLogin} className="mt-1.5 space-y-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      {supplierError && (
                        <div className="p-1.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded text-[11px] text-red-700 dark:text-red-300">
                          {supplierError}
                        </div>
                      )}
                      <input
                        type="text"
                        value={supplierIdentifier}
                        onChange={(e) => setSupplierIdentifier(e.target.value)}
                        placeholder="NIT, Cédula o No. Radicado"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-white font-mono"
                      />
                      <button
                        type="submit"
                        disabled={isSupplierLoading}
                        className="w-full py-1.5 bg-[#0a2368] hover:bg-[#07194d] text-white rounded text-xs font-bold transition-all cursor-pointer"
                      >
                        {isSupplierLoading ? 'Consultando...' : 'Consultar Expediente'}
                      </button>
                    </form>
                  )}
                </div>

              </div>
            )}

            {/* Bottom Security Guarantee (green icon like screenshot) */}
            <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Conexión cifrada SSL &bull; Acceso restringido Flota Sugamuxi S.A.</span>
            </div>

          </div>
        </div>

        {/* Footer Derecho (exact copy from screenshot footer) */}
        <div className="text-center text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/80 dark:border-slate-800/80 shrink-0">
          &copy; {new Date().getFullYear()} Flota Sugamuxi S.A. — SIGEPRO v2.1.0 &bull; Sistema Integral de Gestión de Proveedores
        </div>

      </div>

    </div>
  );
};
