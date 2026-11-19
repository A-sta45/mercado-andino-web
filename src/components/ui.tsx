import type { ReactNode } from 'react';

export function Tarjeta({ titulo, children, id }: { titulo?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section className="tarjeta" id={id}>
      {titulo && <h2>{titulo}</h2>}
      {children}
    </section>
  );
}

export function Aviso({
  tipo = 'info',
  titulo,
  children,
}: {
  tipo?: 'info' | 'advertencia' | 'peligro' | 'exito';
  titulo?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`aviso ${tipo}`} role={tipo === 'peligro' ? 'alert' : undefined}>
      {titulo && <strong>{titulo}</strong>}
      {children}
    </div>
  );
}

export function Stat({ etq, val, nota }: { etq: ReactNode; val: ReactNode; nota?: ReactNode }) {
  return (
    <div className="stat">
      <span className="etq">{etq}</span>
      <span className="val">{val}</span>
      {nota && <div className="nota">{nota}</div>}
    </div>
  );
}

export function Estadisticas({ children }: { children: ReactNode }) {
  return <div className="estadisticas">{children}</div>;
}

export function Pseudo({ children }: { children: string }) {
  // Resalta comentarios con //
  const lineas = children.replace(/^\n/, '').replace(/\s+$/, '').split('\n');
  return (
    <pre className="pseudo" aria-label="Pseudocódigo">
      {lineas.map((l, i) => {
        const k = l.indexOf('//');
        return (
          <span key={i}>
            {k >= 0 ? (
              <>
                {l.slice(0, k)}
                <span className="com">{l.slice(k)}</span>
              </>
            ) : (
              l
            )}
            {'\n'}
          </span>
        );
      })}
    </pre>
  );
}

export function Prueba({ titulo, children, abierta }: { titulo: ReactNode; children: ReactNode; abierta?: boolean }) {
  return (
    <details className="prueba" open={abierta}>
      <summary>{titulo}</summary>
      <div className="cuerpo">{children}</div>
    </details>
  );
}

export function Qed() {
  return <span className="qed">■</span>;
}

export function TablaScroll({ children, alta }: { children: ReactNode; alta?: boolean }) {
  return <div className={`tabla-scroll${alta ? ' tabla-alta' : ''}`}>{children}</div>;
}

export function Chip({ tipo, children }: { tipo?: 'ok' | 'mal' | 'adv'; children: ReactNode }) {
  return <span className={`chip${tipo ? ' ' + tipo : ''}`}>{children}</span>;
}

export function Segmentado<T extends string>({
  opciones,
  valor,
  onCambio,
  etiqueta,
}: {
  opciones: { valor: T; texto: string }[];
  valor: T;
  onCambio: (v: T) => void;
  etiqueta: string;
}) {
  return (
    <div className="segmentado" role="group" aria-label={etiqueta}>
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          className={o.valor === valor ? 'activo' : ''}
          aria-pressed={o.valor === valor}
          onClick={() => onCambio(o.valor)}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}

export function Ids({ ids }: { ids: readonly string[] }) {
  return <span className="ids">[{ids.join(', ')}]</span>;
}
