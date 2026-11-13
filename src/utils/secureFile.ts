import { supabase } from '../lib/supabase';

/** Almacén privado: sus archivos solo se abren con sesión iniciada, mediante un enlace temporal. */
const PRIVATE_BUCKET = 'supplier-documents';
/** Vida del enlace temporal, en segundos. */
const SIGNED_URL_SECONDS = 600;

const PRIVATE_URL_RE = new RegExp(`/storage/v1/object/(?:public|sign|authenticated)/${PRIVATE_BUCKET}/([^?#]+)`);

/**
 * Devuelve una dirección que el navegador sí puede abrir.
 * Los archivos del almacén privado se cambian por un enlace firmado de 10 minutos, que Supabase
 * solo entrega a un usuario con sesión; el resto de direcciones (plantillas, archivos locales) pasan igual.
 * Devuelve '' si no hay archivo o no hay permiso para verlo.
 */
export async function resolveFileUrl(url?: string | null): Promise<string> {
  if (!url) return '';
  const match = url.match(PRIVATE_URL_RE);
  if (!match || !supabase) return url;
  const path = decodeURIComponent(match[1]);
  const { data, error } = await supabase.storage.from(PRIVATE_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error || !data?.signedUrl) return '';
  return data.signedUrl;
}

/**
 * Abre un archivo en una pestaña nueva. La pestaña se abre antes de pedir el enlace
 * para que el navegador no la bloquee como ventana emergente.
 */
export async function openFileInNewTab(url?: string | null): Promise<boolean> {
  const tab = window.open('', '_blank');
  const resolved = await resolveFileUrl(url);
  if (!resolved) {
    tab?.close();
    return false;
  }
  if (tab) {
    tab.opener = null;
    tab.location.href = resolved;
  } else {
    window.location.assign(resolved);
  }
  return true;
}

/** Descarga un archivo con su nombre original. */
export async function downloadFile(url: string | null | undefined, fileName: string): Promise<boolean> {
  const resolved = await resolveFileUrl(url);
  if (!resolved) return false;
  try {
    const res = await fetch(resolved);
    if (!res.ok) return false;
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return true;
  } catch {
    return false;
  }
}

export type FileKind = 'pdf' | 'image' | 'other';

/** Tipo de archivo para decidir cómo mostrarlo. */
export const fileKind = (fileName?: string, url?: string): FileKind => {
  const name = (fileName || '').toLowerCase();
  const u = url || '';
  if (/\.pdf$/.test(name) || u.startsWith('data:application/pdf')) return 'pdf';
  if (/\.(png|jpe?g|webp|gif)$/.test(name) || u.startsWith('data:image/')) return 'image';
  return 'other';
};
