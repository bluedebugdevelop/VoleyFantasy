import React, { useEffect, useState } from 'react';
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
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Boton from '@/components/Boton';
import Logo from '@/components/Logo';
import FondoDegradado from '@/components/FondoDegradado';
import { entrarConEmail, entrarConGoogle, firebaseConfigurado } from '@/services/auth';
import { GOOGLE_OAUTH, googleConfigurado } from '@/services/firebase';
import { useJuego } from '@/store/juego';
import { colores, espaciado, radios, tipografia } from '@/theme';

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();
  const establecerUsuario = useJuego((s) => s.establecerUsuario);
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [cargando, setCargando] = useState(false);

  const esReal = (id: string) => !id.startsWith('REEMPLAZAR');
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_OAUTH.webClientId,
    ...(esReal(GOOGLE_OAUTH.iosClientId) ? { iosClientId: GOOGLE_OAUTH.iosClientId } : {}),
    ...(esReal(GOOGLE_OAUTH.androidClientId) ? { androidClientId: GOOGLE_OAUTH.androidClientId } : {}),
  });

  useEffect(() => {
    if (response?.type === 'success' && response.params.id_token) {
      entrarConGoogle(response.params.id_token)
        .then(async (u) => {
          await establecerUsuario(u);
          router.replace('/(tabs)');
        })
        .catch((e) => Alert.alert('Error con Google', String(e?.message ?? e)));
    }
  }, [response]);

  const entrar = async () => {
    if (!email || !contrasena) return Alert.alert('Faltan datos', 'Introduce email y contraseña');
    setCargando(true);
    try {
      const u = await entrarConEmail(email.trim(), contrasena);
      await establecerUsuario(u);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('No se pudo iniciar sesión', traducirError(e?.code));
    } finally {
      setCargando(false);
    }
  };

  const entrarDemo = async () => {
    await establecerUsuario({ uid: 'demo', nombre: 'Míster Demo', email: 'demo@voleyfantasy.app', demo: true });
    router.replace('/(tabs)');
  };

  return (
    <FondoDegradado>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          <View style={estilos.cabecera}>
            <Logo />
          </View>

          <View style={estilos.tarjeta}>
            {firebaseConfigurado ? (
              <>
                <Text style={estilos.titulo}>Bienvenido de nuevo</Text>
                <Text style={estilos.subtitulo}>Inicia sesión para gestionar tu equipo</Text>

                <Campo icono="mail-outline" placeholder="Email" valor={email} onChange={setEmail} tipo="email" />
                <Campo
                  icono="lock-closed-outline"
                  placeholder="Contraseña"
                  valor={contrasena}
                  onChange={setContrasena}
                  seguro={!verClave}
                  accion={
                    <Pressable onPress={() => setVerClave((v) => !v)} hitSlop={10}>
                      <Ionicons name={verClave ? 'eye-off-outline' : 'eye-outline'} size={20} color={colores.textoSuave} />
                    </Pressable>
                  }
                />

                <Boton titulo="Iniciar sesión" onPress={entrar} variante="rojo" cargando={cargando} estilo={{ marginTop: 4 }} />

                {googleConfigurado && (
                  <>
                    <Separador />
                    <Boton
                      titulo="Continuar con Google"
                      onPress={() => promptAsync()}
                      variante="claro"
                      deshabilitado={!request}
                      icono={<Ionicons name="logo-google" size={18} color={colores.texto} />}
                    />
                  </>
                )}

                <View style={estilos.registro}>
                  <Text style={estilos.registroTexto}>¿No tienes cuenta? </Text>
                  <Link href="/(auth)/registro" style={estilos.registroEnlace}>
                    Regístrate gratis
                  </Link>
                </View>
              </>
            ) : (
              <>
                <Text style={estilos.titulo}>Modo demo</Text>
                <Text style={estilos.subtitulo}>
                  Firebase aún no está configurado. Juega con datos reales de la RFEVB guardados en tu dispositivo.
                </Text>
                <Boton titulo="Empezar a jugar" onPress={entrarDemo} variante="rojo" estilo={{ marginTop: 8 }} />
              </>
            )}
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
  accion,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  valor: string;
  onChange: (t: string) => void;
  seguro?: boolean;
  tipo?: 'email';
  accion?: React.ReactNode;
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
        autoCapitalize="none"
        keyboardType={tipo === 'email' ? 'email-address' : 'default'}
      />
      {accion}
    </View>
  );
}

function Separador() {
  return (
    <View style={estilos.separador}>
      <View style={estilos.linea} />
      <Text style={estilos.separadorTexto}>o</Text>
      <View style={estilos.linea} />
    </View>
  );
}

function traducirError(codigo?: string): string {
  switch (codigo) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email o contraseña incorrectos';
    case 'auth/too-many-requests':
      return 'Demasiados intentos, prueba más tarde';
    default:
      return 'Comprueba tu conexión e inténtalo de nuevo';
  }
}

const estilos = StyleSheet.create({
  contenido: { flexGrow: 1, justifyContent: 'center', padding: espaciado.xl, gap: espaciado.xl },
  cabecera: { alignItems: 'center', marginTop: espaciado.xl },
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radios.xl,
    padding: espaciado.xl,
    gap: espaciado.m,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  titulo: { fontSize: 22, fontFamily: tipografia.extrabold, color: colores.texto },
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
  separador: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  linea: { flex: 1, height: 1, backgroundColor: colores.borde },
  separadorTexto: { fontSize: 12, fontFamily: tipografia.medium, color: colores.textoTenue },
  registro: { flexDirection: 'row', justifyContent: 'center', marginTop: espaciado.s },
  registroTexto: { fontSize: 13, fontFamily: tipografia.regular, color: colores.textoSuave },
  registroEnlace: { fontSize: 13, fontFamily: tipografia.bold, color: colores.oro },
});
