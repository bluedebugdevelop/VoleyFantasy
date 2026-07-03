import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Boton from '@/components/Boton';
import FondoDegradado from '@/components/FondoDegradado';
import { registrarConEmail } from '@/services/auth';
import { useJuego } from '@/store/juego';
import { colores, espaciado, radios, tipografia } from '@/theme';

export default function Registro() {
  const router = useRouter();
  const establecerUsuario = useJuego((s) => s.establecerUsuario);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);

  const registrar = async () => {
    if (!nombre || !email || contrasena.length < 6) {
      return Alert.alert('Revisa los datos', 'La contraseña debe tener al menos 6 caracteres.');
    }
    setCargando(true);
    try {
      const u = await registrarConEmail(nombre.trim(), email.trim(), contrasena);
      await establecerUsuario(u);
      router.replace('/(tabs)');
    } catch (e: any) {
      const msg =
        e?.code === 'auth/email-already-in-use'
          ? 'Ya existe una cuenta con ese email'
          : 'No se pudo crear la cuenta, inténtalo de nuevo';
      Alert.alert('Error', msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <FondoDegradado>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          <Pressable style={estilos.volver} onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={colores.texto} />
            <Text style={estilos.volverTexto}>Volver</Text>
          </Pressable>

          <View style={estilos.tarjeta}>
            <Text style={estilos.titulo}>Crea tu cuenta</Text>
            <Text style={estilos.subtitulo}>Elige tu nombre de míster y empieza a competir.</Text>

            <Campo icono="person-outline" placeholder="Nombre de míster" valor={nombre} onChange={setNombre} />
            <Campo icono="mail-outline" placeholder="Email" valor={email} onChange={setEmail} tipo="email" />
            <Campo icono="lock-closed-outline" placeholder="Contraseña (mín. 6)" valor={contrasena} onChange={setContrasena} seguro />

            <Boton titulo="Crear cuenta" onPress={registrar} variante="primario" cargando={cargando} estilo={{ marginTop: 8 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </FondoDegradado>
  );
}

function Campo({
  icono,
  placeholder,
  valor,
  onChange,
  seguro,
  tipo,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  valor: string;
  onChange: (t: string) => void;
  seguro?: boolean;
  tipo?: 'email';
}) {
  return (
    <View style={estilos.campo}>
      <Ionicons name={icono} size={20} color={colores.textoSuave} />
      <TextInput
        style={estilos.input}
        placeholder={placeholder}
        placeholderTextColor={colores.textoTenue}
        value={valor}
        onChangeText={onChange}
        secureTextEntry={seguro}
        autoCapitalize={seguro || tipo === 'email' ? 'none' : 'words'}
        keyboardType={tipo === 'email' ? 'email-address' : 'default'}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenido: { flexGrow: 1, justifyContent: 'center', padding: espaciado.xl, gap: espaciado.l },
  volver: { flexDirection: 'row', alignItems: 'center', gap: 2, position: 'absolute', top: espaciado.xl, left: espaciado.l },
  volverTexto: { fontSize: 15, fontFamily: tipografia.semibold, color: colores.texto },
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radios.xl,
    padding: espaciado.xl,
    gap: espaciado.m,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  titulo: { fontSize: 24, fontFamily: tipografia.extrabold, color: colores.texto },
  subtitulo: { fontSize: 13, fontFamily: tipografia.regular, color: colores.textoSuave, marginBottom: espaciado.s, lineHeight: 19 },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colores.fondoAlt,
    borderRadius: radios.m,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, fontFamily: tipografia.medium, color: colores.texto },
});
