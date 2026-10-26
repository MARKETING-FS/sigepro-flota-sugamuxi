import { EmailNotification, EmailNotificationType, ProcessStatus, DocumentCorrection } from '../types';

export const generateEmailContent = (
  type: EmailNotificationType,
  data: {
    recipientName: string;
    recipientEmail: string;
    fileNumber: string;
    dossierId: string;
    oldStatus?: ProcessStatus;
    newStatus?: ProcessStatus;
    documentName?: string;
    documentCode?: string;
    correction?: DocumentCorrection;
    reviewerNotes?: string;
    reviewerName?: string;
    rejectionReason?: string;
    verificationCode?: string;
    customSubject?: string;
    customBody?: string;
  }
): { subject: string; snippet: string; html: string } => {
  const {
    recipientName,
    recipientEmail,
    fileNumber,
    oldStatus,
    newStatus,
    documentName,
    correction,
    reviewerNotes,
    reviewerName = 'Comité de Contratación y Proveedores Flota Sugamuxi S.A.',
    rejectionReason,
    verificationCode,
    customSubject,
    customBody,
  } = data;

  const nowFormatted = new Date().toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const getStatusLabel = (s?: ProcessStatus) => {
    switch (s) {
      case 'EN_REVISION': return 'EN REVISIÓN';
      case 'REQUIERE_CORRECCION': return 'REQUIERE CORRECCIÓN';
      case 'CORREGIDO_EN_REVISION': return 'CORREGIDO — EN REVISIÓN';
      case 'APROBADO': return 'EXPEDIENTE APROBADO';
      case 'PROVEEDOR_HABILITADO': return 'PROVEEDOR OFICIALMENTE HABILITADO';
      case 'RECHAZADO': return 'SOLICITUD NO APROBADA / RECHAZADA';
      case 'DOCUMENTACION_PENDIENTE': return 'DOCUMENTACIÓN PENDIENTE';
      case 'LISTO_PARA_ENVIO': return 'LISTO PARA ENVÍO';
      default: return s || 'NOTIFICACIÓN';
    }
  };

  let subject = '';
  let snippet = '';
  let contentHtml = '';

  switch (type) {
    case 'CORRECTION_REQUESTED': {
      subject = `[URGENTE] Solicitud de Corrección en Expediente ${fileNumber} - Flota Sugamuxi S.A.`;
      snippet = `Se han formulado observaciones técnicas en el documento "${documentName}". Ingrese al portal para subsanar los puntos requeridos.`;
      contentHtml = `
        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #d97706; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #92400e; margin: 0 0 8px 0; font-size: 15px; font-weight: 700;">
            ⚠️ Acción Requerida: Subsanación Documental
          </h3>
          <p style="color: #78350f; font-size: 13px; margin: 0 0 12px 0; line-height: 1.5;">
            Durante la auditoría de su expediente digital <strong>${fileNumber}</strong>, el equipo evaluador identificó inconsistencias que deben ser subsanadas para continuar el proceso de homologación.
          </p>
          <div style="background-color: #ffffff; border: 1px solid #fde68a; border-radius: 4px; padding: 12px; font-size: 13px;">
            <p style="margin: 0 0 6px 0; color: #1e293b;"><strong>Documento Observado:</strong> <span style="color: #0f172a;">${documentName || 'Documento soporte'}</span></p>
            <p style="margin: 0 0 6px 0; color: #1e293b;"><strong>Sección / Numeral / Página:</strong> <span style="color: #b45309; font-weight: 600;">${correction?.sectionOrPage || 'General'}</span></p>
            <p style="margin: 0 0 6px 0; color: #1e293b;"><strong>Motivo de la Observación:</strong> <span style="color: #b45309; font-weight: 600;">${correction?.reason || 'Información incompleta'}</span></p>
            <div style="margin-top: 10px; padding: 10px; background-color: #f8fafc; border-left: 3px solid #3b82f6; border-radius: 2px;">
              <strong style="color: #1e3a8a; display: block; font-size: 12px; text-transform: uppercase;">Detalle de la Observación del Revisor:</strong>
              <p style="margin: 4px 0 0 0; color: #334155; font-style: italic; font-size: 13px;">
                "${correction?.detailedObservation || reviewerNotes || 'Por favor revisar el documento cargado y actualizar la información correspondiente.'}"
              </p>
            </div>
          </div>
        </div>
        <div style="margin: 20px 0; font-size: 13px; color: #475569; line-height: 1.6;">
          <p><strong>Pasos para subsanar:</strong></p>
          <ol style="padding-left: 20px; margin: 8px 0;">
            <li>Ingrese al Portal de Proveedores Flota Sugamuxi con su correo registrado (<strong>${recipientEmail}</strong>).</li>
            <li>En su expediente digital, ubique el ítem marcado con <em>"Requiere Corrección"</em>.</li>
            <li>Cargue el archivo corregido o con la información solicitada en formato PDF.</li>
            <li>Haga clic en <strong>"Reenviar Expediente con Correcciones"</strong> para que el comité reanude su revisión.</li>
          </ol>
        </div>
      `;
      break;
    }

    case 'STATUS_CHANGE': {
      const isApproved = newStatus === 'APROBADO' || newStatus === 'PROVEEDOR_HABILITADO';
      const isRejected = newStatus === 'RECHAZADO';
      const isCorrections = newStatus === 'REQUIERE_CORRECCION';

      subject = `Notificación de Estado: Su Expediente ${fileNumber} cambió a "${getStatusLabel(newStatus)}" - Flota Sugamuxi S.A.`;
      snippet = `El estado de su solicitud de vinculación ha sido actualizado a ${getStatusLabel(newStatus)}.`;

      let statusColor = '#2563eb';
      let statusBg = '#eff6ff';
      let statusBorder = '#bfdbfe';

      if (isApproved) {
        statusColor = '#15803d';
        statusBg = '#f0fdf4';
        statusBorder = '#bbf7d0';
      } else if (isRejected) {
        statusColor = '#b91c1c';
        statusBg = '#fef2f2';
        statusBorder = '#fecaca';
      } else if (isCorrections) {
        statusColor = '#b45309';
        statusBg = '#fffbeb';
        statusBorder = '#fde68a';
      }

      contentHtml = `
        <div style="background-color: ${statusBg}; border: 1px solid ${statusBorder}; padding: 18px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700;">Actualización de Estado de Homologación</p>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
            <span style="font-size: 18px; font-weight: 800; color: ${statusColor};">
              ${getStatusLabel(newStatus)}
            </span>
          </div>
          <p style="margin: 0; color: #334155; font-size: 13px; line-height: 1.5;">
            Le informamos que el expediente <strong>${fileNumber}</strong> ha sido evaluado por el equipo de revisión interna. 
            ${oldStatus ? `(Estado anterior: <em>${getStatusLabel(oldStatus)}</em>)` : ''}
          </p>
          ${reviewerNotes ? `
            <div style="margin-top: 14px; padding: 12px; background: #ffffff; border-radius: 4px; border: 1px solid ${statusBorder}; font-size: 13px;">
              <strong style="color: ${statusColor};">Observaciones del Evaluador:</strong>
              <p style="margin: 6px 0 0 0; color: #334155;">${reviewerNotes}</p>
            </div>
          ` : ''}
        </div>
      `;
      break;
    }

    case 'DOSSIER_HABILITADO':
    case 'DOSSIER_APPROVED': {
      subject = `[FELICITACIONES] Proveedor Habilitado en Flota Sugamuxi S.A. - Expediente ${fileNumber}`;
      snippet = `Su expediente digital ha sido aprobado satisfactoriamente. Su empresa ahora se encuentra formalmente habilitada como Proveedor Oficial.`;
      contentHtml = `
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; padding: 18px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #166534; margin: 0 0 8px 0; font-size: 16px; font-weight: 800;">
            🎉 Expediente Homologado y Proveedor Habilitado
          </h3>
          <p style="color: #14532d; font-size: 13px; margin: 0 0 12px 0; line-height: 1.6;">
            Nos complace informarle que la documentación legal, comercial, tributaria y de cumplimiento (SARLAFT/HSEQ) presentada para <strong>${recipientName}</strong> bajo el radicado <strong>${fileNumber}</strong> cumple a cabalidad con los estándares del Sistema Integrado de Gestión (SIG) de Flota Sugamuxi S.A.
          </p>
          <div style="background-color: #ffffff; border: 1px solid #86efac; border-radius: 4px; padding: 12px; font-size: 13px;">
            <p style="margin: 0 0 4px 0; color: #166534;"><strong>Número de Registro Proveedor:</strong> <span style="font-family: monospace; font-weight: 700; color: #0f172a;">${fileNumber}</span></p>
            <p style="margin: 0 0 4px 0; color: #166534;"><strong>Vigencia de Homologación:</strong> 1 Año Calendario (Renovación Anual según política SIG)</p>
            <p style="margin: 0; color: #166534;"><strong>Acceso a Convocatorias:</strong> Habilitado para participar y radicar ofertas en todas las licitaciones públicas y privadas de la compañía.</p>
          </div>
        </div>
      `;
      break;
    }

    case 'DOSSIER_REJECTED': {
      subject = `Notificación: Solicitud de Registro No Aprobada - Expediente ${fileNumber}`;
      snippet = `Su expediente digital no ha sido admitido tras la verificación institucional.`;
      contentHtml = `
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #dc2626; padding: 18px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #991b1b; margin: 0 0 8px 0; font-size: 15px; font-weight: 700;">
            Solicitud de Vinculación No Admitida
          </h3>
          <p style="color: #7f1d1d; font-size: 13px; margin: 0 0 12px 0; line-height: 1.5;">
            Le comunicamos que el comité de evaluación ha emitido concepto no favorable para el expediente <strong>${fileNumber}</strong>.
          </p>
          <div style="background-color: #ffffff; border: 1px solid #fca5a5; border-radius: 4px; padding: 12px; font-size: 13px;">
            <strong style="color: #991b1b;">Motivo del Dictamen:</strong>
            <p style="margin: 4px 0 0 0; color: #334155;">${rejectionReason || reviewerNotes || 'No cumple con los requisitos mínimos de contratación o políticas internas de cumplimiento de la entidad.'}</p>
          </div>
        </div>
      `;
      break;
    }

    case 'REGISTRATION_CODE': {
      subject = `Código de Verificación: ${verificationCode || '123456'} - Portal de Proveedores Flota Sugamuxi S.A.`;
      snippet = `Su código de confirmación de correo para el expediente ${fileNumber} es ${verificationCode}.`;
      contentHtml = `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center;">
          <p style="font-size: 13px; color: #475569; margin: 0 0 12px 0;">
            Utilice el siguiente código de seguridad de 6 dígitos para validar su cuenta en el Portal de Proveedores:
          </p>
          <div style="display: inline-block; padding: 12px 24px; background-color: #1e3a8a; color: #ffffff; font-family: monospace; font-size: 24px; font-weight: 800; letter-spacing: 6px; border-radius: 8px;">
            ${verificationCode || '849201'}
          </div>
          <p style="font-size: 11px; color: #94a3b8; margin: 12px 0 0 0;">
            Este código es de uso personal y confidencial. Válido por 24 horas.
          </p>
        </div>
      `;
      break;
    }

    case 'SUBMISSION_CONFIRMATION': {
      subject = `Confirmación de Radicación: Expediente ${fileNumber} en Revisión - Flota Sugamuxi S.A.`;
      snippet = `Hemos recibido formalmente su expediente digital para revisión por parte del comité de compras.`;
      contentHtml = `
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #166534; margin: 0 0 8px 0; font-size: 15px; font-weight: 700;">
            ✓ Expediente Digital Recibido con Éxito
          </h3>
          <p style="color: #14532d; font-size: 13px; margin: 0 0 8px 0; line-height: 1.5;">
            Su expediente <strong>${fileNumber}</strong> ha entrado a la etapa formal de revisión documental, validación de formatos institucionales (FS.GA-FOR-009 y FS.GA-FOR-039) y consulta de listas vinculantes SARLAFT.
          </p>
          <p style="color: #166534; font-size: 12px; margin: 0;">
            Tiempo estimado de respuesta: 2 a 3 días hábiles. Se le notificará a este mismo correo cualquier avance o solicitud de aclaración.
          </p>
        </div>
      `;
      break;
    }

    case 'DOCUMENT_APPROVED': {
      subject = `Documento Aprobado: ${documentName} en Expediente ${fileNumber}`;
      snippet = `El documento "${documentName}" ha sido verificado y aprobado satisfactoriamente.`;
      contentHtml = `
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <h4 style="color: #166534; margin: 0 0 6px 0; font-size: 14px; font-weight: 700;">
            ✓ Documento Validado
          </h4>
          <p style="color: #14532d; font-size: 13px; margin: 0; line-height: 1.5;">
            El documento <strong>${documentName}</strong> ha sido evaluado y aceptado conforme a la normatividad interna.
          </p>
        </div>
      `;
      break;
    }

    case 'CUSTOM_ALERT':
    default: {
      subject = customSubject || `Comunicado Oficial - Expediente ${fileNumber} Flota Sugamuxi S.A.`;
      snippet = customBody?.slice(0, 120) || `Notificación interna generada por la administración de Flota Sugamuxi S.A.`;
      contentHtml = `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 6px; margin: 20px 0;">
          <p style="color: #1e293b; font-size: 13px; line-height: 1.6; margin: 0; white-space: pre-wrap;">
            ${customBody || reviewerNotes || 'Le enviamos esta notificación referente a su proceso de registro de proveedores en Flota Sugamuxi S.A.'}
          </p>
        </div>
      `;
      break;
    }
  }

  // Full Styled Institutional HTML Wrapper
  const fullHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    
    <!-- Institutional Top Header -->
    <div style="background-color: #0f172a; padding: 20px 24px; border-bottom: 3px solid #2563eb;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td>
            <div style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 900; font-size: 16px; font-style: italic; width: 36px; height: 36px; line-height: 36px; text-align: center; border-radius: 4px; vertical-align: middle; margin-right: 10px;">
              FS
            </div>
            <div style="display: inline-block; vertical-align: middle;">
              <span style="color: #ffffff; font-size: 15px; font-weight: 800; letter-spacing: 0.5px; display: block;">FLOTA SUGAMUXI S.A.</span>
              <span style="color: #94a3b8; font-size: 10px; display: block;">NIT: 891.800.075-8 &bull; Sistema Integrado de Gestión (SIG)</span>
            </div>
          </td>
          <td style="text-align: right;">
            <span style="background-color: #1e293b; color: #93c5fd; font-size: 10px; font-family: monospace; padding: 4px 8px; border-radius: 4px; border: 1px solid #334155;">
              ${fileNumber}
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Body Section -->
    <div style="padding: 24px;">
      
      <p style="font-size: 13px; color: #64748b; margin: 0 0 16px 0;">
        Fecha de emisión: <strong>${nowFormatted}</strong>
      </p>

      <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; line-height: 1.4;">
        Estimado(a) <strong>${recipientName}</strong>,
      </h2>

      <p style="font-size: 13px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">
        Le informamos sobre el estado actual de su solicitud en el <strong>Portal de Registro y Homologación de Proveedores</strong> de Flota Sugamuxi S.A.
      </p>

      <!-- Dynamic Template Content -->
      ${contentHtml}

      <!-- Access Portal Button -->
      <div style="text-align: center; margin: 28px 0 20px 0;">
        <a href="#portal" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 6px; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">
          Acceder al Portal de Proveedores Flota Sugamuxi
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />

      <!-- Institutional Signoff -->
      <div style="font-size: 12px; color: #64748b; line-height: 1.5;">
        <p style="margin: 0 0 4px 0; font-weight: 700; color: #1e293b;">
          ${reviewerName}
        </p>
        <p style="margin: 0 0 2px 0;">Departamento de Compras, Contratación y Gestión de Calidad</p>
        <p style="margin: 0 0 2px 0;">Flota Sugamuxi S.A. &bull; Terminal de Transportes, Sogamoso, Boyacá</p>
        <p style="margin: 0;">PBX: (608) 770-2200 Ext. 104 | Correo: <a href="mailto:proveedores@flotasugamuxi.com" style="color: #2563eb; text-decoration: none;">proveedores@flotasugamuxi.com</a></p>
      </div>

    </div>

    <!-- Security & Legal Notice Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; font-size: 10px; color: #94a3b8; text-align: center; line-height: 1.4;">
      Este es un mensaje automático emitido por el Sistema de Información de Flota Sugamuxi S.A. Por favor no responda directamente a este remitente automatizado. Para consultas formales, diríjase a los canales oficiales autorizados.
    </div>

  </div>
</body>
</html>
  `.trim();

  return {
    subject,
    snippet,
    html: fullHtml,
  };
};
