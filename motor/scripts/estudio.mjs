// Abre Remotion Studio con un trabajo cargado, para mirar y ajustar a ojo.
// Uso: npm run estudio -- <cliente>/<id>
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { ACTUAL, MOTOR, aplicarVariante, copiarDir, dirCliente, escribirJson, fallar } from "./comun.mjs";
import { validarTrabajo } from "./validar.mjs";

const { errores, datos } = validarTrabajo(process.argv[2]);
if (!datos.spec || !datos.marca) fallar(`No se puede abrir: ${errores.join(" · ")}`);
if (errores.length) console.log(`! Hay ${errores.length} error(es) de validación; la vista previa puede no coincidir con el render.`);
const { trabajo: t, spec, marca } = datos;

fs.rmSync(ACTUAL, { recursive: true, force: true });
copiarDir(path.join(t.dir, "capturas"), path.join(ACTUAL, "capturas"));
copiarDir(path.join(t.dir, "audio"), path.join(ACTUAL, "audio"));
copiarDir(path.join(dirCliente(t.cliente), "activos"), path.join(ACTUAL, "marca"));
const props = path.join(ACTUAL, "props.json");
escribirJson(props, { spec, marca: aplicarVariante(marca, spec.visual?.variante), palabras: spec.plantilla === "explicativo" && spec.voz.usar ? datos.palabras : null });

spawn("npx", ["remotion", "studio", "src/index.ts", `--props=${props}`], { cwd: MOTOR, stdio: "inherit", shell: true });
