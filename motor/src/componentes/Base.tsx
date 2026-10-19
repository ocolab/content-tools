// Piezas visuales compartidas. Todos los colores, radios y sombras salen de
// la marca: no hay valores sueltos.
import React, { CSSProperties } from "react";
import { AbsoluteFill, Html5Audio, Img, Sequence, staticFile } from "remotion";
import { ConSuperficie, archivoMarca, estiloEnfasis, familia, useMarca } from "../marca";
import { LIENZOS, useFormato } from "../tiempo";

export const Lienzo: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const m = useMarca();
  return (
    <AbsoluteFill style={{ background: m.colores.fondo, color: m.colores.texto, fontFamily: familia(m), fontWeight: m.tipografia.peso_texto }}>
      {children}
    </AbsoluteFill>
  );
};

/** Caja con la zona segura del formato: todo texto va adentro. */
export const ZonaSegura: React.FC<{ style?: CSSProperties; children: React.ReactNode }> = ({ style, children }) => {
  const z = LIENZOS[useFormato()].segura;
  return <div style={{ position: "absolute", left: z.x, top: z.y, width: z.w, height: z.h, ...style }}>{children}</div>;
};

export const Superficie: React.FC<{ style?: CSSProperties; children?: React.ReactNode }> = ({ style, children }) => {
  const m = useMarca();
  const s = m.colores_superficie;
  return (
    <div
      style={{
        background: s.superficie,
        color: s.texto,
        border: `${m.forma.borde}px solid ${s.linea}`,
        borderRadius: m.forma.radio,
        boxShadow: m.forma.sombra,
        ...style,
      }}
    >
      <ConSuperficie>{children}</ConSuperficie>
    </div>
  );
};

/** Texto con *énfasis*: lo que va entre asteriscos sale en el color de énfasis. */
export const TextoMarcado: React.FC<{ texto: string }> = ({ texto }) => {
  const m = useMarca();
  return (
    <>
      {texto
        .split(/(\*[^*]+\*)/g)
        .filter(Boolean)
        .map((parte, i) =>
          parte.startsWith("*") && parte.endsWith("*") ? (
            <span key={i} style={estiloEnfasis(m)}>
              {parte.slice(1, -1)}
            </span>
          ) : (
            <span key={i}>{parte}</span>
          )
        )}
    </>
  );
};
export const sinMarcas = (t: string) => t.replace(/\*/g, "");

