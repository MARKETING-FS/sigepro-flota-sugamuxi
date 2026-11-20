import { SupplierDossier } from '../types';

/** Un proveedor inactivo no aparece en el Banco, las evaluaciones, los reportes ni las gráficas, pero no se borra. */
export const isDossierInactive = (d: Pick<SupplierDossier, 'basicInfo'>): boolean => !!d.basicInfo?.inactive;
