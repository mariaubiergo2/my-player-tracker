"use server"

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken, hashPassword, verifyPassword, generateToken } from "@/lib/auth";
import { UserRole, Prisma } from "@prisma/client";
import { createUserSchema, updateUserSchema, updateProfileSchema } from "@/lib/validations/users";
import { updateTrainerPlayersRelationShared } from "./trainer";
import { mapSpecialtyToSection } from "@/lib/config/sections";


/**
 * Checks if the current request is initiated by a verified Admin user
 */
async function checkAdmin(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) {
    throw new Error("Unauthenticated: No active session found.");
  }

  const payload = await verifyToken(token);
  if (!payload) {
    throw new Error("Unauthorized: Invalid session token.");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { role: true },
  });

  if (!dbUser || dbUser.role !== UserRole.ADMIN) {
    throw new Error("Forbidden: This action requires Administrator privileges.");
  }

  return payload.userId;
}

/**
 * READ: Fetch all users
 */
export async function getUsers() {
  try {
    await checkAdmin();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        phone: true,
        birthDate: true,
        avatarUrl: true,
        createdAt: true,
        trainerSpecialty: true,
      },
    });
    return { success: true, users };
  } catch (error) {
    console.error("getUsers error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load users",
    };
  }
}

/**
 * CREATE: Add a new user
 */
export async function createUser(data: {
  name: string;
  surname: string;
  email: string;
  role: UserRole;
  phone?: string;
  birthDate?: string;
  password?: string;
}) {
  try {
    await checkAdmin();

    const validation = createUserSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: "Please fill in all required fields correctly." };
    }
    const validatedData = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase().trim() },
    });

    if (existingUser) {
      return { success: false, error: "A user with this email already exists." };
    }

    const rawPassword = validatedData.password || "tracker123";
    const hashedPassword = await hashPassword(rawPassword);

    const newUser = await prisma.user.create({
      data: {
        name: validatedData.name.trim(),
        surname: validatedData.surname.trim(),
        email: validatedData.email.toLowerCase().trim(),
        password: hashedPassword,
        role: validatedData.role,
        phone: validatedData.phone?.trim() || null,
        birthDate: validatedData.birthDate ? new Date(validatedData.birthDate) : null,
        trainerSpecialty: (validatedData.trainerSpecialty === "" || validatedData.trainerSpecialty === null)
          ? null
          : validatedData.trainerSpecialty,
      },
    });

    revalidatePath("/admin/users");
    return { success: true, user: newUser };
  } catch (error) {
    console.error("createUser error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create user",
    };
  }
}

/**
 * UPDATE: Edit existing user details
 */
