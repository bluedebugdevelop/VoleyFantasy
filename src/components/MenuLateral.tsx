import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { useJuego } from '../store/juego';
import { cerrarSesionFirebase } from '../services/auth';
import { confirmar } from './Alerta';
import { colores, espaciado, radios, tipografia } from '../theme';

const ANCHO = Math.min(300, Dimensions.get('window').width * 0.82);

interface EstadoMenu {
  abierto: boolean;
}
const usarMenu = create<EstadoMenu>(() => ({ abierto: false }));
export const abrirMenu = () => usarMenu.setState({ abierto: true });
export const cerrarMenu = () => usarMenu.setState({ abierto: false });

interface Opcion {
  etiqueta: string;
  icono: keyof typeof Ionicons.glyphMap;
  ruta: string;
}
const OPCIONES: Opcion[] = [
  { etiqueta: 'Mi perfil', icono: 'person-circle-outline', ruta: '/perfil' },
  { etiqueta: 'Jugadores', icono: 'people-outline', ruta: '/jugadores' },
  { etiqueta: 'Reglas', icono: 'book-outline', ruta: '/reglas' },
  { etiqueta: 'Aviso legal', icono: 'document-text-outline', ruta: '/aviso-legal' },
];

/** Menú lateral deslizante. Montar una vez en el layout raíz. */
export default function MenuLateral() {
  const abierto = usarMenu((s) => s.abierto);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const usuario = useJuego((s) => s.usuario);
  const cerrarSesion = useJuego((s) => s.cerrarSesion);
  const desliz = useRef(new Animated.Value(-ANCHO)).current;
  const fundido = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(desliz, {
        toValue: abierto ? 0 : -ANCHO,
        duration: abierto ? 240 : 190,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fundido, { toValue: abierto ? 1 : 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [abierto]);

  const ir = (ruta: string) => {
    cerrarMenu();
    setTimeout(() => router.push(ruta as any), 180);
  };

  const salir = () => {
    cerrarMenu();
    setTimeout(() => {
      confirmar('Cerrar sesión', '¿Seguro que quieres salir de tu cuenta?', async () => {
        await cerrarSesionFirebase();
        cerrarSesion();
        router.replace('/(auth)/login');
      }, { textoOk: 'Salir', destructivo: true, icono: 'log-out' });
    }, 200);
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: abierto ? 50 : -1 }]} pointerEvents={abierto ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, estilos.velo, { opacity: fundido }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={cerrarMenu} />
      </Animated.View>

      <Animated.View
        style={[
          estilos.panel,
          { width: ANCHO, paddingTop: insets.top + espaciado.l, transform: [{ translateX: desliz }] },
        ]}
      >
        {/* Cabecera del usuario */}
        <View style={estilos.cabecera}>
          <View style={estilos.avatar}>
            <Text style={estilos.avatarTexto}>{(usuario?.nombre ?? '?').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={estilos.nombre} numberOfLines={1}>{usuario?.nombre}</Text>
            <Text style={estilos.email} numberOfLines={1}>{usuario?.email}</Text>
          </View>
        </View>

        {/* Opciones */}
        <View style={{ flex: 1, marginTop: espaciado.l }}>
          {OPCIONES.map((o) => (
            <Pressable key={o.ruta} style={estilos.opcion} onPress={() => ir(o.ruta)}>
              <Ionicons name={o.icono} size={22} color={colores.textoSuave} />
              <Text style={estilos.opcionTexto}>{o.etiqueta}</Text>
              <Ionicons name="chevron-forward" size={18} color={colores.textoMuted} />
            </Pressable>
          ))}
        </View>

        {/* Cerrar sesión abajo */}
        <Pressable style={[estilos.salir, { marginBottom: insets.bottom + espaciado.m }]} onPress={salir}>
          <Ionicons name="log-out-outline" size={20} color={colores.rojo} />
          <Text style={estilos.salirTexto}>Cerrar sesión</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

/** Botón de 3 rayas para abrir el menú (colócalo en las cabeceras). */
export function BotonMenu() {
  return (
    <Pressable onPress={abrirMenu} hitSlop={10} style={estilos.hamburguesa}>
      <Ionicons name="menu" size={24} color={colores.texto} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  velo: { backgroundColor: colores.overlay },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colores.fondoAlt,
    borderRightWidth: 1,
    borderRightColor: colores.borde,
    paddingHorizontal: espaciado.l,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.m,
    paddingBottom: espaciado.l,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colores.primarioTenue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { fontSize: 20, fontFamily: tipografia.extrabold, color: colores.primario },
  nombre: { fontSize: 16, fontFamily: tipografia.extrabold, color: colores.texto },
  email: { fontSize: 12, fontFamily: tipografia.regular, color: colores.textoTenue },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.m,
    paddingVertical: 14,
  },
  opcionTexto: { flex: 1, fontSize: 15, fontFamily: tipografia.semibold, color: colores.texto },
  salir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.s,
    paddingVertical: 14,
    paddingHorizontal: espaciado.m,
    borderRadius: radios.boton,
    backgroundColor: colores.rojoTenue,
  },
  salirTexto: { fontSize: 15, fontFamily: tipografia.bold, color: colores.rojo },
  hamburguesa: {
    width: 40,
    height: 40,
    borderRadius: radios.boton,
    backgroundColor: colores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colores.borde,
  },
});
