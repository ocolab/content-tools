// Esquemas de todos los archivos del proceso. Es la única fuente de verdad:
// `npm run esquemas` los exporta como JSON Schema a ../esquemas/ para que los
// use cualquier LLM o servicio sin depender de este código.
import { z } from "zod";

const slug = z.string().regex(/^[a-z0-9][a-z0-9-]{1,60}$/, "solo minúsculas, números y guiones");
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "fecha AAAA-MM-DD");
const color = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "color #RRGGBB");
const texto = (max) => z.string().trim().min(1).max(max);

export const FORMATOS = ["9x16", "4x5"];
export const OBJETIVOS = ["reconocimiento", "trafico", "mensajes", "clientes_potenciales", "ventas"];
export const ESTILOS = ["animacion", "avatar", "mixto"];
export const TIPOS = {
  "loop-6s": "animacion",
  explicativo: "animacion",
  "avatar-ugc": "avatar",
  "avatar-pantalla": "avatar",
  "voz-en-off-broll": "avatar",
  dualcast: "avatar",
};
export const TIPOS_DEL_MOTOR = ["loop-6s", "explicativo"];

const Afirmacion = z.strictObject({
  texto: texto(160),
  fuente: texto(240).describe("de dónde sale: archivo, fecha y quién lo aprobó"),
});

// ---------------------------------------------------------------- marca.json
export const ROLES = [
  "fondo", "superficie", "marco", "linea", "texto", "texto_suave", "enfasis", "sobre_enfasis",
  "grafico", "acento", "acento_texto", "boton_fondo", "boton_texto",
];
const Colores = z.strictObject(Object.fromEntries(ROLES.map((r) => [r, color])));
const ColoresParciales = z.strictObject(Object.fromEntries(ROLES.map((r) => [r, color.optional()])));
const Logo = z.strictObject({
  archivo: z.string().regex(/^activos\/.+\.(png|svg)$/),
  ancho: z.number().int().positive(),
  alto: z.number().int().positive(),
});
const Estilo = z.strictObject({
  logo_escala: z.number().min(0.5).max(3).describe("multiplica el alto del logo en todas las plantillas"),
  alineacion: z.enum(["izquierda", "centro"]),
  enfasis: z.enum(["color", "subrayado"]).describe("cómo se marcan las *palabras clave*"),
});
const Variante = z.strictObject({
  nombre: texto(40),
  descripcion: texto(300),
  colores: ColoresParciales.describe("cambios sobre los colores base para lo que va sobre el fondo"),
  colores_superficie: ColoresParciales.describe("paleta de tarjetas, ventanas y pantallas (sobre los colores base)"),
  logo: Logo.nullable().describe("otro logo, por ejemplo la versión clara para fondos oscuros"),
  estilo: Estilo,
});

// De dónde salen los design tokens. Son obligatorios: sin ellos no hay colores
// por rol ni variantes. Las rutas son relativas a clientes/<cliente>/ (pueden
// salir con ../) o URL https.
const archivoFuente = z.string().min(1);
const FuenteTokens = z.discriminatedUnion("tipo", [
  z.strictObject({
    tipo: z.literal("css"),
    archivo: archivoFuente.describe("CSS de la web del cliente con las variables de color; validar compara contra él si lo encuentra"),
    variables: z.record(z.string(), z.string().regex(/^--[a-z0-9-]+$/)).describe("rol de color → nombre de la variable CSS"),
  }),
  z.strictObject({
    tipo: z.literal("brand_book"),
    archivo: archivoFuente.describe("brand book o manual de marca (PDF, imagen o URL) del que se copiaron los colores"),
    detalle: texto(200).nullable().describe("dónde están los colores en el documento, por ejemplo «págs. 12–14, paleta principal»"),
  }),
]);

