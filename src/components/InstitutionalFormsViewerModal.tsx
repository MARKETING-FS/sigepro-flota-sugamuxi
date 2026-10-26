import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  Info,
} from 'lucide-react';
import { InstitutionalForm } from '../types';
import { FlotaSugamuxiEmblem } from './FlotaSugamuxiLogo';

interface Props {
  form: InstitutionalForm | null;
  isOpen: boolean;
  onClose: () => void;
  supplierName?: string;
  nitOrDoc?: string;
}

export const InstitutionalFormsViewerModal: React.FC<Props> = ({
  form,
  isOpen,
  onClose,
  supplierName = '',
  nitOrDoc = '',
}) => {
  const [activeTab, setActiveTab] = useState<'vista' | 'instrucciones' | 'historial'>('vista');

  if (!isOpen || !form) return null;

  const isForm009 = form.code === 'FS.GA-FOR-009';

  const handlePrint = () => {
    window.print();
  };

  const handleSimulateDownload = () => {
    const element = document.createElement('a');
    const file = new Blob(
      [
        `=========================================================================\n` +
        `FLOTA SUGAMUXI S.A. - SISTEMA INTEGRADO DE GESTIÓN (SIG)\n` +
        `FORMATO INSTITUCIONAL OFICIAL: ${form.code}\n` +
        `NOMBRE: ${form.name}\n` +
        `VERSIÓN VIGENTE: ${form.currentVersion} | FECHA DE VIGENCIA: ${form.effectiveDate}\n` +
        `OBLIGATORIO: ${form.isMandatory ? 'SÍ' : 'NO'}\n` +
        `=========================================================================\n\n` +
        `INSTRUCCIONES DE DILIGENCIAMIENTO:\n` +
        form.instructions.map((ins, i) => `${i + 1}. ${ins}`).join('\n') +
        `\n\n[Este archivo de muestra representa la plantilla oficial descargable para su posterior diligenciamiento y firma]`
      ],
      { type: 'text/plain;charset=utf-8' }
    );
    element.href = URL.createObjectURL(file);
    element.download = form.templateFileName || `${form.code}_v${form.currentVersion}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-white dark:bg-[#0b1329] rounded-2xl shadow-2xl border border-slate-200 dark:border-blue-900/60 w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-[#0b1329] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-blue-200 flex items-center justify-center p-1 shadow-xs">
              <FlotaSugamuxiEmblem className="w-full h-full" color="#0080d7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-600 text-white uppercase tracking-wider shadow-2xs">
                  {form.code}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  Versión {form.currentVersion} • Vigente: {form.effectiveDate}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight mt-0.5">
                {form.name}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateDownload}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Descargar plantilla oficial para diligenciar"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar formato</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Imprimir formato"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 sm:px-6 flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('vista')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'vista'
                ? 'border-blue-600 dark:border-cyan-400 text-blue-900 dark:text-cyan-300 bg-white dark:bg-[#0b1329] shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Estructura Oficial del Formato
          </button>
          <button
            onClick={() => setActiveTab('instrucciones')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'instrucciones'
                ? 'border-blue-600 dark:border-cyan-400 text-blue-900 dark:text-cyan-300 bg-white dark:bg-[#0b1329] shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            Guía de Diligenciamiento ({form.instructions.length})
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'historial'
                ? 'border-blue-600 dark:border-cyan-400 text-blue-900 dark:text-cyan-300 bg-white dark:bg-[#0b1329] shadow-2xs rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Control de Versiones SIG ({form.versionHistory.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-[#050b18]">
          {activeTab === 'vista' && (
            <div className="max-w-3xl mx-auto bg-white border border-slate-300 rounded-xl shadow-xs p-5 sm:p-8 print:p-0 print:border-none">
              {/* Official Header Table */}
              <div className="border-2 border-slate-800 mb-6 rounded-sm overflow-hidden">
                <div className="grid grid-cols-12 border-b border-slate-800 text-center items-center">
                  <div className="col-span-3 p-3 border-r border-slate-800 flex flex-col items-center justify-center bg-slate-50 gap-1">
                    <div className="w-9 h-9 p-0.5 flex items-center justify-center">
                      <FlotaSugamuxiEmblem className="w-full h-full" color="#0080d7" />
                    </div>
                    <div className="font-extrabold text-[#0b1329] text-xs sm:text-sm tracking-wide">
                      FLOTA SUGAMUXI S.A.
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">NIT 891.800.075-8</div>
                    <div className="text-[9px] text-slate-400">Sogamoso - Boyacá</div>
                  </div>
                  <div className="col-span-6 p-2.5 border-r border-slate-800 flex flex-col justify-center">
                    <div className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500">
                      SISTEMA INTEGRADO DE GESTIÓN (SIG)
                    </div>
                    <div className="font-black text-xs sm:text-sm text-slate-900 uppercase">
                      {form.name}
                    </div>
                  </div>
                  <div className="col-span-3 text-[10px] text-left p-2.5 space-y-1 bg-slate-50 font-mono">
                    <div>
                      <span className="font-bold text-slate-700">CÓDIGO:</span> {form.code}
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">VERSIÓN:</span> {form.currentVersion}
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">FECHA:</span> {form.effectiveDate}
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">PÁGINA:</span> 1 de {isForm009 ? '3' : '1'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form 009 Specific Layout */}
              {isForm009 ? (
                <div className="space-y-5 text-xs text-slate-800">
                  {/* Notice Box */}
                  <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 text-blue-950 text-xs flex items-start gap-2.5 shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-blue-950">Documento Oficial Obligatorio del Expediente Digital</p>
                      <p className="text-slate-700 text-[11px] mt-0.5">
                        Este formato institucional debe ser completado en su totalidad, firmado por el titular o representante legal, y cargado en formato PDF al expediente digital del portal SIGEPRO.
                      </p>
                    </div>
                  </div>

                  {/* Numeral I */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <div className="bg-[#0b1329] text-white font-bold px-3.5 py-2 text-xs flex justify-between items-center">
                      <span>I. INFORMACIÓN GENERAL Y DE IDENTIFICACIÓN</span>
                      <span className="text-[10px] font-normal text-cyan-300">Marcar: [X] Inscripción [ ] Actualización</span>
                    </div>
                    <div className="p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white">
                      <div className="col-span-2 sm:col-span-3">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase">Nombre o Razón Social</label>
                        <div className="p-1.5 border-b border-slate-300 font-semibold text-slate-900">
                          {supplierName || '__________________________________________________'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold uppercase">NIT / Cédula</label>
                        <div className="p-1.5 border-b border-slate-300 font-semibold text-slate-900 font-mono">
                          {nitOrDoc || '____________________'}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase">Dirección Comercial Principal</label>
                        <div className="p-1.5 border-b border-slate-300 text-slate-400">Calle / Carrera / Número / Barrio</div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold uppercase">Ciudad / Municipio</label>
                        <div className="p-1.5 border-b border-slate-300 text-slate-400">Sogamoso / Tunja / Duitama...</div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold uppercase">Teléfono de Contacto</label>
                        <div className="p-1.5 border-b border-slate-300 text-slate-400">(608) / 300 000 0000</div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase">Correo Electrónico para Notificaciones</label>
                        <div className="p-1.5 border-b border-slate-300 text-slate-400">facturacion@proveedor.com</div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-500 font-bold uppercase">Representante Legal (si aplica)</label>
                        <div className="p-1.5 border-b border-slate-300 text-slate-400">Nombre completo y C.C.</div>
                      </div>
                    </div>
                  </div>

                  {/* Numeral II */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <div className="bg-[#0b1329] text-white font-bold px-3.5 py-2 text-xs">
                      II. INFORMACIÓN TRIBUTARIA Y CLASIFICACIÓN
                    </div>
                    <div className="p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white text-[11px]">
                      <div>
                        <span className="font-bold block text-slate-700">Régimen de IVA:</span>
                        <div className="mt-1 space-y-1 text-slate-600">
                          <div>[ ] Responsable de IVA</div>
                          <div>[ ] No Responsable</div>
                        </div>
                      </div>
                      <div>
                        <span className="font-bold block text-slate-700">Tipo de Contribuyente:</span>
                        <div className="mt-1 space-y-1 text-slate-600">
                          <div>[ ] Gran Contribuyente</div>
                          <div>[ ] Régimen Simple (RST)</div>
                        </div>
                      </div>
                      <div>
                        <span className="font-bold block text-slate-700">Retención en la Fuente:</span>
                        <div className="mt-1 space-y-1 text-slate-600">
                          <div>[ ] Autorretenedor Renta</div>
                          <div>[ ] Autorretenedor ICA</div>
                        </div>
                      </div>
                      <div>
                        <span className="font-bold block text-slate-700">Actividad Económica:</span>
                        <div className="p-1.5 border-b border-slate-300 text-slate-500 font-mono">CIIU: __________</div>
                      </div>
                    </div>
                  </div>

                  {/* Numeral III - Banking */}
                  <div className="border-2 border-blue-600/50 rounded-lg overflow-hidden bg-blue-50/20">
                    <div className="bg-blue-900 text-white font-bold px-3.5 py-2 text-xs flex items-center justify-between">
                      <span>III. INFORMACIÓN BANCARIA PARA PAGOS POR TRANSFERENCIA ELECTRÓNICA</span>
                      <span className="text-[10px] bg-blue-700 px-2 py-0.5 rounded text-white font-bold">
                        Requisito Clave
                      </span>
                    </div>
                    <div className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white">
                      <div>
                        <label className="block text-[10px] text-slate-600 font-bold uppercase">Entidad Bancaria</label>
                        <div className="p-1.5 border-b border-slate-300 font-medium text-slate-700">
                          Bancolombia / Banco de Bogotá / Davivienda / BBVA...
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 font-bold uppercase">Tipo de Cuenta</label>
                        <div className="p-1.5 border-b border-slate-300 font-medium text-slate-700">
                          [ ] Cuenta Corriente &nbsp;&nbsp; [ ] Cuenta de Ahorros
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 font-bold uppercase">Número de Cuenta</label>
                        <div className="p-1.5 border-b border-slate-300 font-mono text-slate-700">
                          ___________________________
                        </div>
                      </div>
                      <div className="col-span-1 sm:col-span-3 text-[10px] text-slate-500 italic">
                        * Nota: La cuenta bancaria debe estar a nombre del titular o razón social y coincidir estrictamente con la certificación bancaria adjunta.
                      </div>
                    </div>
                  </div>

                  {/* Numeral IV */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <div className="bg-[#0b1329] text-white font-bold px-3.5 py-2 text-xs">
                      IV. REFERENCIAS COMERCIALES Y BANCARIAS
                    </div>
                    <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white text-[11px]">
                      <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50/50">
                        <span className="font-bold text-slate-800 block mb-1">Referencia Comercial 1</span>
                        <div className="text-slate-600 space-y-1 text-[10px]">
                          <div>Empresa: _____________________________________</div>
                          <div>Contacto: ________________ Tel: _____________</div>
                        </div>
                      </div>
                      <div className="border border-slate-200 p-2.5 rounded-lg bg-slate-50/50">
                        <span className="font-bold text-slate-800 block mb-1">Referencia Comercial 2</span>
                        <div className="text-slate-600 space-y-1 text-[10px]">
                          <div>Empresa: _____________________________________</div>
                          <div>Contacto: ________________ Tel: _____________</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Numeral V */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <div className="bg-[#0b1329] text-white font-bold px-3.5 py-2 text-xs">
                      V. DECLARACIÓN DE ORIGEN DE FONDOS Y FIRMA DEL SOLICITANTE
                    </div>
                    <div className="p-3.5 bg-white space-y-3">
                      <p className="text-[10px] text-slate-600 leading-relaxed text-justify">
                        Declaro bajo la gravedad de juramento que los dineros, bienes y recursos con los cuales ejecuto mis operaciones provienen de actividades lícitas y no provienen de ninguna actividad contemplada en las normas penales colombianas ni en normas internacionales relativas a prevención de lavado de activos y financiación del terrorismo (SARLAFT). Autorizo expresamente a Flota Sugamuxi S.A. a verificar la información suministrada.
                      </p>
                      <div className="pt-6 grid grid-cols-2 gap-6 text-center">
                        <div>
                          <div className="border-b border-slate-400 h-8 mb-1"></div>
                          <div className="text-[10px] font-bold text-slate-800">Firma del Titular / Representante Legal</div>
                          <div className="text-[9px] text-slate-500">C.C. Nº ________________________</div>
                        </div>
                        <div>
                          <div className="border-b border-slate-400 h-8 mb-1"></div>
                          <div className="text-[10px] font-bold text-slate-800">Fecha de Diligenciamiento</div>
                          <div className="text-[9px] text-slate-500">Día _____ / Mes _____ / Año 2026</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Form 039 Layout (Habeas Data) */
                <div className="space-y-5 text-xs text-slate-800">
                  <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 text-blue-950 text-xs flex items-start gap-2.5 shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-blue-950">Protección Constitucional de Datos Personales (Ley 1581 de 2012)</p>
                      <p className="text-slate-700 text-[11px] mt-0.5">
                        Autorización expresa para el tratamiento y almacenamiento seguro de datos personales y comerciales en las bases de datos de Flota Sugamuxi S.A.
                      </p>
                    </div>
                  </div>

                  <div className="border border-slate-300 rounded-xl p-4 sm:p-5 bg-white space-y-4">
                    <h3 className="font-bold text-slate-900 text-center uppercase text-xs tracking-wide">
                      AUTORIZACIÓN EXPRESA PARA EL TRATAMIENTO DE DATOS PERSONALES
                    </h3>

                    <p className="text-[11px] text-slate-700 leading-relaxed text-justify">
                      En cumplimiento de la Ley 1581 de 2012, el Decreto 1377 de 2013 y demás normas concordantes, actuando en nombre propio o en representación legal de la entidad indicada, autorizo de manera voluntaria, previa, explícita e informada a <strong>FLOTA SUGAMUXI S.A.</strong> (NIT 891.800.075-8), domiciliada en la ciudad de Sogamoso (Boyacá), en calidad de Responsable del Tratamiento, para recolectar, almacenar, usar, circular y suprimir los datos personales y comerciales suministrados en este proceso de vinculación.
                    </p>

                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-[10px] space-y-1.5 text-slate-600">
                      <div className="font-bold text-slate-800">FINALIDADES DEL TRATAMIENTO:</div>
                      <div>1. Adelantar el estudio de vinculación, calificación y homologación como proveedor de bienes o servicios.</div>
                      <div>2. Consulta y verificación en listas vinculantes de control de lavado de activos y financiación del terrorismo (SARLAFT/OFAC).</div>
                      <div>3. Gestión contable, fiscal, administrativa, emisión de órdenes de compra, contratos y pagos por transferencias.</div>
                      <div>4. Contacto e invitaciones a participar en procesos de cotización, licitaciones y convocatorias públicas o privadas.</div>
                    </div>

                    <div className="pt-6 grid grid-cols-2 gap-6 text-center">
                      <div>
                        <div className="border-b border-slate-400 h-8 mb-1"></div>
                        <div className="text-[10px] font-bold text-slate-800">Firma del Titular de Datos</div>
                        <div className="text-[9px] text-slate-500">Nombre: {supplierName || '________________________'}</div>
                        <div className="text-[9px] text-slate-500">Doc: {nitOrDoc || '________________________'}</div>
                      </div>
                      <div>
                        <div className="border-b border-slate-400 h-8 mb-1"></div>
                        <div className="text-[10px] font-bold text-slate-800">Huella Dactilar / Fecha</div>
                        <div className="text-[9px] text-slate-500">Fecha: _____ / _____ / 2026</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'instrucciones' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Instrucciones Oficiales de Diligenciamiento
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-700">
                  {form.instructions.map((inst, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{inst}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 text-slate-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Evite Devoluciones o Solicitudes de Corrección</p>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Asegúrese de que las firmas sean legibles (digitales o escaneadas), que el numeral III (datos bancarios) coincida con la certificación de su banco, y que el archivo esté en formato PDF de alta resolución.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'historial' && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-xs">
                    Historial Institucional de Modificaciones (SIG)
                  </h3>
                  <span className="text-[11px] text-slate-600 font-mono font-bold">
                    Código {form.code}
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {form.versionHistory.map((hist, idx) => (
                    <div key={idx} className="p-4 sm:p-5 flex items-start justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            hist.isActive
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            Versión {hist.version} {hist.isActive && '(Vigente Actual)'}
                          </span>
                          <span className="text-slate-500 text-[11px] flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" /> {hist.releaseDate}
                          </span>
                        </div>
                        <p className="text-slate-800 font-medium">{hist.changeSummary}</p>
                        <p className="text-slate-400 text-[11px]">Aprobado por: {hist.modifiedBy}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${
                          hist.isActive ? 'text-blue-700 bg-blue-50 border border-blue-200' : 'text-slate-500'
                        }`}>
                          {hist.isActive ? 'Vigente' : 'Histórico'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 dark:bg-slate-900 px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
            <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Flota Sugamuxi S.A. &bull; Calidad y Servicio</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateDownload}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar plantilla ({form.templateFileName})</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
