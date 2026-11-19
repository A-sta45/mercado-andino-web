import { describe, expect, it } from 'vitest';
import { aEntero, validar, ErrorValor } from '../src/algorithms/validar';
import { verificar } from '../src/algorithms/verificar';
import { exhaustivo, fuerzaBruta } from '../src/algorithms/exhaustivo';
import { estaOrdenada, mergeSort, movimientosTeoricos } from '../src/algorithms/mergeSort';
import { MT19937, generarInstancia, semillaE2 } from '../src/algorithms/generador';
import { aMapa, type Candidato } from '../src/algorithms/tipos';
import { CANDIDATOS_T1, TABLA1, TABLA2, OPTIMO_PROYECTO, SELECCION_OPTIMA } from '../src/data/tablas';

const CRUDOS = [...TABLA1, ...TABLA2];
const { C } = validar(CRUDOS, 50);

describe('validar (Tabla 3)', () => {
  it('D1: 16 registros → 12 válidos y 4 excluidos', () => {
    const r = validar(CRUDOS, 50);
    expect(r.C.size).toBe(12);
    expect(r.excluidos.map((e) => e.motivo)).toEqual([
      'P13: consumo <= 0',
      'P14: dato faltante, no numerico o no entero',
      'ID vacio',
      'P03: duplicado',
    ]);
    expect(r.candidatos).toEqual(CANDIDATOS_T1);
  });
  it('D2: P05 en gramos 3500 → 4 kg', () => expect(C.get('P05')!.w).toBe(4n));
  it('D3: "$52.000" → 52000', () => expect(C.get('P09')!.v).toBe(52000n));
  it('D4: consumo 0 se excluye', () => {
    expect(validar([{ id: 'Z', consumo: 0, beneficio: 1 }], 5).excluidos[0].regla).toBe('consumo');
  });
  it('D5: beneficio 0 es válido', () => {
    expect(validar([{ id: 'Z', consumo: 3, beneficio: 0 }], 5).C.get('Z')).toEqual({ w: 3n, v: 0n });
  });
  it('D6: consumo 2,5 se excluye (no entero)', () => {
    expect(validar([{ id: 'Z', consumo: 2.5, beneficio: 1 }], 5).excluidos[0].regla).toBe('dato-invalido');
  });
  it('D7: beneficio faltante se excluye', () => {
    expect(validar([{ id: 'Z', consumo: 3 }], 5).excluidos[0].regla).toBe('dato-invalido');
  });
  it('D8 y D9: W = −1 y W = 50,5 lanzan error', () => {
    expect(() => validar([], -1)).toThrow(ErrorValor);
    expect(() => validar([], 50.5)).toThrow(ErrorValor);
    expect(() => validar([], true)).toThrow(ErrorValor);
    expect(() => validar([], '50')).toThrow(ErrorValor);
  });
  it('a_entero', () => {
    expect(aEntero('$52.000')).toBe(52000n);
    expect(aEntero(' 7 ')).toBe(7n);
    expect(aEntero(10n ** 30n)).toBe(10n ** 30n);
    expect(() => aEntero('abc')).toThrow();
    expect(() => aEntero(false)).toThrow();
  });
});

