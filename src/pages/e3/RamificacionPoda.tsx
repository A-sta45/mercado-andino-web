import { useMemo, useState } from 'react';
import { fmt, fmtN, racionalTexto } from '../../algorithms/bigint';
import { exhaustivo } from '../../algorithms/exhaustivo';
import { ramificacionPoda, type NodoBB } from '../../algorithms/ramificacionPoda';
import { aMapa } from '../../algorithms/tipos';
import { useInstancia } from '../../estado';
import { SelectorInstancia } from '../../components/SelectorInstancia';
import { brecha, ResultadoVerificado } from '../../components/Resultado';
import { Aviso, Chip, Estadisticas, Prueba, Pseudo, Qed, Segmentado, Stat, TablaScroll, Tarjeta } from '../../components/ui';
import { M, MB } from '../../components/Tex';
import { ZoomPan } from '../../components/ZoomPan';

const PSEUDO = `
ramificacion_y_poda(C, W):
  orden <- merge_sort(C)                    // v/w descendente (Θ(n log n))
  mejor, mejorSel <- avido(C, W)            // cota inferior inicial
  visitar(0, valor=0, peso=0)
  retornar mejorSel, mejor

visitar(k, valor, peso):                    // ya se decidieron orden[0..k-1]
  si valor > mejor: mejor <- valor ; mejorSel <- sel actual
  si k = n: retornar                        // hoja
  cota <- valor + relajacion(k, W - peso)   // racional exacto (BigInt)
  si cota <= mejor: retornar                // PODA por cota
  x <- orden[k]
  si peso + w(x) <= W:                      // rama INCLUIR
    visitar(k+1, valor + v(x), peso + w(x))
  si no: registrar PODA por capacidad
  visitar(k+1, valor, peso)                 // rama EXCLUIR

relajacion(k, r):                           // ávido fraccionario: O(n)
  s <- 0
  para j en k..n-1:
    si w_j <= r: r <- r - w_j ; s <- s + v_j          // enteros mientras quepan
    si no: retornar s + (v_j · r) / w_j               // fracción del siguiente (num/den)
  retornar s
`;

const COLORES: Record<NodoBB['estado'], string> = {
  expandido: 'var(--nodo-exp)',
  'podado-cota': 'var(--poda-cota)',
  'podado-capacidad': 'var(--poda-cap)',
  hoja: 'var(--nodo-hoja)',
};
const NOMBRE_ESTADO: Record<NodoBB['estado'], string> = {
  expandido: 'Expandido',
  'podado-cota': 'Podado por cota (cota ≤ mejor)',
  'podado-capacidad': 'Podado por capacidad (incluir no cabe)',
  hoja: 'Hoja (todos decididos)',
};

const MAX_ARBOL = 600;

