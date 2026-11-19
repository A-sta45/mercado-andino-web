import { describe, expect, it } from 'vitest';
import { avido } from '../src/algorithms/avido';
import { dp, dpSoloValor, ErrorTablaGrande } from '../src/algorithms/dp';
import { exhaustivo } from '../src/algorithms/exhaustivo';
import { MT19937 } from '../src/algorithms/generador';
import { ramificacionPoda, relajacion } from '../src/algorithms/ramificacionPoda';
import { mergeSort } from '../src/algorithms/mergeSort';
import { aMapa } from '../src/algorithms/tipos';
import { verificar } from '../src/algorithms/verificar';
import {
  CONTRAEJEMPLO_ABC,
  CONTRAEJEMPLO_MA,
  CONTRAEJEMPLO_MA2,
  INSTANCIA_T1,
  SELECCION_OPTIMA,
} from '../src/data/tablas';
import { instanciaPrueba } from './ayudas';

const C1 = aMapa(INSTANCIA_T1.candidatos);

describe('ávido', () => {
  it('Tabla 1: recorrido v/w da 735.000 (coincide con el óptimo en esta instancia)', () => {
    const r = avido(INSTANCIA_T1.candidatos, 50n);
    expect(r.seleccion).toEqual(['P07', 'P01', 'P08', 'P11', 'P03']);
    expect(r.valor).toBe(735000n);
    expect(verificar(C1, r.seleccion, 50n).resultado).toBe(true);
  });
  it('contraejemplo W = 10, A(6,7), B(5,5), C(5,5): ávido 7, óptimo 10', () => {
    const C = aMapa(CONTRAEJEMPLO_ABC.candidatos);
    const a = avido(CONTRAEJEMPLO_ABC.candidatos, 10n);
    const e = exhaustivo(C, 10n);
    expect(a.valor).toBe(7n);
    expect(a.seleccion).toEqual(['A']);
    expect(e.valor).toBe(10n);
    expect(e.seleccion).toEqual(['B', 'C']);
  });
  it('contraejemplos con Mercado Andino (Tabla 1 con W = 12, y {P01, P04, P07} con W = 12)', () => {
    const a = avido(CONTRAEJEMPLO_MA.candidatos, 12n);
    const e = exhaustivo(aMapa(CONTRAEJEMPLO_MA.candidatos), 12n);
    expect([a.valor, a.seleccion]).toEqual([162000n, ['P07', 'P09']]);
    expect([e.valor, e.seleccion]).toEqual([180000n, ['P01']]);
    const a2 = avido(CONTRAEJEMPLO_MA2.candidatos, 12n);
    const e2 = exhaustivo(aMapa(CONTRAEJEMPLO_MA2.candidatos), 12n);
    expect([a2.valor, e2.valor]).toEqual([170000n, 180000n]);
  });
  it('factibilidad en 300 instancias aleatorias (nunca supera W ni repite, y ≤ óptimo)', () => {
    const rng = new MT19937(7);
    for (let k = 0; k < 300; k++) {
      const inst = instanciaPrueba(rng, 12);
      const C = aMapa(inst.candidatos);
      const a = avido(inst.candidatos, inst.W);
      const v = verificar(C, a.seleccion, inst.W);
      expect(v.resultado).toBe(true);
      expect(v.beneficio).toBe(a.valor);
      expect(a.valor <= exhaustivo(C, inst.W).valor).toBe(true);
    }
  });
});

describe('programación dinámica', () => {
  it('Tabla 1: F(12, 50) = 735.000 y reconstrucción de ids', () => {
    const r = dp(C1, 50n);
    expect(r.valor).toBe(735000n);
    expect(r.seleccion).toEqual(SELECCION_OPTIMA);
    expect(r.consumo).toBe(50n);
    expect(r.cont.celdas).toBe(13 * 51);
    expect(r.cont.celdasCalculadas).toBe(12 * 50);
    expect(r.tabla[0].every((x) => x === 0n)).toBe(true);
    expect(r.tabla.every((fila) => fila[0] === 0n)).toBe(true);
    expect(r.camino[0]).toEqual({ i: 12, c: 50, incluye: false });
    expect(verificar(C1, r.seleccion, 50n).resultado).toBe(true);
    expect(dpSoloValor(C1, 50n).valor).toBe(735000n);
  });
  it('rechaza tablas demasiado grandes', () => {
    expect(() => dp(C1, 10n ** 12n)).toThrow(ErrorTablaGrande);
  });
  it('igual al exhaustivo en 300 instancias aleatorias (n ≤ 14), con reconstrucción verificada', () => {
    const rng = new MT19937(2026);
    let probadas = 0;
    while (probadas < 300) {
      const inst = instanciaPrueba(rng, 14);
      if (inst.W > 20000n) continue; // la DP es pseudopolinomial: W enorme no cabe en memoria
      probadas++;
      const C = aMapa(inst.candidatos);
      const e = exhaustivo(C, inst.W);
      const d = dp(C, inst.W);
      expect(d.valor).toBe(e.valor);
      expect(dpSoloValor(C, inst.W).valor).toBe(e.valor);
      const v = verificar(C, d.seleccion, inst.W);
      expect(v.resultado).toBe(true);
      expect(v.beneficio).toBe(d.valor);
      expect(v.consumo).toBe(d.consumo);
    }
  });
});

