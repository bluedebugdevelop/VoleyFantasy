import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import FondoDegradado from '@/components/FondoDegradado';
import CabeceraPantalla from '@/components/CabeceraPantalla';
import TarjetaJugador from '@/components/TarjetaJugador';
import { useJuego } from '@/store/juego';
import { Categoria, NOMBRE_CATEGORIA, NOMBRE_POSICION, Posicion } from '@/types';
import { colores, espaciado, radios, tipografia } from '@/theme';

type FiltroCat = Categoria | 'todas';
type FiltroPos = Posicion | 'todas';
type Orden = 'equipo' | 'posicion' | 'alfabetico' | 'valor';

const CATEGORIAS: FiltroCat[] = ['todas', 'sp1m', 'sp1f', 'sp2m', 'sp2f'];
const POSICIONES: FiltroPos[] = ['todas', 'colocador', 'opuesto', 'receptor', 'central', 'libero', 'entrenador'];
const ORDEN_POS: Record<Posicion, number> = {
  colocador: 0, opuesto: 1, central: 2, receptor: 3, libero: 4, entrenador: 5,
};
const ORDENES: { id: Orden; etiqueta: string }[] = [
  { id: 'equipo', etiqueta: 'Equipo' },
  { id: 'posicion', etiqueta: 'Posición' },
  { id: 'alfabetico', etiqueta: 'A-Z' },
  { id: 'valor', etiqueta: 'Valor' },
];

