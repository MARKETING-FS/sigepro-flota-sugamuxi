import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Download,
  Filter,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Users,
  FileText,
  ShieldCheck,
  CreditCard,
  Briefcase,
  History,
  Award,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  X,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  SupplierDossier,
  Convocatoria,
  SystemAuditEntry,
  SupplierEvaluation,
  ProcessStatus,
} from '../../types';
import { getContractualStatus } from '../../utils/contractValidity';
import {
  exportMasterSupplierDirectory,
  exportDocumentComplianceReport,
  exportSarlaftReport,
  exportFinancialBankReport,
  exportConvocatoriasReport,
  exportAuditLogsReport,
  exportEvaluationsReport,
} from '../../utils/excelExport';

export type OfficialReportId =
  | 'DIRECTORIO_MAESTRO'
  | 'MATRIZ_DOCUMENTAL'
  | 'SARLAFT'
  | 'CUENTAS_FINANZAS'
  | 'CONVOCATORIAS'
  | 'AUDITORIA'
  | 'EVALUACIONES';

interface OfficialReportMeta {
  id: OfficialReportId;
  title: string;
  subtitle: string;
  normativeCode: string;
  description: string;
  icon: React.ElementType;
  accentColor: string;
}

export const OFFICIAL_REPORTS_METADATA: Record<OfficialReportId, OfficialReportMeta> = {
  DIRECTORIO_MAESTRO: {
    id: 'DIRECTORIO_MAESTRO',
    title: 'Directorio Maestro de Proveedores y Contratistas',
    subtitle: 'Base consolidada de proveedores registrados, estado comercial y contractual',
    normativeCode: 'SIG-FS-DIR-001 | ISO 9001:2015',
    description:
      'Directorio oficial estructurado con 30 columnas institucionalizadas: datos fiscales, representantes legales, teléfonos, correos, ubicación geográfica, CIIU, banco receptor, estado del expediente y estado contractual.',
    icon: Users,
    accentColor: 'blue',
  },
  MATRIZ_DOCUMENTAL: {
    id: 'MATRIZ_DOCUMENTAL',
    title: 'Matriz de Cumplimiento Documental SIG',
    subtitle: 'Control de requisitos obligatorios, formatos institucionales y porcentajes de avance',
    normativeCode: 'SIG-FS-DOC-002 | Cláusula 8.4',
    description:
      'Matriz técnica de verificación documental: auditoría del RUT, Cámara de Comercio, certificación bancaria, seguridad social, formatos FS.GA-FOR-009 y 039, porcentaje de cumplimiento y faltantes por subsanar.',
    icon: FileText,
    accentColor: 'indigo',
  },
  SARLAFT: {
    id: 'SARLAFT',
    title: 'Debida Diligencia SARLAFT & Listas Restrictivas',
    subtitle: 'Gestión de riesgos LA/FT/FPADM, listas vinculantes OFAC y antecedentes legales',
    normativeCode: 'SAGRILAFT / Circular Externa Supersociedades',
    description:
      'Informe oficial para la Oficialía de Cumplimiento: conceptos de validación en listas vinculantes (OFAC, Clinton, ONU), antecedentes de Procuraduría y Policía Nacional, y formulario de declaración de origen de fondos.',
    icon: ShieldCheck,
    accentColor: 'emerald',
  },
  CUENTAS_FINANZAS: {
    id: 'CUENTAS_FINANZAS',
    title: 'Cuentas Bancarias y Perfil Financiero',
    subtitle: 'Datos de dispersión de pagos de tesorería, régimen fiscal e indicadores patrimoniales',
    normativeCode: 'SIG-FS-FIN-004 | Tesorería y Contabilidad',
    description:
      'Registro especializado para dispersión de pagos: bancos receptores, tipo y número de cuenta, validación de certificación bancaria, régimen tributario, gran contribuyente, autorretenedor y balance financiero.',
    icon: CreditCard,
    accentColor: 'amber',
  },
  CONVOCATORIAS: {
    id: 'CONVOCATORIAS',
    title: 'Convocatorias y Postulaciones de Contratación',
    subtitle: 'Procesos de selección, ofertas de contratistas y propuestas económicas radicadas',
    normativeCode: 'SIG-FS-CONV-005 | Comité de Compras',
    description:
      'Informe de procesos competitivos en 2 hojas de cálculo: consolidado de convocatorias públicas/privadas y libro detallado de postulaciones con montos ofertados, radicados y calificaciones.',
    icon: Briefcase,
    accentColor: 'cyan',
  },
  AUDITORIA: {
    id: 'AUDITORIA',
    title: 'Libro de Auditoría y Trazabilidad de Cambios',
    subtitle: 'Registro cronológico inmutable de modificaciones en expedientes y operaciones clave',
    normativeCode: 'SIG-FS-AUD-006 | Trazabilidad ISO 9001',
    description:
      'Histórico forense de auditoría: registro de usuarios responsables, roles, direcciones IP, valores anteriores versus nuevos, justificaciones obligatorias y marcas temporales de cada cambio.',
    icon: History,
    accentColor: 'slate',
  },
  EVALUACIONES: {
    id: 'EVALUACIONES',
    title: 'Evaluaciones de Desempeño y Calidad de Proveedores',
    subtitle: 'Calificaciones técnicas, homologación inicial, revisiones anuales y planes de mejora',
    normativeCode: 'SIG-FS-EVAL-007 | Evaluación y Re-evaluación',
    description:
      'Reporte detallado de evaluaciones de calidad de proveedores: puntajes obtenidos (0-100), concepto técnico (Sobresaliente, Conforme, Condicional, No Conforme), evaluador asignado, planes de mejora y próximas fechas de corte.',
    icon: Award,
    accentColor: 'purple',
  },
};

interface Props {
  reportId: OfficialReportId;
  onSelectReport: (id: OfficialReportId) => void;
  onBackToCatalog: () => void;
}

