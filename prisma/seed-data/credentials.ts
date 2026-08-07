import { UserRole } from "@prisma/client";
import "dotenv/config";

export interface SeedUser {
  id: string;
  key: string;
  role: UserRole;
  email: string;
  password?: string;
  name: string;
  surname: string;
  phone?: string;
  trainerKeys?: string[];
}

export const SEED_USERS: SeedUser[] = [
  {
    id: "seed-admin-id",
    key: "admin",
    role: UserRole.ADMIN,
    email: process.env.SEED_ADMIN_EMAIL || "admin@tracker.com",
    password: process.env.SEED_ADMIN_PASSWORD || "adminpassword",
    name: "Admin",
    surname: "User",
  },
  {
    id: "seed-trainer-id",
    key: "trainer",
    role: UserRole.TRAINER,
    email: process.env.SEED_TRAINER_EMAIL || "trainer@tracker.com",
    password: process.env.SEED_TRAINER_PASSWORD || "trainerpassword",
    name: "Trainer",
    surname: "User",
    phone: "+34 600 000 001",
  },
  {
    id: "seed-player-id",
    key: "player",
    role: UserRole.PLAYER,
    email: process.env.SEED_PLAYER_EMAIL || "player@tracker.com",
    password: process.env.SEED_PLAYER_PASSWORD || "playerpassword",
    name: "Player",
    surname: "User",
    phone: "+34 600 000 002",
    trainerKeys: ["trainer"],
  },
  {
    id: "seed-goalkeeper-id",
    key: "goalkeeper",
    role: UserRole.GOAL_KEEPER,
    email: process.env.SEED_GOAL_KEEPER_EMAIL || process.env.SEED_GOALKEEPER_EMAIL || "goalkeeper@tracker.com",
    password: process.env.SEED_GOAL_KEEPER_PASSWORD || process.env.SEED_GOALKEEPER_PASSWORD || "goalkeeperpassword",
    name: "Goal Keeper",
    surname: "User",
    phone: "+34 600 000 003",
    trainerKeys: ["trainer"],
  },
];
