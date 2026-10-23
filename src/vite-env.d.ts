/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_RESEND_API_KEY?: string;
  readonly VITE_STORAGE_PROVIDER?: 'supabase' | 'onedrive' | 'local';
  readonly VITE_ONEDRIVE_TENANT_ID?: string;
  readonly VITE_ONEDRIVE_CLIENT_ID?: string;
  readonly VITE_ONEDRIVE_CLIENT_SECRET?: string;
  readonly VITE_ONEDRIVE_DRIVE_ID?: string;
  readonly VITE_ONEDRIVE_ROOT_FOLDER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
