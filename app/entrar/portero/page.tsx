"use client";

import DoorAuthPortal from "@/components/auth/DoorAuthPortal";

/**
 * Puerta de acceso: Portero / Portera
 * - Registro: Rol fijo GOAL_KEEPER, pide Sexo con selector normal
 * - Login: Requiere rol GOAL_KEEPER (cualquier sexo)
 */
export default function EntrarPorteroPage() {
  return <DoorAuthPortal door="portero" />;
}