export async function updateUser(
  id: string,
  updates: {
    name?: string;
    surname?: string;
    email?: string;
    role?: UserRole;
    phone?: string;
    birthDate?: string;
    trainerSpecialty?: string | null;
  }
) {
  try {
    await checkAdmin();

    const validation = updateUserSchema.safeParse(updates);
    if (!validation.success) {
      return { success: false, error: "Invalid updates payload." };
    }
    const validatedUpdates = validation.data;

    const data: Prisma.UserUpdateInput = {};
    if (validatedUpdates.name !== undefined) data.name = validatedUpdates.name.trim();
    if (validatedUpdates.surname !== undefined) data.surname = validatedUpdates.surname.trim();
    
    if (validatedUpdates.email !== undefined) {
      const emailLower = validatedUpdates.email.toLowerCase().trim();
      const collision = await prisma.user.findFirst({
        where: { email: emailLower, NOT: { id } },
      });
      if (collision) {
        return { success: false, error: "This email address is already in use." };
      }
      data.email = emailLower;
    }

    if (validatedUpdates.role !== undefined) data.role = validatedUpdates.role;
    if (validatedUpdates.phone !== undefined) data.phone = validatedUpdates.phone?.trim() || null;
    
    if (validatedUpdates.birthDate !== undefined) {
      data.birthDate = validatedUpdates.birthDate ? new Date(validatedUpdates.birthDate) : null;
    }

    if (validatedUpdates.trainerSpecialty !== undefined) {
      data.trainerSpecialty = (validatedUpdates.trainerSpecialty === "" || validatedUpdates.trainerSpecialty === null)
        ? null
        : validatedUpdates.trainerSpecialty as any;
    }

    // Capture the old user info to check for specialty modification on trainers
    const oldTrainer = await prisma.user.findUnique({
      where: { id },
      select: { role: true, trainerSpecialty: true }
    });

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });

    // Notify trainer about existing pending requests if role is TRAINER and trainerSpecialty changed to a non-null value
    if (
      oldTrainer?.role === "TRAINER" &&
      validatedUpdates.trainerSpecialty !== undefined &&
      validatedUpdates.trainerSpecialty !== oldTrainer.trainerSpecialty
    ) {
      const newSpecialty = (validatedUpdates.trainerSpecialty === "" || validatedUpdates.trainerSpecialty === null)
        ? null
        : validatedUpdates.trainerSpecialty;
      
      if (newSpecialty) {
        // Map specialty to category
        const category = mapSpecialtyToSection(newSpecialty as any);
        if (category) {
          // Find players currently connected to this trainer
          const connectedPlayers = await prisma.user.findMany({
            where: {
              trainers: {
                some: { id }
              }
            },
            select: { id: true }
          });
          const playerIds = connectedPlayers.map(p => p.id);

          if (playerIds.length > 0) {
            // Find pending requests of this category for these players
            const pendingRequests = await prisma.objectiveRequest.findMany({
              where: {
                playerId: { in: playerIds },
                type: category,
                reviewed: false,
                responses: {
                  none: {}
                }
              },
              select: { id: true }
            });

            for (const req of pendingRequests) {
              const existingNotif = await prisma.notification.findFirst({
                where: {
                  recipientId: id,
                  type: "OBJECTIVES_REQUEST_CREATED",
                  objectiveRequestId: req.id
                }
              });
              if (!existingNotif) {
                await prisma.notification.create({
                  data: {
                    recipientId: id,
                    type: "OBJECTIVES_REQUEST_CREATED",
                    objectiveRequestId: req.id
                  }
                });
              }
            }
          }
        }
      }
    }

    revalidatePath("/admin/users");
    revalidatePath("/dashboard"); // Revalidate dashboard since roles of players/trainers changed
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("updateUser error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user",
    };
  }
}

/**
 * DELETE: Delete a user (cascade deletes matches)
 */
