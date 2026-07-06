import React, { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useLigaId } from '@/components/LigaContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Boton from '@/components/Boton';
import { useJuego } from '@/store/juego';
import { nombreModalidad } from '@/types';
import { colores, degradados, espaciado, radios, sombraSuave, tipografia } from '@/theme';

/** Invitar amigos a la liga: código grande + copiar + compartir enlace. */
export default function Invitar() {
  const id = useLigaId();
  const router = useRouter();
  const liga = useJuego((s) => s.ligas.find((l) => l.id === id));
  const [copiado, setCopiado] = useState(false);

  if (!liga?.codigo) return null;

  // Enlace https (clicable en WhatsApp): página puente en GitHub Pages que
  // redirige al esquema nativo voleyfantasy://unirse/CODIGO
  const enlace = `https://bluedebugdevelop.github.io/VoleyFantasy/unirse.html?c=${liga.codigo}`;
  const mensaje =
    `🏐 ¡Únete a mi liga "${liga.nombre}" en La SuperFantasy!\n\n` +
    `Competición: ${nombreModalidad(liga.modalidad)}\n` +
    `Código de invitación: ${liga.codigo}\n\n` +
    `Entra aquí: ${enlace}`;

  const copiar = async () => {
    await Clipboard.setStringAsync(liga.codigo!);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const compartir = () => Share.share({ message: mensaje });

  return (
    <View style={estilos.pantalla}>
      <LinearGradient colors={degradados.marca} style={[estilos.tarjeta, sombraSuave]}>
        <Ionicons name="people" size={36} color="#fff" />
        <Text style={estilos.titulo}>Invita a tus amigos</Text>
        <Text style={estilos.subtitulo}>
          Comparte este código para que se unan a {liga.nombre} y compitan contra ti.
        </Text>

        <Pressable style={estilos.codigoCaja} onPress={copiar}>
          <Text style={estilos.codigo}>{liga.codigo}</Text>
          <View style={estilos.copiar}>
            <Ionicons name={copiado ? 'checkmark' : 'copy-outline'} size={15} color={colores.primario} />
            <Text style={estilos.copiarTexto}>{copiado ? 'Copiado' : 'Copiar'}</Text>
          </View>
        </Pressable>
      </LinearGradient>

      <Boton
        titulo="Compartir invitación"
        variante="verde"
        icono={<Ionicons name="share-social" size={18} color="#fff" />}
        onPress={compartir}
      />
      <Boton titulo="Volver a la liga" variante="fantasma" onPress={() => router.back()} />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo, padding: espaciado.l, gap: espaciado.m, justifyContent: 'center' },
  tarjeta: {
    alignItems: 'center',
    gap: 10,
    borderRadius: radios.xl,
    padding: espaciado.xl,
    marginBottom: espaciado.m,
  },
  titulo: { fontSize: 21, fontFamily: tipografia.extrabold, color: '#fff' },
  subtitulo: { fontSize: 13, fontFamily: tipografia.regular, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 19 },
  codigoCaja: {
    marginTop: espaciado.m,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: radios.l,
    paddingVertical: espaciado.l,
    paddingHorizontal: espaciado.xxl,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
  codigo: { fontSize: 34, fontFamily: tipografia.extrabold, color: '#fff', letterSpacing: 8 },
  copiar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  copiarTexto: { fontSize: 12, fontFamily: tipografia.bold, color: colores.primario },
});
