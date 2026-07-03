import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colores, degradados, sombra, tipografia } from '../theme';

/** Marca de la app: balón sobre disco con degradado + wordmark opcional. */
export default function Logo({ tamano = 72, conTexto = true }: { tamano?: number; conTexto?: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 14 }}>
      <LinearGradient
        colors={degradados.marca}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[estilos.disco, { width: tamano, height: tamano, borderRadius: tamano / 2 }, sombra]}
      >
        <MaterialCommunityIcons name="volleyball" size={tamano * 0.58} color="#fff" />
      </LinearGradient>
      {conTexto && (
        <View style={{ alignItems: 'center' }}>
          <Text style={estilos.wordmark}>
            Voley<Text style={{ color: colores.primario }}>Fantasy</Text>
          </Text>
          <Text style={estilos.claim}>SUPERLIGA · RFEVB</Text>
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  disco: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  wordmark: { fontSize: 28, fontFamily: tipografia.extrabold, color: colores.texto, letterSpacing: 0.5 },
  claim: { fontSize: 11, fontFamily: tipografia.bold, color: colores.textoTenue, letterSpacing: 3, marginTop: 2 },
});
