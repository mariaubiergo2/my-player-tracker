export interface DemoObjective {
  id: string;
  playerKey: string;
  trainerKey: string;
  summary: string;
  items: string[];
  effectiveFrom: Date;
  effectiveTo: Date | null;
  createdAt: Date;
}

export const DEMO_OBJECTIVES: DemoObjective[] = [
  // --- Old Objective (Closed) ---
  {
    id: "seed-obj-player-old",
    playerKey: "player",
    trainerKey: "trainer",
    summary: "Objetivos de Pretemporada",
    items: [
      "Mejorar la resistencia cardiovascular (bajar de 12 min en los 3km)",
      "Ganar 1.5kg de masa muscular magra mediante dieta e hipertrofia",
      "Perfeccionar el golpeo y orientación con la pierna no dominante (izquierda)"
    ],
    effectiveFrom: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
    effectiveTo: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
  },

  // --- Current Objective (Active) ---
  {
    id: "seed-obj-player-current",
    playerKey: "player",
    trainerKey: "trainer",
    summary: "Objetivos de Primera Vuelta de Liga",
    items: [
      "Alcanzar un porcentaje de acierto de pase global superior al 85%",
      "Contribuir con al menos 5 asistencias de gol en los próximos 10 partidos oficiales",
      "Mantener de forma estricta la rutina de prevención de lesiones (aductores) dos veces por semana"
    ],
    effectiveFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
    effectiveTo: null, // null means it's active
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
];
