import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SupplierOnboardingDashboard } from './components/SupplierOnboardingDashboard';
import { InternalReviewView } from './components/InternalReviewView';
import { InstitutionalFormsAdmin } from './components/InstitutionalFormsAdmin';
import { BancoProveedoresView } from './components/BancoProveedoresView';
import { AuditLogView } from './components/AuditLogView';
import { SupplierRegisterModal } from './components/SupplierRegisterModal';
import { EmailVerificationModal } from './components/EmailVerificationModal';
import { ExcelReportsView } from './components/ExcelReportsView';
import { AdminRegisterSupplierView } from './components/AdminRegisterSupplierView';
import { AdminParametrizationView } from './components/AdminParametrizationView';
import { SupplierEvaluationsView } from './components/evaluations/SupplierEvaluationsView';
import { CorporateLoginView } from './components/CorporateLoginView';
import { ToastNotification } from './components/ToastNotification';
import { PushAlertFloatingToast } from './components/notifications/PushAlertFloatingToast';
import {
  ShieldCheck,
  Building2,
  FileText,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  HelpCircle,
  Clock,
  Lock,
  X,
  UserPlus,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    activeView,
    setActiveView,
    currentDossier,
    role,
    isSupplierLoggedIn,
    supplierPortalTab,
    setSupplierPortalTab,
    supplierLogout,
    showToast,
  } = useApp();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isEmailVerifyModalOpen, setIsEmailVerifyModalOpen] = useState(false);
  const [pendingVerifyDossierId, setPendingVerifyDossierId] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [simulatedCode, setSimulatedCode] = useState('849201');

  // Habeas Data Modal
  const [isHabeasDataOpen, setIsHabeasDataOpen] = useState(false);

  // Automatically scroll to the top of the page whenever a new module / view is selected
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
  }, [activeView, supplierPortalTab]);

  // For 'Revisor Técnico' and 'Administrador General' roles, do not show 'Inicio / Bienvenida' (onboarding); redirect directly to 'revisores' (Dashboard Ejecutivo)
  useEffect(() => {
    if ((role === 'REVISOR' || role === 'ADMIN') && activeView === 'onboarding') {
      setActiveView('revisores');
    }
  }, [role, activeView, setActiveView]);

  const handleOpenRegister = () => {
    if (role === 'PROVEEDOR' && isSupplierLoggedIn) {
      showToast('Su expediente ya se encuentra registrado y activo.', 'info', 'SESIÓN INICIADA');
      return;
    }
    setIsRegisterModalOpen(true);
  };

  const handleRegisteredSuccess = (dossierId: string, email: string, code: string) => {
    setIsRegisterModalOpen(false);
    setPendingVerifyDossierId(dossierId);
    setPendingEmail(email);
    setSimulatedCode(code);
    setIsEmailVerifyModalOpen(true);
  };

  const handleVerifiedSuccess = () => {
    setIsEmailVerifyModalOpen(false);
  };

  // Full-page Corporate Login View
  if (activeView === 'login') {
    return (
      <div className="h-screen w-full overflow-hidden bg-slate-100 dark:bg-[#060b18] flex flex-col font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-200 dark:selection:bg-blue-900 transition-colors duration-200">
        <ToastNotification />
        <PushAlertFloatingToast />
        <CorporateLoginView
          onOpenRegisterModal={handleOpenRegister}
          onOpenHabeasDataModal={() => setIsHabeasDataOpen(true)}
          onBackToApp={() => setActiveView(role === 'PROVEEDOR' ? 'onboarding' : 'revisores')}
        />
        {/* Registration Modal */}
        <SupplierRegisterModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onRegisteredSuccess={handleRegisteredSuccess}
        />
        {/* Email Verification Modal */}
        <EmailVerificationModal
          isOpen={isEmailVerifyModalOpen}
          onClose={() => setIsEmailVerifyModalOpen(false)}
          dossierId={pendingVerifyDossierId}
          targetEmail={pendingEmail}
          simulatedCode={simulatedCode}
          onVerifiedSuccess={handleVerifiedSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#070d1d] flex font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-200 dark:selection:bg-blue-900 transition-colors duration-200">
      {/* Fixed Global System Toast Notification (Primary Brand Blue & Fixed Top-Right) */}
      <ToastNotification />
      <PushAlertFloatingToast />
      
      {/* 1. Left Sidebar Navigation (Desktop) - Fixed 100% Height */}
      <div className="hidden md:flex flex-col shrink-0 sticky top-0 h-screen z-30">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          onOpenRegisterModal={handleOpenRegister}
          onOpenHabeasDataModal={() => setIsHabeasDataOpen(true)}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/70 backdrop-blur-xs">
          <div className="w-72 bg-[#0b1329] h-full shadow-2xl flex flex-col">
            <Sidebar
              isCollapsed={false}
              setIsCollapsed={() => setIsMobileSidebarOpen(false)}
              onOpenRegisterModal={() => {
                setIsMobileSidebarOpen(false);
                handleOpenRegister();
              }}
              onOpenHabeasDataModal={() => {
                setIsMobileSidebarOpen(false);
                setIsHabeasDataOpen(true);
              }}
            />
          </div>
          <div
            className="flex-1 h-full cursor-pointer"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        </div>
      )}

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Top Navbar */}
        <Header
          onOpenRegisterModal={handleOpenRegister}
          activeView={activeView}
          setActiveView={setActiveView}
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Email Verification Banner if unverified */}
        {currentDossier && !currentDossier.isEmailVerified && activeView === 'onboarding' && (role !== 'PROVEEDOR' || isSupplierLoggedIn) && (
          <div className="bg-[#0b1329] text-cyan-300 px-4 py-2 text-xs font-semibold shadow-xs border-b border-blue-900">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-200">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Su correo <strong className="underline font-bold text-cyan-300">{currentDossier.basicInfo.email}</strong> está pendiente de confirmación de seguridad para radicación.
                </span>
              </div>
              <button
                onClick={() => {
                  setPendingVerifyDossierId(currentDossier.id);
                  setPendingEmail(currentDossier.basicInfo.email);
                  setSimulatedCode(currentDossier.emailVerificationCode || '849201');
                  setIsEmailVerifyModalOpen(true);
                }}
                className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded font-bold text-[11px] transition-colors self-start sm:self-auto cursor-pointer shadow-2xs border border-blue-500"
              >
                Ingresar código de verificación
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Views */}
        <main className="flex-1 pb-10">
          {activeView === 'onboarding' && <SupplierOnboardingDashboard />}
          {activeView === 'registrarProveedor' && (
            role === 'PROVEEDOR' ? (
              isSupplierLoggedIn ? (
                <div className="max-w-2xl mx-auto mt-12 p-6 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Sesión de Proveedor Activa</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
                    Usted ya cuenta con una sesión iniciada con el expediente{' '}
                    <strong className="text-blue-600 dark:text-cyan-400 font-mono">
                      {currentDossier?.fileNumber || ''}
                    </strong>
                    . Para registrar una nueva empresa o persona natural como proveedor, debe cerrar la sesión actual.
                  </p>
                  <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
                    <button
                      onClick={() => {
                        setActiveView('onboarding');
                        setSupplierPortalTab('login');
                      }}
                      className="px-4 py-2 bg-[#0b1329] dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      Volver a Mi Expediente SIG
                    </button>
                    <button
                      onClick={() => {
                        supplierLogout();
                        setIsRegisterModalOpen(true);
                      }}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
                    >
                      Cerrar Sesión y Registrar Nuevo Proveedor
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto mt-12 p-6 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                    <UserPlus className="w-6 h-6 text-blue-600 dark:text-cyan-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Registro de Proveedores - Flota Sugamuxi S.A.</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
                    Inicie el proceso de vinculación oficial diligenciando el formulario de inscripción inicial para obtener su número de radicado SIG.
                  </p>
                  <div className="mt-5 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setIsRegisterModalOpen(true)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Abrir Formulario de Inscripción</span>
                    </button>
                  </div>
                </div>
              )
            ) : (
              <AdminRegisterSupplierView />
            )
          )}
          {activeView === 'bancoProveedores' && (
            role === 'PROVEEDOR' ? (
              <div className="max-w-2xl mx-auto mt-12 p-6 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Módulo Restringido por Seguridad</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
                  El Banco de Proveedores Oficiales y la información de auditoría contienen datos confidenciales protegidos bajo la Ley 1581 de 2012 y están reservados exclusivamente para el equipo evaluador interno de Flota Sugamuxi S.A.
                </p>
                <button
                  onClick={() => setActiveView('onboarding')}
                  className="mt-4 px-4 py-2 bg-[#0b1329] dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Volver a Proveedores
                </button>
              </div>
            ) : (
              <BancoProveedoresView />
            )
          )}
          {activeView === 'convocatorias' && (
            <div className="max-w-2xl mx-auto mt-12 p-6 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Módulo No Disponible</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
                El módulo de convocatorias se encuentra temporalmente inhabilitado según directrices institucionales de Flota Sugamuxi S.A.
              </p>
              <button
                onClick={() => setActiveView('onboarding')}
                className="mt-4 px-4 py-2 bg-[#0b1329] dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Volver al Panel Principal
              </button>
            </div>
          )}
          {activeView === 'revisores' && (
            role === 'PROVEEDOR' ? (
              <div className="max-w-2xl mx-auto mt-12 p-6 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Módulo Restringido por Seguridad</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
                  El módulo de Auditoría y Revisión Documental está reservado para Evaluadores Técnicos SIG y Administradores de Flota Sugamuxi S.A.
                </p>
                <button
                  onClick={() => setActiveView('onboarding')}
                  className="mt-4 px-4 py-2 bg-[#0b1329] dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Volver a Proveedores
                </button>
              </div>
            ) : (
              <InternalReviewView />
            )
          )}
          {activeView === 'adminForms' && (
            role === 'PROVEEDOR' ? (
              <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Módulo Restringido</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
                  La administración de versiones de Formatos Institucionales SIG está reservada para el personal interno de Flota Sugamuxi S.A.
                </p>
                <button
                  onClick={() => setActiveView('onboarding')}
                  className="mt-4 px-4 py-2 bg-[#0b1329] dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Volver a Proveedores
                </button>
              </div>
            ) : (
              <InstitutionalFormsAdmin />
            )
          )}
          {(activeView === 'parametrizacion' || activeView === 'documentMatrix') && (
            role !== 'ADMIN' ? (
              <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Acceso Exclusivo de Administrador General</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
                  El proceso de parametrización del sistema y métodos de evaluación solo puede ser realizado por el Administrador General de Flota Sugamuxi S.A.
                </p>
                <button
                  onClick={() => setActiveView(role === 'PROVEEDOR' ? 'onboarding' : 'revisores')}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {role === 'PROVEEDOR' ? 'Volver a Inicio / Proveedores' : 'Ir al Dashboard Ejecutivo'}
                </button>
              </div>
            ) : (
              activeView === 'documentMatrix' ? <AdminParametrizationView initialTab="matrix_base" /> : <AdminParametrizationView />
            )
          )}
          {activeView === 'evaluaciones' && (
            role === 'PROVEEDOR' ? (
              <div className="max-w-2xl mx-auto mt-12 p-6 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Módulo Restringido a Evaluadores SIG</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
                  El Sistema de Calificación Inicial y Desempeño Anual está reservado para el cuerpo de Revisores Técnicos y Administradores de Flota Sugamuxi S.A.
                </p>
                <button
                  onClick={() => setActiveView('onboarding')}
                  className="mt-4 px-4 py-2 bg-[#0b1329] dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Volver a Proveedores
                </button>
              </div>
            ) : (
              <SupplierEvaluationsView />
            )
          )}
          {activeView === 'auditoria' && <AuditLogView />}
          {activeView === 'informesExcel' && (
            role === 'PROVEEDOR' ? (
              <div className="max-w-2xl mx-auto mt-12 p-6 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Módulo Restringido</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
                  La exportación de informes consolidados en Excel contiene datos confidenciales y está reservada para personal administrativo y evaluador de Flota Sugamuxi S.A.
                </p>
                <button
                  onClick={() => setActiveView('onboarding')}
                  className="mt-4 px-4 py-2 bg-[#0b1329] dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Volver a Proveedores
                </button>
              </div>
            ) : (
              <ExcelReportsView />
            )
          )}
        </main>

        {/* Institutional Footer */}
        <footer className="bg-white dark:bg-[#0b1329] border-t border-slate-200 dark:border-slate-800/80 mt-auto transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-[10px] italic shadow-xs">
                  FS
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-200">FLOTA SUGAMUXI S.A.</span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">NIT: 891.800.089-1 &bull; Sogamoso, Boyacá</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px]">
                <div className="text-slate-600 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-[#121c38] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  Desarrollado por <span className="text-blue-600 dark:text-cyan-400 font-bold">Julian Salgado</span> | Flota Sugamuxi S.A
                </div>
                <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
                <button
                  onClick={() => setIsHabeasDataOpen(true)}
                  className="text-blue-600 dark:text-cyan-400 hover:text-blue-800 dark:hover:text-cyan-300 font-semibold underline cursor-pointer"
                >
                  Tratamiento de Datos
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="text-slate-400 dark:text-slate-500">SIGEPRO v2.1.0 &copy; {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
        </footer>

      </div>

      {/* Registration Modal */}
      <SupplierRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegisteredSuccess={handleRegisteredSuccess}
      />

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={isEmailVerifyModalOpen}
        onClose={() => setIsEmailVerifyModalOpen(false)}
        dossierId={pendingVerifyDossierId}
        targetEmail={pendingEmail}
        simulatedCode={simulatedCode}
        onVerifiedSuccess={handleVerifiedSuccess}
      />

      {/* Habeas Data Modal */}
      {isHabeasDataOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh] sm:max-h-[88vh]">
            <div className="bg-[#0b1329] text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 border border-blue-400/40 flex items-center justify-center text-cyan-300 shadow-2xs shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wide">
                    Política de Tratamiento de Datos Personales
                  </h3>
                  <p className="text-[11px] text-cyan-300">Ley Estatutaria 1581 de 2012 &bull; Flota Sugamuxi S.A.</p>
                </div>
              </div>
              <button
                onClick={() => setIsHabeasDataOpen(false)}
                className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 text-xs text-slate-700 dark:text-slate-300 space-y-4 overflow-y-auto flex-1 leading-relaxed">
              <p>
                <strong>FLOTA SUGAMUXI S.A.</strong>, identificada con NIT 891.800.089-1, como responsable del tratamiento de los datos personales suministrados en la plataforma <strong>SIGEPRO</strong>, informa que la información recolectada tiene como finalidad exclusiva:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
                <li>La evaluación, validación técnica, financiera y jurídica de las postulaciones de proveedores.</li>
                <li>La consulta y verificación de antecedentes en listas vinculantes SARLAFT, OFAC, Procuraduría y Policía Nacional.</li>
                <li>El despacho de notificaciones oficiales sobre el estado de habilitación, observaciones o subsanaciones documentales.</li>
                <li>La conformación y custodia del expediente digital conforme a la norma ISO 9001 y el Sistema Integrado de Gestión (SIG).</li>
              </ul>
              <p>
                El titular de los datos tiene derecho a conocer, actualizar, rectificar y suprimir su información, así como a revocar la autorización otorgada, mediante solicitud dirigida al correo: <strong className="text-blue-900 dark:text-cyan-400">protecciondatos@flotasugamuxi.com</strong> o en nuestra sede principal en Sogamoso, Boyacá.
              </p>
              <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-950 dark:text-blue-200 font-medium">
                Al diligenciar los formatos <strong>FS.GA-FOR-009</strong> y <strong>FS.GA-FOR-039</strong>, el postulante manifiesta su aceptación libre, previa y voluntaria para el tratamiento de sus datos institucionales y de contacto.
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setIsHabeasDataOpen(false)}
                className="px-5 py-2.5 bg-[#0b1329] dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Entendido y Aceptado
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
