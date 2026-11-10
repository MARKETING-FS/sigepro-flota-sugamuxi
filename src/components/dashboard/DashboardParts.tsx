import React from 'react';
import { Crown } from 'lucide-react';
import { BrandSwoosh } from '../ui/BrandSwoosh';
import { useCountUp } from '../../hooks/useCountUp';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
};

const Chip: React.FC<{ label: string; value: number; dot: string; decimals?: boolean }> = ({ label, value, dot }) => {
  const n = useCountUp(value);
  return (
    <div className="min-w-44 rounded-2xl bg-[#0b1329]/35 border border-white/20 backdrop-blur-[2px] [text-shadow:0_1px_8px_rgba(0,0,0,0.6)] px-4 py-3">
      <p className="flex items-center gap-2 text-[11px] text-white/80">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} /> {label}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold">{n}</p>
    </div>
  );
};

/** Medidor circular animado */
const Gauge: React.FC<{ value: number }> = ({ value }) => {
  const n = useCountUp(value);
  const r = 62;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto w-40 h-40">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="14" />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="#69bdd7"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.2,0.8,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-3xl font-semibold leading-none">{n}%</div>
          <div className="mt-1 text-[10px] text-white/60">cumplimiento</div>
        </div>
      </div>
    </div>
  );
};

export const DashboardHero: React.FC<{
  userName: string;
  dateLabel: string;
  scopeLabel: string;
  critical: number;
  pendingEval: number;
  health: number;
  alerts: number;
  habilitados: number;
  avg: number | null;
  onRegister: () => void;
  onEvaluate: () => void;
}> = ({ userName, dateLabel, scopeLabel, critical, pendingEval, health, alerts, habilitados, avg, onRegister, onEvaluate }) => (
  <section className="relative overflow-hidden rounded-[28px] bg-[#131b2e] text-white shadow-glow animate-fade-up">
    <img src="/nd/dashboard-bus.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-[right_78%]" />
    <div className="absolute inset-0 bg-gradient-to-r from-[#131b2e]/95 via-[#131b2e]/60 to-transparent" />
    <div className="absolute inset-0 grid-pattern opacity-30 [mask-image:linear-gradient(to_right,black,transparent_60%)]" />
    <BrandSwoosh className="absolute -bottom-20 -right-16 w-[55%] opacity-100" />

    <div className="relative grid gap-8 p-6 md:p-10 xl:grid-cols-[1fr_auto] xl:items-center">
      <div className="max-w-2xl">
        <p className="inline-flex items-center gap-2 rounded-full glass-dark px-3 py-1 text-xs text-white/80">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2c84c4] animate-pulse" /> {dateLabel} · {scopeLabel}
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold leading-tight md:text-5xl">
          {greeting()},
          <br />
          <span className="text-gradient-brand">{userName || 'equipo'}</span>
        </h1>
        <p className="mt-4 max-w-lg text-sm text-white/75 md:text-base">
          Hay <strong className="text-white">{critical}</strong> {critical === 1 ? 'expediente con vencimientos' : 'expedientes con vencimientos'} por resolver y{' '}
          <strong className="text-white">{pendingEval}</strong> {pendingEval === 1 ? 'evaluación pendiente' : 'evaluaciones pendientes'}.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRegister}
            className="shimmer inline-flex items-center gap-2 h-11 rounded-xl px-5 bg-gradient-brand text-white text-sm font-semibold shadow-glow hover:opacity-95 cursor-pointer"
          >
            + Registrar proveedor
          </button>
          <button
            type="button"
            onClick={onEvaluate}
            className="inline-flex items-center gap-2 h-11 rounded-xl px-5 glass-dark text-white text-sm font-semibold hover:bg-white/10 cursor-pointer"
          >
            Evaluar proveedores
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="rounded-3xl bg-[#0b1329]/35 border border-white/20 backdrop-blur-[2px] [text-shadow:0_1px_8px_rgba(0,0,0,0.6)] p-5">
          <p className="text-xs text-white/80">Salud documental</p>
          <Gauge value={health} />
        </div>
        <div className="hidden flex-col gap-3 sm:flex">
          <Chip label="Alertas abiertas" value={alerts} dot="bg-red-500" />
          <Chip label="Proveedores habilitados" value={habilitados} dot="bg-[#2c84c4]" />
          <Chip label="Puntaje promedio" value={avg === null ? 0 : Math.round(avg)} dot="bg-[#69bdd7]" />
        </div>
      </div>
    </div>
  </section>
);

type KpiTone = 'primary' | 'info' | 'warning' | 'danger';
const KPI_TONE: Record<KpiTone, { tile: string; bar: string; glow: string }> = {
  primary: { tile: 'from-[#2c84c4] to-[#69bdd7] text-white', bar: 'from-[#2c84c4] to-[#69bdd7]', glow: 'bg-[#2c84c4]/20' },
  info: { tile: 'from-[#69bdd7] to-[#2c84c4] text-white', bar: 'from-[#69bdd7] to-[#2c84c4]', glow: 'bg-[#69bdd7]/25' },
  warning: { tile: 'from-[#2c84c4] to-[#69bdd7] text-[#3b2a06]', bar: 'from-[#2c84c4] to-[#69bdd7]', glow: 'bg-[#2c84c4]/25' },
  danger: { tile: 'from-red-500 to-red-400 text-white', bar: 'from-red-500 to-red-400', glow: 'bg-red-500/20' },
};

