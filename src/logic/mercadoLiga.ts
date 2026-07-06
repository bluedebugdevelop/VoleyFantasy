import {
  categoriasDeModalidad,
  DURACION_CICLO_MERCADO_MS,
  EquipoLiga,
  HUECOS_ALINEACION,
  Jugador,
  JUGADORES_MERCADO_DIARIO,
  Liga,
  MAX_ENTRENADORES_PLANTILLA,
  MAX_JUGADORES_PLANTILLA,
  PLANTILLA_INICIAL_MAX,
  PLANTILLA_INICIAL_MIN,
  Posicion,
  PRESUPUESTO_TOTAL,
  Puja,
  Venta,
} from '../types';

/**
 * Mercado propio de cada liga.
 *
 * El mercado nace cuando se crea la liga (`creadaEn`) y rota cada 24 h justo a
 * esa misma hora. Cada ciclo saca 10 jugadores de la competición de la liga.
 * La selección es DETERMINISTA a partir de (ligaId, ciclo): todos los clientes
 * calculan exactamente el mismo mercado sin necesidad de servidor, y solo las
 * pujas se sincronizan en Firestore.
 */

// ---- RNG determinista ----

/** Hash FNV-1a de una cadena → semilla de 32 bits. */
function semillaDe(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: RNG reproducible. */
function crearRng(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Ciclo de mercado ----

/** Ciclo actual del mercado de una liga (0 = primer día). */
export function cicloActual(liga: Liga, ahora = Date.now()): number {
  return Math.max(0, Math.floor((ahora - liga.creadaEn) / DURACION_CICLO_MERCADO_MS));
}

/** Momento en que expira el ciclo actual (misma hora a la que se creó la liga). */
export function expiraCiclo(liga: Liga, ciclo = cicloActual(liga)): number {
  return liga.creadaEn + (ciclo + 1) * DURACION_CICLO_MERCADO_MS;
}

/** Pool de fichables de la modalidad de la liga. */
export function poolDeLiga(liga: Liga, jugadores: Jugador[]): Jugador[] {
  const cats = categoriasDeModalidad(liga.modalidad);
  return jugadores.filter((j) => cats.includes(j.categoria));
}

const POSICIONES_MERCADO: Posicion[] = ['colocador', 'opuesto', 'central', 'receptor', 'libero', 'entrenador'];

/**
 * Jugadores ya en propiedad de algún miembro de la liga. Es DETERMINISTA
 * (igual en todos los clientes): las plantillas iniciales se recalculan por
 * uid y las subastas ganadas vienen del documento compartido de la liga.
 */
export function idsOcupados(liga: Liga, jugadores: Jugador[]): Set<string> {
  const ocupados = new Set<string>();
  // Mismo reparto secuencial que plantillaInicialMiembro
  for (const m of liga.miembros ?? []) {
    for (const id of plantillaInicial(liga.id, m.uid, liga, jugadores, ocupados).ids) ocupados.add(id);
  }
  for (const v of liga.ventas ?? []) ocupados.add(v.jugadorId);
  return ocupados;
}

/**
 * Los 14 jugadores del mercado del ciclo (determinista): 2 por posición y, si
 * sobran huecos, se completan con fichables aleatorios. Nunca salen jugadores
 * que ya pertenezcan a algún miembro de la liga.
 */
export function jugadoresDelMercado(liga: Liga, jugadores: Jugador[], ciclo = cicloActual(liga)): Jugador[] {
  const ocupados = idsOcupados(liga, jugadores);
  const pool = poolDeLiga(liga, jugadores).filter((j) => !ocupados.has(j.id));
  if (pool.length === 0) return [];
  const rng = crearRng(semillaDe(`${liga.id}|mercado|${ciclo}`));
  const elegidos = new Set<string>();
  const resultado: Jugador[] = [];

  const tomarAleatorio = (candidatos: Jugador[], n: number) => {
    const disponibles = candidatos.filter((j) => !elegidos.has(j.id));
    for (let k = 0; k < n && disponibles.length > 0; k++) {
      const i = Math.floor(rng() * disponibles.length);
      const [j] = disponibles.splice(i, 1);
      elegidos.add(j.id);
      resultado.push(j);
    }
  };

  // 2 por posición
  for (const pos of POSICIONES_MERCADO) {
    tomarAleatorio(pool.filter((j) => j.posicion === pos), 2);
  }
  // Completa hasta JUGADORES_MERCADO_DIARIO (14) con cualquiera
  tomarAleatorio(pool, JUGADORES_MERCADO_DIARIO - resultado.length);

  return resultado;
}

// ---- Pujas ----

export function mejorPuja(pujas: Puja[] | undefined): Puja | null {
  if (!pujas || pujas.length === 0) return null;
  return [...pujas].sort((a, b) => b.cantidad - a.cantidad || a.fecha - b.fecha)[0];
}

/** Puja mínima admisible por un jugador dado el estado actual. */
export function pujaMinima(jugador: Jugador, pujas: Puja[] | undefined): number {
  const mejor = mejorPuja(pujas);
  return mejor ? mejor.cantidad + 100_000 : jugador.valor;
}

/** Valida una puja contra el equipo del usuario. Devuelve null si es válida. */
export function validarPuja(
  cantidad: number,
  jugador: Jugador,
  pujas: Puja[] | undefined,
  equipo: EquipoLiga,
  todos: Jugador[],
): string | null {
  if (equipo.plantillaIds.includes(jugador.id)) return 'Ya tienes este jugador';
  if (cantidad > equipo.presupuesto) return 'No tienes presupuesto suficiente';
  if (cantidad < pujaMinima(jugador, pujas)) return 'La puja debe superar la más alta (y el valor del jugador)';
  if (!cabeEnPlantilla(equipo, jugador, todos)) {
    return jugador.posicion === 'entrenador'
      ? `Máximo ${MAX_ENTRENADORES_PLANTILLA} entrenadores en plantilla`
      : `Máximo ${MAX_JUGADORES_PLANTILLA} jugadores en plantilla`;
  }
  return null;
}

export function contarPlantilla(equipo: EquipoLiga, todos: Jugador[]): { jugadores: number; entrenadores: number } {
  let j = 0;
  let e = 0;
  for (const id of equipo.plantillaIds) {
    const x = todos.find((t) => t.id === id);
    if (!x) continue;
    if (x.posicion === 'entrenador') e++;
    else j++;
  }
  return { jugadores: j, entrenadores: e };
}

export function cabeEnPlantilla(equipo: EquipoLiga, jugador: Jugador, todos: Jugador[]): boolean {
  const { jugadores, entrenadores } = contarPlantilla(equipo, todos);
  return jugador.posicion === 'entrenador'
    ? entrenadores < MAX_ENTRENADORES_PLANTILLA
    : jugadores < MAX_JUGADORES_PLANTILLA;
}

/**
 * Resuelve las pujas de un ciclo ya expirado: el mejor postor de cada jugador
 * gana la subasta. Devuelve las ventas generadas (pendientes de que cada
 * ganador las reclame desde su propio cliente).
 */
export function resolverPujas(pujas: Record<string, Puja[]>, ciclo: number): Venta[] {
  const ventas: Venta[] = [];
  for (const [jugadorId, lista] of Object.entries(pujas)) {
    const mejor = mejorPuja(lista);
    if (mejor) {
      ventas.push({ jugadorId, uid: mejor.uid, cantidad: mejor.cantidad, ciclo, reclamada: false });
    }
  }
  return ventas;
}

// ---- Plantilla inicial ----

const POSICIONES_INICIALES = ['colocador', 'opuesto', 'central', 'central', 'receptor', 'receptor', 'libero'] as const;

/**
 * Plantilla inicial determinista para (liga, usuario): 7 jugadores que cubren
 * todas las posiciones y suman entre 50 y 60 M€. El presupuesto restante es
 * 150 M€ menos el coste del equipo regalado. `excluidos` permite repartir sin
 * duplicados entre miembros (ver plantillaInicialMiembro).
 */
export function plantillaInicial(
  ligaId: string,
  uid: string,
  liga: Liga,
  jugadores: Jugador[],
  excluidos: Set<string> = new Set(),
): { ids: string[]; coste: number; presupuesto: number } {
  const pool = poolDeLiga(liga, jugadores).filter((j) => !excluidos.has(j.id));
  const porPosicion = new Map<string, Jugador[]>();
  for (const p of POSICIONES_INICIALES) {
    if (!porPosicion.has(p)) porPosicion.set(p, pool.filter((j) => j.posicion === p));
  }
  const rng = crearRng(semillaDe(`${ligaId}|inicial|${uid}`));

  let mejor: Jugador[] = [];
  let mejorDistancia = Infinity;
  for (let intento = 0; intento < 400; intento++) {
    const eleccion: Jugador[] = [];
    const usados = new Set<string>();
    let valido = true;
    for (const pos of POSICIONES_INICIALES) {
      const candidatos = (porPosicion.get(pos) ?? []).filter((j) => !usados.has(j.id));
      if (candidatos.length === 0) {
        valido = false;
        break;
      }
      const elegido = candidatos[Math.floor(rng() * candidatos.length)];
      usados.add(elegido.id);
      eleccion.push(elegido);
    }
    if (!valido) continue;
    const coste = eleccion.reduce((s, j) => s + j.valor, 0);
    if (coste >= PLANTILLA_INICIAL_MIN && coste <= PLANTILLA_INICIAL_MAX) {
      mejor = eleccion;
      break;
    }
    const centro = (PLANTILLA_INICIAL_MIN + PLANTILLA_INICIAL_MAX) / 2;
    const distancia = Math.abs(coste - centro);
    if (distancia < mejorDistancia) {
      mejorDistancia = distancia;
      mejor = eleccion;
    }
  }

  const coste = mejor.reduce((s, j) => s + j.valor, 0);
  return { ids: mejor.map((j) => j.id), coste, presupuesto: PRESUPUESTO_TOTAL - coste };
}

/**
 * Plantilla inicial SIN duplicados entre miembros: se reparte en el orden de
 * ingreso a la liga (compartido vía Firestore), excluyendo lo ya repartido a
 * los anteriores. Determinista en todos los clientes.
 */
export function plantillaInicialMiembro(
  liga: Liga,
  uid: string,
  jugadores: Jugador[],
): { ids: string[]; coste: number; presupuesto: number } {
  const excluidos = new Set<string>();
  for (const m of liga.miembros ?? []) {
    if (m.uid === uid) return plantillaInicial(liga.id, uid, liga, jugadores, excluidos);
    for (const id of plantillaInicial(liga.id, m.uid, liga, jugadores, excluidos).ids) excluidos.add(id);
  }
  // No aparece en miembros todavía (recién unido): excluye a todos los demás.
  return plantillaInicial(liga.id, uid, liga, jugadores, excluidos);
}

/** Alineación automática con la plantilla inicial (rellena los 7 huecos de pista). */
export function alinearInicial(ids: string[], jugadores: Jugador[]): Record<string, string | null> {
  const alineacion: Record<string, string | null> = {};
  const disponibles = new Set(ids);
  for (const hueco of HUECOS_ALINEACION) {
    alineacion[hueco.etiqueta] = null;
    for (const id of disponibles) {
      const j = jugadores.find((x) => x.id === id);
      if (j && j.posicion === hueco.posicion) {
        alineacion[hueco.etiqueta] = id;
        disponibles.delete(id);
        break;
      }
    }
  }
  return alineacion;
}
