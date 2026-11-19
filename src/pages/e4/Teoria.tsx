import { href } from '../../rutas';
import { Aviso, Tarjeta } from '../../components/ui';
import { M, MB } from '../../components/Tex';

export default function Teoria() {
  return (
    <>
      <h1>Decisión y clases de complejidad</h1>
      <p className="lead">
        La Entrega 4 cambia la pregunta: en lugar de buscar la mejor selección, se pregunta si existe una selección
        suficientemente buena. Esa versión de sí/no es la que permite hablar de P, NP y NP-completitud.
      </p>

      <Tarjeta titulo="Decisión frente a optimización">
        <div className="dos-columnas">
          <div>
            <h3 className="mt0">Optimización (Entrega 3)</h3>
            <MB>{String.raw`\max \sum_i v_i x_i \ \ \text{s.a.}\ \sum_i w_i x_i\le W,\ x\in\{0,1\}^n`}</MB>
            <p>
              Salida: una selección y su valor (el mejor posible). No es un problema de sí/no.
            </p>
          </div>
          <div>
            <h3 className="mt0">DECISIÓN Mercado Andino (Entrega 4)</h3>
            <p>
              Dados candidatos con <M>{String.raw`w_i>0`}</M> y <M>{String.raw`v_i\ge 0`}</M> enteros, una capacidad{' '}
              <M>W</M> y un umbral <M>B</M>: ¿existe <M>{String.raw`x\in\{0,1\}^n`}</M> con
            </p>
            <MB>{String.raw`\sum_i w_i x_i\le W\quad\text{y}\quad \sum_i v_i x_i\ge B\ ?`}</MB>
            <p>Salida: SÍ o NO (y, si es SÍ, un certificado que lo respalda).</p>
          </div>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Las clases">
        <p className="peq muted">
          <M>L</M> denota la longitud en bits de la entrada completa. «Tiempo polinómico» significa{' '}
          <M>{String.raw`O(L^k)`}</M> para alguna constante <M>k</M>.
        </p>
        <div className="rejilla">
          <div>
            <h3 className="mt0">P</h3>
            <p>
              Problemas de decisión que un algoritmo determinista resuelve en tiempo polinómico en <M>L</M>. Ejemplo:
              ¿es factible una selección dada? (el verificador de la Entrega 1).
            </p>
          </div>
          <div>
            <h3 className="mt0">NP</h3>
            <p>
              Problemas de decisión en los que toda instancia SÍ tiene un <strong>certificado</strong> de longitud
              polinómica que un <strong>verificador</strong> comprueba en tiempo polinómico (y ningún certificado hace
              aceptar una instancia NO). Equivalentemente: los que resuelve una máquina <em>no determinista</em> en
              tiempo polinómico. El nombre viene de «polinómico no determinista»; <strong>no</strong> significa «no
              polinómico».
            </p>
          </div>
          <div>
            <h3 className="mt0">NP-difícil</h3>
            <p>
              Un problema <M>X</M> es NP-difícil si todo problema de NP se reduce a él en tiempo polinómico (
              <M>{String.raw`A\le_p X`}</M> para todo <M>{String.raw`A\in NP`}</M>). Basta reducir a <M>X</M> un problema
              que ya se sabe NP-difícil. <M>X</M> no tiene que ser de decisión ni estar en NP.
            </p>
          </div>
          <div>
            <h3 className="mt0">NP-completo</h3>
            <p>
              Está en NP <strong>y</strong> es NP-difícil. Son los problemas «más difíciles» de NP: si uno solo de ellos
              tuviera un algoritmo polinómico, todos los de NP lo tendrían.
            </p>
          </div>
        </div>
        <DiagramaClases />
        <Aviso tipo="advertencia" titulo="P frente a NP es un problema abierto">
          Se sabe que <M>{String.raw`P\subseteq NP`}</M> (un algoritmo polinómico es su propio verificador: ignora el
          certificado). Si <M>{String.raw`P = NP`}</M> o <M>{String.raw`P\ne NP`}</M> <strong>no está demostrado</strong>: es
          uno de los problemas abiertos más conocidos de la matemática. Hoy no se conoce ningún algoritmo polinómico para
          un problema NP-completo, pero tampoco una prueba de que no exista.
        </Aviso>
      </Tarjeta>

      <Tarjeta titulo="Reducciones polinómicas">
        <p>
          <M>{String.raw`A\le_p X`}</M> significa que existe una función <M>f</M>, computable en tiempo polinómico, tal
          que <M>a</M> es instancia SÍ de <M>A</M> si y solo si <M>f(a)</M> es instancia SÍ de <M>X</M>. Entonces un
          algoritmo para <M>X</M> resuelve <M>A</M>, y <M>X</M> es «al menos tan difícil» como <M>A</M>. Para probar que
          el problema del proyecto es NP-difícil se reduce <strong>del problema conocido hacia el del proyecto</strong>{' '}
          (SUBSET SUM <M>{String.raw`\le_p`}</M> DECISIÓN), nunca al revés: reducir el del proyecto a SUBSET SUM solo
          diría que el del proyecto no es más difícil que SUBSET SUM. Ver <a href={href('/e4/reduccion')}>Reducción</a>.
        </p>
      </Tarjeta>

      <Tarjeta titulo="Dificultad en el peor caso no es dificultad en cada instancia">
        <p>
          Que DECISIÓN sea NP-completa habla del <strong>peor caso</strong> en función de <M>L</M>. No dice que toda
          instancia exija el mismo tiempo; muchas son fáciles:
        </p>
        <ul className="lista-limpia">
          <li>
            Con <M>W</M> pequeño, la programación dinámica responde en <M>{String.raw`\Theta(nW)`}</M> operaciones, pocas
            (la Tabla 1 con <M>W = 50</M>: 663 celdas).
          </li>
          <li>
            En la Tabla 1 la ramificación y poda con la solución del ávido poda la raíz: visita 1 nodo.
          </li>
          <li>
            Si todos los candidatos caben (<M>{String.raw`\sum w\le W`}</M>), la respuesta es SÍ exactamente cuando{' '}
            <M>{String.raw`\sum v\ge B`}</M>: se decide en tiempo lineal.
          </li>
        </ul>
        <p>
          Estas observaciones no contradicen la NP-completitud ni prueban tiempo polinómico: describen instancias
          particulares, no todas.
        </p>
      </Tarjeta>
    </>
  );
}

