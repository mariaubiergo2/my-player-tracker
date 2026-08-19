import { UserRole } from "@prisma/client";

export interface AdditionalSeedUser {
  id: string;
  key: string;
  role: UserRole;
  email: string;
  name: string;
  surname: string;
  phone?: string;
  trainerKeys?: string[];
}

export const ADDITIONAL_USERS: AdditionalSeedUser[] = [
  // Trainers
  {
    id: "seed-trainer-2-id",
    key: "trainer-2",
    role: UserRole.TRAINER,
    email: "carlos.rodriguez@tracker.com",
    name: "Carlos",
    surname: "Rodríguez",
    phone: "+34 600 000 011",
  },
  {
    id: "seed-trainer-3-id",
    key: "trainer-3",
    role: UserRole.TRAINER,
    email: "ana.gomez@tracker.com",
    name: "Ana",
    surname: "Gómez",
    phone: "+34 600 000 012",
  },
  // Players / Goalkeepers
  {
    id: "seed-player-2-id",
    key: "player-2",
    role: UserRole.GOAL_KEEPER,
    email: "roberto.gk@tracker.com",
    name: "Roberto",
    surname: "Fernández",
    phone: "+34 600 000 013",
    trainerKeys: ["trainer-2"], // Assigned to Carlos Rodríguez
  },
  {
    id: "seed-player-3-id",
    key: "player-3",
    role: UserRole.PLAYER,
    email: "david.villa@tracker.com",
    name: "David",
    surname: "Villa",
    phone: "+34 600 000 014",
    trainerKeys: ["trainer"], // Assigned to main Trainer
  },
  {
    id: "seed-player-4-id",
    key: "player-4",
    role: UserRole.PLAYER,
    email: "sergio.ramos@tracker.com",
    name: "Sergio",
    surname: "Ramos",
    phone: "+34 600 000 015",
    trainerKeys: ["trainer"], // Assigned to main Trainer
  },
  {
    id: "seed-player-5-id",
    key: "player-5",
    role: UserRole.PLAYER,
    email: "andres.iniesta@tracker.com",
    name: "Andrés",
    surname: "Iniesta",
    phone: "+34 600 000 016",
    trainerKeys: ["trainer-2"], // Assigned to Carlos Rodríguez
  },
  {
    id: "seed-player-6-id",
    key: "player-6",
    role: UserRole.PLAYER,
    email: "lucas.pato@tracker.com",
    name: "Lucas",
    surname: "Pato",
    phone: "+34 600 000 017",
    trainerKeys: ["trainer-2"], // Assigned to Carlos Rodríguez
  },
  {
    id: "seed-player-7-id",
    key: "player-7",
    role: UserRole.PLAYER,
    email: "marco.polo@tracker.com",
    name: "Marco",
    surname: "Polo",
    phone: "+34 600 000 018",
    trainerKeys: ["trainer-3"], // Assigned to Ana Gómez
  },
];
