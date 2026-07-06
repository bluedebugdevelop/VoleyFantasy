import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FondoDegradado from '@/components/FondoDegradado';
import CabeceraPantalla from '@/components/CabeceraPantalla';
import { colores, espaciado, tipografia } from '@/theme';

interface Seccion {
  titulo: string;
  texto: string;
}

const SECCIONES: Seccion[] = [
  {
    titulo: '1. Titularidad',
    texto:
      'La SuperFantasy es una aplicación de entretenimiento sin ánimo de lucro, desarrollada de forma independiente. No está afiliada, patrocinada ni respaldada por ninguna federación, liga o club de voleibol.',
  },
  {
    titulo: '2. Datos deportivos',
    texto:
      'Las estadísticas y nombres de jugadores y equipos proceden de fuentes públicas y se utilizan con fines informativos y de entretenimiento. Los derechos sobre dichos datos pertenecen a sus titulares. Si eres titular de algún derecho y deseas que se retire una información, contáctanos.',
  },
  {
    titulo: '3. Naturaleza del juego',
    texto:
      'La SuperFantasy es un juego de gestión con moneda ficticia. No implica apuestas ni intercambio de dinero real, y no otorga premios económicos. Las pujas y valores se expresan en una divisa virtual sin valor monetario.',
  },
  {
    titulo: '4. Cuentas de usuario',
    texto:
      'Para jugar necesitas una cuenta. Eres responsable de la confidencialidad de tus credenciales y de la actividad realizada desde tu cuenta. Puedes solicitar la eliminación de tus datos en cualquier momento.',
  },
  {
    titulo: '5. Privacidad',
    texto:
      'Únicamente se almacenan los datos necesarios para el funcionamiento del juego (identificador de cuenta, nombre, email y el estado de tus equipos y ligas). No se comparten con terceros con fines publicitarios.',
  },
  {
    titulo: '6. Limitación de responsabilidad',
    texto:
      'La aplicación se ofrece "tal cual". No se garantiza la disponibilidad continua del servicio ni la exactitud de los datos deportivos. El uso de la aplicación es responsabilidad del usuario.',
  },
];

export default function AvisoLegal() {
  return (
    <FondoDegradado>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <CabeceraPantalla titulo="Aviso legal" />
        <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
          {SECCIONES.map((s) => (
            <View key={s.titulo} style={{ marginBottom: espaciado.l }}>
              <Text style={estilos.titulo}>{s.titulo}</Text>
              <Text style={estilos.texto}>{s.texto}</Text>
            </View>
          ))}
          <Text style={estilos.pie}>La SuperFantasy · Versión 1.0</Text>
        </ScrollView>
      </SafeAreaView>
    </FondoDegradado>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: espaciado.l, paddingBottom: 40 },
  titulo: { fontSize: 15, fontFamily: tipografia.extrabold, color: colores.texto, marginBottom: 6 },
  texto: { fontSize: 13, fontFamily: tipografia.regular, color: colores.textoSuave, lineHeight: 20 },
  pie: { fontSize: 12, fontFamily: tipografia.medium, color: colores.textoMuted, textAlign: 'center', marginTop: espaciado.m },
});
