import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Boton from '@/components/Boton';
import ChipPosicion, { COLOR_POSICION, ETIQUETA_POSICION } from '@/components/ChipPosicion';
import TarjetaJugador from '@/components/TarjetaJugador';
import { confirmar } from '@/components/Alerta';
import { useJuego } from '@/store/juego';
import { contarPlantilla } from '@/logic/mercadoLiga';
import {
  HUECOS_ALINEACION,
  Jugador,
  MAX_ENTRENADORES_PLANTILLA,
  MAX_JUGADORES_PLANTILLA,
  NOMBRE_POSICION,
} from '@/types';
import { colores, degradados, espaciado, formatearValor, radios, sombraSuave, tipografia } from '@/theme';

type Vista = 'equipo' | 'plantilla';

export default function Equipo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const jugadores = useJuego((s) => s.jugadores);
  const equipo = useJuego((s) => s.equiposLiga[id]);
  const alinear = useJuego((s) => s.alinear);
  const vender = useJuego((s) => s.vender);
  const puntosJornada = useJuego((s) => s.puntosJornada);
  const valorEquipo = useJuego((s) => s.valorEquipo);
  const [vista, setVista] = useState<Vista>('equipo');
  const [huecoAbierto, setHuecoAbierto] = useState<string | null>(null);

  if (!equipo) return null;

  const plantilla = equipo.plantillaIds
    .map((pid) => jugadores.find((j) => j.id === pid))
    .filter((j): j is Jugador => !!j);
  const { jugadores: nJugadores, entrenadores: nEntrenadores } = contarPlantilla(equipo, jugadores);
  const alineados = new Set(Object.values(equipo.alineacion).filter(Boolean));
  const hueco = HUECOS_ALINEACION.find((h) => h.etiqueta === huecoAbierto);
  const elegibles = hueco ? plantilla.filter((j) => j.posicion === hueco.posicion) : [];

  const confirmarVenta = (j: Jugador) => {
    confirmar(
      `¿Vender a ${j.nombre.split(' ')[0]}?`,
      `Recibirás ${formatearValor(j.valor)} en tu presupuesto y saldrá de tu plantilla.`,
      () => vender(id, j.id),
      { textoOk: 'Vender', destructivo: true, icono: 'cash-outline' },
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Tab Equipo | Plantilla */}
      <View style={estilos.tabs}>
        <Pressable
          style={[estilos.tab, vista === 'equipo' && estilos.tabActiva]}
          onPress={() => setVista('equipo')}
        >
          <Ionicons name="grid-outline" size={15} color={vista === 'equipo' ? '#fff' : colores.textoMuted} />
          <Text style={[estilos.tabTexto, vista === 'equipo' && { color: '#fff' }]}>Equipo</Text>
        </Pressable>
        <Pressable
          style={[estilos.tab, vista === 'plantilla' && estilos.tabActiva]}
          onPress={() => setVista('plantilla')}
        >
          <Ionicons name="list-outline" size={15} color={vista === 'plantilla' ? '#fff' : colores.textoMuted} />
          <Text style={[estilos.tabTexto, vista === 'plantilla' && { color: '#fff' }]}>Plantilla</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <View style={estilos.datoCabecera}>
          <Text style={estilos.datoCabeceraValor}>{puntosJornada(id)} pts</Text>
          <Text style={estilos.datoCabeceraEtiqueta}>jornada</Text>
        </View>
        <View style={estilos.datoCabecera}>
          <Text style={[estilos.datoCabeceraValor, { color: colores.verde }]}>
            {formatearValor(equipo.presupuesto)}
          </Text>
          <Text style={estilos.datoCabeceraEtiqueta}>caja</Text>
        </View>
      </View>

      {vista === 'equipo' ? (
        <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
          {/* Pista estilo retransmisión */}
          <View style={[estilos.pista, sombraSuave]}>
            {/* Grada oscura tras la red */}
            <View style={estilos.grada} />
            {/* Red superior con malla */}
            <View style={estilos.redBanda} />
            <View style={estilos.redMalla}>
              {Array.from({ length: 48 }).map((_, i) => (
                <View key={i} style={estilos.redCelda} />
              ))}
            </View>

            {/* Zona de ataque */}
            <LinearGradient colors={degradados.pistaAtaque} style={estilos.zonaAtaque}>
              <View style={estilos.filaFichas}>
                <Ficha ligaId={id} etiqueta="C1" onPress={() => setHuecoAbierto('C1')} />
                <Ficha ligaId={id} etiqueta="OP" onPress={() => setHuecoAbierto('OP')} />
                <Ficha ligaId={id} etiqueta="C2" onPress={() => setHuecoAbierto('C2')} />
              </View>
            </LinearGradient>

            {/* Zona de defensa */}
            <LinearGradient colors={degradados.pistaFondo} style={estilos.zonaDefensa}>
              <View style={estilos.filaFichas}>
                <Ficha ligaId={id} etiqueta="R1" onPress={() => setHuecoAbierto('R1')} />
                <Ficha ligaId={id} etiqueta="CO" onPress={() => setHuecoAbierto('CO')} />
                <Ficha ligaId={id} etiqueta="R2" onPress={() => setHuecoAbierto('R2')} />
              </View>
            </LinearGradient>

            {/* Líneas laterales */}
            <View style={[estilos.lineaLateral, { left: 8 }]} />
            <View style={[estilos.lineaLateral, { right: 8 }]} />
          </View>

          {/* Líbero + Entrenador bajo la pista */}
          <View style={estilos.bancos}>
            <View style={estilos.banco}>
              <Text style={estilos.bancoTitulo}>LÍBERO</Text>
              <Ficha ligaId={id} etiqueta="LI" oscuro onPress={() => setHuecoAbierto('LI')} />
            </View>
            <View style={estilos.banco}>
              <Text style={estilos.bancoTitulo}>ENTRENADOR</Text>
              <Ficha ligaId={id} etiqueta="EN" oscuro onPress={() => setHuecoAbierto('EN')} />
            </View>
          </View>

          <View style={estilos.resumenValor}>
            <Ionicons name="briefcase-outline" size={14} color={colores.textoTenue} />
            <Text style={estilos.resumenValorTexto}>
              Valor total del equipo: {formatearValor(valorEquipo(id))}
            </Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={plantilla}
          keyExtractor={(j) => j.id}
          contentContainerStyle={estilos.contenido}
          ListHeaderComponent={
            <View style={estilos.limites}>
              <View style={estilos.limiteChip}>
                <Ionicons name="person" size={12} color={colores.primario} />
                <Text style={estilos.limiteTexto}>
                  {nJugadores}/{MAX_JUGADORES_PLANTILLA} jugadores
                </Text>
              </View>
              <View style={estilos.limiteChip}>
                <MaterialCommunityIcons name="whistle" size={13} color={colores.oro} />
                <Text style={estilos.limiteTexto}>
                  {nEntrenadores}/{MAX_ENTRENADORES_PLANTILLA} entrenadores
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <TarjetaJugador
              jugador={item}
              extra={
                alineados.has(item.id) ? (
                  <Text style={estilos.etiquetaTitular}>● Titular</Text>
                ) : undefined
              }
              accion={
                <Pressable style={estilos.venderBtn} onPress={() => confirmarVenta(item)}>
                  <Text style={estilos.venderTexto}>Vender</Text>
                </Pressable>
              }
            />
          )}
          ListEmptyComponent={
            <Text style={estilos.vacio}>Tu plantilla está vacía. Puja en el mercado para fichar.</Text>
          }
        />
      )}

      {/* Selector de jugador (hoja inferior) */}
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
              style={{ maxHeight: 340 }}
              ListEmptyComponent={
                <Text style={estilos.vacio}>
                  No tienes ningún {hueco ? NOMBRE_POSICION[hueco.posicion].toLowerCase() : ''} en la
                  plantilla. Puja por uno en el mercado.
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={estilos.opcion}
                  onPress={() => {
                    alinear(id, huecoAbierto!, item.id);
                    setHuecoAbierto(null);
                  }}
                >
                  <ChipPosicion posicion={item.posicion} corto />
                  <View style={{ flex: 1 }}>
                    <Text style={estilos.opcionNombre}>{item.nombre}</Text>
                    <Text style={estilos.opcionEquipo}>{item.equipo} · media {item.media}</Text>
                  </View>
                  {alineados.has(item.id) && <Text style={estilos.etiquetaTitular}>Titular</Text>}
                  <Ionicons name="chevron-forward" size={18} color={colores.textoMuted} />
                </Pressable>
              )}
            />
            <View style={{ gap: espaciado.s, marginTop: espaciado.s }}>
              <Boton
                titulo="Vaciar posición"
                variante="fantasma"
                onPress={() => {
                  alinear(id, huecoAbierto!, null);
                  setHuecoAbierto(null);
                }}
              />
              <Boton titulo="Cerrar" variante="claro" onPress={() => setHuecoAbierto(null)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/**
 * Ficha estilo retransmisión: camiseta con dorsal + placa con nombre y una
 * banda inferior blanca con los puntos.
 */
function Ficha({
  ligaId,
  etiqueta,
  oscuro,
  onPress,
}: {
  ligaId: string;
  etiqueta: string;
  oscuro?: boolean;
  onPress: () => void;
}) {
  const equipo = useJuego((s) => s.equiposLiga[ligaId]);
  const jugadores = useJuego((s) => s.jugadores);
  const jugador = (jid: string) => jugadores.find((j) => j.id === jid);
  const h = HUECOS_ALINEACION.find((x) => x.etiqueta === etiqueta)!;
  const j = equipo?.alineacion[etiqueta] ? jugador(equipo.alineacion[etiqueta]!) : undefined;
  const color = COLOR_POSICION[h.posicion];
  const esEntrenador = h.posicion === 'entrenador';

  return (
    <Pressable style={estilos.ficha} onPress={onPress}>
      {j ? (
        <>
          <View style={estilos.camiseta}>
            {esEntrenador ? (
              <MaterialCommunityIcons name="whistle" size={40} color={color} />
            ) : (
              <>
                <Ionicons name="shirt" size={52} color={color} />
                <Text style={estilos.dorsal}>{j.dorsal}</Text>
              </>
            )}
          </View>
          <View style={estilos.placa}>
            <Text style={estilos.placaNombre} numberOfLines={1}>
              {ETIQUETA_POSICION[h.posicion].charAt(0)} {j.nombre.split(' ')[0].toUpperCase()}
            </Text>
          </View>
          <View style={estilos.placaPuntos}>
            <Text style={estilos.placaPuntosTexto}>
              {j.puntosPorJornada[j.puntosPorJornada.length - 1] ?? 0}
              <Text style={estilos.placaPuntosUnidad}> pts</Text>
            </Text>
          </View>
        </>
      ) : (
        <>
          <View style={[estilos.camisetaVacia, oscuro && { borderColor: colores.bordeClaro }]}>
            <Ionicons name="add" size={24} color={oscuro ? colores.textoMuted : 'rgba(60,20,10,0.5)'} />
          </View>
          <View style={[estilos.placa, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
            <Text style={estilos.placaNombre}>{ETIQUETA_POSICION[h.posicion]}</Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.s,
    paddingHorizontal: espaciado.l,
    paddingVertical: espaciado.m,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radios.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  tabActiva: { backgroundColor: colores.primario, borderColor: colores.primario },
  tabTexto: { fontSize: 13, fontFamily: tipografia.bold, color: colores.textoMuted },
  datoCabecera: { alignItems: 'flex-end', marginLeft: espaciado.s },
  datoCabeceraValor: { fontSize: 12, fontFamily: tipografia.extrabold, color: colores.texto },
  datoCabeceraEtiqueta: { fontSize: 9, fontFamily: tipografia.medium, color: colores.textoMuted },
  contenido: { padding: espaciado.l, paddingTop: 0, paddingBottom: 32, flexGrow: 1 },
  pista: {
    borderRadius: radios.l,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colores.borde,
  },
  grada: { height: 26, backgroundColor: '#17141d' },
  redBanda: { height: 8, backgroundColor: '#f4f4f5' },
  lineaLateral: {
    position: 'absolute',
    top: 76,
    bottom: 10,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  redMalla: {
    height: 44,
    backgroundColor: '#e9b7ab',
    flexDirection: 'row',
    flexWrap: 'wrap',
    opacity: 0.9,
  },
  redCelda: {
    width: `${100 / 16}%`,
    height: 22,
    borderWidth: 0.6,
    borderColor: 'rgba(120,50,40,0.35)',
  },
  zonaAtaque: { paddingVertical: espaciado.l, paddingTop: espaciado.xl },
  zonaDefensa: { paddingVertical: espaciado.l, paddingBottom: espaciado.xl },
  filaFichas: { flexDirection: 'row', justifyContent: 'space-evenly' },
  ficha: { alignItems: 'center', width: 104 },
  camiseta: { alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  dorsal: {
    position: 'absolute',
    top: 16,
    fontSize: 16,
    fontFamily: tipografia.extrabold,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 2,
  },
  camisetaVacia: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(70,25,12,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  placa: {
    backgroundColor: '#17141d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minWidth: 96,
    alignItems: 'center',
  },
  placaNombre: { fontSize: 10, fontFamily: tipografia.extrabold, color: '#fff', letterSpacing: 0.3 },
  placaPuntos: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    minWidth: 96,
    alignItems: 'center',
    paddingVertical: 3,
    borderTopWidth: 2,
    borderTopColor: colores.verde,
  },
  placaPuntosTexto: { fontSize: 13, fontFamily: tipografia.extrabold, color: '#17141d' },
  placaPuntosUnidad: { fontSize: 9, fontFamily: tipografia.semibold, color: '#6b7280' },
  bancos: { flexDirection: 'row', gap: espaciado.m, marginTop: espaciado.m },
  banco: {
    flex: 1,
    backgroundColor: colores.superficie,
    borderRadius: radios.l,
    borderWidth: 1,
    borderColor: colores.borde,
    paddingVertical: espaciado.m,
    alignItems: 'center',
    gap: espaciado.s,
  },
  bancoTitulo: { fontSize: 10, fontFamily: tipografia.extrabold, color: colores.textoMuted, letterSpacing: 1.5 },
  resumenValor: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: espaciado.l },
  resumenValorTexto: { fontSize: 12, fontFamily: tipografia.medium, color: colores.textoTenue },
  limites: { flexDirection: 'row', gap: espaciado.s, marginBottom: espaciado.m },
  limiteChip: {
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
  limiteTexto: { fontSize: 12, fontFamily: tipografia.semibold, color: colores.textoSuave },
  etiquetaTitular: { fontSize: 10, fontFamily: tipografia.bold, color: colores.verde, marginTop: 3 },
  venderBtn: { backgroundColor: colores.rojoTenue, borderRadius: radios.s, paddingHorizontal: 12, paddingVertical: 4, marginTop: 2 },
  venderTexto: { color: colores.rojo, fontFamily: tipografia.bold, fontSize: 12 },
  vacio: { color: colores.textoTenue, textAlign: 'center', fontFamily: tipografia.regular, lineHeight: 20, fontSize: 13, padding: espaciado.l },
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
  opcionEquipo: { fontSize: 12, fontFamily: tipografia.regular, color: colores.textoTenue },
});