export const Marca = z.strictObject({
  version: z.literal(1),
  cliente: slug,
  nombre: texto(80),
  fuente_tokens: FuenteTokens.describe("obligatorio: la web del cliente (css) o su brand book (brand_book)"),
  colores: Colores,
  paleta: z
    .array(z.strictObject({ nombre: texto(40), color }))
    .optional()
    .describe("otros colores del cliente sin rol (paleta secundaria): las variantes también pueden usarlos"),
  tipografia: z.strictObject({
    familia: texto(60),
    archivo: z.string().regex(/^activos\/.+\.(ttf|otf|woff2?)$/),
    pesos: z.string().regex(/^\d{3}( \d{3})?$/),
    peso_texto: z.number().int(),
    peso_ui: z.number().int(),
    peso_titulo: z.number().int(),
    peso_enfasis: z.number().int(),
    tracking_titulo: z.string(),
  }),
  forma: z.strictObject({
    radio: z.number().min(0).max(48),
    borde: z.number().min(0).max(4),
    sombra: z.string(),
  }),
  logo: Logo,
  estilo: Estilo.optional().describe("estilo base; sin esto: logo_escala 1, izquierda, color"),
  variantes: z.record(slug, Variante).optional().describe("direcciones visuales para las propuestas (paso 4b)"),
  reglas_visuales: z.array(texto(200)),
  voz: z.strictObject({
    idioma: z.string(),
    trato: z.enum(["vos", "tu", "usted"]),
    acento_prompt: texto(200).describe("línea de acento que se agrega a los prompts de voz y video"),
    elevenlabs_voice_id: z.string().nullable(),
    elevenlabs_modelo: z.string(),
    elevenlabs_etiqueta: z.string().nullable().optional().describe("etiqueta que se antepone al texto en eleven_v3/v4, por ejemplo el acento; no se pronuncia"),
  }),
  copy: z.strictObject({
    prohibidas: z.array(z.string().min(2)).describe("palabras o frases que no pueden aparecer en ningún texto ni en la voz"),
    afirmaciones: z.array(Afirmacion).describe("lo único que se puede afirmar; toda cifra tiene que estar acá"),
    cta_aprobados: z.array(texto(40)),
  }),
});

// ---------------------------------------------------------------- brief.json
export const Brief = z
  .strictObject({
    version: z.literal(1),
    cliente: slug,
    id: slug,
    fecha: fecha,
    servicio: texto(160).describe("qué se vende en este anuncio"),
    objetivo: z.strictObject({
      campana: z.enum(OBJETIVOS),
      accion: texto(160).describe("qué tiene que hacer quien ve el anuncio"),
      destino: texto(200).describe("WhatsApp, URL o formulario"),
    }),
    publico: z.strictObject({
      quien: texto(200),
      dolor: texto(240),
      zona: z.string().nullable(),
    }),
    estilo: z.enum(ESTILOS),
    avatar: z
      .strictObject({
        origen: z.enum(["generado", "persona_real_con_permiso"]),
        descripcion: texto(300),
        voz: texto(240),
        acento: texto(200),
      })
      .nullable(),
    plataformas: z
      .array(z.enum(["instagram_reels", "instagram_feed", "instagram_stories", "facebook_feed", "facebook_reels", "facebook_stories", "tiktok"]))
      .min(1),
    formatos: z.array(z.enum(FORMATOS)).min(1),
    duracion_max: z.number().int().min(5).max(60),
    musica: z.enum(["sin_musica", "biblioteca_meta", "archivo_propio", "generada"]),
    tipo: z.enum(Object.keys(TIPOS)).nullable().describe("se completa en el paso 3"),
    notas: z.string().nullable(),
  })
  .superRefine((b, ctx) => {
    if (b.estilo !== "animacion" && !b.avatar)
      ctx.addIssue({ code: "custom", path: ["avatar"], message: "con estilo avatar o mixto hay que describir el avatar" });
    if (b.estilo === "animacion" && b.avatar)
      ctx.addIssue({ code: "custom", path: ["avatar"], message: "con estilo animación el avatar va en null" });
    if (b.tipo && b.estilo !== "mixto" && TIPOS[b.tipo] !== b.estilo)
      ctx.addIssue({ code: "custom", path: ["tipo"], message: `el tipo ${b.tipo} es de ${TIPOS[b.tipo]}, no de ${b.estilo}` });
  });

// ---------------------------------------------------------------- copy.json
export const Copy = z.strictObject({
  version: z.literal(1),
  aprobado: z.boolean().describe("true solo cuando el cliente eligió y aprobó"),
  metodo: texto(120).describe("cómo se propuso: «skill cro» o «catalogo/prompts/copy.md»"),
  propuesta_valor: texto(200),
  angulos: z
    .array(z.strictObject({ nombre: texto(40), gancho: texto(90), por_que: texto(240) }))
    .min(2)
    .max(5),
  elegido: z.strictObject({
    angulo: texto(40),
    gancho: texto(90),
    titulo: z.array(texto(40)).min(1).max(3),
    puntos: z.array(texto(60)).max(6),
    guion: z.array(z.strictObject({ escena: texto(40), texto: texto(160) })).max(10),
    boton: texto(40),
  }),
  afirmaciones_usadas: z.array(z.string()),
});

