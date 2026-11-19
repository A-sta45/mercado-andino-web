import { useMemo, useState } from 'react';
import { fmt, sumaBig } from '../algorithms/bigint';
import { verificar } from '../algorithms/verificar';
import { filasIniciales, nuevaClave, useEstado, type Fila } from '../estado';
import { Aviso, Chip, Estadisticas, Stat, TablaScroll, Tarjeta } from '../components/ui';
import { M } from '../components/Tex';

const MOTIVOS: Record<string, string> = {
  'id-vacio': 'Identificador vacío',
  duplicado: 'Duplicado (se conserva la primera aparición)',
  'dato-invalido': 'Dato faltante, no numérico o no entero',
  consumo: 'Consumo ≤ 0',
  beneficio: 'Beneficio < 0',
};

export default function Datos() {
  const { filas, setFilas, textoW, setTextoW, validacion, errorW } = useEstado();
  const exclusionPorIndice = useMemo(
    () => new Map((validacion?.excluidos ?? []).map((e) => [e.indice, e])),
    [validacion],
  );

  const cambiar = (clave: number, campo: keyof Fila, valor: string) =>
    setFilas(filas.map((f) => (f.clave === clave ? { ...f, [campo]: valor } : f)));

  const candidatos = validacion?.candidatos ?? [];

  return (
    <>
      <h1>Datos</h1>
      <p className="lead">
        Tablas 1 y 2 del PDF, editables. El validador (<code>validar</code> de la Entrega 1) se ejecuta en vivo: limpia,
        convierte y deja todo en enteros. Los candidatos válidos son la instancia «Datos» de las demás pestañas.
      </p>

      <Tarjeta titulo="Capacidad del vehículo">
        <div className="controles">
          <label className="campo">
            W (kg, entero ≥ 0)
            <input
              type="text"
              inputMode="numeric"
              value={textoW}
              className={errorW ? 'invalido' : ''}
              onChange={(e) => setTextoW(e.target.value)}
              style={{ width: 160 }}
              aria-invalid={!!errorW}
            />
          </label>
          {errorW && <Chip tipo="mal">validar lanza ValueError: W inválida (entero ≥ 0)</Chip>}
        </div>
        {validacion && (
          <Estadisticas>
            <Stat etq="Registros" val={filas.length} />
            <Stat etq="Válidos (n)" val={candidatos.length} />
            <Stat etq="Excluidos" val={validacion.excluidos.length} />
            <Stat etq="Σ consumo" val={`${fmt(sumaBig(candidatos.map((c) => c.w)))} kg`} />
            <Stat etq="Σ beneficio" val={`${fmt(sumaBig(candidatos.map((c) => c.v)))}`} nota="COP" />
          </Estadisticas>
        )}
      </Tarjeta>

      <Tarjeta titulo="Candidatos (Tabla 1 válidos y Tabla 2 inválidos)">
        <p className="peq muted">
          Reglas en orden: id vacío → duplicado → conversión a entero (en texto se quitan «$», «.» y espacios: el punto
          separa miles) → gramos a kg con redondeo hacia arriba → consumo &gt; 0 → beneficio ≥ 0.
        </p>
        <div className="controles">
          <button
            type="button"
            className="boton"
            onClick={() =>
              setFilas([
                ...filas,
                { clave: nuevaClave(), id: `P${String(filas.length + 1).padStart(2, '0')}`, consumo: '1', unidad: 'kg', beneficio: '0', origen: 'Nueva' },
              ])
            }
          >
            Agregar fila
          </button>
          <button type="button" className="boton secundario" onClick={() => setFilas(filasIniciales())}>
            Restaurar Tablas 1 y 2
          </button>
          <button type="button" className="boton secundario" onClick={() => setTextoW('50')}>
            W = 50
          </button>
        </div>
        <TablaScroll>
          <table style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Origen</th>
                <th>ID</th>
                <th>Consumo</th>
                <th>Unidad</th>
                <th>Beneficio (COP)</th>
                <th>Resultado de validar</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => {
                const ex = exclusionPorIndice.get(i);
                const c = !ex && validacion ? validacion.C.get(f.id.trim()) : undefined;
                return (
                  <tr key={f.clave}>
                    <td className="num">{i + 1}</td>
                    <td className="peq muted">{f.origen}</td>
                    <td>
                      <input type="text" value={f.id} onChange={(e) => cambiar(f.clave, 'id', e.target.value)} style={{ width: 80 }} aria-label={`ID fila ${i + 1}`} />
                    </td>
                    <td>
                      <input type="text" value={f.consumo} onChange={(e) => cambiar(f.clave, 'consumo', e.target.value)} style={{ width: 90 }} aria-label={`Consumo fila ${i + 1}`} />
                    </td>
                    <td>
                      <select value={f.unidad} onChange={(e) => cambiar(f.clave, 'unidad', e.target.value)} aria-label={`Unidad fila ${i + 1}`}>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                      </select>
                    </td>
                    <td>
                      <input type="text" value={f.beneficio} onChange={(e) => cambiar(f.clave, 'beneficio', e.target.value)} style={{ width: 120 }} aria-label={`Beneficio fila ${i + 1}`} />
                    </td>
                    <td>
                      {!validacion ? (
                        <span className="muted">—</span>
                      ) : ex ? (
                        <>
                          <Chip tipo="mal">Se excluye</Chip> <span className="peq">{MOTIVOS[ex.regla]}</span>
                          <div className="peq muted mono">{ex.motivo}</div>
                        </>
                      ) : c ? (
                        <>
                          <Chip tipo="ok">Válido</Chip>{' '}
                          <span className="peq mono">
                            {fmt(c.w)} kg · {fmt(c.v)} COP
                          </span>
                          {(f.unidad === 'g' || /[$.\s]/.test(f.beneficio)) && (
                            <div className="peq muted">
                              {f.unidad === 'g' && `Convertido: ${f.consumo} g → ${fmt(c.w)} kg (hacia arriba). `}
                              {/[$.\s]/.test(f.beneficio) && `Convertido: "${f.beneficio}" → ${c.v}.`}
                            </div>
                          )}
                        </>
                      ) : null}
                    </td>
                    <td>
                      <button type="button" className="boton-icono" aria-label={`Eliminar fila ${i + 1}`} onClick={() => setFilas(filas.filter((x) => x.clave !== f.clave))}>
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TablaScroll>
      </Tarjeta>

      <Verificador />
    </>
  );
}

function Verificador() {
  const { validacion } = useEstado();
  const [texto, setTexto] = useState('P01, P03, P07, P08, P11');
  if (!validacion) return null;
  const S = texto
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const r = verificar(validacion.C, S, validacion.W);
  const desc: Record<string, string> = {
    normal: 'Salida normal del ciclo: la selección es factible.',
    R1: 'R1: id inexistente.',
    R2: 'R2: id repetido.',
    R3: 'R3: el consumo acumulado excede W.',
  };
  const formula: Record<string, string> = {
    normal: `11k + 1 = 11·${r.iteraciones} + 1`,
    R1: `11j + 2 = 11·${r.iteraciones} + 2`,
    R2: `11j + 3 = 11·${r.iteraciones} + 3`,
    R3: `11j + 10 = 11·${r.iteraciones} + 10`,
  };
  return (
    <Tarjeta titulo="Verificador de selecciones (Entrega 1)">
      <p className="peq">
        Escribe una selección <M>S</M> (ids separados por comas). <code>verificar</code> la recorre de izquierda a
        derecha y responde si es factible; no dice si es la mejor.
      </p>
      <label className="campo" style={{ width: '100%' }}>
        Selección S
        <input type="text" value={texto} onChange={(e) => setTexto(e.target.value)} style={{ width: '100%' }} />
      </label>
      <div style={{ margin: '10px 0' }}>
        {r.resultado ? <Chip tipo="ok">VERDADERO</Chip> : <Chip tipo="mal">FALSO</Chip>} <span>{desc[r.retorno]}</span>
      </div>
      <Estadisticas>
        <Stat etq="Consumo acumulado" val={`${fmt(r.consumo)} kg`} nota={`W = ${fmt(validacion.W)} kg`} />
        <Stat etq="Beneficio acumulado" val={fmt(r.beneficio)} nota="COP" />
        <Stat etq="Operaciones (Tabla 6)" val={r.ops.total} nota={formula[r.retorno]} />
        <Stat etq="Comparaciones · consultas" val={`${r.ops.comparaciones} · ${r.ops.consultas}`} />
        <Stat etq="Sumas · inserciones" val={`${r.ops.sumas} · ${r.ops.inserciones}`} />
      </Estadisticas>
      {!r.resultado && (
        <Aviso tipo="advertencia">
          En los retornos anticipados, consumo y beneficio son los acumulados del prefijo procesado hasta ese punto.
        </Aviso>
      )}
    </Tarjeta>
  );
}
