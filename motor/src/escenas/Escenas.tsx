// Escenas del explicativo. Cada una recibe el área disponible (dentro de la
// zona segura) y anima con el cuadro local de su <Sequence>.
import React from "react";
import { useCurrentFrame } from "remotion";
import { Boton, Casilla, Efecto, Logo, Navegador, Superficie, Telefono, TextoMarcado } from "../componentes/Base";
import { estiloEnfasis, useMarca } from "../marca";
import { entrada, escribir, finEscritura, lineal, resorte } from "../tiempo";
import { SitioBilingue } from "../componentes/SitioBilingue";
import type { Captura, EscenaArmado, EscenaBilingue, EscenaBuscador, EscenaCapturas, EscenaCierre, EscenaGancho, EscenaLista } from "../tipos";

export type Area = { w: number; h: number };
type ConArea<E> = { escena: E; area: Area; frames: number; efectos: boolean };

const Centro: React.FC<{ area: Area; children: React.ReactNode; gap?: number; centrado?: boolean }> = ({ area, children, gap = 0, centrado }) => (
  <div
    style={{
      width: area.w,
      height: area.h,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: centrado ? "center" : "stretch",
      textAlign: centrado ? "center" : "left",
      gap,
    }}
  >
    {children}
  </div>
);

/** Palabras que entran de a una. */
/** `estilo` va en cada palabra: el subrayado no pasa a los inline-block de adentro. */
const PalabraPorPalabra: React.FC<{ texto: string; desde: number; cada: number; estilo?: React.CSSProperties }> = ({ texto, desde, cada, estilo }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {texto.split(" ").map((p, i) => {
        const r = resorte(frame, desde + i * cada);
        return (
          <span key={i} style={{ display: "inline-block", marginRight: "0.24em", opacity: r, transform: `translateY(${(1 - r) * 36}px)`, ...estilo }}>
            <TextoMarcado texto={p} />
          </span>
        );
      })}
    </>
  );
};

export const Gancho: React.FC<ConArea<EscenaGancho>> = ({ escena, area }) => {
  const m = useMarca();
  const tam = Math.round(area.w * 0.118);
  const palabras = escena.texto.split(" ").length;
  const estilo = { fontSize: tam, lineHeight: 1, letterSpacing: m.tipografia.tracking_titulo, fontWeight: m.tipografia.peso_titulo };
  return (
    <Centro area={area} gap={tam * 0.35} centrado={m.estilo.alineacion === "centro"}>
      <div style={estilo}>
        <PalabraPorPalabra texto={escena.texto} desde={2} cada={3} />
      </div>
      {escena.destacado && (
        <div style={{ ...estilo, ...estiloEnfasis(m) }}>
          <PalabraPorPalabra texto={escena.destacado} desde={2 + palabras * 3 + 6} cada={3} estilo={estiloEnfasis(m)} />
        </div>
      )}
    </Centro>
  );
};

const direccion = (nombre: string) =>
  "www." +
  nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24) +
  ".com.ar";

export const Buscador: React.FC<ConArea<EscenaBuscador>> = ({ escena, area, efectos }) => {
  const frame = useCurrentFrame();
  const m = useMarca();
  const c = m.colores_superficie;
  const inicio = 4;
  const fin = finEscritura(escena.consulta, inicio, 1.2);
  const cursor = frame < fin + 4 || Math.floor(frame / 10) % 2 === 0;
  const resultado = (i: number) => fin + 6 + i * 7;
  const tFaltante = resultado(escena.resultados.length) + 4;
  return (
    <Centro area={area}>
      <Superficie style={{ width: area.w, padding: 30, display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "20px 24px", border: `2px solid ${c.linea}`, borderRadius: m.forma.radio * 6 }}>
          <svg viewBox="0 0 24 24" width={34} height={34}>
            <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke={c.texto_suave} strokeWidth="2.4" />
            <path d="M15.5 15.5L21 21" stroke={c.texto_suave} strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 36, fontWeight: m.tipografia.peso_ui, whiteSpace: "nowrap" }}>{escribir(escena.consulta, frame, inicio, 1.2)}</span>
          <span style={{ width: 3, height: 40, background: c.enfasis, opacity: cursor ? 1 : 0, marginLeft: -12 }} />
        </div>
        {escena.resultados.map((r, i) => {
          const e = entrada(frame, resultado(i), 8);
          return (
            <div key={i} style={{ opacity: e, transform: `translateY(${(1 - e) * 20}px)`, paddingBottom: 18, borderBottom: `${m.forma.borde}px solid ${c.linea}` }}>
              <div style={{ fontSize: 20, color: c.texto_suave }}>{direccion(r)}</div>
              <div style={{ fontSize: 34, fontWeight: m.tipografia.peso_titulo, color: c.enfasis, marginTop: 4 }}>{r}</div>
            </div>
          );
        })}
        {escena.faltante && (
          <div
            style={{
              alignSelf: "flex-start",
              padding: "16px 22px",
              border: `2px dashed ${c.acento_texto}`,
              borderRadius: m.forma.radio,
              color: c.acento_texto,
              fontSize: 34,
              fontWeight: m.tipografia.peso_titulo,
              opacity: resorte(frame, tFaltante),
              transform: `scale(${0.85 + 0.15 * resorte(frame, tFaltante)})`,
              transformOrigin: "0 50%",
            }}
          >
            {escena.faltante}
          </div>
        )}
      </Superficie>
      {efectos && (
        <>
          {Array.from({ length: Math.ceil((fin - inicio) / 3) }, (_, i) => (
            <Efecto key={i} en={inicio + i * 3} sonido="tecla" volumen={0.25} />
          ))}
          {escena.faltante && <Efecto en={tFaltante} sonido="pop" volumen={0.45} />}
        </>
      )}
    </Centro>
  );
};

