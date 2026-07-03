import { Jugador } from '../types';
import { forma } from './scoring';

export const VALOR_MINIMO = 100_000;
export const VALOR_MAXIMO = 25_000_000;

function limitar(v: number): number {
  return Math.max(VALOR_MINIMO, Math.min(VALOR_MAXIMO, Math.round(v / 10_000) * 10_000));
}

/** Valor inicial de mercado en función de la media de puntos fantasy. */
export function valorInicial(mediaPuntos: number): number {
  return limitar(150_000 + Math.max(0, mediaPuntos) * 450_000);
}

/**
 * Actualización diaria de valor: sube o baja según la forma reciente frente a
 * la media de temporada (rendimiento relativo), con una variación máxima del
 * ±5% diario para que el mercado sea estable pero vivo, igual que en los
 * fantasy de fútbol.
 */
export function actualizarValorDiario(jugador: Jugador, ruidoDemanda = 0): number {
  const f = forma(jugador.puntosPorJornada);
  const rendimiento = Math.tanh((f - jugador.media) / 6); // -1..1
  const deltaPct = 0.04 * rendimiento + 0.01 * ruidoDemanda;
  return limitar(jugador.valor * (1 + deltaPct));
}

/** Variación de valor del último día, en euros. */
export function variacionDiaria(jugador: Jugador): number {
  const h = jugador.historialValor;
  if (h.length < 2) return 0;
  return h[h.length - 1] - h[h.length - 2];
}
