# Motor de animación

Plantillas de video en [Remotion](https://www.remotion.dev/) que reciben un
`spec.json` y la marca del cliente, más los scripts que validan, renderizan y
revisan. Requiere Node 22 y ffmpeg; el resto, en
[REQUISITOS.md](../REQUISITOS.md).

```bash
npm ci                                   # una vez (versiones exactas del package-lock)
npm run sonidos                          # una vez: efectos de sonido
npm run cliente -- mi-cliente --tokens brand_book  # una vez por cliente (paso 1): perfil para completar
npm run nuevo -- mi-cliente/mi-video --tipo loop-6s
npm run requisitos -- mi-cliente/mi-video  # programas y conectores MCP que necesita
npm run capturar -- mi-cliente/mi-video
npm run validar -- mi-cliente/mi-video
npm run propuestas -- mi-cliente/mi-video  # 3 variantes visuales para elegir (paso 4b)
npm run render -- mi-cliente/mi-video  # [--formatos 9x16]
npm run qc -- mi-cliente/mi-video
npm run estudio -- mi-cliente/mi-video # vista previa en el navegador
npm run voz -- mi-cliente/mi-video texto
npm run clip -- mi-cliente/mi-video todas   # costo estimado de los clips de avatar (no gasta)
npm run clip -- mi-cliente/mi-video gancho --gastar   # genera un clip en fal.ai (cobra; FAL_KEY)
npm run clip -- mi-cliente/mi-video gancho registrar --video clip.mp4 --herramienta "Google Flow"
npm run esquemas                         # exporta ../esquemas/*.schema.json
```

## Qué hay

| Ruta | Qué es |
|---|---|
| `src/plantillas/` | `Loop6s.tsx` y `Explicativo.tsx` |
| `src/escenas/Escenas.tsx` | Escenas del explicativo: gancho, buscador, armado, capturas, lista, cierre |
| `src/escenas/Clip.tsx` | Escena `clip`: un MP4 de avatar o b-roll a pantalla completa, con logo y subtítulos de la marca |
| `src/componentes/Base.tsx` | Piezas comunes: superficie, casilla, botón, celular, navegador, efectos |
| `src/tiempo.ts` | 30 fps, lienzos y zonas seguras, animaciones y tiempos por escena |
| `src/marca.tsx` | Carga la fuente del cliente y reparte la marca |
| `scripts/esquemas.mjs` | Esquemas de todos los archivos del proceso (fuente de verdad) |
| `scripts/validar.mjs` | Validación de un trabajo |
| `scripts/render.mjs`, `qc.mjs` | Render y control de calidad |
| `scripts/clip.mjs` | Clips de avatar y b-roll: estima, genera en fal.ai, retoma o registra, y anota en `activos.json` |
| `public/sonidos/` | Efectos generados con fórmulas fijas (`sonidos.json` tiene recetas y hashes) |
| `public/musica/` | Pistas con licencia anotada en `LICENCIAS.md` |
| `public/actual/` | Se rearma en cada render con los archivos del trabajo; no se edita |
| `ejemplos/` | Specs y plan de partida para `npm run nuevo` |

## Por qué el mismo spec da el mismo video

- Versiones exactas (`--save-exact` + `package-lock.json`) y el Chrome Headless
  Shell que fija Remotion, también para las capturas.
- Sin `Math.random`, `Date`, `fetch` ni `performance.now` en `src/` (`validar`
  lo revisa).
- 30 fps, PNG por cuadro, h264 crf 18, yuv420p; metadatos fijos (`bitexact`).
- La fuente se carga antes de dibujar nada, así las medidas de texto no cambian.
- Las capturas, la voz y los clips se generan una vez y quedan registrados con
  su hash. Los clips se leen cuadro por cuadro (`OffthreadVideo`), así que
  también salen idénticos en cada render.
- `render` guarda en `salida/manifiesto.json` el hash de cada entrada (spec,
  marca, capturas, plantillas, sonidos, música, voz) y una huella cuadro por
  cuadro de cada video. Si las entradas no cambiaron, avisa si el video salió
  idéntico o distinto.

**Pendiente (2026-10-19):** en 6 renders seguidos del 9:16 sin cambios, 5
salieron idénticos cuadro por cuadro y 1 salió distinto (el primero después de
renderizar otro trabajo). El 4:5 salió idéntico siempre. El render lo detecta
y lo avisa; falta encontrar la causa. Si aparece el aviso, renderizar de nuevo
y comparar.

## Zonas seguras

| Formato | Lienzo | Zona segura (x, y, ancho, alto) | Por qué |
|---|---|---|---|
| 9:16 | 1080×1920 | 120, 270, 840, 980 | Reels de Meta: 14 % libre arriba, 35 % abajo y la columna de íconos a la derecha |
| 4:5 | 1080×1350 | 90, 90, 900, 1170 | Feed: margen parejo |

Todo el texto va adentro; el celular puede asomar por debajo porque es decorado.
La hoja de contacto de `qc` dibuja la zona en naranja.

## Licencia de Remotion

Remotion es gratis para personas y empresas chicas, y pide licencia paga a
partir de cierto tamaño de equipo. Revisar sus condiciones antes de ofrecer
esto como servicio a terceros.
