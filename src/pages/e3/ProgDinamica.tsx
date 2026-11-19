import { useMemo } from 'react';
import { bits, fmt, fmtN } from '../../algorithms/bigint';
import { celdasDP, dp, ErrorTablaGrande, LIMITE_CELDAS, type ResultadoDP } from '../../algorithms/dp';
import { exhaustivo } from '../../algorithms/exhaustivo';
import { aMapa } from '../../algorithms/tipos';
import { useInstancia } from '../../estado';
import { SelectorInstancia } from '../../components/SelectorInstancia';
import { brecha, ResultadoVerificado } from '../../components/Resultado';
import { Aviso, Estadisticas, Prueba, Pseudo, Qed, Stat, TablaScroll, Tarjeta } from '../../components/ui';
import { M, MB } from '../../components/Tex';

const PSEUDO = `
dp(C, W):                              // C ordenado por id: candidatos 1..n
  para c en 0..W: F[0][c] <- 0         // base: sin candidatos
  para i en 1..n:
    F[i][0] <- 0                       // base: sin capacidad
    para c en 1..W:
      si w_i > c: F[i][c] <- F[i-1][c]                 // no cabe: solo excluir
      si no:      F[i][c] <- max(F[i-1][c],            // excluir
                                 v_i + F[i-1][c - w_i]) // incluir (solo si cabe)
  // reconstrucción desde F[n][W] hacia atrás
  c <- W ; sel <- []
  para i en n..1:
    si F[i][c] ≠ F[i-1][c]:            // el valor cambió: se incluyó i
      sel <- [id_i] + sel ; c <- c - w_i
  retornar F[n][W], sel
`;

const LIMITE_ESTADOS = 18;

