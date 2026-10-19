# Herramientas por etapa

El proceso no depende de ninguna herramienta en particular: cada etapa dice qué
tiene que salir (archivo y registro en `activos.json`) y se puede hacer con
cualquiera de estas opciones. Qué es obligatorio en cada trabajo, y qué hacer
si un conector no está, está en [REQUISITOS.md](../REQUISITOS.md). La columna
«Probado» marca lo que se usó al armar el kit (**2026-10-19**); en cada
instalación hay que ver qué está conectado (`npm run requisitos`).

| Etapa | Opción | Probado | Notas |
|---|---|---|---|
| Copy | Cualquier modelo de lenguaje con [prompts/copy.md](prompts/copy.md) | ✓ | — |
| Copy | Claude + skill `cro` | ✓ | Pasarle el brief y `marca.json`; aclarar que es un anuncio |
| Voz en off | ElevenLabs (conector de voz): texto a voz | ✓ | Una toma por guion; ver [prompts/voz.md](prompts/voz.md) |
| Tiempos por palabra | ElevenLabs Scribe (transcripción) | ✓ | Para los subtítulos del explicativo |
| Efectos de sonido | Motor: `npm run sonidos` | ✓ | Fórmulas fijas, sin costo, siempre iguales |
| Efectos de sonido | ElevenLabs (efectos) | ✓ | No determinista: registrar en `activos.json` |
| Imagen con referencias (avatar, retoques, b-roll) | Canva `generate-image` | ✓ | Acepta imágenes de referencia |
| Imagen con referencias | Gemini (imagen), GPT-Image, Flux Kontext, Seedream | — | Sin conectar |
| Video con avatar que habla | Veo, Kling, Seedance, Hedra, HeyGen, OmniHuman, Sora | — | Ninguna conectada. Según su propio aviso, el conector completo de ElevenLabs suma imagen, video y música |
| Música | Biblioteca de sonidos de Meta | — | Para anuncios en Meta; anotar la pista en `LICENCIAS.md` |
| Música | ElevenLabs Music (conector completo) o biblioteca con licencia | — | Anotar la licencia |
| Capturas de sitios | Motor: `npm run capturar` | ✓ | Navegador de versión fija, ancho de celular |
| Montaje de animación | Motor (Remotion + ffmpeg) | ✓ | `npm run render` y `npm run qc` |
| Montaje con clips de avatar | CapCut u otro editor | — | Hasta que el motor monte clips |
| Publicación | Conector de Meta Ads (`ads_creative_upload_media`) | ✓ | Solo con OK explícito del cliente y creado en pausa |

## Para sumar una herramienta

1. Agregar la fila con su estado y qué hace.
2. Si genera algo, su salida se registra en `activos.json` con herramienta,
   modelo, parámetros y prompt.
3. Si necesita un prompt propio, va a [prompts/](prompts/) con la misma forma
   (plantilla con `{{…}}` y tablas de piezas).
