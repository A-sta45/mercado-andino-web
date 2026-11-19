import { useMemo } from 'react';
import { aproxDecimal, fmt } from '../../algorithms/bigint';
import { avido } from '../../algorithms/avido';
import { exhaustivo } from '../../algorithms/exhaustivo';
import { aMapa, type Instancia } from '../../algorithms/tipos';
import { CONTRAEJEMPLO_ABC, CONTRAEJEMPLO_MA, CONTRAEJEMPLO_MA2 } from '../../data/tablas';
import { useInstancia } from '../../estado';
import { SelectorInstancia } from '../../components/SelectorInstancia';
import { brecha, ResultadoVerificado } from '../../components/Resultado';
import { Aviso, Chip, Estadisticas, Prueba, Pseudo, Qed, Stat, TablaScroll, Tarjeta } from '../../components/ui';
import { M, MB } from '../../components/Tex';

const PSEUDO = `
avido(C, W):
  orden <- merge_sort(C)              // v/w descendente; empate: id (Θ(n log n))
  r <- W ; sel <- [] ; valor <- 0
  para cada x en orden:               // Θ(n)
    // Invariante: Σ w(sel) = W - r ≤ W y sel sin repetidos
    si w(x) <= r:                     // ¿cabe en la capacidad restante?
      sel <- sel + [x] ; r <- r - w(x) ; valor <- valor + v(x)
  retornar sel, valor                 // factible; NO necesariamente óptima
`;

const LIMITE_EXH = 20; // en el hilo principal; la Comparación usa un Web Worker hasta n = 22

