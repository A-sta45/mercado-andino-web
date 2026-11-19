import { describe, expect, it } from 'vitest';
import { bits } from '../src/algorithms/bigint';
import { decidir, longitudEntrada, optimoPorBusquedaBinaria, verificarCertificado } from '../src/algorithms/decision';
import { exhaustivo } from '../src/algorithms/exhaustivo';
import { MT19937 } from '../src/algorithms/generador';
import {
  EJEMPLO_NO,
  EJEMPLO_SI,
  reducir,
  resolverSubsetSum,
  validarSubsetSum,
  type InstanciaSubsetSum,
} from '../src/algorithms/subsetSum';
import { aMapa } from '../src/algorithms/tipos';
import { INSTANCIA_T1, SELECCION_OPTIMA } from '../src/data/tablas';

describe('verificador de certificados', () => {
  const x = INSTANCIA_T1.candidatos.map((c) => (SELECCION_OPTIMA.includes(c.id) ? 1 : 0)) as (0 | 1)[];
  it('acepta el óptimo con B = 735.000 y lo rechaza con B = 735.001', () => {
    const r = verificarCertificado(INSTANCIA_T1, x, 735000n);
    expect([r.acepta, r.consumo, r.beneficio, r.bitsCertificado]).toEqual([true, 50n, 735000n, 12]);
    expect(verificarCertificado(INSTANCIA_T1, x, 735001n).acepta).toBe(false);
  });
  it('rechaza si excede W y si la longitud no es n', () => {
    const todos = INSTANCIA_T1.candidatos.map(() => 1 as const);
    const r = verificarCertificado(INSTANCIA_T1, todos, 0n);
    expect([r.acepta, r.cumpleCapacidad, r.cumpleUmbral]).toEqual([false, false, true]);
    expect(verificarCertificado(INSTANCIA_T1, [1, 0], 0n).acepta).toBe(false);
  });
  it('operaciones O(n): a lo sumo 4n + 3', () => {
    const r = verificarCertificado(INSTANCIA_T1, x, 1n);
    expect(r.ops.total).toBe(12 + 12 + 1 + 2 + 2 * 5);
    expect(r.ops.total <= 4 * 12 + 3).toBe(true);
    const L = longitudEntrada(INSTANCIA_T1, 1n);
    expect(r.bitsMaxSumas <= L.L).toBe(true);
  });
  it('longitud de la entrada L', () => {
    const inst = { candidatos: [{ id: 'a', w: 5n, v: 0n }], W: 8n };
    // bits(5)=3, bits(0)=1, bits(8)=4, bits(3)=2
    expect(longitudEntrada(inst, 3n).L).toBe(3 + 1 + 4 + 2);
  });
  it('búsqueda binaria sobre B encuentra el óptimo con ⌈log₂(Σv+1)⌉ llamadas aprox.', () => {
    const C = aMapa(INSTANCIA_T1.candidatos);
    const opt = exhaustivo(C, 50n).valor;
    const r = optimoPorBusquedaBinaria(INSTANCIA_T1, (B) => opt >= B);
    expect(r.optimo).toBe(735000n);
    expect(r.llamadas <= bits(1600000n) + 1).toBe(true);
    const r2 = optimoPorBusquedaBinaria(INSTANCIA_T1, (B) => decidir(INSTANCIA_T1, B).respuesta);
    expect(r2.optimo).toBe(735000n);
  });
});

describe('reducción SUBSET SUM ≤p DECISIÓN', () => {
  it('instancia SÍ {3,5,7,11}, T = 15', () => {
    const ss = resolverSubsetSum(EJEMPLO_SI);
    expect(ss.respuesta).toBe(true);
    expect(ss.testigo!.reduce((s, i) => s + EJEMPLO_SI.a[i], 0n)).toBe(15n);
    const red = reducir(EJEMPLO_SI);
    expect(red.instancia.W).toBe(15n);
    expect(red.B).toBe(15n);
    expect(red.instancia.candidatos.every((c, i) => c.w === EJEMPLO_SI.a[i] && c.v === EJEMPLO_SI.a[i])).toBe(true);
    const d = decidir(red.instancia, red.B);
    expect(d.respuesta).toBe(true);
    const cert = verificarCertificado(red.instancia, d.certificado!, red.B);
    expect(cert.acepta).toBe(true);
    expect(cert.consumo).toBe(15n); // consumo = beneficio = T exactamente
  });
  it('instancia NO {4,6,10}, T = 7', () => {
    expect(resolverSubsetSum(EJEMPLO_NO).respuesta).toBe(false);
    const red = reducir(EJEMPLO_NO);
    expect(decidir(red.instancia, red.B).respuesta).toBe(false);
  });
  it('tamaño lineal: bits después = 2 · bits antes', () => {
    const red = reducir(EJEMPLO_SI);
    expect(red.bitsAntes).toBe(2 + 3 + 3 + 4 + 4);
    expect(red.bitsDespues).toBe(2 * red.bitsAntes);
  });
  it('validación de la entrada', () => {
    expect(validarSubsetSum({ a: [0n, 3n], T: 2n }).length).toBe(1);
    expect(validarSubsetSum({ a: [1n], T: -1n }).length).toBe(1);
    expect(validarSubsetSum(EJEMPLO_SI)).toEqual([]);
  });
  it('200 instancias aleatorias: SUBSET SUM y la DECISIÓN transformada responden igual', () => {
    const rng = new MT19937(4);
    let si = 0;
    for (let k = 0; k < 200; k++) {
      const n = rng.randint(0, 12);
      const grande = k % 5 === 0;
      const a: bigint[] = [];
      for (let i = 0; i < n; i++)
        a.push(grande ? (1n << 60n) * BigInt(rng.randint(1, 30)) : BigInt(rng.randint(1, 40)));
      let total = 0n;
      for (const x of a) total += x;
      const T = grande
        ? (1n << 60n) * BigInt(rng.randint(0, 60))
        : BigInt(rng.randint(0, Number(total) + 3));
      const s: InstanciaSubsetSum = { a, T };
      const ss = resolverSubsetSum(s);
      const red = reducir(s);
      const d = decidir(red.instancia, red.B);
      expect(d.respuesta).toBe(ss.respuesta);
      if (ss.respuesta) {
        si++;
        expect(ss.testigo!.reduce((acc, i) => acc + a[i], 0n)).toBe(T);
        expect(verificarCertificado(red.instancia, d.certificado!, red.B).acepta).toBe(true);
      }
    }
    expect(si).toBeGreaterThan(20);
    expect(si).toBeLessThan(200);
  });
});
