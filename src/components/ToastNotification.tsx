import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { BrandSwoosh } from './ui/BrandSwoosh';
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
    success: { Icon: CheckCircle2, label: 'Listo', tone: '#69bdd7', tile: 'from-[#2c84c4] to-[#69bdd7]', glow: 'rgba(105,189,215,0.45)' },
    error: { Icon: AlertCircle, label: 'Error', tone: '#f87171', tile: 'from-red-500 to-red-400', glow: 'rgba(248,113,113,0.45)' },
    warning: { Icon: AlertTriangle, label: 'Atención', tone: '#69bdd7', tile: 'from-[#2c84c4] to-[#69bdd7]', glow: 'rgba(105,189,215,0.45)' },
    info: { Icon: ShieldCheck, label: 'Aviso del sistema', tone: '#69bdd7', tile: 'from-[#2c84c4] to-[#69bdd7]', glow: 'rgba(105,189,215,0.45)' },
  } as const;
  const v = VIEW[toast.type || 'info'];
  const Icon = v.Icon;

  return (
    <div
      id="global-fixed-toast-notification"
      className="fixed top-4 right-4 z-[99999] pointer-events-auto max-w-[300px] w-[calc(100vw-2rem)] select-none animate-fade-up"
      style={{ position: 'fixed' }}
      role="status"
    >
      <div
        className="gradient-border relative overflow-hidden rounded-xl bg-[#131b2e]/95 text-white backdrop-blur-xl"
        style={{ boxShadow: `0 24px 50px -18px rgba(3,10,30,0.8), 0 0 40px -12px ${v.glow}` }}
      >
        <BrandSwoosh className="absolute -right-8 -bottom-10 w-40 opacity-30" />
        <div className="relative flex items-start gap-2.5 pl-3 pr-2 py-2.5">
          <span className={`flex w-8 h-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${v.tile} text-white`} style={{ boxShadow: `0 8px 20px -8px ${v.glow}` }}>
            <Icon className="w-4 h-4" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="font-display text-[13px] font-semibold leading-tight">{toast.title || v.label}</div>
            <p className="text-[12px] text-white/70 leading-snug mt-0.5 break-words line-clamp-3">{toast.message}</p>
            <div className="hidden"></div>
          </div>
          <button
            onClick={hideToast}
            className="text-white/50 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Cerrar notificación"
            aria-label="Cerrar notificación"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="relative h-1 bg-white/10">
          <div
            className="h-full transition-all duration-75 ease-linear"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%`, background: `linear-gradient(90deg, #2c84c4, ${v.tone})` }}
          />
        </div>
      </div>
    </div>
  );
};
