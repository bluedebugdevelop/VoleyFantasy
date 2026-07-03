/**
 * Scraper de la RFEVB (DataProject) — multi-competición, con entrenadores y
 * calendario.
 *
 * Por cada competición de la temporada:
 *   sp1m → Superliga Masculina      (ID=152, PID=186)
 *   sp1f → Liga Iberdrola / Fem.    (ID=151, PID=185)
 *   sp2m → Superliga Masculina 2    (ID=153, PID=187)
 *   sp2f → Superliga Femenina 2     (ID=150, PID=183)
 *
 * hace tres cosas:
 *   1. Rankings por posición (Statistics.aspx?...&mn=1..5) → jugadores con
 *      puntos fantasy y valor de mercado.
 *   2. Genera un ENTRENADOR sintético por equipo (la RFEVB no publica su
 *      estadística): su puntuación es la media de su plantilla.
 *   3. Calendario (CompetitionMatches.aspx) → partidos con jornada, fecha,
 *      equipos y resultado.
 *
 * Salidas: output/jugadores.json y output/calendario.json. Con `--subir` (y
 * serviceAccountKey.json) sube ambos a Firestore, calcula la jornada nueva
 * como delta con la ejecución anterior y aplica la variación diaria de valor.
 * Con `--reset-valores` recalcula el valor desde la media (migraciones).
 */
import * as cheerio from 'cheerio';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const COMPETICIONES = [
  { categoria: 'sp1m', nombre: 'Superliga Masculina', id: '152', pid: '186' },
  { categoria: 'sp1f', nombre: 'Liga Iberdrola (Fem)', id: '151', pid: '185' },
  { categoria: 'sp2m', nombre: 'Superliga Masculina 2', id: '153', pid: '187' },
  { categoria: 'sp2f', nombre: 'Superliga Femenina 2', id: '150', pid: '183' },
];

const urlVista = (id, pid, mn) =>
  `https://rfevb-web.dataproject.com/Statistics.aspx?ID=${id}&PID=${pid}&mn=${mn}`;
const urlCalendario = (id, pid) =>
  `https://rfevb-web.dataproject.com/CompetitionMatches.aspx?ID=${id}&PID=${pid}`;

// ---- Puntuación y mercado (mismas fórmulas que src/logic de la app) ----

const PESOS = {
  setJugado: 1, victoria: 2, ace: 3, errorSaque: -0.5,
  ataquePunto: 1, errorAtaque: -1, ataqueBloqueado: -0.5, bloqueoPunto: 2.5,
  recepcionPerfecta: 0.5, recepcionPositiva: 0.2, errorRecepcion: -1,
  colocacionExcelente: 0.5, errorColocacion: -1,
};
const AJUSTES = {
  libero: { recepcion: 1.5, bloqueo: 1.0, basePorSet: 2.0 },
  colocador: { recepcion: 1.0, bloqueo: 1.3, basePorSet: 2.0 },
  central: { recepcion: 1.0, bloqueo: 1.2, basePorSet: 1.0 },
  receptor: { recepcion: 1.2, bloqueo: 1.0, basePorSet: 1.0 },
  opuesto: { recepcion: 1.0, bloqueo: 1.0, basePorSet: 1.0 },
};

function puntosFantasy(e, posicion) {
  const a = AJUSTES[posicion];
  let p = 0;
  p += e.setsJugados * PESOS.setJugado * a.basePorSet;
  p += e.aces * PESOS.ace + e.erroresSaque * PESOS.errorSaque;
  p += e.recepcionesPerfectas * PESOS.recepcionPerfecta * a.recepcion;
  p += e.recepcionesPositivas * PESOS.recepcionPositiva * a.recepcion;
  p += e.erroresRecepcion * PESOS.errorRecepcion;
  p += e.ataquesPunto * PESOS.ataquePunto + e.erroresAtaque * PESOS.errorAtaque;
  p += e.ataquesBloqueados * PESOS.ataqueBloqueado;
  if (e.ataquesTotales >= 10 && e.ataquesPunto / e.ataquesTotales > 0.5) p += 2;
  p += e.bloqueosPunto * PESOS.bloqueoPunto * a.bloqueo;
  p += (e.colocacionesExcelentes ?? 0) * PESOS.colocacionExcelente;
  p += (e.erroresColocacion ?? 0) * PESOS.errorColocacion;
  return Math.round(p * 10) / 10;
}

// Economía de 150 M€: titular medio 6-9 M€
const VALOR_MIN = 500_000;
const VALOR_MAX = 30_000_000;
const limitar = (v) => Math.max(VALOR_MIN, Math.min(VALOR_MAX, Math.round(v / 10_000) * 10_000));
const valorInicial = (media) => limitar(1_000_000 + Math.max(0, media) * 600_000);

