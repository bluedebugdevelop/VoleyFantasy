import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { EquipoLiga, Jugador, Liga, MiembroLiga, Modalidad, Partido, Puja, Venta } from '../types';
import { generarJugadoresSeed } from '../data/seed';
import jugadoresReales from '../data/jugadoresReales.json';
import calendarioLocal from '../data/calendario.json';

/**
 * Capa de datos: Firestore cuando está configurado (colecciones `jugadores` y
 * `calendario` que rellena a diario el scraper) con datos empaquetados como
 * respaldo (modo demo / sin conexión).
 */
export async function cargarJugadores(): Promise<Jugador[]> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'jugadores'));
      if (!snap.empty) return snap.docs.map((d) => d.data() as Jugador);
    } catch (e) {
      console.warn('No se pudieron cargar jugadores de Firestore, usando datos locales', e);
    }
  }
  const reales = jugadoresReales as unknown as Jugador[];
  return reales.length > 0 ? reales : generarJugadoresSeed();
}

/** Próxima jornada (o última disputada) por categoría. */
export async function cargarCalendario(): Promise<Record<string, Partido[]>> {
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'calendario'));
      if (!snap.empty) {
        const r: Record<string, Partido[]> = {};
        snap.forEach((d) => {
          r[d.id] = (d.data().proximaJornada ?? []) as Partido[];
        });
        return r;
      }
    } catch {
      // sin permisos o sin datos: caemos al calendario local
    }
  }
  return calendarioLocal as unknown as Record<string, Partido[]>;
}

// ----- Estado del usuario (equipos por liga) -----

export interface EstadoUsuarioRemoto {
  equiposLiga: Record<string, EquipoLiga>;
  nombre: string;
}

export async function guardarEstadoUsuario(uid: string, estado: EstadoUsuarioRemoto): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'usuarios', uid), estado, { merge: true });
}

export async function cargarEstadoUsuario(uid: string): Promise<EstadoUsuarioRemoto | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'usuarios', uid));
  return snap.exists() ? (snap.data() as EstadoUsuarioRemoto) : null;
}

// ----- Ligas -----

export async function crearLigaRemota(liga: Liga): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'ligas', liga.id), liga);
}

export async function cargarLiga(ligaId: string): Promise<Liga | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'ligas', ligaId));
  return snap.exists() ? (snap.data() as Liga) : null;
}

export async function buscarLigaPorCodigo(codigo: string): Promise<Liga | null> {
  if (!db) return null;
  const q = query(collection(db, 'ligas'), where('codigo', '==', codigo.toUpperCase()));
  const snap = await getDocs(q);
  return snap.empty ? null : (snap.docs[0].data() as Liga);
}

export async function unirseLigaRemota(ligaId: string, miembro: MiembroLiga): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'ligas', ligaId), { miembros: arrayUnion(miembro) });
}

export async function cargarLigasDeUsuario(uid: string): Promise<Liga[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, 'ligas'));
  return snap.docs.map((d) => d.data() as Liga).filter((l) => l.miembros.some((m) => m.uid === uid));
}

/** Registra o mejora una puja en el mercado de la liga. */
export async function guardarPujas(ligaId: string, pujas: Record<string, Puja[]>, cicloPujas: number): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'ligas', ligaId), { pujas, cicloPujas });
}

/** Publica la resolución de un ciclo: limpia pujas y añade las ventas. */
export async function publicarResolucion(
  ligaId: string,
  cicloPujas: number,
  ventas: Venta[],
): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'ligas', ligaId), { pujas: {}, cicloPujas, ventas });
}

export async function guardarVentas(ligaId: string, ventas: Venta[]): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'ligas', ligaId), { ventas });
}

/** Actualiza los puntos del usuario en sus ligas (los de cada equipo de liga). */
export async function actualizarPuntosEnLigas(
  uid: string,
  ligas: Liga[],
  puntosDe: (ligaId: string) => number,
): Promise<void> {
  if (!db) return;
  await Promise.all(
    ligas.map(async (l) => {
      const puntos = puntosDe(l.id);
      const miembros = l.miembros.map((m) => (m.uid === uid ? { ...m, puntos } : m));
      await updateDoc(doc(db!, 'ligas', l.id), { miembros }).catch(() => {});
    }),
  );
}
