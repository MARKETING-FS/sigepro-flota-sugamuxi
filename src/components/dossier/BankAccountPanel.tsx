import React from 'react';
import { CheckCircle2, Landmark } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupplierDossier, UserRole } from '../../types';
import { cardCls, fieldCls, labelCls } from '../evaluations/form/formStyles';
import { BankData, isBankComplete, readBank } from './bankData';

interface Props {
  dossier: SupplierDossier;
  readOnly: boolean;
  reviewerName: string;
  role: UserRole;
}

const FIELDS: { key: keyof BankData; label: string }[] = [
  { key: 'bankName', label: 'Banco' },
  { key: 'accountType', label: 'Tipo de cuenta' },
  { key: 'accountNumber', label: 'Número de cuenta' },
  { key: 'accountHolder', label: 'Titular' },
  { key: 'holderDocNumber', label: 'Documento del titular' },
];

/** Los datos de la cuenta se anotan aquí mientras se revisa la Certificación bancaria. */
export const BankAccountPanel: React.FC<Props> = ({ dossier, readOnly, reviewerName, role }) => {
  const { systemParameters, updateEntireSupplier, canEditDossier, showToast } = useApp();
  const saved = React.useMemo(() => readBank(dossier), [dossier]);
  const supplierName = (dossier.basicInfo.companyName || dossier.basicInfo.fullName || '').trim();
  const [draft, setDraft] = React.useState<BankData>(saved);
  React.useEffect(() => setDraft(saved), [saved]);

  const banks = (systemParameters.bankOptions || []).filter((b) => b.isActive);
  const types = (systemParameters.bankAccountTypes || []).filter((t) => t.isActive);
  const typeName = (code: string) => types.find((t) => t.code === code)?.name || (systemParameters.bankAccountTypes || []).find((t) => t.code === code)?.name || code;

  const dirty = FIELDS.some((f) => draft[f.key].trim() !== saved[f.key]);
  const complete = isBankComplete(dossier);
  const editable = !readOnly && canEditDossier(dossier.id);
  const formComplete = !!(draft.bankName.trim() && draft.accountType.trim() && draft.accountNumber.trim());

  const set = (key: keyof BankData, value: string) => setDraft((d) => ({ ...d, [key]: value }));

  const save = () => {
    const clean: BankData = {
      bankName: draft.bankName.trim(),
      accountType: draft.accountType.trim(),
      accountNumber: draft.accountNumber.replace(/\s+/g, ' ').trim(),
      accountHolder: draft.accountHolder.trim(),
      holderDocNumber: draft.holderDocNumber.trim(),
    };
    const changes = FIELDS.filter((f) => clean[f.key] !== saved[f.key]).map((f) => ({
      section: 'Información Bancaria',
      fieldLabel: f.label,
      oldValue: saved[f.key] || 'Sin registrar',
      newValue: clean[f.key] || 'Sin registrar',
    }));
    if (changes.length === 0) return;
    updateEntireSupplier(
      dossier.id,
      { basicInfo: { ...dossier.basicInfo, bankInfo: { ...(dossier.basicInfo.bankInfo || {}), ...clean } } },
      changes,
      reviewerName,
      role,
      'Datos tomados de la certificación bancaria'
    );
    showToast('Datos de la cuenta guardados.', 'success', 'CUENTA BANCARIA');
  };

  // Un valor que ya no está en el catálogo se conserva como opción para no perderlo al editar
  const bankChoices = draft.bankName && !banks.some((b) => b.name === draft.bankName) ? [{ id: 'cur', name: draft.bankName }, ...banks] : banks;
  const typeChoices = draft.accountType && !types.some((t) => t.code === draft.accountType) ? [{ id: 'cur', code: draft.accountType, name: typeName(draft.accountType) }, ...types] : types;

  return (
    <div className={`${cardCls} mx-4 mb-4 mt-1 p-4 sm:p-5 space-y-4`} aria-label="Datos de la cuenta bancaria">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-[#1d5fa8] text-white grid place-items-center shrink-0">
            <Landmark className="w-[18px] h-[18px]" />
          </span>
          <div className="min-w-0">
            <h5 className="font-display text-sm font-semibold text-[#0b1d3a] dark:text-white">Cuenta para pagos</h5>
            <p className="text-xs text-[#3a5274] dark:text-slate-400">Copie estos datos de la certificación antes de aprobarla.</p>
          </div>
        </div>
        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
            complete
              ? 'bg-[#2c84c4]/12 text-[#1d5fa8] dark:text-[#69bdd7] border-[#2c84c4]/35'
              : 'bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/40'
          }`}
        >
          {complete ? 'Cuenta registrada' : 'Sin registrar'}
        </span>
      </div>

      {editable ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor={`bk-bank-${dossier.id}`}>Banco</label>
              <select id={`bk-bank-${dossier.id}`} value={draft.bankName} onChange={(e) => set('bankName', e.target.value)} className={fieldCls}>
                <option value="">Elija el banco</option>
                {bankChoices.map((b) => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor={`bk-type-${dossier.id}`}>Tipo de cuenta</label>
              <select id={`bk-type-${dossier.id}`} value={draft.accountType} onChange={(e) => set('accountType', e.target.value)} className={fieldCls}>
                <option value="">Elija el tipo</option>
                {typeChoices.map((t) => (
                  <option key={t.id} value={t.code}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor={`bk-num-${dossier.id}`}>Número de cuenta</label>
              <input
                id={`bk-num-${dossier.id}`}
                inputMode="numeric"
                autoComplete="off"
                value={draft.accountNumber}
                onChange={(e) => set('accountNumber', e.target.value)}
                placeholder="Como aparece en la certificación"
                className={`${fieldCls} font-mono`}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor={`bk-doc-${dossier.id}`}>Documento del titular (opcional)</label>
              <input
                id={`bk-doc-${dossier.id}`}
                autoComplete="off"
                value={draft.holderDocNumber}
                onChange={(e) => set('holderDocNumber', e.target.value)}
                placeholder="Cédula o NIT"
                className={fieldCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor={`bk-holder-${dossier.id}`}>Titular de la cuenta</label>
              <input
                id={`bk-holder-${dossier.id}`}
                autoComplete="off"
                value={draft.accountHolder}
                onChange={(e) => set('accountHolder', e.target.value)}
                placeholder={supplierName || 'Nombre que aparece en la certificación'}
                className={fieldCls}
              />
              {!draft.accountHolder && supplierName && (
                <button
                  type="button"
                  onClick={() => set('accountHolder', supplierName)}
                  className="mt-1.5 text-xs font-semibold text-[#1d5fa8] dark:text-[#69bdd7] hover:underline underline-offset-2 cursor-pointer"
                >
                  Usar «{supplierName}»
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#3a5274] dark:text-slate-400">
              {formComplete ? 'Los cambios quedan anotados en el historial del proveedor.' : 'Falta banco, tipo o número de cuenta.'}
            </p>
            <button
              type="button"
              onClick={save}
              disabled={!dirty || !formComplete}
              className="h-10 px-5 rounded-xl bg-gradient-action text-white text-sm font-semibold shadow-glow hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> {dirty ? 'Guardar cuenta' : 'Guardado'}
            </button>
          </div>
        </>
      ) : (
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 text-sm">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <dt className={labelCls}>{f.label}</dt>
              <dd className={`font-semibold ${saved[f.key] ? 'text-[#0b1d3a] dark:text-white' : 'text-red-600 dark:text-red-300'} ${f.key === 'accountNumber' ? 'font-mono' : ''}`}>
                {saved[f.key] ? (f.key === 'accountType' ? typeName(saved[f.key]) : saved[f.key]) : 'Sin registrar'}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
};

