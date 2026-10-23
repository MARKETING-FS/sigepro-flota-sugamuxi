import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { IStorageProvider, StorageProviderType, StorageUploadParams, StorageUploadResult } from './storageTypes';

export class SupabaseStorageProvider implements IStorageProvider {
  readonly name: StorageProviderType = 'supabase';

  isAvailable(): boolean {
    return isSupabaseConfigured() && supabase !== null;
  }

  async upload(params: StorageUploadParams): Promise<StorageUploadResult> {
    const { file, fileName, folder = 'supplier-documents', supplierId, documentCode } = params;

    if (!this.isAvailable() || !supabase) {
      // Fallback local URL para visualización en memoria si Supabase no está configurado
      const localUrl = URL.createObjectURL(file);
      return {
        success: true,
        url: localUrl,
        path: fileName,
        provider: 'local',
        originalName: fileName,
      };
    }

    try {
      const bucket = folder === 'institutional-templates' ? 'institutional-templates' : 'supplier-documents';
      // Estructura de ruta limpia: {supplierId}/{documentCode}_{timestamp}_{fileName}
      const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const timestamp = Date.now();
      const storagePath = supplierId && documentCode
        ? `${supplierId}/${documentCode}_${timestamp}_${safeFileName}`
        : `${timestamp}_${safeFileName}`;

      const { data, error } = await supabase.storage.from(bucket).upload(storagePath, file, {
        upsert: true,
        contentType: (file as any).type || 'application/pdf',
      });

      if (error) {
        console.error('[SupabaseStorage] Error al subir archivo:', error.message);
        return {
          success: false,
          url: '',
          path: '',
          provider: this.name,
          originalName: fileName,
          error: error.message,
        };
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

      return {
        success: true,
        url: urlData.publicUrl,
        path: data.path,
        provider: this.name,
        originalName: fileName,
      };
    } catch (err: any) {
      console.error('[SupabaseStorage] Excepción durante la subida:', err);
      return {
        success: false,
        url: '',
        path: '',
        provider: this.name,
        originalName: fileName,
        error: err?.message || 'Error inesperado durante la subida',
      };
    }
  }

  async getPublicUrl(path: string, folder = 'supplier-documents'): Promise<string> {
    if (!this.isAvailable() || !supabase) return path;
    const bucket = folder === 'institutional-templates' ? 'institutional-templates' : 'supplier-documents';
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async delete(path: string, folder = 'supplier-documents'): Promise<boolean> {
    if (!this.isAvailable() || !supabase) return false;
    const bucket = folder === 'institutional-templates' ? 'institutional-templates' : 'supplier-documents';
    const { error } = await supabase.storage.from(bucket).remove([path]);
    return !error;
  }
}
