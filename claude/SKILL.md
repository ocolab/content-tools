---
name: fabrica-creativos
description: Crea anuncios en video (Reels, historias, feed, TikTok) siguiendo el proceso reproducible de fabrica-creativos/ — brief con preguntas fijas, copy con la skill cro, elección del tipo de anuncio (animación o avatar humano digital), prompts de imagen, video y voz, render determinista con Remotion y control de calidad. Usala cuando pidan un anuncio en video, un creativo animado, un video con avatar, un brief de anuncio, renderizar o revisar un video de anuncio, o sumar un cliente o una herramienta al catálogo de creativos.
---

# Fábrica de creativos

El proceso completo vive en la carpeta del kit (`fabrica-creativos/`, la que
contiene esta carpeta `claude/`). Esta skill solo dice cómo lo sigue Claude.
**La fuente de verdad es `PROCESO.md`: leelo antes de empezar** y seguí sus 8
pasos en orden. Todo lo que se decide queda en archivos de
`trabajos/<cliente>/<id>/`, nunca solo en la conversación.

## Antes de empezar

1. Leé `PROCESO.md`, `REQUISITOS.md`, `preguntas.md` y `catalogo/LEEME.md`.
2. Preguntá para qué empresa es el anuncio. Si no tiene
   `clientes/<cliente>/marca.json` (o `validar` marca campos sin completar),
   seguí «Perfil del cliente» antes que nada. Si el perfil existe, leé también
   su `copy.md` (tono y foco actual).
3. Abrí el trabajo: `npm run nuevo -- <cliente>/<id>` (dentro de `motor/`).

## Perfil del cliente (paso 1)

El kit no trae datos de ninguna empresa: todo sale de lo que diga y entregue
el usuario. No inventes colores, afirmaciones, cifras ni botones.

1. Hacé las preguntas del perfil de `preguntas.md` (C1 a C9), de a una, con
   AskUserQuestion cuando haya opciones claras. Empezá por C2: los **design
   tokens son obligatorios** y salen del CSS de su web o de su brand book (no
   hace falta que tenga web). Sin ninguna de las dos fuentes, no sigas:
   proponé una paleta, que el usuario la apruebe y guardala como brand book
   mínimo en `fuentes/`.
2. Corré `npm run cliente -- <cliente> --tokens css|brand_book` y pedí los
   archivos: el CSS o la URL de la web, o el brand book (PDF o imagen, va a
   `fuentes/`); el logo y la tipografía con su licencia (van a `activos/`).
3. Con CSS, mapeá cada rol a una variable. Con brand book, leelo (Read lee
   PDF e imágenes) y pasá cada color a su rol según el uso que le da el manual.
   Mostrale al usuario la tabla rol → color y que la confirme.
4. Completá `marca.json` y `copy.md`, armá las tres variantes (claro, oscuro y
   color de marca) **solo con sus tokens**, y corré `npm run validar`. Cada
   afirmación lleva la fuente que dio el usuario; lo que no tiene fuente no
   entra.

## Requisitos y conectores MCP (obligatorio)

1. Al abrir el trabajo, corré `npm run requisitos -- <cliente>/<id>`. Si falta
   algo local (✗), resolvelo antes de seguir.
2. Para cada conector MCP o skill que el trabajo necesita (marcados con !),
   comprobá que tengas sus herramientas: buscalas por el final del nombre
   (`creative_generate_speech`, `generate-image`, `ads_creative_upload_media`…),
   con ToolSearch si están diferidas. Si no aparecen, el conector no está.
3. Si falta uno, decíselo al usuario **apenas lo sepas, no recién al llegar
   al paso**: qué falta, para qué paso, cómo conectarlo (`como_conectar` de
   `requisitos.json`) y las alternativas (`si_falta`), y que elija. Vos no
   podés conectarlo ni pedir claves, y no lo reemplaces por otra herramienta
   sin preguntar. El resto del trabajo sigue: solo frena el paso que lo usa.
4. Volvé a correr `npm run requisitos` cuando el brief o el spec definan si
   hay voz en off o avatar, y comprobá de nuevo justo antes de los pasos 3, 5
   y 8: un conector puede desconectarse en el medio.

## Preguntas obligatorias

Hacelas con AskUserQuestion o en la conversación, de a una, en el orden de
`preguntas.md`. Estas tres no se suponen nunca, aunque parezcan obvias:

- **Objetivo del anuncio**: qué tiene que hacer quien lo ve (mensajes,
  clientes potenciales, tráfico, ventas, reconocimiento) y adónde lleva el botón.
- **¿Avatar humano digital o solo animaciones?** (o mixto), explicando lo que
  implica cada opción (tabla de `preguntas.md`).
- **Servicio o tema** que se vende en este anuncio.

## Copy (paso 3)

Usá la skill **`cro`**. Pasale el brief y las reglas de `marca.json`
(prohibidas, afirmaciones, botones) y pedile propuesta de valor, 3 ángulos con
gancho, y para el elegido título, puntos, guion por escena y botón, **para un
anuncio en video**. Si `.agents/product-marketing.md` está desactualizado,
decile que use el brief y `marca.json` en su lugar. Volcá el resultado en
`copy.json` con `"aprobado": false`, mostráselo al usuario y pasalo a `true`
solo cuando lo apruebe. Sin `cro` disponible, usá `catalogo/prompts/copy.md`.

## Producción

- **Animación** (`loop-6s`, `explicativo`): completá `spec.json`, corré
  `npm run capturar` y `npm run validar`.
- **Propuestas visuales (paso 4b), siempre antes del render final**:
  `npm run propuestas -- <c>/<id>`, mirá la hoja `propuestas/comparacion-*.png`
  con Read, mandásela al usuario con SendUserFile y pedile que elija con
  AskUserQuestion (una opción por variante, con su nombre y descripción).
  Guardá la elección en `spec.json › visual.variante`. Si a la marca le faltan
  variantes, proponé tres con sus tokens (claro, oscuro, color de marca).
- Después: `npm run render` y `npm run qc`. Mirá las hojas de contacto de
  `qc/` con Read y aplicá la lista del paso 7.
- **Voz en off**: seguí `catalogo/prompts/voz.md` con el conector de
  ElevenLabs (estimar costo, pedir OK, una sola toma, transcripción con tiempos
  y `npm run voz -- … registrar`). Nunca reintentes una generación llamando de
  nuevo: cobra otra vez.
- **Avatar**: armá `plan-avatar.json` con la ficha del tipo y
  `catalogo/prompts/imagen.md` y `video.md`. Si hay una herramienta de imagen
  conectada (por ejemplo Canva `generate-image`), usala con las referencias
  numeradas; registrá cada archivo en `activos.json`. El video con avatar se
  genera con herramientas externas (`catalogo/herramientas.md`).

## Reglas

- `npm run validar` antes de gastar créditos, renderizar o mostrar un video.
  Con errores no se sigue.
- Pedí OK explícito antes de gastar créditos y antes de subir algo a Meta
  (siempre en pausa). Un OK no vale para el paso siguiente.
- Nada se afirma sin estar en `marca.json`; el avatar no da testimonio; se
  declara el uso de IA.
- Al terminar, mandá los MP4 de `salida/` y las hojas de `qc/` con
  SendUserFile, y decí qué quedó sin verificar.
