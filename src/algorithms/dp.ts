/**
 * Programación dinámica para la selección 0/1.
 * F(i, c) = mayor beneficio usando los candidatos 1..i con capacidad c.
 * Base: F(0, c) = 0 y F(i, 0) = 0.
 * Transición: F(i, c) = F(i−1, c) si w_i > c; si no, max(F(i−1, c), v_i + F(i−1, c − w_i)).
 * Tiempo Θ(nW) y memoria Θ(nW) (W es el VALOR de la capacidad, no su número de bits).
 */
import { itemsPorId } from './exhaustivo';
import type { Candidato, MapaCandidatos } from './tipos';

export class ErrorTablaGrande extends Error {
  constructor(public celdas: bigint) {
    super(`La tabla tendría ${celdas} celdas; supera el límite de ejecución en el navegador.`);
    this.name = 'ErrorTablaGrande';
  }
}

export interface ContadoresDP {
  /** celdas de la tabla completa: (n+1)(W+1) */
  celdas: number;
  /** celdas calculadas con la transición: n·W */
  celdasCalculadas: number;
  comparaciones: number;
  sumas: number;
}

export interface ResultadoDP {
  valor: bigint;
  seleccion: string[];
  consumo: bigint;
  /** candidatos en el orden de las filas (1..n = por id) */
  items: Candidato[];
  /** F[i][c] */
  tabla: bigint[][];
  /** celdas (i, c) recorridas en la reconstrucción, desde (n, W) hasta la fila 0 */
  camino: { i: number; c: number; incluye: boolean }[];
  cont: ContadoresDP;
}

export const LIMITE_CELDAS = 4_000_000n;

/** Número de celdas (n+1)(W+1), en BigInt porque W puede ser enorme. */
export function celdasDP(n: number, W: bigint): bigint {
  return BigInt(n + 1) * (W + 1n);
}

export function itemsDP(C: MapaCandidatos): Candidato[] {
  return itemsPorId(C).map(([id, d]) => ({ id, w: d.w, v: d.v }));
}

export function dp(C: MapaCandidatos, W: bigint, limite = LIMITE_CELDAS): ResultadoDP {
  const items = itemsDP(C);
  const n = items.length;
  const total = celdasDP(n, W);
  if (total > limite) throw new ErrorTablaGrande(total);
  const Wn = Number(W);
  const cont: ContadoresDP = { celdas: Number(total), celdasCalculadas: n * Wn, comparaciones: 0, sumas: 0 };

  const F: bigint[][] = [new Array<bigint>(Wn + 1).fill(0n)]; // F(0, c) = 0
  for (let i = 1; i <= n; i++) {
    const { w, v } = items[i - 1];
    const prev = F[i - 1];
    const wn = w > W ? Wn + 1 : Number(w); // w ≤ W cabe en Number porque W ≤ límite
    const fila = new Array<bigint>(Wn + 1);
    fila[0] = 0n; // F(i, 0) = 0
    for (let c = 1; c <= Wn; c++) {
      cont.comparaciones++;
      if (wn > c) {
        fila[c] = prev[c]; // no cabe: solo se puede excluir
      } else {
        const con = v + prev[c - wn];
        cont.sumas += 2;
        cont.comparaciones++;
        fila[c] = con > prev[c] ? con : prev[c];
      }
    }
    F.push(fila);
  }

  // Reconstrucción desde F(n, W) hacia atrás. Si F(i,c) = F(i−1,c) se excluye (empate: excluir).
  const camino: ResultadoDP['camino'] = [];
  const sel: string[] = [];
  let c = Wn;
  for (let i = n; i >= 1; i--) {
    const incluye = F[i][c] !== F[i - 1][c];
    camino.push({ i, c, incluye });
    if (incluye) {
      sel.push(items[i - 1].id);
      c -= Number(items[i - 1].w);
    }
  }
  camino.push({ i: 0, c, incluye: false });
  sel.reverse();
  let consumo = 0n;
  for (const p of sel) consumo += C.get(p)!.w;
  return { valor: F[n][Wn], seleccion: sel, consumo, items, tabla: F, camino, cont };
}

/** Variante con memoria Θ(W): un solo arreglo recorrido de c = W hacia abajo. Solo el valor. */
export function dpSoloValor(C: MapaCandidatos, W: bigint, limite = LIMITE_CELDAS * 4n): { valor: bigint; celdas: number } {
  const items = itemsDP(C);
  const total = celdasDP(items.length, W);
  if (total > limite) throw new ErrorTablaGrande(total);
  const Wn = Number(W);
  const G = new Array<bigint>(Wn + 1).fill(0n);
  for (const { w, v } of items) {
    if (w > W) continue;
    const wn = Number(w);
    for (let c = Wn; c >= wn; c--) {
      const con = v + G[c - wn];
      if (con > G[c]) G[c] = con;
    }
  }
  return { valor: G[Wn], celdas: Number(total) };
}
