import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import FondoDegradado from '@/components/FondoDegradado';
import CabeceraPantalla from '@/components/CabeceraPantalla';
import { colores, espaciado, radios, tipografia } from '@/theme';

interface Bloque {
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  puntos: string[];
}

const BLOQUES: Bloque[] = [
  {
    icono: 'people',
    titulo: 'Ligas',
    puntos: [
      'Crea ligas privadas e invita a tus amigos con un código de 6 caracteres o un enlace.',
      'Cada liga tiene su propia competición (Superliga masc./fem., Superliga 2 o mixtas) y su propio mercado.',
      'Al crear o unirte a una liga recibes un equipo inicial de 7 jugadores y presupuesto para fichar.',
    ],
  },
  {
    icono: 'shirt',
    titulo: 'Tu equipo',
    puntos: [
      'Plantilla de hasta 14 jugadores y 2 entrenadores.',
      'Alinea a 7 titulares (colocador, opuesto, 2 centrales, 2 receptores y líbero) más un entrenador.',
      'Solo puntúan los titulares alineados en cada jornada.',
      'Puedes vender cualquier jugador por su valor de mercado actual.',
    ],
  },
  {
    icono: 'trending-up',
    titulo: 'Mercado y pujas',
    puntos: [
      'Cada 24 h (a la hora en que se creó la liga) salen 10 jugadores nuevos al mercado.',
      'Pujas a sobre cerrado: la puja mínima es el valor del jugador, y debes superar la puja más alta.',
      'Al cerrar el mercado, cada jugador se lo lleva la puja más alta, siempre que tengas hueco y dinero.',
      'El valor de cada jugador sube o baja a diario según su rendimiento.',
    ],
  },
  {
    icono: 'stats-chart',
    titulo: 'Puntuación',
    puntos: [
      'Los puntos salen de las estadísticas reales: saque (ace +3), ataque (+1), bloqueo (+2,5), recepción y colocación.',
      'Los errores restan; hay bonus por eficacia de ataque superior al 50 %.',
      'La puntuación está ajustada por posición: líbero, colocador o central pueden puntuar tanto como un opuesto.',
      'El entrenador puntúa con el rendimiento medio de su equipo real.',
    ],
  },
];

export default function Reglas() {
  return (
    <FondoDegradado>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <CabeceraPantalla titulo="Reglas" />
        <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
          <Text style={estilos.intro}>
            La SuperFantasy es un fantasy de voleibol: gestiona tu equipo, compite en el mercado y sube en
            la clasificación de tus ligas privadas.
          </Text>
          {BLOQUES.map((b) => (
            <View key={b.titulo} style={estilos.bloque}>
              <View style={estilos.bloqueCabecera}>
                <View style={estilos.bloqueIcono}>
                  <Ionicons name={b.icono} size={18} color={colores.primario} />
                </View>
                <Text style={estilos.bloqueTitulo}>{b.titulo}</Text>
              </View>
              {b.puntos.map((p, i) => (
                <View key={i} style={estilos.punto}>
                  <View style={estilos.vineta} />
                  <Text style={estilos.puntoTexto}>{p}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </FondoDegradado>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: espaciado.l, paddingBottom: 40 },
  intro: { fontSize: 14, fontFamily: tipografia.regular, color: colores.textoSuave, lineHeight: 21, marginBottom: espaciado.l },
  bloque: {
    backgroundColor: colores.superficie,
    borderRadius: radios.l,
    padding: espaciado.l,
    marginBottom: espaciado.m,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  bloqueCabecera: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: espaciado.m },
  bloqueIcono: {
    width: 34,
    height: 34,
    borderRadius: radios.boton,
    backgroundColor: colores.primarioTenue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloqueTitulo: { fontSize: 16, fontFamily: tipografia.extrabold, color: colores.texto },
  punto: { flexDirection: 'row', gap: 10, marginBottom: espaciado.s },
  vineta: { width: 6, height: 6, borderRadius: 3, backgroundColor: colores.primario, marginTop: 7 },
  puntoTexto: { flex: 1, fontSize: 13, fontFamily: tipografia.regular, color: colores.textoSuave, lineHeight: 19 },
});
