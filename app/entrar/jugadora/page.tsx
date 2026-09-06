"use client";

import DoorAuthPortal from "@/components/auth/DoorAuthPortal";

/**
 * Puerta de acceso: Jugadora (Femenino)
 * - Registro: Rol fijo PLAYER, Sexo fijo FEMALE (sin selector)
 * - Login: Requiere rol PLAYER y sexo FEMALE
 */
export default function EntrarJugadoraPage() {
  return <DoorAuthPortal door="jugadora" />;
}
