import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colores, tipografia } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.oro,
        tabBarInactiveTintColor: colores.textoTenue,
        tabBarStyle: {
          backgroundColor: colores.fondoAlt,
          borderTopColor: colores.borde,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        },
        tabBarLabelStyle: { fontFamily: tipografia.semibold, fontSize: 11 },
        sceneStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="equipo"
        options={{
          title: 'Mi equipo',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mercado"
        options={{
          title: 'Mercado',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'trending-up' : 'trending-up-outline'} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ligas"
        options={{
          title: 'Ligas',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'trophy' : 'trophy-outline'} size={23} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
