import { useMemo, useState } from 'react';
import { fmt, fmtN } from '../../algorithms/bigint';
import { longitudEntrada } from '../../algorithms/decision';
import { celdasDP, dpSoloValor, LIMITE_CELDAS } from '../../algorithms/dp';
import { ramificacionPoda } from '../../algorithms/ramificacionPoda';
import { aMapa, type Instancia } from '../../algorithms/tipos';
import { CANDIDATOS_T1, OPTIMO_PROYECTO } from '../../data/tablas';
import { GraficaLineas } from '../../components/GraficaLineas';
import { Aviso, Estadisticas, Stat, TablaScroll, Tarjeta } from '../../components/ui';
import { M, MB } from '../../components/Tex';

/** Familia de instancias: Tabla 1 con los pesos reescalados para que W = 2^b − 1. */
function familia(b: number): Instancia {
  const W = (1n << BigInt(b)) - 1n;
  const candidatos = CANDIDATOS_T1.map((c) => {
    let w = (c.w * W + 49n) / 50n; // ⌈w·W/50⌉
    if (w < 1n) w = 1n;
    return { ...c, w };
  });
  return { candidatos, W };
}

const B_MAX = 48;

export default function Pseudopolinomial() {
  const [b, setB] = useState(6);
  const filas = useMemo(
    () =>
      Array.from({ length: B_MAX }, (_, k) => {
        const bb = k + 1;
        const inst = familia(bb);
        const L = longitudEntrada(inst, OPTIMO_PROYECTO).L;
        return { b: bb, inst, L, celdas: celdasDP(inst.candidatos.length, inst.W) };
      }),
    [],
  );
  const actual = filas[b - 1];
  const ejecucion = useMemo(() => {
    const ryp = ramificacionPoda(actual.inst.candidatos, actual.inst.W, { maxRegistro: 0 });
    if (actual.celdas > LIMITE_CELDAS) return { dp: null, ryp };
    const t0 = performance.now();
    const d = dpSoloValor(aMapa(actual.inst.candidatos), actual.inst.W, LIMITE_CELDAS);
    return { dp: { valor: d.valor, ms: performance.now() - t0 }, ryp };
  }, [actual]);
  const visibles = filas.slice(0, b);

  return (
    <>
      <h1>Pseudopolinomialidad</h1>
      <p className="lead">
        La programación dinámica de la Entrega 3 resuelve DECISIÓN en <M>{String.raw`O(nW)`}</M>. Parece polinómico,
        pero no lo es en la longitud de la entrada: <M>W</M> es un <strong>valor</strong>, y se escribe con solo unos{' '}
        <M>{String.raw`\log_2 W`}</M> bits.
      </p>

      <Tarjeta titulo="El argumento">
        <MB>{String.raw`\text{bits}(W)=\lfloor\log_2 W\rfloor+1\ \Rightarrow\ W\ge 2^{\text{bits}(W)-1}\ \Rightarrow\ O(nW)=O\!\left(n\cdot 2^{\text{bits}(W)}\right)`}</MB>
        <p>
          Si se agrega un bit a <M>W</M>, la longitud de la entrada <M>L</M> sube en 1, pero las celdas de la tabla se
          duplican. Una cota <strong>polinómica en la longitud de entrada</strong> sería <M>{String.raw`O(L^k)`}</M> para
          una constante <M>k</M>; <M>{String.raw`n\cdot 2^{\text{bits}(W)}`}</M> no admite ninguna cota así, porque una
          exponencial termina superando a cualquier polinomio. Por eso <M>{String.raw`O(nW)`}</M> se llama{' '}
          <strong>pseudopolinomial</strong>: es polinómica en <M>n</M> y en el <em>valor numérico</em> de <M>W</M>{' '}
          (equivalente a escribir <M>W</M> en unario), no en sus bits.
        </p>
        <Aviso tipo="info">
          Esto no contradice nada: la DP sigue siendo exacta y es muy rápida cuando <M>W</M> es pequeño (por ejemplo,
          la Tabla 1 con <M>W = 50</M>: 663 celdas). Son instancias fáciles. Lo que no da es una cota polinómica para
          todas las instancias.
        </Aviso>
      </Tarjeta>

      <Tarjeta titulo="Demostración interactiva: aumentar los bits de W de 1 en 1">
        <p className="peq">
          Familia de instancias: los 12 pedidos de la Tabla 1 con los pesos reescalados,{' '}
          <M>{String.raw`w_i'=\lceil w_i\,W/50\rceil`}</M>, y <M>{String.raw`W=2^b-1`}</M> (exactamente <M>b</M> bits),{' '}
          <M>B = 735.000</M>. El problema es esencialmente el mismo en todos los pasos.
        </p>
        <div className="controles">
          <button type="button" className="boton secundario" onClick={() => setB(Math.max(1, b - 1))} aria-label="Quitar un bit">
            − 1 bit
          </button>
          <button type="button" className="boton" onClick={() => setB(Math.min(B_MAX, b + 1))} aria-label="Agregar un bit">
            + 1 bit
          </button>
          <label className="campo" style={{ flex: '1 1 220px' }}>
            bits de W: {b}
            <input type="range" min={1} max={B_MAX} value={b} onChange={(e) => setB(Number(e.target.value))} />
          </label>
        </div>
        <Estadisticas>
          <Stat etq="W" val={fmt(actual.inst.W)} nota={`${b} bits`} />
          <Stat etq="Longitud de entrada L" val={`${actual.L} bits`} />
          <Stat etq="Celdas DP (n+1)(W+1)" val={fmt(actual.celdas)} />
          <Stat etq="L²" val={fmtN(actual.L ** 2)} />
          <Stat etq="L³" val={fmtN(actual.L ** 3)} />
          <Stat
            etq="DP ejecutada"
            val={ejecucion.dp ? `${ejecucion.dp.ms.toFixed(1)} ms` : 'no se ejecuta'}
            nota={ejecucion.dp ? `óptimo ${fmt(ejecucion.dp.valor)}` : `más de ${fmt(LIMITE_CELDAS)} celdas`}
          />
          <Stat etq="Ramificación y poda" val={`${fmtN(ejecucion.ryp.cont.visitados)} nodos`} nota={`óptimo ${fmt(ejecucion.ryp.valor)}`} />
        </Estadisticas>
        <GraficaLineas
          titulo="Celdas de la DP frente a la longitud de la entrada"
          log
          ejeX="longitud de entrada L (bits)"
          ejeY="operaciones (log)"
          series={[
            { nombre: 'Celdas DP', color: 'var(--series-3)', puntos: visibles.map((f) => ({ x: f.L, y: Number(f.celdas) })) },
            { nombre: 'L³ (polinomio)', color: 'var(--series-1)', punteada: true, puntos: visibles.map((f) => ({ x: f.L, y: f.L ** 3 })) },
            { nombre: 'L² (polinomio)', color: 'var(--series-7)', punteada: true, puntos: visibles.map((f) => ({ x: f.L, y: f.L ** 2 })) },
          ]}
        />
        <p className="peq">
          Cada bit agrega unos 13 bits a <M>L</M> (uno a <M>W</M> y uno a cada peso) y multiplica las celdas por 2. Con
          pocos bits las curvas polinómicas están por encima; al seguir agregando bits, las celdas las cruzan y se
          separan cada vez más. La ramificación y poda resuelve estas instancias con pocos nodos porque su costo no
          depende del valor de <M>W</M>; aun así, su peor caso es exponencial en <M>n</M>.
        </p>
        <TablaScroll alta>
          <table>
            <thead>
              <tr>
                <th className="num">bits de W</th>
                <th className="num">W</th>
                <th className="num">L</th>
                <th className="num">Celdas DP</th>
                <th className="num">L³</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((f) => (
                <tr key={f.b} style={f.b === b ? { background: 'var(--accent-soft)' } : undefined}>
                  <td className="num">{f.b}</td>
                  <td className="num">{fmt(f.inst.W)}</td>
                  <td className="num">{f.L}</td>
                  <td className="num">{fmt(f.celdas)}</td>
                  <td className="num">{fmtN(f.L ** 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TablaScroll>
      </Tarjeta>
    </>
  );
}
