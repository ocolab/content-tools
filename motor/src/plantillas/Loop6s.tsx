// Loop de 6 s (180 cuadros): título grande, tarjetas que se escriben y se
// tildan; después el título se achica y entra un celular con un trabajo real
// y el botón. Termina vacío para que el loop empalme con el primer cuadro.
import { fitText } from "@remotion/layout-utils";
import React from "react";
import { useCurrentFrame } from "remotion";
import { Boton, Casilla, Efecto, Eyebrow, Lienzo, Logo, Musica, Superficie, Telefono, TextoMarcado, ZonaSegura, sinMarcas } from "../componentes/Base";
import { SitioBilingue } from "../componentes/SitioBilingue";
import { ConMarca, useMarca } from "../marca";
import { LIENZOS, entrada, escribir, lineal, resorte, salida, useFormato } from "../tiempo";
import type { PropsLoop } from "../tipos";

export const DURACION_LOOP = 180;

// Línea de tiempo fija, en cuadros.
const T = {
  titulo: 2,
  item: (i: number) => 24 + i * 15,
  cambio: 100,
  telefono: 104,
  etiqueta: 112,
  boton: 120,
  scrollDesde: 112,
  scrollHasta: 162,
  cambioIdioma: 136,
  salida: 164,
};

// Cuánto puede salirse el celular por debajo de la zona segura (es decorado,
// no lleva texto): en Reels esa franja la tapa la interfaz.
const DESBORDE = { "9x16": 240, "4x5": 40 } as const;
const ESCALA_TITULO = 0.6;

