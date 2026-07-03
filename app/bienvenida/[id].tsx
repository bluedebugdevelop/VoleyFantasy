import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Boton from '@/components/Boton';
import FondoDegradado from '@/components/FondoDegradado';
import { COLOR_POSICION, ETIQUETA_POSICION } from '@/components/ChipPosicion';
import { useJuego } from '@/store/juego';
import { Jugador } from '@/types';
import { colores, degradados, espaciado, formatearValor, radios, sombra, tipografia } from '@/theme';

/**
 * Pantalla de bienvenida a una liga: revela con animación la plantilla
 * inicial regalada (7 jugadores) y el presupuesto restante.
 */
export default function Bienvenida() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const jugadores = useJuego((s) => s.jugadores);
  const equipo = useJuego((s) => s.equipoDe)(id);
  const liga = useJuego((s) => s.liga)(id);
  const marcarBienvenidaVista = useJuego((s) => s.marcarBienvenidaVista);
  const [reveladas, setReveladas] = useState(0);

  const plantilla = useMemo(
    () =>
      (equipo?.plantillaIds ?? [])
        .map((pid) => jugadores.find((j) => j.id === pid))
        .filter((j): j is Jugador => !!j),
    [equipo?.plantillaIds, jugadores],
  );
  const coste = plantilla.reduce((s, j) => s + j.valor, 0);

  // Animaciones de entrada
  const animCabecera = useRef(new Animated.Value(0)).current;
  const animPresupuesto = useRef(new Animated.Value(0)).current;
  const animCartas = useRef(plantilla.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (plantilla.length === 0) return;
    while (animCartas.length < plantilla.length) animCartas.push(new Animated.Value(0));
    Animated.sequence([
      Animated.timing(animCabecera, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      Animated.stagger(
        170,
        plantilla.map((_, i) =>
          Animated.timing(animCartas[i], {
            toValue: 1,
            duration: 480,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ),
      ),
      Animated.spring(animPresupuesto, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
    const int = setInterval(() => setReveladas((r) => Math.min(r + 1, plantilla.length)), 170);
    return () => clearInterval(int);
  }, [plantilla.length]);

  const continuar = () => {
    marcarBienvenidaVista(id);
    router.replace({ pathname: '/liga/[id]', params: { id } });
  };

  return (
    <FondoDegradado>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={{
              opacity: animCabecera,
              transform: [
                { scale: animCabecera.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
              ],
              alignItems: 'center',
            }}
          >
            <View style={estilos.confeti}>
              <Ionicons name="sparkles" size={30} color={colores.oroClaro} />
            </View>
            <Text style={estilos.titulo}>¡Bienvenido a {liga?.nombre}!</Text>
            <Text style={estilos.subtitulo}>
              Este es tu equipo inicial. A partir de aquí, el mercado manda: puja, vende y escala en la
              clasificación.
            </Text>
          </Animated.View>

          {/* Cartas de jugadores */}
          <View style={estilos.cartas}>
            {plantilla.map((j, i) => {
              const anim = animCartas[i] ?? new Animated.Value(1);
              const color = COLOR_POSICION[j.posicion];
              return (
                <Animated.View
                  key={j.id}
                  style={{
                    opacity: anim,
                    transform: [
                      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [46, 0] }) },
                      {
                        rotateY: anim.interpolate({ inputRange: [0, 1], outputRange: ['80deg', '0deg'] }),
                      },
                    ],
                  }}
                >
                  <LinearGradient
                    colors={[colores.superficieAlt, colores.superficie]}
                    style={[estilos.carta, { borderColor: `${color}77` }, sombra]}
                  >
                    <View style={[estilos.cartaPosicion, { backgroundColor: color }]}>
                      <Text style={estilos.cartaPosicionTexto}>{ETIQUETA_POSICION[j.posicion]}</Text>
                    </View>
                    <View style={[estilos.cartaDorsal, { borderColor: color }]}>
                      <Text style={[estilos.cartaDorsalTexto, { color }]}>{j.dorsal}</Text>
                    </View>
                    <Text style={estilos.cartaNombre} numberOfLines={2}>{j.nombre}</Text>
                    <Text style={estilos.cartaEquipo} numberOfLines={1}>{j.equipo}</Text>
                    <Text style={estilos.cartaValor}>{formatearValor(j.valor)}</Text>
                  </LinearGradient>
                </Animated.View>
              );
            })}
          </View>

          {/* Presupuesto */}
          <Animated.View
            style={{
              opacity: animPresupuesto,
              transform: [
                { scale: animPresupuesto.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
              ],
            }}
          >
            <LinearGradient colors={degradados.exito} style={estilos.presupuesto}>
              <Ionicons name="wallet" size={22} color="#fff" />
              <View>
                <Text style={estilos.presupuestoValor}>{formatearValor(equipo?.presupuesto ?? 0)}</Text>
                <Text style={estilos.presupuestoEtiqueta}>
                  presupuesto para fichar (equipo inicial: {formatearValor(coste)})
                </Text>
              </View>
            </LinearGradient>
            <Boton
              titulo="¡A jugar!"
              variante="oro"
              estilo={{ marginTop: espaciado.l }}
              icono={<Ionicons name="rocket" size={18} color="#1F1300" />}
              onPress={continuar}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </FondoDegradado>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: espaciado.l, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' },
  confeti: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colores.oroTenue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaciado.m,
  },
  titulo: { fontSize: 23, fontFamily: tipografia.extrabold, color: colores.texto, textAlign: 'center' },
  subtitulo: {
    fontSize: 13,
    fontFamily: tipografia.regular,
    color: colores.textoSuave,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
    marginBottom: espaciado.l,
  },
  cartas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaciado.s + 2,
    justifyContent: 'center',
    marginBottom: espaciado.xl,
  },
  carta: {
    width: 104,
    borderRadius: radios.m,
    borderWidth: 1.5,
    padding: espaciado.s,
    alignItems: 'center',
    gap: 3,
    overflow: 'hidden',
  },
  cartaPosicion: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderBottomLeftRadius: radios.s,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  cartaPosicionTexto: { fontSize: 9, fontFamily: tipografia.extrabold, color: '#fff' },
  cartaDorsal: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: colores.fondoAlt,
  },
  cartaDorsalTexto: { fontSize: 15, fontFamily: tipografia.extrabold },
  cartaNombre: {
    fontSize: 11,
    fontFamily: tipografia.bold,
    color: colores.texto,
    textAlign: 'center',
    minHeight: 28,
  },
  cartaEquipo: { fontSize: 9, fontFamily: tipografia.regular, color: colores.textoTenue },
  cartaValor: { fontSize: 12, fontFamily: tipografia.extrabold, color: colores.oroClaro },
  presupuesto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.m,
    borderRadius: radios.l,
    padding: espaciado.l,
  },
  presupuestoValor: { fontSize: 22, fontFamily: tipografia.extrabold, color: '#fff' },
  presupuestoEtiqueta: { fontSize: 11, fontFamily: tipografia.regular, color: 'rgba(255,255,255,0.85)' },
});
