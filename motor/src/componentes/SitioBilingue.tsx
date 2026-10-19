// Web genérica que se arma y, en el cuadro `cambio`, pasa de español a
// inglés con un selector ES/EN. No es un trabajo real: muestra el producto
// (una web en dos idiomas) sin afirmar nada sobre un cliente.
import React from "react";
import { interpolate } from "remotion";
import { useMarca } from "../marca";
import { entrada, resorte } from "../tiempo";
import type { Par } from "../tipos";

/** El texto se aplasta y vuelve a abrirse en el otro idioma alrededor del cambio. */
const giro = (frame: number, cambio: number) => {
  const d = frame - cambio;
  return { idioma: d < 0 ? ("es" as const) : ("en" as const), escalaY: Math.abs(d) >= 4 ? 1 : Math.abs(d) / 4 };
};

export const SitioBilingue: React.FC<{
  sitio: string;
  titulo: Par;
  partes: Par[];
  frame: number;
  desde: number;
  cambio: number;
  ancho: number;
  alto: number;
  compacto?: boolean;
}> = ({ sitio, titulo, partes, frame, desde, cambio, ancho, alto, compacto }) => {
  const m = useMarca();
  const u = ancho / (compacto ? 18 : 22);
  const nombre = sitio.replace(/^www\./, "").split(".")[0];
  const texto = (par: Par, orden: number) => {
    const g = giro(frame, cambio + orden * 2);
    return <span style={{ display: "inline-block", transform: `scaleY(${g.escalaY})` }}>{par[g.idioma]}</span>;
  };
  const barra = (largo: string, grosor: number, t: number) => (
    <div style={{ width: largo, height: grosor, borderRadius: 2, background: m.colores.marco, transform: `scaleX(${entrada(frame, t, 10)})`, transformOrigin: "0 50%" }} />
  );
  const perilla = interpolate(frame, [cambio - 3, cambio + 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tamSelector = u * 0.62;

  return (
    <div style={{ width: ancho, height: alto, overflow: "hidden", background: m.colores.fondo, color: m.colores.texto, padding: u, display: "flex", flexDirection: "column", gap: u * 0.9 }}>
      <div style={{ display: "flex", alignItems: "center", gap: u * 0.45, opacity: entrada(frame, desde, 6) }}>
        <div style={{ width: u * 1.1, height: u * 1.1, borderRadius: m.forma.radio, background: m.colores.grafico, flex: "none" }} />
        <span style={{ fontSize: u * 0.85, fontWeight: m.tipografia.peso_enfasis }}>{nombre}</span>
        <span style={{ flex: 1 }} />
        {!compacto &&
          partes.map((p, i) => (
            <span key={i} style={{ fontSize: u * 0.6, color: m.colores.texto_suave }}>
              {texto(p, i + 1)}
            </span>
          ))}
        <div style={{ position: "relative", display: "flex", border: `${m.forma.borde}px solid ${m.colores.linea}`, borderRadius: 999, background: m.colores.superficie, flex: "none" }}>
          <div
            style={{
              position: "absolute",
              top: 2,
              bottom: 2,
              left: `calc(2px + ${perilla} * (50% - 2px))`,
              width: "calc(50% - 2px)",
              borderRadius: 999,
              background: m.colores.enfasis,
            }}
          />
          {(["ES", "EN"] as const).map((l, i) => {
            const activo = i === 0 ? perilla < 0.5 : perilla >= 0.5;
            return (
              <span
                key={l}
                style={{
                  position: "relative",
                  padding: `${tamSelector * 0.3}px ${tamSelector * 0.6}px`,
                  fontSize: tamSelector,
                  fontWeight: m.tipografia.peso_titulo,
                  color: activo ? m.colores.sobre_enfasis : m.colores.texto_suave,
                }}
              >
                {l}
              </span>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: u * 0.5, paddingTop: u * 0.4 }}>
        <div
          style={{
            fontSize: u * (compacto ? 1.9 : 1.75),
            lineHeight: 1.02,
            letterSpacing: m.tipografia.tracking_titulo,
            fontWeight: m.tipografia.peso_titulo,
            opacity: entrada(frame, desde + 4, 8),
            transform: `translateY(${(1 - entrada(frame, desde + 4, 8)) * u}px)`,
          }}
        >
          {texto(titulo, 0)}
        </div>
        {barra("80%", u * 0.42, desde + 8)}
        {barra("58%", u * 0.42, desde + 9)}
        <div
          style={{
            alignSelf: "flex-start",
            marginTop: u * 0.3,
            padding: `${u * 0.4}px ${u * 0.7}px`,
            borderRadius: m.forma.radio,
            background: m.colores.boton_fondo,
            color: m.colores.boton_texto,
            fontSize: u * 0.62,
            fontWeight: m.tipografia.peso_titulo,
            opacity: resorte(frame, desde + 11),
          }}
        >
          WhatsApp →
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: compacto ? "1fr" : "1fr 1fr", gap: u * 0.6 }}>
        {partes.map((p, i) => {
          const e = resorte(frame, desde + 14 + i * 4);
          return (
            <div
              key={i}
              style={{
                padding: u * 0.7,
                background: m.colores.superficie,
                border: `${m.forma.borde}px solid ${m.colores.linea}`,
                borderRadius: m.forma.radio,
                boxShadow: m.forma.sombra,
                display: "flex",
                flexDirection: "column",
                gap: u * 0.35,
                opacity: e,
                transform: `translateY(${(1 - e) * u}px)`,
              }}
            >
              <span style={{ fontSize: u * 0.82, fontWeight: m.tipografia.peso_titulo }}>{texto(p, i + 1)}</span>
              {barra("90%", u * 0.3, desde + 16 + i * 4)}
              {barra("65%", u * 0.3, desde + 17 + i * 4)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
