// Escena «clip»: un MP4 (avatar que habla o b-roll) a pantalla completa, con
// el logo y los subtítulos de la marca encima. El clip llega a
// public/actual/activos/ desde scripts/comun.mjs › prepararActual().
import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { Logo } from "../componentes/Base";
import { useMarca } from "../marca";
import { f, lineal } from "../tiempo";
import type { EscenaClip } from "../tipos";

/** Dónde se recorta el clip si no tiene la forma del lienzo (%, 0 = arriba). */
export const ENCUADRE_POR_DEFECTO = 40;

/**
 * El video ocupa todo el lienzo (recortado si no tiene la misma forma). Si el
 * clip es más corto que la escena, queda quieto en su último cuadro. Sin
 * `segundos` (vista previa sin medir) se supone que alcanza para toda la escena.
 */
export const FondoClip: React.FC<{ escena: EscenaClip; frames: number; segundos?: number }> = ({ escena, frames, segundos }) => {
  const frame = useCurrentFrame();
  const m = useMarca();
  const ultimo = segundos === undefined ? frames : Math.max(0, f(segundos) - 1);
  // Acercamiento lento: algo se mueve aunque el clip sea casi quieto.
  const escala = lineal(frame, 0, frames, 1, 1.03);
  const video = (
    <OffthreadVideo
      src={staticFile(`actual/${escena.archivo}`)}
      muted={!escena.audio_del_clip}
      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `50% ${escena.encuadre ?? ENCUADRE_POR_DEFECTO}%` }}
    />
  );
  return (
    <AbsoluteFill style={{ background: m.colores.fondo, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${escala})` }}>{frame >= ultimo ? <Freeze frame={ultimo}>{video}</Freeze> : video}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Logo sobre el video: va en una placa con el fondo de la marca para que se lea sobre cualquier imagen. */
export const LogoSobreClip: React.FC<{ alto: number }> = ({ alto }) => {
  const m = useMarca();
  return (
    <div style={{ display: "inline-flex", padding: `${Math.round(alto * 0.3)}px ${Math.round(alto * 0.45)}px`, background: m.colores.fondo, borderRadius: m.forma.radio, boxShadow: m.forma.sombra }}>
      <Logo alto={alto} />
    </div>
  );
};
