import { ASIGNATURA, DOCENTE, INTEGRANTES, UNIVERSIDAD } from '../data/proyecto';
import { href } from '../rutas';
import { Aviso, Tarjeta } from '../components/ui';
import { M, MB } from '../components/Tex';

export default function Inicio() {
  return (
    <>
      <h1>Proyecto Final – Mercado Andino</h1>
      <p className="lead">
        Mercado Andino despacha pedidos desde un centro de distribución con un solo vehículo de capacidad
        limitada. Cuando los pedidos pendientes pesan más que esa capacidad, hay que decidir cuáles llevar. Cada
        pedido se despacha completo y como máximo una vez, y la meta es maximizar el valor de venta transportado.
      </p>
      <div className="integrantes">
        {INTEGRANTES.map((n) => (
          <span key={n} className="chip">
            {n}
          </span>
        ))}
      </div>
      <p className="peq muted">
        {UNIVERSIDAD} · {ASIGNATURA} · Docente: {DOCENTE} · Bogotá D.C., 2026
      </p>

      <Tarjeta titulo="El problema">
        <MB>{String.raw`\max Z=\sum_{i=1}^{n} b_i x_i \quad\text{sujeto a}\quad \sum_{i=1}^{n} c_i x_i \le W,\qquad x_i\in\{0,1\}`}</MB>
        <p>
          Cada candidato tiene un id, un consumo <M>{String.raw`c_i = w_i`}</M> (entero &gt; 0, kg) y un beneficio{' '}
          <M>{String.raw`b_i = v_i`}</M> (entero ≥ 0, COP). La capacidad <M>W</M> es un entero ≥ 0. Con los 12
          pedidos de la Tabla 1 y <M>W = 50</M> kg, el óptimo conocido es <strong>735.000 COP</strong> con{' '}
          <span className="ids">[P01, P03, P07, P08, P11]</span>.
        </p>
        <Aviso tipo="info" titulo="Aritmética exacta">
          Consumos, beneficios, <M>W</M>, <M>B</M> y <M>T</M> se manejan con <code>BigInt</code>: los números se
          codifican en binario y no tienen una cota constante. Toda selección que devuelve un algoritmo pasa por{' '}
          <code>verificar</code> (Entrega 1).
        </Aviso>
      </Tarjeta>

      <div className="rejilla">
        <Tarjeta titulo={<a href={href('/datos')}>Datos</a>}>
          <p>Tablas 1 y 2 editables, validador en vivo con los motivos de exclusión y verificador de selecciones.</p>
        </Tarjeta>
        <Tarjeta titulo={<a href={href('/e3/divide-y-venceras')}>Entrega 3 · Optimización</a>}>
          <ul className="lista-limpia">
            <li>Divide y vencerás: merge sort por v/w como preprocesamiento.</li>
            <li>Ávido: heurística (no garantiza el óptimo), con contraejemplos.</li>
            <li>Programación dinámica: tabla F(i, c) en Θ(nW).</li>
            <li>Ramificación y poda: cota fraccionaria exacta.</li>
            <li>
              <a href={href('/e3/comparacion')}>Comparación</a> de los cuatro contra el exhaustivo.
            </li>
          </ul>
        </Tarjeta>
        <Tarjeta titulo={<a href={href('/e4/teoria')}>Entrega 4 · Decisión</a>}>
          <ul className="lista-limpia">
            <li>P, NP, NP-difícil y NP-completo.</li>
            <li>Certificado de n bits y verificador polinómico.</li>
            <li>Reducción SUBSET SUM ≤p DECISIÓN.</li>
            <li>Pseudopolinomialidad de la DP.</li>
          </ul>
        </Tarjeta>
        <Tarjeta titulo={<a href={href('/e3-vs-e4')}>E3 vs E4</a>}>
          <p>
            Optimización frente a decisión: qué pregunta responde cada versión, qué devuelve, cuánto cuesta verificar
            frente a resolver y cómo se pasa de una a otra por búsqueda binaria sobre <M>B</M>.
          </p>
        </Tarjeta>
      </div>
    </>
  );
}
