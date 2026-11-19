import type { ReactNode } from 'react';

/** Barra horizontal proporcional. `fraccion` en [0, 1]. */
export function Barra({ fraccion, color, texto }: { fraccion: number; color: string; texto: ReactNode }) {
  const f = Number.isFinite(fraccion) ? Math.min(1, Math.max(0, fraccion)) : 0;
  return (
    <div className="barra">
      <div className="barra-pista" aria-hidden="true">
        <div className="barra-relleno" style={{ width: `${Math.max(f * 100, f > 0 ? 2 : 0)}%`, background: color }} />
      </div>
      <span className="barra-texto">{texto}</span>
    </div>
  );
}

/** Fracción en escala logarítmica respecto al máximo (para magnitudes que difieren en órdenes). */
export function fraccionLog(v: number, max: number): number {
  if (v <= 0 || max <= 0) return 0;
  return Math.log10(v + 1) / Math.log10(max + 1);
}

export type Marca = 'si' | 'no' | 'abierto' | 'depende';

const TEXTO: Record<Marca, string> = { si: '✓ Sí', no: '✗ No', abierto: '? Abierto', depende: '~ No siempre' };

export function MarcaMatriz({ tipo, texto }: { tipo: Marca; texto?: string }) {
  return <span className={`marca-matriz ${tipo}`}>{texto ?? TEXTO[tipo]}</span>;
}

export function LeyendaMatriz({ tipos }: { tipos: { tipo: Marca; significado: string }[] }) {
  return (
    <div className="leyenda-matriz peq">
      {tipos.map((t) => (
        <span key={t.tipo}>
          <MarcaMatriz tipo={t.tipo} /> {t.significado}
        </span>
      ))}
    </div>
  );
}
