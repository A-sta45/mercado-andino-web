/// <reference lib="webworker" />
/**
 * Web Worker para los algoritmos pesados (exhaustivo hasta n = 22, experimentos de
 * crecimiento): así la interfaz no se bloquea.
 */
import { brechas, comparar, crecimiento, dpVsW } from '../algorithms/experimentos';
import type { Mensaje } from './protocolo';

self.onmessage = (ev: MessageEvent<Mensaje>) => {
  const { id, tarea } = ev.data;
  try {
    let resultado: unknown;
    switch (tarea.tipo) {
      case 'comparar':
        resultado = comparar(tarea.instancia, tarea.reps);
        break;
      case 'crecimiento':
        resultado = crecimiento(tarea.ns, tarea.instancias);
        break;
      case 'dpVsW':
        resultado = dpVsW(tarea.n, tarea.ks);
        break;
      case 'brechas':
        resultado = brechas(tarea.n, tarea.cantidad, tarea.semillaBase);
        break;
    }
    self.postMessage({ id, ok: true, resultado });
  } catch (e) {
    self.postMessage({ id, ok: false, error: (e as Error).message });
  }
};
