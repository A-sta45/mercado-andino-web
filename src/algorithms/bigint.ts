/** Utilidades para BigInt (sin Number en los valores del problema). */

/** Número de bits de la representación binaria de x ≥ 0 (bits(0) = 1). */
export function bits(x: bigint): number {
  if (x < 0n) x = -x;
  if (x === 0n) return 1;
  return x.toString(2).length;
}

export function maxBig(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}

export function minBig(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

export function sumaBig(xs: Iterable<bigint>): bigint {
  let s = 0n;
  for (const x of xs) s += x;
  return s;
}

/** Formatea con punto como separador de miles (convención COP del PDF). */
export function fmt(x: bigint | number): string {
  const s = (typeof x === 'bigint' ? x : BigInt(Math.trunc(x))).toString();
  const neg = s.startsWith('-');
  const d = neg ? s.slice(1) : s;
  const out = d.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return neg ? '-' + out : out;
}

/** Formatea un contador (Number) con separador de miles. */
export function fmtN(x: number): string {
  return fmt(BigInt(Math.round(x)));
}

/** Piso de a/b para b > 0 (BigInt trunca hacia cero). */
export function pisoDiv(a: bigint, b: bigint): bigint {
  const q = a / b;
  return a % b !== 0n && (a < 0n) !== (b < 0n) ? q - 1n : q;
}

/** Máximo común divisor (para simplificar racionales al mostrarlos). */
export function mcd(a: bigint, b: bigint): bigint {
  if (a < 0n) a = -a;
  if (b < 0n) b = -b;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

/** Racional exacto num/den con den > 0. */
export interface Racional {
  num: bigint;
  den: bigint;
}

export function racional(num: bigint, den: bigint): Racional {
  if (den < 0n) {
    num = -num;
    den = -den;
  }
  const g = mcd(num, den) || 1n;
  return { num: num / g, den: den / g };
}

/** Compara a ≤ b para racionales (productos cruzados, sin flotantes). */
export function racionalLeq(a: Racional, b: Racional): boolean {
  return a.num * b.den <= b.num * a.den;
}

/** Texto “entero + p/q” de un racional no negativo. */
export function racionalTexto(r: Racional): string {
  const ent = pisoDiv(r.num, r.den);
  const resto = r.num - ent * r.den;
  if (resto === 0n) return fmt(ent);
  const g = mcd(resto, r.den);
  return `${fmt(ent)} + ${fmt(resto / g)}/${fmt(r.den / g)}`;
}

/** Aproximación decimal SOLO para mostrar (nunca para comparar). */
export function aproxDecimal(num: bigint, den: bigint, dec = 3): string {
  const escala = 10n ** BigInt(dec);
  const q = (num * escala) / den;
  const ent = q / escala;
  const fr = (q % escala).toString().padStart(dec, '0');
  return `${fmt(ent)},${fr}`;
}

/** Parsea texto a BigInt entero (acepta separadores de miles con punto). null si no es entero. */
export function parseBig(texto: string): bigint | null {
  const t = texto.replace(/[\s$]/g, '').replace(/\./g, '');
  if (!/^[+-]?\d+$/.test(t)) return null;
  return BigInt(t);
}
