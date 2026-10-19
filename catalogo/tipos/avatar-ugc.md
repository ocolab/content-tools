# avatar-ugc · una persona a cámara

**Qué es:** el formato nativo de Reels: una persona habla a cámara, como si lo
grabara con el celular. Es un **presentador**, nunca un cliente que da
testimonio.

**Cuándo:** servicios donde la confianza pesa; mensajes o clientes potenciales.

## Estructura (≈ 20 s, 3–4 clips)

1. Gancho (≤ 3 s): el dolor del público en una frase, con acercamiento rápido.
2. Qué se ofrece, en concreto, con una afirmación aprobada.
3. Qué baja el riesgo o por qué ahora.
4. Qué hacer: «Escribinos…» (el botón lo agrega el montaje).

## Producción

1. Hoja de personaje ([imagen.md](../prompts/imagen.md) §3) e imagen base (§1);
   si hace falta, dos o tres ángulos (§4) para alternar planos.
2. Una sola toma de voz para todo el guion ([voz.md](../prompts/voz.md)).
3. Un clip por escena con `npm run clip`: lip-sync de la imagen de la escena
   con su tramo de la toma (la voz es la misma en todos los clips). Con un
   modelo que acepta prompt, la plantilla «A cámara» de
   [video.md](../prompts/video.md), variando el movimiento de cámara.
4. Montaje en el motor: `spec.json` con una escena `clip` por clip y una
   escena `cierre` con el botón; `npm run render`.

## Qué mirar

- La boca coincide con lo que dice; la voz es la misma en todos los clips.
- Nada de «me pasó», «lo usé» ni resultados personales: el avatar no da testimonio.
