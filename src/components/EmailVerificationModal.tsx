import React, { useState } from 'react';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dossierId: string | null;
  targetEmail: string;
  simulatedCode: string;
  onVerifiedSuccess: () => void;
}

export const EmailVerificationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  dossierId,
  targetEmail,
  simulatedCode,
  onVerifiedSuccess,
}) => {
  const { verifySupplierEmail } = useApp();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !dossierId) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Por favor ingrese el código de 6 dígitos.');
      return;
    }

    const verified = verifySupplierEmail(dossierId, code.trim());
    if (verified) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onVerifiedSuccess();
      }, 1200);
    } else {
      setError('El código ingresado no es válido. Puede usar el código generado de prueba.');
    }
  };

  const handleAutoFillCode = () => {
    setCode(simulatedCode || '849201');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
        
        {/* Top bar */}
        <div className="bg-[#0b1329] text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 border border-blue-400/40 flex items-center justify-center text-white shadow-xs">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Verificación de Correo Electrónico</h3>
              <p className="text-[11px] text-cyan-300">Seguridad Flota Sugamuxi S.A.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-2 shadow-2xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Confirme su dirección de correo</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hemos enviado un código de verificación de 6 dígitos a la dirección:
              <br />
              <strong className="text-slate-900 font-bold">{targetEmail}</strong>
            </p>
          </div>

          {/* Test Simulator Helper Box */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-950 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[10px] text-blue-700 font-extrabold uppercase block">Código generado:</span>
              <span className="font-mono text-base font-extrabold text-blue-950 tracking-wider">
                {simulatedCode || '849201'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAutoFillCode}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Autocompletar código
            </button>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                Ingrese el código de 6 dígitos
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError('');
                }}
                placeholder="123456"
                className="w-full text-center text-2xl font-mono tracking-widest py-3 rounded-xl border-2 border-slate-300 focus:border-blue-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-black text-slate-900 bg-slate-50 focus:bg-white transition-colors"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl text-slate-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {isSuccess && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 text-xs flex items-center justify-center gap-2 font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>¡Correo verificado con éxito! Ingresando al onboarding...</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSuccess}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Verificar y Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[11px] text-slate-400 text-center">
            * Requisito obligatorio según el Sistema Integrado de Gestión de Flota Sugamuxi S.A.
          </p>
        </div>

      </div>
    </div>
  );
};
