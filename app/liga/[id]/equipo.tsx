import React, { useState } from 'react';
import {
  Alert,
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

type Vista = 'titular' | 'plantilla';

export default function Equipo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const jugadores = useJuego((s) => s.jugadores);
  const equipo = useJuego((s) => s.equipoDe)(id);
  const alinear = useJuego((s) => s.alinear);
  const vender = useJuego((s) => s.vender);
  const puntosJornada = useJuego((s) => s.puntosJornada);
  const valorEquipo = useJuego((s) => s.valorEquipo);
  const [vista, setVista] = useState<Vista>('titular');
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
    Alert.alert('Vender', `¿Vender a ${j.nombre} por ${formatearValor(j.valor)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Vender', style: 'destructive', onPress: () => vender(id, j.id) },
    ]);
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {/* Menú lateral */}
      <View style={estilos.rail}>
        <BotonRail
          icono="grid"
          etiqueta="Titular"
          activa={vista === 'titular'}
          onPress={() => setVista('titular')}
        />
        <BotonRail
          icono="people"
          etiqueta="Plantilla"
          activa={vista === 'plantilla'}
          onPress={() => setVista('plantilla')}
        />
        <View style={{ flex: 1 }} />
        <View style={estilos.railDato}>
          <Text style={estilos.railDatoValor}>{puntosJornada(id)}</Text>
          <Text style={estilos.railDatoEtiqueta}>pts jor.</Text>
        </View>
        <View style={estilos.railDato}>
          <Text style={[estilos.railDatoValor, { color: colores.verde }]}>
            {formatearValor(equipo.presupuesto)}
          </Text>
          <Text style={estilos.railDatoEtiqueta}>caja</Text>
        </View>
      </View>

      {/* Contenido */}
      {vista === 'titular' ? (
        <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
          <Text style={estilos.ayuda}>Toca una posición para alinear</Text>

          {/* Pista de voleibol */}
          <LinearGradient colors={degradados.pista} style={[estilos.pista, sombraSuave]}>
            <View style={estilos.lineasPista} />
            <View style={estilos.linea3m} />
            <View style={estilos.red}>
              {Array.from({ length: 14 }).map((_, i) => (
                <View key={i} style={estilos.redCelda} />
              ))}
            </View>
            {HUECOS_ALINEACION.filter((h) => h.posicion !== 'entrenador').map((h) => (
              <FichaHueco
                key={h.etiqueta}
                ligaId={id}
                etiqueta={h.etiqueta}
                onPress={() => setHuecoAbierto(h.etiqueta)}
              />
            ))}
          </LinearGradient>

          {/* Banquillo técnico: entrenador */}
          <Text style={estilos.seccion}>Cuerpo técnico</Text>
          <BancoEntrenador ligaId={id} onPress={() => setHuecoAbierto('EN')} />

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

      {/* Selector de jugador para un hueco */}
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

function BotonRail({
  icono,
  etiqueta,
  activa,
  onPress,
}: {
  icono: any;
  etiqueta: string;
  activa: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[estilos.railBoton, activa && estilos.railBotonActivo]} onPress={onPress}>
      <Ionicons name={icono} size={20} color={activa ? colores.primario : colores.textoMuted} />
      <Text style={[estilos.railEtiqueta, activa && { color: colores.primario }]}>{etiqueta}</Text>
    </Pressable>
  );
}

/** Ficha de un jugador sobre la pista (posición absoluta en %). */
function FichaHueco({ ligaId, etiqueta, onPress }: { ligaId: string; etiqueta: string; onPress: () => void }) {
  const equipo = useJuego((s) => s.equipoDe)(ligaId);
  const jugador = useJuego((s) => s.jugador);
  const h = HUECOS_ALINEACION.find((x) => x.etiqueta === etiqueta)!;
  const j = equipo?.alineacion[etiqueta] ? jugador(equipo.alineacion[etiqueta]!) : undefined;
  const color = COLOR_POSICION[h.posicion];
  return (
    <Pressable
      style={[estilos.ficha, { left: `${h.x}%`, top: `${h.y}%` }]}
      onPress={onPress}
    >
      {j ? (
        <>
          <View style={[estilos.fichaCirculo, { borderColor: color }]}>
            <Text style={estilos.fichaDorsal}>{j.dorsal}</Text>
            <View style={[estilos.fichaPuntos, { backgroundColor: colores.azulVivo }]}>
              <Text style={estilos.fichaPuntosTexto}>
                {j.puntosPorJornada[j.puntosPorJornada.length - 1] ?? 0}
              </Text>
            </View>
          </View>
          <Text style={estilos.fichaNombre} numberOfLines={1}>
            {j.nombre.split(' ')[0]}
          </Text>
        </>
      ) : (
        <>
          <View style={[estilos.fichaCirculo, estilos.fichaVacia]}>
            <Ionicons name="add" size={20} color="rgba(255,255,255,0.8)" />
          </View>
          <Text style={estilos.fichaNombre}>{ETIQUETA_POSICION[h.posicion]}</Text>
        </>
      )}
    </Pressable>
  );
}

function BancoEntrenador({ ligaId, onPress }: { ligaId: string; onPress: () => void }) {
  const equipo = useJuego((s) => s.equipoDe)(ligaId);
  const jugador = useJuego((s) => s.jugador);
  const j = equipo?.alineacion['EN'] ? jugador(equipo.alineacion['EN']!) : undefined;
  return (
    <Pressable style={estilos.banquillo} onPress={onPress}>
      <View style={[estilos.entrenadorIcono, j && { borderColor: colores.oro }]}>
        <MaterialCommunityIcons name="whistle" size={22} color={j ? colores.oro : colores.textoMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={estilos.entrenadorNombre}>{j ? j.nombre : 'Sin entrenador'}</Text>
        <Text style={estilos.entrenadorDetalle}>
          {j ? `${j.equipo} · ${j.media} pts/p` : 'Toca para alinear a tu míster'}
        </Text>
      </View>
      {j && (
        <View style={estilos.entrenadorPuntos}>
          <Text style={estilos.entrenadorPuntosTexto}>
            {j.puntosPorJornada[j.puntosPorJornada.length - 1] ?? 0}
          </Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color={colores.textoMuted} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  rail: {
    width: 76,
    backgroundColor: colores.fondoAlt,
    borderRightWidth: 1,
    borderRightColor: colores.borde,
    paddingVertical: espaciado.m,
    alignItems: 'center',
    gap: espaciado.s,
  },
  railBoton: {
    width: 62,
    paddingVertical: 10,
    borderRadius: radios.m,
    alignItems: 'center',
    gap: 3,
  },
  railBotonActivo: { backgroundColor: colores.azulTenue },
  railEtiqueta: { fontSize: 10, fontFamily: tipografia.semibold, color: colores.textoMuted },
  railDato: { alignItems: 'center', marginBottom: espaciado.s },
  railDatoValor: { fontSize: 11, fontFamily: tipografia.extrabold, color: colores.texto },
  railDatoEtiqueta: { fontSize: 9, fontFamily: tipografia.medium, color: colores.textoMuted },
  contenido: { padding: espaciado.m, paddingBottom: 32, flexGrow: 1 },
  ayuda: { fontSize: 11, fontFamily: tipografia.regular, color: colores.textoTenue, textAlign: 'center', marginBottom: espaciado.s },
  pista: {
    height: 460,
    borderRadius: radios.l,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.55)',
    overflow: 'hidden',
  },
  lineasPista: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: radios.s,
  },
  linea3m: {
    position: 'absolute',
    top: '38%',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  red: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    flexDirection: 'row',
  },
  redCelda: { flex: 1, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.35)' },
  ficha: { position: 'absolute', width: 74, marginLeft: -37, alignItems: 'center', gap: 3 },
  fichaCirculo: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colores.superficie,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fichaVacia: {
    borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  fichaDorsal: { fontSize: 18, fontFamily: tipografia.extrabold, color: colores.texto },
  fichaPuntos: {
    position: 'absolute',
    top: -5,
    right: -7,
    borderRadius: 999,
    minWidth: 22,
    height: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fichaPuntosTexto: { fontSize: 10, fontFamily: tipografia.extrabold, color: '#fff' },
  fichaNombre: {
    fontSize: 11,
    fontFamily: tipografia.bold,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 3,
    maxWidth: 74,
    textAlign: 'center',
  },
  seccion: { fontSize: 14, fontFamily: tipografia.extrabold, color: colores.texto, marginTop: espaciado.l, marginBottom: espaciado.s },
  banquillo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.m,
    backgroundColor: colores.superficie,
    borderRadius: radios.m,
    padding: espaciado.m,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  entrenadorIcono: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colores.superficieAlt,
    borderWidth: 2,
    borderColor: colores.borde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entrenadorNombre: { fontSize: 14, fontFamily: tipografia.bold, color: colores.texto },
  entrenadorDetalle: { fontSize: 11, fontFamily: tipografia.regular, color: colores.textoTenue, marginTop: 1 },
  entrenadorPuntos: {
    backgroundColor: colores.oroTenue,
    borderRadius: radios.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  entrenadorPuntosTexto: { fontSize: 13, fontFamily: tipografia.extrabold, color: colores.oro },
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
  venderBtn: { backgroundColor: colores.rojoTenue, borderRadius: radios.pill, paddingHorizontal: 12, paddingVertical: 4, marginTop: 2 },
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
