import { useState } from 'react';
import { fmtN } from '../algorithms/bigint';
import { useAncho } from './useAncho';

export interface Serie {
  nombre: string;
  /** variable CSS o color */
  color: string;
  punteada?: boolean;
  puntos: { x: number; y: number | null }[];
}

/**
 * Gráfica de líneas en SVG propio (una sola escala Y, lineal o logarítmica), con
 * leyenda, etiquetas directas al final de cada serie, cruz y tooltip al pasar el cursor.
 */
export function GraficaLineas({
  series,
  log = false,
  ejeX,
  ejeY,
  alto = 300,
  formatoX = (x) => fmtN(x),
  formatoY = (y) => fmtN(y),
  titulo,
}: {
  series: Serie[];
  log?: boolean;
  ejeX: string;
  ejeY: string;
  alto?: number;
  formatoX?: (x: number) => string;
  formatoY?: (y: number) => string;
  titulo: string;
}) {
  const [ref, ancho] = useAncho<HTMLDivElement>(600);
  const [hover, setHover] = useState<number | null>(null);
  const m = { izq: 62, der: ancho < 500 ? 16 : 110, arr: 12, aba: 44 };
  const iw = Math.max(50, ancho - m.izq - m.der);
  const ih = alto - m.arr - m.aba;

  const xs = [...new Set(series.flatMap((s) => s.puntos.map((p) => p.x)))].sort((a, b) => a - b);
  const ys = series.flatMap((s) => s.puntos.map((p) => p.y)).filter((y): y is number => y !== null && (!log || y > 0));
  if (xs.length === 0 || ys.length === 0) return <div className="muted peq">Sin datos para graficar.</div>;
  const x0 = xs[0];
  const x1 = xs[xs.length - 1] === x0 ? x0 + 1 : xs[xs.length - 1];
  let y0 = log ? Math.min(...ys) : 0;
  let y1 = Math.max(...ys);
  if (log) {
    y0 = 10 ** Math.floor(Math.log10(y0));
    y1 = 10 ** Math.ceil(Math.log10(y1));
    if (y1 === y0) y1 = y0 * 10;
  } else if (y1 === 0) y1 = 1;
  const sx = (x: number) => m.izq + ((x - x0) / (x1 - x0)) * iw;
  const sy = (y: number) =>
    log
      ? m.arr + ih - ((Math.log10(y) - Math.log10(y0)) / (Math.log10(y1) - Math.log10(y0))) * ih
      : m.arr + ih - (y / (y1 * 1.05)) * ih;

  const ticksY: number[] = [];
  if (log) {
    const paso = Math.max(1, Math.ceil((Math.log10(y1) - Math.log10(y0)) / 6));
    for (let e = Math.log10(y0); e <= Math.log10(y1) + 1e-9; e += paso) ticksY.push(10 ** e);
  } else {
    const bruto = (y1 * 1.05) / 5;
    const mag = 10 ** Math.floor(Math.log10(bruto));
    const paso = [1, 2, 5, 10].map((f) => f * mag).find((p) => p >= bruto) ?? bruto;
    for (let v = 0; v <= y1 * 1.05; v += paso) ticksY.push(v);
  }
  const maxTicksX = Math.max(2, Math.floor(iw / 50));
  const pasoX = Math.ceil(xs.length / maxTicksX);
  const ticksX = xs.filter((_, i) => i % pasoX === 0);
  const fmtTickY = (v: number) =>
    v >= 1e6 ? `${+(v / 1e6).toPrecision(3)} M` : v >= 1e3 ? `${+(v / 1e3).toPrecision(3)} k` : String(+v.toPrecision(3));

  const xHover = hover !== null ? xs[hover] : null;

  return (
    <figure style={{ margin: '10px 0' }}>
      <div className="leyenda" aria-hidden="true">
        {series.map((s) => (
          <span key={s.nombre}>
            <svg width="22" height="10">
              <line x1="0" y1="5" x2="22" y2="5" stroke={s.color} strokeWidth="2" strokeDasharray={s.punteada ? '4 3' : undefined} />
              <circle cx="11" cy="5" r="3.5" fill={s.color} />
            </svg>
            {s.nombre}
          </span>
        ))}
      </div>
      <div ref={ref} style={{ position: 'relative' }}>
        <svg
          className="grafica"
          width={ancho}
          height={alto}
          role="img"
          aria-label={titulo}
          onPointerMove={(e) => {
            const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const px = e.clientX - r.left;
            let best = 0;
            xs.forEach((x, i) => {
              if (Math.abs(sx(x) - px) < Math.abs(sx(xs[best]) - px)) best = i;
            });
            setHover(best);
          }}
          onPointerLeave={() => setHover(null)}
        >
          {ticksY.map((v) => (
            <g key={v}>
              <line className="reja" x1={m.izq} x2={m.izq + iw} y1={sy(v)} y2={sy(v)} />
              <text x={m.izq - 6} y={sy(v) + 4} textAnchor="end">
                {fmtTickY(v)}
              </text>
            </g>
          ))}
          <line x1={m.izq} x2={m.izq + iw} y1={m.arr + ih} y2={m.arr + ih} stroke="var(--border)" />
          {ticksX.map((x) => (
            <text key={x} x={sx(x)} y={m.arr + ih + 16} textAnchor="middle">
              {formatoX(x)}
            </text>
          ))}
          <text x={m.izq + iw / 2} y={alto - 6} textAnchor="middle" style={{ fontWeight: 600 }}>
            {ejeX}
          </text>
          <text transform={`translate(12 ${m.arr + ih / 2}) rotate(-90)`} textAnchor="middle" style={{ fontWeight: 600 }}>
            {ejeY}
          </text>
          {xHover !== null && (
            <line x1={sx(xHover)} x2={sx(xHover)} y1={m.arr} y2={m.arr + ih} stroke="var(--text-3)" strokeDasharray="3 3" />
          )}
          {series.map((s) => {
            const pts = s.puntos.filter((p) => p.y !== null && (!log || p.y > 0)) as { x: number; y: number }[];
            if (pts.length === 0) return null;
            const d = pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
            const ult = pts[pts.length - 1];
            return (
              <g key={s.nombre}>
                <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray={s.punteada ? '5 4' : undefined} />
                {pts.map((p) => (
                  <circle
                    key={p.x}
                    cx={sx(p.x)}
                    cy={sy(p.y)}
                    r={xHover === p.x ? 5 : 3.5}
                    fill={s.color}
                    stroke="var(--surface)"
                    strokeWidth={1.5}
                  />
                ))}
                {ancho >= 500 && (
                  <text x={sx(ult.x) + 8} y={sy(ult.y) + 4} style={{ fill: 'var(--text-2)', fontWeight: 600 }}>
                    {s.nombre.length > 16 ? s.nombre.slice(0, 15) + '…' : s.nombre}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {xHover !== null && (
          <div
            className="tooltip"
            style={{
              left: Math.min(ancho - 190, Math.max(0, sx(xHover) + 10)),
              top: 8,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 2 }}>
              {ejeX}: {formatoX(xHover)}
            </div>
            {series.map((s) => {
              const p = s.puntos.find((q) => q.x === xHover);
              return (
                <div className="fila" key={s.nombre}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span className="muestra" style={{ background: s.color }} />
                    {s.nombre}
                  </span>
                  <span>{p && p.y !== null ? formatoY(p.y) : '—'}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <details style={{ marginTop: 4 }}>
        <summary className="peq muted" style={{ cursor: 'pointer' }}>
          Ver datos en tabla
        </summary>
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>{ejeX}</th>
                {series.map((s) => (
                  <th key={s.nombre} className="num">
                    {s.nombre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {xs.map((x) => (
                <tr key={x}>
                  <td>{formatoX(x)}</td>
                  {series.map((s) => {
                    const p = s.puntos.find((q) => q.x === x);
                    return (
                      <td key={s.nombre} className="num">
                        {p && p.y !== null ? formatoY(p.y) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
