import { useMemo, useState } from 'react';
import { aproxDecimal, fmt, fmtN } from '../../algorithms/bigint';
import { generarInstancia, semillaE2 } from '../../algorithms/generador';
import {
  comparacionesMaxTeoricas,
  estaOrdenada,
  log2Techo,
  mergeSort,
  movimientosTeoricos,
  type EventoMerge,
} from '../../algorithms/mergeSort';
import { useInstancia } from '../../estado';
import { SelectorInstancia } from '../../components/SelectorInstancia';
import { Aviso, Estadisticas, Prueba, Pseudo, Qed, Stat, TablaScroll, Tarjeta } from '../../components/ui';
import { M, MB } from '../../components/Tex';

const PSEUDO = `
merge_sort(L):                       // ordena por v/w descendente; empate: id ascendente
  A <- copia(L) ; aux <- arreglo de n posiciones
  ordenar(0, n)
  retornar A

ordenar(lo, hi):                     // ordena A[lo:hi]
  si hi - lo <= 1: retornar          // caso base: 0 o 1 elemento
  mid <- ⌊(lo + hi) / 2⌋             // DIVIDIR
  ordenar(lo, mid)                   // VENCER (mitad izquierda, ⌊m/2⌋ elementos)
  ordenar(mid, hi)                   // VENCER (mitad derecha, ⌈m/2⌉ elementos)
  mezclar(lo, mid, hi)               // COMBINAR

mezclar(lo, mid, hi):
  aux[lo:hi] <- A[lo:hi]             // hi - lo movimientos
  i <- lo ; j <- mid ; k <- lo
  mientras i < mid y j < hi:
    si antes(aux[j], aux[i]): A[k] <- aux[j] ; j <- j + 1
    si no:                    A[k] <- aux[i] ; i <- i + 1
    k <- k + 1
  copiar el resto de la mitad no agotada a A[k..]
                                     // hi - lo movimientos de regreso

antes(a, b):                         // a ≺ b sin división ni flotantes
  izq <- v_a · w_b ; der <- v_b · w_a   // productos cruzados en BigInt
  si izq ≠ der: retornar izq > der
  retornar id_a < id_b
`;

interface NodoArbol {
  lo: number;
  hi: number;
  prof: number;
  inicio: number;
  mezcla: number | null;
  resultado?: string[];
}

