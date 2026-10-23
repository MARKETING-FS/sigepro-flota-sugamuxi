import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, Trash2, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 [SIGEPRO GlobalErrorBoundary] Error no capturado:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAndReload = () => {
    try {
      // Limpiar solo llaves de sesión y estado de vista de SIGEPRO
      const keysToRemove = [
        'sigepro_active_view',
        'sigepro_role',
        'sigepro_current_dossier',
        'sigepro_review_selected_id',
        'sigepro_supplier_auth',
        'sigepro_supplier_portal_tab',
      ];
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Error al limpiar localStorage:', e);
    }
    window.location.href = '/';
  };

  private handleFullReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Error al limpiar almacenamiento completo:', e);
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#0b1329] text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="max-w-lg w-full bg-[#121c38] border border-blue-900/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in fade-in duration-300">
            {/* Logo / Emblem */}
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-cyan-300 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-blue-950/80 px-3 py-1 rounded-full border border-blue-800">
                SISTEMA DE RECUPERACIÓN • SIGEPRO
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">
                Flota Sugamuxi S.A.
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                Se detectó una discrepancia temporal al sincronizar o renderizar los datos en este dispositivo.
              </p>
            </div>

            {/* Error Message Details */}
            {this.state.error && (
              <div className="text-left bg-[#090f20] border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 font-mono overflow-x-auto max-h-24">
                <div className="text-red-400 font-bold mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Detalle Técnico:</span>
                </div>
                <span>{this.state.error.message || String(this.state.error)}</span>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reintentar Carga del Sistema</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetAndReload}
                className="w-full py-2.5 px-4 bg-[#1a274a] hover:bg-[#20315c] text-cyan-300 border border-blue-700/50 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Restablecer Vistas y Recargar</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-400">
              SIGEPRO v2.1.0 • Flota Sugamuxi S.A. • Nit 891.800.089-1
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
