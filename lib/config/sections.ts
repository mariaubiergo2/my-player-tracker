import { QuestionnaireType, TrainerSpecialty } from '@prisma/client';

export const SECTION_ENABLED: Record<QuestionnaireType, boolean> = {
  ANALYSIS_VIDEO: true,
  PHYSICAL: true,
  NUTRITION: false,
};

export function mapSpecialtyToSection(specialty: TrainerSpecialty | null | undefined): QuestionnaireType | null {
  if (!specialty) return null;
  if (specialty === TrainerSpecialty.VIDEO_ANALYSIS) return QuestionnaireType.ANALYSIS_VIDEO;
  if (specialty === TrainerSpecialty.PHYSICAL_PREP) return QuestionnaireType.PHYSICAL;
  if (specialty === TrainerSpecialty.NUTRITION) return QuestionnaireType.NUTRITION;
  return null;
}
