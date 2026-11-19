/**
 * Generador reproducible como el de la Entrega 2: w uniforme en {1..50} kg,
 * v uniforme en {0..500.000} COP y W = ⌊Σw/2⌋, con semilla registrada.
 * Se implementa MT19937 con la misma inicialización y el mismo randint que el módulo
 * random de Python (random.seed(int) + random.randint), para que una semilla dé la
 * misma secuencia en ambos lenguajes.
 */
import type { Candidato, Instancia } from './tipos';

export class MT19937 {
  private mt = new Uint32Array(624);
  private idx = 625;

  constructor(semilla: bigint | number) {
    this.seed(BigInt(semilla));
  }

  private initGenrand(s: number) {
    const mt = this.mt;
    mt[0] = s >>> 0;
    for (let i = 1; i < 624; i++) {
      const prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = (Math.imul(1812433253, prev) + i) >>> 0;
    }
    this.idx = 624;
  }

  /** Igual que random.seed(n) de Python para enteros: init_by_array con palabras de 32 bits. */
  seed(n: bigint) {
    if (n < 0n) n = -n;
    const key: number[] = [];
    do {
      key.push(Number(n & 0xffffffffn));
      n >>= 32n;
    } while (n > 0n);
    this.initGenrand(19650218);
    const mt = this.mt;
    let i = 1;
    let j = 0;
    for (let k = Math.max(624, key.length); k > 0; k--) {
      const prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = ((mt[i] ^ Math.imul(prev, 1664525)) + key[j] + j) >>> 0;
      i++;
      j++;
      if (i >= 624) {
        mt[0] = mt[623];
        i = 1;
      }
      if (j >= key.length) j = 0;
    }
    for (let k = 623; k > 0; k--) {
      const prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = ((mt[i] ^ Math.imul(prev, 1566083941)) - i) >>> 0;
      i++;
      if (i >= 624) {
        mt[0] = mt[623];
        i = 1;
      }
    }
    mt[0] = 0x80000000;
    this.idx = 624;
  }

  genrandUint32(): number {
    const mt = this.mt;
    if (this.idx >= 624) {
      for (let kk = 0; kk < 624; kk++) {
        const y = (mt[kk] & 0x80000000) | (mt[(kk + 1) % 624] & 0x7fffffff);
        mt[kk] = mt[(kk + 397) % 624] ^ (y >>> 1) ^ (y & 1 ? 0x9908b0df : 0);
      }
      this.idx = 0;
    }
    let y = mt[this.idx++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return y >>> 0;
  }

  /** getrandbits(k) con 1 ≤ k ≤ 32. */
  getrandbits(k: number): number {
    return this.genrandUint32() >>> (32 - k);
  }

  /** _randbelow de Python: rechazo con k = bit_length(n). */
  randbelow(n: number): number {
    const k = Math.floor(Math.log2(n)) + 1; // bit_length para n ≥ 1
    let r = this.getrandbits(k);
    while (r >= n) r = this.getrandbits(k);
    return r;
  }

  /** random.randint(a, b), ambos incluidos. Requiere b − a + 1 < 2^32. */
  randint(a: number, b: number): number {
    return a + this.randbelow(b - a + 1);
  }
}

/** Semilla registrada de la Entrega 2: s = 20261103 + 100·n + j. */
export function semillaE2(n: number, j: number): number {
  return 20261103 + 100 * n + j;
}

export interface OpcionesGenerador {
  wMax?: number;
  vMax?: number;
}

/**
 * Genera una instancia con n candidatos. Supuesto (no está en el PDF): por cada candidato
 * se sortea primero w y luego v, y los ids son P001, P002, … con ancho fijo.
 */
export function generarInstancia(n: number, semilla: number, op: OpcionesGenerador = {}): Instancia {
  const wMax = op.wMax ?? 50;
  const vMax = op.vMax ?? 500_000;
  const rng = new MT19937(semilla);
  const ancho = Math.max(2, String(n).length);
  const candidatos: Candidato[] = [];
  let suma = 0n;
  for (let i = 1; i <= n; i++) {
    const w = BigInt(rng.randint(1, wMax));
    const v = BigInt(rng.randint(0, vMax));
    suma += w;
    candidatos.push({ id: 'P' + String(i).padStart(ancho, '0'), w, v });
  }
  return { candidatos, W: suma / 2n };
}