export const Kpi: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  hint: string;
  progress: number;
  tone?: KpiTone;
  delay?: number;
  onClick?: () => void;
}> = ({ icon: Icon, label, value, hint, progress, tone = 'primary', delay = 0, onClick }) => {
  const n = useCountUp(value);
  const t = KPI_TONE[tone];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`fs-card lift animate-fade-up relative overflow-hidden rounded-2xl text-left p-5 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl ${t.glow}`} />
      <div className="relative">
        <div className="flex items-start justify-between">
          <p className="max-w-[10rem] text-sm text-[#3a5274] dark:text-slate-400">{label}</p>
          <span className={`flex w-11 h-11 items-center justify-center rounded-2xl shadow-card bg-gradient-to-br ${t.tile}`}>
            <Icon className="w-5 h-5" />
          </span>
        </div>
        <p className="mt-3 font-display text-4xl font-semibold tracking-tight text-[#0b1d3a] dark:text-white tabular-nums">{n}</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e3eaf3] dark:bg-white/10">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${t.bar}`}
            style={{ width: `${Math.max(4, Math.min(100, progress))}%`, transition: 'width 1s cubic-bezier(0.2,0.8,0.2,1)' }}
          />
        </div>
        <p className="mt-2 text-xs text-[#3a5274] dark:text-slate-400">{hint}</p>
      </div>
    </Tag>
  );
};

/** Dona con las etapas de los expedientes */
export const StageDonut: React.FC<{
  parts: Array<{ key: string; label: string; color: string; count: number }>;
  onSelect?: (key: string) => void;
}> = ({ parts, onSelect }) => {
  const visible = parts.filter((p) => p.count > 0);
  const total = visible.reduce((a, p) => a + p.count, 0);
  const total_n = useCountUp(total);
  const r = 70;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-[210px] h-[210px]">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(120,140,170,0.15)" strokeWidth="26" />
          {total > 0 &&
            visible.map((p) => {
              const len = (p.count / total) * c;
              const gap = visible.length > 1 ? 3 : 0;
              const el = (
                <circle
                  key={p.key}
                  cx="100"
                  cy="100"
                  r={r}
                  fill="none"
                  stroke={p.color}
                  strokeWidth="26"
                  strokeDasharray={`${Math.max(0, len - gap)} ${c}`}
                  strokeDashoffset={-acc}
                  className="cursor-pointer"
                  onClick={() => onSelect?.(p.key)}
                >
                  <title>{`${p.label}: ${p.count}`}</title>
                </circle>
              );
              acc += len;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center pointer-events-none">
          <div>
            <div className="font-display text-3xl font-semibold text-[#0b1d3a] dark:text-white">{total_n}</div>
            <div className="text-xs text-[#3a5274] dark:text-slate-400">expedientes</div>
          </div>
        </div>
      </div>
      <div className="grid w-full grid-cols-2 gap-2">
        {visible.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onSelect?.(p.key)}
            className="flex items-center gap-2.5 rounded-xl border border-[#d9e3ef] dark:border-white/10 bg-[#f1f6fc]/60 dark:bg-white/5 px-3 py-2 text-left cursor-pointer hover:border-[#2c84c4]/50 transition-colors"
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="flex-1 text-[13px] text-[#3a5274] dark:text-slate-300 truncate">{p.label}</span>
            <span className="font-display font-semibold text-[#0b1d3a] dark:text-white">{p.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/** Podio de los tres mejores puntajes */
export const Podium: React.FC<{
  items: Array<{ id: string; name: string; sub: string; score: number }>;
  onOpen: (id: string) => void;
}> = ({ items, onOpen }) => (
  <div className="grid gap-4 md:grid-cols-3">
    {items.map((it, i) => (
      <button
        key={it.id}
        type="button"
        onClick={() => onOpen(it.id)}
        style={{ animationDelay: `${i * 90}ms` }}
        className={`fs-card lift animate-fade-up relative overflow-hidden rounded-2xl text-left ${i === 0 ? 'gradient-border' : ''} cursor-pointer`}
      >
        {i === 0 && <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-[#69bdd7]/20 blur-2xl" />}
        <div className="relative flex items-center gap-4 p-5">
          <span
            className={`flex w-12 h-12 items-center justify-center rounded-2xl font-display text-lg font-semibold ${
              i === 0 ? 'bg-gradient-brand text-white shadow-glow' : 'bg-[#e3eaf3] text-[#0b1d3a] dark:bg-white/10 dark:text-white'
            }`}
          >
            {i === 0 ? <Crown className="w-5 h-5" /> : i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-widest text-[#3a5274] dark:text-slate-400">{i === 0 ? 'Mejor proveedor' : `Puesto ${i + 1}`}</p>
            <p className="truncate font-semibold text-[#0b1d3a] dark:text-white">{it.name}</p>
            <p className="truncate text-xs text-[#3a5274] dark:text-slate-400">{it.sub}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-semibold text-gradient-primary">{Math.round(it.score)}</p>
            <p className="text-[11px] text-[#3a5274] dark:text-slate-400">puntos</p>
          </div>
        </div>
      </button>
    ))}
  </div>
);
