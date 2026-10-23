import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  SupplierDossier,
  Convocatoria,
  ConvocatoriaPostulacion,
  SupplierEvaluation,
  InstitutionalForm,
  SystemAuditEntry,
  EmailNotification,
  SystemParametersState,
  CategoryRequirementConfig,
  DocumentDefinition,
  PersonTypeBaseRequirementConfig,
} from '../types';
import { storageService } from './storageService';

export const supabaseService = {
  isConfigured: isSupabaseConfigured,

  // ============================================================================
  // 1. EXPEDIENTES DE PROVEEDORES (suppliers & supplier_documents)
  // ============================================================================

  /**
   * Carga todos los expedientes de proveedores desde Supabase con sus documentos asociados.
   */
  async getDossiers(): Promise<SupplierDossier[] | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const { data: suppliers, error: supError } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (supError) {
        console.error('Error al cargar proveedores de Supabase:', supError.message);
        return null;
      }

      if (!suppliers) return null;
      if (suppliers.length === 0) return [];

      // Cargar documentos relacionados
      const { data: documents, error: docError } = await supabase
        .from('supplier_documents')
        .select('*');

      if (docError) {
        console.warn('Aviso: no se pudieron cargar documentos de Supabase:', docError.message);
      }

      const docsByDossier: Record<string, Record<string, any>> = {};
      (documents || []).forEach((doc: any) => {
        if (!docsByDossier[doc.dossier_id]) {
          docsByDossier[doc.dossier_id] = {};
        }
        docsByDossier[doc.dossier_id][doc.code] = {
          id: doc.id,
          code: doc.code,
          name: doc.name,
          isRequired: doc.is_required,
          isInstitutionalForm: doc.is_institutional_form,
          formCode: doc.form_code,
          formVersion: doc.form_version,
          status: doc.status,
          fileName: doc.file_name,
          fileSize: doc.file_size,
          previewUrl: doc.file_url || doc.preview_url,
          customUrl: doc.custom_url,
          uploadedAt: doc.uploaded_at,
          uploadedBy: doc.uploaded_by,
          reviewedAt: doc.reviewed_at,
          reviewedBy: doc.reviewed_by,
          expirationDate: doc.expiration_date,
          notes: doc.notes,
          correction: doc.correction,
        };
      });

      return suppliers.map((s: any): SupplierDossier => {
        return {
          id: s.id,
          fileNumber: s.file_number,
          supplierType: s.supplier_type,
          supplierTier: s.supplier_tier,
          processStatus: s.process_status,
          selectedCategory: s.selected_category,
          economicActivity: s.economic_activity,
          isEmailVerified: s.is_email_verified,
          verificationCode: s.verification_code,
          basicInfo: s.basic_info || {},
          internalConcepts: s.internal_concepts || {},
          contractInfo: s.contract_info || {},
          documents: docsByDossier[s.id] || {},
          assignedReviewerId: s.assigned_reviewer_id,
          assignedReviewerName: s.assigned_reviewer_name,
          assignedAt: s.assigned_at,
          assignedBy: s.assigned_by,
          reviewerNotes: s.reviewer_notes,
          manualStatusOverride: s.manual_status_override,
          manualStatusReason: s.manual_status_reason,
          manualStatusChangedAt: s.manual_status_changed_at,
          manualStatusChangedBy: s.manual_status_changed_by,
          submittedAt: s.submitted_at,
          lastReviewDate: s.last_review_date,
          auditHistory: s.audit_history || [],
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        };
      });
    } catch (err) {
      console.error('Error de conexión con Supabase en getDossiers:', err);
      return null;
    }
  },

  /**
   * Guarda o actualiza un expediente completo de proveedor en Supabase.
   */
  async saveDossier(dossier: SupplierDossier): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error: supError } = await supabase.from('suppliers').upsert({
        id: dossier.id,
        file_number: dossier.fileNumber,
        supplier_type: dossier.supplierType || dossier.basicInfo?.supplierType || 'JURIDICA',
        supplier_tier: dossier.supplierTier || 'B',
        process_status: dossier.processStatus,
        selected_category: dossier.selectedCategory || 'General',
        economic_activity: dossier.economicActivity || '',
        is_email_verified: Boolean(dossier.isEmailVerified),
        verification_code: dossier.verificationCode || null,
        basic_info: dossier.basicInfo || {},
        internal_concepts: dossier.internalConcepts || {},
        contract_info: dossier.contractInfo || {},
        assigned_reviewer_id: dossier.assignedReviewerId || null,
        assigned_reviewer_name: dossier.assignedReviewerName || null,
        assigned_at: dossier.assignedAt || null,
        assigned_by: dossier.assignedBy || null,
        reviewer_notes: dossier.reviewerNotes || null,
        manual_status_override: Boolean(dossier.manualStatusOverride),
        manual_status_reason: dossier.manualStatusReason || null,
        manual_status_changed_at: dossier.manualStatusChangedAt || null,
        manual_status_changed_by: dossier.manualStatusChangedBy || null,
        submitted_at: dossier.submittedAt || null,
        last_review_date: dossier.lastReviewDate || null,
        audit_history: dossier.auditHistory || [],
        updated_at: new Date().toISOString(),
      });

      if (supError) {
        console.error('Error guardando proveedor en Supabase:', supError.message);
        return false;
      }

      // Guardar/Actualizar documentos del expediente
      if (dossier.documents && Object.keys(dossier.documents).length > 0) {
        const docsToUpsert = Object.values(dossier.documents).map((doc) => ({
          id: doc.id || `${dossier.id}-${doc.code}`,
          dossier_id: dossier.id,
          code: doc.code,
          name: doc.name,
          is_required: Boolean(doc.isRequired),
          is_institutional_form: Boolean(doc.isInstitutionalForm),
          form_code: doc.formCode || null,
          form_version: doc.formVersion || null,
          status: doc.status,
          file_name: doc.fileName || null,
          file_size: doc.fileSize || null,
          file_url: doc.previewUrl || null,
          preview_url: doc.previewUrl || null,
          custom_url: doc.customUrl || null,
          uploaded_at: doc.uploadedAt || null,
          uploaded_by: doc.uploadedBy || null,
          reviewed_at: doc.reviewedAt || null,
          reviewed_by: doc.reviewedBy || null,
          expiration_date: doc.expirationDate || null,
          notes: doc.notes || null,
          correction: doc.correction || null,
          updated_at: new Date().toISOString(),
        }));

        const { error: docError } = await supabase.from('supplier_documents').upsert(docsToUpsert);
        if (docError) {
          console.warn('Aviso al guardar documentos en Supabase:', docError.message);
        }
      }

      return true;
    } catch (err) {
      console.error('Excepción al guardar proveedor en Supabase:', err);
      return false;
    }
  },

  /**
   * Elimina un proveedor y sus documentos asociados en cascada.
   */
  async deleteDossier(dossierId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', dossierId);
      if (error) {
        console.error('Error al eliminar proveedor en Supabase:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Excepción al eliminar proveedor:', err);
      return false;
    }
  },

  // ============================================================================
  // 2. CONVOCATORIAS DE COMPRAS (convocatorias & postulaciones)
  // ============================================================================

  /**
   * Carga las convocatorias de compras con sus postulaciones desde Supabase.
   */
  async getConvocatorias(): Promise<Convocatoria[] | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const { data: convs, error: convError } = await supabase
        .from('convocatorias')
        .select('*')
        .order('closing_date', { ascending: false });

      if (convError) {
        console.error('Error al cargar convocatorias de Supabase:', convError.message);
        return null;
      }

      if (!convs) return null;

      // Cargar postulaciones asociadas
      const { data: postData } = await supabase
        .from('convocatoria_postulaciones')
        .select('*');

      const postsByConv: Record<string, ConvocatoriaPostulacion[]> = {};
      (postData || []).forEach((p: any) => {
        if (!postsByConv[p.convocatoria_id]) {
          postsByConv[p.convocatoria_id] = [];
        }
        postsByConv[p.convocatoria_id].push({
          id: p.id,
          supplierId: p.supplier_id || '',
          supplierName: p.supplier_name,
          fileNumber: p.file_number || '',
          supplierStatus: 'PROVEEDOR_HABILITADO',
          nitOrDoc: p.supplier_doc || '',
          contactEmail: p.supplier_email || '',
          proposedValue: Number(p.proposed_value || 0),
          proposalSummary: p.notes || '',
          submittedAt: p.submitted_at,
          status: p.status || 'POSTULADO',
          quotationFiles: p.documents || [],
        });
      });

      return convs.map((c: any): Convocatoria => {
        const postulaciones = postsByConv[c.id] || [];
        return {
          id: c.id,
          code: c.code,
          title: c.title,
          category: c.category,
          description: c.description || '',
          requirementsSummary: Array.isArray(c.requirements) ? c.requirements : [],
          budgetEstimateCOP: c.budget ? Number(c.budget) : undefined,
          publishedDate: c.opening_date || '',
          closingDate: c.closing_date || '',
          accessRule: (c.access_rule as any) || 'OPCION_A',
          status: c.status || 'ABIERTA',
          termsFileName: c.terms_file_name || `Pliego_${c.code}.pdf`,
          postulaciones,
        };
      });
    } catch (err) {
      console.error('Error en getConvocatorias:', err);
      return null;
    }
  },

  /**
   * Guarda o actualiza una convocatoria en Supabase.
   */
  async saveConvocatoria(conv: Convocatoria): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.from('convocatorias').upsert({
        id: conv.id,
        code: conv.code,
        title: conv.title,
        category: conv.category,
        description: conv.description,
        budget: conv.budgetEstimateCOP || null,
        currency: 'COP',
        status: conv.status,
        opening_date: conv.publishedDate || new Date().toISOString().split('T')[0],
        closing_date: conv.closingDate,
        requirements: conv.requirementsSummary || [],
        postulaciones_count: conv.postulaciones?.length || 0,
        updated_at: new Date().toISOString(),
      });

      return !error;
    } catch (err) {
      console.error('Error guardando convocatoria en Supabase:', err);
      return false;
    }
  },

  /**
   * Guarda una postulación a convocatoria en Supabase.
   */
  async savePostulacion(convocatoriaId: string, postulacion: ConvocatoriaPostulacion): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.from('convocatoria_postulaciones').upsert({
        id: postulacion.id,
        convocatoria_id: convocatoriaId,
        supplier_id: postulacion.supplierId || null,
        file_number: postulacion.fileNumber || null,
        supplier_name: postulacion.supplierName,
        supplier_doc: postulacion.nitOrDoc || null,
        supplier_email: postulacion.contactEmail || null,
        status: postulacion.status,
        submitted_at: postulacion.submittedAt || new Date().toISOString(),
        notes: postulacion.proposalSummary || null,
        documents: postulacion.quotationFiles || [],
      });

      if (!error) {
        // Actualizar contador en convocatoria
        try { await supabase.rpc('increment_convocatoria_count', { conv_id: convocatoriaId }); } catch {}
      }

      return !error;
    } catch (err) {
      console.error('Error al guardar postulación:', err);
      return false;
    }
  },

  // ============================================================================
  // 3. EVALUACIONES Y CALIFICACIONES SIG (supplier_evaluations)
  // ============================================================================

  /**
   * Carga todas las evaluaciones de proveedores desde Supabase.
   */
  async getEvaluations(): Promise<SupplierEvaluation[] | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('supplier_evaluations')
        .select('*')
        .order('evaluation_date', { ascending: false });

      if (error) {
        console.error('Error cargando evaluaciones de Supabase:', error.message);
        return null;
      }

      if (!data) return [];

      return data.map((e: any): SupplierEvaluation => ({
        id: e.id,
        dossierId: e.dossier_id,
        supplierName: e.supplier_name,
        supplierDoc: e.supplier_doc,
        fileNumber: e.file_number,
        supplierTier: e.supplier_tier,
        categoryName: e.category_name,
        evaluationType: e.evaluation_type,
        annualCycleNumber: e.annual_cycle_number,
        periodYear: e.period_year,
        evaluationDate: e.evaluation_date,
        dueDate: e.due_date,
        evaluatorId: e.evaluator_id,
        evaluatorName: e.evaluator_name,
        evaluatorRole: e.evaluator_role,
        totalScore: Number(e.total_score || 0),
        concept: e.concept,
        criteriaScores: e.criteria_scores || [],
        observations: e.observations,
        hasImprovementPlan: Boolean(e.has_improvement_plan),
        improvementPlanAction: e.improvement_plan_action,
        improvementPlanDeadline: e.improvement_plan_deadline,
        nextEvaluationDueDate: e.next_evaluation_due_date,
        status: e.status || 'COMPLETADA',
        certificateCode: e.certificate_code,
        createdAt: e.created_at || new Date().toISOString(),
      }));
    } catch (err) {
      console.error('Excepción en getEvaluations:', err);
      return null;
    }
  },

  /**
   * Guarda o actualiza una evaluación de proveedor en Supabase.
   */
  async saveEvaluation(evaluation: SupplierEvaluation): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.from('supplier_evaluations').upsert({
        id: evaluation.id,
        dossier_id: evaluation.dossierId,
        supplier_name: evaluation.supplierName,
        supplier_doc: evaluation.supplierDoc,
        file_number: evaluation.fileNumber,
        supplier_tier: evaluation.supplierTier || null,
        category_name: evaluation.categoryName || null,
        evaluation_type: evaluation.evaluationType,
        annual_cycle_number: evaluation.annualCycleNumber || null,
        period_year: evaluation.periodYear || null,
        evaluation_date: evaluation.evaluationDate,
        due_date: evaluation.dueDate || null,
        evaluator_id: evaluation.evaluatorId,
        evaluator_name: evaluation.evaluatorName,
        evaluator_role: evaluation.evaluatorRole || null,
        total_score: evaluation.totalScore,
        concept: evaluation.concept,
        criteria_scores: evaluation.criteriaScores || [],
        observations: evaluation.observations || null,
        certificate_code: evaluation.certificateCode || null,
      });

      if (error) {
        console.error('Error guardando evaluación en Supabase:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Excepción al guardar evaluación en Supabase:', err);
      return false;
    }
  },

  // ============================================================================
  // 4. FORMATOS INSTITUCIONALES (institutional_forms)
  // ============================================================================

  /**
   * Carga los formatos institucionales oficiales (FS.GA-FOR-009, FS.GA-FOR-039).
   */
  async getInstitutionalForms(): Promise<InstitutionalForm[] | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('institutional_forms')
        .select('*')
        .order('code', { ascending: true });

      if (error || !data || data.length === 0) return null;

      return data.map((f: any): InstitutionalForm => ({
        id: f.id,
        code: f.code,
        name: f.name,
        currentVersion: f.current_version,
        effectiveDate: f.effective_date,
        isCurrent: Boolean(f.is_current),
        isMandatory: Boolean(f.is_mandatory),
        description: f.description || '',
        instructions: f.instructions || [],
        templateFileName: f.template_file_name || '',
        versionHistory: f.version_history || [],
      }));
    } catch {
      return null;
    }
  },

  async saveInstitutionalForm(form: InstitutionalForm): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.from('institutional_forms').upsert({
        id: form.id,
        code: form.code,
        name: form.name,
        current_version: form.currentVersion,
        effective_date: form.effectiveDate,
        is_current: form.isCurrent,
        is_mandatory: form.isMandatory,
        description: form.description,
        instructions: form.instructions || [],
        template_file_name: form.templateFileName,
        version_history: form.versionHistory || [],
        updated_at: new Date().toISOString(),
      });
      return !error;
    } catch {
      return false;
    }
  },

  // ============================================================================
  // 5. AUDITORÍA FORENSE (system_audit_logs)
  // ============================================================================

  /**
   * Carga los registros de auditoría forense desde Supabase.
   */
  async getAuditLogs(): Promise<SystemAuditEntry[] | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('system_audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(200);

      if (error || !data) return null;

      return data.map((l: any): SystemAuditEntry => ({
        id: l.id,
        timestamp: l.timestamp,
        formattedDate: l.formatted_date || '',
        dossierId: l.dossier_id || '',
        supplierName: l.supplier_name || '',
        supplierDoc: l.supplier_doc || '',
        fileNumber: l.file_number || '',
        user: l.user_name || '',
        userRole: l.user_role || 'SYSTEM',
        action: l.action,
        section: l.section || '',
        fieldChanged: l.field_changed || '',
        oldValue: l.old_value || '',
        newValue: l.new_value || '',
        justification: l.justification || '',
      }));
    } catch {
      return null;
    }
  },

  /**
   * Guarda una entrada de auditoría en Supabase.
   */
  async saveAuditLog(entry: SystemAuditEntry): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.from('system_audit_logs').insert({
        id: entry.id,
        timestamp: entry.timestamp,
        formatted_date: entry.formattedDate,
        dossier_id: entry.dossierId || null,
        supplier_name: entry.supplierName || null,
        supplier_doc: entry.supplierDoc || null,
        file_number: entry.fileNumber || null,
        user_name: entry.user,
        user_role: entry.userRole,
        action: entry.action,
        section: entry.section,
        field_changed: entry.fieldChanged,
        old_value: String(entry.oldValue ?? ''),
        new_value: String(entry.newValue ?? ''),
        justification: entry.justification || null,
      });

      return !error;
    } catch (err) {
      console.error('Error guardando auditoría en Supabase:', err);
      return false;
    }
  },

  // ============================================================================
  // 6. HISTORIAL DE CORREOS (email_notifications)
  // ============================================================================

  async getEmailNotifications(): Promise<EmailNotification[] | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('email_notifications')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error || !data) return null;

      return data.map((e: any): EmailNotification => ({
        id: e.id,
        dossierId: e.dossier_id || '',
        recipientEmail: e.recipient_email,
        recipientName: e.recipient_name,
        fileNumber: '',
        subject: e.subject,
        templateType: e.type,
        sentAt: e.sent_at,
        status: (e.status === 'DELIVERED' ? 'DELIVERED' : 'SENT') as any,
        previewSnippet: e.subject,
        bodyHtml: e.content,
      }));
    } catch {
      return null;
    }
  },

  async saveEmailNotification(notif: EmailNotification): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.from('email_notifications').insert({
        id: notif.id,
        dossier_id: notif.dossierId || null,
        recipient_email: notif.recipientEmail,
        recipient_name: notif.recipientName,
        subject: notif.subject,
        type: notif.templateType,
        content: notif.bodyHtml || notif.previewSnippet,
        status: notif.status,
        sent_at: notif.sentAt || new Date().toISOString(),
      });
      return !error;
    } catch {
      return false;
    }
  },

  // ============================================================================
  // 7. PARÁMETROS GLOBALES DEL SISTEMA (system_parameters)
  // ============================================================================

  async getCategoriesConfig(): Promise<CategoryRequirementConfig[] | null> {
    if (!isSupabaseConfigured() || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('system_parameters')
        .select('categories_config')
        .eq('id', 'global_parameters')
        .maybeSingle();

      if (error) {
        console.error('[Supabase] Error consultando categories_config:', error);
        return null;
      }
      if (!data || !Array.isArray(data.categories_config)) return null;
      return data.categories_config as CategoryRequirementConfig[];
    } catch (err) {
      console.error('[Supabase] Excepción consultando categories_config:', err);
      return null;
    }
  },

  async saveCategoriesConfig(categories: CategoryRequirementConfig[]): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    try {
      const { error } = await supabase.from('system_parameters').upsert({
        id: 'global_parameters',
        categories_config: categories,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error('[Supabase] Error guardando categories_config:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase] Excepción guardando categories_config:', err);
      return false;
    }
  },

  async getDocumentDefinitions(): Promise<DocumentDefinition[] | null> {
    if (!isSupabaseConfigured() || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('system_parameters')
        .select('document_definitions')
        .eq('id', 'global_parameters')
        .maybeSingle();

      if (error) {
        console.error('[Supabase] Error consultando document_definitions:', error);
        return null;
      }
      if (!data || !Array.isArray(data.document_definitions)) return null;
      return data.document_definitions as DocumentDefinition[];
    } catch (err) {
      console.error('[Supabase] Excepción consultando document_definitions:', err);
      return null;
    }
  },

  async saveDocumentDefinitions(docDefs: DocumentDefinition[]): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    try {
      const { error } = await supabase.from('system_parameters').upsert({
        id: 'global_parameters',
        document_definitions: docDefs,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error('[Supabase] Error guardando document_definitions:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase] Excepción guardando document_definitions:', err);
      return false;
    }
  },

  async getBaseRequirementsConfig(): Promise<Record<'NATURAL' | 'JURIDICA', PersonTypeBaseRequirementConfig> | null> {
    if (!isSupabaseConfigured() || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('system_parameters')
        .select('base_requirements')
        .eq('id', 'global_parameters')
        .maybeSingle();

      if (error) {
        console.error('[Supabase] Error consultando base_requirements:', error);
        return null;
      }
      if (!data || !data.base_requirements || typeof data.base_requirements !== 'object') return null;
      const res = data.base_requirements as Record<'NATURAL' | 'JURIDICA', PersonTypeBaseRequirementConfig>;
      if (!res.NATURAL || !res.JURIDICA) return null;
      return res;
    } catch (err) {
      console.error('[Supabase] Excepción consultando base_requirements:', err);
      return null;
    }
  },

  async saveBaseRequirementsConfig(
    baseReqs: Record<'NATURAL' | 'JURIDICA', PersonTypeBaseRequirementConfig>
  ): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    try {
      const { error } = await supabase.from('system_parameters').upsert({
        id: 'global_parameters',
        base_requirements: baseReqs,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error('[Supabase] Error guardando base_requirements:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Supabase] Excepción guardando base_requirements:', err);
      return false;
    }
  },

  async getSystemParameters(): Promise<SystemParametersState | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('system_parameters')
        .select('*')
        .eq('id', 'global_parameters')
        .maybeSingle();

      if (error || !data || !data.parameters_state) return null;
      return data.parameters_state as SystemParametersState;
    } catch {
      return null;
    }
  },

  async saveSystemParameters(
    params: SystemParametersState,
    categories?: CategoryRequirementConfig[],
    docDefs?: DocumentDefinition[],
    baseReqs?: Record<'NATURAL' | 'JURIDICA', PersonTypeBaseRequirementConfig>
  ): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.from('system_parameters').upsert({
        id: 'global_parameters',
        parameters_state: params,
        categories_config: categories || [],
        document_definitions: docDefs || [],
        base_requirements: baseReqs || {},
        updated_at: new Date().toISOString(),
      });
      return !error;
    } catch {
      return false;
    }
  },

  // ============================================================================
  // 8. ALMACENAMIENTO DE ARCHIVOS (Delegado a storageService / Supabase Storage)
  // ============================================================================

  /**
   * Sube archivo al almacenamiento configurado (Supabase Storage o Microsoft OneDrive).
   */
  async uploadFileToStorage(
    bucket: 'supplier-documents' | 'institutional-templates',
    path: string,
    file: File | Blob
  ): Promise<string | null> {
    const res = await storageService.getProvider().upload({
      file,
      fileName: path.split('/').pop() || 'archivo.pdf',
      folder: bucket,
    });
    return res.success ? res.url : null;
  },
};
