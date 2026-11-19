/**
 * Utilidades de la firma digital del evaluador: recorta el trazo, quita el fondo blanco de una foto
 * y guarda (si la persona quiere) su firma en este equipo para no repetirla.
 */

const MAX_WIDTH = 640;
const PAD = 8;

/** Recorta el canvas al área con tinta (alfa > 0), le deja un margen y lo exporta como PNG transparente. */
export function trimToPng(src: HTMLCanvasElement): string | null {
  const ctx = src.getContext('2d');
  if (!ctx) return null;
  const { width, height } = src;
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null; // no hay tinta
  const x0 = Math.max(0, minX - PAD);
  const y0 = Math.max(0, minY - PAD);
  const w = Math.min(width, maxX + PAD) - x0;
  const h = Math.min(height, maxY + PAD) - y0;
  const k = Math.min(1, MAX_WIDTH / w);
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(w * k));
  out.height = Math.max(1, Math.round(h * k));
  const octx = out.getContext('2d');
  if (!octx) return null;
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(src, x0, y0, w, h, 0, 0, out.width, out.height);
  return out.toDataURL('image/png');
}

/** Foto o escaneo de la firma → PNG con el fondo blanco transparente (para que quede limpia sobre el formato). */
export async function imageFileToSignature(file: File): Promise<string> {
  if (!/^image\/(png|jpe?g|webp|gif|bmp)$/i.test(file.type)) {
    throw new Error('Suba una imagen en formato PNG, JPG o WebP.');
  }
  if (file.size > 6 * 1024 * 1024) throw new Error('La imagen pesa más de 6 MB. Suba una más liviana.');

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      i.src = url;
    });
    const k = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * k));
    c.height = Math.max(1, Math.round(img.naturalHeight * k));
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('No se pudo procesar la imagen.');
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const px = ctx.getImageData(0, 0, c.width, c.height);
    const d = px.data;
    for (let i = 0; i < d.length; i += 4) {
      // Cuanto más claro el píxel, más transparente: el papel blanco desaparece y queda solo la tinta
      const lightest = Math.min(d[i], d[i + 1], d[i + 2]);
      if (d[i + 3] === 0) continue;
      if (lightest >= 238) d[i + 3] = 0;
      else if (lightest > 190) d[i + 3] = Math.round(d[i + 3] * ((238 - lightest) / 48));
    }
    ctx.putImageData(px, 0, 0);
    const png = trimToPng(c);
    if (!png) throw new Error('No se encontró una firma en la imagen. Pruebe con una foto más clara sobre papel blanco.');
    return png;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ---- Firma guardada en este equipo (solo si la persona lo pide) ----
const keyOf = (userKey: string) => `sigepro.firma.${userKey || 'anon'}`;

export function loadSavedSignature(userKey: string): string | null {
  try {
    const v = localStorage.getItem(keyOf(userKey));
    return v && v.startsWith('data:image/') ? v : null;
  } catch {
    return null;
  }
}

export function saveSignature(userKey: string, dataUrl: string): void {
  try {
    localStorage.setItem(keyOf(userKey), dataUrl);
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

export function clearSavedSignature(userKey: string): void {
  try {
    localStorage.removeItem(keyOf(userKey));
  } catch {
    /* nada */
  }
}
