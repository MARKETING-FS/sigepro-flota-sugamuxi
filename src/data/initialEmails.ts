import { EmailNotification } from '../types';
import { generateEmailContent } from '../utils/emailTemplates';

export const INITIAL_EMAIL_NOTIFICATIONS: EmailNotification[] = [
  // 1. Juan Carlos Pérez - Correction Requested (Dossier 002)
  (() => {
    const { subject, snippet, html } = generateEmailContent('CORRECTION_REQUESTED', {
      recipientName: 'Juan Carlos Pérez Gómez',
      recipientEmail: 'juan.perez.mecanica@gmail.com',
      fileNumber: 'FS-PROV-2026-000002',
      dossierId: 'dossier-002',
      documentName: 'Formulario de Inscripción y Actualización de Proveedores (FS.GA-FOR-009)',
      documentCode: 'FS_GA_FOR_009',
      correction: {
        reason: 'Información bancaria incompleta en el numeral III',
        sectionOrPage: 'Numeral III (Información Bancaria)',
        detailedObservation:
          'Por favor completar la información correspondiente a la entidad bancaria en el numeral III: falta marcar el tipo de cuenta (Ahorros/Corriente) y la sucursal de apertura.',
        requestedAt: '2026-08-19 11:20',
        requestedBy: 'Revisor Financiero Flota Sugamuxi S.A.',
      },
      reviewerNotes: 'Corrección requerida en Formulario FS.GA-FOR-009 y Certificación Bancaria.',
      reviewerName: 'Revisor Financiero - Tesorería Flota Sugamuxi S.A.',
    });
    return {
      id: 'email-001',
      dossierId: 'dossier-002',
      recipientEmail: 'juan.perez.mecanica@gmail.com',
      recipientName: 'Juan Carlos Pérez Gómez',
      fileNumber: 'FS-PROV-2026-000002',
      subject,
      templateType: 'CORRECTION_REQUESTED' as const,
      sentAt: '2026-08-19 11:20',
      status: 'DELIVERED' as const,
      previewSnippet: snippet,
      bodyHtml: html,
      read: true,
      metadata: {
        newStatus: 'REQUIERE_CORRECCION',
        documentCode: 'FS_GA_FOR_009',
        documentName: 'Formulario de Inscripción y Actualización (FS.GA-FOR-009)',
        reason: 'Información bancaria incompleta en el numeral III',
        sectionOrPage: 'Numeral III (Información Bancaria)',
        detailedObservation:
          'Por favor completar la información correspondiente a la entidad bancaria en el numeral III: falta marcar el tipo de cuenta (Ahorros/Corriente) y la sucursal de apertura.',
        reviewerName: 'Revisor Financiero Flota Sugamuxi S.A.',
      },
    };
  })(),

  // 2. Juan Carlos Pérez - Second Correction on Bank Certification
  (() => {
    const { subject, snippet, html } = generateEmailContent('CORRECTION_REQUESTED', {
      recipientName: 'Juan Carlos Pérez Gómez',
      recipientEmail: 'juan.perez.mecanica@gmail.com',
      fileNumber: 'FS-PROV-2026-000002',
      dossierId: 'dossier-002',
      documentName: 'Certificación Bancaria Oficial',
      documentCode: 'CERTIFICACION_BANCARIA',
      correction: {
        reason: 'Antigüedad del certificado superior al límite permitido',
        sectionOrPage: 'Documento soporte Certificación Bancaria',
        detailedObservation:
          'El documento presentado fue expedido en enero de 2025 y supera la antigüedad permitida (máximo 30 días). Por favor adjuntar certificado bancario con fecha reciente de agosto 2026.',
        requestedAt: '2026-08-19 11:22',
        requestedBy: 'Tesorería Flota Sugamuxi S.A.',
      },
      reviewerName: 'Tesorería Flota Sugamuxi S.A.',
    });
    return {
      id: 'email-002',
      dossierId: 'dossier-002',
      recipientEmail: 'juan.perez.mecanica@gmail.com',
      recipientName: 'Juan Carlos Pérez Gómez',
      fileNumber: 'FS-PROV-2026-000002',
      subject,
      templateType: 'CORRECTION_REQUESTED' as const,
      sentAt: '2026-08-19 11:22',
      status: 'DELIVERED' as const,
      previewSnippet: snippet,
      bodyHtml: html,
      read: false,
      metadata: {
        newStatus: 'REQUIERE_CORRECCION',
        documentCode: 'CERTIFICACION_BANCARIA',
        documentName: 'Certificación Bancaria Oficial',
        reason: 'Antigüedad del certificado superior al límite permitido',
        sectionOrPage: 'Documento soporte Certificación Bancaria',
        detailedObservation:
          'El documento presentado fue expedido en enero de 2025 y supera la antigüedad permitida (máximo 30 días). Por favor adjuntar certificado bancario con fecha reciente de agosto 2026.',
        reviewerName: 'Tesorería Flota Sugamuxi S.A.',
      },
    };
  })(),

  // 3. Inversiones Boyacá - Submission Received (Dossier 001)
  (() => {
    const { subject, snippet, html } = generateEmailContent('SUBMISSION_CONFIRMATION', {
      recipientName: 'Inversiones y Repuestos Boyacá S.A.S.',
      recipientEmail: 'compras@inversionesboyaca.com',
      fileNumber: 'FS-PROV-2026-000001',
      dossierId: 'dossier-001',
      reviewerName: 'Comité Evaluador de Proveedores',
    });
    return {
      id: 'email-003',
      dossierId: 'dossier-001',
      recipientEmail: 'compras@inversionesboyaca.com',
      recipientName: 'Inversiones y Repuestos Boyacá S.A.S.',
      fileNumber: 'FS-PROV-2026-000001',
      subject,
      templateType: 'SUBMISSION_CONFIRMATION' as const,
      sentAt: '2026-08-20 15:00',
      status: 'DELIVERED' as const,
      previewSnippet: snippet,
      bodyHtml: html,
      read: true,
      metadata: {
        newStatus: 'EN_REVISION',
        reviewerName: 'Comité de Compras Flota Sugamuxi',
      },
    };
  })(),

  // 4. Dossier 003 - Habilitado
  (() => {
    const { subject, snippet, html } = generateEmailContent('DOSSIER_HABILITADO', {
      recipientName: 'Combustibles del Oriente S.A.',
      recipientEmail: 'licitaciones@combustiblesoriente.com',
      fileNumber: 'FS-PROV-2026-000003',
      dossierId: 'dossier-003',
      reviewerName: 'Gerencia Administrativa y Financiera',
    });
    return {
      id: 'email-004',
      dossierId: 'dossier-003',
      recipientEmail: 'licitaciones@combustiblesoriente.com',
      recipientName: 'Combustibles del Oriente S.A.',
      fileNumber: 'FS-PROV-2026-000003',
      subject,
      templateType: 'DOSSIER_HABILITADO' as const,
      sentAt: '2026-08-15 16:45',
      status: 'DELIVERED' as const,
      previewSnippet: snippet,
      bodyHtml: html,
      read: true,
      metadata: {
        newStatus: 'PROVEEDOR_HABILITADO',
        reviewerName: 'Gerencia General Flota Sugamuxi',
      },
    };
  })(),
];
