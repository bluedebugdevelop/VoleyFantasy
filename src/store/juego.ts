import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EquipoLiga,
  HUECOS_ALINEACION,
  Jugador,
  Liga,
  MiembroLiga,
  Modalidad,
  nombreModalidad,
  Partido,
  Puja,
  Usuario,
} from '../types';
import { actualizarValorDiario } from '../logic/market';
import {
  alinearInicial,
  cabeEnPlantilla,
  cicloActual,
  plantillaInicial,
  resolverPujas,
  validarPuja,
} from '../logic/mercadoLiga';
import {
  actualizarPuntosEnLigas,
  buscarLigaPorCodigo,
  cargarCalendario,
  cargarEstadoUsuario,
  cargarJugadores,
  cargarLiga,
  cargarLigasDeUsuario,
  crearLigaRemota,
  guardarEstadoUsuario,
  guardarPujas,
  guardarVentas,
  publicarResolucion,
  unirseLigaRemota,
} from '../services/datos';
import { firebaseConfigurado } from '../services/firebase';

function alineacionVacia(): Record<string, string | null> {
  const a: Record<string, string | null> = {};
  HUECOS_ALINEACION.forEach((h) => (a[h.etiqueta] = null));
  return a;
}

function codigoLiga(): string {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 6; i++) c += letras[Math.floor(Math.random() * letras.length)];
  return c;
}

interface EstadoJuego {
  usuario: Usuario | null;
  cargando: boolean;
  jugadores: Jugador[];
  calendario: Record<string, Partido[]>;
  ligas: Liga[];
  equiposLiga: Record<string, EquipoLiga>;
  ultimoDiaMercado: string;

  inicializar: () => Promise<void>;
  establecerUsuario: (u: Usuario | null) => Promise<void>;
  cerrarSesion: () => void;

  crearLiga: (nombre: string, modalidad: Modalidad) => Promise<Liga>;
  unirsePorCodigo: (codigo: string) => Promise<Liga | null>;
  /** Garantiza que existe equipo en la liga. Devuelve true si es nuevo (→ bienvenida). */
  asegurarEquipo: (ligaId: string) => boolean;
  marcarBienvenidaVista: (ligaId: string) => void;
  refrescarLiga: (ligaId: string) => Promise<void>;

  vender: (ligaId: string, jugadorId: string) => void;
  alinear: (ligaId: string, etiqueta: string, jugadorId: string | null) => void;
  pujar: (ligaId: string, jugadorId: string, cantidad: number) => string | null;
  /** Resuelve ciclos de mercado expirados y reclama las subastas ganadas. */
  sincronizarMercado: (ligaId: string) => Promise<void>;

  liga: (ligaId: string) => Liga | undefined;
  jugador: (id: string) => Jugador | undefined;
  equipoDe: (ligaId: string) => EquipoLiga | undefined;
  puntosJornada: (ligaId: string) => number;
  puntosTotales: (ligaId: string) => number;
  valorEquipo: (ligaId: string) => number;
  actualizarMercadoDiario: () => void;
}

