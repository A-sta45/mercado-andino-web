/**
 * verificar(C, S, W): verificador iterativo de la Entrega 1 con los contadores de la
 * Tabla 6 de la Entrega 2. Cada iteración completa hace 2 comparaciones, 4 consultas,
 * 3 sumas y 2 inserciones (11 operaciones).
 */
import type { MapaCandidatos } from './tipos';

export type Retorno = 'normal' | 'R1' | 'R2' | 'R3';

export interface OperacionesVerificar {
  comparaciones: number;
  consultas: number;
  sumas: number;
  inserciones: number;
  total: number;
}

export interface ResultadoVerificar {
  resultado: boolean;
  ids: string[];
  consumo: bigint;
  beneficio: bigint;
  retorno: Retorno;
  /** iteraciones completas antes de terminar (j de la Tabla 6) */
  iteraciones: number;
  ops: OperacionesVerificar;
}

export function verificar(C: MapaCandidatos, S: readonly string[], W: bigint): ResultadoVerificar {
  const vistos = new Set<string>();
  const ids: string[] = [];
  let consumo = 0n;
  let beneficio = 0n;
  let i = 0;
  const ops = { comparaciones: 0, consultas: 0, sumas: 0, inserciones: 0 };
  const fin = (resultado: boolean, retorno: Retorno): ResultadoVerificar => ({
    resultado,
    ids,
    consumo,
    beneficio,
    retorno,
    iteraciones: i,
    ops: { ...ops, total: ops.comparaciones + ops.consultas + ops.sumas + ops.inserciones },
  });

  // Invariante I(i): 0 ≤ i ≤ |S|, vistos = {S[0..i-1]}, ids = S[0..i-1] (en C, sin repetidos),
  //                  consumo = Σ c(S[0..i-1]) ≤ W, beneficio = Σ b(S[0..i-1]). Variante: |S| − i.
  while ((ops.comparaciones++, i < S.length)) {
    const pid = S[i];
    ops.consultas++;
    const dato = C.get(pid);
    if (dato === undefined) return fin(false, 'R1'); // R1: id inexistente
    ops.consultas++;
    if (vistos.has(pid)) return fin(false, 'R2'); // R2: id repetido
    vistos.add(pid);
    ids.push(pid);
    ops.inserciones += 2;
    ops.consultas += 2; // C[pid][0] y C[pid][1]
    consumo += dato.w;
    beneficio += dato.v;
    ops.sumas += 2;
    ops.comparaciones++;
    if (consumo > W) return fin(false, 'R3'); // R3: excede capacidad
    i += 1;
    ops.sumas++;
  }
  return fin(true, 'normal'); // salida: i = |S| e I(i)
}

/** Comprueba con verificar que una selección devuelta por un algoritmo es factible y cuadra. */
export function verificarSeleccion(
  C: MapaCandidatos,
  seleccion: readonly string[],
  W: bigint,
  valorEsperado: bigint,
): { ok: boolean; detalle: ResultadoVerificar } {
  const r = verificar(C, seleccion, W);
  return { ok: r.resultado && r.beneficio === valorEsperado, detalle: r };
}
