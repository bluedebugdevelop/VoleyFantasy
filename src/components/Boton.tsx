import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colores, degradados, radios, sombraSuave, tipografia } from '../theme';

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'oro' | 'verde' | 'claro' | 'fantasma' | 'peligro';
  cargando?: boolean;
  deshabilitado?: boolean;
  icono?: React.ReactNode;
  estilo?: ViewStyle;
  pequeno?: boolean;
}

export default function Boton({
  titulo,
  onPress,
  variante = 'primario',
  cargando,
  deshabilitado,
  icono,
  estilo,
  pequeno,
}: Props) {
  const esGradiente = variante === 'primario' || variante === 'oro' || variante === 'verde';
  const gradiente =
    variante === 'oro' ? degradados.oro : variante === 'verde' ? degradados.exito : degradados.marca;
  const colorTexto =
    variante === 'oro' ? '#1F1300' : variante === 'peligro' ? colores.rojo : colores.texto;

  const contenido = (
    <View style={[estilos.contenido, pequeno && estilos.contenidoPequeno]}>
      {cargando ? (
        <ActivityIndicator color={colorTexto} />
      ) : (
        <>
          {icono}
          <Text style={[estilos.texto, pequeno && { fontSize: 13 }, { color: colorTexto }]}>{titulo}</Text>
        </>
      )}
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={cargando || deshabilitado}
      style={({ pressed }) => [
        estilos.base,
        !esGradiente && {
          backgroundColor:
            variante === 'claro' ? colores.superficieClara : variante === 'peligro' ? colores.rojoTenue : 'transparent',
          borderWidth: variante === 'fantasma' ? 1 : 0,
          borderColor: colores.bordeClaro,
        },
        esGradiente && sombraSuave,
        { opacity: pressed ? 0.85 : deshabilitado ? 0.4 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        estilo,
      ]}
    >
      {esGradiente ? (
        <LinearGradient colors={gradiente} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.gradiente}>
          {contenido}
        </LinearGradient>
      ) : (
        contenido
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: { borderRadius: radios.s, overflow: 'hidden' },
  gradiente: { borderRadius: radios.s },
  contenido: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenidoPequeno: { paddingVertical: 8, paddingHorizontal: 14 },
  texto: { fontSize: 15, fontFamily: tipografia.bold, letterSpacing: 0.2 },
});
