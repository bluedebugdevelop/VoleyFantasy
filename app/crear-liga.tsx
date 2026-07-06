import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Boton from '@/components/Boton';
import FondoDegradado from '@/components/FondoDegradado';
import { alerta, confirmar } from '@/components/Alerta';
import { useJuego } from '@/store/juego';
import { Modalidad, nombreModalidad } from '@/types';
import { colores, degradados, espaciado, radios, sombraSuave, tipografia } from '@/theme';

interface OpcionModalidad {
  id: Modalidad;
  nombre: string;
  descripcion: string;
  icono: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}

const OPCIONES: OpcionModalidad[] = [
  {
    id: 'sp1m',
    nombre: 'Superliga (Masc.)',
    descripcion: 'La élite del voleibol masculino. Ficha a los mejores del país.',
    icono: 'volleyball',
    color: '#e21d66',
  },
  {
    id: 'sp1f',
    nombre: 'Superliga (Fem.)',
    descripcion: 'La máxima categoría femenina, con las jugadoras más top.',
    icono: 'volleyball',
    color: '#a855f7',
  },
  {
    id: 'sp1mixto',
    nombre: 'Mixto Superliga',
    descripcion: 'Lo mejor de ambas Superligas en un mismo mercado.',
    icono: 'account-group',
    color: '#f59e0b',
  },
  {
    id: 'sp2m',
    nombre: 'Superliga 2 (Masc.)',
    descripcion: 'La cantera de plata masculina: más equipos, más joyas ocultas.',
    icono: 'trophy-outline',
    color: '#3b82f6',
  },
  {
    id: 'sp2f',
    nombre: 'Superliga 2 (Fem.)',
    descripcion: 'La segunda división femenina, perfecta para descubrir talento.',
    icono: 'trophy-outline',
    color: '#10b981',
  },
  {
    id: 'sp2mixto',
    nombre: 'Mixto Superliga 2',
    descripcion: 'Las dos Superligas 2 combinadas: el mercado más amplio.',
    icono: 'account-group-outline',
    color: '#f97316',
  },
];

export default function CrearLiga() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const crearLiga = useJuego((s) => s.crearLiga);
  const asegurarEquipo = useJuego((s) => s.asegurarEquipo);
  const [nombre, setNombre] = useState('');
  const [modalidad, setModalidad] = useState<Modalidad | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const crear = () => {
    if (nombre.trim().length < 3) {
      return alerta({ icono: 'text', tono: 'aviso', titulo: 'Nombre muy corto', mensaje: 'Ponle al menos 3 caracteres a tu liga.' });
    }
    if (!modalidad) {
      return alerta({ icono: 'grid', tono: 'aviso', titulo: 'Elige competición', mensaje: 'Selecciona de qué competición saldrán los jugadores.' });
    }
    confirmar(
      `¿Crear "${nombre.trim()}"?`,
      `${nombreModalidad(modalidad)} · El mercado de la liga arrancará ahora mismo y rotará cada 24 h a esta hora. Recibirás tu plantilla inicial.`,
      async () => {
        setOcupado(true);
        const liga = await crearLiga(nombre, modalidad);
        asegurarEquipo(liga.id);
        setOcupado(false);
        router.replace({ pathname: '/bienvenida/[id]', params: { id: liga.id } });
      },
      { textoOk: 'Crear liga', icono: 'shield-checkmark' },
    );
  };

  return (
    <FondoDegradado>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Cabecera */}
          <View style={estilos.cabecera}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={estilos.volver}>
              <Ionicons name="chevron-back" size={24} color={colores.texto} />
            </Pressable>
            <Text style={estilos.tituloCabecera}>Crear liga</Text>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
            <LinearGradient colors={degradados.rosa} style={estilos.banner}>
              <Ionicons name="sparkles" size={22} color="#fff" />
              <Text style={estilos.bannerTexto}>
                Tu liga, tus reglas: mercado propio cada 24 h y clasificación privada con tus amigos.
              </Text>
            </LinearGradient>

            <Text style={estilos.etiqueta}>Nombre de la liga</Text>
            <View style={estilos.campo}>
              <Ionicons name="shield-outline" size={20} color={colores.textoTenue} />
              <TextInput
                style={estilos.input}
                placeholder="P. ej. Los Machacadores"
                placeholderTextColor={colores.textoMuted}
                value={nombre}
                onChangeText={setNombre}
                maxLength={28}
              />
            </View>

            <Text style={estilos.etiqueta}>Competición</Text>
            {OPCIONES.map((o) => {
              const activa = modalidad === o.id;
              return (
                <Pressable
                  key={o.id}
                  style={[estilos.opcion, activa && { borderColor: o.color, backgroundColor: colores.superficieAlt }, sombraSuave]}
                  onPress={() => setModalidad(o.id)}
                >
                  <View style={[estilos.opcionIcono, { backgroundColor: `${o.color}22` }]}>
                    <MaterialCommunityIcons name={o.icono} size={24} color={o.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={estilos.opcionNombre}>{o.nombre}</Text>
                    <Text style={estilos.opcionDescripcion}>{o.descripcion}</Text>
                  </View>
                  <View style={[estilos.radio, activa && { borderColor: o.color }]}>
                    {activa && <View style={[estilos.radioPunto, { backgroundColor: o.color }]} />}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={[estilos.pie, { paddingBottom: insets.bottom + espaciado.m }]}>
            <Boton
              titulo="Crear mi liga"
              onPress={crear}
              cargando={ocupado}
              icono={<Ionicons name="rocket-outline" size={18} color="#fff" />}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </FondoDegradado>
  );
}

const estilos = StyleSheet.create({
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: espaciado.m,
    paddingVertical: espaciado.m,
  },
  volver: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloCabecera: { fontSize: 18, fontFamily: tipografia.extrabold, color: colores.texto },
  contenido: { padding: espaciado.l, paddingTop: espaciado.s, paddingBottom: espaciado.l },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.m,
    borderRadius: radios.l,
    padding: espaciado.l,
    marginBottom: espaciado.l,
  },
  bannerTexto: { flex: 1, fontSize: 12, fontFamily: tipografia.semibold, color: '#fff', lineHeight: 18 },
  etiqueta: { fontSize: 13, fontFamily: tipografia.bold, color: colores.textoSuave, marginBottom: espaciado.s, marginTop: espaciado.m },
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
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.m,
    backgroundColor: colores.superficie,
    borderRadius: radios.l,
    borderWidth: 1.5,
    borderColor: colores.borde,
    padding: espaciado.m,
    marginBottom: espaciado.s,
  },
  opcionIcono: {
    width: 46,
    height: 46,
    borderRadius: radios.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcionNombre: { fontSize: 14, fontFamily: tipografia.bold, color: colores.texto },
  opcionDescripcion: { fontSize: 11, fontFamily: tipografia.regular, color: colores.textoTenue, marginTop: 2, lineHeight: 15 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colores.bordeClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioPunto: { width: 11, height: 11, borderRadius: 6 },
  pie: {
    padding: espaciado.l,
    paddingTop: espaciado.s,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
    backgroundColor: colores.fondo,
  },
});
