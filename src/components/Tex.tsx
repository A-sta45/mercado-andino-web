import katex from 'katex';
import { useMemo } from 'react';

function render(tex: string, display: boolean): string {
  return katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: false });
}

/** Fórmula en línea. */
export function M({ children }: { children: string }) {
  const html = useMemo(() => render(children, false), [children]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Fórmula en bloque. */
export function MB({ children }: { children: string }) {
  const html = useMemo(() => render(children, true), [children]);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
