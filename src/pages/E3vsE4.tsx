import { useMemo } from 'react';
import { bits, fmt } from '../algorithms/bigint';
import { decidir, optimoPorBusquedaBinaria } from '../algorithms/decision';
import { exhaustivo } from '../algorithms/exhaustivo';
import { aMapa } from '../algorithms/tipos';
import { useInstancia } from '../estado';
import { SelectorInstancia } from '../components/SelectorInstancia';
import { Aviso, Chip, Estadisticas, Stat, TablaScroll, Tarjeta } from '../components/ui';
import { M } from '../components/Tex';

const FILAS: { aspecto: string; e3: React.ReactNode; e4: React.ReactNode }[] = [
  {
    aspecto: 'Pregunta',
    e3: '¿Cuál es la selección de mayor beneficio con consumo total ≤ W?',
    e4: '¿Existe una selección con consumo total ≤ W y beneficio total ≥ B?',
  },
  {
    aspecto: 'Entrada',
    e3: 'Candidatos (w_i > 0, v_i ≥ 0 enteros) y W.',
    e4: 'Lo mismo más el umbral B.',
  },
  {
    aspecto: 'Tipo de salida',
    e3: 'Una selección (lista de ids) y su valor óptimo.',
    e4: 'SÍ o NO; si es SÍ, un certificado x ∈ {0,1}ⁿ que lo respalda.',
  },
  {
    aspecto: 'Costo de verificar',
    e3: 'Comprobar factibilidad es O(k) (verificar, Entrega 1), pero certificar que una selección es ÓPTIMA exige descartar todas las demás: no se conoce un verificador polinómico.',
    e4: 'O(n) sumas y comparaciones sobre números de O(L) bits: polinómico en la longitud L de la entrada.',
  },
  {
    aspecto: 'Costo de resolver',
    e3: 'Exacto: exhaustivo O(2ⁿ), DP Θ(nW) pseudopolinomial, ramificación y poda O(n·2ⁿ). Ávido Θ(n log n) pero sin garantía.',
    e4: 'Los mismos algoritmos (se resuelve la optimización y se compara con B). No se conoce un algoritmo polinómico en L.',
  },
  {
    aspecto: 'Clase de complejidad',
    e3: 'NP-difícil. No se dice NP-completa: no es un problema de decisión.',
    e4: 'NP-completa: está en NP (certificado) y es NP-difícil (SUBSET SUM ≤p DECISIÓN).',
  },
  {
    aspecto: 'De una a otra',
    e3: 'Con el óptimo OPT se responde la decisión para cualquier B: SÍ ⇔ OPT ≥ B (una comparación).',
    e4: 'Con un decisor para cualquier B se halla OPT por búsqueda binaria sobre B ∈ [0, Σv]: ⌈log₂(Σv + 1)⌉ llamadas, un número polinómico en L.',
  },
];

export default function E3vsE4() {
  const { instancia } = useInstancia();
  const n = instancia.candidatos.length;
  const datos = useMemo(() => {
    if (n > 20) return null;
    let nodos = 0;
    const bb = optimoPorBusquedaBinaria(instancia, (B) => {
      const d = decidir(instancia, B);
      nodos += d.nodos;
      return d.respuesta;
    });
    const ex = exhaustivo(aMapa(instancia.candidatos), instancia.W);
    let suma = 0n;
    for (const c of instancia.candidatos) suma += c.v;
    return { bb, ex, suma, nodos };
  }, [instancia, n]);

  return (
    <>
      <h1>Entrega 3 frente a Entrega 4</h1>
      <p className="lead">
        El mismo caso de Mercado Andino visto como problema de optimización y como problema de decisión.
      </p>

      <div className="vs" role="table" aria-label="Comparación entre la Entrega 3 y la Entrega 4">
        <div className="cab" role="columnheader">Entrega 3 · Optimización</div>
        <div className="cab" role="columnheader">Entrega 4 · Decisión</div>
        {FILAS.map((f) => (
          <div key={f.aspecto} style={{ display: 'contents' }} role="row">
            <div className="aspecto" role="rowheader">{f.aspecto}</div>
            <div className="e3" role="cell">{f.e3}</div>
            <div className="e4" role="cell">{f.e4}</div>
          </div>
        ))}
      </div>

      <Tarjeta titulo="De la decisión a la optimización: búsqueda binaria sobre B">
        <p className="peq">
          Invariante: el decisor responde SÍ en <M>lo</M> (con <M>lo = 0</M> siempre es SÍ: la selección vacía) y el
          óptimo está en <M>[lo, hi]</M>. Se pregunta por <M>{String.raw`B=\lceil (lo+hi)/2\rceil`}</M>: si es SÍ,{' '}
          <M>lo ← B</M>; si no, <M>hi ← B − 1</M>. Cuando <M>lo = hi</M>, ese valor es el óptimo. Como decisor se usa
          ramificación y poda (exponencial en el peor caso); lo que la búsqueda binaria muestra es que basta un número{' '}
          <strong>polinómico</strong> de llamadas al decisor.
        </p>
        <SelectorInstancia nMax={20} />
        {datos ? (
          <>
            <Estadisticas>
              <Stat etq="Σv (cota superior inicial)" val={fmt(datos.suma)} nota={`${bits(datos.suma)} bits`} />
              <Stat etq="Llamadas al decisor" val={datos.bb.llamadas} nota={`⌈log₂(Σv + 1)⌉ = ${bits(datos.suma)}`} />
              <Stat etq="Óptimo hallado" val={fmt(datos.bb.optimo)} />
              <Stat etq="Óptimo del exhaustivo" val={fmt(datos.ex.valor)} />
              <Stat etq="¿Coinciden?" val={datos.bb.optimo === datos.ex.valor ? 'Sí' : 'No'} />
            </Estadisticas>
            <TablaScroll alta>
              <table>
                <thead>
                  <tr>
                    <th className="num">Llamada</th>
                    <th className="num">lo</th>
                    <th className="num">hi</th>
                    <th className="num">B consultado</th>
                    <th>Respuesta</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.bb.pasos.map((p, i) => (
                    <tr key={i}>
                      <td className="num">{i + 1}</td>
                      <td className="num">{fmt(p.lo)}</td>
                      <td className="num">{fmt(p.hi)}</td>
                      <td className="num">{fmt(p.B)}</td>
                      <td>{p.respuesta ? <Chip tipo="ok">SÍ</Chip> : <Chip tipo="mal">NO</Chip>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TablaScroll>
          </>
        ) : (
          <p className="muted">Usa una instancia con n ≤ 20 para ejecutar la búsqueda en el navegador.</p>
        )}
      </Tarjeta>

      <Aviso tipo="advertencia" titulo="Lo que sí y lo que no se puede afirmar">
        <ul className="lista-limpia" style={{ margin: 0 }}>
          <li>Verificar un certificado de DECISIÓN es polinómico; encontrarlo, con lo que se sabe hoy, no lo es.</li>
          <li>Si existiera un decisor polinómico, la búsqueda binaria daría el óptimo en tiempo polinómico, y sería P = NP.</li>
          <li>
            Si P = NP o P ≠ NP es un problema abierto. Que en la Tabla 1 todo termine en milisegundos no demuestra tiempo
            polinómico.
          </li>
        </ul>
      </Aviso>
    </>
  );
}
