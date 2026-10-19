// Rutina diaria de una empresa (paso 9). Cuando la empresa ya tiene su perfil
// y sus primeros videos terminados, ese trabajo es el «setup»: la rutina lo
// copia cada día con copy nuevo y reutiliza lo que no cambia (la presentadora,
// las capturas, la variante visual, la voz de la marca). Cada empresa define
// en clientes/<c>/rutina.json sus piezas, días, temas, tope de gasto, cómo
// aprueba el copy y cómo se publica. Nada se genera, gasta ni publica solo.
//
//   npm run rutina -- <cliente> proponer [--bases <id>,<id>] [--forzar]
//       Arma la propuesta a partir de los trabajos terminados (activa: false).
//   npm run rutina -- <cliente> aprobar --por "<nombre>"
//       La activa, con quién la aprobó y cuándo (solo con su OK).
//   npm run rutina -- <cliente> hoy [--fecha AAAA-MM-DD] [--hasta AAAA-MM-DD] [--pieza <id>] [--forzar]
//       Abre los trabajos del día (o de varios días, para aprobar la semana).
//   npm run rutina -- <cliente> estado [--dias 14]
//       Qué se hizo, en qué paso está cada trabajo, gasto y ganchos ya usados.
//   npm run rutina -- <cliente> pausar
import fs from "node:fs";
import path from "node:path";
import { KIT, clipsDelSpec, dirCliente, escribirJson, fallar, hoy, leerJson } from "./comun.mjs";
import { DIAS, Rutina, TIPOS } from "./esquemas.mjs";

const args = process.argv.slice(2);
const opcion = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] ?? null : null;
};
const bandera = (n) => args.includes(`--${n}`);

const cliente = args[0];
const accion = args[1];
if (!cliente || !/^[a-z0-9][a-z0-9-]{1,60}$/.test(cliente)) fallar("Uso: npm run rutina -- <cliente> proponer|aprobar|hoy|estado|pausar");
const marcaPath = path.join(dirCliente(cliente), "marca.json");
if (!fs.existsSync(marcaPath)) fallar(`${cliente} no tiene perfil (clientes/${cliente}/marca.json): la rutina va después del paso 1 y del primer video`);
const rutinaPath = path.join(dirCliente(cliente), "rutina.json");
const dirTrabajos = path.join(KIT, "trabajos", cliente);
const usd = (n) => `USD ${n.toFixed(2)}`;

/** Todos los trabajos de la empresa, con lo que haga falta para saber en qué paso están. */
function trabajos() {
  if (!fs.existsSync(dirTrabajos)) return [];
  return fs
    .readdirSync(dirTrabajos, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(dirTrabajos, e.name, "brief.json")))
    .map((e) => {
      const dir = path.join(dirTrabajos, e.name);
      const leer = (n) => (fs.existsSync(path.join(dir, n)) ? leerJson(path.join(dir, n)) : null);
      const manifiesto = path.join(dir, "salida", "manifiesto.json");
      return {
        id: e.name,
        dir,
        brief: leer("brief.json"),
        copy: leer("copy.json"),
        spec: leer("spec.json"),
        plan: leer("plan-avatar.json"),
        activos: leer("activos.json")?.activos ?? [],
        qc: leer("qc/qc.json"),
        renderizado: fs.existsSync(manifiesto) ? fs.statSync(manifiesto).mtimeMs : null,
      };
    });
}

const terminado = (t) => t.renderizado !== null && t.qc && t.qc.estado !== "rechazado";
const costo = (t) => t.activos.reduce((s, a) => s + (Number(a.parametros?.costo_estimado_usd) || 0), 0);

function etapa(t) {
  if (!t.copy?.aprobado) return "1 · copy sin aprobar";
  if (t.spec?.voz?.usar && !fs.existsSync(path.join(t.dir, "audio", "voz.mp3"))) return "2 · falta la toma de voz";
  const clips = clipsDelSpec(t.spec);
  const hechos = clips.filter((c) => fs.existsSync(path.join(t.dir, c))).length;
  if (hechos < clips.length) return `3 · faltan clips (${hechos} de ${clips.length})`;
  if (t.renderizado === null) return "4 · falta el render";
  if (!t.qc) return "5 · falta el control de calidad";
  if (t.qc.estado === "rechazado") return "5 · control de calidad rechazado";
  return "6 · listo: revisión humana y entrega";
}

