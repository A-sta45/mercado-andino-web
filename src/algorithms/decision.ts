/**
 * DECISIÓN Mercado Andino: dados candidatos (w_i > 0, v_i ≥ 0 enteros), W y B,
 * ¿existe una selección sin repeticiones con Σw ≤ W y Σv ≥ B?
 */
import { bits } from './bigint';
import { ramificacionPoda } from './ramificacionPoda';
import type { Candidato, Instancia } from './tipos';

export interface LongitudEntrada {
  /** bits de cada consumo y beneficio */
  porCandidato: { id: string; bitsW: number; bitsV: number }[];
  bitsW: number;
  bitsB: number;
  /** L = Σ (bits(w_i) + bits(v_i)) + bits(W) + bits(B) */
  L: number;
  /** máximo de bits de un número de la entrada */
  maxBits: number;
}

/**
 * Longitud binaria de TODA la entrada. Modelo: cada número se escribe en binario
 * (bits(0) = 1); los separadores e ids aportan O(n) bits más y no cambian el orden.
 */
export function longitudEntrada(inst: Instancia, B: bigint): LongitudEntrada {
  const porCandidato = inst.candidatos.map((c) => ({ id: c.id, bitsW: bits(c.w), bitsV: bits(c.v) }));
  const bitsW = bits(inst.W);
  const bitsB = bits(B);
  let L = bitsW + bitsB;
  let maxBits = Math.max(bitsW, bitsB);
  for (const p of porCandidato) {
    L += p.bitsW + p.bitsV;
    maxBits = Math.max(maxBits, p.bitsW, p.bitsV);
  }
  return { porCandidato, bitsW, bitsB, L, maxBits };
}

export interface ResultadoCertificado {
  acepta: boolean;
  consumo: bigint;
  beneficio: bigint;
  cumpleCapacidad: boolean;
  cumpleUmbral: boolean;
  /** longitud del certificado en bits (= n) */
  bitsCertificado: number;
  ops: { lecturasBit: number; sumas: number; comparaciones: number; total: number };
  /** bits máximos de las sumas parciales (≤ L) */
  bitsMaxSumas: number;
  motivo?: string;
}

/**
 * Verificador de certificados: recibe (instancia, x ∈ {0,1}^n, B) y comprueba
 * Σ w_i x_i ≤ W y Σ v_i x_i ≥ B. Hace O(n) sumas y comparaciones sobre números de
 * a lo sumo O(L) bits: tiempo polinómico en la longitud L de la entrada.
 * Sin repeticiones por construcción: cada candidato tiene un único bit.
 */
export function verificarCertificado(inst: Instancia, x: readonly (0 | 1 | boolean)[], B: bigint): ResultadoCertificado {
  const n = inst.candidatos.length;
  const ops = { lecturasBit: 0, sumas: 0, comparaciones: 1, total: 0 };
  if (x.length !== n) {
    ops.total = ops.comparaciones;
    return {
      acepta: false,
      consumo: 0n,
      beneficio: 0n,
      cumpleCapacidad: false,
      cumpleUmbral: false,
      bitsCertificado: x.length,
      ops,
      bitsMaxSumas: 0,
      motivo: `El certificado debe tener exactamente n = ${n} bits.`,
    };
  }
  let consumo = 0n;
  let beneficio = 0n;
  let bitsMax = 1;
  for (let i = 0; i < n; i++) {
    ops.lecturasBit++;
    ops.comparaciones++;
    if (x[i] === 1 || x[i] === true) {
      consumo += inst.candidatos[i].w;
      beneficio += inst.candidatos[i].v;
      ops.sumas += 2;
      bitsMax = Math.max(bitsMax, bits(consumo), bits(beneficio));
    }
  }
  const cumpleCapacidad = consumo <= inst.W;
  const cumpleUmbral = beneficio >= B;
  ops.comparaciones += 2;
  ops.total = ops.lecturasBit + ops.sumas + ops.comparaciones;
  return {
    acepta: cumpleCapacidad && cumpleUmbral,
    consumo,
    beneficio,
    cumpleCapacidad,
    cumpleUmbral,
    bitsCertificado: n,
    ops,
    bitsMaxSumas: bitsMax,
  };
}

export interface RespuestaDecision {
  respuesta: boolean;
  /** certificado x si la respuesta es SÍ */
  certificado: (0 | 1)[] | null;
  optimo: bigint;
  nodos: number;
}

/**
 * Decisor exacto (exponencial en el peor caso): resuelve la optimización con
 * ramificación y poda y compara con B. Sirve para instancias pequeñas.
 */
export function decidir(inst: Instancia, B: bigint): RespuestaDecision {
  const r = ramificacionPoda(inst.candidatos, inst.W, { maxRegistro: 0 });
  const respuesta = r.valor >= B;
  const set = new Set(r.seleccion);
  return {
    respuesta,
    certificado: respuesta ? inst.candidatos.map((c) => (set.has(c.id) ? 1 : 0)) : null,
    optimo: r.valor,
    nodos: r.cont.visitados,
  };
}

/**
 * De la decisión a la optimización: con un decisor para cualquier B se halla el
 * óptimo por búsqueda binaria sobre B ∈ [0, Σv]. Hace ⌈log₂(Σv + 1)⌉ + O(1) llamadas,
 * un número polinómico en L.
 */
export function optimoPorBusquedaBinaria(
  inst: Instancia,
  decisor: (B: bigint) => boolean,
): { optimo: bigint; llamadas: number; pasos: { lo: bigint; hi: bigint; B: bigint; respuesta: boolean }[] } {
  let lo = 0n; // siempre SÍ: la selección vacía tiene beneficio 0 ≥ 0
  let hi = 0n;
  for (const c of inst.candidatos) hi += c.v;
  const pasos: { lo: bigint; hi: bigint; B: bigint; respuesta: boolean }[] = [];
  let llamadas = 0;
  // Invariante: decisor(lo) = SÍ y el óptimo está en [lo, hi].
  while (lo < hi) {
    const mid = (lo + hi + 1n) / 2n;
    llamadas++;
    const resp = decisor(mid);
    pasos.push({ lo, hi, B: mid, respuesta: resp });
    if (resp) lo = mid;
    else hi = mid - 1n;
  }
  return { optimo: lo, llamadas, pasos };
}

export function instanciaDesde(candidatos: Candidato[], W: bigint): Instancia {
  return { candidatos, W };
}
