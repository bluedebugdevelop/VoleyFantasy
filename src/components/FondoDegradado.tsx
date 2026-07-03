import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { degradados } from '../theme';

/** Fondo degradado de pantalla completa (azul marino profundo). */
export default function FondoDegradado({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <LinearGradient colors={degradados.fondo} style={[estilos.fondo, style]}>
      {children}
    </LinearGradient>
  );
}

const estilos = StyleSheet.create({ fondo: { flex: 1 } });
