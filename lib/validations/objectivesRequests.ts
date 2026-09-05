import { z } from "zod";

export const createObjectiveRequestSchema = z.object({
  reason: z.string()
    .min(5, "El motiu ha de tenir almenys 5 caràcters")
    .max(500, "El motiu no pot superar els 500 caràcters"),
  type: z.enum(["ANALYSIS_VIDEO", "PHYSICAL", "NUTRITION"]),
});

export const replyObjectiveRequestSchema = z.object({
  requestId: z.string().min(1, "Invalid request ID"),
  quickResponseType: z.enum([
    "LOOKING_INTO_IT",
    "WORKING_ON_IT",
    "WILL_DISCUSS_NEXT_SESSION",
    "NEW_OBJECTIVES_COMING"
  ]),
});