describe('ramificación y poda', () => {
  it('relajación fraccionaria exacta', () => {
    const { ordenados } = mergeSort(INSTANCIA_T1.candidatos);
    const r = relajacion(ordenados, 0, 49n);
    // P07+P01+P08+P11 = 35 kg, 525.000; de P03 caben 14 de 15 kg → 14·210000/15
    expect(r.entero).toBe(525000n);
    expect([r.num, r.den]).toEqual([14n * 210000n, 15n]);
  });
  it('Tabla 1: 735.000; con ávido inicial la raíz se poda (cota = mejor)', () => {
    const r = ramificacionPoda(INSTANCIA_T1.candidatos, 50n);
    expect(r.valor).toBe(735000n);
    expect(r.cont.visitados).toBe(1);
    expect(r.nodos[0].estado).toBe('podado-cota');
    const sin = ramificacionPoda(INSTANCIA_T1.candidatos, 50n, { inicial: 'cero' });
    expect(sin.valor).toBe(735000n);
    expect(sin.cont.visitados).toBeGreaterThan(5);
    expect([...sin.seleccion].sort()).toEqual(SELECCION_OPTIMA);
    expect(verificar(C1, sin.seleccion, 50n).resultado).toBe(true);
  });
  it('contraejemplos del ávido: RyP encuentra el óptimo', () => {
    for (const inst of [CONTRAEJEMPLO_ABC, CONTRAEJEMPLO_MA, CONTRAEJEMPLO_MA2]) {
      const C = aMapa(inst.candidatos);
      const r = ramificacionPoda(inst.candidatos, inst.W);
      expect(r.valor).toBe(exhaustivo(C, inst.W).valor);
      expect(r.valor > r.inicial.valor).toBe(true);
      expect(verificar(C, r.seleccion, inst.W).beneficio).toBe(r.valor);
    }
  });
  it('igual al exhaustivo en 300 instancias aleatorias (n ≤ 14), con empates y BigInt grandes, en ambos modos de cota', () => {
    const rng = new MT19937(31337);
    for (let k = 0; k < 300; k++) {
      const inst = instanciaPrueba(rng, 14);
      const C = aMapa(inst.candidatos);
      const e = exhaustivo(C, inst.W);
      for (const modoCota of ['racional', 'piso'] as const)
        for (const inicial of ['avido', 'cero'] as const) {
          const r = ramificacionPoda(inst.candidatos, inst.W, { modoCota, inicial, maxRegistro: 0 });
          expect(r.valor).toBe(e.valor);
          const v = verificar(C, r.seleccion, inst.W);
          expect(v.resultado).toBe(true);
          expect(v.beneficio).toBe(r.valor);
        }
    }
  });
  it('la cota nunca subestima: en cada nodo registrado, cota ≥ mejor completación', () => {
    const rng = new MT19937(99);
    for (let k = 0; k < 40; k++) {
      const inst = instanciaPrueba(rng, 9);
      const r = ramificacionPoda(inst.candidatos, inst.W, { inicial: 'cero' });
      for (const nodo of r.nodos) {
        if (!nodo.cota) continue;
        // mejor completación desde el nodo: exhaustivo sobre los restantes con la capacidad restante
        const restantes = r.orden.slice(nodo.nivel);
        const sub = exhaustivo(aMapa(restantes), inst.W - nodo.peso).valor + nodo.valor;
        expect(sub * nodo.cota.den <= nodo.cota.num).toBe(true);
      }
    }
  });
});
