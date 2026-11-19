import React from 'react';
import { Check } from 'lucide-react';
import { inputCls } from '../ui/archive';

/** Casilla de texto con el diseño de la aplicación (alto 44 px, borde suave, anillo azul al enfocar) */
export const fieldCls = `${inputCls} w-full h-11 !rounded-xl font-medium`;
export const fieldWithIconCls = `${fieldCls} !pl-11`;
export const selectFieldCls = `${fieldCls} cursor-pointer font-semibold`;
export const textareaCls = `${inputCls} w-full !rounded-xl py-3 font-medium leading-relaxed resize-y min-h-[96px]`;

/** Etiqueta + casilla + ayuda + error, siempre con la misma separación */
export const Field: React.FC<{
  label: string;
  required?: boolean;
  hint?: string;
  error?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ label, required, hint, error, className = '', children }) => (
  <div className={className}>
    <label className="block text-sm font-semibold text-[#0b1d3a] dark:text-slate-100 mb-1.5">
      {label}
      {required && <span className="ml-1 text-[#0a5473] dark:text-[#5db2c9]">*</span>}
    </label>
    {children}
    {hint && !error && <p className="mt-1.5 text-xs text-[#3a5274] dark:text-slate-400">{hint}</p>}
    {error}
  </div>
);

/** Casilla con un ícono dentro, a la izquierda */
export const IconInput: React.FC<{ icon: React.ElementType; children: React.ReactNode }> = ({ icon: Icon, children }) => (
  <div className="relative">
    <Icon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#3a5274] dark:text-slate-300" strokeWidth={1.8} />
    {children}
  </div>
);

/** Bloque del formulario: título con ícono y su contenido */
export const FormSection: React.FC<{
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ icon: Icon, title, subtitle, aside, className = '', children }) => (
  <section className={`fs-card rounded-2xl p-5 sm:p-6 ${className}`}>
    <header className="flex items-start justify-between gap-4 mb-5">
      <div className="flex items-start gap-3.5 min-w-0">
        <span className="grid place-items-center w-10 h-10 shrink-0 rounded-xl bg-[#e6f2f6] dark:bg-white/10 text-[#0a5473] dark:text-[#5db2c9]">
          <Icon className="w-5 h-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold text-[#0b1d3a] dark:text-white">{title}</h2>
          {subtitle && <p className="text-[13px] text-[#3a5274] dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </header>
    {children}
  </section>
);

/** Tarjeta de elección única (una sola puede estar marcada) */
export const ChoiceCard: React.FC<{
  selected: boolean;
  onClick: () => void;
  icon?: React.ElementType;
  title: string;
  description?: string;
  tag?: string;
}> = ({ selected, onClick, icon: Icon, title, description, tag }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    onClick={onClick}
    className={`group w-full text-left rounded-2xl border p-4 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a5473] ${
      selected
        ? 'border-[#0a5473] bg-[#e6f2f6] dark:bg-[#0b3347] dark:border-[#5ec3eb] shadow-[0_0_0_1px_#0a5473] dark:shadow-[0_0_0_1px_#5ec3eb]'
        : 'border-[#d9e3ef] dark:border-white/15 bg-white dark:bg-white/[0.03] hover:border-[#0a5473]/60 hover:bg-[#f4f8fd] dark:hover:bg-white/[0.06]'
    }`}
  >
    <div className="flex items-start gap-3">
      {Icon && (
        <span
          className={`grid place-items-center w-10 h-10 shrink-0 rounded-xl transition-colors ${
            selected ? 'bg-[#0a5473] text-white' : 'bg-[#e6f2f6] dark:bg-white/10 text-[#0a5473] dark:text-[#5db2c9]'
          }`}
        >
          <Icon className="w-5 h-5" strokeWidth={1.8} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-[15px] text-[#0b1d3a] dark:text-white">{title}</span>
          {tag && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-white/10 text-[#0a5473] dark:text-[#5db2c9] border border-[#d9e3ef] dark:border-white/15">
              {tag}
            </span>
          )}
        </div>
        {description && <p className="mt-1 text-[13px] leading-snug text-[#3a5274] dark:text-slate-400">{description}</p>}
      </div>
      <span
        className={`grid place-items-center w-5 h-5 mt-0.5 shrink-0 rounded-full border-2 transition-colors ${
          selected ? 'bg-[#0a5473] border-[#0a5473] text-white' : 'border-[#b9c8dc] dark:border-white/30'
        }`}
      >
        {selected && <Check className="w-3 h-3" strokeWidth={3.5} />}
      </span>
    </div>
  </button>
);

/** Barra de pasos: círculos numerados unidos por una línea; los pasos ya hechos se pueden volver a abrir */
export const StepBar: React.FC<{
  steps: Array<{ id: number; label: string; icon: React.ElementType }>;
  current: number;
  onGo: (id: number) => void;
}> = ({ steps, current, onGo }) => (
  <nav aria-label="Pasos del registro" className="fs-card rounded-2xl px-4 sm:px-6 py-5">
    <ol className="flex items-start">
      {steps.map((s, i) => {
        const done = current > s.id;
        const active = current === s.id;
        const Icon = s.icon;
        return (
          <li key={s.id} className={`flex items-start ${i < steps.length - 1 ? 'flex-1' : ''}`}>
            <button
              type="button"
              onClick={() => onGo(s.id)}
              aria-current={active ? 'step' : undefined}
              className="group flex flex-col items-center gap-2 w-24 sm:w-32 shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0a5473] rounded-lg"
            >
              <span
                className={`grid place-items-center w-11 h-11 rounded-full border-2 transition-colors ${
                  active
                    ? 'bg-[#0a5473] border-[#0a5473] text-white shadow-[0_8px_18px_-8px_rgba(10,84,115,0.9)]'
                    : done
                    ? 'bg-[#0a4561] border-[#0a4561] text-white dark:bg-[#1a8bb0] dark:border-[#1a8bb0]'
                    : 'bg-white dark:bg-transparent border-[#c3d2e4] dark:border-white/25 text-[#3a5274] dark:text-slate-300 group-hover:border-[#0a5473]'
                }`}
              >
                {done ? <Check className="w-5 h-5" strokeWidth={3} /> : <Icon className="w-5 h-5" strokeWidth={1.8} />}
              </span>
              <span className="text-center leading-tight">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-[#3a5274] dark:text-slate-400">Paso {s.id}</span>
                <span className={`block text-[13px] font-semibold ${active ? 'text-[#0b1d3a] dark:text-white' : 'text-[#3a5274] dark:text-slate-300'}`}>{s.label}</span>
              </span>
            </button>
            {i < steps.length - 1 && (
              <span className={`mt-[22px] h-0.5 flex-1 rounded-full ${done ? 'bg-[#0a4561] dark:bg-[#1a8bb0]' : 'bg-[#d9e3ef] dark:bg-white/15'}`} />
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);
