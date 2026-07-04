import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import AlertaGlobal from '@/components/Alerta';
import { useJuego } from '@/store/juego';
import { observarSesion } from '@/services/auth';
import { colores } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const inicializar = useJuego((s) => s.inicializar);
  const establecerUsuario = useJuego((s) => s.establecerUsuario);

  const [fuentesListas] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    inicializar();
    const desuscribir = observarSesion((u) => {
      if (u) establecerUsuario(u);
    });
    return desuscribir;
  }, []);

  useEffect(() => {
    if (fuentesListas) SplashScreen.hideAsync().catch(() => {});
  }, [fuentesListas]);

  if (!fuentesListas) return <View style={{ flex: 1, backgroundColor: colores.fondo }} />;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colores.fondoAlt },
          headerTintColor: colores.texto,
          headerTitleStyle: { fontFamily: 'Inter_800ExtraBold' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colores.fondo },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/registro" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="crear-liga" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="unirse-liga" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="liga/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="bienvenida/[id]" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="unirse/[codigo]" options={{ headerShown: false }} />
        <Stack.Screen name="jugador/[id]" options={{ title: 'Jugador' }} />
        <Stack.Screen name="[...desconocida]" options={{ headerShown: false }} />
      </Stack>
      <AlertaGlobal />
    </>
  );
}
