import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Jugador } from '../types';
import { colores, espaciado, formatearValor, radios, sombraSuave, tipografia } from '../theme';
import { variacionDiaria } from '../logic/market';
import ChipPosicion, { COLOR_POSICION } from './ChipPosicion';

interface Props {
  jugador: Jugador;
  accion?: React.ReactNode;
}

export default function TarjetaJugador({ jugador, accion }: Props) {
  const router = useRouter();
  const variacion = variacionDiaria(jugador);
  const positivo = variacion >= 0;
  const color = COLOR_POSICION[jugador.posicion];
  const ultima = jugador.puntosPorJornada[jugador.puntosPorJornada.length - 1] ?? 0;

  return (
    <Pressable
      style={({ pressed }) => [estilos.tarjeta, { opacity: pressed ? 0.9 : 1 }]}
      onPress={() => router.push({ pathname: '/jugador/[id]', params: { id: jugador.id } })}
    >
      {/* Franja de color de la posición */}
      <View style={[estilos.franja, { backgroundColor: color }]} />

      <LinearGradient
        colors={[colores.superficieAlt, colores.superficie]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={estilos.avatar}
      >
        <Text style={[estilos.dorsal, { color }]}>{jugador.dorsal}</Text>
      </LinearGradient>

      <View style={{ flex: 1 }}>
        <Text style={estilos.nombre} numberOfLines={1}>{jugador.nombre}</Text>
        <Text style={estilos.equipo} numberOfLines={1}>{jugador.equipo}</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, alignItems: 'center' }}>
          <ChipPosicion posicion={jugador.posicion} corto />
          <View style={estilos.pill}>
            <Text style={estilos.pillTexto}>Media {jugador.media}</Text>
          </View>
        </View>
      </View>

      <View style={{ alignItems: 'flex-end', gap: 3 }}>
        <Text style={estilos.valor}>{formatearValor(jugador.valor)}</Text>
        <View style={[estilos.variacion, { backgroundColor: positivo ? colores.verdeTenue : colores.rojoTenue }]}>
          <Text style={[estilos.variacionTexto, { color: positivo ? colores.verde : colores.rojo }]}>
            {positivo ? '▲' : '▼'} {formatearValor(Math.abs(variacion))}
          </Text>
        </View>
        {accion ?? <Text style={estilos.puntos}>{ultima} pts</Text>}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.m,
    backgroundColor: colores.superficie,
    borderRadius: radios.l,
    padding: espaciado.m,
    paddingLeft: espaciado.l,
    marginBottom: espaciado.s + 2,
    borderWidth: 1,
    borderColor: colores.borde,
    overflow: 'hidden',
    ...sombraSuave,
  },
  franja: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radios.m,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colores.bordeClaro,
  },
  dorsal: { fontFamily: tipografia.extrabold, fontSize: 18 },
  nombre: { fontSize: 15, fontFamily: tipografia.bold, color: colores.texto },
  equipo: { fontSize: 12, fontFamily: tipografia.regular, color: colores.textoSuave, marginTop: 1 },
  pill: { backgroundColor: colores.superficieClara, borderRadius: radios.pill, paddingHorizontal: 8, paddingVertical: 2 },
  pillTexto: { fontSize: 10, fontFamily: tipografia.semibold, color: colores.textoSuave },
  valor: { fontSize: 15, fontFamily: tipografia.extrabold, color: colores.texto },
  variacion: { borderRadius: radios.pill, paddingHorizontal: 8, paddingVertical: 2 },
  variacionTexto: { fontSize: 11, fontFamily: tipografia.bold },
  puntos: { fontSize: 11, fontFamily: tipografia.semibold, color: colores.oro, marginTop: 1 },
});
