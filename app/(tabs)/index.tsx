import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TarjetaJugador from '@/components/TarjetaJugador';
import FondoDegradado from '@/components/FondoDegradado';
import SelectorModalidad from '@/components/SelectorModalidad';
import { nombreModalidad } from '@/types';
import { useJuego } from '@/store/juego';
import { cerrarSesionFirebase } from '@/services/auth';
import { colores, degradados, espaciado, formatearValor, radios, sombra, tipografia } from '@/theme';
import { variacionDiaria } from '@/logic/market';

export default function Inicio() {
  const router = useRouter();
  const usuario = useJuego((s) => s.usuario);
  const modalidadActiva = useJuego((s) => s.modalidadActiva);
  const jugadoresDeModalidad = useJuego((s) => s.jugadoresDeModalidad);
  const equipoActivo = useJuego((s) => s.equipoActivo);
  const valorEquipo = useJuego((s) => s.valorEquipo);
  const puntosJornada = useJuego((s) => s.puntosJornada);
  const puntosTotales = useJuego((s) => s.puntosTotales);
  const cerrarSesion = useJuego((s) => s.cerrarSesion);

  const equipo = equipoActivo();
  const { subidas, bajadas } = useMemo(() => {
    const ordenados = [...jugadoresDeModalidad(modalidadActiva)].sort((a, b) => variacionDiaria(b) - variacionDiaria(a));
    return { subidas: ordenados.slice(0, 3), bajadas: ordenados.slice(-3).reverse() };
  }, [jugadoresDeModalidad, modalidadActiva]);

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
          <View style={estilos.topbar}>
            <View>
              <Text style={estilos.hola}>Hola,</Text>
              <Text style={estilos.nombre}>{usuario?.nombre}</Text>
            </View>
            <Pressable style={estilos.avatar} onPress={salir}>
              <Text style={estilos.avatarTexto}>{(usuario?.nombre ?? '?').charAt(0).toUpperCase()}</Text>
            </Pressable>
          </View>

          <View style={{ marginHorizontal: -espaciado.l, marginBottom: espaciado.m }}>
            <SelectorModalidad />
          </View>

          {/* Hero: puntos totales */}
          <LinearGradient colors={degradados.tarjetaHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[estilos.hero, sombra]}>
            <View style={estilos.heroBrillo} />
            <Text style={estilos.heroEtiqueta}>{nombreModalidad(modalidadActiva).toUpperCase()}</Text>
            <Text style={estilos.heroValor}>{puntosTotales()}</Text>
            <View style={estilos.heroFila}>
              <View style={estilos.heroChip}>
                <Ionicons name="flash" size={13} color={colores.oro} />
                <Text style={estilos.heroChipTexto}>{puntosJornada()} pts última jornada</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Métricas */}
          <View style={estilos.metricas}>
            <Metrica icono="wallet-outline" titulo="Presupuesto" valor={formatearValor(equipo.presupuesto)} color={colores.verde} />
            <Metrica icono="briefcase-outline" titulo="Valor equipo" valor={formatearValor(valorEquipo())} color={colores.oro} />
            <Metrica icono="people-outline" titulo="Plantilla" valor={`${equipo.plantillaIds.length}/10`} color={colores.rojo} />
          </View>

          <SeccionCabecera icono="trending-up" titulo="Suben hoy" color={colores.verde} />
          {subidas.map((j) => (
            <TarjetaJugador key={j.id} jugador={j} />
          ))}

          <SeccionCabecera icono="trending-down" titulo="Bajan hoy" color={colores.rojo} />
          {bajadas.map((j) => (
            <TarjetaJugador key={j.id} jugador={j} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </FondoDegradado>
  );
}

function Metrica({ icono, titulo, valor, color }: { icono: any; titulo: string; valor: string; color: string }) {
  return (
    <View style={estilos.metrica}>
      <View style={[estilos.metricaIcono, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icono} size={16} color={color} />
      </View>
      <Text style={estilos.metricaValor}>{valor}</Text>
      <Text style={estilos.metricaTitulo}>{titulo}</Text>
    </View>
  );
}

function SeccionCabecera({ icono, titulo, color }: { icono: any; titulo: string; color: string }) {
  return (
    <View style={estilos.seccion}>
      <Ionicons name={icono} size={18} color={color} />
      <Text style={estilos.seccionTitulo}>{titulo}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: espaciado.l, paddingBottom: 32 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: espaciado.l },
  hola: { fontSize: 14, fontFamily: tipografia.regular, color: colores.textoSuave },
  nombre: { fontSize: 22, fontFamily: tipografia.extrabold, color: colores.texto },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colores.superficieClara,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colores.bordeClaro,
  },
  avatarTexto: { fontSize: 18, fontFamily: tipografia.extrabold, color: colores.oro },
  hero: {
    borderRadius: radios.xl,
    padding: espaciado.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colores.bordeClaro,
  },
  heroBrillo: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroEtiqueta: { fontSize: 12, fontFamily: tipografia.bold, color: colores.textoSuave, letterSpacing: 2 },
  heroValor: { fontSize: 48, fontFamily: tipografia.extrabold, color: colores.texto, marginTop: 2 },
  heroFila: { flexDirection: 'row', marginTop: espaciado.s },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: radios.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroChipTexto: { fontSize: 12, fontFamily: tipografia.semibold, color: colores.texto },
  metricas: { flexDirection: 'row', gap: espaciado.s, marginTop: espaciado.m, marginBottom: espaciado.s },
  metrica: {
    flex: 1,
    backgroundColor: colores.superficie,
    borderRadius: radios.l,
    padding: espaciado.m,
    borderWidth: 1,
    borderColor: colores.borde,
    gap: 6,
  },
  metricaIcono: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  metricaValor: { fontSize: 15, fontFamily: tipografia.extrabold, color: colores.texto },
  metricaTitulo: { fontSize: 11, fontFamily: tipografia.medium, color: colores.textoSuave },
  seccion: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: espaciado.xl, marginBottom: espaciado.m },
  seccionTitulo: { fontSize: 17, fontFamily: tipografia.extrabold, color: colores.texto },
});
