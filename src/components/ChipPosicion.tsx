import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NOMBRE_POSICION, Posicion } from '../types';
import { radios, tipografia } from '../theme';

/** Color identificativo de cada posición (consistente en toda la app). */
export const COLOR_POSICION: Record<Posicion, string> = {
  colocador: '#FFC400',
  opuesto: '#E11D3C',
  receptor: '#2E90FA',
  central: '#A56BFF',
  libero: '#22C55E',
};

export default function ChipPosicion({ posicion, corto }: { posicion: Posicion; corto?: boolean }) {
  const color = COLOR_POSICION[posicion];
  return (
    <View style={[estilos.chip, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
      <View style={[estilos.punto, { backgroundColor: color }]} />
      <Text style={[estilos.texto, { color }]}>
        {corto ? NOMBRE_POSICION[posicion].slice(0, 3).toUpperCase() : NOMBRE_POSICION[posicion]}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radios.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  punto: { width: 6, height: 6, borderRadius: 3 },
  texto: { fontSize: 11, fontFamily: tipografia.bold, letterSpacing: 0.3 },
});
