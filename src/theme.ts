/**
 * Sistema de diseño de VoleyFantasy.
 *
 * Tema oscuro premium inspirado en los fantasy modernos (LaLiga Fantasy,
 * Biwenger) con la identidad de la RFEVB: azul marino profundo de base y
 * acentos en rojo y oro/amarillo.
 */
export const colores = {
  // Marca
  primario: '#0E2A6B',
  primarioClaro: '#1E44A0',
  rojo: '#E11D3C',
  rojoOscuro: '#B0122B',
  amarillo: '#FFC400',
  oro: '#FFD24C',

  // Superficies (fondo oscuro)
  fondo: '#080F24',
  fondoAlt: '#0C1530',
  superficie: '#121D3D',
  superficieAlt: '#18244B',
  superficieClara: '#1E2C57',

  // Texto
  texto: '#FFFFFF',
  textoSuave: '#93A1C4',
  textoTenue: '#5E6C93',
  textoInverso: '#FFFFFF',

  // Estados
  verde: '#22C55E',
  verdeTenue: 'rgba(34,197,94,0.15)',
  rojoTenue: 'rgba(225,29,60,0.15)',

  borde: 'rgba(255,255,255,0.08)',
  bordeClaro: 'rgba(255,255,255,0.14)',
  overlay: 'rgba(4,8,20,0.72)',
} as const;

/** Degradados reutilizables (para expo-linear-gradient). */
export const degradados = {
  fondo: ['#0C1530', '#080F24'] as const,
  marca: ['#1E44A0', '#0E2A6B'] as const,
  rojo: ['#F0324F', '#B0122B'] as const,
  oro: ['#FFD24C', '#F5A623'] as const,
  tarjetaHero: ['#1E44A0', '#0E2A6B', '#0A1F52'] as const,
  pista: ['#F0A04B', '#E1832B'] as const,
};

export const espaciado = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 };

export const radios = { s: 10, m: 14, l: 20, xl: 28, pill: 999 };

export const tipografia = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

/** Sombra suave para tarjetas sobre fondo oscuro. */
export const sombra = {
  shadowColor: '#000000',
  shadowOpacity: 0.35,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 8,
} as const;

export const sombraSuave = {
  shadowColor: '#000000',
  shadowOpacity: 0.25,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 4,
} as const;

export function formatearValor(valor: number): string {
  if (valor >= 1_000_000) return `${(valor / 1_000_000).toFixed(2)} M€`;
  return `${Math.round(valor / 1000)} K€`;
}
