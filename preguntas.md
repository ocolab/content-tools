# Preguntas

Dos tandas: el **perfil del cliente** (una sola vez por empresa) y el
**brief** (una vez por anuncio). Se hacen **en este orden**, de a una si es
una conversación. Cada respuesta llena un campo (entre paréntesis). El kit no
trae clientes: todo lo que sabe de una empresa sale de estas respuestas y de
los archivos que entrega.

## Perfil del cliente (paso 1)

Se hace cuando el cliente no tiene `clientes/<cliente>/marca.json`, o cuando
`validar` dice que tiene campos sin completar. Antes de preguntar:
`npm run cliente -- <cliente> --tokens css|brand_book` (la pregunta C2 dice
cuál).

**C1. ¿Cómo se llama la empresa y a qué se dedica?** (`nombre`; la carpeta
`cliente` es el nombre en minúsculas y con guiones)

**C2. ¿De dónde salen sus colores?** (`fuente_tokens`, `colores`, `paleta`)
Es obligatorio tener una de estas dos fuentes:

| Tiene | Qué se pide | `--tokens` |
|---|---|---|
| Web con sus colores en variables CSS | La URL y, si se puede, el archivo CSS | `css` |
| Brand book o manual de marca | El PDF o la imagen; va a `fuentes/` | `brand_book` |

Si no tiene ninguna de las dos, primero se define la paleta con el cliente y
se guarda como un brand book mínimo (una imagen o PDF con los colores y para
qué se usa cada uno). Después se pasa cada color a su rol (fondo, texto,
botón…; ver [clientes/LEEME.md](clientes/LEEME.md)) **según el uso que le da
la marca**, y se le muestra el resultado al cliente para que lo confirme.

**C3. ¿Me pasás el logo?** (`logo`)
PNG o SVG, mejor con fondo transparente. Si tiene una versión clara para
fondos oscuros, también (va en las variantes).

**C4. ¿Qué tipografía usa, y me pasás el archivo?** (`tipografia`)
TTF, OTF o WOFF, con una licencia que permita usarla en video (si la licencia
pide viajar con la fuente, el archivo de licencia va al lado). Si no tiene
una, se propone una libre (por ejemplo de Google Fonts, licencia OFL) parecida
a la de su web o su logo, y el cliente la aprueba.

**C5. ¿Cómo son sus formas?** (`forma`, `reglas_visuales`)
Esquinas redondeadas o rectas, bordes, sombras, y qué no se hace nunca
(degradados, fotos de stock, cierto color…). Muchas veces está en el CSS o en
el brand book: se propone y se confirma.

**C6. ¿Cómo habla la marca?** (`voz`)
Idioma, trato (vos, tú o usted) y acento (una línea de
[catalogo/prompts/voz.md](catalogo/prompts/voz.md)). Si ya tiene una voz en
ElevenLabs, su `voice_id`.

**C7. ¿Qué se puede afirmar, y de dónde sale cada cosa?** (`copy.afirmaciones`)
Servicios, plazos, precios, cifras, clientes o premios, cada uno con su fuente
(dónde está escrito o quién lo aprobó y cuándo). Lo que no tiene fuente no
entra, y sin esto el anuncio no puede tener cifras.

**C8. ¿Hay palabras o temas que no se puedan usar?** (`copy.prohibidas`)
Con el motivo, que va a `copy.md`.

**C9. ¿Qué botones se pueden usar y adónde llevan?** (`copy.cta_aprobados`)
Por ejemplo «Escribinos por WhatsApp» → el número; «Pedí una consulta» → un
formulario.

Con eso se completan `marca.json` y `copy.md`, se arman las tres variantes
visuales **solo con sus tokens** (claro, oscuro y color de marca) y el cliente
aprueba el perfil. Listo cuando `npm run validar` no marca errores en
`marca.json`.

## Brief del anuncio (paso 2)

Cada respuesta llena un campo de `brief.json`. Las preguntas 2, 3 y 5 no se
suponen nunca: aunque parezca obvio, se preguntan.

**1. ¿Para qué cliente es?** (`cliente`)
Si no tiene perfil, primero va la tanda de arriba.

**2. ¿Qué querés vender o comunicar en este anuncio?** (`servicio`)
Un solo servicio o tema por anuncio. Si son dos, son dos anuncios.

**3. ¿Qué tiene que hacer la persona que lo ve?** (`objetivo`)

| Respuesta | `objetivo.campana` |
|---|---|
| Que escriba por WhatsApp o Instagram | `mensajes` |
| Que deje sus datos en un formulario | `clientes_potenciales` |
| Que entre a la web | `trafico` |
| Que compre | `ventas` |
| Que conozca la marca | `reconocimiento` |

Además: la acción en palabras del cliente (`objetivo.accion`) y adónde lleva el
botón (`objetivo.destino`: número de WhatsApp, URL o formulario).

**4. ¿A quién le habla y qué problema tiene?** (`publico.quien`, `publico.dolor`, `publico.zona`)
El dolor con las palabras que usaría ese cliente, no con las nuestras.

**5. ¿Querés un avatar humano digital o solo animaciones?** (`estilo`)

| Opción | Qué es | A favor | En contra |
|---|---|---|---|
| `animacion` | Texto, interfaz y capturas animadas; voz en off opcional | Sale igual cada vez, sin costo por generación, se ve la marca | Menos cercano |
| `avatar` | Una persona generada con IA que habla a cámara o aparece en escenas | Cercanía, confianza, formato nativo de Reels | Cuesta créditos, hay que cuidar que la cara no cambie, se declara IA |
| `mixto` | Gancho con avatar (3 s) y explicación animada | Lo mejor de los dos | Más pasos |

**6. Solo si eligió avatar o mixto:** (`avatar`)
- ¿Persona generada o una persona real **con permiso escrito**? (`origen`)
- ¿Cómo es? Edad, estilo, ropa, lugar. (`descripcion`)
- ¿Cómo suena? Usar la fórmula de [catalogo/prompts/voz.md](catalogo/prompts/voz.md). (`voz`)
- ¿Con qué acento? Por defecto, el de la marca. (`acento`)

**7. ¿Dónde va a salir?** (`plataformas` → `formatos`)
Reels, historias y TikTok van en `9x16`; el feed, en `4x5`. Si no se sabe, los dos.

**8. ¿Cuánto puede durar como máximo?** (`duracion_max`)
Sugerencia según el objetivo: reconocimiento o tráfico, 6 a 15 s; mensajes o
clientes potenciales, 15 a 30 s; objeciones (dualcast), hasta 40 s.

**9. ¿Lleva música?** (`musica`)
`sin_musica`, `biblioteca_meta` (la de Meta, para anuncios en Meta),
`archivo_propio` (con licencia) o `generada`.

**10. ¿Hay algo que sí o sí haya que decir, o que no se pueda decir?** (`notas`)
Si es una regla permanente, va a `marca.json` (`copy.prohibidas` o
`copy.afirmaciones` con su fuente), no al brief.

---

El tipo de anuncio (`tipo`) **no se pregunta**: se elige en el paso 4 con la
tabla de [catalogo/LEEME.md](catalogo/LEEME.md) y se le propone al cliente.
