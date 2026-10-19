# Prompts de imagen

Para crear o retocar la imagen de un avatar antes de animarla, con cualquier
modelo de edición de imagen que acepte referencias (ver
[herramientas.md](../herramientas.md)). Los prompts van en inglés porque los
modelos lo siguen mejor; las explicaciones, en castellano. `{{…}}` se
reemplaza. De dónde salen las técnicas: [fuentes.md](../fuentes.md).

## Cómo se arma un prompt de imagen

Todos los prompts de esta página se arman con los mismos bloques, en este
orden. Los bloques fijos se copian tal cual; así todas las imágenes de un
avatar piden lo mismo de la misma manera.

| Bloque | Para qué | Texto |
|---|---|---|
| `IDENTIDAD` (fijo) | Que el modelo no «mejore» ni cambie a la persona | `Treat the person in the reference as a fixed identity: their facial features, hairstyle, skin tone, build and apparent age must match it exactly.` |
| `REFERENCIAS` (si hay más de una) | Qué se toma de cada imagen y qué no | `Reference 1 shows {{a}}. Reference 2 shows {{b}}. Take {{a}} only from reference 1 and {{b}} only from reference 2; ignore any face or body that appears in reference 2.` |
| `CAMBIO` | **Una sola** modificación por prompt | `Apply one edit and nothing else: {{edit}}.` |
| `SE QUEDA` | Todo lo demás, sin tocar | `Pose, framing, background and lighting stay as they are in reference 1.` |
| `ACABADO` (fijo) | Que parezca una foto y salga una sola imagen | `Render it as a real photograph with true-to-life skin detail. Output one image.` |
| `SIN TEXTO` (escenas) | Que no aparezcan letras ni logos inventados | `Leave the frame free of text, logos and watermarks.` |

Reglas:

- **Un cambio por vez.** Si hacen falta dos, son dos prompts seguidos, cada
  uno sobre la imagen anterior.
- **Las referencias se numeran** en el orden en que se suben, y el prompt dice
  qué se toma de cada una.
- **La hoja de personaje** (§3) se hace primero y es la referencia de todas
  las imágenes siguientes del mismo avatar.

## 1. Retoque con un cambio

```text
Treat the person in the reference as a fixed identity: their facial features,
hairstyle, skin tone, build and apparent age must match it exactly.
Apply one edit and nothing else: {{edit, e.g. "they now wear a navy blazer over a plain white t-shirt"}}.
Pose, framing, background and lighting stay as they are in the reference.
Render it as a real photograph with true-to-life skin detail. Output one image.
```

## 2. Con dos referencias (ropa, lugar u objeto)

```text
Reference 1 shows the person. Reference 2 shows {{the outfit / the place / the object}}.
Take the person only from reference 1 and {{what}} only from reference 2;
ignore any face or body that appears in reference 2.
Treat the person as a fixed identity: their facial features, hairstyle, skin
tone, build and apparent age must match reference 1 exactly.
Apply one edit and nothing else: {{edit}}. Pose and framing stay as in
reference 1. Integrate the new element so light direction, color temperature
and perspective agree and nothing looks pasted in.
Render it as a real photograph with true-to-life skin detail. Output one image.
```

## 3. Hoja de personaje (la cara maestra)

Se hace **una vez por avatar**. Es lo que más ayuda a que la cara no cambie
de una escena a otra.

```text
Build an identity reference sheet of the person in the reference: a 3-by-3
grid of nine portraits on a flat pale-gray backdrop. Grid order: facing the
camera; turned fully left; turned fully right; half-turned left; half-turned
right; chin slightly raised; chin slightly lowered; relaxed neutral face;
serious face. Every portrait shows the same individual with the same features,
including small asymmetries, and the same hair, outfit and accessories. Keep
lens, distance and soft even lighting identical across the grid. No
retouching, smoothing or stylization: the sheet will be used to keep this
identity consistent in later images.
```

## 4. Ángulos de la misma persona

```text
Treat the person in the reference as a fixed identity: their facial features,
hairstyle, skin tone, build and apparent age must match it exactly.
Same outfit and same location. Show the person {{angle}}.
Render it as a real photograph with true-to-life skin detail. Output one image.
```

