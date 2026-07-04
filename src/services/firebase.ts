import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
// @ts-ignore getReactNativePersistence existe en firebase/auth pero no está en sus tipos
import { Auth, getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Configuración de Firebase (plan gratuito Spark: Auth + Firestore).
 * Valores de https://console.firebase.google.com
 * (Configuración del proyecto → Tus apps → App web).
 *
 * Mientras el apiKey sea el de relleno, la app funciona en MODO DEMO:
 * todo se guarda localmente en el dispositivo y no se necesita cuenta.
 */
const firebaseConfig = {
  apiKey: 'AIzaSyDVOs8MCS1a03UdRZwDefK2sFBhkdAxJ8s',
  authDomain: 'voleyfantasy-edff8.firebaseapp.com',
  projectId: 'voleyfantasy-edff8',
  storageBucket: 'voleyfantasy-edff8.firebasestorage.app',
  messagingSenderId: '977874442271',
  appId: '1:977874442271:web:f9eb41afb9af09fe735d2a',
};

/**
 * IDs de cliente OAuth de Google (Google Cloud Console → Credenciales).
 * Para probar en Expo Go basta el Web client. El botón "Continuar con Google"
 * solo aparece cuando `webClientId` deja de ser el de relleno.
 */
export const GOOGLE_OAUTH = {
  webClientId: '977874442271-44ea8lqpvo76splgb6g92ftbs436co0b.apps.googleusercontent.com',
  // Cliente Android: paquete com.voleyfantasy.app + SHA-1 del keystore de EAS.
  androidClientId: '977874442271-ija4civsk7lduj7ovise9n118br2gt6h.apps.googleusercontent.com',
  // Rellénalo solo si compilas también para iOS (Google Cloud → Credenciales →
  // crear cliente OAuth iOS con el bundle identifier).
  iosClientId: 'REEMPLAZAR.apps.googleusercontent.com',
};

export const firebaseConfigurado = !firebaseConfig.apiKey.startsWith('REEMPLAZAR');
export const googleConfigurado = !GOOGLE_OAUTH.webClientId.startsWith('REEMPLAZAR');

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (firebaseConfigurado) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  // initializeAuth con persistencia en AsyncStorage: la sesión se mantiene
  // entre reinicios de la app. Si ya estaba inicializado, reutilízalo.
  try {
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    auth = getAuth(app);
  }
  db = getFirestore(app);
}

export { app, auth, db };
