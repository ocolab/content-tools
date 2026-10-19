# avatar-pantalla · un avatar muestra una web o app

**Qué es:** una persona generada con IA habla a cámara y muestra el sitio del
cliente en el celular o la compu. Para vender lo que se ve en una pantalla:
páginas web, apps, sistemas.

**Cuándo:** mensajes; cuando la prueba es el producto funcionando.

## Estructura (≈ 20 s, 4 clips)

| Escena | Clase | Qué pasa | Guion de ejemplo |
|---|---|---|---|
| 1 | `a_camara` | Gancho mirando a cámara, acercamiento rápido | El dolor del público como pregunta: «¿Tus clientes te buscan y no te encuentran?» |
| 2 | `pantalla` | Levanta el celular con el sitio | «Mirá: así se ve {{lo que se vende}}.» |
| 3 | `pantalla` | Señala la pantalla, plano más cerrado | Una afirmación aprobada de `marca.json`, dicha en voz alta |
| 4 | `a_camara` | Cierre (el botón lo agrega el montaje) | «Escribinos y {{qué pasa después}}.» |

## Producción

1. Hoja de personaje: [prompts/imagen.md](../prompts/imagen.md) §3.
2. Imagen base a cámara (§1) y, para las escenas de pantalla, el método en dos
   pasos (§6) con la captura de `npm run capturar`.
3. Una sola toma de voz para todo el guion ([prompts/voz.md](../prompts/voz.md)).
4. Un clip por escena con `npm run clip` (lip-sync de la imagen con su tramo
   de la toma); con un modelo que acepta prompt, «Mostrando una pantalla» de
   [prompts/video.md](../prompts/video.md). Cada imagen y clip queda en
   `activos.json`.
5. Montaje en el motor: escenas `clip` en orden y una escena `cierre` con el
   botón; subtítulos, logo y colores salen de `marca.json`. Si el sitio se ve
   mal en el celular del clip, se puede intercalar una escena `capturas`.

## Qué mirar

- El texto del sitio en pantalla no se deforma. Si se deforma: plano más
  abierto, o mostrar el sitio en una escena `capturas` del motor.
- La misma cara en los cuatro clips.
- Declarado como contenido generado con IA.
