import type { FilaComparacion, PuntoCrecimiento, PuntoDpVsW, ResumenBrechas } from '../algorithms/experimentos';
import type { Instancia } from '../algorithms/tipos';

export type Tarea =
  | { tipo: 'comparar'; instancia: Instancia; reps: number }
  | { tipo: 'crecimiento'; ns: number[]; instancias: number }
  | { tipo: 'dpVsW'; n: number; ks: number[] }
  | { tipo: 'brechas'; n: number; cantidad: number; semillaBase: number };

export interface Resultados {
  comparar: FilaComparacion[];
  crecimiento: PuntoCrecimiento[];
  dpVsW: PuntoDpVsW[];
  brechas: ResumenBrechas;
}

export interface Mensaje {
  id: number;
  tarea: Tarea;
}

export type Respuesta = { id: number; ok: true; resultado: unknown } | { id: number; ok: false; error: string };
