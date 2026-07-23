-- AlterTable
ALTER TABLE "matches" ADD COLUMN "is_home" BOOLEAN;
ALTER TABLE "matches" ADD COLUMN "match_url" TEXT;
ALTER TABLE "matches" ADD COLUMN "kit_color" TEXT;
ALTER TABLE "matches" ADD COLUMN "shirt_number" TEXT;
ALTER TABLE "matches" ADD COLUMN "position" TEXT;
ALTER TABLE "matches" ADD COLUMN "category" TEXT;
ALTER TABLE "matches" ADD COLUMN "league_position" TEXT;
ALTER TABLE "matches" ADD COLUMN "competition_type" TEXT;

-- Convert minutes_played from Integer to String
ALTER TABLE "matches" ALTER COLUMN "minutes_played" TYPE VARCHAR(255) USING "minutes_played"::varchar;
ALTER TABLE "matches" ALTER COLUMN "minutes_played" DROP DEFAULT;
ALTER TABLE "matches" ALTER COLUMN "minutes_played" DROP NOT NULL;

-- Goals and Assists nullable
ALTER TABLE "matches" ALTER COLUMN "goals" DROP NOT NULL;
ALTER TABLE "matches" ALTER COLUMN "goals" DROP DEFAULT;
ALTER TABLE "matches" ALTER COLUMN "assists" DROP NOT NULL;
ALTER TABLE "matches" ALTER COLUMN "assists" DROP DEFAULT;

-- Drop status column
ALTER TABLE "matches" DROP COLUMN "status";

-- Drop enum MatchStatus
DROP TYPE "MatchStatus";
