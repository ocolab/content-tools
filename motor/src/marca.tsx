// La marca del cliente llega por props (clientes/<cliente>/marca.json) y se
// reparte por contexto. Nada se dibuja hasta que la fuente está cargada: así
// las medidas de texto (fitText) son siempre las mismas.
import { loadFont } from "@remotion/fonts";
import React, { CSSProperties, createContext, useContext, useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import type { Marca } from "./tipos";

const Contexto = createContext<Marca | null>(null);

export const useMarca = () => {
  const m = useContext(Contexto);
  if (!m) throw new Error("Falta la marca: la plantilla tiene que ir dentro de <ConMarca>.");
  return m;
};

/** Archivos de la marca: render.mjs los copia a public/actual/marca/. */
export const archivoMarca = (ruta: string) => staticFile(`actual/marca/${ruta.replace(/^activos\//, "")}`);

export const familia = (m: Marca) => `'${m.tipografia.familia}', system-ui, sans-serif`;

const cargadas = new Map<string, Promise<void>>();
const cargarFuente = (m: Marca) => {
  const url = archivoMarca(m.tipografia.archivo);
  const clave = `${m.tipografia.familia}|${url}`;
  if (!cargadas.has(clave)) cargadas.set(clave, loadFont({ family: m.tipografia.familia, url, weight: m.tipografia.pesos }));
  return cargadas.get(clave)!;
};

export const ConMarca: React.FC<{ marca: Marca; children: React.ReactNode }> = ({ marca, children }) => {
  const [espera] = useState(() => delayRender(`Cargando la fuente ${marca.tipografia.familia}`));
  const [lista, setLista] = useState(false);

  useEffect(() => {
    cargarFuente(marca)
      .then(() => setLista(true))
      .catch((e) => cancelRender(e));
  }, [marca]);

  useEffect(() => {
    if (lista) continueRender(espera);
  }, [lista, espera]);

  return <Contexto.Provider value={marca}>{lista ? children : null}</Contexto.Provider>;
};

/** Dentro de tarjetas, ventanas y pantallas rige la paleta de superficie. */
export const ConSuperficie: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const m = useMarca();
  return <Contexto.Provider value={{ ...m, colores: m.colores_superficie }}>{children}</Contexto.Provider>;
};

/** Cómo se ve una palabra clave según el estilo de la marca o la variante. */
export const estiloEnfasis = (m: Marca): CSSProperties => ({
  color: m.colores.enfasis,
  fontWeight: m.tipografia.peso_enfasis,
  ...(m.estilo.enfasis === "subrayado"
    ? { textDecorationLine: "underline", textDecorationColor: m.colores.grafico, textDecorationThickness: "0.09em", textUnderlineOffset: "0.14em" }
    : {}),
});
