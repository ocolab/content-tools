// Clips de avatar y b-roll (paso 5). Lee plan-avatar.json, genera el clip de
// una escena con una API de video (hoy fal.ai, con la clave en la variable de
// entorno FAL_KEY o en motor/.env) y lo registra en activos.json con herramienta, modelo,
// prompt, entradas y hash. Lo generado no se regenera en silencio: si el clip
// ya está, hace falta --forzar.
//
// Las escenas que hablan usan la toma de voz del trabajo (npm run voz): se
// corta el tramo de su escena y el modelo de lip-sync mueve la boca de la
// imagen con ese audio. Así la voz y el acento son los mismos en todo el
// anuncio, y el montaje (escena «clip» del explicativo) suena con esa toma.
//
//   npm run clip -- <cliente>/<id> <escena|todas> [--modelo <alias>] [--estilo stable|expressive] [--audio <ruta>]
//       Muestra qué se manda y cuánto cuesta. No gasta nada. Deja el tramo de
//       voz en activos/entradas/<escena>.wav para escucharlo antes.
//   npm run clip -- <cliente>/<id> <escena> --gastar [--forzar]
//       Genera el clip (cobra). Pedir OK antes, con el costo estimado.
//   npm run clip -- <cliente>/<id> <escena> retomar
//       Sigue esperando una generación ya pagada (si se cortó la espera).
//   npm run clip -- <cliente>/<id> <escena> registrar --video <ruta|url> --herramienta "<nombre>" [--modelo <m>] [--prompt "<texto>"] [--forzar]
//       Registra un clip hecho afuera (Google Flow, ElevenLabs, Hedra…).
//   npm run clip -- modelos
import fs from "node:fs";
import path from "node:path";
import { cargarClaves, correr, duracionMedia, escribirJson, fallar, hoy, leerJson, sha256, sha256Archivo, trabajo } from "./comun.mjs";
import { FPS, tiemposExplicativo } from "../src/calculo.js";
import { validarTrabajo } from "./validar.mjs";

// Precios leídos en las páginas de cada modelo en fal.ai el 2026-10-19. Pueden
// cambiar: antes de gastar se muestran como estimación.
const PRECIOS_LEIDOS = "2026-10-19";
const MODELOS = {
  "heygen-avatar4": {
    endpoint: "fal-ai/heygen/avatar4/image-to-video",
    clase: "habla",
    precio: "USD 0,10 por segundo de video (1080p, 9:16)",
    costo: (s) => 0.1 * s,
    usaPrompt: false,
    entrada: ({ imagen, audio, estilo }) => ({ image_url: imagen, audio_url: audio, resolution: "1080p", aspect_ratio: "9:16", talking_style: estilo, caption: false }),
  },
  "omnihuman-v2": {
    endpoint: "fal-ai/bytedance/omnihuman/v2",
    clase: "habla",
    precio: "USD 0,105 por segundo (720p); el audio tiene que durar 4 s o más",
    costo: (s) => 0.105 * s,
    audioMinimo: 4,
    usaPrompt: true,
    entrada: ({ imagen, audio, prompt }) => ({ image_url: imagen, audio_url: audio, prompt }),
  },
  "kling-avatar-v2": {
    endpoint: "fal-ai/kling-video/ai-avatar/v2/standard",
    clase: "habla",
    precio: "USD 0,0562 por segundo",
    costo: (s) => 0.0562 * s,
    usaPrompt: true,
    entrada: ({ imagen, audio, prompt }) => ({ image_url: imagen, audio_url: audio, prompt }),
  },
  "kling-2.5-turbo-pro": {
    endpoint: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
    clase: "broll",
    precio: "USD 0,35 por 5 s y 0,07 por cada segundo más (1080p); solo 5 o 10 s",
    duraciones: [5, 10],
    costo: (s) => 0.35 + 0.07 * (s - 5),
    usaPrompt: true,
    entrada: ({ imagen, prompt, segundos }) => ({ image_url: imagen, prompt, duration: String(segundos) }),
  },
  "seedance-1-pro-fast": {
    endpoint: "fal-ai/bytedance/seedance/v1/pro/fast/image-to-video",
    clase: "broll",
    precio: "USD 1 por millón de tokens: unos 0,24 por 5 s a 1080p; de 2 a 12 s",
    duraciones: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    costo: (s) => (1920 * 1080 * 24 * s) / 1024 / 1e6,
    usaPrompt: true,
    entrada: ({ imagen, prompt, segundos }) => ({ image_url: imagen, prompt, duration: String(segundos), resolution: "1080p", aspect_ratio: "9:16" }),
  },
};
const POR_DEFECTO = { habla: "heygen-avatar4", broll: "kling-2.5-turbo-pro" };
const FAL = "https://queue.fal.run";
const ESPERA_MAXIMA_MIN = 20;

