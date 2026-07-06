import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Boton from './Boton';
import { useJuego } from '../store/juego';
import { colores, espaciado, radios, tipografia } from '../theme';

/**
 * Respaldo cuando el equipo de la liga aún no existe: intenta crearlo al
 * montar y ofrece un botón manual. Si algo falla, muestra el motivo exacto
 * (diagnóstico) en pantalla en lugar de un spinner infinito.
 */
export default function SinEquipo({ ligaId }: { ligaId: string }) {
  const asegurarEquipo = useJuego((s) => s.asegurarEquipo);
  const hidratado = useJuego((s) => s.hidratado);
  const numJugadores = useJuego((s) => s.jugadores.length);
  const hayLiga = useJuego((s) => s.ligas.some((l) => l.id === ligaId));
  const hayUsuario = useJuego((s) => !!s.usuario);
  const [error, setError] = useState<string | null>(null);

  const intentar = () => {
    try {
      setError(null);
      asegurarEquipo(ligaId);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  };

  // Intento automático al montar y cuando cambien las precondiciones.
  useEffect(() => {
    if (ligaId) intentar();
  }, [ligaId, hidratado, numJugadores, hayLiga, hayUsuario]);

  return (
    <View style={estilos.caja}>
      <View style={estilos.icono}>
        <Ionicons name="shirt-outline" size={30} color={colores.primario} />
      </View>
      <Text style={estilos.titulo}>Tu equipo no está listo</Text>
      <Text style={estilos.texto}>
        Pulsa el botón para recibir tu plantilla inicial de 7 jugadores en esta liga.
      </Text>
      <Boton
        titulo="Generar mi equipo"
        onPress={intentar}
        icono={<Ionicons name="sparkles" size={17} color="#fff" />}
        estilo={{ alignSelf: 'stretch', marginTop: espaciado.s }}
      />
      {!!error && <Text style={estilos.error}>Error: {error}</Text>}
      <Text style={estilos.diagnostico}>
        liga {hayLiga ? 'sí' : 'NO'} · sesión {hayUsuario ? 'sí' : 'NO'} · jugadores {numJugadores} ·
        datos {hidratado ? 'listos' : 'cargando'} · id {ligaId ? String(ligaId).slice(0, 18) : 'NO'}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaciado.xl,
    gap: espaciado.s,
    backgroundColor: colores.fondo,
  },
  icono: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colores.primarioTenue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaciado.s,
  },
  titulo: { fontSize: 18, fontFamily: tipografia.extrabold, color: colores.texto },
  texto: {
    fontSize: 13,
    fontFamily: tipografia.regular,
    color: colores.textoTenue,
    textAlign: 'center',
    lineHeight: 19,
  },
  error: {
    fontSize: 12,
    fontFamily: tipografia.semibold,
    color: colores.rojo,
    textAlign: 'center',
    marginTop: espaciado.s,
  },
  diagnostico: {
    fontSize: 10,
    fontFamily: tipografia.regular,
    color: colores.textoMuted,
    textAlign: 'center',
    marginTop: espaciado.m,
  },
});
