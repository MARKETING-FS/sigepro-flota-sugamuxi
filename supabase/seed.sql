-- ==============================================================================
-- SIGEPRO - Flota Sugamuxi S.A.
-- Datos Iniciales / Semilla para Supabase (seed.sql)
-- ==============================================================================

-- 1. Formatos Institucionales
INSERT INTO public.institutional_forms (id, code, name, current_version, effective_date, is_current, is_mandatory, description, instructions, template_file_name)
VALUES
(
    'form-009',
    'FS.GA-FOR-009',
    'Inscripción y Actualización de Proveedores',
    '14.0',
    '2026-01-15',
    true,
    true,
    'Formato oficial obligatorio para el registro, recolección de información tributaria, bancaria, SARLAFT y radicación de proveedores de Flota Sugamuxi S.A.',
    '["Diligenciar la totalidad de las casillas con letra legible o digitalmente.", "Anexar copia del RUT actualizado.", "Adjuntar certificación bancaria no mayor a 30 días.", "Firma del Representante Legal o Persona Natural solicitante."]'::jsonb,
    'FS_GA_FOR_009_Inscripcion_Proveedores_v14.pdf'
),
(
    'form-039',
    'FS.GA-FOR-039',
    'Evaluación y Reevaluación de Proveedores',
    '5.0',
    '2026-02-01',
    true,
    true,
    'Instrumento institucional para la evaluación de desempeño, calidad técnica, oportunidad en entregas y cumplimiento HSEQ de proveedores vinculados.',
    '["Calificar cada criterio de 1 a 100 de acuerdo a la matriz SIG.", "Dejar registro de observaciones y compromisos de mejora si el puntaje es menor a 80.", "Requiere firma del evaluador y responsable del área de compras."]'::jsonb,
    'FS_GA_FOR_039_Evaluacion_Proveedores_v5.pdf'
)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    current_version = EXCLUDED.current_version;

-- 2. Convocatorias Iniciales
INSERT INTO public.convocatorias (id, code, title, category, description, budget, currency, status, opening_date, closing_date, requirements, postulaciones_count)
VALUES
(
    'conv-2026-01',
    'CONV-2026-001',
    'Suministro de Combustible Diésel B10 y Gasolina Corriente para Terminales Boyacá',
    'Combustibles y Lubricantes',
    'Contratación de proveedor mayorista para abastecimiento continuo en las estaciones de Sogamoso, Duitama y Tunja.',
    850000000,
    'COP',
    'ABIERTA',
    '2026-08-01',
    '2026-10-30',
    '["RUT con actividad económica 4661 o 4731", "Certificado de Distribuidor Mayorista SICOM", "Póliza de Responsabilidad Civil Extracontractual vigente", "Capacidad de crédito a 30 días"]'::jsonb,
    3
),
(
    'conv-2026-02',
    'CONV-2026-002',
    'Mantenimiento Integral de Flota, Llantas y Alineación Láser',
    'Mantenimiento Automotriz y Repuestos',
    'Servicio preventivo y correctivo para parque automotor de buses intermunicipales en el corredor Boyacá - Bogotá.',
    420000000,
    'COP',
    'ABIERTA',
    '2026-08-15',
    '2026-11-15',
    '["Taller certificado en Boyacá", "Personal técnico calificado con certificación en mecánica pesada", "Disponibilidad 24/7 para emergencias en carretera"]'::jsonb,
    2
)
ON CONFLICT (id) DO NOTHING;

-- 3. Método de Evaluación SIG (Metodología Oficial de Calificación)
INSERT INTO public.evaluation_method_config (id, name, version, scale_min, scale_max, criteria, score_ranges)
VALUES (
    'current_method',
    'Metodología Institucional de Calificación SIG - Flota Sugamuxi S.A.',
    '3.0',
    0,
    100,
    '[
        {
            "id": "crit-01",
            "name": "Calidad Técnica y Especificaciones del Suministro / Servicio",
            "category": "Calidad y Especificaciones",
            "description": "Conformidad con fichas técnicas, normas técnicas ICONTEC / internacionales y ausencia de garantías reiteradas.",
            "weight": 30,
            "minPassingScore": 70,
            "order": 1,
            "isActive": true
        },
        {
            "id": "crit-02",
            "name": "Oportunidad en Entregas y Capacidad Logística",
            "category": "Oportunidad y Entregas",
            "description": "Cumplimiento estricto de tiempos de entrega pactados y capacidad de stock en terminales Boyacá.",
            "weight": 25,
            "minPassingScore": 70,
            "order": 2,
            "isActive": true
        },
        {
            "id": "crit-03",
            "name": "Seguridad y Salud en el Trabajo (SG-SST), HSEQ y SARLAFT",
            "category": "HSEQ y Normatividad",
            "description": "Acreditación de estándares mínimos SG-SST (Res. 0312), planillas PILA, pólizas RCE y listas restrictivas.",
            "weight": 20,
            "minPassingScore": 75,
            "order": 3,
            "isActive": true
        },
        {
            "id": "crit-04",
            "name": "Garantía, Servicio Posventa y Asistencia Técnica",
            "category": "Garantía y Servicio",
            "description": "Tiempo de respuesta a reclamos, cobertura de garantías sin sobrecostos y acompañamiento en sitio.",
            "weight": 15,
            "minPassingScore": 70,
            "order": 4,
            "isActive": true
        },
        {
            "id": "crit-05",
            "name": "Gestión Comercial, Precios y Plazos de Pago",
            "category": "Gestión Comercial",
            "description": "Competitividad tarifaria, cumplimiento de condiciones comerciales y plazos de facturación pactados.",
            "weight": 10,
            "minPassingScore": 65,
            "order": 5,
            "isActive": true
        }
    ]'::jsonb,
    '[
        {"min": 90, "max": 100, "concept": "SOBRESALIENTE", "label": "Proveedor Estratégico Sobresaliente"},
        {"min": 70, "max": 89.99, "concept": "CONFORME", "label": "Proveedor Conforme Habilitado"},
        {"min": 60, "max": 69.99, "concept": "CONDICIONAL_MEJORA", "label": "Proveedor Condicional con Plan de Mejora"},
        {"min": 0, "max": 59.99, "concept": "NO_CONFORME", "label": "Proveedor No Conforme / Inhabilitado"}
    ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    version = EXCLUDED.version,
    criteria = EXCLUDED.criteria,
    score_ranges = EXCLUDED.score_ranges;
