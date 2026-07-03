import React from 'react';
import { ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import FondoDegradado from '@/components/FondoDegradado';
import Logo from '@/components/Logo';
import { useJuego } from '@/store/juego';
import { colores } from '@/theme';

export default function Index() {
  const usuario = useJuego((s) => s.usuario);
  const cargando = useJuego((s) => s.cargando);

  if (cargando) {
    return (
      <FondoDegradado style={{ alignItems: 'center', justifyContent: 'center', gap: 28 }}>
        <Logo />
        <ActivityIndicator size="large" color={colores.primario} />
      </FondoDegradado>
    );
  }
  return usuario ? <Redirect href="/home" /> : <Redirect href="/(auth)/login" />;
}
