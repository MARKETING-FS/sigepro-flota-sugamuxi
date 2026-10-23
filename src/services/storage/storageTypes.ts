/**
 * storageTypes.ts
 * Contratos y tipos para el subsistema de almacenamiento de SIGEPRO.
 * Permite alternar transparentemente entre Supabase Storage, Microsoft OneDrive / SharePoint o Local.
 */

export type StorageProviderType = 'supabase' | 'onedrive' | 'local';

export interface StorageUploadParams {
  file: File | Blob;
  fileName: string;
  folder?: string; // e.g. 'supplier-documents' | 'institutional-templates'
  supplierId?: string;
  fileNumber?: string;
  supplierName?: string;
  documentCode?: string;
  contentType?: string;
}

export interface StorageUploadResult {
  success: boolean;
  url: string;
  path: string;
  provider: StorageProviderType;
  fileId?: string;
  originalName: string;
  size?: number;
  error?: string;
}

export interface IStorageProvider {
  readonly name: StorageProviderType;
  isAvailable(): boolean;
  upload(params: StorageUploadParams): Promise<StorageUploadResult>;
  getPublicUrl(path: string, folder?: string): Promise<string>;
  delete(path: string, folder?: string): Promise<boolean>;
}
