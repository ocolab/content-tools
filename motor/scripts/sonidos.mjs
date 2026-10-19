// Genera la biblioteca de efectos de sonido con ffmpeg a partir de fórmulas
// fijas (sin archivos bajados ni modelos): el mismo comando da el mismo WAV.
// Uso: npm run sonidos [-- --forzar]
import fs from "node:fs";
import path from "node:path";
import { PUBLICO, SONIDOS, correr, escribirJson, sha256Archivo, version } from "./comun.mjs";

const RECETAS = {
  // Tilde de una casilla: dos senos cortos y agudos.
  tilde: ["-f", "lavfi", "-i", "aevalsrc=0.5*sin(2*PI*1760*t)*exp(-t*45)+0.25*sin(2*PI*2640*t)*exp(-t*60):s=48000:d=0.18"],
  // Pop: un tono que cae rápido.
  pop: ["-f", "lavfi", "-i", "aevalsrc=0.6*sin(2*PI*(380+700*exp(-t*35))*t)*exp(-t*22):s=48000:d=0.22"],
  // Tecla: ruido blanco muy corto, con semilla fija.
  tecla: ["-f", "lavfi", "-i", "anoisesrc=d=0.04:c=white:a=0.5:seed=11", "-af", "highpass=f=1800,afade=t=out:st=0:d=0.04"],
  // Barrido: ruido rosa filtrado con entrada y salida.
  barrido: ["-f", "lavfi", "-i", "anoisesrc=d=0.5:c=pink:a=0.6:seed=7", "-af", "bandpass=f=1800:width_type=o:w=2,afade=t=in:st=0:d=0.28,afade=t=out:st=0.28:d=0.22"],
  // Campana: acorde de tres senos que se apaga en un segundo.
  campana: ["-f", "lavfi", "-i", "aevalsrc=0.35*sin(2*PI*880*t)*exp(-t*4)+0.25*sin(2*PI*1320*t)*exp(-t*5)+0.12*sin(2*PI*1760*t)*exp(-t*7):s=48000:d=1.0"],
};

const forzar = process.argv.includes("--forzar");
const dir = path.join(PUBLICO, "sonidos");
fs.mkdirSync(dir, { recursive: true });

const registro = { version: 1, ffmpeg: version("ffmpeg"), sonidos: {} };
for (const nombre of SONIDOS) {
  const salida = path.join(dir, `${nombre}.wav`);
  if (forzar || !fs.existsSync(salida)) {
    correr("ffmpeg", [
      "-y", "-v", "error",
      ...RECETAS[nombre],
      "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le",
      "-map_metadata", "-1", "-fflags", "+bitexact", "-flags:a", "+bitexact",
      salida,
    ]);
    console.log(`✓ ${nombre}.wav generado`);
  } else {
    console.log(`· ${nombre}.wav ya existe`);
  }
  registro.sonidos[nombre] = { receta: RECETAS[nombre].join(" "), sha256: sha256Archivo(salida) };
}
escribirJson(path.join(dir, "sonidos.json"), registro);
