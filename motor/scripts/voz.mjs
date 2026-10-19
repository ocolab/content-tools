// Voz en off del explicativo. La generación (ElevenLabs u otra) no es
// determinista, así que se hace UNA vez y el resultado queda fijado: archivo,
// palabras con tiempos, modelo, voz y hash del texto exacto que se leyó.
//
//   npm run voz -- <cliente>/<id> texto
//       Imprime el texto exacto que hay que mandar a la herramienta de voz.
//   npm run voz -- <cliente>/<id> registrar --audio <ruta|url> --palabras <ruta|url>
//       --herramienta elevenlabs --modelo eleven_v4 --voz <voice_id> [--etiqueta "[...]"]
//       Guarda audio/voz.mp3 y audio/palabras.json y los registra en activos.json.
import fs from "node:fs";
import path from "node:path";
import { escribirJson, fallar, hoy, leerJson, sha256, sha256Archivo, textoVoz, tokens, trabajo } from "./comun.mjs";

const t = trabajo(process.argv[2]);
const accion = process.argv[3];
const spec = leerJson(path.join(t.dir, "spec.json"));
if (spec.plantilla !== "explicativo") fallar("Solo el explicativo lleva voz en off.");
const texto = textoVoz(spec);

if (accion === "texto") {
  console.log(texto);
  console.log(`\n(${tokens(texto).length} palabras · ${texto.length} caracteres · sha256 ${sha256(texto).slice(0, 12)})`);
  process.exit(0);
}
if (accion !== "registrar") fallar("Acción desconocida: usá «texto» o «registrar».");

const opcion = (nombre) => {
  const i = process.argv.indexOf(`--${nombre}`);
  if (i < 0 || !process.argv[i + 1]) fallar(`Falta --${nombre}`);
  return process.argv[i + 1];
};

async function traer(origen) {
  if (/^https?:\/\//.test(origen)) {
    const r = await fetch(origen);
    if (!r.ok) fallar(`No se pudo bajar ${origen}: ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
  }
  if (!fs.existsSync(origen)) fallar(`No existe ${origen}`);
  return fs.readFileSync(origen);
}

/** Acepta la lista de palabras de ElevenLabs Scribe u otra transcripción con tiempos. */
function normalizarPalabras(crudo) {
  const lista = Array.isArray(crudo) ? crudo : crudo.words ?? crudo.transcripts?.[0]?.words ?? crudo.palabras;
  if (!Array.isArray(lista)) fallar("No encontré la lista de palabras en el JSON de la transcripción.");
  // Las etiquetas de dirección ([neutral … accent], [warmly]…) no se pronuncian, pero la
  // transcripción alineada las devuelve como palabras de duración casi nula: se descartan.
  let dentroDeEtiqueta = false;
  const sinEtiquetas = (p) => {
    const t = String(p.text ?? p.word ?? p.texto ?? "").trim();
    if (t.startsWith("[")) dentroDeEtiqueta = true;
    const descartar = dentroDeEtiqueta;
    if (t.endsWith("]")) dentroDeEtiqueta = false;
    return !descartar;
  };
  return lista
    .filter((p) => (p.type ? p.type === "word" : String(p.text ?? p.word ?? p.texto ?? "").trim()))
    .filter(sinEtiquetas)
    .map((p) => ({
      texto: String(p.text ?? p.word ?? p.texto).trim(),
      inicio: Number(p.start ?? p.inicio),
      fin: Number(p.end ?? p.fin),
    }));
}

const dirAudio = path.join(t.dir, "audio");
fs.mkdirSync(dirAudio, { recursive: true });
const audioPath = path.join(dirAudio, "voz.mp3");
const palabrasPath = path.join(dirAudio, "palabras.json");

fs.writeFileSync(audioPath, await traer(opcion("audio")));
const palabras = normalizarPalabras(JSON.parse((await traer(opcion("palabras"))).toString("utf8")));
escribirJson(palabrasPath, palabras);

const esperadas = tokens(texto).length;
if (palabras.length !== esperadas)
  console.warn(`! La transcripción tiene ${palabras.length} palabras y el guion ${esperadas}. Revisá que la voz haya leído el texto exacto.`);

const activosPath = path.join(t.dir, "activos.json");
const activos = fs.existsSync(activosPath) ? leerJson(activosPath) : { version: 1, activos: [] };
const comun = { herramienta: opcion("herramienta"), fecha: hoy(), aprobado: false };
// Etiqueta de dirección que se antepuso al texto (por ejemplo el acento); no se pronuncia.
const iEtiqueta = process.argv.indexOf("--etiqueta");
const etiqueta = iEtiqueta > 0 ? process.argv[iEtiqueta + 1] : null;
activos.activos = activos.activos
  .filter((a) => !["audio/voz.mp3", "audio/palabras.json"].includes(a.archivo))
  .concat(
    {
      archivo: "audio/voz.mp3",
      clase: "voz",
      modelo: opcion("modelo"),
      parametros: { voice_id: opcion("voz"), etiqueta },
      prompt: etiqueta ? `${etiqueta} ${texto}` : texto,
      texto_sha256: sha256(texto),
      sha256: sha256Archivo(audioPath),
      ...comun,
    },
    {
      archivo: "audio/palabras.json",
      clase: "palabras",
      modelo: null,
      parametros: {},
      prompt: null,
      texto_sha256: sha256(texto),
      sha256: sha256Archivo(palabrasPath),
      ...comun,
    }
  );
escribirJson(activosPath, activos);
console.log(`✓ Voz registrada: ${palabras.length} palabras, ${palabras.at(-1)?.fin.toFixed(1)} s`);
console.log(`  Siguiente: poné "voz": { "usar": true } en spec.json y corré npm run validar -- ${process.argv[2]}`);
