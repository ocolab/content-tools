// Cálculo de tiempos sin dependencias: lo usan las plantillas (vía tiempo.ts)
// y los scripts de Node (propuestas), así hay una sola fuente de verdad.

export const FPS = 30;
/** @param {number} segundos */
export const f = (segundos) => Math.round(segundos * FPS);

/** @param {string} t */
export const tokens = (t) => t.split(/\s+/).filter(Boolean);

/**
 * Duración de cada escena del explicativo.
 * Con voz: cada escena empieza cuando arranca su primera palabra (las palabras
 * vienen de la transcripción y se reparten por escena según el texto del spec).
 * Sin voz: se usa `duracion` y las palabras se reparten según su largo.
 * @param {{ contenido: { escenas: { voz: string, duracion?: number }[] } }} spec
 * @param {{ texto: string, inicio: number, fin: number }[] | null} palabras
 * @returns {{ total: number, escenas: { desde: number, frames: number, palabras: { texto: string, desde: number, hasta: number }[] }[] }}
 */
export function tiemposExplicativo(spec, palabras) {
  const escenas = spec.contenido.escenas;
  const cola = 0.9;

  if (palabras && palabras.length) {
    /** @type {[number, number][]} */
    const rangos = [];
    let i = 0;
    for (const e of escenas) {
      const n = tokens(e.voz).length;
      rangos.push([i, i + n]);
      i += n;
    }
    if (i !== palabras.length) throw new Error(`La voz tiene ${palabras.length} palabras y el guion ${i}. Corré npm run validar.`);
    const inicio = escenas.map((_, k) => (k === 0 ? 0 : Math.max(0, palabras[rangos[k][0]].inicio - 0.12)));
    const fin = escenas.map((_, k) => (k < escenas.length - 1 ? inicio[k + 1] : palabras[palabras.length - 1].fin + cola));
    const salidaEscenas = escenas.map((e, k) => {
      const desde = f(inicio[k]);
      const hasta = f(fin[k]);
      const textos = tokens(e.voz);
      const propias = palabras.slice(rangos[k][0], rangos[k][1]);
      return {
        desde,
        frames: hasta - desde,
        palabras: propias.map((p, j) => ({
          texto: textos[j],
          desde: f(p.inicio) - desde,
          hasta: (j < propias.length - 1 ? f(propias[j + 1].inicio) : hasta) - desde,
        })),
      };
    });
    return { total: f(fin[fin.length - 1]), escenas: salidaEscenas };
  }

  let t = 0;
  const salidaEscenas = [];
  for (const e of escenas) {
    const d = e.duracion ?? 3;
    const desde = f(t);
    const hasta = f(t + d);
    const textos = tokens(e.voz);
    const pesos = textos.map((x) => x.length + 2);
    const suma = pesos.reduce((a, b) => a + b, 0);
    const ini = 0.1 * d;
    const fin = 0.92 * d;
    let acumulado = 0;
    const ps = textos.map((texto, j) => {
      const a = ini + ((fin - ini) * acumulado) / suma;
      acumulado += pesos[j];
      const b = ini + ((fin - ini) * acumulado) / suma;
      return { texto, desde: f(a), hasta: j === textos.length - 1 ? hasta - desde : f(b) };
    });
    salidaEscenas.push({ desde, frames: hasta - desde, palabras: ps });
    t += d;
  }
  return { total: f(t), escenas: salidaEscenas };
}
