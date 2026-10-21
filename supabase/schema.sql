-- ==============================================================================
-- SIGEPRO - Flota Sugamuxi S.A.
-- Esquema Completo de Base de Datos para Supabase (PostgreSQL)
-- ==============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla: suppliers (Expedientes / Dossiers de Proveedores)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY,
    file_number TEXT NOT NULL UNIQUE,
    supplier_type TEXT NOT NULL CHECK (supplier_type IN ('NATURAL', 'JURIDICA')),
    supplier_tier TEXT DEFAULT 'B' CHECK (supplier_tier IN ('A', 'B', 'C')),
    process_status TEXT NOT NULL DEFAULT 'BORRADOR',
    selected_category TEXT NOT NULL DEFAULT 'General',
    economic_activity TEXT DEFAULT '',
    is_email_verified BOOLEAN DEFAULT FALSE,
    verification_code TEXT,
    email_verification_code TEXT,
    basic_info JSONB NOT NULL DEFAULT '{}'::jsonb,
    internal_concepts JSONB NOT NULL DEFAULT '{}'::jsonb,
    contract_info JSONB DEFAULT '{}'::jsonb,
    assigned_reviewer_id TEXT,
    assigned_reviewer_name TEXT,
    assigned_at TIMESTAMPTZ,
    assigned_by TEXT,
    reviewer_notes TEXT,
    manual_status_override BOOLEAN DEFAULT FALSE,
    manual_status_reason TEXT,
    manual_status_changed_at TIMESTAMPTZ,
    manual_status_changed_by TEXT,
    submitted_at TIMESTAMPTZ,
    last_review_date TIMESTAMPTZ,
    audit_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_suppliers_file_number ON public.suppliers(file_number);
