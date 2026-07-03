import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Boton from '@/components/Boton';
import FondoDegradado from '@/components/FondoDegradado';
import CuentaAtras from '@/components/CuentaAtras';
import { useJuego } from '@/store/juego';
import { cerrarSesionFirebase } from '@/services/auth';
import { expiraCiclo } from '@/logic/mercadoLiga';
import {
  categoriasDeModalidad,
  Liga,
  Modalidad,
  MODALIDADES,
  nombreModalidad,
  Partido,
} from '@/types';
import { colores, degradados, espaciado, radios, sombraSuave, tipografia } from '@/theme';

const GRADIENTES_LIGA: readonly [string, string][] = [
  ['#1E3A8A', '#1E293B'],
  ['#7C2D12', '#1E293B'],
  ['#14532D', '#1E293B'],
  ['#581C87', '#1E293B'],
  ['#831843', '#1E293B'],
  ['#134E4A', '#1E293B'],
];

export default function Home() {
  const router = useRouter();
  const usuario = useJuego((s) => s.usuario);
  const ligas = useJuego((s) => s.ligas);
  const calendario = useJuego((s) => s.calendario);
  const crearLiga = useJuego((s) => s.crearLiga);
  const unirsePorCodigo = useJuego((s) => s.unirsePorCodigo);
  const asegurarEquipo = useJuego((s) => s.asegurarEquipo);
  const cerrarSesion = useJuego((s) => s.cerrarSesion);

  const [modal, setModal] = useState<'crear' | 'unirse' | null>(null);
  const [nombre, setNombre] = useState('');
  const [modalidad, setModalidad] = useState<Modalidad>('sp1m');
  const [codigo, setCodigo] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [catCalendario, setCatCalendario] = useState<Modalidad>('sp1m');

  const misLigas = usuario ? ligas.filter((l) => l.miembros.some((m) => m.uid === usuario.uid)) : [];

  const partidos: Partido[] = useMemo(() => {
    const cats = categoriasDeModalidad(catCalendario);
    return cats.flatMap((c) => calendario[c] ?? []);
  }, [calendario, catCalendario]);

  const entrarEnLiga = (liga: Liga) => {
    const nueva = asegurarEquipo(liga.id);
    if (nueva) router.push({ pathname: '/bienvenida/[id]', params: { id: liga.id } });
    else router.push({ pathname: '/liga/[id]', params: { id: liga.id } });
  };

  const crear = async () => {
    if (nombre.trim().length < 3) return Alert.alert('Nombre muy corto', 'Usa al menos 3 caracteres.');
    setOcupado(true);
    const liga = await crearLiga(nombre, modalidad);
    setOcupado(false);
    setModal(null);
    setNombre('');
    entrarEnLiga(liga);
  };

  const unirse = async () => {
    if (!codigo.trim()) return;
    setOcupado(true);
    const liga = await unirsePorCodigo(codigo);
    setOcupado(false);
    if (!liga) return Alert.alert('Código no válido', 'No existe ninguna liga con ese código.');
    setModal(null);
    setCodigo('');
    entrarEnLiga(liga);
  };

  const salir = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await cerrarSesionFirebase();
          cerrarSesion();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <FondoDegradado>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
          {/* Cabecera */}
          <View style={estilos.topbar}>
            <View>
              <Text style={estilos.hola}>Hola, {usuario?.nombre?.split(' ')[0]}</Text>
              <Text style={estilos.titulo}>
                Voley<Text style={{ color: colores.primario }}>Fantasy</Text>
              </Text>
            </View>
            <Pressable style={estilos.avatar} onPress={salir}>
              <Text style={estilos.avatarTexto}>{(usuario?.nombre ?? '?').charAt(0).toUpperCase()}</Text>
            </Pressable>
          </View>

          {/* Acciones */}
          <View style={{ flexDirection: 'row', gap: espaciado.m }}>
            <Boton
              titulo="Crear liga"
              estilo={{ flex: 1 }}
              icono={<Ionicons name="add-circle-outline" size={18} color="#fff" />}
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

          {/* Mis ligas */}
          <Seccion icono="trophy" titulo="Tus ligas" />
          {misLigas.length === 0 && (
            <View style={estilos.vacioCaja}>
              <Ionicons name="trophy-outline" size={30} color={colores.textoMuted} />
              <Text style={estilos.vacio}>
                Todavía no estás en ninguna liga.{'\n'}Crea una privada e invita a tus amigos.
              </Text>
            </View>
          )}
          {misLigas.map((liga, i) => (
            <TarjetaLiga key={liga.id} liga={liga} indice={i} onPress={() => entrarEnLiga(liga)} />
          ))}

          {/* Calendario */}
          <Seccion icono="calendar" titulo="Calendario · próxima jornada" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingBottom: espaciado.s }}>
              {MODALIDADES.filter((m) => !m.id.includes('mixto')).map((m) => (
                <Pressable
                  key={m.id}
                  style={[estilos.pillCat, catCalendario === m.id && estilos.pillCatActiva]}
                  onPress={() => setCatCalendario(m.id)}
                >
                  <Text style={[estilos.pillCatTexto, catCalendario === m.id && { color: '#fff' }]}>
                    {m.corto}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          {partidos.length === 0 ? (
            <View style={estilos.vacioCaja}>
              <Text style={estilos.vacio}>Sin partidos programados (pretemporada).</Text>
            </View>
          ) : (
            <View style={estilos.tablaPartidos}>
              <View style={estilos.tablaCabecera}>
                <Text style={estilos.tablaCabeceraTexto}>{partidos[0]?.jornada ?? 'Jornada'}</Text>
              </View>
              {partidos.slice(0, 10).map((p, i) => (
                <View key={i} style={[estilos.filaPartido, i % 2 === 1 && { backgroundColor: colores.fondoAlt }]}>
                  <Text style={estilos.equipoLocal} numberOfLines={1}>{p.local}</Text>
                  <View style={estilos.marcador}>
                    <Text style={estilos.marcadorTexto}>{p.resultado ?? (p.fecha?.split(' - ')[1] ?? 'vs')}</Text>
                  </View>
                  <Text style={estilos.equipoVisitante} numberOfLines={1}>{p.visitante}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Modal crear / unirse */}
        <Modal visible={!!modal} transparent animationType="fade" onRequestClose={() => setModal(null)}>
          <Pressable style={estilos.fondoModal} onPress={() => setModal(null)}>
            <Pressable style={estilos.modal} onPress={(e) => e.stopPropagation()}>
              {modal === 'crear' ? (
                <>
                  <Text style={estilos.tituloModal}>Nueva liga privada</Text>
                  <View style={estilos.campo}>
                    <Ionicons name="shield-outline" size={20} color={colores.textoTenue} />
                    <TextInput
                      style={estilos.input}
                      placeholder="Nombre de la liga"
                      placeholderTextColor={colores.textoMuted}
                      value={nombre}
                      onChangeText={setNombre}
                    />
                  </View>
                  <Text style={estilos.etiqueta}>Competición</Text>
                  <View style={estilos.modalidades}>
                    {MODALIDADES.map((m) => (
                      <Pressable
                        key={m.id}
                        style={[estilos.chipMod, modalidad === m.id && estilos.chipModActiva]}
                        onPress={() => setModalidad(m.id)}
                      >
                        <Text style={[estilos.chipModTexto, modalidad === m.id && { color: '#fff' }]}>
                          {m.nombre}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Boton titulo="Crear liga" onPress={crear} cargando={ocupado} />
                </>
              ) : (
                <>
                  <Text style={estilos.tituloModal}>Unirse con código</Text>
                  <View style={estilos.campo}>
                    <Ionicons name="key-outline" size={20} color={colores.textoTenue} />
                    <TextInput
                      style={[estilos.input, { letterSpacing: 5, fontFamily: tipografia.bold }]}
                      placeholder="CÓDIGO"
                      placeholderTextColor={colores.textoMuted}
                      autoCapitalize="characters"
                      maxLength={6}
                      value={codigo}
                      onChangeText={setCodigo}
                    />
                  </View>
                  <Boton titulo="Unirse a la liga" onPress={unirse} cargando={ocupado} />
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

function TarjetaLiga({ liga, indice, onPress }: { liga: Liga; indice: number; onPress: () => void }) {
  const usuario = useJuego((s) => s.usuario);
  const orden = [...liga.miembros].sort((a, b) => b.puntos - a.puntos);
  const puesto = orden.findIndex((m) => m.uid === usuario?.uid) + 1;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      <LinearGradient
        colors={GRADIENTES_LIGA[indice % GRADIENTES_LIGA.length]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[estilos.tarjetaLiga, sombraSuave]}
      >
        <View style={{ flex: 1 }}>
          <Text style={estilos.ligaNombre} numberOfLines={1}>{liga.nombre}</Text>
          <Text style={estilos.ligaModalidad}>{nombreModalidad(liga.modalidad)}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' }}>
            <View style={estilos.ligaChip}>
              <Ionicons name="people" size={12} color={colores.textoSuave} />
              <Text style={estilos.ligaChipTexto}>{liga.miembros.length}</Text>
            </View>
            <CuentaAtras hasta={expiraCiclo(liga)} />
          </View>
        </View>
        <View style={estilos.ligaPuesto}>
          <Text style={estilos.ligaPuestoNumero}>{puesto > 0 ? `${puesto}º` : '—'}</Text>
          <Text style={estilos.ligaPuestoEtiqueta}>posición</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colores.textoTenue} />
      </LinearGradient>
    </Pressable>
  );
}

function Seccion({ icono, titulo }: { icono: any; titulo: string }) {
  return (
    <View style={estilos.seccion}>
      <Ionicons name={icono} size={17} color={colores.primario} />
      <Text style={estilos.seccionTitulo}>{titulo}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: espaciado.l, paddingBottom: 40 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: espaciado.l },
  hola: { fontSize: 13, fontFamily: tipografia.regular, color: colores.textoTenue },
  titulo: { fontSize: 26, fontFamily: tipografia.extrabold, color: colores.texto },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colores.borde,
  },
  avatarTexto: { fontSize: 17, fontFamily: tipografia.extrabold, color: colores.primario },
  seccion: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: espaciado.xl, marginBottom: espaciado.m },
  seccionTitulo: { fontSize: 17, fontFamily: tipografia.extrabold, color: colores.texto },
  vacioCaja: {
    alignItems: 'center',
    gap: 10,
    padding: espaciado.xl,
    backgroundColor: colores.superficie,
    borderRadius: radios.l,
    borderWidth: 1,
    borderColor: colores.borde,
    borderStyle: 'dashed',
  },
  vacio: { color: colores.textoTenue, textAlign: 'center', fontFamily: tipografia.regular, lineHeight: 20, fontSize: 13 },
  tarjetaLiga: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.m,
    borderRadius: radios.l,
    padding: espaciado.l,
    marginBottom: espaciado.m,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  ligaNombre: { fontSize: 17, fontFamily: tipografia.extrabold, color: colores.texto },
  ligaModalidad: { fontSize: 12, fontFamily: tipografia.medium, color: colores.textoSuave, marginTop: 2 },
  ligaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: radios.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ligaChipTexto: { fontSize: 12, fontFamily: tipografia.semibold, color: colores.textoSuave },
  ligaPuesto: { alignItems: 'center' },
  ligaPuestoNumero: { fontSize: 22, fontFamily: tipografia.extrabold, color: colores.oroClaro },
  ligaPuestoEtiqueta: { fontSize: 10, fontFamily: tipografia.medium, color: colores.textoTenue },
  pillCat: {
    borderRadius: radios.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  pillCatActiva: { backgroundColor: colores.primario, borderColor: colores.primario },
  pillCatTexto: { fontSize: 12, fontFamily: tipografia.bold, color: colores.textoTenue },
  tablaPartidos: {
    borderRadius: radios.m,
    borderWidth: 1,
    borderColor: colores.borde,
    overflow: 'hidden',
  },
  tablaCabecera: { backgroundColor: colores.azulVivo, paddingVertical: 8, alignItems: 'center' },
  tablaCabeceraTexto: { fontSize: 13, fontFamily: tipografia.bold, color: '#fff' },
  filaPartido: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: espaciado.m,
    backgroundColor: colores.superficie,
    gap: 8,
  },
  equipoLocal: { flex: 1, fontSize: 12, fontFamily: tipografia.semibold, color: colores.textoSuave, textAlign: 'right' },
  equipoVisitante: { flex: 1, fontSize: 12, fontFamily: tipografia.semibold, color: colores.textoSuave },
  marcador: {
    backgroundColor: colores.superficieClara,
    borderRadius: radios.s,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 52,
    alignItems: 'center',
  },
  marcadorTexto: { fontSize: 12, fontFamily: tipografia.extrabold, color: colores.texto },
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
  etiqueta: { fontSize: 13, fontFamily: tipografia.semibold, color: colores.textoTenue },
  modalidades: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipMod: {
    borderRadius: radios.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  chipModActiva: { backgroundColor: colores.primario, borderColor: colores.primario },
  chipModTexto: { fontSize: 12, fontFamily: tipografia.semibold, color: colores.textoTenue },
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