function leerRutina() {
  if (!fs.existsSync(rutinaPath)) fallar(`${cliente} no tiene rutina todavía: npm run rutina -- ${cliente} proponer`);
  const r = Rutina.safeParse(leerJson(rutinaPath));
  if (!r.success) fallar(`clientes/${cliente}/rutina.json no cumple su esquema: ${r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  return r.data;
}

/** Archivos de la base que conviene reutilizar: imágenes del avatar y capturas; nunca voz ni clips. */
function reutilizables(t) {
  const imagenes = t.plan ? [t.plan.personaje.hoja_de_personaje?.salida, ...t.plan.escenas.map((e) => e.imagen.salida)].filter(Boolean) : [];
  const capturas = (t.spec?.capturas ?? []).map((c) => c.archivo);
  return [...new Set([...imagenes, ...capturas])].filter((a) => /^(activos|capturas)\/[^/]+$/.test(a) && fs.existsSync(path.join(t.dir, a)));
}

// ---------------------------------------------------------------- proponer
if (accion === "proponer") {
  if (fs.existsSync(rutinaPath) && !bandera("forzar"))
    fallar(`${cliente} ya tiene rutina (clientes/${cliente}/rutina.json). Editala, o usá --forzar para proponer otra desde cero.`);
  const todos = trabajos();
  const pedidas = opcion("bases")?.split(",");
  let bases;
  if (pedidas) {
    bases = pedidas.map((id) => todos.find((t) => t.id === id) ?? fallar(`No existe trabajos/${cliente}/${id}`));
    for (const b of bases) if (!terminado(b)) fallar(`${b.id} no está terminado (${etapa(b)}): la base tiene que tener render y control de calidad`);
  } else {
    // El trabajo terminado más reciente de cada tipo, sin contar los que ya salieron de una rutina.
    const porTipo = new Map();
    for (const t of todos.filter((x) => terminado(x) && !x.brief.rutina).sort((a, b) => b.renderizado - a.renderizado)) {
      const tipo = t.brief.tipo ?? t.spec?.plantilla;
      if (tipo && !porTipo.has(tipo)) porTipo.set(tipo, t);
    }
    bases = [...porTipo.values()].slice(0, 3);
  }
  if (!bases.length)
    fallar(`${cliente} no tiene ningún video terminado. La rutina se propone después del primero: pasos 1 a 7 de PROCESO.md (render y control de calidad).`);

  const usados = new Set();
  const piezas = bases.map((t) => {
    const tipo = t.brief.tipo ?? t.spec.plantilla;
    let id = TIPOS[tipo] === "avatar" ? "avatar" : tipo.replace(/-6s$/, "");
    for (let n = 2; usados.has(id); n++) id = `${id.replace(/-\d+$/, "")}-${n}`;
    usados.add(id);
    return { id, base: t.id, tipo, formatos: t.spec?.formatos ?? t.brief.formatos, plataformas: t.brief.plataformas, reutiliza: reutilizables(t) };
  });
  const costoBase = bases.reduce((s, t) => s + costo(t), 0);
  const rutina = {
    version: 1,
    cliente,
    activa: false,
    aprobada: null,
    dias: ["lun", "mar", "mie", "jue", "vie"],
    hora_aviso: "09:00",
    piezas,
    temas: [...new Set(bases.map((t) => t.brief.servicio))].concat("COMPLETAR: otros temas o pilares que la empresa quiera rotar"),
    // Lo que costaron las bases, con margen para repetir una toma o un clip.
    presupuesto_diario_usd: costoBase > 0 ? Math.ceil(costoBase * 1.5 * 2) / 2 : null,
    aprobacion_copy: "cada_dia",
    publicacion: "entregar_mp4",
    notas: `Propuesta del ${hoy()} a partir de ${bases.map((b) => b.id).join(", ")}. Ajustar con el cliente (preguntas R1 a R7 de preguntas.md) y aprobar con npm run rutina -- ${cliente} aprobar --por "<nombre>".`,
  };
  escribirJson(rutinaPath, rutina);
  console.log(`✓ Rutina propuesta en clientes/${cliente}/rutina.json (todavía sin activar)\n`);
  console.log(`  Días: ${rutina.dias.join(", ")} · aviso ${rutina.hora_aviso}`);
  for (const p of piezas)
    console.log(`  Pieza «${p.id}»: ${p.tipo} desde ${p.base} · ${p.formatos.join(", ")} · reutiliza ${p.reutiliza.length ? p.reutiliza.join(", ") : "nada"}`);
  console.log(`  Temas: ${rutina.temas.join(" | ")}`);
  console.log(`  Tope diario: ${rutina.presupuesto_diario_usd === null ? "sin tope (no hay costos registrados en las bases)" : `${usd(rutina.presupuesto_diario_usd)} (las bases costaron ${usd(costoBase)} en clips; la voz y las imágenes van aparte)`}`);
  console.log(`  Copy: se aprueba ${rutina.aprobacion_copy === "cada_dia" ? "cada día" : "por semana"} · publicación: ${rutina.publicacion}`);
  console.log(`\nSiguiente: mostrársela al cliente, ajustar con las preguntas R1 a R7 de preguntas.md y, con su OK, npm run rutina -- ${cliente} aprobar --por "<nombre>".`);
  process.exit(0);
}

// ---------------------------------------------------------------- aprobar / pausar
if (accion === "aprobar" || accion === "pausar") {
  const r = leerJson(rutinaPath);
  if (accion === "aprobar") {
    const por = opcion("por") ?? fallar('Indicá quién la aprobó: --por "<nombre>"');
    if (JSON.stringify(r).includes("COMPLETAR")) fallar("rutina.json tiene campos sin completar (COMPLETAR): ajustalos con el cliente antes de aprobar");
    Object.assign(r, { activa: true, aprobada: { por, fecha: hoy() } });
  } else r.activa = false;
  const v = Rutina.safeParse(r);
  if (!v.success) fallar(`rutina.json no cumple su esquema: ${v.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  escribirJson(rutinaPath, r);
  console.log(accion === "aprobar" ? `✓ Rutina de ${cliente} activa (aprobada por ${r.aprobada.por} el ${r.aprobada.fecha})` : `✓ Rutina de ${cliente} en pausa`);
  process.exit(0);
}

// ---------------------------------------------------------------- hoy
const FIJOS = new Set(["tipo", "archivo", "archivos", "captura", "boton", "sitio"]);
/** Deja en COMPLETAR todo el texto de una escena o contenido, salvo archivos, botón y tipo: el copy es nuevo cada día. */
const vaciar = (v, clave) =>
  FIJOS.has(clave)
    ? v
    : typeof v === "string"
      ? "COMPLETAR"
      : Array.isArray(v)
        ? v.map((x) => vaciar(x))
        : v && typeof v === "object"
          ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, vaciar(x, k)]))
          : v;

