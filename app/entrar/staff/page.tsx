"use client";

import DoorAuthPortal from "@/components/auth/DoorAuthPortal";

/**
 * Puerta de acceso: Staff Técnico / Entrenadores
 * - Registro: Rol fijo TRAINER, pide Sexo con selector normal (specialty se mantiene como está asignada por admin)
 * - Login: Requiere rol TRAINER (cualquier sexo)
 */
export default function EntrarStaffPage() {
  return <DoorAuthPortal door="staff" />;
}
