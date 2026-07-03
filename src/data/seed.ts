import { Categoria, EstadisticasJornada, Jugador, Posicion } from '../types';
import { puntosFantasy } from '../logic/scoring';
import { valorInicial } from '../logic/market';

/** Categorías repartidas entre los equipos demo (3 equipos por competición). */
const CATEGORIAS: Categoria[] = ['sp1m', 'sp1f', 'sp2m', 'sp2f'];

/**
 * Generador determinista de jugadores de ejemplo con equipos reales de la
 * Superliga masculina. Se usa como datos iniciales y como respaldo cuando
 * todavía no se ha ejecutado el scraper contra la web de la RFEVB.
 */
const EQUIPOS = [
  'Guaguas Las Palmas',
  'Unicaja Costa de Almería',
  'Melilla Sport Capital',
  'Río Duero Soria',
  'ConectaBalear CV Manacor',
  'Cisneros Alter Tenerife',
  'Pamesa Teruel Voleibol',
  'CV San Roque Batán',
  'Arenal Emevé Lugo',
  'UBE L\'Illa Grau',
  'Voleibol Almoradí',
  'Club Vóley Palma',
];

const NOMBRES = [
  'Álvaro', 'Miguel', 'Jorge', 'Pablo', 'Daniel', 'Sergio', 'Adrián', 'Javier',
  'Carlos', 'David', 'Iván', 'Rubén', 'Mario', 'Hugo', 'Marcos', 'Diego',
  'Andrés', 'Víctor', 'Raúl', 'Nicolás', 'Gonzalo', 'Martín',
];

const APELLIDOS = [
  'García', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez',
  'Ruiz', 'Díaz', 'Moreno', 'Vicente', 'Romero', 'Torres', 'Ramos', 'Gil',
  'Serrano', 'Molina', 'Castro', 'Ortega', 'Delgado', 'Vega', 'Fuentes',
];

// Posiciones de una plantilla tipo de 11 jugadores
const PLANTILLA_TIPO: Posicion[] = [
  'colocador', 'colocador', 'opuesto', 'opuesto',
  'central', 'central', 'central',
  'receptor', 'receptor', 'receptor', 'libero',
];

const JORNADAS_DISPUTADAS = 15;

