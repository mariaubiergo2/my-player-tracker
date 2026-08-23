-- AlterTable: player_objectives (unify category enum)
ALTER TABLE "player_objectives" ALTER COLUMN "category" DROP DEFAULT;

ALTER TABLE "player_objectives" ALTER COLUMN "category" TYPE "QuestionnaireType" USING (
  CASE "category"::text
    WHEN 'MATCH' THEN 'ANALYSIS_VIDEO'::"QuestionnaireType"
    WHEN 'PHYSICAL' THEN 'PHYSICAL'::"QuestionnaireType"
    ELSE 'ANALYSIS_VIDEO'::"QuestionnaireType"
  END
);

ALTER TABLE "player_objectives" ALTER COLUMN "category" SET DEFAULT 'ANALYSIS_VIDEO';

-- Drop enum type
DROP TYPE "ObjectiveCategory";

-- AlterTable: objectives_requests (add type column)
ALTER TABLE "objectives_requests" ADD COLUMN "type" "QuestionnaireType" NOT NULL DEFAULT 'ANALYSIS_VIDEO';
