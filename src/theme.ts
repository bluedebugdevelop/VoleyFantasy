/**
 * Sistema de diseño de La SuperFantasy.
 *
 * Paleta negro profundo + rosa potente (identidad VBStats): fondo #010000,
 * superficies violeta oscuro y acento primario #e21d66. El ámbar se reserva
 * para cuenta atrás y destacados.
 */
export const colores = {
  // Superficies
  fondo: '#010000',
  fondoAlt: '#1c1a22',
  superficie: '#241f2b',
  superficieAlt: '#2a2433',
  superficieClara: '#2f2836',

  // Marca / acentos
  primario: '#e21d66',
  primarioOscuro: '#b31551',
  primarioClaro: '#ff4d8f',
  oro: '#f59e0b',
  oroClaro: '#fbbf24',

  // Texto
  texto: '#ffffff',
  textoSuave: '#d6d3db',
  textoTenue: '#b0b0b0',
  textoMuted: '#808080',
  textoInverso: '#ffffff',

  // Semánticos
  verde: '#10b981',
  rojo: '#ef4444',
  info: '#3b82f6',
  verdeTenue: 'rgba(16,185,129,0.14)',
  rojoTenue: 'rgba(239,68,68,0.14)',
  primarioTenue: 'rgba(226,29,102,0.16)',
  oroTenue: 'rgba(245,158,11,0.16)',

  // Bordes
  borde: '#2f2836',
  bordeClaro: '#3a3242',
  overlay: 'rgba(0,0,0,0.82)',
} as const;

/** Degradados reutilizables (expo-linear-gradient). */
export const degradados = {
  fondo: ['#16141b', '#010000'] as const,
  marca: ['#ff4d8f', '#b31551'] as const,
  rosa: ['#e21d66', '#8e1141'] as const,
  oro: ['#fbbf24', '#d97706'] as const,
  tarjetaHero: ['#4d1030', '#241f2b'] as const,
  // Pista estilo retransmisión: zona de ataque salmón intensa y fondo claro
  pistaAtaque: ['#ef8a70', '#e5735a'] as const,
  pistaFondo: ['#f2ada0', '#eda092'] as const,
  exito: ['#10b981', '#047857'] as const,
};

export const espaciado = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 };

export const radios = { s: 8, m: 12, l: 16, xl: 20, pill: 999 };

export const tipografia = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const sombra = {
  shadowColor: 'rgba(226,29,102,0.3)',
  shadowOpacity: 0.37,
  shadowRadius: 7.5,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
} as const;

export const sombraSuave = {
  shadowColor: '#000000',
  shadowOpacity: 0.25,
  shadowRadius: 3.8,
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