describe('verificar (Tabla 4) y operaciones (Tablas 6 y 13)', () => {
  const casos: [string, string[], bigint, boolean, bigint, bigint, string][] = [
    ['V1', [], 50n, true, 0n, 0n, 'normal'],
    ['V2', ['P06', 'P10', 'P02'], 50n, true, 46n, 585000n, 'normal'],
    ['V3', ['P01', 'P03', 'P07', 'P08', 'P04'], 50n, true, 49n, 710000n, 'normal'],
    ['V4', ['P06', 'P10', 'P01'], 50n, true, 50n, 670000n, 'normal'],
    ['V5', ['P06', 'P10', 'P03'], 50n, false, 53n, 700000n, 'R3'],
    ['V6', ['P06'], 10n, false, 20n, 260000n, 'R3'],
    ['V7', ['P01', 'P99'], 50n, false, 12n, 180000n, 'R1'],
    ['V8', ['P13'], 50n, false, 0n, 0n, 'R1'],
    ['V9', ['P01', 'P01'], 50n, false, 12n, 180000n, 'R2'],
    ['V10', ['P06', 'P10', 'P03', 'P99'], 50n, false, 53n, 700000n, 'R3'],
    ['V11', [], 0n, true, 0n, 0n, 'normal'],
    ['V12', ['P04'], 0n, false, 5n, 60000n, 'R3'],
    ['V13', ['P05', 'P09'], 50n, true, 8n, 100000n, 'normal'],
  ];
  for (const [id, S, W, ok, c, b, ret] of casos)
    it(id, () => {
      const r = verificar(C, S, W);
      expect([r.resultado, r.consumo, r.beneficio, r.retorno]).toEqual([ok, c, b, ret]);
    });

  it('Tabla 6: fórmulas 11k+1, 11j+2, 11j+3, 11j+10', () => {
    expect(verificar(C, ['P01', 'P03', 'P07', 'P08', 'P04'], 50n).ops.total).toBe(56); // V3
    expect(verificar(C, ['P06', 'P10', 'P03', 'P99'], 50n).ops.total).toBe(32); // V10
    expect(verificar(C, ['P01', 'P99'], 50n).ops.total).toBe(11 * 1 + 2);
    expect(verificar(C, ['P01', 'P01'], 50n).ops.total).toBe(11 * 1 + 3);
    expect(verificar(C, [], 50n).ops.total).toBe(1);
    const r = verificar(C, ['P06', 'P10', 'P03'], 50n);
    expect(r.ops).toEqual({ comparaciones: 6, consultas: 12, sumas: 8, inserciones: 6, total: 32 });
  });

  it('Tabla 13: beneficio, brecha y operaciones de verificar', () => {
    const t13: [string[], bigint, bigint, number][] = [
      [['P06', 'P10', 'P02'], 46n, 585000n, 34],
      [['P01', 'P03', 'P07', 'P08', 'P04'], 49n, 710000n, 56],
      [['P06', 'P10', 'P01'], 50n, 670000n, 34],
      [['P05', 'P09', 'P04', 'P11', 'P07', 'P02', 'P12'], 43n, 570000n, 78],
      [['P07', 'P01', 'P08', 'P11', 'P03'], 50n, 735000n, 56],
    ];
    const brechas = ['20,41', '3,40', '8,84', '22,45', '0,00'];
    t13.forEach(([S, c, b, ops], k) => {
      const r = verificar(C, S, 50n);
      expect([r.resultado, r.consumo, r.beneficio, r.ops.total]).toEqual([true, c, b, ops]);
      const brecha = ((OPTIMO_PROYECTO - b) * 10000n * 10n) / OPTIMO_PROYECTO; // ×1000 de %
      const redondeo = (brecha + 5n) / 10n;
      expect(`${redondeo / 100n},${String(redondeo % 100n).padStart(2, '0')}`).toBe(brechas[k]);
    });
    const control = verificar(C, ['P06', 'P10', 'P03'], 50n);
    expect([control.resultado, control.retorno, control.ops.total]).toEqual([false, 'R3', 32]);
  });
});

describe('exhaustivo (Tabla 7)', () => {
  it('E1: W = 50 → 735.000 con [P01, P03, P07, P08, P11], 3.483 llamadas, profundidad 13', () => {
    const r = exhaustivo(C, 50n);
    expect(r.valor).toBe(735000n);
    expect(r.seleccion).toEqual(SELECCION_OPTIMA);
    expect(r.consumo).toBe(50n);
    expect(r.cont.llamadas).toBe(3483);
    expect(r.cont.prof_max).toBe(13);
    expect(verificar(C, r.seleccion, 50n).resultado).toBe(true);
  });
  it('E2: W = 0 → [] con 13 llamadas', () => {
    const r = exhaustivo(C, 0n);
    expect([r.valor, r.seleccion, r.consumo, r.cont.llamadas]).toEqual([0n, [], 0n, 13]);
  });
  it('E3: W = 4 → [P09], 52.000, 25 llamadas', () => {
    const r = exhaustivo(C, 4n);
    expect([r.valor, r.seleccion, r.consumo, r.cont.llamadas]).toEqual([52000n, ['P09'], 4n, 25]);
  });
  it('E4: W = 200 → los 12, 118 kg, 1.600.000, 8.191 llamadas', () => {
    const r = exhaustivo(C, 200n);
    expect([r.valor, r.seleccion.length, r.consumo, r.cont.llamadas]).toEqual([1600000n, 12, 118n, 8191]);
  });
  it('E5: C vacío → 1 llamada', () => {
    const r = exhaustivo(new Map(), 50n);
    expect([r.valor, r.seleccion, r.cont.llamadas]).toEqual([0n, [], 1]);
  });
  it('coincide con la enumeración de los 4096 subconjuntos', () => {
    for (const W of [0n, 4n, 12n, 25n, 50n, 77n, 200n]) expect(exhaustivo(C, W).valor).toBe(fuerzaBruta(C, W));
  });
  it('registra estados (i, r) repetidos', () => {
    const r = exhaustivo(C, 50n, { registrarEstados: true });
    let suma = 0;
    for (const v of r.estados!.values()) suma += v;
    expect(suma).toBe(3483);
    expect(r.estados!.size).toBeLessThan(3483);
  });
});

