import { z } from "zod";

export const createObjectivesRequestSchema = z.object({
  trainerId: z.string().min(1, "Invalid trainer ID"),
  reason: z.string()
    .min(5, "El motiu ha de tenir almenys 5 caràcters")
    .max(500, "El motiu no pot superar els 500 caràcters"),
});

export const replyObjectivesRequestSchema = z.object({
  requestId: z.string().min(1, "Invalid request ID"),
  reply: z.string()
    .min(1, "La resposta no pot estar buida")
    .max(120, "La resposta no pot superar els 120 caràcters"),
});
