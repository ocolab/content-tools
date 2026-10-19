// Exporta los esquemas zod a JSON Schema en ../esquemas/, para usarlos desde
// cualquier LLM, servicio web o validador sin este código.
// Uso: npm run esquemas
import path from "node:path";
import { z } from "zod";
import { KIT, escribirJson } from "./comun.mjs";
import { ESQUEMAS } from "./esquemas.mjs";

for (const [nombre, esquema] of Object.entries(ESQUEMAS)) {
  const json = z.toJSONSchema(esquema, { unrepresentable: "any" });
  json.$id = `fabrica-creativos/esquemas/${nombre}.schema.json`;
  json.title = nombre;
  escribirJson(path.join(KIT, "esquemas", `${nombre}.schema.json`), json);
  console.log(`✓ esquemas/${nombre}.schema.json`);
}
