import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  SupplierDossier,
  Convocatoria,
  SupplierEvaluation,
  InstitutionalForm,
  SystemAuditEntry,
} from '../types';

export const supabaseService = {
  isConfigured: isSupabaseConfigured,

  /**
   * Carga los expedientes de proveedores desde Supabase
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
   * Guarda o actualiza un expediente de proveedor en Supabase
   */
  async saveDossier(dossier: SupplierDossier): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.from('suppliers').upsert({
        id: dossier.id,
        file_number: dossier.fileNumber,
        supplier_type: dossier.supplierType || dossier.basicInfo?.supplierType || 'JURIDICA',
        supplier_tier: dossier.supplierTier || 'B',
        process_status: dossier.processStatus,
        selected_category: dossier.selectedCategory || 'General',
        economic_activity: dossier.economicActivity || '',
        is_email_verified: dossier.isEmailVerified,
        verification_code: dossier.verificationCode,
        basic_info: dossier.basicInfo,
        internal_concepts: dossier.internalConcepts,
        contract_info: dossier.contractInfo,
        assigned_reviewer_id: dossier.assignedReviewerId,
        assigned_reviewer_name: dossier.assignedReviewerName,
        assigned_at: dossier.assignedAt,
        assigned_by: dossier.assignedBy,
        reviewer_notes: dossier.reviewerNotes,
        manual_status_override: dossier.manualStatusOverride,
        manual_status_reason: dossier.manualStatusReason,
        manual_status_changed_at: dossier.manualStatusChangedAt,
        manual_status_changed_by: dossier.manualStatusChangedBy,
        submitted_at: dossier.submittedAt,
        last_review_date: dossier.lastReviewDate,
        audit_history: dossier.auditHistory,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error guardando proveedor en Supabase:', error.message);
        return false;
      }

      // Guardar/Actualizar documentos del expediente
      if (dossier.documents && Object.keys(dossier.documents).length > 0) {
        const docsToUpsert = Object.values(dossier.documents).map((doc) => ({
          id: doc.id || `${dossier.id}-${doc.code}`,
          dossier_id: dossier.id,
          code: doc.code,
          name: doc.name,
          is_required: doc.isRequired,
          is_institutional_form: doc.isInstitutionalForm || false,
          form_code: doc.formCode,
          form_version: doc.formVersion,
          status: doc.status,
          file_name: doc.fileName,
          file_size: doc.fileSize,
          preview_url: doc.previewUrl,
          custom_url: doc.customUrl,
          uploaded_at: doc.uploadedAt,
          uploaded_by: doc.uploadedBy,
          reviewed_at: doc.reviewedAt,
          reviewed_by: doc.reviewedBy,
          expiration_date: doc.expirationDate || null,
          notes: doc.notes,
          correction: doc.correction,
          updated_at: new Date().toISOString(),
        }));

        await supabase.from('supplier_documents').upsert(docsToUpsert);
      }

      return true;
    } catch (err) {
      console.error('Excepción al guardar proveedor en Supabase:', err);
      return false;
    }
  },

  /**
   * Subir archivo a Supabase Storage
   */
  async uploadFileToStorage(
    bucket: 'supplier-documents' | 'institutional-templates',
    path: string,
    file: File | Blob
  ): Promise<string | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: true,
      });

      if (error) {
        console.error('Error al subir archivo a Supabase Storage:', error.message);
        return null;
      }

      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Excepción en uploadFileToStorage:', err);
      return null;
    }
  },

  /**
   * Carga las convocatorias de compras desde Supabase
   */
  async getConvocatorias(): Promise<Convocatoria[] | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('convocatorias')
        .select('*')
        .order('closing_date', { ascending: false });

      if (error) {
        console.error('Error al cargar convocatorias de Supabase:', error.message);
        return null;
      }

      return (data || []).map((c: any) => ({
        id: c.id,
        code: c.code,
        title: c.title,
        category: c.category,
        description: c.description,
        budget: c.budget,
        currency: c.currency,
        status: c.status,
        openingDate: c.opening_date,
        closingDate: c.closing_date,
        requirements: c.requirements || [],
        postulacionesCount: c.postulaciones_count || 0,
      }));
    } catch (err) {
      console.error('Error en getConvocatorias:', err);
      return null;
    }
  },

  /**
   * Guarda una entrada de auditoría en Supabase
   */
  async saveAuditLog(entry: SystemAuditEntry): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.from('system_audit_logs').insert({
        id: entry.id,
        timestamp: entry.timestamp,
        formatted_date: entry.formattedDate,
        dossier_id: entry.dossierId,
        supplier_name: entry.supplierName,
        supplier_doc: entry.supplierDoc,
        file_number: entry.fileNumber,
        user_name: entry.user,
        user_role: entry.userRole,
        action: entry.action,
        section: entry.section,
        field_changed: entry.fieldChanged,
        old_value: String(entry.oldValue ?? ''),
        new_value: String(entry.newValue ?? ''),
        justification: entry.justification,
      });

      return !error;
    } catch (err) {
      console.error('Error guardando auditoría en Supabase:', err);
      return false;
    }
  },

  /**
   * Carga inicial de expedientes en Supabase si la base de datos está vacía
   */
  async seedInitialDossiers(dossiers: SupplierDossier[]): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    try {
      console.info(`⏳ Sincronizando ${dossiers.length} proveedores iniciales con Supabase...`);
      for (const d of dossiers) {
        await this.saveDossier(d);
      }
      console.info('✅ Proveedores iniciales sincronizados con éxito en Supabase.');
      return true;
    } catch (err) {
      console.error('Error al sincronizar proveedores iniciales con Supabase:', err);
      return false;
    }
  },

  /**
   * Guarda una evaluación de proveedor en Supabase
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
        supplier_tier: evaluation.supplierTier,
        category_name: evaluation.categoryName,
        evaluation_type: evaluation.evaluationType,
        annual_cycle_number: evaluation.annualCycleNumber,
        period_year: evaluation.periodYear,
        evaluation_date: evaluation.evaluationDate,
        due_date: evaluation.dueDate,
        evaluator_id: evaluation.evaluatorId,
        evaluator_name: evaluation.evaluatorName,
        evaluator_role: evaluation.evaluatorRole,
        total_score: evaluation.totalScore,
        concept: evaluation.concept,
        criteria_scores: evaluation.criteriaScores || [],
        observations: evaluation.observations,
        strengths: evaluation.strengths,
        improvement_commitments: evaluation.improvementCommitments,
        certificate_code: evaluation.certificateCode,
      });
      return !error;
    } catch (err) {
      console.error('Error guardando evaluación en Supabase:', err);
      return false;
    }
  },
};
