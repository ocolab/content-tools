# Herramientas por etapa

El proceso no depende de ninguna herramienta en particular: cada etapa dice qué
tiene que salir (archivo y registro en `activos.json`) y se puede hacer con
cualquiera de estas opciones. Qué es obligatorio en cada trabajo, y qué hacer
si un conector no está, está en [REQUISITOS.md](../REQUISITOS.md). La columna
«Probado» marca lo que se usó al armar el kit (**2026-10-19**); «✓ sin
generar» quiere decir que el script está probado (estimación, cortes de voz,
registro) pero todavía no se pagó ninguna generación real. En cada
instalación hay que ver qué está conectado (`npm run requisitos`). Precios
de fal.ai leídos el 2026-10-19: `npm run clip` siempre muestra la estimación
antes de gastar.

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
| Avatar que habla (lip-sync: imagen + tramo de la toma de voz) | **HeyGen Avatar 4 en fal.ai** (`npm run clip`, por defecto) | ✓ sin generar | USD 0,10/s, 1080p 9:16. No usa prompt: mueve la cara según el audio; `--estilo stable` o `expressive` |
| Avatar que habla | OmniHuman v2 en fal.ai (`--modelo omnihuman-v2`) | — | USD 0,105/s, 720p; pide 4 s de audio como mínimo (se completa con silencio). Acepta prompt de cámara y gestos |
| Avatar que habla | Kling AI Avatar v2 en fal.ai (`--modelo kling-avatar-v2`) | — | USD 0,056/s, la más barata; hay reportes de boca que «flota» |
| Avatar que habla | Hedra Character-3, HeyGen directo, conector completo de ElevenLabs | — | Sin integrar: se generan afuera y se registran con `npm run clip … registrar`. Hedra es más barato (USD 0,05–0,06/s) con su propia clave |
| Video que habla con su propia voz | Veo 3.1 (Google Flow o Gemini API) | — | Genera la voz él mismo y no acepta un audio: la voz cambia entre clips. Para b-roll sí sirve |
| B-roll (imagen a video, sin hablar) | **Kling 2.5 Turbo Pro en fal.ai** (`npm run clip`, por defecto) | ✓ sin generar | USD 0,35 por 5 s (1080p); solo 5 o 10 s |
| B-roll | Seedance 1.0 Pro Fast en fal.ai (`--modelo seedance-1-pro-fast`) | — | ≈ USD 0,24 por 5 s a 1080p; de 2 a 12 s |
| B-roll | Google Flow (Veo 3.1) a mano | — | Con la suscripción de Google; se registra con `npm run clip … registrar` |
| Música | Biblioteca de sonidos de Meta | — | Para anuncios en Meta; anotar la pista en `LICENCIAS.md` |
| Música | ElevenLabs Music (conector completo) o biblioteca con licencia | — | Anotar la licencia |
| Capturas de sitios | Motor: `npm run capturar` | ✓ | Navegador de versión fija, ancho de celular |
| Montaje de animación | Motor (Remotion + ffmpeg) | ✓ | `npm run render` y `npm run qc` |
| Montaje con clips de avatar | Motor: escena `clip` del explicativo | ✓ | `npm run render`; probado con clips locales, sin generar |
| Montaje del dualcast | CapCut u otro editor | — | Dos voces: el motor no lo monta |
| Publicación | Conector de Meta Ads (`ads_creative_upload_media`) | ✓ | Solo con OK explícito del cliente y creado en pausa |

## Para sumar una herramienta

1. Agregar la fila con su estado y qué hace.
2. Si genera algo, su salida se registra en `activos.json` con herramienta,
   modelo, parámetros y prompt.
3. Si necesita un prompt propio, va a [prompts/](prompts/) con la misma forma
   (plantilla con `{{…}}` y tablas de piezas).
4. Si es un modelo de video de fal.ai, se suma a `MODELOS` en
   `motor/scripts/clip.mjs`: endpoint, si es de lip-sync o b-roll, precio
   (con la fecha en que se leyó), duraciones que acepta y cómo se arma su
   entrada (leerla del esquema del modelo en fal.ai). Con otro proveedor, hace
   falta otra función de envío y su clave en `requisitos.json`.
