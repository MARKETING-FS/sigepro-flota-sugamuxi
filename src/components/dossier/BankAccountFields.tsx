import React from 'react';
import { useApp } from '../../context/AppContext';
import { fieldCls, labelCls } from '../evaluations/form/formStyles';
import { BankData } from './bankData';

interface Props {
  value: BankData;
  onChange: (next: BankData) => void;
  supplierName: string;
  idPrefix: string;
}

/** Campos de la cuenta bancaria; viven dentro de la ventana de cargue de la Certificación bancaria. */
export const BankAccountFields: React.FC<Props> = ({ value, onChange, supplierName, idPrefix }) => {
  const { systemParameters } = useApp();
  const banks = (systemParameters.bankOptions || []).filter((b) => b.isActive);
  const types = (systemParameters.bankAccountTypes || []).filter((t) => t.isActive);
  const set = (key: keyof BankData, v: string) => onChange({ ...value, [key]: v });

  // Un valor que ya no está en el catálogo se conserva como opción para no perderlo al editar
  const bankChoices = value.bankName && !banks.some((b) => b.name === value.bankName) ? [{ id: 'cur', name: value.bankName }, ...banks] : banks;
  const oldTypeName = (systemParameters.bankAccountTypes || []).find((t) => t.code === value.accountType)?.name || value.accountType;
  const typeChoices = value.accountType && !types.some((t) => t.code === value.accountType) ? [{ id: 'cur', code: value.accountType, name: oldTypeName }, ...types] : types;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className={labelCls} htmlFor={`${idPrefix}-bank`}>Banco <span className="text-red-500">*</span></label>
        <select id={`${idPrefix}-bank`} value={value.bankName} onChange={(e) => set('bankName', e.target.value)} className={fieldCls}>
          <option value="">Elija el banco</option>
          {bankChoices.map((b) => (
            <option key={b.id} value={b.name}>{b.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls} htmlFor={`${idPrefix}-type`}>Tipo de cuenta <span className="text-red-500">*</span></label>
        <select id={`${idPrefix}-type`} value={value.accountType} onChange={(e) => set('accountType', e.target.value)} className={fieldCls}>
          <option value="">Elija el tipo</option>
          {typeChoices.map((t) => (
            <option key={t.id} value={t.code}>{t.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls} htmlFor={`${idPrefix}-num`}>Número de cuenta <span className="text-red-500">*</span></label>
        <input
          id={`${idPrefix}-num`}
          inputMode="numeric"
          autoComplete="off"
          value={value.accountNumber}
          onChange={(e) => set('accountNumber', e.target.value)}
          placeholder="Como aparece en la certificación"
          className={`${fieldCls} font-mono`}
        />
      </div>
      <div>
        <label className={labelCls} htmlFor={`${idPrefix}-doc`}>Documento del titular (opcional)</label>
        <input
          id={`${idPrefix}-doc`}
          autoComplete="off"
          value={value.holderDocNumber}
          onChange={(e) => set('holderDocNumber', e.target.value)}
          placeholder="Cédula o NIT"
          className={fieldCls}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls} htmlFor={`${idPrefix}-holder`}>Titular de la cuenta</label>
        <input
          id={`${idPrefix}-holder`}
          autoComplete="off"
          value={value.accountHolder}
          onChange={(e) => set('accountHolder', e.target.value)}
          placeholder={supplierName || 'Nombre que aparece en la certificación'}
          className={fieldCls}
        />
        {!value.accountHolder && supplierName && (
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
  );
};
