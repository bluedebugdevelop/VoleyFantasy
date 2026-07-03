import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  categoriasDeModalidad,
  HUECOS_ALINEACION,
  Jugador,
  Liga,
  MiembroLiga,
  Modalidad,
  MODALIDAD_POR_DEFECTO,
  MODALIDADES,
  nombreModalidad,
  Operacion,
  PRESUPUESTO_INICIAL,
  TAMANO_PLANTILLA,
  Usuario,
} from '../types';
import { actualizarValorDiario } from '../logic/market';
import {
  actualizarPuntosEnLigas,
  asegurarLigaGeneral,
  buscarLigaPorCodigo,
  cargarEstadoUsuario,
  cargarJugadores,
  cargarLigasDeUsuario,
  crearLigaRemota,
  guardarEstadoUsuario,
  idLigaGeneral,
  unirseLigaRemota,
} from '../services/datos';
import { firebaseConfigurado } from '../services/firebase';

type Alineacion = Record<string, string | null>;

/** Equipo del usuario en una modalidad concreta. */
interface Equipo {
  plantillaIds: string[];
  alineacion: Alineacion;
  presupuesto: number;
  operaciones: Operacion[];
}

function alineacionVacia(): Alineacion {
  const a: Alineacion = {};
  HUECOS_ALINEACION.forEach((h) => (a[h.etiqueta] = null));
  return a;
}

function equipoVacio(): Equipo {
  return { plantillaIds: [], alineacion: alineacionVacia(), presupuesto: PRESUPUESTO_INICIAL, operaciones: [] };
}

function equiposIniciales(): Record<Modalidad, Equipo> {
  const r = {} as Record<Modalidad, Equipo>;
  MODALIDADES.forEach((m) => (r[m.id] = equipoVacio()));
  return r;
}

function codigoLiga(): string {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 6; i++) c += letras[Math.floor(Math.random() * letras.length)];
  return c;
}

const BOTS_DEMO: MiembroLiga[] = [
  { uid: 'bot1', nombre: 'Ana (bot)', puntos: 412 },
  { uid: 'bot2', nombre: 'Leo (bot)', puntos: 386 },
  { uid: 'bot3', nombre: 'Marta (bot)', puntos: 348 },
  { uid: 'bot4', nombre: 'Iker (bot)', puntos: 301 },
];

function ligaGeneralDemo(modalidad: Modalidad, miembro: MiembroLiga): Liga {
  return {
    id: idLigaGeneral(modalidad),
    nombre: `Liga General · ${nombreModalidad(modalidad)}`,
    tipo: 'publica',
    modalidad,
    creador: 'sistema',
    miembros: [...BOTS_DEMO, miembro],
  };
}

interface EstadoJuego {
  usuario: Usuario | null;
  cargando: boolean;
  jugadores: Jugador[];
  equipos: Record<Modalidad, Equipo>;
  modalidadActiva: Modalidad;
  ligas: Liga[];
  ultimoDiaMercado: string;

  inicializar: () => Promise<void>;
  establecerUsuario: (u: Usuario | null) => Promise<void>;
  cerrarSesion: () => void;
  setModalidadActiva: (m: Modalidad) => Promise<void>;
  comprar: (id: string) => string | null;
  vender: (id: string) => void;
  alinear: (etiqueta: string, jugadorId: string | null) => void;
  crearLigaPrivada: (nombre: string, modalidad: Modalidad) => Promise<Liga>;
  unirsePorCodigo: (codigo: string) => Promise<Liga | null>;
  actualizarMercadoDiario: () => void;

  jugador: (id: string) => Jugador | undefined;
  jugadoresDeModalidad: (m?: Modalidad) => Jugador[];
  equipoActivo: () => Equipo;
  valorEquipo: (m?: Modalidad) => number;
  puntosJornada: (m?: Modalidad) => number;
  puntosTotales: (m?: Modalidad) => number;
}

