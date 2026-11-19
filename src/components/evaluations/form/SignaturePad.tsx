import React, { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { Eraser } from 'lucide-react';
import { trimToPng } from '../../../utils/signature';

export interface SignaturePadHandle {
  /** PNG transparente recortado, o null si no hay trazo */
  toPng: () => string | null;
}

interface SignaturePadProps {
  onInkChange: (hasInk: boolean) => void;
}

/** Lienzo para firmar con el mouse, el dedo o un lápiz. */
export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(({ onInkChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  const prepare = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = Math.round(rect.width * dpr);
    c.height = Math.round(rect.height * dpr);
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0b1d3a';
    ctx.lineWidth = 2.6;
  }, []);

  useEffect(() => {
    prepare();
  }, [prepare]);

  useImperativeHandle(ref, () => ({
    toPng: () => (canvasRef.current && hasInk ? trimToPng(canvasRef.current) : null),
  }));

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = point(e);
    last.current = p;
    // Un toque suelto deja un punto
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.1, 0, Math.PI * 2);
    ctx.fillStyle = '#0b1d3a';
    ctx.fill();
    if (!hasInk) {
      setHasInk(true);
      onInkChange(true);
    }
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return;
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    const p = point(e);
    const mid = { x: (last.current.x + p.x) / 2, y: (last.current.y + p.y) / 2 };
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.quadraticCurveTo(last.current.x, last.current.y, mid.x, mid.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const up = () => {
    drawing.current = false;
    last.current = null;
  };

  const clear = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.restore();
    setHasInk(false);
    onInkChange(false);
  };

  return (
    <div>
      <div className="relative rounded-xl bg-white border border-[#2c84c4]/30 overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          aria-label="Espacio para dibujar su firma"
          className="block w-full h-[190px] cursor-crosshair"
          style={{ touchAction: 'none' }}
        />
        {!hasInk && (
          <span className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-[#5d7392]">
            Dibuje su firma aquí
          </span>
        )}
        <span className="pointer-events-none absolute left-6 right-6 bottom-9 border-b border-dashed border-[#0b1d3a]/25" aria-hidden="true" />
      </div>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={clear}
          disabled={!hasInk}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-[#1d5fa8] dark:text-[#69bdd7] hover:bg-[#2c84c4]/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Eraser className="w-4 h-4" /> Borrar y empezar de nuevo
        </button>
      </div>
    </div>
  );
});
SignaturePad.displayName = 'SignaturePad';
