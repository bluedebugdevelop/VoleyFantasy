export type Posicion = 'colocador' | 'opuesto' | 'receptor' | 'central' | 'libero' | 'entrenador';

export const NOMBRE_POSICION: Record<Posicion, string> = {
  colocador: 'Colocador',
  opuesto: 'Opuesto',
  receptor: 'Receptor',
  central: 'Central',
  libero: 'Líbero',
  entrenador: 'Entrenador',
};

/** Competición concreta de la que procede un jugador. */
export type Categoria = 'sp1m' | 'sp1f' | 'sp2m' | 'sp2f';

export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  sp1m: 'Superliga Masc.',
  sp1f: 'Superliga Fem.',
  sp2m: 'Superliga 2 Masc.',
  sp2f: 'Superliga 2 Fem.',
};

/** Modalidad de una liga fantasy: define de qué competición(es) se ficha. */
export type Modalidad = 'sp1m' | 'sp1f' | 'sp1mixto' | 'sp2m' | 'sp2f' | 'sp2mixto';

export const MODALIDADES: { id: Modalidad; nombre: string; corto: string; categorias: Categoria[] }[] = [
  { id: 'sp1m', nombre: 'Superliga (Masc.)', corto: 'SM1', categorias: ['sp1m'] },
  { id: 'sp1f', nombre: 'Superliga (Fem.)', corto: 'SF1', categorias: ['sp1f'] },
  { id: 'sp1mixto', nombre: 'Mixto Superliga', corto: 'MIX1', categorias: ['sp1m', 'sp1f'] },
  { id: 'sp2m', nombre: 'Superliga 2 (Masc.)', corto: 'SM2', categorias: ['sp2m'] },
  { id: 'sp2f', nombre: 'Superliga 2 (Fem.)', corto: 'SF2', categorias: ['sp2f'] },
  { id: 'sp2mixto', nombre: 'Mixto Superliga 2', corto: 'MIX2', categorias: ['sp2m', 'sp2f'] },
];

export function categoriasDeModalidad(m: Modalidad): Categoria[] {
  return MODALIDADES.find((x) => x.id === m)!.categorias;
}

export function nombreModalidad(m: Modalidad): string {
  return MODALIDADES.find((x) => x.id === m)?.nombre ?? m;
}

/** Estadísticas de un jugador en una jornada, con la nomenclatura DataProject/RFEVB. */
export interface EstadisticasJornada {
  jornada: number;
  setsJugados: number;
  victoria: boolean;
  aces: number;
  erroresSaque: number;
  saquesTotales: number;
  recepcionesPerfectas: number;
  recepcionesPositivas: number;
  erroresRecepcion: number;
  recepcionesTotales: number;
  ataquesPunto: number;
  erroresAtaque: number;
  ataquesBloqueados: number;
  ataquesTotales: number;
  bloqueosPunto: number;
  colocacionesExcelentes?: number;
  erroresColocacion?: number;
}

export interface Jugador {
  id: string;
  nombre: string;
  equipo: string;
  categoria: Categoria;
  dorsal: number;
  posicion: Posicion;
  valor: number;
  historialValor: number[];
  historial: EstadisticasJornada[];
  puntosPorJornada: number[];
  puntosTotales: number;
  media: number;
}

export interface Usuario {
  uid: string;
  nombre: string;
  email: string;
  demo?: boolean;
}

/** Alineación titular: 6 en pista + líbero + entrenador (coordenadas % sobre la pista). */
export const HUECOS_ALINEACION: { posicion: Posicion; etiqueta: string; x: number; y: number }[] = [
  // Zona de ataque (junto a la red)
  { posicion: 'central', etiqueta: 'C1', x: 24, y: 21 },
  { posicion: 'opuesto', etiqueta: 'OP', x: 50, y: 16 },
  { posicion: 'central', etiqueta: 'C2', x: 76, y: 21 },
  // Zona de defensa
  { posicion: 'receptor', etiqueta: 'R1', x: 24, y: 56 },
  { posicion: 'colocador', etiqueta: 'CO', x: 50, y: 62 },
  { posicion: 'receptor', etiqueta: 'R2', x: 76, y: 56 },
  // Líbero atrás
  { posicion: 'libero', etiqueta: 'LI', x: 50, y: 87 },
  // Banquillo técnico (se pinta fuera de la pista)
  { posicion: 'entrenador', etiqueta: 'EN', x: 0, y: 0 },
];

export const MAX_JUGADORES_PLANTILLA = 14;
export const MAX_ENTRENADORES_PLANTILLA = 2;
export const PRESUPUESTO_TOTAL = 150_000_000;
export const PLANTILLA_INICIAL_MIN = 50_000_000;
export const PLANTILLA_INICIAL_MAX = 60_000_000;
export const JUGADORES_MERCADO_DIARIO = 10;
export const DURACION_CICLO_MERCADO_MS = 24 * 60 * 60 * 1000;

export interface MiembroLiga {
  uid: string;
  nombre: string;
  puntos: number;
  /** Valor de mercado total de su plantilla en esta liga. */
  valorEquipo?: number;
}

/** Puja de un usuario por un jugador del mercado del ciclo actual. */
export interface Puja {
  uid: string;
  nombre: string;
  cantidad: number;
  fecha: number;
}

/** Adjudicación de un jugador al mejor postor, pendiente de reclamar. */
export interface Venta {
  jugadorId: string;
  uid: string;
  cantidad: number;
  ciclo: number;
  reclamada: boolean;
}

export interface Liga {
  id: string;
  nombre: string;
  tipo: 'publica' | 'privada';
  modalidad: Modalidad;
  codigo?: string;
  creador: string;
  /** Momento de creación: ancla del ciclo de mercado de 24 h. */
  creadaEn: number;
  miembros: MiembroLiga[];
  /** Pujas del ciclo indicado en `cicloPujas`, por jugador. */
  pujas?: Record<string, Puja[]>;
  cicloPujas?: number;
  /** Adjudicaciones de ciclos resueltos, pendientes de reclamar. */
  ventas?: Venta[];
}

/** Equipo de un usuario dentro de una liga concreta. */
export interface EquipoLiga {
  plantillaIds: string[];
  alineacion: Record<string, string | null>;
  presupuesto: number;
  /** Ya se mostró la animación de bienvenida con la plantilla inicial. */
  bienvenidaVista: boolean;
}

/** Partido del calendario oficial scrapeado de la RFEVB. */
export interface Partido {
  jornada: string;
  fecha: string | null;
  local: string;
  visitante: string;
  resultado: string | null;
  categoria: Categoria;
}

export interface Operacion {
  tipo: 'compra' | 'venta' | 'puja';
  jugadorId: string;
  nombre: string;
  importe: number;
  fecha: number;
}
