// Valida un trabajo de punta a punta antes de gastar créditos o renderizar:
// esquemas, reglas de copy del cliente, cifras con fuente, archivos, voz al
// día con el guion y que el motor siga siendo determinista.
// Uso: npm run validar -- <cliente>/<id>
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { KIT, MOTOR, PUBLICO, SONIDOS, clipsDelSpec, dirCliente, duracionMedia, leerJson, normalizar, sha256, sha256Archivo, textoVoz, tokens, trabajo } from "./comun.mjs";
import { Activos, Brief, Copy, Marca, PlanAvatar, Spec, TIPOS, TIPOS_DEL_MOTOR } from "./esquemas.mjs";
import { FPS, tiemposExplicativo } from "../src/calculo.js";

const rel = (p) => path.relative(KIT, p).replaceAll("\\", "/");

/** Rutas de los campos que todavía dicen COMPLETAR. */
const pendientes = (v, ruta = []) =>
  typeof v === "string"
    ? v.includes("COMPLETAR") ? [ruta.join(".")] : []
    : Array.isArray(v)
      ? v.flatMap((x, i) => pendientes(x, [...ruta, i]))
      : v && typeof v === "object"
        ? Object.entries(v).flatMap(([k, x]) => pendientes(x, [...ruta, k]))
        : [];

function revisarEsquema(esquema, datos, nombre, errores) {
  const r = esquema.safeParse(datos);
  if (!r.success) for (const i of r.error.issues) errores.push(`${nombre} › ${i.path.join(".") || "(raíz)"}: ${i.message}`);
  return r.success;
}

/** Todos los textos que se ven o se escuchan en el spec (también dentro de objetos y listas). */
function textosDelSpec(spec) {
  const fuera = new Set(["tipo", "duracion", "archivos", "captura", "archivo"]);
  const juntar = (v) =>
    typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(juntar) : v && typeof v === "object" ? Object.entries(v).filter(([k]) => !fuera.has(k)).flatMap(([, x]) => juntar(x)) : [];
  return spec.plantilla === "loop-6s" ? juntar(spec.contenido) : spec.contenido.escenas.flatMap(juntar);
}

// Números escritos en palabras (la voz en off los lleva así): también necesitan respaldo.
const NUMEROS = {
  dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12,
  quince: 15, veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50, cien: 100, mil: 1000,
};
const conCifras = (t) => t.replace(/[a-z]+/g, (p) => (p in NUMEROS ? String(NUMEROS[p]) : p));

