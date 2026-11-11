# Login de SIGEPRO con Supabase Auth

La aplicación ya no deja entrar sin correo y contraseña válidos. Para que funcione en la página publicada hay que configurar Supabase así.

## 1. Variables en Vercel

En Vercel → proyecto → **Settings → Environment Variables** deben existir:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Si faltan, el login muestra un aviso amarillo y no deja entrar.

## 2. Direcciones permitidas

En Supabase → **Authentication → URL Configuration**:

- **Site URL**: `https://sigepro-flota-sugamuxi.vercel.app`
- **Redirect URLs**: agregar `https://sigepro-flota-sugamuxi.vercel.app/**` y, para pruebas locales, `http://localhost:3000/**`

Así el enlace del correo de "restablecer contraseña" vuelve a la aplicación.

## 3. Diseño de los correos

En Supabase → **Authentication → Emails** (Email Templates) pegar el HTML de `src/templates/supabase-auth-emails/`:

| Plantilla en Supabase | Archivo |
| --- | --- |
| Confirm signup | `1-confirm-signup.html` |
| Invite user | `2-invite-user.html` |
| Magic Link | `3-magic-link.html` |
| Change Email Address | `4-change-email.html` |
| Reset Password | `5-reset-password.html` |
| Reauthentication | `6-reauthentication.html` |

## 4. Crear los usuarios

En Supabase → **Authentication → Users → Add user**:

- **Invite user**: Supabase le manda un correo para que la persona cree su contraseña.
- **Create new user**: usted define la contraseña; marque *Auto Confirm User*.

## 5. Asignar el rol (obligatorio)

Una cuenta sin rol puede iniciar sesión, pero la aplicación le muestra "Cuenta sin permisos asignados".
El rol se guarda en `app_metadata`, que el usuario no puede modificar. En Supabase → **SQL Editor**:

```sql
-- Administrador General
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || '{"role": "ADMIN", "sigepro_user_id": "admin-1"}'::jsonb,
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
  || '{"full_name": "Nombre Apellido"}'::jsonb
where email = 'correo.admin@flotasugamuxisa.com.co';

-- Revisor
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || '{"role": "REVISOR", "sigepro_user_id": "revisor-1"}'::jsonb,
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
  || '{"full_name": "Nombre Apellido"}'::jsonb
where email = 'correo.revisor@flotasugamuxisa.com.co';
```

- `role`: `ADMIN` o `REVISOR`.
- `sigepro_user_id` (opcional): enlaza la cuenta con la cartera de proveedores ya asignada
  (`admin-1`, `revisor-1`, `revisor-2`, `revisor-3`). Un revisor solo ve los proveedores
  cuyo revisor asignado coincide con este valor.
- `full_name`: nombre que se muestra en la aplicación.

Si se cambia el rol de alguien que ya tenía sesión abierta, debe cerrar sesión y volver a entrar.

## Pendiente importante

El login protege las pantallas, pero las reglas de la base de datos (`supabase/schema.sql`) siguen
abiertas (`USING (true)`). Falta cambiarlas para que solo usuarios con sesión puedan leer y escribir.

## Roles y módulo "Usuarios"

Roles (se guardan en `app_metadata.role`):

| Rol en la app | Valor en Supabase | Qué ve |
|---|---|---|
| Superadministrador (usted) | `SUPERADMIN` (el antiguo `ADMIN` también cuenta) | Todo, incluido el módulo **Usuarios**, Formatos SIG, Parametrización y Auditoría |
| Administrador | `ADMINISTRADOR` | Solo el grupo Proveedores; sube documentos y habilita/inhabilita proveedores |
| Usuario | `USUARIO` | Solo el grupo Proveedores; sube documentos |

Las cuentas Administrador y Usuario se crean desde el módulo **Usuarios**. Eso usa la función
`api/users.ts`, que necesita la variable de entorno **`SUPABASE_SERVICE_ROLE_KEY`** en Vercel
(Supabase → Project Settings → API → `service_role`). Esa clave es secreta: nunca va en el código ni en el navegador.
Después de agregarla hay que volver a desplegar.

## Seguridad en la base de datos (reglas por rol)

Aplicadas en Supabase con la migración `sigepro_rls_por_rol`. El rol se lee del token (`app_metadata.role`):
- **Usuario** (`USUARIO`): solo lectura.
- **Administrador** (`ADMINISTRADOR`): lee y escribe proveedores, documentos, evaluaciones, convocatorias y correos; registra auditoría; no ve la auditoría ni cambia la configuración.
- **Superadministrador** (`SUPERADMIN` o `ADMIN`): todo, incluida auditoría y configuración.
- Sin sesión: no ve nada.

Cuando se cambia el rol de alguien, el cambio llega a la base en su próximo refresco de sesión (hasta 1 hora) o al volver a iniciar sesión.
