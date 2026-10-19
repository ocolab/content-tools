// Paso 4b: propuestas visuales. Renderiza los cuadros clave del trabajo con
// cada variante de marca.json (solo design tokens del cliente) y arma una hoja
// para comparar. El cliente elige y la elección va a spec.json › visual.
// Uso: npm run propuestas -- <cliente>/<id> [--variantes papel,granito,agua] [--formato 9x16]
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { ensureBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { MOTOR, PUBLICO, aplicarVariante, correr, dirCliente, escribirJson, fallar, hoy, prepararActual } from "./comun.mjs";
import { tiemposExplicativo } from "../src/calculo.js";
import { validarTrabajo } from "./validar.mjs";

const arg = process.argv[2];
const opcion = (n) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > 0 ? process.argv[i + 1] : null;
};

const { errores, datos } = validarTrabajo(arg);
if (errores.length) {
  for (const e of errores) console.log(`✗ ${e}`);
  fallar("Las propuestas se hacen sobre un trabajo válido.");
}
const { trabajo: t, spec, marca } = datos;
if (!spec) fallar("Este trabajo no tiene spec.json.");
const todas = Object.keys(marca.variantes ?? {});
if (!todas.length) fallar(`${t.cliente} no tiene variantes en marca.json (ver clientes/LEEME.md)`);
const variantes = opcion("variantes")?.split(",") ?? todas;
for (const v of variantes) if (!todas.includes(v)) fallar(`No existe la variante «${v}». Hay: ${todas.join(", ")}`);
const formato = opcion("formato") ?? spec.formatos[0];
const palabras = spec.plantilla === "explicativo" && spec.voz.usar ? datos.palabras : null;

/** Cuadros que muestran mejor cada plantilla: el inicio ya armado, el producto y el cierre. */
function cuadrosClave() {
  if (spec.plantilla === "loop-6s")
    return [
      { nombre: "inicio", frame: 95 },
      { nombre: "celular", frame: 156 },
    ];
  const tm = tiemposExplicativo(spec, palabras);
  const escenas = spec.contenido.escenas;
  const enEscena = (k, fraccion) => tm.escenas[k].desde + Math.min(tm.escenas[k].frames - 3, Math.floor(tm.escenas[k].frames * fraccion));
  const cuadros = [{ nombre: "inicio", frame: tm.escenas[0].desde + Math.min(tm.escenas[0].frames - 3, 75) }];
  const medio = escenas.findIndex((e, k) => k > 0 && ["bilingue", "buscador", "armado", "capturas", "clip"].includes(e.tipo));
  if (medio > 0) cuadros.push({ nombre: escenas[medio].tipo, frame: enEscena(medio, 0.8) });
  cuadros.push({ nombre: "cierre", frame: enEscena(escenas.length - 1, 0.95) });
  return cuadros;
}

const clips = prepararActual(t, spec);

console.log("· Preparando el navegador y el paquete…");
await ensureBrowser();
const serveUrl = await bundle({ entryPoint: path.join(MOTOR, "src", "index.ts"), publicDir: PUBLICO });

const dir = path.join(t.dir, "propuestas");
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
const cuadros = cuadrosClave();
const registro = { version: 1, trabajo: `${t.cliente}/${t.id}`, fecha: hoy(), formato, cuadros, variantes: [] };

for (const [n, v] of variantes.entries()) {
  const inputProps = { spec: { ...spec, visual: { variante: v } }, marca: aplicarVariante(marca, v), palabras, clips };
  const composition = await selectComposition({ serveUrl, id: `${spec.plantilla}-${formato}`, inputProps });
  const archivos = [];
  for (const c of cuadros) {
    const salida = path.join(dir, v, `${c.nombre}.png`);
    await renderStill({ composition, serveUrl, output: salida, frame: c.frame, inputProps, imageFormat: "png" });
    archivos.push(path.relative(t.dir, salida).replaceAll("\\", "/"));
  }
  registro.variantes.push({ numero: n + 1, id: v, nombre: marca.variantes[v].nombre, descripcion: marca.variantes[v].descripcion, archivos });
  console.log(`✓ ${n + 1} · ${marca.variantes[v].nombre}`);
}

// Hoja comparativa: una fila por variante, con su número y nombre.
const fuente = path.basename(marca.tipografia.archivo);
const dirFuente = path.join(dirCliente(t.cliente), path.dirname(marca.tipografia.archivo));
const entradas = [];
const filtros = [];
const filas = [];
registro.variantes.forEach((v, fila) => {
  const celdas = v.archivos.map((a) => {
    const k = entradas.length / 2; // cada entrada son dos argumentos: -i y la ruta
    entradas.push("-i", path.join(t.dir, a));
    filtros.push(`[${k}:v]scale=360:-2,pad=iw+16:ih+16:8:8:color=white[c${k}]`);
    return `[c${k}]`;
  });
  const etiqueta = `${v.numero} · ${v.nombre}`.replace(/:/g, "\\:").replace(/'/g, "");
  filtros.push(
    `${celdas.join("")}hstack=inputs=${celdas.length},pad=iw:ih+90:0:90:color=white,drawtext=fontfile=${fuente}:text='${etiqueta}':x=16:y=26:fontsize=44:fontcolor=0x14191C[f${fila}]`
  );
  filas.push(`[f${fila}]`);
});
filtros.push(`${filas.join("")}vstack=inputs=${filas.length}[hoja]`);
const hoja = path.join(dir, `comparacion-${formato}.png`);
correr("ffmpeg", ["-y", "-v", "error", ...entradas, "-filter_complex", filtros.join(";"), "-map", "[hoja]", "-frames:v", "1", hoja], { cwd: dirFuente });
registro.hoja = path.relative(t.dir, hoja).replaceAll("\\", "/");
escribirJson(path.join(dir, "propuestas.json"), registro);

console.log(`\nHoja para elegir: ${path.relative(t.dir, hoja)}`);
console.log('Con la elección: "visual": { "variante": "<id>" } en spec.json, y npm run render.');
