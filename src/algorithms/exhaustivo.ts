/**
 * Búsqueda exhaustiva recursiva por incluir/excluir (Punto 2 de la Entrega 2).
 * Es la referencia exacta: todo lo demás se compara contra este resultado.
 * - Orden fijo por id (resultado reproducible).
 * - “Incluir” solo se explora si el pedido cabe (c ≤ r).
 * - En empate se conserva “excluir”.
 */
import type { MapaCandidatos } from './tipos';

export interface ContadoresExhaustivo {
  llamadas: number;
  comparaciones: number;
  sumas: number;
  prof_max: number;
}

export interface ResultadoExhaustivo {
  valor: bigint;
  seleccion: string[];
  consumo: bigint;
  cont: ContadoresExhaustivo;
  /** Solo si se pidió: veces que se visitó cada estado (i, r). Clave `${i}|${r}`. */
  estados?: Map<string, number>;
}

export interface OpcionesExhaustivo {
  registrarEstados?: boolean;
  /** Corta si las llamadas superan este número (lanza Error). */
  maxLlamadas?: number;
}

export function itemsPorId(C: MapaCandidatos): [string, { w: bigint; v: bigint }][] {
  return [...C.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
}

export function exhaustivo(C: MapaCandidatos, W: bigint, op: OpcionesExhaustivo = {}): ResultadoExhaustivo {
  const cont: ContadoresExhaustivo = { llamadas: 0, comparaciones: 0, sumas: 0, prof_max: 0 };
  const items = itemsPorId(C);
  const n = items.length;
  const estados = op.registrarEstados ? new Map<string, number>() : undefined;
  const maxLlamadas = op.maxLlamadas ?? Infinity;

  function mejor(i: number, r: bigint, prof: number): [bigint, string[]] {
    cont.llamadas++;
    if (cont.llamadas > maxLlamadas) throw new Error('Límite de llamadas alcanzado');
    if (prof > cont.prof_max) cont.prof_max = prof;
    if (estados) {
      const k = `${i}|${r}`;
      estados.set(k, (estados.get(k) ?? 0) + 1);
    }
    cont.comparaciones++;
    if (i === n) return [0n, []]; // caso base
    const [pid, { w: c, v: b }] = items[i];
    const [vEx, selEx] = mejor(i + 1, r, prof + 1); // rama EXCLUIR
    cont.comparaciones++;
    if (c <= r) {
      // rama INCLUIR solo si cabe
      const [vInParcial, selIn] = mejor(i + 1, r - c, prof + 1);
      const vIn = vInParcial + b;
      cont.sumas += 2;
      cont.comparaciones++;
      if (vIn > vEx) return [vIn, [pid, ...selIn]]; // empate: se conserva EXCLUIR
    }
    return [vEx, selEx];
  }

  const [valor, seleccion] = mejor(0, W, 1);
  let consumo = 0n;
  for (const p of seleccion) consumo += C.get(p)!.w;
  return { valor, seleccion, consumo, cont, estados };
}

/** Enumeración independiente de los 2^n subconjuntos (para validar el exhaustivo en pruebas). */
export function fuerzaBruta(C: MapaCandidatos, W: bigint): bigint {
  const items = [...C.values()];
  const n = items.length;
  let mejor = 0n;
  for (let m = 0; m < 1 << n; m++) {
    let w = 0n;
    let v = 0n;
    for (let j = 0; j < n; j++)
      if (m & (1 << j)) {
        w += items[j].w;
        v += items[j].v;
      }
    if (w <= W && v > mejor) mejor = v;
  }
  return mejor;
}
