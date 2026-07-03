import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import FondoDegradado from '@/components/FondoDegradado';
import { useJuego } from '@/store/juego';
import { colores, degradados, espaciado, radios, tipografia } from '@/theme';

const MEDALLAS = ['#FFD24C', '#C6D0E0', '#E08B4C'];

export default function DetalleLiga() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const liga = useJuego((s) => s.ligas).find((l) => l.id === id);
  const usuario = useJuego((s) => s.usuario);

  if (!liga) {
    return (
      <FondoDegradado>
        <Text style={{ padding: 20, color: colores.texto }}>Liga no encontrada</Text>
      </FondoDegradado>
    );
  }

  const clasificacion = [...liga.miembros].sort((a, b) => b.puntos - a.puntos);

  return (
    <FondoDegradado>
      <Stack.Screen options={{ title: liga.nombre }} />
      {liga.codigo && (
        <LinearGradient colors={degradados.marca} style={estilos.codigo}>
          <Ionicons name="key" size={16} color={colores.oro} />
          <Text style={estilos.codigoTexto}>Código de invitación</Text>
          <Text style={estilos.codigoValor}>{liga.codigo}</Text>
        </LinearGradient>
      )}
      <FlatList
        data={clasificacion}
        keyExtractor={(m) => m.uid}
        contentContainerStyle={{ padding: espaciado.l }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const soyYo = item.uid === usuario?.uid;
          const medalla = MEDALLAS[index];
          return (
            <View style={[estilos.fila, soyYo && estilos.filaPropia]}>
              <View style={[estilos.posicion, medalla ? { backgroundColor: medalla } : null]}>
                <Text style={[estilos.posicionTexto, medalla ? { color: colores.primario } : null]}>{index + 1}</Text>
              </View>
              <View style={[estilos.inicial, soyYo && { backgroundColor: colores.rojoOscuro }]}>
                <Text style={estilos.inicialTexto}>{item.nombre.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={[estilos.nombre, soyYo && { color: colores.texto }]} numberOfLines={1}>
                {item.nombre}{soyYo ? ' (tú)' : ''}
              </Text>
              <Text style={[estilos.puntos, soyYo && { color: colores.oro }]}>{item.puntos}</Text>
            </View>
          );
        }}
      />
    </FondoDegradado>
  );
}

const estilos = StyleSheet.create({
  codigo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: espaciado.m },
  codigoTexto: { color: colores.textoSuave, fontSize: 13, fontFamily: tipografia.medium },
  codigoValor: { color: colores.oro, fontSize: 15, fontFamily: tipografia.extrabold, letterSpacing: 3 },
  fila: {
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
  filaPropia: { borderColor: colores.rojo, backgroundColor: colores.superficieAlt },
  posicion: {
    width: 30,
    height: 30,
    borderRadius: radios.pill,
    backgroundColor: colores.superficieClara,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posicionTexto: { fontFamily: tipografia.extrabold, color: colores.textoSuave, fontSize: 13 },
  inicial: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colores.superficieClara,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inicialTexto: { fontFamily: tipografia.bold, color: colores.texto, fontSize: 16 },
  nombre: { flex: 1, fontSize: 15, fontFamily: tipografia.bold, color: colores.texto },
  puntos: { fontSize: 16, fontFamily: tipografia.extrabold, color: colores.oro },
});
