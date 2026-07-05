import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { create } from 'zustand';
import { colores, espaciado, radios, sombra, tipografia } from '../theme';

/**
 * Alertas propias de La SuperFantasy: sustituyen a Alert.alert con un diálogo
 * acorde al diseño. Uso desde cualquier sitio:
 *
 *   alerta({ icono: 'checkmark-circle', titulo: 'Puja registrada' });
 *   confirmar('¿Vender?', 'Recibirás 5 M€', () => vender());
 */
export interface BotonAlerta {
  texto: string;
  estilo?: 'primario' | 'destructivo' | 'neutro';
  onPress?: () => void;
}

interface EstadoAlerta {
  visible: boolean;
  icono?: keyof typeof Ionicons.glyphMap;
  tono?: 'primario' | 'exito' | 'peligro' | 'aviso';
  titulo: string;
  mensaje?: string;
  botones: BotonAlerta[];
}

const usarAlerta = create<EstadoAlerta>(() => ({
  visible: false,
  titulo: '',
  botones: [],
}));

export function alerta(opciones: Omit<EstadoAlerta, 'visible' | 'botones'> & { botones?: BotonAlerta[] }) {
  usarAlerta.setState({
    visible: true,
    botones: opciones.botones ?? [{ texto: 'Entendido', estilo: 'primario' }],
    icono: opciones.icono,
    tono: opciones.tono ?? 'primario',
    titulo: opciones.titulo,
    mensaje: opciones.mensaje,
  });
}

export function confirmar(
  titulo: string,
  mensaje: string,
  onConfirmar: () => void,
  opciones?: { textoOk?: string; destructivo?: boolean; icono?: keyof typeof Ionicons.glyphMap },
) {
  usarAlerta.setState({
    visible: true,
    icono: opciones?.icono ?? (opciones?.destructivo ? 'warning' : 'help-circle'),
    tono: opciones?.destructivo ? 'peligro' : 'primario',
    titulo,
    mensaje,
    botones: [
      { texto: 'Cancelar', estilo: 'neutro' },
      { texto: opciones?.textoOk ?? 'Confirmar', estilo: opciones?.destructivo ? 'destructivo' : 'primario', onPress: onConfirmar },
    ],
  });
}

const COLOR_TONO = {
  primario: colores.primario,
  exito: colores.verde,
  peligro: colores.rojo,
  aviso: colores.oro,
} as const;

/** Montar una única vez en el layout raíz. */
export default function AlertaGlobal() {
  const estado = usarAlerta();
  const cerrar = () => usarAlerta.setState({ visible: false });
  const color = COLOR_TONO[estado.tono ?? 'primario'];

  return (
    <Modal visible={estado.visible} transparent animationType="fade" onRequestClose={cerrar}>
      <View style={estilos.fondo}>
        <View style={[estilos.caja, sombra]}>
          {estado.icono && (
            <View style={[estilos.icono, { backgroundColor: `${color}22` }]}>
              <Ionicons name={estado.icono} size={30} color={color} />
            </View>
          )}
          <Text style={estilos.titulo}>{estado.titulo}</Text>
          {!!estado.mensaje && <Text style={estilos.mensaje}>{estado.mensaje}</Text>}
          <View style={estilos.botones}>
            {estado.botones.map((b, i) => {
              const primario = b.estilo === 'primario';
              const destructivo = b.estilo === 'destructivo';
              return (
                <Pressable
                  key={i}
                  style={({ pressed }) => [
                    estilos.boton,
                    primario && { backgroundColor: colores.primario },
                    destructivo && { backgroundColor: colores.rojo },
                    !primario && !destructivo && estilos.botonNeutro,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={() => {
                    cerrar();
                    b.onPress?.();
                  }}
                >
                  <Text
                    style={[
                      estilos.botonTexto,
                      !primario && !destructivo && { color: colores.textoSuave },
                    ]}
                  >
                    {b.texto}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: colores.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaciado.xl,
  },
  caja: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colores.superficie,
    borderRadius: radios.xl,
    borderWidth: 1,
    borderColor: colores.bordeClaro,
    padding: espaciado.xl,
    alignItems: 'center',
    gap: espaciado.s,
  },
  icono: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  titulo: { fontSize: 18, fontFamily: tipografia.extrabold, color: colores.texto, textAlign: 'center' },
  mensaje: {
    fontSize: 13,
    fontFamily: tipografia.regular,
    color: colores.textoTenue,
    textAlign: 'center',
    lineHeight: 19,
  },
  botones: { flexDirection: 'row', gap: espaciado.s, marginTop: espaciado.m, width: '100%' },
  boton: {
    flex: 1,
    borderRadius: radios.s,
    paddingVertical: 13,
    alignItems: 'center',
  },
  botonNeutro: { backgroundColor: colores.superficieClara, borderWidth: 1, borderColor: colores.borde },
  botonTexto: { fontSize: 14, fontFamily: tipografia.bold, color: '#fff' },
});
