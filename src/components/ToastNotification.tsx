import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { toast, hideToast } = useApp();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) return;

    setProgress(100);
    const duration = toast.duration || 4500;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          hideToast();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => {
      clearInterval(timer);
    };
  }, [toast?.id, toast?.duration, hideToast]);

  if (!toast) return null;

  const typeIcons = {
    success: <CheckCircle2 className="w-5 h-5 text-cyan-300 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-slate-300 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-cyan-300 shrink-0" />,
    info: <ShieldCheck className="w-5 h-5 text-cyan-300 shrink-0" />,
  };

  const typeBadges = {
    success: { label: 'CONFIRMADO', color: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40' },
    error: { label: 'ERROR', color: 'bg-slate-800 text-slate-200 border-slate-600/60' },
    warning: { label: 'ATENCIÓN', color: 'bg-blue-500/20 text-cyan-200 border-blue-400/40' },
    info: { label: 'SISTEMA SIG', color: 'bg-blue-500/20 text-blue-200 border-blue-400/40' },
  };

  const badgeInfo = typeBadges[toast.type || 'info'];

  return (
    <div
      id="global-fixed-toast-notification"
      className="fixed top-5 right-5 sm:top-6 sm:right-6 z-[99999] pointer-events-auto max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)] select-none animate-in fade-in slide-in-from-top-4 duration-300"
      style={{ position: 'fixed' }}
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1329] via-[#0e1c40] to-[#1e3a8a] text-white border border-blue-500/50 shadow-2xl shadow-blue-950/80 backdrop-blur-md">
        
        {/* Glow accent */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />

        <div className="p-4 relative z-10 space-y-2">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600/70 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-xs shrink-0">
                {typeIcons[toast.type || 'info']}
              </div>
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase text-cyan-300 flex items-center gap-1.5">
                  <span>FLOTA SUGAMUXI S.A.</span>
                  <span className="text-slate-400">&bull;</span>
                  <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${badgeInfo.color}`}>
                    {toast.title || badgeInfo.label}
                  </span>
                </span>
              </div>
            </div>

            <button
              onClick={hideToast}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="pl-9 pr-1">
            <p className="text-xs font-semibold text-slate-100 leading-relaxed break-words">
              {toast.message}
            </p>
          </div>
        </div>

        {/* Dynamic Progress Bar in Primary Blue / Cyan */}
        <div className="w-full bg-blue-950/60 h-1 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-600 transition-all duration-75 ease-linear"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
