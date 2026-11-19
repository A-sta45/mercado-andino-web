import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAncho } from './useAncho';

interface T {
  k: number;
  x: number;
  y: number;
}

/**
 * Lienzo SVG con zoom (rueda, pellizco o botones) y desplazamiento (arrastre).
 * El contenido se dibuja en coordenadas propias de tamaño ancho × alto.
 */
export function ZoomPan({
  ancho,
  alto,
  altura = 420,
  children,
  etiqueta,
}: {
  ancho: number;
  alto: number;
  altura?: number;
  children: ReactNode;
  etiqueta: string;
}) {
  const [ref, vw] = useAncho<HTMLDivElement>(600);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const ajustar = useCallback((): T => {
    const k = Math.min(vw / (ancho + 20), altura / (alto + 20), 1.6);
    return { k, x: (vw - ancho * k) / 2, y: 10 };
  }, [vw, altura, ancho, alto]);
  const [t, setT] = useState<T>({ k: 1, x: 0, y: 0 });
  useEffect(() => setT(ajustar()), [ajustar]);

  const punteros = useRef(new Map<number, { x: number; y: number }>());
  const pellizco = useRef<{ d: number; t: T; cx: number; cy: number } | null>(null);

  const zoomEn = (factor: number, cx: number, cy: number) =>
    setT((p) => {
      const k = Math.min(8, Math.max(0.05, p.k * factor));
      const f = k / p.k;
      return { k, x: cx - (cx - p.x) * f, y: cy - (cy - p.y) * f };
    });

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomEn(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <div className="lienzo" ref={ref} style={{ height: altura }}>
      <div className="lienzo-controles">
        <button type="button" className="boton-icono" aria-label="Acercar" onClick={() => zoomEn(1.3, vw / 2, altura / 2)}>
          +
        </button>
        <button type="button" className="boton-icono" aria-label="Alejar" onClick={() => zoomEn(1 / 1.3, vw / 2, altura / 2)}>
          −
        </button>
        <button type="button" className="boton-icono" aria-label="Ajustar a la vista" onClick={() => setT(ajustar())}>
          ⤢
        </button>
      </div>
      <svg
        ref={svgRef}
        role="img"
        aria-label={etiqueta}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          punteros.current.set(e.pointerId, pos(e));
          if (punteros.current.size === 2) {
            const [a, b] = [...punteros.current.values()];
            pellizco.current = { d: Math.hypot(a.x - b.x, a.y - b.y), t, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
          }
        }}
        onPointerMove={(e) => {
          const prev = punteros.current.get(e.pointerId);
          if (!prev) return;
          const p = pos(e);
          punteros.current.set(e.pointerId, p);
          if (punteros.current.size === 2 && pellizco.current) {
            const [a, b] = [...punteros.current.values()];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            const base = pellizco.current;
            const k = Math.min(8, Math.max(0.05, (base.t.k * d) / base.d));
            const f = k / base.t.k;
            setT({ k, x: base.cx - (base.cx - base.t.x) * f, y: base.cy - (base.cy - base.t.y) * f });
          } else if (punteros.current.size === 1) {
            setT((q) => ({ ...q, x: q.x + p.x - prev.x, y: q.y + p.y - prev.y }));
          }
        }}
        onPointerUp={(e) => {
          punteros.current.delete(e.pointerId);
          if (punteros.current.size < 2) pellizco.current = null;
        }}
        onPointerCancel={(e) => {
          punteros.current.delete(e.pointerId);
          pellizco.current = null;
        }}
      >
        <g transform={`translate(${t.x},${t.y}) scale(${t.k})`}>{children}</g>
      </svg>
    </div>
  );
}
