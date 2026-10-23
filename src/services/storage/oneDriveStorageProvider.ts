import { IStorageProvider, StorageProviderType, StorageUploadParams, StorageUploadResult } from './storageTypes';

/**
 * oneDriveStorageProvider.ts
 * Integración preparada para Microsoft OneDrive for Business / SharePoint vía Microsoft Graph API.
 *
 * Estructura de almacenamiento en OneDrive:
 *  {VITE_ONEDRIVE_ROOT_FOLDER}/
 *     └── {fileNumber}_{supplierName}/
 *           ├── FS_GA_FOR_009_{timestamp}_{fileName}.pdf
 *           ├── RUT_{timestamp}_{fileName}.pdf
 *           └── ...
 *
 * Configuración requerida en variables de entorno:
 *  - VITE_ONEDRIVE_TENANT_ID: ID del inquilino de Azure Active Directory (Microsoft 365)
 *  - VITE_ONEDRIVE_CLIENT_ID: ID de la aplicación registrada en Azure Portal
 *  - VITE_ONEDRIVE_DRIVE_ID: ID de la unidad (Drive) de OneDrive o biblioteca de documentos de SharePoint
 *  - VITE_ONEDRIVE_ACCESS_TOKEN: Token de acceso Bearer (o gestionado vía Edge Function/MSAL)
 *  - VITE_ONEDRIVE_ROOT_FOLDER: Carpeta raíz (por defecto: 'SIGEPRO_Proveedores')
 */
export class OneDriveStorageProvider implements IStorageProvider {
  readonly name: StorageProviderType = 'onedrive';

  private tenantId = import.meta.env.VITE_ONEDRIVE_TENANT_ID || '';
  private clientId = import.meta.env.VITE_ONEDRIVE_CLIENT_ID || '';
  private driveId = import.meta.env.VITE_ONEDRIVE_DRIVE_ID || '';
  private rootFolder = import.meta.env.VITE_ONEDRIVE_ROOT_FOLDER || 'SIGEPRO_Flota_Sugamuxi/Proveedores';
  private accessToken = (import.meta.env as any).VITE_ONEDRIVE_ACCESS_TOKEN || '';

  isAvailable(): boolean {
    return Boolean(this.accessToken || (this.clientId && this.tenantId));
  }

  /**
   * Obtiene la URL base de Microsoft Graph API para la unidad configurada
   */
  private getGraphBaseUrl(): string {
    if (this.driveId) {
      return `https://graph.microsoft.com/v1.0/drives/${this.driveId}`;
    }
    return `https://graph.microsoft.com/v1.0/me/drive`;
  }

  /**
   * Sube un archivo a OneDrive creando automáticamente la carpeta del proveedor
   */
  async upload(params: StorageUploadParams): Promise<StorageUploadResult> {
    const { file, fileName, fileNumber, supplierName, documentCode } = params;

    const safeSupplierFolder = `${fileNumber || 'PROV-SIN-RADICAR'}_${(supplierName || 'General').replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const safeFileName = `${documentCode ? `${documentCode}_` : ''}${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const relativePath = `${this.rootFolder}/${safeSupplierFolder}/${safeFileName}`;

    if (!this.isAvailable()) {
      console.warn(
        `[OneDriveStorage] Conector OneDrive listo pero esperando credenciales completas de Microsoft 365 (Tenant ID: ${this.tenantId || 'No config'}, Client ID: ${this.clientId || 'No config'}). Modo simulación/enlace temporal activado.`
      );
      // Fallback a URL local en memoria si aún no se han configurado los secretos de Azure AD
      const localUrl = URL.createObjectURL(file);
      return {
        success: true,
        url: localUrl,
        path: relativePath,
        provider: this.name,
        originalName: fileName,
        error: 'OneDrive listo. Requiere configurar credenciales de Azure AD en .env para sincronización en la nube.',
      };
    }

    try {
      const graphUrl = `${this.getGraphBaseUrl()}/root:/${encodeURIComponent(relativePath)}:/content`;

      const response = await fetch(graphUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': (file as any).type || 'application/pdf',
        },
        body: file,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[OneDriveStorage] Error de Microsoft Graph:', errorData);
        return {
          success: false,
          url: '',
          path: relativePath,
          provider: this.name,
          originalName: fileName,
          error: errorData.error?.message || `Error HTTP ${response.status} en Graph API`,
        };
      }

      const driveItem = await response.json();

      // Generar enlace compartido de lectura (Sharing Link) si la API lo permite
      let sharingUrl = driveItem.webUrl || '';
      try {
        const shareResponse = await fetch(`${this.getGraphBaseUrl()}/items/${driveItem.id}/createLink`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'view',
            scope: 'organization', // o 'anonymous'
          }),
        });
        if (shareResponse.ok) {
          const shareData = await shareResponse.json();
          if (shareData.link?.webUrl) {
            sharingUrl = shareData.link.webUrl;
          }
        }
      } catch (shareErr) {
        console.warn('[OneDriveStorage] No se pudo generar enlace compartido, usando webUrl directa:', shareErr);
      }

      return {
        success: true,
        url: sharingUrl || driveItem['@microsoft.graph.downloadUrl'] || driveItem.webUrl,
        path: relativePath,
        provider: this.name,
        fileId: driveItem.id,
        originalName: fileName,
        size: driveItem.size,
      };
    } catch (err: any) {
      console.error('[OneDriveStorage] Excepción al subir archivo a OneDrive:', err);
      return {
        success: false,
        url: '',
        path: relativePath,
        provider: this.name,
        originalName: fileName,
        error: err?.message || 'Error de conexión con Microsoft Graph API',
      };
    }
  }

  async getPublicUrl(path: string): Promise<string> {
    return path;
  }

  async delete(path: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      const graphUrl = `${this.getGraphBaseUrl()}/root:/${encodeURIComponent(path)}`;
      const response = await fetch(graphUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
