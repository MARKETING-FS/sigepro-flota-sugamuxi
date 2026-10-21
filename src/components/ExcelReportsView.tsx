import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  ShieldCheck,
  CreditCard,
  Briefcase,
  History,
  Sparkles,
  Layers,
  Search,
  Eye,
  Check,
  X,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
  Table,
  Award,
  SlidersHorizontal,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SupplierDossier, ProcessStatus, SupplierType } from '../types';
import {
  exportMasterSupplierDirectory,
  exportDocumentComplianceReport,
  exportSarlaftReport,
  exportFinancialBankReport,
  exportConvocatoriasReport,
  exportAuditLogsReport,
  exportExecutiveMasterWorkbook,
  exportCustomExcelReport,
  exportEvaluationsReport,
} from '../utils/excelExport';
import { FlotaSugamuxiLogo } from './FlotaSugamuxiLogo';
import { OfficialReportWorkspace, OfficialReportId } from './reports/OfficialReportWorkspace';

export const ExcelReportsView: React.FC = () => {
  const { dossiers, systemAuditLogs, convocatorias, supplierEvaluations, categoriesConfig, role, showToast } = useApp();

  // Active Official Report Workspace ('DIRECTORIO_MAESTRO', 'MATRIZ_DOCUMENTAL', etc.) or null for catalog
  const [activeOfficialReport, setActiveOfficialReport] = useState<OfficialReportId | null>(null);

  // Custom Builder State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSarlaft, setSelectedSarlaft] = useState<string>('ALL');
  const [customReportTitle, setCustomReportTitle] = useState('Reporte Personalizado de Proveedores');

  // Selected columns state for custom builder
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'fileNumber',
    'supplierType',
    'supplierTier',
    'name',
    'docNumber',
    'email',
    'phone',
    'city',
    'category',
    'processStatus',
    'compliancePercent',
    'sarlatf',
    'createdAt',
  ]);

  // Available column catalog grouped
  const columnGroups = [
    {
      groupName: 'Datos de Identificación',
      columns: [
        { id: 'fileNumber', label: 'No. Expediente' },
        { id: 'supplierType', label: 'Tipo Persona' },
        { id: 'supplierTier', label: 'Tipo Proveedor (A/B/C)' },
        { id: 'name', label: 'Razón Social / Nombre' },
        { id: 'docType', label: 'Tipo Documento' },
        { id: 'docNumber', label: 'NIT / Cédula' },
        { id: 'dv', label: 'Dígito de Verificación (DV)' },
        { id: 'repLegal', label: 'Representante Legal' },
        { id: 'repLegalDoc', label: 'Doc. Representante' },
      ],
    },
    {
      groupName: 'Ubicación y Contacto',
      columns: [
        { id: 'email', label: 'Correo Electrónico' },
        { id: 'phone', label: 'Teléfono Principal' },
        { id: 'city', label: 'Ciudad' },
        { id: 'department', label: 'Departamento' },
        { id: 'address', label: 'Dirección' },
        { id: 'website', label: 'Sitio Web' },
      ],
    },
    {
      groupName: 'Clasificación Comercial',
      columns: [
        { id: 'category', label: 'Categoría de Servicio' },
        { id: 'economicActivity', label: 'Actividad Económica' },
        { id: 'ciiuCode', label: 'Código CIIU' },
      ],
    },
    {
      groupName: 'Tributario y Cuentas Bancarias',
      columns: [
        { id: 'taxRegime', label: 'Régimen Tributario' },
        { id: 'isGranContribuyente', label: 'Gran Contribuyente' },
        { id: 'isAutoRetenedor', label: 'Autorretenedor' },
        { id: 'bankName', label: 'Banco Receptor' },
        { id: 'accountType', label: 'Tipo Cuenta' },
        { id: 'accountNumber', label: 'No. Cuenta Bancaria' },
        { id: 'totalAssets', label: 'Activos Totales' },
        { id: 'totalLiabilities', label: 'Pasivos Totales' },
        { id: 'netWorth', label: 'Patrimonio Neto' },
        { id: 'annualRevenue', label: 'Ingresos Anuales' },
      ],
    },
    {
      groupName: 'Calidad, SARLAFT y Control',
      columns: [
        { id: 'processStatus', label: 'Estado del Proceso' },
        { id: 'compliancePercent', label: '% Cumplimiento Documental' },
        { id: 'sarlatf', label: 'Concepto SARLAFT' },
        { id: 'ofac', label: 'Listas OFAC / Clinton' },
        { id: 'procuraduria', label: 'Procuraduría / Policía' },
        { id: 'createdAt', label: 'Fecha Inscripción' },
        { id: 'updatedAt', label: 'Última Actualización' },
      ],
    },
  ];

  // Filtered dossiers for custom export
  const filteredDossiers = useMemo(() => {
    return dossiers.filter((d) => {
      // Search term
      const isNatural = d.basicInfo?.supplierType === 'NATURAL';
      const name = isNatural ? d.basicInfo?.fullName : d.basicInfo?.companyName;
      const doc = isNatural ? d.basicInfo?.documentNumber : d.basicInfo?.nit;
      const query = searchTerm.toLowerCase().trim();

      if (
        query &&
        !d.fileNumber.toLowerCase().includes(query) &&
        !name?.toLowerCase().includes(query) &&
        !doc?.toLowerCase().includes(query) &&
        !d.basicInfo?.city?.toLowerCase().includes(query) &&
        !d.basicInfo?.email?.toLowerCase().includes(query)
      ) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL' && d.processStatus !== selectedStatus) {
        return false;
      }

      // Type filter
      if (selectedType !== 'ALL' && d.basicInfo?.supplierType !== selectedType) {
        return false;
      }

      // Tier filter (A, B, C)
      if (selectedTier !== 'ALL') {
        const tier = d.supplierTier || d.basicInfo?.supplierTier || 'B';
        if (tier !== selectedTier) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && d.selectedCategory !== selectedCategory) {
        return false;
      }

      // SARLAFT filter
      if (selectedSarlaft !== 'ALL' && d.internalConcepts?.sarlatfCheck?.result !== selectedSarlaft) {
        return false;
      }

      return true;
    });
  }, [dossiers, searchTerm, selectedStatus, selectedType, selectedTier, selectedCategory, selectedSarlaft]);

  const handleToggleColumn = (colId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(colId) ? prev.filter((c) => c !== colId) : [...prev, colId]
    );
  };

  const handleSelectAllColumns = () => {
    const allCols = columnGroups.flatMap((g) => g.columns.map((c) => c.id));
    setSelectedColumns(allCols);
  };

  const handleClearColumns = () => {
    setSelectedColumns(['fileNumber', 'name', 'processStatus']);
  };

  const handleCustomExport = () => {
    if (filteredDossiers.length === 0) {
      showToast('No hay registros que coincidan con los filtros aplicados.', 'error');
      return;
    }
    if (selectedColumns.length === 0) {
      showToast('Debe seleccionar al menos una columna para exportar.', 'error');
      return;
    }

    try {
      exportCustomExcelReport({
        reportTitle: customReportTitle || 'Reporte de Proveedores Flota Sugamuxi',
        dossiers: filteredDossiers,
        selectedColumns,
      });
      showToast('¡Informe en Excel generado y descargado exitosamente!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Ocurrió un error al generar el archivo Excel.', 'error');
    }
  };

  // If user has selected an official report to filter and configure, render the workspace
  if (activeOfficialReport) {
    return (
      <OfficialReportWorkspace
        reportId={activeOfficialReport}
        onSelectReport={(id) => setActiveOfficialReport(id)}
        onBackToCatalog={() => setActiveOfficialReport(null)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5 animate-in fade-in">
      
      {/* 1. Header Banner Estandarizado Claro */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 text-slate-900 border border-slate-200 shadow-xs relative overflow-hidden dark:bg-[#0b1329] dark:text-white dark:border-blue-900/60">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1 w-full">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 p-1.5 dark:bg-slate-900/80 dark:border-blue-800 shadow-2xs">
              <FileSpreadsheet className="w-5 h-5 text-blue-700 dark:text-cyan-400" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 rounded-full text-blue-800 font-bold text-[10px] flex items-center gap-1.5 dark:bg-blue-500/20 dark:border-blue-400/40 dark:text-cyan-300">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-300" />
                  <span>Exportación Nativa Microsoft Excel (.xlsx)</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  Sistema Integrado de Gestión SIG (ISO 9001)
                </span>
              </div>
              <h2 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                Centro de Reportes e Informes en Excel
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                Generación y descarga de informes maestros, matrices documentales, trazabilidad SARLAFT, dispersión financiera y auditorías de control para <strong>Flota Sugamuxi S.A.</strong>
              </p>
            </div>
          </div>

          {/* Quick Master Download Button */}
          <div className="flex items-center gap-2 w-full xl:w-auto shrink-0 pt-2.5 xl:pt-0 border-t xl:border-t-0 border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => {
                exportExecutiveMasterWorkbook(dossiers, systemAuditLogs, convocatorias);
                showToast('¡Libro Maestro Consolidado generado con éxito!', 'success');
              }}
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-blue-800"
              title="Descargar libro Excel completo con todas las pestañas y matrices consolidadas"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Descargar Libro Maestro (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Ribbon - Compact */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between dark:bg-slate-900/60 dark:border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">Proveedores</span>
              <span className="text-base font-black text-slate-900 dark:text-white">{dossiers.length}</span>
            </div>
            <Users className="w-4 h-4 text-blue-600 dark:text-slate-500" />
          </div>
          <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between dark:bg-slate-900/60 dark:border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-cyan-400 tracking-wider block">Habilitados</span>
              <span className="text-base font-black text-blue-800 dark:text-cyan-300">
                {dossiers.filter((d) => d.processStatus === 'PROVEEDOR_HABILITADO' || d.processStatus === 'APROBADO').length}
              </span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-blue-700 dark:text-cyan-400" />
          </div>
          <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between dark:bg-slate-900/60 dark:border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-cyan-400 tracking-wider block">Eventos Auditados</span>
              <span className="text-base font-black text-blue-600 dark:text-cyan-300">{systemAuditLogs.length}</span>
            </div>
            <History className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
          </div>
          <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between dark:bg-slate-900/60 dark:border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-blue-400 tracking-wider block">Convocatorias</span>
              <span className="text-base font-black text-slate-900 dark:text-blue-300">{convocatorias.length}</span>
            </div>
            <Briefcase className="w-4 h-4 text-slate-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* 2. Pre-Configured Official Reports Catalog */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
              <span>Informes Oficiales Pre-configurados (Ingresar, Filtrar y Exportar)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Haga clic en <strong className="text-blue-600 dark:text-cyan-400">"Ingresar y Filtrar"</strong> en cualquiera de los 7 informes normativos para parametrizar estados de proveedor, contratos, evaluadores o fechas, visualizar los datos en vivo y generar el archivo Excel correspondiente.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Card 1: Directorio Maestro */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-blue-700 dark:text-cyan-300 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  SIG-FS-DIR-001
                </span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Directorio Maestro de Proveedores
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Listado consolidado con datos de contacto, NIT, razón social, ubicación, actividad económica y discriminación entre estado de proveedor y contractual.
                </p>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl space-y-1">
                <div>&bull; <strong>30 Columnas</strong> estandarizadas</div>
                <div>&bull; Filtro por estado de proveedor y estado contractual</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setActiveOfficialReport('DIRECTORIO_MAESTRO')}
                className="w-full py-2.5 px-3 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <SlidersHorizontal className="w-4 h-4 text-cyan-200" />
                <span>Ingresar y Filtrar Informe</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-cyan-200" />
              </button>
              <button
                onClick={() => {
                  exportMasterSupplierDirectory(dossiers);
                  showToast('¡Directorio Maestro exportado en Excel!', 'success');
                }}
                className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Descarga Directa ({dossiers.length})</span>
              </button>
            </div>
          </div>

          {/* Card 2: Matriz de Cumplimiento Documental */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-blue-700 dark:text-cyan-300 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  ISO 9001:2015
                </span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Matriz de Cumplimiento Documental SIG
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Matriz comparativa de requisitos obligatorios vs cargados, porcentaje de avance, formatos FS.GA y pendientes por corregir.
                </p>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl space-y-1">
                <div>&bull; <strong>Control ISO 9001</strong> por documento</div>
                <div>&bull; Filtrado por % de cumplimiento y semáforo SIG</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setActiveOfficialReport('MATRIZ_DOCUMENTAL')}
                className="w-full py-2.5 px-3 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <SlidersHorizontal className="w-4 h-4 text-cyan-200" />
                <span>Ingresar y Filtrar Informe</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-cyan-200" />
              </button>
              <button
                onClick={() => {
                  exportDocumentComplianceReport(dossiers);
                  showToast('¡Matriz Documental exportada en Excel!', 'success');
                }}
                className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Descarga Directa ({dossiers.length})</span>
              </button>
            </div>
          </div>

          {/* Card 3: SARLAFT y Listas Restrictivas */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  SAGRILAFT / SARLAFT
                </span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Debida Diligencia SARLAFT & Listas
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Conceptos de Oficialía de Cumplimiento, verificación en listas OFAC, antecedentes de Procuraduría y Policía Nacional.
                </p>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl space-y-1">
                <div>&bull; Conceptos: Aprobado, Observado, Rechazado</div>
                <div>&bull; Fechas de consulta y responsable de Oficialía</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setActiveOfficialReport('SARLAFT')}
                className="w-full py-2.5 px-3 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <SlidersHorizontal className="w-4 h-4 text-cyan-200" />
                <span>Ingresar y Filtrar Informe</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-cyan-200" />
              </button>
              <button
                onClick={() => {
                  exportSarlaftReport(dossiers);
                  showToast('¡Informe SARLAFT exportado en Excel!', 'success');
                }}
                className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Descarga Directa ({dossiers.length})</span>
              </button>
            </div>
          </div>

          {/* Card 4: Financiero & Cuentas Bancarias */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-blue-700 dark:text-cyan-300 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  Tesorería & Pagos
                </span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Cuentas Bancarias y Perfil Financiero
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Cuentas bancarias para dispersión de pagos, tipo de cuenta, banco, régimen tributario, retenciones y patrimonio declarado.
                </p>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl space-y-1">
                <div>&bull; Filtrar por banco y tipo de cuenta</div>
                <div>&bull; Régimen tributario e indicadores financieros</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setActiveOfficialReport('CUENTAS_FINANZAS')}
                className="w-full py-2.5 px-3 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <SlidersHorizontal className="w-4 h-4 text-cyan-200" />
                <span>Ingresar y Filtrar Informe</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-cyan-200" />
              </button>
              <button
                onClick={() => {
                  exportFinancialBankReport(dossiers);
                  showToast('¡Informe Financiero y Bancario exportado en Excel!', 'success');
                }}
                className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Descarga Directa ({dossiers.length})</span>
              </button>
            </div>
          </div>

          {/* Card 5: Convocatorias y Postulaciones */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800">
                  Licitaciones & FS
                </span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Convocatorias y Postulaciones
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Histórico de convocatorias de contratación, postulantes inscritos, propuestas económicas y estado de calificación.
                </p>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl space-y-1">
                <div>&bull; <strong>2 Hojas de cálculo</strong> (Convocatorias + Postulaciones)</div>
                <div>&bull; Filtro por estado y categoría de contratación</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setActiveOfficialReport('CONVOCATORIAS')}
                className="w-full py-2.5 px-3 bg-cyan-800 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <SlidersHorizontal className="w-4 h-4 text-cyan-200" />
                <span>Ingresar y Filtrar Informe</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-cyan-200" />
              </button>
              <button
                onClick={() => {
                  exportConvocatoriasReport(convocatorias, dossiers);
                  showToast('¡Informe de Convocatorias exportado en Excel!', 'success');
                }}
                className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Descarga Directa ({convocatorias.length})</span>
              </button>
            </div>
          </div>

          {/* Card 6: Log de Auditoría y Trazabilidad */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700">
                  Forense & Control
                </span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Libro de Auditoría y Modificaciones
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Registro cronológico e inmutable de modificaciones de datos, justificaciones obligatorias, usuario responsable e IP.
                </p>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl space-y-1">
                <div>&bull; Control de Cambios y Trazabilidad</div>
                <div>&bull; Comparativa Valor Anterior vs Nuevo</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setActiveOfficialReport('AUDITORIA')}
                className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <SlidersHorizontal className="w-4 h-4 text-slate-300" />
                <span>Ingresar y Filtrar Informe</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-slate-300" />
              </button>
              <button
                onClick={() => {
                  exportAuditLogsReport(systemAuditLogs);
                  showToast('¡Libro de Auditoría exportado en Excel!', 'success');
                }}
                className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Descarga Directa ({systemAuditLogs.length})</span>
              </button>
            </div>
          </div>

          {/* Card 7: Evaluaciones de Desempeño SIG (ISO 9001:2015) */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-5 border border-purple-200 dark:border-purple-900/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                  SIG-FS-EVAL-007
                </span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Evaluaciones y Desempeño SIG
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Evaluaciones periódicas de calidad: puntajes (0-100), concepto técnico, evaluador asignado, planes de mejora y próximas fechas de corte.
                </p>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl space-y-1">
                <div>&bull; Filtro por Evaluador, Concepto y Tipo</div>
                <div>&bull; Planes de mejora y calificación numérica</div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setActiveOfficialReport('EVALUACIONES')}
                className="w-full py-2.5 px-3 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <SlidersHorizontal className="w-4 h-4 text-purple-200" />
                <span>Ingresar y Filtrar Informe</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto text-purple-200" />
              </button>
              <button
                onClick={() => {
                  exportEvaluationsReport(supplierEvaluations, 'Consolidado General de Evaluaciones');
                  showToast('¡Informe de Evaluaciones exportado en Excel!', 'success');
                }}
                className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Descarga Directa ({supplierEvaluations.length})</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Custom Excel Report Builder */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-7 space-y-6">
        
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Table className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Constructor de Reportes Personalizados en Excel</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Filtra los proveedores, selecciona las columnas exactas que necesitas y descarga tu archivo Excel a medida.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                {filteredDossiers.length} proveedores coincidentes
              </span>
              <span className="text-xs font-bold px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                {selectedColumns.length} columnas seleccionadas
              </span>
            </div>
          </div>
        </div>

        {/* Report Title Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Título Personalizado del Informe (Aparecerá en el encabezado del Excel)
          </label>
          <input
            type="text"
            value={customReportTitle}
            onChange={(e) => setCustomReportTitle(e.target.value)}
            placeholder="Ej. Informe de Proveedores Habilitados Zona Boyacá"
            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Dynamic Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
          
          {/* Search */}
          <div className="lg:col-span-1">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Búsqueda Rápida
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Nombre, NIT, radicado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Estado del Proceso
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
            >
              <option value="ALL">Todos los Estados ({dossiers.length})</option>
              <option value="PROVEEDOR_HABILITADO">Habilitado Operativamente</option>
              <option value="APROBADO">Aprobado</option>
              <option value="EN_REVISION">En Revisión</option>
              <option value="CORREGIDO_EN_REVISION">Corregido en Revisión</option>
              <option value="REQUIERE_CORRECCION">Requiere Corrección</option>
              <option value="DOCUMENTACION_PENDIENTE">Documentación Pendiente</option>
              <option value="BORRADOR">Borrador</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Tipo de Persona
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
            >
              <option value="ALL">Todas las Personas</option>
              <option value="JURIDICA">Persona Jurídica (Empresas)</option>
              <option value="NATURAL">Persona Natural</option>
            </select>
          </div>

          {/* Tier Filter (A, B, C) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Tipo Proveedor (A/B/C)
            </label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
            >
              <option value="ALL">Todos los Tipos (A, B, C)</option>
              <option value="A">Tipo A - Crítico</option>
              <option value="B">Tipo B - Operativo</option>
              <option value="C">Tipo C - Estándar</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Categoría / Sector
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
            >
              <option value="ALL">Todas las Categorías</option>
              {categoriesConfig.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* SARLAFT Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Estado SARLAFT
            </label>
            <select
              value={selectedSarlaft}
              onChange={(e) => setSelectedSarlaft(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
            >
              <option value="ALL">Todos los Conceptos</option>
              <option value="SIN_COINCIDENCIAS">Sin Coincidencias (Limpio)</option>
              <option value="REQUIERE_VERIFICACION">Requiere Verificación</option>
              <option value="PENDIENTE">Pendiente de Consulta</option>
            </select>
          </div>

        </div>

          {/* Column Selection Toolbar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
              Selección de Columnas a Incluir en el Excel:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllColumns}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                + Seleccionar Todas
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={handleClearColumns}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline cursor-pointer"
              >
                Restablecer Básicas
              </button>
            </div>
          </div>

          {/* Checkboxes Grouped Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {columnGroups.map((group) => (
              <div
                key={group.groupName}
                className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5"
              >
                <span className="text-[11px] font-extrabold uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
                  {group.groupName}
                </span>
                <div className="space-y-1.5">
                  {group.columns.map((col) => {
                    const isChecked = selectedColumns.includes(col.id);
                    return (
                      <label
                        key={col.id}
                        className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleColumn(col.id)}
                          className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span>{col.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Preview Table */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Vista Previa de Datos (Primeros 5 de {filteredDossiers.length} registros)
            </span>
          </div>

          <div>
            <div className="sm:hidden px-3 py-1 bg-blue-50/60 dark:bg-blue-950/40 border border-b-0 border-slate-200 dark:border-slate-800 rounded-t-xl text-[10px] text-blue-900 dark:text-cyan-300 flex items-center justify-between font-medium">
              <span>Desliza horizontalmente para ver todas las columnas</span>
              <span className="font-bold">↔</span>
            </div>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-b-xl sm:rounded-t-xl bg-slate-50 dark:bg-slate-900">
              <table className="w-full text-[11px] text-left border-collapse min-w-[760px] lg:min-w-full">
              <thead>
                <tr className="bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-300 dark:border-slate-700">
                  <th className="p-2.5">No. Expediente</th>
                  <th className="p-2.5">Proveedor</th>
                  <th className="p-2.5">NIT / Cédula</th>
                  <th className="p-2.5">Tipo Persona</th>
                  <th className="p-2.5">Tipo (A/B/C)</th>
                  <th className="p-2.5">Ciudad</th>
                  <th className="p-2.5">Categoría</th>
                  <th className="p-2.5">Estado</th>
                  <th className="p-2.5">SARLAFT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredDossiers.slice(0, 5).map((d) => {
                  const isNat = d.basicInfo?.supplierType === 'NATURAL';
                  const name = isNat ? d.basicInfo?.fullName : d.basicInfo?.companyName;
                  const doc = isNat ? d.basicInfo?.documentNumber : d.basicInfo?.nit;
                  const tier = d.supplierTier || d.basicInfo?.supplierTier || 'B';

                  return (
                    <tr key={d.id} className="hover:bg-white dark:hover:bg-slate-800/50">
                      <td className="p-2.5 font-bold text-blue-700 dark:text-cyan-400">{d.fileNumber}</td>
                      <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">{name}</td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">{doc}</td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">{isNat ? 'Natural' : 'Jurídica'}</td>
                      <td className="p-2.5">
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                            tier === 'A'
                              ? 'bg-slate-900 text-white border-slate-700 dark:bg-slate-800 dark:text-cyan-300'
                              : tier === 'B'
                              ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-cyan-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          Tipo {tier}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">{d.basicInfo?.city || 'Sogamoso'}</td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">{d.selectedCategory}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                          {d.processStatus}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.internalConcepts?.sarlatfCheck?.result === 'SIN_COINCIDENCIAS'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {d.internalConcepts?.sarlatfCheck?.result || 'PENDIENTE'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </div>

        {/* Main Export Button */}
        <div className="pt-4 flex justify-end">
          <button
            onClick={handleCustomExport}
            disabled={filteredDossiers.length === 0 || selectedColumns.length === 0}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-slate-950/30 flex items-center gap-2.5 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            <span>Generar y Descargar Informe Personalizado ({filteredDossiers.length} Registros)</span>
          </button>
        </div>

      </div>

    </div>
  );
};
