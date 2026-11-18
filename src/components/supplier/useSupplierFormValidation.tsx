import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  ALL_FIELDS,
  FIELD_INPUT_MODE,
  FIELD_LIMITS,
  FieldErrors,
  FieldName,
  SupplierFormValues,
  SupplierType,
  ExistingSupplierRef,
  fieldsOfStep,
  sanitizeField,
  validateSupplierForm,
} from '../../utils/supplierFieldRules';

/** Clases que se suman a la casilla cuando tiene un error (borde y anillo rojos) */
export const INVALID_CLS = '!border-red-500 ring-2 ring-red-500/30 focus:!ring-red-500 bg-red-50/60 dark:bg-red-950/20';

interface Options {
  values: SupplierFormValues;
  /** Cambia el valor de un campo en el estado del formulario */
  setValue: (name: string, value: string) => void;
  supplierType: SupplierType;
  existing: ExistingSupplierRef[];
}

/**
 * Validación del formulario de proveedores en tiempo real.
 * - Mientras se escribe: quita lo que el campo no acepta (letras en un documento, números en un nombre…) y lo avisa en rojo.
 * - Después de escribir o salir de la casilla: muestra el error de ese campo.
 * - Al pulsar Siguiente o Registrar: marca todas las casillas con error y lleva al administrador a la primera.
 */
export function useSupplierFormValidation({ values, setValue, supplierType, existing }: Options) {
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [notices, setNotices] = useState<Partial<Record<FieldName, string>>>({});
  const noticeTimers = useRef<Partial<Record<FieldName, number>>>({});

  useEffect(
    () => () => {
      Object.values(noticeTimers.current).forEach((t) => t && window.clearTimeout(t));
    },
    []
  );

  const errors: FieldErrors = useMemo(
    () => validateSupplierForm(values, { supplierType, existing }),
    [values, supplierType, existing]
  );

  const docTypeOf = (name: FieldName) =>
    name === 'representativeLegalDocNumber' ? values.representativeLegalDocType : values.documentType;

  const flashNotice = (name: FieldName, msg: string) => {
    setNotices((p) => ({ ...p, [name]: msg }));
    const prev = noticeTimers.current[name];
    if (prev) window.clearTimeout(prev);
    noticeTimers.current[name] = window.setTimeout(() => {
      setNotices((p) => {
        const n = { ...p };
        delete n[name];
        return n;
      });
    }, 3500);
  };

  /** Cada vez que se escribe en una casilla: limpia, guarda y avisa */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const name = e.target.name as FieldName;
      const { value, rejected } = sanitizeField(name, e.target.value, { docType: docTypeOf(name) });
      setValue(name, value);
      setTouched((p) => (p[name] ? p : { ...p, [name]: true }));
      if (rejected) flashNotice(name, rejected);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setValue, values.documentType, values.representativeLegalDocType]
  );

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = e.target.name as FieldName;
    setTouched((p) => (p[name] ? p : { ...p, [name]: true }));
  }, []);

  /** Quita las marcas de un campo (por ejemplo, al cambiar el tipo de documento se vuelve a evaluar) */
  const touch = (names: FieldName[]) =>
    setTouched((p) => {
      const n = { ...p };
      names.forEach((f) => (n[f] = true));
      return n;
    });

  /** El mensaje que se ve en pantalla para un campo, o '' */
  const messageOf = (name: FieldName): string => (touched[name] ? errors[name] || notices[name] || '' : notices[name] || '');

  const isInvalid = (name: FieldName) => !!(touched[name] && errors[name]) || !!notices[name];

  /** Todo lo que lleva una casilla de texto para quedar validada */
  const fieldProps = (name: FieldName) => ({
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    maxLength: name === 'documentNumber' || name === 'representativeLegalDocNumber' ? 18 : FIELD_LIMITS[name],
    inputMode: FIELD_INPUT_MODE[name],
    autoComplete: 'off' as const,
    'data-field': name,
    'aria-invalid': isInvalid(name) || undefined,
    'aria-describedby': isInvalid(name) ? `err-${name}` : undefined,
  });

  /** Clases extra para la casilla: roja si tiene un error */
  const invalidCls = (name: FieldName) => (isInvalid(name) ? INVALID_CLS : '');

  /** Aviso rojo debajo de la casilla */
  const fieldError = (name: FieldName) => {
    const msg = messageOf(name);
    if (!msg) return null;
    return (
      <p id={`err-${name}`} role="alert" className="mt-1 flex items-start gap-1.5 text-[11px] font-semibold leading-snug text-red-600 dark:text-red-400">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
        <span>{msg}</span>
      </p>
    );
  };

  /** Lleva la vista a la casilla y le da el foco */
  const focusField = (name: FieldName) => {
    const el = document.querySelector<HTMLElement>(`[data-field="${name}"]`);
    if (!el) return false;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => el.focus({ preventScroll: true }), 250);
    return true;
  };

  /**
   * Marca como "tocados" los campos pedidos y devuelve los que tienen error, en orden de pantalla.
   * Si se pasa `focus`, también enfoca el primero.
   */
  const checkFields = (names: FieldName[], focus = true): FieldName[] => {
    touch(names);
    const bad = names.filter((f) => !!errors[f]);
    if (focus && bad.length) window.setTimeout(() => focusField(bad[0]), 60);
    return bad;
  };

  const checkStep = (step: number, focus = true) => checkFields(fieldsOfStep(step, supplierType), focus);

  /** Primer paso (2, 3 o 4) que tiene errores, o 0 si todo está bien */
  const firstStepWithErrors = (): number => {
    for (const s of [2, 3, 4]) {
      if (fieldsOfStep(s, supplierType).some((f) => !!errors[f])) return s;
    }
    return 0;
  };

  const reset = () => {
    setTouched({});
    setNotices({});
  };

  return {
    errors,
    fieldProps,
    invalidCls,
    fieldError,
    messageOf,
    isInvalid,
    touch,
    checkFields,
    checkStep,
    firstStepWithErrors,
    focusField,
    reset,
    allFields: ALL_FIELDS,
  };
}
