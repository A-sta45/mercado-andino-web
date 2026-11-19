import { useEffect, useRef, useState } from 'react';

/** Mide el ancho de un elemento con ResizeObserver. */
export function useAncho<T extends HTMLElement>(inicial = 600) {
  const ref = useRef<T | null>(null);
  const [ancho, setAncho] = useState(inicial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setAncho(el.clientWidth || inicial);
    const ro = new ResizeObserver((e) => {
      const w = e[0]?.contentRect.width;
      if (w) setAncho(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [inicial]);
  return [ref, ancho] as const;
}