CREATE INDEX IF NOT EXISTS idx_suppliers_process_status ON public.suppliers(process_status);
CREATE INDEX IF NOT EXISTS idx_suppliers_assigned_reviewer ON public.suppliers(assigned_reviewer_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_type ON public.suppliers(supplier_type);

-- 3. Tabla: supplier_documents (Documentos del Expediente)
CREATE TABLE IF NOT EXISTS public.supplier_documents (
    id TEXT PRIMARY KEY,
    dossier_id TEXT NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    is_institutional_form BOOLEAN DEFAULT FALSE,
    form_code TEXT,
    form_version TEXT,
    status TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN ('PENDIENTE', 'CARGADO', 'EN_REVISION', 'APROBADO', 'REQUIERE_CORRECCION', 'RECHAZADO')),
    file_name TEXT,
    file_size TEXT,
    file_url TEXT,
    preview_url TEXT,
    custom_url TEXT,
    uploaded_at TIMESTAMPTZ,
    uploaded_by TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    expiration_date DATE,
    notes TEXT,
    correction JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_docs_dossier ON public.supplier_documents(dossier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_docs_code ON public.supplier_documents(code);
CREATE INDEX IF NOT EXISTS idx_supplier_docs_status ON public.supplier_documents(status);

-- 4. Tabla: institutional_forms (Formatos Institucionales FS.GA-FOR-009 y FS.GA-FOR-039)
CREATE TABLE IF NOT EXISTS public.institutional_forms (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    current_version TEXT NOT NULL,
    effective_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT TRUE,
    is_mandatory BOOLEAN DEFAULT TRUE,
    description TEXT,
    instructions JSONB DEFAULT '[]'::jsonb,
    template_file_name TEXT,
    template_file_url TEXT,
    version_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabla: convocatorias (Convocatorias de Compras y Suministros)
CREATE TABLE IF NOT EXISTS public.convocatorias (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    budget NUMERIC(15,2),
    currency TEXT DEFAULT 'COP',
    status TEXT NOT NULL DEFAULT 'ABIERTA',
    opening_date DATE NOT NULL,
    closing_date DATE NOT NULL,
    requirements JSONB DEFAULT '[]'::jsonb,
    postulaciones_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tabla: convocatoria_postulaciones (Postulaciones a Convocatorias)
CREATE TABLE IF NOT EXISTS public.convocatoria_postulaciones (
    id TEXT PRIMARY KEY,
    convocatoria_id TEXT NOT NULL REFERENCES public.convocatorias(id) ON DELETE CASCADE,
    supplier_id TEXT REFERENCES public.suppliers(id) ON DELETE SET NULL,
    file_number TEXT,
    supplier_name TEXT NOT NULL,
    supplier_doc TEXT,
    supplier_email TEXT,
    status TEXT NOT NULL DEFAULT 'POSTULADO',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    documents JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_postulaciones_convocatoria ON public.convocatoria_postulaciones(convocatoria_id);

-- 7. Tabla: supplier_evaluations (Evaluaciones y Calificaciones de Proveedores SIG)
CREATE TABLE IF NOT EXISTS public.supplier_evaluations (
    id TEXT PRIMARY KEY,
    dossier_id TEXT NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    supplier_name TEXT NOT NULL,
    supplier_doc TEXT NOT NULL,
    file_number TEXT NOT NULL,
    supplier_tier TEXT,
    category_name TEXT,
    evaluation_type TEXT NOT NULL,
    annual_cycle_number INTEGER,
    period_year INTEGER,
    evaluation_date DATE NOT NULL,
    due_date DATE,
    evaluator_id TEXT NOT NULL,
    evaluator_name TEXT NOT NULL,
    evaluator_role TEXT,
    total_score NUMERIC(5,2) NOT NULL,
    concept TEXT NOT NULL,
    criteria_scores JSONB DEFAULT '[]'::jsonb,
    observations TEXT,
    strengths TEXT,
    improvement_commitments TEXT,
    certificate_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_dossier ON public.supplier_evaluations(dossier_id);

-- 8. Tabla: evaluation_method_config (Ponderaciones y Criterios del Método de Calificación)
CREATE TABLE IF NOT EXISTS public.evaluation_method_config (
    id TEXT PRIMARY KEY DEFAULT 'current_method',
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    scale_min INTEGER NOT NULL DEFAULT 0,
    scale_max INTEGER NOT NULL DEFAULT 100,
    criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
    score_ranges JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Tabla: system_audit_logs (Trazabilidad y Auditoría Forense de Cambios)
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    formatted_date TEXT,
    dossier_id TEXT,
    supplier_name TEXT,
    supplier_doc TEXT,
    file_number TEXT,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    section TEXT,
    field_changed TEXT,
    old_value TEXT,
    new_value TEXT,
    justification TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_dossier ON public.system_audit_logs(dossier_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.system_audit_logs(timestamp DESC);

-- 10. Tabla: system_parameters (Parámetros Generales: Bancos, Ciudades, ARL, etc.)
CREATE TABLE IF NOT EXISTS public.system_parameters (
    id TEXT PRIMARY KEY DEFAULT 'global_parameters',
    parameters_state JSONB NOT NULL DEFAULT '{}'::jsonb,
    categories_config JSONB DEFAULT '[]'::jsonb,
    document_definitions JSONB DEFAULT '[]'::jsonb,
    base_requirements JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Tabla: email_notifications (Historial de Correos del Sistema)
CREATE TABLE IF NOT EXISTS public.email_notifications (
    id TEXT PRIMARY KEY,
    dossier_id TEXT,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ENVIADO',
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emails_dossier ON public.email_notifications(dossier_id);

-- ==============================================================================
-- Triggers de actualización de updated_at
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_updated_at_suppliers
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_supplier_docs
    BEFORE UPDATE ON public.supplier_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_forms
    BEFORE UPDATE ON public.institutional_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_convocatorias
    BEFORE UPDATE ON public.convocatorias
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- Políticas de Seguridad (Row Level Security - RLS)
-- ==============================================================================
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutional_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convocatorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convocatoria_postulaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_method_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para acceso anónimo / autenticado (permiten lectura y escritura mediante anon key)
CREATE POLICY "Permitir acceso publico/anon a suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso publico/anon a supplier_documents" ON public.supplier_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir lectura publica a institutional_forms" ON public.institutional_forms FOR SELECT USING (true);
CREATE POLICY "Permitir gestion de institutional_forms" ON public.institutional_forms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir lectura publica a convocatorias" ON public.convocatorias FOR SELECT USING (true);
CREATE POLICY "Permitir gestion de convocatorias" ON public.convocatorias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso a postulaciones" ON public.convocatoria_postulaciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso a evaluaciones" ON public.supplier_evaluations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso a method_config" ON public.evaluation_method_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso a system_audit_logs" ON public.system_audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso a system_parameters" ON public.system_parameters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso a email_notifications" ON public.email_notifications FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- Storage Buckets (Para subida de documentos reales en PDF/Imágenes)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('supplier-documents', 'supplier-documents', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('institutional-templates', 'institutional-templates', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
CREATE POLICY "Permitir lectura pública en supplier-documents"
ON storage.objects FOR SELECT USING (bucket_id = 'supplier-documents');

CREATE POLICY "Permitir subida en supplier-documents"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'supplier-documents');

CREATE POLICY "Permitir lectura pública en institutional-templates"
ON storage.objects FOR SELECT USING (bucket_id = 'institutional-templates');

CREATE POLICY "Permitir gestión en institutional-templates"
ON storage.objects FOR ALL USING (bucket_id = 'institutional-templates');