export default function Jugadores() {
  const jugadores = useJuego((s) => s.jugadores);
  const [busqueda, setBusqueda] = useState('');
  const [cat, setCat] = useState<FiltroCat>('todas');
  const [pos, setPos] = useState<FiltroPos>('todas');
  const [equipo, setEquipo] = useState<string | null>(null);
  const [orden, setOrden] = useState<Orden>('equipo');
  const [modalEquipos, setModalEquipos] = useState(false);

  const equipos = useMemo(() => {
    const set = new Set<string>();
    jugadores.forEach((j) => {
      if (cat === 'todas' || j.categoria === cat) set.add(j.equipo);
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [jugadores, cat]);

  const lista = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const filtrados = jugadores.filter((j) => {
      if (cat !== 'todas' && j.categoria !== cat) return false;
      if (pos !== 'todas' && j.posicion !== pos) return false;
      if (equipo && j.equipo !== equipo) return false;
      if (texto && !j.nombre.toLowerCase().includes(texto) && !j.equipo.toLowerCase().includes(texto)) return false;
      return true;
    });
    filtrados.sort((a, b) => {
      if (orden === 'valor') return b.valor - a.valor;
      if (orden === 'alfabetico') return a.nombre.localeCompare(b.nombre);
      if (orden === 'posicion') {
        return ORDEN_POS[a.posicion] - ORDEN_POS[b.posicion] || a.nombre.localeCompare(b.nombre);
      }
      // equipo
      return a.equipo.localeCompare(b.equipo) || ORDEN_POS[a.posicion] - ORDEN_POS[b.posicion];
    });
    return filtrados;
  }, [jugadores, busqueda, cat, pos, equipo, orden]);

  return (
    <FondoDegradado>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <CabeceraPantalla titulo="Jugadores" />

        {/* Búsqueda */}
        <View style={estilos.buscador}>
          <Ionicons name="search" size={18} color={colores.textoTenue} />
          <TextInput
            style={estilos.input}
            placeholder="Buscar por nombre o equipo…"
            placeholderTextColor={colores.textoMuted}
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <Pressable onPress={() => setBusqueda('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={colores.textoMuted} />
            </Pressable>
          )}
        </View>

        {/* Filtros: categoría */}
        <FlatList
          horizontal
          data={CATEGORIAS}
          keyExtractor={(c) => c}
          showsHorizontalScrollIndicator={false}
          style={estilos.filaFiltros}
          contentContainerStyle={estilos.filaFiltrosCont}
          renderItem={({ item }) => (
            <Chip
              activo={cat === item}
              texto={item === 'todas' ? 'Todas' : NOMBRE_CATEGORIA[item]}
              onPress={() => {
                setCat(item);
                setEquipo(null);
              }}
            />
          )}
        />

        {/* Filtros: posición */}
        <FlatList
          horizontal
          data={POSICIONES}
          keyExtractor={(p) => p}
          showsHorizontalScrollIndicator={false}
          style={estilos.filaFiltros}
          contentContainerStyle={estilos.filaFiltrosCont}
          renderItem={({ item }) => (
            <Chip
              activo={pos === item}
              texto={item === 'todas' ? 'Posición' : NOMBRE_POSICION[item]}
              onPress={() => setPos(item)}
            />
          )}
        />

        {/* Equipo + orden */}
        <View style={estilos.filaEquipoOrden}>
          <Pressable style={estilos.selectorEquipo} onPress={() => setModalEquipos(true)}>
            <Ionicons name="shield-outline" size={15} color={colores.textoSuave} />
            <Text style={estilos.selectorEquipoTexto} numberOfLines={1}>{equipo ?? 'Todos los equipos'}</Text>
            <Ionicons name="chevron-down" size={15} color={colores.textoMuted} />
          </Pressable>
          {equipo && (
            <Pressable onPress={() => setEquipo(null)} hitSlop={8} style={estilos.limpiar}>
              <Ionicons name="close" size={16} color={colores.rojo} />
            </Pressable>
          )}
        </View>

        <View style={estilos.filaOrden}>
          <Text style={estilos.ordenEtiqueta}>Ordenar:</Text>
          {ORDENES.map((o) => (
            <Pressable key={o.id} onPress={() => setOrden(o.id)}>
              <Text style={[estilos.ordenTexto, orden === o.id && estilos.ordenActivo]}>{o.etiqueta}</Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={lista}
          keyExtractor={(j) => j.id}
          contentContainerStyle={{ paddingHorizontal: espaciado.l, paddingBottom: 32 }}
          initialNumToRender={12}
          windowSize={9}
          renderItem={({ item }) => <TarjetaJugador jugador={item} />}
          ListHeaderComponent={<Text style={estilos.contador}>{lista.length} jugadores</Text>}
          ListEmptyComponent={<Text style={estilos.vacio}>Ningún jugador coincide con los filtros.</Text>}
        />

        {/* Modal de equipos */}
        <Modal visible={modalEquipos} transparent animationType="slide" onRequestClose={() => setModalEquipos(false)}>
          <View style={estilos.fondoModal}>
            <View style={estilos.modal}>
              <View style={estilos.asa} />
              <Text style={estilos.tituloModal}>Filtrar por equipo</Text>
              <FlatList
                data={['__todos', ...equipos]}
                keyExtractor={(e) => e}
                style={{ maxHeight: 420 }}
                renderItem={({ item }) => {
                  const todos = item === '__todos';
                  const sel = todos ? equipo === null : equipo === item;
                  return (
                    <Pressable
                      style={estilos.opcionEquipo}
                      onPress={() => {
                        setEquipo(todos ? null : item);
                        setModalEquipos(false);
                      }}
                    >
                      <Text style={[estilos.opcionEquipoTexto, sel && { color: colores.primario }]}>
                        {todos ? 'Todos los equipos' : item}
                      </Text>
                      {sel && <Ionicons name="checkmark" size={18} color={colores.primario} />}
                    </Pressable>
                  );
                }}
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </FondoDegradado>
  );
}

function Chip({ activo, texto, onPress }: { activo: boolean; texto: string; onPress: () => void }) {
  return (
    <Pressable style={[estilos.chip, activo && estilos.chipActivo]} onPress={onPress}>
      <Text style={[estilos.chipTexto, activo && { color: '#fff' }]}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: espaciado.l,
    backgroundColor: colores.superficie,
    borderRadius: radios.m,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  input: { flex: 1, paddingVertical: 11, fontSize: 15, fontFamily: tipografia.medium, color: colores.texto },
  filaFiltros: { flexGrow: 0, marginTop: espaciado.s },
  filaFiltrosCont: { paddingHorizontal: espaciado.l, gap: 8 },
  chip: {
    borderRadius: radios.boton,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  chipActivo: { backgroundColor: colores.primario, borderColor: colores.primario },
  chipTexto: { fontSize: 12, fontFamily: tipografia.semibold, color: colores.textoTenue },
  filaEquipoOrden: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: espaciado.l, marginTop: espaciado.s },
  selectorEquipo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colores.superficie,
    borderRadius: radios.boton,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  selectorEquipoTexto: { flex: 1, fontSize: 13, fontFamily: tipografia.semibold, color: colores.textoSuave },
  limpiar: { padding: 6, backgroundColor: colores.rojoTenue, borderRadius: radios.boton },
  filaOrden: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: espaciado.l, marginTop: espaciado.m, marginBottom: espaciado.s },
  ordenEtiqueta: { fontSize: 12, fontFamily: tipografia.medium, color: colores.textoMuted },
  ordenTexto: { fontSize: 12, fontFamily: tipografia.semibold, color: colores.textoTenue },
  ordenActivo: { color: colores.primario, fontFamily: tipografia.bold },
  contador: { fontSize: 12, fontFamily: tipografia.medium, color: colores.textoMuted, marginBottom: espaciado.s },
  vacio: { color: colores.textoTenue, textAlign: 'center', fontFamily: tipografia.regular, padding: espaciado.xl },
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
  tituloModal: { fontSize: 18, fontFamily: tipografia.extrabold, color: colores.texto, marginBottom: espaciado.s },
  opcionEquipo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  opcionEquipoTexto: { fontSize: 14, fontFamily: tipografia.semibold, color: colores.texto },
});
