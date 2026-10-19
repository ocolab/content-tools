// Todo el tiempo sale de acá: 30 fps fijos y funciones puras del número de
// cuadro. Nada de Math.random ni Date: el mismo spec da el mismo video.
import { Easing, interpolate, spring, useVideoConfig } from "remotion";
import type { Formato } from "./tipos";

import { FPS, f } from "./calculo.js";
export { FPS, f };

export const LIENZOS = {
  // Reels de Meta: libres el 14 % de arriba y el 35 % de abajo (interfaz y
  // botón del anuncio); 120 px a los costados por la columna de íconos.
  "9x16": { ancho: 1080, alto: 1920, segura: { x: 120, y: 270, w: 840, h: 980 } },
  "4x5": { ancho: 1080, alto: 1350, segura: { x: 90, y: 90, w: 900, h: 1170 } },
} as const;

export const useFormato = (): Formato => (useVideoConfig().height === 1920 ? "9x16" : "4x5");

const limitar = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0 → 1 entre `desde` y `desde + dur`, con salida suave. */
export const entrada = (frame: number, desde: number, dur = 8) =>
  interpolate(frame, [desde, desde + dur], [0, 1], { ...limitar, easing: Easing.out(Easing.cubic) });

/** 1 → 0 entre `desde` y `desde + dur`. */
export const salida = (frame: number, desde: number, dur = 8) =>
  interpolate(frame, [desde, desde + dur], [1, 0], { ...limitar, easing: Easing.in(Easing.cubic) });

/** Resorte con rebote corto, igual en todas las plantillas. */
export const resorte = (frame: number, desde: number) =>
  spring({ frame: frame - desde, fps: FPS, config: { damping: 16, stiffness: 170, mass: 0.6 } });

export const lineal = (frame: number, desde: number, hasta: number, de = 0, a = 1) =>
  interpolate(frame, [desde, hasta], [de, a], limitar);

/** Efecto máquina de escribir: devuelve el texto visible en este cuadro. */
export const escribir = (texto: string, frame: number, desde: number, letrasPorCuadro = 1.4) => {
  const letras = Array.from(texto);
  const n = Math.max(0, Math.min(letras.length, Math.floor((frame - desde) * letrasPorCuadro)));
  return letras.slice(0, n).join("");
};
export const finEscritura = (texto: string, desde: number, letrasPorCuadro = 1.4) =>
  desde + Math.ceil(Array.from(texto).length / letrasPorCuadro);

export { tokens, tiemposExplicativo } from "./calculo.js";
export type PalabraEnCuadros = { texto: string; desde: number; hasta: number };
export type TiempoEscena = { desde: number; frames: number; palabras: PalabraEnCuadros[] };
