import { z } from "zod";
import { UserRole, TrainerSpecialty } from "@prisma/client";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  surname: z.string().min(1, "Surname is required"),
  email: z.string().email("Invalid email address"),
  role: z.nativeEnum(UserRole),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  password: z.string().optional(),
  trainerSpecialty: z.union([z.nativeEnum(TrainerSpecialty), z.literal(""), z.null()]).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  surname: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
  phone: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
  trainerSpecialty: z.union([z.nativeEnum(TrainerSpecialty), z.literal(""), z.null()]).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  surname: z.string().min(1, "Surname is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
});