cargarClaves(); // FAL_KEY puede venir del sistema o de motor/.env
const usd = (n) => `USD ${n.toFixed(2)}`;
const args = process.argv.slice(2);
const opcion = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] ?? null : null;
};
const bandera = (n) => args.includes(`--${n}`);

if (args[0] === "modelos") {
  console.log(`Modelos de npm run clip (fal.ai, precios leídos el ${PRECIOS_LEIDOS}):\n`);
  for (const [alias, m] of Object.entries(MODELOS))
    console.log(`  ${alias.padEnd(21)} ${m.clase === "habla" ? "lip-sync " : "b-roll   "} ${m.precio}${POR_DEFECTO[m.clase] === alias ? "  (por defecto)" : ""}\n  ${"".padEnd(31)}${m.endpoint}`);
  process.exit(0);
}

const arg = args[0];
const t = trabajo(arg);
const nombreEscena = args[1];
const accion = ["registrar", "retomar"].includes(args[2]) ? args[2] : bandera("gastar") ? "gastar" : "estimar";
if (!nombreEscena || nombreEscena.startsWith("--")) fallar(`Indicá la escena: npm run clip -- ${arg} <escena>, o «todas» para estimar el anuncio entero`);

// Estimar se puede antes de tener imágenes y voz (para aprobar el gasto en el paso 4);
// generar o registrar, solo con el trabajo válido.
const { errores, avisos, datos } = validarTrabajo(arg, { sinClips: true });
for (const a of avisos) console.log(`! ${a}`);
for (const e of errores) console.log(`${accion === "estimar" ? "!" : "✗"} ${e}`);
if (errores.length && accion !== "estimar") fallar("No se generan ni registran clips con errores de validación (npm run validar).");
const plan = datos.plan;
if (!plan) fallar(`${arg} no tiene un plan-avatar.json válido: los clips salen de sus escenas (paso 4).`);
const activosPath = path.join(t.dir, "activos.json");
const activos = fs.existsSync(activosPath) ? leerJson(activosPath) : { version: 1, activos: [] };
const registro = (archivo) => activos.activos.find((a) => a.archivo === archivo);

