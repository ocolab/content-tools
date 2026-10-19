# Voz

Dos usos distintos:

- **Voz en off y voz del avatar** (el explicativo, el b-roll y el avatar que
  habla con lip-sync): se genera aparte con una herramienta de texto a voz
  (hoy ElevenLabs), **una toma para todo el anuncio**, y se monta en el motor.
  Para el avatar, `npm run clip` corta de esa toma el tramo de cada escena.
- **Voz dentro de un modelo de video** (el modelo habla solo, por ejemplo Veo
  en Google Flow): se describe con la fórmula de abajo, en el prompt de video.

## Cómo se describe una voz

Una línea `Voice:` con cinco rasgos, siempre en el mismo orden. Se elige uno
de cada columna (o se escribe otro parecido):

| Quién | Edad | Altura | Textura | Forma de hablar |
|---|---|---|---|---|
| a man / a woman | around 25 / around 35 / around 45 / around 55 | low pitch / mid pitch / high pitch | smooth / husky / airy / clean tone | unhurried and assured / warm and chatty / brisk and lively / steady and reassuring |

```text
Voice: {{quién}} {{edad}}, {{altura}}, {{textura}}, {{forma de hablar}}.
```

Ejemplos:

| Para | Línea |
|---|---|
| Dueño de pyme, cercano | Voice: a man around 45, mid pitch, smooth, warm and chatty. |
| Profesional, segura | Voice: a woman around 35, mid pitch, clean tone, unhurried and assured. |
| Joven, con energía | Voice: a woman around 25, high pitch, airy, brisk and lively. |
| Mayor, de confianza | Voice: a man around 55, low pitch, husky, steady and reassuring. |

## Acento

Va después de la línea `Voice:` en cualquier prompt con voz. El de cada
cliente se guarda en `marca.json › voz.acento_prompt` y no se cambia entre
clips.

| Acento | Línea |
|---|---|
| Rioplatense (Buenos Aires) | Rioplatense Spanish as spoken in Buenos Aires, where «ll» and «y» sound like «sh». |
| Latino neutro | Neutral Latin American Spanish, without strong regional features. |
| México (Ciudad de México) | Spanish as spoken in Mexico City. |
| Colombia (Bogotá) | Spanish as spoken in Bogotá, clear and even. |
| España (Madrid) | Castilian Spanish from Madrid, relaxed and conversational. |
| Inglés EE. UU. | General American English, friendly and neutral. |

## Voz en off con ElevenLabs (paso 5 del explicativo)

**Requiere el conector MCP de ElevenLabs** (ver
[REQUISITOS.md](../../REQUISITOS.md)): comprobá que esté antes de empezar y,
si no está, avisá y ofrecé las alternativas del final.

La generación no da dos veces lo mismo, así que se hace **una vez** y queda
fijada en `activos.json`.

1. **Voz de la marca** (una sola vez por cliente): buscar con
   `creative_list_voices` (idioma `es`, uso `advertisement`, y la descripción
   del brief); escuchar dos o tres; guardar el `voice_id` elegido en
   `marca.json › voz.elevenlabs_voice_id`. Desde ahí, siempre esa.
2. **Texto exacto**: `npm run voz -- <cliente>/<id> texto`. Es la unión de las
   líneas `voz` de cada escena. Los números van **en palabras** («siete días»)
   para que se lean bien; el validador igual exige que la cifra esté en las
   afirmaciones.
3. **Costo primero**: `creative_generate_speech` con `estimate_only: true`, y
   pedir OK al cliente.
4. **Generar una toma**: crear un flow (`creative_create_flow`), y en ese flow
   `creative_generate_speech` con el texto exacto, el `voice_id` de la marca,
   el modelo de `marca.json › voz.elevenlabs_modelo` y `generations_count: 1`.
   Esperar con `creative_get_flow_run_status`. No reintentar llamando de nuevo:
   cobra otra generación.
5. **Tiempos por palabra**: en el mismo flow, `creative_transcribe_audio` con
   `connect_from` = el nodo de la voz. Devuelve cada palabra con inicio y fin.
6. **Registrar**: bajar el audio y la lista de palabras y correr
   `npm run voz -- <cliente>/<id> registrar --audio <archivo|url> --palabras <archivo|url> --herramienta elevenlabs --modelo <modelo> --voz <voice_id>`.
7. Poner `"voz": { "usar": true }` en `spec.json` y validar. Si después cambia
   una sola palabra del guion, el validador lo detecta y hay que volver al punto 3.

Con otra herramienta de voz el procedimiento es el mismo: una toma, una
transcripción con tiempos por palabra y `npm run voz -- … registrar`.

**Con avatar** el procedimiento es el mismo, con el `spec.json` de montaje:
el texto es la unión de las líneas `voz` de sus escenas (las `clip` dicen el
guion de su escena del plan). Después, `npm run clip` usa el tramo de esta
toma para cada escena que habla. Si la toma se genera de nuevo, los clips de
lip-sync hechos con la anterior hay que generarlos otra vez (`validar` lo
marca).
