# explicativo · animación con voz en off

**Qué es:** de 15 a 30 segundos en escenas: problema → solución → prueba →
condiciones → botón. Interfaz animada, subtítulos palabra por palabra y voz en
off opcional (sin voz, cada escena dura lo que dice su `duracion`).

**Cuándo:** mensajes o clientes potenciales; cuando hay que mostrar el problema
antes que la solución.

## Escenas disponibles

| Tipo | Qué se ve | Campos |
|---|---|---|
| `gancho` | Frase grande palabra por palabra; segunda línea destacada | `texto` ≤ 44, `destacado` ≤ 30 |
| `buscador` | Un buscador escribe la consulta, aparecen resultados y, al final, lo que falta | `consulta` ≤ 36, `resultados` 2–4, `faltante` |
| `armado` | Una web se arma en un navegador, sección por sección, con tildes | `sitio`, `partes` 2–4 |
| `capturas` | Un celular con trabajos reales que se desplazan | `archivos` 1–3, `etiqueta` |
| `lista` | Puntos grandes con tilde | `items` 2–4 |
| `cierre` | Logo, título y botón | `titulo` ≤ 60, `boton` |

Cada escena lleva `voz`, lo que dice la voz en off. `gancho`, `lista` y
`cierre` no muestran subtítulos: su texto en pantalla ya es el mensaje.

## Estructura recomendada (≈ 22 s)

1. `gancho` (3 s): el problema como pregunta.
2. `buscador` (4 s): el problema en una escena concreta.
3. `armado` (4 s): la solución.
4. `capturas` (3,5 s): la prueba.
5. `lista` (3,5 s): condiciones que bajan el riesgo.
6. `cierre` (3 s): marca, título y botón.

## Producción

1. `npm run nuevo -- <cliente>/<id> --tipo explicativo`.
2. Pasar el guion del copy aprobado a las escenas.
3. `npm run capturar`.
4. Voz en off (opcional): [prompts/voz.md](../prompts/voz.md) y después
   `"voz": { "usar": true }`.
5. `npm run validar` → `npm run render` → `npm run qc`.

Spec de partida: [motor/ejemplos/explicativo.json](../../motor/ejemplos/explicativo.json).