| Ángulo | `{{angle}}` |
|---|---|
| Frente | facing the lens straight on, eyes on the camera |
| Tres cuartos | turned roughly 45 degrees away from the camera |
| Perfil | in full side view |
| Desde arriba | from a camera placed a little above eye level, angled down |
| Desde abajo | from a camera a little below eye level, angled up, so they look self-assured |
| Cuerpo entero | head to feet in frame, standing relaxed |
| Plano abierto | small in the frame, with the whole room visible around them |
| Primer plano | framed tight on the face and shoulders |
| Contraluz | against a bright window, face in soft shadow, a thin line of light along their outline |

## 5. Producto en la mano

```text
Reference 1 shows the person. Reference 2 shows the product.
Put the product from reference 2 in the person's hand, raised to chest height
and turned toward the lens as if they were presenting it. The product keeps
the shape, colors, label and printed text of reference 2. Person, outfit,
location and light come from reference 1. Hands look natural: five fingers
and a believable grip.
Render it as a real photograph with true-to-life skin detail. Output one image.
```

Variante: «the product rests in one hand while the other hand gestures toward
it, eyes on the camera».

## 6. Una web o app en pantalla (dos pasos)

Para mostrar el sitio del cliente. **Primero** el dispositivo con la pantalla
apagada; **después** se pone la captura. En un solo paso, el modelo inventa lo
que hay en la pantalla.

**Paso A · pantalla apagada (celular)**

```text
Treat the person in the reference as a fixed identity: their facial features,
hairstyle, skin tone, build and apparent age must match it exactly.
Same outfit, place and light. Apply one edit and nothing else: the person now
holds a current smartphone at chest height with the display turned to the
camera. The display is switched off: uniform black, with no reflections,
interface, text or logos. One-handed, natural grip with five fingers.
Render it as a real photograph with true-to-life skin detail. Output one image.
```

Variante compu: «the person is seated with an open laptop angled toward the
camera; its display is switched off: uniform black…».

**Paso B · poner la captura**

```text
Reference 1 shows the person with a device whose display is black.
Reference 2 is a screenshot. Put the screenshot on that display so it covers
it edge to edge, following the angle and the rounded corners of the screen,
with plausible screen brightness and a faint reflection. Use the screenshot
as it is: same proportions, nothing cropped, stretched or redrawn, every word
as readable as in reference 2. Everything outside the display stays exactly
as in reference 1. Output one image.
```

La captura sale de `npm run capturar` (ancho de celular, 390 px). Si el modelo
deforma las letras, se elige un plano donde la pantalla se vea chica y el
sitio se muestra entero en la escena siguiente con el motor (escena
`capturas`).

## 7. Escena sin hablar (b-roll)

```text
Treat the person in the reference as a fixed identity: their facial features,
hairstyle, skin tone, build and apparent age must match it exactly.
{{action}}. {{place and light}}. {{shot}}.
Render it as a real photograph with true-to-life skin detail. Output one image.
Leave the frame free of text, logos and watermarks.
```

Piezas pensadas para pymes y servicios profesionales:

| Acción | `{{action}}` |
|---|---|
| Atiende el mostrador | They stand behind the counter of a small shop, greeting a customer who is out of frame |
| Revisa el celular | They read something on their phone and smile a little |
| Trabaja en la compu | They work at a laptop on a desk, concentrated |
| Muestra la pantalla | They turn the laptop around toward the camera, pleased |
| Atiende el teléfono | They take a phone call and jot something down |
| Abre el local | They unlock the shop door and push it open in the morning |
| Busca en Google | They type a search on their phone, then frown slightly |

| Lugar y luz | `{{place and light}}` |
|---|---|
| Local a la mañana | Inside a small neighborhood shop, gentle morning light coming in from the street |
| Oficina chica | In a small office with plants, daylight from a window |
| Estudio profesional | In a tidy professional office, warm late-afternoon light |
| Café | At a café table, daylight, background out of focus |
| Casa | At a kitchen table at home, warm lamp light in the evening |

| Plano | `{{shot}}` |
|---|---|
| Medio | Medium shot, framed from the waist up |
| Primer plano | Close shot on the face and hands |
| Abierto | Wide shot that shows the whole place |
| Por encima del hombro | Shot from behind their shoulder, looking at the screen |
