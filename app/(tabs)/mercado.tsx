import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TarjetaJugador from '@/components/TarjetaJugador';
import FondoDegradado from '@/components/FondoDegradado';
import SelectorModalidad from '@/components/SelectorModalidad';
import { useJuego } from '@/store/juego';
import { NOMBRE_POSICION, Posicion } from '@/types';
import { colores, espaciado, formatearValor, radios, tipografia } from '@/theme';

type Filtro = Posicion | 'todas';
type Orden = 'valor' | 'media' | 'nombre';

const FILTROS: Filtro[] = ['todas', 'colocador', 'opuesto', 'receptor', 'central', 'libero'];
const ORDENES: { clave: Orden; etiqueta: string }[] = [
  { clave: 'valor', etiqueta: 'Valor' },
  { clave: 'media', etiqueta: 'Media' },
  { clave: 'nombre', etiqueta: 'A-Z' },
];

export default function Mercado() {
  const modalidadActiva = useJuego((s) => s.modalidadActiva);
  const jugadoresDeModalidad = useJuego((s) => s.jugadoresDeModalidad);
  const equipoActivo = useJuego((s) => s.equipoActivo);
  const comprar = useJuego((s) => s.comprar);
  const vender = useJuego((s) => s.vender);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [orden, setOrden] = useState<Orden>('valor');

  const equipo = equipoActivo();
  const plantillaIds = equipo.plantillaIds;
  const presupuesto = equipo.presupuesto;

  const lista = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return jugadoresDeModalidad(modalidadActiva)
      .filter((j) => filtro === 'todas' || j.posicion === filtro)
      .filter((j) => !texto || j.nombre.toLowerCase().includes(texto) || j.equipo.toLowerCase().includes(texto))
      .sort((a, b) =>
        orden === 'valor' ? b.valor - a.valor : orden === 'media' ? b.media - a.media : a.nombre.localeCompare(b.nombre),
      );
  }, [jugadoresDeModalidad, modalidadActiva, busqueda, filtro, orden]);

  const alComprar = (id: string) => {
    const error = comprar(id);
    if (error) Alert.alert('No se pudo fichar', error);
  };

  return (
    <FondoDegradado>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={estilos.header}>
          <Text style={estilos.headerTitulo}>Mercado</Text>
          <View style={estilos.saldo}>
            <Ionicons name="wallet" size={14} color={colores.verde} />
            <Text style={estilos.saldoTexto}>{formatearValor(presupuesto)}</Text>
          </View>
        </View>

        <SelectorModalidad />

        <View style={[estilos.buscadorCaja, { marginTop: espaciado.s }]}>
          <Ionicons name="search" size={18} color={colores.textoSuave} />
          <TextInput
            style={estilos.buscador}
            placeholder="Buscar jugador o equipo…"
            placeholderTextColor={colores.textoTenue}
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <Pressable onPress={() => setBusqueda('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={colores.textoTenue} />
            </Pressable>
          )}
        </View>

        <FlatList
          horizontal
          data={FILTROS}
          keyExtractor={(f) => f}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.filtros}
          style={{ maxHeight: 44, flexGrow: 0 }}
          renderItem={({ item: f }) => (
            <Pressable style={[estilos.filtro, filtro === f && estilos.filtroActivo]} onPress={() => setFiltro(f)}>
              <Text style={[estilos.filtroTexto, filtro === f && estilos.filtroTextoActivo]}>
                {f === 'todas' ? 'Todas' : NOMBRE_POSICION[f]}
              </Text>
            </Pressable>
          )}
        />

        <View style={estilos.ordenFila}>
          <Text style={estilos.ordenEtiqueta}>Ordenar:</Text>
          {ORDENES.map((o) => (
            <Pressable key={o.clave} style={[estilos.ordenChip, orden === o.clave && estilos.ordenChipActivo]} onPress={() => setOrden(o.clave)}>
              <Text style={[estilos.ordenTexto, orden === o.clave && estilos.ordenTextoActivo]}>{o.etiqueta}</Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={lista}
          keyExtractor={(j) => j.id}
          contentContainerStyle={{ paddingHorizontal: espaciado.l, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const enPlantilla = plantillaIds.includes(item.id);
            return (
              <TarjetaJugador
                jugador={item}
                accion={
                  <Pressable
                    style={[estilos.accion, { backgroundColor: enPlantilla ? colores.rojoTenue : colores.verdeTenue }]}
                    onPress={() => (enPlantilla ? vender(item.id) : alComprar(item.id))}
                  >
                    <Ionicons
                      name={enPlantilla ? 'remove-circle' : 'add-circle'}
                      size={13}
                      color={enPlantilla ? colores.rojo : colores.verde}
                    />
                    <Text style={[estilos.accionTexto, { color: enPlantilla ? colores.rojo : colores.verde }]}>
                      {enPlantilla ? 'Vender' : 'Fichar'}
                    </Text>
                  </Pressable>
                }
              />
            );
          }}
        />
      </SafeAreaView>
    </FondoDegradado>
  );
}

const estilos = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: espaciado.l,
    paddingVertical: espaciado.m,
  },
  headerTitulo: { fontSize: 24, fontFamily: tipografia.extrabold, color: colores.texto },
  saldo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colores.verdeTenue,
    borderRadius: radios.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saldoTexto: { fontSize: 13, fontFamily: tipografia.bold, color: colores.verde },
  buscadorCaja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: espaciado.l,
    backgroundColor: colores.superficie,
    borderRadius: radios.m,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  buscador: { flex: 1, paddingVertical: 12, fontSize: 15, fontFamily: tipografia.medium, color: colores.texto },
  filtros: { paddingHorizontal: espaciado.l, paddingVertical: espaciado.m, gap: 8 },
  filtro: {
    borderRadius: radios.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  filtroActivo: { backgroundColor: colores.rojo, borderColor: colores.rojo },
  filtroTexto: { color: colores.textoSuave, fontSize: 13, fontFamily: tipografia.semibold },
  filtroTextoActivo: { color: colores.textoInverso },
  ordenFila: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: espaciado.l, marginBottom: espaciado.m },
  ordenEtiqueta: { fontSize: 12, fontFamily: tipografia.medium, color: colores.textoTenue },
  ordenChip: { borderRadius: radios.pill, paddingHorizontal: 12, paddingVertical: 4 },
  ordenChipActivo: { backgroundColor: colores.superficieClara },
  ordenTexto: { fontSize: 12, fontFamily: tipografia.semibold, color: colores.textoSuave },
  ordenTextoActivo: { color: colores.oro },
  accion: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radios.pill, paddingHorizontal: 10, paddingVertical: 4, marginTop: 2 },
  accionTexto: { fontFamily: tipografia.bold, fontSize: 12 },
});
