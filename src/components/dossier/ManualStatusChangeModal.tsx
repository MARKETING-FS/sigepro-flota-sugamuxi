import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  FileCheck2,
  Calendar,
  History,
  CheckCircle2,
  Briefcase,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  FileText,
  Building2,
  User,
} from 'lucide-react';
import {
  ProcessStatus,
  SupplierContractInfo,
  SupplierDossier,
  ContractValidityStatus,
} from '../../types';
import {
  calculateContractValidity,
  getProcessStatusLabel,
  getContractStatusLabel,
  getCreationStatus,
  getContractualStatus,
} from '../../utils/contractValidity';

interface ManualStatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: SupplierDossier | null;
  onConfirmStatusChange: (
    dossierId: string,
    newStatus: ProcessStatus,
    reason: string,
    reviewerName: string,
    updatedContract?: Partial<SupplierContractInfo>
  ) => void;
  currentUserName?: string;
}

export const ManualStatusChangeModal: React.FC<ManualStatusChangeModalProps> = ({
  isOpen,
  onClose,
  dossier,
  onConfirmStatusChange,
  currentUserName,
}) => {
  if (!isOpen || !dossier) return null;

  const isNatural = dossier.basicInfo?.supplierType === 'NATURAL';
  const supplierName = isNatural
    ? dossier.basicInfo?.fullName || 'Persona Natural'
    : dossier.basicInfo?.companyName || 'Persona Jurídica';
  const supplierDoc = isNatural
    ? dossier.basicInfo?.documentNumber || 'Sin Cédula'
    : dossier.basicInfo?.nit || 'Sin NIT';

  // Tabs: 1. Estado del Proveedor | 2. Estado del Contrato | 3. Trazabilidad
  const [activeTab, setActiveTab] = useState<'STATUS' | 'CONTRACT' | 'HISTORY'>('STATUS');

  // DIMENSIÓN 1: Estado del Proveedor (Homologación y Cumplimiento SIG)
  // Normalizar para que solo contenga estados propios de proveedor
  const getInitialSupplierStatus = (status: ProcessStatus): ProcessStatus => {
    if (
      status === 'CONTRATO_VIGENTE' ||
      status === 'CONTRATO_POR_VENCER' ||
      status === 'CONTRATO_VENCIDO'
    ) {
      return 'PROVEEDOR_HABILITADO';
    }
    return status || 'EN_REVISION';
  };

  const [selectedStatus, setSelectedStatus] = useState<ProcessStatus>(
    getInitialSupplierStatus(dossier.processStatus)
  );
  const [reasonObservation, setReasonObservation] = useState<string>(
    dossier.manualStatusReason || ''
  );
  const [authorName, setAuthorName] = useState<string>(
    currentUserName || 'Comité de Compras Flota Sugamuxi'
  );

  // DIMENSIÓN 2: Estado y Datos del Contrato (Vigencia Contractual)
  const existingContract = dossier.contractInfo;
  const initialContractStatus: ContractValidityStatus =
    existingContract?.contractStatus ||
    (existingContract?.endDate
      ? calculateContractValidity(existingContract.endDate).status
      : 'SIN_CONTRATO');

  const [selectedContractStatus, setSelectedContractStatus] =
    useState<ContractValidityStatus>(initialContractStatus);

  const [contractNumber, setContractNumber] = useState<string>(
    existingContract?.contractNumber ||
      `CTO-FS-${new Date().getFullYear()}-` + (dossier.fileNumber ? dossier.fileNumber.slice(-3) : '001')
  );
  const [contractType, setContractType] = useState<string>(
    existingContract?.contractType || 'SUMINISTRO'
  );
  const [objectDescription, setObjectDescription] = useState<string>(
    existingContract?.objectDescription ||
      `Prestación o suministro de bienes y servicios según categoría: ${dossier.selectedCategory || 'General'}`
  );
  const [startDate, setStartDate] = useState<string>(
    existingContract?.startDate || '2026-01-01'
  );
  const [endDate, setEndDate] = useState<string>(
    existingContract?.endDate || '2026-12-31'
  );
  const [contractValueCOP, setContractValueCOP] = useState<string>(
    existingContract?.contractValueCOP ? String(existingContract.contractValueCOP) : '50000000'
  );
  const [supervisorName, setSupervisorName] = useState<string>(
    existingContract?.supervisorName || 'Ing. Carlos Mendoza (Jefe de Mantenimiento)'
  );
  const [contractNotes, setContractNotes] = useState<string>(
    existingContract?.notes || ''
  );
  const [saveContractData, setSaveContractData] = useState<boolean>(true);

  // Estados actuales calculados para la cabecera
  const creationStatus = getCreationStatus(dossier);
  const contractualStatus = getContractualStatus(dossier);
  const calculatedValidityFromFormDate = calculateContractValidity(endDate);

  // Plantillas de justificación para el Estado del Proveedor
  const quickSupplierReasons = [
    'Aprobación y homologación integral por Comité de Compras y Suministros (100% conforme).',
    'Pase a revisión técnica por cargue de expediente documental completo.',
    'Subsanaciones aprobadas y re-evaluación técnica conforme.',
    'Requerimiento de subsanación documental según lista de chequeo y políticas SIG.',
    'Suspensión administrativa preventiva por hallazgo en auditoría técnica o listas restrictivas.',
    'No habilitado por incumplimiento de requisitos mínimos o políticas de compras.',
  ];

  // Plantillas de justificación para el Contrato
  const quickContractReasons = [
    'Suscripción formal de nuevo contrato marco con Flota Sugamuxi S.A.',
    'Prórroga y ampliación de vigencia contractual autorizada por Gerencia.',
    'Vencimiento de plazo contractual según fecha estipulada.',
    'Contrato suspendido temporalmente por supervisión de obra/servicio.',
    'Terminación y liquidación formal del contrato a satisfacción de las partes.',
    'Compras menores directas autorizadas sin contrato formal previo.',
  ];

  // Función para sincronizar estado del contrato con la fecha fin
  const handleAutoSyncContractStatusWithDate = () => {
    setSelectedContractStatus(calculatedValidityFromFormDate.status);
    if (!contractNotes) {
      setContractNotes(
        `Estado contractual calculado según fecha de vencimiento ${endDate} (${calculatedValidityFromFormDate.label}).`
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reasonObservation.trim() || reasonObservation.trim().length < 8) {
      alert(
        'El registro de motivo u observación del Estado del Proveedor es obligatorio (mínimo 8 caracteres) para garantizar la trazabilidad ISO 9001 / SARLAFT.'
      );
      return;
    }

    const updatedContractData: Partial<SupplierContractInfo> = {
      contractNumber: contractNumber.trim(),
      contractType,
      objectDescription: objectDescription.trim(),
      startDate,
      endDate,
      contractValueCOP: Number(contractValueCOP) || 0,
      contractStatus: selectedContractStatus,
      supervisorName: supervisorName.trim(),
      notes: contractNotes.trim() || undefined,
      lastUpdated: new Date().toISOString(),
      manualOverride: true,
      manualReason: reasonObservation.trim(),
    };

    onConfirmStatusChange(
      dossier.id,
      selectedStatus,
      reasonObservation.trim(),
      authorName.trim(),
      saveContractData ? updatedContractData : undefined
    );

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full my-4 overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#0b1329] text-white p-3.5 sm:px-6 sm:py-4 flex items-start justify-between gap-3 border-b border-blue-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900/80 border border-blue-700/50 flex items-center justify-center text-cyan-300 shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-950 text-cyan-300 border border-blue-800 font-bold">
                  {dossier.fileNumber}
                </span>
                <span className="text-xs text-slate-300 flex items-center gap-1">
                  {isNatural ? <User className="w-3.5 h-3.5 text-cyan-400" /> : <Building2 className="w-3.5 h-3.5 text-blue-400" />}
                  {isNatural ? 'Persona Natural' : 'Persona Jurídica'} &bull; {supplierDoc}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {supplierName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Distinction Banner: Streamlined & Compact to prioritize form size */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0 text-xs">
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                1. Estado Proveedor:
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs">
                {getProcessStatusLabel(dossier.processStatus)}
              </span>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-sky-700" />
                2. Estado Contrato:
              </span>
              {contractualStatus.contractNumber && (
                <span className="text-[11px] font-mono font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  {contractualStatus.contractNumber}
                </span>
              )}
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border shadow-2xs ${contractualStatus.badgeClass}`}>
                <Calendar className="w-3 h-3" />
                {contractualStatus.label}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-4 sm:px-6 pt-2 gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('STATUS')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'STATUS'
                ? 'border-blue-700 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>1. Estado del Proveedor</span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 ml-0.5">
              Homologación
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CONTRACT')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'CONTRACT'
                ? 'border-sky-700 text-sky-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. Estado y Datos del Contrato</span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800 ml-0.5">
              Vigencia
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'HISTORY'
                ? 'border-slate-800 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>3. Trazabilidad & Auditoría</span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 ml-0.5">
              {dossier.auditHistory?.length || 0}
            </span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: ESTADO DEL PROVEEDOR (HOMOLOGACIÓN Y CUMPLIMIENTO) */}
          {activeTab === 'STATUS' && (
            <div className="space-y-4">
              {/* Concept Clarification Notice (Compact) */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl px-3.5 py-2 text-xs text-blue-950 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] text-blue-900 leading-snug">
                  <Info className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>
                    <strong>Concepto Normativo:</strong> El estado del proveedor define su habilitación técnica y SIG en el Banco de Proveedores, independiente de la existencia de contratos.
                  </span>
                </div>
              </div>

              {/* Selector Exclusivo: Estados del Proveedor */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                    Seleccione el Nuevo Estado del Proveedor *
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Actual: <strong className="text-blue-900">{getProcessStatusLabel(dossier.processStatus)}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      value: 'PROVEEDOR_HABILITADO' as ProcessStatus,
                      label: 'Proveedor Habilitado (Homologado)',
                      desc: 'Aprobado plenamente para compras y contratación. Cumple 100% de requisitos técnicos y SIG.',
                      badge: 'bg-emerald-50 text-emerald-900 border-emerald-300',
                    },
                    {
                      value: 'EN_REVISION' as ProcessStatus,
                      label: 'En Revisión Técnica',
                      desc: 'Expediente en verificación documental y auditoría por revisores asignados.',
                      badge: 'bg-blue-50 text-blue-900 border-blue-300',
                    },
                    {
                      value: 'CORREGIDO_EN_REVISION' as ProcessStatus,
                      label: 'Corregido / En Revisión',
                      desc: 'Subsanaciones radicadas por el proveedor, listas para re-evaluación técnica.',
                      badge: 'bg-cyan-50 text-cyan-900 border-cyan-300',
                    },
                    {
                      value: 'REQUIERE_CORRECCION' as ProcessStatus,
                      label: 'Requiere Corrección',
                      desc: 'Devuelto al proveedor para subsanar inconsistencias o actualizar requisitos observados.',
                      badge: 'bg-amber-50 text-amber-900 border-amber-300',
                    },
                    {
                      value: 'DOCUMENTACION_PENDIENTE' as ProcessStatus,
                      label: 'Documentación Incompleta / Pendiente',
                      desc: 'Expediente en trámite inicial de recolección y cargue de documentos obligatorios.',
                      badge: 'bg-slate-100 text-slate-700 border-slate-300',
                    },
                    {
                      value: 'SUSPENDIDO' as ProcessStatus,
                      label: 'Suspendido Administrativamente',
                      desc: 'Medida cautelar preventiva por hallazgo SIG, auditoría, SARLAFT o sanción.',
                      badge: 'bg-slate-800 text-slate-100 border-slate-700',
                    },
                    {
                      value: 'RECHAZADO' as ProcessStatus,
                      label: 'Rechazado / No Habilitado',
                      desc: 'Dictamen desfavorable. No cumple con las políticas de abastecimiento ni requerimientos mínimos.',
                      badge: 'bg-rose-50 text-rose-900 border-rose-300',
                    },
                  ].map((item) => {
                    const isSelected = selectedStatus === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setSelectedStatus(item.value)}
                        className={`text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 shadow-xs ring-2 ring-blue-500/30'
                            : 'bg-white border-slate-200 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`font-bold text-[12px] ${
                              isSelected ? 'text-blue-950' : 'text-slate-800'
                            }`}
                          >
                            {item.label}
                          </span>
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                          ) : (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${item.badge}`}>
                              SIG
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                          {item.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Plantillas Rápidas para el Estado del Proveedor */}
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                    Plantillas Rápidas de Justificación:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickSupplierReasons.map((reason, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReasonObservation(reason)}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-900 border border-slate-200 transition-colors cursor-pointer text-left shadow-2xs"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Formulario de Justificación y Responsable del Registro (Priorizado en tamaño) */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Formulario de Justificación Formal & Responsable
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Registro de trazabilidad auditable según estándar ISO 9001
                    </p>
                  </div>
                </div>

                {/* Motivo Obligatorio del Estado del Proveedor */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Motivo u Observación del Estado del Proveedor <span className="text-blue-700">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reasonObservation}
                    onChange={(e) => setReasonObservation(e.target.value)}
                    placeholder="Escriba la justificación formal del estado del proveedor (número de acta, resolución de comité o motivo técnico)..."
                    className="w-full text-sm font-medium p-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white text-slate-900 shadow-2xs"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>Requerido para auditoría y expediente del proveedor</span>
                    <span className={reasonObservation.trim().length >= 8 ? 'text-blue-700 font-bold' : 'text-slate-400'}>
                      {reasonObservation.trim().length} caracteres (mínimo 8)
                    </span>
                  </div>
                </div>

                {/* Responsable del Registro */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Funcionario / Responsable del Registro *
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    required
                    className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ESTADO Y DATOS DEL CONTRATO (VINCULACIÓN CONTRACTUAL) */}
          {activeTab === 'CONTRACT' && (
            <div className="space-y-4">
              {/* Concept Clarification Notice (Compact) */}
              <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl px-3.5 py-2 text-xs text-sky-950 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] text-sky-900 leading-snug">
                  <Info className="w-4 h-4 text-sky-700 shrink-0" />
                  <span>
                    <strong>Concepto Normativo:</strong> El estado del contrato define el amparo legal comercial formal y es independiente de la homologación técnica.
                  </span>
                </div>
              </div>

              {/* Formulario de Datos del Contrato / Vinculación del Proveedor (Priorizado en Tamaño) */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4.5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                      <FileText className="w-4.5 h-4.5 text-sky-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        Formulario de Datos del Instrumento Contractual
                      </h3>
                      <p className="text-[11px] text-slate-500 font-normal">
                        Diligencie o actualice los términos y vigencia del contrato suscrito con Flota Sugamuxi S.A.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Número de Contrato */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Número / Código de Contrato *
                    </label>
                    <input
                      type="text"
                      value={contractNumber}
                      onChange={(e) => setContractNumber(e.target.value)}
                      required={saveContractData && selectedContractStatus !== 'SIN_CONTRATO'}
                      placeholder="ej. CTO-FS-2026-015"
                      className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 shadow-2xs"
                    />
                  </div>

                  {/* Tipo de Contrato */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Tipo de Contrato
                    </label>
                    <select
                      value={contractType}
                      onChange={(e) => setContractType(e.target.value)}
                      className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 shadow-2xs cursor-pointer"
                    >
                      <option value="SUMINISTRO">Suministro de Repuestos y Bienes</option>
                      <option value="PRESTACION_SERVICIOS">Prestación de Servicios Profesionales / Técnicos</option>
                      <option value="MANTENIMIENTO">Mantenimiento Automotriz / Preventivo</option>
                      <option value="SEGUROS">Pólizas y Seguros (RCE y Todo Riesgo)</option>
                      <option value="OBRA_CIVIL">Adecuación de Infraestructura y Obras</option>
                      <option value="TRANSPORTE">Transporte Especial y Logística</option>
                    </select>
                  </div>

                  {/* Fecha de Inicio */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Fecha de Inicio *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required={saveContractData && selectedContractStatus !== 'SIN_CONTRATO'}
                      className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 shadow-2xs"
                    />
                  </div>

                  {/* Fecha de Vencimiento / Fin */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        Fecha de Fin / Vencimiento *
                      </label>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${calculatedValidityFromFormDate.badgeClass}`}>
                        {calculatedValidityFromFormDate.label}
                      </span>
                    </div>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required={saveContractData && selectedContractStatus !== 'SIN_CONTRATO'}
                      className="w-full text-sm font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 shadow-2xs"
                    />
                  </div>

                  {/* Valor Total Contratado (COP) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Valor Total Contratado (COP)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-bold text-sm">
                        $
                      </span>
                      <input
                        type="number"
                        value={contractValueCOP}
                        onChange={(e) => setContractValueCOP(e.target.value)}
                        placeholder="0"
                        className="w-full text-sm pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 shadow-2xs"
                      />
                    </div>
                    {contractValueCOP && Number(contractValueCOP) > 0 ? (
                      <span className="text-xs text-sky-900 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200 font-mono font-bold mt-1.5 inline-block">
                        ${Number(contractValueCOP).toLocaleString('es-CO')} COP
                      </span>
                    ) : null}
                  </div>

                  {/* Supervisor Asignado */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Supervisor / Interventor Flota Sugamuxi
                    </label>
                    <input
                      type="text"
                      value={supervisorName}
                      onChange={(e) => setSupervisorName(e.target.value)}
                      placeholder="Nombre del funcionario responsable"
                      className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Objeto Contractual */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Objeto Contractual
                  </label>
                  <textarea
                    rows={3}
                    value={objectDescription}
                    onChange={(e) => setObjectDescription(e.target.value)}
                    placeholder="Descripción clara y detallada del objeto del contrato suscrito..."
                    className="w-full text-sm font-medium p-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 shadow-2xs"
                  />
                </div>

                {/* Observación Contractual */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Observación o Justificación Contractual (Opcional)
                  </label>
                  <input
                    type="text"
                    value={contractNotes}
                    onChange={(e) => setContractNotes(e.target.value)}
                    placeholder="Detalles sobre adiciones, pólizas de garantía o estado de liquidación..."
                    className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 shadow-2xs"
                  />
                </div>
              </div>

              {/* Selector Exclusivo: Estados del Contrato (Ubicado debajo del formulario, antes de guardar) */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                    Seleccione el Estado del Contrato del Proveedor *
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoSyncContractStatusWithDate}
                    className="text-[11px] text-sky-700 hover:text-sky-900 font-bold underline flex items-center gap-1 cursor-pointer bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200"
                    title="Calcular estado sugerido según la fecha fin ingresada en el formulario superior"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    Sugerir según fecha fin ({calculatedValidityFromFormDate.label})
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    {
                      value: 'VIGENTE' as ContractValidityStatus,
                      label: 'Contrato Vigente (Activo)',
                      desc: 'Operación activa con amparo legal vigente (> 30 días restantes).',
                      badge: 'bg-blue-50 text-blue-900 border-blue-200',
                    },
                    {
                      value: 'POR_VENCER' as ContractValidityStatus,
                      label: 'Contrato Próximo a Vencer',
                      desc: 'Alerta preventiva (≤ 30 días) para trámite de adición o prórroga.',
                      badge: 'bg-sky-100 text-sky-900 border-sky-300',
                    },
                    {
                      value: 'VENCIDO' as ContractValidityStatus,
                      label: 'Contrato Vencido',
                      desc: 'Plazo expirado. Inhabilitado para generar nuevas órdenes bajo este contrato.',
                      badge: 'bg-slate-900 text-white border-slate-700',
                    },
                    {
                      value: 'SIN_CONTRATO' as ContractValidityStatus,
                      label: 'Sin Contrato Formal',
                      desc: 'Compras menores directas o en proceso de suscripción contractual.',
                      badge: 'bg-slate-100 text-slate-600 border-slate-200',
                    },
                    {
                      value: 'SUSPENDIDO' as ContractValidityStatus,
                      label: 'Contrato Suspendido',
                      desc: 'Ejecución en pausa cautelar o litigio por supervisión.',
                      badge: 'bg-slate-800 text-slate-100 border-slate-700',
                    },
                    {
                      value: 'TERMINADO' as ContractValidityStatus,
                      label: 'Contrato Terminado / Liquidado',
                      desc: 'Relación contractual formalmente finalizada y liquidada a satisfacción.',
                      badge: 'bg-slate-200 text-slate-800 border-slate-400',
                    },
                  ].map((item) => {
                    const isSelected = selectedContractStatus === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setSelectedContractStatus(item.value)}
                        className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50 border-sky-600 shadow-xs ring-1 ring-sky-500/20'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`font-bold text-[11px] ${
                              isSelected ? 'text-sky-950' : 'text-slate-800'
                            }`}
                          >
                            {item.label}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                          {item.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Plantillas Rápidas para el Contrato */}
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">
                    Plantillas Rápidas de Justificación (Contrato):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickContractReasons.map((reason, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setContractNotes(reason)}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-900 border border-slate-200 transition-colors cursor-pointer text-left"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRAZABILIDAD & HISTORIAL AUDITABLE */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-600 font-medium">
                Historial cronológico de cambios de estado y actualizaciones contractuales auditadas para este proveedor:
              </div>

              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {dossier.auditHistory && dossier.auditHistory.length > 0 ? (
                  dossier.auditHistory
                    .slice()
                    .reverse()
                    .map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{item.action}</span>
                            {item.action.toLowerCase().includes('contrato') ? (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-bold">
                                CONTRATO
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">
                                PROVEEDOR
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-slate-500 text-[10px]">
                            {item.timestamp}
                          </span>
                        </div>

                        {item.statusChange && (
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-900">
                            <span>Estado anterior:</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px]">
                              {getProcessStatusLabel(item.statusChange.from)}
                            </span>
                            <span>&rarr;</span>
                            <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 text-[10px]">
                              {getProcessStatusLabel(item.statusChange.to)}
                            </span>
                          </div>
                        )}

                        <p className="text-slate-700 text-[11px] bg-white p-2.5 rounded-lg border border-slate-200/80">
                          <span className="font-semibold text-slate-500">Motivo / Observación:</span>{' '}
                          {item.notes || 'Sin observación registrada'}
                        </p>

                        <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
                          <span>Registrado por: <strong>{item.user}</strong> ({item.role})</span>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No hay cambios de estado registrados en el historial de este proveedor.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                <span>Guardar Cambios de Estado & Contrato</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
