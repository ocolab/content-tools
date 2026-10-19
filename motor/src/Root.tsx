import React from "react";
import { Composition } from "remotion";
import marca from "../ejemplos/marca.json";
import ejemploExplicativo from "../ejemplos/explicativo.json";
import ejemploLoop from "../ejemplos/loop-6s.json";
import { DURACION_LOOP, Loop6s } from "./plantillas/Loop6s";
import { Explicativo, duracionExplicativo } from "./plantillas/Explicativo";
import { FPS, LIENZOS } from "./tiempo";
import { aplicarVariante } from "./variante.js";
import type { Marca, PropsExplicativo, PropsLoop, SpecExplicativo, SpecLoop } from "./tipos";

// Los props de ejemplo solo sirven para `npm run estudio`; el render real los
// recibe de scripts/render.mjs.
const marcaBase = aplicarVariante(marca) as Marca;
const propsLoop: PropsLoop = { spec: ejemploLoop as SpecLoop, marca: marcaBase };
const propsExplicativo: PropsExplicativo = { spec: ejemploExplicativo as SpecExplicativo, marca: marcaBase, palabras: null };

export const Root: React.FC = () => (
  <>
    {(Object.keys(LIENZOS) as (keyof typeof LIENZOS)[]).map((formato) => (
      <React.Fragment key={formato}>
        <Composition
          id={`loop-6s-${formato}`}
          component={Loop6s}
          width={LIENZOS[formato].ancho}
          height={LIENZOS[formato].alto}
          fps={FPS}
          durationInFrames={DURACION_LOOP}
          defaultProps={propsLoop}
        />
        <Composition
          id={`explicativo-${formato}`}
          component={Explicativo}
          width={LIENZOS[formato].ancho}
          height={LIENZOS[formato].alto}
          fps={FPS}
          durationInFrames={duracionExplicativo(propsExplicativo)}
          defaultProps={propsExplicativo}
          calculateMetadata={({ props }) => ({ durationInFrames: duracionExplicativo(props) })}
        />
      </React.Fragment>
    ))}
  </>
);
