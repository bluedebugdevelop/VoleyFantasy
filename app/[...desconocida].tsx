import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Ruta comodín: cualquier URL que no exista (p. ej. el arranque de la app
 * nativa con "voleyfantasy:///") redirige a la puerta de entrada en lugar de
 * mostrar "Unmatched Route".
 */
export default function RutaDesconocida() {
  return <Redirect href="/" />;
}
