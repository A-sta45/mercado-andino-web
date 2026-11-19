import { Aviso, TablaScroll, Tarjeta } from '../../components/ui';
import { M } from '../../components/Tex';

const PROBLEMAS: { nombre: string; entrada: string; pregunta: string; certificado: string }[] = [
  {
    nombre: 'SUBSET SUM',
    entrada: 'Enteros positivos a₁, …, aₙ y un objetivo T ≥ 0.',
    pregunta: '¿Existe un subconjunto cuya suma sea exactamente T?',
    certificado: 'Vector de n bits que marca el subconjunto; se suma y se compara con T.',
  },
  {
    nombre: '3-SAT',
    entrada: 'Fórmula booleana en forma normal conjuntiva con exactamente 3 literales por cláusula.',
    pregunta: '¿Existe una asignación de verdad que satisfaga todas las cláusulas?',
    certificado: 'La asignación (un bit por variable); se evalúa cada cláusula.',
  },
  {
    nombre: 'CLIQUE',
    entrada: 'Grafo G = (V, E) y un entero k.',
    pregunta: '¿Tiene G un conjunto de k vértices conectados todos entre sí?',
    certificado: 'Los k vértices; se comprueban los k(k − 1)/2 pares.',
  },
  {
    nombre: 'VERTEX COVER',
    entrada: 'Grafo G = (V, E) y un entero k.',
    pregunta: '¿Existe un conjunto de a lo sumo k vértices que toque todas las aristas?',
    certificado: 'El conjunto de vértices; se recorre cada arista.',
  },
  {
    nombre: 'TSP (decisión)',
    entrada: 'n ciudades, costos enteros no negativos c(i, j) y un umbral K.',
    pregunta: '¿Existe un recorrido que visite cada ciudad una vez y vuelva al inicio con costo total ≤ K?',
    certificado: 'La permutación de las ciudades; se verifica que sea permutación y se suman n costos.',
  },
  {
    nombre: 'DECISIÓN Mercado Andino',
    entrada: 'Candidatos con wᵢ > 0 y vᵢ ≥ 0 enteros, capacidad W y umbral B.',
    pregunta: '¿Existe una selección sin repeticiones con Σw ≤ W y Σv ≥ B?',
    certificado: 'Vector x ∈ {0, 1}ⁿ; se comprueban las dos desigualdades (O(n) operaciones).',
  },
];

export default function Problemas() {
  return (
    <>
      <h1>Problemas NP-completos de referencia</h1>
      <p className="lead">
        Cinco problemas de decisión clásicos, todos NP-completos. En cada uno, una respuesta SÍ tiene un certificado
        corto que se verifica en tiempo polinómico.
      </p>
      <Tarjeta>
        <TablaScroll>
          <table className="tarjetas-movil">
            <thead>
              <tr>
                <th>Problema</th>
                <th>Entrada</th>
                <th>Pregunta (sí/no)</th>
                <th>Certificado</th>
              </tr>
            </thead>
            <tbody>
              {PROBLEMAS.map((p) => (
                <tr key={p.nombre} style={p.nombre.startsWith('DECISIÓN') ? { background: 'var(--accent-soft)' } : undefined}>
                  <td className="titulo-celda" data-label="Problema" style={{ fontWeight: 700 }}>
                    {p.nombre}
                  </td>
                  <td data-label="Entrada">{p.entrada}</td>
                  <td data-label="Pregunta">{p.pregunta}</td>
                  <td data-label="Certificado">{p.certificado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TablaScroll>
      </Tarjeta>

      <Tarjeta titulo="Nota: SUBSET SUM y una posible extensión del caso">
        <p>
          SUBSET SUM es el caso particular de DECISIÓN en el que <strong>el beneficio de cada pedido es igual a su
          peso</strong> (<M>{String.raw`v_i=w_i`}</M>) y el umbral coincide con la capacidad (<M>B = W</M>): pedir
          consumo <M>{String.raw`\le T`}</M> y beneficio <M>{String.raw`\ge T`}</M> obliga a cargar exactamente{' '}
          <M>T</M> kg. Por eso se usa en la reducción.
        </p>
        <p>Una extensión natural del caso Mercado Andino que se convierte en SUBSET SUM sería:</p>
        <ul className="lista-limpia">
          <li>
            <strong>Carga exacta del vehículo:</strong> exigir que la carga sea exactamente <M>W</M> kg (por ejemplo,
            por balance o por una tarifa fija por viaje completo). Habría que cambiar la restricción{' '}
            <M>{String.raw`\sum w_i x_i\le W`}</M> por <M>{String.raw`\sum w_i x_i = W`}</M>; con beneficio
            irrelevante, la pregunta «¿se puede llenar exactamente?» es SUBSET SUM.
          </li>
          <li>
            <strong>Cobro proporcional al peso:</strong> si el valor de venta de cada pedido fuera proporcional a su
            peso (<M>{String.raw`v_i=p\cdot w_i`}</M> con tarifa <M>p</M> constante por kg), maximizar el valor equivale a
            maximizar el peso cargado, y la decisión con <M>{String.raw`B=p\cdot W`}</M> es SUBSET SUM sobre los pesos.
            Requiere la restricción nueva de que todos los pedidos tengan la misma tarifa por kg.
          </li>
        </ul>
        <Aviso tipo="info">
          Ambas son restricciones nuevas que hoy no forman parte del caso: en la Tabla 1 las razones <M>v/w</M> van de
          11.875 a 15.714 COP/kg y se permite cargar menos que <M>W</M>.
        </Aviso>
      </Tarjeta>
    </>
  );
}
