/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { validar, type ResultadoValidar } from './algorithms/validar';
import { generarInstancia, semillaE2 } from './algorithms/generador';
import type { Instancia } from './algorithms/tipos';
import { CONTRAEJEMPLO_ABC, CONTRAEJEMPLO_MA, CONTRAEJEMPLO_MA2, TABLA1, TABLA2 } from './data/tablas';

export interface Fila {
  clave: number;
  id: string;
  consumo: string;
  unidad: 'kg' | 'g';
  beneficio: string;
  origen: 'Tabla 1' | 'Tabla 2' | 'Nueva';
}

let siguienteClave = 1;
export function nuevaClave() {
  return siguienteClave++;
}

export function filasIniciales(): Fila[] {
  const a = (t: typeof TABLA1, origen: Fila['origen']): Fila[] =>
    t.map((c) => ({
      clave: nuevaClave(),
      id: String(c.id ?? ''),
      consumo: String(c.consumo ?? ''),
      unidad: c.unidad === 'g' ? 'g' : 'kg',
      beneficio: String(c.beneficio ?? ''),
      origen,
    }));
  return [...a(TABLA1, 'Tabla 1'), ...a(TABLA2, 'Tabla 2')];
}

export type TipoInstancia = 'datos' | 'abc' | 'ma' | 'ma2' | 'aleatoria';

export interface Seleccion {
  tipo: TipoInstancia;
  n: number;
  semilla: number;
}

interface Estado {
  filas: Fila[];
  setFilas: (f: Fila[]) => void;
  textoW: string;
  setTextoW: (w: string) => void;
  validacion: ResultadoValidar | null;
  errorW: string | null;
  seleccion: Seleccion;
  setSeleccion: (s: Seleccion) => void;
}

const Ctx = createContext<Estado | null>(null);

/** Convierte las filas editables en registros crudos para validar. */
export function crudosDe(filas: Fila[]) {
  return filas.map((f) => ({
    id: f.id,
    consumo: f.consumo.trim() === '' ? undefined : f.consumo,
    beneficio: f.beneficio.trim() === '' ? undefined : f.beneficio,
    unidad: f.unidad,
  }));
}

export function parseW(texto: string): unknown {
  return /^\s*[+-]?\d+\s*$/.test(texto) ? BigInt(texto.trim()) : texto;
}

export function ProveedorEstado({ children }: { children: ReactNode }) {
  const [filas, setFilas] = useState<Fila[]>(filasIniciales);
  const [textoW, setTextoW] = useState('50');
  const [seleccion, setSeleccion] = useState<Seleccion>({ tipo: 'datos', n: 12, semilla: semillaE2(12, 1) });

  const { validacion, errorW } = useMemo(() => {
    try {
      return { validacion: validar(crudosDe(filas), parseW(textoW)), errorW: null };
    } catch (e) {
      return { validacion: null, errorW: (e as Error).message };
    }
  }, [filas, textoW]);

  const valor = useMemo(
    () => ({ filas, setFilas, textoW, setTextoW, validacion, errorW, seleccion, setSeleccion }),
    [filas, textoW, validacion, errorW, seleccion],
  );
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useEstado(): Estado {
  const e = useContext(Ctx);
  if (!e) throw new Error('Falta ProveedorEstado');
  return e;
}

export interface InstanciaElegida {
  instancia: Instancia;
  nombre: string;
  descripcion: string;
  error: string | null;
}

export const NOMBRES_INSTANCIA: Record<TipoInstancia, string> = {
  datos: 'Datos (Tabla 1 editable)',
  abc: 'Contraejemplo A, B, C (W = 10)',
  ma: 'Tabla 1 con W = 12',
  ma2: '{P01, P04, P07} con W = 12',
  aleatoria: 'Aleatoria con semilla',
};

export function instanciaDeSeleccion(s: Seleccion, datos: Instancia | null): InstanciaElegida {
  switch (s.tipo) {
    case 'datos':
      return {
        instancia: datos ?? { candidatos: [], W: 0n },
        nombre: 'Datos actuales',
        descripcion: 'Candidatos válidos de la pestaña Datos (por defecto, la Tabla 1 con W = 50 kg).',
        error: datos ? null : 'La capacidad W de la pestaña Datos no es válida.',
      };
    case 'abc':
      return {
        instancia: CONTRAEJEMPLO_ABC,
        nombre: NOMBRES_INSTANCIA.abc,
        descripcion: 'A(w=6, v=7), B(w=5, v=5), C(w=5, v=5) y W = 10.',
        error: null,
      };
    case 'ma':
      return {
        instancia: CONTRAEJEMPLO_MA,
        nombre: NOMBRES_INSTANCIA.ma,
        descripcion: 'Los 12 pedidos de la Tabla 1 con un vehículo de 12 kg.',
        error: null,
      };
    case 'ma2':
      return {
        instancia: CONTRAEJEMPLO_MA2,
        nombre: NOMBRES_INSTANCIA.ma2,
        descripcion: 'Tres pedidos de la Tabla 1 con un vehículo de 12 kg.',
        error: null,
      };
    case 'aleatoria':
      return {
        instancia: generarInstancia(s.n, s.semilla),
        nombre: `Aleatoria n = ${s.n}, semilla ${s.semilla}`,
        descripcion: 'w uniforme en {1..50}, v uniforme en {0..500.000}, W = ⌊Σw/2⌋.',
        error: null,
      };
  }
}

export function useInstancia(): InstanciaElegida {
  const { seleccion, validacion } = useEstado();
  const datos = useMemo(
    () => (validacion ? { candidatos: validacion.candidatos, W: validacion.W } : null),
    [validacion],
  );
  return useMemo(() => instanciaDeSeleccion(seleccion, datos), [seleccion, datos]);
}