export default function DivideVenceras() {
  const { instancia } = useInstancia();
  const r = useMemo(() => mergeSort(instancia.candidatos, true), [instancia]);
  const eventos = r.eventos!;
  const [paso, setPaso] = useState<number | null>(null);
  const s = paso === null ? eventos.length : Math.min(paso, eventos.length);
  const n = instancia.candidatos.length;

  const nodos = useMemo(() => {
    const m = new Map<string, NodoArbol>();
    eventos.forEach((e: EventoMerge, idx) => {
      const k = `${e.lo}-${e.hi}`;
      if (e.tipo === 'mezclar') {
        const nd = m.get(k)!;
        nd.mezcla = idx;
        nd.resultado = e.resultado;
      } else m.set(k, { lo: e.lo, hi: e.hi, prof: e.prof, inicio: idx, mezcla: null });
    });
    return [...m.values()].filter((x) => x.hi > x.lo);
  }, [eventos]);

  const niveles = r.cont.prof_max;
  const acumulado = useMemo(() => {
    let c = 0;
    let mv = 0;
    for (let i = 0; i < s; i++) {
      const e = eventos[i];
      if (e.tipo === 'mezclar') {
        c += e.comparaciones;
        mv += e.movimientos;
      }
    }
    return { c, mv };
  }, [eventos, s]);
  const actual = s > 0 ? eventos[s - 1] : null;
  const original = instancia.candidatos.map((c) => c.id);

  const tablaM = useMemo(
    () =>
      [instancia.candidatos, ...[100, 500, 1000, 5000].map((k) => generarInstancia(k, semillaE2(k, 1)).candidatos)].map(
        (cands) => {
          const nn = cands.length;
          const rr = mergeSort(cands);
          return {
            n: nn,
            L: log2Techo(nn),
            teo: movimientosTeoricos(nn),
            mov: rr.cont.movimientos,
            comp: rr.cont.comparaciones,
            compMax: comparacionesMaxTeoricas(nn),
            ok: estaOrdenada(rr.ordenados),
          };
        },
      ),
    [instancia],
  );

  return (
    <>
      <h1>Divide y vencerás: merge sort por v/w</h1>
      <p className="lead">
        Se reutiliza el merge sort de la Entrega 2 como <strong>preprocesamiento común</strong> del ávido y de
        ramificación y poda: se ordena <strong>una sola vez</strong> por <M>v/w</M> descendente y, en empate, por id
        ascendente. Ordenar no resuelve la selección 0/1; solo prepara el recorrido.
      </p>
      <SelectorInstancia nMax={64} />

      <Tarjeta titulo="Las tres fases">
        <div className="rejilla">
          <div>
            <h3 className="mt0">Dividir</h3>
            <p>
              <M>{String.raw`mid=\lfloor (lo+hi)/2\rfloor`}</M>. Con <M>m = hi − lo ≥ 2</M> se cumple{' '}
              <M>{'lo < mid < hi'}</M>: las mitades miden <M>{String.raw`\lfloor m/2\rfloor`}</M> y{' '}
              <M>{String.raw`\lceil m/2\rceil`}</M>, ambas menores que <M>m</M>.
            </p>
          </div>
          <div>
            <h3 className="mt0">Casos base</h3>
            <p>
              Tramos de 0 o 1 elemento (<M>{String.raw`hi-lo\le 1`}</M>): ya están ordenados y no se modifican.
            </p>
          </div>
          <div>
            <h3 className="mt0">Combinar</h3>
            <p>
              <code>mezclar</code> copia el tramo a <code>aux</code>, intercala las dos mitades ordenadas con{' '}
              <code>antes</code> y escribe el resultado de regreso en <M>A</M>.
            </p>
          </div>
        </div>
        <Pseudo>{PSEUDO}</Pseudo>
        <Aviso tipo="info" titulo="Comparación sin división">
          Como <M>w &gt; 0</M>, <M>{String.raw`v_a/w_a > v_b/w_b \iff v_a w_b > v_b w_a`}</M>. Los productos se calculan
          con <code>BigInt</code>, así que no hay desbordamiento ni errores de redondeo para ningún tamaño de los
          números.
        </Aviso>
      </Tarjeta>

      <Tarjeta titulo="Árbol de divisiones y mezclas, paso a paso">
        <div className="controles">
          <button type="button" className="boton secundario peq" onClick={() => setPaso(0)}>
            ⏮ Inicio
          </button>
          <button type="button" className="boton secundario peq" onClick={() => setPaso(Math.max(0, s - 1))}>
            ◀ Anterior
          </button>
          <button type="button" className="boton peq" onClick={() => setPaso(Math.min(eventos.length, s + 1))}>
            Siguiente ▶
          </button>
          <button type="button" className="boton secundario peq" onClick={() => setPaso(null)}>
            Final ⏭
          </button>
          <label className="campo" style={{ flex: '1 1 200px' }}>
            Paso {s} de {eventos.length}
            <input type="range" min={0} max={eventos.length} value={s} onChange={(e) => setPaso(Number(e.target.value))} />
          </label>
        </div>
        <Estadisticas>
          <Stat etq="Comparaciones" val={acumulado.c} nota={`total: ${r.cont.comparaciones}`} />
          <Stat etq="Movimientos" val={acumulado.mv} nota={`total: ${r.cont.movimientos} · M(n) = ${movimientosTeoricos(n)}`} />
          <Stat etq="Llamadas" val={r.cont.llamadas} />
          <Stat etq="Profundidad" val={r.cont.prof_max} nota={`⌈log₂ n⌉ + 1 = ${log2Techo(Math.max(1, n)) + 1}`} />
        </Estadisticas>
        <p className="peq" aria-live="polite">
          {actual === null
            ? 'Estado inicial: lista sin ordenar.'
            : actual.tipo === 'dividir'
              ? `Dividir [${actual.lo}, ${actual.hi}) en [${actual.lo}, ${actual.mid}) y [${actual.mid}, ${actual.hi}).`
              : actual.tipo === 'base'
                ? `Caso base [${actual.lo}, ${actual.hi}): ${actual.hi - actual.lo} elemento(s), ya ordenado.`
                : `Mezclar [${actual.lo}, ${actual.mid}) y [${actual.mid}, ${actual.hi}): ${actual.comparaciones} comparaciones y ${actual.movimientos} movimientos.`}
        </p>
        {n > 0 ? (
          <div className="merge-arbol">
            <div style={{ minWidth: n * 46 }}>
              {Array.from({ length: niveles }, (_, d) => (
                <div key={d} className="merge-nivel" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
                  {nodos
                    .filter((nd) => nd.prof === d + 1)
                    .map((nd) => {
                      const alcanzado = nd.inicio < s;
                      const mezclado = nd.mezcla !== null && nd.mezcla < s;
                      const esActual = actual && actual.lo === nd.lo && actual.hi === nd.hi;
                      const ids = mezclado ? nd.resultado! : original.slice(nd.lo, nd.hi);
                      const clase = !alcanzado
                        ? 'pendiente'
                        : mezclado || nd.hi - nd.lo === 1
                          ? 'mezclado'
                          : 'dividido';
                      return (
                        <div
                          key={`${nd.lo}-${nd.hi}`}
                          className={`merge-nodo ${clase}${esActual ? ' actual' : ''}`}
                          style={{ gridColumn: `${nd.lo + 1} / ${nd.hi + 1}` }}
                          title={`[${nd.lo}, ${nd.hi})`}
                        >
                          {ids.map((id) => (
                            <span key={id} className="merge-celda">
                              {id}
                            </span>
                          ))}
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="muted">La instancia no tiene candidatos.</p>
        )}
        <div className="leyenda">
          <span>
            <span className="muestra" style={{ border: '1px dashed var(--series-1)' }} /> dividido (en espera de mezcla)
          </span>
          <span>
            <span className="muestra" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)' }} />{' '}
            ordenado
          </span>
          <span>
            <span className="muestra" style={{ outline: '2px solid var(--series-2)' }} /> paso actual
          </span>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Orden obtenido (Tabla 8)">
        <TablaScroll>
          <table>
            <thead>
              <tr>
                <th className="num">Posición</th>
                <th>ID</th>
                <th className="num">Consumo (kg)</th>
                <th className="num">Beneficio (COP)</th>
                <th className="num">v/w (COP/kg, solo para mostrar)</th>
              </tr>
            </thead>
            <tbody>
              {r.ordenados.map((c, i) => (
                <tr key={c.id}>
                  <td className="num">{i + 1}</td>
                  <td className="mono">{c.id}</td>
                  <td className="num">{fmt(c.w)}</td>
                  <td className="num">{fmt(c.v)}</td>
                  <td className="num">{aproxDecimal(c.v, c.w, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TablaScroll>
        <p className="peq muted">
          Con la Tabla 1 los empates P01/P08 (15.000), P06/P09 (13.000) y P04/P05 (12.000) quedan por id ascendente, y
          se miden 29 comparaciones y 88 movimientos, como en el PDF.
        </p>
      </Tarjeta>

      <Tarjeta titulo="Justificación teórica">
        <Prueba titulo="Lema 1: el criterio ≺ es un orden total estricto" abierta>
          <p>
            Defínase <M>{String.raw`a \prec b \iff v_a w_b > v_b w_a`}</M>, o bien <M>{String.raw`v_a w_b = v_b w_a`}</M>{' '}
            y <M>{String.raw`id_a < id_b`}</M>. Como <M>w &gt; 0</M>, la primera condición equivale a{' '}
            <M>{String.raw`v_a/w_a > v_b/w_b`}</M>, así que <M>{String.raw`\prec`}</M> es el orden lexicográfico sobre el
            par <M>{String.raw`(-v/w,\ id)`}</M>. Ese orden es irreflexivo y transitivo; como los ids son distintos
            (validar lo garantiza), dos candidatos distintos siempre son comparables. «A está ordenada» significa{' '}
            <M>{String.raw`A[t] \prec A[t+1]`}</M> para todo <M>t</M>. <Qed />
          </p>
        </Prueba>
        <Prueba titulo="Lema 2: corrección de mezclar (orden y conservación)">
          <p>
            Si <M>A[lo:mid]</M> y <M>A[mid:hi]</M> están ordenados, al terminar <code>mezclar</code> el tramo{' '}
            <M>A[lo:hi]</M> está ordenado y contiene exactamente los mismos elementos.
          </p>
          <ul className="lista-limpia">
            <li>
              <strong>Invariante:</strong> <M>{String.raw`lo \le i \le mid`}</M>, <M>{String.raw`mid \le j \le hi`}</M>,{' '}
              <M>{String.raw`k-lo=(i-lo)+(j-mid)`}</M>; <M>A[lo:k]</M> es la mezcla ordenada de <M>aux[lo:i]</M> y{' '}
              <M>aux[mid:j]</M>, y todo elemento de <M>A[lo:k]</M> va antes que <M>aux[i]</M> y que <M>aux[j]</M>{' '}
              cuando existen.
            </li>
            <li>
              <strong>Inicialización:</strong> <M>i = lo</M>, <M>j = mid</M>, <M>k = lo</M>; <M>A[lo:k]</M> es vacío.
            </li>
            <li>
              <strong>Preservación:</strong> si <M>{String.raw`aux[j] \prec aux[i]`}</M>, <M>aux[j]</M> es el menor de
              los pendientes (cada mitad está ordenada) y se escribe en <M>A[k]</M>. Si no, por ser el orden total,{' '}
              <M>{String.raw`aux[i] \prec aux[j]`}</M> y se escribe <M>aux[i]</M>. En ambos casos se mantiene el
              invariante.
            </li>
            <li>
              <strong>Terminación:</strong> el variante <M>(mid − i) + (hi − j)</M> es entero, no negativo y baja 1 por
              iteración. Los ciclos de cola copian el resto ya ordenado de la mitad no agotada.
            </li>
            <li>
              <strong>Conservación:</strong> cada índice de <M>aux[lo:hi]</M> se lee exactamente una vez y se escribe
              en exactamente una posición de <M>A[lo:hi]</M>: el tramo final es una permutación del inicial; no se
              pierde ni se duplica ningún candidato. <Qed />
            </li>
          </ul>
        </Prueba>
        <Prueba titulo="Teorema: corrección de merge sort por inducción fuerte">
          <p>
            Para todo tramo de longitud <M>m = hi − lo</M>, <code>ordenar(lo, hi)</code> termina y deja <M>A[lo:hi]</M>{' '}
            ordenado según <M>{String.raw`\prec`}</M> y con los mismos elementos.
          </p>
          <p>
            <strong>Base</strong> (<M>{String.raw`m \le 1`}</M>): el tramo vacío o de un elemento ya está ordenado y no
            se modifica. <strong>Paso</strong> (<M>{String.raw`m \ge 2`}</M>): <M>{String.raw`lo < mid < hi`}</M>, así que
            las mitades miden <M>{String.raw`\lfloor m/2\rfloor`}</M> y <M>{String.raw`\lceil m/2\rceil`}</M>, ambas{' '}
            <M>{'< m'}</M>. Por hipótesis de inducción quedan ordenadas y con sus elementos; por el Lema 2,{' '}
            <code>mezclar</code> produce el tramo completo ordenado y con los mismos elementos. La terminación se sigue
            de que <M>m</M> decrece estrictamente en cada llamada. Con <M>lo = 0</M>, <M>hi = n</M> se obtiene el
            resultado para toda la lista. <Qed />
          </p>
        </Prueba>
        <Prueba titulo="Recurrencia y su solución (teorema maestro y árbol)">
          <MB>{String.raw`T(n)=T(\lceil n/2\rceil)+T(\lfloor n/2\rfloor)+\Theta(n),\qquad T(0)=T(1)=\Theta(1)`}</MB>
          <p>
            <strong>Teorema maestro.</strong> <M>a = 2</M>, <M>b = 2</M>,{' '}
            <M>{String.raw`f(n)=\Theta(n)=\Theta(n^{\log_2 2})`}</M>: es el <strong>caso 2</strong>, luego{' '}
            <M>{String.raw`T(n)=\Theta(n\log n)`}</M>. (Los pisos y techos no alteran el resultado.)
          </p>
          <p>
            <strong>Árbol de recursión.</strong> En la profundidad <M>d</M> los tramos miden{' '}
            <M>{String.raw`\lfloor n/2^d\rfloor`}</M> o <M>{String.raw`\lceil n/2^d\rceil`}</M> y juntos suman a lo sumo{' '}
            <M>n</M> elementos, así que cada nivel cuesta <M>{String.raw`\Theta(n)`}</M>. Hay{' '}
            <M>{String.raw`\lceil\log_2 n\rceil`}</M> niveles con mezclas: total <M>{String.raw`\Theta(n\log n)`}</M>.
          </p>
          <p>
            <strong>Costo exacto incluyendo las copias a aux y de regreso.</strong> Cada mezcla de un tramo de tamaño{' '}
            <M>m</M> hace <M>m</M> movimientos hacia <code>aux</code> y <M>m</M> de regreso:
          </p>
          <MB>{String.raw`M(n)=M(\lceil n/2\rceil)+M(\lfloor n/2\rfloor)+2n,\quad M(1)=M(0)=0`}</MB>
          <p>
            Sea <M>{String.raw`L=\lceil\log_2 n\rceil`}</M>. Las hojas del árbol (tramos de 1 elemento) están solo en
            las profundidades <M>L − 1</M> y <M>L</M>. Si hay <M>a</M> hojas en <M>L − 1</M> y <M>b</M> en <M>L</M>,
            entonces <M>a + b = n</M> y <M>{String.raw`a+b/2=2^{L-1}`}</M>, de donde <M>{String.raw`a=2^L-n`}</M>. Cada
            elemento participa en tantas mezclas como la profundidad de su hoja, así que la suma de los tamaños de
            todas las mezclas es <M>{String.raw`a(L-1)+bL=nL-a=nL-2^L+n`}</M>. Con dos movimientos por elemento y
            mezcla:
          </p>
          <MB>{String.raw`M(n)=2\left(n\lceil\log_2 n\rceil-2^{\lceil\log_2 n\rceil}+n\right)`}</MB>
          <p>
            Con <M>n = 12</M>: <M>{String.raw`L=4`}</M>, <M>{String.raw`M=2(48-16+12)=88`}</M>. Las comparaciones
            quedan entre <M>{String.raw`\approx (n/2)\log_2 n`}</M> y <M>{String.raw`n\lceil\log_2 n\rceil-2^{\lceil\log_2 n\rceil}+1`}</M>.
            Memoria: <M>A</M> y <M>aux</M> (<M>2n</M> referencias, una sola vez) más <M>{String.raw`\lceil\log_2 n\rceil+1`}</M>{' '}
            marcos de pila: <M>{String.raw`\Theta(n)`}</M>. <Qed />
          </p>
        </Prueba>
      </Tarjeta>

      <Tarjeta titulo="M(n) teórico frente a lo medido">
        <TablaScroll>
          <table className="tarjetas-movil">
            <thead>
              <tr>
                <th className="num">n</th>
                <th className="num">⌈log₂ n⌉</th>
                <th className="num">M(n) teórico</th>
                <th className="num">Movimientos medidos</th>
                <th className="num">Comparaciones medidas</th>
                <th className="num">Cota sup. comparaciones</th>
                <th>¿Ordenada?</th>
              </tr>
            </thead>
            <tbody>
              {tablaM.map((f, idx) => (
                <tr key={idx}>
                  <td className="num titulo-celda" data-label="n">
                    n = {fmtN(f.n)}
                  </td>
                  <td className="num" data-label="⌈log₂ n⌉">{f.L}</td>
                  <td className="num" data-label="M(n) teórico">{fmtN(f.teo)}</td>
                  <td className="num" data-label="Movimientos medidos">{fmtN(f.mov)}</td>
                  <td className="num" data-label="Comparaciones medidas">{fmtN(f.comp)}</td>
                  <td className="num" data-label="Cota sup.">{fmtN(f.compMax)}</td>
                  <td data-label="¿Ordenada?">{f.ok ? 'Sí' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TablaScroll>
        <p className="peq muted">
          La primera fila usa la instancia elegida arriba; las demás, instancias generadas con la semilla
          20261103 + 100·n + 1 de la Entrega 2.
        </p>
      </Tarjeta>
    </>
  );
}
