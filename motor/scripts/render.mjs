// Renderiza un trabajo: valida, prepara los archivos, arma el video con
// Remotion (opciones fijas), normaliza el volumen y deja un manifiesto con
// hashes para saber si un render nuevo salió idéntico al anterior.
// Uso: npm run render -- <cliente>/<id> [--formatos 9x16,4x5]
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { ensureBrowser, renderMedia, selectComposition } from "@remotion/renderer";
import { MOTOR, PUBLICO, aplicarVariante, correr, dirCliente, escribirJson, fallar, hoy, leerJson, prepararActual, sha256, sha256Archivo, version } from "./comun.mjs";
import { validarTrabajo } from "./validar.mjs";

const arg = process.argv[2];
const { errores, avisos, datos } = validarTrabajo(arg);
for (const a of avisos) console.log(`! ${a}`);
if (errores.length) {
  for (const e of errores) console.log(`✗ ${e}`);
  fallar("No se renderiza con errores de validación.");
}
const { trabajo: t, spec, marca } = datos;
if (!spec)
  fallar("Este trabajo no tiene spec.json. Para montar clips de avatar en el motor, armá un explicativo con escenas «clip» (motor/ejemplos/montaje-avatar.json).");

const i = process.argv.indexOf("--formatos");
const formatos = i > 0 ? process.argv[i + 1].split(",") : spec.formatos;
for (const f of formatos) if (!spec.formatos.includes(f)) fallar(`El spec no incluye el formato ${f}`);

const conVoz = spec.plantilla === "explicativo" && spec.voz.usar;
const palabras = conVoz ? datos.palabras : null;
const audioDeClips = spec.plantilla === "explicativo" && spec.contenido.escenas.some((e) => e.tipo === "clip" && e.audio_del_clip);
const normalizarVolumen = conVoz || audioDeClips || Boolean(spec.audio.musica);

// 1. Archivos del trabajo y de la marca a public/actual (se borra en cada render).
const clips = prepararActual(t, spec);

// 2. Empaquetado y navegador fijo de Remotion.
console.log("· Preparando el navegador y el paquete…");
await ensureBrowser();
const serveUrl = await bundle({ entryPoint: path.join(MOTOR, "src", "index.ts"), publicDir: PUBLICO });

const salidaDir = path.join(t.dir, "salida");
fs.mkdirSync(salidaDir, { recursive: true });
const manifiestoPath = path.join(salidaDir, "manifiesto.json");
const anterior = fs.existsSync(manifiestoPath) ? leerJson(manifiestoPath) : null;
const pkg = leerJson(path.join(MOTOR, "node_modules", "remotion", "package.json"));

/** Hash de una carpeta: rutas ordenadas + contenido. */
const hashDir = (dir) => {
  if (!fs.existsSync(dir)) return null;
  const archivos = [];
  const recorrer = (d) =>
    fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? recorrer(path.join(d, e.name)) : archivos.push(path.join(d, e.name))));
  recorrer(dir);
  return sha256(
    archivos
      .sort()
      .map((a) => `${path.relative(dir, a).replaceAll("\\", "/")}:${sha256Archivo(a)}`)
      .join("\n")
  );
};
const manifiesto = {
  version: 1,
  trabajo: `${t.cliente}/${t.id}`,
  plantilla: spec.plantilla,
  fecha: hoy(),
  entradas: {
    spec_sha256: sha256Archivo(path.join(t.dir, "spec.json")),
    marca_sha256: sha256Archivo(path.join(dirCliente(t.cliente), "marca.json")),
    voz_sha256: conVoz ? sha256Archivo(path.join(t.dir, "audio", "voz.mp3")) : null,
    capturas_sha256: hashDir(path.join(t.dir, "capturas")),
    clips_sha256: Object.keys(clips).length ? Object.fromEntries(Object.keys(clips).map((a) => [a, sha256Archivo(path.join(t.dir, a))])) : null,
    activos_marca_sha256: hashDir(path.join(dirCliente(t.cliente), "activos")),
    plantillas_sha256: hashDir(path.join(MOTOR, "src")),
    render_sha256: sha256Archivo(path.join(MOTOR, "scripts", "render.mjs")),
    sonidos_sha256: hashDir(path.join(PUBLICO, "sonidos")),
    musica_sha256: spec.audio.musica ? sha256Archivo(path.join(PUBLICO, spec.audio.musica)) : null,
  },
  versiones: { remotion: pkg.version, node: process.version, ffmpeg: version("ffmpeg") },
  volumen: normalizarVolumen ? "loudnorm I=-14 LUFS, TP=-1.5 dBTP" : "sin normalizar (solo efectos)",
  formatos: { ...(anterior?.formatos ?? {}) },
};

