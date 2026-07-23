// MATCHES.ts

export type MatchType = "friendly" | "league" | "cup" | "training";

export interface Match {
  id: string;
  // --- Información general ---
  name: string;
  description?: string;
  location?: string;
  isHome?: boolean;              // Casa/Fuera
  // --- Ficha técnica del jugador en el partido ---
  matchUrl?: string;             // URLPARTIDO
  kitColor?: string;             // Vestimenta (color camiseta, etc.)
  shirtNumber?: string;          // Número dorsal
  position?: string;             // Posición/es
  minutesPlayed?: string;
  // --- Fecha y horario ---
  date: string;
  startTime?: string;
  endTime?: string;
  // --- Competición ---
  opponent?: string;
  category?: string;             // Categoría
  leaguePosition?: string;       // Posición en la liga
  matchType?: MatchType;         // Amistoso/Liga/Entrenamiento
  competitionType?: string;
  // --- Relaciones ---
  playerId: string;
  trainerId?: string | null;
  teamId?: string;
  // --- Feedback y evaluación ---
  comment?: string;
  trainerFeedback?: string;
  playerReflection?: string;
  mark?: number;
  intensity?: number;
  attitude?: number;
  performance?: number;
  // --- Estadísticas ---
  goals?: number;
  assists?: number;
  // --- Acciones tácticas ---
  offensiveActionsOwnHalf?: string;
  offensiveActionsOpponentHalf?: string;
  defensiveActionsOwnHalf?: string;
  defensiveActionsOpponentHalf?: string;
  // --- Análisis cualitativo ---
  strengths?: string[];
  weaknesses?: string[];
  improvementAreas?: string[];
  // --- Revisión ---
  isReviewed: boolean;
  reviewedAt?: string;
  // --- Timestamps ---
  createdAt: string;
  updatedAt: string;
}

export let MATCHES: Match[] = [
  {
    id: "1",
    name: "League Match vs Barcelona U18",
    description: "Regular league match with post-match player evaluation.",
    location: "Camp Municipal de Futbol",
    isHome: true,

    matchUrl: "https://www.youtube.com/watch?v=mock1",
    kitColor: "Red/White",
    shirtNumber: "9",
    position: "Forward",
    minutesPlayed: "90",

    date: "2026-05-30",
    startTime: "18:00",
    endTime: "19:45",

    opponent: "Barcelona U18",
    category: "Juvenil A",
    leaguePosition: "3rd",
    matchType: "league",
    competitionType: "Division de Honor",

    playerId: "player_001",
    trainerId: "trainer_001",
    teamId: "team_001",

    comment: "",
    trainerFeedback: "",
    playerReflection: "",

    mark: undefined,
    intensity: undefined,
    attitude: undefined,
    performance: undefined,

    goals: 0,
    assists: 0,

    strengths: [],
    weaknesses: [],
    improvementAreas: [],

    isReviewed: false,

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, {
    id: "2",
    name: "Friendly Match vs Girona U18",
    description: "Friendly match focused on tactical positioning and decision-making.",
    location: "Girona Training Ground",
    isHome: false,

    matchUrl: "https://www.youtube.com/watch?v=mock2",
    kitColor: "Blue",
    shirtNumber: "11",
    position: "Left Winger",
    minutesPlayed: "75",

    date: "2026-06-06",
    startTime: "17:30",
    endTime: "19:00",

    opponent: "Girona U18",
    category: "Juvenil A",
    leaguePosition: "3rd",
    matchType: "friendly",
    competitionType: "Friendly",

    playerId: "player_001",
    trainerId: "trainer_001",
    teamId: "team_001",

    comment: "Good effort and communication throughout the match.",
    trainerFeedback:
        "Strong defensive positioning and good intensity. Needs to improve first-touch decisions under pressure.",
    playerReflection:
        "I felt confident physically, but I need to scan more before receiving the ball.",

    mark: 8,
    intensity: 9,
    attitude: 8,
    performance: 7,

    goals: 1,
    assists: 0,

    strengths: ["Intensity", "Communication", "Defensive positioning"],
    weaknesses: ["First touch under pressure", "Scanning before receiving"],
    improvementAreas: ["Decision-making", "Ball control", "Awareness"],

    isReviewed: true,
    reviewedAt: "2026-06-06T20:15:00.000Z",

    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-06-06T20:15:00.000Z",
}
];

export async function addMatch(match: Match){
    await new Promise((resolve) => setTimeout(resolve, 3000));
    MATCHES = [...MATCHES, match];
    console.log('Matches updated: ', MATCHES);
    return getMatches()
}

export async function getMatches(){
  return [...MATCHES];
}

export function getMatchById(matchId: string){
  return MATCHES.find((match) => match.id === matchId);
}