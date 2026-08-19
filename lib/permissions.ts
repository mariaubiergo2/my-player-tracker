import { UserRole } from "@prisma/client";

export const PLAYER_EDITABLE_FIELDS = [
  "name",
  "description",
  "location",
  "isHome",
  "matchUrl",
  "kitColor",
  "shirtNumber",
  "position",
  "minutesPlayed",
  "date",
  "startTime",
  "endTime",
  "opponent",
  "category",
  "leaguePosition",
  "matchType",
  "competitionType",
  "playerReflection",
  "goals",
  "assists",
];

export const TRAINER_EDITABLE_FIELDS = [
  "comment",
  "trainerFeedback",
  "mark",
  "intensity",
  "attitude",
  "performance",
  "offensiveActionsOwnHalf",
  "offensiveActionsOpponentHalf",
  "defensiveActionsOwnHalf",
  "defensiveActionsOpponentHalf",
  "strengths",
  "weaknesses",
  "improvementAreas",
  "isReviewed",
  "reviewedAt",
];

export function canEditMatchField(role: UserRole | string | undefined, field: string): boolean {
  if (!role) return false;
  const roleUpper = role.toUpperCase();

  if (roleUpper === "ADMIN") {
    // Admin can edit everything except system fields
    return PLAYER_EDITABLE_FIELDS.includes(field) || TRAINER_EDITABLE_FIELDS.includes(field);
  }

  if (roleUpper === "TRAINER") {
    return TRAINER_EDITABLE_FIELDS.includes(field);
  }

  if (roleUpper === "PLAYER" || roleUpper === "GOAL_KEEPER") {
    return PLAYER_EDITABLE_FIELDS.includes(field);
  }

  return false;
}

export function canManageExercise(
  role: string | undefined,
  currentUserUserId: string,
  exerciseTrainerId: string
): boolean {
  if (!role) return false;
  const roleUpper = role.toUpperCase();
  return roleUpper === "ADMIN" || currentUserUserId === exerciseTrainerId;
}

export function canManageTrainingPlan(
  role: string | undefined,
  currentUserUserId: string,
  planTrainerId: string
): boolean {
  if (!role) return false;
  const roleUpper = role.toUpperCase();
  return roleUpper === "ADMIN" || currentUserUserId === planTrainerId;
}

export function canViewTrainingPlan(
  role: string | undefined,
  currentUserUserId: string,
  planTrainerId: string,
  assignedPlayerIds: string[]
): boolean {
  if (!role) return false;
  const roleUpper = role.toUpperCase();
  if (roleUpper === "ADMIN" || currentUserUserId === planTrainerId) return true;
  return assignedPlayerIds.includes(currentUserUserId);
}

export function canModifySessionCompletion(
  role: string | undefined,
  currentUserUserId: string,
  targetPlayerId: string
): boolean {
  if (!role) return false;
  const roleUpper = role.toUpperCase();
  return roleUpper === "ADMIN" || currentUserUserId === targetPlayerId;
}

export function canSubmitTrainingFeedback(
  role: string | undefined,
  currentUserUserId: string,
  targetPlayerId: string
): boolean {
  if (!role) return false;
  const roleUpper = role.toUpperCase();
  return roleUpper === "ADMIN" || currentUserUserId === targetPlayerId;
}

