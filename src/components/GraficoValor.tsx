import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colores, formatearValor, radios, tipografia } from '../theme';

/**
 * Gráfico de barras del historial de valor (sin dependencias de charting):
 * cada barra es un día; la última se resalta con degradado dorado.
 */
export default function GraficoValor({ historial }: { historial: number[] }) {
  if (historial.length < 2) return null;
  const min = Math.min(...historial);
  const max = Math.max(...historial);
  const rango = Math.max(1, max - min);
  return (
    <View>
      <View style={estilos.contenedor}>
        {historial.map((v, i) => {
          const ultima = i === historial.length - 1;
          const altura = 14 + ((v - min) / rango) * 76;
          return ultima ? (
            <LinearGradient
              key={i}
              colors={[colores.oroClaro, colores.oro]}
              style={[estilos.barra, { height: altura }]}
            />
          ) : (
            <View key={i} style={[estilos.barra, { height: altura, backgroundColor: colores.primarioOscuro }]} />
          );
        })}
      </View>
      <View style={estilos.leyenda}>
        <Text style={estilos.textoLeyenda}>mín {formatearValor(min)}</Text>
        <Text style={estilos.textoLeyenda}>máx {formatearValor(max)}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 92 },
  barra: { flex: 1, borderRadius: 4, minHeight: 6 },
  leyenda: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  textoLeyenda: { fontSize: 11, fontFamily: tipografia.medium, color: colores.textoSuave },
});