function DiagramaClases() {
  return (
    <figure style={{ margin: '12px 0' }}>
      <svg viewBox="0 0 520 250" width="100%" style={{ maxWidth: 560, display: 'block', margin: '0 auto' }} role="img" aria-label="Diagrama de clases suponiendo P distinto de NP">
        <rect x="290" y="20" width="220" height="210" rx="18" fill="color-mix(in srgb, var(--series-2) 14%, transparent)" stroke="var(--series-2)" strokeWidth="2" />
        <text x="400" y="44" textAnchor="middle" fill="var(--text)" fontSize="14" fontWeight="700">NP-difícil</text>
        <ellipse cx="220" cy="135" rx="200" ry="95" fill="color-mix(in srgb, var(--series-1) 12%, transparent)" stroke="var(--series-1)" strokeWidth="2" />
        <text x="90" y="80" fill="var(--text)" fontSize="14" fontWeight="700">NP</text>
        <ellipse cx="150" cy="145" rx="95" ry="55" fill="color-mix(in srgb, var(--series-3) 18%, transparent)" stroke="var(--series-3)" strokeWidth="2" />
        <text x="150" y="150" textAnchor="middle" fill="var(--text)" fontSize="14" fontWeight="700">P</text>
        <text x="352" y="128" textAnchor="middle" fill="var(--text)" fontSize="12" fontWeight="700">NP-completo</text>
        <text x="352" y="146" textAnchor="middle" fill="var(--text-2)" fontSize="11">DECISIÓN MA,</text>
        <text x="352" y="160" textAnchor="middle" fill="var(--text-2)" fontSize="11">SUBSET SUM, 3-SAT…</text>
        <text x="455" y="205" textAnchor="middle" fill="var(--text-2)" fontSize="11">Optimización MA</text>
      </svg>
      <figcaption className="peq muted centro">
        Imagen bajo el supuesto (no demostrado) de que P ≠ NP. Si se probara P = NP, las regiones P, NP y NP-completo
        coincidirían (salvo casos triviales). La versión de optimización es NP-difícil, pero queda fuera de NP porque no
        es de decisión.
      </figcaption>
    </figure>
  );
}
