import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';


type ModuleInfoGetter = (id: string) => { isEntry: boolean; importers: readonly string[] } | null;
const staticCache = new Map<string, boolean>();
/** ¿Algún camino de imports estáticos lleva desde el arranque de la app hasta este módulo? */
function reachedStatically(id: string, getInfo: ModuleInfoGetter, seen = new Set<string>()): boolean {
  const cached = staticCache.get(id);
  if (cached !== undefined) return cached;
  if (seen.has(id)) return false;
  seen.add(id);
  const info = getInfo(id);
  if (!info) return false;
  const result = info.isEntry || info.importers.some((importer) => reachedStatically(importer, getInfo, seen));
  if (result) staticCache.set(id, true);
  return result;
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id, { getModuleInfo }) {
            if (!id.includes('node_modules')) return;
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) return 'vendor-react';
            // Lo que solo se usa tras un import() dinámico (la librería del Excel, ~1 MB) se deja fuera de
            // vendor-misc: así no se descarga al abrir la app, solo cuando alguien presiona «Descargar».
            if (!reachedStatically(id, getModuleInfo)) return undefined;
            return 'vendor-misc';
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
