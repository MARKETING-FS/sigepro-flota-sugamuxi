import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowLeft,
  ArrowRight,
  Search,
  Save,
  FileSpreadsheet,
  Users,
  Lock,
  Calendar,
  Check,
  Award,
  Flame,
  ShieldAlert,
  UserCheck,
  Wrench,
  Fuel,
  HardHat,
  Laptop,
  Truck,
  Info,
  BadgeCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { SupplierType, SupplierTier, ProcessStatus, AdminCreateSupplierInput } from '../types';
import { FlotaSugamuxiLogo } from './FlotaSugamuxiLogo';
import { PageHeader, rowPrimaryBtn } from './ui/archive';
import { storageService } from '../services/storageService';
import { supabaseService } from '../services/supabaseService';
import { SarlaftUpload } from './supplier/SarlaftUpload';
import { ChoiceCard, Field, FormSection, IconInput, StepBar, fieldCls, fieldWithIconCls, selectFieldCls, textareaCls } from './supplier/formParts';
import { useSupplierFormValidation } from './supplier/useSupplierFormValidation';
import { ExistingSupplierRef, SupplierFormValues, fieldsOfStep, normalizeSupplierValues } from '../utils/supplierFieldRules';

const getCategoryIcon = (categoryName: string) => {
  const lower = categoryName.toLowerCase();
  if (lower.includes('automotriz') || lower.includes('repuesto')) return Wrench;
  if (lower.includes('combustible') || lower.includes('lubricante')) return Fuel;
  if (lower.includes('dotaci') || lower.includes('epp') || lower.includes('seguridad')) return HardHat;
  if (lower.includes('profesional') || lower.includes('consultor') || lower.includes('asesor')) return FileText;
  if (lower.includes('oficina') || lower.includes('tecnolog') || lower.includes('infraestructura')) return Laptop;
  if (lower.includes('transporte') || lower.includes('logístic') || lower.includes('grúa')) return Truck;
  return Briefcase;
};

