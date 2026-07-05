import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Boton from '@/components/Boton';
import FondoDegradado from '@/components/FondoDegradado';
import { confirmar } from '@/components/Alerta';
import { useJuego } from '@/store/juego';
import { cerrarSesionFirebase } from '@/services/auth';
import { categoriasDeModalidad, Liga, Modalidad, MODALIDADES, nombreModalidad, Partido } from '@/types';
import { colores, espaciado, radios, sombraSuave, tipografia } from '@/theme';

const GRADIENTES_LIGA: readonly [string, string][] = [
  ['#4d1030', '#241f2b'],
  ['#3b1052', '#241f2b'],
  ['#12313b', '#241f2b'],
  ['#43240b', '#241f2b'],
  ['#0e3327', '#241f2b'],
  ['#33112c', '#241f2b'],
];

export default function Home() {
  const router = useRouter();
  const usuario = useJuego((s) => s.usuario);
  const ligas = useJuego((s) => s.ligas);
  const calendario = useJuego((s) => s.calendario);
  const asegurarEquipo = useJuego((s) => s.asegurarEquipo);
  const cerrarSesion = useJuego((s) => s.cerrarSesion);
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

  const salir = () => {
    confirmar('Cerrar sesión', '¿Seguro que quieres salir de tu cuenta?', async () => {
      await cerrarSesionFirebase();
      cerrarSesion();
      router.replace('/(auth)/login');
    }, { textoOk: 'Salir', destructivo: true, icono: 'log-out' });
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
                La <Text style={{ color: colores.primario }}>SuperFantasy</Text>
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
              onPress={() => router.push('/crear-liga')}
            />
            <Boton
              titulo="Unirse"
              variante="claro"
              estilo={{ flex: 1 }}
              icono={<Ionicons name="enter-outline" size={18} color={colores.texto} />}
              onPress={() => router.push('/unirse-liga')}
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
              <Text style={estilos.ligaChipTexto}>
                {liga.miembros.length} participante{liga.miembros.length === 1 ? '' : 's'}
              </Text>
            </View>
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
    borderColor: 'rgba(255,255,255,0.07)',
  },
  ligaNombre: { fontSize: 17, fontFamily: tipografia.extrabold, color: colores.texto },
  ligaModalidad: { fontSize: 12, fontFamily: tipografia.medium, color: colores.textoSuave, marginTop: 2 },
  ligaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radios.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ligaChipTexto: { fontSize: 12, fontFamily: tipografia.semibold, color: colores.textoSuave },
  ligaPuesto: { alignItems: 'center' },
  ligaPuestoNumero: { fontSize: 22, fontFamily: tipografia.extrabold, color: colores.primarioClaro },
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
  tablaCabecera: { backgroundColor: colores.primario, paddingVertical: 8, alignItems: 'center' },
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
});
