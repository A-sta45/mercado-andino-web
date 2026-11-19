/**
 * Ramificación y poda sobre el árbol incluir/excluir en el orden v/w del merge sort.
 * - Mejor solución conocida inicializada con el ávido (o con 0, opcional).
 * - Cota de un nodo: beneficio actual + relajación fraccionaria de los restantes.
 * - La cota se calcula con racionales EXACTOS (BigInt); nunca con flotantes.
 * - Poda por capacidad (incluir no cabe) o por cota (cota ≤ mejor).
 * Peor caso: O(2^n) nodos × O(n) por cota = O(n·2^n), más Θ(n log n) del orden.
 */
import { pisoDiv, racional, type Racional } from './bigint';
import { avido } from './avido';
import { mergeSort } from './mergeSort';
import type { Candidato } from './tipos';

export type EstadoNodo =
  | 'expandido'
  | 'podado-cota'
  | 'podado-capacidad'
  | 'hoja';

export interface NodoBB {
  id: number;
  padre: number | null;
  /** nivel = número de candidatos ya decididos */
  nivel: number;
  /** decisión que llevó a este nodo */
  decision: 'raiz' | 'incluir' | 'excluir';
  /** candidato decidido en esta arista (orden v/w) */
  candidato: string | null;
  valor: bigint;
  peso: bigint;
  /** cota exacta (racional); null en nodos podados por capacidad o en hojas */
  cota: Racional | null;
  cotaPiso: bigint | null;
  mejorAlVisitar: bigint;
  /** true si al visitar este nodo mejoró la mejor solución conocida */
  mejora: boolean;
  estado: EstadoNodo;
}

export interface ResultadoBB {
  valor: bigint;
  seleccion: string[];
  consumo: bigint;
  orden: Candidato[];
  inicial: { valor: bigint; seleccion: string[]; origen: 'avido' | 'cero' };
  cont: {
    /** nodos en los que se entró (se calculó estado/cota) */
    visitados: number;
    podadosCota: number;
    podadosCapacidad: number;
    podados: number;
    hojas: number;
    profundidadMax: number;
    /** candidatos examinados al calcular todas las cotas */
    pasosCota: number;
    /** operaciones = visitados + pasos de cota + comparaciones y movimientos del orden */
    operaciones: number;
  };
  /** registro nodo por nodo (truncado a maxRegistro) */
  nodos: NodoBB[];
  registroTruncado: boolean;
  /** true si se detuvo por maxNodos (sin prueba de optimalidad) */
  incompleto: boolean;
}

export interface OpcionesBB {
  /** 'avido' (por defecto) o 'cero' */
  inicial?: 'avido' | 'cero';
  /** 'racional': poda si cota ≤ mejor (exacto). 'piso': poda si ⌊cota⌋ ≤ mejor (válido: beneficios enteros). */
  modoCota?: 'racional' | 'piso';
  maxRegistro?: number;
  maxNodos?: number;
}

/**
 * Relajación fraccionaria desde la posición k con capacidad r: enteros mientras quepan y
 * una fracción del siguiente. Devuelve parte entera acumulada + fracción num/den.
 */
export function relajacion(orden: readonly Candidato[], k: number, r: bigint) {
  let entero = 0n;
  let num = 0n;
  let den = 1n;
  let pasos = 0;
  let resto = r;
  for (let j = k; j < orden.length; j++) {
    pasos++;
    const { w, v } = orden[j];
    if (w <= resto) {
      resto -= w;
      entero += v;
    } else {
      num = v * resto;
      den = w;
      break;
    }
  }
  return { entero, num, den, pasos };
}

