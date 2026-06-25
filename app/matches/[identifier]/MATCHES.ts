// MATCHES.ts

export type MatchStatus = "scheduled" | "completed" | "cancelled";

export type MatchType = "friendly" | "league" | "cup" | "training";

export interface Match {
  id: string;

  name: string;
  description?: string;
  location?: string;

  date: string;
  startTime?: string;
  endTime?: string;

  opponent?: string;
  matchType?: MatchType;
  status: MatchStatus;

  playerId: string;
  trainerId?: string | null;
  teamId?: string;

  comment?: string;
  trainerFeedback?: string;
  playerReflection?: string;

  mark?: number;
  intensity?: number;
  attitude?: number;
  performance?: number;

  goals?: number;
  assists?: number;
  minutesPlayed?: number;

  strengths?: string[];
  weaknesses?: string[];
  improvementAreas?: string[];

  isReviewed: boolean;
  reviewedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export let MATCHES: Match[] = [
  {
    id: "1",
    name: "League Match vs Barcelona U18",
    description: "Regular league match with post-match player evaluation.",
    location: "Camp Municipal de Futbol",

    date: "2026-05-30",
    startTime: "18:00",
    endTime: "19:45",

    opponent: "Barcelona U18",
    matchType: "league",
    status: "scheduled",

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
    minutesPlayed: 0,

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

    date: "2026-06-06",
    startTime: "17:30",
    endTime: "19:00",

    opponent: "Girona U18",
    matchType: "friendly",
    status: "completed",

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
    minutesPlayed: 75,

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
  // await new Promise((resolve) => setTimeout(resolve, 3000));
  return [...MATCHES];
}

export function getMatchById(matchId: string){
  return MATCHES.find((match) => match.id === matchId);
}