export type Posicion = 'colocador' | 'opuesto' | 'receptor' | 'central' | 'libero';

/** Competición concreta de la que procede un jugador. */
export type Categoria = 'sp1m' | 'sp1f' | 'sp2m' | 'sp2f';

export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  sp1m: 'Superliga Masc.',
  sp1f: 'Superliga Fem.',
  sp2m: 'Superliga 2 Masc.',
  sp2f: 'Superliga 2 Fem.',
};

/**
 * Modalidad de una liga fantasy: define de qué competición(es) puedes fichar.
 * Las "mixto" combinan las dos categorías del mismo nivel (masc. + fem.).
 */
export type Modalidad = 'sp1m' | 'sp1f' | 'sp1mixto' | 'sp2m' | 'sp2f' | 'sp2mixto';

export const MODALIDADES: { id: Modalidad; nombre: string; corto: string; categorias: Categoria[] }[] = [
  { id: 'sp1m', nombre: 'Superliga (Masc.)', corto: 'SP1 M', categorias: ['sp1m'] },
  { id: 'sp1f', nombre: 'Superliga (Fem.)', corto: 'SP1 F', categorias: ['sp1f'] },
  { id: 'sp1mixto', nombre: 'Mixto (Superliga)', corto: 'SP1 Mix', categorias: ['sp1m', 'sp1f'] },
  { id: 'sp2m', nombre: 'Superliga 2 (Masc.)', corto: 'SP2 M', categorias: ['sp2m'] },
  { id: 'sp2f', nombre: 'Superliga 2 (Fem.)', corto: 'SP2 F', categorias: ['sp2f'] },
  { id: 'sp2mixto', nombre: 'Mixto 2 (Superliga 2)', corto: 'SP2 Mix', categorias: ['sp2m', 'sp2f'] },
];

export const MODALIDAD_POR_DEFECTO: Modalidad = 'sp1m';

export function categoriasDeModalidad(m: Modalidad): Categoria[] {
  return MODALIDADES.find((x) => x.id === m)!.categorias;
}

export function nombreModalidad(m: Modalidad): string {
  return MODALIDADES.find((x) => x.id === m)?.nombre ?? m;
}

export const NOMBRE_POSICION: Record<Posicion, string> = {
  colocador: 'Colocador',
  opuesto: 'Opuesto',
  receptor: 'Receptor',
  central: 'Central',
  libero: 'Líbero',
};

/** Estadísticas de un jugador en una jornada, con la nomenclatura DataProject/RFEVB. */
export interface EstadisticasJornada {
  jornada: number;
  setsJugados: number;
  victoria: boolean;
  // Saque
  aces: number;
  erroresSaque: number;
  saquesTotales: number;
  // Recepción (# perfecta, ! positiva, = error)
  recepcionesPerfectas: number;
  recepcionesPositivas: number;
  erroresRecepcion: number;
  recepcionesTotales: number;
  // Ataque
  ataquesPunto: number;
  erroresAtaque: number;
  ataquesBloqueados: number;
  ataquesTotales: number;
  // Bloqueo
  bloqueosPunto: number;
  // Colocación (solo colocadores; la RFEVB publica el ranking de colocación)
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
  /** Historial de valor de mercado (un punto por día, el último es el actual). */
  historialValor: number[];
  /** Estadísticas por jornada disputada. */
  historial: EstadisticasJornada[];
  /** Puntos fantasy por jornada (paralelo a `historial`). */
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

/** Alineación: 1 colocador, 1 opuesto, 2 centrales, 2 receptores, 1 líbero. */
export const HUECOS_ALINEACION: { posicion: Posicion; etiqueta: string }[] = [
  { posicion: 'colocador', etiqueta: 'CO' },
  { posicion: 'opuesto', etiqueta: 'OP' },
  { posicion: 'central', etiqueta: 'C1' },
  { posicion: 'central', etiqueta: 'C2' },
  { posicion: 'receptor', etiqueta: 'R1' },
  { posicion: 'receptor', etiqueta: 'R2' },
  { posicion: 'libero', etiqueta: 'LI' },
];

export const TAMANO_PLANTILLA = 10;
export const PRESUPUESTO_INICIAL = 20_000_000;

export interface MiembroLiga {
  uid: string;
  nombre: string;
  puntos: number;
}

export interface Liga {
  id: string;
  nombre: string;
  tipo: 'publica' | 'privada';
  modalidad: Modalidad;
  codigo?: string;
  creador: string;
  miembros: MiembroLiga[];
}

export interface Operacion {
  tipo: 'compra' | 'venta';
  jugadorId: string;
  nombre: string;
  importe: number;
  fecha: number;
}
