/** Datos de las Tablas 1 y 2 del PDF (Entrega 1) y contraejemplos de la Entrega 3. */
import type { Crudo } from '../algorithms/validar';
import type { Candidato, Instancia } from '../algorithms/tipos';

/** Tabla 1: 12 candidatos válidos (sintéticos). P05 llega en gramos y P09 como texto. */
export const TABLA1: Crudo[] = [
  { id: 'P01', consumo: 12, beneficio: 180000 },
  { id: 'P02', consumo: 8, beneficio: 95000 },
  { id: 'P03', consumo: 15, beneficio: 210000 },
  { id: 'P04', consumo: 5, beneficio: 60000 },
  { id: 'P05', consumo: 3500, beneficio: 48000, unidad: 'g' },
  { id: 'P06', consumo: 20, beneficio: 260000 },
  { id: 'P07', consumo: 7, beneficio: 110000 },
  { id: 'P08', consumo: 10, beneficio: 150000 },
  { id: 'P09', consumo: 4, beneficio: '$52.000' },
  { id: 'P10', consumo: 18, beneficio: 230000 },
  { id: 'P11', consumo: 6, beneficio: 85000 },
  { id: 'P12', consumo: 9, beneficio: 120000 },
];

/** Tabla 2: 4 entradas inválidas. */
export const TABLA2: Crudo[] = [
  { id: 'P13', consumo: -4, beneficio: 70000 },
  { id: 'P14', consumo: 6, beneficio: 'abc' },
  { id: '', consumo: 5, beneficio: 40000 },
  { id: 'P03', consumo: 15, beneficio: 210000 },
];

export const W_PROYECTO = 50n;
export const OPTIMO_PROYECTO = 735000n;
export const SELECCION_OPTIMA = ['P01', 'P03', 'P07', 'P08', 'P11'];

/** Tabla 1 ya validada (valores en kg y COP). */
export const CANDIDATOS_T1: Candidato[] = [
  { id: 'P01', w: 12n, v: 180000n },
  { id: 'P02', w: 8n, v: 95000n },
  { id: 'P03', w: 15n, v: 210000n },
  { id: 'P04', w: 5n, v: 60000n },
  { id: 'P05', w: 4n, v: 48000n },
  { id: 'P06', w: 20n, v: 260000n },
  { id: 'P07', w: 7n, v: 110000n },
  { id: 'P08', w: 10n, v: 150000n },
  { id: 'P09', w: 4n, v: 52000n },
  { id: 'P10', w: 18n, v: 230000n },
  { id: 'P11', w: 6n, v: 85000n },
  { id: 'P12', w: 9n, v: 120000n },
];

export const INSTANCIA_T1: Instancia = { candidatos: CANDIDATOS_T1, W: W_PROYECTO };

/** Contraejemplo clásico: W = 10, A(6, 7), B(5, 5), C(5, 5). Ávido 7, óptimo 10. */
export const CONTRAEJEMPLO_ABC: Instancia = {
  candidatos: [
    { id: 'A', w: 6n, v: 7n },
    { id: 'B', w: 5n, v: 5n },
    { id: 'C', w: 5n, v: 5n },
  ],
  W: 10n,
};

/**
 * Contraejemplo con candidatos de Mercado Andino: los 12 pedidos de la Tabla 1 con un
 * vehículo de 12 kg. El ávido toma P07 (7 kg) y luego P09 (4 kg): 162.000 COP. El óptimo
 * es P01 solo (12 kg): 180.000 COP.
 */
export const CONTRAEJEMPLO_MA: Instancia = { candidatos: CANDIDATOS_T1, W: 12n };

/** Segundo contraejemplo con un subconjunto de la Tabla 1: {P07, P01, P04} y W = 12. */
export const CONTRAEJEMPLO_MA2: Instancia = {
  candidatos: [
    { id: 'P01', w: 12n, v: 180000n },
    { id: 'P04', w: 5n, v: 60000n },
    { id: 'P07', w: 7n, v: 110000n },
  ],
  W: 12n,
};
