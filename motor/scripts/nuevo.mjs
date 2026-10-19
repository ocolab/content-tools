// Abre un trabajo nuevo: trabajos/<cliente>/<id>/ con el brief para completar
// y, si ya se sabe el tipo, el spec o el plan de partida.
// Uso: npm run nuevo -- <cliente>/<id> [--tipo loop-6s|explicativo|avatar-ugc|avatar-pantalla|voz-en-off-broll|dualcast]
import fs from "node:fs";
import path from "node:path";
import { KIT, MOTOR, dirCliente, escribirJson, fallar, hoy, leerJson, trabajo } from "./comun.mjs";
import { TIPOS, TIPOS_DEL_MOTOR } from "./esquemas.mjs";

const t = trabajo(process.argv[2]);
const i = process.argv.indexOf("--tipo");
const tipo = i > 0 ? process.argv[i + 1] : null;
if (tipo && !TIPOS[tipo]) fallar(`Tipo desconocido: ${tipo}. Opciones: ${Object.keys(TIPOS).join(", ")}`);
if (fs.existsSync(t.dir)) fallar(`Ya existe ${path.relative(KIT, t.dir)}`);
if (!fs.existsSync(path.join(dirCliente(t.cliente), "marca.json")))
  console.warn(
    `! El cliente ${t.cliente} todavía no tiene perfil (clientes/${t.cliente}/marca.json). Es el paso 1 de PROCESO.md: npm run cliente -- ${t.cliente} --tokens css|brand_book`
  );

fs.mkdirSync(path.join(t.dir, "capturas"), { recursive: true });
fs.mkdirSync(path.join(t.dir, "audio"), { recursive: true });

const estilo = tipo ? TIPOS[tipo] : "animacion";
escribirJson(path.join(t.dir, "brief.json"), {
  version: 1,
  cliente: t.cliente,
  id: t.id,
  fecha: hoy(),
  servicio: "COMPLETAR",
  objetivo: { campana: "mensajes", accion: "COMPLETAR", destino: "COMPLETAR" },
  publico: { quien: "COMPLETAR", dolor: "COMPLETAR", zona: null },
  estilo,
  avatar: estilo === "animacion" ? null : { origen: "generado", descripcion: "COMPLETAR", voz: "COMPLETAR", acento: "COMPLETAR" },
  plataformas: ["instagram_reels", "facebook_feed"],
  formatos: ["9x16", "4x5"],
  duracion_max: tipo === "loop-6s" ? 10 : 30,
  musica: "sin_musica",
  tipo,
  notas: null,
});
escribirJson(path.join(t.dir, "activos.json"), { version: 1, activos: [] });

if (tipo && TIPOS_DEL_MOTOR.includes(tipo)) {
  const spec = leerJson(path.join(MOTOR, "ejemplos", `${tipo}.json`));
  escribirJson(path.join(t.dir, "spec.json"), { ...spec, cliente: t.cliente, id: t.id });
} else if (tipo) {
  const plan = leerJson(path.join(MOTOR, "ejemplos", "plan-avatar.json"));
  escribirJson(path.join(t.dir, "plan-avatar.json"), { ...plan, cliente: t.cliente, id: t.id, tipo });
}

console.log(`✓ Trabajo creado en ${path.relative(KIT, t.dir)}`);
console.log("  Siguiente: completar brief.json con las preguntas de preguntas.md (paso 2 de PROCESO.md).");
