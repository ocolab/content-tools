// Utilidades compartidas por los scripts del motor.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const MOTOR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const KIT = path.resolve(MOTOR, "..");
export const PUBLICO = path.join(MOTOR, "public");
export const ACTUAL = path.join(PUBLICO, "actual");

export const SONIDOS = ["tilde", "pop", "tecla", "barrido", "campana"];

export function fallar(mensaje) {
  console.error(`✗ ${mensaje}`);
  process.exit(1);
}

/** «mi-cliente/loop-01» → { cliente, id, dir } */
export function trabajo(arg) {
  if (!arg || !/^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*$/.test(arg))
    fallar("Indicá el trabajo como <cliente>/<id>, por ejemplo: mi-cliente/loop-01");
  const [cliente, id] = arg.split("/");
  return { cliente, id, dir: path.join(KIT, "trabajos", cliente, id) };
}

export const dirCliente = (cliente) => path.join(KIT, "clientes", cliente);

export function leerJson(archivo) {
  try {
    return JSON.parse(fs.readFileSync(archivo, "utf8"));
  } catch (e) {
    fallar(`No se pudo leer ${path.relative(KIT, archivo)}: ${e.message}`);
  }
}

export function escribirJson(archivo, datos) {
  fs.mkdirSync(path.dirname(archivo), { recursive: true });
  fs.writeFileSync(archivo, JSON.stringify(datos, null, 2) + "\n");
}

export const sha256 = (contenido) => crypto.createHash("sha256").update(contenido).digest("hex");
export const sha256Archivo = (archivo) => sha256(fs.readFileSync(archivo));

/** Fecha local AAAA-MM-DD (no UTC: en Argentina a la noche UTC ya es mañana). */
export const hoy = () => new Date().toLocaleDateString("sv-SE");

export function correr(comando, args, opciones = {}) {
  const r = spawnSync(comando, args, { encoding: "utf8", maxBuffer: 1 << 28, ...opciones });
  if (r.error) fallar(`${comando}: ${r.error.message}`);
  if (r.status !== 0 && !opciones.permitirError) fallar(`${comando} terminó con código ${r.status}\n${(r.stderr || "").slice(-2000)}`);
  return r;
}

export function version(comando, args = ["-version"]) {
  const r = spawnSync(comando, args, { encoding: "utf8" });
  return (r.stdout || r.stderr || "").split(/\r?\n/)[0].trim();
}

/** Copia una carpeta entera (sin seguir enlaces). */
export function copiarDir(origen, destino) {
  if (!fs.existsSync(origen)) return;
  fs.mkdirSync(destino, { recursive: true });
  for (const e of fs.readdirSync(origen, { withFileTypes: true })) {
    const o = path.join(origen, e.name);
    const d = path.join(destino, e.name);
    if (e.isDirectory()) copiarDir(o, d);
    else if (e.isFile()) fs.copyFileSync(o, d);
  }
}

/** Clips (escenas «clip») que usa un spec explicativo, sin repetir. */
export const clipsDelSpec = (spec) =>
  spec?.plantilla === "explicativo" ? [...new Set(spec.contenido.escenas.filter((e) => e.tipo === "clip").map((e) => e.archivo))] : [];

/** Segundos de un video o audio, medidos con ffprobe (el stream de video si lo hay). */
export function duracionMedia(archivo) {
  const leer = (args) => Number(correr("ffprobe", ["-v", "error", ...args, "-of", "csv=p=0", archivo]).stdout.trim().split(/\r?\n/)[0]);
  const video = leer(["-select_streams", "v:0", "-show_entries", "stream=duration"]);
  return Number.isFinite(video) && video > 0 ? video : leer(["-show_entries", "format=duration"]);
}

/**
 * Arma public/actual/ con lo que leen las plantillas: capturas, voz, archivos
 * de la marca y clips del trabajo. Devuelve los segundos de cada clip.
 */
export function prepararActual(t, spec) {
  fs.rmSync(ACTUAL, { recursive: true, force: true });
  copiarDir(path.join(t.dir, "capturas"), path.join(ACTUAL, "capturas"));
  copiarDir(path.join(t.dir, "audio"), path.join(ACTUAL, "audio"));
  copiarDir(path.join(dirCliente(t.cliente), "activos"), path.join(ACTUAL, "marca"));
  const clips = {};
  for (const archivo of clipsDelSpec(spec)) {
    const origen = path.join(t.dir, archivo);
    if (!fs.existsSync(origen)) continue;
    fs.mkdirSync(path.dirname(path.join(ACTUAL, archivo)), { recursive: true });
    fs.copyFileSync(origen, path.join(ACTUAL, archivo));
    clips[archivo] = duracionMedia(origen);
  }
  return clips;
}

/** Texto sin tildes ni mayúsculas, para comparar palabras. */
export const normalizar = (t) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export const tokens = (t) => t.split(/\s+/).filter(Boolean);

/** Texto completo de la voz en off de un spec explicativo, tal como se manda a la herramienta de voz. */
export const textoVoz = (spec) => spec.contenido.escenas.map((e) => e.voz.trim()).join(" ");

export { ESTILO_BASE, aplicarVariante } from "../src/variante.js";