export default function Avido() {
  const { instancia } = useInstancia();
  const r = useMemo(() => avido(instancia.candidatos, instancia.W), [instancia]);
  const n = instancia.candidatos.length;
  const ref = useMemo(
    () => (n <= LIMITE_EXH ? exhaustivo(aMapa(instancia.candidatos), instancia.W) : null),
    [instancia, n],
  );

  return (
    <>
      <h1>Algoritmo ávido</h1>
      <p className="lead">
        Recorre el orden <M>v/w</M> del merge sort e incluye cada candidato si cabe en la capacidad restante.
      </p>
      <Aviso tipo="advertencia" titulo="Es una HEURÍSTICA para la selección 0/1">
        Siempre devuelve una selección factible y es rápido, pero <strong>no garantiza el óptimo</strong>. Abajo hay
        contraejemplos verificados con el exhaustivo.
      </Aviso>
      <SelectorInstancia />

      <Tarjeta titulo="Pseudocódigo">
        <Pseudo>{PSEUDO}</Pseudo>
      </Tarjeta>

      <Tarjeta titulo="Ejecución en vivo">
        <div className="dos-columnas">
          <ResultadoVerificado titulo="Ávido" instancia={instancia} seleccion={r.seleccion} valor={r.valor} />
          {ref ? (
            <ResultadoVerificado titulo="Óptimo (exhaustivo)" instancia={instancia} seleccion={ref.seleccion} valor={ref.valor} />
          ) : (
            <div className="stat">
              <span className="etq">Óptimo (exhaustivo)</span>
              <span className="peq">No se ejecuta aquí con n &gt; {LIMITE_EXH} para no bloquear el navegador (la pestaña Comparación lo corre en un Web Worker hasta n = 22).</span>
            </div>
          )}
        </div>
        <Estadisticas>
          {ref && <Stat etq="Brecha (OPT − v)/OPT" val={brecha(ref.valor, r.valor)} nota={r.valor === ref.valor ? 'coincide con el óptimo' : 'no es óptima'} />}
          <Stat etq="Comparaciones merge sort" val={r.contMerge.comparaciones} />
          <Stat etq="Movimientos merge sort" val={r.contMerge.movimientos} />
          <Stat etq="Comparaciones del recorrido" val={r.comparacionesRecorrido} nota="una por candidato" />
          <Stat etq="Operaciones totales" val={r.operaciones} />
        </Estadisticas>
        {ref && r.valor === ref.valor && (
          <Aviso tipo="info">
            En esta instancia el ávido coincide con el óptimo. Eso no demuestra que sea óptimo en general.
          </Aviso>
        )}
        <TablaScroll alta>
          <table>
            <thead>
              <tr>
                <th className="num">#</th>
                <th>ID</th>
                <th className="num">w</th>
                <th className="num">v</th>
                <th className="num">v/w</th>
                <th className="num">Restante antes</th>
                <th>Decisión</th>
              </tr>
            </thead>
            <tbody>
              {r.pasos.map((p) => (
                <tr key={p.id}>
                  <td className="num">{p.posicion + 1}</td>
                  <td className="mono">{p.id}</td>
                  <td className="num">{fmt(p.w)}</td>
                  <td className="num">{fmt(p.v)}</td>
                  <td className="num">{aproxDecimal(p.v, p.w, 2)}</td>
                  <td className="num">{fmt(p.restanteAntes)}</td>
                  <td>{p.incluido ? <Chip tipo="ok">incluye</Chip> : <Chip>no cabe</Chip>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TablaScroll>
      </Tarjeta>

      <Tarjeta titulo="Justificación teórica">
        <Prueba titulo="Factibilidad (invariante)" abierta>
          <p>
            Sea <M>{String.raw`sel_t`}</M> la selección tras procesar los primeros <M>t</M> candidatos del orden y{' '}
            <M>{String.raw`r_t`}</M> la capacidad restante. <strong>Invariante</strong>{' '}
            <M>{String.raw`I(t)`}</M>: <M>{String.raw`\sum_{x\in sel_t} w_x = W-r_t \le W`}</M>,{' '}
            <M>{String.raw`r_t \ge 0`}</M> y <M>{String.raw`sel_t`}</M> no tiene repetidos.
          </p>
          <p>
            <strong>Inicialización:</strong> <M>{String.raw`sel_0=\varnothing`}</M>, <M>{String.raw`r_0=W\ge 0`}</M>.{' '}
            <strong>Preservación:</strong> si el candidato <M>x</M> se incluye es porque <M>{String.raw`w_x \le r_t`}</M>,
            así que <M>{String.raw`r_{t+1}=r_t-w_x\ge 0`}</M> y el consumo sube exactamente <M>w_x</M>; si no se incluye,
            nada cambia. Como el orden es una permutación de los candidatos (merge sort conserva los elementos), cada
            uno se examina una sola vez y no puede repetirse. <strong>Salida:</strong> <M>{String.raw`I(n)`}</M> da una
            selección factible, que <code>verificar</code> acepta. <Qed />
          </p>
        </Prueba>
        <Prueba titulo="Terminación (variante)">
          <p>
            Variante: <M>{String.raw`t' = n - t`}</M>, el número de candidatos restantes. Es un entero no negativo y
            baja exactamente 1 por iteración; el ciclo hace <M>n</M> iteraciones. <Qed />
          </p>
        </Prueba>
        <Prueba titulo="Costo">
          <MB>{String.raw`T(n)=\underbrace{\Theta(n\log n)}_{\text{merge sort}}+\underbrace{\Theta(n)}_{\text{recorrido}}=\Theta(n\log n)`}</MB>
          <p>
            Memoria auxiliar <M>{String.raw`\Theta(n)`}</M> (el arreglo <code>aux</code> del merge sort y la
            selección). Si el orden ya está calculado (por ejemplo, para ramificación y poda) el recorrido solo cuesta{' '}
            <M>{String.raw`\Theta(n)`}</M>.
          </p>
        </Prueba>
        <Aviso tipo="peligro" titulo="No usar la demostración de la mochila fraccionaria">
          <p>
            La prueba clásica del ávido fraccionario (intercambio: si una solución óptima no toma tanto del mejor{' '}
            <M>v/w</M> como sea posible, se cambia una porción de otro objeto por una porción igual en peso del mejor y
            el valor no baja) <strong>necesita poder tomar fracciones</strong>. En la versión 0/1 ese intercambio no
            es posible: no se puede sacar «medio pedido» para meter otro, y la capacidad que sobra al final no se puede
            rellenar con una fracción del siguiente.
          </p>
          <p>
            En el contraejemplo A, B, C con <M>W = 10</M>: la versión fraccionaria toma A entero y{' '}
            <M>{String.raw`4/5`}</M> de B, con valor <M>{String.raw`7+4=11`}</M>; el ávido 0/1 toma A, ya no cabe nada
            más y se queda en <M>7</M>, mientras que el óptimo 0/1 es B + C <M>= 10</M>. Que el ávido fraccionario sea
            óptimo para su problema dice que <M>11</M> es una <strong>cota superior</strong> del 0/1 (eso es lo que usa
            ramificación y poda), no que el ávido 0/1 sea óptimo.
          </p>
        </Aviso>
      </Tarjeta>

      <Tarjeta titulo="Contraejemplos de optimalidad (verificados con el exhaustivo)">
        <div className="rejilla">
          <Contraejemplo
            titulo="Clásico: W = 10, A(6, 7), B(5, 5), C(5, 5)"
            instancia={CONTRAEJEMPLO_ABC}
            explicacion="A tiene la mayor razón (7/6 ≈ 1,17 > 1). Tras tomarlo quedan 4 kg y ni B ni C caben."
          />
          <Contraejemplo
            titulo="Mercado Andino: los 12 pedidos de la Tabla 1 con W = 12 kg"
            instancia={CONTRAEJEMPLO_MA}
            explicacion="P07 (15.714 COP/kg) va primero y deja 5 kg; luego solo cabe P09 (4 kg). P01 solo llena los 12 kg y vale más."
          />
          <Contraejemplo
            titulo="Mercado Andino reducido: {P01, P04, P07} con W = 12 kg"
            instancia={CONTRAEJEMPLO_MA2}
            explicacion="P07 + P04 llenan los 12 kg con 170.000; P01 solo da 180.000."
          />
        </div>
      </Tarjeta>
    </>
  );
}

function Contraejemplo({ titulo, instancia, explicacion }: { titulo: string; instancia: Instancia; explicacion: string }) {
  const a = useMemo(() => avido(instancia.candidatos, instancia.W), [instancia]);
  const e = useMemo(() => exhaustivo(aMapa(instancia.candidatos), instancia.W), [instancia]);
  return (
    <div className="tarjeta" style={{ margin: 0 }}>
      <h3 className="mt0">{titulo}</h3>
      <p className="peq">{explicacion}</p>
      <ResultadoVerificado titulo="Ávido" instancia={instancia} seleccion={a.seleccion} valor={a.valor} />
      <div style={{ height: 8 }} />
      <ResultadoVerificado titulo="Óptimo (exhaustivo)" instancia={instancia} seleccion={e.seleccion} valor={e.valor} />
      <p className="peq" style={{ marginBottom: 0 }}>
        Brecha del ávido: <strong>{brecha(e.valor, a.valor)}</strong> · exhaustivo: {e.cont.llamadas} llamadas
      </p>
    </div>
  );
}