// ---------------------------------------------------------------- spec.json (motor)
const Captura = z.strictObject({
  origen: z.string().min(1).describe("URL https o ruta relativa a la carpeta del kit (con ../ se sale de ella)"),
  archivo: z.string().regex(/^capturas\/[a-z0-9-]+\.png$/),
  ancho: z.number().int().min(320).max(1600),
  alto: z.number().int().min(400).max(6000),
  escala: z.union([z.literal(1), z.literal(2)]),
});
const AudioSpec = z.strictObject({
  musica: z.string().regex(/^musica\/.+\.(mp3|wav|m4a)$/).nullable(),
  efectos: z.boolean(),
});
const Base = {
  version: z.literal(1),
  cliente: slug,
  id: slug,
  formatos: z.array(z.enum(FORMATOS)).min(1),
  capturas: z.array(Captura),
  audio: AudioSpec,
  visual: z.strictObject({ variante: slug }).optional().describe("variante de marca.json elegida en las propuestas"),
};
const ruta = z.string().regex(/^capturas\/[a-z0-9-]+\.png$/);
export const archivoClip = z.string().regex(/^activos\/[a-z0-9-]+\.mp4$/, "un MP4 en activos/ del trabajo, por ejemplo activos/gancho.mp4");
const linea = (max) => texto(max).describe("*asteriscos* marcan el énfasis");

const Par = z.strictObject({ es: texto(28), en: texto(28) });
const Maqueta = z.strictObject({
  sitio: texto(28),
  titulo: z.strictObject({ es: texto(40), en: texto(40) }),
  partes: z.array(Par).min(2).max(4),
});

export const SpecLoop = z.strictObject({
  ...Base,
  plantilla: z.literal("loop-6s"),
  contenido: z.strictObject({
    eyebrow: texto(32),
    titulo: z.array(linea(24)).min(1).max(3),
    items: z.array(texto(26)).min(3).max(5),
    captura: ruta.optional().describe("captura de un trabajo real; va esta o «maqueta», no las dos"),
    maqueta: z.lazy(() => Maqueta).optional().describe("web genérica que cambia de español a inglés, en lugar de una captura"),
    etiqueta_captura: texto(40),
    boton: texto(26),
  }),
});

const voz = texto(180).describe("lo que dice la voz en off en esta escena");
const duracion = z.number().min(1.5).max(8).optional().describe("segundos; obligatorio si no hay voz grabada");
const Escena = z.discriminatedUnion("tipo", [
  z.strictObject({ tipo: z.literal("gancho"), texto: texto(44), destacado: texto(30).optional(), voz, duracion }),
  z.strictObject({
    tipo: z.literal("buscador"),
    consulta: texto(36),
    resultados: z.array(texto(28)).min(2).max(4),
    faltante: texto(26).optional(),
    voz,
    duracion,
  }),
  z.strictObject({ tipo: z.literal("armado"), sitio: texto(28), partes: z.array(texto(18)).min(2).max(4), voz, duracion }),
  z.strictObject({ tipo: z.literal("capturas"), archivos: z.array(ruta).min(1).max(3), etiqueta: texto(40), voz, duracion }),
  z.strictObject({ tipo: z.literal("lista"), items: z.array(texto(24)).min(2).max(4), voz, duracion }),
  z.strictObject({
    tipo: z.literal("bilingue"),
    sitio: texto(28),
    titulo: z.strictObject({ es: texto(40), en: texto(40) }),
    partes: z.array(Par).min(2).max(4),
    voz,
    duracion,
  }),
  z.strictObject({ tipo: z.literal("cierre"), titulo: texto(72), boton: texto(26), voz, duracion }),
  z.strictObject({
    tipo: z.literal("clip"),
    archivo: archivoClip.describe("clip de avatar o b-roll (npm run clip); tiene que estar registrado en activos.json"),
    voz,
    duracion,
    encuadre: z.number().min(0).max(100).optional().describe("dónde se recorta el clip si no tiene la forma del lienzo, en %: 0 = se ve la parte de arriba, 100 = la de abajo; por defecto 40"),
    audio_del_clip: z.boolean().optional().describe("true: suena el audio del clip (solo en videos sin voz en off). Por defecto el clip va mudo y suena la toma de voz"),
  }),
]);

