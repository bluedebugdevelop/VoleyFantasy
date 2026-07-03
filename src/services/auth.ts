import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth, firebaseConfigurado } from './firebase';
import { Usuario } from '../types';

function mapear(u: User): Usuario {
  return {
    uid: u.uid,
    nombre: u.displayName ?? u.email?.split('@')[0] ?? 'Jugador/a',
    email: u.email ?? '',
  };
}

/** Observa la sesión de Firebase. Devuelve la función para desuscribirse. */
export function observarSesion(cb: (u: Usuario | null) => void): () => void {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, (u) => cb(u ? mapear(u) : null));
}

export async function registrarConEmail(nombre: string, email: string, contrasena: string): Promise<Usuario> {
  if (!auth) throw new Error('Firebase no está configurado');
  const cred = await createUserWithEmailAndPassword(auth, email, contrasena);
  await updateProfile(cred.user, { displayName: nombre });
  return { ...mapear(cred.user), nombre };
}

export async function entrarConEmail(email: string, contrasena: string): Promise<Usuario> {
  if (!auth) throw new Error('Firebase no está configurado');
  const cred = await signInWithEmailAndPassword(auth, email, contrasena);
  return mapear(cred.user);
}

/** Inicia sesión con el idToken devuelto por expo-auth-session (Google). */
export async function entrarConGoogle(idToken: string): Promise<Usuario> {
  if (!auth) throw new Error('Firebase no está configurado');
  const credencial = GoogleAuthProvider.credential(idToken);
  const cred = await signInWithCredential(auth, credencial);
  return mapear(cred.user);
}

export async function cerrarSesionFirebase(): Promise<void> {
  if (auth) await signOut(auth);
}

export { firebaseConfigurado };
