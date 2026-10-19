# Clientes

El kit no trae clientes. Cada empresa con la que se trabaja tiene su perfil en
`clientes/<cliente>/`, que se arma **preguntándole** la primera vez (paso 1 de
[PROCESO.md](../PROCESO.md), preguntas C1 a C9 de
[preguntas.md](../preguntas.md)). Los perfiles son datos de cada cliente:
`.gitignore` los deja fuera del repositorio.

Cada perfil tiene:

| Archivo | Qué tiene |
|---|---|
| `marca.json` | Design tokens (colores por rol), tipografía, forma, logo, voz y reglas de copy. Esquema: [esquemas/marca.schema.json](../esquemas/marca.schema.json) |
| `copy.md` | Las reglas de copy explicadas para personas: tono, foco actual, qué se puede afirmar y por qué |
| `activos/` | Archivo de la tipografía con su licencia, y logo (todo lo que entra al video) |
| `fuentes/` | Opcional: el brand book u otros documentos de los que salen los tokens (no entran al video) |

## Design tokens: obligatorios, de la web o del brand book

Sin tokens no hay video: las plantillas solo conocen colores por rol, y las
variantes del paso 4b solo pueden usar colores del cliente. Se sacan de una de
estas dos fuentes y se anotan en `marca.json › fuente_tokens`:

| Fuente | `fuente_tokens` | Qué revisa `validar` |
|---|---|---|
| **CSS de la web** del cliente | `{ "tipo": "css", "archivo": "<ruta al CSS>", "variables": { "fondo": "--papel", … } }` | Que cada color de `colores` sea igual a su variable en el CSS, y avisa cuando la web cambia |
| **Brand book** o manual de marca (PDF, imagen o URL) | `{ "tipo": "brand_book", "archivo": "fuentes/brand-book.pdf", "detalle": "págs. 12–14" }` | Nada contra el documento: los colores se copian a mano (o los lee el modelo) y quedan en `colores` |

- La ruta de `archivo` es relativa a `clientes/<cliente>/` (puede salir con
  `../`) o una URL.
- Si el archivo fuente no está (por ejemplo, el kit se copió sin la web del
  cliente), `validar` **avisa y sigue**: los colores ya están en `marca.json`.
- Si no hay ni web ni brand book, primero se define la paleta con el cliente y
  se guarda como un brand book mínimo (un PDF o una imagen con los colores) en
  `fuentes/`.
- Los colores de la marca que no tienen rol (paleta secundaria) van en
  `paleta`: `[{ "nombre": "Arena", "color": "#E8DCC4" }]`.

## Los roles de color

Las plantillas no conocen colores: conocen **roles**. Así la misma plantilla
sirve para cualquier marca.

| Rol | Se usa para |
|---|---|
| `fondo` | El fondo del video |
| `superficie` | Tarjetas, ventanas, paneles |
| `marco` | Barras de navegador, bloques de relleno |
| `linea` | Bordes de 1 px y separadores |
| `texto` | Texto principal y el cuerpo del celular |
| `texto_suave` | Textos secundarios |
| `enfasis` | Palabras destacadas, casillas tildadas, etiquetas |
| `sobre_enfasis` | El tilde u otro elemento que va encima de `enfasis` |
| `grafico` | Detalles gráficos (íconos, puntos) |
| `acento` / `acento_texto` | Llamados de atención puntuales («¿Y tu empresa?») |
| `boton_fondo` / `boton_texto` | El botón de llamada a la acción |

## Estilo y variantes (propuestas visuales)

- `estilo`: cómo se ve por defecto. `logo_escala` (multiplica el alto del
  logo), `alineacion` (`izquierda` o `centro`) y `enfasis` (`color` o
  `subrayado`, para las *palabras clave*).
- `variantes`: las direcciones visuales que se le proponen al cliente en el
  paso 4b. Cada una cambia **solo lo que necesita** sobre los colores base:
  - `colores`: lo que va sobre el fondo (fondo, texto, énfasis, botón…).
  - `colores_superficie`: la paleta de lo que va **dentro** de tarjetas,
    ventanas y pantallas. Así un fondo oscuro puede llevar tarjetas claras
    con texto oscuro.
  - `logo`: otra versión del logo (por ejemplo la clara para fondos oscuros), o `null`.
  - `estilo`: logo, alineación y énfasis propios.

Regla: **todo color de una variante tiene que ser un token del cliente**: estar
en `colores`, en `paleta` o, si la fuente es un CSS que está a mano, en ese
archivo. `validar` lo revisa. Conviene que las tres variantes sean bien
distintas entre sí (claro, oscuro y color de marca).

## Cliente nuevo

1. `npm run cliente -- <cliente> --tokens css|brand_book` (dentro de `motor/`)
   crea `clientes/<cliente>/` con `marca.json` y `copy.md` llenos de
   `COMPLETAR`, y las carpetas `activos/` y `fuentes/`.
2. Sacar los design tokens (ver arriba): del CSS de su web, mapeando cada rol a
   una variable en `fuente_tokens.variables`, o de su brand book, copiando a
   `fuentes/` y anotando las páginas en `fuente_tokens.detalle`. Con un brand
   book, cada color se elige por su uso en el manual (fondo, texto, botón…),
   no por parecido.
3. Copiar a `activos/` la tipografía (con licencia que permita video) y el logo
   en PNG o SVG, y anotar el ancho y alto del logo. Si la licencia pide viajar
   con la fuente (la OFL lo pide), va al lado: por ejemplo
   `HostGrotesk-OFL.txt`, bajada del repositorio oficial (para Google Fonts,
   `github.com/google/fonts/tree/main/ofl/<familia>/OFL.txt`).
4. Completar la voz (`idioma`, `trato`, `acento_prompt`) y las reglas de copy.
   Cada afirmación lleva su fuente: de dónde sale y quién la aprobó.
5. Armar las tres variantes con sus tokens y que el cliente apruebe el perfil.
6. `npm run validar -- <cliente>/<cualquier-trabajo>` revisa el perfil: no deja
   seguir mientras quede un `COMPLETAR`.
