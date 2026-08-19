import { QuestionnaireStatus, QuestionType, AssignmentStatus } from "@prisma/client";

export interface DemoQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  order: number;
}

export interface DemoQuestionnaire {
  id: string;
  title: string;
  description?: string | null;
  status: QuestionnaireStatus;
  trainerKey: string;
  questions: DemoQuestion[];
}

export interface DemoAssignment {
  id: string;
  questionnaireId: string;
  playerKey: string;
  status: AssignmentStatus;
  sentAt: Date;
  reclaimedAt?: Date | null;
  respondedAt?: Date | null;
}

export interface DemoAnswer {
  id: string;
  assignmentId: string;
  questionId: string;
  value: string;
}

export const DEMO_QUESTIONNAIRES: DemoQuestionnaire[] = [
  {
    id: "seed-q-draft",
    title: "Evaluación de Carga Semanal - Borrador",
    description: "Borrador interno para evaluar la carga física del microciclo.",
    status: QuestionnaireStatus.DRAFT,
    trainerKey: "trainer",
    questions: [
      {
        id: "seed-q-draft-q1",
        text: "¿Cuál es tu nivel de fatiga general?",
        type: QuestionType.MULTIPLE_CHOICE,
        options: ["Muy bajo", "Bajo", "Moderado", "Alto", "Muy alto"],
        order: 1,
      },
      {
        id: "seed-q-draft-q2",
        text: "Describe cualquier molestia física",
        type: QuestionType.OPEN,
        options: [],
        order: 2,
      },
    ],
  },
  {
    id: "seed-q-defined",
    title: "Test de Recuperación Post-Partido",
    description: "Estudio del estado de recuperación muscular y de sueño tras el esfuerzo competitivo.",
    status: QuestionnaireStatus.DEFINED,
    trainerKey: "trainer",
    questions: [
      {
        id: "seed-q-defined-q1",
        text: "¿Cómo calificarías la calidad de tu sueño anoche?",
        type: QuestionType.MULTIPLE_CHOICE,
        options: ["Mala", "Regular", "Buena", "Excelente"],
        order: 1,
      },
      {
        id: "seed-q-defined-q2",
        text: "¿Sientes dolor muscular localizado?",
        type: QuestionType.MULTIPLE_CHOICE,
        options: ["No", "Leve", "Moderado", "Severo"],
        order: 2,
      },
      {
        id: "seed-q-defined-q3",
        text: "Comentarios adicionales sobre tu estado físico",
        type: QuestionType.OPEN,
        options: [],
        order: 3,
      },
    ],
  },
  {
    id: "seed-q-send",
    title: "Bienestar Diario y Nutrición",
    description: "Control diario de hidratación, alimentación y predisposición mental al entrenamiento.",
    status: QuestionnaireStatus.SEND,
    trainerKey: "trainer",
    questions: [
      {
        id: "seed-q-send-q1",
        text: "¿Has desayunado adecuadamente hoy?",
        type: QuestionType.MULTIPLE_CHOICE,
        options: ["Sí, completo", "Algo ligero", "No he desayunado"],
        order: 1,
      },
      {
        id: "seed-q-send-q2",
        text: "Nivel de energía percibido",
        type: QuestionType.MULTIPLE_CHOICE,
        options: ["Bajo", "Medio", "Alto"],
        order: 2,
      },
      {
        id: "seed-q-send-q3",
        text: "Detalla tu hidratación durante el día",
        type: QuestionType.OPEN,
        options: [],
        order: 3,
      },
    ],
  },
];

export const DEMO_ASSIGNMENTS: DemoAssignment[] = [
  {
    id: "seed-qa-send-player",
    questionnaireId: "seed-q-send",
    playerKey: "player",
    status: AssignmentStatus.COMPLETED,
    sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    reclaimedAt: null,
    respondedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 day ago + 1hr
  },
  {
    id: "seed-qa-send-goalkeeper",
    questionnaireId: "seed-q-send",
    playerKey: "goalkeeper",
    status: AssignmentStatus.SENT,
    sentAt: new Date(),
    reclaimedAt: null,
    respondedAt: null,
  },
  {
    id: "seed-qa-send-player3",
    questionnaireId: "seed-q-send",
    playerKey: "player-3",
    status: AssignmentStatus.RECLAIMED,
    sentAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    reclaimedAt: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
    respondedAt: null,
  },
  {
    id: "seed-qa-send-player5",
    questionnaireId: "seed-q-send",
    playerKey: "player-5",
    status: AssignmentStatus.COMPLETED,
    sentAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    reclaimedAt: null,
    respondedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
  },
];

export const DEMO_ANSWERS: DemoAnswer[] = [
  // Answers for seed-qa-send-player (main player)
  {
    id: "seed-ans-send-player-q1",
    assignmentId: "seed-qa-send-player",
    questionId: "seed-q-send-q1",
    value: "Sí, completo",
  },
  {
    id: "seed-ans-send-player-q2",
    assignmentId: "seed-qa-send-player",
    questionId: "seed-q-send-q2",
    value: "Alto",
  },
  {
    id: "seed-ans-send-player-q3",
    assignmentId: "seed-qa-send-player",
    questionId: "seed-q-send-q3",
    value: "He bebido unos 2.5 litros de agua, incluyendo un bidón de isotónico en el entrenamiento.",
  },

  // Answers for seed-qa-send-player5 (Andrés Iniesta)
  {
    id: "seed-ans-send-player5-q1",
    assignmentId: "seed-qa-send-player5",
    questionId: "seed-q-send-q1",
    value: "Algo ligero",
  },
  {
    id: "seed-ans-send-player5-q2",
    assignmentId: "seed-qa-send-player5",
    questionId: "seed-q-send-q2",
    value: "Medio",
  },
  {
    id: "seed-ans-send-player5-q3",
    assignmentId: "seed-qa-send-player5",
    questionId: "seed-q-send-q3",
    value: "Un litro y medio de agua antes de entrenar.",
  },
];
