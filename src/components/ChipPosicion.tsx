import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NOMBRE_POSICION, Posicion } from '../types';
import { radios, tipografia } from '../theme';

/** Color identificativo de cada posición (consistente en toda la app). */
export const COLOR_POSICION: Record<Posicion, string> = {
  colocador: '#F59E0B',
  opuesto: '#EF4444',
  receptor: '#3B82F6',
  central: '#10B981',
  libero: '#A855F7',
  entrenador: '#94A3B8',
};

export const ETIQUETA_POSICION: Record<Posicion, string> = {
  colocador: 'COL',
  opuesto: 'OPU',
  receptor: 'REC',
  central: 'CEN',
  libero: 'LIB',
  entrenador: 'ENT',
};

export default function ChipPosicion({ posicion, corto }: { posicion: Posicion; corto?: boolean }) {
  const color = COLOR_POSICION[posicion];
  return (
    <View style={[estilos.chip, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
      <View style={[estilos.punto, { backgroundColor: color }]} />
      <Text style={[estilos.texto, { color }]}>
        {corto ? ETIQUETA_POSICION[posicion] : NOMBRE_POSICION[posicion]}
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
