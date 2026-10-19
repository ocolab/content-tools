// Tipos de los props que reciben las plantillas. Reflejan scripts/esquemas.mjs,
// que es la fuente de verdad (y se valida antes de cada render).

export type Formato = "9x16" | "4x5";

export type Colores = {
  fondo: string;
  superficie: string;
  marco: string;
  linea: string;
  texto: string;
  texto_suave: string;
  enfasis: string;
  sobre_enfasis: string;
  grafico: string;
  acento: string;
  acento_texto: string;
  boton_fondo: string;
  boton_texto: string;
};

export type Estilo = { logo_escala: number; alineacion: "izquierda" | "centro"; enfasis: "color" | "subrayado" };

/** Marca ya combinada con la variante elegida (scripts/comun.mjs › aplicarVariante). */
export type Marca = {
  cliente: string;
  nombre: string;
  colores_superficie: Colores;
  estilo: Estilo;
  colores: {
    fondo: string;
    superficie: string;
    marco: string;
    linea: string;
    texto: string;
    texto_suave: string;
    enfasis: string;
    sobre_enfasis: string;
    grafico: string;
    acento: string;
    acento_texto: string;
    boton_fondo: string;
    boton_texto: string;
  };
  tipografia: {
    familia: string;
    archivo: string;
    pesos: string;
    peso_texto: number;
    peso_ui: number;
    peso_titulo: number;
    peso_enfasis: number;
    tracking_titulo: string;
  };
  forma: { radio: number; borde: number; sombra: string };
  logo: { archivo: string; ancho: number; alto: number };
};

export type Captura = { origen: string; archivo: string; ancho: number; alto: number; escala: 1 | 2 };
export type AudioSpec = { musica: string | null; efectos: boolean };

type Base = {
  version: 1;
  cliente: string;
  id: string;
  formatos: Formato[];
  capturas: Captura[];
  audio: AudioSpec;
};

export type Par = { es: string; en: string };
export type Maqueta = { sitio: string; titulo: Par; partes: Par[] };

export type SpecLoop = Base & {
  plantilla: "loop-6s";
  contenido: {
    eyebrow: string;
    titulo: string[];
    items: string[];
    captura?: string;
    maqueta?: Maqueta;
    etiqueta_captura: string;
    boton: string;
  };
};

type ConVoz = { voz: string; duracion?: number };
export type EscenaGancho = ConVoz & { tipo: "gancho"; texto: string; destacado?: string };
export type EscenaBuscador = ConVoz & { tipo: "buscador"; consulta: string; resultados: string[]; faltante?: string };
export type EscenaArmado = ConVoz & { tipo: "armado"; sitio: string; partes: string[] };
export type EscenaCapturas = ConVoz & { tipo: "capturas"; archivos: string[]; etiqueta: string };
export type EscenaLista = ConVoz & { tipo: "lista"; items: string[] };
export type EscenaBilingue = ConVoz & { tipo: "bilingue"; sitio: string; titulo: Par; partes: Par[] };
export type EscenaCierre = ConVoz & { tipo: "cierre"; titulo: string; boton: string };
export type EscenaClip = ConVoz & { tipo: "clip"; archivo: string; encuadre?: number; audio_del_clip?: boolean };
export type Escena = EscenaGancho | EscenaBuscador | EscenaArmado | EscenaCapturas | EscenaLista | EscenaBilingue | EscenaCierre | EscenaClip;

export type SpecExplicativo = Base & {
  plantilla: "explicativo";
  voz: { usar: boolean };
  contenido: { escenas: Escena[] };
};

export type Palabra = { texto: string; inicio: number; fin: number };

export type PropsLoop = { spec: SpecLoop; marca: Marca };
/** Segundos de cada clip (archivo → duración), medidos con ffprobe antes del render. */
export type DuracionesClip = Record<string, number>;
export type PropsExplicativo = { spec: SpecExplicativo; marca: Marca; palabras: Palabra[] | null; clips?: DuracionesClip };
