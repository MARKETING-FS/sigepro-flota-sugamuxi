import React from 'react';
import { ArrowUpRight } from 'lucide-react';

/** Tendencia: puntaje promedio por mes (gráfica de área con trazo animado) */
export const TrendChart: React.FC<{ data: Array<{ label: string; value: number | null }> }> = ({ data }) => {
  const W = 640, H = 240, L = 34, R = 12, T = 14, B = 28;
  const min = 40, max = 100;
  const x = (i: number) => L + (i * (W - L - R)) / Math.max(1, data.length - 1);
  const y = (v: number) => T + (1 - (Math.min(max, Math.max(min, v)) - min) / (max - min)) * (H - T - B);
  const valid = data
    .map((d, i) => (d.value === null ? null : ([x(i), y(d.value)] as [number, number])))
    .filter((p): p is [number, number] => !!p);
  const line = valid.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  const area = valid.length ? `${line} L${valid[valid.length - 1][0]},${H - B} L${valid[0][0]},${H - B} Z` : '';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[260px]" role="img" aria-label="Puntaje promedio por mes">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2c84c4" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#69bdd7" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[40, 55, 70, 85, 100].map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="currentColor" strokeOpacity="0.12" strokeDasharray="4 4" />
          <text x={L - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="currentColor" fillOpacity="0.55">{t}</text>
        </g>
      ))}
      {data.map((d, i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="currentColor" fillOpacity="0.55">{d.label}</text>
      ))}
      {area && <path d={area} fill="url(#trendFill)" className="animate-fade-up" />}
      {line && (
        <path
          d={line}
          pathLength={1}
          fill="none"
          stroke="#2c84c4"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'nd-draw 1.8s cubic-bezier(0.6,0,0.2,1) forwards' }}
        />
      )}
      {valid.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="4.5" fill="var(--nd-card)" stroke="#2c84c4" strokeWidth="2.5" />
      ))}
    </svg>
  );
};

/** Barras horizontales con degradado y ancho animado */
export const BarList: React.FC<{ items: Array<{ label: string; value: number }> }> = ({ items }) => {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3.5">
      {items.map((it, i) => (
        <li key={it.label}>
          <div className="flex items-center justify-between gap-3 text-sm mb-1.5">
            <span className="truncate text-[#0b1d3a] dark:text-slate-200">{it.label}</span>
            <span className="font-display font-semibold text-[#0b1d3a] dark:text-white tabular-nums">{it.value}</span>
          </div>
          <div className="h-2.5 rounded-full bg-[#e3eaf3] dark:bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2c84c4] to-[#69bdd7]"
              style={{ width: `${(it.value / max) * 100}%`, transformOrigin: 'left', animation: `nd-grow 1s cubic-bezier(0.2,0.8,0.2,1) ${i * 70}ms both` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
};

/** Clasificación A / B / C según el último puntaje */
export const GradeBars: React.FC<{ grades: { A: number; B: number; C: number } }> = ({ grades }) => {
  const total = grades.A + grades.B + grades.C || 1;
  const rows = [
    { k: 'A' as const, label: 'Excelente', range: '85–100', bar: 'from-[#2c84c4] to-[#69bdd7]' },
    { k: 'B' as const, label: 'Aceptable', range: '70–84', bar: 'from-[#69bdd7] to-[#69bdd7]/60' },
    { k: 'C' as const, label: 'Crítico', range: 'menos de 70', bar: 'from-red-500 to-red-400/60' },
  ];
  return (
    <div className="space-y-4">
      {rows.map((g) => (
        <div key={g.k}>
          <div className="mb-1.5 flex items-center gap-3">
            <span className="flex w-9 h-9 items-center justify-center rounded-xl bg-[#e3eaf3] dark:bg-white/10 font-display text-lg font-semibold text-[#0b1d3a] dark:text-white">{g.k}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#0b1d3a] dark:text-white">{g.label}</p>
              <p className="text-xs text-[#3a5274] dark:text-slate-400">{g.range} puntos</p>
            </div>
            <span className="font-display text-xl font-semibold text-[#0b1d3a] dark:text-white">{grades[g.k]}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#e3eaf3] dark:bg-white/10">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${g.bar}`}
              style={{ width: `${(grades[g.k] / total) * 100}%`, transformOrigin: 'left', animation: 'nd-grow 1s cubic-bezier(0.2,0.8,0.2,1) both' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

/** Línea de tiempo de actividad reciente */
export const ActivityTimeline: React.FC<{
  items: Array<{ id: string; title: string; badge: string; when: string; detail: string }>;
}> = ({ items }) => (
  <ol className="relative ml-2 space-y-5 border-l border-[#d9e3ef] dark:border-white/15 pl-6">
    {items.map((a, i) => (
      <li key={a.id} className="relative animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
        <span className="absolute -left-[31px] top-1 flex w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#131b2e] bg-[#2c84c4] ring-4 ring-[#2c84c4]/15" />
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-[#0b1d3a] dark:text-white">{a.title}</span>
          <span className="rounded-md bg-[#e3eaf3] dark:bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-[#3a5274] dark:text-slate-300">{a.badge}</span>
          <span className="ml-auto text-xs text-[#3a5274] dark:text-slate-400">{a.when}</span>
        </div>
        <p className="mt-0.5 text-sm text-[#3a5274] dark:text-slate-400 truncate">{a.detail}</p>
      </li>
    ))}
  </ol>
);

/** Alertas prioritarias: lo que hay que atender primero */
export const PriorityAlerts: React.FC<{
  items: Array<{ id: string; title: string; message: string; critical: boolean }>;
  onOpen: (id: string) => void;
}> = ({ items, onOpen }) => (
  <div className="space-y-2">
    {items.map((a, i) => (
      <button
        key={a.id}
        type="button"
        onClick={() => onOpen(a.id)}
        style={{ animationDelay: `${i * 60}ms` }}
        className="group animate-fade-up w-full flex items-center gap-3 rounded-xl border border-[#d9e3ef] dark:border-white/10 bg-white/60 dark:bg-white/[0.03] px-3 py-2.5 text-left text-sm transition-all hover:border-[#2c84c4]/50 hover:shadow-card cursor-pointer"
      >
        <span className={`h-9 w-1 rounded-full shrink-0 ${a.critical ? 'bg-red-500' : 'bg-[#2c84c4]'}`} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-[#0b1d3a] dark:text-white">{a.title}</span>
          <span className="block truncate text-xs text-[#3a5274] dark:text-slate-400">{a.message}</span>
        </span>
        <ArrowUpRight className="w-4 h-4 text-[#3a5274] dark:text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#2c84c4]" />
      </button>
    ))}
  </div>
);
