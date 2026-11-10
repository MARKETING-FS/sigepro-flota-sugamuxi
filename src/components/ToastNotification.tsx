import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  ShieldCheck,
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

  const VIEW = {
    success: { Icon: CheckCircle2, label: 'Listo', red: false },
    error: { Icon: AlertCircle, label: 'Error', red: true },
    warning: { Icon: AlertTriangle, label: 'Atención', red: false },
    info: { Icon: ShieldCheck, label: 'Aviso del sistema', red: false },
  } as const;
  const v = VIEW[toast.type || 'info'];
  const Icon = v.Icon;

  return (
    <div
      id="global-fixed-toast-notification"
      className="fixed top-[4.75rem] right-4 z-[99999] pointer-events-auto max-w-[340px] w-[calc(100vw-2rem)] select-none animate-fade-up"
      style={{ position: 'fixed' }}
      role="status"
    >
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#0f1a33] border border-black/[0.08] dark:border-white/10 shadow-[0_18px_44px_-14px_rgba(11,29,58,0.35)] dark:shadow-[0_22px_50px_-16px_rgba(0,0,0,0.8)]">
        <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${v.red ? 'bg-red-500' : 'bg-gradient-to-b from-[#69bdd7] to-[#2c84c4]'}`} />
        <div className="flex items-start gap-3 pl-5 pr-2.5 py-3">
          <span className={`grid place-items-center w-9 h-9 shrink-0 rounded-full ${v.red ? 'bg-red-500/12 text-red-600 dark:text-red-400' : 'bg-[#2c84c4]/12 dark:bg-[#2c84c4]/25 text-[#1d5fa8] dark:text-[#69bdd7]'}`}>
            <Icon className="w-[18px] h-[18px]" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="font-display text-[13.5px] font-semibold leading-tight text-[#0b1d3a] dark:text-white">{toast.title || v.label}</div>
            <p className="text-[12.5px] text-[#3a5274] dark:text-slate-300 leading-snug mt-1 break-words line-clamp-3">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={hideToast}
            className="w-7 h-7 grid place-items-center rounded-lg text-[#6b84a3] hover:text-[#0b1d3a] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Cerrar notificación"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="h-[3px] bg-black/[0.05] dark:bg-white/10">
          <div
            className={`h-full transition-all duration-75 ease-linear ${v.red ? 'bg-red-500' : 'bg-gradient-to-r from-[#2c84c4] to-[#69bdd7]'}`}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
