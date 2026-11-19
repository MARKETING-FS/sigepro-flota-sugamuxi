import React from 'react';
import { EvaluationThresholds } from '../../../types';
import { cardCls } from '../form/formStyles';
import { Stepper } from './Stepper';

interface ThresholdsTabProps {
  value: EvaluationThresholds;
  onChange: (next: EvaluationThresholds) => void;
}

/** Rangos del concepto de la evaluación anual (el resultado de 0 a 100 se traduce en una palabra). */
export const ThresholdsTab: React.FC<ThresholdsTabProps> = ({ value, onChange }) => {
  const s = value.sobresalienteMin ?? 90;
  const c = value.conformeMin ?? 70;
  const k = value.condicionalMin ?? 60;
  const ordered = s > c && c > k && k > 0;

  const rows = [
    { key: 'sobresalienteMin' as const, label: 'Sobresaliente', hint: 'Apto con excelencia', v: s, bg: '#0f3d75' },
    { key: 'conformeMin' as const, label: 'Conforme', hint: 'Cumple los requisitos', v: c, bg: '#2c84c4' },
    { key: 'condicionalMin' as const, label: 'Condicional', hint: 'Exige plan de mejora', v: k, bg: '#69bdd7' },
  ];
  const bands = [
    { label: 'No conforme', from: 0, to: k, bg: '#b9c8dc' },
    { label: 'Condicional', from: k, to: c, bg: '#69bdd7' },
    { label: 'Conforme', from: c, to: s, bg: '#2c84c4' },
    { label: 'Sobresaliente', from: s, to: 100, bg: '#0f3d75' },
  ];

  return (
    <div className="space-y-6">
      <section className={`${cardCls} p-4 sm:p-5 space-y-3`} aria-label="Escala de 0 a 100">
        <div className="text-xs font-semibold text-[#3a5274] dark:text-slate-400">Así queda la escala de 0 a 100</div>
        <div className="flex h-9 rounded-xl overflow-hidden" role="img" aria-label="Escala de conceptos">
          {bands.map((b) => (
            <span
              key={b.label}
              style={{ width: `${Math.max(0, b.to - b.from)}%`, background: b.bg }}
              className="grid place-items-center text-[11px] font-semibold text-white overflow-hidden whitespace-nowrap px-1"
            >
              {b.to - b.from >= 14 ? b.label : ''}
            </span>
          ))}
        </div>
        <div className="flex justify-between text-xs tabular-nums text-[#5d7392]">
          <span>0</span>
          <span>{k}</span>
          <span>{c}</span>
          <span>{s}</span>
          <span>100</span>
        </div>
        {!ordered && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            Los rangos deben ir de menor a mayor: Condicional &lt; Conforme &lt; Sobresaliente.
          </p>
        )}
      </section>

      <ul className={`${cardCls} divide-y divide-black/[0.07] dark:divide-white/10`}>
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-4 p-4">
            <span className="w-3 h-10 rounded-full shrink-0" style={{ background: r.bg }} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-[15px] text-[#0b1d3a] dark:text-white">{r.label}</div>
              <div className="text-[13px] text-[#3a5274] dark:text-slate-400">
                {r.hint}: desde {r.v} puntos
              </div>
            </div>
            <Stepper
              value={r.v}
              min={1}
              max={100}
              step={5}
              unit="pts"
              label={`Mínimo para ${r.label}`}
              onChange={(n) => onChange({ ...value, [r.key]: n })}
            />
          </li>
        ))}
      </ul>
      <p className="text-[13px] text-[#3a5274] dark:text-slate-400">
        La evaluación inicial no usa estos rangos: se aprueba con el puntaje mínimo del formato. Estos rangos aplican a la evaluación anual,
        que se repite cada 365 días.
      </p>
    </div>
  );
};
