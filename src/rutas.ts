import { useEffect, useState } from 'react';

export interface Ruta {
  ruta: string;
  titulo: string;
  corto?: string;
}

export interface Seccion {
  ruta: string;
  titulo: string;
  hijos?: Ruta[];
}

export const SECCIONES: Seccion[] = [
  { ruta: '/', titulo: 'Inicio' },
  { ruta: '/datos', titulo: 'Datos' },
  {
    ruta: '/e3',
    titulo: 'Entrega 3',
    hijos: [
      { ruta: '/e3/divide-y-venceras', titulo: 'Divide y vencerás' },
      { ruta: '/e3/avido', titulo: 'Ávido' },
      { ruta: '/e3/programacion-dinamica', titulo: 'Programación dinámica' },
      { ruta: '/e3/ramificacion-y-poda', titulo: 'Ramificación y poda' },
      { ruta: '/e3/comparacion', titulo: 'Comparación' },
    ],
  },
  {
    ruta: '/e4',
    titulo: 'Entrega 4',
    hijos: [
      { ruta: '/e4/teoria', titulo: 'Teoría' },
      { ruta: '/e4/certificado', titulo: 'Certificado y NP' },
      { ruta: '/e4/problemas', titulo: 'Tabla de problemas' },
      { ruta: '/e4/reduccion', titulo: 'Reducción' },
      { ruta: '/e4/pseudopolinomial', titulo: 'Pseudopolinomial' },
    ],
  },
  { ruta: '/e3-vs-e4', titulo: 'E3 vs E4' },
];

function leer(): string {
  const h = window.location.hash.replace(/^#/, '');
  return h === '' ? '/' : h;
}

/** Enrutador por hash: funciona como sitio estático en Vercel sin reescrituras. */
export function useRuta(): string {
  const [ruta, setRuta] = useState(leer);
  useEffect(() => {
    const f = () => {
      setRuta(leer());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return ruta;
}

export function href(ruta: string) {
  return '#' + ruta;
}
