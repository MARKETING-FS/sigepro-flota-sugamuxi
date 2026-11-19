import React, { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { fieldCls } from './formStyles';

interface CriterionShellProps {
  id: string;
  index: number;
  /** Ya tiene calificación (el número se pinta de azul) */
  done: boolean;
  title: string;
  badges?: React.ReactNode;
  description: string;
  /** Contenido a la derecha del título (peso, puntaje…) */
  aside?: React.ReactNode;
  notes: string;
  onNotes: (value: string) => void;
  notesPlaceholder: string;
  children: React.ReactNode;
}

/** Fila de un criterio: número, título, descripción plegable, controles y observación opcional. */
export const CriterionShell: React.FC<CriterionShellProps> = ({
  id,
  index,
  done,
  title,
  badges,
  description,
  aside,
  notes,
  onNotes,
  notesPlaceholder,
  children,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [noteOpen, setNoteOpen] = useState(notes.length > 0);
  const isLong = description.length > 150;

  return (
    <li id={`crit-${id}`} className="p-4 sm:p-5 scroll-mt-16 lg:scroll-mt-4">
      <div className="flex items-start gap-3.5">
        <span
          className={`w-8 h-8 rounded-full grid place-items-center shrink-0 text-sm font-semibold tabular-nums transition-colors ${
            done ? 'bg-[#1d5fa8] text-white' : 'bg-[#eaf2fb] dark:bg-white/10 text-[#1d5fa8] dark:text-[#69bdd7]'
          }`}
        >
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h5 className="font-display text-base font-semibold text-[#0b1d3a] dark:text-white">{title}</h5>
            {badges}
          </div>
          <p
            className={`text-[13px] leading-relaxed text-[#3a5274] dark:text-slate-400 mt-1 max-w-[70ch] ${
              isLong && !expanded ? 'line-clamp-2' : ''
            }`}
          >
            {description}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-xs font-semibold text-[#1d5fa8] dark:text-[#69bdd7] hover:underline underline-offset-2 cursor-pointer"
            >
              {expanded ? 'Ver menos' : 'Ver completo'}
            </button>
          )}
        </div>
        {aside}
      </div>

      <div className="mt-4 sm:pl-[46px] space-y-3">
        {children}
        {noteOpen ? (
          <input
            type="text"
            autoFocus={notes.length === 0}
            placeholder={notesPlaceholder}
            value={notes}
            onChange={(e) => onNotes(e.target.value)}
            aria-label={`Observación de ${title}`}
            className={fieldCls}
          />
        ) : (
          <button
            type="button"
            onClick={() => setNoteOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1d5fa8] dark:text-[#69bdd7] hover:underline underline-offset-2 cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4" /> Añadir observación
          </button>
        )}
      </div>
    </li>
  );
};
