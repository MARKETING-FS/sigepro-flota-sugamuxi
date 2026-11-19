import React from 'react';
import { Calendar, UserCheck } from 'lucide-react';
import { getProcessStatusLabel } from '../../../utils/contractValidity';
import { DOC006_CODE, DOC006_VERSION } from '../../../data/evaluationDoc006';
import { SupplierDossier, SupplierEvaluationType } from '../../../types';
import { cardCls, chipOff, chipOn, fieldCls, focusRing, labelCls } from './formStyles';

interface SetupCardProps {
  dossiers: SupplierDossier[];
  selectedDossier: SupplierDossier | null;
  onSelectDossier: (id: string) => void;
  supplierLocked: boolean;
  evalType: SupplierEvaluationType;
  onEvalType: (t: SupplierEvaluationType) => void;
  isAnnual: boolean;
  isInitial: boolean;
  cycle: number;
  onCycle: (n: number) => void;
  previousAnnualCount: number;
  isSupplierActive: boolean;
  reviewerName: string;
  dateValue: string;
  todayIso: string;
  onDate: (v: string) => void;
}

const docNumberOf = (d: SupplierDossier) =>
  d.basicInfo?.nit || (d.basicInfo as any)?.documentNumber || (d.basicInfo as any)?.identificationNumber || 'S/N';

const isoToEs = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
};

export const SetupCard: React.FC<SetupCardProps> = ({
  dossiers,
  selectedDossier,
  onSelectDossier,
  supplierLocked,
  evalType,
  onEvalType,
  isAnnual,
  isInitial,
  cycle,
  onCycle,
  previousAnnualCount,
  isSupplierActive,
  reviewerName,
  dateValue,
  todayIso,
  onDate,
}) => {
  const natural = selectedDossier?.basicInfo?.supplierType === 'NATURAL';
  const createdOn = selectedDossier?.createdAt
    ? new Date(selectedDossier.createdAt).toLocaleDateString('es-CO')
    : 'No registrada';

  const sheet = selectedDossier
    ? [
        { k: 'Fecha', v: isoToEs(dateValue) },
        { k: 'Tipo de persona', v: natural ? 'Persona natural' : 'Persona jurídica' },
        {
          k: 'Nombre o razón social',
          v: (natural ? selectedDossier.basicInfo?.fullName : selectedDossier.basicInfo?.companyName) || '—',
        },
        {
          k: natural ? 'C.C.' : 'NIT',
          v: (natural ? selectedDossier.basicInfo?.documentNumber : selectedDossier.basicInfo?.nit) || '—',
        },
        { k: 'Dirección', v: selectedDossier.basicInfo?.address || '—' },
        { k: 'Ciudad', v: selectedDossier.basicInfo?.city || '—' },
      ]
    : [];

  return (
    <section className={`${cardCls} p-4 sm:p-5 space-y-5`}>
      <div>
        <label htmlFor="eval-supplier" className={labelCls}>Proveedor a calificar</label>
        <select
          id="eval-supplier"
          value={selectedDossier?.id || ''}
          onChange={(e) => onSelectDossier(e.target.value)}
          className={`${fieldCls} font-semibold cursor-pointer disabled:cursor-default disabled:opacity-100`}
          disabled={supplierLocked}
        >
          {dossiers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.basicInfo?.companyName || 'Proveedor'} · {docNumberOf(d)} ({d.fileNumber || 'Sin radicado'})
            </option>
          ))}
        </select>
        {selectedDossier && (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#3a5274] dark:text-slate-300">
            <span
              className={`inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-bold ${
                isSupplierActive ? 'bg-gradient-action text-white' : 'bg-black/[0.06] dark:bg-white/10 text-[#1c3354] dark:text-slate-200'
              }`}
            >
              {isSupplierActive ? 'Habilitado' : getProcessStatusLabel(selectedDossier.processStatus)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#0f6b8f] dark:text-[#5db2c9]" /> Registrado el {createdOn}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#0f6b8f] dark:text-[#5db2c9]" /> {reviewerName}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_200px] gap-4">
        <div>
          <span id="eval-type-label" className={labelCls}>Tipo de evaluación</span>
          <div role="radiogroup" aria-labelledby="eval-type-label" className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.05]">
            {[
              { on: evalType === 'INICIAL', set: () => onEvalType('INICIAL'), title: 'Inicial', sub: 'Al vincular al proveedor' },
              { on: isAnnual, set: () => onEvalType('ANUAL_1_ANO'), title: 'Anual', sub: 'Se repite cada año' },
            ].map((o) => (
              <button
                key={o.title}
                type="button"
                role="radio"
                aria-checked={o.on}
                onClick={o.set}
                className={`h-12 rounded-lg flex flex-col items-center justify-center leading-tight transition-colors cursor-pointer ${focusRing} ${
                  o.on ? chipOn : 'text-[#1c3354] dark:text-slate-200 hover:bg-[#0f6b8f]/10'
                }`}
              >
                <span className="text-sm font-semibold">{o.title}</span>
                <span className={`text-[11px] ${o.on ? 'text-white/85' : 'text-[#5d7392]'}`}>{o.sub}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="eval-date" className={labelCls}>Fecha de la evaluación</label>
          <input
            id="eval-date"
            type="date"
            value={dateValue}
            max={todayIso}
            onChange={(e) => onDate(e.target.value)}
            className={fieldCls}
            required
          />
        </div>
      </div>
      <p className="-mt-2 text-xs text-[#5d7392] dark:text-slate-400 leading-relaxed">
        {dateValue === todayIso
          ? 'Hoy. Si la evaluación se hizo otro día, cambie la fecha por la que indiquen los evaluadores.'
          : 'Esta fecha queda en el acta y desde ella se cuenta el año de la próxima evaluación.'}
      </p>

      {isAnnual && (
        <div className="rounded-xl bg-[#0f6b8f]/[0.07] dark:bg-[#0f6b8f]/10 border border-[#0f6b8f]/20 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[#0b1d3a] dark:text-white">¿Qué año se califica?</div>
              <p className="text-xs text-[#3a5274] dark:text-slate-400 mt-0.5">
                Evaluaciones anuales ya registradas: <strong className="tabular-nums">{previousAnnualCount}</strong>
              </p>
            </div>
            <div role="radiogroup" aria-label="Ciclo anual" className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={cycle === n}
                  onClick={() => onCycle(n)}
                  className={`h-9 px-3.5 text-xs font-semibold rounded-full transition-colors cursor-pointer ${focusRing} ${
                    cycle === n ? chipOn : chipOff
                  }`}
                >
                  Año {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isInitial && selectedDossier && (
        <div className="pt-4 border-t border-black/[0.07] dark:border-white/10">
          <h4 className="text-xs font-semibold text-[#1c3354] dark:text-slate-200 mb-3">
            Datos del proveedor en el formato {DOC006_CODE} v{DOC006_VERSION}
          </h4>
          <dl className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 text-sm">
            {sheet.map((f) => (
              <div key={f.k} className="min-w-0">
                <dt className="text-[11.5px] text-[#5d7392] mb-0.5">{f.k}</dt>
                <dd className="font-semibold text-[#0b1d3a] dark:text-white break-words">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
};
