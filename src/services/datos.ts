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
import { Jugador, Liga, MiembroLiga } from '../types';
import { generarJugadoresSeed } from '../data/seed';
import jugadoresReales from '../data/jugadoresReales.json';

/**
 * Capa de datos: usa Firestore cuando está configurado (colección `jugadores`
 * que rellena y actualiza a diario el scraper de /scraper con los datos de
 * https://rfevb-web.dataproject.com). Sin Firestore, usa la última foto de
 * datos reales empaquetada en la app y, como último recurso, datos generados.
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

export interface EquipoRemoto {
  plantillaIds: string[];
  alineacion: Record<string, string | null>;
  presupuesto: number;
}

export interface EstadoUsuarioRemoto {
  /** Un equipo por modalidad (clave = Modalidad). */
  equipos: Record<string, EquipoRemoto>;
  modalidadActiva: string;
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

import { Modalidad, nombreModalidad } from '../types';

export const idLigaGeneral = (modalidad: Modalidad) => `liga-general-${modalidad}`;

/** Liga pública general de una modalidad; crea o incorpora al usuario. */
export async function asegurarLigaGeneral(miembro: MiembroLiga, modalidad: Modalidad): Promise<Liga> {
  const base: Liga = {
    id: idLigaGeneral(modalidad),
    nombre: `Liga General · ${nombreModalidad(modalidad)}`,
    tipo: 'publica',
    modalidad,
    creador: 'sistema',
    miembros: [miembro],
  };
  if (!db) return base;
  const ref = doc(db, 'ligas', base.id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, base);
    return base;
  }
  const liga = snap.data() as Liga;
  if (!liga.miembros.some((m) => m.uid === miembro.uid)) {
    await updateDoc(ref, { miembros: arrayUnion(miembro) });
    liga.miembros.push(miembro);
  }
  return liga;
}

export async function crearLigaRemota(liga: Liga): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'ligas', liga.id), liga);
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

/** Actualiza los puntos del usuario en cada liga según la modalidad de esa liga. */
export async function actualizarPuntosEnLigas(
  uid: string,
  ligas: Liga[],
  puntosDe: (modalidad: Modalidad) => number,
): Promise<void> {
  if (!db) return;
  await Promise.all(
    ligas.map(async (l) => {
      const puntos = puntosDe(l.modalidad);
      const miembros = l.miembros.map((m) => (m.uid === uid ? { ...m, puntos } : m));
      await updateDoc(doc(db!, 'ligas', l.id), { miembros });
    }),
  );
}
