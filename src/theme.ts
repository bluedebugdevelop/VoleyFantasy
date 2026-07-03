/**
 * Sistema de diseño de VoleyFantasy v2.
 *
 * Paleta slate oscura profesional (estilo apps fantasy modernas): fondo casi
 * negro azulado, tarjetas azul pizarra, acento azul brillante y colores
 * semánticos nítidos. El oro se reserva para capitán/destacados.
 */
export const colores = {
  // Superficies
  fondo: '#0F1419',
  fondoAlt: '#151B24',
  superficie: '#1A2332',
  superficieAlt: '#212D40',
  superficieClara: '#2A3850',

  // Marca / acentos
  primario: '#3B82F6',
  primarioOscuro: '#1D4ED8',
  azulVivo: '#0892D0',
  oro: '#F59E0B',
  oroClaro: '#FBBF24',

  // Texto
  texto: '#FFFFFF',
  textoSuave: '#CBD5E1',
  textoTenue: '#94A3B8',
  textoMuted: '#64748B',
  textoInverso: '#FFFFFF',

  // Semánticos
  verde: '#10B981',
  rojo: '#EF4444',
  verdeTenue: 'rgba(16,185,129,0.14)',
  rojoTenue: 'rgba(239,68,68,0.14)',
  azulTenue: 'rgba(59,130,246,0.14)',
  oroTenue: 'rgba(245,158,11,0.16)',

  // Bordes
  borde: '#334155',
  bordeClaro: '#475569',
  overlay: 'rgba(5,8,14,0.78)',
} as const;

/** Degradados reutilizables (expo-linear-gradient). */
export const degradados = {
  fondo: ['#151B24', '#0F1419'] as const,
  marca: ['#3B82F6', '#1D4ED8'] as const,
  azul: ['#0892D0', '#1D4ED8'] as const,
  oro: ['#FBBF24', '#D97706'] as const,
  tarjetaHero: ['#1E3A8A', '#1A2332'] as const,
  pista: ['#B45309', '#92400E'] as const, // taraflex
  pistaLibero: ['#155E75', '#164E63'] as const, // zona trasera
  exito: ['#10B981', '#047857'] as const,
};

export const espaciado = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 };

export const radios = { s: 10, m: 12, l: 16, xl: 20, pill: 999 };

export const tipografia = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const sombra = {
  shadowColor: '#000000',
  shadowOpacity: 0.3,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 8,
} as const;

export const sombraSuave = {
  shadowColor: '#000000',
  shadowOpacity: 0.22,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
} as const;

export function formatearValor(valor: number): string {
  if (valor >= 1_000_000) {
    const m = valor / 1_000_000;
    return `${m >= 100 ? m.toFixed(0) : m.toFixed(1)} M€`;
  }
  return `${Math.round(valor / 1000)} K€`;
}

/** hh:mm:ss restantes hasta un timestamp. */
export function formatearCuentaAtras(hastaMs: number): string {
  const restante = Math.max(0, hastaMs - Date.now());
  const h = Math.floor(restante / 3_600_000);
  const m = Math.floor((restante % 3_600_000) / 60_000);
  const s = Math.floor((restante % 60_000) / 1000);
  const dd = (n: number) => String(n).padStart(2, '0');
  return `${dd(h)}:${dd(m)}:${dd(s)}`;
}