function revisarCopy(textos, marca, donde, errores, avisos) {
  const afirmaciones = marca.copy.afirmaciones.map((a) => conCifras(normalizar(a.texto)));
  for (const crudo of textos) {
    const t = normalizar(crudo.replace(/\*/g, ""));
    for (const p of marca.copy.prohibidas) {
      const n = normalizar(p).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(^|[^a-z0-9])${n}([^a-z0-9]|$)`).test(t)) errores.push(`${donde}: «${crudo}» usa «${p}», que está prohibida para ${marca.nombre}`);
    }
    for (const numero of conCifras(t).match(/\d+([.,]\d+)*/g) ?? [])
      if (!afirmaciones.some((a) => a.includes(numero)))
        errores.push(`${donde}: «${crudo}» tiene la cifra ${numero} y ninguna afirmación aprobada de marca.json la respalda`);
  }
}

// Los tokens del cliente son los colores por rol y la paleta de marca.json. Si
// la fuente es el CSS de su web y está a mano, se compara contra él. Que falte
// el archivo fuente (la web o el brand book) avisa pero no frena: los colores
// ya están copiados en marca.json.
function revisarTokens(marca, dir, errores, avisos) {
  const f = marca.fuente_tokens;
  const deFuente = f.tipo === "css" ? "la web del cliente" : "el brand book";
  const tokens = new Set([...Object.values(marca.colores), ...(marca.paleta ?? []).map((p) => p.color)].map((c) => c.toLowerCase()));
  let donde = "los colores y la paleta de marca.json";
  const esUrl = /^https?:\/\//.test(f.archivo);
  const archivo = esUrl ? null : path.resolve(dir, f.archivo);
  if (archivo && !fs.existsSync(archivo))
    avisos.push(`marca.json › fuente_tokens: no encontré ${f.archivo}; los colores no se comparan con ${deFuente} (es normal si el kit se copió sin ese archivo)`);
  else if (f.tipo === "css" && esUrl) avisos.push(`marca.json › fuente_tokens: ${f.archivo} es una URL; para comparar los colores, bajá el CSS y apuntá al archivo`);
  else if (f.tipo === "css") {
    const texto = fs.readFileSync(archivo, "utf8");
    for (const x of texto.matchAll(/--[a-z0-9-]+\s*:\s*(#[0-9A-Fa-f]{6})/g)) tokens.add(x[1].toLowerCase());
    donde = f.archivo;
    for (const [rol, variable] of Object.entries(f.variables)) {
      if (!(rol in marca.colores)) errores.push(`marca.json › fuente_tokens.variables.${rol}: no es un rol de color`);
      const m = texto.match(new RegExp(`${variable}\\s*:\\s*(#[0-9A-Fa-f]{6})`));
      if (!m) errores.push(`marca.json › fuente_tokens.variables.${rol}: ${variable} no está en ${f.archivo}`);
      else if (m[1].toLowerCase() !== marca.colores[rol]?.toLowerCase())
        errores.push(`marca.json › colores.${rol} es ${marca.colores[rol]} pero ${variable} en ${f.archivo} es ${m[1]}: actualizá marca.json`);
    }
  }
  for (const [id, v] of Object.entries(marca.variantes ?? {}))
    for (const grupo of ["colores", "colores_superficie"])
      for (const [rol, c] of Object.entries(v[grupo]))
        if (!tokens.has(c.toLowerCase())) errores.push(`marca.json › variantes.${id}.${grupo}.${rol}: ${c} no es un token del cliente (no está en ${donde})`);
}

/** Escenas «clip»: el archivo existe, está registrado y alcanza para su escena; sin dos voces a la vez. */
function revisarClips(spec, datos, t, arg, activos, plan, { sinClips, errores, avisos }) {
  if (spec.plantilla !== "explicativo") return;
  let tiempos = null;
  try {
    tiempos = tiemposExplicativo(spec, spec.voz.usar ? datos.palabras ?? null : null);
  } catch {
    // La voz no coincide con el guion: ya figura como error más arriba.
  }
  spec.contenido.escenas.forEach((e, k) => {
    if (e.tipo !== "clip") return;
    if (e.audio_del_clip && spec.voz.usar) errores.push(`spec.json › escena ${k + 1}: audio_del_clip con voz en off suenan dos voces a la vez; dejalo en false (el clip de lip-sync ya usa la toma de voz)`);
    if (sinClips) return;
    const p = path.join(t.dir, e.archivo);
    if (!fs.existsSync(p)) {
      errores.push(`Falta ${e.archivo}: generalo con npm run clip -- ${arg} <escena> o, si se hizo afuera, registralo con npm run clip -- ${arg} <escena> registrar`);
      return;
    }
    const registro = activos?.activos?.find((a) => a.archivo === e.archivo && a.clase === "video");
    if (!registro) errores.push(`${e.archivo} no está registrado en activos.json: usá npm run clip -- ${arg} <escena> registrar`);
    // Un clip de lip-sync se hizo con un tramo de la toma de voz: si la toma cambió, la boca ya no coincide.
    const vozDelClip = registro?.parametros?.audio?.voz_sha256;
    const vozActual = path.join(t.dir, "audio", "voz.mp3");
    if (vozDelClip && fs.existsSync(vozActual) && vozDelClip !== sha256Archivo(vozActual))
      errores.push(`${e.archivo} se hizo con otra toma de voz: la boca no coincide con audio/voz.mp3. Hay que generarlo de nuevo (npm run clip … --forzar)`);
    if (registro?.texto_sha256 && registro.texto_sha256 !== sha256((Array.isArray(plan?.escenas) ? plan.escenas : []).find((x) => x?.video?.salida === e.archivo)?.guion ?? e.voz))
      avisos.push(`El guion de ${e.archivo} cambió después de generarlo: revisá que el clip diga lo nuevo`);
    if (tiempos) {
      const escena = tiempos.escenas[k].frames / FPS;
      const clip = duracionMedia(p);
      if (clip + 0.25 < escena) avisos.push(`${e.archivo} dura ${clip.toFixed(2)} s y su escena ${escena.toFixed(2)} s: el último cuadro queda quieto ${(escena - clip).toFixed(2)} s`);
    }
  });
}

function revisarDeterminismo(errores) {
  const prohibido = /Math\.random|Date\.now|new Date\(|fetch\(|performance\.now/;
  const recorrer = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? recorrer(path.join(dir, e.name)) : [path.join(dir, e.name)]));
  for (const archivo of recorrer(path.join(MOTOR, "src"))) {
    const lineas = fs.readFileSync(archivo, "utf8").split(/\r?\n/);
    lineas.forEach((l, i) => {
      const codigo = l.replace(/\/\/.*$/, "").replace(/^\s*\*.*$/, "");
      if (prohibido.test(codigo)) errores.push(`motor › ${rel(archivo)}:${i + 1} usa algo no determinista (${l.trim().slice(0, 60)})`);
    });
  }
}

/**
 * @param {string} arg <cliente>/<id>
 * @param {{ sinClips?: boolean }} [opciones] sinClips: no exige que los clips ya existan (lo usa npm run clip, que los genera)
 */
export function validarTrabajo(arg, { sinClips = false } = {}) {
  const t = trabajo(arg);
  const errores = [];
  const avisos = [];
  const ok = [];
  const datos = { trabajo: t };

  if (!fs.existsSync(t.dir)) {
    errores.push(`No existe ${rel(t.dir)}. Crealo con: npm run nuevo -- ${arg}`);
    return { errores, avisos, ok, datos };
  }

  // Marca del cliente
  const marcaPath = path.join(dirCliente(t.cliente), "marca.json");
  if (!fs.existsSync(marcaPath)) {
    errores.push(
      `El cliente ${t.cliente} no tiene perfil: falta ${rel(marcaPath)}. Es el paso 1 de PROCESO.md: npm run cliente -- ${t.cliente} --tokens css|brand_book, y completarlo con las preguntas del perfil de preguntas.md`
    );
    return { errores, avisos, ok, datos };
  }
  const marca = leerJson(marcaPath);
  const sinCompletar = pendientes(marca);
  if (sinCompletar.length) {
    errores.push(
      `marca.json tiene ${sinCompletar.length} campo(s) sin completar: ${sinCompletar.slice(0, 8).join(", ")}${sinCompletar.length > 8 ? ` y ${sinCompletar.length - 8} más` : ""}. Se completan con las preguntas del perfil de preguntas.md (paso 1)`
    );
    return { errores, avisos, ok, datos };
  }
  if (!marca.fuente_tokens) {
    errores.push("marca.json › fuente_tokens: los design tokens son obligatorios. Indicá de dónde salen: el CSS de la web del cliente (tipo «css») o su brand book (tipo «brand_book»). Ver clientes/LEEME.md");
    return { errores, avisos, ok, datos };
  }
  if (revisarEsquema(Marca, marca, "marca.json", errores)) {
    datos.marca = marca;
    for (const archivo of [marca.tipografia.archivo, marca.logo.archivo, ...Object.values(marca.variantes ?? {}).map((v) => v.logo?.archivo).filter(Boolean)])
      if (!fs.existsSync(path.join(dirCliente(t.cliente), archivo))) errores.push(`marca.json: falta el archivo ${archivo}`);
    revisarTokens(marca, dirCliente(t.cliente), errores, avisos);
    ok.push(`marca.json (tokens ${marca.fuente_tokens.tipo === "css" ? "de la web" : "del brand book"})`);
  } else return { errores, avisos, ok, datos };

  const leer = (nombre) => {
    const p = path.join(t.dir, nombre);
    return fs.existsSync(p) ? leerJson(p) : null;
  };

  // Brief
  const brief = leer("brief.json");
  if (!brief) errores.push("Falta brief.json (paso 2)");
  else if (revisarEsquema(Brief, brief, "brief.json", errores)) {
    if (brief.cliente !== t.cliente || brief.id !== t.id) errores.push(`brief.json dice ${brief.cliente}/${brief.id} y la carpeta es ${arg}`);
    if (JSON.stringify(brief).includes("COMPLETAR")) errores.push("brief.json tiene campos sin completar (COMPLETAR)");
    else revisarCopy([brief.servicio, brief.objetivo.accion], marca, "brief.json", errores, avisos);
    datos.brief = brief;
    ok.push("brief.json");
  }

  // Copy
  const copy = leer("copy.json");
  if (copy && JSON.stringify(copy).includes("COMPLETAR")) errores.push("copy.json tiene campos sin completar (COMPLETAR)");
  if (copy && revisarEsquema(Copy, copy, "copy.json", errores)) {
    const textos = [copy.propuesta_valor, ...copy.angulos.map((a) => a.gancho), copy.elegido.gancho, ...copy.elegido.titulo, ...copy.elegido.puntos, ...copy.elegido.guion.map((g) => g.texto), copy.elegido.boton];
    revisarCopy(textos, marca, "copy.json", errores, avisos);
    // En la rutina diaria, un gancho que ya se usó se avisa.
    if (brief?.rutina && !copy.elegido.gancho.includes("COMPLETAR")) {
      const dirTrabajos = path.dirname(t.dir);
      const repetido = fs
        .readdirSync(dirTrabajos)
        .filter((id) => id !== t.id && fs.existsSync(path.join(dirTrabajos, id, "copy.json")))
        .find((id) => normalizar(leerJson(path.join(dirTrabajos, id, "copy.json")).elegido?.gancho ?? "") === normalizar(copy.elegido.gancho));
      if (repetido) avisos.push(`copy.json: el gancho «${copy.elegido.gancho}» ya se usó en ${repetido}; la rutina no repite ganchos`);
    }
    if (!marca.copy.cta_aprobados.includes(copy.elegido.boton)) avisos.push(`copy.json: el botón «${copy.elegido.boton}» no está en cta_aprobados de marca.json`);
    datos.copy = copy;
    ok.push(`copy.json (${copy.aprobado ? "aprobado" : "sin aprobar"})`);
  }

  // Spec del motor
  const spec = leer("spec.json");
  if (spec && JSON.stringify(spec).includes("COMPLETAR")) errores.push("spec.json tiene campos sin completar (COMPLETAR)");
  if (spec) {
    if (!copy?.aprobado) errores.push("Hay spec.json pero copy.json no está aprobado: el copy se aprueba antes de producir (paso 3)");
    if (revisarEsquema(Spec, spec, "spec.json", errores)) {
      datos.spec = spec;
      if (spec.cliente !== t.cliente || spec.id !== t.id) errores.push(`spec.json dice ${spec.cliente}/${spec.id} y la carpeta es ${arg}`);
      if (spec.visual && !marca.variantes?.[spec.visual.variante])
        errores.push(`spec.json › visual.variante: «${spec.visual.variante}» no está en las variantes de marca.json (${Object.keys(marca.variantes ?? {}).join(", ") || "ninguna"})`);
      // Con avatar, spec.json es el montaje: un explicativo con escenas «clip».
      const montaje = spec.plantilla === "explicativo" && clipsDelSpec(spec).length > 0;
      const conAvatar = brief?.estilo === "avatar" || (brief?.tipo && TIPOS[brief.tipo] === "avatar");
      if (conAvatar && !montaje)
        errores.push("El brief es de avatar: spec.json tiene que ser el montaje, un explicativo con escenas «clip» (ver motor/ejemplos/montaje-avatar.json)");
      else if (brief?.tipo && !conAvatar && brief.tipo !== spec.plantilla) errores.push(`brief.json eligió ${brief.tipo} y spec.json usa ${spec.plantilla}`);
      if (brief) for (const f of spec.formatos) if (!brief.formatos.includes(f)) avisos.push(`spec.json pide ${f}, que no está en brief.formatos`);
      revisarCopy(textosDelSpec(spec), marca, "spec.json", errores, avisos);

      // Archivos
      if (spec.plantilla === "loop-6s" && Boolean(spec.contenido.captura) === Boolean(spec.contenido.maqueta))
        errores.push("spec.json: el loop lleva «captura» o «maqueta», una de las dos");
      const rutas = spec.plantilla === "loop-6s" ? [spec.contenido.captura].filter(Boolean) : spec.contenido.escenas.flatMap((e) => e.archivos ?? []);
      for (const r of rutas) {
        if (!spec.capturas.some((c) => c.archivo === r)) errores.push(`spec.json usa ${r} pero no está declarado en «capturas»`);
        if (!fs.existsSync(path.join(t.dir, r))) errores.push(`Falta ${r}: corré npm run capturar -- ${arg}`);
      }
      if (spec.audio.musica) {
        const m = path.join(PUBLICO, spec.audio.musica);
        if (!fs.existsSync(m)) errores.push(`Falta la música ${spec.audio.musica} en motor/public/`);
        const licencias = path.join(PUBLICO, "musica", "LICENCIAS.md");
        if (!fs.existsSync(licencias) || !fs.readFileSync(licencias, "utf8").includes(path.basename(spec.audio.musica)))
          errores.push(`La música ${spec.audio.musica} no figura en motor/public/musica/LICENCIAS.md: sin licencia anotada no se usa`);
      }
      if (spec.audio.efectos)
        for (const s of SONIDOS)
          if (!fs.existsSync(path.join(PUBLICO, "sonidos", `${s}.wav`))) errores.push(`Falta el efecto ${s}.wav: corré npm run sonidos`);

      // Voz y duración
      let segundos = 6;
      if (spec.plantilla === "explicativo") {
        const totalPalabras = spec.contenido.escenas.reduce((n, e) => n + tokens(e.voz).length, 0);
        if (spec.voz.usar) {
          const voz = path.join(t.dir, "audio", "voz.mp3");
          const palabrasPath = path.join(t.dir, "audio", "palabras.json");
          if (!fs.existsSync(voz) || !fs.existsSync(palabrasPath)) errores.push(`voz.usar es true pero falta audio/voz.mp3 o audio/palabras.json (paso 5, ver catalogo/prompts/voz.md)`);
          else {
            const palabras = leerJson(palabrasPath);
            datos.palabras = palabras;
            if (palabras.length !== totalPalabras)
              errores.push(`La voz tiene ${palabras.length} palabras y el guion ${totalPalabras}: el audio no corresponde al texto actual`);
            const registro = leer("activos.json")?.activos.find((a) => a.clase === "voz");
            if (!registro) errores.push("La voz no está registrada en activos.json: usá npm run voz");
            else {
              if (registro.texto_sha256 !== sha256(textoVoz(spec))) errores.push("El guion cambió después de grabar la voz: hay que generarla de nuevo");
              if (registro.sha256 !== sha256Archivo(voz)) errores.push("audio/voz.mp3 no es el archivo registrado en activos.json");
            }
            segundos = palabras.length ? palabras[palabras.length - 1].fin + 0.9 : 0;
          }
        } else {
          const sinDuracion = spec.contenido.escenas.filter((e) => e.duracion === undefined);
          if (sinDuracion.length) errores.push(`Sin voz, todas las escenas necesitan «duracion» (faltan ${sinDuracion.length})`);
          segundos = spec.contenido.escenas.reduce((s, e) => s + (e.duracion ?? 0), 0);
          avisos.push("Sin voz en off: los subtítulos se reparten por largo de palabra");
        }
      }
      if (brief && segundos > brief.duracion_max) errores.push(`El video dura ${segundos.toFixed(1)} s y el brief permite ${brief.duracion_max} s`);
      datos.segundos = segundos;
      revisarClips(spec, datos, t, arg, leer("activos.json"), leer("plan-avatar.json"), { sinClips, errores, avisos });
      ok.push(`spec.json (${spec.plantilla}, ${segundos.toFixed(1)} s)`);
    }
  }

  // Plan con avatar
  const plan = leer("plan-avatar.json");
  if (plan) {
    if (!copy?.aprobado) errores.push("Hay plan-avatar.json pero copy.json no está aprobado");
    if (JSON.stringify(plan).includes("COMPLETAR")) errores.push("plan-avatar.json tiene campos sin completar (COMPLETAR)");
    if (revisarEsquema(PlanAvatar, plan, "plan-avatar.json", errores)) {
      revisarCopy(plan.escenas.map((e) => e.guion).filter(Boolean), marca, "plan-avatar.json", errores, avisos);
      datos.plan = plan;
      // Lo que dice el avatar en el plan tiene que ser lo que dice la escena del montaje (y sus subtítulos).
      if (datos.spec?.plantilla === "explicativo")
        for (const e of datos.spec.contenido.escenas.filter((x) => x.tipo === "clip")) {
          const p = plan.escenas.find((x) => x.video.salida === e.archivo);
          if (!p) avisos.push(`spec.json usa ${e.archivo}, que no sale de ninguna escena de plan-avatar.json (¿clip hecho afuera?)`);
          else if (p.guion !== null && !`${p.guion} ${e.voz}`.includes("COMPLETAR") && normalizar(p.guion).replace(/[^a-z0-9 ]/g, "") !== normalizar(e.voz).replace(/[^a-z0-9 ]/g, ""))
            errores.push(`La escena «${p.id}» de plan-avatar.json dice «${p.guion}» y la escena clip de spec.json dice «${e.voz}»: tienen que decir lo mismo`);
        }
      if (brief && brief.estilo === "animacion") errores.push("El brief es de animación y hay plan-avatar.json");
      ok.push(`plan-avatar.json (${plan.escenas.length} escenas)`);
    }
  }

  // Registro de activos
  const activos = leer("activos.json");
  if (activos && revisarEsquema(Activos, activos, "activos.json", errores)) {
    for (const a of activos.activos) {
      const p = path.join(t.dir, a.archivo);
      if (!fs.existsSync(p)) errores.push(`activos.json registra ${a.archivo} pero el archivo no está`);
      else if (sha256Archivo(p) !== a.sha256) errores.push(`${a.archivo} cambió después de registrarse en activos.json`);
    }
    ok.push(`activos.json (${activos.activos.length})`);
  }

  if (brief?.tipo && !TIPOS[brief.tipo]) errores.push(`Tipo desconocido: ${brief.tipo}`);
  if (brief?.tipo && TIPOS_DEL_MOTOR.includes(brief.tipo) && copy?.aprobado && !spec) avisos.push("Copy aprobado y sin spec.json todavía (paso 4)");
  if (plan && !spec && brief?.tipo !== "dualcast")
    avisos.push("Hay plan-avatar.json y no hay spec.json: para montar los clips en el motor, armá el montaje (motor/ejemplos/montaje-avatar.json)");

  revisarDeterminismo(errores);
  return { errores, avisos, ok, datos };
}

// Uso directo desde la terminal
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { errores, avisos, ok } = validarTrabajo(process.argv[2]);
  for (const o of ok) console.log(`✓ ${o}`);
  for (const a of avisos) console.log(`! ${a}`);
  for (const e of errores) console.log(`✗ ${e}`);
  console.log(errores.length ? `\n${errores.length} error(es): corregilos antes de seguir.` : "\nTodo en orden.");
  process.exit(errores.length ? 1 : 0);
}

