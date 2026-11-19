import { useMemo, useState } from 'react';
import { bits, fmt, parseBig } from '../../algorithms/bigint';
import { decidir, verificarCertificado } from '../../algorithms/decision';
import {
  EJEMPLO_NO,
  EJEMPLO_SI,
  reducir,
  resolverSubsetSum,
  validarSubsetSum,
  type InstanciaSubsetSum,
} from '../../algorithms/subsetSum';
import { Aviso, Chip, Estadisticas, Prueba, Pseudo, Qed, Stat, TablaScroll, Tarjeta } from '../../components/ui';
import { M, MB } from '../../components/Tex';

const PSEUDO = `
reducir(a_1..a_n, T):                 // SUBSET SUM  →  DECISIÓN Mercado Andino
  C <- []
  para i en 1..n:                     // n iteraciones, O(1) copias de números cada una
    C <- C + [ (id = "A_i", w = a_i, v = a_i) ]
  W <- T ; B <- T
  retornar (C, W, B)
`;

export default function Reduccion() {
  const [texto, setTexto] = useState('2, 9, 14, 21, 30');
  const [textoT, setTextoT] = useState('44');
  const propia = useMemo((): { inst: InstanciaSubsetSum | null; errores: string[] } => {
    const partes = texto.split(/[,;\s]+/).filter(Boolean);
    const a = partes.map(parseBig);
    const T = parseBig(textoT);
    if (a.some((x) => x === null) || T === null) return { inst: null, errores: ['Escribe solo enteros.'] };
    if (a.length > 18) return { inst: null, errores: ['Usa a lo sumo 18 números para resolver ambos lados en el navegador.'] };
    const inst = { a: a as bigint[], T };
    const errores = validarSubsetSum(inst);
    return { inst: errores.length ? null : inst, errores };
  }, [texto, textoT]);

  return (
    <>
      <h1>Reducción SUBSET SUM ≤p DECISIÓN</h1>
      <p className="lead">
        Para probar que DECISIÓN Mercado Andino es NP-difícil se transforma un problema NP-completo conocido, SUBSET
        SUM, <strong>hacia</strong> el problema del proyecto, en tiempo polinómico y conservando la respuesta.
      </p>

      <Tarjeta titulo="La transformación">
        <p>
          Entrada de SUBSET SUM: enteros positivos <M>{String.raw`a_1,\dots,a_n`}</M> y <M>{String.raw`T\ge 0`}</M>.
          Cada <M>{String.raw`a_i`}</M> se vuelve un candidato con <M>{String.raw`w_i=v_i=a_i`}</M>, y{' '}
          <M>W = B = T</M>.
        </p>
        <MB>{String.raw`f(a_1,\dots,a_n;\,T)=\big(\{(A_i,\ w_i=a_i,\ v_i=a_i)\}_{i=1}^{n},\ W=T,\ B=T\big)`}</MB>
        <Pseudo>{PSEUDO}</Pseudo>
        <Prueba titulo="Los atributos son admisibles" abierta>
          <p>
            <M>{String.raw`w_i=a_i>0`}</M> porque SUBSET SUM pide enteros positivos; <M>{String.raw`v_i=a_i\ge 0`}</M>;{' '}
            <M>{String.raw`W=T\ge 0`}</M> y <M>{String.raw`B=T`}</M>; todos son enteros. Los ids <M>A_i</M> son distintos.
            La salida es una instancia válida de DECISIÓN (pasa <code>validar</code>).
          </p>
        </Prueba>
        <Prueba titulo="Dirección 1: SUBSET SUM SÍ ⇒ DECISIÓN SÍ" abierta>
          <p>
            Si existe <M>{String.raw`S\subseteq\{1..n\}`}</M> con <M>{String.raw`\sum_{i\in S}a_i=T`}</M>, se elige{' '}
            <M>{String.raw`x_i=1`}</M> para <M>{String.raw`i\in S`}</M>. Entonces el consumo es{' '}
            <M>{String.raw`\sum_{S}w_i=\sum_S a_i=T\le T=W`}</M> y el beneficio es{' '}
            <M>{String.raw`\sum_S v_i=\sum_S a_i=T\ge T=B`}</M>. La selección no repite candidatos porque <M>S</M> es un
            conjunto. <Qed />
          </p>
        </Prueba>
        <Prueba titulo="Dirección 2: DECISIÓN SÍ ⇒ SUBSET SUM SÍ" abierta>
          <p>
            Si una selección <M>S</M> cumple consumo <M>{String.raw`\le T`}</M> y beneficio <M>{String.raw`\ge T`}</M>,
            como consumo = beneficio <M>{String.raw`=\sum_{i\in S}a_i`}</M>, se tiene{' '}
            <M>{String.raw`T\le\sum_S a_i\le T`}</M>, es decir, <M>{String.raw`\sum_S a_i=T`}</M> exactamente: <M>S</M> es un
            subconjunto con suma <M>T</M>. <Qed />
          </p>
          <p className="peq muted">
            Con las dos direcciones: <M>I</M> es SÍ para SUBSET SUM si y solo si <M>f(I)</M> es SÍ para DECISIÓN.
          </p>
        </Prueba>
        <Prueba titulo="Tiempo de construcción y tamaño de la salida (lineal)" abierta>
          <p>
            Sea <M>{String.raw`L_{SS}=\sum_i\text{bits}(a_i)+\text{bits}(T)`}</M>. La construcción recorre los{' '}
            <M>n</M> números una vez y copia cada uno dos veces, más <M>T</M> dos veces: <M>{String.raw`O(L_{SS})`}</M>{' '}
            operaciones de bits. La salida mide
          </p>
          <MB>{String.raw`L_{DEC}=\sum_i\big(\text{bits}(a_i)+\text{bits}(a_i)\big)+\text{bits}(T)+\text{bits}(T)=2\,L_{SS}`}</MB>
          <p>
            (más <M>O(n)</M> bits de ids y separadores): tamaño lineal en la entrada. La reducción es polinómica. <Qed />
          </p>
        </Prueba>
      </Tarjeta>

      <div className="dos-columnas">
        <Ejemplo titulo="Instancia SÍ: {3, 5, 7, 11}, T = 15" inst={EJEMPLO_SI} />
        <Ejemplo titulo="Instancia NO: {4, 6, 10}, T = 7" inst={EJEMPLO_NO} />
      </div>

      <Tarjeta titulo="Tu propia instancia">
        <div className="controles">
          <label className="campo" style={{ flex: '1 1 260px' }}>
            Enteros positivos a_1..a_n (separados por comas)
            <input type="text" value={texto} onChange={(e) => setTexto(e.target.value)} style={{ width: '100%' }} />
          </label>
          <label className="campo">
            T (entero ≥ 0)
            <input type="text" inputMode="numeric" value={textoT} onChange={(e) => setTextoT(e.target.value)} style={{ width: 130 }} />
          </label>
        </div>
        {propia.errores.length > 0 && (
          <Aviso tipo="peligro">
            {propia.errores.map((e) => (
              <div key={e}>{e}</div>
            ))}
          </Aviso>
        )}
        {propia.inst && <Ejemplo inst={propia.inst} embebido />}
      </Tarjeta>

      <Aviso tipo="info" titulo="Conclusión">
        DECISIÓN está en NP (certificado de n bits verificable en tiempo polinómico) y es NP-difícil (SUBSET SUM, que es
        NP-completo, se reduce a ella). Por lo tanto, <strong>DECISIÓN Mercado Andino es NP-completa</strong>. La versión
        de optimización es NP-difícil (con ella se responde la decisión comparando el óptimo con B), pero{' '}
        <strong>no se dice NP-completa</strong>, porque no es un problema de decisión y NP solo contiene problemas de
        decisión.
      </Aviso>
    </>
  );
}

