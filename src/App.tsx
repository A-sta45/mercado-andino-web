import { lazy, Suspense, useEffect, useState } from 'react';
import { href, SECCIONES, useRuta } from './rutas';
import { INTEGRANTES } from './data/proyecto';
import Inicio from './pages/Inicio';
import Datos from './pages/Datos';

const DivideVenceras = lazy(() => import('./pages/e3/DivideVenceras'));
const Avido = lazy(() => import('./pages/e3/Avido'));
const ProgDinamica = lazy(() => import('./pages/e3/ProgDinamica'));
const RamificacionPoda = lazy(() => import('./pages/e3/RamificacionPoda'));
const Comparacion = lazy(() => import('./pages/e3/Comparacion'));
const Teoria = lazy(() => import('./pages/e4/Teoria'));
const Certificado = lazy(() => import('./pages/e4/Certificado'));
const Problemas = lazy(() => import('./pages/e4/Problemas'));
const Reduccion = lazy(() => import('./pages/e4/Reduccion'));
const Pseudopolinomial = lazy(() => import('./pages/e4/Pseudopolinomial'));
const E3vsE4 = lazy(() => import('./pages/E3vsE4'));

const PAGINAS: Record<string, React.ComponentType> = {
  '/': Inicio,
  '/datos': Datos,
  '/e3/divide-y-venceras': DivideVenceras,
  '/e3/avido': Avido,
  '/e3/programacion-dinamica': ProgDinamica,
  '/e3/ramificacion-y-poda': RamificacionPoda,
  '/e3/comparacion': Comparacion,
  '/e4/teoria': Teoria,
  '/e4/certificado': Certificado,
  '/e4/problemas': Problemas,
  '/e4/reduccion': Reduccion,
  '/e4/pseudopolinomial': Pseudopolinomial,
  '/e3-vs-e4': E3vsE4,
};

type Tema = 'auto' | 'claro' | 'oscuro';

function useTema(): [Tema, () => void] {
  const [tema, setTema] = useState<Tema>(() => {
    try {
      const t = localStorage.getItem('tema');
      return t === 'claro' || t === 'oscuro' ? t : 'auto';
    } catch {
      return 'auto';
    }
  });
  useEffect(() => {
    const el = document.documentElement;
    if (tema === 'auto') delete el.dataset.theme;
    else el.dataset.theme = tema === 'oscuro' ? 'dark' : 'light';
    try {
      if (tema === 'auto') localStorage.removeItem('tema');
      else localStorage.setItem('tema', tema);
    } catch {
      /* sin almacenamiento */
    }
  }, [tema]);
  const ciclo = () => setTema((t) => (t === 'auto' ? 'claro' : t === 'claro' ? 'oscuro' : 'auto'));
  return [tema, ciclo];
}

function IconoTema({ tema }: { tema: Tema }) {
  const comun = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true } as const;
  if (tema === 'claro')
    return (
      <svg {...comun}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  if (tema === 'oscuro')
    return (
      <svg {...comun}>
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
      </svg>
    );
  return (
    <svg {...comun}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" />
    </svg>
  );
}

function Logo() {
  return (
    <svg className="marca-logo" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <path d="M5 24 L12 11 L17 19 L21 13 L27 24 Z" fill="var(--surface)" />
    </svg>
  );
}

export default function App() {
  const ruta = useRuta();
  const [tema, cicloTema] = useTema();
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [ruta]);
  const seccionActiva = SECCIONES.find((s) => (s.ruta === '/' ? ruta === '/' : ruta.startsWith(s.ruta)));
  const Pagina = PAGINAS[ruta] ?? (seccionActiva?.hijos ? PAGINAS[seccionActiva.hijos[0].ruta] : Inicio);
  const rutaEfectiva = PAGINAS[ruta] ? ruta : seccionActiva?.hijos?.[0].ruta ?? '/';
  const iconoTema = <IconoTema tema={tema} />;

  return (
    <>
      <header className="encabezado">
        <div className="encabezado-fila">
          <a className="marca" href={href('/')}>
            <Logo />
            <span className="marca-texto">
              <span className="marca-titulo">Mercado Andino</span>
              <span className="marca-sub" title={INTEGRANTES.join(', ')}>
                {INTEGRANTES.join(' · ')}
              </span>
            </span>
          </a>
          <nav className="nav-principal" aria-label="Secciones">
            {SECCIONES.map((s) => (
              <a
                key={s.ruta}
                href={href(s.hijos ? s.hijos[0].ruta : s.ruta)}
                className={seccionActiva?.ruta === s.ruta ? 'activo' : ''}
                aria-current={seccionActiva?.ruta === s.ruta ? 'page' : undefined}
              >
                {s.titulo}
              </a>
            ))}
          </nav>
          <div className="acciones" style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="boton-icono"
              onClick={cicloTema}
              aria-label={`Tema: ${tema}. Cambiar tema`}
              title={`Tema: ${tema}`}
            >
              {iconoTema}
            </button>
            <button
              type="button"
              className="boton-icono solo-movil"
              aria-expanded={menu}
              aria-controls="menu-movil"
              aria-label="Abrir menú"
              onClick={() => setMenu((m) => !m)}
            >
              {menu ? '✕' : '☰'}
            </button>
          </div>
        </div>
        {seccionActiva?.hijos && (
          <nav className="subnav" aria-label={seccionActiva.titulo}>
            {seccionActiva.hijos.map((h) => (
              <a key={h.ruta} href={href(h.ruta)} className={rutaEfectiva === h.ruta ? 'activo' : ''}>
                {h.titulo}
              </a>
            ))}
          </nav>
        )}
        <nav id="menu-movil" className={`menu-movil${menu ? ' abierto' : ''}`} aria-label="Menú">
          {SECCIONES.map((s) => (
            <div key={s.ruta}>
              <a
                href={href(s.hijos ? s.hijos[0].ruta : s.ruta)}
                className={!s.hijos && rutaEfectiva === s.ruta ? 'activo' : ''}
              >
                {s.titulo}
              </a>
              {s.hijos?.map((h) => (
                <a key={h.ruta} href={href(h.ruta)} className={`sub${rutaEfectiva === h.ruta ? ' activo' : ''}`}>
                  {h.titulo}
                </a>
              ))}
            </div>
          ))}
          <p className="peq muted" style={{ margin: '10px 10px 0' }}>
            Integrantes: {INTEGRANTES.join(', ')}.
          </p>
        </nav>
      </header>
      <main>
        <Suspense fallback={<p className="cargando">Cargando…</p>}>
          <Pagina />
        </Suspense>
      </main>
      <footer className="pie">
        Proyecto Final – Mercado Andino · Universidad Politécnico Grancolombiano · Análisis y Verificación de
        Algoritmos · 2026. Datos sintéticos.
      </footer>
    </>
  );
}