const huella = (archivo, flujo) =>
  sha256(correr("ffmpeg", ["-v", "error", "-i", archivo, "-map", `0:${flujo}`, "-f", "framemd5", "-"]).stdout);

for (const formato of formatos) {
  const id = `${spec.plantilla}-${formato}`;
  const inputProps = { spec, marca: aplicarVariante(marca, spec.visual?.variante), palabras, clips };
  const composition = await selectComposition({ serveUrl, id, inputProps });
  const crudo = path.join(salidaDir, `.crudo-${formato}.mp4`);
  let ultimo = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: crudo,
    inputProps,
    imageFormat: "png",
    pixelFormat: "yuv420p",
    crf: 18,
    audioCodec: "aac",
    audioBitrate: "192k",
    enforceAudioTrack: true,
    concurrency: 4,
    logLevel: "warn",
    onProgress: ({ progress }) => {
      const p = Math.floor(progress * 10);
      if (p !== ultimo) {
        ultimo = p;
        process.stdout.write(`\r· ${id}: ${p * 10}%`);
      }
    },
  });
  process.stdout.write("\n");

  // 3. Volumen y metadatos fijos.
  const final = path.join(salidaDir, `${t.id}-${formato}.mp4`);
  // -t: el audio (recodificado) nunca puede quedar más largo que el video.
  const comunes = ["-t", (composition.durationInFrames / composition.fps).toFixed(3), "-map_metadata", "-1", "-fflags", "+bitexact", "-flags:v", "+bitexact", "-flags:a", "+bitexact", "-movflags", "+faststart"];
  if (normalizarVolumen) {
    const medida = correr("ffmpeg", ["-hide_banner", "-i", crudo, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"]).stderr;
    const j = JSON.parse(medida.slice(medida.lastIndexOf("{"), medida.lastIndexOf("}") + 1));
    const filtro = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
    correr("ffmpeg", ["-y", "-v", "error", "-i", crudo, "-c:v", "copy", "-af", filtro, "-ar", "48000", "-c:a", "aac", "-b:a", "192k", ...comunes, final]);
  } else {
    correr("ffmpeg", ["-y", "-v", "error", "-i", crudo, "-c", "copy", ...comunes, final]);
  }
  fs.rmSync(crudo, { force: true });

  const registro = {
    archivo: path.basename(final),
    cuadros: composition.durationInFrames,
    segundos: +(composition.durationInFrames / composition.fps).toFixed(2),
    sha256: sha256Archivo(final),
    huella_video: huella(final, "v"),
    huella_audio: huella(final, "a"),
  };
  const previo = anterior?.formatos?.[formato];
  const mismasEntradas = anterior && JSON.stringify(anterior.entradas) === JSON.stringify(manifiesto.entradas);
  if (previo && mismasEntradas)
    console.log(
      previo.huella_video === registro.huella_video && previo.huella_audio === registro.huella_audio
        ? `✓ ${registro.archivo}: idéntico al render anterior (mismas entradas)`
        : `! ${registro.archivo}: con las mismas entradas salió distinto al render anterior; revisar determinismo`
    );
  else console.log(`✓ ${registro.archivo} (${registro.segundos} s)`);
  manifiesto.formatos[formato] = registro;
}

escribirJson(manifiestoPath, manifiesto);
console.log(`\nSiguiente: npm run qc -- ${arg}`);
