# Proceso: de un pedido a un anuncio en video

Ocho pasos. Cada paso lee archivos del trabajo y deja un archivo nuevo que se
valida contra su esquema (`esquemas/`). **Ningún paso depende de lo que se
habló en una conversación**: una persona, Claude, otro modelo o un servicio web
pueden retomar cualquier trabajo leyendo su carpeta `trabajos/<cliente>/<id>/`.

| Paso | Qué se hace | Lee | Escribe | Aprueba |
|---|---|---|---|---|
| 1 | Perfil del cliente (una vez por cliente) | respuestas del cliente + CSS de su web o brand book | `clientes/<c>/marca.json`, `copy.md`, `activos/` | el cliente |
| 2 | Brief | [preguntas.md](preguntas.md) | `brief.json` | — |
| 3 | Copy | brief + marca | `copy.json` | **el cliente** |
| 4 | Tipo y plan | brief + copy + [catálogo](catalogo/LEEME.md) | `spec.json` (animación) o `plan-avatar.json` (avatar) | **el cliente** (incluye el gasto) |
| 4b | Propuestas visuales | spec + variantes de `marca.json` | `propuestas/` (3 opciones) y `spec.visual` | **el cliente** elige una |
| 5 | Activos | spec o plan | capturas, voz, imágenes, clips + `activos.json` | gasto de créditos |
| 6 | Montaje | todo lo anterior | `salida/*.mp4` + `manifiesto.json` | — |
| 7 | Control de calidad | salida | `qc/qc.json` + hojas de contacto | **revisión humana** |
| 8 | Entrega | video aprobado | registro y subida en pausa | **el cliente** (publicar) |

Los comandos `npm run …` se corren dentro de `motor/`. Antes de cada paso que
gasta algo (créditos, tiempo de render, presupuesto) se corre
`npm run validar -- <cliente>/<id>`: si da error, no se sigue.

> **Requisitos y conectores MCP.** Al abrir un trabajo, y otra vez antes de
> los pasos 3, 5 y 8: `npm run requisitos -- <cliente>/<id>`. Dice qué
> programas locales faltan y qué **conectores MCP** necesita ese trabajo
> (ElevenLabs para la voz en off, un generador de imágenes para el avatar,
> Meta Ads para subir). Quien corre el proceso comprueba que estén conectados
> **antes** del paso; si falta uno, avisa qué falta y cómo conectarlo, y ofrece
> la alternativa. Detalle en [REQUISITOS.md](REQUISITOS.md).

---

## Paso 1 · Perfil del cliente

El kit no trae clientes: el perfil de cada empresa se arma **preguntándole**,
la primera vez que se trabaja con ella. Si `clientes/<cliente>/marca.json` no
existe, se hace antes que nada:

1. `npm run cliente -- <cliente> --tokens css|brand_book` crea el perfil con
   campos `COMPLETAR`.
2. Se hacen las preguntas del perfil de [preguntas.md](preguntas.md) (C1 a
   C9) y se piden los archivos: CSS o brand book, logo y tipografía.
3. Se completan `marca.json` y `copy.md` (detalle en
   [clientes/LEEME.md](clientes/LEEME.md)) y el cliente lo aprueba.
   `validar` no deja seguir mientras quede un `COMPLETAR`.

Lo mínimo que tiene que quedar:

- **Design tokens: colores por rol** (fondo, superficie, texto, énfasis,
  botón…). Son obligatorios: las plantillas usan roles, no colores sueltos. Se
  sacan del **CSS de la web** del cliente o de su **brand book**, y la fuente se
  anota en `fuente_tokens`. Con CSS, `validar` detecta cuando la web cambia. No
  hace falta que el cliente tenga web.
- **Tipografía** (archivo con licencia que permita usarla en video) y **logo**.
- **Voz de marca**: idioma, trato (vos/tú/usted) y la línea de acento.
- **Reglas de copy**: palabras prohibidas, **afirmaciones aprobadas con su
  fuente** (la única forma de que una cifra llegue a un anuncio) y botones
  aprobados.

