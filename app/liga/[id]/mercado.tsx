import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Boton from '@/components/Boton';
import { alerta } from '@/components/Alerta';
import CuentaAtras from '@/components/CuentaAtras';
import TarjetaJugador from '@/components/TarjetaJugador';
import { useJuego } from '@/store/juego';
import {
  cicloActual,
  expiraCiclo,
  jugadoresDelMercado,
  mejorPuja,
  pujaMinima,
} from '@/logic/mercadoLiga';
import { Jugador } from '@/types';
import { colores, degradados, espaciado, formatearValor, radios, tipografia } from '@/theme';

export default function Mercado() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const usuario = useJuego((s) => s.usuario);
  const jugadores = useJuego((s) => s.jugadores);
  const liga = useJuego((s) => s.ligas.find((l) => l.id === id));
  const equipo = useJuego((s) => s.equiposLiga[id]);
  const pujar = useJuego((s) => s.pujar);
  const sincronizarMercado = useJuego((s) => s.sincronizarMercado);
  const [seleccionado, setSeleccionado] = useState<Jugador | null>(null);
  const [importe, setImporte] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (id) sincronizarMercado(id);
    }, [id]),
  );

  const ciclo = liga ? cicloActual(liga) : 0;
  const expira = liga ? expiraCiclo(liga) : Date.now();
  const enMercado = useMemo(
    () => (liga ? jugadoresDelMercado(liga, jugadores, ciclo) : []),
    [liga?.id, jugadores, ciclo],
  );

  if (!liga || !equipo) return null;

  const abrirPuja = (j: Jugador) => {
    const minima = pujaMinima(j, liga.pujas?.[j.id]);
    setImporte(String(Math.round(minima / 10_000) / 100)); // en millones
    setSeleccionado(j);
  };

  const confirmarPuja = () => {
    if (!seleccionado) return;
    const cantidad = Math.round(parseFloat(importe.replace(',', '.')) * 1_000_000);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      return alerta({ icono: 'calculator', tono: 'aviso', titulo: 'Importe no válido', mensaje: 'Introduce la puja en millones, p. ej. 7.5' });
    }
    const error = pujar(id, seleccionado.id, cantidad);
    if (error) return alerta({ icono: 'hand-left', tono: 'peligro', titulo: 'No se pudo pujar', mensaje: error });
    setSeleccionado(null);
    alerta({ icono: 'checkmark-circle', tono: 'exito', titulo: 'Puja registrada', mensaje: 'Si nadie la supera antes del cierre, el jugador será tuyo.' });
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Cabecera del mercado */}
      <LinearGradient colors={degradados.tarjetaHero} style={estilos.cabecera}>
        <View style={{ flex: 1 }}>
          <Text style={estilos.cabeceraTitulo}>Mercado diario</Text>
          <Text style={estilos.cabeceraSub}>
            10 jugadores nuevos cada 24 h · día {ciclo + 1} de tu liga
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <CuentaAtras hasta={expira} grande alTerminar={() => sincronizarMercado(id)} />
          <Text style={estilos.presupuesto}>
            <Ionicons name="wallet-outline" size={11} color={colores.verde} />{' '}
            {formatearValor(equipo.presupuesto)}
          </Text>
        </View>
      </LinearGradient>

      <FlatList
        data={enMercado}
        keyExtractor={(j) => j.id}
        contentContainerStyle={{ padding: espaciado.l, paddingBottom: 32 }}
        renderItem={({ item }) => {
          const pujas = liga.pujas?.[item.id];
          const mejor = mejorPuja(pujas);
          const esMia = mejor?.uid === usuario?.uid;
          const yaEsMio = equipo.plantillaIds.includes(item.id);
          return (
            <TarjetaJugador
              jugador={item}
              extra={
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 5, alignItems: 'center' }}>
                  <CuentaAtras hasta={expira} />
                  {mejor && (
                    <View style={[estilos.pujaInfo, { backgroundColor: esMia ? colores.verdeTenue : colores.oroTenue }]}>
                      <Ionicons
                        name={esMia ? 'checkmark-circle' : 'flame'}
                        size={11}
                        color={esMia ? colores.verde : colores.oro}
                      />
                      <Text style={[estilos.pujaInfoTexto, { color: esMia ? colores.verde : colores.oro }]}>
                        {esMia ? 'Vas ganando' : 'Puja más alta'}: {formatearValor(mejor.cantidad)}
                      </Text>
                    </View>
                  )}
                </View>
              }
              accion={
                yaEsMio ? (
                  <Text style={estilos.tuyo}>En plantilla</Text>
                ) : (
                  <Pressable style={estilos.pujarBtn} onPress={() => abrirPuja(item)}>
                    <Ionicons name="hammer" size={13} color="#fff" />
                    <Text style={estilos.pujarTexto}>Pujar</Text>
                  </Pressable>
                )
              }
            />
          );
        }}
        ListEmptyComponent={
          <Text style={estilos.vacio}>Cargando el mercado de tu liga…</Text>
        }
      />

      {/* Modal de puja */}
      <Modal visible={!!seleccionado} transparent animationType="fade" onRequestClose={() => setSeleccionado(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={estilos.fondoModal} onPress={() => setSeleccionado(null)}>
          <Pressable style={estilos.modal} onPress={(e) => e.stopPropagation()}>
            {seleccionado && (
              <>
                <Text style={estilos.tituloModal}>Pujar por {seleccionado.nombre}</Text>
                <View style={estilos.datosPuja}>
                  <Dato etiqueta="Valor" valor={formatearValor(seleccionado.valor)} />
                  <Dato
                    etiqueta="Puja mínima"
                    valor={formatearValor(pujaMinima(seleccionado, liga.pujas?.[seleccionado.id]))}
                    color={colores.oro}
                  />
                  <Dato etiqueta="Tu caja" valor={formatearValor(equipo.presupuesto)} color={colores.verde} />
                </View>
                <View style={estilos.campoImporte}>
                  <TextInput
                    style={estilos.inputImporte}
                    keyboardType="decimal-pad"
                    value={importe}
                    onChangeText={setImporte}
                    autoFocus
                  />
                  <Text style={estilos.millones}>M€</Text>
                </View>
                <Text style={estilos.notaPuja}>
                  La subasta se cierra con el mercado. Se la lleva la puja más alta; solo pagas si ganas.
                </Text>
                <Boton titulo="Confirmar puja" variante="oro" onPress={confirmarPuja} />
                <Boton titulo="Cancelar" variante="fantasma" onPress={() => setSeleccionado(null)} />
              </>
            )}
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function Dato({ etiqueta, valor, color }: { etiqueta: string; valor: string; color?: string }) {
  return (
    <View style={estilos.dato}>
      <Text style={estilos.datoEtiqueta}>{etiqueta}</Text>
      <Text style={[estilos.datoValor, color ? { color } : null]}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.m,
    margin: espaciado.l,
    marginBottom: 0,
    borderRadius: radios.l,
    padding: espaciado.l,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  cabeceraTitulo: { fontSize: 17, fontFamily: tipografia.extrabold, color: colores.texto },
  cabeceraSub: { fontSize: 11, fontFamily: tipografia.regular, color: colores.textoSuave, marginTop: 2 },
  presupuesto: { fontSize: 12, fontFamily: tipografia.bold, color: colores.verde },
  pujaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radios.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pujaInfoTexto: { fontSize: 10, fontFamily: tipografia.bold },
  pujarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colores.primario,
    borderRadius: radios.s,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 2,
  },
  pujarTexto: { color: '#fff', fontFamily: tipografia.bold, fontSize: 12 },
  tuyo: { fontSize: 11, fontFamily: tipografia.bold, color: colores.verde, marginTop: 4 },
  vacio: { color: colores.textoTenue, textAlign: 'center', fontFamily: tipografia.regular, padding: espaciado.xl },
  fondoModal: { flex: 1, backgroundColor: colores.overlay, justifyContent: 'center', padding: espaciado.xl },
  modal: {
    backgroundColor: colores.fondoAlt,
    borderRadius: radios.xl,
    padding: espaciado.l,
    gap: espaciado.m,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  tituloModal: { fontSize: 17, fontFamily: tipografia.extrabold, color: colores.texto },
  datosPuja: { flexDirection: 'row', gap: espaciado.s },
  dato: {
    flex: 1,
    backgroundColor: colores.superficie,
    borderRadius: radios.m,
    padding: espaciado.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colores.borde,
  },
  datoEtiqueta: { fontSize: 10, fontFamily: tipografia.medium, color: colores.textoTenue },
  datoValor: { fontSize: 13, fontFamily: tipografia.extrabold, color: colores.texto, marginTop: 3 },
  campoImporte: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colores.superficie,
    borderRadius: radios.m,
    borderWidth: 1,
    borderColor: colores.primario,
    paddingHorizontal: espaciado.l,
  },
  inputImporte: {
    fontSize: 32,
    fontFamily: tipografia.extrabold,
    color: colores.texto,
    paddingVertical: 12,
    minWidth: 110,
    textAlign: 'center',
  },
  millones: { fontSize: 18, fontFamily: tipografia.bold, color: colores.textoTenue },
  notaPuja: { fontSize: 11, fontFamily: tipografia.regular, color: colores.textoTenue, textAlign: 'center', lineHeight: 16 },
});
