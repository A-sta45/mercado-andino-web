import { useEffect, useState } from 'react';
import type { Respuesta, Resultados, Tarea } from './protocolo';

let worker: Worker | null = null;
let siguiente = 1;
const pendientes = new Map<number, { ok: (r: unknown) => void; mal: (e: Error) => void }>();

function obtener(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./algoritmos.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (ev: MessageEvent<Respuesta>) => {
      const p = pendientes.get(ev.data.id);
      if (!p) return;
      pendientes.delete(ev.data.id);
      if (ev.data.ok) p.ok(ev.data.resultado);
      else p.mal(new Error(ev.data.error));
    };
    worker.onerror = (e) => {
      for (const p of pendientes.values()) p.mal(new Error(e.message || 'Error en el Web Worker'));
      pendientes.clear();
      worker = null;
    };
  }
  return worker;
}

export function ejecutar<T extends Tarea>(tarea: T): Promise<Resultados[T['tipo']]> {
  return new Promise((ok, mal) => {
    const id = siguiente++;
    pendientes.set(id, { ok: ok as (r: unknown) => void, mal });
    obtener().postMessage({ id, tarea });
  });
}

/** Hook: ejecuta una tarea en el worker cuando cambia la clave. */
export function useTarea<T extends Tarea>(tarea: T | null, clave: string) {
  const [estado, setEstado] = useState<{ cargando: boolean; datos: Resultados[T['tipo']] | null; error: string | null }>({
    cargando: tarea !== null,
    datos: null,
    error: null,
  });
  useEffect(() => {
    if (!tarea) return;
    let vivo = true;
    setEstado({ cargando: true, datos: null, error: null });
    ejecutar(tarea).then(
      (d) => vivo && setEstado({ cargando: false, datos: d, error: null }),
      (e: Error) => vivo && setEstado({ cargando: false, datos: null, error: e.message }),
    );
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);
  return estado;
}
