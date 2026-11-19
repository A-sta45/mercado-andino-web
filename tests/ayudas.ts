import { MT19937 } from '../src/algorithms/generador';
import type { Candidato, Instancia } from '../src/algorithms/tipos';

/** Instancias aleatorias para pruebas: con empates de v/w y, a veces, valores enormes (BigInt). */
export function instanciaPrueba(rng: MT19937, nMax = 14): Instancia {
  const n = rng.randint(0, nMax);
  const tipo = rng.randint(0, 3);
  const candidatos: Candidato[] = [];
  for (let i = 0; i < n; i++) {
    let w: bigint;
    let v: bigint;
    if (tipo === 0) {
      // muchos empates de razón: v = k·w con k pequeño
      w = BigInt(rng.randint(1, 8));
      v = w * BigInt(rng.randint(0, 3)) * 1000n;
    } else if (tipo === 1) {
      // valores grandes: productos cruzados mayores que 2^63
      const escala = 1n << BigInt(rng.randint(40, 70));
      w = BigInt(rng.randint(1, 20));
      v = BigInt(rng.randint(0, 1000)) * escala + BigInt(rng.randint(0, 99));
    } else if (tipo === 2) {
      // pesos enormes y W enorme: la DP no aplica, pero exhaustivo y RyP sí
      w = (1n << 50n) * BigInt(rng.randint(1, 9)) + BigInt(rng.randint(0, 3));
      v = BigInt(rng.randint(0, 500_000));
    } else {
      w = BigInt(rng.randint(1, 50));
      v = BigInt(rng.randint(0, 500_000));
    }
    candidatos.push({ id: 'X' + String(i).padStart(2, '0'), w, v });
  }
  let suma = 0n;
  for (const c of candidatos) suma += c.w;
  const W = suma === 0n ? BigInt(rng.randint(0, 5)) : (suma * BigInt(rng.randint(0, 100))) / 100n;
  return { candidatos, W };
}
