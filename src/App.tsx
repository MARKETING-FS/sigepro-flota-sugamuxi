import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { InternalReviewView } from './components/InternalReviewView';
import { InstitutionalFormsAdmin } from './components/InstitutionalFormsAdmin';
import { BancoProveedoresView } from './components/BancoProveedoresView';
import { AuditLogView } from './components/AuditLogView';
import { ExcelReportsView } from './components/ExcelReportsView';
import { AdminRegisterSupplierView } from './components/AdminRegisterSupplierView';
import { AdminParametrizationView } from './components/AdminParametrizationView';
import { SupplierEvaluationsView } from './components/evaluations/SupplierEvaluationsView';
import { CorporateLoginView } from './components/CorporateLoginView';
import { ToastNotification } from './components/ToastNotification';
import { PushAlertFloatingToast } from './components/notifications/PushAlertFloatingToast';
import {
  ShieldCheck,
  Lock,
  X,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    activeView,
    setActiveView,
    role,
  } = useApp();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
  }, [activeView]);

  // Registrar proveedor: lo hace el personal interno desde su propio módulo
  const handleOpenRegister = () => {
    setActiveView('registrarProveedor');
  };

  // Full-page Corporate Login View
  if (activeView === 'login') {
    return (
      <div className="h-screen w-full overflow-hidden bg-slate-100 dark:bg-[#060b18] flex flex-col font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-200 dark:selection:bg-blue-900 transition-colors duration-200">
        <ToastNotification />
        <PushAlertFloatingToast />
        <CorporateLoginView
          onOpenHabeasDataModal={() => setIsHabeasDataOpen(true)}
          onBackToApp={() => setActiveView('revisores')}
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

        {/* Dynamic Views */}
        <main className="flex-1 pb-10">
          {activeView === 'registrarProveedor' && <AdminRegisterSupplierView />}
          {activeView === 'bancoProveedores' && <BancoProveedoresView />}
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
                onClick={() => setActiveView('revisores')}
                className="mt-4 px-4 py-2 bg-[#0b1329] dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Volver al Panel Principal
              </button>
            </div>
          )}
          {activeView === 'revisores' && <InternalReviewView />}
          {activeView === 'adminForms' && <InstitutionalFormsAdmin />}
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
                onClick={() => setActiveView('revisores')}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Ir al Dashboard Ejecutivo
              </button>
            </div>
            ) : (
              activeView === 'documentMatrix' ? <AdminParametrizationView initialTab="matrix_base" /> : <AdminParametrizationView />
            )
          )}
          {activeView === 'evaluaciones' && <SupplierEvaluationsView />}
          {activeView === 'auditoria' && <AuditLogView />}
          {activeView === 'informesExcel' && <ExcelReportsView />}
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
