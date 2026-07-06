import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colores, espaciado, radios, tipografia } from '../theme';

/** Cabecera estándar con botón de volver y título. */
export default function CabeceraPantalla({ titulo, accion }: { titulo: string; accion?: React.ReactNode }) {
  const router = useRouter();
  return (
    <View style={estilos.cabecera}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={estilos.volver}>
        <Ionicons name="chevron-back" size={24} color={colores.texto} />
      </Pressable>
      <Text style={estilos.titulo} numberOfLines={1}>{titulo}</Text>
      <View style={estilos.derecha}>{accion}</View>
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.s,
    paddingHorizontal: espaciado.m,
    paddingVertical: espaciado.m,
  },
  volver: {
    width: 36,
    height: 36,
    borderRadius: radios.boton,
    backgroundColor: colores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { flex: 1, fontSize: 19, fontFamily: tipografia.extrabold, color: colores.texto },
  derecha: { minWidth: 36, alignItems: 'flex-end' },
});