/** El prompt de video del plan con {{guion}}, {{voz}} y {{acento}} reemplazados. */
function promptDe(escena) {
  const p = escena.video.prompt
    .replaceAll("{{guion}}", escena.guion ?? "")
    .replaceAll("{{line}}", escena.guion ?? "")
    .replaceAll("{{voz}}", plan.personaje.voz)
    .replaceAll("{{acento}}", plan.personaje.acento);
  if (/\{\{/.test(p)) fallar(`El prompt de video de «${escena.id}» tiene un {{…}} sin reemplazar: ${p.match(/\{\{[^}]*\}\}/)[0]}`);
  return p;
}

/** Índice y segundos de la escena «clip» del montaje que usa este archivo, si existe. */
function enElMontaje(salida) {
  const spec = datos.spec;
  if (spec?.plantilla !== "explicativo") return null;
  const k = spec.contenido.escenas.findIndex((e) => e.tipo === "clip" && e.archivo === salida);
  if (k < 0) return null;
  try {
    const tm = tiemposExplicativo(spec, spec.voz.usar ? datos.palabras ?? null : null);
    return { k, desde: tm.escenas[k].desde / FPS, segundos: tm.escenas[k].frames / FPS };
  } catch {
    return null; // la voz no coincide con el guion: validar ya lo marca
  }
}

/**
 * Todo lo que hace falta para generar una escena, sin gastar: modelo, entradas,
 * duración y costo. Con «estimar», lo que todavía falta (imagen, toma de voz)
 * se avisa y el costo sale de la duración del plan.
 */
function preparar(escena, estimar = false) {
  const falta = (mensaje) => (estimar ? (p.faltan.push(mensaje), null) : fallar(mensaje));
  if (escena.clase === "dualcast") fallar(`«${escena.id}» es dualcast (dos voces en un plano): se genera afuera y se registra con npm run clip -- ${arg} ${escena.id} registrar`);
  const clase = escena.guion !== null && escena.clase !== "broll" ? "habla" : "broll";
  const alias = opcion("modelo") ?? (MODELOS[escena.video.herramienta] ? escena.video.herramienta : POR_DEFECTO[clase]);
  const modelo = MODELOS[alias];
  if (!modelo) fallar(`No conozco el modelo «${alias}». Hay: ${Object.keys(MODELOS).join(", ")} (npm run clip -- modelos)`);
  if (modelo.clase !== clase)
    fallar(`«${escena.id}» ${clase === "habla" ? "habla y necesita un modelo de lip-sync" : "no habla y necesita un modelo de imagen a video"}; ${alias} es de ${modelo.clase === "habla" ? "lip-sync" : "b-roll"}`);
  if (!/^activos\/[a-z0-9-]+\.mp4$/.test(escena.video.salida)) fallar(`plan-avatar.json › ${escena.id}.video.salida tiene que ser activos/<nombre>.mp4 (es ${escena.video.salida})`);

  const imagen = path.join(t.dir, escena.imagen.salida);
  const montaje = enElMontaje(escena.video.salida);
  const p = { escena, clase, alias, modelo, imagen, prompt: promptDe(escena), montaje, faltan: [] };
  if (!fs.existsSync(imagen)) falta(`falta ${escena.imagen.salida}, la imagen de «${escena.id}»: primero la hoja de personaje y la imagen de la escena (paso 5)`);
  else if (!registro(escena.imagen.salida)) console.log(`! ${escena.imagen.salida} no está registrada en activos.json: registrala con su herramienta y prompt`);

  if (clase === "habla") {
    const propio = opcion("audio");
    let filtro;
    let origen;
    if (propio) {
      if (!fs.existsSync(propio)) fallar(`No existe ${propio}`);
      origen = { origen: path.basename(propio), sha256: sha256Archivo(propio) };
      p.tramo = `${path.basename(propio)} entero`;
      filtro = "anull";
      p.segundosAudio = duracionMedia(propio);
      p.fuenteAudio = propio;
    } else {
      const voz = path.join(t.dir, "audio", "voz.mp3");
      const sinVoz = !datos.spec?.voz?.usar || !fs.existsSync(voz) || !datos.palabras;
      if (sinVoz || !montaje) {
        falta(
          sinVoz
            ? `«${escena.id}» habla: primero la toma de voz del anuncio (npm run voz -- ${arg} texto, catalogo/prompts/voz.md) con "voz": { "usar": true } en spec.json, o pasá --audio <archivo>`
            : `«${escena.id}» habla y ninguna escena «clip» de spec.json usa ${escena.video.salida}: sin eso no sé qué tramo de la voz le toca`
        );
        p.segundos = Math.max(escena.duracion, modelo.audioMinimo ?? 0);
        p.costo = modelo.costo(p.segundos);
        return p;
      }
      origen = { origen: "audio/voz.mp3", voz_sha256: sha256Archivo(voz), desde: +montaje.desde.toFixed(3), hasta: +(montaje.desde + montaje.segundos).toFixed(3) };
      p.tramo = `${montaje.desde.toFixed(2)}–${(montaje.desde + montaje.segundos).toFixed(2)} s de audio/voz.mp3`;
      filtro = `atrim=start=${montaje.desde.toFixed(3)}:end=${(montaje.desde + montaje.segundos).toFixed(3)},asetpts=N/SR/TB`;
      p.segundosAudio = montaje.segundos;
      p.fuenteAudio = voz;
    }
    const entradas = path.join(t.dir, "activos", "entradas");
    fs.mkdirSync(entradas, { recursive: true });
    p.audio = path.join(entradas, `${escena.id}.wav`);
    // Algunos modelos piden un mínimo de audio: se completa con silencio y el montaje usa solo lo que dura la escena.
    p.segundos = Math.max(p.segundosAudio, modelo.audioMinimo ?? 0);
    if (p.segundos > p.segundosAudio) filtro += `,apad=whole_dur=${p.segundos.toFixed(3)}`;
    correr("ffmpeg", ["-y", "-v", "error", "-i", p.fuenteAudio, "-af", filtro, "-ac", "1", "-ar", "44100", "-c:a", "pcm_s16le", p.audio]);
    p.origenAudio = { ...origen, archivo: path.relative(t.dir, p.audio).replaceAll("\\", "/"), sha256: sha256Archivo(p.audio) };
    p.costo = modelo.costo(Math.ceil(p.segundos * 10) / 10);
  } else {
    if (!montaje) falta(`ninguna escena «clip» de spec.json usa ${escena.video.salida}: se estima con la duración del plan`);
    const necesarios = montaje?.segundos ?? escena.duracion;
    const d = modelo.duraciones.find((x) => x >= necesarios - 0.05);
    if (!d) fallar(`«${escena.id}» dura ${necesarios.toFixed(1)} s y ${alias} hace hasta ${Math.max(...modelo.duraciones)} s: partila en dos escenas`);
    p.segundos = d;
    p.costo = modelo.costo(d);
  }
  return p;
}

function mostrar(p) {
  const { escena, modelo } = p;
  console.log(`\n«${escena.id}» (${escena.clase}, ${p.clase === "habla" ? "habla: lip-sync" : "sin hablar: imagen a video"}) → ${escena.video.salida}`);
  console.log(`  Modelo: ${p.alias} (${modelo.endpoint})${p.alias === "heygen-avatar4" ? `, estilo ${opcion("estilo") ?? "stable"}` : ""}`);
  console.log(`  Imagen: ${escena.imagen.salida}`);
  for (const x of p.faltan) console.log(`  ! Antes de generar: ${x}`);
  if (p.clase === "habla" && !p.audio) console.log(`  Audio: todavía no hay tramo de voz; el costo sale de la duración del plan (${escena.duracion} s)`);
  else if (p.audio) {
    console.log(`  Audio: ${p.tramo} → ${p.origenAudio.archivo} (escuchalo antes de gastar)`);
    if (p.segundos > p.segundosAudio) console.log(`  ! ${p.alias} pide ${modelo.audioMinimo} s de audio como mínimo: se completa con silencio y se cobra ${p.segundos.toFixed(1)} s`);
  } else console.log(`  Duración: ${p.segundos} s${p.montaje ? ` (la escena dura ${p.montaje.segundos.toFixed(2)} s)` : ""}`);
  console.log(`  Prompt: ${modelo.usaPrompt ? p.prompt : "(este modelo no usa prompt: mueve la cara según el audio)"}`);
  console.log(`  Costo estimado: ${usd(p.costo)} · ${modelo.precio} · precio leído el ${PRECIOS_LEIDOS} en fal.ai/models, puede cambiar`);
}

const dataUri = (archivo) => {
  const ext = path.extname(archivo).slice(1).toLowerCase();
  const tipo = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", wav: "audio/wav", mp3: "audio/mpeg" }[ext];
  if (!tipo) fallar(`No sé mandar archivos .${ext}`);
  return `data:${tipo};base64,${fs.readFileSync(archivo).toString("base64")}`;
};

async function pedir(url, opciones = {}) {
  const r = await fetch(url, { ...opciones, headers: { Authorization: `Key ${process.env.FAL_KEY}`, "Content-Type": "application/json" } });
  const texto = await r.text();
  let cuerpo;
  try {
    cuerpo = JSON.parse(texto);
  } catch {
    cuerpo = texto;
  }
  if (!r.ok) throw new Error(`fal.ai respondió ${r.status}: ${(typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo.detail ?? cuerpo)).slice(0, 600)}`);
  return cuerpo;
}

async function traer(origen) {
  if (/^https?:\/\//.test(origen)) {
    const r = await fetch(origen);
    if (!r.ok) fallar(`No se pudo bajar ${origen}: ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
  }
  if (!fs.existsSync(origen)) fallar(`No existe ${origen}`);
  return fs.readFileSync(origen);
}

function registrar(escena, entrada) {
  const salida = path.join(t.dir, escena.video.salida);
  const sigue = activos.activos.filter((a) => a.archivo !== escena.video.salida);
  activos.activos = sigue.concat({
    archivo: escena.video.salida,
    clase: "video",
    ...entrada,
    texto_sha256: escena.guion ? sha256(escena.guion) : null,
    sha256: sha256Archivo(salida),
    fecha: hoy(),
    aprobado: false,
  });
  escribirJson(activosPath, activos);
  console.log(`✓ ${escena.video.salida} registrado: ${duracionMedia(salida).toFixed(2)} s`);
  console.log(`  Siguiente: miralo, y npm run validar -- ${arg} y npm run render -- ${arg}`);
}

const escenas = nombreEscena === "todas" ? plan.escenas : [plan.escenas.find((e) => e.id === nombreEscena) ?? fallar(`plan-avatar.json no tiene la escena «${nombreEscena}». Hay: ${plan.escenas.map((e) => e.id).join(", ")}`)];
if (nombreEscena === "todas" && accion !== "estimar") fallar("«todas» solo estima: cada clip se genera aparte, con su OK.");
const escena = escenas[0];
const salida = path.join(t.dir, escena.video.salida);
const pendiente = path.join(t.dir, "activos", "entradas", `${escena.id}.pendiente.json`);
const yaEsta = () => {
  if ((fs.existsSync(salida) || registro(escena.video.salida)) && !bandera("forzar"))
    fallar(`${escena.video.salida} ya existe o está registrado. Lo generado no se regenera en silencio: si querés otro, agregá --forzar (y en lip-sync, cobra de nuevo).`);
};

if (accion === "estimar") {
  let total = 0;
  for (const e of escenas) {
    if (nombreEscena === "todas" && e.clase === "dualcast") {
      console.log(`\n«${e.id}» (dualcast): se genera afuera y se registra con «registrar»`);
      continue;
    }
    const p = preparar(e, true);
    mostrar(p);
    if (fs.existsSync(path.join(t.dir, e.video.salida))) console.log(`  (ya existe: generarlo de nuevo pide --forzar)`);
    total += p.costo;
  }
  if (escenas.length > 1) console.log(`\nTotal estimado: ${usd(total)} (sin contar repeticiones)`);
  console.log(`\nNo se gastó nada. Para generar una escena (cobra): npm run clip -- ${arg} <escena> --gastar`);
  process.exit(0);
}

if (accion === "registrar") {
  yaEsta();
  const video = opcion("video") ?? fallar("Falta --video <ruta|url>");
  const herramienta = opcion("herramienta") ?? fallar('Falta --herramienta "<nombre>" (por ejemplo "Google Flow")');
  fs.mkdirSync(path.dirname(salida), { recursive: true });
  fs.writeFileSync(salida, await traer(video));
  const r = correr("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_type", "-of", "csv=p=0", salida], { permitirError: true });
  if (!r.stdout.includes("video")) {
    fs.rmSync(salida);
    fallar(`${video} no es un video que ffprobe pueda leer`);
  }
  registrar(escena, {
    herramienta,
    modelo: opcion("modelo"),
    parametros: { escena: escena.id, origen: /^https?:\/\//.test(video) ? video : path.basename(video), imagen: escena.imagen.salida, hecho_afuera: true },
    prompt: opcion("prompt") ?? promptDe(escena),
  });
  process.exit(0);
}

// gastar o retomar: hace falta la clave, que nunca se muestra ni se guarda.
if (!process.env.FAL_KEY)
  fallar("Falta la clave de fal.ai: FAL_KEY=… en motor/.env (que git ignora) o como variable de entorno del sistema (ver REQUISITOS.md). Nunca en el chat.");

let pedido;
if (accion === "retomar") {
  if (!fs.existsSync(pendiente)) fallar(`No hay ninguna generación pendiente de «${escena.id}».`);
  pedido = leerJson(pendiente);
  console.log(`· Retomo el pedido ${pedido.request_id} (${pedido.alias}), que ya se pagó.`);
} else {
  if (fs.existsSync(pendiente))
    fallar(`Hay una generación de «${escena.id}» ya pagada y sin bajar: npm run clip -- ${arg} ${escena.id} retomar. Si la querés descartar, borrá ${path.relative(t.dir, pendiente)}.`);
  yaEsta();
  const p = preparar(escena);
  mostrar(p);
  const estilo = opcion("estilo") ?? "stable";
  if (!["stable", "expressive"].includes(estilo)) fallar("--estilo es stable o expressive");
  const datosEntrada = { imagen: dataUri(p.imagen), audio: p.audio ? dataUri(p.audio) : undefined, prompt: p.prompt, segundos: p.segundos, estilo };
  const entrada = p.modelo.entrada(datosEntrada);
  // Lo que se registra: lo mismo que se mandó, con rutas en lugar de los archivos.
  const sinArchivos = Object.fromEntries(
    Object.entries(entrada).map(([k, v]) => [k, k === "image_url" ? p.escena.imagen.salida : k === "audio_url" ? p.origenAudio.archivo : v])
  );
  console.log("· Enviando a fal.ai…");
  const r = await pedir(`${FAL}/${p.modelo.endpoint}`, { method: "POST", body: JSON.stringify(entrada) });
  pedido = {
    request_id: r.request_id,
    status_url: r.status_url,
    response_url: r.response_url,
    alias: p.alias,
    endpoint: p.modelo.endpoint,
    entrada: sinArchivos,
    imagen_sha256: sha256Archivo(p.imagen),
    audio: p.origenAudio ?? null,
    segundos: p.segundos,
    costo_estimado_usd: +p.costo.toFixed(3),
    prompt: p.prompt,
    prompt_usado: p.modelo.usaPrompt,
    fecha: hoy(),
  };
  escribirJson(pendiente, pedido);
  console.log(`  Pedido ${pedido.request_id}. Si la espera se corta, no lo pidas de nuevo: npm run clip -- ${arg} ${escena.id} retomar`);
}

const limite = Date.now() + ESPERA_MAXIMA_MIN * 60_000;
let estado = "";
while (true) {
  const s = await pedir(pedido.status_url);
  if (s.status !== estado) {
    estado = s.status;
    console.log(`  ${estado}${s.queue_position !== undefined ? ` (posición ${s.queue_position})` : ""}`);
  }
  if (s.status === "COMPLETED") break;
  if (Date.now() > limite) fallar(`Pasaron ${ESPERA_MAXIMA_MIN} min y sigue en ${s.status}. Ya está pagado: npm run clip -- ${arg} ${escena.id} retomar`);
  await new Promise((listo) => setTimeout(listo, 5000));
}
let resultado;
try {
  resultado = await pedir(pedido.response_url);
} catch (e) {
  fs.rmSync(pendiente);
  fallar(`La generación terminó con error (no se reintenta sola, porque cobra de nuevo): ${e.message}`);
}
const url = resultado.video?.url ?? fallar(`fal.ai no devolvió un video: ${JSON.stringify(resultado).slice(0, 400)}`);
fs.mkdirSync(path.dirname(salida), { recursive: true });
fs.writeFileSync(salida, await traer(url));
registrar(escena, {
  herramienta: "fal.ai",
  modelo: pedido.endpoint,
  parametros: {
    escena: escena.id,
    alias: pedido.alias,
    entrada: pedido.entrada,
    imagen_sha256: pedido.imagen_sha256,
    audio: pedido.audio,
    segundos: pedido.segundos,
    costo_estimado_usd: pedido.costo_estimado_usd,
    prompt_usado_por_el_modelo: pedido.prompt_usado,
    request_id: pedido.request_id,
    ...(resultado.seed !== undefined ? { seed: resultado.seed } : {}),
  },
  prompt: pedido.prompt,
});
fs.rmSync(pendiente);
