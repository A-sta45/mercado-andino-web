import { useMemo } from 'react';
import { fmt } from '../algorithms/bigint';
import { aMapa, type Instancia } from '../algorithms/tipos';
import { verificar } from '../algorithms/verificar';
import { Chip, Ids } from './ui';

/** Muestra una selección y la pasa por verificar (Entrega 1). */
export function ResultadoVerificado({
  instancia,
  seleccion,
  valor,
  titulo,
}: {
  instancia: Instancia;
  seleccion: string[];
  valor: bigint;
  titulo?: string;
}) {
  const v = useMemo(() => verificar(aMapa(instancia.candidatos), seleccion, instancia.W), [instancia, seleccion]);
  const ok = v.resultado && v.beneficio === valor;
  return (
    <div className="stat" style={{ background: 'var(--surface-2)' }}>
      {titulo && <span className="etq">{titulo}</span>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
        <span className="val">{fmt(valor)} COP</span>
        <span className="peq muted">consumo {fmt(v.consumo)} / {fmt(instancia.W)} kg</span>
      </div>
      <div className="peq">
        <Ids ids={seleccion} />
      </div>
      <div style={{ marginTop: 4 }}>
        {ok ? (
          <Chip tipo="ok">verificar: VERDADERO · {v.ops.total} operaciones</Chip>
        ) : (
          <Chip tipo="mal">verificar: FALSO ({v.retorno})</Chip>
        )}
      </div>
    </div>
  );
}

/** Brecha (OPT − v)/OPT en porcentaje con dos decimales, sin flotantes. */
export function brecha(opt: bigint, v: bigint): string {
  if (opt === 0n) return '0,00 %';
  const x = ((opt - v) * 100000n) / opt; // ×1000 de %
  const r = (x + 5n) / 10n;
  return `${r / 100n},${String(r % 100n).padStart(2, '0')} %`;
}
