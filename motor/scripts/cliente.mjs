// Abre el perfil de un cliente nuevo (paso 1): clientes/<cliente>/ con un
// marca.json y un copy.md llenos de COMPLETAR, y las carpetas activos/ y
// fuentes/. Se completa con las preguntas del perfil de preguntas.md.
// Uso: npm run cliente -- <cliente> --tokens css|brand_book
import fs from "node:fs";
import path from "node:path";
import { KIT, MOTOR, dirCliente, escribirJson, fallar, leerJson } from "./comun.mjs";
import { ROLES } from "./esquemas.mjs";

const cliente = process.argv[2];
if (!cliente || !/^[a-z0-9][a-z0-9-]{1,60}$/.test(cliente))
  fallar("Indicá el cliente en minúsculas y con guiones, por ejemplo: npm run cliente -- panaderia-sol --tokens brand_book");
const i = process.argv.indexOf("--tokens");
const tipo = i > 0 ? process.argv[i + 1] : null;
if (!["css", "brand_book"].includes(tipo))
  fallar("Indicá de dónde salen los design tokens: --tokens css (variables CSS de su web) o --tokens brand_book (manual de marca). Es obligatorio: ver clientes/LEEME.md");

const dir = dirCliente(cliente);
if (fs.existsSync(path.join(dir, "marca.json"))) fallar(`Ya existe ${path.relative(KIT, path.join(dir, "marca.json"))}`);

const marca = leerJson(path.join(MOTOR, "ejemplos", "marca.json"));
marca.cliente = cliente;
marca.fuente_tokens =
  tipo === "css"
    ? {
        tipo: "css",
        archivo: "COMPLETAR: ruta al CSS de su web (relativa a esta carpeta) o URL https",
        variables: Object.fromEntries(ROLES.map((r) => [r, "COMPLETAR"])),
      }
    : { tipo: "brand_book", archivo: "fuentes/COMPLETAR.pdf", detalle: "COMPLETAR: páginas o sección donde están los colores" };

fs.mkdirSync(path.join(dir, "activos"), { recursive: true });
fs.mkdirSync(path.join(dir, "fuentes"), { recursive: true });
escribirJson(path.join(dir, "marca.json"), marca);
const copy = fs.readFileSync(path.join(MOTOR, "ejemplos", "copy-cliente.md"), "utf8").replace("{{nombre}}", cliente);
fs.writeFileSync(path.join(dir, "copy.md"), copy);

console.log(`✓ Perfil creado en ${path.relative(KIT, dir)}`);
console.log("  Siguiente: hacer las preguntas del perfil (preguntas.md) y completar marca.json y copy.md.");
console.log(
  tipo === "css"
    ? "  Tokens: mapeá cada rol a una variable del CSS de su web en fuente_tokens.variables (borrá los roles que no tengan)."
    : "  Tokens: copiá su brand book a fuentes/ y pasá cada color a su rol según el uso que le da el manual."
);
console.log(`  Revisalo con: npm run validar -- ${cliente}/<cualquier-trabajo>`);
