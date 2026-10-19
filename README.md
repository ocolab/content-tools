# Fábrica de creativos

Un proceso repetible para hacer anuncios en video (Reels, historias, feed,
TikTok) a partir de lo que pide una empresa: perfil del cliente → brief → copy
→ tipo de anuncio → activos → montaje → control de calidad → **rutina diaria**
con el setup ya hecho. Funciona con
cualquier modelo de lenguaje, trae una skill para Claude y un motor de
animación en Remotion.

El kit **no trae datos de ninguna empresa**. La primera vez que se usa con un
cliente, el proceso le pregunta lo que necesita (colores de su web o de su
brand book, logo, tipografía, voz y reglas de copy) y arma su perfil.

**Empezá por [PROCESO.md](PROCESO.md).**

> **Requisitos:** Node 22, ffmpeg y, según el anuncio, **conectores MCP**
> (ElevenLabs para la voz en off, un generador de imágenes para el avatar,
> Meta Ads para subir) y la clave de fal.ai en la variable de entorno
> `FAL_KEY` para generar los clips de avatar. `npm run requisitos -- <cliente>/<id>` dice cuáles
> necesita cada trabajo; el agente que corre el proceso tiene que comprobarlos
> y avisar si falta alguno antes del paso. Ver [REQUISITOS.md](REQUISITOS.md).
> No hace falta que el cliente tenga web: los design tokens pueden salir de su
> brand book.

## Primeros pasos

```bash
cd motor
npm ci                      # versiones exactas del package-lock
npm run sonidos             # efectos de sonido (una vez)
npm run requisitos          # qué falta en esta máquina y qué conectores hacen falta
npm run cliente -- mi-cliente --tokens brand_book    # perfil del cliente, para completar con sus respuestas
npm run nuevo -- mi-cliente/primer-video --tipo loop-6s
```

Con el primer video de una empresa terminado, el kit propone producir todos
los días con ese mismo setup (`npm run rutina -- mi-cliente proponer`, paso 9
de PROCESO.md). Cada empresa decide qué piezas, qué días, qué temas, cuánto
gastar y cómo aprueba.

Después se sigue [PROCESO.md](PROCESO.md) paso por paso. Con Claude, la
carpeta [claude/](claude/SKILL.md) es la skill: se copia o se enlaza como
`.claude/skills/fabrica-creativos/` en el proyecto donde se va a usar.

## Qué hay en cada carpeta

| Carpeta o archivo | Qué es | ¿Depende de un modelo? |
|---|---|---|
| [PROCESO.md](PROCESO.md) | Los 9 pasos, qué entra y qué sale de cada uno, quién aprueba, y la rutina diaria | No |
| [REQUISITOS.md](REQUISITOS.md) y [requisitos.json](requisitos.json) | Programas, skills y conectores MCP que hacen falta, cuándo, y qué hacer si faltan | No |
| [preguntas.md](preguntas.md) | Las preguntas del perfil del cliente y del brief, en orden | No |
| [esquemas/](esquemas/) | JSON Schema de cada archivo del proceso: el contrato | No |
| [clientes/](clientes/LEEME.md) | Cómo se arma el perfil de cada cliente. Los perfiles no se publican | No |
| [catalogo/](catalogo/LEEME.md) | Tipos de anuncio, prompts de imagen, video, voz y copy, y herramientas por etapa | No |
| [motor/](motor/LEEME.md) | Plantillas animadas en Remotion + scripts de validación, render y control de calidad | No (código) |
| `trabajos/<cliente>/<id>/` | Un trabajo: brief, copy, spec o plan, activos, salida, qc. No se publica | — |
| [claude/SKILL.md](claude/SKILL.md) | La skill que hace que Claude siga el proceso | Claude |

## Por qué así

- **Reproducible:** cada paso deja un archivo validado; el motor de animación
  da el mismo video con las mismas entradas (versiones fijas, sin azar, 30 fps,
  navegador fijo), y lo comprueba comparando hashes.
- **Confiable:** `npm run validar` frena antes de gastar: perfil o copy sin
  completar o sin aprobar, palabras prohibidas, cifras sin fuente, voz que ya
  no coincide con el guion, música sin licencia, colores que no son del
  cliente.
- **Portable:** el copy, los planes y los prompts son texto y JSON; lo único
  atado a código es el motor, y corre solo con Node y ffmpeg.

## Estado

| Parte | Estado |
|---|---|
| Proceso, preguntas, esquemas, requisitos | Listos |
| Motor: `loop-6s` y `explicativo` | Listos y probados |
| Tipos con avatar | Prompts y fichas listos; `npm run clip` genera los clips en fal.ai (lip-sync con la toma de voz y b-roll) o registra los hechos afuera. Probado sin generar: todavía no se pagó un clip real |
| Montaje de clips de avatar en el motor | Listo y probado con clips locales (escena `clip` del explicativo). El dualcast se monta en un editor |
| Rutina diaria por empresa (`npm run rutina`) | Lista: se propone después del primer video, cada empresa define piezas, días, temas, tope y aprobación |
| Render idéntico en el 9:16 | 1 de 6 renders seguidos salió distinto; el render lo avisa (ver [motor/LEEME.md](motor/LEEME.md)) |

## Licencias y créditos

- El código y los textos del kit: [LICENSE](LICENSE).
- Remotion tiene su propia licencia: es gratis para personas y empresas chicas
  y pide una paga a partir de cierto tamaño (ver [motor/LEEME.md](motor/LEEME.md)).
- La tipografía y el logo de cada cliente son suyos, con su propia licencia.
- De dónde salen las técnicas de los prompts: [catalogo/fuentes.md](catalogo/fuentes.md).
