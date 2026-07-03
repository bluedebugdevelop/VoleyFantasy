import React, { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Boton from '@/components/Boton';
import ChipPosicion from '@/components/ChipPosicion';
import TarjetaJugador from '@/components/TarjetaJugador';
import FondoDegradado from '@/components/FondoDegradado';
import SelectorModalidad from '@/components/SelectorModalidad';
import { useJuego } from '@/store/juego';
import { HUECOS_ALINEACION, NOMBRE_POSICION, TAMANO_PLANTILLA } from '@/types';
import { colores, degradados, espaciado, radios, sombra, tipografia } from '@/theme';

export default function Equipo() {
  const jugadores = useJuego((s) => s.jugadores);
  const modalidadActiva = useJuego((s) => s.modalidadActiva);
  const equipoActivo = useJuego((s) => s.equipoActivo);
  const alinear = useJuego((s) => s.alinear);
  const vender = useJuego((s) => s.vender);
  const [huecoAbierto, setHuecoAbierto] = useState<string | null>(null);

  const equipo = equipoActivo();
  const plantillaIds = equipo.plantillaIds;
  const alineacion = equipo.alineacion;
  const plantilla = plantillaIds
    .map((id) => jugadores.find((j) => j.id === id))
    .filter((j): j is NonNullable<typeof j> => !!j);
  const alineados = new Set(Object.values(alineacion).filter(Boolean));
  const banquillo = plantilla.filter((j) => !alineados.has(j.id));
  const hueco = HUECOS_ALINEACION.find((h) => h.etiqueta === huecoAbierto);
  const elegibles = hueco ? plantilla.filter((j) => j.posicion === hueco.posicion) : [];

  return (
    <FondoDegradado>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={estilos.header}>
          <Text style={estilos.headerTitulo}>Mi equipo</Text>
          <View style={estilos.contador}>
            <Ionicons name="people" size={14} color={colores.oro} />
            <Text style={estilos.contadorTexto}>{plantilla.length}/{TAMANO_PLANTILLA}</Text>
          </View>
        </View>

        <SelectorModalidad />

        <ScrollView contentContainerStyle={[estilos.contenido, { paddingTop: espaciado.m }]} showsVerticalScrollIndicator={false}>
          <Text style={estilos.ayuda}>Toca una posición para colocar a tu jugador</Text>

          {/* Pista de voleibol */}
          <LinearGradient colors={degradados.pista} style={[estilos.pista, sombra]}>
            <View style={estilos.lineaFondo} />
            <View style={estilos.linea3m} />
            <View style={estilos.red}>
              <Text style={estilos.redTexto}>· · · · · · · · · · · · · · · ·</Text>
            </View>

            <View style={estilos.filaPista}>
              {HUECOS_ALINEACION.slice(0, 3).map((h) => (
                <Hueco key={h.etiqueta} etiqueta={h.etiqueta} onPress={() => setHuecoAbierto(h.etiqueta)} />
              ))}
            </View>
            <View style={estilos.filaPista}>
              {HUECOS_ALINEACION.slice(3, 6).map((h) => (
                <Hueco key={h.etiqueta} etiqueta={h.etiqueta} onPress={() => setHuecoAbierto(h.etiqueta)} />
              ))}
            </View>
            <View style={[estilos.filaPista, { justifyContent: 'center' }]}>
              <Hueco etiqueta="LI" onPress={() => setHuecoAbierto('LI')} />
            </View>
          </LinearGradient>

          <View style={estilos.seccion}>
            <Ionicons name="reorder-three" size={18} color={colores.textoSuave} />
            <Text style={estilos.seccionTitulo}>Banquillo</Text>
          </View>

          {banquillo.length === 0 && (
            <View style={estilos.vacioCaja}>
              <Ionicons name="add-circle-outline" size={28} color={colores.textoTenue} />
              <Text style={estilos.vacio}>
                {plantilla.length === 0
                  ? 'Todavía no tienes jugadores. Ficha en la pestaña Mercado.'
                  : 'Todos tus jugadores están alineados.'}
              </Text>
            </View>
          )}
          {banquillo.map((j) => (
            <TarjetaJugador
              key={j.id}
              jugador={j}
              accion={
                <Pressable style={estilos.venderBtn} onPress={() => vender(j.id)}>
                  <Text style={estilos.venderTexto}>Vender</Text>
                </Pressable>
              }
            />
          ))}
        </ScrollView>

        {/* Selector de jugador */}
        <Modal visible={!!huecoAbierto} animationType="slide" transparent onRequestClose={() => setHuecoAbierto(null)}>
          <View style={estilos.fondoModal}>
            <View style={estilos.modal}>
              <View style={estilos.asa} />
              <Text style={estilos.tituloModal}>
                {hueco ? `Elige ${NOMBRE_POSICION[hueco.posicion].toLowerCase()}` : ''}
              </Text>
              <FlatList
                data={elegibles}
                keyExtractor={(j) => j.id}
                style={{ maxHeight: 360 }}
                ListEmptyComponent={
                  <Text style={estilos.vacio}>
                    No tienes ningún {hueco ? NOMBRE_POSICION[hueco.posicion].toLowerCase() : ''} en la plantilla.
                    Fíchalo en el mercado.
                  </Text>
                }
                renderItem={({ item }) => (
                  <Pressable
                    style={estilos.opcion}
                    onPress={() => {
                      alinear(huecoAbierto!, item.id);
                      setHuecoAbierto(null);
                    }}
                  >
                    <ChipPosicion posicion={item.posicion} corto />
                    <View style={{ flex: 1 }}>
                      <Text style={estilos.opcionNombre}>{item.nombre}</Text>
                      <Text style={estilos.opcionEquipo}>{item.equipo} · media {item.media} pts</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colores.textoTenue} />
                  </Pressable>
                )}
              />
              <View style={{ gap: espaciado.s, marginTop: espaciado.s }}>
                <Boton
                  titulo="Vaciar posición"
                  variante="fantasma"
                  onPress={() => {
                    alinear(huecoAbierto!, null);
                    setHuecoAbierto(null);
                  }}
                />
                <Boton titulo="Cerrar" variante="claro" onPress={() => setHuecoAbierto(null)} />
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </FondoDegradado>
  );
}