const Contenido: React.FC<PropsLoop> = ({ spec }) => {
  const frame = useCurrentFrame();
  const m = useMarca();
  const formato = useFormato();
  const zona = LIENZOS[formato].segura;
  const c = spec.contenido;
  const captura = c.captura ? spec.capturas.find((x) => x.archivo === c.captura) : undefined;
  const relacion = captura ? captura.alto / captura.ancho : 2;

  // Título: el mayor tamaño que entra en el ancho, igual para todas las líneas.
  const maximo = formato === "9x16" ? 128 : 136;
  const tamTitulo = Math.floor(
    Math.min(
      maximo,
      ...c.titulo.map(
        (l) =>
          fitText({
            text: sinMarcas(l),
            withinWidth: zona.w,
            fontFamily: m.tipografia.familia,
            fontWeight: l.includes("*") ? m.tipografia.peso_enfasis : m.tipografia.peso_titulo,
            letterSpacing: m.tipografia.tracking_titulo,
            validateFontIsLoaded: true,
          }).fontSize * 0.97
      )
    )
  );
  const centro = m.estilo.alineacion === "centro";
  // Encabezado en columna: el logo puede ir grande sin pelearse con el eyebrow.
  const altoLogo = Math.round((formato === "9x16" ? 40 : 44) * m.estilo.logo_escala);
  const altoEncabezado = altoLogo + 18 + 28;
  const altoTitulo = Math.ceil(tamTitulo * 0.98 * c.titulo.length);
  const arribaTarjetas = altoEncabezado + 24 + altoTitulo + 44;

  // Tarjetas: se achican si hay muchas para no salir de la zona segura.
  const huecoTarjetas = 20;
  const altoTarjeta = Math.min(104, Math.floor((zona.h - arribaTarjetas - huecoTarjetas * (c.items.length - 1)) / c.items.length));
  const tamItem = Math.round(altoTarjeta * 0.42);

  // Segunda parte: el título se achica y deja lugar al celular.
  const cambio = resorte(frame, T.cambio);
  const escalaTitulo = 1 - (1 - ESCALA_TITULO) * cambio;
  const tarjetas = salida(frame, T.cambio, 8);
  const arribaCelular = altoEncabezado + 24 + Math.ceil(altoTitulo * ESCALA_TITULO) + 36;
  const altoTelefono = zona.h - arribaCelular + DESBORDE[formato];
  const anchoTelefono = Math.round(altoTelefono * 0.49);
  const subida = resorte(frame, T.telefono);

  const visible = salida(frame, T.salida, 15);
  const escala = 0.97 + 0.03 * visible;

  return (
    <Lienzo>
      <ZonaSegura style={{ opacity: visible, transform: `scale(${escala})`, transformOrigin: "50% 40%" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: centro ? "center" : "flex-start",
            gap: 18,
            height: altoEncabezado,
            opacity: entrada(frame, 0, 8),
          }}
        >
          <Logo alto={formato === "9x16" ? 40 : 44} />
          <Eyebrow texto={c.eyebrow} tam={formato === "9x16" ? 21 : 22} />
        </div>

        <div
          style={{
            marginTop: 24,
            fontSize: tamTitulo,
            lineHeight: 0.98,
            letterSpacing: m.tipografia.tracking_titulo,
            fontWeight: m.tipografia.peso_titulo,
            textAlign: centro ? "center" : "left",
            transform: `scale(${escalaTitulo})`,
            transformOrigin: centro ? "50% 0" : "0 0",
          }}
        >
          {c.titulo.map((l, i) => {
            const p = resorte(frame, T.titulo + i * 4);
            return (
              <div key={i} style={{ whiteSpace: "nowrap", opacity: p, transform: `translateY(${(1 - p) * 50}px)` }}>
                <TextoMarcado texto={l} />
              </div>
            );
          })}
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: arribaTarjetas,
            display: "flex",
            flexDirection: "column",
            alignItems: centro ? "center" : "flex-start",
            gap: huecoTarjetas,
            opacity: tarjetas,
            transform: `translateY(${(1 - tarjetas) * -30}px)`,
          }}
        >
          {c.items.map((item, i) => {
            const t = T.item(i);
            const e = entrada(frame, t, 8);
            const lado = i % 2 === 0 ? -1 : 1;
            return (
              <Superficie
                key={i}
                style={{
                  height: altoTarjeta,
                  marginLeft: centro || i % 2 === 0 ? 0 : Math.round(zona.w * 0.08),
                  display: "flex",
                  alignItems: "center",
                  gap: tamItem * 0.55,
                  padding: `0 ${tamItem * 0.8}px 0 ${tamItem * 0.55}px`,
                  opacity: e,
                  transform: `translateX(${(1 - e) * 60 * lado}px)`,
                }}
              >
                <Casilla tam={Math.round(tamItem * 1.15)} progreso={resorte(frame, t + 12)} />
                <span style={{ fontSize: tamItem, fontWeight: m.tipografia.peso_ui, whiteSpace: "nowrap", minWidth: 20 }}>{escribir(item, frame, t + 3, 1.6)}</span>
              </Superficie>
            );
          })}
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            top: arribaCelular,
            width: zona.w,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 28,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 32, paddingTop: altoTelefono * 0.18 }}>
            <span style={{ fontSize: formato === "9x16" ? 36 : 38, lineHeight: 1.15, fontWeight: m.tipografia.peso_titulo, color: m.colores.enfasis, opacity: entrada(frame, T.etiqueta, 8) }}>
              {c.etiqueta_captura}
            </span>
            <div style={{ opacity: resorte(frame, T.boton), transform: `scale(${0.9 + 0.1 * resorte(frame, T.boton)})`, transformOrigin: "0 50%" }}>
              <Boton texto={c.boton} tam={formato === "9x16" ? 25 : 27} />
            </div>
          </div>
          <Telefono
            src={c.captura}
            pantalla={
              c.maqueta
                ? (w, h) => (
                    <SitioBilingue {...c.maqueta!} frame={frame} desde={T.telefono + 6} cambio={T.cambioIdioma} ancho={w} alto={h} compacto />
                  )
                : undefined
            }
            relacion={relacion}
            ancho={anchoTelefono}
            alto={altoTelefono}
            desplazamiento={lineal(frame, T.scrollDesde, T.scrollHasta, 0, 0.35)}
            style={{ flex: "none", opacity: subida, transform: `translateY(${(1 - subida) * 480}px)` }}
          />
        </div>
      </ZonaSegura>

      {spec.audio.efectos && (
        <>
          {c.items.map((_, i) => (
            <Efecto key={i} en={T.item(i) + 12} sonido="tilde" volumen={0.8} />
          ))}
          <Efecto en={T.telefono} sonido="barrido" volumen={0.9} />
          <Efecto en={T.boton} sonido="campana" volumen={0.7} />
          {c.maqueta && <Efecto en={T.cambioIdioma} sonido="pop" volumen={0.7} />}
          <Efecto en={T.salida} sonido="barrido" volumen={0.5} />
        </>
      )}
      {spec.audio.musica && <Musica archivo={spec.audio.musica} total={DURACION_LOOP} volumen={0.35} />}
    </Lienzo>
  );
};

export const Loop6s: React.FC<PropsLoop> = (props) => (
  <ConMarca marca={props.marca}>
    <Contenido {...props} />
  </ConMarca>
);