export default function RamificacionPoda() {
  const { instancia } = useInstancia();
  const [inicial, setInicial] = useState<'avido' | 'cero'>('avido');
  const [modo, setModo] = useState<'racional' | 'piso'>('racional');
  const [sel, setSel] = useState<number | null>(null);
  const n = instancia.candidatos.length;
  const r = useMemo(
    () => ramificacionPoda(instancia.candidatos, instancia.W, { inicial, modoCota: modo, maxRegistro: 3000, maxNodos: 400_000 }),
    [instancia, inicial, modo],
  );
  const ref = useMemo(
    () => (n <= 20 ? exhaustivo(aMapa(instancia.candidatos), instancia.W) : null),
    [instancia, n],
  );
  const nodoSel = sel !== null ? r.nodos.find((x) => x.id === sel) : undefined;

  return (
    <>
      <h1>Ramificación y poda</h1>
      <p className="lead">
        Explora el árbol incluir/excluir sobre el orden <M>v/w</M> del merge sort, pero descarta ramas que no pueden
        mejorar la mejor solución conocida. Es <strong>exacto</strong>: siempre devuelve el óptimo.
      </p>
      <SelectorInstancia />

      <Tarjeta titulo="Pseudocódigo">
        <Pseudo>{PSEUDO}</Pseudo>
      </Tarjeta>

      <Tarjeta titulo="Ejecución en vivo">
        <div className="controles">
          <div className="campo">
            Mejor solución inicial
            <Segmentado
              etiqueta="Mejor solución inicial"
              valor={inicial}
              onCambio={(v) => {
                setInicial(v);
                setSel(null);
              }}
              opciones={[
                { valor: 'avido', texto: 'Solución del ávido' },
                { valor: 'cero', texto: 'Cero (sin ávido)' },
              ]}
            />
          </div>
          <div className="campo">
            Regla de poda por cota
            <Segmentado
              etiqueta="Regla de poda"
              valor={modo}
              onCambio={(v) => {
                setModo(v);
                setSel(null);
              }}
              opciones={[
                { valor: 'racional', texto: 'cota racional ≤ mejor' },
                { valor: 'piso', texto: '⌊cota⌋ ≤ mejor' },
              ]}
            />
          </div>
        </div>
        <div className="dos-columnas">
          <ResultadoVerificado titulo="Ramificación y poda" instancia={instancia} seleccion={r.seleccion} valor={r.valor} />
          {ref ? (
            <ResultadoVerificado titulo="Exhaustivo (referencia)" instancia={instancia} seleccion={ref.seleccion} valor={ref.valor} />
          ) : (
            <div className="stat">El exhaustivo no se ejecuta aquí con n &gt; 20.</div>
          )}
        </div>
        {r.incompleto && (
          <Aviso tipo="peligro" titulo="Ejecución detenida">
            Se alcanzó el límite de 400.000 nodos de esta demostración: el resultado es la mejor solución encontrada,
            sin prueba de optimalidad.
          </Aviso>
        )}
        <Estadisticas>
          {ref && <Stat etq="Brecha frente al exhaustivo" val={brecha(ref.valor, r.valor)} />}
          <Stat etq="Mejor inicial" val={fmt(r.inicial.valor)} nota={r.inicial.origen === 'avido' ? 'del ávido' : 'cero'} />
          <Stat etq="Nodos visitados" val={fmtN(r.cont.visitados)} nota={ref ? `exhaustivo: ${fmtN(ref.cont.llamadas)} llamadas` : undefined} />
          <Stat etq="Podados por cota" val={fmtN(r.cont.podadosCota)} />
          <Stat etq="Podados por capacidad" val={fmtN(r.cont.podadosCapacidad)} />
          <Stat etq="Hojas" val={fmtN(r.cont.hojas)} />
          <Stat etq="Profundidad máxima" val={r.cont.profundidadMax} nota={`n = ${n}`} />
          <Stat etq="Pasos de cota" val={fmtN(r.cont.pasosCota)} nota="candidatos examinados" />
        </Estadisticas>
        {r.cont.visitados === 1 && r.nodos[0]?.estado === 'podado-cota' && (
          <Aviso tipo="info" titulo="La raíz se podó">
            La cota de la raíz ({racionalTexto(r.nodos[0].cota!)}) no supera la solución inicial del ávido (
            {fmt(r.inicial.valor)}), así que el ávido ya es óptimo y no hace falta explorar nada. Elige «Cero (sin
            ávido)» para ver el árbol completo de la búsqueda.
          </Aviso>
        )}
      </Tarjeta>

      <Tarjeta titulo="Árbol de búsqueda">
        <div className="leyenda">
          {(Object.keys(COLORES) as NodoBB['estado'][]).map((k) => (
            <span key={k}>
              <svg width="14" height="14" aria-hidden="true">
                {k === 'podado-capacidad' ? (
                  <rect x="2" y="2" width="10" height="10" fill={COLORES[k]} />
                ) : k === 'podado-cota' ? (
                  <path d="M7 1 L13 13 L1 13 Z" fill={COLORES[k]} />
                ) : (
                  <circle cx="7" cy="7" r="6" fill={COLORES[k]} />
                )}
              </svg>
              {NOMBRE_ESTADO[k]}
            </span>
          ))}
          <span>
            <svg width="14" height="14" aria-hidden="true">
              <circle cx="7" cy="7" r="5" fill="none" stroke="var(--text)" strokeWidth="2" strokeDasharray="2 2" />
            </svg>
            Mejora la mejor solución
          </span>
        </div>
        {r.nodos.length <= MAX_ARBOL && !r.registroTruncado ? (
          <Arbol nodos={r.nodos} sel={sel} onSel={setSel} />
        ) : (
          <p className="muted">
            El árbol tiene {fmtN(r.cont.visitados + r.cont.podadosCapacidad)} nodos; se dibuja solo con hasta {MAX_ARBOL}.
            Usa una instancia más pequeña o consulta el registro.
          </p>
        )}
        <p className="peq muted">Arrastra para desplazarte, usa la rueda o pellizca para hacer zoom. Toca un nodo para ver su detalle.</p>
        {nodoSel && <DetalleNodo nodo={nodoSel} />}
      </Tarjeta>

      <Tarjeta titulo="Registro nodo por nodo">
        <p className="peq muted">
          Orden de visita en profundidad (primero incluir). {r.registroTruncado && `Se muestran los primeros ${r.nodos.length} nodos.`}
        </p>
        <TablaScroll alta>
          <table>
            <thead>
              <tr>
                <th className="num">Nodo</th>
                <th className="num">Nivel</th>
                <th>Decisión</th>
                <th className="num">Valor</th>
                <th className="num">Peso</th>
                <th className="num">Cota exacta</th>
                <th className="num">⌊cota⌋</th>
                <th className="num">Mejor al llegar</th>
                <th>Resultado / motivo</th>
              </tr>
            </thead>
            <tbody>
              {r.nodos.slice(0, 1500).map((x) => (
                <tr key={x.id} onClick={() => setSel(x.id)} style={{ cursor: 'pointer', background: x.id === sel ? 'var(--accent-soft)' : undefined }}>
                  <td className="num">#{x.id}</td>
                  <td className="num">{x.nivel}</td>
                  <td className="mono">{x.decision === 'raiz' ? 'raíz' : `${x.decision === 'incluir' ? '+' : '−'}${x.candidato}`}</td>
                  <td className="num">{fmt(x.valor)}</td>
                  <td className="num">{fmt(x.peso)}</td>
                  <td className="num">{x.cota ? racionalTexto(x.cota) : '—'}</td>
                  <td className="num">{x.cotaPiso !== null ? fmt(x.cotaPiso) : '—'}</td>
                  <td className="num">{fmt(x.mejorAlVisitar)}</td>
                  <td>
                    <span className="chip" style={{ borderColor: COLORES[x.estado] }}>
                      {NOMBRE_ESTADO[x.estado]}
                    </span>
                    {x.mejora && <Chip tipo="ok">nueva mejor: {fmt(x.valor)}</Chip>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TablaScroll>
      </Tarjeta>

      <Tarjeta titulo="Justificación teórica">
        <Prueba titulo="La cota nunca subestima el mejor beneficio alcanzable desde el nodo" abierta>
          <p>
            Sea un nodo con valor <M>V</M>, peso <M>P</M> y candidatos restantes <M>{String.raw`R=\{orden[k..n-1]\}`}</M>.
            Toda completación factible es un subconjunto <M>{String.raw`S\subseteq R`}</M> con{' '}
            <M>{String.raw`\sum_{S} w\le W-P`}</M>, y alcanza <M>{String.raw`V+\sum_S v`}</M>.
          </p>
          <ol className="lista-limpia">
            <li>
              <strong>Toda selección 0/1 es una solución fraccionaria:</strong> el vector <M>{String.raw`x\in\{0,1\}^{|R|}`}</M>{' '}
              también está en <M>{String.raw`[0,1]^{|R|}`}</M> y cumple la misma restricción de capacidad. Luego{' '}
              <M>{String.raw`\max_{0/1}\le \max_{\text{fraccionario}}`}</M>.
            </li>
            <li>
              <strong>El ávido fraccionario por v/w es óptimo para la versión fraccionaria</strong> (argumento de
              intercambio, que aquí sí es válido porque se permiten fracciones): si una solución fraccionaria no
              llena primero los de mayor <M>v/w</M>, mover peso de uno de menor razón a uno de mayor razón no baja el
              valor. Como los restantes están en orden <M>v/w</M>, <code>relajacion</code> calcula exactamente ese
              óptimo fraccionario.
            </li>
          </ol>
          <p>
            Por (1) y (2), <M>{String.raw`\text{cota}=V+\text{relajación}\ \ge\ V+\max_{S}\sum_S v`}</M>. Si{' '}
            <M>{String.raw`\text{cota}\le\text{mejor}`}</M>, ninguna completación supera a la mejor conocida y la rama se
            puede descartar sin perder el óptimo. La poda por capacidad solo quita selecciones infactibles (consumos
            positivos: si <M>x</M> no cabe, ninguna extensión que lo contenga cabe). <Qed />
          </p>
          <p className="peq muted">
            Nótese la diferencia con el ávido: aquí la demostración fraccionaria se usa para acotar, no para afirmar
            que el ávido 0/1 sea óptimo.
          </p>
        </Prueba>
        <Prueba titulo="Corrección y terminación">
          <p>
            Cada nodo pasa de <M>k</M> a <M>k + 1</M>, así que la profundidad es a lo sumo <M>n</M> y el árbol es finito.
            La mejor solución conocida siempre es factible (el ávido lo es y cada nodo representa una selección
            factible). Solo se descartan ramas infactibles o ramas cuya cota demuestra que no superan a la mejor; por lo
            tanto, si una selección óptima <M>{'S*'}</M> fuera mejor que la devuelta, todos los nodos de su camino
            tendrían cota <M>{String.raw`\ge v(S^*)>\text{mejor}`}</M> y se habrían expandido hasta encontrarla:
            contradicción. <Qed />
          </p>
        </Prueba>
        <Aviso tipo="advertencia" titulo="Sin errores de redondeo: racionales exactos">
          <p>
            Con flotantes, una cota como <M>{String.raw`525000+\tfrac{14\cdot 210000}{15}`}</M> o productos mayores que{' '}
            <M>{String.raw`2^{53}`}</M> se redondean; si la cota calculada quedara por debajo de la real, la
            comparación <M>{String.raw`\text{cota}\le\text{mejor}`}</M> podría eliminar la rama óptima. Aquí la cota se
            guarda como <M>{String.raw`\frac{(V+s)\cdot w_j+v_j\cdot r}{w_j}`}</M> con numerador y denominador{' '}
            <code>BigInt</code>, y se compara con productos cruzados:{' '}
            <M>{String.raw`\text{num}\le \text{mejor}\cdot\text{den}`}</M>.
          </p>
          <p>
            Alternativa equivalente: como los beneficios son enteros, el mejor valor alcanzable desde el nodo es un
            entero <M>{String.raw`\le\text{cota}`}</M>, y por tanto <M>{String.raw`\le\lfloor\text{cota}\rfloor`}</M>. Podar
            si <M>{String.raw`\lfloor\text{cota}\rfloor\le\text{mejor}`}</M> es válido (y poda un poco más). Ambas reglas
            están implementadas; nunca se usan flotantes para comparar.
          </p>
        </Aviso>
        <Prueba titulo="Cota de peor caso (incluyendo el costo de las cotas)" abierta>
          <MB>{String.raw`T(n)=\underbrace{\Theta(n\log n)}_{\text{orden}}+\underbrace{O(2^{n+1})}_{\text{nodos}}\times\underbrace{O(n)}_{\text{cota por nodo}}=O(n\cdot 2^{n})`}</MB>
          <p>
            El árbol incluir/excluir tiene a lo sumo <M>{String.raw`2^{n+1}-1`}</M> nodos y la relajación examina hasta{' '}
            <M>n</M> candidatos por nodo. Hay instancias en las que la cota casi nunca poda (por ejemplo, muchos
            candidatos con la misma razón <M>v/w</M> y capacidad que no se llena exactamente), y en ellas el número de
            nodos crece exponencialmente. Memoria: <M>{String.raw`O(n)`}</M> (pila de profundidad <M>n + 1</M> y la
            selección actual).
          </p>
          <Aviso tipo="peligro" titulo="Muchas podas en los ejemplos NO demuestran tiempo polinómico">
            Que en la Tabla 1 se visiten pocos nodos describe esas instancias, no el peor caso. La cota{' '}
            <M>{String.raw`O(n\cdot 2^n)`}</M> sigue siendo la garantía, y ninguna medición ni conteo de podas puede
            reemplazar una demostración de tiempo polinómico.
          </Aviso>
        </Prueba>
      </Tarjeta>
    </>
  );
}

function DetalleNodo({ nodo }: { nodo: NodoBB }) {
  return (
    <div className="tarjeta" style={{ background: 'var(--surface-2)' }}>
      <strong>
        Nodo #{nodo.id} · nivel {nodo.nivel} ·{' '}
        {nodo.decision === 'raiz' ? 'raíz' : `${nodo.decision} ${nodo.candidato}`}
      </strong>
      <div className="peq">
        Valor {fmt(nodo.valor)} · peso {fmt(nodo.peso)} · cota {nodo.cota ? racionalTexto(nodo.cota) : '—'} · mejor al
        llegar {fmt(nodo.mejorAlVisitar)}
      </div>
      <div className="peq">
        {NOMBRE_ESTADO[nodo.estado]}
        {nodo.estado === 'podado-cota' && nodo.cota && ` : ${racionalTexto(nodo.cota)} ≤ ${fmt(nodo.mejorAlVisitar > nodo.valor ? nodo.mejorAlVisitar : nodo.valor)}`}
        {nodo.mejora && ' · mejoró la mejor solución'}
      </div>
    </div>
  );
}

function Arbol({ nodos, sel, onSel }: { nodos: NodoBB[]; sel: number | null; onSel: (id: number) => void }) {
  const layout = useMemo(() => {
    const hijos = new Map<number, NodoBB[]>();
    for (const x of nodos) if (x.padre !== null) hijos.set(x.padre, [...(hijos.get(x.padre) ?? []), x]);
    const pos = new Map<number, { x: number; y: number }>();
    let hoja = 0;
    const DX = 34;
    const DY = 62;
    const colocar = (x: NodoBB): number => {
      const hs = hijos.get(x.id) ?? [];
      let px: number;
      if (hs.length === 0) px = hoja++ * DX;
      else {
        const xs = hs.map(colocar);
        px = (xs[0] + xs[xs.length - 1]) / 2;
      }
      pos.set(x.id, { x: px + 20, y: x.nivel * DY + 24 });
      return px;
    };
    const raiz = nodos.find((x) => x.padre === null);
    if (raiz) colocar(raiz);
    const maxNivel = Math.max(0, ...nodos.map((x) => x.nivel));
    return { pos, ancho: Math.max(1, hoja) * DX + 40, alto: maxNivel * DY + 60 };
  }, [nodos]);
  if (nodos.length === 0) return null;
  return (
    <ZoomPan ancho={layout.ancho} alto={layout.alto} altura={440} etiqueta="Árbol de ramificación y poda">
      {nodos.map((x) => {
        if (x.padre === null) return null;
        const a = layout.pos.get(x.padre)!;
        const b = layout.pos.get(x.id)!;
        return (
          <g key={`e${x.id}`}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--border)" strokeWidth={1.5} strokeDasharray={x.decision === 'excluir' ? '4 3' : undefined} />
            <text x={(a.x + b.x) / 2 + (x.decision === 'incluir' ? -4 : 4)} y={(a.y + b.y) / 2} fontSize="9" textAnchor={x.decision === 'incluir' ? 'end' : 'start'} fill="var(--text-3)">
              {x.decision === 'incluir' ? '+' : '−'}
              {x.candidato}
            </text>
          </g>
        );
      })}
      {nodos.map((x) => {
        const p = layout.pos.get(x.id)!;
        const color = COLORES[x.estado];
        const activo = x.id === sel;
        return (
          <g key={x.id} transform={`translate(${p.x},${p.y})`} onClick={() => onSel(x.id)} style={{ cursor: 'pointer' }}>
            <title>{`#${x.id} ${NOMBRE_ESTADO[x.estado]} · valor ${fmt(x.valor)} · peso ${fmt(x.peso)}${x.cota ? ' · cota ' + racionalTexto(x.cota) : ''}`}</title>
            <circle r={16} fill="transparent" />
            {x.estado === 'podado-capacidad' ? (
              <rect x={-8} y={-8} width={16} height={16} fill={color} stroke="var(--surface)" strokeWidth={2} />
            ) : x.estado === 'podado-cota' ? (
              <path d="M0 -10 L9 7 L-9 7 Z" fill={color} stroke="var(--surface)" strokeWidth={2} />
            ) : (
              <circle r={9} fill={color} stroke="var(--surface)" strokeWidth={2} />
            )}
            {x.mejora && <circle r={13} fill="none" stroke="var(--text)" strokeWidth={1.5} strokeDasharray="2 2" />}
            {activo && <circle r={15} fill="none" stroke="var(--accent)" strokeWidth={2.5} />}
          </g>
        );
      })}
    </ZoomPan>
  );
}
