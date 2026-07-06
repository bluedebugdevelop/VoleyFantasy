import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import FondoDegradado from '@/components/FondoDegradado';
import CabeceraPantalla from '@/components/CabeceraPantalla';
import { useJuego } from '@/store/juego';
import { colores, degradados, espaciado, formatearValor, radios, sombra, tipografia } from '@/theme';

export default function Perfil() {
  const usuario = useJuego((s) => s.usuario);
  const ligas = useJuego((s) => s.ligas);
  const equiposLiga = useJuego((s) => s.equiposLiga);
  const valorEquipo = useJuego((s) => s.valorEquipo);
  const puntosTotales = useJuego((s) => s.puntosTotales);

  const misLigas = usuario
    ? ligas.filter((l) => l.tipo === 'privada' && l.miembros.some((m) => m.uid === usuario.uid))
    : [];
  const puntos = misLigas.reduce((s, l) => s + puntosTotales(l.id), 0);
  const patrimonio = Object.keys(equiposLiga).reduce(
    (s, id) => s + valorEquipo(id) + (equiposLiga[id]?.presupuesto ?? 0),
    0,
  );
  // Mejor posición en cualquier liga
  const mejorPuesto = misLigas.reduce((mejor, l) => {
    const orden = [...l.miembros].sort((a, b) => b.puntos - a.puntos);
    const p = orden.findIndex((m) => m.uid === usuario?.uid) + 1;
    return p > 0 && (mejor === 0 || p < mejor) ? p : mejor;
  }, 0);

  return (
    <FondoDegradado>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <CabeceraPantalla titulo="Mi perfil" />
        <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={degradados.rosa} style={[estilos.tarjeta, sombra]}>
            <View style={estilos.avatar}>
              <Text style={estilos.avatarTexto}>{(usuario?.nombre ?? '?').charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={estilos.nombre}>{usuario?.nombre}</Text>
            <Text style={estilos.email}>{usuario?.email}</Text>
          </LinearGradient>

          <View style={estilos.metricas}>
            <Metrica icono="trophy" titulo="Ligas" valor={`${misLigas.length}`} />
            <Metrica icono="star" titulo="Puntos" valor={`${puntos}`} />
            <Metrica icono="podium" titulo="Mejor pos." valor={mejorPuesto > 0 ? `${mejorPuesto}º` : '—'} />
          </View>

          <View style={estilos.filaPatrimonio}>
            <Ionicons name="wallet-outline" size={18} color={colores.verde} />
            <Text style={estilos.patrimonioTexto}>Patrimonio total</Text>
            <Text style={estilos.patrimonioValor}>{formatearValor(patrimonio)}</Text>
          </View>

          <Text style={estilos.seccion}>Tus ligas</Text>
          {misLigas.length === 0 && <Text style={estilos.vacio}>Aún no estás en ninguna liga.</Text>}
          {misLigas.map((l) => {
            const orden = [...l.miembros].sort((a, b) => b.puntos - a.puntos);
            const p = orden.findIndex((m) => m.uid === usuario?.uid) + 1;
            return (
              <View key={l.id} style={estilos.filaLiga}>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.ligaNombre} numberOfLines={1}>{l.nombre}</Text>
                  <Text style={estilos.ligaDetalle}>{l.miembros.length} participantes</Text>
                </View>
                <View style={estilos.puestoChip}>
                  <Text style={estilos.puestoTexto}>{p > 0 ? `${p}º` : '—'}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </FondoDegradado>
  );
}

function Metrica({ icono, titulo, valor }: { icono: any; titulo: string; valor: string }) {
  return (
    <View style={estilos.metrica}>
      <Ionicons name={icono} size={18} color={colores.primario} />
      <Text style={estilos.metricaValor}>{valor}</Text>
      <Text style={estilos.metricaTitulo}>{titulo}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: espaciado.l, paddingBottom: 40 },
  tarjeta: { alignItems: 'center', gap: 6, borderRadius: radios.l, padding: espaciado.xl },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarTexto: { fontSize: 30, fontFamily: tipografia.extrabold, color: '#fff' },
  nombre: { fontSize: 21, fontFamily: tipografia.extrabold, color: '#fff' },
  email: { fontSize: 13, fontFamily: tipografia.regular, color: 'rgba(255,255,255,0.85)' },
  metricas: { flexDirection: 'row', gap: espaciado.s, marginTop: espaciado.l },
  metrica: {
    flex: 1,
    backgroundColor: colores.superficie,
    borderRadius: radios.m,
    padding: espaciado.m,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  metricaValor: { fontSize: 18, fontFamily: tipografia.extrabold, color: colores.texto },
  metricaTitulo: { fontSize: 11, fontFamily: tipografia.medium, color: colores.textoTenue },
  filaPatrimonio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.s,
    backgroundColor: colores.superficie,
    borderRadius: radios.m,
    padding: espaciado.l,
    marginTop: espaciado.m,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  patrimonioTexto: { flex: 1, fontSize: 14, fontFamily: tipografia.semibold, color: colores.textoSuave },
  patrimonioValor: { fontSize: 16, fontFamily: tipografia.extrabold, color: colores.verde },
  seccion: { fontSize: 16, fontFamily: tipografia.extrabold, color: colores.texto, marginTop: espaciado.xl, marginBottom: espaciado.s },
  vacio: { color: colores.textoTenue, fontFamily: tipografia.regular, fontSize: 13 },
  filaLiga: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.superficie,
    borderRadius: radios.m,
    padding: espaciado.m,
    marginBottom: espaciado.s,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  ligaNombre: { fontSize: 14, fontFamily: tipografia.bold, color: colores.texto },
  ligaDetalle: { fontSize: 11, fontFamily: tipografia.regular, color: colores.textoTenue, marginTop: 2 },
  puestoChip: { backgroundColor: colores.primarioTenue, borderRadius: radios.boton, paddingHorizontal: 10, paddingVertical: 5 },
  puestoTexto: { fontSize: 13, fontFamily: tipografia.extrabold, color: colores.primario },
});