export const useJuego = create<EstadoJuego>()(
  persist(
    (set, get) => ({
      usuario: null,
      cargando: true,
      jugadores: [],
      equipos: equiposIniciales(),
      modalidadActiva: MODALIDAD_POR_DEFECTO,
      ligas: [],
      ultimoDiaMercado: '',

      inicializar: async () => {
        if (firebaseConfigurado || get().jugadores.length === 0) {
          const jugadores = await cargarJugadores();
          set({ jugadores });
        }
        get().actualizarMercadoDiario();
        set({ cargando: false });
      },

      establecerUsuario: async (u) => {
        set({ usuario: u });
        if (!u) return;
        if (u.demo) {
          await get().setModalidadActiva(get().modalidadActiva);
          return;
        }
        // Con Firebase: restaurar equipos y ligas remotas
        const remoto = await cargarEstadoUsuario(u.uid);
        if (remoto?.equipos) {
          const equipos = equiposIniciales();
          (Object.keys(remoto.equipos) as Modalidad[]).forEach((m) => {
            if (!equipos[m]) return;
            equipos[m] = {
              ...equipoVacio(),
              ...remoto.equipos[m],
              alineacion: { ...alineacionVacia(), ...remoto.equipos[m].alineacion },
            };
          });
          set({ equipos, modalidadActiva: (remoto.modalidadActiva as Modalidad) || get().modalidadActiva });
        }
        const activa = get().modalidadActiva;
        const miembro: MiembroLiga = { uid: u.uid, nombre: u.nombre, puntos: get().puntosTotales(activa) };
        const general = await asegurarLigaGeneral(miembro, activa);
        const propias = await cargarLigasDeUsuario(u.uid);
        const mapa = new Map(propias.map((l) => [l.id, l]));
        mapa.set(general.id, general);
        set({ ligas: [...mapa.values()] });
      },

      cerrarSesion: () => {
        set({
          usuario: null,
          equipos: equiposIniciales(),
          modalidadActiva: MODALIDAD_POR_DEFECTO,
          ligas: [],
        });
      },

      setModalidadActiva: async (m) => {
        set({ modalidadActiva: m });
        const u = get().usuario;
        if (!u) return;
        const miembro: MiembroLiga = { uid: u.uid, nombre: u.nombre, puntos: get().puntosTotales(m) };
        // Asegura la liga general pública de esta modalidad
        if (get().ligas.some((l) => l.id === idLigaGeneral(m))) return;
        if (u.demo) {
          set({ ligas: [ligaGeneralDemo(m, miembro), ...get().ligas] });
          return;
        }
        const general = await asegurarLigaGeneral(miembro, m);
        set({ ligas: [...get().ligas.filter((l) => l.id !== general.id), general] });
      },

      comprar: (id) => {
        const { modalidadActiva, equipos, jugadores } = get();
        const e = equipos[modalidadActiva];
        const j = jugadores.find((x) => x.id === id);
        if (!j) return 'Jugador no encontrado';
        if (!categoriasDeModalidad(modalidadActiva).includes(j.categoria))
          return 'Ese jugador no es de esta modalidad';
        if (e.plantillaIds.includes(id)) return 'Ya está en tu plantilla';
        if (e.plantillaIds.length >= TAMANO_PLANTILLA) return `La plantilla está completa (${TAMANO_PLANTILLA})`;
        if (j.valor > e.presupuesto) return 'No tienes presupuesto suficiente';
        const nuevo: Equipo = {
          ...e,
          plantillaIds: [...e.plantillaIds, id],
          presupuesto: e.presupuesto - j.valor,
          operaciones: [
            { tipo: 'compra', jugadorId: id, nombre: j.nombre, importe: j.valor, fecha: Date.now() },
            ...e.operaciones,
          ],
        };
        set({ equipos: { ...equipos, [modalidadActiva]: nuevo } });
        sincronizarRemoto(get());
        return null;
      },

      vender: (id) => {
        const { modalidadActiva, equipos, jugadores } = get();
        const e = equipos[modalidadActiva];
        const j = jugadores.find((x) => x.id === id);
        if (!j || !e.plantillaIds.includes(id)) return;
        const alineacion = { ...e.alineacion };
        Object.keys(alineacion).forEach((k) => {
          if (alineacion[k] === id) alineacion[k] = null;
        });
        const nuevo: Equipo = {
          ...e,
          plantillaIds: e.plantillaIds.filter((x) => x !== id),
          alineacion,
          presupuesto: e.presupuesto + j.valor,
          operaciones: [
            { tipo: 'venta', jugadorId: id, nombre: j.nombre, importe: j.valor, fecha: Date.now() },
            ...e.operaciones,
          ],
        };
        set({ equipos: { ...equipos, [modalidadActiva]: nuevo } });
        sincronizarRemoto(get());
      },

      alinear: (etiqueta, jugadorId) => {
        const { modalidadActiva, equipos, jugadores } = get();
        const e = equipos[modalidadActiva];
        const hueco = HUECOS_ALINEACION.find((h) => h.etiqueta === etiqueta);
        if (!hueco) return;
        if (jugadorId) {
          const j = jugadores.find((x) => x.id === jugadorId);
          if (!j || !e.plantillaIds.includes(jugadorId) || j.posicion !== hueco.posicion) return;
        }
        const alineacion = { ...e.alineacion };
        Object.keys(alineacion).forEach((k) => {
          if (alineacion[k] === jugadorId) alineacion[k] = null;
        });
        alineacion[etiqueta] = jugadorId;
        set({ equipos: { ...equipos, [modalidadActiva]: { ...e, alineacion } } });
        sincronizarRemoto(get());
      },

      crearLigaPrivada: async (nombre, modalidad) => {
        const u = get().usuario!;
        const liga: Liga = {
          id: `liga-${Date.now()}`,
          nombre: nombre.trim() || 'Mi liga',
          tipo: 'privada',
          modalidad,
          codigo: codigoLiga(),
          creador: u.uid,
          miembros: [{ uid: u.uid, nombre: u.nombre, puntos: get().puntosTotales(modalidad) }],
        };
        if (!u.demo) await crearLigaRemota(liga);
        set({ ligas: [...get().ligas, liga] });
        await get().setModalidadActiva(modalidad);
        return liga;
      },

      unirsePorCodigo: async (codigo) => {
        const u = get().usuario!;
        const miembro: MiembroLiga = { uid: u.uid, nombre: u.nombre, puntos: 0 };
        const normalizado = codigo.trim().toUpperCase();
        const local = get().ligas.find((l) => l.codigo === normalizado);
        if (local) return local;
        const remota = u.demo ? null : await buscarLigaPorCodigo(normalizado);
        if (!remota) return null;
        miembro.puntos = get().puntosTotales(remota.modalidad);
        if (!remota.miembros.some((m) => m.uid === u.uid)) {
          await unirseLigaRemota(remota.id, miembro);
          remota.miembros.push(miembro);
        }
        set({ ligas: [...get().ligas.filter((l) => l.id !== remota.id), remota] });
        return remota;
      },

      actualizarMercadoDiario: () => {
        const hoy = new Date().toISOString().slice(0, 10);
        const { ultimoDiaMercado, jugadores, usuario } = get();
        if (ultimoDiaMercado === hoy || (firebaseConfigurado && usuario && !usuario.demo)) {
          set({ ultimoDiaMercado: hoy });
          return;
        }
        const actualizados = jugadores.map((j) => {
          const ruido = Math.random() * 2 - 1;
          const nuevoValor = actualizarValorDiario(j, ruido);
          return { ...j, valor: nuevoValor, historialValor: [...j.historialValor.slice(-29), nuevoValor] };
        });
        set({ jugadores: actualizados, ultimoDiaMercado: hoy });
      },

      jugador: (id) => get().jugadores.find((j) => j.id === id),

      jugadoresDeModalidad: (m) => {
        const cats = categoriasDeModalidad(m ?? get().modalidadActiva);
        return get().jugadores.filter((j) => cats.includes(j.categoria));
      },

      equipoActivo: () => get().equipos[get().modalidadActiva],

      valorEquipo: (m) => {
        const e = get().equipos[m ?? get().modalidadActiva];
        return e.plantillaIds.map((id) => get().jugador(id)?.valor ?? 0).reduce((s, v) => s + v, 0);
      },

      puntosJornada: (m) => {
        const e = get().equipos[m ?? get().modalidadActiva];
        return (
          Math.round(
            Object.values(e.alineacion)
              .map((id) => {
                const j = id ? get().jugador(id) : undefined;
                return j ? j.puntosPorJornada[j.puntosPorJornada.length - 1] ?? 0 : 0;
              })
              .reduce((s, v) => s + v, 0) * 10,
          ) / 10
        );
      },

      puntosTotales: (m) => {
        const e = get().equipos[m ?? get().modalidadActiva];
        return (
          Math.round(
            Object.values(e.alineacion)
              .map((id) => (id ? get().jugador(id)?.puntosTotales ?? 0 : 0))
              .reduce((s, v) => s + v, 0) * 10,
          ) / 10
        );
      },
    }),
    {
      name: 'voleyfantasy-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        usuario: s.usuario?.demo ? s.usuario : null,
        jugadores: s.jugadores,
        equipos: s.equipos,
        modalidadActiva: s.modalidadActiva,
        ligas: s.ligas,
        ultimoDiaMercado: s.ultimoDiaMercado,
      }),
    },
  ),
);

/** Sincroniza el estado del usuario (todos sus equipos) con Firestore. */
function sincronizarRemoto(s: EstadoJuego): void {
  const u = s.usuario;
  if (!u || u.demo || !firebaseConfigurado) return;
  const equipos: Record<string, { plantillaIds: string[]; alineacion: Alineacion; presupuesto: number }> = {};
  (Object.keys(s.equipos) as Modalidad[]).forEach((m) => {
    const e = s.equipos[m];
    equipos[m] = { plantillaIds: e.plantillaIds, alineacion: e.alineacion, presupuesto: e.presupuesto };
  });
  guardarEstadoUsuario(u.uid, { equipos, modalidadActiva: s.modalidadActiva, nombre: u.nombre }).catch(() => {});
  actualizarPuntosEnLigas(u.uid, s.ligas, (m) => s.puntosTotales(m)).catch(() => {});
}
