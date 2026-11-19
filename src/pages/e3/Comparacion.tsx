import { useMemo, useState } from 'react';
import { fmt, fmtN } from '../../algorithms/bigint';
import type { Algoritmo, FilaComparacion } from '../../algorithms/experimentos';
import { useInstancia } from '../../estado';
import { useTarea } from '../../workers/cliente';
import { SelectorInstancia } from '../../components/SelectorInstancia';
import { GraficaLineas } from '../../components/GraficaLineas';
import { brecha } from '../../components/Resultado';
import { Aviso, Chip, Estadisticas, Ids, Stat, TablaScroll, Tarjeta } from '../../components/ui';
import { M } from '../../components/Tex';

const INFO: Record<
  Algoritmo,
  { nombre: string; color: string; estrategia: string; garantiza: boolean; tiempo: string; memoria: string; conviene: string }
> = {
  exhaustivo: {
    nombre: 'Exhaustivo',
    color: 'var(--series-1)',
    estrategia: 'Recursión incluir/excluir sobre todos los subconjuntos (Entrega 2).',
    garantiza: true,
    tiempo: 'O(2ⁿ) llamadas; Ω(n)',
    memoria: 'O(n²) (pila n + 1 y listas parciales)',
    conviene: 'Referencia exacta para n pequeño (n ≲ 22 en el navegador) y para validar los demás.',
  },
  avido: {
    nombre: 'Ávido (heurística)',
    color: 'var(--series-2)',
    estrategia: 'Merge sort por v/w (divide y vencerás) + recorrido que incluye si cabe.',
    garantiza: false,
    tiempo: 'Θ(n log n) + Θ(n)',
    memoria: 'Θ(n)',
    conviene: 'Respuesta rápida o cota inferior inicial con n grande; no sirve si se exige el óptimo.',
  },
  dp: {
    nombre: 'Programación dinámica',
    color: 'var(--series-3)',
    estrategia: 'Tabla F(i, c) sobre prefijos y capacidades; reconstrucción hacia atrás.',
    garantiza: true,
    tiempo: 'Θ(nW) (pseudopolinomial)',
    memoria: 'Θ(nW) con reconstrucción; Θ(W) solo el valor',
    conviene: 'W (valor) pequeño, aunque n sea grande: costo predecible y sin depender de los datos.',
  },
  ryp: {
    nombre: 'Ramificación y poda',
    color: 'var(--series-4)',
    estrategia: 'Árbol incluir/excluir en orden v/w con cota fraccionaria exacta y mejor inicial del ávido.',
    garantiza: true,
    tiempo: 'O(n·2ⁿ) + Θ(n log n) en el peor caso',
    memoria: 'O(n)',
    conviene: 'W grande (muchos bits) y n moderado cuando la cota poda mucho; su tiempo depende de la instancia.',
  },
};

