/**
 * SUBSET SUM y la reducción SUBSET SUM ≤p DECISIÓN Mercado Andino.
 * SUBSET SUM: enteros positivos a_1..a_n y T ≥ 0; ¿existe un subconjunto con suma exactamente T?
 * Reducción: cada a_i se vuelve un candidato con w_i = v_i = a_i, y W = B = T.
 */
import { bits } from './bigint';
import type { Candidato, Instancia } from './tipos';

export interface InstanciaSubsetSum {
  a: bigint[];
  T: bigint;
}

export function validarSubsetSum(s: InstanciaSubsetSum): string[] {
  const errores: string[] = [];
  s.a.forEach((x, i) => {
    if (x <= 0n) errores.push(`a_${i + 1} = ${x} no es un entero positivo.`);
  });
  if (s.T < 0n) errores.push('T debe ser un entero ≥ 0.');
  return errores;
}

export interface Reduccion {
  instancia: Instancia;
  B: bigint;
  /** bits de la entrada de SUBSET SUM: Σ bits(a_i) + bits(T) */
  bitsAntes: number;
  /** bits de la salida: Σ (bits(w_i) + bits(v_i)) + bits(W) + bits(B) = 2·bitsAntes */
  bitsDespues: number;
  /** operaciones de construcción: una copia por a_i (w y v) + W y B */
  operaciones: number;
}

export function reducir(s: InstanciaSubsetSum): Reduccion {
  const candidatos: Candidato[] = s.a.map((x, i) => ({ id: `A${i + 1}`, w: x, v: x }));
  let bitsA = 0;
  for (const x of s.a) bitsA += bits(x);
  const bitsAntes = bitsA + bits(s.T);
  return {
    instancia: { candidatos, W: s.T },
    B: s.T,
    bitsAntes,
    bitsDespues: 2 * bitsA + 2 * bits(s.T),
    operaciones: 2 * s.a.length + 2,
  };
}

export interface RespuestaSubsetSum {
  respuesta: boolean;
  /** índices (0-based) del subconjunto testigo si la respuesta es SÍ */
  testigo: number[] | null;
  metodo: 'tabla' | 'enumeracion';
}

/**
 * Resuelve SUBSET SUM de forma exacta: tabla de alcanzables si T es pequeño, si no
 * enumeración de los 2^n subconjuntos (n ≤ 22). Ambos son exponenciales en el peor caso
 * respecto de la longitud de la entrada.
 */
export function resolverSubsetSum(s: InstanciaSubsetSum): RespuestaSubsetSum {
  const n = s.a.length;
  if (s.T <= 2_000_000n) {
    const T = Number(s.T);
    // previo[t] = índice+1 del último a_i usado para alcanzar t por primera vez (0 = no alcanzable)
    const alcanza = new Int32Array(T + 1).fill(-1);
    alcanza[0] = n; // marcador: suma 0 alcanzable con el vacío
    for (let i = 0; i < n; i++) {
      if (s.a[i] > s.T) continue;
      const ai = Number(s.a[i]);
      for (let t = T; t >= ai; t--) if (alcanza[t] === -1 && alcanza[t - ai] !== -1) alcanza[t] = i;
    }
    if (alcanza[T] === -1) return { respuesta: false, testigo: null, metodo: 'tabla' };
    const testigo: number[] = [];
    let t = T;
    while (t > 0) {
      const i = alcanza[t];
      testigo.push(i);
      t -= Number(s.a[i]);
    }
    return { respuesta: true, testigo: testigo.reverse(), metodo: 'tabla' };
  }
  if (n > 22) throw new Error('Instancia demasiado grande para resolverla en el navegador.');
  for (let m = 0; m < 1 << n; m++) {
    let suma = 0n;
    for (let j = 0; j < n; j++) if (m & (1 << j)) suma += s.a[j];
    if (suma === s.T) {
      const testigo: number[] = [];
      for (let j = 0; j < n; j++) if (m & (1 << j)) testigo.push(j);
      return { respuesta: true, testigo, metodo: 'enumeracion' };
    }
  }
  return { respuesta: false, testigo: null, metodo: 'enumeracion' };
}

/** Ejemplos fijos de la Entrega 4. */
export const EJEMPLO_SI: InstanciaSubsetSum = { a: [3n, 5n, 7n, 11n], T: 15n };
export const EJEMPLO_NO: InstanciaSubsetSum = { a: [4n, 6n, 10n], T: 7n };
