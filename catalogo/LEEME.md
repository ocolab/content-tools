# Catálogo de tipos de anuncio

Qué tipo de anuncio conviene según el objetivo y el estilo del brief, y con qué
se produce. Cada tipo tiene su ficha en [tipos/](tipos/); los prompts
reutilizables están en [prompts/](prompts/); las herramientas por etapa, en
[herramientas.md](herramientas.md).

| Tipo | Estilo | Rinde para | Duración | Qué muestra | Se produce con | Estado |
|---|---|---|---|---|---|---|
| [loop-6s](tipos/loop-6s.md) | animación | reconocimiento, tráfico, mensajes | 6 s en loop | Una idea grande + 3–5 puntos + una prueba | motor | listo |
| [explicativo](tipos/explicativo.md) | animación (voz en off opcional) | mensajes, clientes potenciales | 15–30 s | Problema → solución → prueba → botón | motor | listo |
| [avatar-pantalla](tipos/avatar-pantalla.md) | avatar | mensajes (web, app, software) | 15–25 s | Una persona muestra el sitio en el celular o la compu | prompts + herramientas externas | prompts listos |
| [avatar-ugc](tipos/avatar-ugc.md) | avatar | mensajes, clientes potenciales | 15–30 s | Una persona habla a cámara y presenta la oferta | prompts + herramientas externas | prompts listos |
| [voz-en-off-broll](tipos/voz-en-off-broll.md) | avatar sin hablar | reconocimiento, tráfico | 10–20 s | Escenas cotidianas del cliente con voz en off | prompts + herramientas externas | prompts listos |
| [dualcast](tipos/dualcast.md) | avatar | objeciones, consideración | 20–40 s | Dos personas: una pregunta lo que frena, la otra responde | prompts + herramientas externas | prompts listos |

## Cómo elegir

1. **Animación**
   - Una sola idea fuerte, o el objetivo es reconocimiento o tráfico → `loop-6s`.
   - Hay que mostrar el problema antes de la solución → `explicativo`.
2. **Avatar**
   - Lo que se vende se ve en una pantalla (web, app, sistema) → `avatar-pantalla`.
   - Es un servicio y la confianza pesa → `avatar-ugc`.
   - Hay una objeción concreta que frena la compra → `dualcast`.
   - El producto se entiende mejor en uso que explicado → `voz-en-off-broll`.
3. **Mixto**: gancho de 3 s con `avatar-ugc` y después un `explicativo`.
   Hasta que el motor monte clips, se arma en un editor.

**Si lo que se vende se ve en una pantalla** (una web, una app, un sistema):
`explicativo` o `avatar-pantalla`, y `loop-6s` como pieza de prueba barata
contra la imagen fija que ya esté corriendo.

## Lo que aprendimos de las referencias (2026-10-19)

Dos anuncios analizados: un loop de Google Ads («Llega a tu nicho», 6 s) y un
explicativo de 26 s de una agencia de páginas web para pymes.

- Los primeros 2 s son texto grande: nada de logo al principio.
- El producto se muestra como **interfaz animada** (buscadores, tarjetas,
  casillas, chats), no como captura quieta.
- Siempre hay algo en movimiento: nada queda quieto más de 1 a 1,5 s.
- Cada evento tiene su sonido (tecla, tilde, pop) y la prueba principal, un golpe más fuerte.
- Una tipografía grande y un solo color de acento.
- El final empalma con el principio (loop).
- Volumen final alrededor de -14 LUFS.
- Error a evitar: subtítulos debajo de la columna de íconos de Reels.
