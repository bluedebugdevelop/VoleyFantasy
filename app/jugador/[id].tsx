import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ChipPosicion from '@/components/ChipPosicion';
import GraficoValor from '@/components/GraficoValor';
import FondoDegradado from '@/components/FondoDegradado';
import { useJuego } from '@/store/juego';
import { colores, degradados, espaciado, formatearValor, radios, sombra, tipografia } from '@/theme';
import { variacionDiaria } from '@/logic/market';

export default function DetalleJugador() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const jugador = useJuego((s) => s.jugadores.find((j) => j.id === id));

  if (!jugador) {
    return (
      <FondoDegradado>
        <Text style={{ padding: 20, color: colores.texto }}>Jugador no encontrado</Text>
      </FondoDegradado>
    );
  }

  const variacion = variacionDiaria(jugador);
  const positivo = variacion >= 0;
  const totales = jugador.historial.reduce(
    (t, e) => ({
      sets: t.sets + e.setsJugados,
      aces: t.aces + e.aces,
      ataques: t.ataques + e.ataquesPunto,
      bloqueos: t.bloqueos + e.bloqueosPunto,
      recepciones: t.recepciones + e.recepcionesPerfectas,
      errores: t.errores + e.erroresSaque + e.erroresAtaque + e.erroresRecepcion,
    }),
    { sets: 0, aces: 0, ataques: 0, bloqueos: 0, recepciones: 0, errores: 0 },
  );

  return (
    <FondoDegradado>
      <Stack.Screen options={{ title: '', headerTransparent: true }} />
      <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
        {/* Cabecera con degradado */}
        <LinearGradient colors={degradados.tarjetaHero} style={[estilos.cabecera, sombra]}>
          <View style={estilos.dorsalCirculo}>
            <Text style={estilos.dorsalTexto}>{jugador.dorsal}</Text>
          </View>
          <Text style={estilos.nombre}>{jugador.nombre}</Text>
          <Text style={estilos.equipo}>{jugador.equipo}</Text>
          <View style={{ marginTop: 8 }}>
            <ChipPosicion posicion={jugador.posicion} />
          </View>
        </LinearGradient>

        <View style={estilos.filaDatos}>
          <Dato titulo="Valor" valor={formatearValor(jugador.valor)} />
          <Dato
            titulo="Hoy"
            valor={`${positivo ? '+' : '−'}${formatearValor(Math.abs(variacion))}`}
            color={positivo ? colores.verde : colores.rojo}
          />
          <Dato titulo="Media" valor={`${jugador.media}`} />
          <Dato titulo="Total" valor={`${jugador.puntosTotales}`} color={colores.oro} />
        </View>

        <Titulo icono="stats-chart" texto="Evolución de valor" />
        <View style={estilos.tarjeta}>
          <GraficoValor historial={jugador.historialValor} />
        </View>

        <Titulo icono="podium" texto="Estadísticas de temporada" />
        <View style={estilos.tarjeta}>
          <FilaEstadistica icono="tennisball-outline" etiqueta="Sets jugados" valor={totales.sets} />
          <FilaEstadistica icono="flash-outline" etiqueta="Aces" valor={totales.aces} />
          <FilaEstadistica icono="rocket-outline" etiqueta="Puntos de ataque" valor={totales.ataques} />
          <FilaEstadistica icono="hand-left-outline" etiqueta="Bloqueos punto" valor={totales.bloqueos} />
          <FilaEstadistica icono="shield-checkmark-outline" etiqueta="Recepciones perfectas" valor={totales.recepciones} />
          <FilaEstadistica icono="close-circle-outline" etiqueta="Errores totales" valor={totales.errores} ultima />
        </View>

        <Titulo icono="calendar" texto="Puntos por jornada" />
        <View style={estilos.tarjeta}>
          <View style={estilos.jornadas}>
            {jugador.puntosPorJornada.map((p, i) => (
              <View key={i} style={[estilos.jornada, { backgroundColor: colorPuntos(p) }]}>
                <Text style={estilos.jornadaNumero}>J{i + 1}</Text>
                <Text style={estilos.jornadaPuntos}>{p}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </FondoDegradado>
  );
}

function colorPuntos(p: number): string {
  if (p >= 15) return colores.verde;
  if (p >= 8) return colores.oroClaro;
  if (p > 0) return '#F5A623';
  return colores.rojo;
}

function Dato({ titulo, valor, color }: { titulo: string; valor: string; color?: string }) {
  return (
    <View style={estilos.dato}>
      <Text style={estilos.datoTitulo}>{titulo}</Text>
      <Text style={[estilos.datoValor, color ? { color } : null]}>{valor}</Text>
    </View>
  );
}

function Titulo({ icono, texto }: { icono: any; texto: string }) {
  return (
    <View style={estilos.tituloSeccion}>
      <Ionicons name={icono} size={17} color={colores.oro} />
      <Text style={estilos.tituloTexto}>{texto}</Text>
    </View>
  );
}

function FilaEstadistica({ icono, etiqueta, valor, ultima }: { icono: any; etiqueta: string; valor: number; ultima?: boolean }) {
  return (
    <View style={[estilos.filaEst, ultima && { borderBottomWidth: 0 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Ionicons name={icono} size={17} color={colores.textoSuave} />
        <Text style={estilos.filaEstEtiqueta}>{etiqueta}</Text>
      </View>
      <Text style={estilos.filaEstValor}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: espaciado.l, paddingTop: 90, paddingBottom: 32, gap: espaciado.m },
  cabecera: {
    alignItems: 'center',
    borderRadius: radios.xl,
    padding: espaciado.xl,
    borderWidth: 1,
    borderColor: colores.bordeClaro,
  },
  dorsalCirculo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaciado.m,
    borderWidth: 2,
    borderColor: colores.oro,
  },
  dorsalTexto: { fontSize: 28, fontFamily: tipografia.extrabold, color: colores.oro },
  nombre: { fontSize: 22, fontFamily: tipografia.extrabold, color: colores.texto, textAlign: 'center' },
  equipo: { fontSize: 14, fontFamily: tipografia.regular, color: colores.textoSuave, marginTop: 2 },
  filaDatos: { flexDirection: 'row', gap: espaciado.s },
  dato: {
    flex: 1,
    backgroundColor: colores.superficie,
    borderRadius: radios.m,
    padding: espaciado.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colores.borde,
  },
  datoTitulo: { fontSize: 11, fontFamily: tipografia.medium, color: colores.textoSuave },
  datoValor: { fontSize: 15, fontFamily: tipografia.extrabold, color: colores.texto, marginTop: 3 },
  tituloSeccion: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: espaciado.s },
  tituloTexto: { fontSize: 16, fontFamily: tipografia.extrabold, color: colores.texto },
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radios.l,
    padding: espaciado.l,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  jornadas: { flexDirection: 'row', flexWrap: 'wrap', gap: espaciado.s },
  jornada: { borderRadius: radios.s, paddingHorizontal: 9, paddingVertical: 7, alignItems: 'center', minWidth: 46 },
  jornadaNumero: { fontSize: 10, fontFamily: tipografia.semibold, color: 'rgba(255,255,255,0.9)' },
  jornadaPuntos: { fontSize: 14, fontFamily: tipografia.extrabold, color: '#fff' },
  filaEst: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  filaEstEtiqueta: { color: colores.textoSuave, fontSize: 14, fontFamily: tipografia.medium },
  filaEstValor: { color: colores.texto, fontFamily: tipografia.extrabold, fontSize: 15 },
});