const diaDe = (fecha) => DIAS[(new Date(`${fecha}T12:00:00`).getDay() + 6) % 7];
const sumarDia = (fecha) => {
  const d = new Date(`${fecha}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("sv-SE");
};

if (accion === "hoy") {
  const r = leerRutina();
  if (!r.activa) fallar(`La rutina de ${cliente} no está activa: se aprueba con npm run rutina -- ${cliente} aprobar --por "<nombre>"`);
  if (r.temas.some((x) => x.includes("COMPLETAR"))) fallar("rutina.json › temas tiene un COMPLETAR: definí los temas con el cliente");
  const desde = opcion("fecha") ?? hoy();
  const hasta = opcion("hasta") ?? desde;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta) || hasta < desde) fallar("Fechas como AAAA-MM-DD, y --hasta no antes de --fecha");
  const piezas = opcion("pieza") ? [r.piezas.find((p) => p.id === opcion("pieza")) ?? fallar(`No hay pieza «${opcion("pieza")}» en la rutina`)] : r.piezas;
  const todos = trabajos();
  const fechasRutina = new Set(todos.filter((t) => t.brief.rutina).map((t) => t.brief.rutina.fecha));

  let abiertos = 0;
  for (let fecha = desde; fecha <= hasta; fecha = sumarDia(fecha)) {
    if (!r.dias.includes(diaDe(fecha)) && !bandera("forzar")) {
      console.log(`· ${fecha} (${diaDe(fecha)}): no es día de rutina${desde === hasta ? " (--forzar para abrirlo igual)" : ""}`);
      continue;
    }
    // El tema rota por día de rutina (también los que se abren en esta misma corrida);
    // todas las piezas del mismo día comparten tema.
    const previas = [...fechasRutina].filter((f) => f < fecha).length;
    const tema = r.temas[previas % r.temas.length];
    fechasRutina.add(fecha);
    for (const p of piezas) {
      const id = `${fecha}-${p.id}`;
      const dir = path.join(dirTrabajos, id);
      if (fs.existsSync(dir)) {
        console.log(`· ${id}: ya existe (${etapa(todos.find((t) => t.id === id) ?? { dir, activos: [] })})`);
        continue;
      }
      const base = todos.find((t) => t.id === p.base) ?? fallar(`La base ${p.base} de la pieza «${p.id}» ya no existe en trabajos/${cliente}/`);
      fs.mkdirSync(path.join(dir, "capturas"), { recursive: true });
      fs.mkdirSync(path.join(dir, "audio"), { recursive: true });
      escribirJson(path.join(dir, "brief.json"), {
        ...base.brief,
        id,
        fecha,
        formatos: p.formatos,
        plataformas: p.plataformas,
        notas: `Rutina diaria de ${fecha}, pieza «${p.id}» (base ${p.base}). Tema del día: ${tema}.`,
        rutina: { pieza: p.id, fecha, tema },
      });
      if (base.copy) {
        const e = base.copy.elegido;
        escribirJson(path.join(dir, "copy.json"), {
          version: 1,
          aprobado: false,
          metodo: "COMPLETAR (skill cro o catalogo/prompts/copy.md, con el tema del día y sin repetir ganchos: npm run rutina -- <c> estado)",
          propuesta_valor: base.copy.propuesta_valor,
          angulos: [0, 1].map(() => ({ nombre: "COMPLETAR", gancho: "COMPLETAR", por_que: "COMPLETAR" })),
          elegido: { angulo: "COMPLETAR", gancho: "COMPLETAR", titulo: e.titulo.map(() => "COMPLETAR"), puntos: e.puntos.map(() => "COMPLETAR"), guion: e.guion.map((g) => ({ escena: g.escena, texto: "COMPLETAR" })), boton: e.boton },
          afirmaciones_usadas: [],
        });
      }
      if (base.spec) {
        const contenido = base.spec.plantilla === "explicativo" ? { escenas: base.spec.contenido.escenas.map((x) => vaciar(x)) } : vaciar(base.spec.contenido);
        escribirJson(path.join(dir, "spec.json"), { ...base.spec, id, formatos: p.formatos, contenido });
      }
      if (base.plan)
        escribirJson(path.join(dir, "plan-avatar.json"), { ...base.plan, id, escenas: base.plan.escenas.map((x) => ({ ...x, guion: x.guion === null ? null : "COMPLETAR" })) });
      // Lo reutilizado se copia con su registro: mismo archivo, mismo hash, misma herramienta y prompt.
      const registros = [];
      for (const archivo of p.reutiliza) {
        const origen = path.join(base.dir, archivo);
        if (!fs.existsSync(origen)) fallar(`La base ${p.base} ya no tiene ${archivo}`);
        fs.mkdirSync(path.dirname(path.join(dir, archivo)), { recursive: true });
        fs.copyFileSync(origen, path.join(dir, archivo));
        const reg = base.activos.find((a) => a.archivo === archivo);
        if (reg) registros.push(reg);
        else console.log(`  ! ${archivo} no estaba registrado en ${p.base}/activos.json: registralo`);
      }
      escribirJson(path.join(dir, "activos.json"), { version: 1, activos: registros });
      abiertos++;
      console.log(`✓ ${id}: ${p.tipo} desde ${p.base}, tema «${tema}»${p.reutiliza.length ? `, reutiliza ${p.reutiliza.join(", ")}` : ""}`);
    }
  }
  if (abiertos) {
    console.log(`\nPara cada trabajo (PROCESO.md, paso 9):`);
    console.log(`  1. Copy nuevo con el tema del día, sin repetir ganchos (npm run rutina -- ${cliente} estado), y OK del cliente${r.aprobacion_copy === "semanal" ? " (la semana entera de una vez)" : ""}.`);
    console.log(`  2. Completar spec.json${piezas.some((p) => TIPOS[p.tipo] === "avatar") ? " y plan-avatar.json" : ""} con ese copy y npm run validar.`);
    console.log(`  3. Costo del día con npm run clip -- ${cliente}/<id> todas (si hay clips) y la voz con estimate_only; OK del gasto${r.presupuesto_diario_usd !== null ? `, sin pasar el tope de ${usd(r.presupuesto_diario_usd)}` : ""}.`);
    console.log(`  4. Voz, clips, render, qc y entrega (${r.publicacion === "subir_en_pausa" ? "subir en pausa con OK" : "entregar los MP4"}).`);
  }
  process.exit(0);
}

// ---------------------------------------------------------------- estado
if (accion === "estado") {
  const r = fs.existsSync(rutinaPath) ? leerRutina() : null;
  const dias = Number(opcion("dias") ?? 14);
  const limite = new Date();
  limite.setDate(limite.getDate() - dias);
  const desde = limite.toLocaleDateString("sv-SE");
  const todos = trabajos();
  const deRutina = todos.filter((t) => t.brief.rutina).sort((a, b) => (a.id < b.id ? 1 : -1));
  console.log(r ? `Rutina de ${cliente}: ${r.activa ? `activa (aprobada por ${r.aprobada.por} el ${r.aprobada.fecha})` : "propuesta, sin activar"} · ${r.dias.join(", ")} · tope ${r.presupuesto_diario_usd === null ? "sin tope" : usd(r.presupuesto_diario_usd)}/día\n` : `${cliente} no tiene rutina todavía.\n`);
  const recientes = deRutina.filter((t) => t.brief.rutina.fecha >= desde);
  if (!recientes.length) console.log(`Sin trabajos de rutina en los últimos ${dias} días.`);
  for (const t of recientes) console.log(`  ${t.id.padEnd(30)} ${etapa(t).padEnd(36)} ${costo(t) ? usd(costo(t)) : ""}  ${t.brief.rutina.tema}`);
  const porDia = new Map();
  for (const t of recientes) porDia.set(t.brief.rutina.fecha, (porDia.get(t.brief.rutina.fecha) ?? 0) + costo(t));
  const pasados = [...porDia].filter(([, c]) => r?.presupuesto_diario_usd != null && c > r.presupuesto_diario_usd);
  if (pasados.length) console.log(`\n! Días que pasaron el tope: ${pasados.map(([f, c]) => `${f} (${usd(c)})`).join(", ")}`);
  // Ganchos ya usados (también los de los trabajos que no salieron de la rutina): el copy nuevo no los repite.
  const ganchos = todos
    .filter((t) => t.copy?.aprobado && t.copy.elegido?.gancho && !t.copy.elegido.gancho.includes("COMPLETAR"))
    .sort((a, b) => (a.brief.fecha < b.brief.fecha ? 1 : -1))
    .filter((t, i, lista) => lista.findIndex((x) => x.copy.elegido.gancho.trim().toLowerCase() === t.copy.elegido.gancho.trim().toLowerCase()) === i)
    .slice(0, 20);
  if (ganchos.length) {
    console.log("\nGanchos ya usados (no repetir):");
    for (const t of ganchos) console.log(`  ${t.brief.fecha} · ${t.copy.elegido.gancho}`);
  }
  process.exit(0);
}

fallar("Acción desconocida: proponer, aprobar, hoy, estado o pausar.");
