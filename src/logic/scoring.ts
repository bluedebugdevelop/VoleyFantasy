import { EstadisticasJornada, Posicion } from '../types';

/**
 * Sistema de puntuación fantasy equilibrado.
 *
 * Los pesos parten de las estadísticas oficiales que publica la RFEVB en
 * DataProject (saque, recepción, ataque y bloqueo) y se corrigen por posición
 * para que un buen líbero o colocador pueda puntuar tanto como un opuesto:
 * el líbero no ataca ni bloquea (su recepción vale doble) y el colocador
 * apenas anota (recibe una base por set mayor por dirigir el juego).
 */
export const PESOS = {
  setJugado: 1,
  victoria: 2,
  ace: 3,
  errorSaque: -0.5,
  ataquePunto: 1,
  errorAtaque: -1,
  ataqueBloqueado: -0.5,
  bloqueoPunto: 2.5,
  recepcionPerfecta: 0.5,
  recepcionPositiva: 0.2,
  errorRecepcion: -1,
  colocacionExcelente: 0.5,
  errorColocacion: -1,
} as const;

interface AjustePosicion {
  recepcion: number;
  bloqueo: number;
  basePorSet: number;
}

const AJUSTES: Record<Posicion, AjustePosicion> = {
  libero: { recepcion: 1.5, bloqueo: 1.0, basePorSet: 2.0 },
  colocador: { recepcion: 1.0, bloqueo: 1.3, basePorSet: 2.0 },
  central: { recepcion: 1.0, bloqueo: 1.2, basePorSet: 1.0 },
  receptor: { recepcion: 1.2, bloqueo: 1.0, basePorSet: 1.0 },
  opuesto: { recepcion: 1.0, bloqueo: 1.0, basePorSet: 1.0 },
};

/** Puntos fantasy de un jugador en una jornada. */
export function puntosFantasy(e: EstadisticasJornada, posicion: Posicion): number {
  const a = AJUSTES[posicion];
  let p = 0;
  p += e.setsJugados * PESOS.setJugado * a.basePorSet;
  if (e.setsJugados > 0 && e.victoria) p += PESOS.victoria;

  p += e.aces * PESOS.ace;
  p += e.erroresSaque * PESOS.errorSaque;

  p += e.recepcionesPerfectas * PESOS.recepcionPerfecta * a.recepcion;
  p += e.recepcionesPositivas * PESOS.recepcionPositiva * a.recepcion;
  p += e.erroresRecepcion * PESOS.errorRecepcion;

  p += e.ataquesPunto * PESOS.ataquePunto;
  p += e.erroresAtaque * PESOS.errorAtaque;
  p += e.ataquesBloqueados * PESOS.ataqueBloqueado;

  // Bonus de eficiencia de ataque (>50% con al menos 10 intentos)
  if (e.ataquesTotales >= 10 && e.ataquesPunto / e.ataquesTotales > 0.5) p += 2;

  p += e.bloqueosPunto * PESOS.bloqueoPunto * a.bloqueo;

  p += (e.colocacionesExcelentes ?? 0) * PESOS.colocacionExcelente;
  p += (e.erroresColocacion ?? 0) * PESOS.errorColocacion;

  return Math.round(p * 10) / 10;
}

/** Media de puntos de las últimas `n` jornadas (forma reciente). */
export function forma(puntosPorJornada: number[], n = 3): number {
  if (puntosPorJornada.length === 0) return 0;
  const ultimas = puntosPorJornada.slice(-n);
  return ultimas.reduce((s, x) => s + x, 0) / ultimas.length;
}
