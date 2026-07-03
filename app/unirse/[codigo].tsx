import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import FondoDegradado from '@/components/FondoDegradado';
import Logo from '@/components/Logo';
import { useJuego } from '@/store/juego';
import { colores, tipografia } from '@/theme';

/** Deep link de invitación: voleyfantasy://unirse/CODIGO */
export default function UnirsePorEnlace() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const router = useRouter();
  const usuario = useJuego((s) => s.usuario);
  const cargando = useJuego((s) => s.cargando);
  const unirsePorCodigo = useJuego((s) => s.unirsePorCodigo);
  const asegurarEquipo = useJuego((s) => s.asegurarEquipo);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (cargando || !usuario || !codigo) return;
    (async () => {
      const liga = await unirsePorCodigo(codigo);
      if (!liga) return setError(true);
      const nueva = asegurarEquipo(liga.id);
      router.replace(
        nueva
          ? { pathname: '/bienvenida/[id]', params: { id: liga.id } }
          : { pathname: '/liga/[id]', params: { id: liga.id } },
      );
    })();
  }, [cargando, usuario, codigo]);

  if (!cargando && !usuario) return <Redirect href="/(auth)/login" />;

  return (
    <FondoDegradado style={{ alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <Logo />
      {error ? (
        <Text style={{ color: colores.rojo, fontFamily: tipografia.bold }}>
          El código {codigo} no corresponde a ninguna liga
        </Text>
      ) : (
        <>
          <ActivityIndicator size="large" color={colores.primario} />
          <Text style={{ color: colores.textoSuave, fontFamily: tipografia.medium }}>
            Uniéndote a la liga…
          </Text>
        </>
      )}
    </FondoDegradado>
  );
}
