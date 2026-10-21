# SIGEPRO - Sistema Integral de Gestión de Proveedores
### Flota Sugamuxi S.A.

SIGEPRO es una solución empresarial de vanguardia diseñada para centralizar, automatizar y auditar el ciclo de vida completo de los proveedores de **Flota Sugamuxi S.A.**. Incluye radicación simplificada, expediente digital único, control y versionamiento de formatos institucionales oficiales (**FS.GA-FOR-009** y **FS.GA-FOR-039**), matriz de requisitos documentales por categoría y tipo de persona, flujo de revisiones por roles (Revisores y Admin), convocatorias de compras y sistema de evaluación y calificación SIG con trazabilidad forense.

---

## 🚀 Tecnologías

* **Frontend:** React 19, TypeScript 5.8, Vite 6
* **Estilos & UI:** Tailwind CSS v4, Lucide Icons, Motion
* **Base de Datos & Storage:** Supabase (PostgreSQL 15+, Row Level Security, Storage Buckets)
* **Despliegue:** Vercel (Optimizado con `vercel.json` para Single Page Applications)

---

## 📦 Puesta en Marcha Local

### 1. Requisitos Previos
* Node.js v18+ (recomendado v20+)
* npm v9+

### 2. Instalación
```bash
# Instalar dependencias
npm install
```

### 3. Variables de Entorno
Copia el archivo `.env.example` como `.env.local`:
```bash
cp .env.example .env.local
```

Configura tus credenciales de Supabase en `.env.local`:
```env
VITE_SUPABASE_URL="https://tu-proyecto.supabase.co"
VITE_SUPABASE_ANON_KEY="tu-anon-key-publica"
```
> **Nota:** Si no configuras las variables inmediatamente, la aplicación funcionará de manera automática en modo local/simulación con `localStorage`.

### 4. Ejecución en Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

### 5. Compilación para Producción
```bash
npm run build
```

---

## 🗄️ Configuración de la Base de Datos con Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/).
2. Dirígete a la sección **SQL Editor** en el panel de control de Supabase.
3. Copia y ejecuta el contenido del archivo [`supabase/schema.sql`](supabase/schema.sql). Esto creará:
   * Las tablas relacionales (`suppliers`, `supplier_documents`, `convocatorias`, `supplier_evaluations`, `institutional_forms`, `system_audit_logs`, etc.).
   * Políticas de seguridad **Row Level Security (RLS)**.
   * Buckets de almacenamiento en Supabase Storage (`supplier-documents` e `institutional-templates`).
   * Triggers automáticos para control de fechas `updated_at`.
4. (Opcional) Copia y ejecuta el contenido de [`supabase/seed.sql`](supabase/seed.sql) para cargar los datos institucionales iniciales (Formatos FS.GA-FOR-009 y FS.GA-FOR-039, Convocatorias y Criterios SIG).
5. Ve a **Project Settings > API** y copia:
   * **Project URL** -> `VITE_SUPABASE_URL`
   * **anon public Key** -> `VITE_SUPABASE_ANON_KEY`

---

## 🌐 Despliegue en Vercel

1. Sube tu repositorio a GitHub (sigue los pasos de la siguiente sección).
2. Entra en [Vercel](https://vercel.com/) e inicia sesión.
3. Haz clic en **"Add New..." > "Project"** e importa tu repositorio `sigepro-flota-sugamuxi`.
4. En la configuración del proyecto:
   * **Framework Preset:** `Vite`
   * **Root Directory:** `./`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
5. En la sección **Environment Variables**, añade:
   * `VITE_SUPABASE_URL` = Tu URL de Supabase
   * `VITE_SUPABASE_ANON_KEY` = Tu Anon Key pública de Supabase
6. Haz clic en **Deploy**. El archivo [`vercel.json`](vercel.json) incluido garantizará que todas las rutas funcionen sin errores 404 al recargar.

---

## 🌿 Comandos Git para Vincular tu Repositorio

Si aún no has vinculado tu repositorio con GitHub:

```bash
# 1. Crear el repositorio en GitHub (ej: https://github.com/tu-usuario/sigepro-flota-sugamuxi.git)

# 2. Conectar el repositorio local con el remoto
git remote add origin https://github.com/tu-usuario/sigepro-flota-sugamuxi.git

# 3. Subir los cambios a la rama principal
git push -u origin main
```
