// Control de calidad de los videos renderizados: formato técnico, volumen,
// tramos congelados y una hoja de contacto por formato (con la zona segura
// marcada) para la revisión visual.
// Uso: npm run qc -- <cliente>/<id>
import fs from "node:fs";
import path from "node:path";
import { correr, dirCliente, escribirJson, fallar, hoy, leerJson, trabajo } from "./comun.mjs";

const LIENZOS = {
  "9x16": { ancho: 1080, alto: 1920, segura: { x: 120, y: 270, w: 840, h: 980 } },
  "4x5": { ancho: 1080, alto: 1350, segura: { x: 90, y: 90, w: 900, h: 1170 } },
};

const t = trabajo(process.argv[2]);
const salidaDir = path.join(t.dir, "salida");
const manifiestoPath = path.join(salidaDir, "manifiesto.json");
if (!fs.existsSync(manifiestoPath)) fallar(`No hay render todavía: npm run render -- ${process.argv[2]}`);
const manifiesto = leerJson(manifiestoPath);
const marca = leerJson(path.join(dirCliente(t.cliente), "marca.json"));
const dirFuente = path.join(dirCliente(t.cliente), path.dirname(marca.tipografia.archivo));
const fuente = path.basename(marca.tipografia.archivo);
const normalizado = manifiesto.volumen.startsWith("loudnorm");
const qcDir = path.join(t.dir, "qc");
fs.mkdirSync(qcDir, { recursive: true });

const informe = { version: 1, trabajo: manifiesto.trabajo, fecha: hoy(), formatos: {}, estado: "aprobado_automatico" };

for (const [formato, r] of Object.entries(manifiesto.formatos)) {
  const archivo = path.join(salidaDir, r.archivo);
  const fallas = [];
  const avisos = [];
  if (!fs.existsSync(archivo)) {
    fallas.push("falta el archivo");
    informe.formatos[formato] = { fallas, avisos };
    continue;
  }
  const lienzo = LIENZOS[formato];

  // Formato técnico
  const info = JSON.parse(correr("ffprobe", ["-v", "error", "-print_format", "json", "-show_streams", "-show_format", archivo]).stdout);
  const v = info.streams.find((s) => s.codec_type === "video");
  const a = info.streams.find((s) => s.codec_type === "audio");
  if (!v) fallas.push("no tiene video");
  else {
    if (v.width !== lienzo.ancho || v.height !== lienzo.alto) fallas.push(`mide ${v.width}×${v.height}, se esperaba ${lienzo.ancho}×${lienzo.alto}`);
    if (v.codec_name !== "h264") fallas.push(`códec ${v.codec_name}, se esperaba h264`);
    if (v.pix_fmt !== "yuv420p") fallas.push(`píxeles ${v.pix_fmt}, se esperaba yuv420p`);
    if (v.r_frame_rate !== "30/1") fallas.push(`${v.r_frame_rate} cuadros por segundo, se esperaba 30`);
  }
  if (!a) fallas.push("no tiene audio");
  else if (a.codec_name !== "aac" || a.sample_rate !== "48000") avisos.push(`audio ${a.codec_name} ${a.sample_rate} Hz`);
  const segundos = Number(info.format.duration);
  if (Math.abs(segundos - r.segundos) > 0.1) fallas.push(`dura ${segundos.toFixed(2)} s y el render dice ${r.segundos} s`);
  if (Number(info.format.size) > 30 * 1024 * 1024) avisos.push("pesa más de 30 MB");

  // Volumen (EBU R128)
  const ebu = correr("ffmpeg", ["-hide_banner", "-nostats", "-i", archivo, "-filter_complex", "ebur128=peak=true", "-f", "null", "-"]).stderr;
  const resumen = ebu.slice(ebu.lastIndexOf("Summary:"));
  const integrado = Number(resumen.match(/I:\s+(-?[\d.]+) LUFS/)?.[1]);
  const pico = Number(resumen.match(/Peak:\s+(-?[\d.]+|-inf) dBFS/)?.[1]);
  if (normalizado && (integrado < -15 || integrado > -13)) fallas.push(`volumen ${integrado} LUFS, se esperaba -14 ± 1`);
  if (pico > -1) fallas.push(`pico ${pico} dBTP, tiene que quedar por debajo de -1`);

  // Tramos sin movimiento de más de 1,2 s
  const congelado = correr("ffmpeg", ["-hide_banner", "-nostats", "-i", archivo, "-map", "0:v", "-vf", "freezedetect=n=0.0008:d=1.2", "-f", "null", "-"]).stderr;
  const quietos = [...congelado.matchAll(/freeze_start: ([\d.]+)[\s\S]*?freeze_duration: ([\d.]+)/g)].map((m) => `${(+m[1]).toFixed(1)} s (${(+m[2]).toFixed(1)} s)`);
  if (quietos.length) avisos.push(`imagen quieta en ${quietos.join(", ")}: el feed premia el movimiento continuo`);

  // Hoja de contacto con la zona segura y el tiempo de cada cuadro
  const z = lienzo.segura;
  const porSegundo = r.segundos <= 8 ? 4 : 2;
  const cuadros = Math.ceil(r.segundos * porSegundo);
  const columnas = 8;
  const filas = Math.ceil(cuadros / columnas);
  const hoja = path.join(qcDir, `${formato}-hoja.png`);
  const filtro = [
    `fps=${porSegundo}`,
    `drawbox=x=${z.x}:y=${z.y}:w=${z.w}:h=${z.h}:color=0xC0653A@0.9:t=4`,
    `drawtext=fontfile=${fuente}:text='%{pts\\:hms}':x=24:y=24:fontsize=44:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=10`,
    "scale=270:-2",
    `tile=${columnas}x${filas}:padding=6:color=white`,
  ].join(",");
  correr("ffmpeg", ["-y", "-v", "error", "-i", archivo, "-vf", filtro, "-frames:v", "1", hoja], { cwd: dirFuente });

  informe.formatos[formato] = { archivo: r.archivo, segundos, volumen_lufs: integrado, pico_dbtp: pico, fallas, avisos, hoja: path.relative(t.dir, hoja).replaceAll("\\", "/") };
  if (fallas.length) informe.estado = "rechazado";
  console.log(`${fallas.length ? "✗" : "✓"} ${r.archivo}: ${segundos.toFixed(2)} s · ${integrado} LUFS · pico ${pico} dBTP`);
  for (const x of fallas) console.log(`   ✗ ${x}`);
  for (const x of avisos) console.log(`   ! ${x}`);
  console.log(`   hoja de contacto: ${path.relative(t.dir, hoja)}`);
}

escribirJson(path.join(qcDir, "qc.json"), informe);
console.log(`\nEstado: ${informe.estado}. Falta la revisión visual de las hojas (checklist en PROCESO.md, paso 7).`);
// Paso 9: con el primer video de la empresa terminado, el setup ya está hecho.
if (informe.estado !== "rechazado") {
  const rutina = path.join(dirCliente(t.cliente), "rutina.json");
  if (!fs.existsSync(rutina))
    console.log(`\n★ ${t.cliente} ya tiene un video terminado y todavía no tiene rutina. Después de entregarlo, proponé la rutina diaria con este setup: npm run rutina -- ${t.cliente} proponer (PROCESO.md, paso 9).`);
  else if (leerJson(path.join(t.dir, "brief.json")).rutina) console.log(`\nRutina: npm run rutina -- ${t.cliente} estado`);
}
process.exit(informe.estado === "rechazado" ? 1 : 0);