function Hueco({ etiqueta, onPress }: { etiqueta: string; onPress: () => void }) {
  const alineacion = useJuego((s) => s.equipoActivo().alineacion);
  const jugador = useJuego((s) => s.jugador);
  const j = alineacion[etiqueta] ? jugador(alineacion[etiqueta]!) : undefined;
  const h = HUECOS_ALINEACION.find((x) => x.etiqueta === etiqueta)!;
  return (
    <Pressable style={estilos.huecoWrap} onPress={onPress}>
      {j ? (
        <View style={estilos.huecoOcupado}>
          <View style={estilos.camiseta}>
            <Ionicons name="shirt" size={30} color={colores.primario} />
            <Text style={estilos.camisetaDorsal}>{j.dorsal}</Text>
          </View>
          <Text style={estilos.huecoNombre} numberOfLines={1}>
            {j.nombre.split(' ')[0]}
          </Text>
          <View style={estilos.huecoPuntosPill}>
            <Text style={estilos.huecoPuntos}>{j.puntosPorJornada[j.puntosPorJornada.length - 1] ?? 0}</Text>
          </View>
        </View>
      ) : (
        <View style={estilos.huecoVacio}>
          <Ionicons name="add" size={24} color="rgba(14,42,107,0.55)" />
          <Text style={estilos.huecoEtiqueta}>{h.etiqueta}</Text>
        </View>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: espaciado.l,
    paddingVertical: espaciado.m,
  },
  headerTitulo: { fontSize: 24, fontFamily: tipografia.extrabold, color: colores.texto },
  contador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colores.superficie,
    borderRadius: radios.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  contadorTexto: { fontSize: 13, fontFamily: tipografia.bold, color: colores.texto },
  contenido: { padding: espaciado.l, paddingTop: 0, paddingBottom: 32 },
  ayuda: { fontSize: 12, fontFamily: tipografia.regular, color: colores.textoSuave, textAlign: 'center', marginBottom: espaciado.m },
  pista: {
    borderRadius: radios.xl,
    padding: espaciado.l,
    paddingVertical: espaciado.xl,
    gap: espaciado.l,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
  },
  lineaFondo: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: radios.l,
  },
  linea3m: { position: 'absolute', top: '46%', left: 12, right: 12, height: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
  red: { alignItems: 'center', marginBottom: espaciado.xs },
  redTexto: { color: 'rgba(255,255,255,0.7)', fontSize: 12, letterSpacing: 1 },
  filaPista: { flexDirection: 'row', gap: espaciado.s, justifyContent: 'space-between' },
  huecoWrap: { flex: 1, maxWidth: 110, alignItems: 'center' },
  huecoOcupado: { alignItems: 'center', gap: 3 },
  huecoVacio: {
    width: 66,
    height: 78,
    borderRadius: radios.m,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(14,42,107,0.4)',
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  huecoEtiqueta: { fontSize: 11, fontFamily: tipografia.extrabold, color: 'rgba(14,42,107,0.7)' },
  camiseta: { alignItems: 'center', justifyContent: 'center' },
  camisetaDorsal: { position: 'absolute', top: 9, fontSize: 11, fontFamily: tipografia.extrabold, color: '#fff' },
  huecoNombre: { fontSize: 12, fontFamily: tipografia.bold, color: colores.primario, maxWidth: 90 },
  huecoPuntosPill: { backgroundColor: colores.primario, borderRadius: radios.pill, paddingHorizontal: 8, paddingVertical: 1 },
  huecoPuntos: { fontSize: 11, fontFamily: tipografia.extrabold, color: colores.oro },
  seccion: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: espaciado.xl, marginBottom: espaciado.m },
  seccionTitulo: { fontSize: 17, fontFamily: tipografia.extrabold, color: colores.texto },
  vacioCaja: {
    alignItems: 'center',
    gap: 8,
    padding: espaciado.xl,
    backgroundColor: colores.superficie,
    borderRadius: radios.l,
    borderWidth: 1,
    borderColor: colores.borde,
    borderStyle: 'dashed',
  },
  vacio: { color: colores.textoSuave, textAlign: 'center', fontFamily: tipografia.regular, lineHeight: 20, fontSize: 13 },
  venderBtn: { backgroundColor: colores.rojoTenue, borderRadius: radios.pill, paddingHorizontal: 12, paddingVertical: 4, marginTop: 2 },
  venderTexto: { color: colores.rojo, fontFamily: tipografia.bold, fontSize: 12 },
  fondoModal: { flex: 1, backgroundColor: colores.overlay, justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colores.fondoAlt,
    borderTopLeftRadius: radios.xl,
    borderTopRightRadius: radios.xl,
    padding: espaciado.l,
    paddingBottom: espaciado.xl,
    borderTopWidth: 1,
    borderColor: colores.borde,
  },
  asa: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colores.bordeClaro, marginBottom: espaciado.m },
  tituloModal: { fontSize: 18, fontFamily: tipografia.extrabold, color: colores.texto, marginBottom: espaciado.m },
  opcion: {
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
  opcionNombre: { fontSize: 14, fontFamily: tipografia.bold, color: colores.texto },
  opcionEquipo: { fontSize: 12, fontFamily: tipografia.regular, color: colores.textoSuave },
});