export const useJuego = create<EstadoJuego>()(
  persist(
    (set, get) => ({
      usuario: null,
      cargando: true,
      jugadores: [],
      calendario: {},
      ligas: [],
      equiposLiga: {},
      ultimoDiaMercado: '',

      inicializar: async () => {
        if (firebaseConfigurado || get().jugadores.length === 0) {
          const [jugadores, calendario] = await Promise.all([cargarJugadores(), cargarCalendario()]);
          set({ jugadores, calendario });
        } else if (Object.keys(get().calendario).length === 0) {
          set({ calendario: await cargarCalendario() });
        }
        get().actualizarMercadoDiario();
        set({ cargando: false });
      },

      establecerUsuario: async (u) => {
        set({ usuario: u });
        if (!u || u.demo) return;
        const remoto = await cargarEstadoUsuario(u.uid);
        if (remoto?.equiposLiga) set({ equiposLiga: remoto.equiposLiga });
        const ligas = await cargarLigasDeUsuario(u.uid);
        if (ligas.length > 0) set({ ligas });
      },

      cerrarSesion: () => {
        set({ usuario: null, ligas: [], equiposLiga: {} });
      },

      crearLiga: async (nombre, modalidad) => {
        const u = get().usuario!;
        const liga: Liga = {
          id: `liga-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
          nombre: nombre.trim() || 'Mi liga',
          tipo: 'privada',
          modalidad,
          codigo: codigoLiga(),
          creador: u.uid,
          creadaEn: Date.now(),
          miembros: [{ uid: u.uid, nombre: u.nombre, puntos: 0 }],
          pujas: {},
          cicloPujas: 0,
          ventas: [],
        };
        if (!u.demo) await crearLigaRemota(liga);
        set({ ligas: [...get().ligas, liga] });
        return liga;
      },

      unirsePorCodigo: async (codigo) => {
        const u = get().usuario!;
        const normalizado = codigo.trim().toUpperCase();
        const local = get().ligas.find((l) => l.codigo === normalizado);
        if (local) return local;
        const remota = u.demo ? null : await buscarLigaPorCodigo(normalizado);
        if (!remota) return null;
        if (!remota.miembros.some((m) => m.uid === u.uid)) {
          const miembro: MiembroLiga = { uid: u.uid, nombre: u.nombre, puntos: 0 };
          await unirseLigaRemota(remota.id, miembro);
          remota.miembros.push(miembro);
        }
        set({ ligas: [...get().ligas.filter((l) => l.id !== remota.id), remota] });
        return remota;
      },

      asegurarEquipo: (ligaId) => {
        const { equiposLiga, usuario, jugadores } = get();
        if (equiposLiga[ligaId]) return !equiposLiga[ligaId].bienvenidaVista;
        const liga = get().liga(ligaId);
        if (!liga || !usuario || jugadores.length === 0) return false;
        const inicial = plantillaInicial(ligaId, usuario.uid, liga, jugadores);
        const equipo: EquipoLiga = {
          plantillaIds: inicial.ids,
          alineacion: { ...alineacionVacia(), ...alinearInicial(inicial.ids, jugadores) },
          presupuesto: inicial.presupuesto,
          bienvenidaVista: false,
        };
        set({ equiposLiga: { ...equiposLiga, [ligaId]: equipo } });
        sincronizarRemoto(get());
        return true;
      },

      marcarBienvenidaVista: (ligaId) => {
        const e = get().equiposLiga[ligaId];
        if (!e) return;
        set({ equiposLiga: { ...get().equiposLiga, [ligaId]: { ...e, bienvenidaVista: true } } });
        sincronizarRemoto(get());
      },

      refrescarLiga: async (ligaId) => {
        const u = get().usuario;
        if (!u || u.demo) return;
        const remota = await cargarLiga(ligaId);
        if (remota) set({ ligas: get().ligas.map((l) => (l.id === ligaId ? remota : l)) });
      },

      vender: (ligaId, jugadorId) => {
        const e = get().equiposLiga[ligaId];
        const j = get().jugador(jugadorId);
        if (!e || !j || !e.plantillaIds.includes(jugadorId)) return;
        const alineacion = { ...e.alineacion };
        Object.keys(alineacion).forEach((k) => {
          if (alineacion[k] === jugadorId) alineacion[k] = null;
        });
        set({
          equiposLiga: {
            ...get().equiposLiga,
            [ligaId]: {
              ...e,
              plantillaIds: e.plantillaIds.filter((x) => x !== jugadorId),
              alineacion,
              presupuesto: e.presupuesto + j.valor,
            },
          },
        });
        sincronizarRemoto(get());
      },

      alinear: (ligaId, etiqueta, jugadorId) => {
        const e = get().equiposLiga[ligaId];
        const hueco = HUECOS_ALINEACION.find((h) => h.etiqueta === etiqueta);
        if (!e || !hueco) return;
        if (jugadorId) {
          const j = get().jugador(jugadorId);
          if (!j || !e.plantillaIds.includes(jugadorId) || j.posicion !== hueco.posicion) return;
        }
        const alineacion = { ...e.alineacion };
        Object.keys(alineacion).forEach((k) => {
          if (alineacion[k] === jugadorId) alineacion[k] = null;
        });
        alineacion[etiqueta] = jugadorId;
        set({ equiposLiga: { ...get().equiposLiga, [ligaId]: { ...e, alineacion } } });
        sincronizarRemoto(get());
      },

      pujar: (ligaId, jugadorId, cantidad) => {
        const { usuario, jugadores } = get();
        const liga = get().liga(ligaId);
        const equipo = get().equiposLiga[ligaId];
        const j = get().jugador(jugadorId);
        if (!liga || !equipo || !j || !usuario) return 'Liga o jugador no encontrado';
        const pujasJugador = liga.pujas?.[jugadorId];
        const error = validarPuja(cantidad, j, pujasJugador, equipo, jugadores);
        if (error) return error;
        const nueva: Puja = { uid: usuario.uid, nombre: usuario.nombre, cantidad, fecha: Date.now() };
        const pujas = { ...(liga.pujas ?? {}) };
        pujas[jugadorId] = [...(pujasJugador ?? []).filter((p) => p.uid !== usuario.uid), nueva];
        const actualizada: Liga = { ...liga, pujas, cicloPujas: cicloActual(liga) };
        set({ ligas: get().ligas.map((l) => (l.id === ligaId ? actualizada : l)) });
        if (!usuario.demo) guardarPujas(ligaId, pujas, actualizada.cicloPujas!).catch(() => {});
        return null;
      },

      sincronizarMercado: async (ligaId) => {
        await get().refrescarLiga(ligaId);
        const { usuario, jugadores } = get();
        let liga = get().liga(ligaId);
        if (!liga || !usuario) return;

        // 1. Si hay pujas de un ciclo ya expirado, resolverlas → ventas
        const ciclo = cicloActual(liga);
        if ((liga.cicloPujas ?? 0) < ciclo && liga.pujas && Object.keys(liga.pujas).length > 0) {
          const nuevasVentas = resolverPujas(liga.pujas, liga.cicloPujas ?? 0);
          const ventas = [...(liga.ventas ?? []), ...nuevasVentas];
          liga = { ...liga, pujas: {}, cicloPujas: ciclo, ventas };
          set({ ligas: get().ligas.map((l) => (l.id === ligaId ? liga! : l)) });
          if (!usuario.demo) await publicarResolucion(ligaId, ciclo, ventas).catch(() => {});
        } else if ((liga.cicloPujas ?? 0) < ciclo) {
          liga = { ...liga, cicloPujas: ciclo };
          set({ ligas: get().ligas.map((l) => (l.id === ligaId ? liga! : l)) });
        }

        // 2. Reclamar mis subastas ganadas (si tengo hueco y dinero)
        const equipo = get().equiposLiga[ligaId];
        if (!equipo) return;
        const misVentas = (liga.ventas ?? []).filter((v) => v.uid === usuario.uid && !v.reclamada);
        if (misVentas.length === 0) return;
        let plantillaIds = [...equipo.plantillaIds];
        let presupuesto = equipo.presupuesto;
        const ventasActualizadas = (liga.ventas ?? []).map((v) => {
          if (v.uid !== usuario.uid || v.reclamada) return v;
          const j = jugadores.find((x) => x.id === v.jugadorId);
          const equipoTmp: EquipoLiga = { ...equipo, plantillaIds, presupuesto };
          if (j && presupuesto >= v.cantidad && !plantillaIds.includes(j.id) && cabeEnPlantilla(equipoTmp, j, jugadores)) {
            plantillaIds = [...plantillaIds, j.id];
            presupuesto -= v.cantidad;
          }
          return { ...v, reclamada: true };
        });
        set({
          equiposLiga: { ...get().equiposLiga, [ligaId]: { ...equipo, plantillaIds, presupuesto } },
          ligas: get().ligas.map((l) => (l.id === ligaId ? { ...l, ventas: ventasActualizadas } : l)),
        });
        if (!usuario.demo) await guardarVentas(ligaId, ventasActualizadas).catch(() => {});
        sincronizarRemoto(get());
      },

      liga: (ligaId) => get().ligas.find((l) => l.id === ligaId),
      jugador: (id) => get().jugadores.find((j) => j.id === id),
      equipoDe: (ligaId) => get().equiposLiga[ligaId],

      puntosJornada: (ligaId) => {
        const e = get().equiposLiga[ligaId];
        if (!e) return 0;
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

      puntosTotales: (ligaId) => {
        const e = get().equiposLiga[ligaId];
        if (!e) return 0;
        return (
          Math.round(
            Object.values(e.alineacion)
              .map((id) => (id ? get().jugador(id)?.puntosTotales ?? 0 : 0))
              .reduce((s, v) => s + v, 0) * 10,
          ) / 10
        );
      },

      valorEquipo: (ligaId) => {
        const e = get().equiposLiga[ligaId];
        if (!e) return 0;
        return e.plantillaIds.map((id) => get().jugador(id)?.valor ?? 0).reduce((s, v) => s + v, 0);
      },

      actualizarMercadoDiario: () => {
        // Evolución local de valores en demo; en producción la aplica el scraper
        const hoy = new Date().toISOString().slice(0, 10);
        const { ultimoDiaMercado, jugadores, usuario } = get();
        if (ultimoDiaMercado === hoy || (firebaseConfigurado && usuario && !usuario.demo)) {
          set({ ultimoDiaMercado: hoy });
          return;
        }
        const actualizados = jugadores.map((j) => {
          const nuevoValor = actualizarValorDiario(j, Math.random() * 2 - 1);
          return { ...j, valor: nuevoValor, historialValor: [...j.historialValor.slice(-29), nuevoValor] };
        });
        set({ jugadores: actualizados, ultimoDiaMercado: hoy });
      },
    }),
    {
      name: 'voleyfantasy-v3',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        usuario: s.usuario?.demo ? s.usuario : null,
        jugadores: s.jugadores,
        calendario: s.calendario,
        ligas: s.ligas,
        equiposLiga: s.equiposLiga,
        ultimoDiaMercado: s.ultimoDiaMercado,
      }),
    },
  ),
);

/** Sincroniza equipos y puntos con Firestore sin bloquear la UI. */
function sincronizarRemoto(s: EstadoJuego): void {
  const u = s.usuario;
  if (!u || u.demo || !firebaseConfigurado) return;
  guardarEstadoUsuario(u.uid, { equiposLiga: s.equiposLiga, nombre: u.nombre }).catch(() => {});
  actualizarPuntosEnLigas(u.uid, s.ligas, (ligaId) => s.puntosTotales(ligaId)).catch(() => {});
}

export { nombreModalidad };
