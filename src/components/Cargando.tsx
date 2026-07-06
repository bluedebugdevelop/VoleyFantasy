import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colores, espaciado, tipografia } from '../theme';

/** Estado de carga centrado (evita pantallas en negro mientras llegan datos). */
export default function Cargando({ texto }: { texto?: string }) {
  return (
    <View style={estilos.caja}>
      <ActivityIndicator size="large" color={colores.primario} />
      {!!texto && <Text style={estilos.texto}>{texto}</Text>}
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: espaciado.m, backgroundColor: colores.fondo },
  texto: { fontSize: 13, fontFamily: tipografia.medium, color: colores.textoTenue },
});
