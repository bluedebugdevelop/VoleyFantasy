import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colores, formatearCuentaAtras, radios, tipografia } from '../theme';

interface Props {
  hasta: number;
  /** Se dispara al llegar a cero (una vez). */
  alTerminar?: () => void;
  grande?: boolean;
  estilo?: ViewStyle;
}

/** Cuenta atrás hh:mm:ss que se refresca cada segundo. */
export default function CuentaAtras({ hasta, alTerminar, grande, estilo }: Props) {
  const [texto, setTexto] = useState(() => formatearCuentaAtras(hasta));

  useEffect(() => {
    let terminado = false;
    const tick = () => {
      setTexto(formatearCuentaAtras(hasta));
      if (!terminado && Date.now() >= hasta) {
        terminado = true;
        alTerminar?.();
      }
    };
    tick();
    const int = setInterval(tick, 1000);
    return () => clearInterval(int);
  }, [hasta]);

  const urgente = hasta - Date.now() < 3_600_000;
  return (
    <View style={[estilos.caja, grande && estilos.cajaGrande, urgente && { backgroundColor: colores.rojoTenue }, estilo]}>
      <Ionicons name="time-outline" size={grande ? 16 : 12} color={urgente ? colores.rojo : colores.oro} />
      <Text
        style={[
          estilos.texto,
          grande && estilos.textoGrande,
          { color: urgente ? colores.rojo : colores.oro },
        ]}
      >
        {texto}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colores.oroTenue,
    borderRadius: radios.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  cajaGrande: { paddingHorizontal: 14, paddingVertical: 7 },
  texto: { fontSize: 12, fontFamily: tipografia.bold, fontVariant: ['tabular-nums'] },
  textoGrande: { fontSize: 16 },
});
