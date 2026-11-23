import { useEffect } from 'react';

/**
 * Celular: las tablas marcadas con la clase "table-stack" se muestran como tarjetas (ver index.css).
 * Aquí se copia el texto de cada encabezado a su celda (data-label) para que la tarjeta diga a qué dato corresponde.
 * La primera columna (el nombre) y las columnas sin título o de "Acciones" no llevan etiqueta.
 */
export function useStackTables(): void {
  useEffect(() => {
    let frame = 0;
    const label = () => {
      frame = 0;
      document.querySelectorAll<HTMLTableElement>('table.table-stack').forEach((table) => {
        const heads = Array.from(table.querySelectorAll<HTMLTableCellElement>(':scope > thead th')).map((th, i) => {
          const text = (th.textContent || '').trim();
          return i === 0 || !text || /^(acci[oó]n|acciones|botones de acci[oó]n)\b/i.test(text) ? '' : text;
        });
        table.querySelectorAll<HTMLTableRowElement>(':scope > tbody > tr').forEach((tr) => {
          Array.from(tr.children).forEach((cell, i) => {
            if (!(cell instanceof HTMLElement) || cell.hasAttribute('colspan')) return;
            const want = heads[i] ?? '';
            if (cell.getAttribute('data-label') !== want) cell.setAttribute('data-label', want);
          });
        });
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(label);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    schedule();
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
}
