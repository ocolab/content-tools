# voz-en-off-broll · escenas sin hablar con voz en off

**Qué es:** clips cortos de una persona en su día (nadie habla a cámara) y una
voz en off que cuenta la historia.

**Cuándo:** reconocimiento o tráfico; cuando el producto se entiende mejor en
uso que explicado.

## Estructura (≈ 15 s, 4–5 clips de 3 s)

1. La situación del problema (por ejemplo, la dueña busca su rubro en Google y
   frunce el ceño).
2. El momento del cambio (abre la compu y mira su web nueva).
3. El resultado en una escena (responde un mensaje desde el celular y sonríe).
4. Cierre con la marca y el botón (escena `cierre` del motor).

## Producción

1. Imagen por escena con la plantilla «Escena sin hablar» de
   [imagen.md](../prompts/imagen.md) §7 (acción + lugar y luz + plano).
2. Voz en off con ElevenLabs ([voz.md](../prompts/voz.md)): una toma; de sus
   tiempos sale cuánto dura cada escena.
3. Clip por escena con `npm run clip` (imagen a video, `guion: null` en el
   plan) y la plantilla «Sin hablar» de [video.md](../prompts/video.md):
   siempre «no talking, mouth closed». El script elige la duración del modelo
   que cubre la escena.
4. Montaje en el motor: escenas `clip` (mudas, sobre la voz en off) y una
   escena `cierre`; `npm run render`.
