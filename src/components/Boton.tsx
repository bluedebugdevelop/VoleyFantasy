import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colores, degradados, radios, sombraSuave, tipografia } from '../theme';

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'rojo' | 'oro' | 'claro' | 'fantasma';
  cargando?: boolean;
  deshabilitado?: boolean;
  icono?: React.ReactNode;
  estilo?: ViewStyle;
}

export default function Boton({ titulo, onPress, variante = 'rojo', cargando, deshabilitado, icono, estilo }: Props) {
  const esGradiente = variante === 'primario' || variante === 'rojo' || variante === 'oro';
  const gradiente =
    variante === 'oro' ? degradados.oro : variante === 'primario' ? degradados.marca : degradados.rojo;
  const colorTexto = variante === 'oro' ? colores.primario : variante === 'claro' ? colores.texto : colores.textoInverso;

  const contenido = (
    <View style={estilos.contenido}>
      {cargando ? (
        <ActivityIndicator color={colorTexto} />
      ) : (
        <>
          {icono}
          <Text style={[estilos.texto, { color: colorTexto }]}>{titulo}</Text>
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
          backgroundColor: variante === 'claro' ? colores.superficieClara : 'transparent',
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
  base: { borderRadius: radios.pill, overflow: 'hidden' },
  gradiente: { borderRadius: radios.pill },
  contenido: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: { fontSize: 15, fontFamily: tipografia.bold, letterSpacing: 0.2 },
});
