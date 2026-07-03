/**
 * Scraper de estadísticas de la RFEVB (DataProject) — multi-competición.
 *
 * Descarga los rankings por posición de las 4 competiciones de la temporada
 * y etiqueta cada jugador con su categoría:
 *   sp1m → Superliga Masculina      (ID=152, PID=186)
 *   sp1f → Liga Iberdrola / Fem.    (ID=151, PID=185)
 *   sp2m → Superliga Masculina 2    (ID=153, PID=187)
 *   sp2f → Superliga Femenina 2     (ID=150, PID=183)
 *
 * Cada vista es Statistics.aspx?ID=<ID>&PID=<PID>&mn=<1..5> (renderizada en
 * servidor, parseable con cheerio). Calcula puntos fantasy y valor de mercado
 * y:
 *   - siempre escribe `output/jugadores.json`
 *   - con `--subir` (y `serviceAccountKey.json`) sube a la colección
 *     `jugadores` de Firestore, calcula la jornada como delta con la ejecución
 *     anterior y aplica la actualización diaria de valor de mercado.
 *
 * Ejecución diaria recomendada (gratis): GitHub Actions con cron (ver
 * .github/workflows/voleyfantasy-datos.yml).
 */
import * as cheerio from 'cheerio';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Competiciones a scrapear con su categoría, ID y PID (fase regular). */
const COMPETICIONES = [
  { categoria: 'sp1m', nombre: 'Superliga Masculina', id: '152', pid: '186' },
  { categoria: 'sp1f', nombre: 'Liga Iberdrola (Fem)', id: '151', pid: '185' },
  { categoria: 'sp2m', nombre: 'Superliga Masculina 2', id: '153', pid: '187' },
  { categoria: 'sp2f', nombre: 'Superliga Femenina 2', id: '150', pid: '183' },
];

const urlVista = (id, pid, mn) =>
  `https://rfevb-web.dataproject.com/Statistics.aspx?ID=${id}&PID=${pid}&mn=${mn}`;

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

const VALOR_MIN = 100_000;
const VALOR_MAX = 25_000_000;
const limitar = (v) => Math.max(VALOR_MIN, Math.min(VALOR_MAX, Math.round(v / 10_000) * 10_000));
const valorInicial = (media) => limitar(150_000 + Math.max(0, media) * 450_000);

function actualizarValorDiario(jugador) {
  const puntos = jugador.puntosPorJornada;
  const ultimas = puntos.slice(-3);
  const forma = ultimas.length ? ultimas.reduce((s, x) => s + x, 0) / ultimas.length : 0;
  const rendimiento = Math.tanh((forma - jugador.media) / 6);
  const ruido = Math.random() * 2 - 1;
  return limitar(jugador.valor * (1 + 0.04 * rendimiento + 0.01 * ruido));
}

// ---- Descarga y parseo ----

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

/** Mapeo de columnas por vista (símbolos DataProject: # punto/perfecta, = error, / medio). */
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

/** Scrapea una competición y devuelve sus jugadores etiquetados con la categoría. */
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
  return [...porClave.values()].map((bruto, i) => {
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
}

async function scrapear() {
  const todos = [];
  for (const comp of COMPETICIONES) {
    console.log(`Descargando ${comp.nombre} (${comp.categoria})…`);
    const jugadores = await scrapearCompeticion(comp);
    console.log(`  ${jugadores.length} jugadores`);
    todos.push(...jugadores);
  }
  return todos;
}

// ---- Subida a Firestore + jornadas + actualización diaria de mercado ----

function restarStats(nuevas, viejas) {
  const delta = estadisticasVacias();
  for (const k of Object.keys(delta)) {
    if (typeof delta[k] === 'number') delta[k] = Math.max(0, (nuevas[k] ?? 0) - (viejas[k] ?? 0));
  }
  return delta;
}

async function subirAFirestore(jugadores) {
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

  // Firestore limita cada lote a 500 escrituras; troceamos por seguridad.
  let lote = db.batch();
  let n = 0;
  for (const j of jugadores) {
    const previo = existentes.get(`${j.categoria}|${j.nombre}|${j.equipo}`);
    if (previo) {
      j.id = previo.id;
      const acumuladoNuevo = j.historial[0];
      const delta = restarStats(acumuladoNuevo, previo.historialAcumulado ?? previo.historial[previo.historial.length - 1]);
      j.historial = previo.historial;
      j.puntosPorJornada = previo.puntosPorJornada;
      if (delta.setsJugados > 0) {
        delta.jornada = j.puntosPorJornada.length + 1;
        j.historial = [...j.historial, delta].slice(-40);
        j.puntosPorJornada = [...j.puntosPorJornada, puntosFantasy(delta, j.posicion)];
      }
      j.puntosTotales = Math.round(j.puntosPorJornada.reduce((s, x) => s + x, 0) * 10) / 10;
      j.media = Math.round((j.puntosTotales / j.puntosPorJornada.length) * 10) / 10;
      j.valor = actualizarValorDiario({ ...j, valor: previo.valor });
      j.historialValor = [...(previo.historialValor ?? []).slice(-29), j.valor];
    }
    j.historialAcumulado = j.historial.length ? { ...j.historial[j.historial.length - 1] } : null;
    lote.set(db.collection('jugadores').doc(j.id), j);
    if (++n % 400 === 0) {
      await lote.commit();
      lote = db.batch();
    }
  }
  await lote.commit();
  console.log(`Subidos ${jugadores.length} jugadores a Firestore con valores actualizados.`);
}

// ---- Main ----

const jugadores = await scrapear();
const porCat = jugadores.reduce((m, j) => ((m[j.categoria] = (m[j.categoria] ?? 0) + 1), m), {});
console.log(`Total: ${jugadores.length} jugadores`, porCat);
mkdirSync(join(__dirname, 'output'), { recursive: true });
writeFileSync(join(__dirname, 'output', 'jugadores.json'), JSON.stringify(jugadores, null, 2), 'utf8');
console.log('Guardado output/jugadores.json');

if (process.argv.includes('--subir')) {
  await subirAFirestore(jugadores);
}
