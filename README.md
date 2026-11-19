# Mercado Andino — Entregas 3 y 4

Aplicación web del proyecto final **Mercado Andino** (Análisis y Verificación de Algoritmos, Universidad Politécnico Grancolombiano, 2026).

Integrantes: Thomas Solano Pérez, Viviana Jazmín Gutiérrez Pinayo, Javier Dario Espinel Posada, Dylan Felipe Puentes Montero y Kevin Andrés Soto Lombana. Docente: Vilma Yenny.

- **Entrega 3 (optimización):** divide y vencerás (merge sort por v/w), ávido (heurística), programación dinámica y ramificación y poda. Cada uno tiene una página con su descripción, pseudocódigo, ejecución en vivo, contadores y demostraciones, más una vista de **comparación** contra el exhaustivo.
- **Entrega 4 (decisión):** P, NP, NP-difícil y NP-completo; certificado y verificador; tabla de problemas; reducción SUBSET SUM ≤p DECISIÓN; pseudopolinomialidad.
- **E3 vs E4:** optimización frente a decisión, con búsqueda binaria sobre B.

Es un sitio estático hecho con Vite, React y TypeScript (sin backend). Toda la aritmética de w, v, W, B y T usa `BigInt`.

## Requisitos

- Node.js 20 o superior y npm.

## Correr localmente

```bash
npm install
npm run dev
```

Abre la URL que muestra la terminal (por defecto http://localhost:5173).

Para revisar la versión de producción:

```bash
npm run build
npm run preview
```

## Pruebas

```bash
npm test
```

Las pruebas (Vitest) están en `tests/` y cubren:

- `validar` (Tabla 3) y `verificar` (Tabla 4), con los conteos de operaciones de las Tablas 6 y 13.
- El exhaustivo (Tabla 7: 3.483, 13, 25, 8.191 y 1 llamadas), comparado con la enumeración de los 4.096 subconjuntos.
- El merge sort: orden de la Tabla 8, 29 comparaciones y 88 movimientos, la fórmula M(n) y 300 listas aleatorias con empates y valores de 2⁴⁰.
- El ávido: factibilidad y contraejemplos.
- La DP y la ramificación y poda, que deben ser iguales al exhaustivo en 300 instancias aleatorias con n ≤ 14 (con empates de v/w y BigInt de hasta 2⁷⁰), más la reconstrucción de ids.
- El verificador de certificados, la búsqueda binaria sobre B y la reducción: instancias SÍ y NO, más 200 aleatorias.
- El generador, que es compatible con `random.seed` y `random.randint` de Python.

## Publicar en Vercel

1. Sube el repositorio a GitHub:
   ```bash
   git remote add origin https://github.com/<usuario>/mercado-andino-web.git
   git push -u origin main
   ```
2. Entra a [vercel.com](https://vercel.com), elige **Add New → Project** e importa el repositorio.
3. En **Framework Preset** selecciona **Vite**. Los valores por defecto ya sirven: build `npm run build` y salida `dist`.
4. Pulsa **Deploy**.

La navegación usa rutas con `#` (por ejemplo `/#/e3/comparacion`), así que no hace falta configurar reescrituras.

## Estructura

```
src/algorithms/   lógica pura sin React (validar, verificar, exhaustivo, mergeSort, avido, dp,
                  ramificacionPoda, generador, decision, subsetSum, experimentos)
src/workers/      Web Worker para los algoritmos pesados (exhaustivo hasta n = 22, experimentos)
src/components/   componentes reutilizables (KaTeX, gráficas SVG, lienzo con zoom, selector de instancia)
src/pages/        páginas: Datos, e3/*, e4/*, E3vsE4
src/data/         Tablas 1 y 2 del PDF y contraejemplos
tests/            pruebas con Vitest
```

## Supuestos

- **Generador:** reproduce el MT19937 de Python con `random.seed(s)` y `randint`. El PDF no dice en qué orden se sortean los valores ni cómo se nombran los ids. Se supuso que por cada candidato se sortea primero w y luego v, y que los ids son `P01…` con ancho fijo. Por eso las instancias no tienen por qué coincidir con los CSV de la Entrega 2.
- **Memoria:** en la comparación es una estimación a partir de las estructuras (marcos de pila, celdas, referencias). El navegador no expone una medición fiable por función.
- **Tiempos:** cada medición ejecuta el algoritmo varias veces seguidas hasta sumar al menos 10 ms, porque el navegador redondea `performance.now()`.
- **Longitud de la entrada:** L = Σ(bits(wᵢ) + bits(vᵢ)) + bits(W) + bits(B). Los ids y separadores aportan O(n) bits más y no se cuentan.
