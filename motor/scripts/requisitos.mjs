// Dice qué hace falta para usar el kit o para un trabajo, según
// ../requisitos.json. Los programas locales y las claves de API (variables de
// entorno: solo se mira que existan, nunca se muestran) los revisa acá; los
// conectores MCP y las skills no se ven desde Node: los tiene que comprobar el
// agente que corre el proceso (Claude u otro) y, si faltan, avisar antes del paso.
// Uso: npm run requisitos [-- <cliente>/<id>] [--json]
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { KIT, MOTOR, fallar, leerJson, trabajo, version } from "./comun.mjs";
import { CUANDO, Requisitos } from "./esquemas.mjs";

const args = process.argv.slice(2);
const comoJson = args.includes("--json");
const arg = args.find((a) => !a.startsWith("--"));

const r = Requisitos.safeParse(leerJson(path.join(KIT, "requisitos.json")));
if (!r.success) fallar(`requisitos.json no cumple su esquema: ${r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
const { requisitos } = r.data;

/** Para cada «cuando»: «si», «no» o «quizas» en este trabajo. Sin trabajo, todo es «quizas». */
function necesidades(arg) {
  if (!arg) return Object.fromEntries(Object.keys(CUANDO).map((c) => [c, c === "siempre" ? "si" : "quizas"]));
  const t = trabajo(arg);
  if (!fs.existsSync(t.dir)) fallar(`No existe el trabajo ${arg}. Crealo con: npm run nuevo -- ${arg}`);
  const leer = (n) => (fs.existsSync(path.join(t.dir, n)) ? leerJson(path.join(t.dir, n)) : null);
  const brief = leer("brief.json");
  const copy = leer("copy.json");
  const spec = leer("spec.json");
  const tipo = brief?.tipo ?? spec?.plantilla ?? null;
  let voz = "no";
  if (spec?.plantilla === "explicativo") voz = spec.voz.usar ? "si" : "no";
  // Con avatar, la voz es una toma de ElevenLabs que después mueve la boca (lip-sync).
  else if (["voz-en-off-broll", "avatar-ugc", "avatar-pantalla"].includes(tipo)) voz = "si";
  else if (!tipo || tipo === "explicativo" || brief?.estilo === "mixto") voz = "quizas";
  const avatar = !brief ? "quizas" : ["avatar", "mixto"].includes(brief.estilo) ? "si" : "no";
  const dualcast = tipo === "dualcast" ? "si" : brief?.tipo ? "no" : "quizas";
  return { siempre: "si", copy: copy?.aprobado ? "no" : "si", voz_en_off: voz, avatar, dualcast, publicar: "quizas" };
}

/** Claves de API: que la variable de entorno exista. El valor nunca se muestra ni se guarda. */
function revisarClave(req) {
  const faltan = req.herramientas.filter((v) => !process.env[v]);
  return { ok: !faltan.length, detalle: faltan.length ? `falta la variable de entorno ${faltan.join(" y ")}` : `${req.herramientas.join(", ")} definida` };
}

function revisarLocal(req) {
  const anda = (c) => spawnSync(c, ["-version"], { encoding: "utf8" }).status === 0;
  if (req.id === "node") {
    const v = process.versions.node;
    return { ok: Number(v.split(".")[0]) >= 22, detalle: `v${v}` };
  }
  if (req.id === "ffmpeg") {
    const faltan = ["ffmpeg", "ffprobe"].filter((c) => !anda(c));
    return { ok: !faltan.length, detalle: faltan.length ? `no encontré ${faltan.join(" ni ")} en el PATH` : `ffmpeg ${version("ffmpeg").match(/version (\S+)/)?.[1] ?? "?"}` };
  }
  if (req.id === "dependencias") {
    const p = path.join(MOTOR, "node_modules", "remotion", "package.json");
    return fs.existsSync(p) ? { ok: true, detalle: `remotion ${leerJson(p).version}` } : { ok: false, detalle: "falta correr npm ci en motor/" };
  }
  return { ok: null, detalle: "revisar a mano" };
}

const nec = necesidades(arg);
const resultado = requisitos.map((req) => {
  const necesario = nec[req.cuando];
  const local = req.tipo === "local" ? revisarLocal(req) : req.tipo === "clave" ? revisarClave(req) : null;
  const estado = local ? (local.ok ? "ok" : local.ok === false ? "falta" : "revisar") : req.tipo === "externo" ? "fuera_del_kit" : "comprobar_en_el_agente";
  return { ...req, necesario, estado, detalle: local?.detalle ?? null };
});
const bloquea = resultado.filter((x) => x.estado === "falta" && x.obligatorio && x.necesario === "si");

if (comoJson) {
  console.log(JSON.stringify({ trabajo: arg ?? null, requisitos: resultado }, null, 2));
  process.exit(bloquea.length ? 1 : 0);
}

const marca = { ok: "✓", falta: "✗", revisar: "?", comprobar_en_el_agente: "!", fuera_del_kit: "→" };
const motivo = (x) => (x.necesario === "si" ? "hace falta para este trabajo" : "hace falta " + CUANDO[x.cuando]);
console.log(arg ? `Requisitos de ${arg}\n` : "Requisitos del kit (pasá <cliente>/<id> para ver los de un trabajo)\n");
const grupos = [
  ["Programas locales (revisados acá)", (x) => x.tipo === "local"],
  ["Claves de API (variables de entorno, revisadas acá; el valor nunca se muestra)", (x) => x.tipo === "clave"],
  ["Conectores MCP y skills: el agente tiene que comprobar que estén conectados ANTES del paso", (x) => x.tipo === "mcp" || x.tipo === "skill"],
  ["Herramientas fuera del kit", (x) => x.tipo === "externo"],
];
for (const [titulo, filtro] of grupos) {
  const aca = resultado.filter(filtro).filter((x) => x.necesario !== "no");
  if (!aca.length) continue;
  console.log(titulo);
  for (const x of aca) {
    const tipoReq = x.obligatorio ? "obligatorio" : "recomendado";
    console.log(`  ${marca[x.estado]} ${x.nombre}${x.detalle ? ` — ${x.detalle}` : ""}`);
    if (x.estado === "ok") continue;
    console.log(`      ${tipoReq}, paso ${x.pasos.join(", ")}: ${motivo(x)}. ${x.para}`);
    if (x.tipo === "mcp") console.log(`      Herramientas a buscar: ${x.herramientas.join(", ")}`);
    console.log(`      Cómo conectarlo: ${x.como_conectar}`);
    console.log(`      Si falta: ${x.si_falta}`);
    if (x.costo) console.log(`      Costo: ${x.costo}`);
  }
  console.log("");
}
const sobran = resultado.filter((x) => x.necesario === "no");
if (sobran.length) console.log(`No hacen falta para este trabajo: ${sobran.map((x) => x.nombre).join(", ")}.\n`);
console.log(bloquea.length ? `${bloquea.length} requisito(s) obligatorio(s) faltan: resolvelos antes de seguir.` : "Locales en orden. Los conectores marcados con ! se comprueban en el agente.");
process.exit(bloquea.length ? 1 : 0);