describe('merge sort (Tabla 8)', () => {
  it('orden v/w con empates por id, 29 comparaciones y 88 movimientos', () => {
    const r = mergeSort(CANDIDATOS_T1);
    expect(r.ordenados.map((c) => c.id)).toEqual([
      'P07', 'P01', 'P08', 'P11', 'P03', 'P12', 'P06', 'P09', 'P10', 'P04', 'P05', 'P02',
    ]);
    expect(r.cont.comparaciones).toBe(29);
    expect(r.cont.movimientos).toBe(88);
    expect(movimientosTeoricos(12)).toBe(88);
  });
  it('M(n) coincide con lo medido (n = 100 → 1.344, n = 5000 → 123.616)', () => {
    expect(movimientosTeoricos(100)).toBe(1344);
    expect(movimientosTeoricos(5000)).toBe(123616);
    for (const n of [0, 1, 2, 3, 7, 8, 100, 257]) {
      const inst = generarInstancia(n, semillaE2(n, 1));
      expect(mergeSort(inst.candidatos).cont.movimientos).toBe(movimientosTeoricos(n));
    }
  });
  it('casos borde: vacío, uno, dos invertidos, tres empates totales', () => {
    expect(mergeSort([]).ordenados).toEqual([]);
    const a: Candidato = { id: 'A', w: 1n, v: 1n };
    expect(mergeSort([a]).ordenados).toEqual([a]);
    const b: Candidato = { id: 'B', w: 1n, v: 5n };
    expect(mergeSort([a, b]).ordenados.map((x) => x.id)).toEqual(['B', 'A']);
    const t = ['C', 'A', 'B'].map((id) => ({ id, w: 2n, v: 4n }));
    expect(mergeSort(t).ordenados.map((x) => x.id)).toEqual(['A', 'B', 'C']);
  });
  it('300 listas aleatorias con empates y valores de 2^40: ordenada y conserva elementos', () => {
    const rng = new MT19937(20261119);
    for (let caso = 0; caso < 300; caso++) {
      const n = rng.randint(0, 60);
      const grande = caso % 3 === 0;
      const L: Candidato[] = [];
      for (let i = 0; i < n; i++) {
        const w = BigInt(rng.randint(1, 6)) * (grande ? 1n << 40n : 1n);
        const v = BigInt(rng.randint(0, 4)) * (grande ? (1n << 40n) + BigInt(rng.randint(0, 1)) : 1n);
        L.push({ id: 'I' + String(rng.randint(0, 9999)).padStart(4, '0') + '-' + i, w, v });
      }
      const r = mergeSort(L);
      expect(estaOrdenada(r.ordenados)).toBe(true);
      const clave = (c: Candidato) => `${c.id}|${c.w}|${c.v}`;
      expect(r.ordenados.map(clave).sort()).toEqual(L.map(clave).sort());
      // comparación con un sort de referencia (orden total estricto)
      const ref = [...L].sort((x, y) => {
        const a = x.v * y.w;
        const b = y.v * x.w;
        if (a !== b) return a > b ? -1 : 1;
        return x.id < y.id ? -1 : 1;
      });
      expect(r.ordenados).toEqual(ref);
      expect(r.cont.movimientos).toBe(movimientosTeoricos(n));
    }
  });
});

describe('generador (compatible con random de Python)', () => {
  it('reproduce random.seed + randint de CPython', () => {
    // Valores obtenidos con Python 3: random.seed(s); [randint(1,50)×4], [randint(0,500000)×3]
    const esperado: [bigint, number[], number[]][] = [
      [20271104n, [11, 32, 2, 45], [209028, 188012, 332940]],
      [1n, [9, 37, 49, 5], [133729, 61823, 259750]],
      [(1n << 40n) + 7n, [40, 48, 41, 37], [369934, 249521, 131514]],
    ];
    for (const [s, ws, vs] of esperado) {
      const r = new MT19937(s);
      expect([0, 1, 2, 3].map(() => r.randint(1, 50))).toEqual(ws);
      expect([0, 1, 2].map(() => r.randint(0, 500000))).toEqual(vs);
    }
    const r = new MT19937(42);
    expect([0, 1, 2].map(() => r.genrandUint32())).toEqual([2746317213, 478163327, 107420369]);
  });
  it('W = ⌊Σw/2⌋ y rangos', () => {
    const inst = generarInstancia(40, semillaE2(40, 3));
    let s = 0n;
    for (const c of inst.candidatos) {
      expect(c.w >= 1n && c.w <= 50n).toBe(true);
      expect(c.v >= 0n && c.v <= 500000n).toBe(true);
      s += c.w;
    }
    expect(inst.W).toBe(s / 2n);
    expect(generarInstancia(40, semillaE2(40, 3))).toEqual(inst);
  });
});

export { aMapa };
