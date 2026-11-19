/**
 * Algoritmo ávido (HEURÍSTICA para la selección 0/1): recorre el orden v/w del merge
 * sort e incluye cada candidato si cabe en la capacidad restante.
 * Invariante: consumo acumulado ≤ W y sin repetidos. Variante: candidatos restantes.
 * NO garantiza el óptimo (ver contraejemplos).
 */
import { mergeSort, type ContadoresMerge } from './mergeSort';
import type { Candidato } from './tipos';

export interface PasoAvido {
  posicion: number;
  id: string;
  w: bigint;
  v: bigint;
  restanteAntes: bigint;
  incluido: boolean;
}

export interface ResultadoAvido {
  valor: bigint;
  seleccion: string[];
  consumo: bigint;
  orden: Candidato[];
  pasos: PasoAvido[];
  contMerge: ContadoresMerge;
  /** comparaciones “¿cabe?” del recorrido (una por candidato) */
  comparacionesRecorrido: number;
  /** operaciones totales = comparaciones + movimientos del merge sort + recorrido */
  operaciones: number;
}

/** Recorre un orden ya calculado (para reutilizar el preprocesamiento). */
export function recorridoAvido(orden: readonly Candidato[], W: bigint) {
  let restante = W;
  let valor = 0n;
  const seleccion: string[] = [];
  const pasos: PasoAvido[] = [];
  orden.forEach((c, posicion) => {
    const incluido = c.w <= restante;
    pasos.push({ posicion, id: c.id, w: c.w, v: c.v, restanteAntes: restante, incluido });
    if (incluido) {
      restante -= c.w;
      valor += c.v;
      seleccion.push(c.id);
    }
  });
  return { valor, seleccion, consumo: W - restante, pasos, comparaciones: orden.length };
}

export function avido(candidatos: readonly Candidato[], W: bigint): ResultadoAvido {
  const { ordenados, cont } = mergeSort(candidatos);
  const r = recorridoAvido(ordenados, W);
  return {
    valor: r.valor,
    seleccion: r.seleccion,
    consumo: r.consumo,
    orden: ordenados,
    pasos: r.pasos,
    contMerge: cont,
    comparacionesRecorrido: r.comparaciones,
    operaciones: cont.comparaciones + cont.movimientos + r.comparaciones,
  };
}