export const SpecExplicativo = z.strictObject({
  ...Base,
  plantilla: z.literal("explicativo"),
  voz: z.strictObject({ usar: z.boolean() }),
  contenido: z.strictObject({ escenas: z.array(Escena).min(3).max(8) }),
});

export const Spec = z.discriminatedUnion("plantilla", [SpecLoop, SpecExplicativo]);

// ---------------------------------------------------------------- plan-avatar.json
const Generacion = z.strictObject({
  herramienta: texto(60).describe("modelo o servicio; ver catalogo/herramientas.md"),
  prompt: texto(4000),
  referencias: z.array(z.string()).describe("archivos de entrada, en el orden en que el prompt los nombra (imagen 1, imagen 2…)"),
  salida: z.string().describe("archivo que se espera en activos/"),
});
export const PlanAvatar = z.strictObject({
  version: z.literal(1),
  cliente: slug,
  id: slug,
  tipo: z.enum(["avatar-ugc", "avatar-pantalla", "voz-en-off-broll", "dualcast"]),
  personaje: z.strictObject({
    descripcion: texto(400),
    hoja_de_personaje: Generacion.nullable().describe("imagen maestra 3x3 para mantener la cara idéntica"),
    voz: texto(240),
    acento: texto(200),
  }),
  escenas: z
    .array(
      z.strictObject({
        id: slug,
        clase: z.enum(["a_camara", "pantalla", "broll", "dualcast"]),
        guion: z.string().nullable().describe("lo que dice; null si la escena no habla"),
        imagen: Generacion,
        video: Generacion,
        duracion: z.number().min(2).max(15),
      })
    )
    .min(1)
    .max(10),
  aviso_ia: z.literal(true).describe("el anuncio declara contenido generado con IA donde la plataforma lo pida"),
});

// ---------------------------------------------------------------- activos.json
export const Activos = z.strictObject({
  version: z.literal(1),
  activos: z.array(
    z.strictObject({
      archivo: z.string(),
      clase: z.enum(["voz", "palabras", "imagen", "video", "musica", "captura"]),
      herramienta: z.string(),
      modelo: z.string().nullable(),
      parametros: z.record(z.string(), z.unknown()),
      prompt: z.string().nullable(),
      texto_sha256: z.string().nullable().describe("hash del texto que se generó (voz); si cambia el texto, el activo queda viejo"),
      sha256: z.string(),
      fecha: fecha,
      aprobado: z.boolean(),
    })
  ),
});

// ---------------------------------------------------------------- requisitos.json (raíz del kit)
export const CUANDO = {
  siempre: "siempre",
  copy: "mientras el copy no esté aprobado",
  voz_en_off: "si el video lleva voz en off",
  avatar: "si el anuncio lleva avatar",
  dualcast: "si el anuncio es dualcast (dos voces)",
  publicar: "si el video se sube desde acá",
};
export const Requisitos = z.strictObject({
  version: z.literal(1),
  requisitos: z.array(
    z.strictObject({
      id: slug,
      nombre: texto(80),
      tipo: z
        .enum(["local", "clave", "skill", "mcp", "externo"])
        .describe("local: programa en la máquina; clave: variable de entorno con la clave de una API (se revisa que exista, nunca se muestra); skill: skill de Claude; mcp: conector que tiene que estar conectado en el agente; externo: herramienta fuera del kit"),
      cuando: z.enum(Object.keys(CUANDO)).describe("en qué trabajos hace falta"),
      obligatorio: z.boolean().describe("true: sin esto el paso no se puede hacer como está escrito"),
      pasos: z.array(z.number().int().min(1).max(8)),
      para: texto(200),
      herramientas: z.array(z.string()).describe("comandos, skills, herramientas MCP o (tipo clave) nombres de variables de entorno; las MCP se buscan por el final del nombre, porque el prefijo cambia en cada instalación"),
      como_conectar: texto(400),
      si_falta: texto(500).describe("qué hace el agente: avisar, pedir que se conecte y ofrecer la alternativa"),
      costo: texto(200).nullable(),
    })
  ),
});

export const ESQUEMAS = {
  marca: Marca,
  brief: Brief,
  copy: Copy,
  "spec-loop-6s": SpecLoop,
  "spec-explicativo": SpecExplicativo,
  "plan-avatar": PlanAvatar,
  activos: Activos,
  requisitos: Requisitos,
};
