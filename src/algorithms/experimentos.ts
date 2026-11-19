/**
 * Experimentos de la Comparación (lógica pura; los ejecuta el Web Worker).
 */
import { avido } from './avido';
import { celdasDP, dp, dpSoloValor, LIMITE_CELDAS } from './dp';
import { exhaustivo } from './exhaustivo';
import { generarInstancia, semillaE2 } from './generador';
import { ramificacionPoda } from './ramificacionPoda';
import { aMapa, type Candidato, type Instancia } from './tipos';
import { verificar } from './verificar';

export const LIMITE_N_EXHAUSTIVO = 22;

export type Algoritmo = 'exhaustivo' | 'avido' | 'dp' | 'ryp';

export interface FilaComparacion {
  alg: Algoritmo;
  ejecutado: boolean;
  motivoNoEjecutado?: string;
  valor?: bigint;
  seleccion?: string[];
  verificado?: boolean;
  /** operaciones principales (llamadas, celdas o nodos) */
  operaciones?: number;
  unidad: string;
  detalle?: string;
  tiempoMs?: number;
  memoria?: string;
}

function mediana(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * Mide la mediana de `reps` repeticiones. Los navegadores redondean performance.now()
 * (≈ 0,1 ms sin aislamiento entre orígenes), así que cada repetición ejecuta el algoritmo
 * k veces seguidas hasta acumular ≥ 10 ms y divide entre k.
 */
function medir<T>(f: () => T, reps: number): { r: T; ms: number } {
  let r!: T;
  let k = 1;
  for (;;) {
    const t0 = performance.now();
    for (let i = 0; i < k; i++) r = f();
    const dt = performance.now() - t0;
    if (dt >= 10 || k >= 1 << 16) break;
    k *= dt < 1 ? 16 : 2;
  }
  const tiempos: number[] = [];
  for (let i = 0; i < reps; i++) {
    const t0 = performance.now();
    for (let j = 0; j < k; j++) r = f();
    tiempos.push((performance.now() - t0) / k);
  }
  return { r, ms: mediana(tiempos) };
}

export function comparar(inst: Instancia, reps = 3): FilaComparacion[] {
  const C = aMapa(inst.candidatos);
  const n = inst.candidatos.length;
  const filas: FilaComparacion[] = [];
  const ok = (sel: string[], v: bigint) => {
    const r = verificar(C, sel, inst.W);
    return r.resultado && r.beneficio === v;
  };

  if (n <= LIMITE_N_EXHAUSTIVO) {
    const { r, ms } = medir(() => exhaustivo(C, inst.W), n >= 18 ? 1 : reps);
    filas.push({
      alg: 'exhaustivo',
      ejecutado: true,
      valor: r.valor,
      seleccion: r.seleccion,
      verificado: ok(r.seleccion, r.valor),
      operaciones: r.cont.llamadas,
      unidad: 'llamadas',
      detalle: `${r.cont.comparaciones} comparaciones · máx. 2^(n+1) − 1 = ${2 ** (n + 1) - 1}`,
      tiempoMs: ms,
      memoria: `pila de ${r.cont.prof_max} marcos; O(n²) referencias`,
    });
  } else
    filas.push({
      alg: 'exhaustivo',
      ejecutado: false,
      unidad: 'llamadas',
      motivoNoEjecutado: `Solo se ejecuta con n ≤ ${LIMITE_N_EXHAUSTIVO} para no bloquear el navegador.`,
    });

  {
    const { r, ms } = medir(() => avido(inst.candidatos, inst.W), reps);
    filas.push({
      alg: 'avido',
      ejecutado: true,
      valor: r.valor,
      seleccion: r.seleccion,
      verificado: ok(r.seleccion, r.valor),
      operaciones: r.operaciones,
      unidad: 'operaciones',
      detalle: `${r.contMerge.comparaciones} comp. + ${r.contMerge.movimientos} mov. del orden + ${r.comparacionesRecorrido} del recorrido`,
      tiempoMs: ms,
      memoria: `${2 * n} referencias (A y aux)`,
    });
  }

  const celdas = celdasDP(n, inst.W);
  if (celdas <= LIMITE_CELDAS) {
    const { r, ms } = medir(() => dp(C, inst.W), reps);
    filas.push({
      alg: 'dp',
      ejecutado: true,
      valor: r.valor,
      seleccion: r.seleccion,
      verificado: ok(r.seleccion, r.valor),
      operaciones: r.cont.celdas,
      unidad: 'celdas',
      detalle: `(n+1)(W+1) = ${n + 1}·${inst.W + 1n}`,
      tiempoMs: ms,
      memoria: `${r.cont.celdas} celdas (Θ(W) = ${inst.W + 1n} si solo se guarda el valor)`,
    });
  } else
    filas.push({
      alg: 'dp',
      ejecutado: false,
      unidad: 'celdas',
      operaciones: Number(celdas),
      motivoNoEjecutado: `La tabla tendría ${celdas} celdas (límite ${LIMITE_CELDAS}).`,
    });

  {
    const { r, ms } = medir(() => ramificacionPoda(inst.candidatos, inst.W, { maxRegistro: 0, maxNodos: 3_000_000 }), reps);
    filas.push({
      alg: 'ryp',
      ejecutado: true,
      valor: r.valor,
      seleccion: r.seleccion,
      verificado: ok(r.seleccion, r.valor) && !r.incompleto,
      operaciones: r.cont.visitados,
      unidad: 'nodos',
      detalle: `${r.cont.podadosCota} podas por cota · ${r.cont.podadosCapacidad} por capacidad · ${r.cont.pasosCota} pasos de cota${r.incompleto ? ' · DETENIDO por límite' : ''}`,
      tiempoMs: ms,
      memoria: `pila de ${r.cont.profundidadMax + 1} marcos + ${2 * n} referencias del orden`,
    });
  }
  return filas;
}

export interface PuntoCrecimiento {
  n: number;
  exhaustivo: number | null;
  avido: number;
  dp: number;
  ryp: number;
  W: number;
}

/** Operaciones frente a n (mediana de `instancias` instancias con semillas de la Entrega 2). */
export function crecimiento(ns: number[], instancias = 3): PuntoCrecimiento[] {
  return ns.map((n) => {
    const ex: number[] = [];
    const av: number[] = [];
    const d: number[] = [];
    const ry: number[] = [];
    const Ws: number[] = [];
    for (let j = 1; j <= instancias; j++) {
      const inst = generarInstancia(n, semillaE2(n, j));
      if (n <= LIMITE_N_EXHAUSTIVO) ex.push(exhaustivo(aMapa(inst.candidatos), inst.W).cont.llamadas);
      av.push(avido(inst.candidatos, inst.W).operaciones);
      d.push(Number(celdasDP(n, inst.W)));
      ry.push(ramificacionPoda(inst.candidatos, inst.W, { maxRegistro: 0 }).cont.visitados);
      Ws.push(Number(inst.W));
    }
    return {
      n,
      exhaustivo: ex.length ? mediana(ex) : null,
      avido: mediana(av),
      dp: mediana(d),
      ryp: mediana(ry),
      W: mediana(Ws),
    };
  });
}

export interface PuntoDpVsW {
  k: number;
  W: bigint;
  bitsW: number;
  celdas: bigint;
  ryp: number;
  tiempoDpMs: number | null;
  valor: bigint;
}

/**
 * DP frente a W con n fijo: la MISMA instancia con todos los pesos y W multiplicados
 * por 2^k. La respuesta no cambia; las celdas de la DP se duplican con cada k y los nodos
 * de ramificación y poda no cambian.
 */
export function dpVsW(n: number, ks: number[]): PuntoDpVsW[] {
  const base = generarInstancia(n, semillaE2(n, 1));
  return ks.map((k) => {
    const f = 1n << BigInt(k);
    const cands: Candidato[] = base.candidatos.map((c) => ({ ...c, w: c.w * f }));
    const W = base.W * f;
    const celdas = celdasDP(n, W);
    let tiempo: number | null = null;
    let valor: bigint;
    const bb = ramificacionPoda(cands, W, { maxRegistro: 0 });
    valor = bb.valor;
    if (celdas <= LIMITE_CELDAS) {
      const t0 = performance.now();
      valor = dpSoloValor(aMapa(cands), W, LIMITE_CELDAS).valor;
      tiempo = performance.now() - t0;
    }
    return { k, W, bitsW: W.toString(2).length, celdas, ryp: bb.cont.visitados, tiempoDpMs: tiempo, valor };
  });
}

export interface ResumenBrechas {
  n: number;
  instancias: number;
  optimas: number;
  brechaMediaPorMil: number;
  brechaMaxPorMil: number;
  peor: { semilla: number; avido: bigint; optimo: bigint } | null;
  /** nodos RyP vs llamadas exhaustivo por instancia */
  pares: { semilla: number; exhaustivo: number; ryp: number; celdas: number }[];
}

/** Ávido frente al óptimo en muchas instancias aleatorias (óptimo del exhaustivo). */
export function brechas(n: number, cantidad: number, semillaBase: number): ResumenBrechas {
  let optimas = 0;
  let suma = 0;
  let max = 0;
  let peor: ResumenBrechas['peor'] = null;
  const pares: ResumenBrechas['pares'] = [];
  for (let j = 0; j < cantidad; j++) {
    const semilla = semillaBase + j;
    const inst = generarInstancia(n, semilla);
    const e = exhaustivo(aMapa(inst.candidatos), inst.W);
    const a = avido(inst.candidatos, inst.W);
    const r = ramificacionPoda(inst.candidatos, inst.W, { maxRegistro: 0 });
    if (r.valor !== e.valor) throw new Error('RyP difiere del exhaustivo');
    const b = e.valor === 0n ? 0 : Number(((e.valor - a.valor) * 100000n) / e.valor) / 100; // por mil
    if (a.valor === e.valor) optimas++;
    suma += b;
    if (b >= max) {
      max = b;
      peor = { semilla, avido: a.valor, optimo: e.valor };
    }
    pares.push({ semilla, exhaustivo: e.cont.llamadas, ryp: r.cont.visitados, celdas: Number(celdasDP(n, inst.W)) });
  }
  return { n, instancias: cantidad, optimas, brechaMediaPorMil: suma / cantidad, brechaMaxPorMil: max, peor, pares };
}
