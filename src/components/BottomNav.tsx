import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useJuego } from '../store/juego';
import { colores, tipografia } from '../theme';

type Clave = 'inicio' | 'index' | 'equipo' | 'mercado';

interface Item {
  clave: Clave;
  etiqueta: string;
  icono: keyof typeof Ionicons.glyphMap;
  iconoOn: keyof typeof Ionicons.glyphMap;
}

// Inicio (casita) siempre a la izquierda.
const ITEMS: Item[] = [
  { clave: 'inicio', etiqueta: 'Inicio', icono: 'home-outline', iconoOn: 'home' },
  { clave: 'index', etiqueta: 'Liga', icono: 'podium-outline', iconoOn: 'podium' },
  { clave: 'equipo', etiqueta: 'Mi equipo', icono: 'shirt-outline', iconoOn: 'shirt' },
  { clave: 'mercado', etiqueta: 'Mercado', icono: 'trending-up-outline', iconoOn: 'trending-up' },
];

function Barra({
  activa,
  onItem,
  deshabilitadas,
}: {
  activa: Clave;
  onItem: (c: Clave) => void;
  deshabilitadas?: Set<Clave>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[estilos.barra, { height: 58 + insets.bottom, paddingBottom: insets.bottom + 6 }]}>
      {ITEMS.map((it) => {
        const on = activa === it.clave;
        const off = deshabilitadas?.has(it.clave);
        const color = off ? colores.textoMuted : on ? colores.primario : colores.textoTenue;
        return (
          <Pressable
            key={it.clave}
            style={estilos.item}
            disabled={off}
            onPress={() => onItem(it.clave)}
          >
            <Ionicons name={on ? it.iconoOn : it.icono} size={22} color={color} style={{ opacity: off ? 0.4 : 1 }} />
            <Text style={[estilos.etiqueta, { color, opacity: off ? 0.4 : 1 }]}>{it.etiqueta}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Barra para el Home: Inicio activo; el resto llevan a la última liga. */
export function NavHome() {
  const router = useRouter();
  const ultimaLigaId = useJuego((s) => s.ultimaLigaId);
  const ligas = useJuego((s) => s.ligas);
  const destino = ultimaLigaId && ligas.some((l) => l.id === ultimaLigaId) ? ultimaLigaId : ligas[0]?.id ?? null;
  const deshabilitadas = destino ? undefined : new Set<Clave>(['index', 'equipo', 'mercado']);

  return (
    <Barra
      activa="inicio"
      deshabilitadas={deshabilitadas}
      onItem={(c) => {
        if (c === 'inicio' || !destino) return;
        const sub = c === 'index' ? '' : `/${c}`;
        router.push(`/liga/${destino}${sub}` as any);
      }}
    />
  );
}

/** Barra para dentro de una liga (se pasa como `tabBar` de las Tabs). */
export function NavLiga({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const rutaActiva = state.routes[state.index]?.name as Clave;
  return (
    <Barra
      activa={rutaActiva}
      onItem={(c) => {
        if (c === 'inicio') {
          router.replace('/home');
          return;
        }
        navigation.navigate(c);
      }}
    />
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: colores.fondoAlt,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
    paddingTop: 8,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  etiqueta: { fontSize: 11, fontFamily: tipografia.semibold },
});
