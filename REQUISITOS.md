# Requisitos

> **Antes de empezar un trabajo, y otra vez antes de los pasos 3, 5 y 8:**
> `npm run requisitos -- <cliente>/<id>` (dentro de `motor/`). Si un trabajo
> necesita un conector MCP, **quien corre el proceso (Claude, otro modelo o
> un servicio) tiene que comprobar que esté conectado antes de ese paso**. Si
> no está, frena ese paso, avisa qué falta y cómo conectarlo, y ofrece la
> alternativa. Nunca lo reemplaza por otra herramienta sin preguntar.

La lista completa, con qué hacer si falta cada cosa, está en
[requisitos.json](requisitos.json) (esquema:
[esquemas/requisitos.schema.json](esquemas/requisitos.schema.json)). Esta
página la resume.

## Qué hace falta

| Requisito | Tipo | Cuándo | Paso | Si falta |
|---|---|---|---|---|
| Node.js 22 o más | programa local | siempre | 2–7 | No anda el motor |
| ffmpeg y ffprobe | programa local | siempre | 5–7 | No hay capturas, render ni control de calidad |
| Dependencias del motor (`npm ci` en `motor/`) | programa local | siempre | 5–7 | Correr `npm ci` (necesita Internet una vez) |
| **Conector MCP de ElevenLabs** | **MCP** | si el video lleva voz en off o un avatar que habla | 5 | Pedir que se conecte, o grabar la voz en otra herramienta y registrarla, o hacer el video sin voz |
| Generador de imágenes con referencias (por ejemplo **conector MCP de Canva**) | **MCP** | si el anuncio lleva avatar | 5 | Generar las imágenes afuera con los prompts del plan |
| **Conector MCP de Meta Ads** | **MCP** | si el video se sube desde acá | 8 | Entregar los MP4 y que el cliente los suba |
| Skill `cro` | skill de Claude | mientras el copy no esté aprobado | 3 | Usar [catalogo/prompts/copy.md](catalogo/prompts/copy.md) |
| **Clave de fal.ai** (`FAL_KEY`) | **clave de API** | si el anuncio lleva avatar | 5 | `npm run clip` igual estima; el clip se genera afuera y se registra con `npm run clip … registrar` |
| Generador de video externo (Google Flow, Hedra…) | fuera del kit | opcional, con avatar | 5 | No hace falta si está `FAL_KEY` |
| Editor de video | fuera del kit | solo dualcast (dos voces) | 6 | El dualcast se monta a mano; los demás tipos se montan en el motor |

Lo que **no** hace falta: que el cliente tenga web. Los design tokens sí son
obligatorios, pero pueden salir de su brand book (ver
[clientes/LEEME.md](clientes/LEEME.md)).

## Cómo se carga una clave de API

Las claves (por ahora solo `FAL_KEY`, para `npm run clip`) van en
**`motor/.env`** o en una **variable de entorno del sistema**; nunca en un
archivo que se suba, en un archivo del trabajo ni en el chat. `npm run
requisitos` solo mira que exista y dice de dónde salió; nunca muestra ni
guarda el valor. Si está en los dos lados, gana la del sistema.

- **Con `motor/.env` (lo más simple):** copiar `motor/.env.ejemplo` como
  `motor/.env`, abrirlo con un editor de texto y completar
  `FAL_KEY=la-clave` (sin comillas ni espacios). `.gitignore` lo excluye:
  no se sube nunca. No hace falta reabrir nada.
- **Windows, como variable del sistema:** menú Inicio → «Editar las variables
  de entorno de esta cuenta» → Nueva… → nombre `FAL_KEY`, valor la clave de
  fal.ai (Dashboard → Keys). Después, cerrar y volver a abrir la terminal (o
  la app de Claude).
- **macOS o Linux, como variable del sistema:** `export FAL_KEY=…` en
  `~/.zshrc` o `~/.bashrc`.

Tener la clave no gasta nada: `npm run clip` solo cobra con `--gastar`, y
antes muestra el costo estimado para pedir el OK.

## Cómo se comprueba un conector MCP

- Un conector está conectado si el agente tiene sus herramientas. Se buscan
  **por el final del nombre** (columna `herramientas` de `requisitos.json`),
  porque el prefijo cambia en cada instalación: por ejemplo
  `…__creative_generate_speech` para ElevenLabs.
- En Claude: si las herramientas aparecen como diferidas, se cargan con
  ToolSearch; si no aparecen, el conector no está.
- Dónde se conecta: en claude.ai, **Configuración → Conectores**; en Claude
  Code, `/mcp`. Lo hace la persona dueña de la cuenta: el agente no puede
  conectarlo solo ni pedir claves.

## Qué le dice el agente a la persona

Cuando falta un conector que el trabajo necesita, antes del paso:

1. Qué falta y para qué (por ejemplo: «Para la voz en off necesito el
   conector de ElevenLabs y no está conectado»).
2. Cómo conectarlo (`como_conectar`).
3. Las alternativas (`si_falta`), y que elija.
4. Si cobra (`costo`): el gasto se aprueba aparte, aunque el conector ya esté.

El resto del proceso sigue: falta un conector, no se frena todo el trabajo,
solo el paso que lo usa.