## Paso 2 · Brief

`npm run nuevo -- <cliente>/<id>` crea la carpeta con un `brief.json` lleno de
`COMPLETAR`. Se completa con [preguntas.md](preguntas.md), en ese orden. Tres
preguntas no se suponen nunca, se hacen siempre:

1. **¿Cuál es el objetivo del anuncio?** (qué tiene que hacer quien lo ve).
2. **¿Avatar humano digital o solo animaciones?**
3. **¿Qué servicio o tema se vende?**

Listo cuando `npm run validar` no marca errores en `brief.json`.

## Paso 3 · Copy

**Necesita:** la skill `cro` (recomendada; sin ella, el prompt de copy).

Se proponen textos y el cliente elige. Con Claude, se usa la skill **`cro`**
pasándole el brief y las reglas de copy de la marca (ver
[catalogo/prompts/copy.md](catalogo/prompts/copy.md), que también sirve como
prompt para cualquier otro modelo). Hay que pedir:

- propuesta de valor que se entienda en 5 segundos;
- 3 ángulos distintos, cada uno con su gancho;
- para el elegido: título, puntos, guion por escena y botón.

Reglas: solo afirmaciones de `marca.json`; ninguna palabra prohibida; el botón
dice lo que pasa al tocarlo. Se guarda en `copy.json` con `"aprobado": false`, y
pasa a `true` **solo cuando el cliente lo aprueba**. Sin copy aprobado,
`validar` bloquea los pasos siguientes.

## Paso 4 · Tipo de anuncio y plan

Con el objetivo y el estilo del brief, se elige el tipo en la tabla de
[catalogo/LEEME.md](catalogo/LEEME.md) y se anota en `brief.tipo`.

- **Animación** (`loop-6s`, `explicativo`): `spec.json`. Se parte de
  `motor/ejemplos/<tipo>.json` y se completa con el copy aprobado. Las capturas
  de sitios se declaran en `capturas`.
- **Avatar** (`avatar-ugc`, `avatar-pantalla`, `voz-en-off-broll`, `dualcast`):
  `plan-avatar.json`, con un prompt de imagen y uno de video por escena,
  armados con [catalogo/prompts/](catalogo/prompts/) y la ficha del tipo.

El cliente aprueba el plan y el costo estimado antes del paso 5.

## Paso 4b · Propuestas visuales

Antes de producir, el cliente elige cómo se ve. Cada marca trae en
`marca.json › variantes` tres direcciones visuales armadas **solo con sus
design tokens** (por ejemplo: fondo claro, fondo oscuro, fondo del color de la
marca), con su propio logo, alineación y forma de marcar las palabras clave
(ver [clientes/LEEME.md](clientes/LEEME.md)).

1. `npm run propuestas -- <c>/<id>` renderiza los cuadros clave del video con
   cada variante (el inicio ya armado, la escena del producto y el cierre) y
   arma `propuestas/comparacion-<formato>.png`, una fila por variante.
2. Se le muestran las opciones al cliente, numeradas, y elige una.
3. La elección va a `spec.json › visual.variante`. `validar` comprueba que
   exista y que todos sus colores sean tokens del cliente.

Si el copy y el audio ya están aprobados, cambiar de variante no los toca:
solo cambia lo visual.

## Paso 5 · Activos

**Necesita:** con voz en off, el **conector MCP de ElevenLabs**; con avatar,
un generador de imágenes con referencias (por ejemplo el conector MCP de
Canva) y un generador de video externo. Se comprueban antes de empezar el paso.

Todo lo que se genera se registra en `activos.json`: archivo, herramienta,
modelo, parámetros, prompt y hash. **Lo generado no se regenera en silencio**:
si cambia el texto o el prompt, se genera de nuevo a propósito y se registra
otra vez.

- **Capturas de sitios**: `npm run capturar -- <c>/<id>`. Usan un navegador de
  versión fija; una captura tomada no se vuelve a tomar sin `--forzar`. El
  `origen` es la URL del sitio del cliente (o de un trabajo real suyo) o una
  ruta relativa a la carpeta del kit.
