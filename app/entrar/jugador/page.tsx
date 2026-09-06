"use client";

import DoorAuthPortal from "@/components/auth/DoorAuthPortal";

/**
 * Puerta de acceso: Jugador (Masculino)
 * - Registro: Rol fijo PLAYER, Sexo fijo MALE (sin selector)
 * - Login: Requiere rol PLAYER y sexo MALE (o sin definir)
 */
export default function EntrarJugadorPage() {
  return <DoorAuthPortal door="jugador" />;
}
