import React, { useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

/** Un punto de la gráfica de desempeño: la evaluación vigente de un proveedor activo */
export interface SupplierScorePoint {
  /** Identificador de la evaluación (un proveedor puede tener varios puntos) */
  id: string;
  /** Si es la evaluación inicial o una anual */
  kind: 'INICIAL' | 'ANUAL';
  /** Siglas del proveedor, para rotular el punto */
  sigla: string;
  name: string;
  /** Puntaje llevado a 0–100 (solo para la altura en la gráfica y el promedio) */
  value: number;
  /** «96 / 120» o «82 / 100» */
  scoreText: string;
  approved: boolean;
  grade: 'A' | 'B' | 'C';
  conceptLabel: string;
  typeLabel: string;
  dateLabel: string;
  shortDate: string;
  evaluator: string;
  category: string;
}

const GRADE_NAME: Record<'A' | 'B' | 'C', string> = { A: 'Excelente', B: 'Aceptable', C: 'Crítico' };

/** Desempeño: un punto por proveedor activo (su evaluación vigente), ordenados por fecha y unidos con una línea */
export const TrendChart: React.FC<{ data: SupplierScorePoint[] }> = ({ data }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const W = 720, H = 280, L = 48, R = 28, T = 26, B = 56;

  if (data.length === 0) {
    return (
      <div className="h-[260px] grid place-items-center text-sm text-[#3a5274] dark:text-slate-400">
        Todavía no hay proveedores evaluados para dibujar el desempeño.
      </div>
    );
  }

  // El eje baja de 40 solo si hay puntajes más bajos
  const min = Math.min(40, Math.floor(Math.min(...data.map((d) => d.value)) / 10) * 10), max = 100;
  const x = (i: number) => (data.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (data.length - 1));
  const y = (v: number) => T + (1 - (Math.min(max, Math.max(min, v)) - min) / (max - min)) * (H - T - B);
  const pts = data.map((d, i) => ({ d, i, px: x(i), py: y(d.value) }));
  const line = pts.map((p, k) => `${k ? 'L' : 'M'}${p.px},${p.py}`).join(' ');
  const area = pts.length > 1 ? `${line} L${pts[pts.length - 1].px},${H - B} L${pts[0].px},${H - B} Z` : '';
  const ticks = Array.from(new Set([min, 55, 70, 85, 100].filter((t) => t >= min))).sort((p, q) => p - q);
  // Con muchos proveedores se rotula uno sí y otro no
  const step = Math.max(1, Math.ceil(data.length / 12));
  const showText = (i: number) => i % step === 0;
  const active = pts.find((p) => p.d.id === activeId) || null;

  // El recuadro se abre al lado del punto (a la derecha, o a la izquierda si el punto está en la mitad derecha),
  // centrado en vertical y sin salirse de la gráfica por los lados. Así nunca tapa el punto ni la línea que se está mirando.
  const TIP_W = 260, TIP_H = 200;
  const box = wrapRef.current?.getBoundingClientRect();
  const tip = active && box
    ? (() => {
        const px = (active.px / W) * box.width, py = (active.py / H) * box.height;
        const right = active.px / W < 0.55;
        const left = Math.max(0, Math.min(box.width - TIP_W, right ? px + 22 : px - 22 - TIP_W));
        const top = Math.max(-40, Math.min(box.height - TIP_H + 40, py - TIP_H / 2));
        return { left, top };
      })()
    : null;

  return (
    <div ref={wrapRef} className="relative" onMouseLeave={() => setActiveId(null)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto block"
        role="group"
        aria-label="Puntaje vigente de cada proveedor activo"
        onClick={(e) => {
          // En pantallas táctiles, tocar fuera de un punto cierra el recuadro
          if (!(e.target as Element).closest('g[role="img"]')) setActiveId(null);
        }}
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c84c4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#69bdd7" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="currentColor" strokeOpacity="0.12" strokeDasharray="4 4" />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="currentColor" fillOpacity="0.55">{t} %</text>
          </g>
        ))}
        {/* Guía vertical del punto activo */}
        {active && <line x1={active.px} x2={active.px} y1={T - 6} y2={H - B} stroke="#2c84c4" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="3 4" />}
        {area && <path d={area} fill="url(#trendFill)" className="animate-fade-up" />}
        {pts.length > 1 && (
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
        {/* Rótulos del eje: siglas y fecha corta */}
        {pts.map((p) =>
          showText(p.i) ? (
            <g key={`t-${p.d.id}`} style={{ pointerEvents: 'none' }}>
              <text x={p.px} y={H - B + 20} textAnchor="middle" fontSize="12.5" fontWeight={activeId === p.d.id ? 800 : 700} fill="currentColor" fillOpacity={activeId === p.d.id ? 1 : 0.85}>
                {p.d.sigla}
              </text>
              <text x={p.px} y={H - B + 36} textAnchor="middle" fontSize="10.5" fill="currentColor" fillOpacity="0.5">{p.d.shortDate}</text>
              <text x={p.px} y={H - B + 49} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#2c84c4" fillOpacity={p.d.kind === 'INICIAL' ? 0.9 : 0.55}>{p.d.kind === 'INICIAL' ? 'Inicial' : 'Anual'}</text>
            </g>
          ) : null
        )}
        {pts.map((p) => {
          const isActive = activeId === p.d.id;
          const color = p.d.grade === 'C' ? '#dc2626' : '#2c84c4';
          return (
            <g
              key={p.d.id}
              tabIndex={0}
              role="img"
              aria-label={`${p.d.name}: ${p.d.scoreText}, ${p.d.conceptLabel}, ${p.d.typeLabel} del ${p.d.dateLabel}`}
              style={{ cursor: 'pointer', outline: 'none' }}
              onMouseEnter={() => setActiveId(p.d.id)}
              onFocus={() => setActiveId(p.d.id)}
              onBlur={() => setActiveId((cur) => (cur === p.d.id ? null : cur))}
              onClick={() => setActiveId((cur) => (cur === p.d.id ? null : p.d.id))}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setActiveId(null);
              }}
            >
              <circle cx={p.px} cy={p.py} r="18" fill="transparent" />
              {isActive && <circle cx={p.px} cy={p.py} r="12" fill={color} fillOpacity="0.16" />}
              <circle cx={p.px} cy={p.py} r={isActive ? 7 : 5.5} fill={isActive ? color : 'var(--nd-card)'} stroke={color} strokeWidth="2.5" style={{ transition: 'r 140ms ease-out' }} />
              {data.length <= 10 && !isActive && (
                <text x={p.px} y={p.py - 13} textAnchor="middle" fontSize="11" fontWeight="600" fill="currentColor" fillOpacity="0.8" style={{ pointerEvents: 'none' }}>
                  {String(Math.round(p.d.value))} %
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {active && tip && (
        <div
          role="tooltip"
          style={tip}
          className="pointer-events-none absolute z-20 w-[260px] rounded-2xl border border-[#d5e0ee] dark:border-white/15 bg-white dark:bg-[#101828] p-3.5 shadow-[0_18px_40px_-14px_rgba(11,29,58,0.45)] animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-start gap-2.5">
            <span className="shrink-0 grid place-items-center h-9 min-w-9 px-1.5 rounded-xl bg-[#2c84c4]/12 text-[#0f6b8f] dark:text-[#8fd0e4] text-[12px] font-extrabold tracking-wide">
              {active.d.sigla}
            </span>
            <div className="min-w-0">
              <div className="text-[13.5px] font-bold leading-snug text-[#0b1d3a] dark:text-white line-clamp-2">{active.d.name}</div>
              <div className="text-[11.5px] text-[#5d7392] dark:text-slate-400 truncate">{active.d.category}</div>
            </div>
          </div>
          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              <div className="font-display text-[28px] leading-none font-bold tabular-nums text-[#0b1d3a] dark:text-white">
                {String(Math.round(active.d.value * 10) / 10).replace('.', ',')}
                <span className="text-[13px] font-semibold text-[#5d7392] dark:text-slate-400"> %</span>
              </div>
              <div className="mt-1 text-[11.5px] tabular-nums text-[#5d7392] dark:text-slate-400">{active.d.scoreText} puntos</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span
                className={`inline-flex items-center h-6 px-2.5 rounded-full text-[11.5px] font-bold ${
                  active.d.approved ? 'bg-[#2c84c4]/14 text-[#0f6b8f] dark:text-[#8fd0e4]' : 'bg-red-500/12 text-red-600 dark:text-red-300'
                }`}
              >
                {active.d.conceptLabel}
              </span>
              <span className="text-[11.5px] font-semibold text-[#3a5274] dark:text-slate-300">Nota {active.d.grade} · {GRADE_NAME[active.d.grade]}</span>
            </div>
          </div>
          <dl className="mt-3 pt-2.5 border-t border-black/8 dark:border-white/10 space-y-1 text-[12px]">
            <div className="flex justify-between gap-3">
              <dt className="text-[#5d7392] dark:text-slate-400">Tipo</dt>
              <dd className="font-semibold text-[#0b1d3a] dark:text-slate-200 text-right">{active.d.typeLabel}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#5d7392] dark:text-slate-400">Fecha</dt>
              <dd className="font-semibold text-[#0b1d3a] dark:text-slate-200 text-right">{active.d.dateLabel}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#5d7392] dark:text-slate-400">Evaluó</dt>
              <dd className="font-semibold text-[#0b1d3a] dark:text-slate-200 text-right truncate">{active.d.evaluator || '—'}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
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
    { k: 'A' as const, label: 'Excelente', range: 'Aprobado, 85 % o más de la nota máxima', bar: 'from-[#2c84c4] to-[#69bdd7]' },
    { k: 'B' as const, label: 'Aceptable', range: 'Aprobado, por debajo del 85 %', bar: 'from-[#69bdd7] to-[#69bdd7]/60' },
    { k: 'C' as const, label: 'Crítico', range: 'No aprobado (la inicial exige 76 de 120)', bar: 'from-red-500 to-red-400/60' },
  ];
  return (
    <div className="space-y-4">
      {rows.map((g) => (
        <div key={g.k}>
          <div className="mb-1.5 flex items-center gap-3">
            <span className="flex w-9 h-9 items-center justify-center rounded-xl bg-[#e3eaf3] dark:bg-white/10 font-display text-lg font-semibold text-[#0b1d3a] dark:text-white">{g.k}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#0b1d3a] dark:text-white">{g.label}</p>
              <p className="text-xs text-[#3a5274] dark:text-slate-400">{g.range}</p>
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
