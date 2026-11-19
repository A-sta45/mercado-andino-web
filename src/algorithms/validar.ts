/**
 * validar y a_entero: traducción a TypeScript de las funciones del Punto 3 de la
 * Entrega 1, conservando su lógica (orden de las reglas y motivos de exclusión).
 */
import { pisoDiv } from './bigint';
import type { Candidato, MapaCandidatos } from './tipos';

export class ErrorValor extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'ErrorValor';
  }
}

/**
 * Convierte entero, número entero o texto tipo '$52.000' a BigInt. Lanza ErrorValor si no se puede.
 * Igual que en Python: en el texto se quitan '$', '.' (el punto separa miles en COP) y espacios.
 */
export function aEntero(x: unknown): bigint {
  if (typeof x === 'boolean') throw new ErrorValor('booleano no es numero');
  if (typeof x === 'bigint') return x;
  if (typeof x === 'number') {
    if (Number.isInteger(x)) return BigInt(x);
    throw new ErrorValor('no es entero');
  }
  if (x === undefined) throw new ErrorValor('dato faltante');
  const t = String(x).replace(/\$/g, '').replace(/\./g, '').replace(/ /g, '').trim();
  if (!/^[+-]?\d+$/.test(t)) throw new ErrorValor(`invalid literal for int(): '${String(x)}'`);
  return BigInt(t);
}

/** Registro crudo: {id, consumo, beneficio, unidad opcional}. */
export interface Crudo {
  id?: unknown;
  consumo?: unknown;
  beneficio?: unknown;
  unidad?: string;
}

export type ReglaExclusion = 'id-vacio' | 'duplicado' | 'dato-invalido' | 'consumo' | 'beneficio';

export interface Exclusion {
  /** posición del registro en la lista cruda (0-indexada) */
  indice: number;
  id: string;
  regla: ReglaExclusion;
  /** mensaje igual al del PDF */
  motivo: string;
}

export interface ResultadoValidar {
  C: MapaCandidatos;
  candidatos: Candidato[];
  excluidos: Exclusion[];
  W: bigint;
}

/** Valida la capacidad: entero ≥ 0 (no booleano). Lanza ErrorValor si no. */
export function validarCapacidad(W: unknown): bigint {
  if (typeof W === 'boolean') throw new ErrorValor('Capacidad W invalida (entero >= 0)');
  let w: bigint;
  if (typeof W === 'bigint') w = W;
  else if (typeof W === 'number' && Number.isInteger(W)) w = BigInt(W);
  else throw new ErrorValor('Capacidad W invalida (entero >= 0)');
  if (w < 0n) throw new ErrorValor('Capacidad W invalida (entero >= 0)');
  return w;
}

export function validar(crudos: Crudo[], W: unknown): ResultadoValidar {
  const cap = validarCapacidad(W);
  const C: MapaCandidatos = new Map();
  const candidatos: Candidato[] = [];
  const excluidos: Exclusion[] = [];

  crudos.forEach((p, indice) => {
    const pid = p.id === undefined || p.id === null ? '' : String(p.id).trim();
    if (pid === '') {
      excluidos.push({ indice, id: '', regla: 'id-vacio', motivo: 'ID vacio' });
      return;
    }
    if (C.has(pid)) {
      excluidos.push({ indice, id: pid, regla: 'duplicado', motivo: `${pid}: duplicado` });
      return;
    }
    let c: bigint;
    let b: bigint;
    try {
      c = aEntero(p.consumo);
      b = aEntero(p.beneficio);
    } catch {
      excluidos.push({
        indice,
        id: pid,
        regla: 'dato-invalido',
        motivo: `${pid}: dato faltante, no numerico o no entero`,
      });
      return;
    }
    if (p.unidad === 'g') c = -pisoDiv(-c, 1000n); // g → kg, redondeo hacia arriba
    if (c <= 0n) {
      excluidos.push({ indice, id: pid, regla: 'consumo', motivo: `${pid}: consumo <= 0` });
      return;
    }
    if (b < 0n) {
      excluidos.push({ indice, id: pid, regla: 'beneficio', motivo: `${pid}: beneficio < 0` });
      return;
    }
    C.set(pid, { w: c, v: b });
    candidatos.push({ id: pid, w: c, v: b });
  });

  return { C, candidatos, excluidos, W: cap };
}
