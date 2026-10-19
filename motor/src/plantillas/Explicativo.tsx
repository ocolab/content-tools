// Explicativo de 15–30 s: escenas encadenadas con voz en off y subtítulos
// palabra por palabra. Duración y cortes salen de tiemposExplicativo().
import React from "react";
import { Html5Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Efecto, Lienzo, Logo, Musica, ZonaSegura } from "../componentes/Base";
import { Armado, Bilingue, Buscador, Capturas, Cierre, Gancho, Lista } from "../escenas/Escenas";
import { ConMarca, estiloEnfasis, useMarca } from "../marca";
import { LIENZOS, PalabraEnCuadros, entrada, lineal, tiemposExplicativo, useFormato } from "../tiempo";
import type { Escena, PropsExplicativo } from "../tipos";

// Las escenas cuyo texto en pantalla ya es el mensaje no llevan subtítulos.
const SIN_SUBTITULOS: Escena["tipo"][] = ["gancho", "lista", "cierre"];
const ALTO_SUBTITULOS = 190;
const ALTO_ENCABEZADO = 96;

/** Agrupa las palabras de a 3 (o menos si el grupo pasa de 22 letras o termina una frase). */
export const agrupar = (palabras: PalabraEnCuadros[]) => {
  const grupos: PalabraEnCuadros[][] = [];
  let actual: PalabraEnCuadros[] = [];
  for (const p of palabras) {
    const largo = [...actual, p].map((x) => x.texto).join(" ").length;
    if (actual.length && (actual.length >= 3 || largo > 22)) {
      grupos.push(actual);
      actual = [];
    }
    actual.push(p);
    if (/[.!?…:,;]$/.test(p.texto)) {
      grupos.push(actual);
      actual = [];
    }
  }
  if (actual.length) grupos.push(actual);
  return grupos;
};

const Subtitulos: React.FC<{ palabras: PalabraEnCuadros[]; tam: number }> = ({ palabras, tam }) => {
  const frame = useCurrentFrame();
  const m = useMarca();
  const grupos = agrupar(palabras);
  const grupo = [...grupos].reverse().find((g) => g[0].desde <= frame);
  if (!grupo) return null;
  return (
    <div style={{ textAlign: "center", fontSize: tam, lineHeight: 1.15, fontWeight: m.tipografia.peso_titulo, letterSpacing: "-0.01em" }}>
      {grupo.map((p, i) => (
        <span key={i} style={frame >= p.desde && frame < p.hasta ? { ...estiloEnfasis(m), fontWeight: m.tipografia.peso_titulo } : { color: m.colores.texto }}>
          {p.texto}
          {i < grupo.length - 1 ? " " : ""}
        </span>
      ))}
    </div>
  );
};

const Marco: React.FC<{ escena: Escena; frames: number; palabras: PalabraEnCuadros[]; primera: boolean; props: PropsExplicativo }> = ({
  escena,
  frames,
  palabras,
  primera,
  props,
}) => {
  const frame = useCurrentFrame();
  const formato = useFormato();
  const marca = useMarca();
  const zona = LIENZOS[formato].segura;
  const conSubtitulos = !SIN_SUBTITULOS.includes(escena.tipo);
  const conEncabezado = escena.tipo !== "cierre";
  const area = {
    w: zona.w,
    h: zona.h - (conSubtitulos ? ALTO_SUBTITULOS : 0) - (conEncabezado ? ALTO_ENCABEZADO : 0),
  };
  const aparece = entrada(frame, 0, 6);
  // Deriva lenta durante toda la escena: siempre hay algo en movimiento.
  const deriva = lineal(frame, 0, frames, 1, 1.025);
  const efectos = props.spec.audio.efectos;
  const comunes = { area, frames, efectos };
  return (
    <ZonaSegura>
      {conEncabezado && (
        <div style={{ height: ALTO_ENCABEZADO, display: "flex", alignItems: "flex-start", justifyContent: marca.estilo.alineacion === "centro" ? "center" : "flex-start" }}>
          <Logo alto={formato === "9x16" ? 40 : 42} />
        </div>
      )}
      <div style={{ opacity: aparece, transform: `translateY(${(1 - aparece) * 24}px) scale(${deriva})`, transformOrigin: "50% 50%" }}>
        {escena.tipo === "gancho" && <Gancho escena={escena} {...comunes} />}
        {escena.tipo === "buscador" && <Buscador escena={escena} {...comunes} />}
        {escena.tipo === "armado" && <Armado escena={escena} {...comunes} />}
        {escena.tipo === "capturas" && <Capturas escena={escena} capturas={props.spec.capturas} {...comunes} />}
        {escena.tipo === "lista" && <Lista escena={escena} {...comunes} />}
        {escena.tipo === "bilingue" && <Bilingue escena={escena} {...comunes} />}
        {escena.tipo === "cierre" && <Cierre escena={escena} {...comunes} />}
      </div>
      {conSubtitulos && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: ALTO_SUBTITULOS, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Subtitulos palabras={palabras} tam={formato === "9x16" ? 54 : 50} />
        </div>
      )}
      {efectos && !primera && <Efecto en={0} sonido="barrido" volumen={0.35} />}
    </ZonaSegura>
  );
};

const Contenido: React.FC<PropsExplicativo> = (props) => {
  const { spec, palabras } = props;
  const t = tiemposExplicativo(spec, palabras);
  const conVoz = Boolean(palabras && palabras.length);
  return (
    <Lienzo>
      {spec.contenido.escenas.map((escena, i) => (
        <Sequence key={i} from={t.escenas[i].desde} durationInFrames={t.escenas[i].frames} name={`${i + 1} · ${escena.tipo}`}>
          <Marco escena={escena} frames={t.escenas[i].frames} palabras={t.escenas[i].palabras} primera={i === 0} props={props} />
        </Sequence>
      ))}
      {conVoz && <Html5Audio src={staticFile("actual/audio/voz.mp3")} />}
      {spec.audio.musica && <Musica archivo={spec.audio.musica} total={t.total} volumen={conVoz ? 0.12 : 0.35} />}
    </Lienzo>
  );
};

export const Explicativo: React.FC<PropsExplicativo> = (props) => (
  <ConMarca marca={props.marca}>
    <Contenido {...props} />
  </ConMarca>
);

export const duracionExplicativo = (props: PropsExplicativo) => tiemposExplicativo(props.spec, props.palabras).total;