function actualizarValorDiario(jugador) {
  const puntos = jugador.puntosPorJornada;
  const ultimas = puntos.slice(-3);
  const forma = ultimas.length ? ultimas.reduce((s, x) => s + x, 0) / ultimas.length : 0;
  const rendimiento = Math.tanh((forma - jugador.media) / 6);
  const ruido = Math.random() * 2 - 1;
  return limitar(jugador.valor * (1 + 0.04 * rendimiento + 0.01 * ruido));
}

// ---- Descarga y parseo de rankings ----

async function descargar(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (VoleyFantasy scraper educativo)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  return res.text();
}

const num = (s) => {
  const n = parseFloat(String(s ?? '').replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

function estadisticasVacias() {
  return {
    jornada: 0, setsJugados: 0, victoria: false,
    aces: 0, erroresSaque: 0, saquesTotales: 0,
    recepcionesPerfectas: 0, recepcionesPositivas: 0, erroresRecepcion: 0, recepcionesTotales: 0,
    ataquesPunto: 0, erroresAtaque: 0, ataquesBloqueados: 0, ataquesTotales: 0,
    bloqueosPunto: 0, colocacionesExcelentes: 0, erroresColocacion: 0,
  };
}

function parsearFilas(html) {
  const $ = cheerio.load(html);
  const filas = [];
  $('tr.rgRow, tr.rgAltRow').each((_, fila) => {
    const celdas = $(fila)
      .children('td')
      .map((_, c) => $(c).text().trim().replace(/\s+/g, ' '))
      .get();
    const idxNombre = celdas.findIndex((c) => /\(.+\)/.test(c));
    if (idxNombre === -1) return;
    const m = celdas[idxNombre].match(/^(.+?)\s*\((.+)\)$/);
    if (!m) return;
    const nums = celdas.slice(idxNombre + 1).map(num);
    filas.push({ nombre: m[1].trim(), equipo: m[2].trim(), nums });
  });
  return filas;
}

const VISTAS = [
  {
    mn: 1,
    posicion: 'libero',
    aplicar: (e, n) => {
      e.recepcionesPerfectas = n[2];
      e.erroresRecepcion = n[3];
      e.recepcionesPositivas = n[4] + n[7];
      e.recepcionesTotales = n[8];
    },
  },
  ...[
    { mn: 2, posicion: 'receptor' },
    { mn: 3, posicion: 'opuesto' },
    { mn: 4, posicion: 'central' },
  ].map(({ mn, posicion }) => ({
    mn,
    posicion,
    aplicar: (e, n) => {
      e.aces = n[2];
      e.erroresSaque = n[3];
      e.saquesTotales = n[5];
      e.bloqueosPunto = n[6];
      e.ataquesPunto = n[10];
      e.erroresAtaque = n[11];
      e.ataquesBloqueados = n[12];
      e.ataquesTotales = n[13];
    },
  })),
  {
    mn: 5,
    posicion: 'colocador',
    aplicar: (e, n) => {
      e.colocacionesExcelentes = n[2];
      e.erroresColocacion = n[7];
    },
  },
];

const PRIORIDAD = { libero: 0, receptor: 1, opuesto: 2, central: 3, colocador: 4 };

async function scrapearCompeticion(comp) {
  const porClave = new Map();
  for (const vista of VISTAS) {
    const filas = parsearFilas(await descargar(urlVista(comp.id, comp.pid, vista.mn)));
    for (const fila of filas) {
      const clave = `${fila.nombre}|${fila.equipo}`;
      let j = porClave.get(clave);
      if (!j) {
        j = { nombre: fila.nombre, equipo: fila.equipo, posicion: vista.posicion, stats: estadisticasVacias() };
        porClave.set(clave, j);
      }
      if (PRIORIDAD[vista.posicion] >= PRIORIDAD[j.posicion]) j.posicion = vista.posicion;
      j.stats.setsJugados = Math.max(j.stats.setsJugados, fila.nums[1] ?? 0);
      j.partidos = Math.max(j.partidos ?? 0, fila.nums[0] ?? 0);
      vista.aplicar(j.stats, fila.nums);
    }
  }

  const jugadores = [...porClave.values()].map((bruto, i) => {
    const puntosTemporada = puntosFantasy(bruto.stats, bruto.posicion);
    const partidos = Math.max(1, bruto.partidos ?? 1);
    const media = Math.round((puntosTemporada / partidos) * 10) / 10;
    const valor = valorInicial(media);
    return {
      id: `${comp.categoria}-${bruto.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`,
      nombre: bruto.nombre,
      equipo: bruto.equipo,
      categoria: comp.categoria,
      dorsal: (i % 20) + 1,
      posicion: bruto.posicion,
      valor,
      historialValor: [valor],
      historial: [bruto.stats],
      puntosPorJornada: [media],
      puntosTotales: Math.round(puntosTemporada * 10) / 10,
      media,
    };
  });

  // Entrenador sintético por equipo: su puntuación es la media de su plantilla
  const porEquipo = new Map();
  for (const j of jugadores) {
    if (!porEquipo.has(j.equipo)) porEquipo.set(j.equipo, []);
    porEquipo.get(j.equipo).push(j);
  }
  let e = 0;
  for (const [equipo, plantilla] of porEquipo) {
    const media = Math.round((plantilla.reduce((s, j) => s + j.media, 0) / plantilla.length) * 10) / 10;
    const total = Math.round(plantilla.reduce((s, j) => s + j.puntosTotales, 0) / plantilla.length);
    const valor = valorInicial(media);
    jugadores.push({
      id: `${comp.categoria}-entrenador-${e++}`,
      nombre: `Míster ${equipo}`,
      equipo,
      categoria: comp.categoria,
      dorsal: 0,
      posicion: 'entrenador',
      valor,
      historialValor: [valor],
      historial: [],
      puntosPorJornada: [media],
      puntosTotales: total,
      media,
    });
  }
  return jugadores;
}

// ---- Calendario ----

/**
 * Parsea CompetitionMatches.aspx: recorre el DOM en orden guardando la
 * jornada del último <h3> y extrae de cada bloque `.t-row` la fecha, los dos
 * equipos (p.Calendar_p_TextRow b) y el resultado. Los bloques están
 * duplicados (vista móvil/escritorio): se deduplican por clave.
 */
function parsearCalendario(html, categoria) {
  const $ = cheerio.load(html);
  const partidos = [];
  const vistos = new Set();
  let jornada = null;
  $('h3, .t-row').each((_, el) => {
    if (el.tagName === 'h3') {
      const t = $(el).text().trim();
      if (/jornada/i.test(t)) jornada = t;
      return;
    }
    if (!jornada) return;
    const row = $(el);
    const texto = row.text().replace(/\s+/g, ' ').trim();
    // En la variante escritorio: "fecha pabellón fecha fecha LOCAL n - n VISITANTE árbitros".
    // El VISITANTE va en negrita; el LOCAL se recorta del texto entre la
    // última repetición de la fecha y el marcador/visitante.
    const regexFecha = /\d{2}\/\d{2}\/\d{4} - \d{2}:\d{2}/g;
    let ultimaFecha = null;
    let finFechas = -1;
    for (const m of texto.matchAll(regexFecha)) {
      if (!ultimaFecha) ultimaFecha = m[0];
      finFechas = m.index + m[0].length;
    }
    if (finFechas === -1) return;
    const bolds = row
      .find('span[style*="font-weight:bold"], b')
      .map((_, b) => $(b).text().replace(/\s+/g, ' ').trim())
      .get()
      .filter((t) => t && t !== '-' && !/^\d+$/.test(t) && !/\d{2}\/\d{2}\/\d{4}/.test(t));
    const visitante = bolds[bolds.length - 1];
    if (!visitante) return;
    const resto = texto.slice(finFechas).trim();
    const idxVisitante = resto.indexOf(visitante);
    if (idxVisitante <= 0) return;
    let antes = resto.slice(0, idxVisitante).trim();
    const mRes = antes.match(/(\d+)\s*-\s*(\d+)\s*$/);
    const resultado = mRes ? `${mRes[1]}-${mRes[2]}` : null;
    if (mRes) antes = antes.slice(0, mRes.index).trim();
    const local = antes;
    if (local.length < 3 || local.length > 60) return;
    const clave = `${jornada}|${local}|${visitante}`;
    if (vistos.has(clave)) return;
    vistos.add(clave);
    partidos.push({ jornada, fecha: ultimaFecha, local, visitante, resultado, categoria });
  });
  return partidos;
}

/** Convierte "dd/mm/yyyy - hh:mm" a timestamp (hora española aproximada). */
function tsDeFecha(fecha) {
  if (!fecha) return null;
  const m = fecha.match(/(\d{2})\/(\d{2})\/(\d{4}) - (\d{2}):(\d{2})/);
  if (!m) return null;
  return new Date(`${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:00+01:00`).getTime();
}

/**
 * La próxima jornada = la del primer partido sin resultado. Si la temporada
 * ya acabó (todo con resultado), devuelve la última jornada disputada.
 */
function proximaJornada(partidos) {
  if (partidos.length === 0) return [];
  const pendientes = partidos.filter((p) => !p.resultado);
  const jornada = pendientes.length > 0 ? pendientes[0].jornada : partidos[partidos.length - 1].jornada;
  return partidos.filter((p) => p.jornada === jornada);
}

// ---- Subida a Firestore ----

function restarStats(nuevas, viejas) {
  const delta = estadisticasVacias();
  for (const k of Object.keys(delta)) {
    if (typeof delta[k] === 'number') delta[k] = Math.max(0, (nuevas[k] ?? 0) - (viejas[k] ?? 0));
  }
  return delta;
}

async function subirAFirestore(jugadores, calendario, resetValores) {
  const rutaClave = join(__dirname, 'serviceAccountKey.json');
  if (!existsSync(rutaClave)) {
    console.log('Sin serviceAccountKey.json: me salto la subida a Firestore.');
    return;
  }
  const admin = await import('firebase-admin');
  admin.default.initializeApp({
    credential: admin.default.credential.cert(JSON.parse(readFileSync(rutaClave, 'utf8'))),
  });
  const db = admin.default.firestore();

  const existentes = new Map();
  (await db.collection('jugadores').get()).forEach((d) => {
    const j = d.data();
    existentes.set(`${j.categoria ?? 'sp2m'}|${j.nombre}|${j.equipo}`, j);
  });

  let lote = db.batch();
  let n = 0;
  for (const j of jugadores) {
    const previo = existentes.get(`${j.categoria}|${j.nombre}|${j.equipo}`);
    if (previo && !resetValores) {
      j.id = previo.id;
      if (j.posicion !== 'entrenador') {
        const acumuladoNuevo = j.historial[0];
        const delta = restarStats(acumuladoNuevo, previo.historialAcumulado ?? previo.historial?.[previo.historial.length - 1] ?? estadisticasVacias());
        j.historial = previo.historial ?? [];
        j.puntosPorJornada = previo.puntosPorJornada ?? j.puntosPorJornada;
        if (delta.setsJugados > 0) {
          delta.jornada = j.puntosPorJornada.length + 1;
          j.historial = [...j.historial, delta].slice(-40);
          j.puntosPorJornada = [...j.puntosPorJornada, puntosFantasy(delta, j.posicion)];
        }
        j.puntosTotales = Math.round(j.puntosPorJornada.reduce((s, x) => s + x, 0) * 10) / 10;
        j.media = Math.round((j.puntosTotales / j.puntosPorJornada.length) * 10) / 10;
      }
      j.valor = actualizarValorDiario({ ...j, valor: previo.valor });
      j.historialValor = [...(previo.historialValor ?? []).slice(-29), j.valor];
    }
    j.historialAcumulado = j.posicion !== 'entrenador' && j.historial.length ? { ...j.historial[j.historial.length - 1] } : null;
    lote.set(db.collection('jugadores').doc(j.id), j);
    if (++n % 400 === 0) {
      await lote.commit();
      lote = db.batch();
    }
  }
  await lote.commit();
  console.log(`Subidos ${jugadores.length} jugadores/entrenadores a Firestore${resetValores ? ' (valores reseteados)' : ''}.`);

  // Calendario: un doc por categoría con la próxima jornada
  for (const [categoria, partidos] of Object.entries(calendario)) {
    const proxima = proximaJornada(partidos).map((p) => ({ ...p, ts: tsDeFecha(p.fecha) }));
    await db.collection('calendario').doc(categoria).set({
      categoria,
      actualizado: Date.now(),
      proximaJornada: proxima,
    });
  }
  console.log('Calendario subido a Firestore.');
}

// ---- Main ----

const resetValores = process.argv.includes('--reset-valores');
const jugadores = [];
const calendario = {};

for (const comp of COMPETICIONES) {
  console.log(`Descargando ${comp.nombre} (${comp.categoria})…`);
  const js = await scrapearCompeticion(comp);
  console.log(`  ${js.length} fichables (con entrenadores)`);
  jugadores.push(...js);
  try {
    const partidos = parsearCalendario(await descargar(urlCalendario(comp.id, comp.pid)), comp.categoria);
    calendario[comp.categoria] = partidos;
    console.log(`  ${partidos.length} partidos de calendario`);
  } catch (e) {
    console.warn(`  calendario no disponible: ${e.message}`);
    calendario[comp.categoria] = [];
  }
}

const porCat = jugadores.reduce((m, j) => ((m[j.categoria] = (m[j.categoria] ?? 0) + 1), m), {});
console.log(`Total: ${jugadores.length} fichables`, porCat);
mkdirSync(join(__dirname, 'output'), { recursive: true });
writeFileSync(join(__dirname, 'output', 'jugadores.json'), JSON.stringify(jugadores, null, 2), 'utf8');

const proximas = {};
for (const [cat, partidos] of Object.entries(calendario)) {
  proximas[cat] = proximaJornada(partidos).map((p) => ({ ...p, ts: tsDeFecha(p.fecha) }));
}
writeFileSync(join(__dirname, 'output', 'calendario.json'), JSON.stringify(proximas, null, 2), 'utf8');
console.log('Guardados output/jugadores.json y output/calendario.json');

if (process.argv.includes('--subir')) {
  await subirAFirestore(jugadores, calendario, resetValores);
}
