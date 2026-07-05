import React, { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useJuego } from '@/store/juego';
import { colores, espaciado, formatearValor, radios, tipografia } from '@/theme';

const COLORES_PODIO = ['#F59E0B', '#94A3B8', '#B45309'];

export default function Clasificacion() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const liga = useJuego((s) => s.ligas.find((l) => l.id === id));
  const usuario = useJuego((s) => s.usuario);
  const refrescarLiga = useJuego((s) => s.refrescarLiga);

  useFocusEffect(
    useCallback(() => {
      if (id) refrescarLiga(id);
    }, [id]),
  );

  if (!liga) return null;
  const clasificacion = [...liga.miembros].sort((a, b) => b.puntos - a.puntos);

  return (
    <FlatList
      data={clasificacion}
      keyExtractor={(m) => m.uid}
      contentContainerStyle={{ padding: espaciado.l, paddingBottom: 32 }}
      ListHeaderComponent={
        <View style={estilos.cabecera}>
          <Ionicons name="podium" size={16} color={colores.primario} />
          <Text style={estilos.cabeceraTexto}>Clasificación general</Text>
        </View>
      }
      renderItem={({ item, index }) => {
        const soyYo = item.uid === usuario?.uid;
        const colorPodio = COLORES_PODIO[index];
        return (
          <View style={[estilos.fila, soyYo && estilos.filaPropia]}>
            <View style={[estilos.posicion, colorPodio ? { borderColor: colorPodio } : null]}>
              <Text style={[estilos.posicionTexto, colorPodio ? { color: colorPodio } : null]}>{index + 1}</Text>
            </View>
            <View style={estilos.inicial}>
              <Text style={estilos.inicialTexto}>{item.nombre.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[estilos.nombre, soyYo && { color: colores.primario }]} numberOfLines={1}>
                {item.nombre}{soyYo ? ' (tú)' : ''}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name="briefcase-outline" size={11} color={colores.textoMuted} />
                <Text style={estilos.valorEquipo}>
                  {item.valorEquipo ? formatearValor(item.valorEquipo) : 'Equipo sin valorar'}
                </Text>
              </View>
            </View>
            <View style={estilos.puntosChip}>
              <Text style={estilos.puntos}>{item.puntos}</Text>
              <Text style={estilos.puntosEtiqueta}>pts</Text>
            </View>
          </View>
        );
      }}
    />
  );
}

const estilos = StyleSheet.create({
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: espaciado.m },
  cabeceraTexto: { fontSize: 15, fontFamily: tipografia.extrabold, color: colores.texto },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.m,
    backgroundColor: colores.superficie,
    borderRadius: radios.m,
    padding: espaciado.m,
    marginBottom: espaciado.s,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  filaPropia: { borderColor: colores.primario, backgroundColor: colores.superficieAlt },
  posicion: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colores.bordeClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posicionTexto: { fontFamily: tipografia.extrabold, color: colores.textoSuave, fontSize: 13 },
  inicial: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colores.superficieClara,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inicialTexto: { fontFamily: tipografia.bold, color: colores.texto, fontSize: 15 },
  nombre: { fontSize: 15, fontFamily: tipografia.bold, color: colores.texto },
  valorEquipo: { fontSize: 11, fontFamily: tipografia.medium, color: colores.textoMuted },
  puntosChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    backgroundColor: colores.superficieClara,
    borderRadius: radios.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  puntos: { fontSize: 15, fontFamily: tipografia.extrabold, color: colores.texto },
  puntosEtiqueta: { fontSize: 10, fontFamily: tipografia.medium, color: colores.textoTenue },
});
