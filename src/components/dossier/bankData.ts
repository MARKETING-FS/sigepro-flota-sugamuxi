import { SupplierDossier } from '../../types';

export const BANK_DOC_CODE = 'CERTIFICACION_BANCARIA';

export interface BankData {
  bankName: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
  holderDocNumber: string;
}

/** Datos de la cuenta: primero lo guardado en bankInfo y, si no hay, los campos sueltos antiguos. */
export const readBank = (d: SupplierDossier): BankData => {
  const b = d.basicInfo?.bankInfo;
  const flat = d.basicInfo as any;
  return {
    bankName: (b?.bankName || flat?.bankName || '').trim(),
    accountType: (b?.accountType || flat?.accountType || '').trim(),
    accountNumber: (b?.accountNumber || flat?.accountNumber || '').trim(),
    accountHolder: (b?.accountHolder || '').trim(),
    holderDocNumber: (b?.holderDocNumber || '').trim(),
  };
};

/** Lo mínimo para poder pagarle: banco, tipo y número. */
export const isBankComplete = (d: SupplierDossier) => {
  const b = readBank(d);
  return !!(b.bankName && b.accountType && b.accountNumber);
};
