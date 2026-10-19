# Prompts de video

Para animar una imagen ya aprobada (ver [imagen.md](imagen.md)). En inglés,
por la misma razón.

## Dos formas de que el avatar hable

| Forma | Cómo | Voz | Prompt |
|---|---|---|---|
| **Lip-sync** (la del kit, `npm run clip`) | La imagen de la escena + el tramo de la toma de voz de ElevenLabs que le toca | La misma en todos los clips, y la que suena en el montaje | HeyGen Avatar 4 no usa prompt (solo `--estilo stable` o `expressive`). OmniHuman y Kling Avatar aceptan uno: solo `CÁMARA` y gestos (plantilla «Lip-sync» abajo), sin guion, voz ni acento |
| **El modelo habla solo** (Veo en Google Flow, Kling o Seedance con audio) | El modelo inventa la voz a partir del prompt | Cambia un poco entre clips | La fórmula completa de abajo, con `GUION`, `VOZ` y `ACENTO` |

Para el b-roll (nadie habla) las dos son iguales: imagen a video con la
plantilla «Sin hablar». En `plan-avatar.json`, `{{guion}}`, `{{voz}}` y
`{{acento}}` se reemplazan solos al generar.

## Cómo se arma un prompt de video

Siempre los mismos bloques y en este orden. Los opcionales se sacan si no
hacen falta.

| # | Bloque | Ejemplo |
|---|---|---|
| 1 | `CÁMARA` | `Camera fixed in place; the person moves naturally, with small shifts of head and hands.` |
| 2 | `ANTES` (opcional): lo que hace antes de hablar | `They put the phone down on the table,` |
| 3 | `GUION` | `then face the lens and say: "{{line}}"` |
| 4 | `MIENTRAS` (opcional): lo que hace mientras habla | `while nodding slowly with a smile.` |
| 5 | `VOZ` | `Voice: a woman around 35, mid pitch, clean tone, unhurried and assured.` (ver [voz.md](voz.md)) |
| 6 | `ACENTO` | la línea `voz.acento_prompt` de `marca.json` |
| 7 | `TOMA` (fijo) | `One uninterrupted shot: no edits, no scene changes; once the camera stops moving, it stays on that framing.` |

Plantilla:

```text
{{CÁMARA}} {{ANTES, optional}} then the person faces the lens and says:
"{{line}}"{{MIENTRAS, optional}}.
{{VOZ}} {{ACENTO}}
One uninterrupted shot: no edits, no scene changes; once the camera stops
moving, it stays on that framing.
```

**Reglas**

- `VOZ` y `ACENTO` se copian **idénticos** en todos los clips del mismo
  personaje, y conviene generarlos en la misma sesión.
- Un clip por frase, o por dos frases cortas, sin pasar el máximo del modelo
  (casi siempre 8 a 10 s). El guion se corta en frases enteras.
- Lo que pasa antes de hablar va antes del guion; lo que pasa mientras habla,
  después.
- Ninguna marca nombrada en el prompt (el modelo inventa logos), salvo que el
  producto ya esté en la imagen de referencia.
- El bloque `TOMA` va siempre: sin él, el modelo corta a mitad de frase.

## Cámara

| Movimiento | `{{CÁMARA}}` |
|---|---|
| Quieta (la más usada) | Camera fixed in place; the person moves naturally, with small shifts of head and hands. |
| Trípode | Camera on a tripod, perfectly still for the whole clip. |
| Acercamiento lento | From the first frame the camera creeps steadily toward the face and stops on a close-up. |
| Acercamiento al hablar | A quick move in at the start that lands on a close-up just as the first word is spoken. |
| En mano | Gentle hand-held sway, barely noticeable. |
| Alejamiento que revela | It starts tight on the face and slowly pulls away to show the room as they begin talking, then rests on the wide view. |
| Órbita | The camera travels a slow half circle around the person, keeping them in the center. |
| Acompañando | The camera moves beside the person as they walk and talk, smooth and level. |
| Desde abajo | Camera below eye level looking up, edging slowly closer to add authority. |
| Fondo desenfocado | Background melted into a soft blur, subject sharp, the camera drifting slowly closer. |

## Gestos

Van en `ANTES` o en `MIENTRAS`. Son gestos, no lo que dice (eso es el guion).

| Gesto | En inglés |
|---|---|
| Asiente sonriendo | nods slowly with a smile |
| Señala la pantalla | points at the phone screen |
| Levanta el celular | lifts the phone toward the lens |
| Cuenta con los dedos | counts on their fingers |
| Se encoge de hombros | lifts both shoulders in a shrug |
| Cruza los brazos | folds their arms |
| Se acomoda los anteojos | pushes their glasses up |
| Inclina la cabeza | tilts their head, curious |
| Pulgar arriba | gives a thumbs-up |
| Apoya el celular | sets the phone down on the table |

## Plantillas por formato

**A cámara (avatar-ugc)**

```text
Camera fixed in place; the person moves naturally, with small shifts of head
and hands. They speak straight to the lens in a warm, plain-spoken way and
say: "{{line}}". {{VOZ}} {{ACENTO}}
One uninterrupted shot: no edits, no scene changes.
```

**Mostrando una pantalla (avatar-pantalla)**

```text
Camera fixed in place. The person and the device look exactly as in the
reference, and whatever is on the screen does not change or move. They hold
the phone up to the lens, look down at it briefly, look back at the camera and
say: "{{line}}". {{VOZ}} {{ACENTO}}
One uninterrupted shot: no edits, no scene changes.
```

**Lip-sync (con un modelo que acepta prompt)**

```text
{{CÁMARA}} The person speaks to the lens {{MIENTRAS, optional}}. Same person,
clothes and place as in the reference. Nothing written on screen, no logos or
watermarks. One uninterrupted shot, no edits.
```

El audio manda: el prompt solo dice cómo se mueve la cámara y qué hace con
las manos y la cabeza.

**Sin hablar (b-roll para voz en off)**

```text
{{CÁMARA}} The person does not speak: lips stay closed for the whole clip.
Same person as in the reference. {{action}}. {{place and light}}.
Nothing written on screen, no watermark. One uninterrupted shot, no edits.
```

**Dos personas en el mismo plano (dualcast)**

```text
Two people share the frame in a relaxed conversation. Only the person on the
{{LEFT | RIGHT}} talks and says: "{{line}}". The other one stays silent: they
listen, react with small facial expressions and nods, and look at the speaker
without interrupting. The speaker sounds like this: {{VOZ}} {{ACENTO}}
Camera fixed in place. One uninterrupted shot, no edits.
```

Para el turno siguiente se usa la misma imagen y se cambia quién habla.

## Si algo sale mal

| Problema | Qué hacer |
|---|---|
| La cara cambia entre clips | Volver a la hoja de personaje como referencia; misma imagen base para todos los clips |
| Corta a mitad de frase | Revisar que esté el bloque `TOMA`; acortar el guion del clip |
| La pantalla se deforma o cambia | Plano más abierto, o mostrar el sitio con el motor en la escena siguiente |
| Manos raras | Pedir «five fingers, believable grip» en la imagen; evitar gestos con los dedos |
| Aparecen textos o logos | Agregar «nothing written on screen, no logos or watermarks» |
| La voz cambia | Usar lip-sync con la toma de ElevenLabs (`npm run clip`); con un modelo que habla solo, la misma línea `VOZ` exacta y la misma sesión |
| La boca no coincide | Revisar el tramo en `activos/entradas/<escena>.wav`; si cambió la toma de voz, `validar` lo marca y hay que generar el clip de nuevo |