export const OfficialReportWorkspace: React.FC<Props> = ({
  reportId,
  onSelectReport,
  onBackToCatalog,
}) => {
  const {
    dossiers,
    systemAuditLogs,
    convocatorias,
    supplierEvaluations,
    categoriesConfig,
    showToast,
  } = useApp();

  const meta = OFFICIAL_REPORTS_METADATA[reportId];
  const Icon = meta.icon;

  // -------------------------------------------------------------
  // Filter States for DIRECTORIO_MAESTRO
  // -------------------------------------------------------------
  const [dirSearch, setDirSearch] = useState('');
  const [dirStatus, setDirStatus] = useState('ALL');
  const [dirContractual, setDirContractual] = useState('ALL');
  const [dirType, setDirType] = useState('ALL');
  const [dirTier, setDirTier] = useState('ALL');
  const [dirCategory, setDirCategory] = useState('ALL');
  const [dirSarlaft, setDirSarlaft] = useState('ALL');

  // -------------------------------------------------------------
  // Filter States for MATRIZ_DOCUMENTAL
  // -------------------------------------------------------------
  const [docSearch, setDocSearch] = useState('');
  const [docComplianceRange, setDocComplianceRange] = useState('ALL');
  const [docStatus, setDocStatus] = useState('ALL');
  const [docCategory, setDocCategory] = useState('ALL');
  const [docMissingFilter, setDocMissingFilter] = useState('ALL');

  // -------------------------------------------------------------
  // Filter States for SARLAFT
  // -------------------------------------------------------------
  const [sarlSearch, setSarlSearch] = useState('');
  const [sarlConcept, setSarlConcept] = useState('ALL');
  const [sarlOfac, setSarlOfac] = useState('ALL');
  const [sarlProc, setSarlProc] = useState('ALL');
  const [sarlFormStatus, setSarlFormStatus] = useState('ALL');
  const [sarlSupplierType, setSarlSupplierType] = useState('ALL');

  // -------------------------------------------------------------
  // Filter States for CUENTAS_FINANZAS
  // -------------------------------------------------------------
  const [finSearch, setFinSearch] = useState('');
  const [finBank, setFinBank] = useState('ALL');
  const [finAccountType, setFinAccountType] = useState('ALL');
  const [finCertBankStatus, setFinCertBankStatus] = useState('ALL');
  const [finTaxRegime, setFinTaxRegime] = useState('ALL');
  const [finGranContribuyente, setFinGranContribuyente] = useState('ALL');
  const [finAutoRetenedor, setFinAutoRetenedor] = useState('ALL');

  // -------------------------------------------------------------
  // Filter States for CONVOCATORIAS
  // -------------------------------------------------------------
  const [convSearch, setConvSearch] = useState('');
  const [convStatus, setConvStatus] = useState('ALL');
  const [convCategory, setConvCategory] = useState('ALL');
  const [convHasPosts, setConvHasPosts] = useState('ALL');

  // -------------------------------------------------------------
  // Filter States for AUDITORIA
  // -------------------------------------------------------------
  const [auditSearch, setAuditSearch] = useState('');
  const [auditAction, setAuditAction] = useState('ALL');
  const [auditSection, setAuditSection] = useState('ALL');
  const [auditRole, setAuditRole] = useState('ALL');

  // -------------------------------------------------------------
  // Filter States for EVALUACIONES
  // -------------------------------------------------------------
  const [evalSearch, setEvalSearch] = useState('');
  const [evalType, setEvalType] = useState('ALL');
  const [evalConcept, setEvalConcept] = useState('ALL');
  const [evalImprovementPlan, setEvalImprovementPlan] = useState('ALL');
  const [evalScoreRange, setEvalScoreRange] = useState('ALL');

  // Reset filters for current report
  const handleResetFilters = () => {
    switch (reportId) {
      case 'DIRECTORIO_MAESTRO':
        setDirSearch('');
        setDirStatus('ALL');
        setDirContractual('ALL');
        setDirType('ALL');
        setDirTier('ALL');
        setDirCategory('ALL');
        setDirSarlaft('ALL');
        break;
      case 'MATRIZ_DOCUMENTAL':
        setDocSearch('');
        setDocComplianceRange('ALL');
        setDocStatus('ALL');
        setDocCategory('ALL');
        setDocMissingFilter('ALL');
        break;
      case 'SARLAFT':
        setSarlSearch('');
        setSarlConcept('ALL');
        setSarlOfac('ALL');
        setSarlProc('ALL');
        setSarlFormStatus('ALL');
        setSarlSupplierType('ALL');
        break;
      case 'CUENTAS_FINANZAS':
        setFinSearch('');
        setFinBank('ALL');
        setFinAccountType('ALL');
        setFinCertBankStatus('ALL');
        setFinTaxRegime('ALL');
        setFinGranContribuyente('ALL');
        setFinAutoRetenedor('ALL');
        break;
      case 'CONVOCATORIAS':
        setConvSearch('');
        setConvStatus('ALL');
        setConvCategory('ALL');
        setConvHasPosts('ALL');
        break;
      case 'AUDITORIA':
        setAuditSearch('');
        setAuditAction('ALL');
        setAuditSection('ALL');
        setAuditRole('ALL');
        break;
      case 'EVALUACIONES':
        setEvalSearch('');
        setEvalType('ALL');
        setEvalConcept('ALL');
        setEvalImprovementPlan('ALL');
        setEvalScoreRange('ALL');
        break;
    }
  };

  // -------------------------------------------------------------
  // Filtering Logic
  // -------------------------------------------------------------

  // 1. Directorio Maestro
  const filteredDirectorio = useMemo(() => {
    return dossiers.filter((d) => {
      const isNatural = d.basicInfo?.supplierType === 'NATURAL';
      const name = isNatural ? d.basicInfo?.fullName : d.basicInfo?.companyName;
      const doc = isNatural ? d.basicInfo?.documentNumber : d.basicInfo?.nit;
      const q = dirSearch.toLowerCase().trim();

      if (
        q &&
        !d.fileNumber?.toLowerCase().includes(q) &&
        !name?.toLowerCase().includes(q) &&
        !doc?.toLowerCase().includes(q) &&
        !d.basicInfo?.email?.toLowerCase().includes(q) &&
        !d.basicInfo?.city?.toLowerCase().includes(q)
      ) {
        return false;
      }

      if (dirStatus !== 'ALL' && d.processStatus !== dirStatus) return false;

      if (dirContractual !== 'ALL') {
        const cStatus = getContractualStatus(d).status;
        if (cStatus !== dirContractual) return false;
      }

      if (dirType !== 'ALL' && d.basicInfo?.supplierType !== dirType) return false;

      if (dirTier !== 'ALL') {
        const tier = d.supplierTier || d.basicInfo?.supplierTier || 'B';
        if (tier !== dirTier) return false;
      }

      if (dirCategory !== 'ALL' && d.selectedCategory !== dirCategory) return false;

      if (dirSarlaft !== 'ALL') {
        const res = d.internalConcepts?.sarlatfCheck?.result || 'PENDIENTE';
        if (res !== dirSarlaft) return false;
      }

      return true;
    });
  }, [dossiers, dirSearch, dirStatus, dirContractual, dirType, dirTier, dirCategory, dirSarlaft]);

  // 2. Matriz Documental
  const filteredMatriz = useMemo(() => {
    return dossiers.filter((d) => {
      const isNatural = d.basicInfo?.supplierType === 'NATURAL';
      const name = isNatural ? d.basicInfo?.fullName : d.basicInfo?.companyName;
      const doc = isNatural ? d.basicInfo?.documentNumber : d.basicInfo?.nit;
      const q = docSearch.toLowerCase().trim();

      if (
        q &&
        !d.fileNumber?.toLowerCase().includes(q) &&
        !name?.toLowerCase().includes(q) &&
        !doc?.toLowerCase().includes(q)
      ) {
        return false;
      }

      if (docStatus !== 'ALL' && d.processStatus !== docStatus) return false;
      if (docCategory !== 'ALL' && d.selectedCategory !== docCategory) return false;

      // Compute compliance percentage
      const docs = Object.values(d.documents || {});
      const req = docs.filter((x) => x.isRequired !== false);
      const app = req.filter((x) => x.status === 'APROBADO');
      const pct = Math.round((app.length / (req.length || 1)) * 100);

      if (docComplianceRange === '100' && pct < 100) return false;
      if (docComplianceRange === '70_99' && (pct < 70 || pct >= 100)) return false;
      if (docComplianceRange === '40_69' && (pct < 40 || pct >= 70)) return false;
      if (docComplianceRange === 'UNDER_40' && pct >= 40) return false;

      if (docMissingFilter !== 'ALL') {
        const docObj = (d.documents as any)?.[docMissingFilter];
        if (docObj && docObj.status === 'APROBADO') {
          return false; // Not missing
        }
      }

      return true;
    });
  }, [dossiers, docSearch, docComplianceRange, docStatus, docCategory, docMissingFilter]);

  // 3. SARLAFT
  const filteredSarlaft = useMemo(() => {
    return dossiers.filter((d) => {
      const isNatural = d.basicInfo?.supplierType === 'NATURAL';
      const name = isNatural ? d.basicInfo?.fullName : d.basicInfo?.companyName;
      const doc = isNatural ? d.basicInfo?.documentNumber : d.basicInfo?.nit;
      const rep = d.basicInfo?.representativeLegalName;
      const q = sarlSearch.toLowerCase().trim();

      if (
        q &&
        !d.fileNumber?.toLowerCase().includes(q) &&
        !name?.toLowerCase().includes(q) &&
        !doc?.toLowerCase().includes(q) &&
        !rep?.toLowerCase().includes(q)
      ) {
        return false;
      }

      if (sarlConcept !== 'ALL') {
        const res = d.internalConcepts?.sarlatfCheck?.result || 'PENDIENTE';
        if (res !== sarlConcept) return false;
      }

      if (sarlOfac !== 'ALL') {
        const res = d.internalConcepts?.ofacCheck?.result || 'PENDIENTE';
        if (res !== sarlOfac) return false;
      }

      if (sarlProc !== 'ALL') {
        const res = d.internalConcepts?.procuraduriaPoliciaCheck?.result || 'PENDIENTE';
        if (res !== sarlProc) return false;
      }

      if (sarlFormStatus !== 'ALL') {
        const st = d.documents?.DECLARACION_SARLAFT?.status || 'NO_CARGADO';
        if (st !== sarlFormStatus) return false;
      }

      if (sarlSupplierType !== 'ALL' && d.basicInfo?.supplierType !== sarlSupplierType) {
        return false;
      }

      return true;
    });
  }, [dossiers, sarlSearch, sarlConcept, sarlOfac, sarlProc, sarlFormStatus, sarlSupplierType]);

  // 4. Cuentas y Finanzas
  const filteredFinanzas = useMemo(() => {
    return dossiers.filter((d) => {
      const isNatural = d.basicInfo?.supplierType === 'NATURAL';
      const name = isNatural ? d.basicInfo?.fullName : d.basicInfo?.companyName;
      const doc = isNatural ? d.basicInfo?.documentNumber : d.basicInfo?.nit;
      const bank = d.basicInfo?.bankInfo;
      const tax = d.basicInfo?.taxInfo;
      const q = finSearch.toLowerCase().trim();

      if (
        q &&
        !d.fileNumber?.toLowerCase().includes(q) &&
        !name?.toLowerCase().includes(q) &&
        !doc?.toLowerCase().includes(q) &&
        !bank?.accountNumber?.toLowerCase().includes(q) &&
        !bank?.bankName?.toLowerCase().includes(q)
      ) {
        return false;
      }

      if (finBank !== 'ALL' && !(bank?.bankName || 'Bancolombia').includes(finBank)) {
        return false;
      }

      if (finAccountType !== 'ALL' && bank?.accountType !== finAccountType) {
        return false;
      }

      if (finCertBankStatus !== 'ALL') {
        const isApp = d.documents?.CERTIFICACION_BANCARIA?.status === 'APROBADO';
        if (finCertBankStatus === 'VALIDADA' && !isApp) return false;
        if (finCertBankStatus === 'PENDIENTE' && isApp) return false;
      }

      if (finTaxRegime !== 'ALL' && !tax?.taxRegime?.includes(finTaxRegime)) {
        return false;
      }

      if (finGranContribuyente !== 'ALL') {
        const val = tax?.isGranContribuyente ? 'SI' : 'NO';
        if (val !== finGranContribuyente) return false;
      }

      if (finAutoRetenedor !== 'ALL') {
        const val = tax?.isAutoRetenedor ? 'SI' : 'NO';
        if (val !== finAutoRetenedor) return false;
      }

      return true;
    });
  }, [
    dossiers,
    finSearch,
    finBank,
    finAccountType,
    finCertBankStatus,
    finTaxRegime,
    finGranContribuyente,
    finAutoRetenedor,
  ]);

  // 5. Convocatorias
  const filteredConvocatorias = useMemo(() => {
    return convocatorias.filter((c) => {
      const q = convSearch.toLowerCase().trim();
      if (
        q &&
        !c.code?.toLowerCase().includes(q) &&
        !c.title?.toLowerCase().includes(q) &&
        !c.category?.toLowerCase().includes(q)
      ) {
        return false;
      }

      if (convStatus !== 'ALL' && c.status !== convStatus) return false;
      if (convCategory !== 'ALL' && c.category !== convCategory) return false;

      const postCount = c.postulaciones?.length || 0;
      if (convHasPosts === 'WITH_POSTS' && postCount === 0) return false;
      if (convHasPosts === 'NO_POSTS' && postCount > 0) return false;

      return true;
    });
  }, [convocatorias, convSearch, convStatus, convCategory, convHasPosts]);

  // 6. Auditoría
  const auditDistinctActions = useMemo(() => {
    const set = new Set<string>();
    systemAuditLogs.forEach((l) => l.action && set.add(l.action));
    return Array.from(set);
  }, [systemAuditLogs]);

  const auditDistinctSections = useMemo(() => {
    const set = new Set<string>();
    systemAuditLogs.forEach((l) => l.section && set.add(l.section));
    return Array.from(set);
  }, [systemAuditLogs]);

  const filteredAuditoria = useMemo(() => {
    return systemAuditLogs.filter((log) => {
      const q = auditSearch.toLowerCase().trim();
      if (
        q &&
        !log.user?.toLowerCase().includes(q) &&
        !log.action?.toLowerCase().includes(q) &&
        !log.section?.toLowerCase().includes(q) &&
        !log.supplierName?.toLowerCase().includes(q) &&
        !log.fileNumber?.toLowerCase().includes(q) &&
        !log.fieldChanged?.toLowerCase().includes(q) &&
        !log.justification?.toLowerCase().includes(q)
      ) {
        return false;
      }

      if (auditAction !== 'ALL' && log.action !== auditAction) return false;
      if (auditSection !== 'ALL' && log.section !== auditSection) return false;
      if (auditRole !== 'ALL' && log.userRole !== auditRole) return false;

      return true;
    });
  }, [systemAuditLogs, auditSearch, auditAction, auditSection, auditRole]);

  // 7. Evaluaciones
  const filteredEvaluaciones = useMemo(() => {
    return supplierEvaluations.filter((ev) => {
      const q = evalSearch.toLowerCase().trim();
      if (
        q &&
        !ev.supplierName?.toLowerCase().includes(q) &&
        !ev.supplierDoc?.toLowerCase().includes(q) &&
        !ev.fileNumber?.toLowerCase().includes(q) &&
        !ev.evaluatorName?.toLowerCase().includes(q)
      ) {
        return false;
      }

      if (evalType !== 'ALL' && ev.evaluationType !== evalType) return false;
      if (evalConcept !== 'ALL' && ev.concept !== evalConcept) return false;

      if (evalImprovementPlan !== 'ALL') {
        const has = ev.hasImprovementPlan ? 'YES' : 'NO';
        if (has !== evalImprovementPlan) return false;
      }

      const score = ev.totalScore || 0;
      if (evalScoreRange === '90_100' && score < 90) return false;
      if (evalScoreRange === '70_89' && (score < 70 || score >= 90)) return false;
      if (evalScoreRange === '60_69' && (score < 60 || score >= 70)) return false;
      if (evalScoreRange === 'UNDER_60' && score >= 60) return false;

      return true;
    });
  }, [supplierEvaluations, evalSearch, evalType, evalConcept, evalImprovementPlan, evalScoreRange]);

  // Record counts based on report
  const { totalCount, filteredCount } = useMemo(() => {
    switch (reportId) {
      case 'DIRECTORIO_MAESTRO':
        return { totalCount: dossiers.length, filteredCount: filteredDirectorio.length };
      case 'MATRIZ_DOCUMENTAL':
        return { totalCount: dossiers.length, filteredCount: filteredMatriz.length };
      case 'SARLAFT':
        return { totalCount: dossiers.length, filteredCount: filteredSarlaft.length };
      case 'CUENTAS_FINANZAS':
        return { totalCount: dossiers.length, filteredCount: filteredFinanzas.length };
      case 'CONVOCATORIAS':
        return { totalCount: convocatorias.length, filteredCount: filteredConvocatorias.length };
      case 'AUDITORIA':
        return { totalCount: systemAuditLogs.length, filteredCount: filteredAuditoria.length };
      case 'EVALUACIONES':
        return { totalCount: supplierEvaluations.length, filteredCount: filteredEvaluaciones.length };
    }
  }, [
    reportId,
    dossiers.length,
    convocatorias.length,
    systemAuditLogs.length,
    supplierEvaluations.length,
    filteredDirectorio.length,
    filteredMatriz.length,
    filteredSarlaft.length,
    filteredFinanzas.length,
    filteredConvocatorias.length,
    filteredAuditoria.length,
    filteredEvaluaciones.length,
  ]);

  // Active filters summary
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    switch (reportId) {
      case 'DIRECTORIO_MAESTRO':
        if (dirSearch) count++;
        if (dirStatus !== 'ALL') count++;
        if (dirContractual !== 'ALL') count++;
        if (dirType !== 'ALL') count++;
        if (dirTier !== 'ALL') count++;
        if (dirCategory !== 'ALL') count++;
        if (dirSarlaft !== 'ALL') count++;
        break;
      case 'MATRIZ_DOCUMENTAL':
        if (docSearch) count++;
        if (docComplianceRange !== 'ALL') count++;
        if (docStatus !== 'ALL') count++;
        if (docCategory !== 'ALL') count++;
        if (docMissingFilter !== 'ALL') count++;
        break;
      case 'SARLAFT':
        if (sarlSearch) count++;
        if (sarlConcept !== 'ALL') count++;
        if (sarlOfac !== 'ALL') count++;
        if (sarlProc !== 'ALL') count++;
        if (sarlFormStatus !== 'ALL') count++;
        if (sarlSupplierType !== 'ALL') count++;
        break;
      case 'CUENTAS_FINANZAS':
        if (finSearch) count++;
        if (finBank !== 'ALL') count++;
        if (finAccountType !== 'ALL') count++;
        if (finCertBankStatus !== 'ALL') count++;
        if (finTaxRegime !== 'ALL') count++;
        if (finGranContribuyente !== 'ALL') count++;
        if (finAutoRetenedor !== 'ALL') count++;
        break;
      case 'CONVOCATORIAS':
        if (convSearch) count++;
        if (convStatus !== 'ALL') count++;
        if (convCategory !== 'ALL') count++;
        if (convHasPosts !== 'ALL') count++;
        break;
      case 'AUDITORIA':
        if (auditSearch) count++;
        if (auditAction !== 'ALL') count++;
        if (auditSection !== 'ALL') count++;
        if (auditRole !== 'ALL') count++;
        break;
      case 'EVALUACIONES':
        if (evalSearch) count++;
        if (evalType !== 'ALL') count++;
        if (evalConcept !== 'ALL') count++;
        if (evalImprovementPlan !== 'ALL') count++;
        if (evalScoreRange !== 'ALL') count++;
        break;
    }
    return count;
  }, [
    reportId,
    dirSearch,
    dirStatus,
    dirContractual,
    dirType,
    dirTier,
    dirCategory,
    dirSarlaft,
    docSearch,
    docComplianceRange,
    docStatus,
    docCategory,
    docMissingFilter,
    sarlSearch,
    sarlConcept,
    sarlOfac,
    sarlProc,
    sarlFormStatus,
    sarlSupplierType,
    finSearch,
    finBank,
    finAccountType,
    finCertBankStatus,
    finTaxRegime,
    finGranContribuyente,
    finAutoRetenedor,
    convSearch,
    convStatus,
    convCategory,
    convHasPosts,
    auditSearch,
    auditAction,
    auditSection,
    auditRole,
    evalSearch,
    evalType,
    evalConcept,
    evalImprovementPlan,
    evalScoreRange,
  ]);

  // -------------------------------------------------------------
  // Excel Export Handler with Applied Filters
  // -------------------------------------------------------------
  const handleExportFilteredExcel = () => {
    const filterSummary =
      activeFiltersCount > 0
        ? `${filteredCount} registros seleccionados con ${activeFiltersCount} criterios activos`
        : 'Todos los registros (sin filtros adicionales)';

    switch (reportId) {
      case 'DIRECTORIO_MAESTRO':
        exportMasterSupplierDirectory(filteredDirectorio, filterSummary);
        showToast(`¡Directorio Maestro exportado en Excel con ${filteredCount} registros!`, 'success');
        break;
      case 'MATRIZ_DOCUMENTAL':
        exportDocumentComplianceReport(filteredMatriz, filterSummary);
        showToast(`¡Matriz Documental exportada en Excel con ${filteredCount} registros!`, 'success');
        break;
      case 'SARLAFT':
        exportSarlaftReport(filteredSarlaft, filterSummary);
        showToast(`¡Informe SARLAFT exportado en Excel con ${filteredCount} registros!`, 'success');
        break;
      case 'CUENTAS_FINANZAS':
        exportFinancialBankReport(filteredFinanzas, filterSummary);
        showToast(`¡Informe Financiero exportado en Excel con ${filteredCount} registros!`, 'success');
        break;
      case 'CONVOCATORIAS':
        exportConvocatoriasReport(filteredConvocatorias, dossiers, filterSummary);
        showToast(`¡Informe de Convocatorias exportado con ${filteredCount} procesos!`, 'success');
        break;
      case 'AUDITORIA':
        exportAuditLogsReport(filteredAuditoria, filterSummary);
        showToast(`¡Libro de Auditoría exportado con ${filteredCount} eventos!`, 'success');
        break;
      case 'EVALUACIONES':
        exportEvaluationsReport(filteredEvaluaciones, filterSummary);
        showToast(`¡Evaluaciones de Calidad exportadas con ${filteredCount} registros!`, 'success');
        break;
    }
  };

  const handleExportAllWithoutFilters = () => {
    switch (reportId) {
      case 'DIRECTORIO_MAESTRO':
        exportMasterSupplierDirectory(dossiers, 'Exportación completa sin filtros');
        break;
      case 'MATRIZ_DOCUMENTAL':
        exportDocumentComplianceReport(dossiers, 'Exportación completa sin filtros');
        break;
      case 'SARLAFT':
        exportSarlaftReport(dossiers, 'Exportación completa sin filtros');
        break;
      case 'CUENTAS_FINANZAS':
        exportFinancialBankReport(dossiers, 'Exportación completa sin filtros');
        break;
      case 'CONVOCATORIAS':
        exportConvocatoriasReport(convocatorias, dossiers, 'Exportación completa sin filtros');
        break;
      case 'AUDITORIA':
        exportAuditLogsReport(systemAuditLogs, 'Exportación completa sin filtros');
        break;
      case 'EVALUACIONES':
        exportEvaluationsReport(supplierEvaluations, 'Exportación completa sin filtros');
        break;
    }
    showToast('¡Informe completo descargado exitosamente!', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5 animate-in fade-in">
      {/* 1. Breadcrumbs & Report Navigator Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0f172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Catálogo</span>
          </button>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Filtrado y Emisión Oficial
          </span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
            {meta.title}
          </span>
        </div>

        {/* Quick Report Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
            Cambiar Informe:
          </span>
          <select
            value={reportId}
            onChange={(e) => onSelectReport(e.target.value as OfficialReportId)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(OFFICIAL_REPORTS_METADATA).map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Report Header Information Card - Estandarizado Claro */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 text-slate-900 border border-slate-200 shadow-xs relative overflow-hidden dark:bg-[#0b1329] dark:text-white dark:border-blue-900/60">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-500/20 dark:text-cyan-300 dark:border-blue-400/30 tracking-wider">
                {meta.normativeCode}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-white/10 dark:text-slate-200 dark:border-white/10">
                Formato Institucional Excel (.xlsx)
              </span>
            </div>
            <h2 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2 sm:gap-2.5 leading-snug">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 dark:bg-white/10 dark:text-cyan-300 dark:border-white/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="break-words">{meta.title}</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              {meta.description}
            </p>
          </div>

          {/* Real-time counters block */}
          <div className="flex items-center justify-around sm:justify-start gap-3 bg-slate-50 dark:bg-slate-900/80 p-2.5 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 self-stretch sm:self-start xl:self-center">
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                Total Base
              </span>
              <span className="text-base sm:text-lg lg:text-xl font-black text-slate-900 dark:text-white">{totalCount}</span>
            </div>
            <div className="w-px h-7 sm:h-8 bg-slate-200 dark:bg-slate-700" />
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-cyan-400 tracking-wider block">
                Filtrados
              </span>
              <span className="text-base sm:text-lg lg:text-xl font-black text-blue-700 dark:text-cyan-300">{filteredCount}</span>
            </div>
            <div className="w-px h-7 sm:h-8 bg-slate-200 dark:bg-slate-700" />
            <div className="text-center px-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                Proporción
              </span>
              <span className="text-sm sm:text-base font-black text-slate-800 dark:text-blue-200">
                {Math.round((filteredCount / (totalCount || 1)) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Specialized Filter Panel */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-black text-slate-900 dark:text-white">
              Criterios de Filtrado Específicos para este Informe
            </span>
            {activeFiltersCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {activeFiltersCount} activo{activeFiltersCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer Filtros</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Controls depending on Report */}
        {reportId === 'DIRECTORIO_MAESTRO' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Búsqueda General
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Razón social, NIT, radicado, ciudad..."
                  value={dirSearch}
                  onChange={(e) => setDirSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Estado del Expediente Proveedor
              </label>
              <select
                value={dirStatus}
                onChange={(e) => setDirStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos los Estados ({dossiers.length})</option>
                <option value="PROVEEDOR_HABILITADO">Habilitado Operativamente</option>
                <option value="APROBADO">Aprobado</option>
                <option value="EN_REVISION">En Revisión</option>
                <option value="CORREGIDO_EN_REVISION">Corregido en Revisión</option>
                <option value="REQUIERE_CORRECCION">Requiere Corrección</option>
                <option value="DOCUMENTACION_PENDIENTE">Documentación Pendiente</option>
                <option value="SUSPENDIDO">Suspendido</option>
                <option value="RECHAZADO">Rechazado</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Estado Contractual (Contratos)
              </label>
              <select
                value={dirContractual}
                onChange={(e) => setDirContractual(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos los Estados Contractuales</option>
                <option value="VIGENTE">Contrato Vigente (Activo)</option>
                <option value="POR_VENCER">Por Vencer (&le; 30 días)</option>
                <option value="VENCIDO">Contrato Vencido</option>
                <option value="SIN_CONTRATO">Sin Contrato Formal</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Tipo de Persona
              </label>
              <select
                value={dirType}
                onChange={(e) => setDirType(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todas las Personas</option>
                <option value="JURIDICA">Persona Jurídica</option>
                <option value="NATURAL">Persona Natural</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Clasificación Proveedor (A/B/C)
              </label>
              <select
                value={dirTier}
                onChange={(e) => setDirTier(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos los Tipos</option>
                <option value="A">Tipo A - Crítico / Estratégico</option>
                <option value="B">Tipo B - Operativo</option>
                <option value="C">Tipo C - Estándar</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Categoría de Suministro
              </label>
              <select
                value={dirCategory}
                onChange={(e) => setDirCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todas las Categorías</option>
                {categoriesConfig.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Concepto SARLAFT
              </label>
              <select
                value={dirSarlaft}
                onChange={(e) => setDirSarlaft(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos los Conceptos</option>
                <option value="SIN_COINCIDENCIAS">Sin Coincidencias (Limpio)</option>
                <option value="REQUIERE_VERIFICACION">Requiere Verificación</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>
            </div>
          </div>
        )}

        {reportId === 'MATRIZ_DOCUMENTAL' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Búsqueda Proveedor
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Nombre, NIT, expediente..."
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Rango % Cumplimiento
              </label>
              <select
                value={docComplianceRange}
                onChange={(e) => setDocComplianceRange(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos los Rangos</option>
                <option value="100">100% Completo (Conforme SIG)</option>
                <option value="70_99">70% a 99% (Avanzado)</option>
                <option value="40_69">40% a 69% (En Proceso)</option>
                <option value="UNDER_40">Menor al 40% (Crítico)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Estado del Expediente
              </label>
              <select
                value={docStatus}
                onChange={(e) => setDocStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="PROVEEDOR_HABILITADO">Habilitado Operativamente</option>
                <option value="EN_REVISION">En Revisión Técnica</option>
                <option value="REQUIERE_CORRECCION">Requiere Corrección</option>
                <option value="DOCUMENTACION_PENDIENTE">Documentación Pendiente</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Categoría
              </label>
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todas las Categorías</option>
                {categoriesConfig.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Requisito Específico Pendiente
              </label>
              <select
                value={docMissingFilter}
                onChange={(e) => setDocMissingFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Cualquier Estado Documental</option>
                <option value="RUT">Solo con RUT Pendiente/Observado</option>
                <option value="CAMARA_COMERCIO">Solo con Cámara Comercio Pendiente</option>
                <option value="CERTIFICACION_BANCARIA">Solo con Cert. Bancaria Pendiente</option>
                <option value="SEGURIDAD_SOCIAL">Solo con Seguridad Social Pendiente</option>
                <option value="FS_GA_FOR_009">Solo con Formato 009 Pendiente</option>
                <option value="DECLARACION_SARLAFT">Solo con Declaración SARLAFT Pendiente</option>
              </select>
            </div>
          </div>
        )}

        {reportId === 'SARLAFT' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Búsqueda Proveedor / Rep.
              </label>
              <input
                type="text"
                placeholder="Nombre, NIT, representante..."
                value={sarlSearch}
                onChange={(e) => setSarlSearch(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Concepto SARLAFT General
              </label>
              <select
                value={sarlConcept}
                onChange={(e) => setSarlConcept(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos los Conceptos</option>
                <option value="SIN_COINCIDENCIAS">Sin Coincidencias (Favorable)</option>
                <option value="REQUIERE_VERIFICACION">Requiere Verificación</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Listas OFAC / Clinton / ONU
              </label>
              <select
                value={sarlOfac}
                onChange={(e) => setSarlOfac(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todas las Listas</option>
                <option value="SIN_COINCIDENCIAS">Sin Coincidencias</option>
                <option value="REQUIERE_VERIFICACION">Con Alerta / Observado</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Procuraduría / Policía
              </label>
              <select
                value={sarlProc}
                onChange={(e) => setSarlProc(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos los Antecedentes</option>
                <option value="SIN_COINCIDENCIAS">Sin Antecedentes</option>
                <option value="REQUIERE_VERIFICACION">Con Registro / Novedad</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Formato SARLAFT Adjunto
              </label>
              <select
                value={sarlFormStatus}
                onChange={(e) => setSarlFormStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="APROBADO">Aprobado / Validado</option>
                <option value="PENDIENTE">Pendiente Revisión</option>
                <option value="NO_CARGADO">No Cargado</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Tipo Persona
              </label>
              <select
                value={sarlSupplierType}
                onChange={(e) => setSarlSupplierType(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todas</option>
                <option value="JURIDICA">Persona Jurídica</option>
                <option value="NATURAL">Persona Natural</option>
              </select>
            </div>
          </div>
        )}

        {reportId === 'CUENTAS_FINANZAS' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Búsqueda Cuenta / NIT
              </label>
              <input
                type="text"
                placeholder="Razón social, cuenta..."
                value={finSearch}
                onChange={(e) => setFinSearch(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Entidad Bancaria
              </label>
              <select
                value={finBank}
                onChange={(e) => setFinBank(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos los Bancos</option>
                <option value="Bancolombia">Bancolombia</option>
                <option value="Davivienda">Davivienda</option>
                <option value="Bogotá">Banco de Bogotá</option>
                <option value="BBVA">BBVA</option>
                <option value="Agrario">Banco Agrario</option>
                <option value="Occidente">Banco de Occidente</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Tipo de Cuenta
              </label>
              <select
                value={finAccountType}
                onChange={(e) => setFinAccountType(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos los Tipos</option>
                <option value="Ahorros">Cuenta de Ahorros</option>
                <option value="Corriente">Cuenta Corriente</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Certificación Bancaria
              </label>
              <select
                value={finCertBankStatus}
                onChange={(e) => setFinCertBankStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todas</option>
                <option value="VALIDADA">Validada / Aprobada</option>
                <option value="PENDIENTE">Pendiente / Sin Validar</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Régimen Fiscal
              </label>
              <select
                value={finTaxRegime}
                onChange={(e) => setFinTaxRegime(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos</option>
                <option value="Ordinario">Régimen Ordinario / Común</option>
                <option value="Simple">Régimen Simple (RST)</option>
                <option value="No responsable">No Responsable de IVA</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Gran Contribuyente
              </label>
              <select
                value={finGranContribuyente}
                onChange={(e) => setFinGranContribuyente(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos</option>
                <option value="SI">Solo Gran Contribuyente</option>
                <option value="NO">No Gran Contribuyente</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Autorretenedor
              </label>
              <select
                value={finAutoRetenedor}
                onChange={(e) => setFinAutoRetenedor(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos</option>
                <option value="SI">Solo Autorretenedores</option>
                <option value="NO">No Autorretenedores</option>
              </select>
            </div>
          </div>
        )}

        {reportId === 'CONVOCATORIAS' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Búsqueda de Proceso
              </label>
              <input
                type="text"
                placeholder="Código, título, objeto..."
                value={convSearch}
                onChange={(e) => setConvSearch(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Estado Convocatoria
              </label>
              <select
                value={convStatus}
                onChange={(e) => setConvStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="PUBLICADA">Publicada / Abierta</option>
                <option value="EN_EVALUACION">En Evaluación Técnica</option>
                <option value="ADJUDICADA">Adjudicada</option>
                <option value="CERRADA">Cerrada</option>
                <option value="DESIERTA">Desierta</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Categoría
              </label>
              <select
                value={convCategory}
                onChange={(e) => setConvCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todas las Categorías</option>
                {categoriesConfig.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Postulaciones Registradas
              </label>
              <select
                value={convHasPosts}
                onChange={(e) => setConvHasPosts(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todas</option>
                <option value="WITH_POSTS">Con Postulaciones (&ge; 1 oferta)</option>
                <option value="NO_POSTS">Sin Postulaciones (0 ofertas)</option>
              </select>
            </div>
          </div>
        )}

        {reportId === 'AUDITORIA' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Búsqueda en Eventos
              </label>
              <input
                type="text"
                placeholder="Usuario, proveedor, detalle..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Tipo de Acción Auditada
              </label>
              <select
                value={auditAction}
                onChange={(e) => setAuditAction(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todas las Acciones</option>
                {auditDistinctActions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Sección / Módulo
              </label>
              <select
                value={auditSection}
                onChange={(e) => setAuditSection(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todas las Secciones</option>
                {auditDistinctSections.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Rol Responsable
              </label>
              <select
                value={auditRole}
                onChange={(e) => setAuditRole(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos los Roles</option>
                <option value="ADMIN">Administrador</option>
                <option value="REVIEWER">Revisor SIG</option>
                <option value="COMPLIANCE">Oficial de Cumplimiento</option>
              </select>
            </div>
          </div>
        )}

        {reportId === 'EVALUACIONES' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Búsqueda Proveedor / Evaluador
              </label>
              <input
                type="text"
                placeholder="Nombre, NIT, evaluador..."
                value={evalSearch}
                onChange={(e) => setEvalSearch(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Tipo de Evaluación
              </label>
              <select
                value={evalType}
                onChange={(e) => setEvalType(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos los Tipos</option>
                <option value="INICIAL">Inicial de Homologación</option>
                <option value="ANUAL_1_ANO">Anual Periódica</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Concepto Técnico SIG
              </label>
              <select
                value={evalConcept}
                onChange={(e) => setEvalConcept(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos los Conceptos</option>
                <option value="SOBRESALIENTE">Sobresaliente (&ge; 85)</option>
                <option value="CONFORME">Conforme (70 a 84)</option>
                <option value="CONDICIONAL">Condicional (60 a 69)</option>
                <option value="NO_CONFORME">No Conforme (&lt; 60)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Plan de Mejora
              </label>
              <select
                value={evalImprovementPlan}
                onChange={(e) => setEvalImprovementPlan(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Todos</option>
                <option value="YES">Con Plan de Mejora Requerido</option>
                <option value="NO">Sin Plan de Mejora</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Rango de Calificación
              </label>
              <select
                value={evalScoreRange}
                onChange={(e) => setEvalScoreRange(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="ALL">Cualquier Calificación</option>
                <option value="90_100">90 - 100 Puntos</option>
                <option value="70_89">70 - 89 Puntos</option>
                <option value="60_69">60 - 69 Puntos</option>
                <option value="UNDER_60">Menos de 60 Puntos</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 4. Action Toolbar & Download Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200">
            {filteredCount} {filteredCount === 1 ? 'registro listo' : 'registros listos'} para exportar
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Formato: <strong>Libro Oficial Excel (.xlsx)</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportAllWithoutFilters}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Descargar Todo ({totalCount})</span>
          </button>

          <button
            type="button"
            onClick={handleExportFilteredExcel}
            disabled={filteredCount === 0}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 text-white text-xs font-black flex items-center gap-2 transition-all shadow-md shadow-blue-900/20 cursor-pointer disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 text-cyan-200" />
            <span>Generar y Descargar Excel ({filteredCount} Filtrados)</span>
          </button>
        </div>
      </div>

      {/* 5. Live Data Preview Table */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <span>Previsualización de Datos en Tiempo Real ({filteredCount} Registros)</span>
          </h4>
          <span className="text-[11px] text-slate-400">
            Mostrando primeros registros según filtros activos
          </span>
        </div>

        {filteredCount === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No se encontraron registros que coincidan con los filtros aplicados.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Intenta relajar los criterios de búsqueda o haz clic en restablecer filtros para volver a ver la base de datos completa.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div>
            <div className="sm:hidden px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/40 border border-b-0 border-slate-200 dark:border-slate-800 rounded-t-xl text-[10px] text-blue-900 dark:text-cyan-300 flex items-center justify-between font-medium">
              <span>Desliza horizontalmente para ver todas las columnas</span>
              <span className="font-bold">↔</span>
            </div>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-b-xl sm:rounded-t-xl">
            {reportId === 'DIRECTORIO_MAESTRO' && (
              <table className="w-full text-[11px] text-left border-collapse min-w-[760px] lg:min-w-full">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-2.5">No. Expediente</th>
                    <th className="p-2.5">Razón Social / Nombre</th>
                    <th className="p-2.5">NIT / Cédula</th>
                    <th className="p-2.5">Tipo Persona</th>
                    <th className="p-2.5">Tipo (A/B/C)</th>
                    <th className="p-2.5">Ciudad</th>
                    <th className="p-2.5">Categoría</th>
                    <th className="p-2.5">Estado Proveedor</th>
                    <th className="p-2.5">Estado Contrato</th>
                    <th className="p-2.5">SARLAFT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredDirectorio.slice(0, 10).map((d) => {
                    const isNat = d.basicInfo?.supplierType === 'NATURAL';
                    const name = isNat ? d.basicInfo?.fullName : d.basicInfo?.companyName;
                    const doc = isNat ? d.basicInfo?.documentNumber : d.basicInfo?.nit;
                    const tier = d.supplierTier || d.basicInfo?.supplierTier || 'B';
                    const cStat = getContractualStatus(d);

                    return (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold text-blue-700 dark:text-cyan-400">
                          {d.fileNumber}
                        </td>
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
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cStat.badgeClass}`}>
                            {cStat.label}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              d.internalConcepts?.sarlatfCheck?.result === 'SIN_COINCIDENCIAS'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {d.internalConcepts?.sarlatfCheck?.result || 'PENDIENTE'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {reportId === 'MATRIZ_DOCUMENTAL' && (
              <table className="w-full text-[11px] text-left border-collapse min-w-[760px] lg:min-w-full">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-2.5">Expediente</th>
                    <th className="p-2.5">Proveedor</th>
                    <th className="p-2.5">RUT</th>
                    <th className="p-2.5">Cámara Comercio</th>
                    <th className="p-2.5">Cert. Bancaria</th>
                    <th className="p-2.5">Seg. Social / ARL</th>
                    <th className="p-2.5">FS.GA-FOR-009</th>
                    <th className="p-2.5">FS.GA-FOR-039</th>
                    <th className="p-2.5">% Avance SIG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredMatriz.slice(0, 10).map((d) => {
                    const isNat = d.basicInfo?.supplierType === 'NATURAL';
                    const name = isNat ? d.basicInfo?.fullName : d.basicInfo?.companyName;
                    const docs = Object.values(d.documents || {});
                    const req = docs.filter((x) => x.isRequired !== false);
                    const app = req.filter((x) => x.status === 'APROBADO');
                    const pct = Math.round((app.length / (req.length || 1)) * 100);

                    const getDocBadge = (key: string) => {
                      const st = (d.documents as any)?.[key]?.status || 'PENDIENTE';
                      return (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            st === 'APROBADO'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : st === 'EN_REVISION'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {st === 'APROBADO' ? '✓ OK' : st === 'EN_REVISION' ? 'EN REV.' : 'FALTA'}
                        </span>
                      );
                    };

                    return (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold text-blue-700 dark:text-cyan-400">{d.fileNumber}</td>
                        <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">{name}</td>
                        <td className="p-2.5">{getDocBadge('RUT')}</td>
                        <td className="p-2.5">{getDocBadge('CAMARA_COMERCIO')}</td>
                        <td className="p-2.5">{getDocBadge('CERTIFICACION_BANCARIA')}</td>
                        <td className="p-2.5">{getDocBadge('SEGURIDAD_SOCIAL')}</td>
                        <td className="p-2.5">{getDocBadge('FS_GA_FOR_009')}</td>
                        <td className="p-2.5">{getDocBadge('FS_GA_FOR_039')}</td>
                        <td className="p-2.5 font-black">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  pct === 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {reportId === 'SARLAFT' && (
              <table className="w-full text-[11px] text-left border-collapse min-w-[760px] lg:min-w-full">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-2.5">Expediente</th>
                    <th className="p-2.5">Proveedor / Razón Social</th>
                    <th className="p-2.5">NIT / Cédula</th>
                    <th className="p-2.5">Rep. Legal</th>
                    <th className="p-2.5">Concepto SARLAFT</th>
                    <th className="p-2.5">Listas OFAC</th>
                    <th className="p-2.5">Procuraduría</th>
                    <th className="p-2.5">Declaración Fondos</th>
                    <th className="p-2.5">Fecha Verificación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredSarlaft.slice(0, 10).map((d) => {
                    const isNat = d.basicInfo?.supplierType === 'NATURAL';
                    const name = isNat ? d.basicInfo?.fullName : d.basicInfo?.companyName;
                    const doc = isNat ? d.basicInfo?.documentNumber : d.basicInfo?.nit;
                    const sarl = d.internalConcepts?.sarlatfCheck;
                    const ofac = d.internalConcepts?.ofacCheck;
                    const proc = d.internalConcepts?.procuraduriaPoliciaCheck;

                    return (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold text-blue-700 dark:text-cyan-400">{d.fileNumber}</td>
                        <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">{name}</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">{doc}</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">
                          {isNat ? 'N/A' : d.basicInfo?.representativeLegalName || 'No Registrado'}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sarl?.result === 'SIN_COINCIDENCIAS'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {sarl?.result || 'PENDIENTE'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">{ofac?.result || 'PENDIENTE'}</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">{proc?.result || 'PENDIENTE'}</td>
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                            {d.documents?.DECLARACION_SARLAFT?.status || 'PENDIENTE'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-500 dark:text-slate-400">
                          {sarl?.checkedAt ? sarl.checkedAt.split('T')[0] : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {reportId === 'CUENTAS_FINANZAS' && (
              <table className="w-full text-[11px] text-left border-collapse min-w-[760px] lg:min-w-full">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-2.5">Expediente</th>
                    <th className="p-2.5">Razón Social</th>
                    <th className="p-2.5">NIT</th>
                    <th className="p-2.5">Banco Receptor</th>
                    <th className="p-2.5">Tipo Cuenta</th>
                    <th className="p-2.5">No. Cuenta</th>
                    <th className="p-2.5">Certificación</th>
                    <th className="p-2.5">Régimen</th>
                    <th className="p-2.5">Gran Contribuyente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredFinanzas.slice(0, 10).map((d) => {
                    const isNat = d.basicInfo?.supplierType === 'NATURAL';
                    const name = isNat ? d.basicInfo?.fullName : d.basicInfo?.companyName;
                    const doc = isNat ? d.basicInfo?.documentNumber : d.basicInfo?.nit;
                    const bank = d.basicInfo?.bankInfo;
                    const tax = d.basicInfo?.taxInfo;
                    const certValid = d.documents?.CERTIFICACION_BANCARIA?.status === 'APROBADO';

                    return (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold text-blue-700 dark:text-cyan-400">{d.fileNumber}</td>
                        <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">{name}</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">{doc}</td>
                        <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                          {bank?.bankName || 'Bancolombia S.A.'}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">{bank?.accountType || 'Ahorros'}</td>
                        <td className="p-2.5 font-mono text-slate-700 dark:text-slate-300">
                          {bank?.accountNumber || 'N/A'}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              certValid
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {certValid ? 'VALIDADA' : 'PENDIENTE'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">{tax?.taxRegime || 'Ordinario'}</td>
                        <td className="p-2.5 font-bold">
                          {tax?.isGranContribuyente ? (
                            <span className="text-purple-600 dark:text-purple-400">SÍ</span>
                          ) : (
                            <span className="text-slate-400">NO</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {reportId === 'CONVOCATORIAS' && (
              <table className="w-full text-[11px] text-left border-collapse min-w-[760px] lg:min-w-full">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-2.5">Código Radicado</th>
                    <th className="p-2.5">Título del Proceso</th>
                    <th className="p-2.5">Categoría</th>
                    <th className="p-2.5">Estado</th>
                    <th className="p-2.5">Presupuesto Referencial</th>
                    <th className="p-2.5">Fecha Publicación</th>
                    <th className="p-2.5">Cierre</th>
                    <th className="p-2.5">Postulaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredConvocatorias.slice(0, 10).map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 font-bold text-cyan-700 dark:text-cyan-400">{c.code}</td>
                      <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">{c.title}</td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">{c.category}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300">
                          {c.status}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-slate-800 dark:text-slate-200">
                        ${(c.budgetEstimateCOP || 0).toLocaleString('es-CO')} COP
                      </td>
                      <td className="p-2.5 text-slate-500 dark:text-slate-400">{c.publishedDate}</td>
                      <td className="p-2.5 text-slate-500 dark:text-slate-400">{c.closingDate}</td>
                      <td className="p-2.5 font-bold text-blue-600 dark:text-blue-400">
                        {c.postulaciones?.length || 0} proponentes
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportId === 'AUDITORIA' && (
              <table className="w-full text-[11px] text-left border-collapse min-w-[760px] lg:min-w-full">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-2.5">Fecha y Hora</th>
                    <th className="p-2.5">Usuario</th>
                    <th className="p-2.5">Rol</th>
                    <th className="p-2.5">Acción</th>
                    <th className="p-2.5">Módulo / Sección</th>
                    <th className="p-2.5">Expediente / Proveedor</th>
                    <th className="p-2.5">Valor Anterior</th>
                    <th className="p-2.5">Nuevo Valor</th>
                    <th className="p-2.5">Justificación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredAuditoria.slice(0, 10).map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {l.formattedDate || l.timestamp}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{l.user}</td>
                      <td className="p-2.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800">
                          {l.userRole}
                        </span>
                      </td>
                      <td className="p-2.5 font-semibold text-blue-600 dark:text-blue-400">{l.action}</td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">{l.section}</td>
                      <td className="p-2.5 text-slate-800 dark:text-slate-200">
                        {l.supplierName || l.fileNumber || 'Sistema'}
                      </td>
                      <td className="p-2.5 text-slate-500 dark:text-slate-400 line-through text-[10px]">
                        {l.oldValue || '-'}
                      </td>
                      <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400 text-[10px]">
                        {l.newValue || '-'}
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {l.justification || 'Operación autorizada'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportId === 'EVALUACIONES' && (
              <table className="w-full text-[11px] text-left border-collapse min-w-[760px] lg:min-w-full">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-2.5">Expediente</th>
                    <th className="p-2.5">Proveedor</th>
                    <th className="p-2.5">NIT</th>
                    <th className="p-2.5">Tipo Evaluación</th>
                    <th className="p-2.5">Puntaje (0-100)</th>
                    <th className="p-2.5">Concepto SIG</th>
                    <th className="p-2.5">Evaluador</th>
                    <th className="p-2.5">Plan de Mejora</th>
                    <th className="p-2.5">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredEvaluaciones.slice(0, 10).map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 font-bold text-purple-700 dark:text-purple-400">{ev.fileNumber}</td>
                      <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">{ev.supplierName}</td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">{ev.supplierDoc}</td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">
                        {ev.evaluationType === 'INICIAL' ? 'Inicial' : 'Anual Periódica'}
                      </td>
                      <td className="p-2.5 font-black text-sm text-slate-900 dark:text-slate-100">
                        {ev.totalScore} / 100
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            ev.concept === 'SOBRESALIENTE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : ev.concept === 'CONFORME'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : ev.concept === 'CONDICIONAL_MEJORA'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {ev.concept === 'CONDICIONAL_MEJORA' ? 'CONDICIONAL' : ev.concept}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">{ev.evaluatorName}</td>
                      <td className="p-2.5">
                        {ev.hasImprovementPlan ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            REQUERIDO
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            NO APLICA
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-slate-500 dark:text-slate-400">{ev.evaluationDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          </div>
        )}

        {filteredCount > 10 && (
          <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 pt-2">
            Mostrando los primeros 10 registros en pantalla. Al presionar <strong>"Generar y Descargar Excel"</strong> se incluirán la totalidad de los <strong>{filteredCount} registros</strong> filtrados.
          </p>
        )}
      </div>
    </div>
  );
};
