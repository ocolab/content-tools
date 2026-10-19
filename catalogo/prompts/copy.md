# Prompt de copy

Paso 3 del proceso. **Con Claude** se usa la skill `cro`: se le pasa el brief y
las reglas de copy de la marca, y se le pide propuesta de valor, ángulos,
titular y botón **para un anuncio en video** (la skill está pensada para
páginas; el pedido tiene que decir que es un anuncio). Ojo: `cro` lee
`.agents/product-marketing.md` si existe; si ese archivo está desactualizado,
decirle explícitamente que use el brief y `marca.json` en su lugar.

**Con cualquier otro modelo**, este prompt hace lo mismo (los criterios son los
de la skill `cro`, adaptados a anuncios). Se completa con el contenido real de
`brief.json` y `marca.json`.

```text
You are a conversion copywriter for short vertical video ads on Instagram,
Facebook and TikTok. Write in {{marca.voz.idioma}}, addressing the viewer with
«{{marca.voz.trato}}».

BRIEF
{{brief.json}}

BRAND RULES (hard constraints)
- Never use these words or phrases: {{marca.copy.prohibidas}}
- You may only state these claims, and nothing else that sounds like a fact,
  number, result, client or testimonial: {{marca.copy.afirmaciones}}
- Prefer one of these call-to-action buttons: {{marca.copy.cta_aprobados}}

CONVERSION CHECKS (apply all of them)
1. Five-second clarity: from the hook alone, someone scrolling understands what
   is offered and who it is for.
2. Outcome before feature: lead with what changes for the buyer, in their words.
3. Specific, not vague: concrete scenes and details, taken only from the
   allowed claims. Never invent numbers, clients, results or quotes.
4. One action: a single button that says what happens when tapped (not
   "Submit" or "Learn more"), consistent with the objective
   «{{brief.objetivo.campana}}» and the destination «{{brief.objetivo.destino}}».
5. Customer language: the words the audience in the brief would use; no jargon.
6. Handle the main objection implied by the audience's pain.
7. One idea per ad.

OUTPUT
Return only JSON that matches esquemas/copy.schema.json:
- "propuesta_valor": one sentence.
- "angulos": three clearly different angles (for example pain, outcome,
  contrast), each with "nombre", "gancho" (max 90 characters, works with the
  sound off) and "por_que".
- "elegido": the strongest angle, with "titulo" (1 to 3 lines of max 24
  characters), "puntos" (max 26 characters each), "guion" (one line per scene
  for a {{brief.duracion_max}}-second video; numbers written as words) and
  "boton".
- "afirmaciones_usadas": the exact allowed claims you relied on.
- "aprobado": false, "metodo": "catalogo/prompts/copy.md", "version": 1.
```

Después: el cliente elige (puede mezclar ángulos), se corrige a mano lo que
haga falta, se pone `"aprobado": true` y se corre `npm run validar`.
