# loop-6s · animación

**Qué es:** 6 segundos que se repiten. Título grande, de 3 a 5 tarjetas que se
escriben y se tildan, y un celular con un trabajo real y el botón. El último
cuadro queda vacío y empalma con el primero.

**Cuándo:** una sola idea fuerte; reconocimiento, tráfico o mensajes; como
versión en video de una imagen fija que ya funciona (misma frase: se compara
imagen contra video).

## Estructura (fija, 180 cuadros a 30 fps)

| Tiempo | Qué pasa | Sonido |
|---|---|---|
| 0,0–0,5 s | Logo y eyebrow; el título entra línea por línea | — |
| 0,8–3,3 s | Tarjetas: cada una entra, se escribe y se tilda | tilde por tarjeta |
| 3,3–3,8 s | El título se achica, las tarjetas salen y sube el celular | barrido |
| 3,7–4,0 s | Etiqueta de la prueba y botón | campana |
| 3,7–5,4 s | El sitio se desplaza dentro del celular | — |
| 5,5–6,0 s | Todo se achica y se desvanece (loop) | barrido suave |

## Producción

1. `npm run nuevo -- <cliente>/<id> --tipo loop-6s`.
2. Completar `spec.json › contenido` con el copy aprobado: `eyebrow` (≤ 32),
   `titulo` (1–3 líneas ≤ 24; `*énfasis*`), `items` (3–5, ≤ 26), `captura`,
   `etiqueta_captura` (≤ 40), `boton` (≤ 26).
3. Declarar la captura en `capturas` (ancho 390, escala 2) y correr
   `npm run capturar`.
4. `npm run validar` → `npm run render` → `npm run qc`.

## Qué mirar en la hoja de contacto

- El título entra entero en el ancho.
- Las tarjetas no se pisan con el título ni salen del recuadro naranja.
- El botón queda dentro del recuadro y se lee.

Spec de partida: [motor/ejemplos/loop-6s.json](../../motor/ejemplos/loop-6s.json).
