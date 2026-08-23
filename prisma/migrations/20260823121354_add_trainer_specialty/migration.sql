-- CreateEnum
CREATE TYPE "TrainerSpecialty" AS ENUM ('VIDEO_ANALYSIS', 'PHYSICAL_PREP', 'NUTRITION');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "trainer_specialty" "TrainerSpecialty";
