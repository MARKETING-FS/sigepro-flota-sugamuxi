import { IStorageProvider, StorageProviderType, StorageUploadParams, StorageUploadResult } from './storage/storageTypes';
import { SupabaseStorageProvider } from './storage/supabaseStorageProvider';
import { OneDriveStorageProvider } from './storage/oneDriveStorageProvider';

class StorageService {
  private providers: Record<StorageProviderType, IStorageProvider>;
  private activeProviderName: StorageProviderType;

  constructor() {
    this.providers = {
      supabase: new SupabaseStorageProvider(),
      onedrive: new OneDriveStorageProvider(),
      local: new SupabaseStorageProvider(), // fallback
    };

    const configuredProvider = (import.meta.env.VITE_STORAGE_PROVIDER as StorageProviderType) || 'supabase';
    this.activeProviderName = configuredProvider;
  }

  getActiveProviderName(): StorageProviderType {
    return this.activeProviderName;
  }

  getProvider(name?: StorageProviderType): IStorageProvider {
    const target = name || this.activeProviderName;
    return this.providers[target] || this.providers.supabase;
  }

  setActiveProvider(name: StorageProviderType) {
    if (this.providers[name]) {
      this.activeProviderName = name;
    }
  }

  /**
   * Sube un documento del expediente de un proveedor.
   * Utiliza el proveedor activo (Supabase Storage por defecto, o Microsoft OneDrive cuando se active).
   */
  async uploadSupplierDocument(
    params: {
      file: File | Blob;
      fileName: string;
      supplierId: string;
      fileNumber: string;
      supplierName?: string;
      documentCode: string;
      category?: string;
    }
  ): Promise<StorageUploadResult> {
    const provider = this.getProvider();
    return provider.upload({
      ...params,
      folder: 'supplier-documents',
    });
  }

  /**
   * Sube una plantilla oficial de formato institucional (FS.GA-FOR-009, FS.GA-FOR-039)
   */
  async uploadInstitutionalTemplate(
    params: {
      file: File | Blob;
      fileName: string;
      formCode: string;
    }
  ): Promise<StorageUploadResult> {
    const provider = this.getProvider();
    return provider.upload({
      ...params,
      folder: 'institutional-templates',
      documentCode: params.formCode,
    });
  }

  /**
   * Obtiene la información del estado de conectividad del almacenamiento
   */
  getStorageStatus() {
    return {
      activeProvider: this.activeProviderName,
      supabaseAvailable: this.providers.supabase.isAvailable(),
      oneDriveAvailable: this.providers.onedrive.isAvailable(),
      oneDriveReadyForActivation: true,
    };
  }
}

export const storageService = new StorageService();
export * from './storage/storageTypes';
