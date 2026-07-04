import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Boton from '@/components/Boton';
import FondoDegradado from '@/components/FondoDegradado';
import { alerta, confirmar } from '@/components/Alerta';
import { useJuego } from '@/store/juego';
import { nombreModalidad } from '@/types';
import { buscarLigaPorCodigo } from '@/services/datos';
import { colores, degradados, espaciado, radios, tipografia } from '@/theme';

/** Unirse a una liga privada introduciendo su código de invitación. */
export default function UnirseLiga() {
  const router = useRouter();
  const usuario = useJuego((s) => s.usuario);
  const ligas = useJuego((s) => s.ligas);
  const unirsePorCodigo = useJuego((s) => s.unirsePorCodigo);
  const asegurarEquipo = useJuego((s) => s.asegurarEquipo);
  const [codigo, setCodigo] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const buscar = async () => {
    const normalizado = codigo.trim().toUpperCase();
    if (normalizado.length < 6) {
      return alerta({ icono: 'key', tono: 'aviso', titulo: 'Código incompleto', mensaje: 'El código tiene 6 caracteres.' });
    }
    setOcupado(true);
    const liga = ligas.find((l) => l.codigo === normalizado) ?? (usuario?.demo ? null : await buscarLigaPorCodigo(normalizado));
    setOcupado(false);
    if (!liga) {
      return alerta({
        icono: 'close-circle',
        tono: 'peligro',
        titulo: 'Liga no encontrada',
        mensaje: `No existe ninguna liga con el código ${normalizado}. Revisa que esté bien escrito.`,
      });
    }
    confirmar(
      `¿Unirte a "${liga.nombre}"?`,
      `${nombreModalidad(liga.modalidad)} · ${liga.miembros.length} participante${liga.miembros.length === 1 ? '' : 's'}. Recibirás tu plantilla inicial y entrarás en su mercado.`,
      async () => {
        setOcupado(true);
        const unida = await unirsePorCodigo(normalizado);
        setOcupado(false);
        if (!unida) return;
        const nueva = asegurarEquipo(unida.id);
        router.replace(
          nueva
            ? { pathname: '/bienvenida/[id]', params: { id: unida.id } }
            : { pathname: '/liga/[id]', params: { id: unida.id } },
        );
      },
      { textoOk: 'Unirme', icono: 'enter' },
    );
  };

  return (
    <FondoDegradado>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={estilos.cabecera}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={estilos.volver}>
              <Ionicons name="chevron-back" size={24} color={colores.texto} />
            </Pressable>
            <Text style={estilos.tituloCabecera}>Unirse a una liga</Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={estilos.contenido}>
            <LinearGradient colors={degradados.rosa} style={estilos.icono}>
              <Ionicons name="people" size={40} color="#fff" />
            </LinearGradient>
            <Text style={estilos.titulo}>Introduce el código</Text>
            <Text style={estilos.subtitulo}>
              Pídele a tu amigo el código de 6 caracteres de su liga (o abre directamente su enlace de
              invitación).
            </Text>

            <View style={estilos.campoCodigo}>
              <TextInput
                style={estilos.inputCodigo}
                placeholder="······"
                placeholderTextColor={colores.textoMuted}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                value={codigo}
                onChangeText={(t) => setCodigo(t.toUpperCase())}
              />
            </View>

            <Boton
              titulo="Buscar liga"
              onPress={buscar}
              cargando={ocupado}
              estilo={{ alignSelf: 'stretch' }}
              icono={<Ionicons name="search" size={18} color="#fff" />}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </FondoDegradado>
  );
}

const estilos = StyleSheet.create({
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: espaciado.m,
    paddingVertical: espaciado.m,
  },
  volver: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloCabecera: { fontSize: 18, fontFamily: tipografia.extrabold, color: colores.texto },
  contenido: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espaciado.xl, gap: espaciado.m },
  icono: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaciado.s,
  },
  titulo: { fontSize: 22, fontFamily: tipografia.extrabold, color: colores.texto },
  subtitulo: {
    fontSize: 13,
    fontFamily: tipografia.regular,
    color: colores.textoTenue,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: espaciado.m,
  },
  campoCodigo: {
    backgroundColor: colores.superficie,
    borderRadius: radios.l,
    borderWidth: 1.5,
    borderColor: colores.primario,
    paddingHorizontal: espaciado.xl,
    marginBottom: espaciado.m,
  },
  inputCodigo: {
    fontSize: 34,
    fontFamily: tipografia.extrabold,
    color: colores.texto,
    letterSpacing: 12,
    paddingVertical: 14,
    minWidth: 230,
    textAlign: 'center',
  },
});