export const Armado: React.FC<ConArea<EscenaArmado>> = ({ escena, area, efectos }) => {
  const frame = useCurrentFrame();
  const m = useMarca();
  const c = m.colores_superficie;
  const barra = (ancho: number | string, alto: number, desde: number, fondo = c.marco) => (
    <div style={{ width: ancho, height: alto, borderRadius: 2, background: fondo, opacity: entrada(frame, desde, 6), transform: `scaleX(${entrada(frame, desde, 10)})`, transformOrigin: "0 50%" }} />
  );
  const parte = (i: number) => 22 + i * 9;
  const alto = Math.round(area.h * 0.92);
  return (
    <Centro area={area}>
      <Navegador direccion={escena.sitio} ancho={area.w} alto={alto}>
        <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: entrada(frame, 4, 6) }}>
            <div style={{ width: 34, height: 34, borderRadius: m.forma.radio, background: c.grafico }} />
            <span style={{ fontSize: 24, fontWeight: m.tipografia.peso_enfasis }}>{escena.sitio.replace(/^www\./, "").split(".")[0]}</span>
            <span style={{ flex: 1 }} />
            {escena.partes.map((p, i) => (
              <span key={i} style={{ fontSize: 17, color: c.texto_suave }}>{p}</span>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "18px 0 8px" }}>
            {barra("86%", 40, 10, c.texto)}
            {barra("62%", 40, 12, c.texto)}
            {barra("74%", 16, 15)}
            <div style={{ width: 170, height: 46, marginTop: 10, borderRadius: m.forma.radio, background: c.boton_fondo, opacity: entrada(frame, 17, 6) }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: escena.partes.length > 2 ? "1fr 1fr" : "1fr", gap: 18 }}>
            {escena.partes.map((p, i) => {
              const e = resorte(frame, parte(i));
              return (
                <Superficie key={i} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12, opacity: e, transform: `translateY(${(1 - e) * 30}px)` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 28, fontWeight: m.tipografia.peso_titulo }}>{p}</span>
                    <Casilla tam={34} redonda progreso={resorte(frame, parte(i) + 7)} />
                  </div>
                  {barra("90%", 12, parte(i) + 3)}
                  {barra("70%", 12, parte(i) + 4)}
                </Superficie>
              );
            })}
          </div>
        </div>
      </Navegador>
      {efectos && escena.partes.map((_, i) => <Efecto key={i} en={parte(i) + 7} sonido="tilde" volumen={0.4} />)}
    </Centro>
  );
};

