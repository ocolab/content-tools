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
3. Un clip por escena con [prompts/video.md](../prompts/video.md) («Mostrando
   una pantalla»), con la misma línea de voz y acento en todos.
4. Registrar cada imagen y clip en `activos.json`.
5. Montaje en un editor: clips en orden, subtítulos, logo y botón con la
   tipografía y los colores de `marca.json`. El cierre puede ser una escena
   `cierre` del motor.

## Qué mirar

- El texto del sitio en pantalla no se deforma. Si se deforma: plano más
  abierto, o mostrar el sitio en una escena `capturas` del motor.
- La misma cara en los cuatro clips.
- Declarado como contenido generado con IA.