function fmtTiempo(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(1).replace('.', ',')} µs`;
  return `${ms.toFixed(2).replace('.', ',')} ms`;
}

const ORDEN: Algoritmo[] = ['exhaustivo', 'avido', 'dp', 'ryp'];

function claveInstancia(c: { id: string; w: bigint; v: bigint }[], W: bigint) {
  return c.map((x) => `${x.id}:${x.w}:${x.v}`).join(',') + '|' + W;
}

export default function Comparacion() {
  const { instancia, nombre } = useInstancia();
  const n = instancia.candidatos.length;
  const clave = claveInstancia(instancia.candidatos, instancia.W);
  const comp = useTarea({ tipo: 'comparar', instancia, reps: 5 }, clave);

  const filas = comp.datos;
  const referencia = useMemo(() => {
    if (!filas) return null;
    const ex = filas.find((f) => f.alg === 'exhaustivo' && f.ejecutado);
    if (ex) return { valor: ex.valor!, fuente: 'exhaustivo' };
    const d = filas.find((f) => f.alg === 'dp' && f.ejecutado);
    if (d) return { valor: d.valor!, fuente: 'programación dinámica (exacta)' };
    const r = filas.find((f) => f.alg === 'ryp' && f.ejecutado && f.verificado);
    return r ? { valor: r.valor!, fuente: 'ramificación y poda (exacta)' } : null;
  }, [filas]);

  return (
    <>
      <h1>Comparación de los algoritmos de optimización</h1>
      <p className="lead">
        Los cuatro algoritmos sobre la misma instancia. El exhaustivo es la referencia exacta; toda selección pasa por{' '}
        <code>verificar</code>. Los algoritmos corren en un <strong>Web Worker</strong> para no bloquear la página.
      </p>
      <SelectorInstancia nMax={60} />
      {n > 22 && (
        <Aviso tipo="info">
          Con n = {n} &gt; 22 el exhaustivo no se ejecuta; la brecha se mide contra un algoritmo exacto
          (programación dinámica o ramificación y poda).
        </Aviso>
      )}

      <Tarjeta titulo={`Resultados: ${nombre}`}>
        {comp.cargando && <p className="cargando">Ejecutando en el Web Worker (mediana de 5 repeticiones)…</p>}
        {comp.error && <Aviso tipo="peligro">{comp.error}</Aviso>}
        {filas && <TablaComparativa filas={filas} referencia={referencia} />}
        <p className="peq muted">
          Tiempo: mediana de 5 repeticiones con <code>performance.now()</code> en este navegador (1 repetición para el
          exhaustivo con n ≥ 18). Como el navegador redondea el reloj, cada repetición ejecuta el algoritmo k veces
          seguidas hasta sumar al menos 10 ms y divide entre k. Memoria: estimación a partir de las estructuras (el navegador no expone una medición
          fiable por función). Los tiempos dependen del equipo; las operaciones contadas no.
        </p>
      </Tarjeta>

      <Graficas />
      <Pares />
    </>
  );
}

function TablaComparativa({ filas, referencia }: { filas: FilaComparacion[]; referencia: { valor: bigint; fuente: string } | null }) {
  return (
    <>
      <TablaScroll>
        <table className="tarjetas-movil" style={{ minWidth: 980 }}>
          <thead>
            <tr>
              <th>Algoritmo</th>
              <th>Estrategia</th>
              <th>¿Garantiza óptimo?</th>
              <th className="num">Beneficio (COP)</th>
              <th className="num">Brecha</th>
              <th className="num">Operaciones</th>
              <th className="num">Tiempo</th>
              <th>Memoria</th>
              <th>Cota de tiempo</th>
              <th>Cota de memoria</th>
              <th>Conviene cuando…</th>
            </tr>
          </thead>
          <tbody>
            {ORDEN.map((a) => {
              const f = filas.find((x) => x.alg === a)!;
              const i = INFO[a];
              return (
                <tr key={a}>
                  <td className="titulo-celda" data-label="Algoritmo">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                      <span className="muestra" style={{ background: i.color }} />
                      {i.nombre}
                    </span>
                  </td>
                  <td data-label="Estrategia" className="peq">{i.estrategia}</td>
                  <td data-label="¿Garantiza óptimo?">{i.garantiza ? <Chip tipo="ok">Sí</Chip> : <Chip tipo="adv">No (heurística)</Chip>}</td>
                  <td className="num" data-label="Beneficio">
                    {f.ejecutado ? (
                      <>
                        {fmt(f.valor!)}
                        <div className="peq">{f.verificado ? <Chip tipo="ok">verificada</Chip> : <Chip tipo="mal">no verificada</Chip>}</div>
                      </>
                    ) : (
                      <span className="peq muted">{f.motivoNoEjecutado}</span>
                    )}
                  </td>
                  <td className="num" data-label="Brecha">
                    {f.ejecutado && referencia ? brecha(referencia.valor, f.valor!) : '—'}
                  </td>
                  <td className="num" data-label="Operaciones">
                    {f.operaciones !== undefined ? `${fmtN(f.operaciones)} ${f.operaciones === 1 ? f.unidad.replace(/s$/, '') : f.unidad}` : '—'}
                    {f.detalle && <div className="peq muted" style={{ whiteSpace: 'normal', maxWidth: 220 }}>{f.detalle}</div>}
                  </td>
                  <td className="num" data-label="Tiempo">{f.tiempoMs !== undefined ? fmtTiempo(f.tiempoMs) : '—'}</td>
                  <td data-label="Memoria" className="peq">{f.memoria ?? '—'}</td>
                  <td data-label="Cota de tiempo" className="peq">{i.tiempo}</td>
                  <td data-label="Cota de memoria" className="peq">{i.memoria}</td>
                  <td data-label="Conviene cuando…" className="peq">{i.conviene}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TablaScroll>
      {referencia && <p className="peq">Brecha = (OPT − v)/OPT, con OPT = {fmt(referencia.valor)} según el {referencia.fuente}.</p>}
      <details>
        <summary className="peq" style={{ cursor: 'pointer' }}>Selecciones devueltas</summary>
        <ul className="lista-limpia peq">
          {filas
            .filter((f) => f.ejecutado)
            .map((f) => (
              <li key={f.alg}>
                {INFO[f.alg].nombre}: <Ids ids={f.seleccion!} />
              </li>
            ))}
        </ul>
      </details>
    </>
  );
}

const NS = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 26, 30, 40];
const KS = Array.from({ length: 17 }, (_, k) => k);

function Graficas() {
  const crec = useTarea({ tipo: 'crecimiento', ns: NS, instancias: 3 }, 'crec');
  const [nFijo, setNFijo] = useState(12);
  const dvw = useTarea({ tipo: 'dpVsW', n: nFijo, ks: KS }, `dvw${nFijo}`);
  return (
    <>
      <Tarjeta titulo="Crecimiento de operaciones frente a n">
        <p className="peq">
          Instancias generadas con las semillas de la Entrega 2 (<M>{String.raw`s=20261103+100n+j`}</M>, <M>j = 1..3</M>;
          mediana de las 3). Operaciones: llamadas (exhaustivo), comparaciones + movimientos + recorrido (ávido), celdas{' '}
          <M>(n+1)(W+1)</M> (DP) y nodos visitados (ramificación y poda). Escala logarítmica.
        </p>
        {crec.cargando && <p className="cargando">Calculando en el Web Worker (incluye el exhaustivo hasta n = 22)…</p>}
        {crec.datos && (
          <GraficaLineas
            titulo="Operaciones frente a n"
            log
            ejeX="n (candidatos)"
            ejeY="operaciones (log)"
            series={[
              { nombre: INFO.exhaustivo.nombre, color: INFO.exhaustivo.color, puntos: crec.datos.map((p) => ({ x: p.n, y: p.exhaustivo })) },
              { nombre: 'Ávido', color: INFO.avido.color, puntos: crec.datos.map((p) => ({ x: p.n, y: p.avido })) },
              { nombre: 'Prog. dinámica', color: INFO.dp.color, puntos: crec.datos.map((p) => ({ x: p.n, y: p.dp })) },
              { nombre: 'Ramif. y poda', color: INFO.ryp.color, puntos: crec.datos.map((p) => ({ x: p.n, y: p.ryp })) },
            ]}
          />
        )}
        <Aviso tipo="advertencia">
          Con estos datos <M>{String.raw`W=\lfloor\Sigma w/2\rfloor\approx 12{,}75\,n`}</M> es pequeño, así que la DP crece como{' '}
          <M>n^2</M> <em>en esta familia</em>, y la ramificación y poda visita pocos nodos. Son instancias fáciles: ni la
          gráfica ni las podas observadas demuestran tiempo polinómico. La garantía de peor caso sigue siendo{' '}
          <M>{String.raw`O(n\cdot 2^n)`}</M> para ramificación y poda y <M>{String.raw`\Theta(nW)`}</M> para la DP.
        </Aviso>
      </Tarjeta>

      <Tarjeta titulo="Programación dinámica frente a W, con n fijo">
        <p className="peq">
          Se toma una instancia con n fijo y se multiplican todos los pesos y <M>W</M> por <M>{String.raw`2^k`}</M>. Es el
          mismo problema (la misma respuesta), pero <M>W</M> crece: las celdas de la DP se duplican con cada bit de{' '}
          <M>W</M> y los nodos de ramificación y poda no cambian, porque el orden <M>v/w</M> y las podas son los mismos.
        </p>
        <div className="controles">
          <label className="campo">
            n fijo
            <select value={nFijo} onChange={(e) => setNFijo(Number(e.target.value))}>
              {[8, 12, 16, 20].map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
        </div>
        {dvw.cargando && <p className="cargando">Calculando…</p>}
        {dvw.datos && (
          <>
            <GraficaLineas
              titulo="Operaciones de la DP frente a W"
              log
              ejeX="bits de W"
              ejeY="operaciones (log)"
              series={[
                { nombre: 'DP: celdas', color: INFO.dp.color, puntos: dvw.datos.map((p) => ({ x: p.bitsW, y: Number(p.celdas) })) },
                { nombre: 'RyP: nodos', color: INFO.ryp.color, puntos: dvw.datos.map((p) => ({ x: p.bitsW, y: p.ryp })) },
              ]}
            />
            <TablaScroll alta>
              <table>
                <thead>
                  <tr>
                    <th className="num">k</th>
                    <th className="num">W</th>
                    <th className="num">bits de W</th>
                    <th className="num">Celdas DP</th>
                    <th className="num">Tiempo DP (ms)</th>
                    <th className="num">Nodos RyP</th>
                    <th className="num">Óptimo</th>
                  </tr>
                </thead>
                <tbody>
                  {dvw.datos.map((p) => (
                    <tr key={p.k}>
                      <td className="num">{p.k}</td>
                      <td className="num">{fmt(p.W)}</td>
                      <td className="num">{p.bitsW}</td>
                      <td className="num">{fmt(p.celdas)}</td>
                      <td className="num">{p.tiempoDpMs === null ? 'no se ejecuta' : p.tiempoDpMs.toFixed(1)}</td>
                      <td className="num">{fmtN(p.ryp)}</td>
                      <td className="num">{fmt(p.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TablaScroll>
          </>
        )}
      </Tarjeta>
    </>
  );
}

function Pares() {
  const b = useTarea({ tipo: 'brechas', n: 14, cantidad: 40, semillaBase: 20261103 + 1400 }, 'brechas');
  const d = b.datos;
  const ratio = d
    ? [...d.pares.map((p) => p.exhaustivo / Math.max(1, p.ryp))].sort((x, y) => x - y)[d.pares.length >> 1]
    : 0;
  const rypGana = d ? d.pares.filter((p) => p.ryp < p.celdas).length : 0;
  return (
    <Tarjeta titulo="Comparación por pares">
      {b.cargando && <p className="cargando">Ejecutando 40 instancias aleatorias con n = 14…</p>}
      {d && (
        <>
          <p className="peq muted">
            40 instancias aleatorias con n = 14 y semillas {20261103 + 1400}…{20261103 + 1439} (mismo generador de la
            Entrega 2).
          </p>
          <div className="rejilla">
            <div>
              <h3 className="mt0">Ávido frente al óptimo</h3>
              <Estadisticas>
                <Stat etq="Instancias óptimas" val={`${d.optimas} / ${d.instancias}`} />
                <Stat etq="Brecha media" val={`${(d.brechaMediaPorMil / 10).toFixed(2).replace('.', ',')} %`} />
                <Stat etq="Brecha máxima" val={`${(d.brechaMaxPorMil / 10).toFixed(2).replace('.', ',')} %`} nota={d.peor ? `semilla ${d.peor.semilla}` : undefined} />
              </Estadisticas>
              <p className="peq">
                El ávido suele quedar cerca, pero no hay garantía: en los contraejemplos la brecha llega al 30 % (A, B,
                C) y existen familias en las que es arbitrariamente grande (un pedido pequeño de razón alta que bloquea
                uno grande que llena el vehículo).
              </p>
            </div>
            <div>
              <h3 className="mt0">Programación dinámica frente a ramificación y poda</h3>
              <p className="peq">
                En {rypGana} de {d.instancias} instancias la ramificación y poda visitó menos nodos que celdas tiene la
                tabla. La DP cuesta siempre <M>(n+1)(W+1)</M>, sin importar los datos: gana cuando <M>W</M> es pequeño
                y la cota poda poco (muchas razones parecidas). La ramificación y poda gana cuando <M>W</M> es grande
                (ver la gráfica frente a <M>W</M>: la DP se duplica con cada bit y la RyP no cambia) y la cota es
                ajustada; pierde en instancias donde casi no poda, con peor caso <M>{String.raw`O(n\cdot 2^n)`}</M>.
              </p>
            </div>
            <div>
              <h3 className="mt0">Exhaustivo frente a ramificación y poda</h3>
              <Estadisticas>
                <Stat etq="Mediana llamadas exhaustivo / nodos RyP" val={`× ${fmtN(ratio)}`} />
              </Estadisticas>
              <p className="peq">
                Ambos recorren el mismo árbol incluir/excluir y ambos son exactos; la RyP descarta subárboles completos
                con la cota. En el peor caso los dos son exponenciales: la reducción de nodos observada no cambia la cota
                teórica.
              </p>
            </div>
          </div>
          <TablaScroll alta>
            <table>
              <thead>
                <tr>
                  <th className="num">Semilla</th>
                  <th className="num">Llamadas exhaustivo</th>
                  <th className="num">Nodos RyP</th>
                  <th className="num">Celdas DP</th>
                </tr>
              </thead>
              <tbody>
                {d.pares.map((p) => (
                  <tr key={p.semilla}>
                    <td className="num">{p.semilla}</td>
                    <td className="num">{fmtN(p.exhaustivo)}</td>
                    <td className="num">{fmtN(p.ryp)}</td>
                    <td className="num">{fmtN(p.celdas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TablaScroll>
        </>
      )}
      {b.error && <Aviso tipo="peligro">{b.error}</Aviso>}
    </Tarjeta>
  );
}