export const Capturas: React.FC<ConArea<EscenaCapturas> & { capturas: Captura[] }> = ({ escena, area, frames, capturas }) => {
  const frame = useCurrentFrame();
  const m = useMarca();
  const tramo = Math.floor(frames / escena.archivos.length);
  const actual = Math.min(escena.archivos.length - 1, Math.floor(frame / tramo));
  const local = frame - actual * tramo;
  const archivo = escena.archivos[actual];
  const def = capturas.find((c) => c.archivo === archivo);
  const alto = Math.round(area.h - 80);
  const ancho = Math.round(alto * 0.49);
  const sube = resorte(local, 0);
  return (
    <div style={{ width: area.w, height: area.h, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <span style={{ fontSize: 30, fontWeight: m.tipografia.peso_titulo, color: m.colores.enfasis, opacity: entrada(frame, 2, 8) }}>{escena.etiqueta}</span>
      <Telefono
        src={archivo}
        relacion={def ? def.alto / def.ancho : 2}
        ancho={ancho}
        alto={alto}
        desplazamiento={lineal(local, 6, tramo - 2, 0, 0.45)}
        style={{ opacity: sube, transform: `translateY(${(1 - sube) * 160}px)` }}
      />
    </div>
  );
};

export const Lista: React.FC<ConArea<EscenaLista>> = ({ escena, area, frames, efectos }) => {
  const frame = useCurrentFrame();
  const m = useMarca();
  const tam = Math.round(area.w * 0.082);
  // Los puntos se reparten a lo largo de la escena (acompañan a la voz) en vez de entrar todos juntos.
  const paso = Math.max(9, Math.floor((frames * 0.75) / escena.items.length));
  const t = (i: number) => 3 + i * paso;
  return (
    <Centro area={area} centrado={m.estilo.alineacion === "centro"}>
      {/* El bloque se centra si la variante lo pide; los puntos quedan alineados entre sí y en una línea. */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", gap: tam * 0.55 }}>
      {escena.items.map((item, i) => {
        const e = entrada(frame, t(i), 7);
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: tam * 0.4, opacity: e, transform: `translateX(${(1 - e) * -40}px)` }}>
            <Casilla tam={Math.round(tam * 0.9)} redonda progreso={resorte(frame, t(i) + 4)} />
            <span style={{ fontSize: tam, fontWeight: m.tipografia.peso_titulo, letterSpacing: m.tipografia.tracking_titulo, lineHeight: 1, whiteSpace: "nowrap" }}>
              <TextoMarcado texto={item} />
            </span>
          </div>
        );
      })}
      </div>
      {efectos && escena.items.map((_, i) => <Efecto key={i} en={t(i) + 4} sonido="tilde" volumen={0.45} />)}
    </Centro>
  );
};

export const Cierre: React.FC<ConArea<EscenaCierre>> = ({ escena, area, efectos }) => {
  const frame = useCurrentFrame();
  const m = useMarca();
  const tam = Math.round(area.w * 0.1);
  const tituloEntra = resorte(frame, 8);
  const boton = resorte(frame, 20);
  return (
    <Centro area={area} gap={tam * 0.6} centrado={m.estilo.alineacion === "centro"}>
      <div style={{ opacity: entrada(frame, 2, 8) }}>
        <Logo alto={Math.round(tam * 0.55)} />
      </div>
      <div style={{ fontSize: tam, lineHeight: 1, letterSpacing: m.tipografia.tracking_titulo, fontWeight: m.tipografia.peso_titulo, opacity: tituloEntra, transform: `translateY(${(1 - tituloEntra) * 40}px)` }}>
        <TextoMarcado texto={escena.titulo} />
      </div>
      <div style={{ opacity: boton, transform: `scale(${0.9 + 0.1 * boton})`, transformOrigin: m.estilo.alineacion === "centro" ? "50% 50%" : "0 50%" }}>
        <Boton texto={escena.boton} tam={Math.round(tam * 0.4)} />
      </div>
      {efectos && <Efecto en={20} sonido="campana" volumen={0.4} />}
    </Centro>
  );
};

export const Bilingue: React.FC<ConArea<EscenaBilingue>> = ({ escena, area, frames, efectos }) => {
  const frame = useCurrentFrame();
  const alto = Math.round(area.h * 0.92);
  const cambio = Math.round(frames * 0.5);
  const barra = 50;
  return (
    <Centro area={area}>
      <Navegador direccion={escena.sitio} ancho={area.w} alto={alto}>
        <SitioBilingue sitio={escena.sitio} titulo={escena.titulo} partes={escena.partes} frame={frame} desde={2} cambio={cambio} ancho={area.w - 2} alto={alto - barra} />
      </Navegador>
      {efectos && (
        <>
          {escena.partes.map((_, i) => (
            <Efecto key={i} en={16 + i * 4} sonido="tilde" volumen={0.35} />
          ))}
          <Efecto en={cambio} sonido="pop" volumen={0.6} />
        </>
      )}
    </Centro>
  );
};
