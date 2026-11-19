import { useEffect, useMemo, useState } from 'react';
import { bits, fmt, parseBig } from '../../algorithms/bigint';
import { longitudEntrada, verificarCertificado } from '../../algorithms/decision';
import { useInstancia } from '../../estado';
import { SelectorInstancia } from '../../components/SelectorInstancia';
import { Aviso, Chip, Estadisticas, Prueba, Pseudo, Qed, Stat, TablaScroll, Tarjeta } from '../../components/ui';
import { M, MB } from '../../components/Tex';

const PSEUDO = `
verificador(C, W, B, x):                // x ∈ {0,1}^n es el certificado
  si |x| ≠ n: retornar NO              // 1 comparación
  consumo <- 0 ; beneficio <- 0
  para i en 1..n:                       // n lecturas y n comparaciones
    si x_i = 1:
      consumo <- consumo + w_i          // ≤ 2n sumas en total
      beneficio <- beneficio + v_i
  retornar consumo <= W y beneficio >= B  // 2 comparaciones
`;

export default function Certificado() {
  const { instancia } = useInstancia();
  const n = instancia.candidatos.length;
  const [textoB, setTextoB] = useState('735000');
  const [x, setX] = useState<(0 | 1)[]>(() => Array(n).fill(0));
  useEffect(() => setX(Array(n).fill(0)), [instancia, n]);
  const B = parseBig(textoB);
  const Bv = B !== null && B >= 0n ? B : 0n;
  const r = useMemo(() => verificarCertificado(instancia, x.length === n ? x : Array(n).fill(0), Bv), [instancia, x, n, Bv]);
  const L = useMemo(() => longitudEntrada(instancia, Bv), [instancia, Bv]);

  return (
    <>
      <h1>Certificado y pertenencia a NP</h1>
      <p className="lead">
        Para mostrar que DECISIÓN está en NP basta un certificado corto para cada instancia SÍ y un verificador que lo
        compruebe en tiempo polinómico en la longitud de la entrada.
      </p>
      <SelectorInstancia nMax={40} />

      <Tarjeta titulo="Arma un certificado">
        <div className="controles">
          <label className="campo">
            Umbral B (COP, entero ≥ 0)
            <input type="text" inputMode="numeric" value={textoB} onChange={(e) => setTextoB(e.target.value)} className={B === null || B < 0n ? 'invalido' : ''} style={{ width: 160 }} />
          </label>
          <button type="button" className="boton secundario peq" onClick={() => setX(Array(n).fill(0))}>
            Limpiar
          </button>
          <button type="button" className="boton secundario peq" onClick={() => setX(Array(n).fill(1))}>
            Marcar todos
          </button>
        </div>
        <TablaScroll alta>
          <table>
            <thead>
              <tr>
                <th>x_i</th>
                <th>ID</th>
                <th className="num">w_i (kg)</th>
                <th className="num">v_i (COP)</th>
              </tr>
            </thead>
            <tbody>
              {instancia.candidatos.map((c, i) => (
                <tr key={c.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={x[i] === 1}
                      aria-label={`Incluir ${c.id}`}
                      onChange={(e) => setX(x.map((b, j) => (j === i ? (e.target.checked ? 1 : 0) : b)))}
                    />
                  </td>
                  <td className="mono">{c.id}</td>
                  <td className="num">{fmt(c.w)}</td>
                  <td className="num">{fmt(c.v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TablaScroll>
        <p>
          Certificado: <code style={{ overflowWrap: 'anywhere' }}>x = {x.join('') || '(vacío)'}</code> · mide{' '}
          <strong>{n} bits</strong> (uno por candidato).
        </p>
        <div style={{ fontSize: '1.15rem', margin: '8px 0' }} aria-live="polite">
          {r.acepta ? <Chip tipo="ok">ACEPTADO</Chip> : <Chip tipo="mal">RECHAZADO</Chip>}{' '}
          <span className="peq">
            Σ w·x = {fmt(r.consumo)} {r.cumpleCapacidad ? '≤' : '>'} W = {fmt(instancia.W)} ·{' '}
            Σ v·x = {fmt(r.beneficio)} {r.cumpleUmbral ? '≥' : '<'} B = {fmt(Bv)}
          </span>
        </div>
        <Estadisticas>
          <Stat etq="Lecturas de bits" val={r.ops.lecturasBit} />
          <Stat etq="Sumas" val={r.ops.sumas} nota="≤ 2n" />
          <Stat etq="Comparaciones" val={r.ops.comparaciones} nota="n + 3" />
          <Stat etq="Operaciones totales" val={r.ops.total} nota={`≤ 4n + 3 = ${4 * n + 3}`} />
          <Stat etq="Bits máx. de las sumas" val={r.bitsMaxSumas} nota={`≤ L = ${L.L}`} />
        </Estadisticas>
        <Aviso tipo="info">
          Un rechazo dice que <em>este</em> certificado no sirve; no prueba que la instancia sea NO. Para una instancia NO
          ningún certificado se acepta, pero comprobarlo puede exigir revisar los <M>2^n</M> vectores.
        </Aviso>
      </Tarjeta>

      <Tarjeta titulo="Longitud binaria L de la entrada">
        <MB>{String.raw`L=\sum_{i=1}^{n}\big(\text{bits}(w_i)+\text{bits}(v_i)\big)+\text{bits}(W)+\text{bits}(B),\qquad \text{bits}(x)=\lfloor\log_2 x\rfloor+1\ \ (\text{bits}(0)=1)`}</MB>
        <Estadisticas>
          <Stat etq="L (bits de la entrada)" val={L.L} />
          <Stat etq="bits(W)" val={L.bitsW} />
          <Stat etq="bits(B)" val={L.bitsB} />
          <Stat etq="Número más largo" val={`${L.maxBits} bits`} />
          <Stat etq="Certificado" val={`${n} bits`} nota={`n ≤ L`} />
        </Estadisticas>
        <TablaScroll alta>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th className="num">w_i</th>
                <th className="num">bits(w_i)</th>
                <th className="num">v_i</th>
                <th className="num">bits(v_i)</th>
              </tr>
            </thead>
            <tbody>
              {instancia.candidatos.map((c, i) => (
                <tr key={c.id}>
                  <td className="mono">{c.id}</td>
                  <td className="num mono">{c.w.toString(2)}</td>
                  <td className="num">{L.porCandidato[i].bitsW}</td>
                  <td className="num mono">{c.v.toString(2)}</td>
                  <td className="num">{L.porCandidato[i].bitsV}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TablaScroll>
        <p className="peq muted">
          Los ids y separadores agregan <M>O(n)</M> bits más y no cambian el orden de magnitud. W = {fmt(instancia.W)} en
          binario: <code>{instancia.W.toString(2)}</code> ({bits(instancia.W)} bits).
        </p>
      </Tarjeta>

      <Tarjeta titulo="DECISIÓN está en NP">
        <Pseudo>{PSEUDO}</Pseudo>
        <Prueba titulo="Teorema: DECISIÓN Mercado Andino ∈ NP" abierta>
          <p>
            <strong>Certificado.</strong> Para una instancia SÍ existe una selección válida; se codifica como{' '}
            <M>{String.raw`x\in\{0,1\}^n`}</M>, con <M>{String.raw`x_i=1`}</M> si el candidato <M>i</M> va. Mide{' '}
            <M>{String.raw`n\le L`}</M> bits (cada candidato aporta al menos un bit a la entrada): longitud polinómica. No
            puede tener repeticiones porque cada candidato tiene un solo bit.
          </p>
          <p>
            <strong>Verificador.</strong> Hace <M>n</M> lecturas, a lo sumo <M>2n</M> sumas y <M>n + 3</M> comparaciones:{' '}
            <M>{String.raw`O(n)`}</M> operaciones aritméticas. Cada número de la entrada tiene a lo sumo{' '}
            <M>{String.raw`\ell\le L`}</M> bits y una suma parcial de hasta <M>n</M> de ellos tiene a lo sumo{' '}
            <M>{String.raw`\ell+\lceil\log_2 n\rceil\le 2L`}</M> bits, así que cada suma o comparación cuesta{' '}
            <M>{String.raw`O(L)`}</M> operaciones de bits. Total: <M>{String.raw`O(n\cdot L)\subseteq O(L^2)`}</M>,
            polinómico en la longitud de <strong>toda</strong> la entrada.
          </p>
          <p>
            <strong>Corrección.</strong> Acepta <M>(I, x)</M> si y solo si <M>{String.raw`\sum w_i x_i\le W`}</M> y{' '}
            <M>{String.raw`\sum v_i x_i\ge B`}</M>, que es exactamente que <M>x</M> sea una selección válida. Si <M>I</M>{' '}
            es SÍ, el certificado de la selección válida se acepta; si <M>I</M> es NO, no existe tal selección y ningún{' '}
            <M>x</M> se acepta. <Qed />
          </p>
        </Prueba>
      </Tarjeta>
    </>
  );
}
