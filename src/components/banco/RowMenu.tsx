import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

export interface RowMenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
  /** Acción que quita algo: se pinta en rojo */
  danger?: boolean;
}

/** Menú de acciones de una fila. Va con posición fija para que la tabla (con desplazamiento) no lo recorte. */
export const RowMenu: React.FC<{ items: RowMenuItem[]; label: string; className?: string }> = ({ items, label, className = '' }) => {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setPos(null), []);

  useEffect(() => {
    if (!pos) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        btnRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [pos, close]);

  if (items.length === 0) return null;

  const toggle = () => {
    if (pos) return close();
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    // Si no cabe debajo, se abre hacia arriba
    const h = items.length * 44 + 12;
    const top = r.bottom + 6 + h > window.innerHeight ? Math.max(8, r.top - 6 - h) : r.bottom + 6;
    setPos({ top, right: Math.max(8, window.innerWidth - r.right) });
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={!!pos}
        aria-label={label}
        title={label}
        className={className}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {pos && (
        <div
          ref={menuRef}
          role="menu"
          style={{ position: 'fixed', top: pos.top, right: pos.right }}
          className="z-[90] min-w-[210px] rounded-2xl p-1.5 bg-white dark:bg-[#101828] border border-black/10 dark:border-white/15 shadow-[0_18px_40px_-12px_rgba(11,29,58,0.35)] animate-in fade-in zoom-in-95 duration-150"
        >
          {items.map((it) => (
            <button
              key={it.key}
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                it.onSelect();
              }}
              className={`w-full flex items-center gap-2.5 h-11 px-3 rounded-xl text-sm font-semibold text-left cursor-pointer transition-colors ${
                it.danger
                  ? 'text-red-600 dark:text-red-300 hover:bg-red-500/10'
                  : 'text-[#0b1d3a] dark:text-white hover:bg-[#2c84c4]/10'
              }`}
            >
              <span className="shrink-0">{it.icon}</span>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
};
