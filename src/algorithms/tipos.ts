/**
 * Tipos comunes. Toda magnitud del problema (consumo w, beneficio v, capacidad W,
 * umbral B, objetivo T) es BigInt: los números se codifican en binario y no tienen
 * cota constante. Los contadores de operaciones sí son Number (nunca superan 2^53
 * en las instancias que el navegador puede ejecutar).
 */

/** Candidato ya validado: id, consumo w_i (= c_i) en kg y beneficio v_i (= b_i) en COP. */
export interface Candidato {
  id: string;
  w: bigint;
  v: bigint;
}

/** Instancia de optimización: candidatos validados y capacidad W. */
export interface Instancia {
  candidatos: Candidato[];
  W: bigint;
}

/** Diccionario id → (consumo, beneficio), como el dict C del PDF. */
export type MapaCandidatos = Map<string, { w: bigint; v: bigint }>;

export function aMapa(candidatos: Candidato[]): MapaCandidatos {
  const m: MapaCandidatos = new Map();
  for (const c of candidatos) m.set(c.id, { w: c.w, v: c.v });
  return m;
}

/** Resultado común que devuelve cualquier algoritmo de selección. */
export interface ResultadoSeleccion {
  valor: bigint;
  seleccion: string[];
  consumo: bigint;
}
