import { createContext, useContext } from 'react';
import { useLocalSearchParams } from 'expo-router';

/**
 * El id de la liga se propaga por contexto desde el layout `liga/[id]`, porque
 * `useLocalSearchParams` NO devuelve el segmento dinámico del padre a las
 * pantallas hijas de las pestañas (devuelve undefined) → provocaba que Mi
 * equipo y Mercado no encontraran el equipo.
 */
export const LigaIdContext = createContext<string | undefined>(undefined);

/** Id de la liga activa. Usa el contexto y, si falta, los params locales. */
export function useLigaId(): string {
  const ctx = useContext(LigaIdContext);
  const params = useLocalSearchParams<{ id?: string }>();
  const local = Array.isArray(params.id) ? params.id[0] : params.id;
  return ctx ?? local ?? '';
}
