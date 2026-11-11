-- ==============================================================================
-- SIGEPRO - Conectar toda la base de datos
-- Ejecutar UNA vez en Supabase -> SQL Editor (después de supabase/schema.sql).
-- Se puede volver a ejecutar sin problema.
-- ==============================================================================

-- 1. Columna para guardar el método de evaluación (criterios y rangos)
ALTER TABLE public.system_parameters
  ADD COLUMN IF NOT EXISTS evaluation_method JSONB DEFAULT '{}'::jsonb;

-- 2. Seguridad: solo usuarios con sesión iniciada pueden leer y escribir.
--    Se eliminan las políticas abiertas al público del esquema original.
DO $$
DECLARE
  t TEXT;
  p RECORD;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'suppliers', 'supplier_documents', 'institutional_forms', 'convocatorias',
    'convocatoria_postulaciones', 'supplier_evaluations', 'evaluation_method_config',
    'system_audit_logs', 'system_parameters', 'email_notifications'
  ] LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
    END LOOP;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY "Solo usuarios con sesion" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t
    );
  END LOOP;
END $$;

-- 3. Archivos (Storage): solo con sesión; los enlaces públicos siguen funcionando para verlos
DROP POLICY IF EXISTS "Permitir lectura pública en supplier-documents" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subida en supplier-documents" ON storage.objects;
DROP POLICY IF EXISTS "Permitir lectura pública en institutional-templates" ON storage.objects;
DROP POLICY IF EXISTS "Permitir gestión en institutional-templates" ON storage.objects;
DROP POLICY IF EXISTS "Sigepro: documentos con sesion" ON storage.objects;
DROP POLICY IF EXISTS "Sigepro: formatos con sesion" ON storage.objects;

CREATE POLICY "Sigepro: documentos con sesion" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'supplier-documents') WITH CHECK (bucket_id = 'supplier-documents');

CREATE POLICY "Sigepro: formatos con sesion" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'institutional-templates') WITH CHECK (bucket_id = 'institutional-templates');

-- 4. Comprobación: debe mostrar una fila por tabla con la política "Solo usuarios con sesion"
SELECT tablename, policyname, roles FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