- **Voz en off** (explicativo): `npm run voz -- <c>/<id> texto` da el texto
  exacto; se genera **una** toma con la voz de la marca, se transcribe con
  tiempos por palabra y se registra con `npm run voz -- <c>/<id> registrar …`.
  Detalle en [catalogo/prompts/voz.md](catalogo/prompts/voz.md).
- **Avatar**: primero la hoja de personaje (cara de referencia), después una
  imagen por escena y después el clip por escena, siempre con las mismas
  referencias, la misma línea de voz y el mismo acento.
- **Música**: solo con licencia anotada en `motor/public/musica/LICENCIAS.md`.
- **Efectos de sonido**: `npm run sonidos` (fórmulas fijas, sin costo).

## Paso 6 · Montaje

- Animación: `npm run render -- <c>/<id>`. Valida, renderiza en cada formato,
  normaliza el volumen a -14 LUFS (si hay voz o música) y escribe
  `salida/manifiesto.json` con los hashes de entradas y salidas. Si las entradas
  no cambiaron, avisa si el video salió idéntico al anterior.
- Avatar: por ahora el montaje es externo (CapCut u otro editor), siguiendo el
  orden de escenas del plan. Las escenas con clip son la próxima mejora del motor.

## Paso 7 · Control de calidad

`npm run qc -- <c>/<id>` revisa medidas, códec, 30 cuadros por segundo,
duración, volumen, picos y tramos sin movimiento, y genera una hoja de contacto
por formato con la **zona segura marcada en naranja**. Después, la revisión
humana con esta lista:

- [ ] Sin sonido, en los primeros 2 segundos se entiende qué se ofrece.
- [ ] Todo el texto está dentro del recuadro naranja.
- [ ] Cada afirmación está en `marca.json`; no hay cifras ni testimonios inventados.
- [ ] Se reconoce la marca, pero no tapa el mensaje.
- [ ] El botón dice lo que pasa al tocarlo y coincide con el destino del brief.
- [ ] Nada queda quieto más de un segundo y medio.
- [ ] Audio: la voz se entiende y la música no la tapa.
- [ ] Avatar: la misma cara en todas las escenas, manos correctas, boca
      sincronizada, sin textos ni logos inventados, declarado como IA.

## Paso 8 · Entrega

**Necesita:** para subirlo desde acá, el **conector MCP de Meta Ads** con
acceso a la cuenta del cliente; sin él, se entregan los MP4.

Se marca `"aprobado": true` en los activos usados, se anota el video en el
registro que use el cliente (su planilla, su CRM o la nota de la campaña) y,
**solo con el OK explícito del cliente**, se sube a la plataforma creado en
pausa.

---

## Reglas que no se negocian

1. Nada se afirma si no está en `marca.json` con su fuente.
2. Un avatar nunca se presenta como cliente ni da testimonio: es un
   presentador. Se declara el uso de IA donde la plataforma lo pida.
3. Una persona real como avatar, solo con permiso escrito.
4. Música y tipografías, solo con licencia para publicidad.
5. Se pide aprobación antes de gastar créditos o presupuesto.

## Llevarlo a otro lado

- **Otra sesión de Claude u otro equipo**: copiar `fabrica-creativos/` sin
  `motor/node_modules/`, `motor/public/actual/` ni `trabajos/`; correr
  `npm ci` y después `npm run requisitos` en `motor/`, y conectar los
  conectores MCP que se vayan a usar. En Claude, la skill está en
  `claude/SKILL.md`. No hace falta nada de afuera del kit: si un perfil de
  cliente apunta a un archivo de tokens que no viajó, `validar` avisa y sigue.
- **Otro modelo**: alcanza con darle este archivo, `preguntas.md`,
  `catalogo/` y `esquemas/`. El copy, los planes y los prompts no dependen de
  ningún modelo.
- **Un servicio web**: los esquemas de `esquemas/` son el contrato
  (brief → copy → spec o plan → activos → render). El motor corre como un
  proceso aparte: `node scripts/render.mjs <cliente>/<id>`.
