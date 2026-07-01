-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "defensive_actions_opponent_half" TEXT,
ADD COLUMN     "defensive_actions_own_half" TEXT,
ADD COLUMN     "offensive_actions_opponent_half" TEXT,
ADD COLUMN     "offensive_actions_own_half" TEXT;