export function ramificacionPoda(candidatos: readonly Candidato[], W: bigint, op: OpcionesBB = {}): ResultadoBB {
  const modo = op.modoCota ?? 'racional';
  const maxRegistro = op.maxRegistro ?? 2000;
  const maxNodos = op.maxNodos ?? Infinity;
  const { ordenados: orden, cont: cm } = mergeSort(candidatos);
  const n = orden.length;

  let mejor = 0n;
  let mejorSel: number[] = [];
  let inicial: ResultadoBB['inicial'] = { valor: 0n, seleccion: [], origen: 'cero' };
  if ((op.inicial ?? 'avido') === 'avido') {
    const a = avido(candidatos, W);
    mejor = a.valor;
    const pos = new Map(orden.map((c, i) => [c.id, i]));
    mejorSel = a.seleccion.map((id) => pos.get(id)!);
    inicial = { valor: a.valor, seleccion: a.seleccion, origen: 'avido' };
  }

  const cont = {
    visitados: 0,
    podadosCota: 0,
    podadosCapacidad: 0,
    podados: 0,
    hojas: 0,
    profundidadMax: 0,
    pasosCota: 0,
    operaciones: 0,
  };
  const nodos: NodoBB[] = [];
  let siguienteId = 0;
  let registroTruncado = false;
  let incompleto = false;
  const sel: number[] = [];

  const registrar = (nodo: NodoBB) => {
    if (nodos.length < maxRegistro) nodos.push(nodo);
    else registroTruncado = true;
  };

  function visitar(
    k: number,
    valor: bigint,
    peso: bigint,
    padre: number | null,
    decision: NodoBB['decision'],
    candidato: string | null,
  ): void {
    if (cont.visitados >= maxNodos) {
      incompleto = true;
      return;
    }
    cont.visitados++;
    if (k > cont.profundidadMax) cont.profundidadMax = k;
    const id = siguienteId++;
    const mejorAlVisitar = mejor;
    let mejora = false;
    // Toda selección parcial es factible: si mejora a la mejor conocida, se guarda.
    if (valor > mejor) {
      mejor = valor;
      mejorSel = [...sel];
      mejora = true;
    }
    const nodo: NodoBB = {
      id,
      padre,
      nivel: k,
      decision,
      candidato,
      valor,
      peso,
      cota: null,
      cotaPiso: null,
      mejorAlVisitar,
      mejora,
      estado: 'expandido',
    };
    if (k === n) {
      cont.hojas++;
      nodo.estado = 'hoja';
      registrar(nodo);
      return;
    }
    const rel = relajacion(orden, k, W - peso);
    cont.pasosCota += rel.pasos;
    const cotaR = racional((valor + rel.entero) * rel.den + rel.num, rel.den);
    const piso = valor + rel.entero + pisoDiv(rel.num, rel.den);
    nodo.cota = cotaR;
    nodo.cotaPiso = piso;
    const podar = modo === 'piso' ? piso <= mejor : cotaR.num <= mejor * cotaR.den;
    if (podar) {
      cont.podadosCota++;
      nodo.estado = 'podado-cota';
      registrar(nodo);
      return;
    }
    registrar(nodo);
    const c = orden[k];
    // Rama INCLUIR (primero, para hallar pronto buenas soluciones)
    if (peso + c.w <= W) {
      sel.push(k);
      visitar(k + 1, valor + c.v, peso + c.w, id, 'incluir', c.id);
      sel.pop();
    } else {
      cont.podadosCapacidad++;
      registrar({
        id: siguienteId++,
        padre: id,
        nivel: k + 1,
        decision: 'incluir',
        candidato: c.id,
        valor: valor + c.v,
        peso: peso + c.w,
        cota: null,
        cotaPiso: null,
        mejorAlVisitar: mejor,
        mejora: false,
        estado: 'podado-capacidad',
      });
    }
    // Rama EXCLUIR
    visitar(k + 1, valor, peso, id, 'excluir', c.id);
  }

  visitar(0, 0n, 0n, null, 'raiz', null);
  cont.podados = cont.podadosCota + cont.podadosCapacidad;
  cont.operaciones = cont.visitados + cont.pasosCota + cm.comparaciones + cm.movimientos;
  const seleccion = mejorSel.map((i) => orden[i].id);
  let consumo = 0n;
  for (const i of mejorSel) consumo += orden[i].w;
  return { valor: mejor, seleccion, consumo, orden, inicial, cont, nodos, registroTruncado, incompleto };
}
