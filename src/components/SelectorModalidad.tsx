import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { MODALIDADES } from '../types';
import { useJuego } from '../store/juego';
import { colores, radios, tipografia } from '../theme';

/** Selector horizontal de la modalidad activa (competición que gestionas). */
export default function SelectorModalidad() {
  const modalidadActiva = useJuego((s) => s.modalidadActiva);
  const setModalidadActiva = useJuego((s) => s.setModalidadActiva);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={estilos.contenedor}
      style={estilos.scroll}
    >
      {MODALIDADES.map((m) => {
        const activa = m.id === modalidadActiva;
        return (
          <Pressable
            key={m.id}
            style={[estilos.chip, activa && estilos.chipActivo]}
            onPress={() => setModalidadActiva(m.id)}
          >
            <Text style={[estilos.texto, activa && estilos.textoActivo]}>{m.nombre}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  scroll: { flexGrow: 0 },
  contenedor: { gap: 8, paddingHorizontal: 16, paddingVertical: 4 },
  chip: {
    borderRadius: radios.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  chipActivo: { backgroundColor: colores.oro, borderColor: colores.oro },
  texto: { fontSize: 13, fontFamily: tipografia.semibold, color: colores.textoSuave },
  textoActivo: { color: colores.primario, fontFamily: tipografia.bold },
});