function Ejemplo({ titulo, inst, embebido }: { titulo?: string; inst: InstanciaSubsetSum; embebido?: boolean }) {
  const ss = useMemo(() => resolverSubsetSum(inst), [inst]);
  const red = useMemo(() => reducir(inst), [inst]);
  const dec = useMemo(() => decidir(red.instancia, red.B), [red]);
  const cert = useMemo(
    () => (dec.certificado ? verificarCertificado(red.instancia, dec.certificado, red.B) : null),
    [dec, red],
  );
  const iguales = ss.respuesta === dec.respuesta;
  const contenido = (
    <>
      {titulo && <h2>{titulo}</h2>}
      <h3 className="mt0">Antes: SUBSET SUM</h3>
      <p className="mono peq" style={{ overflowWrap: 'anywhere' }}>
        a = [{inst.a.map((x) => fmt(x)).join(', ')}], T = {fmt(inst.T)}
      </p>
      <p>
        Respuesta: {ss.respuesta ? <Chip tipo="ok">SÍ</Chip> : <Chip tipo="mal">NO</Chip>}{' '}
        {ss.testigo && (
          <span className="peq">
            subconjunto {'{'}
            {ss.testigo.map((i) => fmt(inst.a[i])).join(' + ')}
            {'}'} = {fmt(inst.T)}
          </span>
        )}
        {!ss.respuesta && <span className="peq">ningún subconjunto suma {fmt(inst.T)}</span>}
      </p>
      <h3>Después: DECISIÓN Mercado Andino</h3>
      <TablaScroll>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th className="num">w_i</th>
              <th className="num">v_i</th>
            </tr>
          </thead>
          <tbody>
            {red.instancia.candidatos.map((c) => (
              <tr key={c.id}>
                <td className="mono">{c.id}</td>
                <td className="num">{fmt(c.w)}</td>
                <td className="num">{fmt(c.v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablaScroll>
      <p className="peq">
        W = {fmt(red.instancia.W)}, B = {fmt(red.B)}. Óptimo de la versión de optimización: {fmt(dec.optimo)} (
        {dec.nodos} nodos de ramificación y poda).
      </p>
      <p>
        Respuesta: {dec.respuesta ? <Chip tipo="ok">SÍ</Chip> : <Chip tipo="mal">NO</Chip>}{' '}
        {cert && (
          <span className="peq">
            certificado x = {dec.certificado!.join('')} · consumo {fmt(cert.consumo)} ≤ {fmt(red.instancia.W)} ·
            beneficio {fmt(cert.beneficio)} ≥ {fmt(red.B)} · {cert.acepta ? 'aceptado' : 'rechazado'}
          </span>
        )}
        {!dec.respuesta && <span className="peq">el mayor beneficio con consumo ≤ W es {fmt(dec.optimo)} &lt; B</span>}
      </p>
      <Estadisticas>
        <Stat etq="Bits antes" val={red.bitsAntes} nota={`Σ bits(a_i) + bits(T) = ${inst.a.map((x) => bits(x)).join('+') || '0'} + ${bits(inst.T)}`} />
        <Stat etq="Bits después" val={red.bitsDespues} nota="= 2 × bits antes" />
        <Stat etq="Operaciones de construcción" val={red.operaciones} nota="2n + 2 copias" />
        <Stat etq="¿Responden igual?" val={iguales ? 'Sí' : 'No'} />
      </Estadisticas>
    </>
  );
  return embebido ? contenido : <section className="tarjeta" style={{ margin: 0 }}>{contenido}</section>;
}
