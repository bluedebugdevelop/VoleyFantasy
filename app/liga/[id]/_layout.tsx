import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJuego } from '@/store/juego';
import { nombreModalidad } from '@/types';
import { colores, espaciado, tipografia } from '@/theme';

/** Pestañas internas de una liga: Clasificación · Equipo · Mercado. */
export default function LigaLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const liga = useJuego((s) => s.liga)(id);
  const asegurarEquipo = useJuego((s) => s.asegurarEquipo);
  const sincronizarMercado = useJuego((s) => s.sincronizarMercado);

  useEffect(() => {
    if (!id) return;
    asegurarEquipo(id);
    sincronizarMercado(id);
  }, [id]);

  if (!liga) {
    return (
      <View style={{ flex: 1, backgroundColor: colores.fondo, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colores.textoTenue, fontFamily: tipografia.medium }}>Liga no encontrada</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colores.fondoAlt }} edges={['top']}>
      {/* Cabecera de la liga */}
      <View style={estilos.header}>
        <Pressable onPress={() => router.replace('/home')} hitSlop={10} style={estilos.volver}>
          <Ionicons name="chevron-back" size={24} color={colores.texto} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={estilos.nombre} numberOfLines={1}>{liga.nombre}</Text>
          <Text style={estilos.modalidad}>{nombreModalidad(liga.modalidad)}</Text>
        </View>
        {liga.codigo && (
          <Pressable
            style={estilos.invitar}
            onPress={() => router.push({ pathname: '/liga/[id]/invitar', params: { id } })}
          >
            <Ionicons name="person-add" size={16} color={colores.primario} />
            <Text style={estilos.invitarTexto}>Invitar</Text>
          </Pressable>
        )}
      </View>

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colores.primario,
          tabBarInactiveTintColor: colores.textoMuted,
          tabBarStyle: {
            backgroundColor: colores.fondoAlt,
            borderTopColor: colores.borde,
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 84 : 62,
            paddingTop: 6,
            paddingBottom: Platform.OS === 'ios' ? 26 : 8,
          },
          tabBarLabelStyle: { fontFamily: tipografia.semibold, fontSize: 11 },
          sceneStyle: { backgroundColor: colores.fondo },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Clasificación',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'podium' : 'podium-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="equipo"
          options={{
            title: 'Mi equipo',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'shirt' : 'shirt-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="mercado"
          options={{
            title: 'Mercado',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'trending-up' : 'trending-up-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="invitar" options={{ href: null }} />
      </Tabs>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.s,
    paddingHorizontal: espaciado.m,
    paddingVertical: espaciado.m,
    backgroundColor: colores.fondoAlt,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  volver: { padding: 2 },
  nombre: { fontSize: 17, fontFamily: tipografia.extrabold, color: colores.texto },
  modalidad: { fontSize: 11, fontFamily: tipografia.medium, color: colores.textoTenue },
  invitar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colores.azulTenue,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  invitarTexto: { fontSize: 12, fontFamily: tipografia.bold, color: colores.primario },
});