export default function ProgDinamica() {
  const { instancia } = useInstancia();
  const n = instancia.candidatos.length;
  const C = useMemo(() => aMapa(instancia.candidatos), [instancia]);
  const res = useMemo((): { r: ResultadoDP | null; error: string | null } => {
    try {
      return { r: dp(C, instancia.W), error: null };
    } catch (e) {
      if (e instanceof ErrorTablaGrande) return { r: null, error: e.message };
      throw e;
    }
  }, [C, instancia.W]);
  const ref = useMemo(() => (n <= 20 ? exhaustivo(C, instancia.W) : null), [C, instancia.W, n]);
  const estados = useMemo(() => {
    if (n > LIMITE_ESTADOS) return null;
    const e = exhaustivo(C, instancia.W, { registrarEstados: true });
    const lista = [...e.estados!.entries()].map(([k, veces]) => {
      const [i, r] = k.split('|');
      return { i: Number(i), r, veces };
    });
    const repetidos = lista.filter((x) => x.veces > 1).sort((a, b) => b.veces - a.veces || a.i - b.i);
    return { llamadas: e.cont.llamadas, distintos: lista.length, repetidos };
  }, [C, instancia.W, n]);
  const totalCeldas = celdasDP(n, instancia.W);

  return (
    <>
      <h1>Programación dinámica</h1>
      <p className="lead">
        Resuelve la selección 0/1 de forma <strong>exacta</strong> llenando una tabla de subproblemas. Su costo
        depende de <M>n</M> y del <strong>valor</strong> de <M>W</M>.
      </p>
      <SelectorInstancia />

      <Tarjeta titulo="Estado, casos base y transición">
        <p>
          <M>{String.raw`F(i,c)`}</M> = mayor beneficio usando los candidatos <M>1..i</M> (en orden de id) con
          capacidad <M>c</M>.
        </p>
        <MB>{String.raw`F(0,c)=0\ \ \forall c,\qquad F(i,0)=0`}</MB>
        <MB>{String.raw`F(i,c)=\begin{cases}F(i-1,c) & \text{si } w_i>c\\[2pt] \max\{F(i-1,c),\ v_i+F(i-1,c-w_i)\} & \text{si } w_i\le c\end{cases}`}</MB>
        <p className="peq">Solo se incluye un candidato si cabe. La respuesta es <M>{String.raw`F(n,W)`}</M>.</p>
        <Pseudo>{PSEUDO}</Pseudo>
      </Tarjeta>

      <Tarjeta titulo="Ejecución en vivo">
        <Estadisticas>
          <Stat etq="Celdas (n+1)(W+1)" val={fmt(totalCeldas)} nota={`n = ${n}, W = ${fmt(instancia.W)}`} />
          <Stat etq="Celdas calculadas n·W" val={fmt(BigInt(n) * instancia.W)} />
          <Stat etq="Bits de W" val={bits(instancia.W)} nota="W ≈ 2^(bits) en valor" />
          {res.r && <Stat etq="Comparaciones" val={fmtN(res.r.cont.comparaciones)} />}
          {res.r && <Stat etq="Sumas" val={fmtN(res.r.cont.sumas)} />}
        </Estadisticas>
        {res.error ? (
          <Aviso tipo="advertencia" titulo="Tabla demasiado grande para el navegador">
            {res.error} El límite de esta demostración es {fmt(LIMITE_CELDAS)} celdas. La DP es pseudopolinomial:
            su costo crece con el valor de <M>W</M>, no con sus bits.
          </Aviso>
        ) : (
          res.r && (
            <>
              <div className="dos-columnas">
                <ResultadoVerificado titulo="Programación dinámica: F(n, W)" instancia={instancia} seleccion={res.r.seleccion} valor={res.r.valor} />
                {ref ? (
                  <ResultadoVerificado titulo="Exhaustivo (referencia)" instancia={instancia} seleccion={ref.seleccion} valor={ref.valor} />
                ) : (
                  <div className="stat">El exhaustivo no se ejecuta aquí con n &gt; 20.</div>
                )}
              </div>
              {ref && (
                <p className="peq">
                  Brecha frente al exhaustivo: <strong>{brecha(ref.valor, res.r.valor)}</strong>{' '}
                  {res.r.valor === ref.valor ? '(igual, como garantiza la prueba de optimalidad).' : ''}
                </p>
              )}
              <TablaDP r={res.r} />
            </>
          )
        )}
      </Tarjeta>

      <Tarjeta titulo="Subestructura óptima y subproblemas repetidos">
        <Prueba titulo="Subestructura óptima" abierta>
          <p>
            Sea <M>S</M> una selección óptima para <M>{String.raw`(1..i,\ c)`}</M>. Si <M>{String.raw`i\notin S`}</M>,
            entonces <M>S</M> es una selección de <M>1..i−1</M> con capacidad <M>c</M>, y debe ser óptima para ese
            subproblema: si hubiera una mejor, también serviría para <M>(1..i, c)</M> y superaría a <M>S</M>. Si{' '}
            <M>{String.raw`i\in S`}</M> (lo que exige <M>{String.raw`w_i\le c`}</M>), entonces{' '}
            <M>{String.raw`S\setminus\{i\}`}</M> es una selección de <M>1..i−1</M> con capacidad <M>{String.raw`c-w_i`}</M>{' '}
            y debe ser óptima para ella: si existiera <M>{"S'"}</M> mejor, <M>{String.raw`S'\cup\{i\}`}</M> cabría en{' '}
            <M>c</M> y superaría a <M>S</M>. Así, la solución óptima se arma con soluciones óptimas de subproblemas. <Qed />
          </p>
        </Prueba>
        <Prueba titulo="Subproblemas repetidos en el exhaustivo" abierta>
          <p>
            El exhaustivo de la Entrega 2 llama a <code>mejor(i, r)</code>: el mismo par (candidato siguiente,
            capacidad restante) aparece por caminos distintos. Por ejemplo, con la Tabla 1 en orden de id, incluir P05
            (4 kg) y excluir P09 (4 kg), o excluir P05 e incluir P09, con las mismas decisiones sobre P06, P07 y P08,
            llevan al mismo estado tras decidir P09. Cada repetición recalcula un subárbol completo; la DP calcula
            cada estado una sola vez.
          </p>
          {estados ? (
            <>
              <Estadisticas>
                <Stat etq="Llamadas del exhaustivo" val={fmtN(estados.llamadas)} />
                <Stat etq="Estados (i, r) distintos" val={fmtN(estados.distintos)} />
                <Stat etq="Estados que se repiten" val={fmtN(estados.repetidos.length)} />
                <Stat etq="Llamadas redundantes" val={fmtN(estados.llamadas - estados.distintos)} nota="llamadas − distintos" />
              </Estadisticas>
              {estados.repetidos.length > 0 && (
                <TablaScroll alta>
                  <table>
                    <thead>
                      <tr>
                        <th className="num">i (candidatos ya decididos)</th>
                        <th className="num">r (capacidad restante)</th>
                        <th className="num">Veces visitado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estados.repetidos.slice(0, 60).map((x) => (
                        <tr key={`${x.i}|${x.r}`}>
                          <td className="num">{x.i}</td>
                          <td className="num">{fmt(BigInt(x.r))}</td>
                          <td className="num">{x.veces}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TablaScroll>
              )}
              <p className="peq muted">
                Se muestran los 60 estados más repetidos. En <code>mejor(i, r)</code> el subproblema es el sufijo
                (candidatos <M>i+1..n</M>); la DP usa prefijos (<M>1..i</M>). Son la misma idea leída en sentidos
                opuestos.
              </p>
            </>
          ) : (
            <p className="muted peq">El registro de estados se calcula para n ≤ {LIMITE_ESTADOS}.</p>
          )}
        </Prueba>
        <Prueba titulo="Optimalidad por inducción sobre i">
          <p>
            Sea <M>{String.raw`OPT(i,c)`}</M> el mayor beneficio de un subconjunto de <M>1..i</M> con consumo{' '}
            <M>{String.raw`\le c`}</M>. Se demuestra que <M>{String.raw`F(i,c)=OPT(i,c)`}</M> para todo{' '}
            <M>{String.raw`0\le c\le W`}</M>.
          </p>
          <p>
            <strong>Base (i = 0):</strong> solo existe el subconjunto vacío, con beneficio 0, y{' '}
            <M>{String.raw`F(0,c)=0`}</M>. Para <M>c = 0</M>, como todo <M>{String.raw`w>0`}</M>, solo cabe el vacío y{' '}
            <M>{String.raw`F(i,0)=0`}</M>.
          </p>
          <p>
            <strong>Paso:</strong> supóngase <M>{String.raw`F(i-1,c')=OPT(i-1,c')`}</M> para todo <M>{"c'"}</M>. Toda
            selección factible de <M>1..i</M> con capacidad <M>c</M> o no contiene a <M>i</M> (y su mejor valor es{' '}
            <M>{String.raw`OPT(i-1,c)`}</M>) o lo contiene, lo que exige <M>{String.raw`w_i\le c`}</M>, y su mejor valor es{' '}
            <M>{String.raw`v_i+OPT(i-1,c-w_i)`}</M> por la subestructura óptima. Luego{' '}
            <M>{String.raw`OPT(i,c)`}</M> es el máximo de las opciones disponibles, que es exactamente la transición
            con los valores de la hipótesis. Así <M>{String.raw`F(i,c)=OPT(i,c)`}</M>. <Qed />
          </p>
          <p>
            <strong>Reconstrucción.</strong> Si <M>{String.raw`F(i,c)\ne F(i-1,c)`}</M> el máximo solo se alcanza
            incluyendo <M>i</M> (y entonces <M>{String.raw`w_i\le c`}</M>), así que se agrega <M>i</M> y se continúa en{' '}
            <M>{String.raw`(i-1,c-w_i)`}</M>; si son iguales, excluir <M>i</M> es óptimo. Cada paso conserva{' '}
            «valor pendiente = <M>F</M> de la celda actual» y la capacidad nunca baja de 0, así que los ids obtenidos
            forman una selección factible con beneficio <M>{String.raw`F(n,W)`}</M>. Cuesta <M>{String.raw`\Theta(n)`}</M>.
          </p>
        </Prueba>
        <Prueba titulo="Tiempo Θ(nW) y memoria: W es el VALOR de la capacidad">
          <p>
            Hay <M>{String.raw`(n+1)(W+1)`}</M> celdas y cada una cuesta <M>{String.raw`O(1)`}</M> operaciones (sobre
            números de a lo sumo <M>{String.raw`\log_2\sum v`}</M> bits): tiempo <M>{String.raw`\Theta(nW)`}</M>. La tabla
            completa ocupa <M>{String.raw`\Theta(nW)`}</M> de memoria y permite reconstruir los ids. Si solo se quiere el
            valor, basta un arreglo de <M>W + 1</M> posiciones recorrido de <M>c = W</M> hacia abajo:{' '}
            <M>{String.raw`\Theta(W)`}</M> de memoria, <strong>pero se pierde la reconstrucción</strong> (ya no se
            sabe en qué fila cambió cada valor).
          </p>
          <Aviso tipo="advertencia" titulo="Θ(nW) no es polinómico en la longitud de la entrada">
            <M>W</M> se escribe con unos <M>{String.raw`\log_2 W`}</M> bits. Duplicar <M>W</M> agrega un solo bit a la
            entrada pero duplica las celdas: <M>{String.raw`\Theta(nW)=\Theta(n\cdot 2^{\text{bits}(W)})`}</M>. Por eso
            la DP es <strong>pseudopolinomial</strong> (ver Entrega 4). Con <M>W</M> pequeño es muy rápida: esas
            son instancias fáciles.
          </Aviso>
        </Prueba>
      </Tarjeta>
    </>
  );
}

function TablaDP({ r }: { r: ResultadoDP }) {
  const W = r.tabla[0].length - 1;
  const enCamino = new Map(r.camino.map((p) => [`${p.i},${p.c}`, p.incluye]));
  // Columnas a mostrar: todas si W ≤ 60; si no, bordes + columnas del camino.
  const cols = useMemo(() => {
    if (W <= 60) return Array.from({ length: W + 1 }, (_, c) => c);
    const s = new Set<number>();
    for (let c = 0; c <= 4; c++) s.add(c);
    for (let c = W - 4; c <= W; c++) s.add(c);
    for (const p of r.camino) for (let d = -1; d <= 1; d++) if (p.c + d >= 0 && p.c + d <= W) s.add(p.c + d);
    return [...s].sort((a, b) => a - b);
  }, [W, r.camino]);
  const conHuecos: (number | null)[] = [];
  cols.forEach((c, k) => {
    if (k > 0 && c !== cols[k - 1] + 1) conHuecos.push(null);
    conHuecos.push(c);
  });
  const mostradas = cols.length * r.tabla.length;
  return (
    <>
      <h3>Tabla F(i, c) con el camino de reconstrucción</h3>
      <p className="peq muted">
        {W <= 60
          ? `Tabla completa: ${fmtN(r.cont.celdas)} celdas.`
          : `W es grande: se muestran ${fmtN(mostradas)} de ${fmtN(r.cont.celdas)} celdas (bordes y columnas del camino; «…» indica columnas ocultas).`}{' '}
        Celdas resaltadas: el recorrido desde F(n, W) hacia atrás; en naranja, donde se incluye el candidato.
      </p>
      <div className="leyenda">
        <span>
          <span className="muestra" style={{ background: 'color-mix(in srgb, var(--series-2) 25%, var(--surface))', outline: '2px solid var(--series-2)' }} />
          se incluye el candidato de la fila
        </span>
        <span>
          <span className="muestra" style={{ background: 'var(--accent-soft)', outline: '2px solid var(--accent)' }} />
          se excluye (F(i, c) = F(i−1, c))
        </span>
      </div>
      <TablaScroll alta>
        <table className="tabla-dp">
          <thead>
            <tr>
              <th className="fila-cab">i · candidato (w, v)</th>
              {conHuecos.map((c, k) =>
                c === null ? (
                  <th key={`h${k}`} className="hueco">
                    …
                  </th>
                ) : (
                  <th key={c}>c={c}</th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {r.tabla.map((fila, i) => (
              <tr key={i}>
                <td className="fila-cab">
                  {i} · {i === 0 ? '—' : `${r.items[i - 1].id} (${fmt(r.items[i - 1].w)}, ${fmt(r.items[i - 1].v)})`}
                </td>
                {conHuecos.map((c, k) => {
                  if (c === null)
                    return (
                      <td key={`h${k}`} className="hueco">
                        …
                      </td>
                    );
                  const clave = `${i},${c}`;
                  const camino = enCamino.has(clave);
                  const incl = enCamino.get(clave);
                  const cls = [camino ? 'camino' : '', incl ? 'incluye' : '', fila[c] === 0n ? 'cero' : ''].join(' ');
                  return (
                    <td key={c} className={cls} title={`F(${i}, ${c}) = ${fmt(fila[c])}`}>
                      {fmt(fila[c])}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </TablaScroll>
    </>
  );
}
