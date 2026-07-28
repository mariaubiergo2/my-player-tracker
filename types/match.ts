export type MatchType = "friendly" | "league" | "cup" | "training" | "FRIENDLY" | "LEAGUE" | "CUP" | "TRAINING";

export interface Match {
  id: string;
  // --- Información general ---
  name: string;
  description?: string | null;
  location?: string | null;
  isHome?: boolean | null;              // Casa/Fuera
  // --- Ficha técnica del jugador en el partido ---
  matchUrl?: string | null;             // URLPARTIDO
  kitColor?: string | null;             // Vestimenta (color camiseta, etc.)
  shirtNumber?: string | null;          // Número dorsal
  position?: string | null;             // Posición/es
  minutesPlayed?: string | null;
  // --- Fecha y horario ---
  date: string | Date;
  startTime?: string | null;
  endTime?: string | null;
  // --- Competición ---
  opponent?: string | null;
  category?: string | null;             // Categoría
  leaguePosition?: string | null;       // Posición en la liga
  matchType?: MatchType | null;         // Amistoso/Liga/Entrenamiento
  competitionType?: string | null;
  // --- Relaciones ---
  playerId: string;
  trainerId?: string | null;
  teamId?: string | null;
  // --- Feedback y evaluación ---
  comment?: string | null;
  trainerFeedback?: string | null;
  playerReflection?: string | null;
  mark?: number | null;
  intensity?: number | null;
  attitude?: number | null;
  performance?: number | null;
  // --- Estadísticas ---
  goals?: number | null;
  assists?: number | null;
  // --- Acciones tácticas ---
  offensiveActionsOwnHalf?: string | null;
  offensiveActionsOpponentHalf?: string | null;
  defensiveActionsOwnHalf?: string | null;
  defensiveActionsOpponentHalf?: string | null;
  // --- Análisis cualitativo ---
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  improvementAreas?: string[] | null;
  // --- Revisión ---
  isReviewed: boolean;
  reviewedAt?: string | Date | null;
  // --- Timestamps ---
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: {
    feedbackMessages: number;
  } | null;
}

export interface SimpleMatch {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  mark?: number | null;
  updatedAt: string | Date;
  createdAt: string | Date;
  isReviewed: boolean;
}

export interface CompleteMatch extends Match {
  video?: VideoType | null;
}

export interface VideoType {
  id: string;
  matchId: string;
  muxAssetId?: string | null;
  muxPlaybackId?: string | null;
  muxUploadId?: string | null;
  status: string;
  duration?: number | null;
  title?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}