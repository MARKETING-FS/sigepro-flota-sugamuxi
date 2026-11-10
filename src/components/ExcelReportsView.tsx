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
import { PageHeader, heroPrimaryBtn, heroSecondaryBtn } from './ui/archive';

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

  const labelCls = 'text-[10px] font-semibold uppercase tracking-[0.16em] text-[#2c84c4] dark:text-[#69bdd7]';
  const fieldCls =
    'w-full h-11 px-3.5 text-sm rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/10 text-[#0b1d3a] dark:text-white placeholder:text-[#6b84a3] focus:outline-none focus:border-[#2c84c4] focus:ring-2 focus:ring-[#2c84c4]/30 cursor-pointer';
  const tileCls = 'rounded-2xl bg-black/[0.025] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/10';

  const habilitados = dossiers.filter((d) => d.processStatus === 'PROVEEDOR_HABILITADO' || d.processStatus === 'APROBADO').length;
  const stats = [
    { label: 'Proveedores', value: dossiers.length, icon: Users },
    { label: 'Habilitados', value: habilitados, icon: CheckCircle2 },
    { label: 'Eventos auditados', value: systemAuditLogs.length, icon: History },
    { label: 'Convocatorias', value: convocatorias.length, icon: Briefcase },
  ];

  const catalog: {
    id: OfficialReportId;
    icon: React.ElementType;
    code: string;
    title: string;
    desc: string;
    points: string[];
    count: number;
    direct: () => void;
    toast: string;
  }[] = [
    {
      id: 'DIRECTORIO_MAESTRO',
      icon: Users,
      code: 'SIG-FS-DIR-001',
      title: 'Directorio maestro de proveedores',
      desc: 'Listado consolidado con datos de contacto, NIT, razón social, ubicación, actividad económica y estado de proveedor y contractual.',
      points: ['30 columnas estandarizadas', 'Filtro por estado de proveedor y contractual'],
      count: dossiers.length,
      direct: () => exportMasterSupplierDirectory(dossiers),
      toast: '¡Directorio Maestro exportado en Excel!',
    },
    {
      id: 'MATRIZ_DOCUMENTAL',
      icon: FileText,
      code: 'ISO 9001:2015',
      title: 'Matriz de cumplimiento documental SIG',
      desc: 'Requisitos obligatorios frente a cargados, porcentaje de avance, formatos FS.GA y pendientes por corregir.',
      points: ['Control ISO 9001 por documento', 'Filtro por % de cumplimiento y semáforo SIG'],
      count: dossiers.length,
      direct: () => exportDocumentComplianceReport(dossiers),
      toast: '¡Matriz Documental exportada en Excel!',
    },
    {
      id: 'SARLAFT',
      icon: ShieldCheck,
      code: 'SAGRILAFT / SARLAFT',
      title: 'Debida diligencia SARLAFT y listas',
      desc: 'Conceptos de Oficialía de Cumplimiento, verificación en listas OFAC y antecedentes de Procuraduría y Policía Nacional.',
      points: ['Conceptos: aprobado, observado, rechazado', 'Fechas de consulta y responsable de Oficialía'],
      count: dossiers.length,
      direct: () => exportSarlaftReport(dossiers),
      toast: '¡Informe SARLAFT exportado en Excel!',
    },
    {
      id: 'CUENTAS_FINANZAS',
      icon: CreditCard,
      code: 'Tesorería y pagos',
      title: 'Cuentas bancarias y perfil financiero',
      desc: 'Cuentas para dispersión de pagos, tipo de cuenta, banco, régimen tributario, retenciones y patrimonio declarado.',
      points: ['Filtro por banco y tipo de cuenta', 'Régimen tributario e indicadores financieros'],
      count: dossiers.length,
      direct: () => exportFinancialBankReport(dossiers),
      toast: '¡Informe Financiero y Bancario exportado en Excel!',
    },
    {
      id: 'CONVOCATORIAS',
      icon: Briefcase,
      code: 'Licitaciones y FS',
      title: 'Convocatorias y postulaciones',
      desc: 'Histórico de convocatorias de contratación, postulantes inscritos, propuestas económicas y estado de calificación.',
      points: ['2 hojas de cálculo (convocatorias y postulaciones)', 'Filtro por estado y categoría de contratación'],
      count: convocatorias.length,
      direct: () => exportConvocatoriasReport(convocatorias, dossiers),
      toast: '¡Informe de Convocatorias exportado en Excel!',
    },
    {
      id: 'AUDITORIA',
      icon: History,
      code: 'Forense y control',
      title: 'Libro de auditoría y modificaciones',
      desc: 'Registro cronológico e inmutable de modificaciones, justificaciones obligatorias, usuario responsable e IP.',
      points: ['Control de cambios y trazabilidad', 'Comparativa de valor anterior y nuevo'],
      count: systemAuditLogs.length,
      direct: () => exportAuditLogsReport(systemAuditLogs),
      toast: '¡Libro de Auditoría exportado en Excel!',
    },
    {
      id: 'EVALUACIONES',
      icon: Award,
      code: 'SIG-FS-EVAL-007',
      title: 'Evaluaciones y desempeño SIG',
      desc: 'Evaluaciones periódicas de calidad: puntajes (0-100), concepto técnico, evaluador asignado, planes de mejora y fechas de corte.',
      points: ['Filtro por evaluador, concepto y tipo', 'Planes de mejora y calificación numérica'],
      count: supplierEvaluations.length,
      direct: () => exportEvaluationsReport(supplierEvaluations, 'Consolidado General de Evaluaciones'),
      toast: '¡Informe de Evaluaciones exportado en Excel!',
    },
  ];

  const filterFields: { label: string; node: React.ReactNode }[] = [
    {
      label: 'Búsqueda rápida',
      node: (
        <div className="relative">
          <Search className="w-4 h-4 text-[#6b84a3] absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Nombre, NIT, radicado…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${fieldCls} pl-10 cursor-text`}
          />
        </div>
      ),
    },
    {
      label: 'Estado del proceso',
      node: (
        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className={fieldCls}>
          <option value="ALL">Todos los estados ({dossiers.length})</option>
          <option value="PROVEEDOR_HABILITADO">Habilitado operativamente</option>
          <option value="APROBADO">Aprobado</option>
          <option value="EN_REVISION">En revisión</option>
          <option value="CORREGIDO_EN_REVISION">Corregido en revisión</option>
          <option value="REQUIERE_CORRECCION">Requiere corrección</option>
          <option value="DOCUMENTACION_PENDIENTE">Documentación pendiente</option>
          <option value="BORRADOR">Borrador</option>
          <option value="RECHAZADO">Rechazado</option>
        </select>
      ),
    },
    {
      label: 'Tipo de persona',
      node: (
        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className={fieldCls}>
          <option value="ALL">Todas las personas</option>
          <option value="JURIDICA">Persona jurídica (empresas)</option>
          <option value="NATURAL">Persona natural</option>
        </select>
      ),
    },
    {
      label: 'Tipo de proveedor (A/B/C)',
      node: (
        <select value={selectedTier} onChange={(e) => setSelectedTier(e.target.value)} className={fieldCls}>
          <option value="ALL">Todos los tipos (A, B, C)</option>
          <option value="A">Tipo A - Crítico</option>
          <option value="B">Tipo B - Operativo</option>
          <option value="C">Tipo C - Estándar</option>
        </select>
      ),
    },
    {
      label: 'Categoría / sector',
      node: (
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={fieldCls}>
          <option value="ALL">Todas las categorías</option>
          {categoriesConfig.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
      ),
    },
    {
      label: 'Estado SARLAFT',
      node: (
        <select value={selectedSarlaft} onChange={(e) => setSelectedSarlaft(e.target.value)} className={fieldCls}>
          <option value="ALL">Todos los conceptos</option>
          <option value="SIN_COINCIDENCIAS">Sin coincidencias (limpio)</option>
          <option value="REQUIERE_VERIFICACION">Requiere verificación</option>
          <option value="PENDIENTE">Pendiente de consulta</option>
        </select>
      ),
    },
  ];

  return (
    <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 pb-8 pt-1 space-y-6">
      <PageHeader
        icon={FileSpreadsheet}
        title="Reportes e informes"
        subtitle="Informes maestros, matrices documentales, trazabilidad SARLAFT y auditorías en Excel"
        actions={
          <button
            type="button"
            className={heroPrimaryBtn}
            onClick={() => {
              exportExecutiveMasterWorkbook(dossiers, systemAuditLogs, convocatorias);
              showToast('¡Libro Maestro Consolidado generado con éxito!', 'success');
            }}
          >
            <Download className="w-5 h-5" /> Descargar libro maestro
          </button>
        }
      />

      {/* Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="fs-card lift rounded-[22px] p-4 sm:p-5 animate-fade-up">
              <div className="flex items-start justify-between gap-2">
                <span className={labelCls}>{s.label}</span>
                <span className="w-9 h-9 rounded-xl bg-gradient-action text-white grid place-items-center shrink-0 shadow-glow"><Icon className="w-4 h-4" /></span>
              </div>
              <div className="mt-3 font-display text-3xl font-semibold text-[#0b1d3a] dark:text-white tabular-nums">{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Catálogo de informes oficiales */}
      <section className="space-y-4">
        <div>
          <div className={labelCls}>Informes oficiales</div>
          <h3 className="mt-1 font-display text-xl font-semibold text-[#0b1d3a] dark:text-white">Elige un informe, filtra y exporta</h3>
          <p className="mt-1 text-sm text-[#3a5274] dark:text-slate-400 max-w-3xl">
            Abre cualquiera de los 7 informes normativos para parametrizar estados, contratos, evaluadores o fechas, ver los datos en vivo y generar el Excel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {catalog.map((c) => {
            const Icon = c.icon;
            return (
              <article key={c.id} className="fs-card lift rounded-[24px] p-5 sm:p-6 flex flex-col justify-between animate-fade-up">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="w-12 h-12 rounded-2xl bg-gradient-action text-white grid place-items-center shadow-glow"><Icon className="w-5 h-5" /></span>
                    <span className="text-[10px] font-semibold tracking-wide px-2.5 h-6 inline-flex items-center rounded-full bg-[#2c84c4]/12 dark:bg-[#2c84c4]/25 text-[#1d5fa8] dark:text-[#69bdd7] border border-[#2c84c4]/25">{c.code}</span>
                  </div>
                  <h4 className="mt-4 font-display text-lg font-semibold text-[#0b1d3a] dark:text-white leading-snug">{c.title}</h4>
                  <p className="mt-1.5 text-sm text-[#3a5274] dark:text-slate-400 leading-relaxed">{c.desc}</p>
                  <ul className={`mt-4 ${tileCls} p-3.5 space-y-1.5`}>
                    {c.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2 text-xs text-[#3a5274] dark:text-slate-300">
                        <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#2c84c4] dark:text-[#69bdd7]" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-5 space-y-2">
                  <button
                    type="button"
                    onClick={() => setActiveOfficialReport(c.id)}
                    className="w-full h-11 px-4 rounded-xl bg-gradient-action text-white text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-glow cursor-pointer hover:brightness-110 transition"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Ingresar y filtrar</span>
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      c.direct();
                      showToast(c.toast, 'success');
                    }}
                    className="w-full h-10 px-4 rounded-xl border border-[#2c84c4]/35 text-[#1d5fa8] dark:text-[#69bdd7] hover:bg-[#2c84c4]/10 text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descarga directa ({c.count})</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Constructor de reportes personalizados */}
      <section className="fs-card rounded-[24px] p-5 sm:p-7 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="w-12 h-12 rounded-2xl bg-gradient-action text-white grid place-items-center shadow-glow shrink-0"><Table className="w-5 h-5" /></span>
            <div>
              <div className={labelCls}>Constructor</div>
              <h3 className="font-display text-xl font-semibold text-[#0b1d3a] dark:text-white">Reportes personalizados en Excel</h3>
              <p className="text-sm text-[#3a5274] dark:text-slate-400">Filtra los proveedores, elige las columnas exactas y descarga tu archivo a medida.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-8 px-3.5 inline-flex items-center rounded-full bg-[#2c84c4]/12 dark:bg-[#2c84c4]/25 text-xs font-semibold text-[#1d5fa8] dark:text-[#69bdd7] border border-[#2c84c4]/25">{filteredDossiers.length} proveedores coincidentes</span>
            <span className="h-8 px-3.5 inline-flex items-center rounded-full bg-[#69bdd7]/20 text-xs font-semibold text-[#0e6d8a] dark:text-[#69bdd7] border border-[#69bdd7]/35">{selectedColumns.length} columnas</span>
          </div>
        </div>

        <div>
          <label className={`${labelCls} block mb-2`}>Título del informe (aparece en el encabezado del Excel)</label>
          <input
            type="text"
            value={customReportTitle}
            onChange={(e) => setCustomReportTitle(e.target.value)}
            placeholder="Ej. Informe de proveedores habilitados zona Boyacá"
            className={`${fieldCls} cursor-text font-semibold`}
          />
        </div>

        {/* Filtros */}
        <div className={`${tileCls} p-4 sm:p-5`}>
          <div className={`${labelCls} mb-3`}>Filtros</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterFields.map((f) => (
              <div key={f.label}>
                <label className="block text-xs font-semibold text-[#0b1d3a] dark:text-slate-200 mb-1.5">{f.label}</label>
                {f.node}
              </div>
            ))}
          </div>
        </div>

        {/* Columnas */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className={labelCls}>Columnas a incluir en el Excel</span>
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleSelectAllColumns} className="text-xs font-semibold text-[#2c84c4] dark:text-[#69bdd7] hover:underline cursor-pointer">
                Seleccionar todas
              </button>
              <span className="h-4 w-px bg-black/15 dark:bg-white/20" />
              <button type="button" onClick={handleClearColumns} className="text-xs font-semibold text-[#3a5274] dark:text-slate-400 hover:underline cursor-pointer">
                Restablecer básicas
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {columnGroups.map((group) => {
              const selectedInGroup = group.columns.filter((c) => selectedColumns.includes(c.id)).length;
              return (
                <div key={group.groupName} className={`${tileCls} p-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display text-sm font-semibold text-[#0b1d3a] dark:text-white">{group.groupName}</span>
                    <span className="text-[11px] font-semibold text-[#2c84c4] dark:text-[#69bdd7] tabular-nums">{selectedInGroup}/{group.columns.length}</span>
                  </div>
                  <div className="space-y-1">
                    {group.columns.map((col) => {
                      const isChecked = selectedColumns.includes(col.id);
                      return (
                        <label
                          key={col.id}
                          className={`flex items-center gap-3 px-2.5 h-10 rounded-xl text-sm cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-[#2c84c4]/12 dark:bg-[#2c84c4]/20 text-[#0b1d3a] dark:text-white font-semibold'
                              : 'text-[#3a5274] dark:text-slate-400 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                          }`}
                        >
                          <input type="checkbox" checked={isChecked} onChange={() => handleToggleColumn(col.id)} className="sr-only peer" />
                          <span
                            className={`w-5 h-5 rounded-md grid place-items-center shrink-0 border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#2c84c4]/50 ${
                              isChecked ? 'bg-gradient-action border-transparent text-white' : 'border-[#6b84a3]/60 bg-transparent'
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                          </span>
                          <span className="truncate">{col.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vista previa */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={labelCls}>Vista previa (primeros 5 de {filteredDossiers.length})</span>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-black/[0.08] dark:border-white/10">
            <table className="w-full text-xs text-left border-collapse min-w-[760px] lg:min-w-full">
              <thead>
                <tr className="bg-[#2c84c4]/12 dark:bg-[#2c84c4]/20 text-[#1d5fa8] dark:text-[#69bdd7]">
                  {['No. Expediente', 'Proveedor', 'NIT / Cédula', 'Tipo persona', 'Tipo', 'Ciudad', 'Categoría', 'Estado', 'SARLAFT'].map((h) => (
                    <th key={h} className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.12em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] dark:divide-white/10">
                {filteredDossiers.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-sm text-[#3a5274] dark:text-slate-400">Ningún proveedor coincide con los filtros.</td>
                  </tr>
                )}
                {filteredDossiers.slice(0, 5).map((d) => {
                  const isNat = d.basicInfo?.supplierType === 'NATURAL';
                  const name = isNat ? d.basicInfo?.fullName : d.basicInfo?.companyName;
                  const doc = isNat ? d.basicInfo?.documentNumber : d.basicInfo?.nit;
                  const tier = d.supplierTier || d.basicInfo?.supplierTier || 'B';
                  const sarlaft = d.internalConcepts?.sarlatfCheck?.result;
                  return (
                    <tr key={d.id} className="hover:bg-[#2c84c4]/[0.06] transition-colors">
                      <td className="px-3 py-3 font-mono font-semibold text-[#1d5fa8] dark:text-[#69bdd7]">{d.fileNumber}</td>
                      <td className="px-3 py-3 font-semibold text-[#0b1d3a] dark:text-white">{name}</td>
                      <td className="px-3 py-3 text-[#3a5274] dark:text-slate-400">{doc}</td>
                      <td className="px-3 py-3 text-[#3a5274] dark:text-slate-400">{isNat ? 'Natural' : 'Jurídica'}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 h-6 inline-flex items-center rounded-md text-[10px] font-bold ${tier === 'A' ? 'bg-gradient-action text-white' : 'bg-[#69bdd7]/25 text-[#0e6d8a] dark:text-[#69bdd7]'}`}>Tipo {tier}</span>
                      </td>
                      <td className="px-3 py-3 text-[#3a5274] dark:text-slate-400">{d.basicInfo?.city || 'Sogamoso'}</td>
                      <td className="px-3 py-3 text-[#3a5274] dark:text-slate-400">{d.selectedCategory}</td>
                      <td className="px-3 py-3">
                        <span className="px-2.5 h-6 inline-flex items-center rounded-full text-[10px] font-bold bg-[#2c84c4]/12 dark:bg-[#2c84c4]/25 text-[#1d5fa8] dark:text-[#69bdd7]">{d.processStatus}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2.5 h-6 inline-flex items-center rounded-full text-[10px] font-bold ${sarlaft === 'SIN_COINCIDENCIAS' ? 'bg-[#2c84c4]/12 dark:bg-[#2c84c4]/25 text-[#1d5fa8] dark:text-[#69bdd7]' : 'bg-black/[0.06] dark:bg-white/10 text-[#3a5274] dark:text-slate-300'}`}>
                          {sarlaft || 'PENDIENTE'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={handleCustomExport}
            disabled={filteredDossiers.length === 0 || selectedColumns.length === 0}
            className="h-12 px-6 rounded-xl bg-gradient-action text-white font-semibold text-sm shadow-glow inline-flex items-center gap-2.5 transition cursor-pointer hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
          >
            <Download className="w-5 h-5" />
            <span>Generar y descargar informe ({filteredDossiers.length} registros)</span>
          </button>
        </div>
      </section>
    </div>
  );
};