/** RNG determinista (mulberry32) para que todos los clientes generen los mismos datos. */
function crearRng(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generarJornada(
  rng: () => number,
  jornada: number,
  posicion: Posicion,
  calidad: number, // 0..1
): EstadisticasJornada {
  const setsJugados = rng() < 0.1 ? 0 : 3 + Math.floor(rng() * 3);
  const juega = setsJugados > 0;
  const ataca = posicion !== 'libero' && posicion !== 'colocador';
  const recibe = posicion === 'libero' || posicion === 'receptor';
  const bloquea = posicion !== 'libero';
  const nivel = calidad * (0.7 + rng() * 0.6); // varía por jornada

  const ataquesTotales = juega && ataca ? Math.round(setsJugados * (4 + nivel * 8)) : 0;
  const ataquesPunto = Math.round(ataquesTotales * (0.3 + nivel * 0.3));
  const recepcionesTotales = juega && recibe ? Math.round(setsJugados * (3 + nivel * 4)) : 0;
  const recepcionesPerfectas = Math.round(recepcionesTotales * (0.2 + nivel * 0.3));
  const saquesTotales = juega && posicion !== 'libero' ? setsJugados * 4 : 0;

  return {
    jornada,
    setsJugados,
    victoria: juega && rng() < 0.35 + calidad * 0.3,
    aces: Math.round(saquesTotales * nivel * 0.1 * rng() * 2),
    erroresSaque: Math.round(saquesTotales * 0.15 * rng() * 2),
    saquesTotales,
    recepcionesPerfectas,
    recepcionesPositivas: Math.round((recepcionesTotales - recepcionesPerfectas) * 0.5),
    erroresRecepcion: Math.round(recepcionesTotales * 0.1 * rng() * 2),
    recepcionesTotales,
    ataquesPunto,
    erroresAtaque: Math.round(ataquesTotales * 0.12 * rng() * 2),
    ataquesBloqueados: Math.round(ataquesTotales * 0.08 * rng() * 2),
    ataquesTotales,
    bloqueosPunto: juega && bloquea
      ? Math.round(setsJugados * nivel * (posicion === 'central' ? 0.9 : 0.35) * rng() * 2)
      : 0,
    colocacionesExcelentes: juega && posicion === 'colocador' ? Math.round(setsJugados * (2 + nivel * 5) * rng()) : 0,
    erroresColocacion: juega && posicion === 'colocador' ? Math.round(setsJugados * 0.3 * rng()) : 0,
  };
}

export function generarJugadoresSeed(): Jugador[] {
  const rng = crearRng(20260703);
  const jugadores: Jugador[] = [];

  EQUIPOS.forEach((equipo, e) => {
    const categoria = CATEGORIAS[e % CATEGORIAS.length];
    const nivelEquipo = 1 - e / (EQUIPOS.length * 1.6); // los primeros equipos son mejores
    PLANTILLA_TIPO.forEach((posicion, i) => {
      const calidad = Math.min(1, Math.max(0.15, nivelEquipo * (0.6 + rng() * 0.8)));
      const nombre = `${NOMBRES[Math.floor(rng() * NOMBRES.length)]} ${
        APELLIDOS[Math.floor(rng() * APELLIDOS.length)]} ${APELLIDOS[Math.floor(rng() * APELLIDOS.length)]}`;

      const historial: EstadisticasJornada[] = [];
      const puntosPorJornada: number[] = [];
      for (let j = 1; j <= JORNADAS_DISPUTADAS; j++) {
        const stats = generarJornada(rng, j, posicion, calidad);
        historial.push(stats);
        puntosPorJornada.push(puntosFantasy(stats, posicion));
      }
      const puntosTotales = Math.round(puntosPorJornada.reduce((s, x) => s + x, 0) * 10) / 10;
      const media = Math.round((puntosTotales / JORNADAS_DISPUTADAS) * 10) / 10;
      const valor = valorInicial(media);

      // Historial de valor de los últimos 10 días con una deriva aleatoria suave
      const historialValor: number[] = [];
      let v = valor * (0.85 + rng() * 0.2);
      for (let d = 0; d < 9; d++) {
        historialValor.push(Math.round(v));
        v *= 1 + (rng() - 0.45) * 0.04;
      }
      historialValor.push(valor);

      jugadores.push({
        id: `${e}-${i}`,
        nombre,
        equipo,
        categoria,
        dorsal: i + 1,
        posicion,
        valor,
        historialValor,
        historial,
        puntosPorJornada,
        puntosTotales,
        media,
      });
    });

    // Entrenador sintético del equipo: puntúa como la media de su plantilla
    const delEquipo = jugadores.filter((j) => j.equipo === equipo);
    const mediaEq = Math.round((delEquipo.reduce((s, j) => s + j.media, 0) / delEquipo.length) * 10) / 10;
    const valorEq = valorInicial(mediaEq);
    jugadores.push({
      id: `${e}-entrenador`,
      nombre: `Míster ${equipo}`,
      equipo,
      categoria,
      dorsal: 0,
      posicion: 'entrenador',
      valor: valorEq,
      historialValor: [valorEq],
      historial: [],
      puntosPorJornada: delEquipo[0]?.puntosPorJornada.map((_, i) =>
        Math.round((delEquipo.reduce((s, j) => s + (j.puntosPorJornada[i] ?? 0), 0) / delEquipo.length) * 10) / 10,
      ) ?? [mediaEq],
      puntosTotales: Math.round(delEquipo.reduce((s, j) => s + j.puntosTotales, 0) / delEquipo.length),
      media: mediaEq,
    });
  });

  return jugadores;
}
