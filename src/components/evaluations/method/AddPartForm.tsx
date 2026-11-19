import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { areaCls, fieldCls, labelCls } from '../form/formStyles';
import { Stepper } from './Stepper';

export interface NewPartValues {
  name: string;
  category: string;
  description: string;
  value: number;
}

interface AddPartFormProps {
  /** Texto del botón que abre el formulario, p. ej. «Agregar parte» */
  openLabel: string;
  title: string;
  valueLabel: string;
  unit: string;
  defaultValue: number;
  maxValue: number;
  step: number;
  withCategory?: boolean;
  onAdd: (values: NewPartValues) => void;
}

/** Botón punteado que se abre en un pequeño formulario para sumar una parte nueva a la lista. */
export const AddPartForm: React.FC<AddPartFormProps> = ({
  openLabel,
  title,
  valueLabel,
  unit,
  defaultValue,
  maxValue,
  step,
  withCategory,
  onAdd,
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState(defaultValue);
  const [touched, setTouched] = useState(false);

  const reset = () => {
    setOpen(false);
    setName('');
    setCategory('');
    setDescription('');
    setValue(defaultValue);
    setTouched(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setTouched(true);
      return;
    }
    onAdd({ name: name.trim(), category: category.trim() || 'General', description: description.trim(), value });
    reset();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-14 rounded-2xl border-2 border-dashed border-[#2c84c4]/40 text-sm font-semibold text-[#1d5fa8] dark:text-[#69bdd7] hover:border-[#2c84c4] hover:bg-[#2c84c4]/[0.06] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c84c4]/50"
      >
        <Plus className="w-4 h-4" /> {openLabel}
      </button>
    );
  }

  const nameError = touched && !name.trim();
  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-[#1d5fa8] bg-[#eaf2fb] dark:bg-[#0c2350] dark:border-[#4a9bff] p-4 sm:p-5 space-y-4"
      aria-label={title}
    >
      <h4 className="font-display text-base font-semibold text-[#0b1d3a] dark:text-white">{title}</h4>
      <div className={`grid gap-3 ${withCategory ? 'sm:grid-cols-[1fr_200px]' : ''}`}>
        <div>
          <label htmlFor="new-part-name" className={labelCls}>
            Nombre
          </label>
          <input
            id="new-part-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Referencias comerciales"
            aria-invalid={nameError}
            className={`${fieldCls} ${nameError ? '!border-red-500' : ''}`}
          />
          {nameError && (
            <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
              Escriba un nombre para poder agregarla.
            </p>
          )}
        </div>
        {withCategory && (
          <div>
            <label htmlFor="new-part-cat" className={labelCls}>
              Categoría
            </label>
            <input
              id="new-part-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ej. Calidad"
              className={fieldCls}
            />
          </div>
        )}
      </div>
      <div>
        <label htmlFor="new-part-desc" className={labelCls}>
          Qué se evalúa <span className="font-normal text-[#5d7392]">(opcional)</span>
        </label>
        <textarea
          id="new-part-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Una frase para que quien califica sepa qué mirar."
          className={areaCls}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#1c3354] dark:text-slate-200">{valueLabel}</span>
          <Stepper value={value} min={1} max={maxValue} step={step} unit={unit} label={valueLabel} onChange={setValue} />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="h-11 px-4 rounded-xl border border-[#2c84c4]/35 text-[#1d5fa8] dark:text-[#69bdd7] hover:bg-[#2c84c4]/10 text-sm font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="h-11 px-5 rounded-xl bg-gradient-action text-white text-sm font-semibold shadow-glow hover:brightness-110 cursor-pointer"
          >
            Agregar
          </button>
        </div>
      </div>
    </form>
  );
};
