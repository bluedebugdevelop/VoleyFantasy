import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Boton from '@/components/Boton';
import FondoDegradado from '@/components/FondoDegradado';
import { useJuego } from '@/store/juego';
import { Liga, Modalidad, MODALIDADES, nombreModalidad } from '@/types';
import { colores, degradados, espaciado, radios, tipografia } from '@/theme';

export default function Ligas() {
  const router = useRouter();
  const usuario = useJuego((s) => s.usuario);
  const ligas = useJuego((s) => s.ligas);
  const crearLigaPrivada = useJuego((s) => s.crearLigaPrivada);
  const unirsePorCodigo = useJuego((s) => s.unirsePorCodigo);
  const [modal, setModal] = useState<'crear' | 'unirse' | null>(null);
  const [nombre, setNombre] = useState('');
  const [modalidad, setModalidad] = useState<Modalidad>('sp1m');
  const [codigo, setCodigo] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const crear = async () => {
    if (!nombre.trim()) return;
    setOcupado(true);
    const liga = await crearLigaPrivada(nombre, modalidad);
    setOcupado(false);
    setModal(null);
    setNombre('');
    Alert.alert(
      'Liga creada 🎉',
      `Modalidad: ${nombreModalidad(liga.modalidad)}\n\nComparte este código para que se unan:\n\n${liga.codigo}`,
    );
  };

  const unirse = async () => {
    if (!codigo.trim()) return;
    setOcupado(true);
    const liga = await unirsePorCodigo(codigo);
    setOcupado(false);
    setModal(null);
    setCodigo('');
    if (liga) Alert.alert('¡Dentro!', `Te has unido a "${liga.nombre}"`);
    else Alert.alert('Código no válido', 'No existe ninguna liga con ese código.');
  };

  return (
    <FondoDegradado>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={estilos.header}>
          <Text style={estilos.headerTitulo}>Ligas</Text>
        </View>

        <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: espaciado.m }}>
            <Boton
              titulo="Crear liga"
              variante="rojo"
              estilo={{ flex: 1 }}
              icono={<Ionicons name="add" size={18} color="#fff" />}
              onPress={() => setModal('crear')}
            />
            <Boton
              titulo="Unirse"
              variante="claro"
              estilo={{ flex: 1 }}
              icono={<Ionicons name="enter-outline" size={18} color={colores.texto} />}
              onPress={() => setModal('unirse')}
            />
          </View>

          <View style={estilos.seccion}>
            <Ionicons name="trophy" size={18} color={colores.oro} />
            <Text style={estilos.seccionTitulo}>Mis ligas</Text>
          </View>

          {ligas.length === 0 && (
            <View style={estilos.vacioCaja}>
              <Ionicons name="trophy-outline" size={28} color={colores.textoTenue} />
              <Text style={estilos.vacio}>Aún no estás en ninguna liga. Crea una o únete con un código.</Text>
            </View>
          )}
          {ligas.map((l) => (
            <FilaLiga
              key={l.id}
              liga={l}
              miUid={usuario?.uid}
              onPress={() => router.push({ pathname: '/liga/[id]', params: { id: l.id } })}
            />
          ))}
        </ScrollView>

        <Modal visible={!!modal} transparent animationType="fade" onRequestClose={() => setModal(null)}>
          <Pressable style={estilos.fondoModal} onPress={() => setModal(null)}>
            <Pressable style={estilos.modal} onPress={(e) => e.stopPropagation()}>
              {modal === 'crear' ? (
                <>
                  <Text style={estilos.tituloModal}>Nueva liga privada</Text>
                  <View style={estilos.campo}>
                    <Ionicons name="shield-outline" size={20} color={colores.textoSuave} />
                    <TextInput
                      style={estilos.input}
                      placeholder="Nombre de la liga"
                      placeholderTextColor={colores.textoTenue}
                      value={nombre}
                      onChangeText={setNombre}
                    />
                  </View>
                  <Text style={estilos.etiquetaCampo}>Modalidad</Text>
                  <View style={estilos.modalidades}>
                    {MODALIDADES.map((m) => (
                      <Pressable
                        key={m.id}
                        style={[estilos.modalidadChip, modalidad === m.id && estilos.modalidadChipActivo]}
                        onPress={() => setModalidad(m.id)}
                      >
                        <Text style={[estilos.modalidadTexto, modalidad === m.id && estilos.modalidadTextoActivo]}>
                          {m.nombre}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Boton titulo="Crear liga" variante="rojo" onPress={crear} cargando={ocupado} />
                </>
              ) : (
                <>
                  <Text style={estilos.tituloModal}>Unirse a una liga</Text>
                  <View style={estilos.campo}>
                    <Ionicons name="key-outline" size={20} color={colores.textoSuave} />
                    <TextInput
                      style={[estilos.input, { letterSpacing: 4, fontFamily: tipografia.bold }]}
                      placeholder="CÓDIGO"
                      placeholderTextColor={colores.textoTenue}
                      autoCapitalize="characters"
                      maxLength={6}
                      value={codigo}
                      onChangeText={setCodigo}
                    />
                  </View>
                  <Boton titulo="Unirse" variante="rojo" onPress={unirse} cargando={ocupado} />
                </>
              )}
              <Boton titulo="Cancelar" variante="fantasma" onPress={() => setModal(null)} />
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </FondoDegradado>
  );
}

function FilaLiga({ liga, miUid, onPress }: { liga: Liga; miUid?: string; onPress: () => void }) {
  const orden = [...liga.miembros].sort((a, b) => b.puntos - a.puntos);
  const miPuesto = orden.findIndex((m) => m.uid === miUid) + 1;
  const publica = liga.tipo === 'publica';
  return (
    <Pressable style={({ pressed }) => [estilos.fila, { opacity: pressed ? 0.9 : 1 }]} onPress={onPress}>
      <LinearGradient
        colors={publica ? degradados.rojo : degradados.marca}
        style={estilos.ligaIcono}
      >
        <Ionicons name={publica ? 'globe' : 'lock-closed'} size={20} color="#fff" />
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={estilos.nombreLiga} numberOfLines={1}>{liga.nombre}</Text>
        <View style={estilos.badgeModalidad}>
          <Text style={estilos.badgeModalidadTexto}>{nombreModalidad(liga.modalidad)}</Text>
        </View>
        <Text style={estilos.detalleLiga}>
          {liga.miembros.length} participantes{liga.codigo ? ` · ${liga.codigo}` : ''}
        </Text>
      </View>
      {miPuesto > 0 && (
        <View style={[estilos.puesto, miPuesto <= 3 && { backgroundColor: colores.oro }]}>
          <Text style={[estilos.puestoTexto, miPuesto <= 3 && { color: colores.primario }]}>{miPuesto}º</Text>
        </View>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  header: { paddingHorizontal: espaciado.l, paddingVertical: espaciado.m },
  headerTitulo: { fontSize: 24, fontFamily: tipografia.extrabold, color: colores.texto },
  contenido: { padding: espaciado.l, paddingTop: espaciado.s, paddingBottom: 32 },
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
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.m,
    backgroundColor: colores.superficie,
    borderRadius: radios.l,
    padding: espaciado.m,
    marginBottom: espaciado.s,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  ligaIcono: { width: 46, height: 46, borderRadius: radios.m, alignItems: 'center', justifyContent: 'center' },
  nombreLiga: { fontSize: 15, fontFamily: tipografia.bold, color: colores.texto },
  detalleLiga: { fontSize: 12, fontFamily: tipografia.regular, color: colores.textoSuave, marginTop: 2 },
  puesto: { backgroundColor: colores.superficieClara, borderRadius: radios.pill, paddingHorizontal: 11, paddingVertical: 5 },
  puestoTexto: { fontFamily: tipografia.extrabold, color: colores.texto, fontSize: 13 },
  fondoModal: { flex: 1, backgroundColor: colores.overlay, justifyContent: 'center', padding: espaciado.xl },
  modal: {
    backgroundColor: colores.fondoAlt,
    borderRadius: radios.xl,
    padding: espaciado.l,
    gap: espaciado.m,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  tituloModal: { fontSize: 18, fontFamily: tipografia.extrabold, color: colores.texto },
  etiquetaCampo: { fontSize: 13, fontFamily: tipografia.semibold, color: colores.textoSuave, marginTop: espaciado.xs },
  modalidades: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modalidadChip: {
    borderRadius: radios.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  modalidadChipActivo: { backgroundColor: colores.rojo, borderColor: colores.rojo },
  modalidadTexto: { fontSize: 12, fontFamily: tipografia.semibold, color: colores.textoSuave },
  modalidadTextoActivo: { color: colores.textoInverso },
  badgeModalidad: {
    alignSelf: 'flex-start',
    backgroundColor: colores.superficieClara,
    borderRadius: radios.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 3,
    marginBottom: 2,
  },
  badgeModalidadTexto: { fontSize: 10, fontFamily: tipografia.bold, color: colores.oro },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colores.superficie,
    borderRadius: radios.m,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, fontFamily: tipografia.medium, color: colores.texto },
});
