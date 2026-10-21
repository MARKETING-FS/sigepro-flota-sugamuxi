import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onClose?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class EvaluationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('EvaluationErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-300 dark:border-slate-800 shadow-2xl w-full max-w-lg p-6 text-slate-800 dark:text-slate-100">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {this.props.fallbackTitle || 'Aviso en el Módulo de Evaluaciones'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Se presentó una inconsistencia al procesar los datos del formulario. El sistema ha protegido el estado para evitar el cierre inesperado.
                </p>
                {this.state.error && (
                  <div className="mt-3 p-2.5 bg-slate-100 dark:bg-slate-900/90 rounded-lg text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 break-all max-h-24 overflow-y-auto">
                    {this.state.error.message}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    type="button"
                    onClick={this.handleReset}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reintentar</span>
                  </button>
                  {this.props.onClose && (
                    <button
                      type="button"
                      onClick={this.props.onClose}
                      className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cerrar</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