/** Casilla con tilde que se dibuja (progreso 0 → 1). */
export const Casilla: React.FC<{ progreso: number; tam: number; redonda?: boolean }> = ({ progreso, tam, redonda }) => {
  const m = useMarca();
  const llena = progreso > 0.02;
  const pulso = 1 + 0.16 * Math.sin(Math.min(1, progreso) * Math.PI);
  return (
    <div
      style={{
        width: tam,
        height: tam,
        flex: "none",
        borderRadius: redonda ? tam / 2 : m.forma.radio,
        border: `${Math.max(2, Math.round(tam * 0.06))}px solid ${llena ? m.colores.enfasis : m.colores.linea}`,
        background: llena ? m.colores.enfasis : m.colores.superficie,
        transform: `scale(${pulso})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg viewBox="0 0 24 24" width={tam * 0.64} height={tam * 0.64}>
        <path
          d="M5 12.5l4.2 4.2L19 7"
          fill="none"
          stroke={m.colores.sobre_enfasis}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - Math.min(1, Math.max(0, progreso))}
        />
      </svg>
    </div>
  );
};

export const Boton: React.FC<{ texto: string; tam: number; style?: CSSProperties }> = ({ texto, tam, style }) => {
  const m = useMarca();
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: tam * 0.4,
        background: m.colores.boton_fondo,
        color: m.colores.boton_texto,
        fontSize: tam,
        fontWeight: m.tipografia.peso_titulo,
        padding: `${tam * 0.6}px ${tam * 0.85}px`,
        borderRadius: m.forma.radio,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {texto}
      <span>→</span>
    </div>
  );
};

export const Logo: React.FC<{ alto: number; style?: CSSProperties }> = ({ alto, style }) => {
  const m = useMarca();
  const h = Math.round(alto * m.estilo.logo_escala);
  return <Img src={archivoMarca(m.logo.archivo)} style={{ height: h, width: (h * m.logo.ancho) / m.logo.alto, ...style }} />;
};

export const Eyebrow: React.FC<{ texto: string; tam: number }> = ({ texto, tam }) => {
  const m = useMarca();
  return (
    <span style={{ fontSize: tam, fontWeight: m.tipografia.peso_titulo, letterSpacing: "0.3em", textTransform: "uppercase", color: m.colores.texto_suave, whiteSpace: "nowrap" }}>
      {texto}
    </span>
  );
};

/**
 * Celular con una captura que se desplaza (0 = arriba, 1 = abajo del todo),
 * o con lo que dibuje `pantalla(ancho, alto)` en lugar de la captura.
 */
export const Telefono: React.FC<{
  src?: string;
  pantalla?: (ancho: number, alto: number) => React.ReactNode;
  relacion?: number;
  ancho: number;
  alto: number;
  desplazamiento?: number;
  style?: CSSProperties;
}> = ({ src, pantalla, relacion = 2, ancho, alto, desplazamiento = 0, style }) => {
  const m = useMarca();
  const marco = Math.round(ancho * 0.035);
  const anchoPantalla = ancho - marco * 2;
  const altoPantalla = alto - marco * 2;
  const recorrido = Math.max(0, anchoPantalla * relacion - altoPantalla);
  return (
    <div style={{ width: ancho, height: alto, padding: marco, background: m.colores_superficie.texto, borderRadius: ancho * 0.15, boxShadow: m.forma.sombra, ...style }}>
      <div style={{ position: "relative", width: anchoPantalla, height: altoPantalla, borderRadius: ancho * 0.12, overflow: "hidden", background: m.colores_superficie.fondo }}>
        {pantalla
          ? <ConSuperficie>{pantalla(anchoPantalla, altoPantalla)}</ConSuperficie>
          : src && <Img src={staticFile(`actual/${src}`)} style={{ width: anchoPantalla, transform: `translateY(${-desplazamiento * recorrido}px)` }} />}
        <div style={{ position: "absolute", top: ancho * 0.035, left: "50%", width: ancho * 0.3, height: ancho * 0.075, marginLeft: -ancho * 0.15, borderRadius: ancho, background: m.colores_superficie.texto }} />
      </div>
    </div>
  );
};

/** Ventana de navegador con la dirección del sitio (todo adentro usa la paleta de superficie). */
export const Navegador: React.FC<{ direccion: string; ancho: number; alto: number; children: React.ReactNode }> = ({ direccion, ancho, alto, children }) => (
  <Superficie style={{ width: ancho, height: alto, overflow: "hidden", display: "flex", flexDirection: "column" }}>
    <InteriorNavegador direccion={direccion}>{children}</InteriorNavegador>
  </Superficie>
);

const InteriorNavegador: React.FC<{ direccion: string; children: React.ReactNode }> = ({ direccion, children }) => {
  const m = useMarca();
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: m.colores.marco, borderBottom: `${m.forma.borde}px solid ${m.colores.linea}` }}>
        {[0, 1, 2].map((i) => (
          <i key={i} style={{ width: 14, height: 14, borderRadius: 7, background: m.colores.linea, display: "block" }} />
        ))}
        <span style={{ marginLeft: 14, padding: "4px 18px", background: m.colores.superficie, border: `${m.forma.borde}px solid ${m.colores.linea}`, borderRadius: 2, fontSize: 20, fontWeight: m.tipografia.peso_ui, color: m.colores.texto_suave }}>
          {direccion}
        </span>
      </div>
      <div style={{ flex: 1, position: "relative", background: m.colores.fondo }}>{children}</div>
    </>
  );
};

export type NombreSonido = "tilde" | "pop" | "tecla" | "barrido" | "campana";

/** Efecto de sonido en un cuadro dado (los archivos los genera `npm run sonidos`). */
export const Efecto: React.FC<{ en: number; sonido: NombreSonido; volumen?: number }> = ({ en, sonido, volumen = 0.5 }) => (
  <Sequence from={Math.max(0, en)} durationInFrames={45} layout="none">
    <Html5Audio src={staticFile(`sonidos/${sonido}.wav`)} volume={volumen} />
  </Sequence>
);

/** Música de fondo con entrada y salida suaves. */
export const Musica: React.FC<{ archivo: string; total: number; volumen: number }> = ({ archivo, total, volumen }) => (
  <Html5Audio
    src={staticFile(archivo)}
    loop
    volume={(fr) => volumen * Math.min(1, fr / 6) * Math.min(1, Math.max(0, (total - fr) / 24))}
  />
);
