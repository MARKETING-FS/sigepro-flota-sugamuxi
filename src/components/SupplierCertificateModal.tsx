import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Award,
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  Building2,
  User,
  MapPin,
  Mail,
  Phone,
  QrCode,
  FileCheck,
  Calendar,
  Lock,
} from 'lucide-react';
import { SupplierDossier, SupplierDocument } from '../types';
import { FlotaSugamuxiEmblem } from './FlotaSugamuxiLogo';

interface SupplierCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: SupplierDossier | null;
}

export const SupplierCertificateModal: React.FC<SupplierCertificateModalProps> = ({
  isOpen,
  onClose,
  dossier,
}) => {
  const { documentDefinitions } = useApp();
  if (!isOpen || !dossier) return null;

  const isNatural = dossier.basicInfo.supplierType === 'NATURAL';
  const supplierName = isNatural ? dossier.basicInfo.fullName : dossier.basicInfo.companyName;
  const supplierDoc = isNatural ? dossier.basicInfo.documentNumber : dossier.basicInfo.nit;
  // Ordenar los documentos de acuerdo al orden parametrizado en la Matriz de Requisitos (documentDefinitions)
  const getDocMatrixOrder = (code?: string): number => {
    if (!code) return 9999;
    if (code === 'FS_GA_FOR_009') return 0;
    if (code === 'FS_GA_FOR_039') return 1;
    const defIdx = (documentDefinitions || []).findIndex((d) => d.code === code);
    return defIdx !== -1 ? defIdx : 9999;
  };

  const rawDocList: SupplierDocument[] = Object.values(dossier.documents || {}) as SupplierDocument[];
  const docList: SupplierDocument[] = [...rawDocList].sort((a, b) => {
    const ordA = getDocMatrixOrder(a.code);
    const ordB = getDocMatrixOrder(b.code);
    if (ordA !== ordB) return ordA - ordB;
    return (a.name || '').localeCompare(b.name || '');
  });
  const approvedDocs = docList.filter((d: SupplierDocument) => d.status === 'APROBADO');
  const allApproved = docList.length > 0 && docList.every((d: SupplierDocument) => d.status === 'APROBADO');

  const todayStr = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const validityDateStr = nextYear.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[94vh]">
        
        {/* Top Controls Bar (Non-Printable) */}
        <div className="bg-[#0b1329] text-white px-5 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900/80 border border-cyan-400/40 flex items-center justify-center">
              <Award className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <span className="font-bold text-sm text-white block">
                Ficha Oficial & Certificado de Habilitación de Proveedor
              </span>
              <span className="text-[10px] text-slate-400">
                Sistema Integrado de Gestión &bull; SIG Flota Sugamuxi S.A.
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Imprimir documento o Guardar como PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Exportar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white space-y-6 text-slate-800 leading-relaxed print:p-0 print:overflow-visible">
          
          {/* Header Letterhead */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 bg-white border border-blue-200 rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
                <FlotaSugamuxiEmblem className="w-full h-full" color="#0080d7" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                  FLOTA SUGAMUXI S.A.
                </h1>
                <p className="text-xs text-slate-600 font-bold">
                  NIT: 891.800.089-1 &bull; SIG - Sistema Integrado de Gestión ISO 9001:2015
                </p>
                <p className="text-[11px] text-slate-500">
                  Departamento de Compras, Contratación y Homologación de Proveedores
                </p>
              </div>
            </div>

            <div className="text-right font-mono text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Radicación Oficial SIG</div>
              <div className="text-sm font-black text-blue-900">{dossier.fileNumber}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Fecha de Emisión: <strong>{todayStr}</strong>
              </div>
              <div className="text-[10px] text-blue-700 font-bold mt-0.5">
                Vigencia Anual: {validityDateStr}
              </div>
            </div>
          </div>

          {/* Certificate Main Title */}
          <div className="text-center space-y-1 py-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-black uppercase mb-1">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Certificación Oficial de Homologación Empresarial</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black uppercase text-slate-900 tracking-wide">
              FICHA OFICIAL & CERTIFICADO DE HABILITACIÓN DE PROVEEDOR
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl mx-auto font-medium">
              El Departamento Administrativo, la Coordinación del Sistema Integrado de Gestión (SIG) y el Comité de Compras de <strong>FLOTA SUGAMUXI S.A.</strong> certifican que el proponente ha superado con éxito la auditoría documental y debida diligencia.
            </p>
          </div>

          {/* Section 1: Identificación del Proveedor */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                {isNatural ? <User className="w-4 h-4 text-blue-600" /> : <Building2 className="w-4 h-4 text-blue-600" />}
                <span>I. Información General y Registro Tributario</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-900 rounded-md">
                {isNatural ? 'Persona Natural' : 'Persona Jurídica'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Razón Social / Proveedor</span>
                <span className="font-extrabold text-slate-900 text-sm block mt-0.5">
                  {supplierName}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  {isNatural ? 'Cédula de Ciudadanía' : 'NIT / RUT'}
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">
                  {supplierDoc}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Categoría de Bien / Servicio</span>
                <span className="font-bold text-blue-900 block mt-0.5">
                  {dossier.selectedCategory}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Ciudad / Domicilio Principal</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{dossier.basicInfo.city} ({dossier.basicInfo.department || 'Colombia'})</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Correo Electrónico Notificaciones</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{dossier.basicInfo.email}</span>
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Teléfono / Celular de Contacto</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{dossier.basicInfo.phone}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Estado de Homologación y SARLAFT */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-900 block">Estado Homologación</span>
                <span className="font-black text-blue-800 text-sm mt-1 block">
                  PROVEEDOR HABILITADO
                </span>
              </div>
              <span className="text-[10px] text-blue-700 font-semibold mt-1">Cumplimiento SIG 100%</span>
            </div>

            <div className="p-3.5 bg-cyan-50/60 rounded-xl border border-cyan-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-cyan-950 block">Debida Diligencia SARLAFT</span>
                <span className="font-black text-cyan-900 text-sm mt-1 block flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                  <span>SIN COINCIDENCIAS</span>
                </span>
              </div>
              <span className="text-[10px] text-cyan-800 font-semibold mt-1">Listas Vinculantes & OFAC</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-600 block">Formatos SIG Institucionales</span>
                <span className="font-black text-slate-800 text-xs mt-1 block">
                  FS.GA-FOR-009 v14.0 &bull; 039 v1.0
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold mt-1">Suscritos y Custodiados</span>
            </div>
          </div>

          {/* Section 3: Inventario de Documentos del Expediente Aprobados */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <div className="bg-[#0b1329] text-white px-4 py-2.5 font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-cyan-300" />
                <span>II. Registro y Auditoría de Documentos del Expediente ({docList.length} ítems)</span>
              </span>
              <span className="text-[10px] bg-blue-900 text-cyan-200 px-2 py-0.5 rounded-full border border-cyan-400/40">
                100% Aprobados & Verificados
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 bg-white">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Documento / Requisito</th>
                    <th className="px-3 py-2">Archivo</th>
                    <th className="px-3 py-2">Fecha Aprobación</th>
                    <th className="px-3 py-2 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {docList.map((doc, idx) => (
                    <tr key={doc.id || idx} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 text-slate-900 font-semibold">
                        {documentDefinitions?.find((def) => def.code === doc.code)?.name || doc.name}
                        {doc.expirationDate && (
                          <span className="block text-[10px] text-slate-500">
                            Vence: {doc.expirationDate}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-600 truncate max-w-[160px]">
                        {doc.fileName || 'documento_oficial.pdf'}
                      </td>
                      <td className="px-3 py-2 text-slate-600 text-[11px]">
                        {doc.reviewedAt || doc.uploadedAt || todayStr}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-900 rounded-full border border-blue-300">
                          <CheckCircle2 className="w-3 h-3 text-blue-700" />
                          APROBADO
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Cláusula de Validez y Marco Regulatorio */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1.5 leading-relaxed text-justify">
            <p>
              <strong>DECLARACIÓN DE HOMOLOGACIÓN:</strong> El presente certificado acredita que el proveedor ha suministrado en su totalidad la documentación técnica, tributaria, jurídica y financiera exigida por <strong>FLOTA SUGAMUXI S.A.</strong>, cumpliendo con la política de contratación, el Sistema de Autocontrol y Gestión del Riesgo Integral contra el Lavado de Activos y Financiación del Terrorismo (SAGRILAFT/SARLAFT) y los estándares de calidad ISO 9001:2015.
            </p>
            <p>
              La información contenida en el presente documento es de carácter confidencial y está protegida bajo la Ley Estatutaria 1581 de 2012 de Protección de Datos Personales (Habeas Data).
            </p>
          </div>

          {/* Section 5: Firmas Digitales y Sello de Seguridad */}
          <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end text-center text-xs">
            
            {/* Firma 1 */}
            <div>
              <div className="h-10 flex items-center justify-center">
                <span className="font-serif italic font-bold text-slate-700 text-sm">
                  Coordinación S.I.G.
                </span>
              </div>
              <div className="w-40 h-0.5 bg-slate-800 mx-auto mb-1"></div>
              <div className="font-bold text-slate-900">Coordinación SIG / Calidad</div>
              <div className="text-[10px] text-slate-500">Flota Sugamuxi S.A.</div>
            </div>

            {/* Sello / QR Central */}
            <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-14 h-14 bg-white border border-slate-300 rounded-lg p-1 flex items-center justify-center mb-1 shadow-2xs">
                <QrCode className="w-full h-full text-slate-800" />
              </div>
              <span className="text-[9px] font-mono text-slate-600 font-bold uppercase">
                Validación Digital SIG
              </span>
              <span className="text-[8px] font-mono text-slate-400 truncate max-w-[150px]">
                HASH: {dossier.id.substring(0, 16).toUpperCase()}
              </span>
            </div>

            {/* Firma 2 */}
            <div>
              <div className="h-10 flex items-center justify-center">
                <span className="font-serif italic font-bold text-slate-700 text-sm">
                  Comité de Compras
                </span>
              </div>
              <div className="w-40 h-0.5 bg-slate-800 mx-auto mb-1"></div>
              <div className="font-bold text-slate-900">Dirección de Compras y Suministros</div>
              <div className="text-[10px] text-slate-500">Flota Sugamuxi S.A.</div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
