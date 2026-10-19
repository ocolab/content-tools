// Toma las capturas de sitios que pide el spec con Chrome sin ventana, con
// tamaño y escala fijos. Una captura ya tomada no se vuelve a tomar (salvo
// --forzar): es un insumo del video y queda registrada con su hash.
// Uso: npm run capturar -- <cliente>/<id> [--forzar]
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ensureBrowser } from "@remotion/renderer";
import { KIT, MOTOR, correr, escribirJson, fallar, hoy, leerJson, sha256Archivo, trabajo } from "./comun.mjs";

// Se usa el Chrome Headless Shell que fija Remotion (misma versión siempre y
// respeta el ancho de celular); el Chrome instalado se actualiza solo y su
// modo sin ventana no baja de ~500 px de ancho.
const dirShell = path.join(MOTOR, "node_modules", ".remotion", "chrome-headless-shell");
const buscar = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? buscar(path.join(dir, e.name)) : /^chrome-headless-shell(\.exe)?$/.test(e.name) ? [path.join(dir, e.name)] : []
      )
    : [];
if (!buscar(dirShell).length) await ensureBrowser();
const CHROME = buscar(dirShell)[0];

const t = trabajo(process.argv[2]);
const forzar = process.argv.includes("--forzar");
const specPath = path.join(t.dir, "spec.json");
if (!fs.existsSync(specPath)) fallar(`Falta ${path.relative(KIT, specPath)}`);
const spec = leerJson(specPath);
if (!spec.capturas?.length) {
  console.log("· El spec no pide capturas.");
  process.exit(0);
}
if (!CHROME) fallar("No encontré Chrome instalado.");

const activosPath = path.join(t.dir, "activos.json");
const activos = fs.existsSync(activosPath) ? leerJson(activosPath) : { version: 1, activos: [] };

for (const c of spec.capturas) {
  const salida = path.join(t.dir, c.archivo);
  if (fs.existsSync(salida) && !forzar) {
    console.log(`· ${c.archivo} ya existe (usá --forzar para tomarla de nuevo)`);
    continue;
  }
  if (c.origen.includes("COMPLETAR")) fallar(`spec.json › capturas: completá el origen de ${c.archivo} con la URL del sitio del cliente`);
  // Las rutas son relativas a la carpeta del kit (con ../ se sale de ella).
  const local = path.resolve(KIT, c.origen);
  const url = /^https?:\/\//.test(c.origen) ? c.origen : pathToFileURL(local).href;
  if (!/^https?:/.test(url) && !fs.existsSync(local)) fallar(`No existe ${c.origen} (las rutas de «capturas» son relativas a la carpeta del kit)`);
  fs.mkdirSync(path.dirname(salida), { recursive: true });
  const args = [
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--mute-audio",
    `--force-device-scale-factor=${c.escala}`,
    `--window-size=${c.ancho},${c.alto}`,
    "--virtual-time-budget=8000",
    `--screenshot=${salida}`,
    url,
  ];
  correr(CHROME, args);
  const dims = correr("ffprobe", ["-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", salida]).stdout.trim();
  const esperado = `${c.ancho * c.escala},${c.alto * c.escala}`;
  if (dims !== esperado) console.warn(`! ${c.archivo} mide ${dims} y se esperaba ${esperado}`);
  const registro = {
    archivo: c.archivo,
    clase: "captura",
    herramienta: `chrome-headless-shell (Remotion ${JSON.parse(fs.readFileSync(path.join(MOTOR, "node_modules", "remotion", "package.json"))).version})`,
    modelo: null,
    parametros: { origen: c.origen, ancho: c.ancho, alto: c.alto, escala: c.escala },
    prompt: null,
    texto_sha256: null,
    sha256: sha256Archivo(salida),
    fecha: hoy(),
    aprobado: false,
  };
  activos.activos = activos.activos.filter((a) => a.archivo !== c.archivo).concat(registro);
  console.log(`✓ ${c.archivo} (${dims})`);
}
escribirJson(activosPath, activos);