export async function deleteUser(id: string) {
  try {
    const currentAdminId = await checkAdmin();

    if (id === currentAdminId) {
      return { success: false, error: "You cannot delete your own admin account." };
    }

    await prisma.user.delete({
      where: { id },
    });

    revalidatePath("/admin/users");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("deleteUser error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}

/**
 * GET PROFILE: Fetch details of the current logged-in user
 */
export async function getProfile() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return { success: false, error: "Unauthenticated: Please log in." };
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return { success: false, error: "Unauthorized: Invalid session token." };
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        phone: true,
        birthDate: true,
        avatarUrl: true,
        trainerSpecialty: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    return {
      success: true,
      user: {
        ...user,
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split("T")[0] : null,
      },
    };
  } catch (error) {
    console.error("getProfile error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load profile",
    };
  }
}

/**
 * UPDATE PROFILE: Edit current logged-in user details (Player or Trainer or Admin)
 */
export async function updateProfile(updates: {
  name: string;
  surname: string;
  email: string;
  phone?: string | null;
  birthDate?: string | null;
  avatarUrl?: string | null;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}) {
  try {
    const validation = updateProfileSchema.safeParse(updates);
    if (!validation.success) {
      return { success: false, error: "Please fill in all required fields correctly." };
    }
    const validatedUpdates = validation.data;

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return { success: false, error: "Unauthenticated: Please log in." };
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return { success: false, error: "Unauthorized: Invalid session token." };
    }

    const userId = payload.userId;

    const nameTrimmed = validatedUpdates.name?.trim();
    const surnameTrimmed = validatedUpdates.surname?.trim();
    const emailTrimmed = validatedUpdates.email?.toLowerCase().trim();

    // Validate base inputs
    if (!nameTrimmed || !surnameTrimmed || !emailTrimmed) {
      return { success: false, error: "First name, surname, and email are required fields." };
    }

    // Check email collision
    const collision = await prisma.user.findFirst({
      where: { email: emailTrimmed, NOT: { id: userId } },
    });
    if (collision) {
      return { success: false, error: "This email address is already in use by another account." };
    }

    // Phone validation: must have code starting with + and correct digits
    if (validatedUpdates.phone) {
      const cleanedPhone = validatedUpdates.phone.replace(/[-.\s()]/g, "");
      if (!/^\+[1-9]\d{6,14}$/.test(cleanedPhone)) {
        return { success: false, error: "Please enter a valid phone number including country code (e.g. +34 600 000 000)." };
      }
    }

    // Birth date validation: well written, valid date, not in the future, not before 1900
    if (validatedUpdates.birthDate) {
      const birthDateObj = new Date(validatedUpdates.birthDate);
      if (isNaN(birthDateObj.getTime())) {
        return { success: false, error: "Please enter a valid date of birth." };
      }
      const now = new Date();
      if (birthDateObj > now) {
        return { success: false, error: "Date of birth cannot be in the future." };
      }
      const minDate = new Date("1900-01-01");
      if (birthDateObj < minDate) {
        return { success: false, error: "Date of birth cannot be before the year 1900." };
      }
    }

    // Prepare update data
    const data: Prisma.UserUpdateInput = {
      name: nameTrimmed,
      surname: surnameTrimmed,
      email: emailTrimmed,
      phone: validatedUpdates.phone?.trim() || null,
      birthDate: validatedUpdates.birthDate ? new Date(validatedUpdates.birthDate) : null,
      avatarUrl: validatedUpdates.avatarUrl?.trim() || null,
    };

    // Handle password update if requested
    if (validatedUpdates.newPassword || validatedUpdates.confirmPassword) {
      if (validatedUpdates.newPassword !== validatedUpdates.confirmPassword) {
        return { success: false, error: "New passwords do not match." };
      }
      if (!validatedUpdates.currentPassword) {
        return { success: false, error: "Current password is required to set a new password." };
      }
      if (!validatedUpdates.newPassword || validatedUpdates.newPassword.length < 6) {
        return { success: false, error: "New password must be at least 6 characters long." };
      }

      // Fetch user to verify current password
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        return { success: false, error: "User not found." };
      }

      const isValid = await verifyPassword(validatedUpdates.currentPassword, user.password);
      if (!isValid) {
        return { success: false, error: "Incorrect current password." };
      }

      data.password = await hashPassword(validatedUpdates.newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
    });

    // Re-generate token since email or name might have changed
    const newToken = await generateToken({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      avatarUrl: updatedUser.avatarUrl,
    });

    // Update session cookie
    cookieStore.set("auth_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    });

    revalidatePath("/admin/users");
    revalidatePath("/dashboard");
    return {
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        surname: updatedUser.surname,
        role: updatedUser.role,
        phone: updatedUser.phone,
        birthDate: updatedUser.birthDate,
        avatarUrl: updatedUser.avatarUrl,
      },
    };
  } catch (error) {
    console.error("updateProfile error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}

/**
 * READ: Fetch trainers (with count of assigned players and list of assigned player IDs)
 * and fetch all players, so the Admin page can manage trainer-player assignments.
 */
export async function getAssignmentsData() {
  try {
    await checkAdmin();

    const trainers = await prisma.user.findMany({
      where: { role: UserRole.TRAINER },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        avatarUrl: true,
        players: {
          select: {
            id: true,
          }
        }
      },
      orderBy: { name: "asc" },
    });

    const trainersWithCount = trainers.map((t) => ({
      id: t.id,
      name: t.name,
      surname: t.surname,
      email: t.email,
      avatarUrl: t.avatarUrl,
      playerCount: t.players.length,
      assignedPlayerIds: t.players.map((p) => p.id),
    }));

    const players = await prisma.user.findMany({
      where: { role: { in: [UserRole.PLAYER, UserRole.GOAL_KEEPER] } },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        avatarUrl: true,
        trainers: {
          select: {
            id: true,
            name: true,
            surname: true,
          }
        }
      },
      orderBy: { name: "asc" },
    });

    return { success: true, trainers: trainersWithCount, players };
  } catch (error) {
    console.error("getAssignmentsData error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load assignments data",
    };
  }
}

/**
 * UPDATE: Update a trainer's player assignments in a single query transaction
 */
export async function updateTrainerAssignments(
  trainerId: string,
  toAssign: string[],
  toUnassign: string[]
) {
  try {
    await checkAdmin();

    await updateTrainerPlayersRelationShared(trainerId, toAssign, toUnassign);

    revalidatePath("/admin/users");
    revalidatePath("/trainer/players");
    revalidatePath("/trainer/players/assign");
    revalidatePath("/trainer/players/my-players");
    revalidatePath("/trainer/video-analysis/feedback");
    revalidatePath("/trainer/video-analysis/matches");

    return { success: true };
  } catch (error) {
    console.error("updateTrainerAssignments error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update assignments",
    };
  }
}


