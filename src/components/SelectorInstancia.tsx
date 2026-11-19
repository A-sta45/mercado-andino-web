import { semillaE2 } from '../algorithms/generador';
import { fmt } from '../algorithms/bigint';
import { NOMBRES_INSTANCIA, useEstado, useInstancia, type TipoInstancia } from '../estado';

/** Selector de la instancia sobre la que se ejecutan los algoritmos (compartido entre páginas). */
export function SelectorInstancia({ nMax = 40, permitir }: { nMax?: number; permitir?: TipoInstancia[] }) {
  const { seleccion, setSeleccion } = useEstado();
  const elegida = useInstancia();
  const tipos = permitir ?? (Object.keys(NOMBRES_INSTANCIA) as TipoInstancia[]);
  const { candidatos, W } = elegida.instancia;
  return (
    <div className="tarjeta" style={{ background: 'var(--surface-2)' }}>
      <div className="controles mt0" style={{ marginTop: 0 }}>
        <label className="campo">
          Instancia
          <select
            value={seleccion.tipo}
            onChange={(e) => setSeleccion({ ...seleccion, tipo: e.target.value as TipoInstancia })}
          >
            {tipos.map((t) => (
              <option key={t} value={t}>
                {NOMBRES_INSTANCIA[t]}
              </option>
            ))}
          </select>
        </label>
        {seleccion.tipo === 'aleatoria' && (
          <>
            <label className="campo">
              n (candidatos)
              <input
                type="number"
                min={0}
                max={nMax}
                value={seleccion.n}
                style={{ width: 90 }}
                onChange={(e) => {
                  const n = Math.max(0, Math.min(nMax, Number(e.target.value) || 0));
                  setSeleccion({ ...seleccion, n, semilla: semillaE2(n, 1) });
                }}
              />
            </label>
            <label className="campo">
              Semilla
              <input
                type="number"
                value={seleccion.semilla}
                style={{ width: 130 }}
                onChange={(e) => setSeleccion({ ...seleccion, semilla: Math.trunc(Number(e.target.value) || 0) })}
              />
            </label>
            <button
              type="button"
              className="boton secundario peq"
              onClick={() => setSeleccion({ ...seleccion, semilla: Math.floor(Math.random() * 1e9) })}
            >
              Otra semilla
            </button>
          </>
        )}
      </div>
      <div className="peq muted">
        {elegida.descripcion} · n = {candidatos.length} candidatos · W = {fmt(W)} kg
        {seleccion.tipo === 'aleatoria' && ' · semilla por defecto s = 20261103 + 100·n + 1 (Entrega 2)'}
      </div>
      {elegida.error && <div className="chip mal" style={{ marginTop: 6 }}>{elegida.error}</div>}
    </div>
  );
}
