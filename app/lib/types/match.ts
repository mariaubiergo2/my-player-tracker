export interface SimpleMatch {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  mark: number | null;
  updatedAt: string;
  createdAt: string;
  isReviewed: boolean;
}

export interface CompleteMatch {
  id: string
  name: string
  description?: string | null
  location?: string | null
  opponent?: string | null
  matchType?: string | null
  status: string
  date: Date
  startTime?: string | null
  endTime?: string | null
  playerId: string
  trainerId: string
  teamId?: string | null
  mark?: number | null
  intensity?: number | null
  attitude?: number | null
  performance?: number | null
  goals?: number | null
  assists?: number | null
  minutesPlayed?: number | null
  comment?: string | null
  trainerFeedback?: string | null
  playerReflection?: string | null
  strengths?: string[]
  weaknesses?: string[]
  improvementAreas?: string[]
  isReviewed?: boolean | null
  reviewedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}