/**
 * Merge sort por razón v/w descendente y, en empate, id ascendente (Punto 3 de la
 * Entrega 2). Compara razones con productos cruzados en BigInt: v_a·w_b vs v_b·w_a.
 * Divide y vencerás: mid = ⌊(lo+hi)/2⌋, casos base de 0 o 1 elemento, combinación = mezclar.
 */
import type { Candidato } from './tipos';

export interface ContadoresMerge {
  comparaciones: number;
  movimientos: number;
  llamadas: number;
  prof_max: number;
}

/** Eventos para visualizar el árbol de divisiones y mezclas paso a paso. */
export type EventoMerge =
  | { tipo: 'dividir'; lo: number; hi: number; mid: number; prof: number }
  | { tipo: 'base'; lo: number; hi: number; prof: number }
  | {
      tipo: 'mezclar';
      lo: number;
      mid: number;
      hi: number;
      prof: number;
      izquierda: string[];
      derecha: string[];
      resultado: string[];
      comparaciones: number;
      movimientos: number;
    };

export interface ResultadoMerge {
  ordenados: Candidato[];
  cont: ContadoresMerge;
  eventos?: EventoMerge[];
}

/** a ≺ b: razón mayor primero; en empate, id ascendente. */
export function antes(a: Candidato, b: Candidato, cont?: { comparaciones: number }): boolean {
  if (cont) cont.comparaciones++;
  const izq = a.v * b.w; // v_a · w_b
  const der = b.v * a.w; // v_b · w_a
  if (izq !== der) return izq > der; // razón mayor va primero
  return a.id < b.id; // empate: id ascendente
}

export function mergeSort(L: readonly Candidato[], registrar = false): ResultadoMerge {
  const A = [...L];
  const n = A.length;
  const aux: Candidato[] = new Array(n);
  const cont: ContadoresMerge = { comparaciones: 0, movimientos: 0, llamadas: 0, prof_max: 0 };
  const eventos: EventoMerge[] | undefined = registrar ? [] : undefined;

  function ordenar(lo: number, hi: number, prof: number): void {
    cont.llamadas++;
    if (prof > cont.prof_max) cont.prof_max = prof;
    if (hi - lo <= 1) {
      eventos?.push({ tipo: 'base', lo, hi, prof });
      return; // caso base: 0 o 1 elemento
    }
    const mid = Math.floor((lo + hi) / 2);
    eventos?.push({ tipo: 'dividir', lo, hi, mid, prof });
    ordenar(lo, mid, prof + 1);
    ordenar(mid, hi, prof + 1);
    mezclar(lo, mid, hi, prof);
  }

  function mezclar(lo: number, mid: number, hi: number, prof: number): void {
    const c0 = cont.comparaciones;
    const m0 = cont.movimientos;
    for (let t = lo; t < hi; t++) aux[t] = A[t];
    cont.movimientos += hi - lo;
    let i = lo;
    let j = mid;
    let k = lo;
    while (i < mid && j < hi) {
      if (antes(aux[j], aux[i], cont)) A[k] = aux[j++];
      else A[k] = aux[i++];
      k++;
    }
    while (i < mid) A[k++] = aux[i++];
    while (j < hi) A[k++] = aux[j++];
    cont.movimientos += hi - lo;
    if (eventos)
      eventos.push({
        tipo: 'mezclar',
        lo,
        mid,
        hi,
        prof,
        izquierda: aux.slice(lo, mid).map((x) => x.id),
        derecha: aux.slice(mid, hi).map((x) => x.id),
        resultado: A.slice(lo, hi).map((x) => x.id),
        comparaciones: cont.comparaciones - c0,
        movimientos: cont.movimientos - m0,
      });
  }

  ordenar(0, n, 1);
  return { ordenados: A, cont, eventos };
}

export function estaOrdenada(A: readonly Candidato[]): boolean {
  for (let t = 0; t + 1 < A.length; t++) if (!antes(A[t], A[t + 1])) return false;
  return true;
}

/** Movimientos exactos: M(n) = 2(n⌈log₂n⌉ − 2^⌈log₂n⌉ + n) (0 si n ≤ 1). */
export function movimientosTeoricos(n: number): number {
  if (n <= 1) return 0;
  const L = log2Techo(n);
  return 2 * (n * L - 2 ** L + n);
}

/** Cota superior de comparaciones: n⌈log₂n⌉ − 2^⌈log₂n⌉ + 1. */
export function comparacionesMaxTeoricas(n: number): number {
  if (n <= 1) return 0;
  const L = log2Techo(n);
  return n * L - 2 ** L + 1;
}

/** ⌈log₂ n⌉ exacto con enteros. */
export function log2Techo(n: number): number {
  let L = 0;
  while (2 ** L < n) L++;
  return L;
}