export const AdminRegisterSupplierView: React.FC = () => {
  const {
    role,
    categoriesConfig,
    systemParameters,
    createSupplierAdmin,
    setActiveView,
    setCurrentDossierId,
    showToast,
    systemUsers,
    activeUserId,
    activeUser,
    accountRole,
    allDossiers,
  } = useApp();

  // Solo el superadministrador asigna evaluador; los demás roles quedan como responsables de lo que crean
  const isSuper = accountRole === 'SUPERADMIN';
  const [realUsers, setRealUsers] = useState<
    Array<{ id: string; name: string; email: string; roleLabel: string; isRevisor: boolean }>
  >([]);


  const [currentStep, setCurrentStep] = useState<number>(1);
  const [supplierType, setSupplierType] = useState<SupplierType>('JURIDICA');
  const [supplierTier, setSupplierTier] = useState<SupplierTier>('A');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categoriesConfig[0]?.category || 'Mantenimiento Automotriz y Repuestos'
  );
  // Vacío = sin administrador asignado (se asigna después desde el expediente)
  const [assignedReviewerId, setAssignedReviewerId] = useState<string>('');

  // Evaluadores reales: los usuarios registrados en la base de datos
  useEffect(() => {
    if (!isSuper || !supabase) return;
    let cancelled = false;
    (async () => {
      const { data: sess } = await supabase!.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) return;
      try {
        const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const json = await res.json();
        // Solo los administradores: el superadministrador no se asigna a sí mismo
        const list = (json.users || []).filter((u: { role: string }) => u.role === 'ADMINISTRADOR').map((u: { id: string; name: string; email: string; role: string }) => ({
          id: u.id,
          name: u.name || u.email,
          email: u.email,
          isRevisor: u.role === 'USUARIO' || u.role === 'REVISOR',
          roleLabel:
            u.role === 'SUPERADMIN' || u.role === 'ADMIN'
              ? 'Superadministrador'
              : u.role === 'ADMINISTRADOR'
              ? 'Administrador'
              : 'Usuario',
        }));
        if (cancelled) return;
        setRealUsers(list);
      } catch {
        /* sin conexión: se conserva la asignación por defecto */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSuper]);

  // Estado inicial fijo y correo siempre verificado: ya no se piden en el formulario
  const isEmailVerified = true;

  // Form Fields
  const [formData, setFormData] = useState({
    // Common
    email: '',
    phone: '',
    city: 'Sogamoso, Boyacá',
    address: 'Zona Industrial Lote 4, Sogamoso',
    economicActivity: '',

    // Natural
    fullName: '',
    documentType: 'CC' as 'CC' | 'CE' | 'PASAPORTE',
    documentNumber: '',
    professionOrTrade: 'Ingeniero Mecánico / Técnico Especialista',

    // Jurídica
    companyName: '',
    nit: '',
    representativeLegalName: '',
    representativeLegalDocType: 'CC' as 'CC' | 'CE' | 'PASAPORTE',
    representativeLegalDocNumber: '',

    // Internal notes
    notes: 'Proveedor homologado por trayectoria comercial e idoneidad técnica con Flota Sugamuxi S.A.',
  });

  // Consulta SARLAFT: PDF subido y aprobado por quien registra
  const [sarlaftFile, setSarlaftFile] = useState<File | null>(null);
  const [sarlaftApproved, setSarlaftApproved] = useState(false);
  const [sarlaftError, setSarlaftError] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validación campo por campo, en tiempo real
  const setFieldValue = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage('');
  }, []);
  const existingSuppliers = useMemo<ExistingSupplierRef[]>(
    () =>
      (allDossiers || []).map((d) => ({
        fileNumber: d.fileNumber,
        name: d.basicInfo.companyName || d.basicInfo.fullName || '',
        document: (d.supplierType === 'JURIDICA' ? d.basicInfo.nit : d.basicInfo.documentNumber) || '',
        email: d.basicInfo.email || '',
      })),
    [allDossiers]
  );
  const v = useSupplierFormValidation({
    values: formData as SupplierFormValues,
    setValue: setFieldValue,
    supplierType,
    existing: existingSuppliers,
  });
  const { fieldProps, invalidCls, fieldError } = v;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const handleFillDemoJuridica = () => {
    setSupplierType('JURIDICA');
    setSupplierTier('A');
    setSelectedCategory('Combustibles y Lubricantes');
    setFormData({
      email: 'comercial@distribuidorasugamuxioil.com',
      phone: '(608) 770-4590 / 310 889 4411',
      city: 'Sogamoso, Boyacá',
      address: 'Carrera 11 No. 24-80, Sector El Cerrito',
      economicActivity: '',
      fullName: '',
      documentType: 'CC',
      documentNumber: '',
      professionOrTrade: '',
      companyName: 'Distribuidora de Combustibles & Lubricantes Sugamuxi Oil S.A.S.',
      nit: '900892410-8',
      representativeLegalName: 'Hernando Rojas Villamil',
      representativeLegalDocType: 'CC',
      representativeLegalDocNumber: '74312809',
      notes: 'Proveedor estratégico regional con convenio directo de suministro de combustible para terminal de Sogamoso y Duitama.',
    });
    showToast('Datos de demostración para Persona Jurídica cargados.', 'info', 'DEMO JURÍDICA');
  };

  const handleFillDemoNatural = () => {
    setSupplierType('NATURAL');
    setSupplierTier('B');
    setSelectedCategory('Servicios Profesionales y Consultoría');
    setFormData({
      email: 'claudia.patricia.hseq@gmail.com',
      phone: '313 456 7890',
      city: 'Duitama, Boyacá',
      address: 'Calle 16 # 14-22 Oficina 302',
      economicActivity: '',
      fullName: 'Dra. Claudia Patricia Becerra Silva',
      documentType: 'CC',
      documentNumber: '40045678',
      professionOrTrade: 'Especialista en Gerencia HSEQ y Auditoría Vial',
      companyName: '',
      nit: '',
      representativeLegalName: '',
      representativeLegalDocType: 'CC',
      representativeLegalDocNumber: '',
      notes: 'Alta administrativa para vinculación de auditora externa para plan estratégico de seguridad vial 2026.',
    });
    showToast('Datos de demostración para Persona Natural cargados.', 'info', 'DEMO NATURAL');
  };

  const isInitialMount = useRef(true);

  const scrollToTop = (smooth = true) => {
    window.scrollTo({ top: 0, left: 0, behavior: smooth ? 'smooth' : 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  };

  useEffect(() => {
    // Force scroll to top on mount when entering the Registrar Proveedor module
    scrollToTop(false);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // When changing steps, smoothly scroll to top
    scrollToTop(true);
  }, [currentStep]);

  /** Revisa un paso. Si hay errores marca las casillas en rojo, lleva a la primera y no deja avanzar */
  const validateStep = (step: number) => {
    if (step === 1 && !selectedCategory) {
      setErrorMessage('Seleccione una categoría de suministro o servicio.');
      scrollToTop(true);
      return false;
    }
    if (step >= 2) {
      const bad = v.checkStep(step);
      if (bad.length > 0) {
        const msg =
          bad.length === 1
            ? 'Hay 1 campo con error: está marcado en rojo.'
            : `Hay ${bad.length} campos con error: están marcados en rojo.`;
        setErrorMessage(msg);
        showToast(msg, 'error', 'Revise el formulario');
        return false;
      }
    }
    setErrorMessage('');
    return true;
  };

  const handleNextStep = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (validateStep(currentStep)) {
      setErrorMessage('');
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Strict guard: Never submit or redirect unless user has completed Step 4
    if (currentStep < 4) {
      handleNextStep(e);
      return;
    }

    if (!selectedCategory) {
      setCurrentStep(1);
      setErrorMessage('Seleccione una categoría de suministro o servicio.');
      return;
    }
    const badStep = v.firstStepWithErrors();
    if (badStep) {
      const fields = [2, 3, 4].flatMap((st) => fieldsOfStep(st, supplierType));
      const bad = v.checkFields(fields, false);
      const first = bad[0];
      const msg =
        bad.length === 1
          ? 'Hay 1 campo con error: está marcado en rojo.'
          : `Hay ${bad.length} campos con error: están marcados en rojo.`;
      setErrorMessage(msg);
      showToast(msg, 'error', 'Revise el formulario');
      if (badStep !== currentStep) setCurrentStep(badStep);
      window.setTimeout(() => v.focusField(first), badStep !== currentStep ? 450 : 80);
      return;
    }

    // El PDF del SARLAFT es obligatorio y debe estar aprobado
    if (!sarlaftFile || !sarlaftApproved) {
      const msg = !sarlaftFile
        ? 'Suba el PDF de la consulta SARLAFT para poder registrar al proveedor.'
        : 'Falta aprobar la consulta SARLAFT: revise el PDF y pulse «Aprobar».';
      setSarlaftError(msg);
      setErrorMessage(msg);
      showToast(msg, 'error', 'Falta el SARLAFT');
      document.querySelector<HTMLElement>('[data-field="sarlaft"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Guarda el PDF: en el almacén privado, o en el navegador si estamos en modo demostración
      let sarlaftUrl = '';
      if (supabaseService.isConfigured()) {
        const up = await storageService.uploadSupplierDocument({
          file: sarlaftFile,
          fileName: sarlaftFile.name,
          supplierId: `nuevo-${Date.now()}`,
          fileNumber: '',
          documentCode: 'CONSULTA_SARLAFT',
        });
        if (!up.success || !up.url) {
          const msg = `No se pudo guardar el PDF del SARLAFT${up.error ? `: ${up.error}` : ''}. Intente de nuevo.`;
          setSarlaftError(msg);
          setErrorMessage(msg);
          showToast(msg, 'error', 'Error al subir el PDF');
          return;
        }
        sarlaftUrl = up.url;
      } else {
        sarlaftUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('No se pudo leer el PDF.'));
          reader.readAsDataURL(sarlaftFile);
        });
      }
      const sizeLabel =
        sarlaftFile.size > 1024 * 1024
          ? `${(sarlaftFile.size / (1024 * 1024)).toFixed(2)} MB`
          : `${Math.max(1, Math.round(sarlaftFile.size / 1024))} KB`;

      const fd = normalizeSupplierValues(formData);
      const payload: AdminCreateSupplierInput = {
        basicInfo: {
          supplierType,
          supplierTier,
          email: fd.email.trim(),
          phone: fd.phone.trim() || '300 000 0000',
          city: fd.city.trim() || 'Sogamoso, Boyacá',
          address: fd.address.trim(),
          ...(supplierType === 'JURIDICA'
            ? {
                companyName: fd.companyName.trim(),
                nit: fd.nit.trim(),
                representativeLegalName: fd.representativeLegalName.trim(),
                representativeLegalDocType: fd.representativeLegalDocType,
                representativeLegalDocNumber: fd.representativeLegalDocNumber.trim(),
              }
            : {
                fullName: fd.fullName.trim(),
                documentType: fd.documentType,
                documentNumber: fd.documentNumber.trim(),
                professionOrTrade: fd.professionOrTrade.trim(),
              }),
        },
        selectedCategory,
        supplierTier,
        economicActivity: '',
        initialStatus: 'DOCUMENTACION_PENDIENTE',
        isEmailVerified,
        notes: fd.notes.trim(),
        createdByRole: role === 'ADMIN' ? 'ADMIN' : 'REVISOR',
        createdByName: activeUser.name || (role === 'ADMIN' ? 'Administrador General' : 'Revisor Técnico Evaluador'),
        assignedReviewerId: isSuper ? assignedReviewerId : activeUserId,
        assignedReviewerName: isSuper
          ? realUsers.find((u) => u.id === assignedReviewerId)?.name || undefined
          : activeUser.name,
        complianceChecks: {
          sarlaftResult: 'SIN_COINCIDENCIAS',
          sarlaftFile: { fileName: sarlaftFile.name, fileSize: sizeLabel, fileUrl: sarlaftUrl },
        },
      };

      const newDossier = createSupplierAdmin(payload);

      if (newDossier && newDossier.id) {
        setCurrentDossierId(newDossier.id);
        setActiveView('bancoProveedores');
      }
    } catch (err: any) {
      const msg = err?.message || 'Ocurrió un error al crear el proveedor.';
      setErrorMessage(msg);
      showToast(msg, 'error', 'Error al Crear Proveedor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, label: 'Clasificación', icon: Layers },
    { id: 2, label: 'Identificación', icon: Building2 },
    { id: 3, label: 'Contacto', icon: MapPin },
    { id: 4, label: 'SARLAFT y alta', icon: ShieldCheck },
  ];

  const tierOptions: Array<{ id: SupplierTier; title: string; tag: string; description: string }> = [
    { id: 'A', title: 'Tipo A · Crítico', tag: 'Control documental riguroso', description: 'Combustibles, llantas, mantenimiento mayor de chasises y motores, pólizas de seguros.' },
    { id: 'B', title: 'Tipo B · Importante', tag: 'Homologación periódica', description: 'Dotaciones EPP, monitoreo GPS, telecomunicaciones y software de despacho.' },
    { id: 'C', title: 'Tipo C · Estándar', tag: 'Requisitos simplificados', description: 'Papelería, útiles de oficina e insumos sin impacto directo en la operación.' },
  ];

  const categoryDescription = categoriesConfig.find((c) => c.category === selectedCategory)?.description;
  const docTypes = (systemParameters?.documentTypes || []).filter((d) => d.isActive);
  const DocTypeOptions = () => (
    <>
      {docTypes.map((doc) => (
        <option key={doc.code} value={doc.code}>
          {doc.name} ({doc.code})
        </option>
      ))}
    </>
  );

  return (
    <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 pb-10 pt-1 space-y-6">
      <PageHeader
        icon={ShieldCheck}
        title="Registrar proveedor"
        subtitle="Cuatro pasos para crear el expediente y asignarle su radicado"
      />

      <StepBar
        steps={steps}
        current={currentStep}
        onGo={(id) => {
          if (id < currentStep || validateStep(currentStep)) setCurrentStep(id);
        }}
      />

      {errorMessage && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-500/40 px-4 py-3.5 text-sm font-semibold text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-px" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (currentStep === 4) handleSubmit(e);
          else handleNextStep(e);
        }}
        className="space-y-6"
      >
        {/* PASO 1: tipo de proveedor, criticidad y categoría */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-up">
            <FormSection icon={Building2} title="¿Qué tipo de proveedor es?" subtitle="Define qué datos y documentos se le piden.">
              <div role="radiogroup" aria-label="Tipo de proveedor" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ChoiceCard
                  selected={supplierType === 'JURIDICA'}
                  onClick={() => setSupplierType('JURIDICA')}
                  icon={Building2}
                  title="Persona jurídica"
                  description="Empresas, S.A.S., Ltda. y consorcios con NIT."
                />
                <ChoiceCard
                  selected={supplierType === 'NATURAL'}
                  onClick={() => setSupplierType('NATURAL')}
                  icon={User}
                  title="Persona natural"
                  description="Independientes, profesionales y asesores con RUT."
                />
              </div>
            </FormSection>

            <FormSection icon={Award} title="Nivel de criticidad" subtitle="Según el Sistema Integrado de Gestión: define el rigor del proceso.">
              <div role="radiogroup" aria-label="Nivel de criticidad" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tierOptions.map((t) => (
                  <ChoiceCard key={t.id} selected={supplierTier === t.id} onClick={() => setSupplierTier(t.id)} title={t.title} tag={t.tag} description={t.description} />
                ))}
              </div>
            </FormSection>

            <div className={`grid grid-cols-1 ${isSuper ? 'lg:grid-cols-2' : ''} gap-6`}>
              <FormSection icon={Briefcase} title="Categoría" subtitle="Qué suministra o qué servicio presta.">
                <Field label="Categoría de suministro o servicio" required hint={categoryDescription}>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={selectFieldCls}>
                    {categoriesConfig.map((cat) => (
                      <option key={cat.id} value={cat.category}>
                        {cat.category}
                        {cat.economicCode ? ` (${cat.economicCode})` : ''}
                      </option>
                    ))}
                  </select>
                </Field>
              </FormSection>

              {isSuper && (
                <FormSection icon={UserCheck} title="Administrador a cargo" subtitle="Opcional: quién revisa este expediente.">
                  <Field
                    label="Administrador asignado"
                    hint={
                      realUsers.length === 0
                        ? 'Todavía no hay administradores creados. Se puede asignar después desde el expediente.'
                        : 'Si lo deja vacío, se lo asigna después desde el expediente.'
                    }
                  >
                    <select value={assignedReviewerId} onChange={(e) => setAssignedReviewerId(e.target.value)} className={selectFieldCls}>
                      <option value="">Sin administrador asignado</option>
                      {realUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.roleLabel})
                        </option>
                      ))}
                    </select>
                  </Field>
                </FormSection>
              )}
            </div>
          </div>
        )}

        {/* PASO 2: identificación */}
        {currentStep === 2 && (
          <div className="animate-fade-up">
            {supplierType === 'JURIDICA' ? (
              <FormSection icon={Building2} title="Datos de la empresa" subtitle="Tal como aparecen en el RUT y en el Certificado de Existencia.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field className="md:col-span-2" label="Razón social o nombre comercial" required error={fieldError('companyName')}>
                    <input {...fieldProps('companyName')} type="text" placeholder="Ej. Distribuidora Sugamuxi de Boyacá S.A.S." className={`${fieldCls} ${invalidCls('companyName')}`} />
                  </Field>

                  <Field label="NIT con dígito de verificación" required hint="Ej. 900892410-8" error={fieldError('nit')}>
                    <input {...fieldProps('nit')} type="text" placeholder="900892410-8" className={`${fieldCls} tabular-nums ${invalidCls('nit')}`} />
                  </Field>

                  <Field label="Nombre completo del representante legal" required error={fieldError('representativeLegalName')}>
                    <input {...fieldProps('representativeLegalName')} type="text" placeholder="Ej. Hernando Rojas Villamil" className={`${fieldCls} ${invalidCls('representativeLegalName')}`} />
                  </Field>

                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <Field label="Tipo de documento del representante">
                      <select name="representativeLegalDocType" value={formData.representativeLegalDocType} onChange={handleInputChange} className={selectFieldCls}>
                        <DocTypeOptions />
                      </select>
                    </Field>
                    <Field className="sm:col-span-2" label="Número de documento del representante" error={fieldError('representativeLegalDocNumber')}>
                      <input {...fieldProps('representativeLegalDocNumber')} type="text" placeholder="Ej. 74312809" className={`${fieldCls} tabular-nums ${invalidCls('representativeLegalDocNumber')}`} />
                    </Field>
                  </div>
                </div>
              </FormSection>
            ) : (
              <FormSection icon={User} title="Datos de la persona" subtitle="Tal como aparecen en su documento de identidad y en el RUT.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field className="md:col-span-2" label="Nombre completo" required error={fieldError('fullName')}>
                    <input {...fieldProps('fullName')} type="text" placeholder="Ej. Claudia Patricia Becerra Silva" className={`${fieldCls} ${invalidCls('fullName')}`} />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:col-span-2">
                    <Field label="Tipo de documento">
                      <select name="documentType" value={formData.documentType} onChange={handleInputChange} className={selectFieldCls}>
                        <DocTypeOptions />
                      </select>
                    </Field>
                    <Field className="sm:col-span-2" label="Número de documento" required error={fieldError('documentNumber')}>
                      <input {...fieldProps('documentNumber')} type="text" placeholder="Ej. 40045678" className={`${fieldCls} tabular-nums ${invalidCls('documentNumber')}`} />
                    </Field>
                  </div>

                  <Field className="md:col-span-2" label="Profesión, oficio o especialidad" error={fieldError('professionOrTrade')}>
                    <input {...fieldProps('professionOrTrade')} type="text" placeholder="Ej. Ingeniero mecánico, auditor vial" className={`${fieldCls} ${invalidCls('professionOrTrade')}`} />
                  </Field>
                </div>
              </FormSection>
            )}
          </div>
        )}

        {/* PASO 3: contacto */}
        {currentStep === 3 && (
          <div className="animate-fade-up">
            <FormSection icon={MapPin} title="Contacto y ubicación" subtitle="A estos datos llegan las notificaciones, las órdenes de compra y la facturación.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Correo electrónico oficial" required error={fieldError('email')}>
                  <IconInput icon={Mail}>
                    <input {...fieldProps('email')} type="email" placeholder="comercial@proveedor.com" className={`${fieldWithIconCls} ${invalidCls('email')}`} />
                  </IconInput>
                </Field>

                <Field label="Teléfono de contacto" required hint="Celular de 10 números o fijo. Puede poner dos separados por «/»." error={fieldError('phone')}>
                  <IconInput icon={Phone}>
                    <input {...fieldProps('phone')} type="text" placeholder="(608) 770-1234 / 310 555 6789" className={`${fieldWithIconCls} ${invalidCls('phone')}`} />
                  </IconInput>
                </Field>

                <Field label="Ciudad y departamento" required error={fieldError('city')}>
                  <IconInput icon={MapPin}>
                    <input {...fieldProps('city')} type="text" list="admin-cities-datalist" placeholder="Sogamoso, Boyacá" className={`${fieldWithIconCls} ${invalidCls('city')}`} />
                  </IconInput>
                  <datalist id="admin-cities-datalist">
                    {(systemParameters?.cityOptions || [])
                      .filter((c) => c.isActive)
                      .map((c) => (
                        <option key={c.id} value={`${c.name}, ${c.department}`} />
                      ))}
                  </datalist>
                </Field>

                <Field label="Dirección comercial" error={fieldError('address')}>
                  <input {...fieldProps('address')} type="text" placeholder="Carrera 11 # 24-80, Sector Industrial" className={`${fieldCls} ${invalidCls('address')}`} />
                </Field>
              </div>
            </FormSection>
          </div>
        )}

        {/* PASO 4: SARLAFT y alta */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-up">
            <FormSection
              icon={ShieldCheck}
              title="Consulta SARLAFT"
              subtitle="Suba el PDF de la consulta. Mientras no la apruebe, no se puede registrar al proveedor."
            >
              <SarlaftUpload
                file={sarlaftFile}
                approved={sarlaftApproved}
                error={sarlaftError}
                onFile={(f) => {
                  setSarlaftFile(f);
                  setSarlaftApproved(false);
                  setSarlaftError('');
                  setErrorMessage('');
                }}
                onApprove={() => {
                  setSarlaftApproved(true);
                  setSarlaftError('');
                  setErrorMessage('');
                }}
                onNotice={(msg) => {
                  setSarlaftError(msg);
                  showToast(msg, 'error', 'Archivo no válido');
                }}
              />
            </FormSection>

            <FormSection icon={FileText} title="Justificación del registro" subtitle="Opcional: por qué se da de alta a este proveedor.">
              <Field label="Notas de registro" error={fieldError('notes')}>
                <textarea {...fieldProps('notes')} rows={3} placeholder="Motivo del alta, antecedentes o acuerdo comercial…" className={`${textareaCls} ${invalidCls('notes')}`} />
              </Field>
            </FormSection>
          </div>
        )}

        {/* Botones */}
        <div className="fs-card rounded-2xl px-5 py-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 h-11 px-5 rounded-xl border border-[#d6e0ec] dark:border-white/20 bg-white dark:bg-white/5 text-[15px] font-semibold text-[#0b1d3a] dark:text-white hover:bg-[#eaf4f7] dark:hover:bg-white/10 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Anterior
              </button>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveView('bancoProveedores')}
              className="inline-flex items-center justify-center h-11 px-5 rounded-xl text-[15px] font-semibold text-[#3a5274] dark:text-slate-300 hover:bg-[#eaf4f7] dark:hover:bg-white/10 cursor-pointer"
            >
              Cancelar
            </button>

            {currentStep < 4 ? (
              <button key="admin-reg-btn-next-step" type="button" onClick={handleNextStep} className={`${rowPrimaryBtn} inline-flex items-center justify-center gap-2`}>
                Siguiente paso <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                key="admin-reg-btn-submit"
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`${rowPrimaryBtn} inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Save className="w-4 h-4" /> {isSubmitting ? 'Registrando…' : 'Registrar y crear expediente'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
